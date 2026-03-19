# CLAUDE.md — Face × Audio Reactive

## Product Vision

**Meshify** — a free browser-based tool that turns your webcam into a real-time audio-reactive face & hand visualizer. Users open the site, enable camera + mic, play music, and get a living digital mask that deforms with sound. Shareable clips, preset filters, and a community gallery. Monetized through non-intrusive ads and optional premium presets.

Target: musicians, streamers, content creators, VJs, TikTok/Reels creators who want instant visual content without installing anything.

**Live URL target**: meshify.app (or meshify.live)

---

## Tech Stack

- **Framework**: Vite + vanilla JS (ES Modules). NO React, NO frameworks. Raw performance matters for 60fps real-time rendering.
- **Tracking**: MediaPipe Holistic (face 468pts + hands 21pts each) loaded via CDN globals
- **Audio**: Web Audio API (AnalyserNode, FFT)
- **Rendering**: Canvas 2D (not WebGL — keeps it simple, portable, and fast enough)
- **Recording**: MediaRecorder API + canvas.captureStream() for WebM export
- **Hosting**: Vercel (static deploy, zero config)
- **Ads**: Google AdSense (sidebar + banner placements, never overlapping the canvas)
- **Analytics**: Plausible (privacy-friendly, no cookie banner needed in EU)

---

## Project Structure

```
meshify/
├── index.html                    # Landing page with start CTA
├── app.html                      # Main app page (camera + canvas)
├── package.json
├── vite.config.js
├── vercel.json                   # Routing rules
├── public/
│   ├── favicon.ico
│   ├── og-image.jpg              # Social share image (1200x630)
│   ├── manifest.json             # PWA manifest
│   └── presets/                  # JSON preset files
│       ├── acid-trip.json
│       ├── underwater.json
│       ├── heartbeat.json
│       ├── neon-dreams.json
│       ├── glitch-storm.json
│       └── zen.json
├── styles/
│   ├── landing.css               # Landing page styles
│   ├── app.css                   # App styles (extracted from current monolith)
│   └── shared.css                # Variables, reset, typography
└── src/
    ├── main.js                   # App entry: init, render loop, module orchestration
    ├── landing.js                # Landing page interactions
    ├── audio/
    │   └── AudioAnalyzer.js      # Mic input, FFT, band splitting, beat detection, mood
    ├── camera/
    │   └── HolisticManager.js    # Holistic init, stream, landmark extraction
    ├── deformation/
    │   ├── FaceDeformation.js    # Expand, wobble, jitter, pulse with spring physics
    │   ├── HandDeformation.js    # Splay, wave, per-finger deformation
    │   └── springs.js            # Shared spring interpolation math
    ├── particles/
    │   └── ParticleSystem.js     # Particle class, emit, update, draw, pool management
    ├── renderers/
    │   ├── RenderContext.js       # JSDoc type definition for render params
    │   ├── BaseRenderer.js        # drawContour, drawPoints, hexToRgb, lerpColor
    │   ├── WireframeRenderer.js
    │   ├── NeonRenderer.js
    │   ├── HologramRenderer.js
    │   ├── GlitchRenderer.js
    │   ├── ThermalRenderer.js
    │   ├── XrayRenderer.js
    │   └── index.js               # RENDERERS map export
    ├── capture/
    │   └── Recorder.js            # WebM recording with MediaRecorder
    ├── presets/
    │   └── PresetManager.js       # Load/save/apply/share presets (JSON + URL params)
    ├── sharing/
    │   └── ShareManager.js        # Generate share URL with preset encoded, copy to clipboard
    ├── ads/
    │   └── AdManager.js           # AdSense initialization, slot management, responsive sizing
    ├── analytics/
    │   └── Analytics.js           # Plausible event tracking (filter changes, recording, sharing)
    ├── ui/
    │   ├── Controls.js            # Slider wiring, getConfig(), updateMeters()
    │   └── PresetUI.js            # Preset selector dropdown/grid in sidebar
    ├── data/
    │   ├── contours.js            # Face mesh index arrays
    │   └── handTopology.js        # HAND_CONNS, FINGERS, FINGERTIPS
    └── utils.js                   # Screenshot, FPS counter, formatTime, debounce
```

