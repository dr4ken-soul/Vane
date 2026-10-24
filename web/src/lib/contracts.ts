import type { Address } from "viem";

/**
 * Sepolia chain identifier used across the application.
 */
export const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Public Sepolia JSON-RPC endpoint used for reads.
 */
export const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Application base URL used when generating shareable customs receipt links.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Returns a configured contract address, or null when the deployment has not been configured.
 *
 * @param value Raw environment value.
 * @returns A checksummed address or null.
 */
function readAddress(value: string | undefined): Address | null {
  if (!value || value.trim().length === 0) return null;
  const trimmed = value.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return null;
  return trimmed as Address;
}

/**
 * Deployed VaneMeterOracle address, or null when the deployment is not configured.
 */
export const VANE_METER_ORACLE_ADDRESS = readAddress(
  process.env.NEXT_PUBLIC_VANE_METER_ORACLE_ADDRESS,
);

/**
 * Deployed VaneAttestationRegistry address, or null when the deployment is not configured.
 */
export const VANE_ATTESTATION_REGISTRY_ADDRESS = readAddress(
  process.env.NEXT_PUBLIC_VANE_ATTESTATION_REGISTRY_ADDRESS,
);

/**
 * Deployed HonkVerifier address, or null when the deployment is not configured.
 */
export const HONK_VERIFIER_ADDRESS = readAddress(
  process.env.NEXT_PUBLIC_HONK_VERIFIER_ADDRESS,
);

/**
 * True when every Vane contract address is configured for live reads.
 */
export const CONTRACTS_CONFIGURED =
  VANE_METER_ORACLE_ADDRESS !== null && VANE_ATTESTATION_REGISTRY_ADDRESS !== null;

/**
 * Minimal ABI for the VaneMeterOracle contract.
 */
export const VANE_METER_ORACLE_ABI = [
  {
    type: "function",
    name: "totalCleanRoots",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalQuarantinedIntervals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getRecentRootsCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "isRootClean",
    stateMutability: "view",
    inputs: [{ name: "merkleRoot", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "recentRoots",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "batchesByRoot",
    stateMutability: "view",
    inputs: [{ name: "merkleRoot", type: "bytes32" }],
    outputs: [
      { name: "merkleRoot", type: "bytes32" },
      { name: "meterId", type: "bytes32" },
      { name: "windowStart", type: "uint64" },
      { name: "windowEnd", type: "uint64" },
      { name: "residualSigmaBps", type: "uint32" },
      { name: "quarantined", type: "bool" },
      { name: "reporter", type: "address" },
    ],
  },
  {
    type: "function",
    name: "submitHourlyRoot",
    stateMutability: "nonpayable",
    inputs: [
      { name: "merkleRoot", type: "bytes32" },
      { name: "meterId", type: "bytes32" },
      { name: "windowStart", type: "uint64" },
      { name: "windowEnd", type: "uint64" },
      { name: "residualSigmaBps", type: "uint32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "reportAndQuarantine",
    stateMutability: "nonpayable",
    inputs: [
      { name: "meterId", type: "bytes32" },
      { name: "suspectRoot", type: "bytes32" },
      { name: "residualSigmaBps", type: "uint32" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "HourlyRootAnchored",
    inputs: [
      { name: "merkleRoot", type: "bytes32", indexed: true },
      { name: "meterId", type: "bytes32", indexed: true },
      { name: "residualSigmaBps", type: "uint32", indexed: false },
      { name: "windowEnd", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MeterIntervalQuarantined",
    inputs: [
      { name: "meterId", type: "bytes32", indexed: true },
      { name: "suspectRoot", type: "bytes32", indexed: true },
      { name: "residualSigmaBps", type: "uint32", indexed: false },
      { name: "reporter", type: "address", indexed: true },
    ],
  },
] as const;

/**
 * Minimal ABI for the VaneAttestationRegistry contract.
 */
export const VANE_ATTESTATION_REGISTRY_ABI = [
  {
    type: "function",
    name: "totalVerifiedAttestations",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "attestations",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "exporter", type: "address" },
      { name: "facilityMerkleRoot", type: "bytes32" },
      { name: "invoiceNullifier", type: "bytes32" },
      { name: "maxIntensityKgPerTonne", type: "uint64" },
      { name: "cnCommodityCode", type: "uint64" },
      { name: "timestamp", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "getAttestationsByExporter",
    stateMutability: "view",
    inputs: [{ name: "exporter", type: "address" }],
    outputs: [
      {
        name: "list",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "exporter", type: "address" },
          { name: "facilityMerkleRoot", type: "bytes32" },
          { name: "invoiceNullifier", type: "bytes32" },
          { name: "maxIntensityKgPerTonne", type: "uint64" },
          { name: "cnCommodityCode", type: "uint64" },
          { name: "timestamp", type: "uint64" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "usedNullifiers",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "protocolFeeWei",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitAttestation",
    stateMutability: "payable",
    inputs: [
      { name: "proof", type: "bytes" },
      { name: "publicInputs", type: "bytes32[]" },
    ],
    outputs: [{ name: "attestationId", type: "uint256" }],
  },
  {
    type: "event",
    name: "AttestationSealed",
    inputs: [
      { name: "attestationId", type: "uint256", indexed: true },
      { name: "exporter", type: "address", indexed: true },
      { name: "invoiceNullifier", type: "bytes32", indexed: true },
      { name: "facilityMerkleRoot", type: "bytes32", indexed: false },
      { name: "maxIntensityKgPerTonne", type: "uint64", indexed: false },
      { name: "cnCommodityCode", type: "uint64", indexed: false },
    ],
  },
] as const;

/**
 * Minimal ABI for the generated HonkVerifier contract.
 */
export const HONK_VERIFIER_ABI = [
  {
    type: "function",
    name: "verify",
    stateMutability: "view",
    inputs: [
      { name: "_proof", type: "bytes" },
      { name: "_publicInputs", type: "bytes32[]" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * Commodity codes shown on the customs receipt.
 */
export const COMMODITY_LABELS: Record<number, string> = {
  7208: "Flat rolled products of iron or non alloy steel",
  7601: "Unwrought aluminium and aluminium alloys",
  2523: "Portland cement, aluminous cement, slag cement",
  2524: "Asbestos cement goods",
  2804: "Hydrogen",
  2710: "Electricity",
};
