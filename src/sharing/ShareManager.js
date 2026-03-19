import { getConfig } from '../ui/Controls.js';

export class ShareManager {
  constructor(presetManager) {
    this._presetManager = presetManager;
  }

  generateShareURL() {
    const config = getConfig();
    const preset = {
      filter: config.filter,
      face: { dBass: config.dBass, dMid: config.dMid, dHigh: config.dHigh, dBeat: config.dBeat },
      hands: { hSplay: config.hSplay, hWave: config.hWave, hTrails: config.hTrails },
      physics: { spring: config.spring, moodSens: config.moodSens },
      particles: { density: config.pDensity, life: config.pLife, size: config.pSize },
      rendering: { lineW: config.lineW, glow: config.glow },
      colors: {
        face: config.cFace, leftHand: config.cLeftHand, rightHand: config.cRightHand,
        beat: config.cBeat, particles: config.cParticles,
      },
    };
    const params = this._presetManager.toURLParams(preset);
    return `${window.location.origin}/app?${params}`;
  }

  async copyToClipboard() {
    const url = this.generateShareURL();
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }
}
