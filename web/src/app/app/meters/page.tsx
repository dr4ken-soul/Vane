"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { keccak256, toHex, type Hex } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import {
  CONTRACTS_CONFIGURED,
  VANE_METER_ORACLE_ABI,
  VANE_METER_ORACLE_ADDRESS,
} from "@/lib/contracts";

/**
 * Facility preset used by the meter guard console.
 */
interface FacilityPreset {
  /** Preset identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Facility latitude in decimal degrees. */
  lat: number;
  /** Facility longitude in decimal degrees. */
  lon: number;
  /** Rated capacity in kilowatts. */
  kw: number;
  /** Facility smart meter code. */
  meterCode: string;
  /** Short description of the generation asset. */
  asset: string;
}

/**
 * Facility presets shown above the live telemetry table.
 */
const FACILITY_PRESETS: FacilityPreset[] = [
  {
    id: "gebze",
    name: "Gebze Steel Works",
    lat: 40.8,
    lon: 29.43,
    kw: 1200,
    meterCode: "GEBZE-M04-ROOFTOP-PV",
    asset: "Rooftop photovoltaic array, rolling line 2",
  },
  {
    id: "antalya",
    name: "Antalya Solar Array",
    lat: 36.89,
    lon: 30.71,
    kw: 4800,
    meterCode: "ANTALYA-PPA-ARRAY-01",
    asset: "Utility scale photovoltaic PPA, block A",
  },
  {
    id: "iskenderun",
    name: "Iskenderun Aluminium Mill",
    lat: 36.58,
    lon: 36.17,
    kw: 2200,
    meterCode: "ISKENDERUN-AL-PV-02",
    asset: "On site photovoltaic canopy, billet furnace",
  },
];

/**
 * Result returned by the meter verification route.
 */
interface VerifiedBatch {
  /** Clean or quarantined classification. */
  status: "calibrated" | "quarantined";
  /** Worst normalised residual in the window. */
  maxSigma: number;
  /** Worst residual in basis points. */
  residualBps: number;
  /** Poseidon2 allocation root. */
  merkleRoot: Hex;
  /** Clean energy in the window. */
  cleanKwh: number;
  /** Window start as a unix timestamp. */
  windowStart: number;
  /** Window end as a unix timestamp. */
  windowEnd: number;
  /** Meter identifier echoed by the route. */
  meterId: string;
}

/**
 * Returns the current UTC hour as an Open-Meteo style timestamp.
 *
 * @returns The ISO hour without a timezone suffix.
 */
function currentHourIso(): string {
  return new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString().slice(0, 13);
}

/**
 * Hashes a facility meter code into the bytes32 identifier used on chain.
 *
 * @param meterCode Human readable meter code.
 * @returns The meter identifier hash.
 */
function hashMeterCode(meterCode: string): Hex {
  return keccak256(toHex(meterCode));
}

/**
 * Formats a unix timestamp as a British date and time.
 *
 * @param timestamp Unix timestamp in seconds.
 * @returns The formatted date.
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/**
 * Formats an hourly series label.
 *
 * @param value Open-Meteo hour label.
 * @returns The short time label.
 */
function formatHour(value: string): string {
  return value.slice(11, 16);
}

/**
 * Live physics meter guard console.
 */
