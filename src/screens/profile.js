import {
  getProfiles, createProfile, deleteProfile,
  setCurrentProfileId, getCurrentProfileId,
  PROFILE_EMOJIS
} from '../auth/profiles.js';
import { getUserRecordingCount } from '../db/recordings.js';

export class ProfileScreen {
  constructor(el, { router }) {
    this._el = el;
    this._router = router;
    this._selectedEmoji = PROFILE_EMOJIS[0];
    this._bind();
  }

  show() {
    this._el.classList.add('active');
    this._render();
  }

  hide() {
    this._el.classList.remove('active');
  }

  _bind() {
    this._el.querySelector('#btn-add-profile').addEventListener('click', () => this._showForm());
    this._el.querySelector('#btn-cancel-create').addEventListener('click', () => this._hideForm());
    this._el.querySelector('#btn-save-profile').addEventListener('click', () => this._saveProfile());
    this._el.querySelector('#profile-name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._saveProfile();
    });
    this._buildEmojiPicker();
  }

  _buildEmojiPicker() {
    const picker = this._el.querySelector('#emoji-picker');
    PROFILE_EMOJIS.forEach((emoji, i) => {
      const btn = document.createElement('button');
      btn.className = 'emoji-btn' + (i === 0 ? ' selected' : '');
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        picker.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._selectedEmoji = emoji;
      });
      picker.appendChild(btn);
    });
  }

  _render() {
    const profiles = getProfiles();
    const listEl = this._el.querySelector('#profile-list');
    const addBtn = this._el.querySelector('#btn-add-profile');
    listEl.innerHTML = '';

    if (profiles.length === 0) {
      this._showForm();
      addBtn.style.display = 'none';
      return;
    }

    addBtn.style.display = '';
    this._hideForm();

    profiles.forEach(profile => {
      const card = document.createElement('div');
      card.className = 'profile-card' + (profile.id === getCurrentProfileId() ? ' active-profile' : '');
      card.innerHTML = `
        <div class="profile-avatar">${profile.emoji}</div>
        <div class="profile-info">
          <div class="profile-name">${this._esc(profile.name)}</div>
          <div class="profile-meta" data-uid="${profile.id}">Loading...</div>
        </div>
        <button class="btn-icon danger del-profile" data-id="${profile.id}" title="Delete profile">✕</button>`;

      card.addEventListener('click', e => {
        if (e.target.closest('.del-profile')) return;
        setCurrentProfileId(profile.id);
        this._router.navigate('home');
      });

      card.querySelector('.del-profile').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Delete profile "${profile.name}"? All recordings will stay in the browser but won't be accessible.`)) {
          deleteProfile(profile.id);
          this._render();
        }
      });

      listEl.appendChild(card);

      getUserRecordingCount(profile.id).then(count => {
        const meta = listEl.querySelector(`[data-uid="${profile.id}"]`);
        if (meta) meta.textContent = count === 0 ? 'No recordings yet' : `${count} recording${count !== 1 ? 's' : ''}`;
      });
    });
  }

  _showForm() {
    this._el.querySelector('#profile-list-section').style.display = 'none';
    this._el.querySelector('#profile-create-section').style.display = '';
    this._el.querySelector('#profile-name-input').value = '';
    this._el.querySelector('#profile-name-input').focus();
    this._el.querySelector('#create-error').textContent = '';
  }

  _hideForm() {
    this._el.querySelector('#profile-list-section').style.display = '';
    this._el.querySelector('#profile-create-section').style.display = 'none';
  }

  _saveProfile() {
    const name = this._el.querySelector('#profile-name-input').value.trim();
    if (!name) {
      this._el.querySelector('#create-error').textContent = 'Please enter your name.';
      return;
    }
    createProfile(name, this._selectedEmoji);
    this._router.navigate('home');
  }

  _esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}
