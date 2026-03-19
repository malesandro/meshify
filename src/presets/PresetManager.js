import { applyConfig } from '../ui/Controls.js';

export class PresetManager {
  constructor() {
    this._cache = {};
  }

  async loadBuiltIn(name) {
    if (this._cache[name]) return this._cache[name];
    const res = await fetch(`/presets/${name}.json`);
    if (!res.ok) throw new Error(`Preset "${name}" not found`);
    const preset = await res.json();
    this._cache[name] = preset;
    return preset;
  }

  applyPreset(preset) {
    const config = {};
    if (preset.filter) config.filter = preset.filter;
    if (preset.face) {
      config.dBass = preset.face.dBass;
      config.dMid = preset.face.dMid;
      config.dHigh = preset.face.dHigh;
      config.dBeat = preset.face.dBeat;
    }
    if (preset.hands) {
      config.hSplay = preset.hands.hSplay;
      config.hWave = preset.hands.hWave;
      config.hTrails = preset.hands.hTrails;
    }
    if (preset.physics) {
      config.spring = preset.physics.spring;
      config.moodSens = preset.physics.moodSens;
    }
    if (preset.particles) {
      config.pDensity = preset.particles.density;
      config.pLife = preset.particles.life;
      config.pSize = preset.particles.size;
    }
    if (preset.rendering) {
      config.lineW = preset.rendering.lineW;
      config.glow = preset.rendering.glow;
    }
    if (preset.colors) {
      config.cFace = preset.colors.face;
      config.cLeftHand = preset.colors.leftHand;
      config.cRightHand = preset.colors.rightHand;
      config.cBeat = preset.colors.beat;
      config.cParticles = preset.colors.particles;
    }
    applyConfig(config);
  }

  async loadAndApply(name) {
    const preset = await this.loadBuiltIn(name);
    this.applyPreset(preset);
    return preset;
  }

  exportCurrent(getConfigFn) {
    const c = getConfigFn();
    return JSON.stringify({
      name: 'Custom',
      author: 'user',
      version: 1,
      filter: c.filter,
      face: { dBass: c.dBass, dMid: c.dMid, dHigh: c.dHigh, dBeat: c.dBeat },
      hands: { hSplay: c.hSplay, hWave: c.hWave, hTrails: c.hTrails },
      physics: { spring: c.spring, moodSens: c.moodSens },
      particles: { density: c.pDensity, life: c.pLife, size: c.pSize },
      rendering: { lineW: c.lineW, glow: c.glow },
      colors: {
        face: c.cFace, leftHand: c.cLeftHand, rightHand: c.cRightHand,
        beat: c.cBeat, particles: c.cParticles,
      },
    }, null, 2);
  }

  toURLParams(preset) {
    return new URLSearchParams({ p: btoa(JSON.stringify(preset)) }).toString();
  }

  fromURLParams(params) {
    const encoded = params.get('p');
    if (!encoded) return null;
    try {
      return JSON.parse(atob(encoded));
    } catch {
      return null;
    }
  }
}
