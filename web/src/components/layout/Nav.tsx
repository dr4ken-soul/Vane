"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Props accepted by the navigation bar.
 */
interface NavProps {
  /** Called when the operator asks to open the wallet modal. */
  onConnectClick: () => void;
  /** True when a wallet is already connected. */
  isConnected: boolean;
}

/**
 * Landing page sections tracked by the active readout.
 */
const SECTION_READOUTS: { id: string; label: string }[] = [
  { id: "calibration", label: "Calibration" },
  { id: "oracle-gap", label: "Oracle gap" },
  { id: "inspector", label: "Dual engine" },
  { id: "pipeline", label: "Pipeline" },
  { id: "telemetry", label: "Sepolia live" },
  { id: "comparison", label: "Comparison" },
  { id: "standards", label: "Standards" },
  { id: "dispatch", label: "Dispatch" },
];

/**
 * Contextual links revealed when the header is hovered or focused.
 */
const CONTEXT_LINKS: { href: string; label: string; section: string }[] = [
  { href: "#inspector", label: "Inspector", section: "inspector" },
  { href: "#pipeline", label: "Pipeline", section: "pipeline" },
  { href: "#comparison", label: "Comparison", section: "comparison" },
  { href: "#standards", label: "Standards", section: "standards" },
];

/**
 * Route links shown on public receipt and documentation pages.
 */
const ROUTE_LINKS: { href: string; label: string; section: string }[] = [
  { href: "/", label: "Home", section: "home" },
  { href: "/verify", label: "Verify receipt", section: "verify" },
  { href: "/docs", label: "API docs", section: "docs" },
];

/**
 * Fixed scroll progress navigation bar.
 *
 * The bar carries a 1.5 pixel hairline that scales with the page scroll position, a live active
 * section readout and contextual links that reveal on hover, focus or scroll pause.
 */
export function Nav({ onConnectClick, isConnected }: NavProps) {
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(SECTION_READOUTS[0].label);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<number | null>(null);
  const onLanding = pathname === "/";
  const routeReadout = pathname?.startsWith("/verify")
    ? "Public verifier"
    : pathname?.startsWith("/docs")
      ? "Protocol docs"
      : "Vane protocol";
  const contextLinks = onLanding ? CONTEXT_LINKS : ROUTE_LINKS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = SECTION_READOUTS.find((entry) => entry.id === visible.target.id);
        if (match) setActiveSection(match.label);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.05, 0.2, 0.5] },
    );

    SECTION_READOUTS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    /**
     * Pauses the scroll when the pointer approaches the header band.
     *
     * @param event The pointer event.
     */
    const handlePointerMove = (event: PointerEvent): void => {
      if (event.clientY > 96) return;
      if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
      setPaused(true);
      pauseTimer.current = window.setTimeout(() => setPaused(false), 1200);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
    };
  }, []);

  /**
   * Returns to the landing page or scrolls back to the top.
   */
  const handleWordmark = useCallback(() => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
  }, [pathname, router]);

  /**
   * Opens the console when a wallet is connected, otherwise opens the wallet modal.
   */
  const handlePrimaryAction = useCallback(() => {
    if (isConnected) {
      router.push("/app");
      return;
    }
    onConnectClick();
  }, [isConnected, onConnectClick, router]);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-[var(--z-sticky)] liquid-glass border-b border-[var(--border-subtle)] group/nav"
        data-paused={paused ? "true" : "false"}
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[var(--border-subtle)] overflow-hidden">
          <motion.div
            className="h-full w-full origin-left bg-[var(--accent)]"
            style={{ scaleX: scrollYProgress }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Logo slot: replace with public/logo.svg once provided */}
            <button
              type="button"
              onClick={handleWordmark}
              className="font-mono text-sm font-semibold tracking-[0.28em] text-[var(--text-primary)] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-sm"
            >
              Vane
            </button>
            <span className="hidden sm:block h-3.5 w-[1px] bg-[var(--border-default)]" />
            <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={onLanding ? activeSection : routeReadout}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block"
                >
                  {onLanding ? activeSection : routeReadout}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <nav
            aria-label="Section links"
            className="hidden lg:flex items-center gap-1 transition-opacity duration-200 opacity-0 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto data-[paused=true]:opacity-100 data-[paused=true]:pointer-events-auto"
          >
            {contextLinks.map((link) => {
              const isActive = onLanding
                ? activeSection.toLowerCase().replace(" ", "-") === link.section
                : pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-150 ${
                    isActive
                      ? "bg-[var(--accent-glow)] text-[var(--accent)] font-medium"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isActive ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      {link.label}
                    </span>
                  ) : (
                    link.label
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="group inline-flex items-center gap-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#0a0b0d] pl-4 pr-1.5 py-1.5 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0a0b0d]" />
                  Open console
                </>
              ) : (
                "Connect wallet"
              )}
              <span className="w-6 h-6 rounded-full bg-[#0a0b0d]/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 17L17 7M8 7h9v9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className="lg:hidden w-11 h-11 flex flex-col items-center justify-center gap-[5px]"
            >
              <span
                className={`w-5 h-[1.5px] bg-[var(--text-primary)] transition-transform duration-200 ${
                  mobileOpen ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`w-5 h-[1.5px] bg-[var(--text-primary)] transition-opacity duration-200 ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-5 h-[1.5px] bg-[var(--text-primary)] transition-transform duration-200 ${
                  mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-16 inset-x-0 z-[var(--z-sticky)] liquid-glass-strong border-b border-[var(--border-subtle)] lg:hidden"
          >
            <nav aria-label="Mobile section links" className="px-4 py-2">
              {onLanding
                ? SECTION_READOUTS.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center h-11 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-150"
                    >
                      {section.label}
                    </a>
                  ))
                : ROUTE_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center h-11 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-150"
                    >
                      {link.label}
                    </a>
                  ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
