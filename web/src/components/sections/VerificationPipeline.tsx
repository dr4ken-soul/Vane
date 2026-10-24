"use client";

import { motion } from "motion/react";

/**
 * The four verification stages rendered as stacked architecture layers.
 *
 * Each layer is a Double-Bezel card with a stage badge, an operational description and the exact
 * output artefact handed to the next layer.
 */
const STAGES = [
  {
    badge: "Ingest",
    title: "Ingest signed telemetry & UBL invoices",
    description:
      "Vane pulls facility inverter telemetry alongside live Open-Meteo solar irradiance and wind vectors, paired with standard Peppol or UBL 2.1 XML energy invoices.",
    output: "MQTT / XML -> JSON",
  },
  {
    badge: "Calibrate",
    title: "Score thermodynamic & PINN residuals",
    description:
      "The physics verifier checks reported power curves against solar geometry and cell temperature. Clean intervals anchor an hourly Merkle root; anomalies quarantine the meter key.",
    output: "VaneMeterOracle.sol",
  },
  {
    badge: "Prove",
    title: "Compile client-side UltraHonk proof",
    description:
      "Noir executes inside browser WebAssembly to prove embedded emissions per tonne fall under threshold using verified energy roots, keeping unit prices and tax IDs local.",
    output: "bb.js WASM -> Proof",
  },
  {
    badge: "Settle",
    title: "Seal nullifier & mint CBAM certificate",
    description:
      "Ethereum Sepolia verifies the proof on-chain, records the invoice nullifier so clean energy cannot be sold twice, and issues a publicly verifiable compliance receipt.",
    output: "VaneAttestationRegistry.sol",
  },
];

/**
 * Four-stage verification pipeline section.
 */
export function VerificationPipeline() {
  return (
    <section
      id="pipeline"
      className="relative w-full py-24 md:py-32 bg-[var(--bg-primary)]/90 z-[var(--z-content)]"
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Verification pipeline
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.02em] text-[var(--text-primary)]">
            From kilowatt to customs seal in four stages
          </h2>
        </motion.div>

        <div className="mt-14 flex flex-col gap-4">
          {STAGES.map((stage, index) => (
            <motion.div
              key={stage.badge}
              initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
              whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
              className="p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)] hover:ring-[var(--accent)]/50 transition-all duration-200"
            >
              <div className="rounded-[10px] bg-[var(--bg-surface)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6">
                <span className="px-2.5 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)] w-fit shrink-0">
                  {stage.badge}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-[-0.01em] text-[var(--text-primary)]">
                    {stage.title}
                  </h3>
                  <p className="font-body text-sm md:text-base text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
                <p className="sm:ml-auto shrink-0 font-mono text-[11px] text-[var(--text-muted)] pt-1">
                  {stage.output}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
