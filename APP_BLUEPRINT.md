# Vane: App Blueprint

## Product Summary

Vane is an industrial verification protocol that unites physical smart-meter anti-spoofing with client-side zero-knowledge EU CBAM (Carbon Border Adjustment Mechanism) compliance proofs on Ethereum Sepolia.

Industrial climate verification currently fails at two opposite points:
1. **The Hardware Oracle Gap:** Existing blockchain energy and carbon registries hash raw inverter telemetry blindly onto a ledger. A compromised inverter firmware update or a 15-line MQTT script can scale reported kilowatt-hours by `1.4x` or replay daytime solar logs at midnight, minting fraudulent clean-energy claims permanently on-chain.
2. **The Commercial Privacy Gap:** Industrial exporters shipping steel, aluminium, cement, fertilisers, electricity, and hydrogen into the European Union under Regulation `(EU) 2023/956` must prove actual embedded emissions from Tier-1 and Tier-2 energy invoices. Suppliers refuse to upload raw `UBL 2.1` or `Peppol` e-invoices to public blockchains or third-party portals because doing so exposes unit electricity tariffs, batch volumes, scrap ratios, and supplier tax identifiers to competitors.

Vane closes both gaps in one continuous pipeline:
- **Engine 1 (PINN Satellite Meter Guard):** Cross-checks facility inverter streams (`kW`, voltage/current curves, cell temperature) against live satellite solar irradiance (`GHI`, `DNI`), wind vectors, and ambient weather fetched in real time from Open-Meteo using a Physics-Informed Neural Network (PINN) residual model. Clean hourly batches anchor Merkle energy roots to `VaneMeterOracle.sol` on Ethereum Sepolia; spoofed intervals are automatically flagged and quarantined on-chain.
- **Engine 2 (Browser Noir UltraHonk Prover):** Ingests verified facility energy Merkle roots alongside standard `OASIS UBL 2.1 XML` industrial invoices directly inside a WebAssembly Web Worker in the exporter's browser (`@noir-lang/noir_js` + `@aztec/bb.js`). The circuit proves that *(a)* clean power came from an un-quarantined meter root, *(b)* embedded intensity (`tCO2e/tonne`) sits at or below the declared CBAM ceiling, and *(c)* a unique `Poseidon2` nullifier prevents the same invoice or clean MWh batch from ever being allocated to two buyers, while **zero commercial pricing or tax IDs leave local browser RAM**.

Built for the **IEEE ClimateChain Global Hackathon 2026** (Primary Track: **Sustainable Supply Chains**, bridging **Renewable Energy & Energy Trading** and **Carbon Markets & Emissions Transparency**) directly supporting **UN COP 31** in Antalya, Türkiye (9 to 20 November 2026).

---

## Market Validation (`SKILL.md` Step 2)

### Who Pays for Vane (3 Concrete Customer Segments)

1. **Non-EU Heavy Industrial Exporters Shipping to the European Union:**
   Steel mills, aluminium extruders, cement kilns, and fertiliser producers in industrial corridors such as Marmara/Gebze, Iskenderun, Izmir, India, and North Africa exporting to EU buyers under definitive EU CBAM rules (effective 1 January 2026). Without verified actual emissions, EU importers must apply punitive default markup values that add `EUR 42` to `EUR 115` per tonne in carbon border certificates.
2. **Captive Renewable Generators & Industrial Microgrid Operators:**
   On-site solar parks, wind farms, and corporate PPA operators selling hourly clean power to industrial off-takers who need tamper-evident proof of physical generation without deploying expensive proprietary hardware security modules (`USD 1,200+` per inverter).
3. **EU Authorised CBAM Declarants & Accredited Customs Verifiers:**
   European metals traders, automotive OEM procurement teams, and accredited verification bodies auditing hundreds of Tier-2 supplier declarations per quarter who currently drown in unverified spreadsheets and altered utility PDFs.

### What Alternatives Cost Today & Why Customers Switch

- **Accredited Manual CBAM Audits (TÜV, Bureau Veritas, SGS):** Cost `EUR 18,000` to `EUR 45,000` per facility per year, take 6 to 14 weeks per audit cycle, and still rely on human review of emailed utility PDFs.
- **Enterprise ESG Suites (SAP Sustainability Footprint Management, Watershed, Persefoni):** Cost `USD 48,000` to `USD 150,000+` annually, require 4 to 9 months of ERP integration, force Tier-2 suppliers to upload raw commercial invoices to centralised servers, and perform zero physical anti-spoofing verification on smart-meter claims.
- **Why customers switch to Vane:** Zero ERP migration (accepts existing `UBL 2.1` XML e-invoices and standard `MQTT/CSV` inverter logs), catches meter spoofing automatically via live satellite physics, keeps supplier pricing 100% private in browser memory, and cuts per-shipment verification cost under `USD 15`.

### TAM, SAM, and SOM Estimates

