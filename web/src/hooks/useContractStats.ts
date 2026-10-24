"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONTRACTS_CONFIGURED,
  VANE_ATTESTATION_REGISTRY_ABI,
  VANE_ATTESTATION_REGISTRY_ADDRESS,
  VANE_METER_ORACLE_ABI,
  VANE_METER_ORACLE_ADDRESS,
} from "@/lib/contracts";
import { sepoliaPublicClient } from "@/lib/publicClient";

/**
 * Live Sepolia counters rendered by the landing page and the console.
 */
export interface ContractStats {
  /** Number of sealed CBAM attestations. */
  attestations: number | null;
  /** Number of quarantined meter intervals. */
  quarantined: number | null;
  /** Number of anchored clean meter roots. */
  cleanRoots: number | null;
  /** Number of recent roots retained by the oracle. */
  recentRoots: number | null;
  /** True while the first read is in flight. */
  loading: boolean;
  /** Human readable read failure. */
  error: string | null;
  /** Re-runs every live read. */
  refresh: () => void;
}

/**
 * Reads the live protocol counters straight from Ethereum Sepolia.
 *
 * No mocked or hardcoded counters are used. When the deployment is not configured the hook reports
 * null values so the interface can show an honest offline state.
 *
 * @param refreshMs Poll interval in milliseconds. Zero disables polling.
 * @returns The live counters together with loading and error state.
 */
export function useContractStats(refreshMs = 45000): ContractStats {
  const [attestations, setAttestations] = useState<number | null>(null);
  const [quarantined, setQuarantined] = useState<number | null>(null);
  const [cleanRoots, setCleanRoots] = useState<number | null>(null);
  const [recentRoots, setRecentRoots] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reads every counter from the configured contracts.
   */
  const refresh = useCallback(async () => {
    if (
      !CONTRACTS_CONFIGURED ||
      !VANE_ATTESTATION_REGISTRY_ADDRESS ||
      !VANE_METER_ORACLE_ADDRESS
    ) {
      setLoading(false);
      setError("Sepolia contracts are not configured for this deployment.");
      return;
    }

    try {
      const [sealed, blocked, roots, recent] = await Promise.all([
        sepoliaPublicClient.readContract({
          address: VANE_ATTESTATION_REGISTRY_ADDRESS,
          abi: VANE_ATTESTATION_REGISTRY_ABI,
          functionName: "totalVerifiedAttestations",
        }),
        sepoliaPublicClient.readContract({
          address: VANE_METER_ORACLE_ADDRESS,
          abi: VANE_METER_ORACLE_ABI,
          functionName: "totalQuarantinedIntervals",
        }),
        sepoliaPublicClient.readContract({
          address: VANE_METER_ORACLE_ADDRESS,
          abi: VANE_METER_ORACLE_ABI,
          functionName: "totalCleanRoots",
        }),
        sepoliaPublicClient.readContract({
          address: VANE_METER_ORACLE_ADDRESS,
          abi: VANE_METER_ORACLE_ABI,
          functionName: "getRecentRootsCount",
        }),
      ]);

      setAttestations(Number(sealed));
      setQuarantined(Number(blocked));
      setCleanRoots(Number(roots));
      setRecentRoots(Number(recent));
      setError(null);
    } catch {
      setError("The Sepolia RPC did not answer. Retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (refreshMs <= 0) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);

  return { attestations, quarantined, cleanRoots, recentRoots, loading, error, refresh };
}
