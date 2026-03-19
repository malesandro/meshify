# MESHIFY — Phased Execution Plan

## Context

We have a working monolith (`face-hands-audio.html`) — 900 lines, single file, fully functional face + hand tracking with audio-reactive deformation and particle trails. It works when opened in Chrome with camera + mic permissions.

The goal is to turn this into a deployable product called **Meshify** (meshify.app). The strategy is: launch as a **viral creative toy** targeting content creators and young users, monetize with ads + premium, then expand toward pro creative tools.

Every phase ends with a deployable version. No phase depends on a future phase to be useful.

---

## Execution Rules (apply to ALL phases)

1. **Always read CLAUDE.md before starting work.** The module specs, API contracts, and architecture are defined there.
2. **Use `face-hands-audio.html` as the ground truth** for all visual and behavioral comparisons. When in doubt, open it and verify.
3. **One sub-phase at a time.** Complete the current sub-phase before starting the next. Commit after each.
4. **Test with actual music.** Silent testing misses audio-reactive bugs.
5. **Do not refactor visual output.** The rendering math in the monolith is tested and looks correct. Port it exactly.
6. **MediaPipe is a global.** Do NOT try to import Holistic or Camera as ES modules. They are loaded via CDN script tags and accessed as `window.Holistic` / `window.Camera`.
7. **Performance budget: 60fps** on a 2020 MacBook Air with Chrome. If frame drops occur, reduce particle count first.
8. **The canvas is sacred.** No ads, no UI elements, no overlays on the rendering canvas. Ever.
9. **Mobile is secondary.** Make it not crash on mobile, but optimize for desktop. Warn mobile users.
10. **Commit messages format**: `phase1.2: collapse advanced UI panel` — always prefix with phase + sub-phase number.
11. **Verification gate**: at the end of each phase, ALL acceptance criteria must pass before starting the next phase. If something is broken, fix it within the current phase.

---

## PHASE 0 — Foundation ✅ COMPLETED

The monolith was modularized into a Vite project with ES modules. The app behaves identically to the monolith.

---

## PHASE 1 — One-Click Magic (make it viral-ready)

The #1 priority: someone opens the URL, clicks ONE button, and in 5 seconds sees something incredible on their face. Everything else is secondary.

**Execution order matters.** The order is designed so each step builds on the previous and enables better testing of what follows.

### 1.1 — One-click onboarding
- [ ] Merge camera + mic permission into a single `getUserMedia({ video: true, audio: true })` call
- [ ] Single "Start" button, no separate steps
- [ ] If mic is denied but camera works: proceed with visual-only mode (static mesh, no audio reactivity). Show subtle notice "Enable mic for audio reactivity"
- [ ] If camera is denied: show clear error with retry button
- [ ] Auto-select a visually striking default preset (Neon filter, high glow, particles on, moderate deformation) instead of plain wireframe

### 1.2 — Collapse advanced UI
- [ ] The 13 sliders + color pickers go inside a collapsible "Advanced" panel, collapsed by default
- [ ] Visible by default: filter selector (buttons), record button, screenshot button, share button
- [ ] The sidebar becomes much simpler on first impression. Most users never open Advanced.
- [ ] Mobile: sidebar becomes a bottom sheet that slides up
- [ ] Verify: all existing functionality still accessible when Advanced panel is expanded

### 1.3 — Audio fallback (built-in loops)
Why early: without this, every test session without music looks broken. Having built-in audio makes all subsequent feature development easier to test.
- [ ] If no mic or mic denied: offer built-in audio source
- [ ] Include 3 short royalty-free loops (ambient, electronic, acoustic) as files in `/public/audio/`
- [ ] Audio selector UI: small dropdown or button group near the audio meters — "Mic" / "Loop 1" / "Loop 2" / "Loop 3"
- [ ] Selected loop is decoded via `AudioContext.decodeAudioData()`, played through an `AudioBufferSourceNode`, and routed to the same `AnalyserNode` the mic uses
- [ ] Loops play on repeat
- [ ] This also works as a fallback when mic is denied — auto-switch to Loop 1 with a notice

### 1.4 — Kaleidoscope mode (new filter #7)
Why now: this is the WOW filter that makes Phase 1 worth it. Build after audio fallback so you can test it with guaranteed audio.
- [ ] New renderer: `src/renderers/KaleidoscopeRenderer.js`
- [ ] Takes the current face mesh render and replicates it in N segments around the face center
- [ ] Implementation: render the mesh once to an offscreen canvas, then draw it N times with rotation transforms (`ctx.rotate(2π/N)` per segment)
- [ ] Segment count reacts to audio: calm (energy < 0.2) = 4, flowing (< 0.5) = 6, energetic/intense = 8
- [ ] Add "Kaleid" button to the filter grid
- [ ] Register in `src/renderers/index.js` RENDERERS map
- [ ] Must look spectacular with zero configuration — this is the default for first-time users

