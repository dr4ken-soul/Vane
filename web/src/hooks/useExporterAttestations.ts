"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import {
  CONTRACTS_CONFIGURED,
  VANE_ATTESTATION_REGISTRY_ABI,
  VANE_ATTESTATION_REGISTRY_ADDRESS,
} from "@/lib/contracts";
import { sepoliaPublicClient } from "@/lib/publicClient";

/**
 * One sealed CBAM attestation read from Sepolia.
 */
export interface AttestationRecord {
  /** Sequential attestation identifier. */
  id: number;
  /** Wallet that sealed the proof. */
  exporter: Address;
  /** Facility energy Merkle root used by the proof. */
  facilityMerkleRoot: Hex;
  /** Single-use invoice nullifier. */
  invoiceNullifier: Hex;
  /** Declared intensity ceiling in kilograms per tonne. */
  maxIntensityKgPerTonne: number;
  /** Combined Nomenclature commodity code. */
  cnCommodityCode: number;
  /** Unix timestamp of the sealing block. */
  timestamp: number;
}

/**
 * State returned by the exporter attestation hook.
 */
export interface ExporterAttestationsState {
  /** Attestations sealed by the connected wallet, newest first. */
  attestations: AttestationRecord[];
  /** True while the first read is in flight. */
  loading: boolean;
  /** Human readable read failure. */
  error: string | null;
  /** Re-runs the live read. */
  refresh: () => void;
}

/**
 * Reads every attestation sealed by one exporter wallet.
 *
 * @param exporter Connected wallet address, or undefined when no wallet is active.
 * @param refreshMs Poll interval in milliseconds. Zero disables polling.
 * @returns The sealed attestations together with loading and error state.
 */
export function useExporterAttestations(
  exporter: Address | undefined,
  refreshMs = 45000,
): ExporterAttestationsState {
  const [attestations, setAttestations] = useState<AttestationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reads the exporter attestation list from the registry.
   */
  const refresh = useCallback(async () => {
    if (!CONTRACTS_CONFIGURED || !VANE_ATTESTATION_REGISTRY_ADDRESS || !exporter) {
      setAttestations([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const list = await sepoliaPublicClient.readContract({
        address: VANE_ATTESTATION_REGISTRY_ADDRESS,
        abi: VANE_ATTESTATION_REGISTRY_ABI,
        functionName: "getAttestationsByExporter",
        args: [exporter],
      });

      const mapped = list
        .map((entry) => ({
          id: Number(entry.id),
          exporter: entry.exporter,
          facilityMerkleRoot: entry.facilityMerkleRoot,
          invoiceNullifier: entry.invoiceNullifier,
          maxIntensityKgPerTonne: Number(entry.maxIntensityKgPerTonne),
          cnCommodityCode: Number(entry.cnCommodityCode),
          timestamp: Number(entry.timestamp),
        }))
        .sort((left, right) => right.id - left.id);

      setAttestations(mapped);
      setError(null);
    } catch {
      setError("The Sepolia registry did not answer. Retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, [exporter]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    if (refreshMs <= 0) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);

  return { attestations, loading, error, refresh };
}
