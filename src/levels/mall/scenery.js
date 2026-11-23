import { drawPixelNoise, makeBackdrop, makeCanvas } from '../../engine/canvas.js';
import { CFG, TAU, chance } from '../../engine/math.js';

const ZONES = [
  { start: 0, end: 3200, color: '#ffd166', key: 'mall', name: 'PASILLO CENTRAL', sub: 'GALERÍAS MALL · MARACAIBO', music: 'mall' },
  { start: 3200, end: 6000, color: '#5ad2ff', key: 'ice', name: 'PISTA DE HIELO', sub: 'ZONA RESBALADIZA', music: 'ice' },
  { start: 6000, end: 9200, color: '#ff5fae', key: 'arcade', name: 'ARCADE / VIDEOJUEGOS', sub: 'ARENA FINAL · ARTHAS', music: 'arcade' },
];

function neonText(g, str, x, y, size, color, glow = 18, align = 'center') {
  g.save();
  g.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.shadowColor = color;
  g.shadowBlur = glow;
  g.fillStyle = color;
  g.fillText(str, x, y);
  g.shadowBlur = glow * 0.55;
  g.fillStyle = '#ffffff';
  g.globalAlpha = 0.55;
  g.fillText(str, x, y - 1);
  g.restore();
}

function buildMall(stage) {
  const w = 3200, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // ceiling
  g.fillStyle = '#241a33';
  g.fillRect(0, 0, w, 46);
  g.fillStyle = '#2f2344';
  for (let x = 0; x < w; x += 160) g.fillRect(x, 0, 12, 46);
  g.fillStyle = '#160f22';
  g.fillRect(0, 44, w, 6);

  // ceiling lights
  for (let x = 80; x < w; x += 200) {
    const lg = g.createRadialGradient(x, 30, 2, x, 30, 60);
    lg.addColorStop(0, 'rgba(255, 236, 190, 0.9)');
    lg.addColorStop(0.35, 'rgba(255, 220, 150, 0.28)');
    lg.addColorStop(1, 'rgba(255, 220, 150, 0)');
    g.fillStyle = lg;
    g.fillRect(x - 62, 0, 124, 110);
    g.fillStyle = '#fff4cf';
    g.fillRect(x - 28, 26, 56, 5);
    g.fillStyle = '#ffe7a3';
    g.fillRect(x - 24, 31, 48, 2);
    stage.neonSigns.push({ type: 'light', x: x, y: 34, color: '#ffe7a3', r: 50 });
  }

  // upper wall
  const wall = g.createLinearGradient(0, 48, 0, 322);
  wall.addColorStop(0, '#fbe6d6');
  wall.addColorStop(0.5, '#f4d2c1');
  wall.addColorStop(1, '#e9bba8');
  g.fillStyle = wall;
  g.fillRect(0, 48, w, 274);

  // upper floor railing & ledge
  g.fillStyle = '#d9a48e';
  g.fillRect(0, 248, w, 10);
  g.fillStyle = '#f0c6b2';
  g.fillRect(0, 246, w, 4);
  g.fillStyle = '#b9846f';
  for (let x = 20; x < w; x += 46) {
    g.fillRect(x, 222, 4, 26);
    g.fillRect(x + 16, 226, 4, 22);
  }
  g.fillStyle = '#e8bda9';
  g.fillRect(0, 216, w, 6);
  // faux plants on the ledge
  for (let x = 90; x < w; x += 260) {
    g.fillStyle = '#2f7d4d';
    g.fillRect(x, 206, 22, 12);
    g.fillStyle = '#3fa564';
    g.fillRect(x + 3, 201, 16, 8);
    g.fillStyle = '#5cc47c';
    g.fillRect(x + 7, 197, 8, 6);
    g.fillStyle = '#a9603d';
    g.fillRect(x + 6, 214, 12, 6);
  }

  // hanging banners
  for (let x = 40; x < w; x += 120) {
    const cols = ['#ff5fae', '#5ad2ff', '#ffe066', '#7dffc4'];
    g.fillStyle = cols[(x / 120) % cols.length | 0];
    g.beginPath();
    g.moveTo(x, 46);
    g.lineTo(x + 34, 46);
    g.lineTo(x + 26, 86);
    g.lineTo(x + 17, 74);
    g.lineTo(x + 8, 86);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.fillRect(x + 8, 50, 3, 22);
  }

  // storefronts
  const shops = [
    { x: 40, w: 300, name: 'DULCES MARACAIBO', color: '#ff5fae', accent: '#ffd166', kind: 'sweet' },
    { x: 390, w: 270, name: 'CINE GALAXIA', color: '#5ad2ff', accent: '#ffffff', kind: 'cinema' },
    { x: 710, w: 290, name: 'ZAPATOS 2000', color: '#ffe066', accent: '#ff8a3d', kind: 'shoes' },
    { x: 1050, w: 250, name: 'HELADOS POLAR', color: '#7dffc4', accent: '#ffffff', kind: 'ice' },
    { x: 1350, w: 210, name: 'PASTELITOS', color: '#ff9f43', accent: '#ffe066', kind: 'food' },
    { x: 1608, w: 280, name: 'MÚSICA 2000', color: '#c18fff', accent: '#5ad2ff', kind: 'shoes' },
    { x: 1940, w: 260, name: 'MODA CARIBE', color: '#ffd166', accent: '#ff5fae', kind: 'ice' },
    { x: 2252, w: 280, name: 'JUEGOS YOMVI', color: '#5ad2ff', accent: '#ffe066', kind: 'cinema' },
    { x: 2582, w: 260, name: 'CAFÉ MARACAIBO', color: '#7dffc4', accent: '#ffffff', kind: 'food' },
    { x: 2892, w: 268, name: 'TEQUEÑOS', color: '#ff9f43', accent: '#ffd166', kind: 'sweet' },
  ];

  const drawShop = (s) => {
    const sy = 96;
    const sh = 148;
    // sign panel
    g.fillStyle = '#241b2e';
    g.fillRect(s.x, sy - 34, s.w, 34);
    g.fillStyle = '#38284a';
    g.fillRect(s.x + 3, sy - 31, s.w - 6, 28);
    g.strokeStyle = s.color;
    g.globalAlpha = 0.5;
    g.lineWidth = 2;
    g.strokeRect(s.x + 4, sy - 30, s.w - 8, 26);
    g.globalAlpha = 1;
    neonText(g, s.name, s.x + s.w / 2, sy - 15, s.w > 260 ? 18 : 15, s.color, 16);
    stage.neonSigns.push({ type: 'sign', x: s.x + s.w / 2, y: sy - 15, color: s.color, r: 70 });

    // window frame
    g.fillStyle = '#3a2c3e';
    g.fillRect(s.x, sy, s.w, sh);
    g.fillStyle = '#4d3a52';
    g.fillRect(s.x + 4, sy + 4, s.w - 8, sh - 8);

    // glass
    const glass = g.createLinearGradient(0, sy, 0, sy + sh);
    glass.addColorStop(0, '#6d8f9b');
    glass.addColorStop(0.6, '#40586a');
    glass.addColorStop(1, '#273243');
    g.fillStyle = glass;
    g.fillRect(s.x + 9, sy + 9, s.w - 18, sh - 22);

    // interior shelves / silhouettes
    g.save();
    g.beginPath();
    g.rect(s.x + 9, sy + 9, s.w - 18, sh - 22);
    g.clip();

    if (s.kind === 'cinema') {
      g.fillStyle = '#12121e';
      g.fillRect(s.x + 9, sy + 9, s.w - 18, sh - 22);
      g.fillStyle = '#2a2a44';
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 7; k++) {
          g.fillRect(s.x + 28 + k * 30, sy + 60 + r * 22, 20, 12);
        }
      }
      g.fillStyle = '#5ad2ff';
      g.globalAlpha = 0.35;
      g.fillRect(s.x + 20, sy + 18, s.w - 40, 30);
      g.globalAlpha = 0.8;
      g.fillStyle = '#ffe6b0';
      g.fillRect(s.x + 30, sy + 30, 26, 16);
      g.fillStyle = '#d9534f';
      g.fillRect(s.x + 200, sy + 29, 26, 17);
      g.globalAlpha = 1;
    } else if (s.kind === 'shoes') {
      g.fillStyle = '#3b2c35';
      g.fillRect(s.x + 9, sy + 9, s.w - 18, sh - 22);
      for (let r = 0; r < 3; r++) {
        g.fillStyle = '#8a6a5a';
        g.fillRect(s.x + 22, sy + 44 + r * 30, s.w - 44, 4);
        for (let k = 0; k < 5; k++) {
          g.fillStyle = ['#ff8a3d', '#ffe066', '#5ad2ff', '#ff5fae', '#ffffff'][k];
          g.fillRect(s.x + 30 + k * 42, sy + 30 + r * 30, 20, 13);
          g.fillStyle = 'rgba(0,0,0,0.35)';
          g.fillRect(s.x + 30 + k * 42, sy + 40 + r * 30, 20, 3);
        }
      }
    } else if (s.kind === 'sweet' || s.kind === 'food') {
      g.fillStyle = '#4a2e35';
      g.fillRect(s.x + 9, sy + 9, s.w - 18, sh - 22);
      const colors = ['#ffcf6b', '#ff8fa8', '#a8e6cf', '#ffd166'];
      for (let r = 0; r < 3; r++) {
        g.fillStyle = '#6a444f';
        g.fillRect(s.x + 20, sy + 46 + r * 32, s.w - 40, 5);
        for (let k = 0; k < 7; k++) {
          g.fillStyle = colors[(k + r) % colors.length];
          g.fillRect(s.x + 28 + k * 32, sy + 33 + r * 32, 16, 12);
          g.fillStyle = 'rgba(255,255,255,0.35)';
          g.fillRect(s.x + 31 + k * 32, sy + 35 + r * 32, 5, 2);
        }
      }
    } else {
      g.fillStyle = '#35505c';
      g.fillRect(s.x + 9, sy + 9, s.w - 18, sh - 22);
      g.fillStyle = '#f4f7ff';
      for (let k = 0; k < 4; k++) {
        const mx = s.x + 36 + k * 52;
        g.fillRect(mx, sy + 40, 18, 10);
        g.fillRect(mx + 2, sy + 50, 14, 40);
        g.fillStyle = '#ffe066';
        g.fillRect(mx + 2, sy + 92, 6, 18);
        g.fillRect(mx + 10, sy + 92, 6, 18);
        g.fillStyle = '#f4f7ff';
      }
    }

    // glass reflections
    g.globalAlpha = 0.14;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(s.x + 20, sy + 10);
    g.lineTo(s.x + 90, sy + 10);
    g.lineTo(s.x + 30, sy + sh - 12);
    g.lineTo(s.x + 12, sy + sh - 12);
    g.closePath();
    g.fill();
    g.globalAlpha = 0.08;
    g.beginPath();
    g.moveTo(s.x + s.w * 0.55, sy + 10);
    g.lineTo(s.x + s.w * 0.72, sy + 10);
    g.lineTo(s.x + s.w * 0.42, sy + sh - 12);
    g.lineTo(s.x + s.w * 0.3, sy + sh - 12);
    g.closePath();
    g.fill();
    g.restore();

    // window frame mullions
    g.fillStyle = '#3a2c3e';
    g.fillRect(s.x + s.w / 2 - 2, sy + 4, 4, sh - 8);
    g.fillRect(s.x + 4, sy + sh * 0.55, s.w - 8, 4);

    // awning
    g.fillStyle = s.accent;
    for (let x = s.x + 2; x < s.x + s.w - 2; x += 26) {
      g.fillRect(x, sy - 2, 13, 7);
    }
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(s.x, sy + 3, s.w, 2);
  };

  shops.forEach(drawShop);

  // pillars
  for (let x = 360; x < w; x += 330) {
    g.fillStyle = '#e5b49e';
    g.fillRect(x, 58, 26, 264);
    g.fillStyle = '#f6d3bf';
    g.fillRect(x + 3, 58, 6, 264);
    g.fillStyle = '#c48e78';
    g.fillRect(x + 20, 58, 6, 264);
    g.fillStyle = '#f0c6b2';
    g.fillRect(x - 4, 250, 34, 10);
    g.fillStyle = '#b9846f';
    g.fillRect(x - 6, 300, 38, 22);
    g.fillStyle = '#8e6152';
    g.fillRect(x - 6, 318, 38, 4);
  }

  // wall base / skirting
  g.fillStyle = '#cf9b86';
  g.fillRect(0, 300, w, 22);
  g.fillStyle = '#b9826c';
  g.fillRect(0, 316, w, 6);
  // pastel wall tiles
  g.globalAlpha = 0.35;
  g.fillStyle = '#ffffff';
  for (let x = 0; x < w; x += 18) {
    for (let y = 302; y < 316; y += 7) {
      g.fillRect(x + (y % 14), y, 1, 6);
    }
  }
  g.globalAlpha = 1;

  // ---------------- floor ----------------
  let y = 322, bh = 13, row = 0;
  while (y < h) {
    const stepH = bh + row * 1.6;
    for (let x = 0; x < w; x += 64) {
      const alt = ((x / 64 | 0) + row) % 2 === 0;
      g.fillStyle = alt ? '#f6e2cc' : '#ecc5b9';
      g.fillRect(x, y, 64, stepH);
    }
    g.fillStyle = 'rgba(130, 88, 76, 0.16)';
    g.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = 'rgba(130, 88, 76, 0.12)';
      g.fillRect(x, y, 1, stepH);
    }
    y += stepH;
    row++;
  }

  // glossy reflections of ceiling lights
  for (let x = 80; x < w; x += 200) {
    const rg = g.createLinearGradient(x, 322, x, 500);
    rg.addColorStop(0, 'rgba(255,238,200,0.20)');
    rg.addColorStop(1, 'rgba(255,238,200,0.0)');
    g.fillStyle = rg;
    g.fillRect(x - 26, 322, 52, 170);
  }

  // mall medallions
  for (const mx of [800, 2400]) {
    g.save();
    g.globalAlpha = 0.16;
    g.strokeStyle = '#b57966';
    g.lineWidth = 8;
    g.beginPath();
    g.ellipse(mx, 430, 180, 60, 0, 0, TAU);
    g.stroke();
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(mx, 430, 140, 46, 0, 0, TAU);
    g.stroke();
    g.font = '900 54px "Arial Black", sans-serif';
    g.fillStyle = '#9a5e4b';
    g.textAlign = 'center';
    g.fillText('G', mx, 450);
    g.restore();
  }

  drawPixelNoise(g, 0, 48, w, 270, '#ffffff', 7, 0.05);

  // zone transition pillar
  g.fillStyle = '#3a2c3e';
  g.fillRect(w - 18, 40, 18, 282);
  g.fillStyle = '#5a4560';
  g.fillRect(w - 18, 40, 5, 282);

  return g.canvas;
}