---

## Module Specifications

### RenderContext (shared interface)

Every renderer receives a single object. This is the contract:

```js
/**
 * @typedef {Object} RenderContext
 * @property {CanvasRenderingContext2D} ctx
 * @property {Array<{x:number,y:number,z:number}>} facePts - deformed face points (468)
 * @property {Array<{x:number,y:number,z:number}>|null} leftHandPts - deformed left hand (21)
 * @property {Array<{x:number,y:number,z:number}>|null} rightHandPts - deformed right hand (21)
 * @property {AudioState} audio - { bass, mid, high, vol, energy, beat }
 * @property {DeformState} deform - { expand, wobble, jitter, pulse, handSplay, handWave }
 * @property {Config} config - all UI values from Controls.getConfig()
 * @property {Object} contours - face contour index arrays
 * @property {Object} handTopology - HAND_CONNS, FINGERS, FINGERTIPS
 * @property {HTMLCanvasElement} canvas
 * @property {number} time - elapsed seconds
 * @property {number} W - canvas width
 * @property {number} H - canvas height
 */
```

### AudioAnalyzer.js

```js
export class AudioAnalyzer {
  constructor() // internal state init
  async init(stream)  // MediaStream → AudioContext + AnalyserNode
  analyze(sensitivity) // reads FFT, updates state
  get state()  // → { bass, mid, high, vol, energy, beat: boolean }
  getMood()    // → { label: string, color: string, emoji: string }
  destroy()    // cleanup AudioContext
}
```

**Beat detection**: track bass threshold crossings with 200ms debounce. Store last 8 beat timestamps for tempo estimation.

**Frequency bands**:
- Bass: bins 0–8% (~0-350Hz)
- Mid: bins 8–40% (~350Hz-4kHz)  
- High: bins 40–100% (~4kHz+)

### HolisticManager.js

```js
export class HolisticManager {
  constructor()
  async init(videoElement, onStatus) // → starts Holistic + Camera
  get faceLandmarks()    // → array of 468 or null
  get leftHandLandmarks()  // → array of 21 or null
  get rightHandLandmarks() // → array of 21 or null
  destroy()
}
```

**CRITICAL**: MediaPipe Holistic and Camera are loaded via CDN `<script>` tags in the HTML. They are global (`window.Holistic`, `window.Camera`). Do NOT attempt to import them as ES modules. Reference them as globals inside this module.

```html
<!-- These go in app.html <head> -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
```

Holistic options:
```js
{ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false,
  refineFaceLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 }
```

### FaceDeformation.js

```js
export class FaceDeformation {
  constructor()
  update(audioState, config) // updates spring-interpolated values
  deformPoint(p, index, centerX, centerY, W, H) // → {x, y, z}
  get state() // → { expand, wobble, jitter, pulse }
}
```

**Deformation layers** (applied in order per point):
1. **Expand** (bass): push radially from face center. Factor increases with distance from center.
2. **Wobble** (mid): sinusoidal wave, `sin(time*6 + index*0.15)`, scaled by distance from center.
3. **Jitter** (high): per-frame random displacement, `(Math.random()-0.5) * jitterAmount`.
4. **Pulse** (beat): uniform scale from center, `1 + pulseAmount`. Decays with `*= 0.88` per frame.

**Spring physics**: each deformation value interpolates toward its target at rate `springSpeed`:
```js
value += (target - value) * springSpeed;
```
When audio drops, target returns to 0, and the spring pulls the deformation back to neutral.

### HandDeformation.js

```js
export class HandDeformation {
  constructor()
  update(audioState, config) // same spring pattern
  deformHand(landmarks, W, H) // → array of 21 {x,y,z}
  get state()
}
```

