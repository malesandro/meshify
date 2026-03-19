import { drawContour, drawPoints, drawHandMesh, lerpColor } from './BaseRenderer.js';

/** @param {import('./RenderContext.js').RenderContext} rc */
export function thermalRenderer(rc) {
  const { ctx, facePts, leftHandPts, rightHandPts, audio, deform, config, contours } = rc;
  const { cFace, cLeftHand, cRightHand, cBeat, lineW, showPoints, showMesh } = config;

  const beatMix = Math.min(1, deform.pulse * 8);
  const fColor = beatMix > 0.05 ? lerpColor(cFace, cBeat, beatMix) : cFace;

  // Thermal heat map on face
  if (facePts.length) {
    facePts.forEach((p, i) => {
      if (i % 3 !== 0) return;
      const heat = 1 - (p.z + 0.1) / 0.15 + audio.energy * 0.3;
      const t = Math.max(0, Math.min(1, heat));
      let color;
      if (t < 0.25) color = `rgb(0,0,${Math.round(t * 4 * 255)})`;
      else if (t < 0.5) color = `rgb(${Math.round((t - 0.25) * 4 * 255)},0,255)`;
      else if (t < 0.75) color = `rgb(255,${Math.round((t - 0.5) * 4 * 255)},0)`;
      else color = `rgb(255,255,${Math.round((t - 0.75) * 4 * 255)})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 12 + audio.energy * 8, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12 + audio.energy * 8);
      grd.addColorStop(0, color);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.globalAlpha = 0.1;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Mesh on top
  if (facePts.length && showMesh) {
    contours.F_CONTOURS.forEach((c) => drawContour(ctx, facePts, c, fColor, lineW));
    ctx.globalAlpha = 0.15 + audio.energy * 0.2;
    for (let i = 0; i < facePts.length - 8; i += 8) {
      ctx.beginPath();
      ctx.moveTo(facePts[i].x, facePts[i].y);
      ctx.lineTo(facePts[i + 8].x, facePts[i + 8].y);
      ctx.strokeStyle = cFace + '60';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawPoints(ctx, facePts, fColor, lineW, showPoints);

  if (leftHandPts) {
    const lColor = beatMix > 0.05 ? lerpColor(cLeftHand, cBeat, beatMix) : cLeftHand;
    drawHandMesh(ctx, leftHandPts, lColor, lineW * 1.2, showPoints);
  }
  if (rightHandPts) {
    const rColor = beatMix > 0.05 ? lerpColor(cRightHand, cBeat, beatMix) : cRightHand;
    drawHandMesh(ctx, rightHandPts, rColor, lineW * 1.2, showPoints);
  }

  ctx.shadowBlur = 0;
}
