import { AudioAnalyzer } from './audio/AudioAnalyzer.js';
import { HolisticManager } from './camera/HolisticManager.js';
import { FaceDeformation } from './deformation/FaceDeformation.js';
import { HandDeformation } from './deformation/HandDeformation.js';
import { ParticleSystem } from './particles/ParticleSystem.js';
import { RENDERERS } from './renderers/index.js';
import { F_CONTOURS } from './data/contours.js';
import * as handTopology from './data/handTopology.js';
import { initControls, getConfig, updateMeters } from './ui/Controls.js';
import { initPresetUI } from './ui/PresetUI.js';
import { PresetManager } from './presets/PresetManager.js';
import { ShareManager } from './sharing/ShareManager.js';
import { Recorder } from './capture/Recorder.js';
import { AdManager } from './monetization/Monetization.js';
import { Analytics } from './analytics/Analytics.js';
import { screenshot, createFPSCounter } from './utils.js';

// ── DOM ──
const video = document.getElementById('cam');
const canvas = document.getElementById('out');
const ctx = canvas.getContext('2d');
const W = 1280, H = 720;

// ── Modules ──
const audioAnalyzer = new AudioAnalyzer();
const holistic = new HolisticManager();
const faceDeform = new FaceDeformation();
const handDeform = new HandDeformation();
const particles = new ParticleSystem(3000);
const presetManager = new PresetManager();
const shareManager = new ShareManager(presetManager);
const recorder = new Recorder(canvas);
const adManager = new AdManager();
const analytics = new Analytics();

const contours = { F_CONTOURS };

let time = 0;
let updateFPS;

// ── Controls ──
initControls((filter) => {
  analytics.trackFilterChange(filter);
});

// ── Presets UI ──
initPresetUI(document.getElementById('preset-container'), presetManager);

// ── Capture buttons ──
document.getElementById('photoBtn').addEventListener('click', () => {
  screenshot(canvas);
});

document.getElementById('recBtn').addEventListener('click', () => {
  const btn = document.getElementById('recBtn');
  if (!recorder.isRecording) {
    recorder.start(30);
    btn.textContent = 'Stop';
    btn.classList.add('active');
  } else {
    recorder.stop();
    btn.textContent = 'Record';
    btn.classList.remove('active');
    analytics.trackRecording(0);
  }
});

document.getElementById('shareBtn').addEventListener('click', async () => {
  const ok = await shareManager.copyToClipboard();
  const btn = document.getElementById('shareBtn');
  btn.textContent = ok ? 'Copied!' : 'Failed';
  setTimeout(() => { btn.textContent = 'Share'; }, 1500);
  analytics.trackShare();
});

// ── Check for shared preset in URL ──
function loadURLPreset() {
  const params = new URLSearchParams(window.location.search);
  const preset = presetManager.fromURLParams(params);
  if (preset) presetManager.applyPreset(preset);
}

// ── Render loop ──
function loop() {
  requestAnimationFrame(loop);
  time += 0.016;

  const config = getConfig();

  // 1. Audio
  audioAnalyzer.analyze(config.moodSens);
  const audio = audioAnalyzer.state;

  // 2. Deformations
  faceDeform.update(audio, config);
  handDeform.update(audio, config);

  // 3. Fade trail
  ctx.fillStyle = `rgba(6,6,11,${0.2 + (1 - audio.energy) * 0.25})`;
  ctx.fillRect(0, 0, W, H);

  // 4. Beat flash
  if (faceDeform.state.pulse > 0.02) {
    ctx.fillStyle = config.cBeat;
    ctx.globalAlpha = faceDeform.state.pulse * 0.12;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // 5. Optional video feed
  if (config.showVideo && video.readyState >= 2) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    if (config.mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();
  }

  // 6. Mirror transform
  ctx.save();
  if (config.mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }

  // 7. Deform landmarks
  let facePts = [];
  if (holistic.faceLandmarks) {
    let cx = 0, cy = 0;
    holistic.faceLandmarks.forEach((p) => { cx += p.x * W; cy += p.y * H; });
    cx /= holistic.faceLandmarks.length;
    cy /= holistic.faceLandmarks.length;
    facePts = holistic.faceLandmarks.map((p, i) => faceDeform.deformPoint(p, i, cx, cy, W, H));

    if (config.showParticles) {
      particles.emitFromPoints(facePts, config.cParticles, 4, 1.2, audio.energy, config);
      if (audio.beat) particles.emitBeatBurst(facePts, config.cBeat, 1.2, config);
    }
  }

  let lhPts = null, rhPts = null;
  if (holistic.leftHandLandmarks) {
    lhPts = handDeform.deformHand(holistic.leftHandLandmarks, W, H);
    if (config.showParticles) {
      particles.emitFingerTrails(lhPts, config.cLeftHand, config.hTrails, audio.energy, config);
      particles.emitFromPoints(lhPts, config.cLeftHand, 2, 1, audio.energy, config);
      if (audio.beat) particles.emitBeatBurst(lhPts, config.cBeat, 1, config);
    }
  }
  if (holistic.rightHandLandmarks) {
    rhPts = handDeform.deformHand(holistic.rightHandLandmarks, W, H);
    if (config.showParticles) {
      particles.emitFingerTrails(rhPts, config.cRightHand, config.hTrails, audio.energy, config);
      particles.emitFromPoints(rhPts, config.cRightHand, 2, 1, audio.energy, config);
      if (audio.beat) particles.emitBeatBurst(rhPts, config.cBeat, 1, config);
    }
  }

  // 8. Particles (behind mesh)
  particles.update();
  particles.draw(ctx);

  // 9. Render active filter
  const deform = { ...faceDeform.state, ...handDeform.state };
  const renderer = RENDERERS[config.filter] || RENDERERS.wireframe;
  renderer({ ctx, facePts, leftHandPts: lhPts, rightHandPts: rhPts,
    audio, deform, config, contours, handTopology, canvas, time, W, H });

  ctx.restore();

  // 10. FPS + meters
  updateFPS();
  updateMeters(audio);
}

// ── Init ──
async function init() {
  const stat = document.getElementById('stat');
  try {
    stat.textContent = 'Starting mic...';
    const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    await audioAnalyzer.init(aStream);

    await holistic.init(video, (msg) => { stat.textContent = msg; });

    document.getElementById('ov').classList.add('hidden');

    updateFPS = createFPSCounter(document.getElementById('fps'));
    loadURLPreset();

    // Ads + analytics
    adManager.init();
    adManager.showSidebar();
    analytics.init();

    loop();
  } catch (e) {
    stat.textContent = '\u274C ' + e.message;
    console.error(e);
  }
}

document.getElementById('startBtn').addEventListener('click', init);
