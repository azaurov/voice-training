const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SITE_URL = 'https://azaurov.github.io/voice-training/';
const SITE_NAME = 'Voice Training';

// Verified present in OpenRouter's public /models list on 2026-11-02. The free catalog turns
// over constantly: the previous four (gemini-2.0-flash-exp, llama-3.3-70b, mistral-7b, deepseek-r1) were all gone.
export const FREE_MODELS = [
  { id: 'google/gemma-4-31b-it:free',       label: 'Gemma 4 31B — Google' },
  { id: 'google/gemma-4-26b-a4b-it:free',   label: 'Gemma 4 26B — Google' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra — NVIDIA' },
];

function getSettings() {
  try { return JSON.parse(localStorage.getItem('vt_settings') || '{}'); } catch { return {}; }
}

export function getApiKey()      { return getSettings().openrouterKey || ''; }
// A saved model that no longer exists falls back to the default instead of failing every request.
export function getSelectedModel() {
  const saved = getSettings().aiModel;
  return FREE_MODELS.some(m => m.id === saved) ? saved : FREE_MODELS[0].id;
}
export function isTTSEnabled()   { return getSettings().ttsEnabled !== false; }

export function getModelLabel(modelId) {
  return FREE_MODELS.find(m => m.id === modelId)?.label || modelId;
}

export async function getAIFeedback({ category, promptTitle, promptText, duration, transcript }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No OpenRouter API key — go to Settings to add one (it\'s free).');

  const model = getSelectedModel();

  const systemPrompt = `You are an expert speech coach giving concise, encouraging feedback on a voice recording practice session. Respond ONLY with valid JSON matching exactly: {"overall":"2-3 sentence summary","strengths":["point1","point2"],"improvements":["suggestion1","suggestion2"],"tip":"one key takeaway"}. Keep each item under 30 words. Be specific and actionable.`;

  const durationStr = duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : 'unknown';
  const userPrompt = `Category: ${category}
Prompt title: "${promptTitle}"
${promptText ? `Prompt text: "${promptText.slice(0, 400)}"` : ''}
Recording duration: ${durationStr}
${transcript ? `Transcript: "${transcript.slice(0, 800)}"` : '(No transcript provided — give general coaching for this type of prompt)'}

Provide speech coaching feedback for this recording.`;

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Unexpected response format — try again.');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Structure-focused coaching for a live session. Grounded only in the transcript and the measured numbers.
 * metrics: { secs, words, wpm, fillers:{word:n}, pauses, longestPauseS, pitchStd }
 */
export async function getLiveFeedback({ transcript, metrics }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No OpenRouter API key — open Settings (⚙ on the home screen) and add a free one.');

  const systemPrompt = `You are a speech coach helping someone speak in a clearer, more organized way. You are given a speech-recognition transcript of a short spoken session plus measured delivery numbers. Judge ONLY what is in them; never invent content. The transcript is machine-generated and may contain recognition errors, so do not criticise odd words, spelling, accent or grammar. Words like "like" or "actually" may be legitimate, so treat the filler count as approximate. Assess structure: is there a clear main point, is the order logical, any tangents, restarts or unfinished sentences. Respond ONLY with valid JSON exactly like: {"overall":"2 sentences","structure":"2-3 sentences on main point, order, tangents","strengths":["..",".."],"improvements":["..",".."],"tip":"one concrete exercise to try next"}. Each list item under 30 words. Be specific, kind and actionable.`;

  const m = metrics || {};
  const fillers = Object.entries(m.fillers || {}).map(([k, v]) => `${k} x${v}`).join(', ') || 'none detected';
  const userPrompt = `Delivery numbers: ${Math.round(m.secs || 0)} seconds, ${m.words || 0} words${m.wpm ? `, ${m.wpm} words/min` : ''}. Possible fillers: ${fillers}. Pauses over 0.7 s: ${m.pauses || 0}${m.longestPauseS ? ` (longest ${m.longestPauseS} s)` : ''}. Pitch variety: ${m.pitchStd ? m.pitchStd.toFixed(1) + ' semitones (under 1.5 is flat, over 2.5 expressive)' : 'unknown'}.

Transcript:
"${String(transcript || '').slice(0, 2500)}"`;

  // Free models are routinely rate-limited upstream (429 "Provider returned error"), so try the chosen
  // model first, then the rest, falling through on 429/5xx/timeouts. Auth errors stop immediately.
  const chosen = getSelectedModel();
  const order = [chosen, ...FREE_MODELS.map(m => m.id).filter(id => id !== chosen)];
  let lastErr = 'No model answered.';
  for (const model of order) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 90000);
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': SITE_URL, 'X-Title': SITE_NAME, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 900, temperature: 0.6 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastErr = err.error?.message || `API error ${res.status}`;
        if (res.status === 401 || res.status === 403) throw new Error(lastErr);
        continue;
      }
      const text = (await res.json()).choices?.[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) { lastErr = 'The model replied in an unexpected format.'; continue; }
      let fb; try { fb = JSON.parse(match[0]); } catch { lastErr = 'The model replied in an unexpected format.'; continue; }
      fb._model = model;
      return fb;
    } catch (e) {
      if (e.name === 'AbortError') { lastErr = 'The model took too long.'; continue; }
      if (/^(API error|No OpenRouter)/.test(e.message) || e.message === lastErr) throw e;
      lastErr = e.message;                                    // network error: try the next model
    } finally { clearTimeout(timer); }
  }
  throw new Error(lastErr + ' All free models are busy right now. Try again in a minute.');
}
