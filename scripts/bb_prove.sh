#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bb:$HOME/.nargo/bin:$PATH"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/circuits/cbam_attestation"

rm -rf bbout
mkdir -p bbout

echo "=== prove (EVM verifier target) ==="
bb prove -b target/cbam_attestation.json -w target/witness.gz -o bbout/proof -t evm --write_vk --verify

echo "=== artifacts ==="
ls -la bbout/ bbout/proof/
