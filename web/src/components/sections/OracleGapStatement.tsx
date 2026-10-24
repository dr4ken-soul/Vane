"use client";

import { motion } from "motion/react";

/**
 * Typographic breathing section that names the two failures Vane closes.
 *
 * The block carries no cards, no call to action and no eyebrow so the statement lands as a pause
 * between the live hero instrument and the interactive inspector.
 */
export function OracleGapStatement() {
  return (
    <section
      id="oracle-gap"
      className="relative w-full py-24 md:py-36 border-y border-[var(--border-subtle)] bg-[var(--bg-primary)]/85 z-[var(--z-content)]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <motion.div
          initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display font-extrabold uppercase text-left text-[clamp(2.25rem,6.2vw,5.25rem)] leading-[0.95] tracking-[-0.02em] text-[var(--text-primary)] max-w-[20ch]">
            A blockchain cannot spot a liar in the meter box
          </h2>
        </motion.div>

        <motion.p
          initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
          className="font-mono text-xs md:text-sm uppercase tracking-[0.16em] text-[var(--text-secondary)] mt-8 max-w-[64ch]"
        >
          Spoofed kilowatts mint fraudulent green claims. Public invoices leak supplier margins.
          Vane closes both gaps.
        </motion.p>
      </div>
    </section>
  );
}
