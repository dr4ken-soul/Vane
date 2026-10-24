#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.nargo/bin:$HOME/.bb:$PATH"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/circuits/cbam_attestation"

echo "=== nargo compile ==="
nargo compile

echo "=== nargo execute ==="
nargo execute

echo "=== artifacts ==="
ls -la target/
