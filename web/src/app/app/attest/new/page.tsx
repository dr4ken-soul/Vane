"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodeEventLog, formatEther, type Hex } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { useNoirProver } from "@/hooks/useNoirProver";
import {
  CONTRACTS_CONFIGURED,
  VANE_ATTESTATION_REGISTRY_ABI,
  VANE_ATTESTATION_REGISTRY_ADDRESS,
  VANE_METER_ORACLE_ABI,
  VANE_METER_ORACLE_ADDRESS,
} from "@/lib/contracts";
import {
  buildAllocationTree,
  buildInvoiceAllocations,
  computeInvoiceNullifier,
} from "@/lib/noir/energyMerkle";
import type { ProverInputs } from "@/lib/noir/proverTypes";
import { FIELD_MODULUS, toHex32 } from "@/lib/noir/poseidon2";
import { hashInvoiceSerial, hashMeterId, hashTaxId } from "@/lib/noir/taxIdHash";
import { parseUblInvoice, type ParsedUblInvoice } from "@/lib/ubl/parseUblInvoice";

/**
 * Sample invoice offered inside the prover input step.
 */
interface SampleInvoice {
  /** File name inside public/samples. */
  file: string;
  /** Display label. */
  label: string;
  /** Commodity description. */
  commodity: string;
}

/**
 * Sample UBL 2.1 invoices shipped with the application.
 */
const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    file: "gebze_hot_rolled_coil.xml",
    label: "Gebze hot rolled coil",
    commodity: "CN 7208 steel",
  },
  {
    file: "iskenderun_aluminium_billet.xml",
    label: "Iskenderun aluminium billet",
    commodity: "CN 7601 aluminium",
  },
  {
    file: "antalya_cement_kiln.xml",
    label: "Antalya cement kiln",
    commodity: "CN 2523 cement",
  },
  {
    file: "antalya_solar_ppa.xml",
    label: "Antalya solar PPA",
    commodity: "CN 2710 electricity",
  },
];

/**
 * Labels for the three prover stages.
 */
const STEP_LABELS = [
  "Parse UBL 2.1 invoice",
  "Generate browser ZK proof",
  "Submit to Sepolia",
] as const;

/**
 * Expected proof public values derived from the invoice witness.
 */
interface DerivedProof {
  /** Facility allocation Merkle root. */
  root: Hex;
  /** Poseidon2 invoice nullifier. */
  nullifier: Hex;
  /** Declared intensity ceiling in kilograms per tonne. */
  maxIntensity: number;
  /** Combined Nomenclature commodity code. */
  cnCode: number;
  /** Circuit input map posted to the proving worker. */
  inputs: ProverInputs;
  /** Merkle path used by leaf zero. */
  merklePath: string[];
  /** Branch indices used by leaf zero. */
  merkleIndices: boolean[];
}

/**
 * Formats a hexadecimal value for dense tables.
 *
 * @param value Hexadecimal string.
 * @param lead Leading characters to keep.
 * @param tail Trailing characters to keep.
 * @returns The shortened value.
 */
