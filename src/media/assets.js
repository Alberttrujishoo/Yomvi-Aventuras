import { makeCanvas, mirrorCanvas } from '../engine/canvas.js';
import { clamp } from '../engine/math.js';
import { makePortrait } from './sprites.js';

/* ============================================================
   YOMVI ADVENTURES — asset loader + smart sprite-sheet cutter
   Loads sprite sheets from assets/images.
   - Auto-detects sprite rows/columns by scanning pixels.
   - Bakes each frame at a sane resolution, removes the flat
     grey paper background, and builds a portrait crop.
   - Falls back to the procedural 16-bit renderer if anything
     fails (missing or invalid image).
   ============================================================ */

function loadImage(filename, timeout = 9000) {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => finish(null), timeout);
    function finish(result) {
      clearTimeout(timer);
      img.onload = img.onerror = null;
      resolve(result);
    }
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = new URL('../../assets/images/' + filename, import.meta.url);
  });
}

/* ------------------------------------------------------------
   Pixel scanner: find sprite rows and columns
   ------------------------------------------------------------ */
function analyzeSheet(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, w, h).data; // throws if tainted

  // Background = average of the 4 corners
  const pts = [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]];
  let br = 0, bgc = 0, bb = 0;
  for (const [px, py] of pts) {
    const i = (py * w + px) * 4;
    br += data[i]; bgc += data[i + 1]; bb += data[i + 2];
  }
  const bg = [br / 4, bgc / 4, bb / 4];
  const tol = 24;

  const contentAt = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 12) return false;
    const dr = Math.abs(data[i] - bg[0]);
    const dg = Math.abs(data[i + 1] - bg[1]);
    const db = Math.abs(data[i + 2] - bg[2]);
    return Math.max(dr, dg, db) > tol;
  };

  // Row bands (scan every row so 1px rows are not skipped)
  const rowFlags = new Uint8Array(h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x += 2) {
      if (contentAt(x, y)) { rowFlags[y] = 1; break; }
    }
  }
  const bands = [];
  let start = -1;
  for (let y = 0; y < h; y++) {
    if (rowFlags[y] && start < 0) start = y;
    if (!rowFlags[y] && start >= 0) {
      if (y - start > 24) bands.push([start, y - 1]);
      start = -1;
    }
  }
  if (start >= 0) bands.push([start, h - 1]);

  // Merge bands separated by less than 10px
  const merged = [];
  for (const b of bands) {
    if (merged.length && b[0] - merged[merged.length - 1][1] < 12) {
      merged[merged.length - 1][1] = b[1];
    } else merged.push([...b]);
  }

  const rows = [];
  for (const [y0, y1] of merged) {
    const colFlags = new Uint8Array(w);
    for (let x = 0; x < w; x++) {
      for (let y = y0; y <= y1; y += 2) {
        if (contentAt(x, y)) { colFlags[x] = 1; break; }
      }
    }
    const cols = [];
    let cs = -1;
    for (let x = 0; x < w; x++) {
      if (colFlags[x] && cs < 0) cs = x;
      if (!colFlags[x] && cs >= 0) {
        if (x - cs > 18) cols.push([cs, x - 1]);
        cs = -1;
      }
    }
    if (cs >= 0) cols.push([cs, w - 1]);

    const mergedCols = [];
    for (const b of cols) {
      if (mergedCols.length && b[0] - mergedCols[mergedCols.length - 1][1] < 10) {
        mergedCols[mergedCols.length - 1][1] = b[1];
      } else mergedCols.push([...b]);
    }

    const frames = mergedCols.map(([x0, x1]) => ({
      sx: Math.max(0, x0 - 3),
      sy: Math.max(0, y0 - 3),
      sw: Math.min(w, x1 + 4) - Math.max(0, x0 - 3),
      sh: Math.min(h, y1 + 4) - Math.max(0, y0 - 3),
    })).filter(f => f.sw > 24 && f.sh > 40);

    if (frames.length) rows.push(frames);
  }

  if (!rows.length) {
    // Horizontal strip auto-detect (wide image, single band)
    return [[{ sx: 0, sy: 0, sw: w, sh: h }]];
  }
  return rows;
}

/* ------------------------------------------------------------
   Adaptive scanner for sheets with a soft gradient background and
   painted drop shadows (e.g. the hand-drawn JEFE3 sheet). The plain
   corner-key scanner merges every figure into one giant band there,
   so this pass models the paper gradient row by row and splits on
   the quiet gaps between the rows of poses.
   ------------------------------------------------------------ */
