/// <reference lib="webworker" />

import { Noir } from "@noir-lang/noir_js";
import { BackendType, Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import type { ProverInputs, ProverWorkerMessage } from "../lib/noir/proverTypes";

/**
 * Shape of the compiled Noir circuit artifact.
 */
interface CompiledCircuit {
  /** Bytecode consumed by the UltraHonk backend. */
  bytecode: string;
  /** Abi and metadata consumed by the Noir executor. */
  abi: unknown;
}

/**
 * Cached circuit so repeated proofs do not download or parse the artifact twice.
 */
let circuitPromise: Promise<CompiledCircuit> | null = null;

/**
 * Cached Barretenberg runtime shared by every proof request.
 */
let apiPromise: Promise<Barretenberg> | null = null;

/**
 * Posts a message to the console thread.
 *
 * @param message Worker message.
 */
function post(message: ProverWorkerMessage): void {
  self.postMessage(message);
}

/**
 * Loads the compiled circuit artifact from the public directory.
 *
 * @returns The compiled circuit.
 */
function loadCircuit(): Promise<CompiledCircuit> {
  if (!circuitPromise) {
    circuitPromise = fetch("/circuits/cbam_attestation.json", { cache: "force-cache" }).then(
      async (response) => {
        if (!response.ok) {
          throw new Error("The compiled Noir circuit could not be loaded.");
        }
        return (await response.json()) as CompiledCircuit;
      },
    );
  }
  return circuitPromise;
}

/**
 * Returns a shared Barretenberg WebAssembly runtime.
 *
 * @returns The runtime handle.
 */
function loadBarretenberg(): Promise<Barretenberg> {
  if (!apiPromise) {
    const isolated = typeof crossOriginIsolated === "boolean" && crossOriginIsolated;
    apiPromise = Barretenberg.new({
      backend: BackendType.Wasm,
      threads: isolated ? 4 : 1,
    });
  }
  return apiPromise;
}

/**
 * Converts a byte array into a hexadecimal string.
 *
 * @param bytes Raw bytes.
 * @returns The 0x prefixed hex string.
 */
function toHex(bytes: Uint8Array): `0x${string}` {
  let output = "0x";
  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, "0");
  }
  return output as `0x${string}`;
}

/**
 * Generates an UltraHonk proof for the supplied private witness.
 *
 * @param inputs Circuit inputs.
 */
async function prove(inputs: ProverInputs): Promise<void> {
  const started = performance.now();

  post({ type: "status", phase: "loading", detail: "Loading the compiled Noir circuit" });
  const circuit = await loadCircuit();

  post({ type: "status", phase: "witness", detail: "Compiling the private witness" });
  const noir = new Noir(circuit as never);
  const { witness } = await noir.execute(inputs);

  post({ type: "status", phase: "proving", detail: "Proving the UltraHonk circuit" });
  const api = await loadBarretenberg();
  const backend = new UltraHonkBackend(circuit.bytecode, api);
  const proofData = await backend.generateProof(witness, { verifierTarget: "evm" });

  post({
    type: "result",
    result: {
      proofHex: toHex(proofData.proof),
      publicInputs: proofData.publicInputs as `0x${string}`[],
      durationMs: Math.round(performance.now() - started),
    },
  });
}

self.addEventListener("message", (event: MessageEvent<{ inputs: ProverInputs }>) => {
  void prove(event.data.inputs).catch((error: unknown) => {
    post({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "The zero-knowledge proof did not compile. Check the invoice values and try again.",
    });
  });
});
