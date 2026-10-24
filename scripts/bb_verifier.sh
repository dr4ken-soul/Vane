#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bb:$HOME/.nargo/bin:$PATH"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/circuits/cbam_attestation"

echo "=== write Solidity verifier ==="
bb write_solidity_verifier -k bbout/proof/vk -o bbout/HonkVerifier.sol -t evm

cp bbout/HonkVerifier.sol "$repo_root/contracts/contracts/HonkVerifier.sol"
echo "Installed contracts/contracts/HonkVerifier.sol"
