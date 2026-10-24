"use client";

import Link from "next/link";

/**
 * Props accepted by the wallet recovery panel.
 */
interface WalletRecoveryPanelProps {
  /** Called when the operator asks to retry the wallet handshake. */
  onRetry: () => void;
}

/**
 * Recovery panel shown when the browser wallet provider fails to answer.
 *
 * An RPC failure or an extension error is never treated as proof that the wallet was disconnected,
 * so the console keeps the route in place and offers an explicit retry.
 */
export function WalletRecoveryPanel({ onRetry }: WalletRecoveryPanelProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]">
        <div className="rounded-[10px] bg-[var(--bg-secondary)] p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--error)] mb-3">
            Wallet provider recovery
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)]">
            The wallet provider did not answer
          </h1>
          <p className="mt-3 font-body text-sm text-[var(--text-secondary)] leading-relaxed">
            The console could not reach the browser wallet extension. Unlock the extension, confirm
            it is allowed on this site, then retry the connection.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] px-5 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150"
            >
              Retry connection
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)]/80 text-[var(--text-primary)] px-5 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150"
            >
              Return to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
