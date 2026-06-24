export class Timer {
  constructor(displayEl) {
    this._el = displayEl;
    this._interval = null;
    this.elapsed = 0;
  }

  start() {
    this.elapsed = 0;
    this._render();
    this._interval = setInterval(() => { this.elapsed++; this._render(); }, 1000);
  }

  stop() {
    clearInterval(this._interval);
    this._interval = null;
  }

  reset() {
    this.stop();
    this.elapsed = 0;
    this._render();
  }

  _render() {
    if (this._el) this._el.textContent = Timer.format(this.elapsed);
  }

  static format(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
