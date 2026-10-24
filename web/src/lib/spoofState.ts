/**
 * Shared spoof simulation state between the hero instrument panel and the procedural canvas.
 *
 * The state lives outside React so the canvas animation loop can read it without triggering a
 * render on every frame.
 */
interface SpoofState {
  /** True while a spoofed meter packet is being injected. */
  active: boolean;
  /** Base solar azimuth in degrees driving the calibration field. */
  azimuthDeg: number;
}

/**
 * Current spoof state.
 */
export const spoofState: SpoofState = {
  active: false,
  azimuthDeg: 142,
};

/**
 * Listener invoked whenever the spoof state changes.
 */
type SpoofListener = () => void;

const listeners = new Set<SpoofListener>();

/**
 * Marks the spoof simulation as active or inactive.
 *
 * @param active True while a spoofed packet is injected.
 */
export function setSpoofActive(active: boolean): void {
  if (spoofState.active === active) return;
  spoofState.active = active;
  listeners.forEach((listener) => listener());
}

/**
 * Updates the solar azimuth driving the calibration field.
 *
 * @param azimuthDeg Solar azimuth in degrees.
 */
export function setSolarAzimuth(azimuthDeg: number): void {
  if (Math.abs(spoofState.azimuthDeg - azimuthDeg) < 0.5) return;
  spoofState.azimuthDeg = azimuthDeg;
  listeners.forEach((listener) => listener());
}

/**
 * Subscribes to spoof state changes.
 *
 * @param listener Callback invoked on every change.
 * @returns A function that removes the listener.
 */
export function subscribeSpoofState(listener: SpoofListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
