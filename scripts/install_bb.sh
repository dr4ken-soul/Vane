#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bb:$HOME/.local/bin:$PATH"

echo "=== installing bb 6.0.0 ==="
if ! command -v bbup >/dev/null 2>&1; then
  curl -L https://raw.githubusercontent.com/AztecProtocol/bbup/main/install | bash
fi
bbup -v 6.0.0
bb --version