- **TAM (`USD 4.6B / year`):** Approximately `92,000` global industrial facilities and captive clean-energy plants exporting CBAM-covered goods (`iron/steel`, `aluminium`, `cement`, `fertilisers`, `electricity`, `hydrogen`, plus downstream precursors) or issuing granular clean-energy certificates at an average compliance software and verification spend of `USD 50,000/year`.
- **SAM (`USD 680M / year`):** `28,000` mid-market industrial exporters and captive solar/wind operators across Türkiye, EMEA, and South Asia using standard `UBL 2.1 / Peppol` e-invoicing (such as Türkiye's mandatory `e-Fatura` UBL 2.1 standard) at an accessible `USD 24,000/year` average contract value.
- **SOM Year 1 (`USD 840K ARR`):** Capturing `175` industrial facilities and `25` customs declarant workspaces via industrial chamber channels (such as Istanbul Chamber of Industry and Istanbul Chamber of Commerce) at an average blended spend of `USD 400/month` (`USD 4,800/year`).

---

## Competitive Landscape

| Competitor | URL & Pricing | Core Weakness (G2, Reddit & Industry Feedback) | Exact Gap Vane Fills |
|---|---|---|---|
| **SAP Sustainability Footprint Management** | `sap.com/products/scm/sustainability-footprint-management.html` (`USD 60,000 to USD 180,000/yr`) | Requires full S/4HANA lock-in; Tier-2 non-SAP suppliers refuse portal onboarding over BOM and tariff confidentiality | Zero ERP lock-in; ingests raw `UBL 2.1` XML directly in browser and hides all pricing via ZK proofs |
| **Watershed** | `watershed.com` (`USD 50,000 to USD 120,000+/yr`) | Centralised SaaS spreadsheet ingestion; relies on self-reported kWh figures with zero physical sensor validation | Live satellite solar/wind PINN physics check blocks spoofed meter data before attestation |
| **Persefoni** | `persefoni.com` (Pro from `USD 35,000/yr`; Enterprise `USD 100,000+/yr`) | Built for corporate SEC/CSRD financial disclosures rather than cryptographic per-shipment customs verification | Generates instant per-shipment cryptographic CBAM receipts verifiable by any customs officer on-chain |
| **Energy Web (EW Zero / Green Proofs)** | `energyweb.org` (Custom enterprise consortium licensing) | Consortium onboarding friction; does not run physics-informed anomaly detection against live satellite irradiance | Stateless plug-and-play proxy plus open Ethereum Sepolia settlement with automated device quarantine |
| **Toucan Protocol** | `toucan.earth` (`1.5% to 5%` protocol bridging fee) | Tokenises legacy off-chain registry PDFs after audit, inheriting stale verification and public metadata exposure | Audits continuous live energy physics upstream and keeps commercial invoice terms completely private |

---

## Monetisation Model & Web3 Treasury Design

### Hybrid B2B SaaS + Atomic On-Chain Settlement Fee (`CRYPTO_SKILL.md` Steps 4 & 6)

1. **Free Tier (`USD 0 / month`):**
   Up to `5` verified CBAM shipment proofs per month, `1` monitored smart meter on Sepolia testnet, public `/verify/[id]` customs receipt links, community support.
2. **Exporter Pro (`USD 299 / month` per facility + atomic `0.0005 ETH` protocol attestation fee):**
   Unlimited browser ZK CBAM proofs, up to `15` live PINN-monitored inverter streams, batch `UBL 2.1 XML` folder watch, webhook push to customs brokers, SLA support.
3. **Enterprise & Customs Verifier (`USD 1,490 / month`):**
   Unlimited facilities, dedicated self-hosted `MQTT` anti-spoofing proxy container, ERP webhook connector (`SAP / Oracle`), custom CBAM CN-code precursor templates, dedicated account engineer.

- **Payment & Fee Providers:**
  - **On-chain protocol fee (`CRYPTO_SKILL.md` Step 6):** Atomic native fee routed inside `VaneAttestationRegistry.submitAttestation` straight to `treasuryWallet` (set via constructor environment variable `TREASURY_WALLET_ADDRESS`, never hardcoded; `feeWei = 0` on Sepolia hackathon deployment so judges can test with minimal faucet ETH, configurable by admin post-testnet). If fee transfer fails, the entire transaction reverts atomically.
  - **Off-chain SaaS billing (post-hackathon commercial launch):** **Stripe Billing** for corporate EUR/USD SEPA and card invoices required by industrial CFOs, with **USDC on Ethereum/Base** supported for Web3-native energy trading desks.
- **14-Day Pro Trial:** Full access to multi-meter PINN monitoring with no credit card required; assumed free-to-paid conversion rate of `14%` driven by mandatory quarterly EU CBAM filing deadlines.
- **Revenue Projections (Blended `USD 420 / month` ARPU):**
  - `10` customers: `USD 4,200 / mo` (`USD 50,400 ARR`)
  - `50` customers: `USD 21,000 / mo` (`USD 252,000 ARR`)
  - `200` customers: `USD 84,000 / mo` (`USD 1,008,000 ARR`)
  - `1,000` customers: `USD 420,000 / mo` (`USD 5,040,000 ARR`)

---

## MVP Feature Set (End-to-End Functional, Zero Mock Data)

### Feature 1: Live Satellite Physics Anti-Spoofing Verifier (`Meter Guard`)
- **User story:** As a clean-energy or industrial facility operator, I want every smart-meter reading cross-checked against live satellite irradiance and thermal physics so that spoofed or faulty intervals are caught before they corrupt our compliance record.
- **How it works:** The backend route `/api/telemetry/verify` fetches live real-time `shortwave_radiation`, `direct_normal_irradiance`, `temperature_2m`, `cloud_cover`, and `wind_speed_10m` from the public Open-Meteo API for the facility's exact GPS coordinates, runs the thermodynamic PV/wind physical model plus learned PINN residual weights over the incoming telemetry interval, and computes a normalised residual score (`sigma`). Clean hourly batches produce a `keccak256` / `Poseidon2` Merkle energy root anchored on `VaneMeterOracle.sol`; high-residual intervals trigger `reportAndQuarantine`.
- **Acceptance criteria:** Live Open-Meteo irradiance loads for real coordinates (`Gebze`, `Antalya`, `Iskenderun`). Toggling `1.4x` multiplier injection or night-replay injection immediately spikes `sigma > 0.25` and sends a real `reportAndQuarantine` transaction visible on `sepolia.etherscan.io`.
- **Complexity:** Medium

### Feature 2: Browser-Native Zero-Knowledge `UBL 2.1` Invoice Prover
- **User story:** As an industrial exporter, I want to prove that my shipment's embedded carbon intensity stays below EU CBAM limits using standard XML e-invoices without transmitting my electricity unit price, batch cost, or supplier tax ID to any server or blockchain.
- **How it works:** A Web Worker in `web/src/workers/prover.worker.ts` parses standard `OASIS UBL 2.1` XML completely client-side, extracts private witness fields (`unitPriceCents`, `supplierTinField`, `directEmissionsKg`, `cleanKwhAllocated`, `gridKwhAllocated`, `shipmentMassKg`), runs `Noir` + `@aztec/bb.js` UltraHonk proving in browser RAM in `~2.5s`, and outputs `(bytes proof, bytes32[] publicInputs)`. This **privacy-preserving proof** is the single capability that converts paying industrial exporters who reject SaaS portals.
- **Acceptance criteria:** Inspecting browser DevTools Network tab during proof generation shows zero outbound HTTP requests carrying raw invoice XML or pricing fields. Altering `shipmentMassKg` or `directEmissionsKg` so true intensity exceeds `maxAllowedIntensityKgPerTonne` causes circuit constraint failure client-side before submission.
- **Complexity:** High

### Feature 3: On-Chain Honk Verification & Anti-Double-Counting Nullifier Registry
- **User story:** As an EU customs declarant, I want mathematical certainty that an exporter's proof verified on Ethereum, used non-quarantined energy, and never reused the same clean electricity invoice twice.
- **How it works:** `VaneAttestationRegistry.sol` checks that `facilityRoot` exists and is un-quarantined on `VaneMeterOracle.sol`, checks `!usedNullifiers[invoiceNullifier]`, invokes the generated Solidity `HonkVerifier.verify(proof, publicInputs)` contract directly on Sepolia, marks `usedNullifiers[invoiceNullifier] = true`, and emits `AttestationSealed`.
- **Acceptance criteria:** Submitting the exact same invoice proof a second time reverts on Sepolia with `NullifierAlreadyUsed()`. Attempting to attest against a quarantined meter batch reverts with `FacilityRootQuarantined()`.
- **Complexity:** High

### Feature 4: Public Customs Verification Receipt (`/verify/[id]`)
- **User story:** As a customs officer without a Web3 wallet, I want to open a single URL or scan a shipment receipt JSON and verify live Sepolia contract state in one glance.
- **How it works:** `/verify/[id]` is publicly reachable without wallet connection, reads `getAttestation(id)` directly from Sepolia via `viem`, displays verified CN commodity code (`7208` flat-rolled steel, `7601` unwrought aluminium, `2523` Portland cement), declared embedded intensity cap, timestamp, Etherscan link, and explicit confirmation of zero private commercial data stored.
- **Acceptance criteria:** Opening `/verify/1` in an incognito browser with no MetaMask extension renders live Sepolia contract data cleanly in under `1.2s`.
- **Complexity:** Low

### Explicitly Excluded from V1 MVP (and Why)
- **Hardware PKI / secure enclave firmware flashing:** V1 operates as a software drop-in verifier over standard `MQTT/CSV` streams so any existing inverter works on day one without hardware replacement.
- **Multi-tier precursor recursion (proof aggregation across 5+ nested suppliers):** V1 proves direct facility process emissions + Tier-1 electricity invoices; recursive proof folding across multi-hop supply trees is slated for Phase 3.
- **Mainnet fiat CBAM certificate purchasing:** V1 settles cryptographic verification receipts on Ethereum Sepolia per hackathon rules; EU National Competent Authority registry XML export is downloadable locally.

---

## Tech Stack Decisions

| Layer | Technology | Why This Over Alternatives |
|---|---|---|
| **Frontend & API** | Next.js 14 App Router, TypeScript, Tailwind CSS v4 | Unified SSR landing page, clean `/verify/[id]` deep links, and stateless `/api/telemetry/*` route handlers in one deployable repo (matches `Wraith` & `Scrye`) |
| **Motion** | `motion/react` | GPU-accelerated repeatable `whileInView` reveals, spring-damped `TiltBezelCard` (`useMotionValue`), and magnetic primary CTAs without React re-renders |
| **ZK Circuit & Prover** | Noir (`nargo 0.36+`) + `@noir-lang/noir_js` + `@aztec/bb.js` (UltraHonk) | Runs 100% client-side in browser WASM with zero trusted setup ceremony (unlike Groth16/SnarkJS) and generates a standalone Solidity `HonkVerifier.sol` contract |
| **Smart Contracts** | Solidity `0.8.27` + Hardhat + OpenZeppelin `5.x` | Deterministic compilation with `evmVersion: "cancun"` required by UltraHonk Solidity verifiers and straightforward Etherscan contract verification |
| **Wallet & Chain** | `wagmi v2` + `viem v2` on **Ethereum Sepolia** | SSR-compatible `cookieStorage` hydration (zero `localStorage` usage), type-safe ABI reads, universal faucet access for hackathon judges |
| **Physics & Weather Feed** | Custom TypeScript PINN forward-pass + **Open-Meteo API** (`api.open-meteo.com`) | Open-Meteo requires **zero API key**, has no paywall, updates every 15 minutes globally, and returns true physical `shortwave_radiation` (`W/m²`), `direct_normal_irradiance`, `temperature_2m`, and `wind_speed_10m` |
| **Optional Cache / Auth** | On-chain primary source of truth (`VaneAttestationRegistry.sol`); optional Supabase Postgres read-mirror post-tx | Zero private commercial data ever leaves browser RAM; reading directly from Sepolia guarantees zero state divergence in the hackathon demo while the included SQL migration provides instant indexed scale at 1,000+ users |
| **Hosting** | Vercel | Native Next.js App Router support, edge caching on weather reads, instant preview and production HTTPS |

### Monthly Infrastructure Cost Breakdown
- **0 users (Hackathon / Dev):** `USD 0 / month` (Vercel Hobby free, Open-Meteo free, public Sepolia RPC / Alchemy free tier, client CPU runs WASM ZK proving for free).
- **100 users:** `USD 20 / month` (Vercel Pro `USD 20`; client devices still perform 100% of ZK proof compute locally, saving `USD 400+/mo` in cloud GPU/prover servers!).
- **1,000 users:** `USD 74 / month` (Vercel Pro `USD 20` + Open-Meteo Commercial API `USD 29` + Supabase Pro `USD 25` read-index).
- **10,000 users:** `USD 310 / month` (Vercel Pro + Alchemy Growth RPC `USD 49` + Open-Meteo Enterprise feed + Supabase read-replicas).

---

## Core Technical Architecture & Production Code Specifications

### 1. Physics-Informed Neural Network (PINN) Residual Engine

For a solar-coupled or captive renewable meter at coordinates $(\phi, \lambda)$ with rated array capacity $P_{\text{rated}}$ (kW), panel temperature coefficient $\gamma = -0.0038\,^\circ\text{C}^{-1}$, and live Open-Meteo readings $(G_{\text{GHI}}, G_{\text{DNI}}, T_{\text{amb}}, V_{\text{wind}})$:

1. **Physical Cell Temperature Estimate (Ross / Faiman model):**
   $$T_{\text{cell}}(t) = T_{\text{amb}}(t) + \frac{G_{\text{GHI}}(t)}{U_0 + U_1 \cdot V_{\text{wind}}(t)}$$
   where $U_0 = 25.0\,\text{W m}^{-2}\text{K}^{-1}$ and $U_1 = 6.84\,\text{W s m}^{-3}\text{K}^{-1}$.
2. **Thermodynamic Expected Output Baseline:**
   $$P_{\text{phys}}(t) = P_{\text{rated}} \cdot \frac{G_{\text{GHI}}(t)}{1000} \cdot \left[1 + \gamma \left(T_{\text{cell}}(t) - 25\right)\right] \cdot \eta_{\text{inv}}$$
3. **Learned PINN Micro-Terrain & Inverter Non-Linearity Correction $f_\theta(x_t)$:**
   A lightweight 2-hidden-layer neural residual head (`6 -> 16 -> 16 -> 1`, `tanh` activations matching smooth physical derivatives, weights committed in `web/src/lib/physics/pinnWeights.json`) predicts local shading/clipping delta $\hat{\delta}(t)$ and normalised residual:
   $$\sigma(t) = \frac{\left| P_{\text{meter}}(t) - \left(P_{\text{phys}}(t) + \hat{\delta}(t)\right) \right|}{\max(0.05 \cdot P_{\text{rated}},\, 1.0)} + \lambda_{\text{temporal}} \cdot \mathbb{I}_{\text{flatline}}(P_{\text{meter}})$$
   - `sigma <= 0.12`: **CALIBRATED** (eligible for `VaneMeterOracle.submitHourlyRoot`)
   - `0.12 < sigma <= 0.25`: **DRIFT WARNING** (flagged for inspection)
   - `sigma > 0.25`: **SPOOF / FAULT QUARANTINE** (triggers `VaneMeterOracle.reportAndQuarantine`)

---

### 2. Noir Zero-Knowledge Circuit (`circuits/cbam_attestation/src/main.nr`)

```rust
use dep::std::hash::poseidon2::Poseidon2;

// Proves that an industrial shipment's embedded carbon intensity stays at or below
// the declared CBAM ceiling using energy from a verified, un-quarantined meter Merkle tree,
// while keeping unit pricing, supplier tax ID, and raw process inputs completely private.
fn main(
    // Private inputs (stay strictly inside browser WASM memory, never sent on-chain)
    unit_price_eur_cents: Field,
    supplier_tax_id_hash: Field,
    invoice_serial_secret: Field,
    clean_kwh_allocated: u64,
    grid_kwh_allocated: u64,
    direct_process_emissions_kg: u64,
    shipment_mass_tonnes: u64,
    grid_emission_factor_g_per_kwh: u64,
    merkle_leaf_salt: Field,
    merkle_path: [Field; 4],
    merkle_indices: [u1; 4],

    // Public inputs (verified on Ethereum Sepolia by VaneAttestationRegistry.sol)
    pub facility_merkle_root: Field,
    pub invoice_nullifier: Field,
    pub max_intensity_kg_per_tonne: u64,
    pub cn_commodity_code: u64
) {
    // 1. Sanity checks on non-zero commercial invoice and mass
    assert(shipment_mass_tonnes > 0);
    assert(unit_price_eur_cents != 0);
    assert(cn_commodity_code > 0);

    // 2. Verify Merkle membership of allocated clean kWh leaf in VaneMeterOracle root
    let leaf = Poseidon2::hash(
        [clean_kwh_allocated as Field, supplier_tax_id_hash, merkle_leaf_salt],
        3
    );
    let mut current = leaf;
    for i in 0..4 {
        let sibling = merkle_path[i];
        let (left, right) = if merkle_indices[i] == 0 {
            (current, sibling)
        } else {
            (sibling, current)
        };
        current = Poseidon2::hash([left, right], 2);
    }
    assert(current == facility_merkle_root);

    // 3. Verify unique Poseidon2 invoice nullifier (blocks double-counting across buyers)
    let computed_nullifier = Poseidon2::hash(
        [supplier_tax_id_hash, invoice_serial_secret, clean_kwh_allocated as Field],
        3
    );
    assert(computed_nullifier == invoice_nullifier);

    // 4. Thermodynamic CBAM embedded emissions check (clean kWh carries 0 Scope-2 emissions)
    let indirect_emissions_kg = (grid_kwh_allocated * grid_emission_factor_g_per_kwh) / 1000;
    let total_emissions_kg = direct_process_emissions_kg + indirect_emissions_kg;
    let max_allowed_total_kg = max_intensity_kg_per_tonne * shipment_mass_tonnes;
    assert(total_emissions_kg <= max_allowed_total_kg);
}
```

---

### 3. Smart Contracts on Ethereum Sepolia (`Solidity 0.8.27`)

#### `contracts/contracts/VaneMeterOracle.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title VaneMeterOracle
/// @notice Anchors physics-verified hourly smart-meter Merkle roots and quarantines
///         spoofed telemetry intervals detected by the PINN satellite verifier.
contract VaneMeterOracle {
    struct MeterBatch {
        bytes32 merkleRoot;
        bytes32 meterId;
        uint64 windowStart;
        uint64 windowEnd;
        uint32 residualSigmaBps; // 10000 = 1.0000 sigma; <= 1200 required for clean anchor
        bool quarantined;
        address reporter;
    }

    address public immutable oracleUpdater;
    uint256 public totalCleanRoots;
    uint256 public totalQuarantinedIntervals;

    mapping(bytes32 => MeterBatch) public batchesByRoot;
    mapping(bytes32 => uint256) public meterQuarantineCount;
    bytes32[] public recentRoots;

    event HourlyRootAnchored(
        bytes32 indexed merkleRoot,
        bytes32 indexed meterId,
        uint32 residualSigmaBps,
        uint64 windowEnd
    );
    event MeterIntervalQuarantined(
        bytes32 indexed meterId,
        bytes32 indexed suspectRoot,
        uint32 residualSigmaBps,
        address indexed reporter
    );

    error UnauthorisedOracle();
    error ResidualExceedsCleanCeiling(uint32 providedBps);
    error RootAlreadyAnchored();

    constructor(address _oracleUpdater) {
        oracleUpdater = _oracleUpdater;
    }

    /// @notice Anchors a verified hourly energy Merkle root whose PINN satellite residual is <= 0.12 sigma.
    /// @param merkleRoot Poseidon2 Merkle root of clean kWh allocations for the window
    /// @param meterId Facility smart-meter identifier hash
    /// @param windowStart Unix start timestamp of telemetry batch
    /// @param windowEnd Unix end timestamp of telemetry batch
    /// @param residualSigmaBps PINN residual in basis points (e.g. 310 = 0.031 sigma)
    function submitHourlyRoot(
        bytes32 merkleRoot,
        bytes32 meterId,
        uint64 windowStart,
        uint64 windowEnd,
        uint32 residualSigmaBps
    ) external {
        if (residualSigmaBps > 1200) revert ResidualExceedsCleanCeiling(residualSigmaBps);
        if (batchesByRoot[merkleRoot].windowEnd != 0) revert RootAlreadyAnchored();

        batchesByRoot[merkleRoot] = MeterBatch({
            merkleRoot: merkleRoot,
            meterId: meterId,
            windowStart: windowStart,
            windowEnd: windowEnd,
            residualSigmaBps: residualSigmaBps,
            quarantined: false,
            reporter: msg.sender
        });

        recentRoots.push(merkleRoot);
        totalCleanRoots += 1;

        emit HourlyRootAnchored(merkleRoot, meterId, residualSigmaBps, windowEnd);
    }

    /// @notice Quarantines a spoofed meter interval on-chain when physics residual exceeds threshold.
    /// @param meterId Facility smart-meter identifier hash
    /// @param suspectRoot Root or batch hash of the spoofed telemetry packet
    /// @param residualSigmaBps Observed PINN residual in basis points (e.g. 4820 = 0.482 sigma)
    function reportAndQuarantine(
        bytes32 meterId,
        bytes32 suspectRoot,
        uint32 residualSigmaBps
    ) external {
        batchesByRoot[suspectRoot] = MeterBatch({
            merkleRoot: suspectRoot,
            meterId: meterId,
            windowStart: uint64(block.timestamp - 3600),
            windowEnd: uint64(block.timestamp),
            residualSigmaBps: residualSigmaBps,
            quarantined: true,
            reporter: msg.sender
        });

        meterQuarantineCount[meterId] += 1;
        totalQuarantinedIntervals += 1;

        emit MeterIntervalQuarantined(meterId, suspectRoot, residualSigmaBps, msg.sender);
    }

    /// @notice Returns true if and only if the facility energy root exists and is not quarantined.
    function isRootClean(bytes32 merkleRoot) external view returns (bool) {
        MeterBatch memory batch = batchesByRoot[merkleRoot];
        return batch.windowEnd != 0 && !batch.quarantined;
    }

    /// @notice Returns total number of anchored clean roots for live telemetry displays.
    function getRecentRootsCount() external view returns (uint256) {
        return recentRoots.length;
    }
}
```

#### `contracts/contracts/VaneAttestationRegistry.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}

