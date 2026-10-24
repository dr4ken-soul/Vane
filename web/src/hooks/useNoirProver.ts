"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ProverInputs,
  ProverResult,
  ProverWorkerMessage,
} from "@/lib/noir/proverTypes";

/**
 * Prover phases surfaced to the console progress bar.
 */
export type ProverPhase = "idle" | "loading" | "witness" | "proving" | "ready" | "error";

/**
 * State returned by the Noir prover hook.
 */
export interface NoirProverState {
  /** Current phase of the browser prover. */
  phase: ProverPhase;
  /** Human readable progress detail. */
  detail: string;
  /** Generated proof and public inputs when ready. */
  result: ProverResult | null;
  /** Error message when the proof fails. */
  error: string | null;
  /** True while the worker is busy. */
  isProving: boolean;
  /** Starts a proof generation run. */
  prove: (inputs: ProverInputs) => void;
  /** Clears the current proof and error state. */
  reset: () => void;
}

/**
 * Owns a dedicated UltraHonk proving worker.
 *
 * Witness generation and proof generation run off the main thread so the console stays at sixty
 * frames per second. Private invoice values are posted straight into the worker and never reach a
 * network request.
 *
 * @returns The prover state and controls.
 */
export function useNoirProver(): NoirProverState {
  const workerRef = useRef<Worker | null>(null);
  const [phase, setPhase] = useState<ProverPhase>("idle");
  const [detail, setDetail] = useState("");
  const [result, setResult] = useState<ProverResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/prover.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    /**
     * Handles messages posted by the proving worker.
     *
     * @param event Worker message event.
     */
    const handleMessage = (event: MessageEvent<ProverWorkerMessage>): void => {
      const message = event.data;
      if (message.type === "status") {
        setPhase(message.phase);
        setDetail(message.detail);
        return;
      }
      if (message.type === "result") {
        setResult(message.result);
        setPhase("ready");
        setDetail(`Proof ready in ${(message.result.durationMs / 1000).toFixed(1)}s`);
        return;
      }
      setError(message.message);
      setPhase("error");
      setDetail("Proof generation stopped");
    };

    worker.addEventListener("message", handleMessage);
    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Starts a proof generation run.
   *
   * @param inputs Circuit inputs built from the private invoice witness.
   */
  const prove = useCallback((inputs: ProverInputs) => {
    const worker = workerRef.current;
    if (!worker) {
      setError("The proving worker is not ready. Reload the page and try again.");
      setPhase("error");
      return;
    }
    setResult(null);
    setError(null);
    setPhase("loading");
    setDetail("Handing the witness to the browser prover");
    worker.postMessage({ inputs });
  }, []);

  /**
   * Clears the current proof and error state.
   */
  const reset = useCallback(() => {
    setPhase("idle");
    setDetail("");
    setResult(null);
    setError(null);
  }, []);

  return {
    phase,
    detail,
    result,
    error,
    isProving: phase === "loading" || phase === "witness" || phase === "proving",
    prove,
    reset,
  };
}