function buildRink(stage) {
  const w = 2800, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // cold dark ceiling
  g.fillStyle = '#071226';
  g.fillRect(0, 0, w, 60);
  g.fillStyle = '#0c1e39';
  for (let x = 0; x < w; x += 130) g.fillRect(x, 0, 10, 60);

  // spotlights
  for (let x = 160; x < w; x += 320) {
    g.fillStyle = '#cfe9ff';
    g.globalAlpha = 0.9;
    g.fillRect(x - 16, 44, 32, 6);
    g.globalAlpha = 1;
    const lg = g.createLinearGradient(x, 50, x, 300);
    lg.addColorStop(0, 'rgba(180, 226, 255, 0.20)');
    lg.addColorStop(1, 'rgba(180, 226, 255, 0)');
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(x - 20, 50);
    g.lineTo(x + 20, 50);
    g.lineTo(x + 130, 310);
    g.lineTo(x - 130, 310);
    g.closePath();
    g.fill();
    stage.neonSigns.push({ type: 'spot', x, y: 60, color: '#bfe4ff', r: 90, zone: 1 });
  }

  // back wall
  const bw = g.createLinearGradient(0, 60, 0, 130);
  bw.addColorStop(0, '#0b1b33');
  bw.addColorStop(1, '#163a5e');
  g.fillStyle = bw;
  g.fillRect(0, 60, w, 74);

  // hanging banners
  g.fillStyle = '#0e2744';
  g.fillRect(0, 70, w, 26);
  for (let x = 40; x < w; x += 300) {
    g.fillStyle = '#12365c';
    g.fillRect(x, 74, 220, 50);
    g.strokeStyle = '#4aa8e0';
    g.globalAlpha = 0.6;
    g.strokeRect(x + 4, 78, 212, 42);
    g.globalAlpha = 1;
    neonText(g, 'GALERÍAS', x + 110, 91, 15, '#8fd8ff', 10);
    g.fillStyle = '#b9d9ee';
    g.font = 'bold 9px "Courier New", monospace';
    g.textAlign = 'center';
    g.fillText('MARACAIBO · PISTA DE HIELO', x + 110, 114);
    stage.neonSigns.push({ type: 'sign', x: x + 110, y: 91, color: '#8fd8ff', r: 50, zone: 1 });
  }

  // ice rink
  const iceX0 = 30, iceX1 = w - 110, iceX2 = w - 220, iceX3 = 140;
  const iceY0 = 130, iceY1 = 296;
  g.beginPath();
  g.moveTo(iceX0, iceY0);
  g.lineTo(iceX1, iceY0);
  g.lineTo(iceX2, iceY1);
  g.lineTo(iceX3, iceY1);
  g.closePath();
  const ice = g.createLinearGradient(0, iceY0, 0, iceY1);
  ice.addColorStop(0, '#e8f7ff');
  ice.addColorStop(0.55, '#c3e5f6');
  ice.addColorStop(1, '#a2d0e9');
  g.fillStyle = ice;
  g.fill();

  // rink markings
  g.save();
  g.beginPath();
  g.moveTo(iceX0, iceY0);
  g.lineTo(iceX1, iceY0);
  g.lineTo(iceX2, iceY1);
  g.lineTo(iceX3, iceY1);
  g.closePath();
  g.clip();

  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(140, 205);
  g.lineTo(w - 200, 205);
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(w / 2, 212, 260, 62, 0, 0, TAU);
  g.stroke();
  g.beginPath();
  g.ellipse(w / 2, 212, 330, 84, 0, 0, TAU);
  g.stroke();

  // skate marks
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 22; i++) {
    const x = 100 + (i * 233) % (w - 300);
    const yy = 150 + (i * 71) % 120;
    g.beginPath();
    g.arc(x, yy, 20 + (i % 5) * 8, 0.2 + i, 1.8 + i);
    g.stroke();
  }

  // logo on the ice
  g.globalAlpha = 0.22;
  g.font = '900 56px "Arial Black", sans-serif';
  g.fillStyle = '#2f6c95';
  g.textAlign = 'center';
  g.fillText('GALERÍAS', w / 2, 208);
  g.font = 'bold 22px "Courier New", monospace';
  g.fillText('ICE  RINK · 1991', w / 2, 240);
  g.globalAlpha = 1;
  g.restore();

  // rink boards
  g.fillStyle = '#e8f3fb';
  g.fillRect(0, 288, w, 14);
  g.fillStyle = '#2f77a8';
  g.fillRect(0, 296, w, 10);
  g.fillStyle = '#a9cfe6';
  for (let x = 0; x < w; x += 60) {
    g.fillRect(x, 288, 2, 20);
  }
  // ad boards
  for (let x = 60; x < w; x += 260) {
    g.fillStyle = '#0e2a46';
    g.fillRect(x, 300, 150, 8);
    g.fillStyle = '#66c6f2';
    g.font = 'bold 7px "Courier New", monospace';
    g.textAlign = 'center';
    g.fillText('HELADOS · TEQUEÑOS · GALERÍAS', x + 75, 307);
  }

  // railings in front of rink
  g.fillStyle = 'rgba(20, 60, 96, 0.9)';
  g.fillRect(0, 310, w, 5);
  g.fillStyle = '#9ecce8';
  g.fillRect(0, 309, w, 2);
  for (let x = 14; x < w; x += 52) {
    g.fillStyle = '#7fb4d6';
    g.fillRect(x, 309, 3, 14);
    g.fillStyle = '#3b7299';
    g.fillRect(x, 319, 5, 3);
  }
  g.fillStyle = '#265c82';
  g.fillRect(0, 318, w, 3);

  // floor — icy tiles
  g.fillStyle = '#a9cfe2';
  g.fillRect(0, 321, w, h - 321);
  let y = 321, bh = 13, row = 0;
  while (y < h) {
    const sh = bh + row * 1.7;
    for (let x = 0; x < w; x += 60) {
      const alt = ((x / 60 | 0) + row) % 2 === 0;
      g.fillStyle = alt ? '#bfe0ef' : '#a6cde2';
      g.fillRect(x, y, 60, sh);
    }
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, y, w, 1);
    y += sh;
    row++;
  }
  // frosty glaze streaks
  for (let i = 0; i < 30; i++) {
    const x = (i * 173) % w;
    const yy = 330 + (i * 97) % 190;
    g.globalAlpha = 0.16 + (i % 4) * 0.04;
    g.fillStyle = '#ffffff';
    g.fillRect(x, yy, 60 + (i % 5) * 22, 2);
  }
  g.globalAlpha = 1;

  // blue light pools
  for (let x = 160; x < w; x += 320) {
    g.fillStyle = 'rgba(140, 216, 255, 0.10)';
    g.beginPath();
    g.ellipse(x, 420, 150, 46, 0, 0, TAU);
    g.fill();
  }

  // "SLIPPERY" floor stencil
  g.save();
  g.translate(1600, 452);
  g.rotate(-0.06);
  g.globalAlpha = 0.34;
  g.fillStyle = '#1b5a82';
  g.fillRect(-130, -22, 260, 40);
  g.fillStyle = '#d9f3ff';
  g.font = '900 20px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText('¡RESBALADIZO!', 0, 7);
  g.restore();

  // transition edges
  g.fillStyle = '#163a5e';
  g.fillRect(0, 0, 14, 300);
  g.fillStyle = '#2c6a92';
  g.fillRect(w - 10, 0, 10, 300);

  drawPixelNoise(g, 0, 60, w, 260, '#ffffff', 9, 0.045);

  return g.canvas;
}

