"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { TiltBezelCard } from "@/components/motion/TiltBezelCard";
import { useWalletGate } from "@/components/wallet/WalletGate";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { hashMeterId } from "@/lib/noir/taxIdHash";

/**
 * Facility presets offered by the physics meter guard.
 */
const FACILITIES = [
  {
    id: "antalya",
    name: "Antalya Solar Park",
    detail: "36.90 N · 30.71 E · 8,400 kWp",
    lat: 36.8969,
    lon: 30.7133,
    kw: 8400,
    meterId: "ANTALYA-SOLAR-PARK-PV",
  },
  {
    id: "gebze",
    name: "Gebze Arc Furnace Rooftop",
    detail: "40.80 N · 29.43 E · 1,200 kWp",
    lat: 40.8,
    lon: 29.43,
    kw: 1200,
    meterId: "GEBZE-M04-ROOFTOP-PV",
  },
  {
    id: "izmir",
    name: "Izmir Wind Sub-Meter",
    detail: "38.42 N · 27.14 E · 3,200 kWp",
    lat: 38.4237,
    lon: 27.1428,
    kw: 3200,
    meterId: "IZMIR-WIND-SUB-01",
  },
] as const;

/**
 * Attack modes injected into the physics meter guard.
 */
const ATTACKS = [
  { id: "clean", label: "Clean telemetry", mode: "clean" },
  { id: "scale", label: "1.4x multiplier spoof", mode: "spoof_scale" },
  { id: "replay", label: "Night replay trace", mode: "spoof_replay" },
] as const;

type FacilityId = (typeof FACILITIES)[number]["id"];
type AttackId = (typeof ATTACKS)[number]["id"];

/**
 * Tabbed explorer that runs the two verification engines side by side.
 *
 * Engine one streams live Open-Meteo physics for a chosen facility and renders the exact Sepolia
 * call that a spoofed interval would trigger. Engine two contrasts the private UBL witness with the
 * four public values that reach calldata.
 */