function analyzeSheetAdaptive(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, w, h).data;

  // Background colour at the left and right edge of every row. A flat
  // grey studio backdrop is rarely uniform, so interpolate in between.
  const left = new Array(h);
  const right = new Array(h);
  for (let y = 0; y < h; y++) {
    let lr = 0, lg = 0, lb = 0, rr = 0, rg = 0, rb = 0;
    for (let x = 2; x < 12; x++) {
      const i = (y * w + x) * 4;
      lr += data[i]; lg += data[i + 1]; lb += data[i + 2];
    }
    for (let x = w - 12; x < w - 2; x++) {
      const i = (y * w + x) * 4;
      rr += data[i]; rg += data[i + 1]; rb += data[i + 2];
    }
    left[y] = [lr / 10, lg / 10, lb / 10];
    right[y] = [rr / 10, rg / 10, rb / 10];
  }

  const contentAt = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 12) return false;
    const t = x / (w - 1);
    const br = left[y][0] + (right[y][0] - left[y][0]) * t;
    const bg = left[y][1] + (right[y][1] - left[y][1]) * t;
    const bb = left[y][2] + (right[y][2] - left[y][2]) * t;
    return Math.max(
      Math.abs(data[i] - br),
      Math.abs(data[i + 1] - bg),
      Math.abs(data[i + 2] - bb)
    ) > 36;
  };

  const rowCount = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (contentAt(x, y)) n++;
    rowCount[y] = n;
  }
  const maxRow = Math.max(...rowCount);

  // Quiet runs separate the rows of poses; soft shadows never reach 25%.
  const separators = [];
  let ss = -1;
  for (let y = 0; y < h; y++) {
    const low = rowCount[y] < maxRow * 0.25;
    if (low && ss < 0) ss = y;
    if ((!low || y === h - 1) && ss >= 0) {
      const e = low ? y : y - 1;
      if (e - ss + 1 >= 8) separators.push([ss, e]);
      ss = -1;
    }
  }

  const bands = [];
  let y0 = 0;
  for (const [a, b] of separators) {
    if (a - 1 >= y0) bands.push([y0, a - 1]);
    y0 = b + 1;
  }
  if (y0 < h) bands.push([y0, h - 1]);

  const rows = [];
  for (let [by0, by1] of bands) {
    // Tighten the band to the real pixels (ignore the blank margins).
    let top = by0;
    while (top <= by1 && rowCount[top] <= 20) top++;
    let bottom = by1;
    while (bottom >= top && rowCount[bottom] <= 20) bottom--;
    if (bottom - top < 60) continue;

    const colCount = new Array(w).fill(0);
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = top; y <= bottom; y++) if (contentAt(x, y)) n++;
      colCount[x] = n;
    }
    const maxCol = Math.max(...colCount);
    const colThr = Math.max(8, maxCol * 0.04);

    const cols = [];
    let cs = -1;
    let cgap = 0;
    for (let x = 0; x < w; x++) {
      if (colCount[x] > colThr) {
        if (cs < 0) cs = x;
        cgap = 0;
      } else if (cs >= 0) {
        cgap++;
        if (cgap >= 6) {
          cols.push([cs, x - cgap]);
          cs = -1;
          cgap = 0;
        }
      }
    }
    if (cs >= 0) cols.push([cs, w - 1]);

    const frames = cols
      .filter(([a, b]) => b - a > 30)
      .map(([x0, x1]) => {
        const sx = Math.max(0, x0 - 3);
        const sy = Math.max(0, top - 3);
        return {
          sx,
          sy,
          sw: Math.min(w, x1 + 4) - sx,
          sh: Math.min(h, bottom + 4) - sy,
        };
      });
    if (frames.length) rows.push(frames);
  }
  return rows;
}

/* ------------------------------------------------------------
   Bake a frame: scale down + delete connected background
   ------------------------------------------------------------ */
