"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { VaneField } from "@/components/canvas/VaneField";
import { Nav } from "@/components/layout/Nav";
import { AppErrorBoundary } from "@/components/system/AppErrorBoundary";
import { DisconnectToast } from "@/components/wallet/DisconnectToast";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { WalletGateProvider } from "@/components/wallet/WalletGate";
import { wagmiConfig } from "@/lib/wagmi";

/**
 * Inner shell that reads wallet state from the providers above it.
 *
 * @param props Shell children.
 * @returns The navigation, page content and wallet chrome.
 */
function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const inConsole = pathname?.startsWith("/app") ?? false;
  const showField = pathname === "/";

  return (
    <WalletGateProvider
      openWallet={() => setWalletModalOpen(true)}
      isConnected={isConnected}
      address={address}
    >
      <AppErrorBoundary label="Application recovery">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[var(--z-tooltip)] focus:bg-[var(--accent)] focus:text-[#0a0b0d] focus:px-4 focus:py-2 focus:rounded-full focus:font-mono focus:text-xs focus:font-semibold"
        >
          Skip to main content
        </a>

        {showField ? <VaneField /> : null}

        <div
          aria-hidden="true"
          className="fixed inset-0 z-[var(--z-grain)] pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
          }}
        />

        {!inConsole ? (
          <Nav isConnected={isConnected} onConnectClick={() => setWalletModalOpen(true)} />
        ) : null}

        <main id="main-content">{children}</main>

        <WalletConnectModal
          open={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          onConnected={() => {
            setWalletModalOpen(false);
            router.push("/app");
          }}
        />

        {!inConsole ? (
          <Suspense fallback={null}>
            <DisconnectToast />
          </Suspense>
        ) : null}
      </AppErrorBoundary>
    </WalletGateProvider>
  );
}

/**
 * Client side shell that owns the wallet providers and the navigation chrome.
 *
 * The provider sits outside every hook so server rendering and prerendering always resolve the
 * wagmi config before any wallet hook runs.
 *
 * @param props Shell children.
 * @returns The application shell.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppShellInner>{children}</AppShellInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
