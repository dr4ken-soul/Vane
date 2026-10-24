"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { createStore, type EIP6963ProviderDetail } from "mipd";

/**
 * Props accepted by the wallet connection modal.
 */
interface WalletConnectModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Called when the operator asks to close the modal. */
  onClose: () => void;
  /** Called once a wallet is connected and verified on Sepolia. */
  onConnected: () => void;
}

/**
 * Internal state machine of the modal.
 */
type ModalState = "idle" | "connecting" | "wrong-chain" | "success" | "error";

/**
 * Names shown for the well known EIP-6963 wallets.
 */
const KNOWN_WALLETS: Record<string, string> = {
  "io.metamask": "MetaMask",
  "com.rabby": "Rabby",
  "com.coinbase.wallet": "Coinbase Wallet",
  "com.trustwallet.app": "Trust Wallet",
  "io.okex.wallet": "OKX Wallet",
};

/**
 * Shortens a wallet address for display.
 *
 * @param address Full wallet address.
 * @returns The shortened address.
 */
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Modal that owns the whole wallet connection handshake.
 *
 * The modal lists the EIP-6963 wallets detected in the browser, drives the connection attempt,
 * verifies the active chain and reports the outcome back to the console shell.
 */
export function WalletConnectModal({ open, onClose, onConnected }: WalletConnectModalProps) {
  const { connectors, connect, error, isPending, reset } = useConnect();
  const { chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [state, setState] = useState<ModalState>("idle");
  const [message, setMessage] = useState("");
  const [providers, setProviders] = useState<readonly EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    if (!open) return;
    const store = createStore();
    const unsubscribe = store.subscribe(
      (details) => setProviders(details),
      { emitImmediately: true },
    );
    return () => {
      unsubscribe();
      store.destroy();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setState("idle");
      setMessage("");
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!error) return;
    setState("error");
    setMessage(
      error.message.includes("User rejected") || error.message.includes("rejected")
        ? "Connection request rejected in wallet. Select a wallet below to try again."
        : error.message,
    );
  }, [error]);

  useEffect(() => {
    if (isPending) {
      setState("connecting");
      setMessage("Confirm connection in your wallet extension.");
    }
  }, [isPending]);

  useEffect(() => {
    if (!isConnected || state !== "success") return;
    const timer = window.setTimeout(() => {
      onConnected();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [isConnected, state, onConnected]);

  const walletOptions = useMemo(() => {
    const detected = providers.map((detail) => ({
      id: `eip6963-${detail.info.rdns}`,
      name: KNOWN_WALLETS[detail.info.rdns] ?? detail.info.name,
      icon: detail.info.icon,
      connectorId: null as string | null,
    }));

    const injectedConnectors = connectors
      .filter((connector) => connector.type === "injected")
      .map((connector) => ({
        id: `wagmi-${connector.id}`,
        name: connector.name === "Injected" ? "Browser wallet" : connector.name,
        icon: connector.icon,
        connectorId: connector.id,
      }));

    const walletConnectConnectors = connectors
      .filter((connector) => connector.type === "walletConnect")
      .map((connector) => ({
        id: `wagmi-${connector.id}`,
        name: "WalletConnect",
        icon: connector.icon,
        connectorId: connector.id,
      }));

    const merged = [...detected, ...injectedConnectors, ...walletConnectConnectors];
    const seen = new Set<string>();
    return merged.filter((option) => {
      if (seen.has(option.name)) return false;
      seen.add(option.name);
      return true;
    });
  }, [providers, connectors]);

  /**
   * Connects with the chosen wallet.
   *
   * @param optionId Identifier of the selected wallet option.
   */
  const handleSelect = useCallback(
    (optionId: string) => {
      const option = walletOptions.find((entry) => entry.id === optionId);
      if (!option) return;

      setState("connecting");
      setMessage("Confirm connection in your wallet extension.");

      document.cookie = "vane_disconnected=; path=/; max-age=0; SameSite=Lax";

      const connector =
        connectors.find((item) => item.id === option.connectorId) ??
        connectors.find((item) => item.type === "injected") ??
        connectors[0];

      if (!connector) {
        setState("error");
        setMessage("No wallet connector is available in this browser. Install MetaMask and reload the page.");
        return;
      }

      connect({ connector, chainId: sepolia.id });
    },
    [walletOptions, connectors, connect],
  );

  /**
   * Switches the connected wallet to Ethereum Sepolia.
   */
  const handleSwitch = useCallback(() => {
    setState("connecting");
    setMessage("Confirm the network switch in your wallet extension.");
    switchChain({ chainId: sepolia.id });
  }, [switchChain]);

  useEffect(() => {
    if (!isConnected) return;
    if (chainId === sepolia.id) {
      setState("success");
      setMessage("Wallet verified. Opening console.");
      return;
    }
    setState("wrong-chain");
    setMessage("Switch network to Ethereum Sepolia to verify and submit proofs.");
  }, [isConnected, chainId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/60 backdrop-blur-sm">
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] max-w-[420px] p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-modal)]"
        role="dialog"
        aria-modal="true"
        aria-label="Connect wallet"
      >
        <div className="rounded-[10px] bg-[var(--bg-secondary)] p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                Wallet handshake
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase text-[var(--text-primary)]">
                Connect on Sepolia
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close wallet dialog"
              disabled={state === "connecting"}
              className="w-9 h-9 rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] flex items-center justify-center transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Ethereum Sepolia · Chain 11155111
          </p>

          {state === "connecting" ? (
            <div className="mt-6">
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-[var(--accent)] animate-shimmer" />
              </div>
              <p className="mt-4 font-body text-sm text-[var(--text-secondary)]">{message}</p>
            </div>
          ) : null}

          {state === "wrong-chain" ? (
            <div className="mt-6">
              <div className="rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] p-4">
                <p className="font-body text-sm text-[var(--error)]">{message}</p>
              </div>
              <button
                type="button"
                onClick={handleSwitch}
                disabled={isSwitching}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#0a0b0d] py-3 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 disabled:opacity-50"
              >
                Switch to Sepolia
              </button>
            </div>
          ) : null}

          {state === "success" ? (
            <div className="mt-6 rounded-[10px] border border-[var(--success)]/30 bg-[var(--success-bg)] p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--success)]">
                  {message}
                </p>
              </div>
            </div>
          ) : null}

          {state === "error" ? (
            <div className="mt-6 rounded-[10px] border border-[var(--error)]/30 bg-[var(--error-bg)] p-4">
              <p className="font-body text-sm text-[var(--error)]">{message}</p>
            </div>
          ) : null}

          {state === "idle" || state === "error" ? (
            <ul className="mt-6 divide-y divide-[var(--border-subtle)]">
              {walletOptions.length === 0 ? (
                <li className="py-4 font-body text-sm text-[var(--text-secondary)]">
                  No browser wallet was detected. Install MetaMask or use a WalletConnect wallet.
                </li>
              ) : null}
              {walletOptions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className="w-full flex items-center gap-3 py-4 text-left group"
                  >
                    <span className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center overflow-hidden">
                      {option.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={option.icon} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          {option.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="flex-1 font-body text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-150">
                      {option.name}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-150"
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {isConnected ? (
            <button
              type="button"
              onClick={() => {
                disconnect();
                onClose();
              }}
              className="mt-6 w-full font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors duration-150"
            >
              Disconnect current wallet
            </button>
          ) : null}

          {chainId && chainId !== sepolia.id && state === "idle" ? (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Active chain {chainId}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
