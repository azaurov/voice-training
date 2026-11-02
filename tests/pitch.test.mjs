import assert from 'node:assert/strict';
import { yin, rmsDb, semitoneStd, countFillers, rollingWpm, findPauses, paceLabel } from '../src/components/pitch.js';

const sr = 44100;
const tone = (f, n = 2048, amp = 0.5) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin(2 * Math.PI * f * i / sr));

// pitch accuracy across the speech range
for (const f of [110, 165, 220, 330, 440]) {
  const r = yin(tone(f), sr);
  assert.ok(Math.abs(r.freq - f) / f < 0.01, `yin ${f} Hz got ${r.freq}`);
  assert.ok(r.prob > 0.8);
}
// silence and noise are unvoiced
assert.equal(yin(new Float32Array(2048), sr).freq, 0);
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
assert.equal(yin(Float32Array.from({ length: 2048 }, rnd), sr).freq, 0, 'white noise must not yield a pitch');

// loudness
assert.ok(Math.abs(rmsDb(tone(200, 2048, 1)) - (-3.01)) < 0.1);
assert.equal(rmsDb(new Float32Array(10)), -100);

// monotone vs lively
assert.ok(semitoneStd(Array(50).fill(120)) < 0.01);
assert.ok(semitoneStd(Array.from({ length: 50 }, (_, i) => 100 + 40 * Math.sin(i / 4) + 40)) > 2.5);

// fillers
assert.deepEqual(countFillers('Um, so like, you know, it was uh good, um'), { um: 2, like: 1, 'you know': 1, uh: 1 });
assert.deepEqual(countFillers('a clean sentence'), {});

// pace
const ev = [{ t: 0, n: 30 }, { t: 10000, n: 30 }, { t: 20000, n: 30 }];
assert.equal(rollingWpm(ev, 20000, 20), 270); // 90 words in 20 s
assert.equal(rollingWpm([], 5000), 0);
assert.equal(rollingWpm([{ t: 100, n: 10 }], 2000), 0, 'under 4 s of data reports nothing');
assert.equal(rollingWpm([{ t: 0, n: 10 }, { t: 9000, n: 20 }], 10000, 20, 0), 180);
assert.equal(paceLabel(100), 'slow'); assert.equal(paceLabel(140), 'good pace'); assert.equal(paceLabel(200), 'fast');

// pauses: leading/trailing silence is NOT a pause; mid-speech gap ≥0.7s is
const frames = [];
for (let t = 0; t < 6000; t += 50) frames.push({ t, voiced: !(t < 500 || (t >= 2000 && t < 3000) || t >= 5000) });
const p = findPauses(frames);
assert.equal(p.length, 1); assert.equal(p[0].ms, 1000);
console.log('pitch.test: all passed');