function buildArcade(stage) {
  const w = 3200, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // ceiling
  g.fillStyle = '#0d0718';
  g.fillRect(0, 0, w, 56);
  g.fillStyle = '#1a0f2b';
  g.fillRect(0, 40, w, 16);

  // string lights
  for (let x = 20; x < w; x += 80) {
    const yy = 30 + Math.sin(x * 0.02) * 8;
    g.fillStyle = '#2a1c44';
    g.fillRect(x, 0, 2, yy);
    const cols = ['#ff4f8b', '#5ad2ff', '#ffe066', '#7dffc4'];
    const col = cols[(x / 80) % 4 | 0];
    g.save();
    g.shadowColor = col;
    g.shadowBlur = 12;
    g.fillStyle = col;
    g.fillRect(x - 3, yy, 8, 8);
    g.restore();
  }

  // back wall
  const wall = g.createLinearGradient(0, 56, 0, 320);
  wall.addColorStop(0, '#1a0f2c');
  wall.addColorStop(0.6, '#241236');
  wall.addColorStop(1, '#301640');
  g.fillStyle = wall;
  g.fillRect(0, 56, w, 266);

  // wall grid / panels
  g.strokeStyle = 'rgba(120, 70, 180, 0.22)';
  g.lineWidth = 2;
  for (let x = 0; x < w; x += 64) {
    g.beginPath();
    g.moveTo(x, 56);
    g.lineTo(x, 322);
    g.stroke();
  }
  for (let y = 70; y < 320; y += 44) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }

  // entrance archway
  const ax = 16, aw = 150;
  g.fillStyle = '#120a20';
  g.fillRect(ax - 6, 60, aw + 12, 262);
  g.fillStyle = '#2a1746';
  g.fillRect(ax, 96, 24, 226);
  g.fillRect(ax + aw - 24, 96, 24, 226);
  g.fillStyle = '#3c2361';
  g.fillRect(ax + 4, 100, 8, 218);
  g.fillRect(ax + aw - 20, 100, 8, 218);
  g.fillStyle = '#0a0614';
  g.beginPath();
  g.moveTo(ax + 24, 112);
  g.quadraticCurveTo(ax + aw / 2, 50, ax + aw - 24, 112);
  g.lineTo(ax + aw - 24, 322);
  g.lineTo(ax + 24, 322);
  g.closePath();
  g.fill();
  // neon arch
  g.strokeStyle = '#ff4f8b';
  g.lineWidth = 5;
  g.shadowColor = '#ff4f8b';
  g.shadowBlur = 18;
  g.beginPath();
  g.moveTo(ax + 22, 322);
  g.lineTo(ax + 22, 108);
  g.quadraticCurveTo(ax + aw / 2, 42, ax + aw - 22, 108);
  g.lineTo(ax + aw - 22, 322);
  g.stroke();
  g.shadowBlur = 0;
  neonText(g, 'ARCADE', ax + aw / 2, 88, 22, '#ffe066', 20);
  neonText(g, 'VIDEOJUEGOS', ax + aw / 2, 108, 11, '#5ad2ff', 12);
  stage.neonSigns.push({ type: 'sign', x: 6000 + ax + aw / 2, y: 90, color: '#ffe066', r: 120, zone: 2 });
  stage.neonSigns.push({ type: 'sign', x: 6000 + ax + aw / 2, y: 110, color: '#5ad2ff', r: 80, zone: 2 });

  // arcade cabinets along the back wall
  const titles = [
    ['DDR', 'DANCE REVOLUTION', '#5ad2ff'],
    ['MALL FIGHTER II', 'VS MODE', '#ffe066'],
    ['MALL BRAWLERS', '2 PLAYER', '#ff6b9d'],
    ['PASTEL-MAN', 'EAT ALL', '#ffe066'],
    ['TURBO RACE', 'MARACAIBO GP', '#5ad2ff'],
    ['ALIEN RINK', 'CO-OP', '#7dffc4'],
    ['KOMBAT 91', 'FINISH HIM', '#ff5f5f'],
    ['YOMVI', 'ADVENTURES', '#ff9f43'],
    ['RHYTHM RINK', 'DANCE FEVER', '#7dffc4'],
    ['GALAXY RAID', 'CO-OP', '#5ad2ff'],
    ['SKATE OR DIE', 'STREET', '#ff9f43'],
    ['NEON FIGHTER', 'VS MODE', '#ff5f5f'],
    ['PIZZA TIME', 'EAT ALL', '#ffe066'],
    ['SHADOW OPS', 'STEALTH', '#c18fff'],
    ['TURBO 2', 'DRIFT', '#5ad2ff'],
    ['BEAST RUSH', '2 PLAYER', '#ff6b9d'],
    ['MEGA RINK', 'ICE STAGE', '#7dffc4'],
    ['BOSS RUSH', 'ENDLESS', '#ffe066'],
  ];

  const cabY = 130, cabH = 190, cabW = 112;
  for (let i = 0; i < titles.length; i++) {
    const x = 236 + i * 156;
    if (x + cabW > w - 16) break;
    const [title, sub, col] = titles[i];
    // cabinet body
    g.fillStyle = '#120c1e';
    g.fillRect(x - 4, cabY - 4, cabW + 8, cabH + 8);
    g.fillStyle = '#2a1b44';
    g.fillRect(x, cabY, cabW, cabH);
    g.fillStyle = '#37245a';
    g.fillRect(x + 4, cabY + 4, 8, cabH - 8);
    g.fillStyle = '#1d1233';
    g.fillRect(x + cabW - 14, cabY + 4, 10, cabH - 8);
    // marquee
    g.fillStyle = '#0a0612';
    g.fillRect(x + 8, cabY + 8, cabW - 16, 34);
    g.save();
    g.shadowColor = col;
    g.shadowBlur = 10;
    g.fillStyle = col;
    g.font = '900 10px "Arial Black", sans-serif';
    g.textAlign = 'center';
    g.fillText(title, x + cabW / 2, cabY + 24);
    g.shadowBlur = 0;
    g.fillStyle = '#c9b7e8';
    g.font = 'bold 6px "Courier New", monospace';
    g.fillText(sub, x + cabW / 2, cabY + 35);
    g.restore();
    // screen bezel
    g.fillStyle = '#08050f';
    g.fillRect(x + 10, cabY + 48, cabW - 20, 62);
    g.fillStyle = '#0e2b3a';
    g.fillRect(x + 14, cabY + 52, cabW - 28, 54);
    // simple screen art
    g.fillStyle = col;
    g.globalAlpha = 0.7;
    g.fillRect(x + 20, cabY + 60, 20, 12);
    g.fillRect(x + 60, cabY + 72, 18, 20);
    g.globalAlpha = 1;
    g.fillStyle = '#0a0612';
    g.fillRect(x + 10, cabY + 44, cabW - 20, 4);
    // control panel
    g.fillStyle = '#3d2a62';
    g.fillRect(x + 6, cabY + 114, cabW - 12, 18);
    g.fillStyle = '#211638';
    g.fillRect(x + 6, cabY + 129, cabW - 12, 4);
    g.fillStyle = '#ff4f8b';
    g.fillRect(x + 20, cabY + 118, 6, 6);
    g.fillStyle = '#5ad2ff';
    g.fillRect(x + 34, cabY + 118, 6, 6);
    g.fillStyle = '#ffe066';
    g.beginPath();
    g.arc(x + 55, cabY + 121, 5, 0, TAU);
    g.fill();
    // lower panel
    g.fillStyle = '#1a112b';
    g.fillRect(x + 10, cabY + 140, cabW - 20, 42);
    g.fillStyle = '#0a0612';
    g.fillRect(x + 26, cabY + 152, 26, 12);
    g.fillStyle = '#ffe066';
    g.fillRect(x + 30, cabY + 156, 4, 4);
    g.fillStyle = '#6b4e99';
    for (let s = 0; s < 3; s++) g.fillRect(x + 70, cabY + 150 + s * 8, 20, 3);
    // side glow
    g.fillStyle = col;
    g.globalAlpha = 0.12;
    g.fillRect(x - 4, cabY, 4, cabH);
    g.globalAlpha = 1;

    stage.crtScreens.push({
      x: 6000 + x + 14,
      y: cabY + 52,
      w: cabW - 28,
      h: 54,
      color: col,
      phase: i * 1.7,
    });
    stage.neonSigns.push({ type: 'marquee', x: 6000 + x + cabW / 2, y: cabY + 24, color: col, r: 40, zone: 2 });
  }

  // neon graffiti
  g.save();
  g.translate(1400, 112);
  g.rotate(-0.03);
  g.shadowColor = '#ff2e63';
  g.shadowBlur = 18;
  g.fillStyle = '#ff2e63';
  g.font = '900 30px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText('ARTHAS', 0, 0);
  g.shadowBlur = 0;
  g.fillStyle = '#5ad2ff';
  g.font = 'bold 10px "Courier New", monospace';
  g.fillText('WAS HERE', 0, 16);
  g.strokeStyle = '#ffe066';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-76, 6);
  g.lineTo(-96, -6);
  g.lineTo(-88, -14);
  g.stroke();
  g.restore();
  stage.neonSigns.push({ type: 'sign', x: 7400, y: 120, color: '#ff2e63', r: 130, zone: 2 });

  // neon carpet floor
  g.fillStyle = '#170d26';
  g.fillRect(0, 320, w, h - 320);
  g.save();
  g.beginPath();
  g.rect(0, 320, w, h - 320);
  g.clip();

  // perspective zig-zag pattern
  for (let yy = 322, row = 0; yy < h; row++) {
    const rowH = 14 + row * 2.2;
    for (let xx = -40; xx < w + 80; xx += 96) {
      const off = (row % 2) * 48;
      const col = row % 3 === 0 ? '#ff2e8a' : row % 3 === 1 ? '#31d7ff' : '#ffe066';
      g.globalAlpha = 0.16;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(xx + off, yy);
      g.lineTo(xx + off + 48, yy);
      g.lineTo(xx + off + 24, yy + rowH);
      g.closePath();
      g.fill();
      g.globalAlpha = 0.10;
      g.beginPath();
      g.moveTo(xx + off + 48, yy);
      g.lineTo(xx + off + 96, yy);
      g.lineTo(xx + off + 72, yy + rowH);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 0.35;
    g.fillStyle = '#2b1745';
    g.fillRect(0, yy, w, 1);
    yy += rowH;
  }
  g.globalAlpha = 1;

  // reflection streaks
  for (const crt of stage.crtScreens) {
    const localX = crt.x - 6000;
    const rg = g.createLinearGradient(localX, 322, localX, 540);
    rg.addColorStop(0, crt.color + '33');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(localX - 8, 322, crt.w + 16, 200);
  }
  g.restore();

  // dance pads (DDR) on the floor
  g.save();
  g.globalAlpha = 0.85;
  for (const px of [1180, 2260]) {
    g.fillStyle = '#0a0612';
    g.fillRect(px, 400, 120, 56);
    g.fillStyle = '#141726';
    g.fillRect(px + 4, 404, 112, 48);
    g.fillStyle = '#ff4f8b';
    g.fillRect(px + 10, 410, 44, 32);
    g.fillStyle = '#5ad2ff';
    g.fillRect(px + 66, 410, 44, 32);
    g.fillStyle = '#ffe066';
    g.fillRect(px + 10, 418, 44, 8);
    g.fillStyle = '#7dffc4';
    g.fillRect(px + 66, 418, 44, 8);
    // directional arrows
    g.fillStyle = 'rgba(10,6,18,0.55)';
    g.fillRect(px + 26, 412, 12, 12);
    g.fillRect(px + 82, 412, 12, 12);
    g.fillStyle = '#ffe066';
    g.beginPath();
    g.moveTo(px + 32, 414); g.lineTo(px + 37, 421); g.lineTo(px + 27, 421); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(px + 88, 422); g.lineTo(px + 93, 415); g.lineTo(px + 83, 415); g.closePath(); g.fill();
    g.fillStyle = '#0a0612';
    for (let i = 0; i < 4; i++) {
      g.fillRect(px + 4, 404 + i * 14, 3, 3);
      g.fillRect(px + 113, 404 + i * 14, 3, 3);
    }
  }
  g.restore();

  // skirting black
  g.fillStyle = '#0c0716';
  g.fillRect(0, 316, w, 6);

  drawPixelNoise(g, 0, 56, w, 260, '#ff7ae0', 11, 0.04);

  return g.canvas;
}

