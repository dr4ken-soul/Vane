use std::hash::poseidon2_permutation;

// Proves that an industrial shipment's embedded carbon intensity stays at or below
// the declared CBAM ceiling using energy from a verified, un-quarantined meter Merkle tree,
// while keeping unit pricing, supplier tax ID, and raw process inputs completely private.

// Poseidon2 sponge over the BN254 permutation, matching the standard Poseidon2 domain
// separation used by the Noir standard library hasher.
fn poseidon2_hash<let N: u32>(input: [Field; N]) -> Field {
    let rate: u32 = 3;
    let mut state = [0 as Field; 4];
    state[3] = (N as Field) * 18446744073709551616;

    let blocks = N / rate;
    for block in 0..blocks {
        for offset in 0..rate {
            state[offset] += input[block * rate + offset];
        }
        state = poseidon2_permutation(state);
    }

    let absorbed = blocks * rate;
    for offset in 0..(N % rate) {
        state[offset] += input[absorbed + offset];
    }

    state = poseidon2_permutation(state);
    state[0]
}

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
    merkle_indices: [bool; 4],

    // Public inputs (verified on Ethereum Sepolia by VaneAttestationRegistry.sol)
    facility_merkle_root: pub Field,
    invoice_nullifier: pub Field,
    max_intensity_kg_per_tonne: pub u64,
    cn_commodity_code: pub u64,
) {
    // 1. Sanity checks on non-zero commercial invoice and mass
    assert(shipment_mass_tonnes > 0);
    assert(unit_price_eur_cents != 0);
    assert(cn_commodity_code > 0);

    // 2. Verify Merkle membership of allocated clean kWh leaf in VaneMeterOracle root
    let leaf = poseidon2_hash([clean_kwh_allocated as Field, supplier_tax_id_hash, merkle_leaf_salt]);
    let mut current = leaf;
    for i in 0..4 {
        let sibling = merkle_path[i];
        let (left, right) = if merkle_indices[i] {
            (sibling, current)
        } else {
            (current, sibling)
        };
        current = poseidon2_hash([left, right]);
    }
    assert(current == facility_merkle_root);

    // 3. Verify unique Poseidon2 invoice nullifier (blocks double-counting across buyers)
    let computed_nullifier = poseidon2_hash([
        supplier_tax_id_hash,
        invoice_serial_secret,
        clean_kwh_allocated as Field,
    ]);
    assert(computed_nullifier == invoice_nullifier);

    // 4. Thermodynamic CBAM embedded emissions check (clean kWh carries 0 Scope-2 emissions)
    let indirect_emissions_kg = (grid_kwh_allocated * grid_emission_factor_g_per_kwh) / 1000;
    let total_emissions_kg = direct_process_emissions_kg + indirect_emissions_kg;
    let max_allowed_total_kg = max_intensity_kg_per_tonne * shipment_mass_tonnes;
    assert(total_emissions_kg <= max_allowed_total_kg);
}
