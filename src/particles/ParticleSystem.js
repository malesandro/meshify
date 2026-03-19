import { FINGERTIPS, FINGERS } from '../data/handTopology.js';

class Particle {
  constructor(x, y, color, size, pLife, pSize) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5 - 0.5;
    this.life = 1;
    this.decay = 0.008 / Math.max(0.3, pLife);
    this.size = size * pSize * (0.5 + Math.random() * 0.8);
    this.alpha = 0.7;
  }

  update() {
    this.life -= this.decay;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.size *= 0.995;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.globalAlpha = this.life * this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.3, this.size), 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export class ParticleSystem {
  constructor(maxParticles = 3000) {
    this._particles = [];
    this._maxParticles = maxParticles;
  }

  emitFromPoints(points, color, rate, baseSize, audioEnergy, config) {
    const density = config.pDensity * rate;
    const count = Math.floor(audioEnergy * density);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * points.length);
      const p = points[idx];
      this._particles.push(new Particle(p.x, p.y, color, baseSize, config.pLife, config.pSize));
    }
  }

  emitBurst(point, color, count, spread, size, config) {
    if (!point) return;
    for (let j = 0; j < count; j++) {
      const part = new Particle(point.x, point.y, color, size * 2, config.pLife, config.pSize);
      part.vx = (Math.random() - 0.5) * spread;
      part.vy = (Math.random() - 0.5) * spread;
      this._particles.push(part);
    }
  }

  emitBeatBurst(points, beatColor, baseSize, config) {
    // For face: burst from key points; for hands: burst from fingertips
    const burstPts = points.length > 100
      ? [points[10], points[152], points[33], points[263], points[61], points[291]]
      : points.filter((_, i) => FINGERTIPS.includes(i));

    burstPts.forEach((p) => {
      if (!p) return;
      this.emitBurst(p, beatColor, 5, 5, baseSize, config);
    });
  }

  emitFingerTrails(handPts, color, trailStrength, audioEnergy, config) {
    FINGERTIPS.forEach((ti) => {
      const p = handPts[ti];
      if (!p) return;
      const count = Math.floor(trailStrength * audioEnergy * 3) + 1;
      for (let i = 0; i < count; i++) {
        const part = new Particle(p.x, p.y, color, 1.5, config.pLife, config.pSize);
        part.vy = -0.5 - Math.random() * 1.5;
        part.vx = (Math.random() - 0.5) * 0.8;
        part.decay *= 0.6; // longer life for trails
        this._particles.push(part);
      }
    });

    // Joint trails (lighter)
    FINGERS.forEach((finger) => {
      finger.forEach((ji) => {
        const p = handPts[ji];
        if (!p || Math.random() > 0.3 * trailStrength) return;
        this._particles.push(new Particle(p.x, p.y, color + '88', 0.8, config.pLife, config.pSize));
      });
    });
  }

  update() {
    this._particles = this._particles.filter((p) => p.life > 0);
    if (this._particles.length > this._maxParticles) {
      this._particles.splice(0, this._particles.length - this._maxParticles);
    }
    this._particles.forEach((p) => p.update());
  }

  draw(ctx) {
    this._particles.forEach((p) => p.draw(ctx));
    ctx.globalAlpha = 1;
  }

  clear() {
    this._particles = [];
  }
}
