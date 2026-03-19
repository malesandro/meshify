import { wireframeRenderer } from './WireframeRenderer.js';
import { neonRenderer } from './NeonRenderer.js';
import { hologramRenderer } from './HologramRenderer.js';
import { glitchRenderer } from './GlitchRenderer.js';
import { thermalRenderer } from './ThermalRenderer.js';
import { xrayRenderer } from './XrayRenderer.js';

export const RENDERERS = {
  wireframe: wireframeRenderer,
  neon: neonRenderer,
  hologram: hologramRenderer,
  glitch: glitchRenderer,
  thermal: thermalRenderer,
  xray: xrayRenderer,
};