**Hand-specific deformations**:
1. **Splay** (bass): push each point away from wrist (index 0). Fingertips get 100% force, base joints get 20%.
2. **Wave** (mid): sinusoidal `sin(time*5 + jointIndex*0.4)` along finger chains.
3. **Jitter** + **Pulse**: same as face but at 80% intensity.

### ParticleSystem.js

```js
export class ParticleSystem {
  constructor(maxParticles = 3000)
  emitFromPoints(points, color, rate, baseSize, audioEnergy)
  emitBurst(point, color, count, spread, size) // for beat bursts
  emitFingerTrails(handPts, color, trailStrength, audioEnergy) // from FINGERTIPS
  update()
  draw(ctx)
  clear()
}
```

**Particle properties**: x, y, vx, vy, life (1→0), decay, size, color, alpha.
**Pool management**: when count exceeds max, remove oldest particles first (splice from index 0).
**Finger trails**: emit from FINGERTIPS indices [4,8,12,16,20] with upward drift (vy=-0.5 to -2), longer life (decay *= 0.6).

### PresetManager.js

```js
export class PresetManager {
  constructor()
  async loadBuiltIn(name)    // fetch from /public/presets/{name}.json
  applyPreset(preset, controls) // sets all slider/color/toggle values
  exportCurrent(controls)    // → JSON string of current config
  toURLParams(preset)        // → URLSearchParams string
  fromURLParams(params)      // → preset object or null
}
```

**Preset JSON format**:
```json
{
  "name": "Acid Trip",
  "author": "meshify",
  "version": 1,
  "filter": "glitch",
  "face": { "dBass": 2.5, "dMid": 1.8, "dHigh": 2.0, "dBeat": 1.5 },
  "hands": { "hSplay": 2.0, "hWave": 1.5, "hTrails": 2.5 },
  "physics": { "spring": 0.04, "moodSens": 1.5 },
  "particles": { "density": 2.0, "life": 1.5, "size": 1.3 },
  "rendering": { "lineW": 2.0, "glow": 25 },
  "colors": { "face": "#00ff88", "leftHand": "#ff0066", "rightHand": "#6600ff", "beat": "#ffcc00", "particles": "#00ffcc" }
}
```

### Recorder.js

```js
export class Recorder {
  constructor(canvas)
  start(fps = 30)    // canvas.captureStream + MediaRecorder
  stop()             // → triggers download of .webm
  get isRecording()
}
```

Use `video/webm;codecs=vp9` at 5Mbps. On stop, create Blob and trigger download.

### Controls.js

```js
export function initControls(onFilterChange)  // wire all DOM events
export function getConfig()  // → full config object
export function updateMeters(audioState) // update sidebar bars + mood badge
export function applyConfig(config) // set all DOM values from preset
```

**getConfig() returns**:
```js
{
  filter: 'wireframe',
  dBass: 1.0, dMid: 1.0, dHigh: 0.8, dBeat: 1.2,
  hSplay: 1.0, hWave: 1.0, hTrails: 1.5,
  spring: 0.08, moodSens: 1.0,
  pDensity: 1.0, pLife: 1.0, pSize: 1.0,
  lineW: 1.5, glow: 8,
  cFace: '#00ffaa', cLeftHand: '#ff3366', cRightHand: '#5533ff',
  cBeat: '#ffaa22', cParticles: '#00ccff',
  showVideo: false, showPoints: true, showMesh: true,
  showParticles: true, mirror: true
}
```

### AdManager.js

```js
export class AdManager {
  constructor()
  init()           // inject AdSense script, create ad slots
  showBanner()     // bottom banner on landing page
  showSidebar()    // sidebar ad in app (below controls)
  hideAll()        // for fullscreen mode
  refresh()        // refresh ad slots (called on filter change etc)
}
```

