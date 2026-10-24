import { expect } from "chai";
import { ethers } from "hardhat";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deployHonkVerifier } from "../scripts/libraries";

/**
 * Shape of the generated proof fixture consumed by the contract tests.
 */
interface ProofFixture {
  /** Merkle root of the facility allocation tree. */
  merkleRoot: string;
  /** Poseidon2 invoice nullifier. */
  invoiceNullifier: string;
  /** Public circuit inputs in the order expected by the registry. */
  publicInputs: string[];
  /** Hex encoded UltraHonk proof. */
  proof: string;
}

/**
 * Loads the generated proof fixture.
 *
 * @returns The fixture values.
 */
function loadFixture(): ProofFixture {
  const path = resolve(__dirname, "fixtures", "proofFixture.json");
  return JSON.parse(readFileSync(path, "utf8")) as ProofFixture;
}

/**
 * Normalises a hex string into a bytes32 value.
 *
 * @param value Hex string with or without the 0x prefix.
 * @returns The bytes32 compatible hex string.
 */
function toBytes32(value: string): `0x${string}` {
  const cleaned = value.startsWith("0x") ? value.slice(2) : value;
  return `0x${cleaned.padStart(64, "0")}` as `0x${string}`;
}

/**
 * Deploys the three Vane contracts onto the Hardhat network.
 *
 * @returns The deployed contract handles.
 */
async function deployVane() {
  const [deployer, treasury, exporter] = await ethers.getSigners();

  const { verifier: honkVerifier } = await deployHonkVerifier();

  const VaneMeterOracle = await ethers.getContractFactory("VaneMeterOracle");
  const meterOracle = await VaneMeterOracle.deploy(deployer.address);
  await meterOracle.waitForDeployment();

  const VaneAttestationRegistry = await ethers.getContractFactory("VaneAttestationRegistry");
  const registry = await VaneAttestationRegistry.deploy(
    await honkVerifier.getAddress(),
    await meterOracle.getAddress(),
    treasury.address,
    0,
  );
  await registry.waitForDeployment();

  return { honkVerifier, meterOracle, registry, deployer, treasury, exporter };
}