function bakeFrame(img, rect, targetH = 300) {
  const scale = Math.min(1, targetH / rect.sh);
  const w = Math.max(1, Math.round(rect.sw * scale));
  const h = Math.max(1, Math.round(rect.sh * scale));
  const c = makeCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);

  // Flood-fill the flat background from the borders so the sprite
  // can be composited over the mall without a grey box.
  try {
    const imgData = g.getImageData(0, 0, w, h);
    const d = imgData.data;
    const bg = [d[0], d[1], d[2]];
    const tol = 38;
    const seen = new Uint8Array(w * h);
    const keyed = new Uint8Array(w * h);
    const isBg = (idx) => {
      const i = idx * 4;
      if (d[i + 3] < 8) return true;
      return Math.abs(d[i] - bg[0]) <= tol &&
             Math.abs(d[i + 1] - bg[1]) <= tol &&
             Math.abs(d[i + 2] - bg[2]) <= tol;
    };
    const stack = [];
    for (let x = 0; x < w; x++) { stack.push(x); stack.push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { stack.push(y * w); stack.push(y * w + w - 1); }
    while (stack.length) {
      const idx = stack.pop();
      if (seen[idx]) continue;
      seen[idx] = 1;
      if (!isBg(idx)) continue;
      keyed[idx] = 1;
      d[idx * 4 + 3] = 0;
      const x = idx % w;
      const y = (idx - x) / w;
      if (x > 0) stack.push(idx - 1);
      if (x < w - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - w);
      if (y < h - 1) stack.push(idx + w);
    }

    // Remove enclosed leftovers of the paper background / baked ground
    // shadow (e.g. the flat grey gap between Yomvi's trouser legs).
    const nearBg = new Uint8Array(w * h);
    const bgTol = 18;
    for (let idx = 0; idx < w * h; idx++) {
      const i = idx * 4;
      if (d[i + 3] <= 8) continue;
      const dist = Math.max(
        Math.abs(d[i] - bg[0]),
        Math.abs(d[i + 1] - bg[1]),
        Math.abs(d[i + 2] - bg[2])
      );
      const y = (idx / w) | 0;
      if (dist <= bgTol && y > h * 0.55) nearBg[idx] = 1;
    }
    const seen2 = new Uint8Array(w * h);
    const comp = [];
    for (let idx = 0; idx < w * h; idx++) {
      if (!nearBg[idx] || seen2[idx]) continue;
      comp.length = 0;
      stack.length = 0;
      stack.push(idx);
      seen2[idx] = 1;
      while (stack.length) {
        const cur = stack.pop();
        comp.push(cur);
        const x = cur % w;
        const y = (cur - x) / w;
        if (x > 0 && nearBg[cur - 1] && !seen2[cur - 1]) { seen2[cur - 1] = 1; stack.push(cur - 1); }
        if (x < w - 1 && nearBg[cur + 1] && !seen2[cur + 1]) { seen2[cur + 1] = 1; stack.push(cur + 1); }
        if (y > 0 && nearBg[cur - w] && !seen2[cur - w]) { seen2[cur - w] = 1; stack.push(cur - w); }
        if (y < h - 1 && nearBg[cur + w] && !seen2[cur + w]) { seen2[cur + w] = 1; stack.push(cur + w); }
      }
      if (comp.length >= 40) {
        for (const cur of comp) {
          keyed[cur] = 1;
          d[cur * 4 + 3] = 0;
        }
      }
    }
    // soften anti-aliased halos touching the keyed background
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (keyed[idx]) continue;
        const a = d[idx * 4 + 3];
        if (a === 0) continue;
        if (keyed[idx - 1] || keyed[idx + 1] || keyed[idx - w] || keyed[idx + w]) {
          const dr = Math.abs(d[idx * 4] - bg[0]);
          const dg = Math.abs(d[idx * 4 + 1] - bg[1]);
          const db = Math.abs(d[idx * 4 + 2] - bg[2]);
          const dist = Math.max(dr, dg, db);
          if (dist < 80) d[idx * 4 + 3] = Math.round(a * clamp((dist - 38) / 42, 0, 1));
        }
      }
    }
    g.putImageData(imgData, 0, 0);
  } catch (e) {
    // ignore keying errors (should not happen after a successful scan)
  }
  return c;
}

/* ------------------------------------------------------------
   Asset manager
   ------------------------------------------------------------ */
