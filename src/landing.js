import { AdManager } from './monetization/Monetization.js';
import { Analytics } from './analytics/Analytics.js';

// ── Hero procedural mesh animation ──
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Procedural floating mesh points
const POINT_COUNT = 80;
const points = [];
for (let i = 0; i < POINT_COUNT; i++) {
  points.push({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    vx: (Math.random() - 0.5) * 0.002,
    vy: (Math.random() - 0.5) * 0.002,
    phase: Math.random() * Math.PI * 2,
  });
}

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = 'rgba(6,6,11,0.15)';
  ctx.fillRect(0, 0, W, H);

  // Update points
  points.forEach((p) => {
    p.x += p.vx + Math.sin(time * 0.5 + p.phase) * 0.0005;
    p.y += p.vy + Math.cos(time * 0.3 + p.phase) * 0.0005;
    if (p.x > 1.2 || p.x < -1.2) p.vx *= -1;
    if (p.y > 1.2 || p.y < -1.2) p.vy *= -1;
  });

  // Draw connections
  const cx = W / 2, cy = H / 2;
  const scale = Math.min(W, H) * 0.4;
  ctx.lineWidth = 0.5;

  for (let i = 0; i < points.length; i++) {
    const pi = points[i];
    const sx = cx + pi.x * scale;
    const sy = cy + pi.y * scale;

    for (let j = i + 1; j < points.length; j++) {
      const pj = points[j];
      const dx = pi.x - pj.x;
      const dy = pi.y - pj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.4) continue;

      const alpha = (1 - dist / 0.4) * 0.3;
      const tx = cx + pj.x * scale;
      const ty = cy + pj.y * scale;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = `rgba(0,255,170,${alpha})`;
      ctx.stroke();
    }

    // Draw point
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,170,0.5)';
    ctx.fill();
  }
}

animate();

// ── Ads + Analytics ──
const adManager = new AdManager();
adManager.init();
adManager.showBanner();

const analytics = new Analytics();
analytics.init();
