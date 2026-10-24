-- migrations/001_telemetry_cache.sql
-- Read mirror for confirmed Sepolia events only. Private UBL 2.1 commercial fields never
-- enter this database: no unit price, total amount, supplier tax identifier or customer EORI.

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
    -- A snapshot is only mirrored once its event is confirmed on Sepolia.
    sepolia_tx_hash TEXT NOT NULL
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

CREATE INDEX IF NOT EXISTS idx_telemetry_facility_time
    ON telemetry_snapshots (facility_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_attestations_exporter
    ON confirmed_attestations (LOWER(exporter_wallet));

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmed_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY facilities_select_public ON facilities FOR SELECT USING (true);
CREATE POLICY facilities_write_owner ON facilities
    FOR ALL USING (LOWER(owner_wallet) = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet'));

CREATE POLICY telemetry_select_public ON telemetry_snapshots FOR SELECT USING (true);
CREATE POLICY attestations_select_public ON confirmed_attestations FOR SELECT USING (true);
