import { springLerp } from './springs.js';
import { FINGERTIPS } from '../data/handTopology.js';

export class HandDeformation {
  constructor() {
    this._splay = 0;
    this._wave = 0;
    this._jitter = 0;
    this._pulse = 0;
    this._time = 0;
  }

  update(audioState, config) {
    this._time += 0.016;
    const sp = config.spring;

    const tHS = audioState.bass * config.hSplay * 25;
    const tHW = audioState.mid * config.hWave * 15;
    const tJ = audioState.high * config.dHigh * 12;
    const tP = audioState.beat ? config.dBeat * 0.15 : 0;

    this._splay = springLerp(this._splay, tHS, sp);
    this._wave = springLerp(this._wave, tHW, sp);
    this._jitter = springLerp(this._jitter, tJ, sp * 2);
    this._pulse = springLerp(this._pulse, tP, 0.15);

    if (!audioState.beat) this._pulse *= 0.88;
  }

  deformHand(landmarks, W, H) {
    const wrist = { x: landmarks[0].x * W, y: landmarks[0].y * H };

    return landmarks.map((p, i) => {
      let x = p.x * W;
      let y = p.y * H;

      // Splay: push away from wrist
      if (i > 0) {
        const dx = x - wrist.x;
        const dy = y - wrist.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        const fingerFactor = FINGERTIPS.includes(i) ? 1.0
          : (i % 4 === 3) ? 0.7
          : (i % 4 === 2) ? 0.4
          : 0.2;
        x += nx * this._splay * fingerFactor;
        y += ny * this._splay * fingerFactor;
      }

      // Wave: sinusoidal along fingers
      const wp = this._time * 5 + i * 0.4;
      x += Math.sin(wp) * this._wave * (i > 0 ? 1 : 0.2);
      y += Math.cos(wp * 0.8) * this._wave * 0.5 * (i > 0 ? 1 : 0.2);

      // Jitter (80% of face intensity)
      x += (Math.random() - 0.5) * this._jitter * 0.8;
      y += (Math.random() - 0.5) * this._jitter * 0.8;

      // Pulse
      x = wrist.x + (x - wrist.x) * (1 + this._pulse);
      y = wrist.y + (y - wrist.y) * (1 + this._pulse);

      return { x, y, z: p.z || 0 };
    });
  }

  get state() {
    return {
      handSplay: this._splay,
      handWave: this._wave,
    };
  }
}