### 1.5 — Gesture triggers
- [ ] Create `src/gestures/GestureDetector.js`
- [ ] Detect gestures from existing hand landmark data (NO new ML model):
  - **Closed fist** (all fingertips close to wrist): cycle to next filter
  - **Open palm** (all fingers extended, spread): burst 50 extra particles
  - **Mouth wide open** (upper/lower lip landmark distance > threshold): momentary 2x expand for 0.5s
  - **Peace sign** (index + middle extended, others closed): trigger screenshot
- [ ] Gesture detection: compute distances between landmark indices each frame, compare to thresholds
- [ ] Debounce ALL gestures at 500ms minimum to prevent rapid-fire
- [ ] Show brief floating label when gesture detected ("📸 Screenshot!", "🔄 Neon", "✋ Burst!") — fades after 1s
- [ ] Toggle gestures on/off from UI (default: on)
- [ ] Test: each gesture must trigger reliably without false positives in normal usage

### 1.6 — Vertical export (9:16)
- [ ] Add export mode toggle in UI: "Landscape" (16:9) / "Vertical" (9:16)
- [ ] Vertical mode: render to a 720×1280 canvas with face mesh centered
- [ ] Recording and screenshot buttons respect current export mode
- [ ] The live preview canvas stays landscape — vertical only for export output
- [ ] Verify: exported vertical video plays correctly on a phone

### 1.7 — Watermark
- [ ] In free mode: render "meshify.app" text in bottom-right corner of recordings and screenshots only
- [ ] Size: ~12px, opacity: 0.3, white with 1px black shadow for readability on any background
- [ ] Watermark is NOT shown on the live canvas — only baked into exported files
- [ ] Implementation: after capturing the frame for export, draw watermark on top before encoding
- [ ] Doubles as branding (free marketing on every shared clip) and future premium upsell

### 1.8 — Mobile basic support
- [ ] Detect mobile via `navigator.maxTouchPoints > 0 && window.innerWidth < 768`
- [ ] Show interstitial: "Meshify works best on desktop. Continue anyway?" with "Continue" and the URL to copy
- [ ] If they continue: hide sidebar, show only canvas + floating buttons (record, screenshot, filter cycle)
- [ ] Reduce canvas to 640×480 on mobile
- [ ] Reduce MAX_PARTICLES to 1000 on mobile
- [ ] Test on a real phone (iPhone Safari + Android Chrome minimum)

### Phase 1 Verification Gate
Before starting Phase 2, ALL of these must pass:
- [ ] First-time user flow: open URL → single click → face in Neon with particles in < 5 seconds
- [ ] Kaleidoscope filter produces a visually striking mandala effect
- [ ] At least 3 gestures trigger reliably (fist, open palm, peace sign)
- [ ] Vertical recording produces a 720×1280 WebM file
- [ ] Watermark appears on exported files but NOT on live canvas
- [ ] Audio fallback loops play and drive the visualizer when mic is off
- [ ] Mobile shows warning and floating UI, doesn't crash
- [ ] All 7 filters (6 original + kaleidoscope) work correctly
- [ ] Advanced panel opens/closes without breaking any functionality
- [ ] Performance: steady 60fps on desktop with all features active

---

## PHASE 2 — Monetization + Retention

The app works and is shareable. Now we make money and give people reasons to come back.

### 2.1 — Landing page
- [ ] Create `index.html` as a proper landing page (separate from `app.html`)
- [ ] Hero section: animated procedural mesh canvas (no camera needed — rotating/pulsing wireframe face animation built with static data or procedural math) with headline "Your face. Your music. Live." and CTA "Start Creating →" linking to `/app`
- [ ] How it works: 3-step visual (Enable camera → Play music → Share clips)
- [ ] Filter gallery: 7 filter preview images/GIFs in a grid
- [ ] Trust section: "100% in-browser. Nothing uploaded. Nothing installed."
- [ ] Footer: Privacy Policy link, About, GitHub link
- [ ] `styles/landing.css` — dark theme, visually striking, fast loading (< 2s LCP)
- [ ] SEO: `<title>Meshify — Real-time Audio Reactive Face Visualizer</title>`, meta description, OG image
- [ ] Vercel routing: `/` → landing, `/app` → app

