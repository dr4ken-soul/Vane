# Vane

Physics-verified smart-meter roots and zero-knowledge EU CBAM compliance proofs on Ethereum Sepolia.

Vane addresses two trust failures that appear together in industrial decarbonisation. Energy registries cannot tell whether a meter reading is real, and carbon registries cannot verify a shipment without collecting commercially sensitive invoices. Vane cross-checks facility telemetry against live satellite solar physics, anchors clean hourly energy roots on-chain, and proves CBAM embedded emissions in the browser with Noir and UltraHonk. Private tariffs, supplier tax identifiers and raw process inputs never leave client memory.

## What is in the repository

```text
circuits/cbam_attestation/   Noir circuit, Prover.toml and compiled artifacts
contracts/                   Hardhat project, Solidity contracts, tests and deploy scripts
migrations/                  Optional Postgres read mirror for confirmed on-chain events
scripts/                      Circuit build, proof generation and fixture installation
web/                          Next.js 14 application, API routes and browser prover
```

The three specification documents that govern the build are `APP_BLUEPRINT.md`, `FRONTEND_SPEC.md` and `CLAUDE.md`. `BUILD_GUIDE.md` records the original build order.

## Architecture

### Engine 1: satellite physics and meter quarantine

`/api/telemetry/live` reads live Open-Meteo irradiance, ambient temperature and wind for the requested coordinates. The PINN model applies the Ross/Faiman cell temperature correction and a two layer residual network to produce an expected power output. Reported meter output is compared with the physics baseline and expressed as a residual in basis points.

A clean hourly batch is anchored through `VaneMeterOracle.submitHourlyRoot` only when the residual is at or below `1200` basis points. A spoofed interval is written through `reportAndQuarantine`, which marks the suspect root as quarantined and increments `totalQuarantinedIntervals`. The registry refuses proofs against a quarantined or unknown facility root.

### Engine 2: private CBAM attestation

The circuit at `circuits/cbam_attestation/src/main.nr` proves four public facts:

1. `facility_merkle_root` contains the invoice clean kWh allocation under a four level Poseidon2 Merkle path.
2. `invoice_nullifier` is derived from the private supplier tax identifier hash, invoice serial secret and allocated clean kWh. The registry stores it once, so the same invoice cannot be counted twice.
3. `max_intensity_kg_per_tonne` covers direct process emissions plus grid electricity emissions for the declared shipment mass.
4. `cn_commodity_code` is bound to the proven shipment.

Unit price, supplier tax identifier, invoice serial and raw energy inputs are private witness values. Witness generation and proof generation run inside `web/src/workers/prover.worker.ts` with `@noir-lang/noir_js` and `@aztec/bb.js`. No server route receives the invoice XML.

### Contracts

| Contract | Responsibility |
|---|---|
| `HonkVerifier.sol` | Generated ZK UltraHonk verifier from bb 6.0.0, linked against `RelationsLib` and `ZKTranscriptLib` |
| `VaneMeterOracle.sol` | Anchors clean hourly Poseidon2 roots, quarantines spoofed intervals and exposes recent root state |
| `VaneAttestationRegistry.sol` | Verifies UltraHonk proofs, guards invoice nullifiers, checks facility root cleanliness and seals receipts |

No contract address is hardcoded in Solidity. The deploy script injects the verifier, oracle, treasury and protocol fee through constructor arguments.

### Application routes

| Route | Purpose |
|---|---|
| `/` | Eight section operational landing page with live telemetry and Sepolia state |
| `/app` | Wallet gated overview console |
| `/app/meters` | Live Open-Meteo guard, root anchoring and on-chain quarantine |
| `/app/attest/new` | UBL XML review, browser ZK proving and Sepolia attestation |
| `/verify` | Wallet free receipt index and search |
| `/verify/[id]` | Wallet free server rendered customs receipt |
| `/docs` | Public API, contract and proof documentation |
| `/api/telemetry/live` | Live physics baseline and 24 hour series |
| `/api/telemetry/verify` | Telemetry scoring and clean allocation root |
| `/api/receipt/[id]` | W3C style verifiable credential for a sealed attestation |
| `/api/health` | Chain, oracle and Open-Meteo reachability |

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Chrome for browser proving with WebAssembly threads
- WSL2 Ubuntu only when rebuilding the circuit
- Noir `1.0.0-rc.6` and Barretenberg `6.0.0` for circuit work

The compiled circuit and verifier in this repository were produced with Noir `1.0.0-rc.6` and bb `6.0.0`. Client proving uses `@aztec/bb.js@6.0.0-nightly.20260831`, which exposes the matching 6.0 API.

## Install

```bash
npm install --prefix contracts
npm install --prefix web
```

Copy the environment templates and fill in the values that apply to your deployment:

```bash
cp contracts/.env.example contracts/.env
cp web/.env.example web/.env.local
```

Required contract variables for a Sepolia deployment:

