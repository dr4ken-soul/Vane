"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

/**
 * Props accepted by the text scramble component.
 */
interface TextScrambleProps {
  /** Text rendered once the scramble settles. */
  text: string;
  /** Scramble speed in milliseconds between frames. */
  speed?: number;
  /** Additional class names. */
  className?: string;
}

/**
 * Character set used while the text resolves.
 */
const GLYPHS = "0123456789ABCDEF#%&*+=/\\|<>[]{}";

/**
 * Text that resolves through a short scramble whenever it enters the viewport.
 *
 * The effect repeats on every viewport pass so the reveal stays alive while the operator scrolls.
 */
export function TextScramble({ text, speed = 30, className = "" }: TextScrambleProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    let timer: number | null = null;

    const run = (): void => {
      const total = 8;
      frame += 1;
      const progress = Math.min(1, frame / total);
      const resolved = Math.floor(text.length * progress);
      const scrambled = text
        .split("")
        .map((character, index) => {
          if (index < resolved) return character;
          if (character === " ") return " ";
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setDisplay(scrambled);
      if (progress < 1) {
        timer = window.setTimeout(run, speed);
      } else {
        setDisplay(text);
      }
    };

    run();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [inView, speed, text]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