/* A doorway that masks the seam between two pre-rendered zones. */
function buildMallGate(stage, label, sub, color) {
  const w = 300, h = 540;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');

  // dark portal interior (covers the hard background cut)
  const inner = g.createLinearGradient(0, 70, 0, 330);
  inner.addColorStop(0, '#0a0a18');
  inner.addColorStop(0.55, '#111a2c');
  inner.addColorStop(1, '#070610');
  g.fillStyle = inner;
  g.fillRect(34, 0, 232, 330);

  // glass sheen inside the portal
  g.save();
  g.globalAlpha = 0.10;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(48, 0);
  g.lineTo(104, 0);
  g.lineTo(60, 330);
  g.lineTo(34, 330);
  g.closePath();
  g.fill();
  ctxGlowLines: {
    g.globalAlpha = 0.25;
    g.strokeStyle = color;
    for (let y = 150; y < 320; y += 26) {
      g.beginPath();
      g.moveTo(46, y);
      g.lineTo(254, y);
      g.stroke();
    }
  }
  g.restore();

  // pillars
  for (const px of [0, 264]) {
    g.fillStyle = '#241a36';
    g.fillRect(px, 0, 36, 330);
    g.fillStyle = '#3b2a58';
    g.fillRect(px + 4, 0, 8, 330);
    g.fillStyle = '#140e22';
    g.fillRect(px + 28, 0, 8, 330);
    g.fillStyle = color;
    g.globalAlpha = 0.55;
    g.fillRect(px + (px === 0 ? 33 : 0), 70, 3, 248);
    g.globalAlpha = 1;
  }

  // header beam
  g.fillStyle = '#170f26';
  g.fillRect(0, 62, 300, 72);
  g.fillStyle = '#2a1b44';
  g.fillRect(4, 66, 292, 64);
  g.strokeStyle = color;
  g.globalAlpha = 0.65;
  g.lineWidth = 2;
  g.strokeRect(8, 70, 284, 56);
  g.globalAlpha = 1;

  g.save();
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.fillStyle = color;
  g.font = '900 21px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, 150, 94);
  g.shadowBlur = 0;
  g.fillStyle = '#e8e0ff';
  g.font = 'bold 8px "Courier New", monospace';
  g.fillText(sub, 150, 114);
  g.restore();

  // marquee bulbs
  for (let x = 16; x < 290; x += 22) {
    g.fillStyle = x % 44 === 16 ? color : '#ffe066';
    g.globalAlpha = 0.85;
    g.fillRect(x, 60, 4, 4);
    g.fillRect(x, 132, 4, 4);
  }
  g.globalAlpha = 1;

  // threshold
  g.fillStyle = '#0d0918';
  g.fillRect(28, 314, 244, 14);
  g.fillStyle = color;
  g.globalAlpha = 0.8;
  g.fillRect(34, 316, 232, 3);
  g.globalAlpha = 0.18;
  g.fillRect(34, 319, 232, 16);
  g.globalAlpha = 1;

  // warning chevrons on the floor edge
  g.fillStyle = '#ffe066';
  for (let i = 0; i < 4; i++) {
    g.globalAlpha = 0.4;
    g.fillRect(110 + i * 22, 322, 10, 3);
  }
  g.globalAlpha = 1;

  // pass-through chevrons + floor light spill
  g.save();
  g.globalAlpha = 0.30;
  g.strokeStyle = color;
  g.lineWidth = 7;
  g.lineCap = 'square';
  for (let i = 0; i < 2; i++) {
    const ox = 112 + i * 30;
    g.beginPath();
    g.moveTo(ox, 230);
    g.lineTo(ox + 26, 256);
    g.lineTo(ox, 282);
    g.stroke();
  }
  const spill = g.createLinearGradient(0, 322, 0, 390);
  spill.addColorStop(0, color + '55');
  spill.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = 1;
  g.fillStyle = spill;
  g.fillRect(28, 322, 244, 66);
  g.restore();

  return c;
}

