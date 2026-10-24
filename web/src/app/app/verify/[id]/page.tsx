"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Props accepted by the console receipt redirect.
 */
interface AppVerifyRedirectProps {
  /** Route parameters carrying the attestation identifier. */
  params: { id: string };
}

/**
 * Keeps deep links inside the protected console working by forwarding to the public receipt.
 *
 * @param props Route parameters.
 * @returns A short loading frame while the redirect runs.
 */
export default function AppVerifyRedirect({ params }: AppVerifyRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/verify/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Opening public receipt #{params.id}
      </p>
    </div>
  );
}