export default function MeterGuardPage() {
  const { isConnected } = useAccount();
  const [preset, setPreset] = useState<FacilityPreset>(FACILITY_PRESETS[0]);
  const [latitudeDraft, setLatitudeDraft] = useState(String(FACILITY_PRESETS[0].lat));
  const [longitudeDraft, setLongitudeDraft] = useState(String(FACILITY_PRESETS[0].lon));
  const [capacityDraft, setCapacityDraft] = useState(String(FACILITY_PRESETS[0].kw));
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const [appliedCoordinates, setAppliedCoordinates] = useState({
    lat: FACILITY_PRESETS[0].lat,
    lon: FACILITY_PRESETS[0].lon,
    kw: FACILITY_PRESETS[0].kw,
  });
  const [spoofMode, setSpoofMode] = useState<"scale" | "replay">("scale");
  const [batch, setBatch] = useState<VerifiedBatch | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const { data: telemetry, loading, error, refresh } = useLiveTelemetry({
    lat: appliedCoordinates.lat,
    lon: appliedCoordinates.lon,
    kw: appliedCoordinates.kw,
    refreshMs: 60000,
  });

  const meterId = useMemo(() => hashMeterCode(preset.meterCode), [preset.meterCode]);

  const {
    writeContract: anchorRoot,
    data: anchorHash,
    isPending: anchoring,
    error: anchorError,
    reset: resetAnchor,
  } = useWriteContract();

  const {
    writeContract: quarantineInterval,
    data: quarantineHash,
    isPending: quarantining,
    error: quarantineError,
    reset: resetQuarantine,
  } = useWriteContract();

  const { isLoading: anchorConfirming, isSuccess: anchorConfirmed } =
    useWaitForTransactionReceipt({ hash: anchorHash });

  const { isLoading: quarantineConfirming, isSuccess: quarantineConfirmed } =
    useWaitForTransactionReceipt({ hash: quarantineHash });

  /**
   * Scores the latest clean hour against the live satellite physics feed.
   */
  const refreshBatch = useCallback(async () => {
    const hourIso = currentHourIso();
    const windowEnd = Math.floor(Date.now() / 3600000) * 3600;
    const reported = telemetry?.reportedKw ?? 0;

    setBatchLoading(true);
    try {
      const response = await fetch("/api/telemetry/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          meterId: preset.meterCode,
          lat: appliedCoordinates.lat,
          lon: appliedCoordinates.lon,
          ratedKw: appliedCoordinates.kw,
          intervals: [{ ts: hourIso, kw: reported }],
          windowEnd,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setBatchError(payload.error ?? "The meter batch could not be scored.");
        return;
      }
      const payload = (await response.json()) as VerifiedBatch;
      setBatch(payload);
      setBatchError(null);
    } catch {
      setBatchError("The meter verification route is unreachable. Retry in a moment.");
    } finally {
      setBatchLoading(false);
    }
  }, [appliedCoordinates.kw, appliedCoordinates.lat, appliedCoordinates.lon, preset.meterCode, telemetry?.reportedKw]);

  useEffect(() => {
    void refreshBatch();
  }, [refreshBatch]);

  /**
   * Applies a facility preset and resets the custom coordinate drafts.
   *
   * @param next Selected preset.
   */
  const applyPreset = (next: FacilityPreset): void => {
    setPreset(next);
    setLatitudeDraft(String(next.lat));
    setLongitudeDraft(String(next.lon));
    setCapacityDraft(String(next.kw));
    setAppliedCoordinates({ lat: next.lat, lon: next.lon, kw: next.kw });
    setCoordinateError(null);
    resetAnchor();
    resetQuarantine();
    setBatch(null);
  };

  /**
   * Validates the custom coordinate form with recovery instructions.
   */
  const applyCustomCoordinates = (): void => {
    const latitude = Number.parseFloat(latitudeDraft);
    const longitude = Number.parseFloat(longitudeDraft);
    const capacity = Number.parseFloat(capacityDraft);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setCoordinateError(
        "Facility latitude must be a decimal degree value between -90 and 90. Negative values are south of the equator.",
      );
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setCoordinateError(
        "Facility longitude must be a decimal degree value between -180 and 180. Negative values are west of Greenwich.",
      );
      return;
    }
    if (!Number.isFinite(capacity) || capacity <= 0) {
      setCoordinateError(
        "Rated capacity must be a positive number of kilowatts for the generation asset.",
      );
      return;
    }

    setCoordinateError(null);
    setAppliedCoordinates({ lat: latitude, lon: longitude, kw: capacity });
    resetAnchor();
    resetQuarantine();
    setBatch(null);
  };

  /**
   * Anchors the verified Poseidon2 clean energy root on Sepolia.
   */
  const handleAnchor = (): void => {
    if (!VANE_METER_ORACLE_ADDRESS || !batch) return;
    resetQuarantine();
    anchorRoot({
      address: VANE_METER_ORACLE_ADDRESS,
      abi: VANE_METER_ORACLE_ABI,
      functionName: "submitHourlyRoot",
      args: [
        batch.merkleRoot,
        meterId,
        BigInt(batch.windowStart),
        BigInt(batch.windowEnd),
        batch.residualBps,
      ],
    });
  };

  /**
   * Reports a spoofed telemetry packet and quarantines it on Sepolia.
   */
  const handleQuarantine = (): void => {
    if (!VANE_METER_ORACLE_ADDRESS) return;
    resetAnchor();

    const windowEnd = Math.floor(Date.now() / 3600000) * 3600;
    const residualBps = telemetry
      ? Math.max(telemetry.residualBps, spoofMode === "scale" ? 4800 : 3720)
      : 4800;
    const suspectRoot = keccak256(
      toHex(`vane:spoof:${preset.meterCode}:${spoofMode}:${windowEnd}`),
    );

    quarantineInterval({
      address: VANE_METER_ORACLE_ADDRESS,
      abi: VANE_METER_ORACLE_ABI,
      functionName: "reportAndQuarantine",
      args: [meterId, suspectRoot, residualBps],
    });
  };

  const cleanEnough = (batch?.residualBps ?? Number.POSITIVE_INFINITY) <= 1200;
  const series = telemetry?.series24h ?? [];
  const currentResidual = telemetry?.residualSigma ?? 0;
  const calibrated = (telemetry?.status ?? "calibrated") === "calibrated";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
            Live physics guard
          </p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold uppercase tracking-[-0.01em] text-[var(--text-primary)]">
            Meter telemetry against satellite irradiance
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--text-secondary)] max-w-[62ch]">
            Open-Meteo supplies the irradiance, ambient temperature, cloud cover and wind vector for
            the selected coordinates. The PINN residual model scores every hour before any root can
            be anchored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            refresh();
            void refreshBatch();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-150 min-h-[40px]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 11a8 8 0 10-2.3 6.4M20 5v6h-6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh satellite read
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2" role="group" aria-label="Facility presets">
        {FACILITY_PRESETS.map((entry) => {
          const active = entry.id === preset.id;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={active}
              onClick={() => applyPreset(entry)}
              className={`text-left px-4 py-3 rounded-[10px] border transition-colors duration-150 min-h-[64px] ${
                active
                  ? "border-[var(--accent)]/40 bg-[var(--accent-glow)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)]"
              }`}
            >
              <span
                className={`block font-mono text-[11px] uppercase tracking-[0.12em] ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                }`}
              >
                {entry.name}
              </span>
              <span className="mt-1 block font-body text-[11px] text-[var(--text-muted)]">
                {entry.asset}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
        <div className="rounded-[10px] bg-[var(--bg-secondary)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-bold uppercase text-[var(--text-primary)]">
              Custom facility coordinates
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Meter {preset.meterCode}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Facility latitude (decimal degrees, negative for south)
              </span>
              <input
                type="number"
                step="0.0001"
                value={latitudeDraft}
                onChange={(event) => setLatitudeDraft(event.target.value)}
                onBlur={applyCustomCoordinates}
                className="mt-1.5 w-full bg-[var(--bg-primary)] border border-[var(--border-default)] focus:border-[var(--accent)] rounded-[10px] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none min-h-[44px]"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Facility longitude (decimal degrees, negative for west)
              </span>
              <input
                type="number"
                step="0.0001"
                value={longitudeDraft}
                onChange={(event) => setLongitudeDraft(event.target.value)}
                onBlur={applyCustomCoordinates}
                className="mt-1.5 w-full bg-[var(--bg-primary)] border border-[var(--border-default)] focus:border-[var(--accent)] rounded-[10px] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none min-h-[44px]"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Rated capacity (kilowatts)
              </span>
              <input
                type="number"
                step="10"
                min="1"
                value={capacityDraft}
                onChange={(event) => setCapacityDraft(event.target.value)}
                onBlur={applyCustomCoordinates}
                className="mt-1.5 w-full bg-[var(--bg-primary)] border border-[var(--border-default)] focus:border-[var(--accent)] rounded-[10px] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none min-h-[44px]"
              />
            </label>
          </div>

          <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
            Coordinates fetch live shortwave irradiance from Open-Meteo. Validation runs when the
            field loses focus.
          </p>

          {coordinateError ? (
            <p className="mt-2 font-body text-xs text-[var(--error)]">{coordinateError}</p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-3 font-body text-xs text-[var(--error)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-default)] border-y border-[var(--border-default)] py-5">
        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Satellite irradiance
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-20 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p className="mt-2 font-display text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
              {telemetry?.satelliteGhiWm2.toFixed(0) ?? "--"}{" "}
              <span className="font-mono text-[11px] tracking-normal text-[var(--text-muted)]">
                W/m2
              </span>
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            DNI {telemetry?.satelliteDniWm2.toFixed(0) ?? "--"} W/m2
          </p>
        </div>

        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Expected output
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-20 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p className="mt-2 font-display text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
              {telemetry?.expectedKw.toFixed(1) ?? "--"}{" "}
              <span className="font-mono text-[11px] tracking-normal text-[var(--text-muted)]">
                kW
              </span>
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            Reported {telemetry?.reportedKw.toFixed(1) ?? "--"} kW
          </p>
        </div>

        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Physics residual
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-20 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p
              className={`mt-2 font-display text-2xl md:text-3xl font-extrabold leading-none tabular-nums ${
                calibrated ? "text-[var(--success)]" : "text-[var(--error)]"
              }`}
            >
              {currentResidual.toFixed(3)} sigma
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            Clean ceiling 0.120 sigma
          </p>
        </div>

        <div className="px-3 lg:px-5 py-3 lg:py-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Batch classification
          </p>
          {batchLoading ? (
            <div className="mt-2 h-8 w-24 rounded bg-white/5 animate-shimmer" />
          ) : (
            <p
              className={`mt-2 font-display text-2xl md:text-3xl font-extrabold leading-none uppercase ${
                cleanEnough ? "text-[var(--success)]" : "text-[var(--error)]"
              }`}
            >
              {cleanEnough ? "Clean" : "Quarantine"}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            {batch ? `${(batch.residualBps / 10000).toFixed(3)} sigma worst hour` : "Scoring window"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
              Twenty four hour telemetry stream
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {appliedCoordinates.lat.toFixed(2)}, {appliedCoordinates.lon.toFixed(2)}
            </span>
          </div>

          {loading && series.length === 0 ? (
            <div className="mt-4 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="h-12 animate-shimmer bg-white/[0.03]" />
              ))}
            </div>
          ) : series.length === 0 ? (
            <div className="mt-4 border-y border-[var(--border-subtle)] py-10 text-center">
              <p className="font-body text-sm text-[var(--text-secondary)]">
                The satellite feed returned no hourly irradiance for these coordinates yet.
              </p>
              <button
                type="button"
                onClick={refresh}
                className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
              >
                Retry the satellite read
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-y border-[var(--border-subtle)]">
                <thead>
                  <tr className="text-left">
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Hour
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      GHI
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Expected
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Reported
                    </th>
                    <th className="py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Residual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {series.map((point) => (
                    <tr
                      key={point.time}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                        {formatHour(point.time)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                        {point.ghiWm2.toFixed(0)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-primary)] tabular-nums">
                        {point.expectedKw.toFixed(1)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-primary)] tabular-nums">
                        {point.reportedKw.toFixed(1)}
                      </td>
                      <td className="py-2.5 font-mono text-xs tabular-nums">
                        <span
                          className={
                            point.sigma <= 0.12 ? "text-[var(--success)]" : "text-[var(--error)]"
                          }
                        >
                          {point.sigma.toFixed(3)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
            Sepolia settlement
          </h3>
          <div className="mt-4 p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
            <div className="rounded-[10px] bg-[var(--bg-secondary)] p-4">
              <dl className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Meter hash
                  </dt>
                  <dd className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {meterId.slice(0, 10)}...{meterId.slice(-6)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Clean kWh
                  </dt>
                  <dd className="font-mono text-[10px] text-[var(--text-secondary)] tabular-nums">
                    {batch ? batch.cleanKwh.toFixed(3) : "--"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Window end
                  </dt>
                  <dd className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {batch ? formatTimestamp(batch.windowEnd) : "--"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Allocation root
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-[var(--text-primary)]">
                  {batch?.merkleRoot ?? "Not scored yet"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAnchor}
                disabled={
                  !isConnected ||
                  !CONTRACTS_CONFIGURED ||
                  !cleanEnough ||
                  !batch ||
                  anchoring ||
                  anchorConfirming
                }
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--on-accent)] px-4 py-2.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
              >
                {anchoring || anchorConfirming ? "Anchoring root" : "Anchor clean Merkle root"}
              </button>

              <button
                type="button"
                onClick={handleQuarantine}
                disabled={
                  !isConnected ||
                  !CONTRACTS_CONFIGURED ||
                  quarantining ||
                  quarantineConfirming
                }
                className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-[var(--error-bg)] hover:bg-[#f2555a]/20 border border-[var(--error)]/30 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--error)] px-4 py-2.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
              >
                {quarantining || quarantineConfirming
                  ? "Reporting spoof"
                  : "Inject spoof and test quarantine"}
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Spoof packet type">
                <button
                  type="button"
                  aria-pressed={spoofMode === "scale"}
                  onClick={() => setSpoofMode("scale")}
                  className={`py-2 rounded-[10px] border font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-150 min-h-[40px] ${
                    spoofMode === "scale"
                      ? "border-[var(--error)]/40 bg-[var(--error-bg)] text-[var(--error)]"
                      : "border-[var(--border-default)] text-[var(--text-secondary)]"
                  }`}
                >
                  1.4x multiplier
                </button>
                <button
                  type="button"
                  aria-pressed={spoofMode === "replay"}
                  onClick={() => setSpoofMode("replay")}
                  className={`py-2 rounded-[10px] border font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-150 min-h-[40px] ${
                    spoofMode === "replay"
                      ? "border-[var(--error)]/40 bg-[var(--error-bg)] text-[var(--error)]"
                      : "border-[var(--border-default)] text-[var(--text-secondary)]"
                  }`}
                >
                  Night replay
                </button>
              </div>

              {!cleanEnough && batch ? (
                <p className="mt-3 font-body text-[11px] text-[var(--error)]">
                  The batch residual is above 0.120 sigma, so the oracle rejects a clean anchor. Inject
                  a spoof packet to exercise the quarantine path instead.
                </p>
              ) : null}

              {!CONTRACTS_CONFIGURED ? (
                <p className="mt-3 font-body text-[11px] text-[var(--text-muted)]">
                  Sepolia contracts are not configured for this deployment. Set the three public
                  addresses in web/.env.local after deployment.
                </p>
              ) : null}

              {batchError ? (
                <p className="mt-3 font-body text-[11px] text-[var(--error)]">{batchError}</p>
              ) : null}

              {anchorError ? (
                <p className="mt-3 font-body text-[11px] text-[var(--error)]">
                  {anchorError.message.split("\n")[0]}
                </p>
              ) : null}

              {quarantineError ? (
                <p className="mt-3 font-body text-[11px] text-[var(--error)]">
                  {quarantineError.message.split("\n")[0]}
                </p>
              ) : null}

              {anchorHash ? (
                <div className="mt-3 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--success)]">
                    {anchorConfirmed ? "Root anchored on Sepolia" : "Anchor transaction submitted"}
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${anchorHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all font-mono text-[10px] text-[var(--accent)] hover:underline"
                  >
                    {anchorHash}
                  </a>
                </div>
              ) : null}

              {quarantineHash ? (
                <div className="mt-3 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--error)]">
                    {quarantineConfirmed
                      ? "Spoofed interval quarantined"
                      : "Quarantine transaction submitted"}
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${quarantineHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all font-mono text-[10px] text-[var(--accent)] hover:underline"
                  >
                    {quarantineHash}
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
            Anchored roots unlock the browser proof flow on{" "}
            <Link href="/app/attest/new" className="text-[var(--accent)] hover:underline">
              the ZK prover
            </Link>
            . Every transaction is submitted from the connected wallet and confirmed on Ethereum
            Sepolia.
          </p>
        </section>
      </div>
    </div>
  );
}
