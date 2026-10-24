"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Props accepted by the tilt bezel card.
 */
interface TiltBezelCardProps {
  /** Card content. */
  children: ReactNode;
  /** Optional additional class names. */
  className?: string;
  /** Maximum rotation in degrees applied on each axis. */
  maxRotation?: number;
  /** Whether the card reacts to the pointer. */
  enabled?: boolean;
}

/**
 * Mouse tracked three dimensional card with a spring damped tilt.
 *
 * The component never triggers a React state update while the pointer moves. Rotation is driven
 * by motion values and it is disabled automatically on coarse pointers and when the operator asks
 * for reduced motion.
 */
export function TiltBezelCard({
  children,
  className = "",
  maxRotation = 5,
  enabled = true,
}: TiltBezelCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [maxRotation, -maxRotation]), {
    stiffness: 180,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-maxRotation, maxRotation]), {
    stiffness: 180,
    damping: 24,
  });

  useEffect(() => {
    if (!enabled) return;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarsePointer || reducedMotion) return;

    /**
     * Maps the pointer position onto the card surface.
     *
     * @param event The pointer event.
     */
    const handlePointerMove = (event: PointerEvent): void => {
      const element = containerRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointerX.set(Math.min(1, Math.max(0, x)));
      pointerY.set(Math.min(1, Math.max(0, y)));
    };

    /**
     * Returns the card to its neutral orientation.
     */
    const handlePointerLeave = (): void => {
      pointerX.set(0.5);
      pointerY.set(0.5);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [enabled, pointerX, pointerY]);

  return (
    <motion.div
      ref={containerRef}
      style={{ rotateX, rotateY, transformPerspective: 900, willChange: "transform" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
