# PRODUCT.md: Vane

## How Vane Works for Both User Groups

Vane serves two primary user groups whose incentives previously collided: **Industrial Exporters & Captive Clean-Energy Generators** (who need to prove low-carbon production without revealing private commercial costs) and **EU CBAM Declarants & Customs Verifiers** (who need proof that energy meters were not spoofed and clean power was not sold twice).

---

### User Group 1: Industrial Exporters & Facility Operators

1. **Stream Facility Telemetry Without Changing Hardware:**
   Connect existing solar inverter or industrial sub-meter feeds (`CSV` or `MQTT` JSON) with facility GPS coordinates (`Gebze`, `Iskenderun`, `Antalya`, or custom lat/lon). Vane cross-checks every reported kilowatt interval against live Open-Meteo satellite shortwave irradiance, cell thermal physics, and wind speed.
2. **Anchor Clean Energy Roots on Ethereum Sepolia:**
   Intervals whose physics residual stays within `0.12 sigma` anchor an hourly `Poseidon2` Merkle energy root on `VaneMeterOracle.sol`. Compromised or spoofed intervals are flagged immediately before they can contaminate compliance records.
3. **Prove EU CBAM Thresholds Directly in Browser RAM:**
   Open `/app/attest/new` and drop in a standard `OASIS UBL 2.1` XML energy or precursor invoice (such as Turkish `e-Fatura`). Vane compiles a Noir UltraHonk proof inside a local WebAssembly Worker in approximately `2.5 seconds`. Unit prices, supplier tax IDs, and batch totals never leave browser memory.
4. **Share One Customs Receipt URL:**
   Submit the proof transaction on Ethereum Sepolia and send the resulting `/verify/[id]` URL or downloadable W3C JSON certificate straight to EU buyers and customs declarants.

---

### User Group 2: EU Importers, CBAM Declarants & Verifiers

1. **Instant Wallet-Free Verification (`/verify/[id]`):**
   Open any Vane receipt URL in an ordinary browser with zero wallet extensions required. Vane reads `VaneAttestationRegistry.sol` directly from Ethereum Sepolia.
2. **Three Guarantees Verified Automatically:**
   - **Physical Integrity:** The underlying electricity batch came from an un-quarantined facility root verified against live satellite solar and weather physics (`VaneMeterOracle.isRootClean(root) == true`).
   - **Mathematical Carbon Compliance:** Total direct plus indirect emissions per tonne of steel (`CN 7208`), aluminium (`CN 7601`), or cement (`CN 2523`) did not exceed the declared ceiling.
   - **Zero Double-Counting:** A deterministic `Poseidon2` nullifier derived from the supplier invoice serial is permanently marked spent on Sepolia, blocking any attempt to allocate the same clean MWh batch across two shipments.
