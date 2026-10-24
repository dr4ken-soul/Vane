/**
 * Generates the sample photovoltaic inverter telemetry trace used by the meter console.
 *
 * The trace follows a clear September day at the Gebze rooftop array with two passing cloud
 * bands, matching the physics the PINN residual model expects.
 *
 * Usage: node scripts/generatePvTrace.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const RATED_KW = 1200;
const INVERTER_EFFICIENCY = 0.94;
const GAMMA = -0.0038;
const U0 = 25;
const U1 = 6.84;

/**
 * Deterministic pseudo random generator for reproducible traces.
 *
 * @param {number} seed Initial seed.
 * @returns {() => number} Generator producing values in the range 0 to 1.
 */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

const random = createRandom(48271);

const rows = ["timestamp,reported_kw,ghi_wm2,dni_wm2,ambient_temp_c,wind_speed_ms,cloud_cover_percent"];

for (let step = 0; step < 96; step += 1) {
  const minuteOfDay = step * 15;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const timestamp = `2026-09-14T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;

  // Solar elevation proxy for a clear September day at 40.80 N.
  const solarElevation = Math.max(0, Math.sin(((minuteOfDay - 330) / 780) * Math.PI));
  const cloudBand = Math.exp(-((hour - 10.5) ** 2) / 1.4) * 0.45 + Math.exp(-((hour - 15) ** 2) / 2.2) * 0.3;
  const cloudCover = Math.min(96, Math.max(0, cloudBand * 100 + random() * 6));
  const ghi = Math.max(0, solarElevation * 980 * (1 - cloudCover / 130) + random() * 12 * solarElevation);
  const dni = Math.max(0, ghi * (0.82 - cloudCover / 400) + random() * 8 * solarElevation);
  const ambientTemp = 19.4 + solarElevation * 11.5 - (hour > 18 ? (hour - 18) * 1.1 : 0);
  const windSpeed = 2.1 + Math.sin(hour / 3.1) * 1.4 + random() * 0.5;

  const cellTemp = ambientTemp + ghi / (U0 + U1 * windSpeed);
  const expected =
    RATED_KW * (ghi / 1000) * (1 + GAMMA * (cellTemp - 25)) * INVERTER_EFFICIENCY;
  const inverterNoise = 1 + (random() - 0.5) * 0.012;
  const reported = Math.max(0, expected * inverterNoise);

  rows.push(
    [
      timestamp,
      reported.toFixed(3),
      ghi.toFixed(2),
      dni.toFixed(2),
      ambientTemp.toFixed(2),
      windSpeed.toFixed(2),
      cloudCover.toFixed(1),
    ].join(","),
  );
}

const outputPath = resolve(here, "..", "web", "public", "samples", "nrel_pv_trace.csv");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${rows.join("\n")}\n`, "utf8");
console.log(`Wrote ${outputPath} with ${rows.length - 1} telemetry rows`);
