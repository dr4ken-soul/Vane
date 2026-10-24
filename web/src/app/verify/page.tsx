"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address, Hex } from "viem";
import {
  COMMODITY_LABELS,
  CONTRACTS_CONFIGURED,
  VANE_ATTESTATION_REGISTRY_ABI,
  VANE_ATTESTATION_REGISTRY_ADDRESS,
} from "@/lib/contracts";
import { sepoliaPublicClient } from "@/lib/publicClient";

/**
 * One receipt summary shown in the public verifier index.
 */
interface ReceiptSummary {
  /** Sequential attestation identifier. */
  id: number;
  /** Wallet that sealed the proof. */
  exporter: Address;
  /** Facility allocation root. */
  facilityMerkleRoot: Hex;
  /** Declared intensity ceiling in kilograms per tonne. */
  maxIntensityKgPerTonne: number;
  /** Combined Nomenclature code. */
  cnCommodityCode: number;
  /** Sealing timestamp in seconds. */
  timestamp: number;
}

/**
 * Shortens a hexadecimal value for dense tables.
 *
 * @param value Hexadecimal string.
 * @returns The shortened value.
 */
function shorten(value: string): string {
  if (value.length <= 22) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

/**
 * Formats a unix timestamp as a British date and time.
 *
 * @param timestamp Unix timestamp in seconds.
 * @returns The formatted date.
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/**
 * Wallet-free public verifier index.
 */
export default function VerifyIndexPage() {
  const router = useRouter();
  const [receiptId, setReceiptId] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      if (!CONTRACTS_CONFIGURED || !VANE_ATTESTATION_REGISTRY_ADDRESS) {
        if (!cancelled) {
          setLoading(false);
          setError("The Sepolia registry address is not configured for this deployment.");
        }
        return;
      }

      try {
        const registryAddress = VANE_ATTESTATION_REGISTRY_ADDRESS;
        const total = await sepoliaPublicClient.readContract({
          address: registryAddress,
          abi: VANE_ATTESTATION_REGISTRY_ABI,
          functionName: "totalVerifiedAttestations",
        });
        const totalCount = Number(total);
        if (totalCount === 0) {
          if (!cancelled) {
            setReceipts([]);
            setError(null);
            setLoading(false);
          }
          return;
        }

        const ids = Array.from(
          { length: Math.min(6, totalCount) },
          (_, index) => totalCount - index,
        );
        const rows = await Promise.all(
          ids.map((id) =>
            sepoliaPublicClient.readContract({
              address: registryAddress,
              abi: VANE_ATTESTATION_REGISTRY_ABI,
              functionName: "attestations",
              args: [BigInt(id)],
            }),
          ),
        );

        if (!cancelled) {
          setReceipts(
            rows
              .map((row) => {
                const [id, exporter, facilityMerkleRoot, , maxIntensity, cnCode, timestamp] = row;
                return {
                  id: Number(id),
                  exporter,
                  facilityMerkleRoot,
                  maxIntensityKgPerTonne: Number(maxIntensity),
                  cnCommodityCode: Number(cnCode),
                  timestamp: Number(timestamp),
                };
              })
              .filter((row) => row.timestamp > 0),
          );
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("The Sepolia registry did not answer. Retry in a moment.");
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Navigates to a receipt by identifier with inline validation.
   */
  const handleSearch = (): void => {
    const trimmed = receiptId.trim();
    if (!/^[1-9][0-9]*$/.test(trimmed)) {
      setSearchError(
        "Enter a positive attestation number, for example 1. Identifiers are sequential and start at one.",
      );
      return;
    }
    setSearchError(null);
    router.push(`/verify/${trimmed}`);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
          Public customs verifier
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold uppercase tracking-[-0.015em] text-[var(--text-primary)]">
          Verify a CBAM receipt without a wallet
        </h1>
        <p className="mt-3 font-body text-sm md:text-base text-[var(--text-secondary)] max-w-[64ch]">
          Every receipt reads live state from Ethereum Sepolia. No account, extension or private
          commercial data is needed to inspect a sealed shipment proof.
        </p>

        <div className="mt-8 p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
          <div className="rounded-[10px] bg-[var(--bg-secondary)] p-4 md:p-5">
            <label htmlFor="receipt-id" className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Attestation identifier
              </span>
              <span className="mt-1 block font-body text-xs text-[var(--text-muted)]">
                Paste the number from a shared /verify link or from the sealed proof receipt.
              </span>
            </label>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                id="receipt-id"
                type="text"
                inputMode="numeric"
                value={receiptId}
                onChange={(event) => setReceiptId(event.target.value)}
                onBlur={() => {
                  const trimmed = receiptId.trim();
                  if (trimmed.length === 0) return;
                  if (!/^[1-9][0-9]*$/.test(trimmed)) {
                    setSearchError(
                      "Attestation identifiers are positive whole numbers. Remove spaces and leading zeros.",
                    );
                    return;
                  }
                  setSearchError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="1"
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-default)] focus:border-[var(--accent)] rounded-[10px] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none min-h-[44px]"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] px-5 py-2.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
              >
                Open receipt
              </button>
            </div>
            {searchError ? (
              <p className="mt-2 font-body text-xs text-[var(--error)]">{searchError}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
            Recent sealed receipts
          </h2>
          <Link
            href="/docs"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
          >
            API docs
          </Link>
        </div>

        {error ? (
          <p className="mt-4 rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-3 font-body text-xs text-[var(--error)]">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-4 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-14 animate-shimmer bg-white/[0.03]" />
            ))}
          </div>
        ) : receipts.length === 0 ? (
          <div className="mt-4 border-y border-[var(--border-subtle)] py-12 text-center">
            <p className="font-body text-sm text-[var(--text-secondary)]">
              No CBAM receipt is sealed on Sepolia yet.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
            >
              Open the console to seal the first proof
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-y border-[var(--border-subtle)]">
              <thead>
                <tr className="text-left">
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    ID
                  </th>
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Commodity
                  </th>
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Intensity cap
                  </th>
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Facility root
                  </th>
                  <th className="py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Sealed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/verify/${receipt.id}`}
                        className="font-mono text-xs text-[var(--accent)] hover:underline"
                      >
                        #{receipt.id}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-body text-xs text-[var(--text-secondary)]">
                      <span className="font-mono text-[var(--text-primary)]">
                        {receipt.cnCommodityCode}
                      </span>{" "}
                      {COMMODITY_LABELS[receipt.cnCommodityCode] ?? "Industrial precursor"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--text-primary)] tabular-nums">
                      {receipt.maxIntensityKgPerTonne} kg/t
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                      {shorten(receipt.facilityMerkleRoot)}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-[var(--text-muted)]">
                      {formatTimestamp(receipt.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-body text-xs text-[var(--text-muted)] max-w-[56ch]">
            Receipts expose the commodity code, declared intensity ceiling, facility allocation root,
            invoice nullifier and sealing timestamp. Unit price, supplier tax identifier and batch
            volume stay private.
          </p>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
          >
            Issue zero-leak CBAM receipts for your suppliers
          </Link>
        </div>
      </div>
    </div>
  );
}
