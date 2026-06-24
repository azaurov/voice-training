export class Visualizer {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._analyser = null;
    this._raf = null;
    this._audioCtx = null;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const wrap = this._canvas.parentElement;
    if (wrap) this._canvas.width = wrap.clientWidth;
  }

  async start(stream) {
    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this._analyser = this._audioCtx.createAnalyser();
    this._analyser.fftSize = 256;
    this._audioCtx.createMediaStreamSource(stream).connect(this._analyser);
    this._draw();
  }

  stop() {
    cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._audioCtx) { this._audioCtx.close(); this._audioCtx = null; }
    this._analyser = null;
    this._clear();
  }

  _draw() {
    const { _canvas: canvas, _ctx: ctx, _analyser: analyser } = this;
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const frame = () => {
      this._raf = requestAnimationFrame(frame);
      analyser.getByteFrequencyData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / buf.length * 2.5;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const h = (buf[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(109,99,255,${0.4 + (buf[i] / 255) * 0.6})`;
        ctx.fillRect(x, canvas.height - h, barW - 1, h);
        x += barW;
      }
    };
    frame();
  }

  _clear() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }
}
