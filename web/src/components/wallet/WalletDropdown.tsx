"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useAccount, useDisconnect } from "wagmi";

/**
 * Props accepted by the wallet dropdown.
 */
interface WalletDropdownProps {
  /** Address of the connected exporter wallet. */
  address: string;
  /** Number of proofs sealed by the connected wallet. */
  proofCount: number;
  /** Called after the operator disconnects the wallet. */
  onDisconnected: () => void;
}

/**
 * Position of the dropdown panel relative to the viewport.
 */
interface PanelPosition {
  /** Distance from the top of the viewport. */
  top: number;
  /** Distance from the right of the viewport. */
  right: number;
}

/**
 * Wallet menu rendered inside the console shell.
 *
 * The panel is portalled to the document body so it is never clipped by the console frame, and it
 * closes on Escape or on an outside click without a blocking backdrop.
 */
export function WalletDropdown({ address, proofCount, onDisconnected }: WalletDropdownProps) {
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<PanelPosition>({ top: 72, right: 24 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Recomputes the panel position from the trigger element.
   */
  const syncPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    syncPosition();

    /**
     * Closes the menu when the pointer lands outside the trigger and the panel.
     *
     * @param event The pointer event.
     */
    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    /**
     * Closes the menu when the operator presses Escape.
     *
     * @param event The keyboard event.
     */
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", syncPosition);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", syncPosition);
    };
  }, [open, syncPosition]);

  /**
   * Copies the wallet address and resets the label after 1.8 seconds.
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [address]);

  /**
   * Records the disconnect intent and clears the session.
   */
  const handleDisconnect = useCallback(() => {
    document.cookie = "vane_disconnected=1; path=/; max-age=86400; SameSite=Lax";
    setOpen(false);
    onDisconnected();
    disconnect();
  }, [disconnect, onDisconnected]);

  const panel =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                ref={panelRef}
                role="menu"
                aria-label="Wallet menu"
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "fixed",
                  top: position.top,
                  right: position.right,
                  width: 300,
                  transformOrigin: "top right",
                  zIndex: "var(--z-dropdown)",
                }}
                className="rounded-[10px] bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--border-default)] shadow-[var(--shadow-modal)] p-3.5"
              >
                <div className="rounded-[10px] bg-[var(--bg-surface)] px-3.5 py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--success)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                    PINN + NOIR PROVER READY
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">WASM v0.36</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[var(--text-primary)]">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="Copy wallet address"
                      className="w-8 h-8 rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-colors duration-150"
                    >
                      {copied ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect
                            x="9"
                            y="9"
                            width="11"
                            height="11"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="1.75"
                          />
                          <path
                            d="M15 5.5A2.5 2.5 0 0012.5 3H6.5A2.5 2.5 0 004 5.5v6A2.5 2.5 0 006.5 14"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                    <a
                      href={`https://sepolia.etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open wallet on Sepolia Etherscan"
                      className="w-8 h-8 rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-colors duration-150"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h4"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                {copied ? (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                    Copied
                  </p>
                ) : null}

                <div className="mt-3 grid grid-cols-2 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)] pt-3">
                  <div className="pr-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Network
                    </p>
                    <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">ETH Sepolia</p>
                  </div>
                  <div className="pl-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Proofs
                    </p>
                    <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">{proofCount}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full mt-3 py-2.5 px-3.5 rounded-[10px] bg-[var(--error-bg)] hover:bg-[#f2555a]/20 border border-[var(--error)]/30 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--error)] flex items-center justify-center gap-2 transition-colors duration-150"
                >
                  Disconnect wallet
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--accent)] px-3.5 py-2 rounded-full font-mono text-xs text-[var(--text-primary)] transition-colors duration-150 min-h-[40px]"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
        {address.slice(0, 6)}...{address.slice(-4)}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {panel}
    </>
  );
}