**Ad placement rules**:
- NEVER overlay ads on the canvas. The creative experience is sacred.
- Landing page: one banner ad (728x90 or responsive) below the fold.
- App page: one sidebar ad (300x250) at the bottom of the controls panel, below all sliders.
- One interstitial opportunity: after first recording export (non-blocking, skippable).
- Max 3 ad units per page. Follow AdSense policies strictly.
- Add `aria-label="Advertisement"` for accessibility.
- Ads are hidden in fullscreen mode.

---

## Landing Page (index.html)

The landing page sells the experience and drives users to the app. It must be:
- Visually striking (dark theme, animated mesh hero)
- Fast (< 2s LCP)
- SEO optimized

### Structure:
1. **Hero**: full-width animated canvas showing a pre-recorded face mesh animation (or procedural mesh animation). Big headline: "Your face. Your music. Live." CTA button: "Start Creating →" links to /app
2. **How it works**: 3-step visual (Enable camera → Play music → Share clips)
3. **Filter gallery**: grid of 6 filter previews (screenshots/short videos)
4. **Preset showcase**: cards for built-in presets with visual previews
5. **Tech section**: "Runs 100% in your browser. Nothing to install. Nothing uploaded."
6. **Footer**: links, privacy policy, ad disclosure

### SEO:
```html
<title>Meshify — Real-time Audio Reactive Face Visualizer</title>
<meta name="description" content="Turn your webcam into a living digital mask that reacts to music. 468-point face mesh + hand tracking, 6 visual modes, particle trails. Free, runs in your browser.">
<meta property="og:image" content="/og-image.jpg">
```

---

## Monetization Strategy

### Phase 1: AdSense (immediate)
- Sidebar 300x250 in app
- Banner on landing page
- Post-recording interstitial (once per session)
- Expected: $2-8 RPM depending on traffic geo

### Phase 2: Premium Presets (month 2)
- Free tier: 6 built-in presets + all manual controls
- Premium: 20+ curated presets ($2.99 one-time via Stripe/Lemon Squeezy)
- Preset packs themed: "Cyberpunk", "Nature", "Retro", "Minimal"
- Stored in localStorage after purchase, verified with a simple license key

### Phase 3: Creator Features (month 3+)
- Watermark-free recording (free has subtle "meshify.app" watermark in corner)
- HD export (1080p vs 720p free)
- Custom preset sharing with creator credit
- $4.99/month or $29/year

### Revenue protection:
- Core tool is always free. Ads fund the free tier.
- Premium is convenience/quality, never gating core functionality.
- No paywalled filters. All 6 visual modes are free forever.

---

## Main Render Loop (main.js)

```js
// Pseudocode for the core loop structure
function loop() {
  requestAnimationFrame(loop);
  time += 0.016;
  
  // 1. Analyze audio
  audioAnalyzer.analyze(config.moodSens);
  const audio = audioAnalyzer.state;
  
  // 2. Update deformations
  faceDeform.update(audio, config);
  handDeform.update(audio, config);
  
  // 3. Clear canvas with fade trail
  ctx.fillStyle = `rgba(6,6,11,${0.2 + (1 - audio.energy) * 0.25})`;
  ctx.fillRect(0, 0, W, H);
  
  // 4. Beat flash overlay
  if (faceDeform.state.pulse > 0.02) {
    ctx.fillStyle = config.cBeat;
    ctx.globalAlpha = faceDeform.state.pulse * 0.12;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  
  // 5. Optional video feed
  if (config.showVideo) drawVideoFeed();
  
  // 6. Apply mirror transform
  ctx.save();
  if (config.mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  
  // 7. Deform landmarks
  let facePts = [];
  if (holistic.faceLandmarks) {
    const center = computeCenter(holistic.faceLandmarks, W, H);
    facePts = holistic.faceLandmarks.map((p, i) => faceDeform.deformPoint(p, i, center.x, center.y, W, H));
    particles.emitFromPoints(facePts, config.cParticles, 4, 1.2, audio.energy);
  }
  
  let lhPts = null, rhPts = null;
  if (holistic.leftHandLandmarks) {
    lhPts = handDeform.deformHand(holistic.leftHandLandmarks, W, H);
    particles.emitFingerTrails(lhPts, config.cLeftHand, config.hTrails, audio.energy);
  }
  if (holistic.rightHandLandmarks) {
    rhPts = handDeform.deformHand(holistic.rightHandLandmarks, W, H);
    particles.emitFingerTrails(rhPts, config.cRightHand, config.hTrails, audio.energy);
  }
  
  // 8. Draw particles (behind mesh)
  particles.update();
  particles.draw(ctx);
  
  // 9. Render active filter
  const renderer = RENDERERS[config.filter];
  renderer({ ctx, facePts, leftHandPts: lhPts, rightHandPts: rhPts,
             audio, deform: faceDeform.state, config, contours, handTopology,
             canvas, time, W, H });
  
  ctx.restore();
  
  // 10. FPS + UI updates
  updateFPS();
  updateMeters(audio);
}
```

