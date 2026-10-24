# Vane: Sequenced Build Guide

## Before Writing Code

Read `FRONTEND_SPEC.md`, `APP_BLUEPRINT.md`, and `CLAUDE.md` completely first:
- `APP_BLUEPRINT.md` owns every smart contract interface, Noir circuit constraint, PINN physics formula, API route schema, and environment variable.
- `FRONTEND_SPEC.md` owns every Tailwind class string, Framer Motion curve, z-index token, `VaneField` vector algorithm, `B1` navigation bar rule, and Step 13/14 wallet gate contract.
- `CLAUDE.md` enforces persistent code style, British English, and strict anti-slop rules across every file.

---

## Prerequisites (Windows + WSL2 / Native PowerShell)

```bash
node --version      # v20 LTS or newer recommended for @aztec/bb.js WASM threads
npm --version       # v10 or newer
git --version
```

- For compiling the Noir circuit (`Phase 1.1` only): install `noirup` + `bbup` inside WSL2 Ubuntu on Windows (`curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash && noirup -v 0.36.0`). Once `cbam_attestation.json` and `HonkVerifier.sol` are generated, **100% of `Hardhat`, `Next.js`, and browser proving run natively in standard Windows PowerShell + Chrome** with zero WSL needed during recording!
- Fund a dedicated deployer wallet on **Ethereum Sepolia** via a public faucet and create a free WalletConnect Project ID at `cloud.walletconnect.com`.

---

## Phase 1: Noir Circuit & Ethereum Sepolia Smart Contracts

### Step 1.1: Compile the Noir Circuit & Export `HonkVerifier.sol`

1. Initialise `circuits/cbam_attestation/Nargo.toml` and write `src/main.nr` verbatim from `APP_BLUEPRINT.md` ("2. Noir Zero-Knowledge Circuit").
2. Compile the circuit, verify witness execution against a valid `Prover.toml` test case, generate the UltraHonk verification key, and emit the Solidity verifier:

```bash
cd circuits/cbam_attestation
nargo check
nargo execute witness
bb prove_ultra_keccak_honk -b ./target/cbam_attestation.json -w ./target/witness.gz -o ./target/proof
bb write_vk_ultra_keccak_honk -b ./target/cbam_attestation.json -o ./target/vk
bb write_solidity_verifier_ultra_keccak_honk -k ./target/vk -o ../../contracts/contracts/HonkVerifier.sol
cp ./target/cbam_attestation.json ../../web/public/circuits/cbam_attestation.json
```

### Step 1.2: Hardhat Setup & Contract Compilation

```bash
cd ../../contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox typescript ts-node @types/node dotenv
```

Configure `contracts/hardhat.config.ts` with Solidity `0.8.27`, optimizer enabled (`runs: 200`), and `evmVersion: "cancun"` so `HonkVerifier.sol` compiles cleanly under EIP-1153 transient storage opcodes.

### Step 1.3: Implement & Test `VaneMeterOracle.sol` and `VaneAttestationRegistry.sol`

1. Write `contracts/contracts/VaneMeterOracle.sol` and `contracts/contracts/VaneAttestationRegistry.sol` verbatim from `APP_BLUEPRINT.md`.
2. Write `contracts/test/vane.test.ts` covering all five mandatory contract invariants:
   - `submitHourlyRoot` succeeds when `residualSigmaBps <= 1200` and reverts with `ResidualExceedsCleanCeiling` above `1200`.
   - `reportAndQuarantine` increments `totalQuarantinedIntervals` and causes `isRootClean(root)` to return `false`.
   - `submitAttestation` verifies a real proof generated from `witness.gz` and increments `totalVerifiedAttestations`.
   - Re-submitting the identical proof reverts with `NullifierAlreadyUsed`.
   - Submitting a valid proof against a quarantined meter root reverts with `FacilityRootQuarantinedOrUnknown`.

```bash
npx hardhat test
```

### Step 1.4: Deploy & Verify on Ethereum Sepolia

1. Create `contracts/scripts/deploy.ts` reading `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, and `TREASURY_WALLET_ADDRESS` strictly from `.env` (`protocolFeeWei = 0n` on Sepolia so judges can submit proofs directly without extra fee friction).
2. Run `deploy.ts`, verify all three contracts on `sepolia.etherscan.io`, and run `scripts/seedCleanRoot.ts` once using real live Gebze Open-Meteo solar irradiance data so the landing page has genuine on-chain state immediately upon launch:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat verify --network sepolia <HONK_VERIFIER_ADDRESS>
npx hardhat verify --network sepolia <VANE_METER_ORACLE_ADDRESS> <DEPLOYER_ADDRESS>
npx hardhat verify --network sepolia <VANE_ATTESTATION_REGISTRY_ADDRESS> <HONK_VERIFIER_ADDRESS> <VANE_METER_ORACLE_ADDRESS> <TREASURY_WALLET_ADDRESS> 0
npx hardhat run scripts/seedCleanRoot.ts --network sepolia
```

---

## Phase 2: Physics Engine, Open-Meteo API & Browser WASM Prover

### Step 2.1: Initialise `web/` Package

