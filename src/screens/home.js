import { PROMPTS, CATEGORY_META } from '../data/prompts.js';
import { getCurrentProfile, setCurrentProfileId } from '../auth/profiles.js';

export class HomeScreen {
  constructor(el, { router }) {
    this._el = el;
    this._router = router;
  }

  show() {
    this._el.classList.add('active');
    this._renderUser();
  }

  hide() {
    this._el.classList.remove('active');
  }

  _renderUser() {
    const profile = getCurrentProfile();
    const userEl = this._el.querySelector('#home-user');
    if (profile) {
      userEl.innerHTML = `
        <span class="user-chip">
          <span>${profile.emoji}</span>
          <span>${this._esc(profile.name)}</span>
          <button class="btn-switch" title="Switch profile">Switch</button>
        </span>`;
      userEl.querySelector('.btn-switch').addEventListener('click', () => {
        setCurrentProfileId(null);
        this._router.navigate('profile');
      });
    } else {
      userEl.innerHTML = '';
    }
  }

  _esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}

export function bindHomeCards(el, router) {
  el.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.cat;
      const count = PROMPTS[cat].length;
      card.querySelector('.count').textContent = `${count} prompt${count !== 1 ? 's' : ''}`;
      router.navigate('list', { category: cat });
    });
  });
}