function buildMallProps(stage) {
  // ---- Zone 1: mall corridors (0..3200) ----
  stage.addProp('palm', 330, 352);
  stage.addProp('bench', 520, 432);
  stage.addProp('trash', 610, 470);
  stage.addProp('planter', 735, 348);
  stage.addProp('palm', 880, 350);
  stage.addProp('bench', 980, 400);
  stage.addProp('trash', 1062, 360);
  stage.addProp('crate', 1130, 456);
  stage.addProp('planter', 1265, 358);
  stage.addProp('bench', 1420, 448);
  stage.addProp('palm', 1510, 350);
  stage.addProp('trash', 1555, 480);
  stage.addProp('palm', 1750, 350);
  stage.addProp('bench', 1900, 430);
  stage.addProp('trash', 2010, 468);
  stage.addProp('planter', 2120, 352);
  stage.addProp('palm', 2260, 350);
  stage.addProp('crate', 2350, 440);
  stage.addProp('bench', 2480, 400);
  stage.addProp('trash', 2600, 474);
  stage.addProp('planter', 2720, 354);
  stage.addProp('palm', 2840, 350);
  stage.addProp('bench', 2950, 445);

  // ---- Zone 2: ice rink (3200..6000) ----
  stage.addProp('bench', 3430, 430);
  stage.addProp('trash', 3550, 464);
  stage.addProp('planter', 3680, 352);
  stage.addProp('bench', 3820, 380);
  stage.addProp('palm', 3960, 350);
  stage.addProp('trash', 4100, 470);
  stage.addProp('crate', 4220, 430);
  stage.addProp('planter', 4360, 352);
  stage.addProp('bench', 4500, 400);
  stage.addProp('palm', 4640, 352);
  stage.addProp('trash', 4780, 470);
  stage.addProp('bench', 4920, 420);
  stage.addProp('planter', 5060, 352);
  stage.addProp('palm', 5200, 350);
  stage.addProp('crate', 5340, 440);
  stage.addProp('bench', 5480, 390);
  stage.addProp('trash', 5620, 470);
  stage.addProp('planter', 5750, 352);

  // ---- Zone 3: arcade (6000..9200) ----
  stage.addProp('crate', 6280, 440);
  stage.addProp('trash', 6400, 480);
  stage.addProp('stool', 6540, 470);
  stage.addProp('stool', 6700, 386);
  stage.addProp('stool', 6860, 472);
  stage.addProp('crate', 7020, 440);
  stage.addProp('stool', 7180, 470);
  stage.addProp('crate', 7340, 440);
  stage.addProp('trash', 7480, 474);
  stage.addProp('stool', 8420, 400);
  stage.addProp('crate', 8560, 440);
  stage.addProp('trash', 8700, 470);
  stage.addProp('stool', 8840, 386);
  stage.addProp('crate', 8980, 440);
  stage.addProp('trash', 9100, 474);
}

