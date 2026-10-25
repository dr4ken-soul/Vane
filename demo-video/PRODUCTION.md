# Vane Demo Film: Production Direction

Working title: **Vane: Verify Carbon by Physics, Not Trust**
Deliverable: `out/Vane-Demo.mp4`, 1920x1080, 30 fps, 165 s, stereo audio.

## 1. Intent

| Field | Decision |
|---|---|
| PURPOSE | Explain + persuade for the IEEE ClimateChain judging panel |
| AUDIENCE | Climate tech judges who believe carbon claims are sketchy and want proof, not promises |
| SUBJECT | Vane: physics-verified smart-meter roots and zero-knowledge EU CBAM proofs on Sepolia |
| CLAIM | Clean-power claims can be physically and mathematically verified without leaking commercial data |
| FEELING | Engineered certainty: the calm of a system that measures before it speaks |
| PLATFORM | Devpost submission, YouTube, 16:9 landscape, sound-on or sound-off both legible |
| PROMISE | After watching, the viewer understands both engines and has seen genuinely live on-chain evidence |

Mode mix: **`evidence-demo` owns structure** (claim, mechanism, proof, verdict, repeated); `product-ui-film` contributes real interface plates; `narrative-world` contributes persistence devices only. One movement vocabulary, no new technique introduced after scene 3.

Duration is fixed to the music grid: 96 BPM, 4/4. Bar = 2.5 s = 75 frames. Total 66 bars = 165 s = 4950 frames. Every structural cut lands exactly on a bar line.

## 2. Visual language

### Palette contract (Vane brand, Tungsten Foundry)

```
GROUND DARK   #0a0b0d primary, surfaces #16191f, elevation #1d2129 (system acting, proofs, chain)
GROUND PAPER  #f2efe8 warm paper with ink #16130c (the human paperwork world: invoices, audits, failure)
ACCENT ACT 1  #f0a500 amber: physics, measurement, the instrument (under 10% of pixels)
ACCENT ACT 2  #3dd68c green: verified, settled, attested (introduced with the receipt cycle)
ACCENT ACT 3  #f2555a red: spoof, quarantine, rejection (failure beats only)
TEXT          #f1f3f5 primary, #9aa1ac secondary, #68707d muted forever
WHY           Dark is where the system acts; paper is where humans argue; the accent colour names the state.
```

Ground rule: dark to paper switches mean the argument has moved from system to people, and back. Two specific failing beats invert: the double-count card is a dark card on paper; the quarantine verdict is a red-marked dark card.

### Type role lock (Vane's own faces, loaded from `assets/fonts`)

| Role | Face | Use |
|---|---|---|
| Display | Barlow Semi Condensed 700/800, tracking -0.02em to -0.04em | Headlines, verdict words, huge numbers. 60 to 80% of frame width for hero statements |
| Machine | Fira Code 500/600, uppercase, tracking +0.18em | Eyebrows, labels, telemetry, tx hashes, captions, HUD |
| Body | DM Sans 400/500 | One sentence of explanation where a headline cannot carry it |

No face changes role. Verdict words land in display weight; machine type never exceeds 20px at 1080p; the accent marks exactly one phrase per headline.

### Texture stack (uniform, quiet)

Film grain 3% + vignette 18% + 0.4px chromatic aberration at frame edge. Applied to every scene equally. Nothing else decorative.

### Margins and furniture

Margin system: 8% of frame width left and right; never broken. One focal point per frame.

Persistent furniture, rank 3 to 4, identical geometry every frame:

1. **Top instrument strip** (machine voice, 19px mono): left `VANE / SEPOLIA / 11155111`, centre an act clock `CLAIM .. PROOF`, right a compact live stat that changes only in scenes with real chain data (`ROOTS 2`, `QUAR 1`, `ATTEST 1`, `TXN 6981e8..c36c`). Present in every frame without exception. It tells the viewer this sequence is one continuous production run on a real chain.
2. **Caption plate** bottom-left (24px mono in a dark chip on dark scenes, ink chip on paper): the narration as text, sentence case, persisting across its shot. Kills the need for sound and gives the long piece a verbal spine.
3. **Beat pulse**: every element breathes 1.2% scale on each bar (75-frame period), imperceptible singly, alive in aggregate.

