import { makeCanvas, roundRectPath } from '../engine/canvas.js';
import { clamp } from '../engine/math.js';

let _scratch = null;
function getScratch(w, h) {
  if (!_scratch) {
    const c = makeCanvas(Math.max(320, w), Math.max(320, h));
    _scratch = { canvas: c, ctx: c.getContext('2d') };
  } else if (_scratch.canvas.width < w || _scratch.canvas.height < h) {
    _scratch.canvas.width = Math.max(_scratch.canvas.width, w);
    _scratch.canvas.height = Math.max(_scratch.canvas.height, h);
  }
  return _scratch;
}

/* ------------------------------------------------------------
   Draw a character frame (works for sheet bakes & procedural art)
   options: h, flip, sx, sy, tilt, flash, tint, tintAlpha, alpha,
            frame, actionT, walkFps, offsetY, glow
   ------------------------------------------------------------ */
function drawSprite(ctx, sprite, state, animT, x, footY, o = {}) {
  if (!sprite) return;
  const list = sprite.frames[state] || sprite.frames.idle;
  if (!list || !list.length) return;
  let frame = list[0];
  if (o.frame != null) {
    frame = list[clamp(Math.floor(o.frame), 0, list.length - 1)];
  } else if (state === 'walk') {
    frame = list[Math.floor(animT * (o.walkFps || 10)) % list.length];
  } else if (state === 'idle') {
    frame = list[Math.floor(animT * 2.1) % list.length];
  } else if (state === 'attack' || state === 'special') {
    const idx = Math.floor((o.actionT || 0) * (o.actionFps || 13));
    frame = list[clamp(idx, 0, list.length - 1)];
  } else if (state === 'hurt' || state === 'down') {
    frame = list[0];
  }

  const baseH = o.h || sprite.targetH || 110;
  const baseW = baseH * (frame.width / frame.height);
  const flip = o.flip ? -1 : 1;
  const sx = (o.sx ?? 1) * flip;
  const sy = o.sy ?? 1;
  const padShift = (sprite.pad || 0) * (baseH / frame.height);

  ctx.save();
  ctx.globalAlpha *= (o.alpha ?? 1);
  if (sprite.antialias) ctx.imageSmoothingEnabled = true;
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = o.glowSize || 16;
  }
  ctx.translate(x, footY + (o.offsetY || 0));
  ctx.scale(sx, sy);
  if (o.tilt) {
    const pivot = baseH * 0.55;
    ctx.translate(0, -pivot);
    ctx.rotate(o.tilt);
    ctx.translate(0, pivot);
  }

  const dx = -baseW / 2;
  const dy = -baseH + padShift;

  // Subtle anticipation blend for sheet walk cycles (only a whisper of the
  // next pose) to smooth low-frame sprite sheets.
  if (sprite.blendWalk && state === 'walk' && list.length > 1 && o.frame == null && !o.flash && !o.tint) {
    const phase = animT * (o.walkFps || 10);
    const idx = Math.floor(phase) % list.length;
    const frac = phase - Math.floor(phase);
    if (frac > 0.58) {
      const nf = list[(idx + 1) % list.length];
      const nw = baseH * (nf.width / nf.height);
      const baseAlpha = ctx.globalAlpha;
      ctx.globalAlpha = baseAlpha * ((frac - 0.58) / 0.42) * 0.22;
      ctx.drawImage(nf, -nw / 2, dy, nw, baseH);
      ctx.globalAlpha = baseAlpha;
    }
  }

  if (o.flash || o.tint) {
    const wS = Math.ceil(baseW) + 4;
    const hS = Math.ceil(baseH) + 4;
    const sc = getScratch(wS, hS);
    const g = sc.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, sc.canvas.width, sc.canvas.height);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true;
    g.drawImage(frame, 2, 2, baseW, baseH);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = o.flash ? 0.94 : (o.tintAlpha ?? 0.34);
    g.fillStyle = o.flash ? '#ffffff' : (o.tint || '#ff2b2b');
    g.fillRect(0, 0, wS, hS);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    ctx.drawImage(sc.canvas, 0, 0, wS, hS, dx - 2, dy - 2, wS, hS);
  } else {
    ctx.drawImage(frame, dx, dy, baseW, baseH);
  }

  ctx.restore();
}

function drawPortrait(ctx, sprite, x, y, w, h, bg = '#201530') {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  if (sprite && sprite.portrait) {
    const p = sprite.portrait;
    const scale = Math.max(w / p.width, h / p.height);
    const dw = p.width * scale;
    const dh = p.height * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(p, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  ctx.restore();
}

export { drawPortrait, drawSprite };
