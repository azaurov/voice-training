// Pure audio/speech metrics (no DOM) so they can be unit-tested in node.

/** RMS level of a float time-domain buffer, in dBFS (silence ≈ -100). */
export function rmsDb(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  const rms = Math.sqrt(s / buf.length);
  return rms > 1e-5 ? 20 * Math.log10(rms) : -100;
}

/**
 * YIN pitch detector. Returns { freq, prob } or { freq: 0, prob: 0 } when unvoiced.
 * Range limited to human speech/singing (60–800 Hz).
 */
export function yin(buf, sampleRate, threshold = 0.12) {
  const minF = 60, maxF = 800;
  const tauMin = Math.floor(sampleRate / maxF);
  const tauMax = Math.min(Math.floor(sampleRate / minF), Math.floor(buf.length / 2));
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < tauMax; i++) {
      const diff = buf[i] - buf[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  // cumulative mean normalised difference
  let running = 0;
  d[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += d[tau];
    d[tau] = running ? (d[tau] * tau) / running : 1;
  }
  let tau = -1;
  for (let t = tauMin; t < tauMax; t++) {
    if (d[t] < threshold) {
      while (t + 1 < tauMax && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return { freq: 0, prob: 0 };
  // parabolic interpolation
  const a = d[tau - 1] ?? d[tau], b = d[tau], c = d[tau + 1] ?? d[tau];
  const denom = 2 * (2 * b - c - a);
  const shift = denom ? (c - a) / denom : 0;
  const better = tau + shift;
  return { freq: sampleRate / better, prob: 1 - d[tau] };
}

export const hzToSemitone = hz => 12 * Math.log2(hz / 100);

/** Standard deviation of pitch in semitones. <~1.5 reads as monotone, 2.5–5 lively. */
export function semitoneStd(freqs) {
  const v = freqs.filter(f => f > 0).map(hzToSemitone);
  if (v.length < 5) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
}

const FILLER_RE = /\b(um+|uh+|er+|erm|ah+|like|you know|i mean|sort of|kind of|basically|actually|literally)\b/gi;
// "like", "actually" etc. are legitimate words; flagged as *possible* fillers only.
export function countFillers(text) {
  const found = {};
  for (const m of text.matchAll(FILLER_RE)) {
    const k = m[1].toLowerCase();
    found[k] = (found[k] || 0) + 1;
  }
  return found;
}

export function wordCount(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

/** Words/min over the last windowSec, from [{t (ms), n (words)}] events. */
export function rollingWpm(events, nowMs, windowSec = 20, startMs = 0) {
  const from = Math.max(nowMs - windowSec * 1000, startMs);
  const span = (nowMs - from) / 60000;
  if (span < 4 / 60) return 0; // need ≥4 s of data
  const words = events.filter(e => e.t >= from).reduce((a, e) => a + e.n, 0);
  return Math.round(words / span);
}

export function paceLabel(wpm) {
  if (!wpm) return '';
  if (wpm < 110) return 'slow';
  if (wpm <= 170) return 'good pace';
  return 'fast';
}

/**
 * Pause analysis from per-frame voiced flags. frames: [{t (ms), voiced}].
 * A pause = silence run ≥ minMs bounded by speech on both sides.
 */
export function findPauses(frames, minMs = 700) {
  const pauses = [];
  let silenceStart = null, seenSpeech = false;
  for (const f of frames) {
    if (f.voiced) {
      if (seenSpeech && silenceStart !== null && f.t - silenceStart >= minMs) {
        pauses.push({ start: silenceStart, ms: f.t - silenceStart });
      }
      seenSpeech = true;
      silenceStart = null;
    } else if (silenceStart === null) {
      silenceStart = f.t;
    }
  }
  return pauses;
}
