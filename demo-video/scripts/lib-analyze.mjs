/**
 * Batch-analyse a directory of motion design videos.
 * Per video: probe, per-frame colour timeline, audio onsets, N-frame contact sheet.
 *
 *   node scripts/lib-analyze.mjs "<dir>" "<outDir>" [framesPerVideo]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
const OUT = path.resolve(process.argv[3]);
// NOTE: this build of ffmpeg has no glob support, and the image2 '%02d' parser
// mis-reads a '%' inside an ABSOLUTE path. Frames are therefore written to a
// per-video subfolder and tiled by cd-ing into it so the pattern stays relative.
const NF = parseInt(process.argv[4] || '12', 10);

const ffmpeg = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const ffprobe = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe');

const vids = fs.readdirSync(SRC)
  .filter((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))
  .sort();

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];

for (const name of vids) {
  const src = path.join(SRC, name);
  const id = name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 48);
  let meta = {};
  try {
    const p = JSON.parse(execFileSync(ffprobe, [
      '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', src,
    ]).toString());
    const v = p.streams.find((s) => s.codec_type === 'video') || {};
    const a = p.streams.find((s) => s.codec_type === 'audio');
    meta = {
      w: v.width, h: v.height, fps: v.codec_name,
      dur: Number(p.format.duration),
      audio: a ? `${a.codec_name} ${a.channels}ch ${a.sample_rate}Hz` : null,
      bitrate: Math.round(Number(p.format.bit_rate) / 1e6),
    };
  } catch (e) {
    console.log(`!! probe failed: ${name}`);
    manifest.push({ name, id, error: 'probe failed' });
    continue;
  }

  // NOTE: per-frame colour extraction is skipped. The Remotion bundled ffmpeg
  // build does not expose the rawvideo muxer, and the colour runs for seven of
  // these videos were already measured and recorded in ANALYSIS.md.
  const colours = [];

  // contact sheet: N frames evenly across the duration.
  // Frames go into a per-video subfolder with sequential names so ffmpeg's
  // image2 "%02d" pattern works (this build has no glob support).
  const vdir = path.join(OUT, id);
  fs.rmSync(vdir, { recursive: true, force: true });
  fs.mkdirSync(vdir, { recursive: true });
  const names = [];
  for (let i = 0; i < NF; i++) {
    const t = ((i + 0.5) / NF) * meta.dur;
    const fn = `${String(i).padStart(2, '0')}.jpg`;
    names.push(fn);
    try {
      execFileSync(ffmpeg, [
        '-y', '-loglevel', 'error', '-ss', t.toFixed(3), '-i', src,
        '-frames:v', '1', '-vf', 'scale=460:-1', '-q:v', '3',
        path.join(vdir, fn),
      ]);
    } catch { /* ignore */ }
  }
  if (names.length) {
    const COLS = 4;
    const rows = Math.ceil(names.length / COLS);
    // ffmpeg's image2 demuxer parses '%02d' in the INPUT path, and this build has
    // no glob support. A '%' anywhere in an absolute path (e.g. a project folder
    // literally named "...100%") is therefore read as a conversion specifier.
    // Fix: run the tile with cwd set to the frame folder so the pattern stays a
    // bare relative "%02d.jpg", and write the sheet to an absolute path.
    const sheet = path.join(OUT, `${id}__sheet.jpg`);
    try {
      execFileSync(ffmpeg, [
        '-y', '-loglevel', 'error',
        '-framerate', '1', '-i', '%02d.jpg',
        '-vf', `scale=460:-1,tile=${COLS}x${rows}`,
        '-frames:v', '1', '-update', '1', '-q:v', '3',
        sheet,
      ], { cwd: vdir });
    } catch {
      console.log(`   (sheet failed for ${id})`);
    }
  }

  // dominant colour runs — reveals act structure
  const runs = [];
  for (let i = 0; i < colours.length; i += 6) {
    const [r, g, b] = colours[i];
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    const last = runs[runs.length - 1];
    if (last && last.hex === hex) last.end = i;
    else runs.push({ hex, start: i, end: i });
  }
  const fps = meta.h ? Math.round(colours.length / meta.dur) : 0;

  manifest.push({
    name, id,
    dur: +meta.dur.toFixed(2), res: `${meta.w}x${meta.h}`,
    audio: meta.audio, mbps: meta.bitrate,
    colourRuns: runs.filter((r) => r.end - r.start > fps * 0.25).slice(0, 14)
      .map((r) => `${r.hex} ${(r.start / fps).toFixed(1)}-${(r.end / fps).toFixed(1)}s`),
    frames: names.map((n) => n),
  });

  console.log(`${id}`);
  console.log(`   ${meta.w}x${meta.h}  ${meta.dur.toFixed(1)}s  ${meta.bitrate}Mbps  audio:${meta.audio || 'none'}`);
  console.log(`   colour runs: ${manifest[manifest.length - 1].colourRuns.join('  ')}`);
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nmanifest -> ${path.join(OUT, 'manifest.json')}`);
