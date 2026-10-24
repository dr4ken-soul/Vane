import { ethers } from "hardhat";
import { deployHonkVerifier } from "./libraries";

/**
 * Reads a mandatory environment variable, failing fast with a clear message.
 *
 * @param name Environment variable name.
 * @returns The trimmed variable value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value.trim();
}

/**
 * Deploys the three Vane contracts to the configured network.
 *
 * Order of deployment is HonkVerifier, then VaneMeterOracle, then VaneAttestationRegistry.
 * Every address is injected through constructor arguments so no deployment address is
 * hardcoded inside the Solidity sources.
 */
async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const treasuryWallet = requireEnv("TREASURY_WALLET_ADDRESS");
  const protocolFeeWei = BigInt(process.env.PROTOCOL_FEE_WEI ?? "0");

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log(`Treasury wallet: ${treasuryWallet}`);
  console.log(`Protocol fee: ${protocolFeeWei} wei`);

  const { verifier: honkVerifier, libraries } = await deployHonkVerifier();
  const honkVerifierAddress = await honkVerifier.getAddress();
  console.log(`RelationsLib deployed at ${libraries.RelationsLib}`);
  console.log(`ZKTranscriptLib deployed at ${libraries.ZKTranscriptLib}`);
  console.log(`HonkVerifier deployed at ${honkVerifierAddress}`);

  const VaneMeterOracle = await ethers.getContractFactory("VaneMeterOracle");
  const meterOracle = await VaneMeterOracle.deploy(deployer.address);
  await meterOracle.waitForDeployment();
  const meterOracleAddress = await meterOracle.getAddress();
  console.log(`VaneMeterOracle deployed at ${meterOracleAddress}`);

  const VaneAttestationRegistry = await ethers.getContractFactory("VaneAttestationRegistry");
  const registry = await VaneAttestationRegistry.deploy(
    honkVerifierAddress,
    meterOracleAddress,
    treasuryWallet,
    protocolFeeWei,
  );
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`VaneAttestationRegistry deployed at ${registryAddress}`);

  console.log("");
  console.log("Add the following values to web/.env.local:");
  console.log(`NEXT_PUBLIC_HONK_VERIFIER_ADDRESS=${honkVerifierAddress}`);
  console.log(`NEXT_PUBLIC_VANE_METER_ORACLE_ADDRESS=${meterOracleAddress}`);
  console.log(`NEXT_PUBLIC_VANE_ATTESTATION_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("");
  console.log("Verify the linked verifier on Etherscan with:");
  console.log(
    `npx hardhat verify --network sepolia --libraries contracts/HonkVerifier.sol:RelationsLib=${libraries.RelationsLib} --libraries contracts/HonkVerifier.sol:ZKTranscriptLib=${libraries.ZKTranscriptLib} ${honkVerifierAddress}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
