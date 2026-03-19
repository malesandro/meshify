import { drawContour, drawPoints, drawHandMesh, lerpColor } from './BaseRenderer.js';

/** @param {import('./RenderContext.js').RenderContext} rc */
export function hologramRenderer(rc) {
  const { ctx, facePts, leftHandPts, rightHandPts, audio, deform, config, contours, time, W, H } = rc;
  const { cFace, cLeftHand, cRightHand, cBeat, lineW, showPoints, showMesh } = config;

  const beatMix = Math.min(1, deform.pulse * 8);
  const fColor = beatMix > 0.05 ? lerpColor(cFace, cBeat, beatMix) : cFace;

  // Scanlines
  const scanY = (time * 80 + audio.bass * 200) % H;
  ctx.globalAlpha = 0.03;
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? fColor : 'transparent';
    ctx.fillRect(0, y, W, 1);
  }
  ctx.globalAlpha = 0.1 + audio.energy * 0.06;
  ctx.fillStyle = fColor;
  ctx.fillRect(0, scanY - 12, W, 24);
  ctx.globalAlpha = 0.6 + Math.sin(time * 10) * 0.3 + audio.energy * 0.2;

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
