const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SITE_URL = 'https://azaurov.github.io/voice-training/';
const SITE_NAME = 'Voice Training';

export const FREE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free',           label: 'Gemini 2.0 Flash — Google' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',     label: 'Llama 3.3 70B — Meta' },
  { id: 'mistralai/mistral-7b-instruct:free',          label: 'Mistral 7B' },
  { id: 'deepseek/deepseek-r1:free',                   label: 'DeepSeek R1' },
];

function getSettings() {
  try { return JSON.parse(localStorage.getItem('vt_settings') || '{}'); } catch { return {}; }
}

export function getApiKey()      { return getSettings().openrouterKey || ''; }
export function getSelectedModel() { return getSettings().aiModel || FREE_MODELS[0].id; }
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
