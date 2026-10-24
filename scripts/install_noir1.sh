#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bb:$HOME/.local/bin:$HOME/.nargo/bin:$PATH"

echo "=== installing Noir 1.0.0-rc.6 ==="
if ! command -v noirup >/dev/null 2>&1; then
  curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
fi
noirup -v 1.0.0-rc.6
nargo --version
