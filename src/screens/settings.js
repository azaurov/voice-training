import { FREE_MODELS } from '../services/ai.js';

export class SettingsScreen {
  constructor(el, { router }) {
    this._el = el;
    this._router = router;
    this._from = 'home';
    this._buildModelOptions();
    this._bindControls();
  }

  show({ from = 'home' } = {}) {
    this._from = from;
    this._el.classList.add('active');
    this._load();
  }

  hide() {
    this._el.classList.remove('active');
  }

  _load() {
    const s = this._settings();
    this._el.querySelector('#setting-api-key').value  = s.openrouterKey || '';
    this._el.querySelector('#setting-model').value    = s.aiModel || FREE_MODELS[0].id;
    this._el.querySelector('#setting-tts').checked    = s.ttsEnabled !== false;
    this._setStatus('');
  }

  _settings() {
    try { return JSON.parse(localStorage.getItem('vt_settings') || '{}'); } catch { return {}; }
  }

  _save() {
    const key   = this._el.querySelector('#setting-api-key').value.trim();
    const model = this._el.querySelector('#setting-model').value;
    const tts   = this._el.querySelector('#setting-tts').checked;
    localStorage.setItem('vt_settings', JSON.stringify({ openrouterKey: key, aiModel: model, ttsEnabled: tts }));
    this._setStatus('Settings saved.', 'success');
  }

  _buildModelOptions() {
    const sel = this._el.querySelector('#setting-model');
    sel.innerHTML = FREE_MODELS.map(m =>
      `<option value="${m.id}">${m.label} (Free)</option>`
    ).join('');
  }

  _setStatus(msg, type = '') {
    const el = this._el.querySelector('#settings-status');
    el.textContent = msg;
    el.className = 'status-bar' + (type ? ' ' + type : '');
  }

  _bindControls() {
    this._el.querySelector('#back-settings').addEventListener('click', () => {
      this._router.navigate(this._from);
    });
    this._el.querySelector('#btn-save-settings').addEventListener('click', () => this._save());
    this._el.querySelector('#setting-api-key').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._save();
    });
  }
}
