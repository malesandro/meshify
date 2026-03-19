const $ = (id) => document.getElementById(id);
const V = (id) => parseFloat($(id).value);
const C = (id) => $(id).value;
const T = (id) => $(id).classList.contains('on');

export function initControls(onFilterChange) {
  // Wire sliders to show values
  document.querySelectorAll('input[type="range"]').forEach((el) => {
    const vEl = $('v_' + el.id);
    if (vEl) el.addEventListener('input', () => { vEl.textContent = el.value; });
  });

  // Wire filter buttons
  document.querySelectorAll('.fb[data-f]').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.fb[data-f]').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      if (onFilterChange) onFilterChange(b.dataset.f);
    });
  });

  // Wire toggles
  document.querySelectorAll('.tgl').forEach((el) => {
    el.addEventListener('click', () => { el.classList.toggle('on'); });
  });
}

export function getConfig() {
  return {
    filter: document.querySelector('.fb[data-f].active')?.dataset.f || 'wireframe',
    dBass: V('dB'), dMid: V('dM'), dHigh: V('dH'), dBeat: V('dP'),
    hSplay: V('hS'), hWave: V('hW'), hTrails: V('hT'),
    spring: V('sp'), moodSens: V('ms'),
    pDensity: V('pD'), pLife: V('pL'), pSize: V('pS'),
    lineW: V('lw'), glow: V('gl'),
    cFace: C('cF'), cLeftHand: C('cL'), cRightHand: C('cR'),
    cBeat: C('cBt'), cParticles: C('cP'),
    showVideo: T('tV'), showPoints: T('tPt'), showMesh: T('tMs'),
    showParticles: T('tPa'), mirror: T('tMi'),
  };
}

export function updateMeters(audioState) {
  $('mB').style.width = (audioState.bass * 100) + '%';
  $('mM').style.width = (audioState.mid * 100) + '%';
  $('mH').style.width = (audioState.high * 100) + '%';
  $('mN').style.width = (audioState.energy * 100) + '%';

  const md = $('mood');
  const e = audioState.energy;
  if (e > 0.7) {
    md.textContent = '\u{1F525} Intense';
    md.style.background = 'rgba(255,50,50,0.2)';
    md.style.color = '#ff5544';
  } else if (e > 0.4) {
    md.textContent = '\u26A1 Energetic';
    md.style.background = 'rgba(255,170,0,0.15)';
    md.style.color = '#ffaa00';
  } else if (e > 0.15) {
    md.textContent = '\u{1F30A} Flowing';
    md.style.background = 'rgba(0,200,100,0.12)';
    md.style.color = '#00cc66';
  } else if (e > 0.04) {
    md.textContent = '\u{1F319} Calm';
    md.style.background = 'rgba(50,100,255,0.12)';
    md.style.color = '#4488ff';
  } else {
    md.textContent = 'Silent';
    md.style.background = 'var(--edge)';
    md.style.color = 'var(--dim)';
  }
}

export function applyConfig(config) {
  const setSlider = (id, val) => {
    const el = $(id);
    if (el && val !== undefined) {
      el.value = val;
      const vEl = $('v_' + id);
      if (vEl) vEl.textContent = val;
    }
  };
  const setColor = (id, val) => {
    const el = $(id);
    if (el && val) el.value = val;
  };
  const setToggle = (id, val) => {
    const el = $(id);
    if (!el || val === undefined) return;
    if (val) el.classList.add('on');
    else el.classList.remove('on');
  };

  // Filter
  if (config.filter) {
    document.querySelectorAll('.fb[data-f]').forEach((b) => {
      b.classList.toggle('active', b.dataset.f === config.filter);
    });
  }

  setSlider('dB', config.dBass);
  setSlider('dM', config.dMid);
  setSlider('dH', config.dHigh);
  setSlider('dP', config.dBeat);
  setSlider('hS', config.hSplay);
  setSlider('hW', config.hWave);
  setSlider('hT', config.hTrails);
  setSlider('sp', config.spring);
  setSlider('ms', config.moodSens);
  setSlider('pD', config.pDensity);
  setSlider('pL', config.pLife);
  setSlider('pS', config.pSize);
  setSlider('lw', config.lineW);
  setSlider('gl', config.glow);
  setColor('cF', config.cFace);
  setColor('cL', config.cLeftHand);
  setColor('cR', config.cRightHand);
  setColor('cBt', config.cBeat);
  setColor('cP', config.cParticles);
  setToggle('tV', config.showVideo);
  setToggle('tPt', config.showPoints);
  setToggle('tMs', config.showMesh);
  setToggle('tPa', config.showParticles);
  setToggle('tMi', config.mirror);
}
