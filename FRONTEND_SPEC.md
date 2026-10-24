# FRONTEND_SPEC.md: Vane

Physics-verified industrial carbon proofs for EU CBAM exporters and grid operators, cross-checked against live satellite irradiance and settled on Ethereum Sepolia with zero commercial data exposure. Built for the IEEE ClimateChain Global Hackathon 2026 supporting UN COP 31 in Antalya.

---

## 0. Project Identity

- **Name:** Vane
- **One-line pitch:** Prove your embedded carbon is physically real and commercially private. Vane cross-checks facility smart meters against live satellite weather physics, blocks spoofed readings on-chain, and generates zero-knowledge CBAM proofs straight in the browser.
- **One-line design read (§0):** This is a forensic industrial verification landing page and wallet-gated prover console with an operational bento structure, calibrated physics-driven motion, and crisp instrument density.
- **Aesthetic (Gate 1, confirmed):** Option 7, Bento grid operational
- **Navigation (Gate 2, confirmed):** `B1`, Scroll-progress nav
- **Background & Motion (Gate 3, confirmed):** Option 4 (`Dual-Motion Sync`: procedural `VaneField` vector calibration canvas + `2a` mouse-tracked 3D card tilt + `2b` magnetic primary CTAs) paired with Option B (`Staggered Viewport Reveal`, repeatable on every scroll pass)
- **Fonts (Gate 4, confirmed):** Option `4B`, Cold Calibration (`Barlow Semi Condensed` + `DM Sans` + `Fira Code`)
- **Palette (Gate 5, confirmed):** Option `5A`, Tungsten Foundry (Restrained dark operational strategy in OKLCH + hex)
- **Hero Structure (Gate 6, confirmed):** Option `6A`, Asymmetric 7/5 Operational Bento Hero with live Open-Meteo feed, interactive `1.4x` spoof toggle, and ZK witness scramble cell
- **Section Sequence (Gate 7, confirmed):** Option `7A`, Full 8-Section Operational Flow across 7 distinct layout families
- **Identity Fingerprint (§0C, updated post-Gate 4):** `asymmetric editorial / compressed statement / deep dark / technical grid / editorial stagger / cinematic entrance`
- **Design Dials (§0):** `DESIGN_VARIANCE: 7` / `MOTION_INTENSITY: 6` / `VISUAL_DENSITY: 6`
- **2026 Design Trends (`DESIGN_TRENDS_SKILL.md`):** Primary: Blueprint Design (#3, schematic precision, hairline grid structure, engineering annotations). Supporting: Surveillance Design (#8, live telemetry residuals and tamper quarantine alerts).
- **Crypto Classification (`CRYPTO_SKILL.md`):** Category A primary (Ethereum Sepolia contracts, `wagmi` + `viem` signing, browser Noir UltraHonk proving) paired with stateless Category B live Open-Meteo satellite telemetry verification.

---

## 1. Global Design System

### 1.1 Fonts (Gate 4: Option 4B, Cold Calibration)

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Fira+Code:wght@400;500;600&display=swap');
```

- `--font-display`: `'Barlow Semi Condensed', sans-serif` (weights `600`, `700`, `800`, section and hero display headlines only, cap 3 font weights across the page)
- `--font-body`: `'DM Sans', sans-serif` (weights `400`, `500`, `600`, body prose, descriptions, form labels)
- `--font-mono`: `'Fira Code', monospace` (weights `400`, `500`, `600`, `font-variant-numeric: tabular-nums`, telemetry readings, `W/m²`, `tCO2e/t`, nullifiers, eyebrows, buttons)

Typography discipline rules applied globally:
- Maximum 3 font families (`display`, `body`, `mono`) and maximum 3 active font weights (`400`, `600`, `800`).
- Apply `text-wrap: balance` on all `h1`, `h2`, and `h3` elements; apply `text-wrap: pretty` and `max-w-[65ch]` on all body copy paragraphs.
- Never use `JetBrains Mono`, `Space Grotesk`, `Outfit`, `Fraunces`, or `Instrument Serif` anywhere in the codebase.

### 1.2 Colour System (Gate 5: Option 5A, Tungsten Foundry)

**Colour Strategy:** Restrained. Tinted obsidian-basalt neutrals cover 90% of every viewport surface; Solar Tungsten Amber (`oklch(0.79 0.165 78)`) occupies 10% or less for calibration vectors, active states, and primary actions; semantic emerald and crimson appear strictly on verified and quarantined telemetry states. Never use pure `#000000` or pure `#ffffff`.

```css
:root {
  --font-display: 'Barlow Semi Condensed', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'Fira Code', monospace;

  /* Surfaces (OKLCH calibrated perceptual steps with exact hex fallbacks) */
  --bg-primary:     #0a0b0d; /* oklch(0.15 0.008 255) */
  --bg-secondary:   #101216; /* oklch(0.18 0.010 255) */
  --bg-surface:     #16191f; /* oklch(0.21 0.012 255) */
  --bg-elevated:    #1d2129; /* oklch(0.25 0.014 255) */

  /* Brand & Calibration Accent */
  --accent:         #f0a500; /* oklch(0.79 0.165 78) - Solar Tungsten Amber */
  --accent-hover:   #ffbe2e; /* oklch(0.84 0.158 82) */
  --accent-glow:    rgba(240, 165, 0, 0.12);
  --accent-subtle:  rgba(240, 165, 0, 0.06);

  /* Foreground Hierarchy (all WCAG AA compliant on dark surfaces) */
  --text-primary:   #f1f3f5; /* contrast 17.4:1 on --bg-primary */
  --text-secondary: #9aa1ac; /* contrast 7.6:1 on --bg-primary */
  --text-muted:     #68707d; /* contrast 4.1:1 on --bg-primary, >3:1 dark-mode secondary rule */

  /* Hairlines & Structural Dividers */
  --border-subtle:  rgba(241, 243, 245, 0.06);
  --border-default: rgba(241, 243, 245, 0.12);
  --border-strong:  rgba(241, 243, 245, 0.22);

  /* Semantic Telemetry States */
  --success:        #3dd68c;
  --success-bg:     rgba(61, 214, 140, 0.10);
  --error:          #f2555a;
  --error-bg:       rgba(242, 85, 90, 0.12);

  /* Radius Scale (consistent across component families; cards never exceed 16px) */
  --radius-sm:      6px;
  --radius-md:      10px;  /* inner core of Double-Bezel cards */
  --radius-lg:      16px;  /* outer tray of Double-Bezel cards & inputs */
  --radius-pill:    9999px;/* pills, status chips, and CTA buttons */

  /* Tinted Shadows (zero generic black shadows, zero Ghost-Card blur+border clash) */
  --shadow-bezel:   inset 0 1px 1px rgba(241, 243, 245, 0.10);
  --shadow-modal:   0 24px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(241, 243, 245, 0.12);

  /* Timings */
  --duration-fast:   150ms;
  --duration-normal: 260ms;
  --duration-slow:   600ms;

  /* Named Semantic Z-Index Scale (Step 17) */
  --z-canvas:         0;
  --z-grain:          3;
  --z-content:        10;
  --z-elevated:       20;
  --z-dropdown:       100;
  --z-sticky:         200;
  --z-modal-backdrop: 300;
  --z-modal:          400;
  --z-toast:          500;
  --z-tooltip:        600;
}
```

### 1.3 Global CSS Rules (`src/styles/globals.css`)

```css
@import "tailwindcss";

@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    scrollbar-width: none;
    scroll-behavior: smooth;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-body);
  }

  html::-webkit-scrollbar {
    display: none;
  }

  h1, h2, h3 {
    font-family: var(--font-display);
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }
}

/* Liquid Glass Chrome (Step 3B Technique 2 - used on fixed nav, modals, and dropdowns;
   backdrop-filter is strictly restricted to fixed/sticky layers per Step 17) */
.liquid-glass {
  background: rgba(22, 25, 31, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 1px rgba(241, 243, 245, 0.10);
  position: relative;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    180deg,
    rgba(241, 243, 245, 0.28) 0%,
    rgba(241, 243, 245, 0.08) 25%,
    rgba(241, 243, 245, 0.02) 50%,
    rgba(241, 243, 245, 0.08) 80%,
    rgba(240, 165, 0, 0.28) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.liquid-glass-strong {
  background: rgba(29, 33, 41, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: inset 0 1px 1px rgba(241, 243, 245, 0.16);
  position: relative;
}
.liquid-glass-strong::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.2px;
  background: linear-gradient(
    180deg,
    rgba(240, 165, 0, 0.45) 0%,
    rgba(241, 243, 245, 0.12) 35%,
    rgba(241, 243, 245, 0.03) 65%,
    rgba(240, 165, 0, 0.35) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Mathematical Noise Grain Overlay (Step 3B Technique 7 & §2E Bento Noise) */
.surface-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.032;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 128px 128px;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

> **Tailwind v4 Cascade Guard (Step 12):** Never write `*, *::before, *::after { margin: 0; padding: 0; }` outside `@layer base`. All section containers follow `<section className="relative w-full py-24 md:py-32 z-[var(--z-content)]"><div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">` with animation placed strictly on child `<motion.div>` wrappers inside the static width container.

### 1.4 Global Z-Index Stack

```
z-[var(--z-canvas)]         (0):   VaneField procedural HTML5 2D vector calibration canvas
z-[var(--z-grain)]          (3):   Fixed viewport SVG fractalNoise film overlay (pointer-events-none, opacity-[0.035])
z-[var(--z-content)]        (10):  Default relative section content containers
z-[var(--z-elevated)]       (20):  Double-Bezel interactive modules with 3D spring tilt
z-[var(--z-dropdown)]       (100): App-interior connected wallet menu (portal at document root)
z-[var(--z-sticky)]         (200): Fixed B1 scroll-progress top bar, wordmark, active section readout, Connect Wallet pill
z-[var(--z-modal-backdrop)] (300): Wallet connection modal scrim (fixed inset-0 bg-black/60 backdrop-blur-sm)
z-[var(--z-modal)]          (400): Wallet connection modal dialog & error recovery dialog
z-[var(--z-toast)]          (500): Disconnect & proof-verification confirmation toasts
z-[var(--z-tooltip)]        (600): Accessible keyboard/hover metric tooltips & skip-link on focus
```

### 1.5 Dual-Motion Sync System (`VaneField` + `2a` 3D Tilt + `2b` Magnetic CTAs)

**Layer 1: `VaneField.tsx` (Procedural Atmospheric Vector Calibration Canvas)**
No MP4 video or external GLB file is needed. `VaneField` is a lightweight HTML5 `<canvas>` calibrated vector field directly expressing the instrument name **Vane**:

```
Wrapper: fixed inset-0 overflow-hidden pointer-events-none z-[var(--z-canvas)]
Inner canvas: w-full h-full block

Grid geometry:
  Desktop (>= 768px): 28 columns x 16 rows of hairline calibration vanes (448 vectors)
  Mobile (< 768px):   14 columns x 10 rows of hairline calibration vanes (140 vectors)
  Each vane: 14px line segment anchored at grid node (gx, gy) with a 1.5px pivot dot

Vector angle calculation (60fps requestAnimationFrame, zero React state updates):
  Base azimuth: driven by live solar azimuth angle read from Open-Meteo API payload
    (fallback 142 deg SE before fetch resolves) plus slow atmospheric harmonic drift:
    angle = baseAzimuthRad + Math.sin(gx * 0.004 + time * 0.35) * 0.28 + Math.cos(gy * 0.004 - time * 0.25) * 0.22
  Cursor airflow deflection (desktop pointer fine only):
    Read cursor coordinates from a mutable ref updated on passive window 'mousemove'.
    Within radius 220px of cursor, smoothly lerp vane angle toward cursor tangent vector
    with falloff (1 - dist / 220) * 0.55.
  Spoof-simulation coupling:
    Shared lightweight ref/event `vaneSpoofActive`:
    - Normal calibrated state: stroke rgba(241, 243, 245, 0.11), aligned highlight vanes near cursor in rgba(240, 165, 0, 0.42)
    - Spoof injected state (`vaneSpoofActive === true`): vectors jitter with discordant phase noise and highlight tint shifts to rgba(242, 85, 90, 0.38) until quarantined!

Section visibility modulation:
  Hero & Final CTA in view: canvas container opacity 1.0 (transition-opacity duration-500)
  Below-fold operational sections in view: canvas container opacity 0.35 so dense data tables read effortlessly

Reduced motion (`prefers-reduced-motion: reduce`):
  Render a single static frame aligned at baseAzimuthRad and cancel requestAnimationFrame immediately.
```

**Layer 2: Interactive Motion Primitives (`2a` Tilt + `2b` Magnetic Pull + Repeatable Scroll Reveals)**
1. **Standard Repeatable Section Reveal (`Once: False` Mandatory Rule):**
   - `initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}`
   - `whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}`
   - `viewport={{ once: false, amount: 0.1 }}` *(NEVER `once: true` anywhere in the codebase)*
   - `transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}`
   - Grouped child stagger: `delay: 0.06 * index` (strictly within the 30-80ms per-item rule).
2. **`TiltBezelCard` (`2a` Mouse-Tracked 3D Rotation):**
   - Uses `useMotionValue(0.5)` + `useSpring(useTransform(...), { stiffness: 180, damping: 24 })` mapping cursor position across the card to `rotateX: [5, -5]` deg and `rotateY: [-5, 5]` deg (`transformPerspective: 900`, `will-change-transform`). Zero `useState` updates on mouse movement; disabled automatically when `(pointer: coarse)` or `prefers-reduced-motion: reduce`.
3. **`MagneticButton` (`2b` Magnetic Hover + Step 17 Button-in-Button Icon):**
   - Applied exclusively to primary CTAs (`CONNECT WALLET` / `GENERATE ZK PROOF`).
   - Uses `useMotionValue(0)` + `useSpring(..., { stiffness: 220, damping: 18 })` capped cleanly at `±5px` offset, resetting to `(0, 0)` on `onMouseLeave`.
4. **Unified Icon Rule (`FRONTEND_SKILL.md` Mandatory Section):**
   - All directional arrows, checkmarks, copy icons, alert triangles, and external explorer links are crisp inline `<svg>` elements (`stroke="currentColor"`, `strokeWidth="1.75"`, `aria-hidden="true"`). Zero emojis, zero Unicode symbol characters, zero unapproved icon libraries, and zero invented brand logos.

---

## 2. Navigation (Gate 2: `B1` Scroll-Progress Nav)

Skip link (first focusable element in `layout.tsx`, Step 16 Priority 1):
```
Element: <a href="#main-content">
Classes: sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[var(--z-tooltip)]
  focus:bg-[var(--accent)] focus:text-[#0a0b0d] focus:px-4 focus:py-2 focus:rounded-full
  focus:font-mono focus:text-xs focus:font-semibold
Text: "Skip to main content"
```

Fixed `B1` Scroll-Progress Bar (`src/components/layout/Nav.tsx`):
```
z-index: z-[var(--z-sticky)] (200)

OUTER SHELL:
  fixed top-0 inset-x-0 z-[var(--z-sticky)] liquid-glass
  border-b border-[var(--border-subtle)]

1PX SCROLL-PROGRESS HAIRLINE:
  Position: absolute top-0 left-0 right-0 h-[1.5px] bg-[var(--border-subtle)] overflow-hidden
  Fill bar: motion.div h-full w-full origin-left bg-[var(--accent)]
  Driven by: Framer Motion useScroll() -> scaleX: scrollYProgress (GPU transform only, never width%)

INNER BAR CONTAINER:
  max-w-7xl mx-auto px-4 md:px-8 lg:px-16 h-16 flex items-center justify-between gap-4

LEFT GROUP (Wordmark + Live Active Section Readout):
  Layout: flex items-center gap-4 min-w-0
  Logo slot comment (verbatim):
    {/* Logo slot: replace with public/logo.svg once provided */}
  Wordmark button (scrolls smoothly to top on '/', navigates to '/' from '/app'):
    font-mono text-sm font-semibold tracking-[0.28em] text-[var(--text-primary)] uppercase
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-sm
    Text: "VANE"
  Vertical divider:
    hidden sm:block h-3.5 w-[1px] bg-[var(--border-default)]
  Active section readout (fades between active sections tracked via IntersectionObserver):
    hidden sm:inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]
    Indicator dot: w-1.5 h-1.5 rounded-full bg-[var(--accent)]
    Dynamic text values as user scrolls:
      Section 1: "CALIBRATION"
      Section 2: "ORACLE GAP"
      Section 3: "DUAL ENGINE"
      Section 4: "PIPELINE"
      Section 5: "SEPOLIA LIVE"
      Section 6: "COMPARISON"
      Section 7: "STANDARDS"
      Section 8: "DISPATCH"
    Transition: AnimatePresence mode="wait", opacity 0 y 4 -> opacity 1 y 0, duration 0.16s ease [0.16, 1, 0.3, 1]

CENTRE CONTEXTUAL LINKS (B1 rule: hidden at rest, reveal smoothly when header is hovered, keyboard focus enters, or scroll pauses after user moves pointer toward top 96px):
  Container: hidden lg:flex items-center gap-1 transition-opacity duration-200
    opacity-0 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto
    focus-within:opacity-100 focus-within:pointer-events-auto data-[paused=true]:opacity-100 data-[paused=true]:pointer-events-auto
  Links (x4: "Inspector" -> #inspector, "Pipeline" -> #pipeline, "Comparison" -> #comparison, "Standards" -> #standards):
    px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-[0.14em]
    Inactive: text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150
    Active (matches current section): bg-[var(--accent-glow)] text-[var(--accent)] font-medium
      with leading 4px dot (colour + shape shift, never colour alone)

RIGHT ACTION CLUSTER:
  On Landing Page ('/'):
    If disconnected:
      <button onClick={onConnectClick}> (opens WalletConnectModal, never calls wagmi connect() directly)
      Classes: group inline-flex items-center gap-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)]
        text-[#0a0b0d] pl-4 pr-1.5 py-1.5 rounded-full font-mono text-xs font-semibold uppercase tracking-[0.12em]
        transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
      Label: "CONNECT WALLET"
      Trailing button-in-button circle:
        w-6 h-6 rounded-full bg-[#0a0b0d]/15 flex items-center justify-center
        group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200
        Inline 12x12 arrow-up-right SVG
    If already connected while viewing '/':
      <button onClick={() => router.push('/app')}>
      Same classes, leading live dot w-1.5 h-1.5 rounded-full bg-[#0a0b0d], Label: "OPEN CONSOLE"

  Mobile Secondary Menu Trigger (< lg):
    Accessible button w-11 h-11 (44x44px touch target) flex flex-col items-center justify-center gap-[5px]
      aria-label="Toggle navigation menu" aria-expanded={mobileOpen}
    3 hairline spans (w-5 h-[1.5px] bg-[var(--text-primary)]) morphing cleanly into X when open;
    opens fixed top-16 inset-x-0 liquid-glass-strong panel with 44px-tall section links.
```

---

## 2.1 Mandatory Wallet-Gated Routing, Error Containment & App Wallet Dropdown (Steps 13 & 14)

Every rule from `FRONTEND_SKILL.md` Steps 13 and 14 is explicitly enforced across `src/app/app/**`:

```
HOST DEEP-LINK & REWRITE FALLBACK:
  Framework: Next.js 14 App Router deployed on Vercel with `web/vercel.json`:
    {
      "framework": "nextjs",
      "cleanUrls": true
    }
  Every protected route (`/app`, `/app/meters`, `/app/attest/new`, `/app/verify/[id]`) has a real server/client
  route entry so direct URLs, bookmarks, shared links, and hard refreshes NEVER return a host 404 or blank page.

STORAGE & DISCONNECT INTENT CONTRACT (Zero localStorage / sessionStorage):
  wagmi uses `cookieStorage` (`ssr: true`) for SSR-clean hydration with zero `localStorage` or `sessionStorage`.
  Manual disconnect sets `document.cookie = 'vane_disconnected=1; path=/; max-age=86400; SameSite=Lax'` BEFORE
  calling wagmi `disconnect()`, and deliberate connection via `WalletConnectModal` clears that cookie on confirm.
  Hydration state variable `walletGateStatus: 'hydrating' | 'connected' | 'disconnected' | 'provider-error'`:
    1. 'hydrating' (`status === 'reconnecting'` or `status === 'connecting'` during mount):
       Render `<ConsoleSkeleton />` (full branded Double-Bezel shimmer layout). Never redirect or alter URL.
    2. 'connected' (`isConnected === true` and `vane_disconnected` cookie absent):
       Render exact requested route (`/app`, `/app/meters`, `/app/attest/new`, `/app/verify/[id]`).
    3. 'disconnected' (`!isConnected && !isReconnecting`):
       Immediately navigate to `/?disconnected=1` (`router.replace('/?disconnected=1')`), which displays `<DisconnectToast />`
       ("Wallet disconnected. Connect again whenever you are ready.") for 4s and cleans the query string via `window.history.replaceState`.
    4. 'provider-error':
       Render `<WalletRecoveryPanel />` inside the app frame with "Retry connection" and "Return to home" buttons.
       Never treat an RPC or extension error as proof of wallet disconnection.

RUNTIME ERROR BOUNDARY (`src/components/system/AppErrorBoundary.tsx`):
  Wraps root route children and app console outlet. Catches render, RPC, and WASM prover exceptions without ever showing
  a white screen or raw stack trace. Displays cause summary, "Retry action" button, and "Return to landing page" button.

WALLET CONNECTION MODAL (`src/components/wallet/WalletConnectModal.tsx`):
  Backdrop: fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/60 backdrop-blur-sm
  Dialog: fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] max-w-[420px]
    p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)] shadow-[var(--shadow-modal)]
  Inner surface: rounded-[10px] bg-[var(--bg-secondary)] p-6 md:p-7
  States owned inside modal:
    - `idle`: Lists detected EIP-6963 browser wallets (MetaMask, Rabby, Coinbase, WalletConnect) with network notice ("Ethereum Sepolia · Chain 11155111").
    - `connecting`: Shimmer status bar + message "Confirm connection in your wallet extension." Close button disabled (`opacity-40 cursor-not-allowed`) until resolved.
    - `wrong-chain`: Inline prompt "Switch network to Ethereum Sepolia to verify and submit proofs." + primary button "Switch to Sepolia".
    - `success`: Emerald status check + "Wallet verified. Opening console." Auto-navigates to `/app` after 280ms.
    - `error`: Crimson alert banner stating exact cause (e.g. "Connection request rejected in wallet. Select a wallet below to try again.") + retry button.

APP-INTERIOR CONNECTED WALLET DROPDOWN (`src/components/wallet/WalletDropdown.tsx` - rendered ONLY inside `/app/**`, NEVER on `/`):
  Trigger pill (top-right of `/app` top bar):
    <button aria-expanded={open} aria-haspopup="menu">
    Classes: inline-flex items-center gap-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]
      border border-[var(--border-default)] hover:border-[var(--accent)] px-3.5 py-2 rounded-full
      font-mono text-xs text-[var(--text-primary)] transition-colors duration-150 min-h-[40px]
    Contents: pulsing dot (`w-2 h-2 rounded-full bg-[var(--success)]`) + `0x71C...9A4B` + inline chevron SVG (`rotate-180` when open).

  Dropdown menu panel (rendered via `createPortal` to `document.body` at `z-[var(--z-dropdown)]`, anchored `top: triggerBottom + 8px`, `right: windowWidth - triggerRight`):
    Animation: AnimatePresence, initial `{ opacity: 0, scale: 0.95, y: -6 }`, animate `{ opacity: 1, scale: 1, y: 0 }`,
      exit `{ opacity: 0, scale: 0.95, y: -6 }`, duration `0.18s`, ease `[0.22, 1, 0.36, 1]`, `transformOrigin: 'top right'`.
    Dismissal: `document.addEventListener('mousedown')` outside-click handler + `window.addEventListener('keydown')` Escape handler (no backdrop div blocking pointer events).
    Product-specific status header:
      bg-[var(--bg-elevated)] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between
      Left: emerald dot + `font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--success)]` -> "PINN + NOIR PROVER READY"
      Right: `font-mono text-[11px] text-[var(--text-muted)]` -> "WASM v0.36"
    Identity & Network rows:
      Address row with Copy button (swaps copy SVG to check SVG + `"Copied"` for `1800ms`) + Sepolia Etherscan external link button
      2-column grid (`divide-x divide-[var(--border-subtle)]`): `NETWORK: ETH Sepolia` | `PROOFS: <live user count>`
    Disconnect action:
      w-full mt-3 py-2.5 px-3.5 rounded-[10px] bg-[var(--error-bg)] hover:bg-[#f2555a]/20
      border border-[var(--error)]/30 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--error)]
      flex items-center justify-center gap-2 transition-colors duration-150
      Label: "DISCONNECT WALLET"
      Action sequence: sets `vane_disconnected=1` cookie -> closes menu -> executes `router.replace('/?disconnected=1')` -> calls `disconnect()`.
```

**Mandatory Pre-Delivery Wallet Acceptance Checks:**
- Connect from `/` and verify automatic navigation to `/app`.
- Navigate to `/app/attest/new`, perform a hard browser refresh (`Ctrl+Shift+R`), and confirm `/app/attest/new` renders directly without a 404 or landing-page flash.
- Open the wallet trigger pill inside `/app` and verify copy reset (`1.8s`), Etherscan link, Escape dismissal, outside-click dismissal, and instant disconnect redirect to `/?disconnected=1`.
- Hard refresh after manual disconnect and verify the session stays on `/` rather than silently re-entering `/app`.
- Open `/app/meters` in a clean incognito window without a wallet and verify clean redirect to `/` with zero runtime error.
- Reject both wallet connection and Sepolia chain switch in MetaMask and verify inline retry states inside `WalletConnectModal`.

---

## 3. Landing Page Section Specifications (8 Sections, 7 Distinct Layout Families)

**Anti-Repetition & Eyebrow Audit (`FRONTEND_SKILL.md` §0D & `COMPOSITION_RECIPES.md` Section E):**

| # | Section | Layout Family | Recipe Base | Eyebrow Used? | Funnel Job |
|---|---|---|---|---|---|
| 1 | Hero | Full-viewport asymmetric operational hero | `asymmetric-bento-grid` + `split-screen-hero` hybrid | **Yes (1 of 3):** `PHYSICS + ZK CARBON PROTOCOL` | Hook |
| 2 | The Oracle Gap | Typography statement (breathing section) | `full-width-statement` | No | Educate |
| 3 | Dual-Engine Interactive Inspector | Interactive tabbed explorer (dense) | `tabbed-feature-explorer` | No | Educate |
| 4 | Four-Stage Verification Pipeline | Stacked layers | `architecture-layers` | **Yes (2 of 3):** `VERIFICATION PIPELINE` | Educate |
| 5 | Live Sepolia Telemetry | Metrics / stats (breathing section) | `metrics-section` | No | Proof |
| 6 | Verification Comparison Matrix | Asymmetric bento grid (dense, 4 unequal cells) | `asymmetric-bento-grid` | **Yes (3 of 3):** `PROTOCOL ADVANTAGE` | Compare |
| 7 | Standards & COP 31 Schematic | Split technical schematic (breathing/medium) | `split-image-text` (coded schematic diagram) | No | Reassure |
| 8 | Final Dispatch CTA + Footer | Closing conversion banner + operational footer | `footer-video` (adapted over full `VaneField`) | No | Convert |

Total layout families used: **7 distinct families** (zero repeats). Total eyebrows used across 8 sections: **3** (strict `1 per 3 sections` compliance).

---

### Section 3.1: Hero (Gate 6: Asymmetric 7/5 Operational Bento Hero)

**Recipe:** Hybrid of `split-screen-hero` and `asymmetric-bento-grid` (`COMPOSITION_RECIPES.md` Sections D), benchmarked against Golden Example 2 and Profile 3 (`Terminal Industries`).
**Asset Brief:** Coded procedural assets only (`VaneField` vector calibration canvas + live Open-Meteo API stream + coded SVG residual waveform). Zero external photography or MP4 required.

```
z-index stack within section:
  z-[var(--z-canvas)]   (0):  VaneField procedural calibration canvas at opacity 1.0
  z-[var(--z-grain)]    (3):  Fixed fractalNoise film overlay
  z-[var(--z-content)]  (10): Left hero typography stack
  z-[var(--z-elevated)] (20): Right 3-cell Double-Bezel live instrument stack

OUTER SECTION:
  id="calibration"
  Classes: relative w-full min-h-[100dvh] flex items-center pt-20 pb-12 md:pt-24 md:pb-16 z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16

GRID LAYOUT (CSS Grid only, zero flex % math; fits cleanly inside 1280x800 desktop viewport):
  Classes: grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center

LEFT COLUMN (lg:col-span-7, strictly 4 text elements max per Hero Stack Discipline):
  Wrapper: flex flex-col items-start

  Element 1: Eyebrow (Eyebrow #1 of 3 on page, first visible text <= 140px from viewport top):
    Motion: initial { filter: 'blur(8px)', opacity: 0, y: 12 } -> animate { filter: 'blur(0px)', opacity: 1, y: 0 }
      transition { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.10 }
    Classes: font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-[var(--accent)] mb-4
    Text: "PHYSICS + ZK CARBON PROTOCOL"

  Element 2: Display Headline (h1, max 2 lines on desktop, zero orphan words, solid colour, no gradient text):
    Motion: word-by-word blur reveal, each word initial { filter: 'blur(10px)', opacity: 0, y: 24 }
      -> animate { filter: 'blur(0px)', opacity: 1, y: 0 }, duration 0.65s, ease [0.16, 1, 0.3, 1],
      delay: 0.20 + wordIndex * 0.06
    Classes: font-display font-extrabold uppercase text-[clamp(2.6rem,5.4vw,4.75rem)]
      leading-[0.94] tracking-[-0.025em] text-[var(--text-primary)] max-w-[16ch]
    Text: "VERIFY CARBON BY PHYSICS, NOT TRUST"

  Element 3: Subheading (22 words, <= 3 lines on desktop):
    Motion: initial { filter: 'blur(8px)', opacity: 0, y: 16 } -> animate { filter: 'blur(0px)', opacity: 1, y: 0 }
      transition { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.45 }
    Classes: mt-5 font-body text-base md:text-lg text-[var(--text-secondary)] leading-[1.55] max-w-[48ch]
    Text: "Vane cross-checks facility smart meters against live satellite weather, blocks spoofed power on-chain, and proves EU CBAM compliance without exposing supplier prices."

  Element 4: CTA Cluster (mt-8 = 32px from subhead, strictly <= 40px proximity rule):
    Motion: initial { filter: 'blur(8px)', opacity: 0, y: 16 } -> animate { filter: 'blur(0px)', opacity: 1, y: 0 }
      transition { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.60 }
    Classes: mt-8 flex flex-wrap items-center gap-4

    Primary CTA (<MagneticButton> opening WalletConnectModal or routing to '/app' if connected):
      Classes: group inline-flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)]
        text-[#0a0b0d] pl-6 pr-2 py-2 rounded-full font-mono text-xs md:text-sm font-semibold
        uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-150
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
      Label: "CONNECT WALLET"
      Inner circle (Step 17 Button-in-Button):
        w-8 h-8 rounded-full bg-[#0a0b0d]/15 flex items-center justify-center
        group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200
        Inline 14x14 arrow-up-right SVG

    Secondary CTA (smooth-scrolls to `#inspector`):
      Classes: inline-flex items-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent)]
        bg-[var(--bg-surface)]/80 text-[var(--text-primary)] px-6 py-3 rounded-full font-mono text-xs md:text-sm
        uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-150 min-h-[48px]
      Label: "INSPECT TELEMETRY"

RIGHT COLUMN (lg:col-span-5, z-[var(--z-elevated)], 3-Cell Asymmetric Live Instrument Bento Stack):
  Mobile order: `order-first lg:order-last` if desired? Keep `order-last` on `sm`, compact height so headline stays <= 200px from top on mobile too!
  Grid container: grid grid-cols-1 sm:grid-cols-2 gap-3.5

  CELL A: Top Full-Span Live PINN Physics Guard (`sm:col-span-2`, Double-Bezel + TiltBezelCard):
    Motion: initial { filter: 'blur(10px)', opacity: 0, y: 24, scale: 0.97 }
      -> animate { filter: 'blur(0px)', opacity: 1, y: 0, scale: 1 }
      transition { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.38 }
    Outer tray: p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]
    Inner surface: surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] shadow-[var(--shadow-bezel)] p-5

    Top header bar: flex items-center justify-between gap-2 pb-3.5 border-b border-[var(--border-subtle)]
      Left coordinate label: font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]
        Text: "GEBZE MILL #04 · 40.80°N 29.43°E" (live Open-Meteo solar irradiance coordinates in Kocaeli industrial zone)
      Status badge:
        Normal state: inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-bg)]
          border border-[var(--success)]/30 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--success)]
          Dot + "CALIBRATED"
        Spoofed state: inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--error-bg)]
          border border-[var(--error)]/40 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--error)]
          Alert triangle SVG + "QUARANTINED"

    Live dual readout row (mt-4 grid grid-cols-3 gap-3 divide-x divide-[var(--border-subtle)]):
      Col 1: label `SATELLITE GHI` (`font-mono text-[10px] text-[var(--text-muted)]`) / live Open-Meteo `W/m²` value (`font-mono text-base md:text-lg font-semibold text-[var(--text-primary)]`)
      Col 2 (pl-3): label `METER OUTPUT` / live kW value (jumps `1.4x` when user clicks spoof toggle)
      Col 3 (pl-3): label `PINN RESIDUAL` / live residual (`0.031 σ` emerald normal -> `0.482 σ` crimson when spoofed)

    Coded SVG waveform + interactive attack toggle footer (mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3):
      Left: live 24-point SVG polyline comparing expected physics curve (dashed `--accent`) against reported inverter curve (solid `--text-primary` or `--error`)
      Right interactive button (`<button type="button" onClick={toggleSpoof}>`):
        min-h-[36px] px-3 py-1.5 rounded-full font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-150
        Default state: bg-[var(--accent-glow)] border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#0a0b0d]
          Label: "INJECT 1.4X SPOOF"
        Active spoof state: bg-[var(--error-bg)] border border-[var(--error)]/50 text-[var(--error)]
          Label: "RESET METER STREAM"

  CELL B: Bottom-Left Zero-Knowledge CBAM Witness (`sm:col-span-1`, Double-Bezel + TiltBezelCard):
    Motion: delay 0.50s, same blur-in curve
    Outer tray: p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]
    Inner surface: surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] shadow-[var(--shadow-bezel)] p-4 flex flex-col justify-between min-h-[156px]
    Top tag: font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] -> "NOIR ZK WITNESS"
    Middle rows (space-y-2 my-3):
      Row 1: flex justify-between text-xs -> `Invoice price` (`text-[var(--text-secondary)]`) / `REDACTED` (`font-mono text-[var(--accent)]`, Text Scramble on mount & viewport re-entry, speed 30)
      Row 2: flex justify-between text-xs -> `CBAM intensity` (`text-[var(--text-secondary)]`) / `1.42 tCO2e/t` (`font-mono text-[var(--success)]`)
    Footer caption: font-mono text-[10px] text-[var(--text-muted)] -> "UBL 2.1 · ZERO PRICE LEAK"

  CELL C: Bottom-Right Live Sepolia Registry Cell (`sm:col-span-1`, Double-Bezel + TiltBezelCard):
    Motion: delay 0.62s, same blur-in curve
    Outer tray: p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]
    Inner surface: surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] shadow-[var(--shadow-bezel)] p-4 flex flex-col justify-between min-h-[156px]
    Top tag: flex items-center justify-between -> `font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]` "ETH SEPOLIA" + live emerald dot
    Middle metric: live `totalVerifiedAttestations()` read via `viem` public client (`Skeleton` shimmer until resolved, never fake hardcoded count):
      Number: font-display text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums
      Sub-label: font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] mt-1 -> "ATTESTATIONS SEALED"
    Footer link (`<a>` to verified Sepolia contract on Etherscan):
      inline-flex items-center gap-1 font-mono text-[10px] text-[var(--accent)] hover:underline -> "VIEW CONTRACT" + 10x10 external SVG
```

---

### Section 3.2: The Oracle Gap (`full-width-statement` Breathing Section)

**Recipe:** `full-width-statement` (`COMPOSITION_RECIPES.md` Section D).
**Eyebrow:** None (strict eyebrow restraint after Section 3.1).
**Asset Brief:** None (typography-led breathing interval over dimmed `VaneField` at opacity `0.35`).

```
z-index: z-[var(--z-content)] (10)

OUTER SECTION:
  id="oracle-gap"
  Classes: relative w-full py-24 md:py-36 border-y border-[var(--border-subtle)] bg-[var(--bg-primary)]/85 z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: max-w-7xl mx-auto px-4 md:px-8 lg:px-16

STATEMENT BLOCK:
  Motion wrapper: initial { filter: 'blur(10px)', opacity: 0, y: 24 }
    whileInView { filter: 'blur(0px)', opacity: 1, y: 0 }
    viewport { once: false, amount: 0.1 }
    transition { duration: 0.7, ease: [0.16, 1, 0.3, 1] }

  Statement heading (h2):
    Classes: font-display font-extrabold uppercase text-left text-[clamp(2.25rem,6.2vw,5.25rem)]
      leading-[0.95] tracking-[-0.02em] text-[var(--text-primary)] max-w-[20ch]
    Text: "A BLOCKCHAIN CANNOT SPOT A LIAR IN THE METER BOX"

  Supporting operational note (single focused line, no cards, no CTA):
    Motion: delay 0.16s, same `once: false` viewport config
    Classes: font-mono text-xs md:text-sm uppercase tracking-[0.16em] text-[var(--text-secondary)] mt-8 max-w-[64ch]
    Text: "SPOOFED KILOWATTS MINT FRAUDULENT GREEN CLAIMS. PUBLIC INVOICES LEAK SUPPLIER MARGINS. VANE CLOSES BOTH GAPS."
```

---

### Section 3.3: Dual-Engine Interactive Inspector (`tabbed-feature-explorer`)

**Recipe:** `tabbed-feature-explorer` (`COMPOSITION_RECIPES.md` Section D), adapted to Double-Bezel operational panels with real interactive inputs.
**Eyebrow:** None (strict `1 eyebrow per 3 sections` rule).
**Asset Brief:** Coded live interactive panels powered by real `/api/telemetry/live` Open-Meteo data and real `UBL 2.1 XML` sample parser. Zero external imagery.

```
z-index: z-[var(--z-content)] (10), interactive bezel card z-[var(--z-elevated)] (20)

OUTER SECTION:
  id="inspector"
  Classes: relative w-full py-24 md:py-32 bg-[var(--bg-secondary)] z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: max-w-7xl mx-auto px-4 md:px-8 lg:px-16

SECTION HEADER (stacked vertically, never split-header filler per §0D Rule 5):
  Motion: initial { filter: 'blur(10px)', opacity: 0, y: 20 }
    whileInView { filter: 'blur(0px)', opacity: 1, y: 0 }
    viewport { once: false, amount: 0.1 }
    transition { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
  Heading (h2):
    font-display text-3xl md:text-5xl font-bold uppercase tracking-[-0.02em] leading-[0.98] text-[var(--text-primary)]
    Text: "TWO VERIFIERS, ONE CONTINUOUS PROOF"
  Subheading:
    mt-4 font-body text-base md:text-lg text-[var(--text-secondary)] max-w-[58ch] leading-relaxed
    Text: "Test how physical telemetry verification feeds straight into client-side zero-knowledge customs attestation."

TAB BAR:
  Classes: mt-10 flex gap-2 border-b border-[var(--border-default)] overflow-x-auto
  Tab buttons (x2: `TAB_PINN = "Engine 1: Physics Meter Guard"`, `TAB_NOIR = "Engine 2: Browser ZK CBAM Prover"`):
    Classes: px-5 py-3.5 font-mono text-xs md:text-sm uppercase tracking-[0.12em] whitespace-nowrap min-h-[44px] transition-colors duration-150
    Active: text-[var(--accent)] border-b-2 border-[var(--accent)] font-semibold
    Inactive: text-[var(--text-muted)] hover:text-[var(--text-primary)]

TAB PANEL CONTENT (`AnimatePresence mode="wait"`, fade + blur(6px) + y: 12 -> 0, duration 0.28s, ease [0.16, 1, 0.3, 1]):
  Grid: mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center

  TAB 1 (`Engine 1: Physics Meter Guard`):
    Left copy (lg:col-span-5):
      h3: font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)]
        Text: "CATCH COMPROMISED METERS BEFORE MINTING"
      p: mt-4 font-body text-base text-[var(--text-secondary)] leading-relaxed max-w-[50ch]
        Text: "Every smart-meter interval is evaluated against live satellite solar irradiance, ambient temperature, and cloud-shadow transit lag across nearby arrays."
      Spec bullets (mt-6 space-y-3, inline 16x16 check SVG in `text-[var(--accent)]`):
        1. "Cross-checks kW output against live Open-Meteo shortwave irradiance and cell thermal drift"
        2. "Detects scale-up multipliers, nighttime replay traces, and synthetic flatline packets in under 200ms"
        3. "Writes hourly Merkle energy roots and automatically quarantines spoofed device keys on Sepolia"

    Right interactive preview (lg:col-span-7, Double-Bezel tray `p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]`):
      Inner core: `rounded-[10px] bg-[var(--bg-primary)] p-5 md:p-6`
      Interactive facility selector (`Antalya Solar Park`, `Gebze Arc Furnace Rooftop`, `Izmir Wind Sub-Meter`) + attack mode segmented buttons (`Clean Telemetry`, `1.4x Multiplier Spoof`, `Night Replay Trace`) updating real physics equations and showing exact contract call `quarantineMeter(bytes32 meterId, uint256 residualBps)` live.

  TAB 2 (`Engine 2: Browser ZK CBAM Prover`):
    Left copy (lg:col-span-5):
      h3: font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)]
        Text: "PROVE CBAM THRESHOLDS WITH ZERO COMMERCIAL LEAK"
      p: mt-4 font-body text-base text-[var(--text-secondary)] leading-relaxed max-w-[50ch]
        Text: "Suppliers drop in standard UBL 2.1 XML e-invoices. An UltraHonk circuit runs inside WebAssembly in the browser so pricing and tax IDs never leave local memory."
      Spec bullets (mt-6 space-y-3):
        1. "Verifies clean-energy allocation against an un-quarantined facility root on VaneMeterOracle"
        2. "Proves embedded emissions stay below the declared EU CBAM ceiling per tonne of steel, cement, or aluminium"
        3. "Publishes a Poseidon2 nullifier on Sepolia so no invoice or clean MWh batch can ever be counted twice"

    Right interactive split preview (lg:col-span-7, Double-Bezel tray):
      Split `grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]`:
      Left pane (`PRIVATE WITNESS · BROWSER RAM ONLY`): displays raw `UBL 2.1` XML tags (`UnitPrice: 642.50 EUR`, `SupplierTIN: TR-4810923811`, `BatchKWh: 41,800`) marked `NEVER TRANSMITTED`.
      Right pane (`PUBLIC PROOF · SEPOLIA CALLDATA`): displays verified public outputs (`FacilityRoot`, `NullifierHash`, `MaxIntensity: 1.45 tCO2e/t`, `Result: VERIFIED`) + button "OPEN FULL PROVER IN CONSOLE" (triggers `handleLaunch` wallet gate).
```

---

### Section 3.4: Four-Stage Verification Pipeline (`architecture-layers`)

**Recipe:** `architecture-layers` (`COMPOSITION_RECIPES.md` Section B).
**Eyebrow:** **Yes (Eyebrow #2 of 3 on page):** `VERIFICATION PIPELINE` (no section numbers in eyebrow per AI Visual Tells rule).
**Asset Brief:** None (crisp stacked architectural layer modules).

```
z-index: z-[var(--z-content)] (10)

OUTER SECTION:
  id="pipeline"
  Classes: relative w-full py-24 md:py-32 bg-[var(--bg-primary)]/90 z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: max-w-4xl mx-auto px-4 md:px-8

HEADER (centred):
  Motion: initial { filter: 'blur(10px)', opacity: 0, y: 20 }
    whileInView { filter: 'blur(0px)', opacity: 1, y: 0 }
    viewport { once: false, amount: 0.1 }
    transition { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
  Eyebrow: font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-3
    Text: "VERIFICATION PIPELINE"
  Heading (h2): font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-[-0.02em] text-[var(--text-primary)]
    Text: "FROM KILOWATT TO CUSTOMS SEAL IN FOUR STAGES"

LAYERS STACK:
  Classes: mt-14 flex flex-col gap-4

  Each Layer Card (x4, repeatable stagger `delay: index * 0.08`, `viewport: { once: false, amount: 0.1 }`):
    Outer tray: p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)] hover:ring-[var(--accent)]/50 transition-all duration-200
    Inner core: rounded-[10px] bg-[var(--bg-surface)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6

    Stage badge:
      px-2.5 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30
      font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)] w-fit shrink-0
    Title: font-display text-xl md:text-2xl font-bold uppercase tracking-[-0.01em] text-[var(--text-primary)]
    Description: font-body text-sm md:text-base text-[var(--text-secondary)] mt-1.5 leading-relaxed
    Output pill (sm:ml-auto shrink-0): font-mono text-[11px] text-[var(--text-muted)] pt-1

    Exact Copy:
      Stage `INGEST`
        Title: "INGEST SIGNED TELEMETRY & UBL INVOICES"
        Description: "Vane pulls facility inverter telemetry alongside live Open-Meteo solar irradiance and wind vectors, paired with standard Peppol or UBL 2.1 XML energy invoices."
        Output pill: "MQTT / XML -> JSON"

      Stage `CALIBRATE`
        Title: "SCORE THERMODYNAMIC & PINN RESIDUALS"
        Description: "The physics verifier checks reported power curves against solar geometry and cell temperature. Clean intervals anchor an hourly Merkle root; anomalies quarantine the meter key."
        Output pill: "VaneMeterOracle.sol"

      Stage `PROVE`
        Title: "COMPILE CLIENT-SIDE ULTRAHONK PROOF"
        Description: "Noir executes inside browser WebAssembly to prove embedded emissions per tonne fall under threshold using verified energy roots, keeping unit prices and tax IDs local."
        Output pill: "bb.js WASM -> Proof"

      Stage `SETTLE`
        Title: "SEAL NULLIFIER & MINT CBAM CERTIFICATE"
        Description: "Ethereum Sepolia verifies the proof on-chain, records the invoice nullifier so clean energy cannot be sold twice, and issues a publicly verifiable compliance receipt."
        Output pill: "VaneAttestationRegistry.sol"
```

---

### Section 3.5: Live Protocol Telemetry (`metrics-section` Breathing Section)

**Recipe:** `metrics-section` (`COMPOSITION_RECIPES.md` Section B).
**Eyebrow:** None (plain uppercase mono context caption without section enumeration; counts cleanly as non-eyebrow breathing strip or simple label; we drop the top label completely and let the 3 giant numbers speak for zero eyebrow inflation!).
**Asset Brief:** None (real on-chain reads via `viem` on Ethereum Sepolia).

```
z-index: z-[var(--z-content)] (10)

OUTER SECTION:
  id="telemetry"
  Classes: relative w-full py-24 md:py-32 border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: max-w-7xl mx-auto px-4 md:px-8 lg:px-16

METRICS GRID:
  Classes: grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x md:divide-[var(--border-default)] text-center

  Each Metric Column (x3, `px-4 md:px-8`):
    Motion: initial { filter: 'blur(8px)', opacity: 0, y: 18 }
      whileInView { filter: 'blur(0px)', opacity: 1, y: 0 }
      viewport { once: false, amount: 0.1 }
      transition { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }

    Number:
      font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums
      Loading state before Sepolia RPC resolves: `<div className="h-16 w-28 mx-auto rounded-lg bg-white/5 animate-shimmer" />`
      Counter animation (`useCountUp` over `1400ms` once live RPC read resolves)
    Label:
      font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] mt-4
    Source sub-note:
      font-mono text-[11px] text-[var(--text-muted)] mt-1.5

    Exact Metric Definitions:
      Column 1:
        Value: live `registry.totalVerifiedAttestations()` read from Sepolia
        Label: "CBAM PROOFS VERIFIED ON-CHAIN"
        Source sub-note: "VaneAttestationRegistry · Sepolia"
      Column 2:
        Value: live `oracle.totalQuarantinedIntervals()` read from Sepolia
        Label: "SPOOFED METER INTERVALS BLOCKED"
        Source sub-note: "VaneMeterOracle · PINN Guard"
      Column 3:
        Value: fixed `0 B`
        Label: "COMMERCIAL PRICING EXPOSED"
        Source sub-note: "100% browser WASM witness generation"
```

---

### Section 3.6: Verification Comparison Matrix (`asymmetric-bento-grid`, 4 Unequal Cells)

**Recipe:** `asymmetric-bento-grid` (`COMPOSITION_RECIPES.md` Section D) combined with `§2E` asymmetric Bento sizing rules (strictly **4 unequal cells**, well under the 6-cell maximum, zero equal 3-card row cliche).
**Eyebrow:** **Yes (Eyebrow #3 of 3: final eyebrow on page):** `PROTOCOL ADVANTAGE`.
**Asset Brief:** None (structured typographic & tabular operational cells).

```
z-index: z-[var(--z-content)] (10), featured Vane cell z-[var(--z-elevated)] (20)

OUTER SECTION:
  id="comparison"
  Classes: relative w-full py-24 md:py-32 bg-[var(--bg-primary)]/90 z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: max-w-7xl mx-auto px-4 md:px-8 lg:px-16

HEADER:
  Eyebrow (#3 of 3): font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-3
    Text: "PROTOCOL ADVANTAGE"
  Heading (h2): font-display text-3xl md:text-5xl font-bold uppercase tracking-[-0.02em] text-[var(--text-primary)]
    Text: "WHY EXISTING CARBON SYSTEMS FAIL AUDIT"

ASYMMETRIC 12-COLUMN BENTO GRID (mt-12 grid grid-cols-1 lg:grid-cols-12 gap-5):

  CELL 1: Featured Primary Cell: Vane Protocol (`lg:col-span-7`, Double-Bezel + TiltBezelCard):
    Outer tray: p-1.5 rounded-2xl bg-[var(--accent-glow)] ring-1 ring-[var(--accent)]/45
    Inner core: surface-noise relative rounded-[10px] bg-[var(--bg-surface)] p-6 md:p-8 h-full flex flex-col justify-between
    Header row: badge `RECOMMENDED ARCHITECTURE` (`bg-[var(--accent)] text-[#0a0b0d] px-3 py-1 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.14em]`)
    Title (h3): font-display text-2xl md:text-3xl font-bold uppercase text-[var(--text-primary)] mt-4
      Text: "VANE PHYSICS + ZERO-KNOWLEDGE"
    Rows (`mt-6 divide-y divide-[var(--border-subtle)]`):
      - `Hardware spoofing defence` -> `Live PINN + satellite irradiance check` (`text-[var(--success)] font-mono text-xs md:text-sm`)
      - `Supplier price privacy` -> `100% private in browser RAM` (`text-[var(--success)] font-mono text-xs md:text-sm`)
      - `Double-counting prevention` -> `On-chain Poseidon2 invoice nullifier` (`text-[var(--success)] font-mono text-xs md:text-sm`)
      - `Audit turnaround time` -> `Under 6 seconds per shipment` (`text-[var(--accent)] font-mono text-xs md:text-sm`)

  CELL 2: Tall Contrast Cell: Naive Public Carbon Blockchains (`lg:col-span-5`):
    Outer tray: p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)]
    Inner core: surface-noise relative rounded-[10px] bg-[var(--bg-secondary)] p-6 md:p-8 h-full flex flex-col justify-between
    Title (h3): font-display text-xl md:text-2xl font-bold uppercase text-[var(--text-primary)]
      Text: "PUBLIC CARBON LEDGERS"
    Rows (`mt-6 divide-y divide-[var(--border-subtle)]`):
      - `Hardware spoofing defence` -> `None; hashes fake meter readings permanently` (`text-[var(--error)] font-mono text-xs`)
      - `Supplier price privacy` -> `Leaks BOM & kWh costs on public explorers` (`text-[var(--error)] font-mono text-xs`)
      - `Double-counting prevention` -> `Registry-level only` (`text-[var(--text-secondary)] font-mono text-xs`)
      - `Enterprise ERP adoption` -> `Blocked by legal & procurement teams` (`text-[var(--error)] font-mono text-xs`)

  CELL 3: Wide Bottom-Left Cell: Manual PDF & Spreadsheet CBAM Audits (`lg:col-span-6`):
    Outer tray: p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)]
    Inner core: rounded-[10px] bg-[var(--bg-secondary)] p-6
    Title (h3): font-display text-xl font-bold uppercase text-[var(--text-primary)]
      Text: "MANUAL PDF VERIFICATION"
    Body: mt-2 font-body text-sm text-[var(--text-secondary)] leading-relaxed
      Text: "Costs EUR 18,000 to EUR 45,000 per facility each year, relies on static utility bills easily edited in PDF software, and leaves Tier-2 exporters defaulting to punitive EU emission markups."

  CELL 4: Wide Bottom-Right Cell: Plug-and-Play Integration Sidecar (`lg:col-span-6`):
    Outer tray: p-1.5 rounded-2xl bg-white/[0.03] ring-1 ring-[var(--border-default)]
    Inner core: rounded-[10px] bg-[var(--bg-secondary)] p-6 flex flex-col justify-between
    Title (h3): font-display text-xl font-bold uppercase text-[var(--text-primary)]
      Text: "ZERO PLATFORM MIGRATION"
    Code command strip (`mt-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[10px] px-4 py-3 font-mono text-xs text-[var(--text-primary)] flex items-center justify-between`):
      `curl -X POST /api/telemetry/verify -d @meter_batch.json` + copy button (`aria-label="Copy curl command"`)
```

---

### Section 3.7: Standards & COP 31 Technical Schematic (`split-image-text` Adapted)

**Recipe:** `split-image-text` (`COMPOSITION_RECIPES.md` Section B), right media slot fulfilled per Step 13 Phase 1 using a coded blueprint schematic SVG + protocol card grid instead of stock photography.
**Eyebrow:** None (zero eyebrow; Section 3.6 already used the 3rd and final eyebrow).
**Asset Brief:** Coded architectural schematic diagram (`src/components/sections/ProtocolSchematicSvg.tsx`) drawing live data flow from `Open-Meteo + Smart Meter` -> `PINN Residual Filter` -> `Noir UltraHonk Prover` -> `Ethereum Sepolia Registry`.

```
z-index: z-[var(--z-content)] (10)

OUTER SECTION:
  id="standards"
  Classes: relative w-full py-24 md:py-32 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] z-[var(--z-content)]

INNER STATIC WIDTH CONTAINER:
  Classes: max-w-7xl mx-auto px-4 md:px-8 lg:px-16

GRID LAYOUT:
  Classes: grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center

LEFT COLUMN (lg:col-span-5):
  Motion: initial { filter: 'blur(10px)', opacity: 0, x: -24 }
    whileInView { filter: 'blur(0px)', opacity: 1, x: 0 }
    viewport { once: false, amount: 0.1 }
    transition { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  Heading (h2, no eyebrow):
    font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[var(--text-primary)]
    Text: "ALIGNED WITH EU CBAM AND UN COP 31 TARGETS"
  Body copy:
    mt-5 font-body text-base text-[var(--text-secondary)] leading-relaxed max-w-[48ch]
    Text: "Built for industrial exporters across steel, aluminium, cement, and clean energy generation ahead of UN COP 31 in Antalya. Every proof anchors to open international standards rather than proprietary schemas."

RIGHT COLUMN (lg:col-span-7):
  Motion: initial { filter: 'blur(10px)', opacity: 0, x: 24 }
    whileInView { filter: 'blur(0px)', opacity: 1, x: 0 }
    viewport { once: false, amount: 0.1 }
    transition { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }
  Double-Bezel schematic container (`p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-[var(--border-default)]`):
    Inner core (`rounded-[10px] bg-[var(--bg-primary)] p-6`):
      Top: Responsive SVG blueprint diagram (`viewBox="0 0 640 240"`, crisp `1px` `--border-strong` nodes and `--accent` animated stroke pulse, reduced-motion static)
      Bottom 4-column standards strip (`mt-6 pt-5 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-4`):
        1. `REGULATION` / `EU 2023/956 CBAM`
        2. `INVOICE SCHEMA` / `OASIS UBL 2.1 XML`
        3. `WEATHER ORACLE` / `Open-Meteo GHI`
        4. `SETTLEMENT` / `Ethereum Sepolia`
```

---

### Section 3.8: Final Dispatch CTA & Operational Footer (`footer-video` Adapted)

**Recipe:** `footer-video` (`COMPOSITION_RECIPES.md` Section B), adapted so full-intensity `VaneField` (`opacity-100`) provides kinetic atmosphere across the closing conversion block, followed by a clean single-border operational footer.
**Eyebrow:** None.
**CTA Intent Rule:** Uses the exact primary label `"CONNECT WALLET"` (`"OPEN CONSOLE"` when already connected), matching Nav and Hero with zero duplicate CTA phrasing.

```
z-index: z-[var(--z-content)] (10) over `VaneField` at opacity 1.0 (`z-0`)

FINAL CTA BAND:
  id="dispatch"
  Classes: relative w-full py-28 md:py-40 flex items-center justify-center z-[var(--z-content)]
  Inner container: max-w-3xl mx-auto px-4 md:px-8 text-center flex flex-col items-center

  Heading (h2):
    Motion: initial { filter: 'blur(10px)', opacity: 0, y: 24 }
      whileInView { filter: 'blur(0px)', opacity: 1, y: 0 }
      viewport { once: false, amount: 0.1 }
      transition { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
    Classes: font-display font-extrabold uppercase text-[clamp(2.4rem,5.5vw,4.5rem)]
      leading-[0.95] tracking-[-0.02em] text-[var(--text-primary)]
    Text: "VERIFY YOUR FIRST SHIPMENT ON SEPOLIA"

  Subtext:
    Motion: delay 0.14s, same `once: false` config
    Classes: mt-5 font-body text-base md:text-lg text-[var(--text-secondary)] max-w-[46ch]
    Text: "Connect a Sepolia wallet, run a live satellite physics check, and seal a zero-knowledge CBAM proof in under a minute."

  Primary CTA (<MagneticButton> with Button-in-Button icon):
    Motion: delay 0.26s, same `once: false` config
    Classes: mt-9 group inline-flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)]
      text-[#0a0b0d] pl-7 pr-2.5 py-2.5 rounded-full font-mono text-sm font-semibold uppercase tracking-[0.12em]
      whitespace-nowrap transition-colors duration-150
    Label: "CONNECT WALLET"
    Inner circle: w-9 h-9 rounded-full bg-[#0a0b0d]/15 flex items-center justify-center
      group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200

OPERATIONAL FOOTER (`<footer>`):
  Classes: relative w-full py-12 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 z-[var(--z-content)]
  Container: max-w-7xl mx-auto px-4 md:px-8 lg:px-16
  Top flex row: flex flex-col md:flex-row md:items-center md:justify-between gap-6
    Left:
      Wordmark: font-mono text-sm font-semibold tracking-[0.28em] uppercase text-[var(--text-primary)] -> "VANE"
      Attribution: font-body text-xs text-[var(--text-muted)] mt-2 max-w-[54ch]
        Text: "Built for the IEEE ClimateChain Global Hackathon 2026 supporting UN COP 31 climate transparency goals."
    Right link row (`flex flex-wrap gap-x-8 gap-y-3`):
      Links (`font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors`):
        - "Verify Receipt" (`/verify`)
        - "Sepolia Contracts" (verified Etherscan URL)
        - "API Docs" (`/docs`)
        - "GitHub" (public repository URL)
  Bottom bar (`mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] text-[var(--text-muted)]`):
    Left: "© 2026 Vane Protocol"
    Right: "Ethereum Sepolia · Open-Meteo GHI · Noir UltraHonk"
```

---

## 4. Wallet-Gated App Interior Specifications (`/app/**`)

Per Step 17 ("Dashboard Hardening: Borders Over Cards"), the application interior uses clean `border-t` and `divide-y` data tables with negative space rather than boxing every single number inside heavy cards, reserving Double-Bezel elevation strictly for active interactive modules. Background animation (`VaneField`) is unmounted or set to `0` on `/app/**` so full GPU headroom stays reserved for client-side WebAssembly proving.

### 4.1 App Shell (`src/app/app/layout.tsx`)
- **Desktop (`>= 1024px`):** Fixed `240px` left sidebar (`bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]`) + `64px` top bar (`sticky top-0 z-[var(--z-sticky)] liquid-glass border-b border-[var(--border-subtle)]` containing route title on left and `<WalletDropdown />` on right) + fluid main work area (`max-w-6xl mx-auto px-6 py-8`).
- **Mobile (`< 1024px`):** Fixed `64px` top bar + fixed bottom navigation bar (`fixed bottom-0 inset-x-0 h-16 liquid-glass border-t border-[var(--border-subtle)] grid grid-cols-4 items-center z-[var(--z-sticky)]`, 4 items max, >=44px touch targets).
- **Navigation routes (4 items):**
  1. `/app` (`Overview`)
  2. `/app/meters` (`Meter Guard`)
  3. `/app/attest/new` (`New ZK Proof`)
  4. `/verify` (`Public Verifier`, also accessible without wallet so customs officers can verify any receipt link directly!)

### 4.2 `/app`: Overview Console
- Top summary rail (`grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-default)] border-y border-[var(--border-default)] py-5`):
  1. `Active Facility Meters` (live read from `VaneMeterOracle`)
  2. `Latest Physics Residual` (`0.029 σ · Calibrated`)
  3. `Your Sealed CBAM Proofs` (`getAttestationsByExporter(address)`)
  4. `Quarantined Intervals` (count + quick jump link)
- Recent on-chain attestations & meter roots table (`divide-y divide-[var(--border-subtle)]`), with skeleton shimmer rows during RPC fetch and an actionable empty state when a newly connected wallet has `0` attestations (`"No CBAM proofs sealed from this wallet yet."` + primary button `"SEAL FIRST SHIPMENT PROOF"` -> `/app/attest/new`).

### 4.3 `/app/meters`: Live Physics Meter Guard Console
- Pulls live real-time weather physics (`shortwave_radiation`, `direct_normal_irradiance`, `temperature_2m`, `cloud_cover`, `wind_speed_10m`) from Open-Meteo for any facility coordinate preset (`Gebze Steel Works`, `Antalya Solar Array`, `Iskenderun Aluminium Mill`, or custom lat/lon input).
- Streams recorded NREL / industrial inverter telemetry rows against the PINN physical expectation model in real time.
- **Two live Sepolia contract actions:**
  - `ANCHOR CLEAN MERKLE ROOT` -> calls `VaneMeterOracle.submitHourlyRoot(...)` on Sepolia when residual stays within `<= 0.12 σ`.
  - `INJECT SPOOF & TEST QUARANTINE` -> injects a `1.4x` kWh multiplier or night replay packet, triggers PINN fault detection, and submits `VaneMeterOracle.reportAndQuarantine(...)` live on Sepolia so judges watch the transaction hash confirm on `sepolia.etherscan.io`.

### 4.4 `/app/attest/new`: 3-Step Client-Side Noir ZK CBAM Prover
Includes explicit 3-step progress bar (`Step 1: Parse UBL 2.1 Invoice` -> `Step 2: Generate Browser ZK Proof` -> `Step 3: Submit to Sepolia`) per Step 16 Priority 4:
1. **Step 1 (`UBL 2.1 XML` Input):** Drag-and-drop real `UBL 2.1` XML industrial invoice (with 3 pre-built downloadable real-world steel, aluminium, and cement XML files included in `public/samples/` so you can edit them live in VS Code during your Windows screen recording!). Validates every field on `onBlur` with exact recovery instructions.
2. **Step 2 (`Noir + bb.js` Browser Proving):** Runs inside a dedicated Web Worker (`src/workers/prover.worker.ts`) so the main thread remains at 60fps under the 16ms frame budget. Displays a progress-morphing bar (`Compiling witness -> Proving UltraHonk circuit -> Proof ready in 2.4s`) plus side-by-side **Private Witness (Never Leaves Browser)** vs **Public Calldata (`bytes proof, bytes32[] publicInputs`)**.
3. **Step 3 (`Sepolia On-Chain Settlement`):** Calls `VaneAttestationRegistry.submitAttestation(proof, publicInputs)` via `wagmi`. Once the Sepolia transaction confirms on-chain (`waitForTransactionReceipt`), renders a downloadable W3C-formatted CBAM Receipt JSON + direct `/verify/[attestationId]` shareable URL + Sepolia Etherscan transaction link.

---

## 5. Responsive Summary

- All hero elements fit inside `1280x800` on desktop (`min-h-[100dvh]`) with zero vertical overflow and first visible eyebrow at `<= 140px` from top edge.
- Below `lg` (`1024px`), the 12-column hero collapses cleanly to a single column; `VaneField` drops from `448` to `140` calibration vectors automatically on screens `< 768px`.
- Every interactive control across mobile nav, tabs, spoof toggles, copy buttons, and form inputs maintains a minimum `44x44px` hit target.
- All display headings use fluid `clamp()` across viewports; zero bare fixed desktop font sizes.

---

## 6. Asset Brief Summary

No external photography, stock imagery, or AI video generation is required for this build:
1. **Background & Atmosphere:** `VaneField.tsx` coded procedural 2D vector calibration field + inline mathematical SVG `fractalNoise` grain overlay.
2. **Technical Visuals:** Live Open-Meteo satellite irradiance waveforms + `ProtocolSchematicSvg.tsx` coded blueprint diagram.
3. **Sample Real-World Data Files (`public/samples/`):** Real `UBL 2.1` XML industrial export invoices (`gebze_hot_rolled_coil.xml`, `iskenderun_aluminium_billet.xml`, `antalya_solar_ppa.xml`) and real NREL 5-minute PV inverter telemetry CSV trace (`nrel_pv_trace.csv`).
4. **Logo & Favicon:** Strictly reserved as plain HTML/JSX comment slots until supplied by the user:
   - `{/* Logo slot: replace with public/logo.svg once provided */}`
   - `<!-- Favicon slot: replace with public/favicon.ico once provided -->`

---

## 7. Spec Self-Check (Step 3D Rule 7 + Steps 13-17 Audit)

- [x] Every element has exact Tailwind classes with zero vague descriptions
- [x] Every animation specifies exact `initial`, `whileInView`/`animate`, `duration`, `ease`, and `delay` values
- [x] Zero `viewport={{ once: true }}` anywhere; all scroll animations replay cleanly with `viewport={{ once: false, amount: 0.1 }}`
- [x] Global named z-index scale declared and mapped explicitly per section
- [x] Asset briefs locked in before any code begins; logo and favicon kept strictly as plain comment slots
- [x] Responsive breakpoints included across every layout grid, padding, and fluid display heading
- [x] Composition recipes referenced by name across all 8 sections; 7 distinct layout families used with zero repetition and max 3 eyebrows total
- [x] `backdrop-filter: blur()` applied strictly on fixed/sticky layers (`Nav`, `WalletConnectModal`, `WalletDropdown`), never on scrolling containers
- [x] Double-Bezel (`Doppelrand`) concentric radii (`rounded-2xl` outer -> `rounded-[10px]` inner) and Button-in-Button circular icon wrappers specified
- [x] Wallet connection modal states, cookie hydration without `localStorage`/`sessionStorage`, protected `/app` routing, runtime `AppErrorBoundary`, portalled app-interior wallet dropdown, and all 6 refresh/deep-link acceptance checks explicitly specified
- [x] Zero em dashes anywhere, British English throughout, zero banned AI buzzwords, zero placeholder copy

---

## 8. Copy and Punctuation Specification (Mandatory Across All Files)

Every piece of user-facing text obeys this rule set: headings, body copy, labels, button text, helper text, placeholders, tooltips, validation messages, empty states, loading copy, error messages, and toasts.

### Core Rule
**A full stop ends a thought. A comma carries one on. Decide which before writing, not after.**

Never join two independent clauses with a bare comma (comma splice), and never chop a single connected thought into robotic two-word announcements. Join independent clauses with a full stop, semicolon, or conjunction.

### Context Table

| Context | Rule | Vane Example |
|---|---|---|
| Label, button, eyebrow, badge, stat | No trailing punctuation | `CONNECT WALLET` |
| Field label with an aside | Parenthetical, lowercase, normal tracking | `Facility latitude (decimal degrees, negative for south)` |
| Helper sentence under a field | One sentence, one full stop | `Coordinates fetch live shortwave irradiance from Open-Meteo.` |
| Status confirmation | Full stop | `Proof verified on Ethereum Sepolia.` |
| Two related clauses, one thought | Comma or semicolon | `Raw prices stay in browser memory, while only the proof hits the chain.` |
| Two independent clauses | Full stop, semicolon, or conjunction; never a bare comma | `Meter residual exceeded threshold, so the interval was quarantined.` |

### Additional Copy Rules
- **British English everywhere** (`colour`, `optimise`, `organisation`, `aluminium`, `behaviour`).
- **Zero em dashes anywhere** in UI strings, code comments, JSDoc, NatSpec, or documentation.
- **Zero banned AI filler words** (`elevate`, `seamless`, `unleash`, `unlock`, `next-gen`, `empower`, `revolutionize`, `transform`, `cutting-edge`, `state-of-the-art`, `supercharge`, `streamline`).
