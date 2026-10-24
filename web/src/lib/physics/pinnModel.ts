import weights from "./pinnWeights.json";

/**
 * Thermodynamic constants for the Ross/Faiman cell temperature model.
 */
export const FAI_MAN_U0 = 25.0;
export const FAI_MAN_U1 = 6.84;

/**
 * Panel temperature coefficient in inverse degrees Celsius.
 */
export const PANEL_TEMPERATURE_COEFFICIENT = -0.0038;

/**
 * Standard test condition cell temperature in degrees Celsius.
 */
export const STANDARD_CELL_TEMPERATURE_C = 25;

/**
 * Default inverter efficiency applied to the thermodynamic baseline.
 */
export const DEFAULT_INVERTER_EFFICIENCY = 0.94;

/**
 * Residual band boundaries taken from the protocol specification.
 */
export const RESIDUAL_CALIBRATED_MAX = 0.12;
export const RESIDUAL_WARNING_MAX = 0.25;

/**
 * Live satellite and ambient weather readings for one facility instant.
 */
export interface WeatherSample {
  /** Global horizontal irradiance in watts per square metre. */
  ghiWm2: number;
  /** Direct normal irradiance in watts per square metre. */
  dniWm2: number;
  /** Ambient air temperature in degrees Celsius. */
  ambientTempC: number;
  /** Wind speed at ten metres in metres per second. */
  windSpeedMs: number;
  /** Total cloud cover percentage. */
  cloudCoverPercent: number;
  /** Fraction of the day expressed between zero and one. */
  solarTimeFraction: number;
}

/**
 * Result of scoring one meter interval against the physics model.
 */
export interface ResidualScore {
  /** Normalised residual in sigma units. */
  sigma: number;
  /** Residual expressed in basis points. */
  sigmaBps: number;
  /** Cell temperature estimate in degrees Celsius. */
  cellTempC: number;
  /** Thermodynamic baseline output in kilowatts. */
  expectedKw: number;
  /** Learned residual correction in kilowatts. */
  learnedDeltaKw: number;
  /** Calibration band label. */
  status: "calibrated" | "warning" | "quarantined";
}

/**
 * Applies the Ross/Faiman cell temperature model.
 *
 * @param sample Live weather readings.
 * @returns The estimated cell temperature in degrees Celsius.
 */
export function estimateCellTemperature(sample: WeatherSample): number {
  const windTerm = FAI_MAN_U0 + FAI_MAN_U1 * sample.windSpeedMs;
  return sample.ambientTempC + sample.ghiWm2 / windTerm;
}

/**
 * Computes the thermodynamic baseline output of an array.
 *
 * @param ratedKw Rated array capacity in kilowatts.
 * @param sample Live weather readings.
 * @param cellTempC Estimated cell temperature in degrees Celsius.
 * @param inverterEfficiency Inverter efficiency ratio.
 * @returns The expected output in kilowatts.
 */
export function expectedOutputKw(
  ratedKw: number,
  sample: WeatherSample,
  cellTempC: number,
  inverterEfficiency: number,
): number {
  const irradianceFactor = sample.ghiWm2 / 1000;
  const temperatureFactor =
    1 + PANEL_TEMPERATURE_COEFFICIENT * (cellTempC - STANDARD_CELL_TEMPERATURE_C);
  return ratedKw * irradianceFactor * temperatureFactor * inverterEfficiency;
}

/**
 * Runs the tanh activation.
 *
 * @param value Pre activation value.
 * @returns The activated value.
 */
function activate(value: number): number {
  return Math.tanh(value);
}

/**
 * Computes the learned residual correction predicted by the PINN head.
 *
 * @param sample Live weather readings.
 * @returns The correction in kilowatts.
 */
export function learnedResidualKw(sample: WeatherSample): number {
  const normalisation = weights.normalisation;
  const features = [
    (sample.ghiWm2 - normalisation.ghi.offset) / normalisation.ghi.scale,
    (sample.dniWm2 - normalisation.dni.offset) / normalisation.dni.scale,
    (sample.ambientTempC - normalisation.ambientTemp.offset) / normalisation.ambientTemp.scale,
    (sample.windSpeedMs - normalisation.windSpeed.offset) / normalisation.windSpeed.scale,
    (sample.cloudCoverPercent - normalisation.cloudCover.offset) / normalisation.cloudCover.scale,
    (sample.solarTimeFraction - normalisation.solarTimeFraction.offset) /
      normalisation.solarTimeFraction.scale,
  ];

  const network = weights.weights;

  const firstLayer = network.layer1.map((row, rowIndex) => {
    let sum = network.bias1[rowIndex];
    for (let index = 0; index < row.length; index += 1) {
      sum += features[index] * row[index];
    }
    return activate(sum);
  });

  const secondLayer = network.layer2.map((row, rowIndex) => {
    let sum = network.bias2[rowIndex];
    for (let index = 0; index < row.length; index += 1) {
      sum += firstLayer[index] * row[index];
    }
    return activate(sum);
  });

  let output = network.bias3[0];
  for (let index = 0; index < network.layer3[0].length; index += 1) {
    output += secondLayer[index] * network.layer3[0][index];
  }

  return output * weights.outputScale;
}

/**
 * Classifies a residual value into a protocol band.
 *
 * @param sigma Normalised residual.
 * @returns The band label.
 */
export function classifyResidual(sigma: number): ResidualScore["status"] {
  if (sigma <= RESIDUAL_CALIBRATED_MAX) return "calibrated";
  if (sigma <= RESIDUAL_WARNING_MAX) return "warning";
  return "quarantined";
}

/**
 * Scores one reported meter reading against the physics model.
 *
 * @param reportedKw Meter reported output in kilowatts.
 * @param ratedKw Rated array capacity in kilowatts.
 * @param sample Live weather readings.
 * @param inverterEfficiency Inverter efficiency ratio.
 * @param flatline True when the meter reports an identical value across consecutive intervals.
 * @returns The residual score for the interval.
 */
export function scoreInterval(
  reportedKw: number,
  ratedKw: number,
  sample: WeatherSample,
  inverterEfficiency: number = DEFAULT_INVERTER_EFFICIENCY,
  flatline: boolean = false,
): ResidualScore {
  const cellTempC = estimateCellTemperature(sample);
  const expectedKw = expectedOutputKw(ratedKw, sample, cellTempC, inverterEfficiency);
  const learnedDeltaKw = learnedResidualKw(sample);
  const denominator = Math.max(0.05 * ratedKw, 1);
  const absoluteGap = Math.abs(reportedKw - (expectedKw + learnedDeltaKw));
  const temporalPenalty = flatline ? weights.temporalFlatlinePenalty : 0;
  const sigma = absoluteGap / denominator + temporalPenalty;

  return {
    sigma: Number(sigma.toFixed(6)),
    sigmaBps: Math.round(sigma * 10000),
    cellTempC: Number(cellTempC.toFixed(3)),
    expectedKw: Number(expectedKw.toFixed(3)),
    learnedDeltaKw: Number(learnedDeltaKw.toFixed(4)),
    status: classifyResidual(sigma),
  };
}