export function DualEngineInspector() {
  const router = useRouter();
  const { openWallet, isConnected } = useWalletGate();
  const [engine, setEngine] = useState<"pinn" | "noir">("pinn");
  const [facilityId, setFacilityId] = useState<FacilityId>("gebze");
  const [attackId, setAttackId] = useState<AttackId>("clean");

  const facility = FACILITIES.find((entry) => entry.id === facilityId) ?? FACILITIES[1];
  const attack = ATTACKS.find((entry) => entry.id === attackId) ?? ATTACKS[0];
  const { data, loading, error } = useLiveTelemetry({
    lat: facility.lat,
    lon: facility.lon,
    kw: facility.kw,
    mode: attack.mode,
    refreshMs: 60000,
  });

  const spoofed = attackId !== "clean";
  const quarantined = spoofed || data?.status === "quarantined";
  const meterHash = useMemo(() => hashMeterId(facility.meterId), [facility.meterId]);
  const suspectRoot = useMemo(
    () => `0x${"00".repeat(28)}${Math.round((data?.residualBps ?? 0) || 0).toString(16).padStart(8, "0")}` as `0x${string}`,
    [data?.residualBps],
  );

  /**
   * Opens the full browser prover, gating on the wallet session first.
   */
  const handleLaunch = (): void => {
    if (isConnected) {
      router.push("/app/attest/new");
      return;
    }
    openWallet();
  };

  return (
    <section
      id="inspector"
      className="relative w-full py-24 md:py-32 bg-[var(--bg-secondary)] z-[var(--z-content)]"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <motion.div
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-[-0.02em] leading-[0.98] text-[var(--text-primary)]">
            Two verifiers, one continuous proof
          </h2>
          <p className="mt-4 font-body text-base md:text-lg text-[var(--text-secondary)] max-w-[58ch] leading-relaxed">
            Test how physical telemetry verification feeds straight into client-side zero-knowledge
            customs attestation.
          </p>
        </motion.div>

        <div className="mt-10 flex gap-2 border-b border-[var(--border-default)] overflow-x-auto">
          <button
            type="button"
            role="tab"
            aria-selected={engine === "pinn"}
            aria-controls="panel-pinn"
            onClick={() => setEngine("pinn")}
            className={`px-5 py-3.5 font-mono text-xs md:text-sm uppercase tracking-[0.12em] whitespace-nowrap min-h-[44px] transition-colors duration-150 ${
              engine === "pinn"
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Engine 1: Physics meter guard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={engine === "noir"}
            aria-controls="panel-noir"
            onClick={() => setEngine("noir")}
            className={`px-5 py-3.5 font-mono text-xs md:text-sm uppercase tracking-[0.12em] whitespace-nowrap min-h-[44px] transition-colors duration-150 ${
              engine === "noir"
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Engine 2: Browser ZK CBAM prover
          </button>
        </div>

        <AnimatePresence mode="wait">
          {engine === "pinn" ? (
            <motion.div
              key="pinn"
              id="panel-pinn"
              role="tabpanel"
              initial={{ opacity: 0, filter: "blur(6px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              <div className="lg:col-span-5">
                <h3 className="font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)]">
                  Catch compromised meters before minting
                </h3>
                <p className="mt-4 font-body text-base text-[var(--text-secondary)] leading-relaxed max-w-[50ch]">
                  Every smart-meter interval is evaluated against live satellite solar irradiance,
                  ambient temperature, and cloud-shadow transit lag across nearby arrays.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Cross-checks kW output against live Open-Meteo shortwave irradiance and cell thermal drift",
                    "Detects scale-up multipliers, nighttime replay traces, and synthetic flatline packets in under 200ms",
                    "Writes hourly Merkle energy roots and automatically quarantines spoofed device keys on Sepolia",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 font-body text-sm text-[var(--text-secondary)] leading-relaxed">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[var(--accent)]"
                      >
                        <path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 z-[var(--z-elevated)]">
                <TiltBezelCard className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
                  <div className="rounded-[10px] bg-[var(--bg-primary)] p-5 md:p-6">
                    <div className="flex flex-wrap gap-2">
                      {FACILITIES.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setFacilityId(entry.id)}
                          aria-pressed={facilityId === entry.id}
                          className={`px-3 py-2 rounded-full font-mono text-[10px] md:text-[11px] uppercase tracking-[0.1em] border transition-colors duration-150 min-h-[36px] ${
                            facilityId === entry.id
                              ? "border-[var(--accent)]/50 bg-[var(--accent-glow)] text-[var(--accent)]"
                              : "border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          {entry.name}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
                      {ATTACKS.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setAttackId(entry.id)}
                          aria-pressed={attackId === entry.id}
                          className={`px-3 py-2 rounded-full font-mono text-[10px] md:text-[11px] uppercase tracking-[0.1em] border transition-colors duration-150 min-h-[36px] ${
                            attackId === entry.id
                              ? entry.id === "clean"
                                ? "border-[var(--success)]/50 bg-[var(--success-bg)] text-[var(--success)]"
                                : "border-[var(--error)]/50 bg-[var(--error-bg)] text-[var(--error)]"
                              : "border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          {entry.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[var(--border-subtle)] pt-5">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Satellite GHI
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                          {loading ? "--" : `${Math.round(data?.satelliteGhiWm2 ?? 0)} W/m²`}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Expected
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                          {loading ? "--" : `${Math.round(data?.expectedKw ?? 0)} kW`}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Meter
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                          {loading ? "--" : `${Math.round(data?.reportedKw ?? 0)} kW`}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Residual
                        </p>
                        <p
                          className={`mt-1 font-mono text-sm font-semibold tabular-nums ${
                            quarantined ? "text-[var(--error)]" : "text-[var(--success)]"
                          }`}
                        >
                          {loading ? "--" : `${(data?.residualSigma ?? 0).toFixed(3)} σ`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Sepolia call
                        </p>
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                            quarantined ? "text-[var(--error)]" : "text-[var(--success)]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              quarantined ? "bg-[var(--error)]" : "bg-[var(--success)]"
                            }`}
                          />
                          {quarantined ? "Quarantine ready" : "Within clean band"}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-[10px] md:text-[11px] text-[var(--text-secondary)] break-all">
                        {`reportAndQuarantine(${meterHash.slice(0, 10)}..., ${suspectRoot.slice(0, 10)}..., ${data?.residualBps ?? 0})`}
                      </p>
                    </div>

                    {error ? (
                      <p className="mt-3 font-body text-xs text-[var(--error)]">{error}</p>
                    ) : (
                      <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
                        Readings refresh from Open-Meteo every sixty seconds for {facility.detail}.
                      </p>
                    )}
                  </div>
                </TiltBezelCard>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="noir"
              id="panel-noir"
              role="tabpanel"
              initial={{ opacity: 0, filter: "blur(6px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              <div className="lg:col-span-5">
                <h3 className="font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)]">
                  Prove CBAM thresholds with zero commercial leak
                </h3>
                <p className="mt-4 font-body text-base text-[var(--text-secondary)] leading-relaxed max-w-[50ch]">
                  Suppliers drop in standard UBL 2.1 XML e-invoices. An UltraHonk circuit runs inside
                  WebAssembly in the browser so pricing and tax IDs never leave local memory.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Verifies clean-energy allocation against an un-quarantined facility root on VaneMeterOracle",
                    "Proves embedded emissions stay below the declared EU CBAM ceiling per tonne of steel, cement, or aluminium",
                    "Publishes a Poseidon2 nullifier on Sepolia so no invoice or clean MWh batch can ever be counted twice",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 font-body text-sm text-[var(--text-secondary)] leading-relaxed">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[var(--accent)]"
                      >
                        <path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 z-[var(--z-elevated)]">
                <TiltBezelCard className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
                  <div className="rounded-[10px] bg-[var(--bg-primary)] overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
                      <div className="p-5 md:p-6">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--error)]">
                          Private witness · Browser RAM only
                        </p>
                        <div className="mt-4 space-y-2.5 font-mono text-[11px] md:text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">UnitPrice</span>
                            <span className="text-[var(--text-primary)]">642.50 EUR</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">SupplierTIN</span>
                            <span className="text-[var(--text-primary)]">TR-4810923811</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">BatchKWh</span>
                            <span className="text-[var(--text-primary)]">41,800</span>
                          </div>
                        </div>
                        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--error)]">
                          Never transmitted
                        </p>
                      </div>

                      <div className="p-5 md:p-6">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--success)]">
                          Public proof · Sepolia calldata
                        </p>
                        <div className="mt-4 space-y-2.5 font-mono text-[11px] md:text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">FacilityRoot</span>
                            <span className="text-[var(--text-primary)]">0x0e89...4f02</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">NullifierHash</span>
                            <span className="text-[var(--text-primary)]">0x15a4...4aea</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">MaxIntensity</span>
                            <span className="text-[var(--text-primary)]">1.45 tCO2e/t</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-muted)]">Result</span>
                            <span className="text-[var(--success)]">VERIFIED</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleLaunch}
                          className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] px-4 py-2.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
                        >
                          Open full prover in console
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M7 17L17 7M8 7h9v9"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </TiltBezelCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