- `SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `ETHERSCAN_API_KEY`
- `TREASURY_WALLET_ADDRESS`
- `PROTOCOL_FEE_WEI`, set to `0` for the hackathon deployment

Required web variables after deployment:

- `NEXT_PUBLIC_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_HONK_VERIFIER_ADDRESS`
- `NEXT_PUBLIC_VANE_METER_ORACLE_ADDRESS`
- `NEXT_PUBLIC_VANE_ATTESTATION_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_APP_URL`

## Test and build

```bash
npm test --prefix contracts
npm run typecheck --prefix contracts
npm run typecheck --prefix web
npm run build --prefix web
```

The Hardhat suite runs seven checks against the real proof fixture, including clean root anchoring, residual rejection, quarantine behaviour, nullifier replay rejection and tampered proof rejection. The fixture at `contracts/test/fixtures/proofFixture.json` is a genuine 7616 byte ZK UltraHonk proof with four public inputs.

Run the web application locally:

```bash
npm run dev --prefix web
```

## Deploy to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

The script deploys `RelationsLib`, `ZKTranscriptLib`, `HonkVerifier`, `VaneMeterOracle` and `VaneAttestationRegistry`, prints the three public addresses and prints the exact Etherscan verification command for the linked verifier. Copy the printed addresses into `web/.env.local`.

Verify the contracts:

```bash
npx hardhat verify --network sepolia --libraries scripts/honkVerifierLibraries.cjs <HONK_VERIFIER_ADDRESS>

npx hardhat verify --network sepolia <VANE_METER_ORACLE_ADDRESS> <DEPLOYER_ADDRESS>

npx hardhat verify --network sepolia <VANE_ATTESTATION_REGISTRY_ADDRESS> \
  <HONK_VERIFIER_ADDRESS> <VANE_METER_ORACLE_ADDRESS> <TREASURY_WALLET_ADDRESS> 0
```

Seed one real clean root from live Gebze satellite data:

```bash
VANE_METER_ORACLE_ADDRESS=<ORACLE_ADDRESS> npx hardhat run scripts/seedCleanRoot.ts --network sepolia
```

The seed script fetches the past 24 hours of Open-Meteo shortwave radiation and ambient temperature, models clean solar output, builds the same Poseidon2 allocation tree used by attestations and anchors the root. Optional `SEED_*` variables override the facility coordinates, rated capacity, meter name and supplier tax identifier. The address can also live in `contracts/.env`.

For Hardhat 2.28 the linked verifier is verified with a module that exports the library dictionary:

```bash
npx hardhat verify --network sepolia --libraries scripts/honkVerifierLibraries.cjs <HONK_VERIFIER_ADDRESS>
```

## Live deployment

The reference deployment is anchored on Ethereum Sepolia and verified on Etherscan:

| Contract | Address |
|---|---|
| `HonkVerifier` | `0x61b563A4225819D6B2533c8663A6A29BFbABD429` |
| `VaneMeterOracle` | `0xaa6a02b87cd1B97F5dBE553487d852ec4059b760` |
| `VaneAttestationRegistry` | `0xDC0aD3Dd032a8B588dAdF44a7a3f83A03326Cd36` |

Linked libraries: `RelationsLib` at `0x161a680e44d108249B6130Cb7e7E9D66c533a087` and `ZKTranscriptLib` at `0x23a64f5555F7e155BAd6F2342370B4C1D5a6D84d`.

The production web application runs at `https://vane-orcin.vercel.app`. The seeded clean root was anchored from live Gebze Open-Meteo data in transaction `0x061431f5405498f7d8f5a33d8f74aeae7729e66982a2c8e98a65949ff5279f8e`.

## Rebuild the circuit

Inside WSL2, from the repository root:

```bash
bash scripts/install_noir1.sh
bash scripts/install_bb.sh
bash scripts/compile_circuit.sh
bash scripts/bb_prove.sh
bash scripts/bb_verifier.sh
pwsh scripts/install_proof_artifacts.ps1
```

`bb_prove.sh` writes the proof, verification key and public inputs to `circuits/cbam_attestation/bbout`. `bb_verifier.sh` installs the generated ZK verifier as `contracts/contracts/HonkVerifier.sol`. `install_proof_artifacts.ps1` refreshes the browser circuit and the contract test fixture. The root `bbout/HonkVerifier.sol` supersedes the older non-ZK verifier variant.

`scripts/extractPoseidon2Constants.mjs` regenerates the TypeScript Poseidon2 constants from `scripts/poseidon2_reference.rs`. `scripts/generatePinnWeights.mjs` and `scripts/generatePvTrace.mjs` regenerate the deterministic PINN weights and the sample PV trace.

## Privacy model

- UBL XML parsing, Poseidon2 hashing and proof generation run only in the browser.
- No API route accepts invoice XML, prices, tax identifiers or customer identifiers.
- `localStorage` and `sessionStorage` are not used. Wallet state relies on wagmi cookie storage.
- The optional Postgres migration mirrors confirmed on-chain events only. Every confirmed row carries a Sepolia transaction hash and no commercial fields exist in the schema.
- Shareable receipt pages expose only public circuit inputs and on-chain metadata.

## Design system

The interface follows the operational Bento language in `FRONTEND_SPEC.md`: `VaneField` vector canvas, scroll progress navigation, Barlow Semi Condensed display type, DM Sans body type, Fira Code data type, Tungsten Foundry palette, restrained motion and no decorative gradients. Reveals replay in both directions and animated cards avoid expensive backdrop filters.

## Status and limits

- Contract tests and the production Next.js build pass locally.
- Browser proving is validated against the same circuit and verifier version used by the contract fixture.
- The repository does not include deployed Sepolia addresses. Deploy and set the environment variables to run live chain actions.
- WalletConnect and Sepolia RPC credentials are supplied by the operator.
- Logo and favicon remain reserved comment slots until final brand assets are supplied.
