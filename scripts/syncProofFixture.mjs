/**
 * Copies the freshly generated UltraHonk proof into the Hardhat test fixture.
 *
 * The proof is stored as a contiguous 0x prefixed hex string, which is the encoding the
 * Solidity verifier expects inside `bytes calldata`.
 *
 * Usage: node scripts/syncProofFixture.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const proofPath = resolve(repoRoot, "circuits", "cbam_attestation", "bbout", "proof", "proof");
const fixturePath = resolve(repoRoot, "contracts", "test", "fixtures", "proofFixture.json");

const proof = readFileSync(proofPath);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
fixture.proof = `0x${proof.toString("hex")}`;
writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

console.log(`Proof bytes: ${proof.length}`);
console.log(`Wrote ${fixturePath}`);
