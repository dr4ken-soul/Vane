/**
 * Verifies the TypeScript Poseidon2 implementation against the Noir standard library vectors.
 *
 * The permutation vector comes from the Noir BN254 black box solver and the hash vector comes
 * from the Noir standard library Poseidon2 hasher test.
 */
import { poseidon2Hash, poseidon2Permutation, toHex32 } from "../web/src/lib/noir/poseidon2";

const expectedPermutation = [
  "18dfb8dc9b82229cff974efefc8df78b1ce96d9d844236b496785c698bc6732e",
  "095c230d1d37a246e8d2d5a63b165fe0fade040d442f61e25f0590e5fb76f839",
  "0bb9545846e1afa4fa3c97414a60a20fc4949f537a68cceca34c5ce71e28aa59",
  "18a4f34c9c6f99335ff7638b82aeed9018026618358873c982bbdde265b2ed6d",
];

const permutation = poseidon2Permutation([0n, 0n, 0n, 0n]).map((value) => toHex32(value));
permutation.forEach((value, index) => {
  if (value !== expectedPermutation[index]) {
    throw new Error(`Permutation mismatch at index ${index}: ${value}`);
  }
});

const expectedHash = "2247be7014a54d17342a7ef677f58d28877780d203860396967f5d0a18d259db";
const hash = toHex32(poseidon2Hash([1n, 2n, 3n, 4n, 5n]));
if (hash !== expectedHash) {
  throw new Error(`Hash mismatch: ${hash}`);
}

console.log("Poseidon2 permutation vector OK");
console.log("Poseidon2 sponge hash vector OK");
