import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import {
  COMMODITY_LABELS,
  SEPOLIA_RPC_URL,
  VANE_ATTESTATION_REGISTRY_ABI,
  VANE_ATTESTATION_REGISTRY_ADDRESS,
} from "@/lib/contracts";

/**
 * Customs receipt route reading a sealed attestation straight from Ethereum Sepolia.
 */
export const dynamic = "force-dynamic";

/**
 * Handles a customs receipt request.
 *
 * @param request Incoming request.
 * @param context Route context carrying the attestation identifier.
 * @returns A W3C verifiable credential describing the sealed attestation.
 */
export async function GET(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const rawId = context.params.id;
  const attestationId = Number.parseInt(rawId, 10);
  if (!Number.isSafeInteger(attestationId) || attestationId <= 0) {
    return NextResponse.json(
      { error: "The receipt identifier must be a positive integer." },
      { status: 400 },
    );
  }

  if (!VANE_ATTESTATION_REGISTRY_ADDRESS) {
    return NextResponse.json(
      { error: "The attestation registry address is not configured for this deployment." },
      { status: 503 },
    );
  }

  try {
    const client = createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC_URL) });
    const attestation = await client.readContract({
      address: VANE_ATTESTATION_REGISTRY_ADDRESS,
      abi: VANE_ATTESTATION_REGISTRY_ABI,
      functionName: "attestations",
      args: [BigInt(attestationId)],
    });

    const [, exporter, facilityMerkleRoot, invoiceNullifier, maxIntensity, cnCode, sealedAt] =
      attestation;

    const sealedTimestamp = Number(sealedAt);
    if (sealedTimestamp === 0) {
      return NextResponse.json(
        { error: "No attestation with that identifier exists on Ethereum Sepolia." },
        { status: 404 },
      );
    }

    const credential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential", "VaneCbamAttestation"],
      id: `urn:vane:cbam:sepolia:${attestationId}`,
      issuer: {
        id: `did:pkh:eip155:11155111:${VANE_ATTESTATION_REGISTRY_ADDRESS}`,
        name: "Vane Attestation Registry",
      },
      issuanceDate: new Date(sealedTimestamp * 1000).toISOString(),
      credentialSubject: {
        id: `urn:vane:exporter:${exporter}`,
        attestationId: attestationId,
        exporter,
        facilityMerkleRoot,
        invoiceNullifier,
        maxIntensityKgPerTonne: Number(maxIntensity),
        cnCommodityCode: Number(cnCode),
        commodity: COMMODITY_LABELS[Number(cnCode)] ?? "Industrial precursor",
        network: "Ethereum Sepolia",
        chainId: 11155111,
        contract: VANE_ATTESTATION_REGISTRY_ADDRESS,
        privacy: {
          unitPriceShared: false,
          supplierTaxIdShared: false,
          batchVolumeShared: false,
          note: "No commercial pricing, supplier tax identifier or batch volume is stored on chain or in this receipt.",
        },
      },
      proof: {
        type: "EcdsaSecp256k1Signature2019",
        blockchain: "ethereum-sepolia",
        contract: VANE_ATTESTATION_REGISTRY_ADDRESS,
      },
    };

    return NextResponse.json(credential);
  } catch {
    return NextResponse.json(
      { error: "The Sepolia registry could not be reached. Retry in a moment." },
      { status: 502 },
    );
  }
}
