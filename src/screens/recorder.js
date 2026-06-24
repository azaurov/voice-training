import { Timer } from '../components/timer.js';
import { Visualizer } from '../components/visualizer.js';
import { CATEGORY_META } from '../data/prompts.js';
import { saveRecording, getRecordingsForPrompt, deleteRecording } from '../db/recordings.js';
import { getCurrentProfileId } from '../auth/profiles.js';

export class RecorderScreen {
  constructor(el, { router }) {
    this._el = el;
    this._router = router;
    this._timer = new Timer(el.querySelector('#timer'));
    this._viz = new Visualizer(el.querySelector('#visualizer'));

    this._mediaRecorder = null;
    this._audioChunks = [];
    this._isRecording = false;
    this._isPlaying = false;
    this._currentAudio = null;
    this._category = null;
    this._prompt = null;

    this._bindControls();
  }

  show({ category, prompt }) {
    this._category = category;
    this._prompt = prompt;
    this._el.classList.add('active');
    this._resetState();
    this._renderPrompt();
    this._loadRecordings();
  }

  hide() {
    this._el.classList.remove('active');
    this._stopRecording(false);
    this._stopAudio();
  }

  _bindControls() {
    this._el.querySelector('#back-recorder').addEventListener('click', () => {
      this._router.navigate('list', { category: this._category });
    });

    this._el.querySelector('#btn-record').addEventListener('click', () => {
      if (this._isRecording) this._stopRecording(true);
      else this._startRecording();
    });

    this._el.querySelector('#btn-play').addEventListener('click', () => {
      if (this._isPlaying) { this._stopAudio(); return; }
      if (this._lastBlob) this._playBlob(this._lastBlob, this._el.querySelector('#btn-play'));
    });

    this._el.querySelector('#btn-discard').addEventListener('click', () => {
      this._stopAudio();
      this._lastBlob = null;
      this._el.querySelector('#btn-play').disabled = true;
      this._el.querySelector('#btn-discard').disabled = true;
      this._timer.reset();
      this._setStatus('Recording discarded.');
    });
  }

  _renderPrompt() {
    const meta = CATEGORY_META[this._category];
    this._el.querySelector('#rec-category').textContent = meta.label;
    this._el.querySelector('#rec-title').textContent = this._prompt.title;
    this._el.querySelector('#rec-text').textContent = this._prompt.text;
    this._el.querySelector('#rec-tip').textContent = this._prompt.tip;
    this._el.querySelector('#rec-target').textContent = `Target: ${Timer.format(this._prompt.duration)}`;
  }

  _resetState() {
    this._stopAudio();
    this._isRecording = false;
    this._lastBlob = null;
    this._el.querySelector('#btn-record').textContent = '🎙';
    this._el.querySelector('#btn-record').classList.remove('recording');
    this._el.querySelector('#timer').classList.remove('recording');
    this._el.querySelector('#btn-play').disabled = true;
    this._el.querySelector('#btn-discard').disabled = true;
    this._timer.reset();
    this._setStatus('');
  }

