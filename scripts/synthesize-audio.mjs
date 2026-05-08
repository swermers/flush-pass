// Synthesizes four placeholder sound effects as 16-bit mono WAV files.
// Generated locally — no external assets, CC0 / public domain.
// Run with: node scripts/synthesize-audio.mjs
//
// Output: public/audio/{door-clang,flush,ambient,reveal}.wav
// These are placeholders — swap with real Pixabay clips when ready
// (just keep the filenames and update useAudio.ts paths if extension changes).

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SR = 22050;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public', 'audio');
await mkdir(outDir, { recursive: true });

// ----- WAV writer (16-bit signed PCM, mono) -----
function writeWav(samples) {
  const dataLen = samples.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20);  // PCM format
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);  // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32760), 44 + i * 2);
  }
  return buf;
}

// ----- DSP helpers -----
function noise(n) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.random() * 2 - 1;
  return out;
}

// One-pole low-pass: y[n] = y[n-1] + a*(x[n] - y[n-1])
function lowpass(x, cutoff) {
  const dt = 1 / SR;
  const rc = 1 / (2 * Math.PI * cutoff);
  const a = dt / (rc + dt);
  const y = new Float32Array(x.length);
  let prev = 0;
  for (let i = 0; i < x.length; i++) {
    prev += a * (x[i] - prev);
    y[i] = prev;
  }
  return y;
}

function highpass(x, cutoff) {
  const dt = 1 / SR;
  const rc = 1 / (2 * Math.PI * cutoff);
  const a = rc / (rc + dt);
  const y = new Float32Array(x.length);
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i < x.length; i++) {
    prevY = a * (prevY + x[i] - prevX);
    prevX = x[i];
    y[i] = prevY;
  }
  return y;
}

function bandpass(x, lo, hi) {
  return highpass(lowpass(x, hi), lo);
}

function envelope(n, attack, decay) {
  const a = Math.floor(attack * SR);
  const d = Math.floor(decay * SR);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (i < a) env[i] = i / a;
    else if (i < a + d) env[i] = 1 - (i - a) / d;
    else env[i] = 0;
  }
  return env;
}

function expDecay(n, halfLifeSec) {
  const k = Math.log(2) / (halfLifeSec * SR);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) env[i] = Math.exp(-k * i);
  return env;
}

function mix(...arrs) {
  const n = Math.max(...arrs.map((a) => a.length));
  const out = new Float32Array(n);
  for (const a of arrs) {
    for (let i = 0; i < a.length; i++) out[i] += a[i];
  }
  return out;
}

function scale(x, gain) {
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * gain;
  return y;
}

function sine(freq, n, phase = 0) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.sin(2 * Math.PI * freq * (i / SR) + phase);
  }
  return out;
}

function multiply(a, b) {
  const n = Math.min(a.length, b.length);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = a[i] * b[i];
  return out;
}

function normalize(x, peak = 0.85) {
  let max = 0;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    if (a > max) max = a;
  }
  if (max < 1e-9) return x;
  const g = peak / max;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  return y;
}

// ----- 1. door-clang (~1.0s): metallic stall door slam -----
function doorClang() {
  const dur = 1.0;
  const n = Math.floor(dur * SR);

  // Initial transient: high-passed noise burst
  const transient = multiply(highpass(noise(n), 800), expDecay(n, 0.015));

  // Metallic resonance: inharmonic partials with long decay
  const partials = [
    [180, 0.45, 0.18],  // freq, gain, halfLife (s)
    [320, 0.30, 0.14],
    [540, 0.28, 0.10],
    [870, 0.20, 0.07],
    [1340, 0.12, 0.05],
  ];
  let body = new Float32Array(n);
  for (const [f, g, hl] of partials) {
    const tone = scale(sine(f, n), g);
    const env = expDecay(n, hl);
    body = mix(body, multiply(tone, env));
  }

  // Subtle low-freq thud underneath
  const thud = multiply(scale(sine(70, n), 0.5), expDecay(n, 0.05));

  return normalize(mix(scale(transient, 0.7), body, thud), 0.9);
}

// ----- 2. flush (~3.5s): water rushing -----
function flush() {
  const dur = 3.5;
  const n = Math.floor(dur * SR);

  // Build-up envelope
  const buildup = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (t < 0.4) buildup[i] = t / 0.4;
    else if (t > dur - 0.6) buildup[i] = Math.max(0, (dur - t) / 0.6);
    else buildup[i] = 1;
  }

  // Mid water rush (band-passed noise, modulated)
  const rush = bandpass(noise(n), 600, 4500);

  // Slow amplitude wobble (water surge)
  const wobble = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    wobble[i] = 0.7 + 0.3 * Math.sin(2 * Math.PI * 2.3 * (i / SR));
  }

  // Low rumble of cistern
  const rumble = lowpass(noise(n), 180);

  // Higher hiss
  const hiss = highpass(noise(n), 3500);

  let out = mix(
    scale(multiply(rush, wobble), 0.85),
    scale(rumble, 0.6),
    scale(hiss, 0.18),
  );
  out = multiply(out, buildup);
  return normalize(out, 0.92);
}

