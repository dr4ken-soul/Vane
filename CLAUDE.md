# Vane: Agent Context

## What This Is

Vane is an industrial verification protocol uniting physical smart-meter anti-spoofing with client-side zero-knowledge EU CBAM (Carbon Border Adjustment Mechanism) compliance proofs on Ethereum Sepolia.

Facility inverter streams are cross-checked against live Open-Meteo satellite solar irradiance and ambient weather physics using a Physics-Informed Neural Network (PINN) residual check. Clean hourly batches anchor Poseidon2 Merkle energy roots to `VaneMeterOracle.sol`; spoofed readings are automatically flagged and quarantined on-chain. Exporters then drop standard `OASIS UBL 2.1` XML industrial invoices straight into their browser, where a Noir UltraHonk Web Worker proves that embedded carbon per tonne falls within declared CBAM limits using verified clean energy without sending prices, batch sizes, or supplier tax IDs across the network.

Built for the **IEEE ClimateChain Global Hackathon 2026** (Primary Track: **Sustainable Supply Chains**, bridging **Renewable Energy & Energy Trading** and **Carbon Markets & Emissions Transparency**), deadline 25 October 2026, supporting **UN COP 31** in Antalya, Türkiye.

---

## One-Line Pitch

Verify carbon by physics, not trust: Vane cross-checks facility smart meters against live satellite weather, quarantines spoofed power on-chain, and seals zero-knowledge CBAM proofs straight from the browser.

---

## MVP Features

1. **PINN Satellite Meter Guard:** Cross-checks reported inverter kW telemetry against live Open-Meteo `shortwave_radiation`, `direct_normal_irradiance`, `temperature_2m`, and `wind_speed_10m`, anchoring clean Merkle roots on `VaneMeterOracle.sol` and quarantining `1.4x` multiplier or replay spoofs on Sepolia.
2. **Browser Noir UltraHonk Prover:** Compiles `UBL 2.1` XML e-invoices inside a client-side Web Worker (`@noir-lang/noir_js` + `@aztec/bb.js`), keeping commercial pricing and supplier tax identifiers strictly in local RAM.
3. **Sepolia Nullifier Settlement:** Verifies UltraHonk proofs on-chain inside `VaneAttestationRegistry.sol`, checks `VaneMeterOracle.isRootClean(root)`, and enforces single-use `Poseidon2` invoice nullifiers so clean electricity cannot be counted twice.
4. **Wallet-Free Public Customs Receipt (`/verify/[id]`):** Lets any customs officer or buyer inspect live verified Sepolia state by URL with no wallet extension required.

Post-hackathon, not in MVP: hardware firmware flashing, recursive multi-hop supplier tree aggregation, and mainnet fiat CBAM certificate settlement.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend & API | Next.js 14 App Router, TypeScript, Tailwind CSS v4 |
| Motion | `motion/react` |
| ZK Prover | Noir `0.36+` (`nargo`), `@noir-lang/noir_js`, `@aztec/bb.js` (UltraHonk in Web Worker) |
| Wallet & Chain | `wagmi v2` (`cookieStorage`, zero `localStorage`) + `viem v2` on Ethereum Sepolia |
| Smart Contracts | Solidity `0.8.27` (`evmVersion: "cancun"`), Hardhat |
| Weather Physics | Live Open-Meteo API (`api.open-meteo.com`, zero key required) + TypeScript PINN forward pass |
| Source of Truth | Ethereum Sepolia contracts (`VaneMeterOracle.sol`, `VaneAttestationRegistry.sol`) |
| Hosting | Vercel |

---

## Design System (All Seven Gates Confirmed)

Do not deviate from any confirmed value below.

- **Aesthetic (Gate 1):** Option 7, Bento grid operational
- **Navigation (Gate 2):** `B1`, Scroll-progress nav (`1.5px` top hairline scaling via `scaleX`, active section readout, hover/focus-revealed links, fixed `CONNECT WALLET` control)
- **Background & Motion (Gate 3):** Option 4 (`Dual-Motion Sync`: procedural `VaneField` HTML5 2D vector calibration canvas + `2a` `TiltBezelCard` + `2b` `MagneticButton`) paired with Option B (`Staggered Viewport Reveal`, repeatable on every scroll pass)
- **Identity Fingerprint (§0C):** `asymmetric editorial / compressed statement / deep dark / technical grid / editorial stagger / cinematic entrance`
- **Design Dials:** `DESIGN_VARIANCE: 7` / `MOTION_INTENSITY: 6` / `VISUAL_DENSITY: 6`

