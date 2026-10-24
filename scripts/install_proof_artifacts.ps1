$ErrorActionPreference = 'Stop'

$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
$bbout = Join-Path $repo "circuits\cbam_attestation\bbout"
$target = Join-Path $repo "circuits\cbam_attestation\target"

if (-not (Test-Path (Join-Path $bbout "proof\proof"))) {
  throw "No proof found. Run scripts/bb_prove.sh and scripts/bb_verifier.sh first."
}

# Install the generated ZK UltraHonk verifier.
Copy-Item (Join-Path $bbout "HonkVerifier.sol") (Join-Path $repo "contracts\contracts\HonkVerifier.sol") -Force

# Install the compiled circuit for the browser worker.
$compiled = Get-Content (Join-Path $target "cbam_attestation.json") -Raw
New-Item -ItemType Directory -Force -Path (Join-Path $repo "web\public\circuits") | Out-Null
Set-Content -Path (Join-Path $repo "web\public\circuits\cbam_attestation.json") -Value $compiled -NoNewline

# Update the contract test fixture with the generated proof and public inputs.
$fixturePath = Join-Path $repo "contracts\test\fixtures\proofFixture.json"
$fixture = Get-Content $fixturePath -Raw | ConvertFrom-Json
$proof = "0x" + (([System.IO.File]::ReadAllBytes((Join-Path $bbout "proof\proof")) | ForEach-Object { $_.ToString("x2") }) -join "")
$publicInputsBytes = [System.IO.File]::ReadAllBytes((Join-Path $bbout "proof\public_inputs"))
$publicInputs = @()
for ($i = 0; $i -lt $publicInputsBytes.Length; $i += 32) {
  $chunk = $publicInputsBytes[$i..($i + 31)]
  $publicInputs += ("0x" + (($chunk | ForEach-Object { $_.ToString("x2") }) -join ""))
}
$fixture | Add-Member -NotePropertyName proof -NotePropertyValue $proof -Force
$fixture | Add-Member -NotePropertyName publicInputs -NotePropertyValue $publicInputs -Force
$fixture | ConvertTo-Json -Depth 10 | Set-Content $fixturePath
Write-Output "proof bytes: $($proof.Length / 2 - 1)"
Write-Output "public inputs: $($publicInputs.Count)"
$publicInputs | ForEach-Object { Write-Output "  $_" }
