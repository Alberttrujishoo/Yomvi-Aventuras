import { drawPixelNoise, makeBackdrop, makeCanvas, roundRectPath } from '../../engine/canvas.js';
import { CFG, chance, TAU, rand } from '../../engine/math.js';

const STREET_ALLEY_START = 3400;
const BURGER_ROOM_START = 6000;

const ZONES3 = [
  { start: 0, end: 3400, color: '#ffb347', key: 'street', name: 'AFUERA DEL GALERÍAS MALL', sub: 'CALLE · NOCHE DE MARACAIBO', music: 'street' },
  { start: 3400, end: 6000, color: '#ffd166', key: 'alley', name: 'CALLEJÓN DE COMIDA', sub: 'PERROS CALIENTES · HAMBURGUESAS', music: 'street' },
  { start: 6000, end: 8400, color: '#ff5fae', key: 'burger', name: 'BURGER ROOM', sub: 'LA ARENA FINAL · GAYTELOS', music: 'burger' },
];

function streetSign(g, label, x, y, w, h, color, sub = '') {
  g.save();
  g.fillStyle = 'rgba(10, 6, 16, 0.94)';
  roundRectPath(g, x, y, w, h, 4);
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.stroke();
  g.shadowColor = color;
  g.shadowBlur = 14;
  g.fillStyle = color;
  g.font = `900 ${Math.max(9, Math.min(16, h * 0.5))}px "Arial Black", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, x + w / 2, y + h / 2 + (sub ? -4 : 1));
  if (sub) {
    g.shadowBlur = 0;
    g.fillStyle = '#f4e8d0';
    g.font = 'bold 7px "Courier New", monospace';
    g.fillText(sub, x + w / 2, y + h / 2 + 8);
  }
  g.shadowBlur = 0;
  g.restore();
}

function streetCar(g, x, y, color, flip = false) {
  g.save();
  g.translate(x + (flip ? 132 : 0), y);
  g.scale(flip ? -1 : 1, 1);
  // body
  g.fillStyle = color;
  g.fillRect(0, 8, 132, 26);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fillRect(0, 8, 132, 5);
  // cabin
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(20, 8);
  g.lineTo(38, -12);
  g.lineTo(94, -12);
  g.lineTo(112, 8);
  g.closePath();
  g.fill();
  g.fillStyle = '#16283e';
  g.beginPath();
  g.moveTo(28, 5);
  g.lineTo(42, -9);
  g.lineTo(63, -9);
  g.lineTo(63, 5);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(69, 5);
  g.lineTo(69, -9);
  g.lineTo(90, -9);
  g.lineTo(101, 5);
  g.closePath();
  g.fill();
  // lights + wheels
  g.fillStyle = '#ffe9a8';
  g.fillRect(124, 14, 8, 5);
  g.fillStyle = '#ff5a5a';
  g.fillRect(0, 14, 6, 5);
  g.fillStyle = '#121018';
  g.beginPath(); g.arc(30, 35, 10, 0, TAU); g.fill();
  g.beginPath(); g.arc(104, 35, 10, 0, TAU); g.fill();
  g.fillStyle = '#6a6a78';
  g.beginPath(); g.arc(30, 35, 4, 0, TAU); g.fill();
  g.beginPath(); g.arc(104, 35, 4, 0, TAU); g.fill();
  g.restore();
}

function streetLamp(g, x, groundY, stage, color = '#ffd88a') {
  g.fillStyle = '#2c3340';
  g.fillRect(x - 2, 118, 4, groundY - 118);
  g.fillStyle = '#3f4756';
  g.fillRect(x - 1, 118, 2, groundY - 118);
  g.fillStyle = '#232a36';
  g.fillRect(x - 14, 112, 28, 7);
  g.fillStyle = '#4a5262';
  g.fillRect(x - 18, 108, 36, 5);
  g.fillStyle = color;
  g.fillRect(x - 8, 112, 16, 4);
  g.fillStyle = '#fff3c8';
  g.fillRect(x - 4, 112, 8, 2);
  if (stage) stage.streetLights.push({ x: x, y: 116, color, r: 86, phase: rand(0, TAU) });
}

function streetFoodCart(g, x, y, label, color, stage) {
  // wheels + cart body
  g.fillStyle = '#3a2a22';
  g.fillRect(x + 8, y + 44, 100, 6);
  g.fillStyle = '#17151a';
  g.beginPath(); g.arc(x + 24, y + 56, 10, 0, TAU); g.fill();
  g.beginPath(); g.arc(x + 92, y + 56, 10, 0, TAU); g.fill();
  g.fillStyle = '#8a8f98';
  g.beginPath(); g.arc(x + 24, y + 56, 4, 0, TAU); g.fill();
  g.beginPath(); g.arc(x + 92, y + 56, 4, 0, TAU); g.fill();

  g.fillStyle = '#c8ccd2';
  g.fillRect(x + 4, y + 12, 108, 34);
  g.fillStyle = '#a5aab2';
  g.fillRect(x + 4, y + 38, 108, 8);
  g.fillStyle = '#e2e6ea';
  g.fillRect(x + 7, y + 15, 102, 8);
  g.fillStyle = '#3a3f48';
  g.fillRect(x + 12, y + 26, 92, 4);

  // grill glow
  g.save();
  g.shadowColor = '#ff8a3d';
  g.shadowBlur = 18;
  g.fillStyle = '#ff7a2e';
  g.fillRect(x + 20, y + 24, 76, 6);
  g.fillStyle = '#3a1c12';
  for (let i = 0; i < 6; i++) g.fillRect(x + 22 + i * 12, y + 25, 7, 3);
  g.restore();

  // striped awning
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 === 0 ? color : '#f6ecd6';
    g.fillRect(x + 2 + i * 14, y - 8, 14, 16);
  }
  g.fillStyle = '#2a222a';
  g.fillRect(x + 2, y - 12, 112, 5);
  // poles
  g.fillStyle = '#6f747c';
  g.fillRect(x + 6, y + 6, 3, 8);
  g.fillRect(x + 107, y + 6, 3, 8);

  // menu board + label
  streetSign(g, label, x + 18, y + 30, 80, 20, color);
  if (stage) {
    stage.steamVents.push({ x: x + 34, y: y + 20, w: 26, phase: rand(0, TAU), color: 'rgba(235, 238, 242, 0.5)' });
    stage.steamVents.push({ x: x + 70, y: y + 18, w: 20, phase: rand(0, TAU), color: 'rgba(235, 238, 242, 0.4)' });
  }
}

function burgerClock(g, x, y) {
  g.fillStyle = '#f2c14e';
  g.beginPath(); g.arc(x, y, 24, 0, TAU); g.fill();
  g.fillStyle = '#e2a24e';
  g.beginPath(); g.arc(x, y, 20, 0, TAU); g.fill();
  g.fillStyle = '#5fae3e';
  g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fill();
  g.fillStyle = '#8a4a26';
  g.beginPath(); g.arc(x, y, 11, 0, TAU); g.fill();
  g.fillStyle = '#f6ecd6';
  g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill();
  g.strokeStyle = '#3a2418';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 6); g.stroke();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + 5, y + 2); g.stroke();
  g.fillStyle = '#fff3d6';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    g.fillRect(x + Math.cos(a) * 17 - 1, y + Math.sin(a) * 17 - 1, 2, 2);
  }
}

function burgerPoster(g, x, y, title) {
  g.fillStyle = '#f6e9d2';
  g.fillRect(x, y, 78, 60);
  g.strokeStyle = '#a24a3a';
  g.lineWidth = 2;
  g.strokeRect(x, y, 78, 60);
  g.fillStyle = '#d84a3a';
  g.fillRect(x + 5, y + 5, 68, 15);
  g.fillStyle = '#fff3d6';
  g.font = '900 8px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText(title, x + 39, y + 16);
  // little burger icon
  g.fillStyle = '#e2a24e';
  g.beginPath(); g.ellipse(x + 39, y + 36, 22, 10, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#5fae3e';
  g.fillRect(x + 18, y + 36, 42, 4);
  g.fillStyle = '#8a4a26';
  g.fillRect(x + 17, y + 40, 44, 4);
  g.fillStyle = '#d38f3f';
  g.fillRect(x + 19, y + 44, 40, 6);
}

function sesameRug(g, x, y, w, h) {
  g.fillStyle = '#d9a760';
  roundRectPath(g, x, y, w, h, 16);
  g.fill();
  g.fillStyle = '#c98c46';
  roundRectPath(g, x + 5, y + 5, w - 10, h - 10, 12);
  g.fill();
  g.fillStyle = '#f6e3bd';
  for (let i = 0; i < 12; i++) {
    const px = x + 18 + ((i * 53) % (w - 36));
    const py = y + 12 + ((i * 31) % Math.max(10, h - 24));
    g.save();
    g.translate(px, py);
    g.rotate(i * 0.7);
    g.fillRect(-3, -1, 6, 2);
    g.restore();
  }
}

/* ------------------------------------------------------------
   ZONE 1 — side street outside Galerías Mall
   ------------------------------------------------------------ */
function buildStreetExterior(stage) {
  const w = 3400, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // evening sky
  const sky = g.createLinearGradient(0, 0, 0, 342);
  sky.addColorStop(0, '#0a0d2a');
  sky.addColorStop(0.42, '#251a4c');
  sky.addColorStop(0.72, '#69355c');
  sky.addColorStop(1, '#c96a3c');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, 342);

  // stars
  for (let i = 0; i < 130; i++) {
    const sx = (i * 197 + 31) % w;
    const sy = (i * 67 + 13) % 190;
    const a = 0.25 + ((i * 37) % 60) / 100;
    g.fillStyle = `rgba(255, 240, 210, ${a})`;
    g.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }

  // moon
  g.save();
  g.shadowColor = 'rgba(255, 230, 170, 0.65)';
  g.shadowBlur = 28;
  g.fillStyle = '#ffe6b0';
  g.beginPath(); g.arc(2680, 82, 26, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = 'rgba(210, 180, 130, 0.35)';
  g.beginPath(); g.arc(2671, 74, 7, 0, TAU); g.fill();
  g.beginPath(); g.arc(2690, 92, 5, 0, TAU); g.fill();

  // distant skyline
  for (let x = 0; x < w; x += 58) {
    const bh = 42 + ((x * 7) % 90);
    g.fillStyle = '#15132e';
    g.fillRect(x, 342 - bh, 52, bh);
    g.fillStyle = 'rgba(255, 220, 150, 0.20)';
    for (let wy = 342 - bh + 10; wy < 330; wy += 13) {
      for (let wx = x + 6; wx < x + 46; wx += 12) {
        if ((wx + wy) % 5 < 2) g.fillRect(wx, wy, 4, 5);
      }
    }
  }

  // ---------------- Galerías Mall facade ----------------
  // main block
  g.fillStyle = '#262a42';
  g.fillRect(60, 128, 1520, 200);
  g.fillStyle = '#323756';
  g.fillRect(60, 128, 1520, 22);
  g.fillStyle = '#1b1e33';
  g.fillRect(60, 310, 1520, 20);
  // roof lip
  g.fillStyle = '#454b70';
  g.fillRect(48, 118, 1544, 14);
  g.fillStyle = '#5f6690';
  g.fillRect(48, 118, 1544, 4);

  // glass panels
  for (let x = 88; x < 1540; x += 120) {
    const lit = (x / 120) % 3 < 2;
    g.fillStyle = lit ? '#33506e' : '#25364f';
    g.fillRect(x, 166, 96, 136);
    g.fillStyle = lit ? 'rgba(160, 230, 255, 0.24)' : 'rgba(100, 150, 190, 0.12)';
    g.fillRect(x + 6, 172, 84, 124);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(x + 12, 178, 8, 112);
    g.fillStyle = '#1b2238';
    g.fillRect(x + 45, 166, 6, 136);
    // silhouettes inside some windows
    if ((x / 120) % 2 === 0) {
      g.fillStyle = 'rgba(12, 16, 30, 0.6)';
      g.fillRect(x + 26, 236, 12, 46);
      g.beginPath(); g.arc(x + 32, 228, 7, 0, TAU); g.fill();
    }
  }

  // entrance
  g.fillStyle = '#171b2e';
  g.fillRect(640, 198, 360, 112);
  g.fillStyle = '#9ee6ff';
  g.fillRect(652, 210, 156, 100);
  g.fillRect(840, 210, 148, 100);
  g.fillStyle = 'rgba(255,255,255,0.32)';
  g.fillRect(662, 216, 12, 86);
  g.fillRect(850, 216, 12, 86);
  g.fillStyle = '#2a3348';
  g.fillRect(812, 198, 8, 112);
  g.fillStyle = '#bfeef7';
  g.fillRect(640, 306, 360, 4);

  // huge illuminated GALERÍAS MALL sign
  g.save();
  g.shadowColor = 'rgba(255, 209, 102, 0.95)';
  g.shadowBlur = 30;
  g.fillStyle = '#ffd166';
  g.font = '900 56px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText('GALERÍAS MALL', 820, 192);
  g.restore();
  g.strokeStyle = '#f2a23c';
  g.lineWidth = 3;
  g.strokeText('GALERÍAS MALL', 820, 192);
  g.fillStyle = '#f6e3bd';
  g.font = 'bold 12px "Courier New", monospace';
  g.textAlign = 'center';
  g.fillText('MARACAIBO · ABIERTO HASTA TARDE', 820, 210);
  stage.streetSigns.push({ x: 820, y: 172, r: 170, color: '#ffd166', phase: 0.2 });
  stage.streetSigns.push({ x: 820, y: 286, r: 120, color: '#9ee6ff', phase: 1.7 });

  // mall side columns + awning
  for (let x = 96; x < 1560; x += 240) {
    g.fillStyle = '#3c4264';
    g.fillRect(x, 150, 10, 172);
  }
  for (let x = 620; x < 1020; x += 40) {
    g.fillStyle = (x / 40) % 2 === 0 ? '#b83e3e' : '#f2e6d0';
    g.fillRect(x, 300, 40, 14);
  }
  g.fillStyle = '#7c2c30';
  g.fillRect(616, 314, 408, 4);

  // side shops / low buildings
  const shops = [
    { x: 1620, w: 300, c: '#3a2c36', sign: 'LICORERÍA', col: '#ff9f43' },
    { x: 1940, w: 280, c: '#2f2a3e', sign: 'BODEGÓN', col: '#5ad2ff' },
    { x: 2240, w: 310, c: '#392b2b', sign: 'PANADERÍA', col: '#ffd166' },
    { x: 2570, w: 300, c: '#2a3040', sign: 'FARMACIA', col: '#7dffc4' },
    { x: 2890, w: 290, c: '#33283a', sign: 'BAR 24H', col: '#ff5fae' },
    { x: 3200, w: 180, c: '#2b2838', sign: 'TAXI', col: '#ffd166' },
  ];
  for (const s of shops) {
    g.fillStyle = s.c;
    g.fillRect(s.x, 188, s.w, 140);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(s.x, 188, s.w, 14);
    g.fillStyle = '#1a1a28';
    g.fillRect(s.x + 22, 246, 68, 82);
    g.fillStyle = 'rgba(255, 220, 150, 0.28)';
    g.fillRect(s.x + 28, 252, 56, 70);
    g.fillStyle = 'rgba(15, 12, 24, 0.65)';
    g.fillRect(s.x + 110, 254, 54, 74);
    g.fillStyle = 'rgba(255, 220, 150, 0.2)';
    g.fillRect(s.x + 116, 260, 42, 62);
    streetSign(g, s.sign, s.x + s.w / 2 - 58, 202, 116, 24, s.col);
    stage.streetSigns.push({ x: s.x + s.w / 2, y: 214, r: 62, color: s.col, phase: rand(0, TAU) });
    // awnings
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 === 0 ? s.col : '#e9e2d2';
      g.fillRect(s.x + 10 + i * 16, 230, 16, 10);
    }
  }

  // parked cars along the mall curb
  streetCar(g, 1630, 288, '#a33a3a');
  streetCar(g, 1810, 286, '#2f5a8a');
  streetCar(g, 2010, 289, '#c9a23a');
  streetCar(g, 2230, 287, '#4a3a6a');
  streetCar(g, 2450, 290, '#2f6a54');

  // sidewalk + curb
  const walk = g.createLinearGradient(0, 308, 0, 342);
  walk.addColorStop(0, '#5a5560');
  walk.addColorStop(1, '#46424f');
  g.fillStyle = walk;
  g.fillRect(0, 308, w, 34);
  g.fillStyle = '#68636f';
  g.fillRect(0, 308, w, 4);
  g.fillStyle = '#33303c';
  g.fillRect(0, 338, w, 4);
  for (let x = 0; x < w; x += 84) {
    g.fillStyle = 'rgba(20, 18, 28, 0.28)';
    g.fillRect(x, 312, 2, 26);
  }

  // asphalt playfield
  const road = g.createLinearGradient(0, 342, 0, 540);
  road.addColorStop(0, '#2b2b38');
  road.addColorStop(0.5, '#232230');
  road.addColorStop(1, '#17161f');
  g.fillStyle = road;
  g.fillRect(0, 342, w, 198);

  // lane dashes
  g.fillStyle = 'rgba(230, 205, 120, 0.34)';
  for (let x = 30; x < w; x += 150) g.fillRect(x, 442, 82, 5);
  g.fillStyle = 'rgba(230, 205, 120, 0.14)';
  for (let x = 30; x < w; x += 150) g.fillRect(x, 449, 82, 2);

  // crosswalk near the mall
  g.save();
  g.globalAlpha = 0.5;
  g.fillStyle = '#e8e2d2';
  for (let i = 0; i < 9; i++) g.fillRect(560 + i * 34, 360, 20, 150);
  g.restore();

  // puddles reflecting neon
  for (const [px, py, pw, col] of [[1250, 500, 130, 'rgba(255, 180, 90, 0.12)'], [2720, 470, 90, 'rgba(90, 210, 255, 0.10)'], [3160, 512, 110, 'rgba(255, 95, 174, 0.10)']]) {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(px, py, pw, 12, 0, 0, TAU);
    g.fill();
  }

  // street lamps
  for (const lx of [250, 1010, 1720, 2380, 3040]) {
    streetLamp(g, lx, 342, stage);
  }

  // food stalls with rising steam
  streetFoodCart(g, 2080, 262, 'HAMBURGUESAS', '#ffb347', stage);
  streetFoodCart(g, 2660, 264, 'PERROS CALIENTES', '#ff5f5f', stage);
  streetFoodCart(g, 3140, 266, 'PASTELITOS', '#ffd166', stage);

  // overhead bulb strings
  for (const [x1, x2, y, col] of [[1760, 2280, 168, '#ffd166'], [2350, 2920, 176, '#ff8a3d'], [2980, 3340, 162, '#ff5fae']]) {
    g.strokeStyle = 'rgba(30, 24, 34, 0.8)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x1, y);
    g.quadraticCurveTo((x1 + x2) / 2, y + 44, x2, y);
    g.stroke();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const bx = x1 + (x2 - x1) * t;
      const by = y + Math.sin(Math.PI * t) * 34;
      g.fillStyle = col;
      g.fillRect(bx - 3, by, 6, 8);
      g.fillStyle = '#fff3c8';
      g.fillRect(bx - 1, by + 1, 2, 3);
    }
    stage.bulbStrings.push({ x1, x2, y, color: col, phase: rand(0, TAU) });
  }

  // graffiti on the curb wall
  g.fillStyle = 'rgba(255, 95, 174, 0.5)';
  g.font = '900 20px "Arial Black", sans-serif';
  g.textAlign = 'left';
  g.fillText('YOMVI', 1450, 332);
  g.fillStyle = 'rgba(90, 210, 255, 0.4)';
  g.font = '900 14px "Arial Black", sans-serif';
  g.fillText('1991', 3300, 334);

  drawPixelNoise(g, 0, 120, w, 220, '#ffffff', 12, 0.028);
  drawPixelNoise(g, 0, 342, w, 198, '#000000', 10, 0.05);
  return g.canvas;
}

/* ------------------------------------------------------------
   ZONE 2 — food-cart alley
   ------------------------------------------------------------ */
function buildFoodAlley(stage) {
  const w = 2600, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // night sky strip
  const sky = g.createLinearGradient(0, 0, 0, 220);
  sky.addColorStop(0, '#0a0a20');
  sky.addColorStop(1, '#2c2038');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, 220);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(255, 235, 200, ${0.2 + ((i * 23) % 50) / 100})`;
    g.fillRect((i * 173) % w, (i * 47) % 150, 1, 1);
  }

  // back buildings (brick + dark windows)
  for (let x = 0; x < w; x += 260) {
    const bh = 150 + ((x * 13) % 60);
    g.fillStyle = x % 520 === 0 ? '#3a2a2e' : '#30262d';
    g.fillRect(x, 220 - bh, 252, bh);
    g.fillStyle = 'rgba(0,0,0,0.24)';
    g.fillRect(x, 220 - bh, 252, 10);
    // bricks
    g.strokeStyle = 'rgba(15, 10, 16, 0.20)';
    g.lineWidth = 1;
    for (let yy = 220 - bh + 18; yy < 220; yy += 16) {
      g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 252, yy); g.stroke();
      for (let xx = x + ((yy / 16) % 2 ? 16 : 0); xx < x + 252; xx += 32) {
        g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 16); g.stroke();
      }
    }
    // windows
    for (let wy = 220 - bh + 26; wy < 196; wy += 48) {
      for (let wx = x + 26; wx < x + 226; wx += 66) {
        const lit = (wx + wy) % 3 < 2;
        g.fillStyle = lit ? 'rgba(255, 190, 110, 0.55)' : 'rgba(18, 20, 36, 0.8)';
        g.fillRect(wx, wy, 34, 30);
        g.fillStyle = 'rgba(20, 16, 28, 0.8)';
        g.fillRect(wx + 15, wy, 3, 30);
        g.fillRect(wx, wy + 14, 34, 2);
      }
    }
  }

  // graffiti
  g.font = '900 26px "Arial Black", sans-serif';
  g.fillStyle = 'rgba(255, 95, 174, 0.34)';
  g.fillText('SABOR', 260, 176);
  g.fillStyle = 'rgba(90, 210, 255, 0.3)';
  g.fillText('MARACAIBO', 1780, 190);
  g.fillStyle = 'rgba(255, 209, 102, 0.3)';
  g.fillText('BURGER', 1120, 168);

  // wall-mounted signs
  streetSign(g, 'PERROS CALIENTES', 730, 106, 220, 28, '#ff5f5f');
  streetSign(g, 'HAMBURGUESAS', 1480, 94, 200, 28, '#ffb347');
  streetSign(g, 'TODO AL 2x1', 2110, 118, 160, 26, '#ffd166');
  stage.streetSigns.push({ x: 840, y: 120, r: 86, color: '#ff5f5f', phase: 0.6 });
  stage.streetSigns.push({ x: 1580, y: 108, r: 86, color: '#ffb347', phase: 2.3 });
  stage.streetSigns.push({ x: 2190, y: 132, r: 70, color: '#ffd166', phase: 4.1 });

  // sidewalk
  g.fillStyle = '#4a4148';
  g.fillRect(0, 286, w, 56);
  g.fillStyle = '#5c525a';
  g.fillRect(0, 286, w, 5);
  g.fillStyle = '#332c34';
  g.fillRect(0, 338, w, 4);
  for (let x = 0; x < w; x += 76) {
    g.fillStyle = 'rgba(18, 14, 22, 0.24)';
    g.fillRect(x, 292, 2, 46);
  }

  // warm asphalt
  const road = g.createLinearGradient(0, 342, 0, 540);
  road.addColorStop(0, '#30272e');
  road.addColorStop(0.55, '#241d25');
  road.addColorStop(1, '#17121a');
  g.fillStyle = road;
  g.fillRect(0, 342, w, 198);
  g.fillStyle = 'rgba(255, 190, 110, 0.10)';
  for (let x = 40; x < w; x += 180) g.fillRect(x, 404, 100, 3);

  // carts + tables + menu boards
  const carts = [
    { x: 140, label: 'HAMBURGUESAS', col: '#ffb347' },
    { x: 690, label: 'PERROS', col: '#ff5f5f' },
    { x: 1160, label: 'HAMBURGUESAS', col: '#ffd166' },
    { x: 1760, label: 'PERROS CALIENTES', col: '#ff8a3d' },
    { x: 2230, label: 'PASTELITOS', col: '#7dffc4' },
  ];
  for (const cart of carts) {
    streetFoodCart(g, cart.x, 262, cart.label, cart.col, stage);
  }

  // plastic tables + chairs in the background
  for (const [tx, ty] of [[420, 292], [1000, 296], [1540, 292], [2030, 296], [2420, 292]]) {
    g.fillStyle = '#e9e4d4';
    g.fillRect(tx, ty, 72, 6);
    g.fillStyle = '#c7c1ae';
    g.fillRect(tx + 4, ty + 6, 64, 3);
    g.fillStyle = '#b9b4a3';
    g.fillRect(tx + 8, ty + 9, 4, 24);
    g.fillRect(tx + 60, ty + 9, 4, 24);
    for (const cx of [tx - 22, tx + 80]) {
      g.fillStyle = '#c94a4a';
      g.fillRect(cx, ty - 6, 18, 4);
      g.fillRect(cx + 2, ty - 2, 14, 18);
      g.fillStyle = '#9c3333';
      g.fillRect(cx + 4, ty + 16, 3, 12);
      g.fillRect(cx + 11, ty + 16, 3, 12);
    }
  }

  // menu boards
  for (const [mx, my] of [[560, 250], [1450, 248], [2150, 252]]) {
    g.fillStyle = '#241a18';
    g.fillRect(mx, my, 64, 52);
    g.fillStyle = '#f2e6d0';
    g.fillRect(mx + 4, my + 4, 56, 36);
    g.fillStyle = '#3a2418';
    g.font = 'bold 7px "Courier New", monospace';
    g.fillText('MENÚ', mx + 22, my + 14);
    g.fillStyle = '#c04a3a';
    g.fillRect(mx + 8, my + 18, 30, 2);
    g.fillStyle = '#8a8f98';
    g.fillRect(mx + 8, my + 23, 40, 2);
    g.fillRect(mx + 8, my + 28, 34, 2);
    g.fillRect(mx + 8, my + 33, 44, 2);
  }

  // overhead bulb strings criss-crossing the alley
  for (const [x1, x2, y, col] of [[60, 620, 150, '#ffd166'], [520, 1200, 132, '#ff8a3d'], [1080, 1740, 146, '#ff5fae'], [1620, 2260, 128, '#ffd166'], [2140, 2600, 150, '#7dffc4']]) {
    g.strokeStyle = 'rgba(24, 18, 24, 0.85)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x1, y);
    g.quadraticCurveTo((x1 + x2) / 2, y + 54, x2, y);
    g.stroke();
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const bx = x1 + (x2 - x1) * t;
      const by = y + Math.sin(Math.PI * t) * 44;
      g.fillStyle = col;
      g.fillRect(bx - 3, by, 6, 9);
      g.fillStyle = '#fff3c8';
      g.fillRect(bx - 1, by + 1, 2, 3);
    }
    stage.bulbStrings.push({ x1, x2, y, color: col, phase: rand(0, TAU) });
  }

  // puddles / reflections
  for (const [px, py, pw, col] of [[340, 490, 100, 'rgba(255,180,90,0.14)'], [1290, 512, 120, 'rgba(255,95,174,0.12)'], [1980, 470, 90, 'rgba(125,255,196,0.10)']]) {
    g.fillStyle = col;
    g.beginPath(); g.ellipse(px, py, pw, 11, 0, 0, TAU); g.fill();
  }

  // vendor lamp poles
  for (const lx of [380, 1300, 2060]) streetLamp(g, lx, 342, stage, '#ffcf7a');

  drawPixelNoise(g, 0, 0, w, 340, '#ffffff', 12, 0.03);
  drawPixelNoise(g, 0, 342, w, 198, '#000000', 10, 0.05);
  return g.canvas;
}

