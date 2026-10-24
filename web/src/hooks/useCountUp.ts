"use client";

import { useEffect, useState } from "react";

/**
 * Animates a counter from zero to the supplied value over a fixed duration.
 *
 * The animation only starts once a live value resolves, and it respects the reduced motion
 * preference by jumping straight to the final number.
 *
 * @param target Final value to display, or null while the live read is in flight.
 * @param durationMs Duration of the count up in milliseconds.
 * @returns The current display value.
 */
export function useCountUp(target: number | null, durationMs = 1400): number | null {
  const [value, setValue] = useState<number | null>(target === null ? null : 0);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setValue(target);
      return;
    }

    let frame = 0;
    const started = performance.now();

    /**
     * Advances the counter on each animation frame.
     *
     * @param now Current animation timestamp.
     */
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - started) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
