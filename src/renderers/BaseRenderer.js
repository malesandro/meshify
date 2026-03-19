import { HAND_CONNS, FINGERTIPS, FINGERS } from '../data/handTopology.js';

/**
 * Draw a contour path from indexed points.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} pts
 * @param {Array<number>} indices
 * @param {string} color
 * @param {number} lineWidth
 */
export function drawContour(ctx, pts, indices, color, lineWidth) {
  ctx.beginPath();
  for (let i = 0; i < indices.length; i++) {
    const p = pts[indices[i]];
    if (!p) continue;
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Draw face points (every other point for perf).
 */
export function drawPoints(ctx, pts, color, size, showPoints) {
  if (!showPoints) return;
  pts.forEach((p, i) => {
    if (i % 2 !== 0) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

/**
 * Draw hand mesh (connections + joints).
 */
export function drawHandMesh(ctx, pts, color, lineWidth, showPoints) {
  HAND_CONNS.forEach(([a, b]) => {
    const pa = pts[a], pb = pts[b];
    if (!pa || !pb) return;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  });

  if (showPoints) {
    pts.forEach((p, i) => {
      const sz = FINGERTIPS.includes(i) ? lineWidth * 2 : lineWidth * 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = FINGERTIPS.includes(i) ? color : 'rgba(255,255,255,0.5)';
      ctx.fill();
    });
    FINGERS.forEach((finger) => {
      for (let j = 0; j < finger.length - 1; j++) {
        const p = pts[finger[j]];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  }
}

/**
 * Parse hex color to [r, g, b].
 */
export function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Linearly interpolate between two hex colors.
 */
export function lerpColor(a, b, t) {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
}