/* ------------------------------------------------------------
   ZONE 3 — BURGER ROOM (everything is a hamburger)
   ------------------------------------------------------------ */
function buildBurgerRoom(stage) {
  const w = 2400, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // wall
  const wall = g.createLinearGradient(0, 0, 0, 322);
  wall.addColorStop(0, '#6b2f36');
  wall.addColorStop(0.55, '#8f3d3d');
  wall.addColorStop(1, '#c26a48');
  g.fillStyle = wall;
  g.fillRect(0, 0, w, 322);

  // bun-colored wainscot
  g.fillStyle = '#e2a24e';
  g.fillRect(0, 250, w, 72);
  g.fillStyle = '#f0b769';
  g.fillRect(0, 250, w, 8);
  g.fillStyle = '#c97f34';
  g.fillRect(0, 314, w, 8);
  g.fillStyle = 'rgba(255, 243, 214, 0.6)';
  for (let x = 30; x < w; x += 92) {
    g.fillRect(x, 278, 4, 2);
    g.fillRect(x + 14, 292, 4, 2);
  }

  // giant burger mural behind the arena
  g.save();
  g.shadowColor = 'rgba(255, 190, 90, 0.3)';
  g.shadowBlur = 24;
  // top bun dome
  g.fillStyle = '#e2a24e';
  g.beginPath();
  g.ellipse(1080, 176, 250, 104, 0, Math.PI, 0);
  g.fill();
  g.fillStyle = '#f0b769';
  g.beginPath();
  g.ellipse(1080, 160, 220, 78, 0, Math.PI, 0);
  g.fill();
  // seeds
  g.fillStyle = '#fff3d6';
  for (let i = 0; i < 12; i++) {
    const a = Math.PI + (i / 11) * Math.PI;
    const sx = 1080 + Math.cos(a) * 150;
    const sy = 176 + Math.sin(a) * 52;
    g.save(); g.translate(sx, sy); g.rotate(a); g.fillRect(-6, -2, 12, 4); g.restore();
  }
  g.fillStyle = '#5fae3e';
  g.fillRect(830, 178, 500, 24);
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.arc(846 + i * 36, 202, 20, 0, Math.PI);
    g.fill();
  }
  g.fillStyle = '#8a4a26';
  g.fillRect(838, 206, 484, 30);
  g.fillStyle = '#a65c30';
  g.fillRect(846, 212, 468, 8);
  g.fillStyle = '#f2c14e';
  g.fillRect(842, 238, 476, 18);
  g.fillStyle = '#d38f3f';
  g.fillRect(846, 256, 468, 18);
  g.restore();

  // neon BURGER ROOM sign
  g.save();
  g.shadowColor = 'rgba(255, 95, 174, 0.95)';
  g.shadowBlur = 30;
  g.fillStyle = '#ff8ac4';
  g.font = '900 62px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText('BURGER ROOM', 1080, 84);
  g.restore();
  g.strokeStyle = '#ffd166';
  g.lineWidth = 3;
  g.strokeText('BURGER ROOM', 1080, 84);
  g.fillStyle = '#ffe9a8';
  g.font = 'bold 13px "Courier New", monospace';
  g.textAlign = 'center';
  g.fillText('GAYTELOS · SÓLO MIEMBROS', 1080, 104);
  stage.streetSigns.push({ x: 1080, y: 66, r: 210, color: '#ff5fae', phase: 0.4 });
  stage.streetSigns.push({ x: 1080, y: 108, r: 150, color: '#ffd166', phase: 2.8 });

  // burger wall clocks + posters
  burgerClock(g, 320, 120);
  burgerClock(g, 1830, 122);
  burgerPoster(g, 140, 178, 'BURGER LOVE');
  burgerPoster(g, 2050, 168, 'GAYTELOS');
  burgerPoster(g, 640, 160, 'SESAME');

  // burger couches along the back wall
  for (const bx of [420, 760, 1460, 1780, 2100]) {
    // sofa base
    g.fillStyle = '#d38f3f';
    g.fillRect(bx - 58, 250, 116, 34);
    g.fillStyle = '#e2a24e';
    g.fillRect(bx - 54, 246, 108, 26);
    // bun back
    g.fillStyle = '#f0b769';
    g.beginPath();
    g.ellipse(bx, 244, 52, 26, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = '#fff3d6';
    g.fillRect(bx - 24, 228, 8, 3);
    g.fillRect(bx + 6, 224, 8, 3);
    g.fillRect(bx + 28, 232, 6, 3);
    // lettuce + patty trim
    g.fillStyle = '#5fae3e';
    g.fillRect(bx - 52, 250, 104, 5);
    g.fillStyle = '#8a4a26';
    g.fillRect(bx - 50, 255, 100, 5);
    // cushions
    g.fillStyle = '#c97f34';
    g.fillRect(bx - 46, 260, 40, 18);
    g.fillRect(bx + 6, 260, 40, 18);
  }

  // burger desk with monitor (right side)
  g.fillStyle = '#d38f3f';
  g.fillRect(1970, 236, 280, 18);
  g.fillStyle = '#e2a24e';
  g.fillRect(1974, 230, 272, 10);
  g.fillStyle = '#8a4a26';
  g.fillRect(1982, 254, 256, 8);
  g.fillStyle = '#a65c30';
  g.fillRect(1990, 262, 16, 55);
  g.fillRect(2214, 262, 16, 55);
  g.fillStyle = '#5fae3e';
  g.fillRect(1978, 250, 264, 4);
  // monitor
  g.fillStyle = '#20222a';
  g.fillRect(2050, 176, 94, 62);
  g.fillStyle = '#0c2a2c';
  g.fillRect(2056, 182, 82, 48);
  g.fillStyle = '#7dffc4';
  g.font = 'bold 8px "Courier New", monospace';
  g.textAlign = 'left';
  g.fillText('GAYTELOS.EXE', 2062, 196);
  g.fillStyle = '#ffd166';
  g.fillRect(2062, 202, 52, 2);
  g.fillStyle = '#ff5fae';
  g.fillRect(2062, 208, 40, 2);
  g.fillStyle = '#5ad2ff';
  g.fillRect(2062, 214, 60, 2);
  g.fillStyle = '#8a5f3d';
  g.fillRect(2076, 238, 42, 7);
  // burger-shaped chair behind desk
  g.fillStyle = '#e2a24e';
  g.beginPath(); g.ellipse(2170, 214, 30, 16, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#5fae3e';
  g.fillRect(2142, 214, 56, 5);
  g.fillStyle = '#8a4a26';
  g.fillRect(2144, 219, 52, 5);
  g.fillStyle = '#d38f3f';
  g.fillRect(2148, 224, 44, 16);

  // sesame-seed rugs on the floor
  sesameRug(g, 780, 386, 420, 92);
  sesameRug(g, 1420, 430, 320, 72);

  // checker + warm floor
  let y = 322, row = 0;
  while (y < h) {
    const rh = 14 + row * 1.7;
    for (let x = 0; x < w; x += 56) {
      const alt = ((x / 56 | 0) + row) % 2 === 0;
      g.fillStyle = alt ? '#6e4a3a' : '#55372e';
      g.fillRect(x, y, 56, rh);
      g.fillStyle = alt ? 'rgba(255, 220, 170, 0.06)' : 'rgba(0, 0, 0, 0.05)';
      g.fillRect(x, y, 56, 1);
    }
    g.fillStyle = 'rgba(30, 16, 14, 0.18)';
    g.fillRect(0, y, w, 1);
    y += rh;
    row++;
  }

  // stage light pools
  for (let x = 240; x < w; x += 440) {
    const lg = g.createRadialGradient(x, 320, 10, x, 320, 170);
    lg.addColorStop(0, 'rgba(255, 220, 150, 0.18)');
    lg.addColorStop(1, 'rgba(255, 220, 150, 0)');
    g.fillStyle = lg;
    g.fillRect(x - 170, 220, 340, 300);
  }

  // hamburger party bunting
  for (let x = 0; x < w; x += 120) {
    g.fillStyle = x % 240 === 0 ? '#ffd166' : '#ff8ac4';
    g.beginPath();
    g.moveTo(x + 10, 132);
    g.lineTo(x + 40, 132);
    g.lineTo(x + 25, 158);
    g.closePath();
    g.fill();
  }

  drawPixelNoise(g, 0, 0, w, 322, '#ffffff', 12, 0.025);
  drawPixelNoise(g, 0, 322, w, 218, '#000000', 10, 0.045);
  return g.canvas;
}

/* ------------------------------------------------------------
   Zone gate — metal shutter doorway between zones
   ------------------------------------------------------------ */
function buildStreetGate(stage, label, sub, color) {
  const w = 300, h = 540;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');

  // dark portal interior
  const inner = g.createLinearGradient(0, 86, 0, 340);
  inner.addColorStop(0, '#11101a');
  inner.addColorStop(0.45, '#241a22');
  inner.addColorStop(1, '#0c0a10');
  g.fillStyle = inner;
  g.fillRect(40, 70, 220, 270);

  // warm light spilling out of the doorway
  const spill = g.createRadialGradient(150, 300, 10, 150, 300, 130);
  spill.addColorStop(0, 'rgba(255, 190, 110, 0.28)');
  spill.addColorStop(1, 'rgba(255, 190, 110, 0)');
  g.fillStyle = spill;
  g.fillRect(10, 170, 280, 220);

  // rolling shutter slats (half open)
  for (let sy = 78; sy < 256; sy += 12) {
    g.fillStyle = sy % 24 === 6 ? '#5a5f6b' : '#464b56';
    g.fillRect(44, sy, 212, 10);
  }
  g.fillStyle = '#2a2d36';
  g.fillRect(44, 252, 212, 8);
  g.fillStyle = '#7a7f8c';
  g.fillRect(44, 252, 212, 2);

  // brick pillars
  g.fillStyle = '#513234';
  g.fillRect(0, 0, 44, 340);
  g.fillRect(256, 0, 44, 340);
  g.fillStyle = 'rgba(20, 12, 14, 0.28)';
  for (let y = 0; y < 340; y += 18) {
    g.fillRect(0, y, 44, 1);
    g.fillRect(256, y, 44, 1);
    for (let x = (y / 18) % 2 ? 12 : 0; x < 44; x += 24) {
      g.fillRect(x, y, 1, 18);
      g.fillRect(256 + x, y, 1, 18);
    }
  }

  // neon sign
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 22;
  g.fillStyle = color;
  g.font = '900 20px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText(label, 150, 40);
  g.restore();
  g.strokeStyle = '#120c14';
  g.lineWidth = 2;
  g.strokeText(label, 150, 40);
  g.fillStyle = '#f4e8d0';
  g.font = 'bold 8px "Courier New", monospace';
  g.textAlign = 'center';
  g.fillText(sub, 150, 56);

  // sign backing
  g.fillStyle = 'rgba(10, 8, 14, 0.9)';
  g.fillRect(34, 18, 232, 46);
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.strokeRect(34, 18, 232, 46);
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.fillStyle = color;
  g.font = '900 20px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText(label, 150, 40);
  g.restore();
  g.fillStyle = '#f4e8d0';
  g.font = 'bold 8px "Courier New", monospace';
  g.fillText(sub, 150, 55);

  // graffiti at the base + curb
  g.fillStyle = 'rgba(255, 95, 174, 0.4)';
  g.font = '900 18px "Arial Black", sans-serif';
  g.fillText('GO!', 150, 300);
  g.fillStyle = '#4a4148';
  g.fillRect(0, 340, w, 200);
  g.fillStyle = '#2c2730';
  g.fillRect(0, 340, w, 6);

  drawPixelNoise(g, 0, 0, w, 340, '#ffffff', 10, 0.03);
  return c;
}

/* ------------------------------------------------------------
   Destructible street props — cans, coolers, tables & burger sofas
   ------------------------------------------------------------ */
function buildStreetProps(stage) {
  // Zone 1 — outside Galerías Mall
  stage.addProp('trashcan', 330, 472);
  stage.addProp('cooler', 700, 462);
  stage.addProp('streettable', 880, 430);
  stage.addProp('trashcan', 1240, 470);
  stage.addProp('cooler', 1500, 464);
  stage.addProp('streettable', 1780, 430);
  stage.addProp('trashcan', 2010, 472);
  stage.addProp('cooler', 2280, 466);
  stage.addProp('streettable', 2520, 432);
  stage.addProp('trashcan', 2760, 470);
  stage.addProp('cooler', 3000, 464);
  stage.addProp('streettable', 3180, 434);

  // Zone 2 — food-cart alley
  stage.addProp('trashcan', 3520, 472);
  stage.addProp('cooler', 3740, 466);
  stage.addProp('streettable', 3960, 430);
  stage.addProp('trashcan', 4300, 470);
  stage.addProp('cooler', 4400, 464);
  stage.addProp('streettable', 4800, 432);
  stage.addProp('trashcan', 5020, 472);
  stage.addProp('cooler', 5260, 466);
  stage.addProp('streettable', 5480, 430);
  stage.addProp('trashcan', 5660, 470);
  stage.addProp('cooler', 5820, 464);

  // Zone 3 — Burger Room
  stage.addProp('burgertable', 6180, 440);
  stage.addProp('burgercouch', 6400, 420);
  stage.addProp('burgertable', 6650, 448);
  stage.addProp('burgercouch', 7050, 422);
  stage.addProp('burgertable', 7300, 446);
  stage.addProp('burgercouch', 7620, 424);
  stage.addProp('burgertable', 7980, 448);
  stage.addProp('burgercouch', 8220, 424);
}

/* ------------------------------------------------------------
   Live street overlays: lamp bloom, bulbs, steam & neon
   ------------------------------------------------------------ */
function drawStreetOverlays(stage, ctx, camX, time) {
  // lamp glow
  for (const l of stage.streetLights || []) {
    const sx = l.x - camX;
    if (sx < -160 || sx > CFG.W + 160) continue;
    const flicker = Math.sin(time * 6 + l.phase) > 0.965 ? 0.35 : 1;
    ctx.save();
    ctx.globalAlpha = 0.13 * flicker;
    ctx.fillStyle = l.color;
    ctx.shadowColor = l.color;
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.ellipse(sx, l.y + 70, l.r, l.r * 0.72, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.09 * flicker;
    const cone = ctx.createLinearGradient(sx, l.y, sx, l.y + 250);
    cone.addColorStop(0, 'rgba(255, 225, 160, 0.55)');
    cone.addColorStop(1, 'rgba(255, 225, 160, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(sx - 16, l.y + 4);
    ctx.lineTo(sx + 16, l.y + 4);
    ctx.lineTo(sx + 100, l.y + 250);
    ctx.lineTo(sx - 100, l.y + 250);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // bulb strings
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const b of stage.bulbStrings || []) {
    const minX = Math.min(b.x1, b.x2);
    const maxX = Math.max(b.x1, b.x2);
    if (maxX - camX < -80 || minX - camX > CFG.W + 80) continue;
    const n = 11;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const bx = b.x1 + (b.x2 - b.x1) * t - camX;
      const by = b.y + Math.sin(Math.PI * t) * 44;
      const blink = 0.55 + (Math.sin(time * 3.2 + b.phase + i * 0.7) * 0.5 + 0.5) * 0.45;
      ctx.globalAlpha = 0.20 * blink;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(bx, by + 4, 9, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  // steam from the grills
  for (const v of stage.steamVents || []) {
    const sx = v.x - camX;
    if (sx < -80 || sx > CFG.W + 80) continue;
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const t = ((time * 0.28) + v.phase + i * 0.19) % 1;
      const px = sx + Math.sin(time * 1.7 + v.phase + i * 1.3) * v.w * 0.5;
      const py = v.y - t * 92;
      const size = 5 + t * 12;
      ctx.globalAlpha = (1 - t) * 0.32;
      ctx.fillStyle = v.color;
      ctx.fillRect(px - size / 2, py - size / 2, size, size);
    }
    ctx.restore();
  }

  // neon sign bloom
  for (const s of stage.streetSigns || []) {
    const sx = s.x - camX;
    if (sx < -s.r || sx > CFG.W + s.r) continue;
    const flick = Math.sin(time * 5 + s.phase) > 0.94 ? 0.3 : 1;
    ctx.save();
    ctx.globalAlpha = (0.06 + (Math.sin(time * 2.4 + s.phase) * 0.5 + 0.5) * 0.07) * flick;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.ellipse(sx, s.y, s.r, s.r * 0.56, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Burger Room sesame dust
  if (camX + CFG.W > BURGER_ROOM_START) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const wx = 6050 + ((i * 137 + time * 14) % 2300);
      const sx = wx - camX;
      if (sx < -20 || sx > CFG.W + 20) continue;
      const sy = 140 + ((i * 71 + Math.sin(time + i) * 24) % 300);
      ctx.globalAlpha = 0.16 + (Math.sin(time * 2 + i) * 0.5 + 0.5) * 0.18;
      ctx.fillStyle = i % 3 === 0 ? '#ffd166' : '#fff3d6';
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.restore();
  }
}

/* ============================================================
   GAYTELOS — FINAL BOSS
   ============================================================ */

const streetScenery = {
  zones: ZONES3,
  layers: ['streetLights', 'steamVents', 'bulbStrings', 'streetSigns'],
  backgrounds: [buildStreetExterior, buildFoodAlley, buildBurgerRoom],
  buildProps: buildStreetProps,
  buildGate: buildStreetGate,
  gates: [
    [3250, 'CALLEJÓN', 'PERROS · HAMBURGUESAS · NOCHE', '#ffb347'],
    [5850, 'BURGER ROOM', 'LA ARENA FINAL DE GAYTELOS', '#ff5fae'],
  ],
  itemPool: ['burger', 'hotdog', 'pastelito', 'soda'],
  pickDrop: () => chance(0.55) ? 'burger' : (chance(0.6) ? 'hotdog' : null),
  drawOverlays: drawStreetOverlays,
  markers: {
    positions: [[3310, '#ffb347'], [5920, '#ff5fae']],
    y: 450, margin: 120, opacity: 0.32, speed: 3.2, pulse: 0.09,
  },
};

export { streetScenery };
