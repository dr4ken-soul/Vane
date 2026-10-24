"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useWalletGate } from "@/components/wallet/WalletGate";
import { VANE_ATTESTATION_REGISTRY_ADDRESS } from "@/lib/contracts";

/**
 * Closing conversion band and operational footer.
 *
 * The band sits directly over the full intensity calibration field, so the last viewport carries
 * the same atmospheric instrument language as the hero.
 */
export function FinalDispatchFooter() {
  const router = useRouter();
  const { openWallet, isConnected } = useWalletGate();

  /**
   * Opens the console when connected, otherwise opens the wallet modal.
   */
  const handlePrimary = (): void => {
    if (isConnected) {
      router.push("/app");
      return;
    }
    openWallet();
  };

  const explorerHref = VANE_ATTESTATION_REGISTRY_ADDRESS
    ? `https://sepolia.etherscan.io/address/${VANE_ATTESTATION_REGISTRY_ADDRESS}`
    : "https://sepolia.etherscan.io";

  return (
    <>
      <section
        id="dispatch"
        className="relative w-full py-28 md:py-40 flex items-center justify-center z-[var(--z-content)]"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center flex flex-col items-center">
          <motion.h2
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold uppercase text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-[var(--text-primary)]"
          >
            Verify your first shipment on Sepolia
          </motion.h2>

          <motion.p
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.14 }}
            className="mt-5 font-body text-base md:text-lg text-[var(--text-secondary)] max-w-[46ch]"
          >
            Connect a Sepolia wallet, run a live satellite physics check, and seal a zero-knowledge
            CBAM proof in under a minute.
          </motion.p>

          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 24 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.26 }}
            className="mt-9"
          >
            <MagneticButton
              onClick={handlePrimary}
              className="group inline-flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] pl-7 pr-2.5 py-2.5 rounded-full font-mono text-sm font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {isConnected ? "OPEN CONSOLE" : "CONNECT WALLET"}
              <span className="w-9 h-9 rounded-full bg-[var(--on-accent)]/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 17L17 7M8 7h9v9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      <footer className="relative w-full py-12 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 z-[var(--z-content)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="font-mono text-sm font-semibold tracking-[0.28em] uppercase text-[var(--text-primary)]">
                Vane
              </p>
              <p className="font-body text-xs text-[var(--text-muted)] mt-2 max-w-[54ch]">
                Built for the IEEE ClimateChain Global Hackathon 2026 supporting UN COP 31 climate
                transparency goals.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <a
                href="/verify"
                className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                Verify receipt
              </a>
              <a
                href={explorerHref}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                Sepolia contracts
              </a>
              <a
                href="/docs"
                className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                API docs
              </a>
              <a
                href="https://github.com/dr4ken-soul/Vane"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] text-[var(--text-muted)]">
            <p>© 2026 Vane Protocol</p>
            <p>Ethereum Sepolia · Open-Meteo GHI · Noir UltraHonk</p>
          </div>
        </div>
      </footer>
    </>
  );
}
