import { ethers } from "hardhat";

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
 * Reports one genuine on-chain meter interval quarantine on Sepolia.
 *
 * The spoofed packet is a distinct suspect root so the clean fixture root used by the
 * attestation script stays valid. It emits MeterIntervalQuarantined on Sepolia with a
 * residual of 0.482 sigma, matching the hero instrument demo.
 */
async function main() {
  const oracleAddress = envValue("VANE_METER_ORACLE_ADDRESS");
  if (!oracleAddress) {
    throw new Error("Set VANE_METER_ORACLE_ADDRESS in contracts/.env");
  }

  const [deployer] = await ethers.getSigners();
  const oracle = await ethers.getContractAt("VaneMeterOracle", oracleAddress, deployer);

  const meterId = ethers.keccak256(ethers.toUtf8Bytes("GEBZE-M04-ROOFTOP-PV"));
  const suspectRoot = ethers.keccak256(ethers.toUtf8Bytes("vanse-demo-spoof-1.4x"));

  console.log("Deployer: " + deployer.address);
  console.log("Reporting spoofed interval with residual 4820 bps");

  const tx = await oracle.reportAndQuarantine(meterId, suspectRoot, 4820);
  await tx.wait();
  console.log("Quarantined in transaction " + tx.hash);

  const total = await oracle.totalQuarantinedIntervals();
  const clean = await oracle.totalCleanRoots();
  console.log("Total quarantined intervals: " + total);
  console.log("Total clean roots: " + clean);
  console.log("Suspect root marked unclean: " + suspectRoot);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
