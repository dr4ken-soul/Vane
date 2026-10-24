"use client";

import { motion } from "motion/react";
import { useContractStats } from "@/hooks/useContractStats";
import { useCountUp } from "@/hooks/useCountUp";

/**
 * One metric column rendered by the live telemetry strip.
 */
interface MetricColumnProps {
  /** Live value, or null while the read is in flight. */
  value: number | null;
  /** Metric label. */
  label: string;
  /** Source sub-note. */
  source: string;
  /** Optional suffix appended to the value. */
  suffix?: string;
  /** Stagger delay in seconds. */
  delay: number;
  /** True while the live read is still in flight. */
  pending?: boolean;
}

/**
 * Renders a single animated protocol metric.
 *
 * @param props Metric definition and delay.
 * @returns The metric column.
 */
function MetricColumn({ value, label, source, suffix = "", delay, pending = false }: MetricColumnProps) {
  const display = useCountUp(value);

  return (
    <motion.div
      initial={{ filter: "blur(8px)", opacity: 0, y: 18 }}
      whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
      className="px-4 md:px-8"
    >
      {pending ? (
        <div className="h-16 w-28 mx-auto rounded-lg bg-white/5 animate-shimmer" />
      ) : display === null ? (
        <p className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-muted)] leading-none tabular-nums">
          --
        </p>
      ) : (
        <p className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
          {display.toLocaleString("en-GB")}
          {suffix}
        </p>
      )}
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] mt-4">
        {label}
      </p>
      <p className="font-mono text-[11px] text-[var(--text-muted)] mt-1.5">{source}</p>
    </motion.div>
  );
}

/**
 * Live protocol telemetry strip reading real Sepolia contract counters.
 *
 * The third column reports the size of the commercial pricing payload that the protocol ever
 * publishes, which is deliberately zero bytes because proving runs inside browser memory.
 */
export function LiveTelemetryMetrics() {
  const { attestations, quarantined, loading } = useContractStats();

  return (
    <section
      id="telemetry"
      className="relative w-full py-24 md:py-32 border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] z-[var(--z-content)]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x md:divide-[var(--border-default)] text-center">
          <MetricColumn
            value={attestations}
            label="CBAM proofs verified on-chain"
            source="VaneAttestationRegistry · Sepolia"
            delay={0}
            pending={loading}
          />
          <MetricColumn
            value={quarantined}
            label="Spoofed meter intervals blocked"
            source="VaneMeterOracle · PINN Guard"
            delay={0.08}
            pending={loading}
          />
          <MetricColumn
            value={0}
            label="Commercial pricing exposed"
            source="100% browser WASM witness generation"
            suffix=" B"
            delay={0.16}
          />
        </div>
      </div>
    </section>
  );
}