describe("Vane protocol contracts", () => {
  it("anchors a clean hourly root and rejects a residual above the clean ceiling", async () => {
    const { meterOracle } = await deployVane();
    const root = ethers.keccak256(ethers.toUtf8Bytes("clean-root"));
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));

    await expect(
      meterOracle.submitHourlyRoot(root, meterId, 1758000000, 1758003600, 1200),
    ).to.emit(meterOracle, "HourlyRootAnchored");

    expect(await meterOracle.totalCleanRoots()).to.equal(1n);
    expect(await meterOracle.isRootClean(root)).to.equal(true);

    const dirtyRoot = ethers.keccak256(ethers.toUtf8Bytes("dirty-root"));
    await expect(
      meterOracle.submitHourlyRoot(dirtyRoot, meterId, 1758000000, 1758003600, 1201),
    ).to.be.revertedWithCustomError(meterOracle, "ResidualExceedsCleanCeiling");
  });

  it("quarantines a spoofed interval and marks the root as unclean", async () => {
    const { meterOracle } = await deployVane();
    const suspectRoot = ethers.keccak256(ethers.toUtf8Bytes("suspect-root"));
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));

    await expect(
      meterOracle.reportAndQuarantine(meterId, suspectRoot, 4820),
    ).to.emit(meterOracle, "MeterIntervalQuarantined");

    expect(await meterOracle.totalQuarantinedIntervals()).to.equal(1n);
    expect(await meterOracle.isRootClean(suspectRoot)).to.equal(false);
    expect(await meterOracle.meterQuarantineCount(meterId)).to.equal(1n);
  });

  it("verifies a browser generated UltraHonk proof and seals the attestation", async () => {
    const { meterOracle, registry, exporter } = await deployVane();
    const fixture = loadFixture();

    const root = toBytes32(fixture.merkleRoot);
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));
    await meterOracle.submitHourlyRoot(root, meterId, 1758000000, 1758003600, 310);

    const publicInputs = fixture.publicInputs.map((value) => toBytes32(value));
    const proof = fixture.proof as `0x${string}`;

    await expect(registry.connect(exporter).submitAttestation(proof, publicInputs)).to.emit(
      registry,
      "AttestationSealed",
    );

    expect(await registry.totalVerifiedAttestations()).to.equal(1n);

    const attestation = await registry.attestations(1n);
    expect(attestation.exporter).to.equal(exporter.address);
    expect(attestation.cnCommodityCode).to.equal(7208n);
    expect(attestation.maxIntensityKgPerTonne).to.equal(1450n);
    expect(attestation.facilityMerkleRoot).to.equal(toBytes32(root));
    expect(attestation.invoiceNullifier).to.equal(toBytes32(fixture.invoiceNullifier));
  });

  it("rejects a replayed proof with NullifierAlreadyUsed", async () => {
    const { meterOracle, registry, exporter } = await deployVane();
    const fixture = loadFixture();

    const root = toBytes32(fixture.merkleRoot);
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));
    await meterOracle.submitHourlyRoot(root, meterId, 1758000000, 1758003600, 310);

    const publicInputs = fixture.publicInputs.map((value) => toBytes32(value));
    const proof = fixture.proof as `0x${string}`;

    await registry.connect(exporter).submitAttestation(proof, publicInputs);

    await expect(
      registry.connect(exporter).submitAttestation(proof, publicInputs),
    ).to.be.revertedWithCustomError(registry, "NullifierAlreadyUsed");

    expect(await registry.usedNullifiers(toBytes32(fixture.invoiceNullifier))).to.equal(true);
    expect(await registry.totalVerifiedAttestations()).to.equal(1n);
  });

  it("rejects a valid proof against a quarantined facility root", async () => {
    const { meterOracle, registry, exporter } = await deployVane();
    const fixture = loadFixture();

    const root = toBytes32(fixture.merkleRoot);
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));
    await meterOracle.reportAndQuarantine(meterId, root, 4820);

    const publicInputs = fixture.publicInputs.map((value) => toBytes32(value));
    const proof = fixture.proof as `0x${string}`;

    await expect(
      registry.connect(exporter).submitAttestation(proof, publicInputs),
    ).to.be.revertedWithCustomError(registry, "FacilityRootQuarantinedOrUnknown");

    expect(await registry.totalVerifiedAttestations()).to.equal(0n);
  });

  it("rejects a tampered proof with InvalidZeroKnowledgeProof", async () => {
    const { meterOracle, registry, exporter } = await deployVane();
    const fixture = loadFixture();

    const root = toBytes32(fixture.merkleRoot);
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));
    await meterOracle.submitHourlyRoot(root, meterId, 1758000000, 1758003600, 310);

    const publicInputs = fixture.publicInputs.map((value) => toBytes32(value));
    const tampered = `${fixture.proof.slice(0, -2)}${fixture.proof.endsWith("00") ? "01" : "00"}` as `0x${string}`;

    await expect(
      registry.connect(exporter).submitAttestation(tampered, publicInputs),
    ).to.be.revertedWithCustomError(registry, "InvalidZeroKnowledgeProof");
  });

  it("routes the protocol fee to the treasury wallet atomically", async () => {
    const [deployer, treasury, exporter] = await ethers.getSigners();

    const { verifier: honkVerifier } = await deployHonkVerifier();

    const VaneMeterOracle = await ethers.getContractFactory("VaneMeterOracle");
    const meterOracle = await VaneMeterOracle.deploy(deployer.address);
    await meterOracle.waitForDeployment();

    const VaneAttestationRegistry = await ethers.getContractFactory("VaneAttestationRegistry");
    const registry = await VaneAttestationRegistry.deploy(
      await honkVerifier.getAddress(),
      await meterOracle.getAddress(),
      treasury.address,
      ethers.parseUnits("0.0005", "ether"),
    );
    await registry.waitForDeployment();

    const fixture = loadFixture();
    const root = toBytes32(fixture.merkleRoot);
    const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));
    await meterOracle.submitHourlyRoot(root, meterId, 1758000000, 1758003600, 310);

    const publicInputs = fixture.publicInputs.map((value) => toBytes32(value));
    const proof = fixture.proof as `0x${string}`;

    const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

    await expect(
      registry.connect(exporter).submitAttestation(proof, publicInputs, {
        value: ethers.parseUnits("0.0005", "ether"),
      }),
    ).to.emit(registry, "AttestationSealed");

    expect(await ethers.provider.getBalance(treasury.address)).to.equal(
      treasuryBalanceBefore + ethers.parseUnits("0.0005", "ether"),
    );
  });
});
