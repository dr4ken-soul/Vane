import { poseidon2Hash2, poseidon2Hash3 } from "./poseidon2";

/**
 * Number of leaves in a facility allocation tree, matching the four level Merkle path in the
 * Noir circuit.
 */
export const ALLOCATION_LEAF_COUNT = 16;

/**
 * Depth of the allocation Merkle tree.
 */
export const ALLOCATION_TREE_DEPTH = 4;

/**
 * One allocation slot inside a clean energy batch.
 */
export interface AllocationSlot {
  /** Index of the slot inside the batch. */
  index: number;
  /** Allocated clean kilowatt hours for the slot. */
  kwh: number;
  /** Deterministic leaf salt derived from the slot index. */
  salt: bigint;
}

/**
 * A single leaf with its Merkle path towards the root.
 */
export interface AllocationLeaf extends AllocationSlot {
  /** Sibling elements from leaf level to root level. */
  path: bigint[];
  /** Branch indices from leaf level to root level. */
  indices: number[];
  /** Hash of the leaf. */
  leafHash: bigint;
}

/**
 * A complete allocation tree with its root.
 */
export interface AllocationTree {
  /** Merkle root of the tree. */
  root: bigint;
  /** Every leaf with its Merkle path. */
  leaves: AllocationLeaf[];
  /** Supplier tax identifier hash bound into every leaf. */
  supplierTaxIdHash: bigint;
}

/**
 * Derives the deterministic leaf salt for a slot index.
 *
 * @param index Slot index.
 * @returns The salt value.
 */
export function leafSalt(index: number): bigint {
  return BigInt(index + 1);
}

/**
 * Hashes one allocation leaf exactly as the Noir circuit does.
 *
 * @param kwh Allocated clean kilowatt hours.
 * @param supplierTaxIdHash Hash of the supplier tax identifier.
 * @param salt Deterministic leaf salt.
 * @returns The leaf hash.
 */
export function hashAllocationLeaf(
  kwh: number,
  supplierTaxIdHash: bigint,
  salt: bigint,
): bigint {
  return poseidon2Hash3(BigInt(Math.round(kwh)), supplierTaxIdHash, salt);
}

/**
 * Splits a total clean energy quantity into deterministic allocation slots.
 *
 * The remainder is always placed in the final slot so the sum of the slots equals the input.
 *
 * @param totalKwh Total clean kilowatt hours for the window.
 * @param count Number of slots.
 * @returns The allocation slots.
 */
export function splitCleanAllocations(totalKwh: number, count: number = ALLOCATION_LEAF_COUNT): AllocationSlot[] {
  const safeTotal = Math.max(0, Math.round(totalKwh));
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal - base * count;

  return Array.from({ length: count }, (_, index) => {
    const kwh = index === count - 1 ? base + remainder : base;
    return { index, kwh, salt: leafSalt(index) };
  });
}

/**
 * Builds the allocation slots for one invoice inside a larger clean energy batch.
 *
 * The invoice allocation always occupies leaf zero. The remaining clean energy is distributed
 * across the other fifteen leaves so the tree root commits to the whole batch while the circuit
 * path proves exactly the invoice allocation.
 *
 * @param invoiceKwh Clean kilowatt hours allocated to the shipment invoice.
 * @param batchKwh Total clean kilowatt hours in the facility batch.
 * @param count Number of slots.
 * @returns The allocation slots.
 */
export function buildInvoiceAllocations(
  invoiceKwh: number,
  batchKwh: number,
  count: number = ALLOCATION_LEAF_COUNT,
): AllocationSlot[] {
  const safeInvoice = Math.max(0, Math.round(invoiceKwh));
  const safeBatch = Math.max(safeInvoice, Math.round(batchKwh));
  const remaining = safeBatch - safeInvoice;
  const remainderSlots = splitCleanAllocations(remaining, count - 1);

  return [
    { index: 0, kwh: safeInvoice, salt: leafSalt(0) },
    ...remainderSlots.map((slot, index) => ({
      index: index + 1,
      kwh: slot.kwh,
      salt: leafSalt(index + 1),
    })),
  ];
}

/**
 * Builds the Poseidon2 allocation Merkle tree for a clean energy batch.
 *
 * @param allocations Allocation slots for the window.
 * @param supplierTaxIdHash Hash of the supplier tax identifier bound into every leaf.
 * @returns The tree with its root and per leaf Merkle paths.
 */
export function buildAllocationTree(
  allocations: AllocationSlot[],
  supplierTaxIdHash: bigint,
): AllocationTree {
  if (allocations.length !== 2 ** ALLOCATION_TREE_DEPTH) {
    throw new Error(
      `Allocation tree requires ${2 ** ALLOCATION_TREE_DEPTH} slots, received ${allocations.length}.`,
    );
  }

  const leafHashes = allocations.map((slot) =>
    hashAllocationLeaf(slot.kwh, supplierTaxIdHash, slot.salt),
  );

  const levels: bigint[][] = [leafHashes];
  for (let depth = 0; depth < ALLOCATION_TREE_DEPTH; depth += 1) {
    const current = levels[depth];
    const parents: bigint[] = [];
    for (let index = 0; index < current.length; index += 2) {
      parents.push(poseidon2Hash2(current[index], current[index + 1]));
    }
    levels.push(parents);
  }

  const root = levels[ALLOCATION_TREE_DEPTH][0];

  const leaves: AllocationLeaf[] = allocations.map((slot, index) => {
    const path: bigint[] = [];
    const indices: number[] = [];
    let nodeIndex = index;
    for (let depth = 0; depth < ALLOCATION_TREE_DEPTH; depth += 1) {
      const siblingIndex = nodeIndex % 2 === 0 ? nodeIndex + 1 : nodeIndex - 1;
      path.push(levels[depth][siblingIndex]);
      indices.push(nodeIndex % 2);
      nodeIndex = Math.floor(nodeIndex / 2);
    }
    return {
      ...slot,
      path,
      indices,
      leafHash: leafHashes[index],
    };
  });

  return { root, leaves, supplierTaxIdHash };
}

/**
 * Recomputes a root from a leaf and its Merkle path, mirroring the circuit constraint.
 *
 * @param leafHash Leaf hash.
 * @param path Sibling elements from leaf level to root level.
 * @param indices Branch indices from leaf level to root level.
 * @returns The recomputed root.
 */
export function recomputeRoot(
  leafHash: bigint,
  path: bigint[],
  indices: number[],
): bigint {
  let current = leafHash;
  for (let depth = 0; depth < path.length; depth += 1) {
    const sibling = path[depth];
    const [left, right] = indices[depth] === 0 ? [current, sibling] : [sibling, current];
    current = poseidon2Hash2(left, right);
  }
  return current;
}

/**
 * Computes the deterministic Poseidon2 invoice nullifier used to block double counting.
 *
 * @param supplierTaxIdHash Hash of the supplier tax identifier.
 * @param invoiceSerialSecret Private invoice serial value.
 * @param cleanKwhAllocated Clean kilowatt hours allocated to the shipment.
 * @returns The nullifier field element.
 */
export function computeInvoiceNullifier(
  supplierTaxIdHash: bigint,
  invoiceSerialSecret: bigint,
  cleanKwhAllocated: number,
): bigint {
  return poseidon2Hash3(supplierTaxIdHash, invoiceSerialSecret, BigInt(Math.round(cleanKwhAllocated)));
}