interface IVaneMeterOracle {
    function isRootClean(bytes32 merkleRoot) external view returns (bool);
}

/// @title VaneAttestationRegistry
/// @notice Verifies client-side UltraHonk CBAM proofs against clean VaneMeterOracle roots,
///         enforces single-use invoice nullifiers, and routes optional protocol fees atomically.
contract VaneAttestationRegistry {
    struct Attestation {
        uint256 id;
        address exporter;
        bytes32 facilityMerkleRoot;
        bytes32 invoiceNullifier;
        uint64 maxIntensityKgPerTonne;
        uint64 cnCommodityCode;
        uint64 timestamp;
    }

    IVerifier public immutable verifier;
    IVaneMeterOracle public immutable meterOracle;
    address public immutable treasuryWallet;
    uint256 public immutable protocolFeeWei;

    uint256 public totalVerifiedAttestations;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(uint256 => Attestation) public attestations;
    mapping(address => uint256[]) private exporterAttestationIds;

    event AttestationSealed(
        uint256 indexed attestationId,
        address indexed exporter,
        bytes32 indexed invoiceNullifier,
        bytes32 facilityMerkleRoot,
        uint64 maxIntensityKgPerTonne,
        uint64 cnCommodityCode
    );

    error InsufficientProtocolFee();
    error TreasuryTransferFailed();
    error FacilityRootQuarantinedOrUnknown();
    error NullifierAlreadyUsed();
    error InvalidZeroKnowledgeProof();

    constructor(
        address _verifier,
        address _meterOracle,
        address _treasuryWallet,
        uint256 _protocolFeeWei
    ) {
        verifier = IVerifier(_verifier);
        meterOracle = IVaneMeterOracle(_meterOracle);
        treasuryWallet = _treasuryWallet;
        protocolFeeWei = _protocolFeeWei;
    }

    /// @notice Verifies a browser-generated Noir UltraHonk proof and seals a public CBAM receipt.
    /// @param proof Raw UltraHonk proof bytes generated by @aztec/bb.js in the browser
    /// @param publicInputs [0]=facilityMerkleRoot, [1]=invoiceNullifier, [2]=maxIntensityKgPerTonne, [3]=cnCommodityCode
    function submitAttestation(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external payable returns (uint256 attestationId) {
        if (msg.value < protocolFeeWei) revert InsufficientProtocolFee();

        bytes32 facilityRoot = publicInputs[0];
        bytes32 nullifier = publicInputs[1];
        uint64 maxIntensity = uint64(uint256(publicInputs[2]));
        uint64 cnCode = uint64(uint256(publicInputs[3]));

        if (!meterOracle.isRootClean(facilityRoot)) revert FacilityRootQuarantinedOrUnknown();
        if (usedNullifiers[nullifier]) revert NullifierAlreadyUsed();
        if (!verifier.verify(proof, publicInputs)) revert InvalidZeroKnowledgeProof();

        usedNullifiers[nullifier] = true;
        attestationId = ++totalVerifiedAttestations;

        attestations[attestationId] = Attestation({
            id: attestationId,
            exporter: msg.sender,
            facilityMerkleRoot: facilityRoot,
            invoiceNullifier: nullifier,
            maxIntensityKgPerTonne: maxIntensity,
            cnCommodityCode: cnCode,
            timestamp: uint64(block.timestamp)
        });
        exporterAttestationIds[msg.sender].push(attestationId);

        if (msg.value > 0) {
            (bool ok, ) = treasuryWallet.call{value: msg.value}("");
            if (!ok) revert TreasuryTransferFailed();
        }

        emit AttestationSealed(
            attestationId,
            msg.sender,
            nullifier,
            facilityRoot,
            maxIntensity,
            cnCode
        );
    }

    /// @notice Returns all attestation structs sealed by the queried wallet address.
    function getAttestationsByExporter(address exporter) external view returns (Attestation[] memory list) {
        uint256[] storage ids = exporterAttestationIds[exporter];
        list = new Attestation[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = attestations[ids[i]];
        }
    }
}
```

---

## Database Schema & SQL Migration (`SKILL.md` Step 2 & `CRYPTO_SKILL.md` Step 7)

**Strict On-Chain First & Zero-Leak Policy:**
1. Private `UBL 2.1` commercial fields (`unitPrice`, `totalAmount`, `supplierTaxId`, `customerEori`) **NEVER touch any database or backend API**.
2. During the hackathon MVP, all attestations and meter quarantines read straight from Ethereum Sepolia via `viem` so zero off-chain state drift is possible.
3. For multi-facility SaaS scale, `migrations/001_telemetry_cache.sql` mirrors **confirmed on-chain events only** (`tx_hash` required `NOT NULL`) plus public satellite weather snapshots with Row-Level Security (RLS):

```sql
-- migrations/001_telemetry_cache.sql
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_wallet TEXT NOT NULL,
    meter_id_hex TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    latitude NUMERIC(8, 5) NOT NULL,
    longitude NUMERIC(8, 5) NOT NULL,
    rated_capacity_kw NUMERIC(10, 2) NOT NULL CHECK (rated_capacity_kw > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    observed_at TIMESTAMPTZ NOT NULL,
    satellite_ghi_wm2 NUMERIC(8, 2) NOT NULL,
    ambient_temp_c NUMERIC(5, 2) NOT NULL,
    wind_speed_ms NUMERIC(5, 2) NOT NULL,
    reported_kw NUMERIC(10, 2) NOT NULL,
    expected_kw NUMERIC(10, 2) NOT NULL,
    residual_sigma NUMERIC(6, 4) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('calibrated', 'warning', 'quarantined')),
    sepolia_tx_hash TEXT
);

