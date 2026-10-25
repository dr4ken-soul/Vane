import { ethers } from "hardhat";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Shape of the generated proof fixture consumed by the contract tests and this script.
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
 * Reads an address from the environment catalogue.
 *
 * @param name Environment variable name.
 * @returns The configured value, empty when unset.
 */
function envValue(name: string): string {
  return process.env[name] ?? "";
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
 * Seals one genuine UltraHonk CBAM attestation on Sepolia from the committed proof fixture.
 *
 * The fixture root is anchored against the live VaneMeterOracle first, exactly as the browser
 * prover requires, then the registry verifies the real 7616 byte proof and seals attestation id 2.
 */
async function main() {
  const oracleAddress = envValue("VANE_METER_ORACLE_ADDRESS");
  const registryAddress = envValue("VANE_ATTESTATION_REGISTRY_ADDRESS");
  if (!oracleAddress || !registryAddress) {
    throw new Error("Set VANE_METER_ORACLE_ADDRESS and VANE_ATTESTATION_REGISTRY_ADDRESS in contracts/.env");
  }

  const [deployer] = await ethers.getSigners();
  const oracle = await ethers.getContractAt("VaneMeterOracle", oracleAddress, deployer);
  const registry = await ethers.getContractAt("VaneAttestationRegistry", registryAddress, deployer);

  const fixture = JSON.parse(
    readFileSync(resolve(__dirname, "..", "test", "fixtures", "proofFixture.json"), "utf8"),
  ) as ProofFixture;

  const root = toBytes32(fixture.merkleRoot);
  const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));

  const latest = await ethers.provider.getBlock("latest");
  const windowEnd = BigInt(latest.timestamp - 3600);
  const windowStart = windowEnd - 3600n;

  console.log("Deployer: " + deployer.address);
  console.log("Anchoring fixture root " + root + " for the last hour window");

  const anchor = await oracle.submitHourlyRoot(root, meterId, windowStart, windowEnd, 310);
  await anchor.wait();
  console.log("Root anchored in transaction " + anchor.hash);

  const publicInputs = fixture.publicInputs.map((value) => toBytes32(value));
  const proof = fixture.proof as `0x${string}`;

  console.log("Submitting genuine UltraHonk proof to VaneAttestationRegistry");

  const attest = await registry.submitAttestation(proof, publicInputs, { value: 0 });
  const receipt = await attest.wait();
  console.log("Attestation submitted in transaction " + attest.hash);

  const total = await registry.totalVerifiedAttestations();
  console.log("Total verified attestations: " + total);
  const sealed = await registry.attestations(total);
  console.log("Latest attestation id: " + sealed[0]);
  console.log("Intensity ceiling: " + sealed[4] + " kg/t, CBAM commodity: CN " + sealed[5]);
  console.log("Gas used: " + (receipt ? receipt.gasUsed.toString() : "n/a"));
  console.log("Receipt URL: https://<WEB_APP>/verify/" + total);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
