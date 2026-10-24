"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Props accepted by the repeatable reveal wrapper.
 */
interface RevealProps {
  /** Content revealed when the wrapper enters the viewport. */
  children: ReactNode;
  /** Optional additional class names. */
  className?: string;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Horizontal offset applied before the reveal. */
  offsetX?: number;
  /** Vertical offset applied before the reveal. */
  offsetY?: number;
  /** Duration of the reveal in seconds. */
  duration?: number;
}

/**
 * Repeatable blur in scroll reveal.
 *
 * Every instance replays on each viewport pass so the page stays alive when the operator scrolls
 * up and down. The wrapper never locks itself to a single appearance.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  offsetX = 0,
  offsetY = 20,
  duration = 0.65,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ filter: "blur(10px)", opacity: 0, x: offsetX, y: offsetY }}
      whileInView={{ filter: "blur(0px)", opacity: 1, x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
