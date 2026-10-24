"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One point of the twenty four hour satellite series.
 */
export interface TelemetryPoint {
  /** Hour label. */
  time: string;
  /** Global horizontal irradiance in watts per square metre. */
  ghiWm2: number;
  /** Thermodynamic expectation in kilowatts. */
  expectedKw: number;
  /** Meter reported output in kilowatts. */
  reportedKw: number;
  /** Normalised residual in sigma units. */
  sigma: number;
}

/**
 * Live telemetry payload returned by the API route.
 */
export interface LiveTelemetry {
  /** Facility coordinates. */
  coordinates: { latitude: number; longitude: number };
  /** Solar azimuth in degrees. */
  solarAzimuthDeg: number;
  /** Live global horizontal irradiance. */
  satelliteGhiWm2: number;
  /** Live direct normal irradiance. */
  satelliteDniWm2: number;
  /** Ambient temperature in degrees Celsius. */
  ambientTempC: number;
  /** Wind speed in metres per second. */
  windSpeedMs: number;
  /** Cloud cover percentage. */
  cloudCoverPercent: number;
  /** Thermodynamic expectation in kilowatts. */
  expectedKw: number;
  /** Meter reported output in kilowatts. */
  reportedKw: number;
  /** Normalised residual in sigma units. */
  residualSigma: number;
  /** Residual in basis points. */
  residualBps: number;
  /** Cell temperature estimate. */
  cellTempC: number;
  /** Calibration band. */
  status: "calibrated" | "warning" | "quarantined";
  /** Active simulation mode. */
  mode: string;
  /** Twenty four hour series. */
  series24h: TelemetryPoint[];
}

/**
 * Query parameters accepted by the hook.
 */
interface UseLiveTelemetryOptions {
  /** Facility latitude. */
  lat: number;
  /** Facility longitude. */
  lon: number;
  /** Rated capacity in kilowatts. */
  kw: number;
  /** Simulation mode. */
  mode?: "clean" | "spoof_scale" | "spoof_replay";
  /** Poll interval in milliseconds. */
  refreshMs?: number;
  /** Whether the hook is active. */
  enabled?: boolean;
}

/**
 * Reads live satellite telemetry for a facility coordinate.
 *
 * @param options Query parameters and polling behaviour.
 * @returns The telemetry payload with loading and error state.
 */
export function useLiveTelemetry({
  lat,
  lon,
  kw,
  mode = "clean",
  refreshMs = 60000,
  enabled = true,
}: UseLiveTelemetryOptions) {
  const [data, setData] = useState<LiveTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  /**
   * Fetches the current telemetry snapshot.
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(
        `/api/telemetry/live?lat=${lat}&lon=${lon}&kw=${kw}&mode=${mode}`,
        { signal: controller.signal, cache: "no-store" },
      );
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "The satellite telemetry feed did not answer.");
        return;
      }
      const payload = (await response.json()) as LiveTelemetry;
      setData(payload);
      setError(null);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError("The satellite telemetry feed is unreachable.");
    } finally {
      setLoading(false);
    }
  }, [lat, lon, kw, mode, enabled]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    if (!enabled || refreshMs <= 0) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, refreshMs);
    return () => {
      window.clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [refresh, refreshMs, enabled]);

  return { data, loading, error, refresh };
}
