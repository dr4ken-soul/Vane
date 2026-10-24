"use client";

import { motion } from "motion/react";
import { ProtocolSchematicSvg } from "@/components/sections/ProtocolSchematicSvg";

/**
 * Standards references printed beneath the schematic.
 */
const STANDARDS = [
  { label: "Regulation", value: "EU 2023/956 CBAM" },
  { label: "Invoice schema", value: "OASIS UBL 2.1 XML" },
  { label: "Weather oracle", value: "Open-Meteo GHI" },
  { label: "Settlement", value: "Ethereum Sepolia" },
];

/**
 * Split section mapping the protocol onto open regulation and data standards.
 */
export function StandardsSchematic() {
  return (
    <section
      id="standards"
      className="relative w-full py-24 md:py-32 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] z-[var(--z-content)]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <motion.div
            className="lg:col-span-5"
            initial={{ filter: "blur(10px)", opacity: 0, x: -24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[var(--text-primary)]">
              Aligned with EU CBAM and UN COP 31 targets
            </h2>
            <p className="mt-5 font-body text-base text-[var(--text-secondary)] leading-relaxed max-w-[48ch]">
              Built for industrial exporters across steel, aluminium, cement, and clean energy
              generation ahead of UN COP 31 in Antalya. Every proof anchors to open international
              standards rather than proprietary schemas.
            </p>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ filter: "blur(10px)", opacity: 0, x: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <div className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
              <div className="rounded-[10px] bg-[var(--bg-primary)] p-6">
                <ProtocolSchematicSvg />
                <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {STANDARDS.map((standard) => (
                    <div key={standard.label}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        {standard.label}
                      </p>
                      <p className="mt-1 font-mono text-[11px] md:text-xs text-[var(--text-primary)]">
                        {standard.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