function shorten(value: string, lead = 10, tail = 8): string {
  if (value.length <= lead + tail + 3) return value;
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

/**
 * Builds the circuit inputs and public values from a parsed invoice.
 *
 * @param invoice Parsed UBL invoice.
 * @param invoiceSerial Invoice serial override used for a fresh nullifier.
 * @returns The derived proof values.
 */
function deriveProof(invoice: ParsedUblInvoice, invoiceSerial: string): DerivedProof {
  const witness = invoice.witness;
  const supplierTaxIdHash = hashTaxId(witness.supplierTaxId);
  const allocations = buildInvoiceAllocations(witness.cleanKwhAllocated, witness.cleanBatchKwh);
  const tree = buildAllocationTree(allocations, supplierTaxIdHash);
  const leaf = tree.leaves[0];
  const invoiceSerialSecret = hashInvoiceSerial(invoiceSerial);
  const nullifier = computeInvoiceNullifier(
    supplierTaxIdHash,
    invoiceSerialSecret,
    witness.cleanKwhAllocated,
  );

  const root = `0x${toHex32(tree.root)}` as Hex;
  const nullifierHex = `0x${toHex32(nullifier)}` as Hex;
  const merklePath = leaf.path.map((value) => `0x${toHex32(value)}`);
  const merkleIndices = leaf.indices.map((value) => value === 1);
  const shipmentMassTonnes = Math.max(1, Math.floor(witness.shipmentMassKg / 1000));

  const inputs: ProverInputs = {
    unit_price_eur_cents: String(witness.unitPriceCents),
    supplier_tax_id_hash: `0x${toHex32(supplierTaxIdHash)}`,
    invoice_serial_secret: `0x${toHex32(invoiceSerialSecret)}`,
    clean_kwh_allocated: String(witness.cleanKwhAllocated),
    grid_kwh_allocated: String(witness.gridKwhAllocated),
    direct_process_emissions_kg: String(witness.directProcessEmissionsKg),
    shipment_mass_tonnes: String(shipmentMassTonnes),
    grid_emission_factor_g_per_kwh: String(witness.gridEmissionFactorGPerKwh),
    merkle_leaf_salt: `0x${toHex32(1n)}`,
    merkle_path: merklePath,
    merkle_indices: merkleIndices,
    facility_merkle_root: root,
    invoice_nullifier: nullifierHex,
    max_intensity_kg_per_tonne: String(witness.maxIntensityKgPerTonne),
    cn_commodity_code: String(witness.cnCommodityCode),
  };

  return {
    root,
    nullifier: nullifierHex,
    maxIntensity: witness.maxIntensityKgPerTonne,
    cnCode: witness.cnCommodityCode,
    inputs,
    merklePath,
    merkleIndices,
  };
}

/**
 * Returns the current hour window used by the preflight anchor.
 *
 * @returns Start and end timestamps in seconds.
 */
function currentHourWindow(): { start: number; end: number } {
  const end = Math.floor(Date.now() / 3600000) * 3600;
  return { start: end - 3600, end };
}

/**
 * Three step browser ZK CBAM prover console.
 */
export default function NewAttestationPage() {
  const { isConnected } = useAccount();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [xml, setXml] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [serialOverride, setSerialOverride] = useState("");
  const [serialError, setSerialError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [attestationId, setAttestationId] = useState<number | null>(null);
  const [receiptJson, setReceiptJson] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const parsed = useMemo(() => (xml ? parseUblInvoice(xml) : null), [xml]);
  const invoice = parsed?.invoice ?? null;
  const parseErrors = parsed?.errors ?? [];

  useEffect(() => {
    if (invoice) {
      setSerialOverride(invoice.witness.invoiceSerial);
      setSerialError(null);
    }
  }, [invoice]);

  const derived = useMemo(() => {
    if (!invoice) return null;
    const serial = serialOverride.trim() || invoice.witness.invoiceSerial;
    return deriveProof(invoice, serial);
  }, [invoice, serialOverride]);

  const { phase, detail, result, error, isProving, prove, reset } = useNoirProver();

  const { data: rootIsClean, refetch: refetchRootClean } = useReadContract({
    address: VANE_METER_ORACLE_ADDRESS ?? undefined,
    abi: VANE_METER_ORACLE_ABI,
    functionName: "isRootClean",
    args: derived ? [derived.root] : undefined,
    query: { enabled: Boolean(derived) && CONTRACTS_CONFIGURED },
  });

  const { data: nullifierUsed, refetch: refetchNullifier } = useReadContract({
    address: VANE_ATTESTATION_REGISTRY_ADDRESS ?? undefined,
    abi: VANE_ATTESTATION_REGISTRY_ABI,
    functionName: "usedNullifiers",
    args: derived ? [derived.nullifier] : undefined,
    query: { enabled: Boolean(derived) && CONTRACTS_CONFIGURED },
  });

  const { data: protocolFee } = useReadContract({
    address: VANE_ATTESTATION_REGISTRY_ADDRESS ?? undefined,
    abi: VANE_ATTESTATION_REGISTRY_ABI,
    functionName: "protocolFeeWei",
    query: { enabled: CONTRACTS_CONFIGURED },
  });

  const { data: liveTelemetry } = useLiveTelemetry({
    lat: invoice?.witness.facilityLatitude ?? 40.8,
    lon: invoice?.witness.facilityLongitude ?? 29.43,
    kw: Math.max(1, invoice?.witness.cleanBatchKwh ?? 1200),
    refreshMs: 0,
    enabled: Boolean(invoice),
  });

  const {
    writeContract: anchorRoot,
    data: anchorHash,
    isPending: anchoring,
    error: anchorError,
    reset: resetAnchor,
  } = useWriteContract();

  const { isLoading: anchorConfirming, isSuccess: anchorConfirmed } =
    useWaitForTransactionReceipt({ hash: anchorHash });

  const {
    writeContract: submitAttestation,
    data: attestHash,
    isPending: submitting,
    error: attestError,
    reset: resetAttest,
  } = useWriteContract();

  const {
    isLoading: attestConfirming,
    isSuccess: attestConfirmed,
    data: attestReceipt,
  } = useWaitForTransactionReceipt({ hash: attestHash });

  useEffect(() => {
    if (anchorConfirmed) {
      void refetchRootClean();
    }
  }, [anchorConfirmed, refetchRootClean]);

  useEffect(() => {
    if (!attestConfirmed || !attestReceipt) return;
    let sealedId = 0;
    for (const log of attestReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: VANE_ATTESTATION_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "AttestationSealed") {
          sealedId = Number(decoded.args.attestationId);
        }
      } catch {
        sealedId = 0;
      }
    }
    if (sealedId > 0) {
      setAttestationId(sealedId);
      void refetchNullifier();
    }
  }, [attestConfirmed, attestReceipt, refetchNullifier]);

  useEffect(() => {
    if (!attestationId) return;
    let cancelled = false;
    const loadReceipt = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/receipt/${attestationId}`, { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          if (!cancelled) {
            setReceiptError(payload.error ?? "The receipt could not be read from Sepolia.");
          }
          return;
        }
        const payload = (await response.json()) as unknown;
        if (!cancelled) {
          setReceiptJson(JSON.stringify(payload, null, 2));
          setReceiptError(null);
        }
      } catch {
        if (!cancelled) {
          setReceiptError("The receipt route could not be reached. Retry in a moment.");
        }
      }
    };
    void loadReceipt();
    return () => {
      cancelled = true;
    };
  }, [attestationId]);

  /**
   * Clears every downstream prover and settlement state.
   */
  const resetFlow = useCallback(() => {
    reset();
    resetAnchor();
    resetAttest();
    setAttestationId(null);
    setReceiptJson(null);
    setReceiptError(null);
  }, [reset, resetAnchor, resetAttest]);

  /**
   * Reads and parses an invoice file.
   *
   * @param file Selected XML file.
   */
  const handleFile = async (file: File): Promise<void> => {
    setFileError(null);
    resetFlow();
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setFileError(
        "The invoice must be a UBL 2.1 XML document. Rename the file with an .xml extension and try again.",
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError(
        "The invoice is larger than two megabytes. Export the single UBL document without embedded attachments and try again.",
      );
      return;
    }
    try {
      const text = await file.text();
      setXml(text);
      setFileName(file.name);
      setSerialOverride("");
    } catch {
      setFileError("The file could not be read. Export the invoice again and retry the drop.");
    }
  };

  /**
   * Loads one of the pre-built sample invoices.
   *
   * @param sample Sample descriptor.
   */
  const loadSample = async (sample: SampleInvoice): Promise<void> => {
    setLoadingSample(sample.file);
    setFileError(null);
    resetFlow();
    try {
      const response = await fetch(`/samples/${sample.file}`, { cache: "no-store" });
      if (!response.ok) {
        setFileError("The sample invoice could not be loaded. Retry in a moment.");
        return;
      }
      const text = await response.text();
      setXml(text);
      setFileName(sample.file);
      setSerialOverride("");
    } catch {
      setFileError("The sample invoice could not be loaded. Retry in a moment.");
    } finally {
      setLoadingSample(null);
    }
  };

  /**
   * Validates the invoice serial override when the field loses focus.
   */
  const validateSerial = (): void => {
    const value = serialOverride.trim();
    if (value.length < 3) {
      setSerialError(
        "Enter at least three characters for the invoice serial. The serial seeds the private nullifier that blocks double counting.",
      );
      return;
    }
    if (!/^[A-Za-z0-9._/-]+$/.test(value)) {
      setSerialError(
        "Use letters, digits, dots, slashes, underscores or hyphens only. Remove spaces and symbols before generating a proof.",
      );
      return;
    }
    setSerialError(null);
  };

  /**
   * Starts browser proof generation.
   */
  const handleProve = (): void => {
    if (!derived) return;
    resetFlow();
    prove(derived.inputs);
  };

  /**
   * Anchors the facility root before settlement when it is not yet clean.
   */
  const handleAnchorRoot = (): void => {
    if (!derived || !invoice || !VANE_METER_ORACLE_ADDRESS) return;
    const window = currentHourWindow();
    const residualBps = Math.min(1200, Math.max(0, liveTelemetry?.residualBps ?? 0));
    resetAttest();
    anchorRoot({
      address: VANE_METER_ORACLE_ADDRESS,
      abi: VANE_METER_ORACLE_ABI,
      functionName: "submitHourlyRoot",
      args: [
        derived.root,
        hashMeterId(invoice.witness.facilityMeterId),
        BigInt(window.start),
        BigInt(window.end),
        residualBps,
      ],
    });
  };

  /**
   * Submits the generated proof to the Sepolia registry.
   */
  const handleSubmit = (): void => {
    if (!result || !VANE_ATTESTATION_REGISTRY_ADDRESS) return;
    submitAttestation({
      address: VANE_ATTESTATION_REGISTRY_ADDRESS,
      abi: VANE_ATTESTATION_REGISTRY_ABI,
      functionName: "submitAttestation",
      args: [result.proofHex, result.publicInputs],
      value: protocolFee ?? 0n,
    });
  };

  /**
   * Downloads the W3C receipt JSON from browser memory.
   */
  const downloadReceipt = (): void => {
    if (!receiptJson || !attestationId) return;
    const blob = new Blob([receiptJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vane-cbam-receipt-${attestationId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const publicInputsMatch = useMemo(() => {
    if (!result || !derived) return false;
    const expected = [
      derived.root,
      derived.nullifier,
      `0x${toHex32(BigInt(derived.maxIntensity))}`,
      `0x${toHex32(BigInt(derived.cnCode))}`,
    ].map((value) => value.toLowerCase());
    if (result.publicInputs.length !== expected.length) return false;
    return result.publicInputs.every(
      (value, index) => value.toLowerCase() === expected[index],
    );
  }, [derived, result]);

  const activeStep = attestationId ? 3 : result ? 3 : invoice ? 2 : 1;
  const progressWidth =
    phase === "ready" ? "100%" : phase === "proving" ? "72%" : phase === "witness" ? "44%" : phase === "loading" ? "22%" : "0%";
  const feeLabel = protocolFee !== undefined ? formatEther(protocolFee) : "0";
  const canSubmit =
    isConnected &&
    CONTRACTS_CONFIGURED &&
    Boolean(result) &&
    publicInputsMatch &&
    Boolean(rootIsClean) &&
    !nullifierUsed &&
    !submitting &&
    !attestConfirming;
  const residualOk = (liveTelemetry?.residualBps ?? 0) <= 1200;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
            Client-side CBAM prover
          </p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold uppercase tracking-[-0.01em] text-[var(--text-primary)]">
            Seal a shipment proof from a UBL 2.1 invoice
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--text-secondary)] max-w-[62ch]">
            Commercial pricing, supplier tax identifiers and batches stay in this tab. Only the proof
            bytes and four public values reach Ethereum Sepolia.
          </p>
        </div>
        <Link
          href="/verify"
          className="self-start sm:self-auto inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-150 min-h-[40px]"
        >
          Public verifier
        </Link>
      </div>

      <ol className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="Prover progress">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const done = step < activeStep;
          const active = step === activeStep;
          return (
            <li
              key={label}
              className={`rounded-[10px] border px-4 py-3 ${
                active
                  ? "border-[var(--accent)]/40 bg-[var(--accent-glow)]"
                  : done
                    ? "border-[var(--success)]/30 bg-[var(--success-bg)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              }`}
            >
              <p
                className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                  active
                    ? "text-[var(--accent)]"
                    : done
                      ? "text-[var(--success)]"
                      : "text-[var(--text-muted)]"
                }`}
              >
                Step {step}
              </p>
              <p className="mt-1 font-body text-xs text-[var(--text-secondary)]">{label}</p>
            </li>
          );
        })}
      </ol>

      <section className="mt-8" aria-labelledby="step-one">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="step-one"
            className="font-display text-lg font-bold uppercase text-[var(--text-primary)]"
          >
            Step 1: Parse UBL 2.1 invoice
          </h3>
          {fileName ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {fileName}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
              className={`rounded-2xl border border-dashed p-6 md:p-8 text-center transition-colors duration-150 ${
                dragging
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                  : "border-[var(--border-default)] bg-[var(--bg-surface)]"
              }`}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="mx-auto text-[var(--accent)]"
              >
                <path
                  d="M12 16V4m0 0L7 9m5-5l5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-3 font-body text-sm text-[var(--text-primary)]">
                Drop a UBL 2.1 XML invoice here, or choose a file.
              </p>
              <p className="mt-1 font-body text-xs text-[var(--text-muted)]">
                The parser never uploads the document. Private fields stay in browser memory.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,application/xml,text/xml"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 border border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--bg-elevated)] px-4 py-2.5 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-primary)] transition-colors duration-150 min-h-[44px]"
              >
                Choose XML file
              </button>
            </div>

            {fileError ? (
              <p className="mt-3 rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-3 font-body text-xs text-[var(--error)]">
                {fileError}
              </p>
            ) : null}

            {parseErrors.length > 0 ? (
              <ul className="mt-4 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                {parseErrors.map((entry) => (
                  <li key={`${entry.field}-${entry.message}`} className="py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--error)]">
                      {entry.field}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-[var(--text-secondary)]">
                      {entry.message}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {invoice ? (
              <div className="mt-6">
                <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Invoice fields
                </h4>
                <dl className="mt-2 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">Supplier</dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] text-right">
                      {invoice.witness.supplierName}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">Buyer</dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] text-right">
                      {invoice.witness.customerName || "Not declared"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">
                      Commodity code
                    </dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                      CN {invoice.witness.cnCommodityCode}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">
                      Shipment mass
                    </dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                      {invoice.witness.shipmentMassKg.toLocaleString("en-GB")} kg
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">
                      Actual embedded intensity
                    </dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                      {invoice.actualIntensityKgPerTonne.toFixed(2)} kg/t
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">
                      Declared CBAM ceiling
                    </dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                      {invoice.witness.maxIntensityKgPerTonne} kg/t
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-body text-xs text-[var(--text-secondary)]">
                      Clean energy allocation
                    </dt>
                    <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                      {invoice.witness.cleanKwhAllocated.toLocaleString("en-GB")} /{" "}
                      {invoice.witness.cleanBatchKwh.toLocaleString("en-GB")} kWh
                    </dd>
                  </div>
                </dl>

                <label className="mt-4 block">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Invoice serial used for the nullifier
                  </span>
                  <input
                    type="text"
                    value={serialOverride}
                    onChange={(event) => setSerialOverride(event.target.value)}
                    onBlur={validateSerial}
                    className="mt-1.5 w-full bg-[var(--bg-primary)] border border-[var(--border-default)] focus:border-[var(--accent)] rounded-[10px] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none min-h-[44px]"
                  />
                  <span className="mt-1 block font-body text-xs text-[var(--text-muted)]">
                    Edit the serial to mint a fresh nullifier for a repeat demonstration.
                  </span>
                </label>
                {serialError ? (
                  <p className="mt-1 font-body text-xs text-[var(--error)]">{serialError}</p>
                ) : null}

                {!invoice.withinDeclaredCeiling ? (
                  <p className="mt-3 rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-3 font-body text-xs text-[var(--error)]">
                    This invoice exceeds its declared intensity ceiling, so the circuit will reject
                    the witness. Reduce grid energy or direct process emissions before proving.
                  </p>
                ) : null}

                {derived ? (
                  <div className="mt-4 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Derived Poseidon2 root
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-[var(--text-primary)]">
                      {derived.root}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside>
            <div className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
              <div className="rounded-[10px] bg-[var(--bg-secondary)] p-4">
                <h4 className="font-display text-sm font-bold uppercase text-[var(--text-primary)]">
                  Sample invoices
                </h4>
                <p className="mt-1 font-body text-xs text-[var(--text-muted)]">
                  Four real UBL 2.1 exports for steel, aluminium, cement and electricity.
                </p>
                <ul className="mt-3 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                  {SAMPLE_INVOICES.map((sample) => (
                    <li key={sample.file} className="py-2.5">
                      <button
                        type="button"
                        onClick={() => void loadSample(sample)}
                        disabled={loadingSample !== null}
                        className="w-full text-left min-h-[44px] disabled:opacity-40"
                      >
                        <span className="block font-mono text-[11px] text-[var(--text-primary)]">
                          {sample.label}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-muted)]">
                          {sample.commodity}
                          {loadingSample === sample.file ? " · loading" : ""}
                        </span>
                      </button>
                      <a
                        href={`/samples/${sample.file}`}
                        download
                        className="mt-1 inline-flex font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)] hover:underline"
                      >
                        Download XML
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="step-two">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="step-two"
            className="font-display text-lg font-bold uppercase text-[var(--text-primary)]"
          >
            Step 2: Generate browser ZK proof
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            UltraHonk · bb 6.0.0
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <div className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
              <div className="rounded-[10px] bg-[var(--bg-secondary)] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Prover state
                    </p>
                    <p className="mt-1 font-display text-lg font-bold uppercase text-[var(--text-primary)]">
                      {phase === "idle"
                        ? "Witness not prepared"
                        : phase === "ready"
                          ? "Proof ready"
                          : phase === "error"
                            ? "Proof stopped"
                            : phase === "proving"
                              ? "Proving UltraHonk circuit"
                              : phase === "witness"
                                ? "Compiling witness"
                                : "Loading circuit"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                      phase === "ready"
                        ? "text-[var(--success)]"
                        : phase === "error"
                          ? "text-[var(--error)]"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        phase === "ready"
                          ? "bg-[var(--success)]"
                          : phase === "error"
                            ? "bg-[var(--error)]"
                            : "bg-[var(--accent)]"
                      }`}
                    />
                    {phase}
                  </span>
                </div>

                <div
                  className="mt-4 h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number.parseInt(progressWidth, 10)}
                  aria-label="Proof generation progress"
                >
                  <div
                    className="h-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
                    style={{ width: progressWidth }}
                  />
                </div>
                <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
                  {detail || "Drop an invoice to prepare the private witness."}
                </p>

                <button
                  type="button"
                  onClick={handleProve}
                  disabled={!derived || isProving || Boolean(serialError)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--on-accent)] px-4 py-2.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
                >
                  {isProving ? "Generating proof" : result ? "Regenerate proof" : "Generate browser ZK proof"}
                </button>

                {error ? (
                  <p className="mt-3 font-body text-xs text-[var(--error)]">{error}</p>
                ) : null}

                {result ? (
                  <dl className="mt-4 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="font-body text-xs text-[var(--text-secondary)]">
                        Proving time
                      </dt>
                      <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                        {(result.durationMs / 1000).toFixed(2)} s
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="font-body text-xs text-[var(--text-secondary)]">
                        Proof size
                      </dt>
                      <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                        {(result.proofHex.length - 2) / 2} bytes
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="font-body text-xs text-[var(--text-secondary)]">
                        Public values
                      </dt>
                      <dd className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                        {result.publicInputs.length} of 4
                      </dd>
                    </div>
                  </dl>
                ) : null}

                {result && !publicInputsMatch ? (
                  <p className="mt-3 font-body text-xs text-[var(--error)]">
                    The proof public values do not match this invoice. Regenerate the proof before
                    submitting.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--error)]">
                Private witness
              </p>
              <p className="mt-1 font-body text-[11px] text-[var(--text-muted)]">
                Never leaves browser memory.
              </p>
              {invoice ? (
                <dl className="mt-3 space-y-2">
                  {[
                    ["Unit price", `${(invoice.witness.unitPriceCents / 100).toFixed(2)} EUR`],
                    ["Supplier tax ID", invoice.witness.supplierTaxId],
                    ["Invoice serial", serialOverride || invoice.witness.invoiceSerial],
                    ["Clean kWh", String(invoice.witness.cleanKwhAllocated)],
                    ["Grid kWh", String(invoice.witness.gridKwhAllocated)],
                    ["Grid factor", `${invoice.witness.gridEmissionFactorGPerKwh} g/kWh`],
                    ["Direct emissions", `${invoice.witness.directProcessEmissionsKg} kg`],
                    ["Shipment mass", `${invoice.witness.shipmentMassKg} kg`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        {label}
                      </dt>
                      <dd className="break-all font-mono text-[11px] text-[var(--text-secondary)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
                  Parse an invoice to reveal the private witness fields.
                </p>
              )}
            </div>

            <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--success)]">
                Public calldata
              </p>
              <p className="mt-1 font-body text-[11px] text-[var(--text-muted)]">
                Sent to Sepolia as bytes proof and bytes32 publicInputs.
              </p>
              <dl className="mt-3 space-y-2">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Facility root
                  </dt>
                  <dd className="break-all font-mono text-[11px] text-[var(--text-secondary)]">
                    {derived ? shorten(derived.root, 14, 10) : "Not derived"}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Invoice nullifier
                  </dt>
                  <dd className="break-all font-mono text-[11px] text-[var(--text-secondary)]">
                    {derived ? shorten(derived.nullifier, 14, 10) : "Not derived"}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Intensity ceiling
                  </dt>
                  <dd className="font-mono text-[11px] text-[var(--text-secondary)]">
                    {derived ? `${derived.maxIntensity} kg/t` : "Not derived"}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Commodity code
                  </dt>
                  <dd className="font-mono text-[11px] text-[var(--text-secondary)]">
                    {derived ? `CN ${derived.cnCode}` : "Not derived"}
                  </dd>
                </div>
              </dl>

              {derived ? (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Merkle leaf path
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-[var(--text-muted)]">
                    {derived.merkleIndices.map((value) => (value ? "1" : "0")).join("")} ·{" "}
                    {derived.merklePath.length} siblings
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="step-three">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="step-three"
            className="font-display text-lg font-bold uppercase text-[var(--text-primary)]"
          >
            Step 3: Sepolia on-chain settlement
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Fee {feeLabel} ETH
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Facility root state
                  </p>
                  <p className="mt-1 font-body text-sm text-[var(--text-primary)]">
                    {rootIsClean
                      ? "The facility allocation root is anchored and clean on Sepolia."
                      : "The facility allocation root is not yet anchored, or it is quarantined."}
                  </p>
                </div>
                {derived ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                      rootIsClean ? "text-[var(--success)]" : "text-[var(--error)]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        rootIsClean ? "bg-[var(--success)]" : "bg-[var(--error)]"
                      }`}
                    />
                    {rootIsClean ? "Clean" : "Unanchored"}
                  </span>
                ) : null}
              </div>

              {derived && !rootIsClean ? (
                <div className="py-4">
                  <p className="font-body text-xs text-[var(--text-secondary)]">
                    Anchor this allocation root once before settlement. The preflight uses the live
                    Open-Meteo residual for the invoice coordinates, which reads{" "}
                    {liveTelemetry ? (liveTelemetry.residualSigma).toFixed(3) : "0.000"} sigma now.
                  </p>
                  <button
                    type="button"
                    onClick={handleAnchorRoot}
                    disabled={
                      !isConnected ||
                      !CONTRACTS_CONFIGURED ||
                      !residualOk ||
                      anchoring ||
                      anchorConfirming
                    }
                    className="mt-3 inline-flex items-center justify-center gap-2 border border-[var(--accent)]/40 bg-[var(--accent-glow)] hover:bg-[var(--accent)]/20 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--accent)] px-4 py-2.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[44px]"
                  >
                    {anchoring || anchorConfirming
                      ? "Anchoring facility root"
                      : "Anchor facility root"}
                  </button>
                  {!residualOk ? (
                    <p className="mt-2 font-body text-xs text-[var(--error)]">
                      The live residual is above the clean ceiling, so the oracle would reject this
                      anchor. Return to the meter guard and quarantine the interval first.
                    </p>
                  ) : null}
                  {anchorHash ? (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${anchorHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all font-mono text-[10px] text-[var(--accent)] hover:underline"
                    >
                      {anchorConfirmed ? "Anchored. " : "Submitted. "}
                      {anchorHash}
                    </a>
                  ) : null}
                  {anchorError ? (
                    <p className="mt-2 font-body text-xs text-[var(--error)]">
                      {anchorError.message.split("\n")[0]}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Invoice nullifier state
                  </p>
                  <p className="mt-1 font-body text-sm text-[var(--text-primary)]">
                    {nullifierUsed
                      ? "This nullifier is already sealed. Edit the invoice serial to mint a fresh one."
                      : "The nullifier is unused, so this shipment can be sealed once."}
                  </p>
                </div>
                {derived ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                      nullifierUsed ? "text-[var(--error)]" : "text-[var(--success)]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        nullifierUsed ? "bg-[var(--error)]" : "bg-[var(--success)]"
                      }`}
                    />
                    {nullifierUsed ? "Used" : "Fresh"}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--on-accent)] px-5 py-3 rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 min-h-[48px]"
            >
              {submitting || attestConfirming
                ? "Settling on Sepolia"
                : "Submit proof to Sepolia"}
            </button>

            {!isConnected ? (
              <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
                Connect a Sepolia wallet from the console header to settle this proof.
              </p>
            ) : null}

            {!CONTRACTS_CONFIGURED ? (
              <p className="mt-3 font-body text-xs text-[var(--text-muted)]">
                Sepolia contracts are not configured for this deployment. Set the three public
                addresses in web/.env.local after deployment.
              </p>
            ) : null}

            {attestError ? (
              <p className="mt-3 font-body text-xs text-[var(--error)]">
                {attestError.message.split("\n")[0]}
              </p>
            ) : null}

            {attestHash ? (
              <div className="mt-4 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--success)]">
                  {attestConfirmed ? "Attestation sealed on Sepolia" : "Settlement submitted"}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${attestHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all font-mono text-[11px] text-[var(--accent)] hover:underline"
                >
                  {attestHash}
                </a>
              </div>
            ) : null}
          </div>

          <aside>
            <div className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-bezel)]">
              <div className="rounded-[10px] bg-[var(--bg-secondary)] p-4">
                <h4 className="font-display text-sm font-bold uppercase text-[var(--text-primary)]">
                  Customs receipt
                </h4>
                {attestationId ? (
                  <>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--success)]">
                      Attestation #{attestationId}
                    </p>
                    <Link
                      href={`/verify/${attestationId}`}
                      className="mt-2 block break-all font-mono text-[11px] text-[var(--accent)] hover:underline"
                    >
                      Open /verify/{attestationId}
                    </Link>
                    <button
                      type="button"
                      onClick={downloadReceipt}
                      disabled={!receiptJson}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-primary)] transition-colors duration-150 min-h-[44px]"
                    >
                      Download receipt JSON
                    </button>
                    {receiptError ? (
                      <p className="mt-2 font-body text-xs text-[var(--error)]">{receiptError}</p>
                    ) : null}
                    {receiptJson ? (
                      <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
                        {receiptJson.length.toLocaleString("en-GB")} bytes ready
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 font-body text-xs text-[var(--text-muted)]">
                    A sealed proof produces a W3C CBAM receipt and a shareable public verification
                    link. No commercial pricing is stored in either.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Nullifier field
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-[var(--text-secondary)]">
                {derived ? derived.nullifier : "Derived after parsing"}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Field modulus
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-[var(--text-secondary)]">
                {shorten(FIELD_MODULUS.toString(16), 18, 12)}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