**Fonts (Gate 4: Option `4B`, Cold Calibration):**
- Display: `Barlow Semi Condensed` (`600, 700, 800`)
- Body: `DM Sans` (`400, 500, 600`)
- Mono: `Fira Code` (`400, 500, 600`)

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Fira+Code:wght@400;500;600&display=swap');
```

**Colour Palette (Gate 5: Option `5A`, Tungsten Foundry):**
```css
--bg-primary:     #0a0b0d;
--bg-secondary:   #101216;
--bg-surface:     #16191f;
--bg-elevated:    #1d2129;
--accent:         #f0a500;
--accent-hover:   #ffbe2e;
--accent-glow:    rgba(240, 165, 0, 0.12);
--text-primary:   #f1f3f5;
--text-secondary: #9aa1ac;
--text-muted:     #68707d;
--border-subtle:  rgba(241, 243, 245, 0.06);
--border-default: rgba(241, 243, 245, 0.12);
--success:        #3dd68c;
--error:          #f2555a;
```

---

## Landing Page Sections (Gate 7: Full 8-Section Operational Flow)

1. **Hero (`Hero.tsx`):** Asymmetric `7/5` operational Bento hero; left headline and magnetic CTA, right 3-cell Double-Bezel instrument stack with live Open-Meteo GHI, interactive `INJECT 1.4X SPOOF` button, Text Scramble ZK witness cell, and live Sepolia attestation read *(Eyebrow 1 of 3)*.
2. **Oracle Gap (`OracleGapStatement.tsx`):** Full-width typographic breathing section *(no eyebrow)*.
3. **Dual-Engine Inspector (`DualEngineInspector.tsx`):** Interactive tabbed explorer switching between Engine 1 (PINN Meter Guard) and Engine 2 (Browser ZK CBAM Prover) *(no eyebrow)*.
4. **Verification Pipeline (`VerificationPipeline.tsx`):** Four stacked architectural stages from `INGEST` to `SETTLE` *(Eyebrow 2 of 3)*.
5. **Live Protocol Telemetry (`LiveTelemetryMetrics.tsx`):** Three live Sepolia contract metrics *(no eyebrow)*.
6. **Comparison Matrix (`ComparisonMatrix.tsx`):** Four-cell asymmetric Bento comparison against public carbon ledgers and manual PDF audits *(Eyebrow 3 of 3)*.
7. **Standards Schematic (`StandardsSchematic.tsx`):** Split blueprint schematic mapping EU `2023/956`, `UBL 2.1`, Open-Meteo, and Sepolia *(no eyebrow)*.
8. **Final Dispatch & Footer (`FinalDispatchFooter.tsx`):** Closing conversion banner over full `VaneField` plus single-border operational footer *(no eyebrow)*.

---

## Logo and Favicon

Neither file exists yet. Keep both strictly as plain comment slots:

```tsx
{/* Logo slot: replace with public/logo.svg once provided */}
```

```html
<!-- Favicon slot: replace with public/favicon.ico once provided -->
```

Never insert an AI-generated logo, geometric placeholder emblem, third-party icon package, or emoji in either slot. All directional and status UI micro-icons must be clean hand-crafted inline `<svg>` elements.

---

## Code Rules (Follow Without Exception)

**Solidity & Noir:**
- Solidity `0.8.27` compiled with `evmVersion: "cancun"` for `HonkVerifier.sol` compatibility.
- NatSpec docblocks (`/// @notice`, `/// @param`) on every external and public contract function.
- Never hardcode `treasuryWallet`, `verifier`, or `meterOracle` addresses inside Solidity source; inject them cleanly through constructor parameters read from `.env`.
- Enforce atomic revert on any failed fee transfer, quarantined facility root, reused nullifier, or failed proof verification.

**TypeScript / React:**
- `camelCase` for every variable, hook, and helper function; explicit JSDoc block on every exported function and custom hook.
- Reference CSS custom properties (`var(--accent)`, `var(--bg-surface)`), never raw hex values inside JSX components.
- CSS hover transitions only (`hover:...`); never use `onMouseEnter`/`onMouseLeave` inline style mutation.
- Import Framer Motion strictly from `motion/react`.
- Every scroll-triggered reveal must use blur-in (`filter: 'blur(10px)' -> 'blur(0px)'`) and repeatable viewport config (`viewport={{ once: false, amount: 0.1 }}`). Never write `once: true` anywhere in scroll reveals.
- Keep layout width containers (`max-w-7xl mx-auto px-4 md:px-8 lg:px-16`) on plain static `<div>` elements inside full-width `<section>` tags, never directly on `<section>` or `<motion.div>`.
- Apply `backdrop-filter: blur()` strictly to fixed/sticky chrome (`Nav`, `WalletConnectModal`, `WalletDropdown`), never to scrolling cards.
- Use skeleton shimmer blocks for async reads, never loading spinners.
- Never use `localStorage`, `sessionStorage`, or `JetBrains Mono` anywhere in this codebase.

**Writing & Copy Rules:**
- British English throughout all UI strings, comments, JSDoc, NatSpec, and markdown files.
- Zero em dashes anywhere in any file or string.
- Zero comma splices; use a full stop, semicolon, or conjunction between independent clauses.
- Zero AI cliche filler verbs (`elevate`, `seamless`, `unleash`, `unlock`, `next-gen`, `empower`, `revolutionize`, `transform`, `cutting-edge`, `state-of-the-art`, `supercharge`, `streamline`).
