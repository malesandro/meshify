import { springLerp } from './springs.js';

export class FaceDeformation {
  constructor() {
    this._expand = 0;
    this._wobble = 0;
    this._jitter = 0;
    this._pulse = 0;
    this._time = 0;
  }

  update(audioState, config) {
    this._time += 0.016;
    const sp = config.spring;

    const tE = audioState.bass * config.dBass * 35;
    const tW = audioState.mid * config.dMid * 20;
    const tJ = audioState.high * config.dHigh * 12;
    const tP = audioState.beat ? config.dBeat * 0.15 : 0;

    this._expand = springLerp(this._expand, tE, sp);
    this._wobble = springLerp(this._wobble, tW, sp);
    this._jitter = springLerp(this._jitter, tJ, sp * 2);
    this._pulse = springLerp(this._pulse, tP, 0.15);

    if (!audioState.beat) this._pulse *= 0.88;
  }

  deformPoint(p, index, centerX, centerY, W, H) {
    let x = p.x * W;
    let y = p.y * H;

    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    // Expand (bass)
    x += nx * this._expand * (0.5 + dist / 200);
    y += ny * this._expand * (0.5 + dist / 200);

    // Wobble (mid)
    const wp = this._time * 6 + index * 0.15;
    x += Math.sin(wp) * this._wobble * (dist / 150);
    y += Math.cos(wp * 0.7) * this._wobble * 0.6 * (dist / 150);

    // Jitter (high)
    x += (Math.random() - 0.5) * this._jitter;
    y += (Math.random() - 0.5) * this._jitter;

    // Pulse (beat)
    x = centerX + (x - centerX) * (1 + this._pulse);
    y = centerY + (y - centerY) * (1 + this._pulse);

    return { x, y, z: p.z };
  }

  get state() {
    return {
      expand: this._expand,
      wobble: this._wobble,
      jitter: this._jitter,
      pulse: this._pulse,
    };
  }
}
