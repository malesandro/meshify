import { drawContour, drawPoints, drawHandMesh, lerpColor } from './BaseRenderer.js';

/** @param {import('./RenderContext.js').RenderContext} rc */
export function xrayRenderer(rc) {
  const { ctx, facePts, leftHandPts, rightHandPts, audio, deform, config, contours } = rc;
  const { cFace, cLeftHand, cRightHand, cBeat, lineW, glow, showPoints, showMesh } = config;

  const beatMix = Math.min(1, deform.pulse * 8);
  const fColor = beatMix > 0.05 ? lerpColor(cFace, cBeat, beatMix) : cFace;

  // X-ray glow (same as neon)
  ctx.shadowBlur = glow + audio.energy * 15;
  ctx.shadowColor = fColor;

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
    ctx.shadowColor = cLeftHand;
    const lColor = beatMix > 0.05 ? lerpColor(cLeftHand, cBeat, beatMix) : cLeftHand;
    drawHandMesh(ctx, leftHandPts, lColor, lineW * 1.2, showPoints);
  }
  if (rightHandPts) {
    ctx.shadowColor = cRightHand;
    const rColor = beatMix > 0.05 ? lerpColor(cRightHand, cBeat, beatMix) : cRightHand;
    drawHandMesh(ctx, rightHandPts, rColor, lineW * 1.2, showPoints);
  }

  ctx.shadowBlur = 0;
}