---

## Coding Standards

- **No TypeScript**. Plain JS with JSDoc comments for type hints.
- **No classes where functions suffice**. AudioAnalyzer and ParticleSystem are classes because they hold state. Renderers are plain functions.
- **No build-time CSS processing**. Plain CSS with custom properties.
- **No utility libraries**. No lodash, no d3. Everything is vanilla.
- **Performance budget**: maintain 60fps on a 2020 MacBook Air. Profile with Chrome DevTools. Particle count is the main lever — reduce MAX_PARTICLES if frame drops.
- **Error handling**: every `getUserMedia` and `AudioContext` call must have try/catch with user-visible error messages. Never silent failures.
- **Mobile**: detect touch devices and show a "Desktop recommended" notice. The app technically works on mobile but MediaPipe Holistic is heavy. Don't block mobile users, just warn.

---

## Pre-flight Checklist (before every commit)

1. Does `npm run dev` start without errors?
2. Does the camera + mic permission flow work?
3. Do all 6 filters render correctly?
4. Do hand landmarks appear when hands are visible?
5. Do particle trails emit from fingertips?
6. Does recording produce a downloadable .webm?
7. Do presets load and apply all values correctly?
8. Is the sidebar ad slot present but not overlapping canvas?
9. Does the landing page load in < 2s on throttled 4G?
10. Are there any console errors or warnings?

---

## Phase 1 Deliverables (MVP for launch)

1. ✅ Modularized codebase (all modules above)
2. ✅ Landing page with hero animation
3. ✅ App page with full functionality (face + hands + particles + recording)
4. ✅ 6 built-in presets as JSON files
5. ✅ Preset selector UI in sidebar
6. ✅ Share button (copies URL with preset params)
7. ✅ AdSense integration (2 slots)
8. ✅ Plausible analytics
9. ✅ Deploy to Vercel
10. ✅ Privacy policy page (camera/mic data never leaves browser, analytics is cookieless)

---

## IMPORTANT NOTES FOR CLAUDE CODE

- The MediaPipe CDN scripts are globals. Do NOT try to `import` them.
- The existing monolith that works is at `face-hands-audio.html`. Use it as the reference for ALL behavior. If in doubt, open it and compare.
- When creating renderers, port the EXACT drawing logic from the monolith. Don't "improve" or "clean up" the visual output — it already looks correct.
- The canvas is 1280x720 with devicePixelRatio scaling. Don't change this.
- The sidebar is exactly 290px. Don't change this.
- Test with actual music playing near the mic. Silent testing misses half the bugs.
- The spring physics MUST feel right. If deformations snap instead of flowing, the spring constant is wrong. Default 0.08 is tested and correct.
- Particle trails from fingertips should drift upward with slight random horizontal movement. This specific behavior is what makes it look magical vs generic.