### 2.2 — Privacy policy
Why before ads: AdSense requires a privacy policy page. Build this before 2.4.
- [ ] Create `privacy.html`
- [ ] Clearly state: camera and mic data processed locally, never uploaded, never stored
- [ ] Analytics: Plausible, cookieless, no personal data collected
- [ ] Ads: Google AdSense, standard cookie policy (link to Google's ad policy)
- [ ] Contact email for GDPR/privacy requests

### 2.3 — Plausible analytics
- [ ] Create `src/analytics/Analytics.js`
- [ ] Track events: `app_start`, `filter_change`, `recording_start`, `recording_export`, `screenshot`, `share_click`, `preset_applied`, `gesture_triggered`, `advanced_panel_opened`
- [ ] Track properties: `filter_name`, `export_mode` (vertical/landscape), `session_duration`
- [ ] Plausible script loaded via CDN in HTML, module wraps `window.plausible()`
- [ ] Cookieless — no GDPR banner needed

### 2.4 — AdSense integration
- [ ] Create `src/ads/AdManager.js`
- [ ] Landing page: one responsive banner ad below the fold (after "How it works")
- [ ] App page: one 300×250 ad at the bottom of the sidebar (below controls, scrollable into view)
- [ ] Post-recording interstitial: after the FIRST recording export per session, show a closable ad overlay. Only once per session. Closable after 3 seconds.
- [ ] NEVER overlay the canvas. NEVER interrupt the creative flow.
- [ ] `aria-label="Advertisement"` for accessibility
- [ ] Hide ads in fullscreen mode
- [ ] Lazy load AdSense script — must not slow initial page load
- [ ] Max 3 ad units per page (AdSense policy)

### 2.5 — Preset system
- [ ] Create `src/presets/PresetManager.js` — load, apply, export presets as JSON
- [ ] Create `src/ui/PresetUI.js` — preset selector in sidebar (grid of cards with preview color swatches)
- [ ] 7 built-in presets as JSON in `/public/presets/`:
  - **Neon Dreams**: neon filter, high glow, cyan particles, moderate deform
  - **Acid Trip**: glitch filter, max jitter, RGB colors, high particles
  - **Underwater**: hologram filter, blue/green palette, high wobble, low jitter
  - **Heartbeat**: wireframe filter, red colors, extreme beat pulse, low other deforms
  - **Zen**: xray filter, minimal deform, soft particles, low spring speed
  - **Fire Dance**: thermal filter, orange/red, high bass expand, fast particles
  - **Kaleidoscope Dream**: kaleidoscope filter, purple/pink, high everything
- [ ] Selecting a preset applies ALL values (filter, sliders, colors, toggles) and updates UI elements
- [ ] Any manual slider change after applying a preset switches label to "Custom"

### 2.6 — Share system
- [ ] Create `src/sharing/ShareManager.js`
- [ ] "Share" button visible in main UI (not in Advanced panel)
- [ ] Click generates URL: `meshify.app/app?preset=neon-dreams` for built-in, or `meshify.app/app?c=BASE64_CONFIG` for custom
- [ ] Copies URL to clipboard with toast notification "Link copied!"
- [ ] On app load: parse URL params, if preset/config found → auto-apply after camera starts
- [ ] Toast: small dark pill at bottom of screen, fades after 2s

### Phase 2 Verification Gate
Before starting Phase 3, ALL of these must pass:
- [ ] Landing page loads in < 2s on throttled Fast 3G
- [ ] Landing CTA navigates to `/app` correctly
- [ ] Privacy policy page exists and is linked from landing + app footer
- [ ] Plausible tracks at least: app_start, filter_change, recording_export
- [ ] Ads render in sidebar and landing, never on canvas, interstitial fires once after first recording
- [ ] All 7 presets load and apply correctly
- [ ] Share URL with preset param auto-applies that preset
- [ ] Share URL with custom base64 config restores all values
- [ ] No console errors on any page

---

## PHASE 3 — Pro Creative Features

The viral toy gets deeper tools for the design/creator audience. Premium monetization starts here.

### 3.1 — System audio capture
Why first: unlocks clean audio for all subsequent testing and for musician users.
- [ ] Add audio source selector in UI: "Microphone" / "System Audio" / "Audio File" / "Loop 1-3"
- [ ] System audio: `navigator.mediaDevices.getDisplayMedia({ audio: true, video: false })` — user picks a tab/window to capture audio from
- [ ] Audio file: drag-and-drop zone or file picker for MP3/WAV. Decode via `AudioContext.decodeAudioData()`, play through `AudioBufferSourceNode`, route to `AnalyserNode`
- [ ] All sources feed into the same `AnalyserNode` — the rest of the pipeline doesn't change
- [ ] Audio file: show simple transport (play/pause, scrub bar)
- [ ] Consolidate with Phase 1 loops — loops become just another option in the same selector

### 3.2 — Scene composer (layer stacking)
- [ ] Allow users to activate multiple renderers simultaneously as layers
- [ ] Each layer: renderer dropdown, opacity slider (0-100%), blend mode (normal, screen, multiply, additive via `ctx.globalCompositeOperation`)
- [ ] Max 3 layers for performance
- [ ] Layer panel UI: stackable cards in sidebar with drag-to-reorder
- [ ] Default: single layer (backwards compatible)
- [ ] Render order: layer 1 (bottom) first, layer 3 (top) last

### 3.3 — ASCII mode (new filter #8)
- [ ] `src/renderers/AsciiRenderer.js`
- [ ] Face mesh as ASCII characters on monospace grid
- [ ] Character density mapped to Z depth + audio energy. Chars: ` .:-=+*#%@`
- [ ] Grid cell size ~8px, green-on-black terminal aesthetic, respects color picker
- [ ] Hands also rendered as ASCII
- [ ] Register in RENDERERS map

### 3.4 — Dot Matrix mode (new filter #9)
- [ ] `src/renderers/DotMatrixRenderer.js`
- [ ] Every landmark as filled circle, radius proportional to Z depth
- [ ] Halftone newspaper effect
- [ ] Bass-influenced points = warm colors, high-influenced = cool colors
- [ ] Register in RENDERERS map

### 3.5 — Constellation mode (new filter #10)
- [ ] `src/renderers/ConstellationRenderer.js`
- [ ] N random connections between nearby landmark pairs per frame (N scales with energy)
- [ ] Connection lifecycle: fade in 0.3s → hold → fade out 0.5s
- [ ] Points twinkle: size oscillates with `sin(time + index)`, driven by high freq
- [ ] Subtle radial gradient background (deep blue to black)
- [ ] 10% chance per frame: cross-body connection (face point → hand point)

### 3.6 — Draw in the air
- [ ] Track index fingertip (landmark 8 per hand) across frames
- [ ] Store as polylines: `[{ points: [{x,y},...], color, width }]`
- [ ] Drawing activates on pointing gesture (index extended, others closed)
- [ ] Lines persist until cleared
- [ ] Clear: both palms open simultaneously
- [ ] Color follows particle color, width scales with `1 + audio.vol * 3`
- [ ] Max 5000 stored points, drop oldest polylines when exceeded

### 3.7 — OBS overlay mode
- [ ] "Overlay Mode" toggle in settings
- [ ] Active: `ctx.clearRect()` instead of background fill (transparent)
- [ ] PNG screenshots with alpha channel
- [ ] WebM: attempt VP9 alpha, fallback to chroma key (solid #00ff00)
- [ ] Stage mode: fullscreen canvas, all UI hidden. Toggle with F key or button.
- [ ] ESC exits stage mode

### 3.8 — Premium gate (Lemon Squeezy)
- [ ] Lemon Squeezy checkout overlay ($4.99 one-time)
- [ ] Premium unlocks: watermark removal, HD export (1920×1080), 3 exclusive presets
- [ ] License key in `localStorage` as `meshify_license`
- [ ] Validation: SHA-256 hash prefix check
- [ ] "Go Premium" button in sidebar, premium badge when active
- [ ] All 10 filters + all sliders + recording remain free forever

### Phase 3 Verification Gate
- [ ] System audio works from a browser tab playing YouTube
- [ ] Audio file upload plays and drives visualizer
- [ ] 3 layers render simultaneously with different filters and blend modes
- [ ] ASCII, Dot Matrix, Constellation render face + hands correctly
- [ ] Draw in the air: pointing creates persistent lines, open palms clear them
- [ ] OBS overlay: transparent or green screen works
- [ ] Stage mode: F key toggles fullscreen no-UI canvas
- [ ] Lemon Squeezy checkout opens, license activates premium
- [ ] Watermark disappears on exports when premium active
- [ ] HD export produces 1920×1080 when premium active
- [ ] 60fps with 2 layers, particles on, music playing

---

## PHASE 4 — Community + Growth

NOT for initial build. Start only after Phase 3 is deployed and real user data from analytics confirms priorities.

### 4.1 — Beat game mode
### 4.2 — Clip gallery + community voting
### 4.3 — BPM sync mode (lock deformation to detected tempo)
### 4.4 — Auto-DJ visual (detect song sections, auto-switch filters)
### 4.5 — MIDI mapping (external controller → sliders)
### 4.6 — Multi-scene sequencer (programmed preset sequences with bar timing)
### 4.7 — AI preset generation via Claude API (describe a vibe → get a preset)
### 4.8 — Collaboration rooms via WebRTC (multi-person mesh on one canvas)
### 4.9 — Preset marketplace (creators sell presets, 70/30 split)
### 4.10 — Symmetry / mirror mandala mode

---

## Prompt Template for Claude Code

When starting a new phase:

```
Read CLAUDE.md and MESHIFY-PLAN.md. Execute Phase [N] sub-phases in order: [N.1] → [N.2] → ... → [N.X]. Commit after each sub-phase with message format "phaseN.X: description". The previous phases are complete and working. Do not modify the rendering math or visual output of existing filters — only add new features on top. Test with actual audio playing between sub-phases.
```
