"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { TextScramble } from "@/components/motion/TextScramble";
import { TiltBezelCard } from "@/components/motion/TiltBezelCard";
import { useWalletGate } from "@/components/wallet/WalletGate";
import { useContractStats } from "@/hooks/useContractStats";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { CONTRACTS_CONFIGURED, VANE_ATTESTATION_REGISTRY_ADDRESS } from "@/lib/contracts";
import { setSpoofActive, setSolarAzimuth } from "@/lib/spoofState";

/**
 * Landing page hero with the live PINN instrument stack.
 */
export function Hero() {
  const router = useRouter();
  const { openWallet, isConnected } = useWalletGate();
  const [spoofed, setSpoofed] = useState(false);
  const { attestations, loading } = useContractStats();
  const mode = spoofed ? "spoof_scale" : "clean";
  const { data, loading: telemetryLoading } = useLiveTelemetry({
    lat: 40.8,
    lon: 29.43,
    kw: 1200,
    mode,
    refreshMs: 60000,
  });

  useEffect(() => {
    setSpoofActive(spoofed);
  }, [spoofed]);

  useEffect(() => {
    if (data) setSolarAzimuth(data.solarAzimuthDeg);
  }, [data]);

  /**
   * Toggles the live spoof simulation.
   */
  const handleSpoofToggle = (): void => {
    setSpoofed((current) => !current);
  };

  /**
   * Routes to the console when connected, otherwise opens the wallet modal.
   */
  const handlePrimary = (): void => {
    if (isConnected) {
      router.push("/app");
      return;
    }
    openWallet();
  };

  const waveform = useMemo(() => {
    const points = data?.series24h ?? [];
    if (points.length < 2) return { expected: "", reported: "" };
    const maximum = Math.max(
      ...points.map((point) => Math.max(point.expectedKw, point.reportedKw)),
      1,
    );
    const map = (value: number, index: number): string => {
      const x = (index / (points.length - 1)) * 220;
      const y = 42 - (value / maximum) * 36;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    return {
      expected: points.map((point, index) => map(point.expectedKw, index)).join(" "),
      reported: points.map((point, index) => map(point.reportedKw, index)).join(" "),
    };
  }, [data]);

  const residual = data?.residualSigma ?? 0;
  const status = data?.status ?? "calibrated";
  const spoofStatus = spoofed || status === "quarantined";

  return (
    <section
      id="calibration"
      className="relative w-full min-h-[100dvh] flex items-center pt-20 pb-12 md:pt-24 md:pb-16 z-[var(--z-content)]"
    >
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <motion.p
              initial={{ filter: "blur(8px)", opacity: 0, y: 12 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-[var(--accent)] mb-4"
            >
              PHYSICS + ZK CARBON PROTOCOL
            </motion.p>

            <h1
              aria-label="Verify carbon by physics, not trust"
              className="font-display font-extrabold uppercase text-[clamp(2.6rem,5.4vw,4.75rem)] leading-[0.94] tracking-[-0.025em] text-[var(--text-primary)] max-w-[16ch]"
            >
              {"VERIFY CARBON BY PHYSICS, NOT TRUST".split(" ").map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="inline-block mr-[0.24em]"
                  initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.65,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.2 + index * 0.06,
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ filter: "blur(8px)", opacity: 0, y: 16 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              className="mt-5 font-body text-base md:text-lg text-[var(--text-secondary)] leading-[1.55] max-w-[48ch]"
            >
              Vane cross-checks facility smart meters against live satellite weather, blocks spoofed
              power on-chain, and proves EU CBAM compliance without exposing supplier prices.
            </motion.p>

            <motion.div
              initial={{ filter: "blur(8px)", opacity: 0, y: 16 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <MagneticButton
                onClick={handlePrimary}
                className="group inline-flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] pl-6 pr-2 py-2 rounded-full font-mono text-xs md:text-sm font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {isConnected ? "OPEN CONSOLE" : "CONNECT WALLET"}
                <span className="w-8 h-8 rounded-full bg-[var(--on-accent)]/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M7 17L17 7M8 7h9v9"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </MagneticButton>

              <a
                href="#inspector"
                className="inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)]/80 text-[var(--text-primary)] px-6 py-3 rounded-full font-mono text-xs md:text-sm uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-150 min-h-[48px]"
              >
                INSPECT TELEMETRY
              </a>
            </motion.div>
          </div>

          <div className="lg:col-span-5 z-[var(--z-elevated)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <motion.div
                className="sm:col-span-2"
                initial={{ filter: "blur(10px)", opacity: 0, y: 24, scale: 0.97 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.38 }}
              >
                <TiltBezelCard className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
                  <div className="surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] shadow-[var(--shadow-bezel)] p-5">
                    <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[var(--border-subtle)]">
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        GEBZE MILL #04 · 40.80°N 29.43°E
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.14em] ${
                          spoofStatus
                            ? "bg-[var(--error-bg)] border border-[var(--error)]/40 text-[var(--error)]"
                            : "bg-[var(--success-bg)] border border-[var(--success)]/30 text-[var(--success)]"
                        }`}
                      >
                        {spoofStatus ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M12 4l9 16H3L12 4zM12 9v5M12 17h.01"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                        )}
                        {spoofStatus ? "QUARANTINED" : "CALIBRATED"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 divide-x divide-[var(--border-subtle)]">
                      <div>
                        <p className="font-mono text-[10px] text-[var(--text-muted)]">SATELLITE GHI</p>
                        {telemetryLoading ? (
                          <div className="mt-1 h-6 w-16 rounded bg-white/5 animate-shimmer" />
                        ) : (
                          <p className="font-mono text-base md:text-lg font-semibold text-[var(--text-primary)]">
                            {data ? Math.round(data.satelliteGhiWm2) : "--"} W/m²
                          </p>
                        )}
                      </div>
                      <div className="pl-3">
                        <p className="font-mono text-[10px] text-[var(--text-muted)]">METER OUTPUT</p>
                        {telemetryLoading ? (
                          <div className="mt-1 h-6 w-16 rounded bg-white/5 animate-shimmer" />
                        ) : (
                          <p className="font-mono text-base md:text-lg font-semibold text-[var(--text-primary)]">
                            {data ? Math.round(data.reportedKw) : "--"} kW
                          </p>
                        )}
                      </div>
                      <div className="pl-3">
                        <p className="font-mono text-[10px] text-[var(--text-muted)]">PINN RESIDUAL</p>
                        {telemetryLoading ? (
                          <div className="mt-1 h-6 w-16 rounded bg-white/5 animate-shimmer" />
                        ) : (
                          <p
                            className={`font-mono text-base md:text-lg font-semibold ${
                              spoofStatus ? "text-[var(--error)]" : "text-[var(--success)]"
                            }`}
                          >
                            {residual.toFixed(3)} σ
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <svg
                        viewBox="0 0 220 44"
                        className="h-11 w-32 shrink-0"
                        role="img"
                        aria-label="Expected physics curve against the reported inverter curve"
                      >
                        <polyline
                          points={waveform.expected}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                        <polyline
                          points={waveform.reported}
                          fill="none"
                          stroke={spoofStatus ? "var(--error)" : "var(--text-primary)"}
                          strokeWidth="1.4"
                        />
                      </svg>
                      <button
                        type="button"
                        onClick={handleSpoofToggle}
                        className={`min-h-[36px] px-3 py-1.5 rounded-full font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-150 ${
                          spoofed
                            ? "bg-[var(--error-bg)] border border-[var(--error)]/50 text-[var(--error)]"
                            : "bg-[var(--accent-glow)] border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
                        }`}
                      >
                        {spoofed ? "RESET METER STREAM" : "INJECT 1.4X SPOOF"}
                      </button>
                    </div>
                  </div>
                </TiltBezelCard>
              </motion.div>

              <motion.div
                initial={{ filter: "blur(10px)", opacity: 0, y: 24, scale: 0.97 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              >
                <TiltBezelCard className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
                  <div className="surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] shadow-[var(--shadow-bezel)] p-4 flex flex-col justify-between min-h-[156px]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      NOIR ZK WITNESS
                    </p>
                    <div className="space-y-2 my-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Invoice price</span>
                        <TextScramble
                          text="REDACTED"
                          speed={30}
                          className="font-mono text-[var(--accent)]"
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">CBAM intensity</span>
                        <span className="font-mono text-[var(--success)]">1.42 tCO2e/t</span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--text-muted)]">
                      UBL 2.1 · ZERO PRICE LEAK
                    </p>
                  </div>
                </TiltBezelCard>
              </motion.div>

              <motion.div
                initial={{ filter: "blur(10px)", opacity: 0, y: 24, scale: 0.97 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.62 }}
              >
                <TiltBezelCard className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
                  <div className="surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] shadow-[var(--shadow-bezel)] p-4 flex flex-col justify-between min-h-[156px]">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        ETH SEPOLIA
                      </p>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          CONTRACTS_CONFIGURED ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"
                        }`}
                      />
                    </div>
                    {loading ? (
                      <div className="h-9 w-16 rounded bg-white/5 animate-shimmer" />
                    ) : (
                      <div>
                        <p className="font-display text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
                          {attestations ?? "--"}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] mt-1">
                          ATTESTATIONS SEALED
                        </p>
                      </div>
                    )}
                    {VANE_ATTESTATION_REGISTRY_ADDRESS ? (
                      <a
                        href={`https://sepolia.etherscan.io/address/${VANE_ATTESTATION_REGISTRY_ADDRESS}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--accent)] hover:underline"
                      >
                        VIEW CONTRACT
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h4"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    ) : (
                      <p className="font-mono text-[10px] text-[var(--text-muted)]">
                        DEPLOYMENT PENDING
                      </p>
                    )}
                  </div>
                </TiltBezelCard>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