Not used: decorative glow, particle dust, camera drift, wipes.

## 3. Structure: claim, mechanism, proof, verdict, three cycles

```
BARS 1-6    A HOOK          dark    claim + real instrument
BARS 7-14   B PROBLEM       paper   the human failing world, two beats
BARS 15-24  C MECHANISM     dark    the pipeline of record, four real stages
BARS 25-36  D PROOF 1       dark    meter truth: live feed + root anchor + quarantine stamp
BARS 37-50  E PROOF 2       dark    buyer proof: browser ZK + real attestation + real receipt
BARS 51-58  F PROOF 3       dark    replay rejection: voice of the contract itself
BARS 59-66  G ENDCARD       dark    brand land last, with the restraint line
```

Scenes use real on-chain artefacts captured from Sepolia and the live app:

| Artefact | Value |
|---|---|
| Clean root seed tx | `0x061431f5405498f7d8f5a33d8f74aeae7729e66982a2c8e98a65949ff5279f8e` |
| Fixture root anchor tx | `0x6981e8110a61cfc60900523730228d7f9399ce0486cbdf8456cd34ed0207c36c` |
| Quarantine tx | `0x898fe38c2b5e8a8c1a05b189e829ed803d93aecf35cd89de97b149f0dd62c8a1` |
| Attestation tx | `0x351952fe74bde54347382066d6de3e955074df9a61d6ca499cc672dc05d072ff` |
| Attestation id | 1, CN 7208, ceiling 1450 kg/t, gas 4,540,491 |
| Receipt URL | `https://vane-orcin.vercel.app/verify/1` |

## 4. Scene plan

Each scene: purpose, frame content, narration inset, motion notes. VO lines are measured after synthesis; the plan assumes 0.4 to 4.0 words per second and slots are cut to the measured files.

### A1 (bars 1-2, f0-149) Hook, cold
- Screen: black. Machine eyebrow `IEEE CLIMATECHAIN 2026 / SEPOLIA`. Display line grows to 64% width: `Carbon claims rest on a number.` Then the accent phrase replaces: `Nobody checks the meter.`
- VO 1: "A carbon ledger only knows what the meter reports."
- Audio: bed starts on bar 2 downbeat, sub drone only.

### A2 (bars 3-6, f150-449) Hook, the instrument arrives
- Screen: hard cut on bar 3 to the real hero instrument crop (plate `p-spoof-cal.png`, pan from instrument stack centre). Caption plate introduces the film contract. On bar 5 the badge `CALIBRATED` lands amber; the real GHI curve cell breathes.
- VO 2: "Vane checks the physics first." (short, lands with badge)
- Transition: pulse impact on bar 6 into act B paper world.

### B1 (bars 7-10, f450-749) Problem 1, the exporter's dilemma (paper)
- Screen: paper ground. An illustrative invoice card (built in code, faithful to the real UBL 2.1 sample: `UnitPrice 642.50 EUR`, `SupplierTIN TR-4810923811`, `BatchKWh 41,800`) whose private rows are covered by ink bars labelled `WITHHELD`. Stamp-ish chip: `PUBLISHING LEAKS MARGINS`.
- VO 3: "To prove a clean claim on a public chain, an exporter leaks tariffs and tax identifiers. So the invoices stay private, and nobody can check them."
- Motion: rows assemble then get redacted; one red underscore marks the tax row. Deliberate quiet second half.

### B2 (bars 11-14, f750-1049) Problem 2, the double count (paper, inverted card)
- Screen: same paper world, now two buyer cards name the same batch `ROOT 0x0e89..4f02 / 41,800 kWh`. Both show 100% allocation. Dark card slides in over the pair, red stamp `DOUBLE COUNTED`, mono line `no registry sees this today`.
- VO 4: "And if the same clean megawatt hour is sold twice, the paperwork cannot tell."
- Transition: hard cut to dark on bar 15 as the argument returns to the system.

