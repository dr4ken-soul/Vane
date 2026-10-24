"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { ConsoleSkeleton } from "@/components/system/ConsoleSkeleton";
import { WalletRecoveryPanel } from "@/components/system/WalletRecoveryPanel";

/**
 * Reads the disconnect intent cookie set by the wallet menu.
 *
 * @returns True when the operator deliberately disconnected.
 */
function hasDisconnectIntent(): boolean {
  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .includes("vane_disconnected=1");
}

/**
 * Checks whether wagmi holds a restored wallet session in its cookie store.
 *
 * A clean visitor also receives a `wagmi.store` cookie with empty connections, so the cookie
 * name alone cannot distinguish a missing extension from a cold visit.
 *
 * @returns True when a previous connection is present in the cookie state.
 */
function hasStoredWalletSession(): boolean {
  const prefix = "wagmi.store=";
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return false;

  try {
    const parsed = JSON.parse(decodeURIComponent(entry.slice(prefix.length))) as {
      state?: { current?: string | null; connections?: { value?: unknown[] } };
    };
    if (parsed.state?.current) return true;
    return Array.isArray(parsed.state?.connections?.value) && parsed.state.connections.value.length > 0;
  } catch {
    return false;
  }
}

/**
 * Protected console layout.
 *
 * A restored wallet session renders the exact requested route without any redirect. A disconnected
 * session returns to the landing page with the disconnect toast, while a missing but previously
 * connected wallet provider surfaces the recovery panel instead of a false disconnection.
 *
 * @param props Console route content.
 * @returns The protected console frame.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isConnected, status } = useAccount();
  const [restored, setRestored] = useState(false);
  const [providerMissing, setProviderMissing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRestored(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const injected = (window as Window & { ethereum?: unknown }).ethereum;
    setProviderMissing(!injected && hasStoredWalletSession());
  }, []);

  useEffect(() => {
    if (!restored) return;
    if (hasDisconnectIntent()) {
      router.replace("/?disconnected=1");
      return;
    }
    if (
      !isConnected &&
      status !== "connecting" &&
      status !== "reconnecting" &&
      !providerMissing
    ) {
      router.replace("/?disconnected=1");
    }
  }, [restored, isConnected, status, providerMissing, router]);

  if (restored && providerMissing && !isConnected) {
    return <WalletRecoveryPanel onRetry={() => window.location.reload()} />;
  }

  if (!restored || !isConnected) {
    return <ConsoleSkeleton />;
  }

  return <ConsoleShell>{children}</ConsoleShell>;
}
