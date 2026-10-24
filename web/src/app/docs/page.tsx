import type { Metadata } from "next";
import Link from "next/link";

/**
 * Metadata for the public protocol documentation.
 */
export const metadata: Metadata = {
  title: "Protocol docs",
  description:
    "Vane protocol documentation: live telemetry routes, Poseidon2 Merkle roots, Noir UltraHonk proofs, Sepolia registries and public receipt verification.",
};

/**
 * Short API route description used by the endpoint table.
 */
interface EndpointRow {
  /** HTTP method. */
  method: string;
  /** Route path. */
  path: string;
  /** Purpose of the route. */
  purpose: string;
  /** Authentication requirement. */
  auth: string;
}

/**
 * Public API routes exposed by the application.
 */
const ENDPOINTS: EndpointRow[] = [
  {
    method: "GET",
    path: "/api/telemetry/live",
    purpose: "Live Open-Meteo irradiance, PINN expectation and residual for a coordinate.",
    auth: "Public",
  },
  {
    method: "POST",
    path: "/api/telemetry/verify",
    purpose: "Scores a meter interval batch and returns the Poseidon2 clean energy root.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/api/receipt/[id]",
    purpose: "W3C verifiable credential for one sealed attestation, read live from Sepolia.",
    auth: "Public",
  },
  {
    method: "GET",
    path: "/api/health",
    purpose: "Chain identifier, RPC reachability and configured contract addresses.",
    auth: "Public",
  },
];

/**
 * Public protocol documentation page.
 *
 * @returns The documentation page.
 */
export default function DocsPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
          Protocol docs
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold uppercase tracking-[-0.015em] text-[var(--text-primary)]">
          Vane API and verification guide
        </h1>
        <p className="mt-3 font-body text-sm md:text-base text-[var(--text-secondary)] max-w-[68ch]">
          Vane combines a physics informed meter guard with a browser zero-knowledge prover. This page
          documents the public read routes, the proof payload, the Sepolia contracts and the exact
          privacy boundary.
        </p>

        <nav aria-label="Documentation sections" className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["#architecture", "Architecture"],
            ["#telemetry", "Telemetry API"],
            ["#proof", "Proof flow"],
            ["#contracts", "Contracts"],
            ["#verify", "Public verification"],
            ["#run", "Run locally"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-150"
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="architecture" className="mt-10">
          <h2 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
            Architecture and trust boundary
          </h2>
          <div className="mt-3 space-y-3 font-body text-sm text-[var(--text-secondary)]">
            <p>
              Engine one cross-checks facility smart meter telemetry against live Open-Meteo
              shortwave radiation, direct normal irradiance, ambient temperature, cloud cover and
              wind speed. The PINN residual model returns a normalised sigma score. Clean hourly
              batches produce a Poseidon2 allocation root that can be anchored in
              VaneMeterOracle.sol. Intervals above the clean ceiling can be reported and quarantined.
            </p>
            <p>
              Engine two parses a UBL 2.1 invoice inside the browser, builds the same Poseidon2
              allocation tree, and runs the Noir UltraHonk circuit inside a Web Worker. The private
              witness never crosses a network boundary. Only the proof bytes and four public values
              are submitted to VaneAttestationRegistry.sol.
            </p>
            <p>
              The registry checks that the facility root is clean, that the invoice nullifier is
              unused, and that the Honk verifier accepts the proof. A successful transaction stores
              the commodity code, declared intensity ceiling, facility root, nullifier and timestamp.
              It never stores pricing, supplier tax identifiers or batch volume.
            </p>
          </div>
        </section>

        <section id="telemetry" className="mt-10">
          <h2 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
            Telemetry API
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-y border-[var(--border-subtle)]">
              <thead>
                <tr className="text-left">
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Method
                  </th>
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Path
                  </th>
                  <th className="py-2.5 pr-4 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Purpose
                  </th>
                  <th className="py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Auth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {ENDPOINTS.map((row) => (
                  <tr key={`${row.method}-${row.path}`}>
                    <td className="py-3 pr-4 font-mono text-[11px] text-[var(--accent)]">
                      {row.method}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-[var(--text-primary)]">
                      {row.path}
                    </td>
                    <td className="py-3 pr-4 font-body text-xs text-[var(--text-secondary)]">
                      {row.purpose}
                    </td>
                    <td className="py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {row.auth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Live telemetry request
          </h3>
          <pre className="mt-2 overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`curl "https://your-deployment.vercel.app/api/telemetry/live?lat=40.80&lon=29.43&kw=1200&mode=clean"`}
          </pre>
          <p className="mt-2 font-body text-xs text-[var(--text-muted)]">
            The response includes coordinates, solar azimuth, satellite GHI and DNI, ambient
            temperature, wind speed, cloud cover, expected output, reported output, residual sigma,
            residual basis points, calibration status and a twenty four hour series. Use mode
            spoof_scale or spoof_replay to inspect the quarantine path.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Meter batch verification
          </h3>
          <pre className="mt-2 overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`curl -X POST "https://your-deployment.vercel.app/api/telemetry/verify" \\
  -H "content-type: application/json" \\
  -d '{
    "meterId": "GEBZE-M04-ROOFTOP-PV",
    "lat": 40.80,
    "lon": 29.43,
    "ratedKw": 1200,
    "intervals": [{ "ts": "2026-10-23T09:00", "kw": 642.4 }],
    "windowEnd": 1761207600
  }'`}
          </pre>
          <p className="mt-2 font-body text-xs text-[var(--text-muted)]">
            The response includes status, anchorEligible, maxSigma, residualBps, merkleRoot, cleanKwh,
            cleanLeaves, windowStart and windowEnd. Only a calibrated batch returns clean allocations
            for anchoring; warning and quarantined batches return zero clean kWh.
          </p>
        </section>

        <section id="proof" className="mt-10">
          <h2 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
            Browser proof flow
          </h2>
          <div className="mt-3 space-y-3 font-body text-sm text-[var(--text-secondary)]">
            <p>
              The invoice allocation occupies leaf zero of a sixteen leaf Poseidon2 tree. The
              remaining batch energy is split across leaves one to fifteen. Each leaf commits to
              allocated clean kilowatt hours, a hash of the supplier tax identifier and a
              deterministic salt. The circuit proves membership of leaf zero without revealing the
              rest of the tree.
            </p>
            <p>
              The circuit also recomputes the invoice nullifier from the supplier tax identifier
              hash, the invoice serial secret and the allocated clean energy. The registry rejects a
              nullifier that has already been sealed, so one shipment cannot be counted twice.
            </p>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`Public calldata

facility_merkle_root        bytes32
invoice_nullifier           bytes32
max_intensity_kg_per_tonne  uint64
cn_commodity_code           uint64

submitAttestation(bytes proof, bytes32[] publicInputs)`}
          </pre>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--error)]">
                Private witness
              </p>
              <p className="mt-2 font-body text-xs text-[var(--text-secondary)]">
                Unit price, supplier tax identifier, invoice serial, clean and grid kilowatt hours,
                grid emission factor, direct process emissions, shipment mass, leaf salt and the
                Merkle path. These values stay in browser memory and inside the Web Worker.
              </p>
            </div>
            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--success)]">
                On-chain state
              </p>
              <p className="mt-2 font-body text-xs text-[var(--text-secondary)]">
                Facility root, nullifier, intensity ceiling, commodity code, exporter address,
                timestamp and the attestation identifier. Nothing else is written by the registry.
              </p>
            </div>
          </div>
        </section>

        <section id="contracts" className="mt-10">
          <h2 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
            Sepolia contracts
          </h2>
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                VaneMeterOracle
              </h3>
              <pre className="mt-2 overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`submitHourlyRoot(
  bytes32 merkleRoot,
  bytes32 meterId,
  uint64 windowStart,
  uint64 windowEnd,
  uint32 residualSigmaBps
)