const Assets = {
  hero: null,
  mainScreen: null,
  specialEffect: null,
  bosses: new Map(),

  async loadTitle(onStatus) {
    onStatus('CARGANDO A YOMVI Y LA PORTADA…', 30);
    [this.hero, this.mainScreen] = await Promise.all([
      this.trySheet('yomvi.jpg', 'PERSONAJE', 122),
      loadImage('cover.jpg'),
    ]);
    onStatus('¡LISTO!', 100);
  },

  async loadSpecialEffect() {
    this.specialEffect = await loadImage('special-effect.webp');
  },

  loadBoss(stageId, filename) {
    if (!this.bosses.has(stageId)) {
      const [key, height] = [['JEFE', 132], ['JEFE2', 146], ['JEFE3', 158]][stageId - 1];
      this.bosses.set(stageId, this.trySheet(filename, key, height));
    }
    return this.bosses.get(stageId);
  },

  async trySheet(filename, key, targetH) {
    const img = await loadImage(filename);
    if (!img) return null;

    try {
      let rows = analyzeSheet(img);
      // Hand-drawn sheets with a soft grey gradient can collapse into one
      // giant band with a merged frame. Retry with the adaptive scanner.
      const widest = rows.reduce((m, row) => Math.max(m, ...row.map(f => f.sw)), 0);
      if (rows.length === 1 && widest > (img.naturalWidth || img.width) * 0.4) {
        const alt = analyzeSheetAdaptive(img);
        if (alt.length > rows.length) rows = alt;
      }
      if (!rows.length) throw new Error('no frames');

      // Bake every detected frame, then map the sheet rows to game poses:
      // row 1 = neutral stances, row 2 = walk cycle, row 3 = action poses.
      const baked = rows.map((row) => row.map((rect) => bakeFrame(img, rect, 300)));

      // The action row in these sheets leans toward the left. Mirror it so
      // every animation faces the same way as the profile walk cycle.
      if (baked.length >= 3) {
        const actionRow = baked.length - 1;
        baked[actionRow] = baked[actionRow].map((c) => mirrorCanvas(c));
      }

      const frames = {
        idle: [],
        walk: [],
        attack: [],
        hurt: [],
        jump: [],
        special: [],
      };

      const pick = (arr, i) => arr[Math.min(i, arr.length - 1)];
      const r0 = baked[0] || [];
      const r1 = baked[1] || r0;
      const r2 = baked[2] || r1;

      let portraitFrame;

      // GAYTELOS sheet: two hand-drawn rows (7 neutral/walk poses on top,
      // 6 stride/attack poses below). Map them explicitly so the walk cycle
      // does not accidentally play the back views or the punch frames.
      if (key === 'JEFE3' && baked.length === 2 && r0.length >= 6 && r1.length >= 5) {
        const faceRight = (c) => mirrorCanvas(c);
        // Top row faces left; mirror it so the base art faces right and the
        // engine's flip-on-facing keeps working. Punch frames already face
        // right, so they stay untouched.
        frames.idle = [faceRight(r0[1])];
        frames.walk = [
          faceRight(r0[5]),
          faceRight(r1[0]),
          faceRight(r0[2]),
          faceRight(r1[1]),
        ];
        frames.attack = [r1[4], r1[3]];
        frames.hurt = [faceRight(r0[1])];
        frames.jump = [faceRight(r0[2])];
        frames.special = [r1[4], r1[3]];
        portraitFrame = r0[0];
      } else {
        // Neutral: prefer the three-quarter stance over the straight-on/back views.
        frames.idle = [pick(r0, 1) || r0[0] || r1[0] || r2[0]];
        // Walking: the dedicated profile walk row.
        frames.walk = r1.length > 1 ? r1 : (r0.length > 1 ? r0.slice(1) : r0);
        // Actions: the last (action) row.
        frames.attack = r2.length ? r2 : r0;
        // Hurt: first action pose (lean back / duck).
        frames.hurt = [r2[0] || r1[0] || r0[0]];
        // Jump: a mid-stride profile frame, tilted at draw time.
        frames.jump = [r1[1] || r1[0] || r2[0] || r0[0]];
        // Spin / special: the full action row.
        frames.special = r2.length ? r2 : r0;
        portraitFrame = r0[0] || r1[0] || r2[0];
      }

      const portrait = makePortrait(portraitFrame, 0.5, 0.62, 0.44);

      const totalFrames = Object.values(frames).reduce((n, a) => n + a.length, 0);
      if (!totalFrames) throw new Error('zero baked frames');


      return {
        frames,
        targetH,
        pad: 0,
        procedural: false,
        sheet: true,
        antialias: true,
        blendWalk: true,
        portrait,
        path: filename,
      };
    } catch (e) {
      console.warn(`No se pudo analizar ${key}:`, e);
      this.notice = 'No se pudieron leer los píxeles del PNG (file://). Usa start.bat.';
      return null;
    }
  },
};

export { Assets };
