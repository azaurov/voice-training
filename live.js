import { rmsDb, yin, semitoneStd, countFillers, wordCount, rollingWpm, paceLabel, findPauses } from './src/components/pitch.js';

const $ = id => document.getElementById(id);
const canvas = $('live-canvas'), ctx = canvas.getContext('2d');
const WINDOW_MS = 12000;           // visible history
const VOICED_DB = -45;             // below this = silence
const FMIN = 70, FMAX = 400;       // pitch axis (Hz, log)

let audioCtx, analyser, stream, raf, rec;
let running = false, startMs = 0;
let frames = [];                   // {t, db, hz, voiced}
let wordEvents = [], finalText = '', interimText = '';
const buf = new Float32Array(2048);

function sizeCanvas() {
  const w = canvas.parentElement.clientWidth, dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = 220 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', sizeCanvas); sizeCanvas();

const yOfHz = hz => { const H = 150; const a = Math.log(FMIN), b = Math.log(FMAX); return H - ((Math.log(hz) - a) / (b - a)) * H; };

function draw(now) {
  const W = canvas.clientWidth, H = 220, PH = 150;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '10px system-ui';
  for (const hz of [100, 200, 300]) { const y = yOfHz(hz); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.fillText(hz + ' Hz', 4, y - 2); }
  const x = t => W - ((now - t) / WINDOW_MS) * W;
  const vis = frames.filter(f => now - f.t <= WINDOW_MS);
  // pause shading (silence ≥0.7 s after speech has begun)
  for (const p of findPauses(frames)) {
    if (now - (p.start + p.ms) > WINDOW_MS) continue;
    ctx.fillStyle = 'rgba(239,68,68,.25)'; ctx.fillRect(x(p.start), 0, (p.ms / WINDOW_MS) * W, PH);
  }
  // pitch contour
  ctx.strokeStyle = '#6D63FF'; ctx.lineWidth = 2.5; ctx.beginPath(); let pen = false;
  for (const f of vis) {
    if (f.hz > 0 && f.hz >= FMIN && f.hz <= FMAX) { pen ? ctx.lineTo(x(f.t), yOfHz(f.hz)) : ctx.moveTo(x(f.t), yOfHz(f.hz)); pen = true; } else pen = false;
  }
  ctx.stroke();
  // loudness strip along the bottom
  ctx.fillStyle = '#22C55E';
  for (const f of vis) { const h = Math.max(0, Math.min(1, (f.db + 60) / 50)) * 56; ctx.globalAlpha = .75; ctx.fillRect(x(f.t), H - h, 3, h); }
  ctx.globalAlpha = 1;
}

function tick() {
  raf = requestAnimationFrame(tick);
  const now = performance.now() - startMs;
  analyser.getFloatTimeDomainData(buf);
  const db = rmsDb(buf);
  const voiced = db > VOICED_DB;
  const p = voiced ? yin(buf, audioCtx.sampleRate) : { freq: 0 };
  frames.push({ t: now, db, hz: p.freq, voiced });
  if (frames.length > 60 * 60 * 5) frames.splice(0, frames.length - 60 * 60 * 5);
  draw(now);
  updateStats(now);
}

let lastStat = 0;
function updateStats(now) {
  if (now - lastStat < 300) return; lastStat = now;
  const wpm = rollingWpm(wordEvents, now, 20, 0);
  $('st-wpm').textContent = wpm || '–'; $('st-pace').textContent = paceLabel(wpm) ? '· ' + paceLabel(wpm) : '';
  const fills = countFillers(finalText); $('st-fill').textContent = Object.values(fills).reduce((a, b) => a + b, 0);
  $('st-pause').textContent = findPauses(frames).length;
  const sd = semitoneStd(frames.filter(f => f.voiced).map(f => f.hz));
  $('st-var').textContent = sd ? sd.toFixed(1) : '–';
  $('st-varlabel').textContent = sd ? (sd < 1.5 ? '· flat' : sd < 2.5 ? '· moderate' : '· expressive') : '';
}

function renderTranscript() {
  const el = $('live-transcript');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const marked = esc(finalText).replace(/\b(um+|uh+|er+|erm|ah+|like|you know|i mean|sort of|kind of|basically|actually|literally)\b/gi, '<b>$1</b>');
  el.innerHTML = marked + (interimText ? ` <span class="interim">${esc(interimText)}</span>` : '') || 'Listening…';
  el.scrollTop = el.scrollHeight;
}

function startRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('live-status').textContent = 'Speech recognition not supported in this browser: pitch, loudness and pauses still work; pace and fillers need Chrome, Edge or Safari.'; return; }
  rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
  rec.onresult = e => {
    interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) { finalText += (finalText ? ' ' : '') + t.trim(); wordEvents.push({ t: performance.now() - startMs, n: wordCount(t) }); }
      else interimText += t;
    }
    renderTranscript();
  };
  rec.onerror = e => { if (e.error !== 'no-speech' && e.error !== 'aborted') $('live-status').textContent = 'Recognition: ' + e.error; };
  rec.onend = () => { if (running) { try { rec.start(); } catch {} } };   // Chrome stops after silence; keep going
  try { rec.start(); } catch {}
}

async function start() {
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
  catch (e) { $('live-status').textContent = 'Microphone unavailable: ' + e.message; return; }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048;
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  frames = []; wordEvents = []; finalText = ''; interimText = ''; startMs = performance.now(); running = true;
  $('live-summary').hidden = true; $('live-status').textContent = ''; $('live-transcript').textContent = 'Listening…';
  $('btn-live').classList.add('recording'); startRecognition(); tick();
}

function stop() {
  running = false; cancelAnimationFrame(raf); try { rec && rec.stop(); } catch {}
  stream && stream.getTracks().forEach(t => t.stop()); audioCtx && audioCtx.close();
  $('btn-live').classList.remove('recording');
  const secs = (performance.now() - startMs) / 1000, words = wordCount(finalText);
  const fills = countFillers(finalText), nf = Object.values(fills).reduce((a, b) => a + b, 0);
  const pauses = findPauses(frames), longest = pauses.reduce((m, p) => Math.max(m, p.ms), 0);
  const sd = semitoneStd(frames.filter(f => f.voiced).map(f => f.hz));
  const wpm = secs > 5 && words ? Math.round(words / (secs / 60)) : 0;
  const s = $('live-summary'); s.hidden = false;
  s.innerHTML = `<h2>Session summary</h2>
    Length ${secs.toFixed(0)} s · ${words} words${wpm ? ` · ${wpm} wpm (${paceLabel(wpm)})` : ''}<br>
    Possible fillers: ${nf}${nf ? ' (' + Object.entries(fills).map(([k, v]) => `${k} ×${v}`).join(', ') + ')' : ''}<br>
    Pauses ≥ 0.7 s: ${pauses.length}${longest ? `, longest ${(longest / 1000).toFixed(1)} s` : ''}<br>
    Pitch variety: ${sd ? sd.toFixed(1) + ' semitones' : 'not enough voiced audio'}`;
  window.__lastSession = { secs, words, wpm, fillers: fills, pauses: pauses.length, pitchStd: sd };
}

$('btn-live').addEventListener('click', () => (running ? stop() : start()));