```bash
cd ../web
npx create-next-app@14 . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install motion wagmi viem @tanstack/react-query @noir-lang/noir_js @aztec/bb.js fast-xml-parser
```

Configure `next.config.mjs` with `experiments: { asyncWebAssembly: true }` and COOP/COEP headers on `/app/attest/new` so `bb.js` WebAssembly multi-threading runs at maximum speed inside Chrome on Windows.

### Step 2.2: Implement PINN Physics Model & Live Telemetry API Routes

1. Create `src/lib/physics/pinnWeights.json` and `src/lib/physics/pinnModel.ts` implementing the exact Ross/Faiman cell temperature equation plus the 2-layer `tanh` residual network from `APP_BLUEPRINT.md`.
2. Create `src/app/api/telemetry/live/route.ts` fetching real live telemetry from:
   `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,cloud_cover,wind_speed_10m,shortwave_radiation,direct_normal_irradiance&hourly=shortwave_radiation,temperature_2m&forecast_days=1`
3. Create `src/app/api/telemetry/verify/route.ts` scoring incoming meter arrays, computing `Poseidon2` clean kWh Merkle trees matching `main.nr`, and returning `merkleRoot`, `residualBps`, and witness Merkle paths.

### Step 2.3: Implement `UBL 2.1` XML Parser & Web Worker Noir Prover

1. Add real sample `UBL 2.1` industrial invoices in `public/samples/gebze_hot_rolled_coil.xml` and `public/samples/iskenderun_aluminium_billet.xml`, plus real PV inverter telemetry in `public/samples/nrel_pv_trace.csv`.
2. Build `src/lib/ubl/parseUblInvoice.ts` extracting `cbc:LineExtensionAmount`, `cac:AccountingSupplierParty`, `cbc:InvoicedQuantity`, commodity CN code, clean kWh allocation, and direct process emissions completely client-side.
3. Build `src/workers/prover.worker.ts` executing `Noir` witness generation + `UltraKeccakHonkBackend` proof generation inside a dedicated Web Worker off the UI thread.

---

## Phase 3: Frontend Design System, Landing Page & Wallet Console

### Step 3.1: Design Tokens, Fonts & `VaneField`

1. Add the `Barlow Semi Condensed` + `DM Sans` + `Fira Code` Google Fonts import in `src/app/layout.tsx` and write `src/styles/globals.css` verbatim from `FRONTEND_SPEC.md` Sections 1.1 to 1.3 (verifying zero unlayered `*` resets).
2. Implement `src/components/canvas/VaneField.tsx`, `TiltBezelCard.tsx`, `MagneticButton.tsx`, and `TextScramble.tsx` following `FRONTEND_SPEC.md` Section 1.5.

### Step 3.2: Navigation, Wallet Gate & Error Containment

1. Configure `src/lib/wagmi.ts` with Ethereum Sepolia, `cookieStorage` (zero `localStorage` or `sessionStorage`), and WalletConnect.
2. Implement `AppErrorBoundary.tsx`, `WalletConnectModal.tsx`, `WalletDropdown.tsx` (portalled to `document.body` with Escape + outside-click close), and `DisconnectToast.tsx` verbatim per `FRONTEND_SPEC.md` Section 2.1.
3. Implement `Nav.tsx` (`B1` scroll-progress hairline bar with active section readout and contextual link reveal) per `FRONTEND_SPEC.md` Section 2.

### Step 3.3: Assemble the 8 Landing Page Sections & Console Routes

1. Build all 8 section components in `src/components/sections/` matching every Tailwind class, responsive breakpoint, inline `<svg>` icon, `viewport={{ once: false, amount: 0.1 }}` animation, and final British English string in `FRONTEND_SPEC.md` Section 3.
2. Build `/app`, `/app/meters`, `/app/attest/new`, and wallet-free `/verify/[id]` per `FRONTEND_SPEC.md` Section 4.

### Step 3.4: Production Build & Vercel Deployment

```bash
npm run build
vercel --prod
```

---

## Phase 4: Pre-Demo Quality & Screen-Recording Audit

Verify every single item before opening OBS Studio / Windows Screen Recorder:

1. **Contract & Zero-Mock Check:**
   - All three contracts (`HonkVerifier`, `VaneMeterOracle`, `VaneAttestationRegistry`) show green source-verified checkmarks on `sepolia.etherscan.io`.
   - Every metric on `/` and `/app` comes from live Sepolia RPC calls and live Open-Meteo satellite irradiance data.
   - DevTools Network tab confirms **zero** outbound requests carry private `UBL 2.1` pricing or supplier tax IDs during proof generation.
2. **Design & Motion Audit:**
   - Scroll down to the footer, scroll all the way back to the hero, and scroll down a second time: every section's blur-in animation replays smoothly in both directions (`once: false`).
   - Logo and favicon remain untouched comment slots if custom files have not been added.
   - Zero em dashes, zero emojis, zero `localStorage`/`sessionStorage`, and zero console errors.
3. **Step 13 Wallet Acceptance Checks:**
   - Run all 6 refresh, deep-link, chain-switch rejection, and disconnect persistence tests from `FRONTEND_SPEC.md` Section 2.1 on the live Vercel HTTPS URL.
