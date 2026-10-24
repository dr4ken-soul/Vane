"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Props accepted by the magnetic button.
 */
interface MagneticButtonProps {
  /** Button content. */
  children: ReactNode;
  /** Called when the button is activated. */
  onClick?: () => void;
  /** Optional additional class names. */
  className?: string;
  /** Maximum pull distance in pixels. */
  strength?: number;
  /** Accessible label when the visible label is decorative. */
  ariaLabel?: string;
  /** Button type attribute. */
  type?: "button" | "submit";
}

/**
 * Primary call to action with a magnetic pull towards the pointer.
 *
 * The pull is capped at a few pixels and returns to the neutral position when the pointer leaves.
 */
export function MagneticButton({
  children,
  onClick,
  className = "",
  strength = 5,
  ariaLabel,
  type = "button",
}: MagneticButtonProps) {
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const springX = useSpring(offsetX, { stiffness: 220, damping: 18 });
  const springY = useSpring(offsetY, { stiffness: 220, damping: 18 });

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    /**
     * Pulls the button towards the pointer within the button bounds.
     *
     * @param event The pointer event.
     */
    const handlePointerMove = (event: PointerEvent): void => {
      const rect = element.getBoundingClientRect();
      const relativeX = event.clientX - (rect.left + rect.width / 2);
      const relativeY = event.clientY - (rect.top + rect.height / 2);
      offsetX.set(Math.max(-strength, Math.min(strength, relativeX * 0.35)));
      offsetY.set(Math.max(-strength, Math.min(strength, relativeY * 0.35)));
    };

    /**
     * Returns the button to its neutral position.
     */
    const handlePointerLeave = (): void => {
      offsetX.set(0);
      offsetY.set(0);
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [offsetX, offsetY, strength]);

  /**
   * Triggers the button action.
   */
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      aria-label={ariaLabel}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
