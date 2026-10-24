"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";

/**
 * Toast that confirms a wallet disconnection on the landing page.
 *
 * The toast appears when the landing page is opened with the `disconnected` query flag and
 * removes the flag from the address bar afterwards.
 */
export function DisconnectToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams?.get("disconnected") !== "1") return;
    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
      window.history.replaceState({}, "", window.location.pathname);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-toast)] w-[calc(100vw-2rem)] max-w-md p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-modal)]"
        >
          <div className="rounded-[10px] bg-[var(--bg-elevated)] px-4 py-3.5 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <p className="font-body text-sm text-[var(--text-primary)]">
              Wallet disconnected. Connect again whenever you are ready.
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