### C1 (bars 15-20, f1050-1499) Mechanism, the pipeline of record
- Screen: four stage nodes in a row `INGEST / CALIBRATE / PROVE / SETTLE` (the real pipeline). A data line travels the nodes as the camera locks; each node pops on a bar line and reveals its real sentence from the product: `Score thermodynamic + PINN residuals`, `Compile client-side UltraHonk proof`, `Seal nullifier + mint CBAM certificate`.
- VO 5: "Vane wires the whole chain into four stages, and every stage carries its own proof."

### C2 (bars 21-24, f1500-1799) Mechanism, the two engines
- Screen: engine split: left card `ENGINE 1 PINN METER GUARD`, right card `ENGINE 2 BROWSER ZK CBAM PROVER`; the right card sits on the inverted near-black ground telling the viewer it behaves differently. Under each, one real line from DualEngineInspector copy.
- VO 6: "One engine watches the sky; the other watches the invoice. Neither trusts the other's word."

### D1 (bars 25-28, f1800-2099) Proof 1a, the live physics feed
- Screen: plate crop of the live telemetry section (`08-telemetry.png`) registering real values; push in 1.15x on the SETTLE stage card; mono stat family: `OPEN-METEO / ZERO API KEY / ROOT 0x0e89..64f02 / BATCH 41,800 KWH`.
- VO 7: "Here is the facility feed, cross-checked against live satellite irradiance for the same hours."

### D2 (bars 29-32, f2100-2399) Proof 1b, anchoring on Sepolia
- Screen: code-accurate transaction card: `tx 0x061431f5..279f8e`, event `HourlyRootAnchored(root, meter, residual 310bps)`, root `0x11af..26fd0` in mono. Stamp `ANCHORED` in amber lands on bar 31 downbeat. Stat family: `ROOTS ON CHAIN 2 / WINDOW 24 H / 30.0M GAS MAX`.
- VO 8: "Anchoring is one honest transaction. The oracle stores the root and hours on Sepolia."

### D3 (bars 33-36, f2400-2699) Proof 1c, quarantine
- Screen: the real product's own instrument: plate `p-spoof-q.png` (post-click state); residual readout `0.482 SIGMA` in red; real quarantine tx `0x898fe38c..62c8a1`; stamp `QUARANTINED` red; the counter `QUAR 1` incrementing in the HUD.
- VO 9: "Inject a one point four multiplier and the oracle refuses to anchor. It quarantines the interval on-chain."
- Transition: frames end with red flicker to black on bar 37.

### E1 (bars 37-40, f2700-2999) Proof 2a, the invoice enters the browser
- Screen: dark world. The real sample file chip `gebze_hot_rolled_coil.xml` drops into a browser-frame card. Private fields exactly as the product shows them: `UnitPrice 642.50 EUR`, `SupplierTIN TR-4810923811`, `BatchKWh 41,800`, red mono tag `NEVER TRANSMITTED`. Caption: `0 BYTES LEAVE THE BROWSER`.
- VO 10: "The buyer side never leaves the machine. An OASIS UBL invoice goes into a WebAssembly worker."

### E2 (bars 41-44, f3000-3299) Proof 2b, proving
- Screen: worker progress rail 0 to 100% with mono readouts borrowed from the real prover UI; centre pairs exactly as the Engine 2 panel shows: `FacilityRoot 0x0e89..4f02`, `NullifierHash 0x15a4..4aea`, `MaxIntensity 1.45 tCO2e/t`, `Result VERIFIED`. Machine line `ULTRAHONK / 7616 BYTES / POSEIDON2 NULLIFIER`.
- VO 11: "Noir compiles an UltraHonk proof inside the browser. The public surface is four field elements."