reportAndQuarantine(
  bytes32 meterId,
  bytes32 suspectRoot,
  uint32 residualSigmaBps
)

isRootClean(bytes32 merkleRoot) returns (bool)`}
              </pre>
              <p className="mt-2 font-body text-xs text-[var(--text-muted)]">
                A clean anchor requires residualSigmaBps at or below 1200, which is 0.120 sigma. A
                report marks the suspect root as quarantined and increments the facility quarantine
                count.
              </p>
            </div>

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                VaneAttestationRegistry
              </h3>
              <pre className="mt-2 overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`submitAttestation(bytes proof, bytes32[] publicInputs)
  returns (uint256 attestationId)

attestations(uint256 id)
getAttestationsByExporter(address exporter)
usedNullifiers(bytes32 nullifier)
protocolFeeWei() returns (uint256)`}
              </pre>
              <p className="mt-2 font-body text-xs text-[var(--text-muted)]">
                The constructor receives the verifier, meter oracle, treasury wallet and protocol
                fee. No address is hardcoded in Solidity, and deployment injects every value from
                environment variables.
              </p>
            </div>
          </div>
        </section>

        <section id="verify" className="mt-10">
          <h2 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
            Public verification
          </h2>
          <div className="mt-3 space-y-3 font-body text-sm text-[var(--text-secondary)]">
            <p>
              Open{" "}
              <Link href="/verify" className="text-[var(--accent)] hover:underline">
                /verify
              </Link>{" "}
              to search by attestation identifier, or open /verify/[id] directly. Both routes read
              live Sepolia state and require no wallet. The receipt JSON endpoint returns a W3C
              verifiable credential with the same public values.
            </p>
            <pre className="overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`curl "https://your-deployment.vercel.app/api/receipt/1"`}
            </pre>
            <p>
              Treat the JSON as a machine readable mirror of the chain state. The chain remains the
              source of truth, and the public receipt page links back to the registry contract on
              Etherscan.
            </p>
          </div>
        </section>

        <section id="run" className="mt-10">
          <h2 className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
            Run locally
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]">
{`# contracts
cd contracts
npm install
npx hardhat test
npx hardhat run scripts/deploy.ts --network sepolia

# web
cd web
npm install
npm run dev`}
          </pre>
          <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
            Copy contracts/.env.example to contracts/.env and web/.env.example to web/.env.local,
            then fill in the Sepolia RPC URL, deployer key, treasury address, protocol fee and the
            three deployed contract addresses. The browser prover expects Noir 1.0.0-rc.6 and bb
            6.0.0 artifacts in web/public/circuits/cbam_attestation.json.
          </p>
        </section>

        <div className="mt-12 border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-body text-xs text-[var(--text-muted)]">
            Vane Protocol · Ethereum Sepolia · Open-Meteo GHI · Noir UltraHonk
          </p>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
          >
            Return to Vane
          </Link>
        </div>
      </div>
    </div>
  );
}
