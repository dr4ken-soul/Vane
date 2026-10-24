import { NextResponse } from "next/server";
import {
  ALLOCATION_LEAF_COUNT,
  buildAllocationTree,
  splitCleanAllocations,
  type AllocationSlot,
} from "@/lib/noir/energyMerkle";
import { fromHex32, toHex32 } from "@/lib/noir/poseidon2";
import {
  DEFAULT_INVERTER_EFFICIENCY,
  RESIDUAL_CALIBRATED_MAX,
  RESIDUAL_WARNING_MAX,
  scoreInterval,
  type WeatherSample,
} from "@/lib/physics/pinnModel";

/**
 * Meter verification route scoring telemetry against live satellite physics.
 */
export const dynamic = "force-dynamic";

/**
 * One meter interval submitted for verification.
 */
interface SubmittedInterval {
  /** ISO timestamp of the interval. */
  ts: string;
  /** Reported output in kilowatts. */
  kw: number;
}

/**
 * Request body accepted by the route.
 */
interface VerifyRequestBody {
  /** Facility smart meter identifier. */
  meterId?: string;
  /** Facility latitude in decimal degrees. */
  lat?: number;
  /** Facility longitude in decimal degrees. */
  lon?: number;
  /** Rated array capacity in kilowatts. */
  ratedKw?: number;
  /** Reported intervals. */
  intervals?: SubmittedInterval[];
  /** Optional supplier tax identifier hash used to bind the allocation tree. */
  supplierTaxIdHash?: string;
  /** Optional pinned window end as a unix timestamp in seconds. */
  windowEnd?: number;
}

/**
 * Reads the hourly satellite weather needed to score the submitted window.
 *
 * @param latitude Facility latitude.
 * @param longitude Facility longitude.
 * @param windowStart Start of the window as a unix timestamp in seconds.
 * @param windowEnd End of the window as a unix timestamp in seconds.
 * @returns Hourly weather keyed by ISO timestamp.
 */
async function readHourlyWeather(
  latitude: number,
  longitude: number,
  windowStart: number,
  windowEnd: number,
): Promise<Map<string, WeatherSample>> {
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(latitude));
  endpoint.searchParams.set("longitude", String(longitude));
  endpoint.searchParams.set(
    "hourly",
    "shortwave_radiation,direct_normal_irradiance,temperature_2m,cloud_cover,wind_speed_10m",
  );
  endpoint.searchParams.set("start_date", new Date(windowStart * 1000).toISOString().slice(0, 10));
  endpoint.searchParams.set("end_date", new Date(windowEnd * 1000).toISOString().slice(0, 10));
  endpoint.searchParams.set("timezone", "UTC");

  const samples = new Map<string, WeatherSample>();
  const response = await fetch(endpoint, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error("The satellite weather feed did not answer for the requested window.");
  }

  const payload = (await response.json()) as {
    hourly?: {
      time?: string[];
      shortwave_radiation?: number[];
      direct_normal_irradiance?: number[];
      temperature_2m?: number[];
      cloud_cover?: number[];
      wind_speed_10m?: number[];
    };
  };

  const hourly = payload.hourly;
  if (!hourly?.time) return samples;

  hourly.time.forEach((time, index) => {
    const hour = Number.parseInt(time.slice(11, 13), 10);
    samples.set(time, {
      ghiWm2: hourly.shortwave_radiation?.[index] ?? 0,
      dniWm2: hourly.direct_normal_irradiance?.[index] ?? 0,
      ambientTempC: hourly.temperature_2m?.[index] ?? 20,
      windSpeedMs: hourly.wind_speed_10m?.[index] ?? 3,
      cloudCoverPercent: hourly.cloud_cover?.[index] ?? 0,
      solarTimeFraction: (hour * 60) / 1440,
    });
  });

  return samples;
}

/**
 * Handles a meter verification request.
 *
 * @param request Incoming request carrying the meter batch.
 * @returns The verification result with the Merkle root and allocation slots.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: VerifyRequestBody;
  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    return NextResponse.json({ error: "The request body could not be read." }, { status: 400 });
  }

  const latitude = Number(body.lat ?? 40.8);
  const longitude = Number(body.lon ?? 29.43);
  const ratedKw = Number(body.ratedKw ?? 1200);
  const intervals = Array.isArray(body.intervals) ? body.intervals : [];

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(ratedKw)) {
    return NextResponse.json(
      { error: "lat, lon and ratedKw must be finite numbers." },
      { status: 400 },
    );
  }

  const windowEnd = Number.isFinite(body.windowEnd)
    ? Number(body.windowEnd)
    : Math.floor(Date.now() / 3600000) * 3600;
  const windowStart = windowEnd - 3600;

  let weather: Map<string, WeatherSample>;
  try {
    weather = await readHourlyWeather(latitude, longitude, windowStart, windowEnd);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The satellite feed is unreachable." },
      { status: 502 },
    );
  }

  const scored = intervals.map((interval) => {
    const hourIso = `${interval.ts.slice(0, 13)}:00`;
    const sample = weather.get(hourIso) ?? {
      ghiWm2: 0,
      dniWm2: 0,
      ambientTempC: 20,
      windSpeedMs: 3,
      cloudCoverPercent: 0,
      solarTimeFraction: 0.5,
    };
    const score = scoreInterval(
      Number(interval.kw),
      ratedKw,
      sample,
      DEFAULT_INVERTER_EFFICIENCY,
    );
    return { ts: interval.ts, kw: Number(interval.kw), ...score };
  });

  const maxSigma = scored.reduce((worst, entry) => Math.max(worst, entry.sigma), 0);
  const residualBps = Math.round(maxSigma * 10000);
  const quarantined = maxSigma > RESIDUAL_WARNING_MAX;
  const anchorEligible = maxSigma <= RESIDUAL_CALIBRATED_MAX;

  const cleanKwh = scored.reduce((total, entry) => {
    if (!anchorEligible) return total;
    return total + Math.max(0, entry.expectedKw);
  }, 0);

  const allocations: AllocationSlot[] = splitCleanAllocations(cleanKwh, ALLOCATION_LEAF_COUNT);
  const supplierTaxIdHash = body.supplierTaxIdHash
    ? fromHex32(body.supplierTaxIdHash)
    : 0n;
  const tree = buildAllocationTree(allocations, supplierTaxIdHash);

  const meterId = body.meterId ?? "GEBZE-M04-ROOFTOP-PV";
  const rootHex = `0x${toHex32(tree.root)}`;

  return NextResponse.json({
    status: quarantined ? "quarantined" : anchorEligible ? "calibrated" : "warning",
    anchorEligible,
    maxSigma: Number(maxSigma.toFixed(6)),
    residualBps,
    merkleRoot: rootHex,
    cleanLeaves: tree.leaves.map((leaf) => ({
      index: leaf.index,
      kwh: leaf.kwh,
      salt: toHex32(leaf.salt),
      leafHash: toHex32(leaf.leafHash),
      path: leaf.path.map((value) => toHex32(value)),
      indices: leaf.indices,
    })),
    cleanKwh: Number(cleanKwh.toFixed(3)),
    windowStart,
    windowEnd,
    meterId,
    intervals: scored,
  });
}
