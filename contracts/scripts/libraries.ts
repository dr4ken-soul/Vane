import { ethers } from "hardhat";
import type { HonkVerifier } from "../typechain-types";

/**
 * Deploys the generated UltraHonk verifier together with its linked relation and transcript libraries.
 *
 * The bb 6.0.0 Solidity generator emits `RelationsLib` and `ZKTranscriptLib` as external libraries,
 * so the verifier bytecode carries library placeholders. Deploying both libraries first keeps every
 * environment (Hardhat tests, Sepolia, Etherscan verification) on the same deterministic link path.
 *
 * @returns The deployed verifier with every library address used to link it.
 */
export async function deployHonkVerifier(): Promise<{
  verifier: HonkVerifier;
  libraries: Record<string, string>;
}> {
  const RelationsLib = await ethers.getContractFactory("RelationsLib");
  const relationsLib = await RelationsLib.deploy();
  await relationsLib.waitForDeployment();
  const relationsLibAddress = await relationsLib.getAddress();

  const ZKTranscriptLib = await ethers.getContractFactory("ZKTranscriptLib");
  const transcriptLib = await ZKTranscriptLib.deploy();
  await transcriptLib.waitForDeployment();
  const transcriptLibAddress = await transcriptLib.getAddress();

  const libraries = {
    RelationsLib: relationsLibAddress,
    ZKTranscriptLib: transcriptLibAddress,
  };

  const HonkVerifier = await ethers.getContractFactory("HonkVerifier", { libraries });
  const verifier = await HonkVerifier.deploy();
  await verifier.waitForDeployment();

  return { verifier, libraries };
}
