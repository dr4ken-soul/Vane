/**
 * Branded loading frame shown while the wallet session is being restored.
 *
 * The skeleton keeps the console chrome in place so a hard refresh never flashes the landing page.
 */
export function ConsoleSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" aria-busy="true" aria-live="polite">
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
        <div className="h-16 flex items-center px-5 border-b border-[var(--border-subtle)]">
          <span className="font-mono text-sm font-semibold tracking-[0.28em] uppercase text-[var(--text-primary)]">
            Vane
          </span>
        </div>
        <div className="p-4 space-y-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-10 rounded-[10px] bg-white/5 animate-shimmer" />
          ))}
        </div>
      </div>

      <div className="lg:pl-60">
        <div className="sticky top-0 z-[var(--z-sticky)] h-16 liquid-glass border-b border-[var(--border-subtle)]" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="h-4 w-40 rounded bg-white/5 animate-shimmer" />
          <div className="mt-3 h-10 w-80 max-w-full rounded-lg bg-white/5 animate-shimmer" />
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] p-1.5">
                <div className="h-full rounded-[10px] bg-white/5 animate-shimmer" />
              </div>
            ))}
          </div>
          <div className="mt-8 h-64 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] p-1.5">
            <div className="h-full rounded-[10px] bg-white/5 animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