### E3 (bars 45-48, f3300-3599) Proof 2c, verified on Sepolia
- Screen: registry verification card: `HonkVerifier.verify(proof, 4 public inputs): true`; fee `0.004540491 ETH` from the real Etherscan plate `18-etherscan-attest.png` (window crop); green stamp `PROOF VERIFIED` on bar 47; attestation card appears: `ATTESTATION 1 / CN 7208 / CEILING 1450 KG/T` with `FACILITY ROOT CLEAN` chip, exactly as the receipt badge reads.
- VO 12: "The registry verifies the proof against the clean root, and seals attestation one."

### E4 (bars 49-50, f3600-3749) Proof 2d, the receipt
- Screen: plate `14-verify-1.png`, slow pan across the real receipt `CBAM RECEIPT #1` and its chips `ZERO-KNOWLEDGE PROOF VERIFIED`, `ETHEREUM SEPOLIA - 11155111`, `FACILITY ROOT CLEAN`, down to `WHAT THIS RECEIPT PROVES` and the `ZERO PRIVATE DATA` card. Highlighter sweep under `WHAT THIS RECEIPT PROVES`.
- VO 13: "Customs opens a link, not a spreadsheet."

### F1 (bars 51-54, f3750-4049) Proof 3, the replay
- Screen: the same invoice card is dragged back into the drop zone; the contract speaks: mono lines `FacilityRootQuarantinedOrUnknown` no more, now the real test parity: custom error `Nullifier_already_used` with the registry line `if usedNullifiers[nullifier] revert NullifierAlreadyUsed()`. Red stamp `REJECTED BY THE REGISTRY` on bar 54.
- VO 14: "Replay the same invoice and the registry stops it. One batch, one attestation, ever."

### F2 (bars 55-58, f4050-4349) Restraint line (credibility device)
- Screen: quiet. Display line `What the chain shows.` left, plain-language table right (technical key to human gloss): `facility root: physics before anchoring`, `public inputs: four, no pricing`, `nullifier: the batch can only be used once`, `receipt: open to anyone, no wallet`.
- VO 15: "The chain shows the maths, hides the margins, and forgets nothing."

### G (bars 59-66, f4350-4949) Endcard

- Screen: brand land: `VANE` display lockup last (never before), one accent phrase `by physics, not trust`. Under it the restraint line. Three mono destination rows: app, contracts, source. Final beat: text `Built for IEEE ClimateChain 2026 / UN COP 31, Antalya`.
- VO 16: "Vane. Verify carbon by physics, not trust."

## 5. Audio direction

Bed: original score synthesised for this film at 96 BPM so every cut is frame-exact to bar lines. A minor. Structure follows acts: sub drone + heartbeat kick (A), sparse and dry under paper (B), four-on-floor + arpeggios (C to F, density ramps), resolve pad + no percussion (G). No licence dependencies.

SFX: riser into each act boundary; low impact on every state stamp (ANCHORED, QUARANTINED, PROOF VERIFIED, REJECTED); UI ticks on the meter reset; record-start whoosh on plate pans. Every structural transition has designed sound.

Voiceover: en-GB Ryan neural voice, calm and steady, 2% rate up. British English. Per-scene MP3s in `assets/vo`, measured with ffprobe, scenes then aligned to files, never the other way round. Bed ducks to 18% while narration plays.

## 6. Rendering

```
npm run still:frames (QC)  npx remotion still out/qc/<frame>.png --frame=N
render                     npx remotion render src/index.ts VaneDemo out/Vane-Demo.mp4 --codec h264 --crf 18
audio                      mixed inside the composition: bed + sfx + vo with duck envelopes
```

## 7. QC gate

Before delivery this film passes: one focal point per frame; hero type 60 to 80% width or justified; no broken text; geometry locked across cuts; margins unbroken; accent budget respected; cuts on bar lines (0 frame offset by construction); one hero effect per scene; ends on a held lockup; no unexplained motion; captions readable muted; real artefacts labelled as real; illustrative cards labelled illustrative (B1, B2 cards) so no product claim is overstated. Randomised 6-frame stills are reviewed at full resolution, plus an end-to-end watch pass of the finished MP4.
