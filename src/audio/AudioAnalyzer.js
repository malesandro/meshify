export class AudioAnalyzer {
  constructor() {
    this._audioCtx = null;
    this._analyser = null;
    this._freqData = null;
    this._timeData = null;
    this._lastBeatTime = 0;
    this._state = { bass: 0, mid: 0, high: 0, vol: 0, energy: 0, beat: false };
  }

  async init(stream) {
    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this._analyser = this._audioCtx.createAnalyser();
    this._analyser.fftSize = 2048;
    this._analyser.smoothingTimeConstant = 0.8;
    this._audioCtx.createMediaStreamSource(stream).connect(this._analyser);
    this._freqData = new Uint8Array(this._analyser.frequencyBinCount);
    this._timeData = new Uint8Array(this._analyser.frequencyBinCount);
  }

  analyze(sensitivity) {
    if (!this._analyser) return;

    this._analyser.getByteFrequencyData(this._freqData);
    this._analyser.getByteTimeDomainData(this._timeData);

    const n = this._freqData.length;
    const s = sensitivity;
    let bS = 0, mS = 0, hS = 0;
    const bE = Math.floor(n * 0.08);
    const mE = Math.floor(n * 0.4);

    for (let i = 0; i < bE; i++) bS += this._freqData[i];
    for (let i = bE; i < mE; i++) mS += this._freqData[i];
    for (let i = mE; i < n; i++) hS += this._freqData[i];

    this._state.bass = Math.min(1, (bS / bE / 255) * s * 1.5);
    this._state.mid = Math.min(1, (mS / (mE - bE) / 255) * s * 1.8);
    this._state.high = Math.min(1, (hS / (n - mE) / 255) * s * 2.5);

    let rms = 0;
    for (let i = 0; i < this._timeData.length; i++) {
      const v = (this._timeData[i] - 128) / 128;
      rms += v * v;
    }
    this._state.vol = Math.min(1, Math.sqrt(rms / this._timeData.length) * 3 * s);
    this._state.energy = this._state.bass * 0.4 + this._state.mid * 0.35 + this._state.high * 0.25;

    const now = performance.now();
    if (this._state.bass > 0.5 && now - this._lastBeatTime > 200) {
      this._state.beat = true;
      this._lastBeatTime = now;
    } else {
      this._state.beat = false;
    }
  }

  get state() {
    return this._state;
  }

  getMood() {
    const e = this._state.energy;
    if (e > 0.7) return { label: 'Intense', color: '#ff5544', emoji: '\u{1F525}' };
    if (e > 0.4) return { label: 'Energetic', color: '#ffaa00', emoji: '\u26A1' };
    if (e > 0.15) return { label: 'Flowing', color: '#00cc66', emoji: '\u{1F30A}' };
    if (e > 0.04) return { label: 'Calm', color: '#4488ff', emoji: '\u{1F319}' };
    return { label: 'Silent', color: 'var(--dim)', emoji: '' };
  }

  destroy() {
    if (this._audioCtx) {
      this._audioCtx.close();
      this._audioCtx = null;
    }
    this._analyser = null;
  }
}
