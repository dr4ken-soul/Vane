import {
  POSEIDON2_FIELD_MODULUS,
  POSEIDON2_FULL_ROUNDS,
  POSEIDON2_INTERNAL_MATRIX_DIAGONAL,
  POSEIDON2_PARTIAL_ROUNDS,
  POSEIDON2_RATE,
  POSEIDON2_ROUND_CONSTANTS,
  POSEIDON2_STATE_WIDTH,
} from "./poseidon2Constants";

/**
 * BN254 scalar field modulus used by Noir's `Field` type.
 */
export const FIELD_MODULUS = BigInt(POSEIDON2_FIELD_MODULUS);

/**
 * Rate of the Poseidon2 sponge, matching Noir's `std::hash::poseidon2` RATE constant.
 */
const RATE = POSEIDON2_RATE;

/**
 * Two raised to the power of 64, used for the sponge initialisation vector.
 */
const TWO_POW_64 = 18446744073709551616n;

/**
 * Internal matrix diagonal for the BN254 Poseidon2 permutation.
 */
const INTERNAL_MATRIX_DIAGONAL = POSEIDON2_INTERNAL_MATRIX_DIAGONAL.map((value) =>
  BigInt(value),
);

/**
 * Round constants for the BN254 Poseidon2 permutation (64 rounds, 4 state elements each).
 */
const ROUND_CONSTANTS = POSEIDON2_ROUND_CONSTANTS.map((round) => round.map((value) => BigInt(value)));

/**
 * Reduces a bigint into the BN254 scalar field.
 *
 * @param value Raw bigint value.
 * @returns The value reduced modulo the field modulus.
 */
export function mod(value: bigint): bigint {
  const reduced = value % FIELD_MODULUS;
  return reduced >= 0n ? reduced : reduced + FIELD_MODULUS;
}

/**
 * Multiplies two field elements.
 *
 * @param a Left operand.
 * @param b Right operand.
 * @returns The product reduced into the field.
 */
export function mul(a: bigint, b: bigint): bigint {
  return mod(a * b);
}

/**
 * Adds two field elements.
 *
 * @param a Left operand.
 * @param b Right operand.
 * @returns The sum reduced into the field.
 */
export function add(a: bigint, b: bigint): bigint {
  return mod(a + b);
}

/**
 * Raises a field element to the fifth power (the Poseidon2 S-box).
 *
 * @param value Field element.
 * @returns The fifth power of the element.
 */
function sBox(value: bigint): bigint {
  const squared = mul(value, value);
  return mul(mul(squared, squared), value);
}

/**
 * Applies the external MDS linear layer to a four element state.
 *
 * @param state Mutable four element state.
 */
function externalMatrix(state: bigint[]): void {
  const t0 = add(state[0], state[1]);
  const t1 = add(state[2], state[3]);
  const t2 = add(add(state[1], state[1]), t1);
  const t3 = add(add(state[3], state[3]), t0);
  let t4 = add(t1, t1);
  t4 = add(add(t4, t4), t3);
  let t5 = add(t0, t0);
  t5 = add(add(t5, t5), t2);
  const t6 = add(t3, t5);
  const t7 = add(t2, t4);
  state[0] = t6;
  state[1] = t5;
  state[2] = t7;
  state[3] = t4;
}

/**
 * Applies the internal diagonal linear layer to a four element state.
 *
 * @param state Mutable four element state.
 */
function internalMatrix(state: bigint[]): void {
  let sum = 0n;
  for (const element of state) {
    sum = add(sum, element);
  }
  for (let index = 0; index < state.length; index += 1) {
    state[index] = add(mul(state[index], INTERNAL_MATRIX_DIAGONAL[index]), sum);
  }
}

/**
 * Runs the BN254 Poseidon2 permutation over four field elements.
 *
 * @param inputs Four field elements.
 * @returns The permuted state.
 */
