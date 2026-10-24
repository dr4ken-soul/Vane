import { NextResponse } from "next/server";
import {
  DEFAULT_INVERTER_EFFICIENCY,
  RESIDUAL_WARNING_MAX,
  scoreInterval,
  type WeatherSample,
} from "@/lib/physics/pinnModel";

/**
 * Live telemetry route reading real Open-Meteo satellite derived irradiance.
 */
export const dynamic = "force-dynamic";

/**
 * One point of the twenty four hour series returned to the client.
 */
interface SeriesPoint {
  /** Local hour label in ISO like form. */
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
 * Raw Open-Meteo payload subset used by the route.
 */
interface OpenMeteoPayload {
  current?: {
    temperature_2m?: number;
    cloud_cover?: number;
    wind_speed_10m?: number;
    shortwave_radiation?: number;
    direct_normal_irradiance?: number;
    time?: string;
  };
  hourly?: {
    time?: string[];
    shortwave_radiation?: number[];
    direct_normal_irradiance?: number[];
    temperature_2m?: number[];
    cloud_cover?: number[];
    wind_speed_10m?: number[];
  };
}

/**
 * Estimates the solar azimuth in degrees from the current hour of the day.
 *
 * @param hourUtc Hour of the day in UTC.
 * @returns The azimuth angle in degrees.
 */
function solarAzimuth(hourUtc: number): number {
  const dayFraction = hourUtc / 24;
  return 90 + dayFraction * 180;
}

/**
 * Handles a live telemetry request for a facility coordinate.
 *
 * @param request Incoming request carrying the query parameters.
 * @returns Live irradiance, expectation and residual readings.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const latitude = Number.parseFloat(url.searchParams.get("lat") ?? "40.8");
  const longitude = Number.parseFloat(url.searchParams.get("lon") ?? "29.43");
  const ratedKw = Number.parseFloat(url.searchParams.get("kw") ?? "1200");
  const mode = url.searchParams.get("mode") ?? "clean";

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(ratedKw)) {
    return NextResponse.json(
      { error: "lat, lon and kw must be finite numbers." },
      { status: 400 },
    );
  }

  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(latitude));
  endpoint.searchParams.set("longitude", String(longitude));
  endpoint.searchParams.set(
    "current",
    "temperature_2m,cloud_cover,wind_speed_10m,shortwave_radiation,direct_normal_irradiance",
  );
  endpoint.searchParams.set(
    "hourly",
    "shortwave_radiation,direct_normal_irradiance,temperature_2m,cloud_cover,wind_speed_10m",
  );
  endpoint.searchParams.set("forecast_days", "2");
  endpoint.searchParams.set("timezone", "UTC");

  let payload: OpenMeteoPayload;
  try {
    const response = await fetch(endpoint, { next: { revalidate: 0 } });
    if (!response.ok) {
      return NextResponse.json(
        { error: "The satellite weather feed did not answer. Retry in a moment." },
        { status: 502 },
      );
    }
    payload = (await response.json()) as OpenMeteoPayload;
  } catch {
    return NextResponse.json(
      { error: "The satellite weather feed is unreachable. Retry in a moment." },
      { status: 502 },
    );
  }

  const current = payload.current ?? {};
  const nowUtc = current.time ? new Date(`${current.time}Z`) : new Date();
  const hourUtc = nowUtc.getUTCHours();
  const dayFraction = (hourUtc * 60 + nowUtc.getUTCMinutes()) / 1440;

  const sample: WeatherSample = {
    ghiWm2: current.shortwave_radiation ?? 0,
    dniWm2: current.direct_normal_irradiance ?? 0,
    ambientTempC: current.temperature_2m ?? 20,
    windSpeedMs: current.wind_speed_10m ?? 3,
    cloudCoverPercent: current.cloud_cover ?? 0,
    solarTimeFraction: dayFraction,
  };

  const cleanScore = scoreInterval(
    Number((cleanScoreExpectedKw(ratedKw, sample)).toFixed(3)),
    ratedKw,
    sample,
    DEFAULT_INVERTER_EFFICIENCY,
  );

  let reportedKw = cleanScore.expectedKw;
  let residual = cleanScore;

  if (mode === "spoof_scale") {
    // A meter that inflates output still claims power at night, when satellite irradiance is
    // zero. Fall back to a plausible claimed output so the physics guard always sees the gap.
    const claimedBaseline = cleanScore.expectedKw > 1 ? cleanScore.expectedKw : ratedKw * 0.35;
    reportedKw = Number((claimedBaseline * 1.4).toFixed(3));
    residual = scoreInterval(reportedKw, ratedKw, sample, DEFAULT_INVERTER_EFFICIENCY);
  } else if (mode === "spoof_replay") {
    const replaySample: WeatherSample = {
      ...sample,
      ghiWm2: Math.max(220, sample.ghiWm2),
      dniWm2: Math.max(180, sample.dniWm2),
    };
    const replayScore = scoreInterval(
      Number((cleanScoreExpectedKw(ratedKw, replaySample)).toFixed(3)),
      ratedKw,
      sample,
      DEFAULT_INVERTER_EFFICIENCY,
    );
    reportedKw = replayScore.expectedKw;
    residual = scoreInterval(reportedKw, ratedKw, sample, DEFAULT_INVERTER_EFFICIENCY);
  }

  const hourly = payload.hourly;
  const series24h: SeriesPoint[] = [];
  if (hourly?.time && hourly.shortwave_radiation) {
    const startIndex = Math.max(0, hourly.time.length - 24);
    for (let index = startIndex; index < hourly.time.length; index += 1) {
      const time = hourly.time[index];
      const ghiWm2 = hourly.shortwave_radiation[index] ?? 0;
      const dniWm2 = hourly.direct_normal_irradiance?.[index] ?? 0;
      const ambientTempC = hourly.temperature_2m?.[index] ?? 20;
      const cloudCoverPercent = hourly.cloud_cover?.[index] ?? 0;
      const windSpeedMs = hourly.wind_speed_10m?.[index] ?? 3;
      const hourOfDay = Number.parseInt(time.slice(11, 13), 10);
      const pointSample: WeatherSample = {
        ghiWm2,
        dniWm2,
        ambientTempC,
        windSpeedMs,
        cloudCoverPercent,
        solarTimeFraction: (hourOfDay * 60) / 1440,
      };
      const pointScore = scoreInterval(
        Number((cleanScoreExpectedKw(ratedKw, pointSample)).toFixed(3)),
        ratedKw,
        pointSample,
        DEFAULT_INVERTER_EFFICIENCY,
      );
      series24h.push({
        time,
        ghiWm2: Number(ghiWm2.toFixed(1)),
        expectedKw: pointScore.expectedKw,
        reportedKw: pointScore.expectedKw,
        sigma: pointScore.sigma,
      });
    }
  }

  return NextResponse.json({
    coordinates: { latitude, longitude },
    solarAzimuthDeg: Number(solarAzimuth(hourUtc).toFixed(2)),
    satelliteGhiWm2: Number(sample.ghiWm2.toFixed(1)),
    satelliteDniWm2: Number(sample.dniWm2.toFixed(1)),
    ambientTempC: Number(sample.ambientTempC.toFixed(2)),
    windSpeedMs: Number(sample.windSpeedMs.toFixed(2)),
    cloudCoverPercent: Number(sample.cloudCoverPercent.toFixed(1)),
    expectedKw: cleanScore.expectedKw,
    reportedKw: Number(reportedKw.toFixed(3)),
    residualSigma: residual.sigma,
    residualBps: residual.sigmaBps,
    cellTempC: residual.cellTempC,
    status: residual.sigma > RESIDUAL_WARNING_MAX ? "quarantined" : residual.status,
    mode,
    series24h,
  });
}

/**
 * Computes the thermodynamic expectation used as the clean meter reading.
 *
 * @param ratedKw Rated array capacity in kilowatts.
 * @param sample Live weather readings.
 * @returns The expected output in kilowatts.
 */
function cleanScoreExpectedKw(ratedKw: number, sample: WeatherSample): number {
  const score = scoreInterval(0, ratedKw, sample, DEFAULT_INVERTER_EFFICIENCY);
  return score.expectedKw + score.learnedDeltaKw;
}
