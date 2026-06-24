let _utter = null;

export function speak(text, { onEnd } = {}) {
  stop();
  if (!('speechSynthesis' in window)) return;
  _utter = new SpeechSynthesisUtterance(text);
  _utter.rate = 0.92;
  _utter.pitch = 1.0;
  if (onEnd) _utter.onend = onEnd;

  // Prefer an English network voice for better quality; fall back to any English voice
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith('en') && !v.localService)
             || voices.find(v => v.lang.startsWith('en'))
             || null;
  if (voice) _utter.voice = voice;

  speechSynthesis.speak(_utter);
}

export function stop() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  _utter = null;
}

export function isSpeaking() {
  return 'speechSynthesis' in window && speechSynthesis.speaking;
}

export function isSupported() {
  return 'speechSynthesis' in window;
}

export function feedbackToSpeech(fb) {
  const strengths   = fb.strengths?.join('. ') || '';
  const improvements = fb.improvements?.join('. ') || '';
  return `Overall: ${fb.overall}. Strengths: ${strengths}. To improve: ${improvements}. Key tip: ${fb.tip}`;
}
