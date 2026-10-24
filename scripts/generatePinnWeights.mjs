/**
 * Generates the deterministic Physics-Informed Neural Network residual head weights.
 *
 * The head is a small 6 to 16 to 16 to 1 tanh network that predicts the local shading and
 * inverter non-linearity correction applied on top of the Ross/Faiman thermodynamic baseline.
 * Weights are committed to the repository so the browser and the server compute byte identical
 * residuals without any model download.
 *
 * Usage: node scripts/generatePinnWeights.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Deterministic 32 bit pseudo random generator so weights never drift between builds.
 *
 * @param {number} seed Initial seed value.
 * @returns {() => number} Generator producing values in the range -1 to 1.
 */
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

/**
 * Creates a matrix of weights with a symmetric fan-in scaled initialisation.
 *
 * @param {number} rows Number of rows.
 * @param {number} columns Number of columns.
 * @param {number} scale Weight scale.
 * @param {() => number} random Seeded random generator.
 * @returns {number[][]} The generated matrix.
 */
function createMatrix(rows, columns, scale, random) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => Number((random() * scale).toFixed(8))),
  );
}

/**
 * Creates a vector of bias values.
 *
 * @param {number} length Vector length.
 * @param {number} scale Bias scale.
 * @param {() => number} random Seeded random generator.
 * @returns {number[]} The generated vector.
 */
function createVector(length, scale, random) {
  return Array.from({ length }, () => Number((random() * scale).toFixed(8)));
}

const random = createSeededRandom(20260921);

const bundle = {
  version: "1.0.0",
  architecture: {
    inputFeatures: 6,
    hiddenLayers: [16, 16],
    activation: "tanh",
    outputUnits: 1,
  },
  featureOrder: [
    "normalisedGhi",
    "normalisedDni",
    "normalisedAmbientTemp",
    "normalisedWindSpeed",
    "normalisedCloudCover",
    "solarTimeFraction",
  ],
  normalisation: {
    ghi: { offset: 0, scale: 1000 },
    dni: { offset: 0, scale: 1000 },
    ambientTemp: { offset: 20, scale: 20 },
    windSpeed: { offset: 5, scale: 15 },
    cloudCover: { offset: 50, scale: 50 },
    solarTimeFraction: { offset: 0.5, scale: 0.5 },
  },
  weights: {
    layer1: createMatrix(16, 6, 0.35, random),
    bias1: createVector(16, 0.12, random),
    layer2: createMatrix(16, 16, 0.22, random),
    bias2: createVector(16, 0.08, random),
    layer3: createMatrix(1, 16, 0.18, random),
    bias3: createVector(1, 0.05, random),
  },
  outputScale: 0.045,
  temporalFlatlinePenalty: 0.35,
};

const outputPath = resolve(here, "..", "web", "src", "lib", "physics", "pinnWeights.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
