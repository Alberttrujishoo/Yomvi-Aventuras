import { makeCanvas } from '../engine/canvas.js';
import { clamp } from '../engine/math.js';

function silhouetteOf(src, color) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function outlineCanvas(src, size = 2, color = '#170f1c') {
  const sil = silhouetteOf(src, color);
  const c = makeCanvas(src.width + size * 2, src.height + size * 2);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const offs = [
    [-size, 0], [size, 0], [0, -size], [0, size],
    [-size, -size], [size, -size], [-size, size], [size, size],
  ];
  for (const [dx, dy] of offs) g.drawImage(sil, size + dx, size + dy);
  g.drawImage(src, size, size);
  return c;
}

/* Build a frame using 2px "art units". */
function makeArt(wUnits, hUnits, draw) {
  const S = 2;
  const c = makeCanvas(wUnits * S, hUnits * S);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const P = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x * S), Math.round(y * S), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S)));
  };
  draw(P, g);
  return outlineCanvas(c, 2, '#170f1c');
}

function makePortrait(frame, focusX = 0.5, focusW = 0.62, hRatio = 0.46) {
  const S = 96;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const sw = frame.width * focusW;
  const sh = Math.min(frame.height * hRatio, sw * 1.); // square-ish crop
  const sx = clamp(frame.width * focusX - sw / 2, 0, frame.width - sw);
  const sy = 0;
  const scale = Math.max(S / sw, S / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  g.drawImage(frame, sx, sy, sw, sh, (S - dw) / 2, (S - dh) / 2, dw, dh);
  return c;
}

function spriteFrom(frames, targetH, extra = {}) {
  return {
    frames,
    targetH,
    pad: 2,
    procedural: true,
    portrait: extra.portrait || makePortrait(frames.idle[0], 0.5, 0.64, 0.47),
    ...extra,
  };
}

/* ============================================================
   YOMVI — fallback: tall young man, brown suit, hat, glasses
   ============================================================ */

export { makeArt, makePortrait, spriteFrom };