function drawMallOverlays(stage, ctx, camX, time) {
  // ---- live overlays ----
  // Zone 1 neon / light pulse
  for (const s of stage.neonSigns) {
    if (s.zone === 1 || s.zone === 2) continue;
    const sx = s.x - camX;
    if (sx < -s.r || sx > CFG.W + s.r) continue;
    if (s.type === 'light') {
      const a = 0.16 + Math.sin(time * 2.3 + s.x) * 0.05;
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.ellipse(sx, s.y + 60, s.r, s.r * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (s.type === 'sign') {
      const flicker = Math.sin(time * 7 + s.x * 0.1) > 0.94 ? 0.35 : 1;
      ctx.globalAlpha = 0.16 * flicker;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(sx, s.y, s.r, s.r * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // Zone 2 skaters + ice sparkle
  const rinkVisible = camX + CFG.W > 3200 && camX < 6000;
  if (rinkVisible) {
    for (const s of stage.skaters) {
      const wx = 3200 + s.x;
      const sx = wx - camX;
      if (sx < -60 || sx > CFG.W + 60) continue;
      drawSkater(ctx, sx, 245 + s.lane * 26, s.dir, time + s.phase);
    }
    // shimmer on the ice
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const wx = 3250 + ((i * 137 + time * 22) % 2600);
      const sx = wx - camX;
      if (sx < -20 || sx > CFG.W + 20) continue;
      ctx.globalAlpha = 0.12 + Math.sin(time * 2 + i) * 0.06;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, 170 + (i * 31) % 110, 26, 2);
    }
    ctx.restore();
  }

  // Zone 3 CRT screens + floor beams
  if (camX + CFG.W > 6000) {
    for (const crt of stage.crtScreens) {
      const sx = crt.x - camX;
      if (sx < -crt.w || sx > CFG.W) continue;
      const flick = 0.6 + Math.sin(time * 12 + crt.phase) * 0.2 + (Math.sin(time * 31 + crt.phase * 3) > 0.85 ? 0.2 : 0);
      ctx.save();
      ctx.globalAlpha = 0.30 * flick;
      ctx.fillStyle = crt.color;
      ctx.shadowColor = crt.color;
      ctx.shadowBlur = 16;
      ctx.fillRect(sx, crt.y, crt.w, crt.h);
      ctx.globalAlpha = 0.65 * flick;
      ctx.fillStyle = '#eaffff';
      ctx.fillRect(sx + 4, crt.y + 4 + (time * 40 + crt.phase * 9) % (crt.h - 12), crt.w - 8, 2);
      ctx.restore();
    }

    // sweeping spotlights
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const bx = ((time * 36 + i * 300) % 3000) + 6100;
      const sx = bx - camX;
      if (sx < -200 || sx > CFG.W + 200) continue;
      const grad = ctx.createLinearGradient(sx, 60, sx + 90, 500);
      grad.addColorStop(0, ['rgba(255,70,150,0.10)', 'rgba(80,220,255,0.10)', 'rgba(255,220,80,0.09)'][i]);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx - 30, 50);
      ctx.lineTo(sx + 30, 50);
      ctx.lineTo(sx + 170, 520);
      ctx.lineTo(sx + 60, 520);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // neon marquee pulse
    for (const s of stage.neonSigns) {
      if (s.zone !== 2) continue;
      const sx = s.x - camX;
      if (sx < -s.r || sx > CFG.W + s.r) continue;
      const a = 0.10 + (Math.sin(time * 4 + s.x) * 0.5 + 0.5) * 0.12;
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.ellipse(sx, s.y, s.r, s.r * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

}

function drawSkater(ctx, x, y, dir, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const lean = Math.sin(t * 3) * 0.06;
  ctx.rotate(lean);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#122a44';
  // body
  ctx.fillRect(-5, -34, 10, 18);
  ctx.fillRect(-4, -42, 8, 8);
  // scarf
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(-10, -36, 8, 3);
  ctx.fillRect(-16, -34, 8, 2);
  // legs
  ctx.fillStyle = '#0c1d31';
  ctx.fillRect(-6, -17, 4, 14);
  ctx.fillRect(2, -17, 4, 14);
  // skates
  ctx.fillStyle = '#d9ecff';
  ctx.fillRect(-8, -4, 8, 3);
  ctx.fillRect(0, -4, 8, 3);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-22, -1, 20, 1);
  ctx.restore();
}

function updateMall(stage, dt) {
  for (const s of stage.skaters) {
    s.x += s.dir * s.speed * dt;
    if (s.x > 2580) { s.x = 2580; s.dir = -1; s.phase += 0.4; }
    if (s.x < 160) { s.x = 160; s.dir = 1; s.phase += 0.4; }
  }
}

function initMall(stage) {
  stage.skaters = [
    { x: 240, dir: 1, speed: 34, lane: 0, phase: 0 },
    { x: 760, dir: -1, speed: 26, lane: 1, phase: 2.1 },
    { x: 1120, dir: 1, speed: 42, lane: 0, phase: 4.2 },
    { x: 1660, dir: -1, speed: 30, lane: 1, phase: 1.3 },
    { x: 2140, dir: 1, speed: 36, lane: 0, phase: 3.4 },
    { x: 2480, dir: -1, speed: 24, lane: 1, phase: 5.2 },
  ];
}

const mallScenery = {
  zones: ZONES,
  layers: ['neonSigns', 'crtScreens'],
  init: initMall,
  backgrounds: [buildMall, buildRink, buildArcade],
  buildProps: buildMallProps,
  buildGate: buildMallGate,
  gates: [
    [3050, 'PISTA DE HIELO', 'ZONA FRÍA · RESBALADIZO', '#8fd8ff'],
    [5850, 'ARCADE', 'VIDEOJUEGOS · ARENA FINAL', '#ff5fae'],
  ],
  itemPool: ['pastelito', 'pastelito', 'tequeño', 'soda'],
  pickDrop: () => chance(0.25) ? 'soda' : null,
  isSlippery: (x) => x > 3300 && x < 5300,
  drawOverlays: drawMallOverlays,
  update: updateMall,
  markers: {
    positions: [[3380, '#8fd8ff'], [6180, '#ff6b9d']],
    y: 452, margin: 100, opacity: 0.36, speed: 3, pulse: 0.1,
  },
};

export { mallScenery };