// ----- 3. ambient (~8s loopable): bathroom hum + room tone -----
function ambient() {
  const dur = 8.0;
  const n = Math.floor(dur * SR);

  // 60Hz mains hum + light harmonics
  const hum = mix(
    scale(sine(60, n), 0.18),
    scale(sine(120, n), 0.07),
    scale(sine(180, n), 0.04),
  );

  // Filtered low-freq room noise
  const rumble = scale(lowpass(noise(n), 250), 0.35);

  // Faint fluorescent hiss
  const hiss = scale(bandpass(noise(n), 2500, 5000), 0.05);

  let out = mix(hum, rumble, hiss);

  // Crossfade ends to make seamlessly loopable (50ms)
  const xfade = Math.floor(0.05 * SR);
  for (let i = 0; i < xfade; i++) {
    const a = i / xfade;
    const j = n - xfade + i;
    const blended = out[i] * a + out[j] * (1 - a);
    out[i] = blended;
    out[j] = blended;
  }

  return normalize(out, 0.55);
}

// ----- 4. reveal (~0.9s): soft gong -----
function reveal() {
  const dur = 0.9;
  const n = Math.floor(dur * SR);

  // Mallet attack
  const attack = multiply(noise(n), expDecay(n, 0.008));

  // Gong partials (mildly inharmonic)
  const partials = [
    [110, 0.45, 0.55],
    [165, 0.35, 0.42],
    [220, 0.30, 0.32],
    [330, 0.22, 0.22],
    [495, 0.14, 0.14],
  ];
  let body = new Float32Array(n);
  for (const [f, g, hl] of partials) {
    body = mix(body, multiply(scale(sine(f, n), g), expDecay(n, hl)));
  }

  return normalize(mix(scale(attack, 0.35), body), 0.85);
}

// ----- 5. paper-rustle (~1.0s loopable): toilet paper unraveling -----
function paperRustle() {
  const dur = 1.0;
  const n = Math.floor(dur * SR);

  // Band-passed noise for rustle texture
  const rustle = bandpass(noise(n), 1200, 6500);

  // Amplitude modulation around 25 Hz to suggest paper waving
  const am = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    am[i] = 0.5 + 0.5 * Math.sin(2 * Math.PI * 25 * (i / SR));
  }

  // Slow speed wobble (paper feed irregularity)
  const wobble = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    wobble[i] = 0.7 + 0.3 * Math.sin(2 * Math.PI * 1.7 * (i / SR));
  }

  let out = multiply(multiply(rustle, am), wobble);

  // Crossfade ends to loop seamlessly
  const xfade = Math.floor(0.04 * SR);
  for (let i = 0; i < xfade; i++) {
    const a = i / xfade;
    const j = n - xfade + i;
    const blended = out[i] * a + out[j] * (1 - a);
    out[i] = blended;
    out[j] = blended;
  }

  return normalize(out, 0.7);
}

// ----- 6. paper-rip (~0.25s): short paper-tear/thwap -----
function paperRip() {
  const dur = 0.25;
  const n = Math.floor(dur * SR);

  // Sweep cutoff downward over the duration to simulate a tear
  const x = noise(n);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const cutoff = 5000 - 4200 * t;
    const dt = 1 / SR;
    const rc = 1 / (2 * Math.PI * cutoff);
    const a = dt / (rc + dt);
    prev += a * (x[i] - prev);
    out[i] = prev;
  }

  return normalize(multiply(out, expDecay(n, 0.06)), 0.85);
}

// ----- 7. click (~30ms): tactile button click -----
function click() {
  const dur = 0.04;
  const n = Math.floor(dur * SR);
  const noiseBurst = multiply(noise(n), expDecay(n, 0.004));
  const tone = multiply(scale(sine(2200, n), 0.3), expDecay(n, 0.005));
  return normalize(mix(noiseBurst, tone), 0.75);
}

// ----- Render -----
const jobs = [
  ['door-clang.wav', doorClang()],
  ['flush.wav', flush()],
  ['ambient.wav', ambient()],
  ['reveal.wav', reveal()],
  ['paper-rustle.wav', paperRustle()],
  ['paper-rip.wav', paperRip()],
  ['click.wav', click()],
];

for (const [name, samples] of jobs) {
  const buf = writeWav(samples);
  await writeFile(path.join(outDir, name), buf);
  console.log(`wrote public/audio/${name} (${buf.length} bytes)`);
}