  async _startRecording() {
    this._setStatus('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';

      this._audioChunks = [];
      this._mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this._mediaRecorder.ondataavailable = e => { if (e.data.size > 0) this._audioChunks.push(e.data); };
      this._mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        this._finalise(mimeType || 'audio/webm');
      };

      this._mediaRecorder.start(100);
      this._isRecording = true;
      this._viz.start(stream);
      this._timer.start();

      this._el.querySelector('#btn-record').classList.add('recording');
      this._el.querySelector('#btn-record').textContent = '⏹';
      this._el.querySelector('#timer').classList.add('recording');
      this._el.querySelector('#btn-play').disabled = true;
      this._el.querySelector('#btn-discard').disabled = true;
      this._setStatus('Recording… speak clearly into your microphone.');
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow mic access and try again.'
        : `Mic error: ${err.message}`;
      this._setStatus(msg, 'error');
    }
  }

  _stopRecording(save) {
    if (!this._isRecording) return;
    this._isRecording = false;
    this._viz.stop();
    this._timer.stop();

    this._el.querySelector('#btn-record').classList.remove('recording');
    this._el.querySelector('#btn-record').textContent = '🎙';
    this._el.querySelector('#timer').classList.remove('recording');

    if (save && this._mediaRecorder) {
      this._mediaRecorder.stop();
    } else if (this._mediaRecorder) {
      try { this._mediaRecorder.stream?.getTracks().forEach(t => t.stop()); } catch {}
    }
  }

  async _finalise(mimeType) {
    const blob = new Blob(this._audioChunks, { type: mimeType });
    this._lastBlob = blob;

    const elapsed = this._timer.elapsed;
    const userId = getCurrentProfileId();
    const promptId = this._prompt.id;

    const existing = await getRecordingsForPrompt(userId, promptId);
    const rec = {
      id: crypto.randomUUID(),
      userId,
      promptId,
      category: this._category,
      label: `Take ${existing.length + 1}`,
      blob,
      mimeType,
      duration: elapsed,
      timestamp: Date.now(),
      wpm: this._category === 'reading' ? this._calcWPM(this._prompt.text, elapsed) : null
    };

    await saveRecording(rec);
    this._loadRecordings();

    this._el.querySelector('#btn-play').disabled = false;
    this._el.querySelector('#btn-discard').disabled = false;

    const target = this._prompt.duration;
    const diff = elapsed - target;
    let feedback;
    if (elapsed < 5) {
      feedback = 'Recording saved.';
    } else if (Math.abs(diff) <= 10) {
      feedback = `Excellent pacing! Right on target (${Timer.format(elapsed)}).`;
    } else if (diff < 0) {
      feedback = `${Timer.format(elapsed)} recorded — ${Timer.format(-diff)} short of target. Try to expand.`;
    } else {
      feedback = `${Timer.format(elapsed)} recorded — ${Timer.format(diff)} over target. Try to be more concise.`;
    }
    this._setStatus(feedback, 'success');
  }

  async _loadRecordings() {
    const userId = getCurrentProfileId();
    if (!userId) return;

    const records = await getRecordingsForPrompt(userId, this._prompt.id);
    const section = this._el.querySelector('#recordings-section');
    const list = this._el.querySelector('#recordings-list');

    if (records.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';
    list.innerHTML = '';

    records.forEach(rec => {
      const el = document.createElement('div');
      el.className = 'recording-entry';
      const wpmBadge = rec.wpm ? ` · ${rec.wpm} WPM` : '';
      const date = new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `
        <div class="rec-info">
          <div class="rec-label">${rec.label}</div>
          <div class="rec-meta">${date} · ${Timer.format(rec.duration)}${wpmBadge}</div>
        </div>
        <div class="rec-actions">
          <button class="btn-icon play-rec" title="Play">▶</button>
          <button class="btn-icon danger del-rec" title="Delete">✕</button>
        </div>`;

      const playBtn = el.querySelector('.play-rec');
      el.querySelector('.del-rec').addEventListener('click', async () => {
        await deleteRecording(rec.id);
        this._loadRecordings();
      });
      playBtn.addEventListener('click', () => this._playBlob(rec.blob, playBtn));

      list.appendChild(el);
    });
  }

  _playBlob(blob, btn) {
    this._stopAudio();
    const url = URL.createObjectURL(blob);
    this._currentAudio = new Audio(url);
    this._currentAudio.onended = () => {
      this._isPlaying = false;
      btn.textContent = '▶';
      URL.revokeObjectURL(url);
    };
    this._currentAudio.play();
    this._isPlaying = true;
    btn.textContent = '⏸';
  }

  _stopAudio() {
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio.currentTime = 0;
      this._currentAudio = null;
    }
    this._isPlaying = false;
    const playBtn = this._el.querySelector('#btn-play');
    if (playBtn) playBtn.textContent = '▶';
  }

  _setStatus(msg, type = '') {
    const el = this._el.querySelector('#status');
    el.textContent = msg;
    el.className = 'status-bar' + (type ? ' ' + type : '');
  }

  _calcWPM(text, secs) {
    if (secs < 5) return null;
    return Math.round((text.trim().split(/\s+/).length / secs) * 60);
  }
}
