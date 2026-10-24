"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { WalletDropdown } from "@/components/wallet/WalletDropdown";
import { useExporterAttestations } from "@/hooks/useExporterAttestations";

/**
 * Sidebar and mobile navigation definitions for the console.
 */
const NAV_ITEMS = [
  { href: "/app", label: "Overview", title: "Overview console" },
  { href: "/app/meters", label: "Meter guard", title: "Physics meter guard" },
  { href: "/app/attest/new", label: "New ZK proof", title: "Browser ZK CBAM prover" },
  { href: "/verify", label: "Public verifier", title: "Public customs verifier" },
] as const;

/**
 * Props accepted by the console shell.
 */
interface ConsoleShellProps {
  /** Console route content. */
  children: ReactNode;
}

/**
 * Returns the current route title.
 *
 * @param pathname Active pathname.
 * @returns The route title shown in the top bar.
 */
function routeTitle(pathname: string | null): string {
  if (!pathname) return "Overview console";
  if (pathname.startsWith("/app/meters")) return "Physics meter guard";
  if (pathname.startsWith("/app/attest")) return "Browser ZK CBAM prover";
  if (pathname.startsWith("/verify")) return "Public customs verifier";
  return "Overview console";
}

/**
 * Returns the icon for one navigation item.
 *
 * @param href Navigation target.
 * @returns A crisp inline SVG icon.
 */
function NavIcon({ href }: { href: string }) {
  if (href === "/app") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (href === "/app/meters") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 18a8 8 0 1116 0M12 14l4-4M12 18h.01"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (href === "/app/attest/new") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Wallet gated console frame with a fixed sidebar, sticky top bar and mobile bottom navigation.
 *
 * @param props Console route content.
 * @returns The console shell.
 */
export function ConsoleShell({ children }: ConsoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { attestations } = useExporterAttestations(address);

  /**
   * Records the disconnect intent, then returns to the landing page.
   */
  const handleDisconnected = (): void => {
    router.replace("/?disconnected=1");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] z-[var(--z-sticky)]">
        <div className="h-16 flex items-center px-5 border-b border-[var(--border-subtle)]">
          {/* Logo slot: replace with public/logo.svg once provided */}
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-[0.28em] uppercase text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-sm"
          >
            Vane
          </Link>
        </div>

        <nav aria-label="Console sections" className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-150 min-h-[42px] ${
                  active
                    ? "bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/25"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <span className={active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}>
                  <NavIcon href={item.href} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-subtle)]">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            Sepolia · 11155111
          </p>
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            PINN + Noir prover ready
          </p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-[var(--z-sticky)] h-16 liquid-glass border-b border-[var(--border-subtle)] flex items-center justify-between gap-4 px-4 md:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Console
            </p>
            <h1 className="font-display text-lg md:text-xl font-bold uppercase tracking-[-0.01em] text-[var(--text-primary)] truncate">
              {routeTitle(pathname)}
            </h1>
          </div>
          {address ? (
            <WalletDropdown
              address={address}
              proofCount={attestations.length}
              onDisconnected={handleDisconnected}
            />
          ) : null}
        </header>

        <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Console sections"
        className="lg:hidden fixed bottom-0 inset-x-0 h-16 liquid-glass border-t border-[var(--border-subtle)] grid grid-cols-4 items-center z-[var(--z-sticky)]"
      >
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] font-mono text-[9px] uppercase tracking-[0.1em] ${
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              <NavIcon href={item.href} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
