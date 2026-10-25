#!/usr/bin/env node
/**
 * timing-grid.mjs — exact frame / beat / bar maths for motion design.
 *
 * Derives everything from duration, fps and BPM. Run this BEFORE designing a
 * timeline so cut positions and sync offsets are measured rather than guessed.
 *
 *   node scripts/timing-grid.mjs --seconds 26.4 --fps 60 --bpm 150
 *   node scripts/timing-grid.mjs --seconds 15   --fps 30 --bpm 128 --beats-per-bar 3
 *   node scripts/timing-grid.mjs --seconds 26.4 --fps 60 --bpm 150 --cuts 3.2,8.0,12.8
 *
 * --cuts accepts seconds. The script reports, for each cut, the nearest bar line
 * and the offset in frames, so you can correct drift instead of rationalising it.
 */

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf('--' + k);
  if (i < 0 || i + 1 >= argv.length) return d;
  const v = argv[i + 1];
  return v.startsWith('--') ? d : v;
};

const SECONDS = parseFloat(arg('seconds', '30'));
const FPS = parseInt(arg('fps', '60'), 10);
const BPM = parseFloat(arg('bpm', '120'));
const BEATS_PER_BAR = parseInt(arg('beats-per-bar', '4'), 10);
const CUTS = arg('cuts', '')
  .split(',')
  .map((s) => parseFloat(s.trim()))
  .filter((n) => Number.isFinite(n));

if (!Number.isFinite(SECONDS) || SECONDS <= 0) {
  console.error('--seconds must be a positive number');
  process.exit(1);
}
if (!Number.isFinite(FPS) || FPS <= 0) {
  console.error('--fps must be a positive integer');
  process.exit(1);
}
if (!Number.isFinite(BPM) || BPM <= 0) {
  console.error('--bpm must be a positive number');
  process.exit(1);
}

const beat = 60 / BPM;
const bar = beat * BEATS_PER_BAR;
const totalFrames = Math.round(SECONDS * FPS);
const framesPerBeat = beat * FPS;
const framesPerBar = bar * FPS;
const totalBars = SECONDS / bar;
const totalBeats = SECONDS / beat;

/** round to the nearest frame, but never report a cut off the end */
const toFrame = (sec) => Math.min(totalFrames, Math.round(sec * FPS));
const fmt = (n, w = 6, d = 2) => n.toFixed(d).padStart(w);

console.log('='.repeat(58));
console.log('  TIMING GRID');
console.log('='.repeat(58));
console.log(`  duration        ${SECONDS} s`);
console.log(`  frame rate      ${FPS} fps`);
console.log(`  tempo           ${BPM} BPM`);
console.log(`  total frames    ${totalFrames}  (${SECONDS} x ${FPS})`);
console.log('');
console.log(`  beat            ${beat.toFixed(4)} s   ${framesPerBeat.toFixed(2)} frames`);
console.log(`  bar             ${bar.toFixed(4)} s   ${framesPerBar.toFixed(2)} frames  (${BEATS_PER_BAR}/4)`);
console.log(`  total beats     ${totalBeats.toFixed(2)}`);
console.log(`  total bars      ${totalBars.toFixed(3)}`);

if (!Number.isInteger(framesPerBeat)) {
  console.log('');
  console.log('  NOTE: beats do not land on whole frames at this');
  console.log('        tempo/framerate. Choose a BPM that divides evenly');
  console.log('        so cuts can be frame-exact:');
  const divisors = [60, 90, 100, 120, 150, 180, 200];
  const ok = divisors.filter((b) => Math.abs(Math.round((60 / b) * FPS) - (60 / b) * FPS) < 1e-9);
  console.log('        ' + (ok.length ? ok.join(', ') : 'none at this frame rate'));
}

// ---- bar / beat map -----------------------------------------------------
console.log('');
console.log('  BAR  START(s)  START(f)   LENGTH(f)   END(f)');
console.log('  ' + '-'.repeat(54));
const bars = Math.ceil(totalBars);
for (let b = 0; b < bars; b++) {
  const s = b * bar;
  const f0 = toFrame(s);
  const f1 = toFrame(Math.min(SECONDS, s + bar));
  console.log(
    `  ${String(b + 1).padStart(3)}  ${fmt(s)}  ${String(f0).padStart(8)}  ` +
    `${String(f1 - f0).padStart(10)}  ${String(f1).padStart(8)}`,
  );
}

// ---- cut verification ---------------------------------------------------
if (CUTS.length) {
  console.log('');
  console.log('  CUT VERIFICATION');
  console.log('  ' + '-'.repeat(54));
  console.log('  cut(s)   frame   nearest bar   bar(f)   offset(f)   status');
  let worst = 0;
  for (const c of CUTS.sort((a, b) => a - b)) {
    const f = toFrame(c);
    const barIdx = Math.round(c / bar);
    const barStart = toFrame(barIdx * bar);
    const off = f - barStart;
    worst = Math.max(worst, Math.abs(off));
    const status = Math.abs(off) === 0 ? 'ON BAR' : Math.abs(off) <= 1 ? 'ok (1f)' : 'OFF';
    console.log(
      `  ${fmt(c, 6, 3)}  ${String(f).padStart(6)}  ${fmt(barIdx * bar, 10, 3)}  ` +
      `${String(barStart).padStart(8)}  ${String(off).padStart(10)}   ${status}`,
    );
  }
  console.log('');
  console.log(`  worst offset    ${worst} frame(s)`);
  console.log(
    worst === 0
      ? '  All cuts are frame-exact on bar lines.'
      : worst <= 1
        ? '  Offsets of 1 frame are imperceptible. Acceptable.'
        : '  WARNING: correct these before building. Move the cut to the bar line.',
  );
}

// ---- beat-synced micro-motion reference --------------------------------
console.log('');
console.log('  BEAT-SYNCED MICRO-MOTION');
console.log('  ' + '-'.repeat(54));
console.log(`  scale pulse   1 + (beatDecay ^ 4) * 0.012    -> max +1.2%`);
console.log(`  opacity pulse 1 + (beatDecay ^ 4) * 0.04     -> max +4.0%`);
console.log(`  stagger       2-6 frames between elements`);
console.log(`  first beat    frame 0, then every ${framesPerBeat.toFixed(2)} frames`);
console.log('');
console.log('  beat frames up to 4 bars:');
const show = Math.min(16, Math.round(totalBeats));
let line = '   ';
for (let b = 0; b < show; b++) {
  line += String(Math.round(b * framesPerBeat)).padStart(6);
  if ((b + 1) % 4 === 0) { line += '   <- bar ' + (b / 4 + 1); }
}
console.log(line);
console.log('='.repeat(58));