CREATE TABLE IF NOT EXISTS confirmed_attestations (
    attestation_id BIGINT PRIMARY KEY,
    exporter_wallet TEXT NOT NULL,
    facility_merkle_root TEXT NOT NULL,
    invoice_nullifier TEXT NOT NULL UNIQUE,
    max_intensity_kg_per_tonne BIGINT NOT NULL,
    cn_commodity_code BIGINT NOT NULL,
    sepolia_tx_hash TEXT NOT NULL UNIQUE,
    sealed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_telemetry_facility_time ON telemetry_snapshots (facility_id, observed_at DESC);
CREATE INDEX idx_attestations_exporter ON confirmed_attestations (LOWER(exporter_wallet));

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY facilities_select_public ON facilities FOR SELECT USING (true);
CREATE POLICY facilities_write_owner ON facilities
    FOR ALL USING (LOWER(owner_wallet) = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet'));
```

---

## API Architecture (Next.js 14 Route Handlers)

| Method & Path | Auth | Rate Limit | Request Body / Params | Response Schema |
|---|---|---|---|---|
| `GET /api/telemetry/live?lat=40.80&lon=29.43&kw=1200` | Public | `60 req/min/IP` | Query params: `lat`, `lon`, `kw` (rated solar/wind capacity), optional `mode=clean\|spoof_scale\|spoof_replay` | `{ coordinates, solarAzimuthDeg, satelliteGhiWm2, ambientTempC, windSpeedMs, expectedKw, reportedKw, residualSigma, residualBps, status, series24h }` |
| `POST /api/telemetry/verify` | Public / API Key | `30 req/min/IP` | `{ meterId: Hex, lat: number, lon: number, ratedKw: number, intervals: Array<{ ts: string, kw: number }> }` | `{ status: 'calibrated' \| 'quarantined', maxSigma: number, residualBps: number, merkleRoot: Hex, cleanLeaves: Array<{ kwh, path, indices }> }` |
| `GET /api/receipt/[id]` | Public | `120 req/min/IP` | Path param `id` (`uint256` attestation ID on Sepolia) | W3C Verifiable Credential JSON reading `VaneAttestationRegistry.attestations(id)` live via `viem` |
| `GET /api/health` | Public | `120 req/min/IP` | None | `{ ok: true, chainId: 11155111, openMeteoReachable: boolean, oracleAddress: Hex, registryAddress: Hex }` |

*(Note: `UBL 2.1 XML` parsing and Noir proof compilation deliberately have **zero server endpoint**; both execute strictly inside client-side TypeScript and WebAssembly so private commercial data never crosses the network.)*

---

## Complete Repository Tree (`SKILL.md` Step 3)

```text
vane/
├── circuits/
│   └── cbam_attestation/
│       ├── Nargo.toml
│       ├── Prover.toml
│       └── src/
│           └── main.nr                  (Poseidon2 Merkle + nullifier + CBAM intensity circuit)
├── contracts/
│   ├── contracts/
│   │   ├── HonkVerifier.sol             (generated directly by bb write_solidity_verifier)
│   │   ├── VaneMeterOracle.sol          (hourly clean Merkle roots + meter quarantine)
│   │   └── VaneAttestationRegistry.sol  (on-chain ZK verification + nullifier guard)
│   ├── scripts/
│   │   ├── deploy.ts
│   │   └── seedCleanRoot.ts             (anchors an initial real Open-Meteo clean root on Sepolia)
│   ├── test/
│   │   └── vane.test.ts
│   ├── hardhat.config.ts
│   └── package.json
├── migrations/
│   └── 001_telemetry_cache.sql
├── web/
│   ├── public/
│   │   ├── circuits/
│   │   │   └── cbam_attestation.json    (compiled Noir ACIR artifact loaded by Web Worker)
│   │   ├── samples/
│   │   │   ├── gebze_hot_rolled_coil.xml
│   │   │   ├── iskenderun_aluminium_billet.xml
│   │   │   └── nrel_pv_trace.csv
│   │   ├── logo.svg                     (comment slot only until supplied)
│   │   └── favicon.ico                  (comment slot only until supplied)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 (8-section operational landing page)
│   │   │   ├── verify/
│   │   │   │   └── [id]/page.tsx        (wallet-free public customs receipt page)
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx           (ProtectedRoute + WalletDropdown + AppErrorBoundary)
│   │   │   │   ├── page.tsx             (Overview console)
│   │   │   │   ├── meters/page.tsx      (Live Open-Meteo PINN guard + Sepolia quarantine action)
│   │   │   │   └── attest/new/page.tsx  (3-step UBL XML -> Noir WASM -> Sepolia prover)
│   │   │   └── api/
│   │   │       ├── health/route.ts
│   │   │       ├── receipt/[id]/route.ts
│   │   │       └── telemetry/
│   │   │           ├── live/route.ts
│   │   │           └── verify/route.ts
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   └── VaneField.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Nav.tsx              (B1 scroll-progress bar)
│   │   │   │   └── ConsoleShell.tsx
│   │   │   ├── motion/
│   │   │   │   ├── TiltBezelCard.tsx
│   │   │   │   ├── MagneticButton.tsx
│   │   │   │   └── TextScramble.tsx
│   │   │   ├── sections/
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── OracleGapStatement.tsx
│   │   │   │   ├── DualEngineInspector.tsx
│   │   │   │   ├── VerificationPipeline.tsx
│   │   │   │   ├── LiveTelemetryMetrics.tsx
│   │   │   │   ├── ComparisonMatrix.tsx
│   │   │   │   ├── StandardsSchematic.tsx
│   │   │   │   └── FinalDispatchFooter.tsx
│   │   │   ├── system/
│   │   │   │   └── AppErrorBoundary.tsx
│   │   │   └── wallet/
│   │   │       ├── WalletConnectModal.tsx
│   │   │       ├── WalletDropdown.tsx
│   │   │       └── DisconnectToast.tsx
│   │   ├── hooks/
│   │   │   ├── useLiveTelemetry.ts
│   │   │   └── useNoirProver.ts
│   │   ├── lib/
│   │   │   ├── contracts.ts
│   │   │   ├── physics/
│   │   │   │   ├── pinnModel.ts
│   │   │   │   └── pinnWeights.json
│   │   │   ├── ubl/
│   │   │   │   └── parseUblInvoice.ts
│   │   │   └── wagmi.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── workers/
│   │       └── prover.worker.ts
│   ├── vercel.json
│   └── package.json
├── FRONTEND_SPEC.md
├── APP_BLUEPRINT.md
├── CLAUDE.md
├── BUILD_GUIDE.md
├── MARKETING.md
└── README.md
```

---

## Environment Variables Template (`.env.example`)

```bash
# Public Blockchain Configuration (Ethereum Sepolia)
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Deployed Sepolia Contract Addresses (populated after Phase 1 deploy)
NEXT_PUBLIC_HONK_VERIFIER_ADDRESS=
NEXT_PUBLIC_VANE_METER_ORACLE_ADDRESS=
NEXT_PUBLIC_VANE_ATTESTATION_REGISTRY_ADDRESS=

# Public Application Base URL (for shareable /verify/[id] customs links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Contract Deployment Only (never read or exposed inside web/)
DEPLOYER_PRIVATE_KEY=
ETHERSCAN_API_KEY=
TREASURY_WALLET_ADDRESS=
```

---

## Launch Checklist, Distribution & Phased Roadmap

### Pre-Submission & Launch Checklist
- **Analytics:** PostHog (EU cloud host so industrial client IPs never cross non-GDPR analytics servers, tracking funnel drop-off from `Hero Spoof Toggle` -> `Wallet Connect` -> `Proof Sealed`).
- **Error Monitoring:** Sentry browser + Next.js boundary capture with payload scrubbing enabled so `UBL` XML strings are stripped from breadcrumbs.
- **SEO & OpenGraph:** Custom `metadataBase`, `sitemap.xml`, `robots.txt`, and dynamic `opengraph-image.tsx` rendering verifiable CBAM receipt previews when `/verify/[id]` URLs are shared in email or Slack.
- **Transactional Emails (Commercial SaaS tier):** Resend delivering signed CBAM Receipt JSON attachments and quarterly filing reminders.
- **Legal & Compliance:** Terms of Service, Privacy Notice explicitly documenting zero server storage of commercial invoices, and smart-contract audit notice prior to Ethereum/Base mainnet transition.

### Distribution Strategy (First 100 Industrial & Judge Users)
1. **Built-in B2B Viral Loop (`Viral Coefficient Target = 0.65`):** Every exporter sends `/verify/[id]` directly to 3 to 5 EU importers and customs brokers per shipment; every receipt page shows live zero-leak proof verification with a direct `"Issue zero-leak CBAM receipts for your suppliers"` onboarding link.
2. **COP 31 & Chamber Direct Outreach:** Direct outreach to export compliance working groups inside the **Istanbul Chamber of Industry (İSO)** and **Istanbul Chamber of Commerce (İTO)** during the COP 31 window (9 to 20 November 2026), offering a free `UBL 2.1 e-Fatura` CBAM readiness check.
3. **Developer & Climate-Tech Proof Posts:** Short Windows screen-recording clips on X, LinkedIn, and Devpost showing a live `UBL 2.1` XML invoice edited in VS Code, proved in Chrome in `2.4s` with zero network upload, and verified live on `sepolia.etherscan.io`.

### 4-Week Commercial Build Sequence (Full Sprint Roadmap)
- **Week 1 (Core Physics + Circuit Foundation):** Ship `main.nr` Poseidon2 CBAM circuit, compile `HonkVerifier.sol`, deploy and verify `VaneMeterOracle.sol` + `VaneAttestationRegistry.sol` on Ethereum Sepolia, and deploy `/api/telemetry/live` against live Open-Meteo irradiance.
- **Week 2 (Prover Worker + Console MVP):** Ship `prover.worker.ts` browser WASM prover, `parseUblInvoice.ts` parser with real steel/aluminium/cement XML templates, `/app/meters`, `/app/attest/new`, and public `/verify/[id]`.
- **Week 3 (Operational Landing Page & Hardening):** Ship complete 8-section `FRONTEND_SPEC.md` landing page (`VaneField`, `B1` scroll-progress nav, interactive hero spoof toggle), `AppErrorBoundary`, full refresh/deep-link acceptance checks, and Etherscan source verification.
- **Week 4 (Pilot Polish & COP 31 Showcase):** Add batch folder `UBL` XML proving, downloadable EU NCA summary report export, Sentry/PostHog telemetry, and final 3-minute Windows screen-recorded demo submission.
