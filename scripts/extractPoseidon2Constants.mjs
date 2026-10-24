/**
 * Extracts the Poseidon2 BN254 constants from the reference Rust implementation and
 * emits a TypeScript constant module for the client implementation.
 *
 * Usage: node scripts/extractPoseidon2Constants.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, "poseidon2_reference.rs"), "utf8");

/**
 * Collects every `field_from_hex("...")` call in source order.
 *
 * @param {string} text Rust source text.
 * @returns {string[]} Lowercase hex field elements without the 0x prefix.
 */
function collectHexLiterals(text) {
  const matches = text.matchAll(/field_from_hex\("([0-9a-fA-F]+)"\)/g);
  return Array.from(matches, (match) => match[1].toLowerCase());
}

const literals = collectHexLiterals(source);

// Layout of the reference file: 4 internal matrix diagonal entries, then 64 rounds x 4 entries.
const internalMatrixDiagonal = literals.slice(0, 4);
const roundConstants = [];
for (let round = 0; round < 64; round += 1) {
  roundConstants.push(literals.slice(4 + round * 4, 4 + (round + 1) * 4));
}

if (internalMatrixDiagonal.length !== 4 || roundConstants.length !== 64) {
  throw new Error("Unexpected Poseidon2 constant layout in the reference file.");
}

const lines = [];
lines.push("/**");
lines.push(" * BN254 Poseidon2 constants used by Noir's `std::hash::poseidon2`.");
lines.push(" *");
lines.push(" * The values are mathematical constants of the Poseidon2 permutation over the BN254");
lines.push(" * scalar field, matching the reference implementation used by the Noir compiler.");
lines.push(" */");
lines.push("export const POSEIDON2_FIELD_MODULUS =");
lines.push('  "21888242871839275222246405745257275088548364400416034343698204186575808495617";');
lines.push("");
lines.push("/** Number of state elements in the Poseidon2 permutation. */");
lines.push("export const POSEIDON2_STATE_WIDTH = 4;");
lines.push("");
lines.push("/** Number of full (external) rounds in the Poseidon2 permutation. */");
lines.push("export const POSEIDON2_FULL_ROUNDS = 8;");
lines.push("");
lines.push("/** Number of partial (internal) rounds in the Poseidon2 permutation. */");
lines.push("export const POSEIDON2_PARTIAL_ROUNDS = 56;");
lines.push("");
lines.push("/** Sponge rate, matching Noir's `std::hash::poseidon2` RATE constant. */");
lines.push("export const POSEIDON2_RATE = 3;");
lines.push("");
lines.push("/** Internal matrix diagonal of the Poseidon2 permutation. */");
lines.push("export const POSEIDON2_INTERNAL_MATRIX_DIAGONAL = [");
for (const value of internalMatrixDiagonal) {
  lines.push(`  "0x${value}",`);
}
lines.push("] as const;");
lines.push("");
lines.push("/** Round constants of the Poseidon2 permutation, 64 rounds of 4 state elements. */");
lines.push("export const POSEIDON2_ROUND_CONSTANTS: readonly (readonly string[])[] = [");
for (const round of roundConstants) {
  lines.push("  [");
  for (const value of round) {
    lines.push(`    "0x${value}",`);
  }
  lines.push("  ],");
}
lines.push("];");

const outputPath = resolve(
  here,
  "..",
  "web",
  "src",
  "lib",
  "noir",
  "poseidon2Constants.ts",
);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
