import { TAU, clamp } from './math.js';

const FONT_DISPLAY = '"Arial Black", Impact, "Trebuchet MS", sans-serif';
const FONT_MONO = '"Courier New", ui-monospace, monospace';

/* ------------------------------------------------------------
   Text helper — chunky arcade lettering with hard outline
   ------------------------------------------------------------ */
function text(ctx, str, x, y, size, color, o = {}) {
  // Gameplay labels and instructions get a larger boost than already-large titles.
  size *= size <= 28 ? 1.15 : 1.08;
  const {
    align = 'left',
    baseline = 'alphabetic',
    outline = '#0b0712',
    outlineW = Math.max(2, Math.round(size * 0.16)),
    font = FONT_DISPLAY,
    weight = '900',
    alpha = 1,
    shadow = null,
    spacing = 0,
    glow = null,
  } = o;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  try { ctx.letterSpacing = spacing + 'px'; } catch (e) { /* older browsers */ }

  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = o.glowSize || 14;
  }
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(str, x + (o.shadowX ?? Math.max(2, size * 0.07)), y + (o.shadowY ?? Math.max(2, size * 0.09)));
    ctx.shadowBlur = 0;
  }
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = outlineW;
    ctx.strokeStyle = outline;
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/* ------------------------------------------------------------
   Soft elliptical drop shadow under a character
   ------------------------------------------------------------ */
function drawShadow(ctx, x, footY, width, z = 0, strength = 1) {
  const lift = clamp(z / 260, 0, 0.42);
  const w = width * (1 - lift * 0.55);
  const h = Math.max(4, w * 0.26);
  ctx.save();
  ctx.globalAlpha = 0.42 * strength * (1 - lift);
  ctx.fillStyle = '#0a0612';
  ctx.beginPath();
  ctx.ellipse(x, footY + 2, w / 2, h / 2, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.22 * strength * (1 - lift);
  ctx.fillStyle = '#3b1f52';
  ctx.beginPath();
  ctx.ellipse(x, footY + 1, w / 2.6, h / 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/* Horizontal mirror used to normalise sheet poses to "facing right". */
function mirrorCanvas(src) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function wrapText(ctx, str, x, y, maxW, lineH) {
  const words = str.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

// Backdrops use the same logical coordinates as the stage while storing fewer pixels on touch screens.
function makeBackdrop(width, height, scale) {
  const canvas = makeCanvas(width * scale, height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  return ctx;
}

export { drawPixelNoise, FONT_MONO, drawShadow, makeBackdrop, makeCanvas, mirrorCanvas, roundRectPath, text };

function drawPixelNoise(g, x, y, w, h, color, step = 6, alpha = 0.07) {
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = color;
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      if ((xx * 7 + yy * 13) % 31 < 9) g.fillRect(xx, yy, 2, 2);
    }
  }
  g.restore();
}