export function poseidon2Permutation(inputs: bigint[]): bigint[] {
  if (inputs.length !== POSEIDON2_STATE_WIDTH) {
    throw new Error(`Poseidon2 expects ${POSEIDON2_STATE_WIDTH} inputs, received ${inputs.length}.`);
  }

  const state = inputs.map((value) => mod(value));
  externalMatrix(state);

  const halfFullRounds = Math.floor(POSEIDON2_FULL_ROUNDS / 2);
  for (let round = 0; round < halfFullRounds; round += 1) {
    for (let index = 0; index < 4; index += 1) {
      state[index] = add(state[index], ROUND_CONSTANTS[round][index]);
    }
    for (let index = 0; index < 4; index += 1) {
      state[index] = sBox(state[index]);
    }
    externalMatrix(state);
  }

  const partialEnd = halfFullRounds + POSEIDON2_PARTIAL_ROUNDS;
  for (let round = halfFullRounds; round < partialEnd; round += 1) {
    state[0] = add(state[0], ROUND_CONSTANTS[round][0]);
    state[0] = sBox(state[0]);
    internalMatrix(state);
  }

  const totalRounds = POSEIDON2_FULL_ROUNDS + POSEIDON2_PARTIAL_ROUNDS;
  for (let round = partialEnd; round < totalRounds; round += 1) {
    for (let index = 0; index < 4; index += 1) {
      state[index] = add(state[index], ROUND_CONSTANTS[round][index]);
    }
    for (let index = 0; index < 4; index += 1) {
      state[index] = sBox(state[index]);
    }
    externalMatrix(state);
  }

  return state;
}

/**
 * Hashes a list of field elements with the Poseidon2 sponge.
 *
 * The sponge absorbs full rate sized blocks, then the remaining tail, and finishes with a final
 * permutation. This matches the Poseidon2 domain separation of the Noir standard library.
 *
 * @param inputs Field elements to hash.
 * @returns The resulting field element.
 */
export function poseidon2Hash(inputs: bigint[]): bigint {
  const length = inputs.length;
  const iv = mod(BigInt(length) * TWO_POW_64);
  const state = [0n, 0n, 0n, 0n];
  state[RATE] = iv;

  const blocks = Math.floor(length / RATE);
  for (let block = 0; block < blocks; block += 1) {
    for (let offset = 0; offset < RATE; offset += 1) {
      state[offset] = add(state[offset], mod(inputs[block * RATE + offset]));
    }
    const permuted = poseidon2Permutation(state);
    for (let index = 0; index < 4; index += 1) {
      state[index] = permuted[index];
    }
  }

  const absorbed = blocks * RATE;
  for (let offset = 0; offset < length % RATE; offset += 1) {
    state[offset] = add(state[offset], mod(inputs[absorbed + offset]));
  }

  const finalState = poseidon2Permutation(state);
  return finalState[0];
}

/**
 * Hashes two field elements.
 *
 * @param a First field element.
 * @param b Second field element.
 * @returns The resulting field element.
 */
export function poseidon2Hash2(a: bigint, b: bigint): bigint {
  return poseidon2Hash([a, b]);
}

/**
 * Hashes three field elements.
 *
 * @param a First field element.
 * @param b Second field element.
 * @param c Third field element.
 * @returns The resulting field element.
 */
export function poseidon2Hash3(a: bigint, b: bigint, c: bigint): bigint {
  return poseidon2Hash([a, b, c]);
}

/**
 * Converts a field element into a 32 byte big endian hex string.
 *
 * @param value Field element.
 * @returns A 64 character hex string without the 0x prefix.
 */
export function toHex32(value: bigint): string {
  return mod(value).toString(16).padStart(64, "0");
}

/**
 * Converts a 32 byte hex string into a field element.
 *
 * @param hex Hex string with or without the 0x prefix.
 * @returns The parsed field element.
 */
export function fromHex32(hex: string): bigint {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  return mod(BigInt(`0x${cleaned}`));
}
