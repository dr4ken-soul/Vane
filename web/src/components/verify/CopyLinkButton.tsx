"use client";

import { useState } from "react";

/**
 * Props accepted by the copy link button.
 */
interface CopyLinkButtonProps {
  /** Absolute or relative receipt URL copied to the clipboard. */
  value: string;
}

/**
 * Copies a receipt URL and swaps the label for confirmation.
 *
 * @param props Receipt URL.
 * @returns The copy button.
 */
export function CopyLinkButton({ value }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Copies the receipt link and restores the label after 1.8 seconds.
   */
  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label="Copy receipt link"
      className="inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)] bg-[var(--bg-surface)] px-4 py-2.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-primary)] transition-colors duration-150 min-h-[44px]"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12l4 4L19 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="9"
            y="9"
            width="11"
            height="11"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
      {copied ? "Copied" : "Copy receipt link"}
    </button>
  );
}
