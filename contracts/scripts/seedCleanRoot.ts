// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { buildAllocationTree, splitCleanAllocations } from "../../web/src/lib/noir/energyMerkle";
import { FIELD_MODULUS } from "../../web/src/lib/noir/poseidon2";

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
 * Shape of the subset of the Open-Meteo forecast response used by the seed run.
 */
interface OpenMeteoResponse {
  hourly?: {
    time?: string[];
    shortwave_radiation?: Array<number | null>;
    temperature_2m?: Array<number | null>;
  };
}

/**
 * Hashes a supplier tax identifier into a BN254 field element.
 *
 * @param taxId Raw supplier tax identifier.
 * @returns The field element bound into the allocation leaves.
 */
function hashTaxId(taxId: string): bigint {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(taxId))) % FIELD_MODULUS;
}

/**
 * Converts a bigint field element into a 32 byte hex string.
 *
 * @param value Field element.
 * @returns The zero padded hex representation.
 */
function toBytes32(value: bigint): string {
  return `0x${value.toString(16).padStart(64, "0")}`;
}

/**
 * Anchors one real Open-Meteo clean solar root for the Gebze facility.
 *
 * The clean energy total is modelled from the past 24 hours of satellite shortwave radiation
 * and ambient temperature using the same Ross/Faiman cell temperature correction as the web
 * PINN model. The allocation tree is the exact Poseidon2 tree consumed by the Noir circuit, so
 * the anchor shares its leaf layout with shipment attestations.
 */
async function main(): Promise<void> {
  const oracleAddress = requireEnv("VANE_METER_ORACLE_ADDRESS");
  const latitude = Number(process.env.SEED_LATITUDE ?? "40.80");
  const longitude = Number(process.env.SEED_LONGITUDE ?? "29.43");
  const ratedKw = Number(process.env.SEED_RATED_KW ?? "1200");
  const meterName = process.env.SEED_METER_NAME ?? "GEBZE-OSB-SOLAR-01";
  const supplierTaxId = process.env.SEED_SUPPLIER_TAX_ID ?? "TR-GEBZE-OSB-7788124";

  console.log(`Facility: ${meterName} (${latitude}, ${longitude}) at ${ratedKw} kWp`);
  console.log("Fetching live Open-Meteo satellite irradiance for the past 24 hours...");

  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: "shortwave_radiation,temperature_2m",
    past_days: "1",
    forecast_days: "1",
    timezone: "UTC",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with HTTP ${response.status}.`);
  }
  const payload = (await response.json()) as OpenMeteoResponse;
  const times = payload.hourly?.time ?? [];
  const radiation = payload.hourly?.shortwave_radiation ?? [];
  const temperatures = payload.hourly?.temperature_2m ?? [];

  if (times.length === 0) {
    throw new Error("Open-Meteo returned no hourly readings.");
  }

  let totalKwh = 0;
  let firstTimestamp = 0;
  let lastTimestamp = 0;
  let generatingHours = 0;

  for (let index = 0; index < times.length; index += 1) {
    const ghi = radiation[index];
    const ambient = temperatures[index];
    if (ghi === null || ghi === undefined || ambient === null || ambient === undefined) {
      continue;
    }
    // Ignore night and deep twilight hours that cannot generate measurable solar output.
    if (ghi <= 25) {
      continue;
    }

    const timestamp = Math.floor(Date.parse(`${times[index]}Z`) / 1000);
    const cellTemperature = ambient + (ghi / 800) * 25;
    const temperatureFactor = Math.max(0.7, 1 - 0.004 * (cellTemperature - 25));
    const hourlyKwh = ratedKw * (ghi / 1000) * 0.82 * temperatureFactor;

    totalKwh += hourlyKwh;
    generatingHours += 1;
    if (firstTimestamp === 0) {
      firstTimestamp = timestamp;
    }
    lastTimestamp = timestamp;
  }

  if (totalKwh < 1) {
    throw new Error("Open-Meteo did not return enough daylight irradiance to anchor a clean root.");
  }

  const roundedKwh = Math.round(totalKwh);
  console.log(`Generating hours: ${generatingHours}`);
  console.log(`Modelled clean energy: ${roundedKwh} kWh (${totalKwh.toFixed(2)} kWh raw)`);
  console.log(`Window: ${new Date(firstTimestamp * 1000).toISOString()} to ${new Date((lastTimestamp + 3600) * 1000).toISOString()}`);

  const supplierTaxIdHash = hashTaxId(supplierTaxId);
  const allocations = splitCleanAllocations(roundedKwh);
  const tree = buildAllocationTree(allocations, supplierTaxIdHash);
  const merkleRoot = toBytes32(tree.root);
  const meterId = ethers.keccak256(ethers.toUtf8Bytes(meterName));

  const oracle = await ethers.getContractAt("VaneMeterOracle", oracleAddress);
  if (await oracle.isRootClean(merkleRoot)) {
    console.log(`Root ${merkleRoot} is already anchored. Nothing to do.`);
    return;
  }

  console.log(`Meter ID: ${meterId}`);
  console.log(`Poseidon2 clean root: ${merkleRoot}`);
  console.log("Submitting hourly root to VaneMeterOracle...");

  // No meter counter-report exists for the seed window, so the anchor records the physics
  // baseline with zero residual. Later telemetry batches carry their measured residual.
  const transaction = await oracle.submitHourlyRoot(
    merkleRoot,
    meterId,
    firstTimestamp,
    lastTimestamp + 3600,
    0,
  );
  const receipt = await transaction.wait();
  console.log(`Anchored in transaction ${receipt?.hash ?? transaction.hash}`);
  console.log(`Clean roots on chain: ${await oracle.getRecentRootsCount()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
