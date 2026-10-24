# MARKETING.md: Vane

## Goal

Put Vane directly in front of the IEEE ClimateChain judging panel, Istanbul Chamber of Industry and Commerce observers, and climate-cryptography builders ahead of UN COP 31 in Antalya without sounding like corporate sustainability fluff.

The story takes five seconds to grasp: carbon registries blindly hash whatever smart meters report, while real exporters refuse public blockchains because invoices expose their margins. Vane cross-checks facility meters against live satellite weather physics first, quarantines spoofed power on-chain, and proves EU CBAM compliance in browser WebAssembly with zero pricing leaked.

Core proof to capture on screen: live Open-Meteo irradiance streaming against a real facility meter, a `1.4x` spoof packet getting quarantined live on Sepolia Etherscan, a real `UBL 2.1` steel e-invoice proving inside Chrome in under three seconds with DevTools showing zero network upload, and a clean customs receipt opening without a wallet.

---

## Posting Style

- all lowercase on social posts
- builder voice, factual and direct
- zero buzzwords, zero em dashes, zero fake metrics
- lead with the screen recording showing real Sepolia transactions confirming live

---

## Post Plan

### post 1: live build proof

```
building vane for the ieee climatechain global hackathon ahead of cop31 in antalya

every blockchain carbon project breaks in two places:
1. a 15-line script can spoof inverter kwh logs before they get hashed onchain
2. industrial exporters refuse public ledgers because utility invoices leak unit tariffs and supplier margins

vane fixes both in one pipeline

first, a physics-informed neural residual check cross-verifies facility meter streams against live open-meteo satellite solar irradiance and temperature curves, quarantining spoofed intervals on ethereum sepolia

second, a browser noir ultrahonk prover parses standard ubl 2.1 xml e-invoices locally in wasm and proves eu cbam intensity thresholds onchain with zero pricing bytes ever leaving ram

live demo clip below
```

Attach a 75-second clip from Windows screen recorder showing the hero spoof toggle tripping the PINN residual followed by browser ZK proving.

---

### post 2: final submission

```
submitted vane to the ieee climatechain global hackathon 2026

physics-verified smart meter roots + zero-knowledge eu cbam compliance proofs on ethereum sepolia

- live open-meteo satellite irradiance cross-check catches 1.4x multiplier and night-replay meter spoofs before minting
- noir ultrahonk runs inside a browser web worker over standard ubl 2.1 industrial invoices
- poseidon2 nullifiers block double-counting across buyers while exposing 0 bytes of supplier pricing
- customs officers verify receipts directly at /verify/[id] without needing a wallet

live app -> [vercel url]
sepolia contracts -> [etherscan url]
source -> [github url]
```

Attach the full 3-minute narrated Windows screen recording.

---

## Devpost Submission Copy (Ready to Paste)

**Project Title:** Vane

**Tagline:** Physics-verified smart-meter roots and zero-knowledge EU CBAM compliance proofs on Ethereum Sepolia.

**Primary Track:** Sustainable Supply Chains *(bridging Renewable Energy & Energy Trading and Carbon Markets & Emissions Transparency)*

**Short Description (185 words, Devpost ready):**

Industrial decarbonisation faces two opposite trust failures ahead of UN COP 31 and definitive EU CBAM enforcement. First, blockchain energy registries suffer from the hardware oracle problem: if an inverter or MQTT stream reports spoofed kilowatt-hours, the ledger makes fraud immutable. Second, heavy industrial exporters in steel, aluminium, and cement refuse public blockchains because uploading utility e-invoices exposes unit tariffs, batch sizes, and supplier tax IDs to competitors.

Vane resolves both failures without new hardware or ERP migration. Engine 1 cross-checks facility smart-meter telemetry against live Open-Meteo satellite solar irradiance, wind vectors, and cell thermal physics using a Physics-Informed Neural Network (PINN) residual model, anchoring clean hourly Poseidon2 Merkle roots to `VaneMeterOracle.sol` on Ethereum Sepolia while automatically quarantining spoofed intervals. Engine 2 parses standard `OASIS UBL 2.1` XML industrial invoices inside a client-side Web Worker (`Noir` + `@aztec/bb.js` UltraHonk), proving on `VaneAttestationRegistry.sol` that embedded emissions stay below CBAM ceilings using verified clean energy and unique invoice nullifiers while exposing zero bytes of commercial pricing. Customs officers verify any shipment instantly at `/verify/[id]` with no wallet required.

---

## Windows Screen-Recording Script (3 Minutes 15 Seconds, OBS / Clipchamp)

Record at `1920x1080`, `60fps`, browser zoom `100%`, side-by-side tabs pre-opened:
- Tab 1: Live Vercel URL of **Vane**
- Tab 2: VS Code with `gebze_hot_rolled_coil.xml` open beside Chrome DevTools `Network` tab
- Tab 3: Verified `VaneMeterOracle` and `VaneAttestationRegistry` contracts on `sepolia.etherscan.io`

### Minute-by-Minute Shot List

1. **`0:00 - 0:25` | Hook & Instant Hero Spoof Proof (`/`):**
   - Load Vane landing page; point out live Open-Meteo shortwave irradiance (`W/m²`) for Gebze Mill #04 (`40.80°N, 29.43°E`) and live Sepolia attestation count.
   - Click **`INJECT 1.4X SPOOF`** directly on the hero right-hand Bento gauge: show the PINN physics residual spike red to `0.482 sigma`, vector vanes destabilise, and badge flip from `CALIBRATED` to `QUARANTINED`.
2. **`0:25 - 0:55` | Quick Scroll Architecture Tour (`/` -> Connect Wallet):**
   - Smooth-scroll across the `B1` progress bar through The Oracle Gap statement, Dual-Engine Inspector tabs, Four-Stage Pipeline, and Live Sepolia Metrics.
   - Click **`CONNECT WALLET`**, confirm MetaMask on Sepolia inside the modal, and watch auto-navigation into `/app`.
3. **`0:55 - 1:35` | Live On-Chain Meter Quarantine (`/app/meters` + Etherscan):**
   - Stream live solar telemetry against real-time Open-Meteo weather in `/app/meters`.
   - Inject a spoofed interval and submit **`REPORT & QUARANTINE ON SEPOLIA`**; open the resulting transaction hash on `sepolia.etherscan.io` showing `MeterIntervalQuarantined` emitted on-chain.
4. **`1:35 - 2:40` | Zero-Leak Browser ZK CBAM Proof (`/app/attest/new` + DevTools Network Proof):**
   - Switch to `/app/attest/new` with Chrome DevTools `Network` tab open side-by-side.
   - Drop in `gebze_hot_rolled_coil.xml` (`EUR 642.50` private tariff, `TR-4810923811` private supplier TIN, `7208` hot-rolled steel CN code).
   - Click **`GENERATE ZK PROOF`**: show `prover.worker.ts` compiling the UltraHonk proof in ~2.5 seconds while **zero HTTP requests** appear in DevTools Network!
   - Sign `submitAttestation` in MetaMask and show `AttestationSealed` confirmed live on `sepolia.etherscan.io` containing zero commercial pricing calldata.
5. **`2:40 - 3:15` | Double-Count Rejection & Wallet-Free Customs Verification (`/verify/[id]`):**
   - Briefly attempt re-submitting the same invoice and show `NullifierAlreadyUsed()` blocked instantly.
   - Copy the generated `/verify/1` receipt URL, paste it into a clean **Incognito Chrome window with zero wallets installed**, and show the live verified CBAM certificate ready for EU customs ahead of COP 31.
