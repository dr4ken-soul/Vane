import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  APP_URL,
  COMMODITY_LABELS,
  HONK_VERIFIER_ADDRESS,
  VANE_ATTESTATION_REGISTRY_ABI,
  VANE_ATTESTATION_REGISTRY_ADDRESS,
  VANE_METER_ORACLE_ABI,
  VANE_METER_ORACLE_ADDRESS,
} from "@/lib/contracts";
import { sepoliaPublicClient } from "@/lib/publicClient";
import { CopyLinkButton } from "@/components/verify/CopyLinkButton";

/**
 * Public receipt routes always read live chain state.
 */
export const dynamic = "force-dynamic";

/**
 * Shape of the resolved receipt page props.
 */
interface VerifyReceiptPageProps {
  /** Route parameters carrying the attestation identifier. */
  params: { id: string };
}

/**
 * Builds the shareable receipt URL for one attestation.
 *
 * @param id Attestation identifier.
 * @returns The absolute receipt URL.
 */
function receiptUrl(id: string): string {
  return `${APP_URL.replace(/\/$/, "")}/verify/${id}`;
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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/**
 * Generates share metadata for a public receipt.
 *
 * @param props Route parameters.
 * @returns Page metadata.
 */
export async function generateMetadata({ params }: VerifyReceiptPageProps): Promise<Metadata> {
  return {
    title: `CBAM receipt #${params.id}`,
    description:
      "Wallet-free verification of a sealed zero-knowledge CBAM shipment proof on Ethereum Sepolia.",
    openGraph: {
      title: `Vane CBAM receipt #${params.id}`,
      description:
        "Physics verified embedded carbon with a zero-knowledge proof and a single-use invoice nullifier.",
      url: receiptUrl(params.id),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Vane CBAM receipt #${params.id}`,
      description:
        "Physics verified embedded carbon with a zero-knowledge proof and a single-use invoice nullifier.",
    },
  };
}

/**
 * Wallet-free public customs receipt page.
 *
 * @param props Route parameters.
 * @returns The verified receipt or a not found response.
 */
export default async function VerifyReceiptPage({ params }: VerifyReceiptPageProps) {
  const attestationId = Number.parseInt(params.id, 10);
  if (!Number.isSafeInteger(attestationId) || attestationId <= 0) notFound();

  if (!VANE_ATTESTATION_REGISTRY_ADDRESS) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
            Public customs verifier
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase text-[var(--text-primary)]">
            Registry not configured
          </h1>
          <p className="mt-3 font-body text-sm text-[var(--text-secondary)]">
            This deployment has no Sepolia registry address, so no receipt can be read. Set
            NEXT_PUBLIC_VANE_ATTESTATION_REGISTRY_ADDRESS and reload the page.
          </p>
          <Link
            href="/verify"
            className="mt-6 inline-flex font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
          >
            Return to the verifier
          </Link>
        </div>
      </div>
    );
  }

  let attestation: readonly [bigint, `0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint];
  let rootClean = false;
  try {
    attestation = await sepoliaPublicClient.readContract({
      address: VANE_ATTESTATION_REGISTRY_ADDRESS,
      abi: VANE_ATTESTATION_REGISTRY_ABI,
      functionName: "attestations",
      args: [BigInt(attestationId)],
    });

    if (VANE_METER_ORACLE_ADDRESS) {
      rootClean = await sepoliaPublicClient.readContract({
        address: VANE_METER_ORACLE_ADDRESS,
        abi: VANE_METER_ORACLE_ABI,
        functionName: "isRootClean",
        args: [attestation[2]],
      });
    }
  } catch {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
            Public customs verifier
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase text-[var(--text-primary)]">
            Sepolia did not answer
          </h1>
          <p className="mt-3 font-body text-sm text-[var(--text-secondary)]">
            The public RPC endpoint is unreachable right now. Reload the page in a moment, or inspect
            the receipt JSON directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/api/receipt/${attestationId}`}
              className="inline-flex font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
            >
              Open raw receipt JSON
            </a>
            <Link
              href="/verify"
              className="inline-flex font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:text-[var(--accent)]"
            >
              Return to the verifier
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [, exporter, facilityMerkleRoot, invoiceNullifier, maxIntensity, cnCode, sealedAt] =
    attestation;

  if (Number(sealedAt) === 0) notFound();

  const commodity = COMMODITY_LABELS[Number(cnCode)] ?? "Industrial precursor";
  const etherscanRegistry = `https://sepolia.etherscan.io/address/${VANE_ATTESTATION_REGISTRY_ADDRESS}`;
  const etherscanVerifier = HONK_VERIFIER_ADDRESS
    ? `https://sepolia.etherscan.io/address/${HONK_VERIFIER_ADDRESS}`
    : null;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
              Public customs verifier
            </p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold uppercase tracking-[-0.015em] text-[var(--text-primary)]">
              CBAM receipt #{attestationId}
            </h1>
          </div>
          <CopyLinkButton value={receiptUrl(String(attestationId))} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/30 bg-[var(--success-bg)] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--success)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            Zero-knowledge proof verified
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Ethereum Sepolia · 11155111
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
              rootClean
                ? "border-[var(--success)]/30 bg-[var(--success-bg)] text-[var(--success)]"
                : "border-[var(--error)]/30 bg-[var(--error-bg)] text-[var(--error)]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                rootClean ? "bg-[var(--success)]" : "bg-[var(--error)]"
              }`}
            />
            {rootClean ? "Facility root clean" : "Facility root quarantined"}
          </span>
        </div>

        <div className="mt-8 p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
          <div className="rounded-[10px] bg-[var(--bg-secondary)] p-5 md:p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Declared embedded intensity ceiling
                </p>
                <p className="mt-1 font-display text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
                  {Number(maxIntensity)}{" "}
                  <span className="font-mono text-sm tracking-normal text-[var(--text-muted)]">
                    kg CO2e / t
                  </span>
                </p>
                <p className="mt-2 font-body text-xs text-[var(--text-secondary)]">
                  The circuit proves total embedded emissions stay at or below this declared ceiling
                  for the shipment mass in the private invoice.
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Combined Nomenclature commodity
                </p>
                <p className="mt-1 font-display text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
                  {Number(cnCode)}
                </p>
                <p className="mt-2 font-body text-xs text-[var(--text-secondary)]">{commodity}</p>
              </div>
            </div>

            <dl className="mt-7 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Exporter wallet
                </dt>
                <dd className="break-all font-mono text-xs text-[var(--text-secondary)]">
                  {exporter}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Facility allocation root
                </dt>
                <dd className="break-all font-mono text-xs text-[var(--text-secondary)]">
                  {facilityMerkleRoot}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Invoice nullifier
                </dt>
                <dd className="break-all font-mono text-xs text-[var(--text-secondary)]">
                  {invoiceNullifier}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Sealed at
                </dt>
                <dd className="font-mono text-xs text-[var(--text-secondary)]">
                  {formatTimestamp(Number(sealedAt))}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Registry contract
                </dt>
                <dd className="break-all font-mono text-xs">
                  <a
                    href={etherscanRegistry}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    {VANE_ATTESTATION_REGISTRY_ADDRESS}
                  </a>
                </dd>
              </div>
              {etherscanVerifier ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    UltraHonk verifier
                  </dt>
                  <dd className="break-all font-mono text-xs">
                    <a
                      href={etherscanVerifier}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      {HONK_VERIFIER_ADDRESS}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={`/api/receipt/${attestationId}`}
                download={`vane-cbam-receipt-${attestationId}.json`}
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] px-4 py-2.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
              >
                Download W3C receipt JSON
              </a>
              <a
                href={etherscanRegistry}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] px-4 py-2.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-primary)] transition-colors duration-150 min-h-[44px]"
              >
                Inspect on Etherscan
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
              What this receipt proves
            </h2>
            <ul className="mt-3 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              <li className="py-3 font-body text-xs text-[var(--text-secondary)]">
                The facility allocation leaf commits to clean energy that exists inside a
                Poseidon2 Merkle tree, and the root was clean on the meter oracle when the proof was
                sealed.
              </li>
              <li className="py-3 font-body text-xs text-[var(--text-secondary)]">
                Total embedded emissions, direct plus grid indirect, stay at or below the declared
                intensity ceiling multiplied by the private shipment mass.
              </li>
              <li className="py-3 font-body text-xs text-[var(--text-secondary)]">
                The invoice nullifier was unused before this transaction, so the same shipment cannot
                be counted twice across buyers or customs declarations.
              </li>
            </ul>
          </div>

          <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--success)]">
              Zero private data
            </p>
            <p className="mt-2 font-body text-xs text-[var(--text-secondary)]">
              Unit price, supplier tax identifier, customer EORI and batch volume are absent from the
              chain, this page and the receipt JSON.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-body text-xs text-[var(--text-muted)] max-w-[56ch]">
            Share this URL with an EU importer or customs declarant. No wallet is required to verify
            it.
          </p>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] hover:underline"
          >
            Issue zero-leak CBAM receipts for your suppliers
          </Link>
        </div>
      </div>
    </div>
  );
}
