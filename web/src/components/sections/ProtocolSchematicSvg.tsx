/**
 * Coded blueprint schematic of the Vane verification path.
 *
 * The diagram maps live satellite irradiance and signed meter telemetry through the PINN residual
 * filter, the browser UltraHonk prover and the Sepolia registry without using any external image.
 */
export function ProtocolSchematicSvg() {
  return (
    <svg
      viewBox="0 0 640 240"
      role="img"
      aria-label="Open-Meteo weather and smart meter telemetry feed a PINN residual filter, then a Noir UltraHonk prover, then the Ethereum Sepolia registry"
      className="w-full h-auto"
    >
      <defs>
        <marker
          id="vane-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" fill="var(--border-strong)" />
        </marker>
      </defs>

      <g stroke="var(--border-strong)" strokeWidth="1" fill="none">
        <rect x="12" y="38" width="124" height="58" rx="6" />
        <rect x="12" y="144" width="124" height="58" rx="6" />
        <rect x="196" y="66" width="132" height="108" rx="6" />
        <rect x="376" y="66" width="132" height="108" rx="6" />
        <rect x="548" y="66" width="80" height="108" rx="6" />
      </g>

      <g fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.2" fill="var(--text-muted)">
        <text x="24" y="60">OPEN-METEO</text>
        <text x="24" y="166">SMART METER</text>
        <text x="208" y="88">PINN RESIDUAL</text>
        <text x="388" y="88">NOIR ULTRAHONK</text>
        <text x="560" y="88">SEPOLIA</text>
      </g>

      <g fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-primary)">
        <text x="24" y="78">GHI · DNI · T2m</text>
        <text x="24" y="184">signed kW stream</text>
        <text x="208" y="106">Ross / Faiman</text>
        <text x="388" y="106">bb.js WASM</text>
        <text x="560" y="106">registry</text>
      </g>

      <g fontFamily="var(--font-mono)" fontSize="9" fill="var(--accent)">
        <text x="208" y="140">sigma ≤ 0.12</text>
        <text x="388" y="140">4 public inputs</text>
        <text x="560" y="140">nullifier</text>
      </g>

      <g fontFamily="var(--font-mono)" fontSize="8" fill="var(--text-secondary)">
        <text x="208" y="160">root + quarantine</text>
        <text x="388" y="160">7616 byte proof</text>
        <text x="560" y="160">receipt</text>
      </g>

      <g stroke="var(--border-strong)" strokeWidth="1" fill="none" markerEnd="url(#vane-arrow)">
        <path d="M136 67H176V98H196" />
        <path d="M136 173H176V142H196" />
        <path d="M328 120H376" />
        <path d="M508 120H548" />
      </g>

      <g
        className="schematic-flow"
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeDasharray="4 8"
        fill="none"
      >
        <path d="M328 120H376" />
        <path d="M508 120H548" />
      </g>

      <g fontFamily="var(--font-mono)" fontSize="8" fill="var(--text-muted)" letterSpacing="1">
        <text x="12" y="228">SATELLITE PHYSICS</text>
        <text x="376" y="228">ZERO COMMERCIAL LEAK</text>
        <text x="548" y="228">PUBLIC RECEIPT</text>
      </g>

      <g stroke="var(--border-subtle)" strokeWidth="1">
        <path d="M12 214H628" />
      </g>
    </svg>
  );
}
