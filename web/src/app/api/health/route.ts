import { NextResponse } from "next/server";

/**
 * Reports service health, the active chain identifier and live weather feed reachability.
 */
export const dynamic = "force-dynamic";

/**
 * Handles a health probe request.
 *
 * @returns The service health payload.
 */
export async function GET(): Promise<NextResponse> {
  let openMeteoReachable = false;
  try {
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=40.8&longitude=29.43&current=temperature_2m",
      { next: { revalidate: 0 } },
    );
    openMeteoReachable = response.ok;
  } catch {
    openMeteoReachable = false;
  }

  return NextResponse.json({
    ok: true,
    chainId: 11155111,
    openMeteoReachable,
    oracleAddress: process.env.NEXT_PUBLIC_VANE_METER_ORACLE_ADDRESS ?? null,
    registryAddress: process.env.NEXT_PUBLIC_VANE_ATTESTATION_REGISTRY_ADDRESS ?? null,
    verifierAddress: process.env.NEXT_PUBLIC_HONK_VERIFIER_ADDRESS ?? null,
  });
}
