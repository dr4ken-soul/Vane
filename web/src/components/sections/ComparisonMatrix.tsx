"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { TiltBezelCard } from "@/components/motion/TiltBezelCard";

/**
 * Advantage rows rendered inside the featured Vane cell.
 */
const VANE_ROWS = [
  {
    label: "Hardware spoofing defence",
    value: "Live PINN + satellite irradiance check",
    tone: "success",
  },
  {
    label: "Supplier price privacy",
    value: "100% private in browser RAM",
    tone: "success",
  },
  {
    label: "Double-counting prevention",
    value: "On-chain Poseidon2 invoice nullifier",
    tone: "success",
  },
  {
    label: "Audit turnaround time",
    value: "Under 6 seconds per shipment",
    tone: "accent",
  },
] as const;

/**
 * Weakness rows rendered inside the contrast cell.
 */
const LEDGER_ROWS = [
  {
    label: "Hardware spoofing defence",
    value: "None; hashes fake meter readings permanently",
    tone: "error",
  },
  {
    label: "Supplier price privacy",
    value: "Leaks BOM & kWh costs on public explorers",
    tone: "error",
  },
  {
    label: "Double-counting prevention",
    value: "Registry-level only",
    tone: "muted",
  },
  {
    label: "Enterprise ERP adoption",
    value: "Blocked by legal & procurement teams",
    tone: "error",
  },
] as const;

/**
 * Returns the text colour class for a comparison row.
 *
 * @param tone Semantic tone of the row.
 * @returns The Tailwind text colour class.
 */
function toneClass(tone: "success" | "accent" | "error" | "muted"): string {
  if (tone === "success") return "text-[var(--success)]";
  if (tone === "accent") return "text-[var(--accent)]";
  if (tone === "error") return "text-[var(--error)]";
  return "text-[var(--text-secondary)]";
}

/**
 * Four-cell asymmetric comparison between Vane and the incumbent carbon systems.
 */
export function ComparisonMatrix() {
  const [copied, setCopied] = useState(false);

  /**
   * Copies the meter batch curl command and resets the label after 1.8 seconds.
   */
  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText("curl -X POST /api/telemetry/verify -d @meter_batch.json");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="comparison"
      className="relative w-full py-24 md:py-32 bg-[var(--bg-primary)]/90 z-[var(--z-content)]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <motion.div
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Protocol advantage
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-[-0.02em] text-[var(--text-primary)]">
            Why existing carbon systems fail audit
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div
            className="lg:col-span-7 z-[var(--z-elevated)]"
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltBezelCard className="p-1.5 rounded-2xl bg-[var(--accent-glow)] ring-1 ring-[var(--accent)]/45 h-full">
              <div className="surface-noise relative rounded-[10px] bg-[var(--bg-surface)] p-6 md:p-8 h-full flex flex-col justify-between">
                <div>
                  <span className="inline-block bg-[var(--accent)] text-[var(--on-accent)] px-3 py-1 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Recommended architecture
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)] mt-4">
                    Vane physics + zero-knowledge
                  </h3>
                  <div className="mt-6 divide-y divide-[var(--border-subtle)]">
                    {VANE_ROWS.map((row) => (
                      <div
                        key={row.label}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3"
                      >
                        <p className="font-body text-sm text-[var(--text-secondary)]">{row.label}</p>
                        <p className={`font-mono text-xs md:text-sm ${toneClass(row.tone)}`}>
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TiltBezelCard>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
          >
            <div className="p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)] h-full">
              <div className="surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] p-6 md:p-8 h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl md:text-2xl font-bold uppercase text-[var(--text-primary)]">
                    Public carbon ledgers
                  </h3>
                  <div className="mt-6 divide-y divide-[var(--border-subtle)]">
                    {LEDGER_ROWS.map((row) => (
                      <div key={row.label} className="py-3">
                        <p className="font-body text-sm text-[var(--text-secondary)]">{row.label}</p>
                        <p className={`mt-1 font-mono text-xs ${toneClass(row.tone)}`}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-6"
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            <div className="p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)] h-full">
              <div className="rounded-[10px] bg-[var(--bg-secondary)] p-6 h-full">
                <h3 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
                  Manual PDF verification
                </h3>
                <p className="mt-2 font-body text-sm text-[var(--text-secondary)] leading-relaxed">
                  Costs EUR 18,000 to EUR 45,000 per facility each year, relies on static utility bills
                  easily edited in PDF software, and leaves Tier-2 exporters defaulting to punitive EU
                  emission markups.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-6"
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
          >
            <div className="p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)] h-full">
              <div className="rounded-[10px] bg-[var(--bg-secondary)] p-6 flex flex-col justify-between h-full">
                <h3 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
                  Zero platform migration
                </h3>
                <div className="mt-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[10px] px-4 py-3 font-mono text-xs text-[var(--text-primary)] flex items-center justify-between gap-3">
                  <code className="break-all">
                    curl -X POST /api/telemetry/verify -d @meter_batch.json
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy curl command"
                    className="shrink-0 w-8 h-8 rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-colors duration-150"
                  >
                    {copied ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect
                          x="9"
                          y="9"
                          width="11"
                          height="11"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                        />
                        <path
                          d="M15 5.5A2.5 2.5 0 0012.5 3H6.5A2.5 2.5 0 004 5.5v6A2.5 2.5 0 006.5 14"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
