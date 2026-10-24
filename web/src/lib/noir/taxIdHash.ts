import { keccak256, toBytes } from "viem";
import { FIELD_MODULUS } from "./poseidon2";

/**
 * Hashes a supplier tax identifier into a BN254 field element.
 *
 * The hash stays inside browser memory. Only the resulting public leaf commitment and nullifier
 * ever reach the network.
 *
 * @param taxId Raw supplier tax identifier.
 * @returns The field element bound into the allocation leaves and the invoice nullifier.
 */
export function hashTaxId(taxId: string): bigint {
  const digest = keccak256(toBytes(taxId.trim()));
  return BigInt(digest) % FIELD_MODULUS;
}

/**
 * Hashes an invoice serial into a BN254 field element.
 *
 * @param invoiceSerial Raw invoice serial value.
 * @returns The field element used as the private invoice serial secret.
 */
export function hashInvoiceSerial(invoiceSerial: string): bigint {
  const digest = keccak256(toBytes(invoiceSerial.trim()));
  return BigInt(digest) % FIELD_MODULUS;
}

/**
 * Hashes a facility meter identifier into the 32 byte value expected by the oracle contract.
 *
 * @param meterId Facility smart meter identifier.
 * @returns The hashed meter identifier as a 32 byte hex string.
 */
export function hashMeterId(meterId: string): `0x${string}` {
  const digest = keccak256(toBytes(meterId.trim()));
  return `0x${digest.slice(2).padStart(64, "0")}` as `0x${string}`;
}
