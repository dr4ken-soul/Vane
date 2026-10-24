"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import {
  CONTRACTS_CONFIGURED,
  VANE_METER_ORACLE_ABI,
  VANE_METER_ORACLE_ADDRESS,
} from "@/lib/contracts";
import { sepoliaPublicClient } from "@/lib/publicClient";

/**
 * One anchored meter root read from the oracle.
 */
export interface MeterRootRecord {
  /** Merkle root anchored on Sepolia. */
  merkleRoot: Hex;
  /** Facility meter identifier hash. */
  meterId: Hex;
  /** Unix start timestamp of the telemetry window. */
  windowStart: number;
  /** Unix end timestamp of the telemetry window. */
  windowEnd: number;
  /** PINN residual in basis points. */
  residualSigmaBps: number;
  /** True when the root was quarantined. */
  quarantined: boolean;
  /** Wallet that submitted the root. */
  reporter: Address;
}

/**
 * State returned by the recent roots hook.
 */
export interface RecentRootsState {
  /** Anchored roots, newest first. */
  roots: MeterRootRecord[];
  /** True while the first read is in flight. */
  loading: boolean;
  /** Human readable read failure. */
  error: string | null;
  /** Re-runs the live read. */
  refresh: () => void;
}

/**
 * Reads the newest anchored meter roots from the Sepolia oracle.
 *
 * @param count Maximum number of roots to return.
 * @param refreshMs Poll interval in milliseconds. Zero disables polling.
 * @returns The anchored roots together with loading and error state.
 */
export function useRecentRoots(count = 6, refreshMs = 45000): RecentRootsState {
  const [roots, setRoots] = useState<MeterRootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reads the newest roots and their batch metadata.
   */
  const refresh = useCallback(async () => {
    if (!CONTRACTS_CONFIGURED || !VANE_METER_ORACLE_ADDRESS) {
      setRoots([]);
      setLoading(false);
      setError(null);
      return;
    }

    const oracleAddress = VANE_METER_ORACLE_ADDRESS;

    try {
      const total = await sepoliaPublicClient.readContract({
        address: oracleAddress,
        abi: VANE_METER_ORACLE_ABI,
        functionName: "getRecentRootsCount",
      });

      const totalCount = Number(total);
      const start = Math.max(0, totalCount - count);
      const indices = Array.from({ length: totalCount - start }, (_, offset) => start + offset);

      const hashes = await Promise.all(
        indices.map((index) =>
          sepoliaPublicClient.readContract({
            address: oracleAddress,
            abi: VANE_METER_ORACLE_ABI,
            functionName: "recentRoots",
            args: [BigInt(index)],
          }),
        ),
      );

      const batches = await Promise.all(
        hashes.map((hash) =>
          sepoliaPublicClient.readContract({
            address: oracleAddress,
            abi: VANE_METER_ORACLE_ABI,
            functionName: "batchesByRoot",
            args: [hash],
          }),
        ),
      );

      const mapped = batches
        .map((batch) => {
          const [merkleRoot, meterId, windowStart, windowEnd, residualSigmaBps, quarantined, reporter] =
            batch;
          return {
            merkleRoot,
            meterId,
            windowStart: Number(windowStart),
            windowEnd: Number(windowEnd),
            residualSigmaBps: Number(residualSigmaBps),
            quarantined,
            reporter,
          };
        })
        .reverse();

      setRoots(mapped);
      setError(null);
    } catch {
      setError("The Sepolia oracle did not answer. Retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    if (refreshMs <= 0) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);

  return { roots, loading, error, refresh };
}
