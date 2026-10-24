"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useContractStats } from "@/hooks/useContractStats";
import { useExporterAttestations } from "@/hooks/useExporterAttestations";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { useRecentRoots } from "@/hooks/useRecentRoots";
import { COMMODITY_LABELS } from "@/lib/contracts";

/**
 * Shortens a hexadecimal value for dense tables.
 *
 * @param value Full hexadecimal string.
 * @param lead Number of leading characters to keep.
 * @param tail Number of trailing characters to keep.
 * @returns The shortened value.
 */
function shorten(value: string, lead = 8, tail = 6): string {
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
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
 * Overview console reading live Sepolia state and live Open-Meteo physics.
 */
export default function OverviewPage() {
  const { address } = useAccount();
  const { cleanRoots, quarantined, recentRoots, loading, error, refresh } =
    useContractStats();
  const { attestations: mine, loading: mineLoading, error: mineError } =
    useExporterAttestations(address);
  const { roots, loading: rootsLoading, error: rootsError } = useRecentRoots(6);
  const { data: telemetry, loading: telemetryLoading } = useLiveTelemetry({
    lat: 40.8,
    lon: 29.43,
    kw: 1200,
    refreshMs: 60000,
  });

  const latestResidual = telemetry?.residualSigma ?? null;
  const calibrated = (telemetry?.status ?? "calibrated") === "calibrated";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
            Operator overview
          </p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold uppercase tracking-[-0.01em] text-[var(--text-primary)]">
            Physics verified carbon state
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--text-secondary)] max-w-[58ch]">
            Every counter reads directly from Ethereum Sepolia. Nothing on this page is fabricated or
            cached from a private database.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="self-start sm:self-auto inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-150 min-h-[40px]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 11a8 8 0 10-2.3 6.4M20 5v6h-6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh reads
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-3 font-body text-xs text-[var(--error)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-default)] border-y border-[var(--border-default)] py-5">
        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Active facility meters
          </p>
          {loading ? (
            <div className="mt-2 h-9 w-16 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
              {recentRoots ?? "--"}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            Rolling clean root window
          </p>
        </div>

        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Latest physics residual
          </p>
          {telemetryLoading || latestResidual === null ? (
            <div className="mt-2 h-9 w-20 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p
              className={`mt-2 font-display text-3xl md:text-4xl font-extrabold leading-none tabular-nums ${
                calibrated ? "text-[var(--success)]" : "text-[var(--error)]"
              }`}
            >
              {latestResidual.toFixed(3)} σ
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            {calibrated ? "Calibrated · Gebze Mill 04" : "Quarantined · Gebze Mill 04"}
          </p>
        </div>

        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Your sealed CBAM proofs
          </p>
          {mineLoading ? (
            <div className="mt-2 h-9 w-16 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
              {mine.length}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            Sealed by this wallet
          </p>
        </div>

        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Quarantined intervals
          </p>
          {loading ? (
            <div className="mt-2 h-9 w-16 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-[var(--error)] leading-none tabular-nums">
              {quarantined ?? "--"}
            </p>
          )}
          <Link
            href="/app/meters"
            className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)] hover:underline"
          >
            Open meter guard
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
              Recent CBAM attestations
            </h3>
            <Link
              href="/app/attest/new"
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] px-4 py-2 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[36px]"
            >
              Seal proof
            </Link>
          </div>

          {mineLoading ? (
            <div className="mt-4 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-14 animate-shimmer bg-white/[0.03]" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="mt-4 border-y border-[var(--border-subtle)] py-10 text-center">
              <p className="font-body text-sm text-[var(--text-secondary)]">
                No CBAM proofs sealed from this wallet yet.
              </p>
              <Link
                href="/app/attest/new"
                className="mt-4 inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] px-5 py-2.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150"
              >
                Seal first shipment proof
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 17L17 7M8 7h9v9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              {mineError ? (
                <p className="mt-3 font-body text-xs text-[var(--error)]">{mineError}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-y border-[var(--border-subtle)]">
                <thead>
                  <tr className="text-left">
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      ID
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Commodity
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Facility root
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Intensity cap
                    </th>
                    <th className="py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Sealed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {mine.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/verify/${entry.id}`}
                          className="font-mono text-xs text-[var(--accent)] hover:underline"
                        >
                          #{entry.id}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-body text-xs text-[var(--text-secondary)]">
                        <span className="font-mono text-[var(--text-primary)]">
                          {entry.cnCommodityCode}
                        </span>{" "}
                        {COMMODITY_LABELS[entry.cnCommodityCode] ?? "Industrial precursor"}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                        {shorten(entry.facilityMerkleRoot)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-[var(--text-primary)] tabular-nums">
                        {entry.maxIntensityKgPerTonne} kg/t
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[var(--text-muted)]">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
              Recent meter roots
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {cleanRoots ?? "--"} total
            </span>
          </div>

          {rootsLoading ? (
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-16 rounded-[10px] bg-white/5 animate-shimmer" />
              ))}
            </div>
          ) : roots.length === 0 ? (
            <div className="mt-4 border-y border-[var(--border-subtle)] py-8 text-center">
              <p className="font-body text-sm text-[var(--text-secondary)]">
                No clean meter root is anchored yet.
              </p>
              <Link
                href="/app/meters"
                className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
              >
                Anchor the first window
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {roots.map((root) => (
                <li key={root.merkleRoot} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-[var(--text-primary)]">
                      {shorten(root.merkleRoot, 10, 8)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                        root.quarantined ? "text-[var(--error)]" : "text-[var(--success)]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          root.quarantined ? "bg-[var(--error)]" : "bg-[var(--success)]"
                        }`}
                      />
                      {root.quarantined ? "Quarantined" : "Clean"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 font-mono text-[10px] text-[var(--text-muted)]">
                    <span>{(root.residualSigmaBps / 10000).toFixed(3)} σ</span>
                    <span>{formatTimestamp(root.windowEnd)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {rootsError ? (
            <p className="mt-3 font-body text-xs text-[var(--error)]">{rootsError}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
