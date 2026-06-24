import { PROMPTS, CATEGORY_META } from '../data/prompts.js';
import { Timer } from '../components/timer.js';

export class ListScreen {
  constructor(el, { router }) {
    this._el = el;
    this._router = router;
    this._el.querySelector('#back-list').addEventListener('click', () => router.navigate('home'));
  }

  show({ category }) {
    this._category = category;
    this._el.classList.add('active');
    this._render();
  }

  hide() {
    this._el.classList.remove('active');
  }

  _render() {
    const cat = this._category;
    const meta = CATEGORY_META[cat];
    const prompts = PROMPTS[cat];

    this._el.querySelector('#list-title').textContent = meta.label;

    const listEl = this._el.querySelector('#prompt-list');
    listEl.innerHTML = '';

    prompts.forEach(p => {
      const item = document.createElement('div');
      item.className = 'prompt-item';
      item.innerHTML = `
        <div class="prompt-item-text">
          <h4>${p.title}</h4>
          <div class="duration">Target: ${Timer.format(p.duration)}</div>
        </div>
        <span class="arrow">›</span>`;
      item.addEventListener('click', () => this._router.navigate('recorder', { category: cat, prompt: p }));
      listEl.appendChild(item);
    });
  }
}
