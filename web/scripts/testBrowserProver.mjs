import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Noir } from "@noir-lang/noir_js";
import { BackendType, Barretenberg, UltraHonkBackend } from "@aztec/bb.js";

const circuitPath = resolve("public/circuits/cbam_attestation.json");
const fixturePath = resolve("../contracts/test/fixtures/proofFixture.json");
const circuit = JSON.parse(readFileSync(circuitPath, "utf8"));
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

const inputs = {
  unit_price_eur_cents: "64250",
  supplier_tax_id_hash: `0x${fixture.supplierTaxIdHash}`,
  invoice_serial_secret: `0x${fixture.invoiceSerialSecret}`,
  clean_kwh_allocated: String(fixture.cleanKwhAllocated),
  grid_kwh_allocated: "12840",
  direct_process_emissions_kg: "257410",
  shipment_mass_tonnes: "185",
  grid_emission_factor_g_per_kwh: "412",
  merkle_leaf_salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
  merkle_path: [
    "0x2d126df89e2128add2f7eb7e4401bd09e5e8f0a2e3b9858b3c32dd67e7b0da11",
    "0x11bfd4b023d8fff88931f1f07c7aa4cc3b636b274fd2008e86946f928cab549f",
    "0x08c642f00f6f1fcd02e0c3dfc5d582538e22b25fdfeaa0a2b4e080fbf329254c",
    "0x1634006191a2c2fea17f600f7bef04b8a6165db33852fb4c1aa4884a0ffcfcd7",
  ],
  merkle_indices: [false, false, false, false],
  facility_merkle_root: `0x${fixture.merkleRoot}`,
  invoice_nullifier: `0x${fixture.invoiceNullifier}`,
  max_intensity_kg_per_tonne: "1450",
  cn_commodity_code: "7208",
};

const noir = new Noir(circuit);
console.log("executing witness");
const { witness } = await noir.execute(inputs);
console.log("witness bytes", witness.length);

console.log("starting barretenberg wasm");
const api = await Barretenberg.new({ backend: BackendType.Wasm, threads: 4 });
console.log("barretenberg ready");
const backend = new UltraHonkBackend(circuit.bytecode, api);

console.log("generating proof");
const started = Date.now();
const proofData = await backend.generateProof(witness, { verifierTarget: "evm" });
console.log("proof ms", Date.now() - started, "bytes", proofData.proof.length);
console.log("public inputs", proofData.publicInputs);
console.log("fixture inputs", fixture.publicInputs);

const verified = await backend.verifyProof(proofData, { verifierTarget: "evm" });
console.log("verified", verified);

await api.destroy();
process.exit(verified ? 0 : 1);
