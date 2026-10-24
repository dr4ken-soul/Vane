"use client";

import { useEffect, useRef } from "react";
import { spoofState, subscribeSpoofState } from "@/lib/spoofState";

/**
 * Props accepted by the procedural canvas.
 */
interface VaneFieldProps {
  /** Sections that keep the field at full intensity when visible. */
  brightSections?: string[];
}

/**
 * Procedural atmospheric vector calibration canvas.
 *
 * The field draws hairline calibration vanes whose orientation follows the live solar azimuth,
 * bends around the pointer and destabilises while a spoofed meter packet is injected. Rendering
 * runs entirely on the animation frame loop without any React state updates.
 */
export function VaneField({ brightSections = ["calibration", "dispatch"] }: VaneFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const opacityRef = useRef(1);
  const spoofRef = useRef(spoofState.active);
  const azimuthRef = useRef(spoofState.azimuthDeg);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /**
     * Computes the grid geometry for the current viewport.
     *
     * @returns The column count, row count and node spacing.
     */
    const readGeometry = (): { columns: number; rows: number; stepX: number; stepY: number } => {
      const mobile = window.innerWidth < 768;
      const columns = mobile ? 14 : 28;
      const rows = mobile ? 10 : 16;
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      return {
        columns,
        rows,
        stepX: width / (columns + 1),
        stepY: height / (rows + 1),
      };
    };

    /**
     * Resizes the backing store to the display density of the screen.
     */
    const resize = (): void => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(wrapper.clientWidth * ratio);
      canvas.height = Math.floor(wrapper.clientHeight * ratio);
      canvas.style.width = `${wrapper.clientWidth}px`;
      canvas.style.height = `${wrapper.clientHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    const geometry = readGeometry();

    /**
     * Draws one frame of the calibration field.
     *
     * @param time Animation timestamp in milliseconds.
     */
    const draw = (time: number): void => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      const seconds = time / 1000;
      const baseAzimuth = (azimuthRef.current * Math.PI) / 180;
      const pointer = pointerRef.current;
      const spoofed = spoofRef.current;

      context.clearRect(0, 0, width, height);

      for (let row = 0; row < geometry.rows; row += 1) {
        for (let column = 0; column < geometry.columns; column += 1) {
          const gx = (column + 1) * geometry.stepX;
          const gy = (row + 1) * geometry.stepY;

          let angle =
            baseAzimuth +
            Math.sin(gx * 0.004 + seconds * 0.35) * 0.28 +
            Math.cos(gy * 0.004 - seconds * 0.25) * 0.22;

          if (spoofed) {
            angle += Math.sin(gx * 0.021 + seconds * 5.4) * 0.75 + Math.cos(gy * 0.019 - seconds * 4.1) * 0.55;
          }

          let highlight = 0;
          const dx = pointer.x - gx;
          const dy = pointer.y - gy;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 220) {
            const falloff = (1 - distance / 220) * 0.55;
            const pointerAngle = Math.atan2(dy, dx);
            angle = angle * (1 - falloff) + pointerAngle * falloff;
            highlight = 1 - distance / 220;
          }

          const length = 14;
          const endX = gx + Math.cos(angle) * length;
          const endY = gy + Math.sin(angle) * length;

          if (spoofed) {
            context.strokeStyle = `rgba(242, 85, 90, ${0.08 + highlight * 0.3})`;
          } else if (highlight > 0) {
            context.strokeStyle = `rgba(240, 165, 0, ${0.11 + highlight * 0.31})`;
          } else {
            context.strokeStyle = "rgba(241, 243, 245, 0.11)";
          }

          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(gx, gy);
          context.lineTo(endX, endY);
          context.stroke();

          context.fillStyle = spoofed
            ? `rgba(242, 85, 90, ${0.16 + highlight * 0.22})`
            : `rgba(241, 243, 245, ${0.14 + highlight * 0.3})`;
          context.beginPath();
          context.arc(gx, gy, 1.5, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    /**
     * Runs the animation loop.
     *
     * @param time Animation timestamp in milliseconds.
     */
    const loop = (time: number): void => {
      draw(time);
      frameRef = requestAnimationFrame(loop);
    };

    let frameRef = 0;
    if (reducedMotion) {
      draw(0);
    } else {
      frameRef = requestAnimationFrame(loop);
    }

    /**
     * Tracks the pointer position used for the airflow deflection.
     *
     * @param event The pointer event.
     */
    const handlePointerMove = (event: PointerEvent): void => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    /**
     * Recomputes the grid after a viewport resize.
     */
    const handleResize = (): void => {
      resize();
      const next = readGeometry();
      geometry.columns = next.columns;
      geometry.rows = next.rows;
      geometry.stepX = next.stepX;
      geometry.stepY = next.stepY;
    };

    /**
     * Modulates the field opacity based on the visible section.
     */
    const handleVisibility = (): void => {
      const ids = [...brightSections];
      let bright = false;
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.15) {
          bright = true;
          break;
        }
      }
      opacityRef.current = bright ? 1 : 0.35;
      wrapper.style.opacity = `${opacityRef.current}`;
    };

    const unsubscribe = subscribeSpoofState(() => {
      spoofRef.current = spoofState.active;
    });

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleVisibility, { passive: true });
    handleVisibility();

    return () => {
      if (frameRef) cancelAnimationFrame(frameRef);
      unsubscribe();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleVisibility);
    };
  }, [brightSections]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-[var(--z-canvas)] transition-opacity duration-500"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
