import { drawContour, drawPoints, drawHandMesh, lerpColor } from './BaseRenderer.js';
import { HAND_CONNS } from '../data/handTopology.js';

/** @param {import('./RenderContext.js').RenderContext} rc */
export function glitchRenderer(rc) {
  const { ctx, facePts, leftHandPts, rightHandPts, audio, deform, config, contours, W, H } = rc;
  const { cFace, cLeftHand, cRightHand, cBeat, lineW, showPoints, showMesh } = config;

  const beatMix = Math.min(1, deform.pulse * 8);
  const fColor = beatMix > 0.05 ? lerpColor(cFace, cBeat, beatMix) : cFace;

  // RGB split — red channel offset
  const ga = 5 + audio.energy * 20 + deform.pulse * 40;
  ctx.globalAlpha = 0.3;

  if (facePts.length && showMesh) {
    contours.F_CONTOURS.forEach((c) => {
      ctx.beginPath();
      for (let i = 0; i < c.length; i++) {
        const p = facePts[c[i]];
        if (!p) continue;
        if (i === 0) ctx.moveTo(p.x - ga, p.y);
        else ctx.lineTo(p.x - ga, p.y);
      }
      ctx.strokeStyle = cLeftHand;
      ctx.lineWidth = lineW;
      ctx.stroke();
    });
  }

  if (leftHandPts) {
    HAND_CONNS.forEach(([a, b]) => {
      const pa = leftHandPts[a], pb = leftHandPts[b];
      if (!pa || !pb) return;
      ctx.beginPath();
      ctx.moveTo(pa.x - ga, pa.y);
      ctx.lineTo(pb.x - ga, pb.y);
      ctx.strokeStyle = cLeftHand;
      ctx.lineWidth = lineW;
      ctx.stroke();
    });
  }
  if (rightHandPts) {
    HAND_CONNS.forEach(([a, b]) => {
      const pa = rightHandPts[a], pb = rightHandPts[b];
      if (!pa || !pb) return;
      ctx.beginPath();
      ctx.moveTo(pa.x - ga, pa.y);
      ctx.lineTo(pb.x - ga, pb.y);
      ctx.strokeStyle = cLeftHand;
      ctx.lineWidth = lineW;
      ctx.stroke();
    });
  }
  ctx.globalAlpha = 1;

  // Main mesh on top
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

  // Random glitch blocks
  if (Math.random() > 0.82 || audio.beat) {
    ctx.fillStyle = audio.beat ? cBeat : fColor;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, Math.random() * H, W, 3 + Math.random() * 12);
    ctx.globalAlpha = 1;
  }

  ctx.shadowBlur = 0;
}
