/**
 * Values produced by the browser UltraHonk prover worker.
 */
export interface ProverResult {
  /** Hex encoded UltraHonk proof bytes. */
  proofHex: `0x${string}`;
  /** Four public circuit inputs in the order expected by the registry. */
  publicInputs: `0x${string}`[];
  /** Wall clock proving duration in milliseconds. */
  durationMs: number;
}

/**
 * Messages posted from the prover worker back to the main thread.
 */
export type ProverWorkerMessage =
  | { type: "status"; phase: "loading" | "witness" | "proving"; detail: string }
  | { type: "result"; result: ProverResult }
  | { type: "error"; message: string };

/**
 * Circuit input map accepted by the Noir executor.
 */
export type ProverInputs = Record<string, string | string[] | boolean[]>;
