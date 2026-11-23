import { drawPixelNoise, makeBackdrop, makeCanvas, roundRectPath } from '../../engine/canvas.js';
import { CFG, TAU } from '../../engine/math.js';

const HOSPITAL_HALL_START = 2600;
const HOSPITAL_ROOM_START = 5600;

const ZONES2 = [
  { start: 0, end: 2600, color: '#8fe6ff', key: 'reception', name: 'RECEPCIÓN / SALA DE ESPERA', sub: 'HOSPITAL GENERAL · MARACAIBO', music: 'hospital' },
  { start: 2600, end: 5600, color: '#8fe6ff', key: 'hallway', name: 'PASILLO CENTRAL', sub: 'EMERGENCIA · RADIOLOGÍA · HABITACIONES', music: 'hospital' },
  { start: 5600, end: 8000, color: '#ff8a3d', key: 'patient', name: 'HABITACIÓN 302', sub: 'ALA ESTE · ARENA FINAL', music: 'boss2' },
];

function hospitalSign(g, label, x, y, w, h, color) {
  g.save();
  g.fillStyle = 'rgba(10, 26, 34, 0.92)';
  roundRectPath(g, x, y, w, h, 4);
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.stroke();
  g.shadowColor = color;
  g.shadowBlur = 12;
  g.fillStyle = color;
  g.font = '900 12px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, x + w / 2, y + h / 2 + 1);
  g.shadowBlur = 0;
  g.restore();
}

function hospitalPoster(g, x, y, title, color, icon) {
  g.save();
  g.fillStyle = '#f4f7f8';
  g.fillRect(x, y, 92, 78);
  g.strokeStyle = '#7a95a2';
  g.lineWidth = 2;
  g.strokeRect(x, y, 92, 78);
  g.fillStyle = color;
  g.fillRect(x + 6, y + 6, 80, 24);
  g.fillStyle = '#102a36';
  g.font = '900 8px "Courier New", monospace';
  g.textAlign = 'center';
  g.fillText(title, x + 46, y + 16);
  g.fillStyle = '#cfe2e8';
  g.fillRect(x + 8, y + 34, 76, 36);
  g.strokeStyle = color;
  g.lineWidth = 2;
  if (icon === 'cross') {
    g.fillStyle = color;
    g.fillRect(x + 40, y + 40, 12, 26);
    g.fillRect(x + 32, y + 47, 28, 12);
  } else if (icon === 'arrow') {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x + 24, y + 52);
    g.lineTo(x + 46, y + 38);
    g.lineTo(x + 68, y + 52);
    g.lineTo(x + 60, y + 52);
    g.lineTo(x + 46, y + 45);
    g.lineTo(x + 32, y + 52);
    g.closePath();
    g.fill();
  } else {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x + 46, y + 50, 11, 0, TAU);
    g.fill();
    g.fillStyle = '#f4f7f8';
    g.fillRect(x + 39, y + 49, 14, 3);
    g.fillRect(x + 44, y + 44, 4, 13);
  }
  g.restore();
}

function hospitalChair(g, x, y) {
  g.fillStyle = '#4a7595';
  g.fillRect(x, y, 42, 26);
  g.fillStyle = '#7fa6c2';
  g.fillRect(x + 2, y + 2, 38, 5);
  g.fillStyle = '#2c4559';
  g.fillRect(x + 3, y + 26, 5, 22);
  g.fillRect(x + 34, y + 26, 5, 22);
  g.fillStyle = '#8d9aa8';
  g.fillRect(x - 2, y + 23, 46, 4);
  g.fillStyle = '#2c2c3a';
  g.fillRect(x + 4, y + 45, 6, 3);
  g.fillRect(x + 32, y + 45, 6, 3);
}

function hospitalDoor(g, x, y, label, color) {
  const w = 126, h = 192;
  g.fillStyle = '#8ea6b2';
  g.fillRect(x - 6, y - 6, w + 12, h + 12);
  g.fillStyle = '#2d4e5e';
  g.fillRect(x, y, w, h);
  // two glass leaves
  for (let i = 0; i < 2; i++) {
    const dx = x + 6 + i * (w / 2 - 3);
    const dw = w / 2 - 9;
    g.fillStyle = '#bfe6ee';
    g.fillRect(dx, y + 10, dw, h - 40);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(dx + 4, y + 14, 6, h - 48);
    g.fillStyle = '#4d7686';
    g.fillRect(dx + dw / 2 - 12, y + 34, 24, 26); // porthole
    g.fillStyle = '#cfeef5';
    g.fillRect(dx + dw / 2 - 9, y + 37, 18, 20);
    g.fillStyle = '#9fb4be';
    g.fillRect(dx + 5, y + h - 42, dw - 10, 5);
  }
  g.fillStyle = '#1b3340';
  g.fillRect(x + w / 2 - 3, y + 4, 6, h - 4);
  g.fillStyle = '#f2f5f7';
  g.fillRect(x + 8, y + h - 26, 34, 18);
  g.fillStyle = '#153845';
  g.font = '900 11px "Courier New", monospace';
  g.textAlign = 'center';
  g.fillText(label, x + 25, y + h - 13);
  hospitalSign(g, label, x + w / 2 - 42, y - 24, 84, 20, color || '#8fe6ff');
}

function buildReception(stage) {
  const w = 2600, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);

  // ceiling
  const ceil = g.createLinearGradient(0, 0, 0, 64);
  ceil.addColorStop(0, '#e7f2f5');
  ceil.addColorStop(1, '#b9cfd7');
  g.fillStyle = ceil;
  g.fillRect(0, 0, w, 64);
  g.fillStyle = '#9db7c1';
  for (let x = 0; x < w; x += 160) g.fillRect(x, 0, 8, 64);
  for (let x = 120; x < w; x += 260) {
    g.fillStyle = '#f8ffff';
    g.fillRect(x, 30, 92, 7);
    g.fillStyle = '#c9e8f0';
    g.fillRect(x + 4, 37, 84, 3);
    const lg = g.createRadialGradient(x + 46, 36, 4, x + 46, 36, 95);
    lg.addColorStop(0, 'rgba(220, 250, 255, 0.50)');
    lg.addColorStop(1, 'rgba(220, 250, 255, 0)');
    g.fillStyle = lg;
    g.fillRect(x - 50, 0, 192, 150);
    stage.hospitalLights.push({ x: x + 46, y: 36, color: '#d9f6ff', r: 80, zone: 2 });
  }
  g.fillStyle = '#6f8f9b';
  g.fillRect(0, 60, w, 5);

  // back wall
  const wall = g.createLinearGradient(0, 66, 0, 322);
  wall.addColorStop(0, '#eaf4f5');
  wall.addColorStop(0.6, '#d5e8ea');
  wall.addColorStop(1, '#b9d2d8');
  g.fillStyle = wall;
  g.fillRect(0, 66, w, 256);
  g.strokeStyle = 'rgba(120, 165, 175, 0.28)';
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 34) {
    g.beginPath(); g.moveTo(x, 66); g.lineTo(x, 322); g.stroke();
  }
  for (let y = 96; y < 322; y += 34) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  g.fillStyle = '#9bbac1';
  g.fillRect(0, 292, w, 30);
  g.fillStyle = '#7fa3ac';
  g.fillRect(0, 315, w, 7);

  // posters
  hospitalPoster(g, 90, 118, 'LAVA TUS MANOS', '#2f8f9e', 'cross');
  hospitalPoster(g, 620, 120, 'DONA SANGRE', '#d9534f', 'cross');
  hospitalPoster(g, 2170, 116, 'RADIOLOGÍA', '#4d86c6', 'arrow');

  // wall clock
  g.fillStyle = '#f2f5f7';
  g.beginPath(); g.arc(540, 148, 22, 0, TAU); g.fill();
  g.strokeStyle = '#31515d'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = '#31515d'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(540, 148); g.lineTo(540, 134); g.stroke();
  g.beginPath(); g.moveTo(540, 148); g.lineTo(550, 153); g.stroke();

  // directional signs
  hospitalSign(g, 'EMERGENCIA  →', 250, 76, 160, 28, '#8fe6ff');
  hospitalSign(g, 'RADIOLOGÍA  ↔', 1050, 76, 160, 28, '#5ad2ff');
  hospitalSign(g, 'HABITACIONES  →', 1950, 76, 180, 28, '#a7f3d0');
  stage.hospitalSigns.push({ x: 330, y: 90, color: '#8fe6ff', r: 60, zone: 1 });
  stage.hospitalSigns.push({ x: 1130, y: 90, color: '#5ad2ff', r: 60, zone: 1 });
  stage.hospitalSigns.push({ x: 2040, y: 90, color: '#a7f3d0', r: 60, zone: 1 });

  // waiting chairs along the wall
  for (let x = 150; x < 700; x += 96) hospitalChair(g, x, 240);
  for (let x = 230; x < 600; x += 96) hospitalChair(g, x, 270);

  // reception desk
  g.fillStyle = '#4f9aa6';
  g.fillRect(900, 214, 610, 96);
  g.fillStyle = '#6dbac2';
  g.fillRect(906, 220, 598, 10);
  g.fillStyle = '#d9eef0';
  g.fillRect(892, 204, 626, 16);
  g.fillStyle = '#88a8b2';
  g.fillRect(892, 220, 626, 4);
  g.fillStyle = '#2f7e8a';
  g.fillRect(906, 234, 598, 30);
  g.fillStyle = '#f2f5f7';
  g.fillRect(1010, 242, 26, 14);      // papers
  g.fillRect(1044, 246, 22, 10);
  g.fillStyle = '#20222a';
  g.fillRect(1180, 170, 92, 58);      // monitor
  g.fillStyle = '#0c2a2c';
  g.fillRect(1186, 176, 80, 44);
  g.fillStyle = '#64f0c8';
  g.font = 'bold 8px "Courier New", monospace';
  g.fillText('RECEPCIÓN', 1192, 190);
  g.fillStyle = '#8a5f3d';
  g.fillRect(1204, 228, 44, 8);       // keyboard
  g.fillStyle = '#20222a';
  g.fillRect(1320, 238, 34, 16);      // phone
  g.fillStyle = '#a8b8c0';
  g.fillRect(1336, 233, 6, 8);
  g.fillStyle = '#ffffff';
  g.fillRect(946, 242, 26, 26);       // red cross logo
  g.fillStyle = '#d9534f';
  g.fillRect(954, 246, 10, 18);
  g.fillRect(950, 251, 18, 8);
  g.fillStyle = '#d9534f';
  g.font = '900 15px "Arial Black", sans-serif';
  g.textAlign = 'left';
  g.fillText('HOSPITAL GENERAL', 1010, 200);

  // vending machines
  for (const [x, label, col] of [[1720, 'BEBIDAS', '#4d86c6'], [1880, 'SNACKS', '#d9534f']]) {
    g.fillStyle = '#25343b';
    g.fillRect(x, 142, 136, 176);
    g.fillStyle = '#3c5660';
    g.fillRect(x + 5, 148, 126, 164);
    g.fillStyle = '#cfe6ea';
    g.fillRect(x + 12, 158, 78, 112);
    for (let r = 0; r < 4; r++) {
      g.fillStyle = '#1b2a30';
      g.fillRect(x + 12, 176 + r * 24, 78, 4);
      for (let k = 0; k < 5; k++) {
        g.fillStyle = ['#ff7a7a', '#8fe6ff', '#ffe066', '#7dffc4', '#c18fff'][(r + k) % 5];
        g.fillRect(x + 16 + k * 14, 163 + r * 24, 9, 12);
      }
    }
    g.fillStyle = '#0d161a';
    g.fillRect(x + 96, 158, 28, 62);
    g.fillStyle = '#8fe6ff';
    g.fillRect(x + 102, 166, 16, 6);
    g.fillStyle = '#ffd166';
    g.fillRect(x + 106, 180, 8, 8);
    g.fillStyle = '#0d161a';
    g.fillRect(x + 96, 230, 28, 12);
    g.fillStyle = label === 'SNACKS' ? '#ffd166' : '#8fe6ff';
    g.font = '900 9px "Arial Black", sans-serif';
    g.textAlign = 'center';
    g.fillText(label, x + 68, 292);
  }

  // plants
  for (const x of [60, 2290]) {
    g.fillStyle = '#a9603d';
    g.fillRect(x, 278, 34, 36);
    g.fillRect(x - 4, 272, 42, 10);
    g.fillStyle = '#2f8f4c';
    g.fillRect(x + 2, 234, 30, 46);
    g.fillRect(x - 12, 248, 22, 16);
    g.fillRect(x + 24, 242, 22, 20);
    g.fillStyle = '#3ecf78';
    g.fillRect(x + 8, 226, 18, 16);
    g.fillRect(x + 2, 240, 10, 10);
  }

  // floor
  let y = 322, row = 0;
  while (y < h) {
    const rh = 14 + row * 1.8;
    for (let x = 0; x < w; x += 64) {
      const alt = ((x / 64 | 0) + row) % 2 === 0;
      g.fillStyle = alt ? '#eaf5f4' : '#cfe8e7';
      g.fillRect(x, y, 64, rh);
    }
    g.fillStyle = 'rgba(90, 140, 150, 0.20)';
    g.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = 'rgba(90, 140, 150, 0.14)';
      g.fillRect(x, y, 1, rh);
    }
    y += rh;
    row++;
  }
  // green guide line
  g.fillStyle = 'rgba(64, 176, 140, 0.35)';
  g.fillRect(0, 428, w, 3);
  g.fillStyle = 'rgba(64, 176, 140, 0.14)';
  g.fillRect(0, 431, w, 14);

  // light reflections
  for (let x = 166; x < w; x += 260) {
    g.fillStyle = 'rgba(230, 255, 255, 0.16)';
    g.fillRect(x - 30, 322, 60, 170);
  }

  // bright entrance at the far end
  g.fillStyle = 'rgba(190, 242, 255, 0.18)';
  g.fillRect(w - 230, 70, 210, 250);
  g.fillStyle = '#bfeef7';
  g.fillRect(w - 210, 100, 160, 6);
  g.fillStyle = '#8fe6ff';
  g.font = '900 16px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText('EMERGENCIA', w - 130, 140);

  drawPixelNoise(g, 0, 66, w, 250, '#ffffff', 10, 0.035);
  return g.canvas;
}

function buildHallway(stage) {
  const w = 3000, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);
  const start = HOSPITAL_HALL_START;

  const ceil = g.createLinearGradient(0, 0, 0, 58);
  ceil.addColorStop(0, '#d9e9ec');
  ceil.addColorStop(1, '#a8c1c8');
  g.fillStyle = ceil;
  g.fillRect(0, 0, w, 58);
  g.fillStyle = '#91adb6';
  for (let x = 0; x < w; x += 150) g.fillRect(x, 0, 8, 58);
  for (let x = 110; x < w; x += 240) {
    g.fillStyle = '#f8ffff';
    g.fillRect(x, 26, 100, 6);
    g.fillStyle = '#c9e8f0';
    g.fillRect(x + 4, 32, 92, 3);
    const lg = g.createRadialGradient(x + 50, 32, 4, x + 50, 32, 85);
    lg.addColorStop(0, 'rgba(220, 250, 255, 0.42)');
    lg.addColorStop(1, 'rgba(220, 250, 255, 0)');
    g.fillStyle = lg;
    g.fillRect(x - 45, 0, 190, 145);
    stage.hospitalLights.push({ x: start + x + 50, y: 32, color: '#d9f6ff', r: 75, zone: 2 });
  }
  g.fillStyle = '#6c8a95';
  g.fillRect(0, 54, w, 5);

  const wall = g.createLinearGradient(0, 60, 0, 322);
  wall.addColorStop(0, '#e4f0ef');
  wall.addColorStop(0.6, '#c9e0df');
  wall.addColorStop(1, '#aac7c8');
  g.fillStyle = wall;
  g.fillRect(0, 60, w, 262);
  g.strokeStyle = 'rgba(100, 150, 158, 0.25)';
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 322); g.stroke();
  }
  for (let y = 84; y < 322; y += 32) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }

  // handrail
  g.fillStyle = '#7fa0aa';
  g.fillRect(0, 250, w, 6);
  g.fillStyle = '#b9d4d8';
  g.fillRect(0, 247, w, 3);
  for (let x = 20; x < w; x += 80) {
    g.fillStyle = '#6a8f99';
    g.fillRect(x, 253, 4, 16);
  }
  // baseboard
  g.fillStyle = '#8fb1b6';
  g.fillRect(0, 304, w, 18);
  g.fillStyle = '#75989f';
  g.fillRect(0, 318, w, 4);

  // doors
  const labels = ['301', '302', '303', 'QUIRÓFANO', '305', 'RADIOLOGÍA', '307', 'HABITACIONES'];
  let di = 0;
  for (let x = 100; x < w - 100; x += 340) {
    const label = labels[di % labels.length];
    hospitalDoor(g, x, 126, label, label === 'QUIRÓFANO' ? '#ff7a7a' : label === 'RADIOLOGÍA' ? '#5ad2ff' : label === 'HABITACIONES' ? '#a7f3d0' : '#8fe6ff');
    di++;
  }
  // extra small signs
  hospitalSign(g, 'SALA DE ESPERA  ←', 260, 76, 170, 26, '#8fe6ff');
  hospitalSign(g, 'RADIOLOGÍA  →', 1180, 76, 150, 26, '#5ad2ff');
  hospitalSign(g, 'QUIRÓFANO  ↔', 1740, 76, 160, 26, '#ff8a8a');
  hospitalSign(g, 'HABITACIONES  →', 2380, 76, 180, 26, '#a7f3d0');
  stage.hospitalSigns.push({ x: start + 345, y: 89, color: '#8fe6ff', r: 55, zone: 1 });
  stage.hospitalSigns.push({ x: start + 1255, y: 89, color: '#5ad2ff', r: 55, zone: 1 });
  stage.hospitalSigns.push({ x: start + 1820, y: 89, color: '#ff8a8a', r: 55, zone: 1 });
  stage.hospitalSigns.push({ x: start + 2470, y: 89, color: '#a7f3d0', r: 55, zone: 1 });

  // posters and fire extinguisher
  hospitalPoster(g, 620, 150, 'SILENCIO', '#4d86c6', 'cross');
  hospitalPoster(g, 1450, 150, 'LAVA TUS MANOS', '#2f8f9e', 'cross');
  hospitalPoster(g, 2250, 150, 'NO FUMAR', '#d9534f', 'cross');
  g.fillStyle = '#d9534f';
  g.fillRect(1980, 218, 18, 46);
  g.fillStyle = '#222';
  g.fillRect(1983, 206, 12, 14);

  // gurney background
  g.fillStyle = '#e8f2f5';
  g.fillRect(760, 278, 150, 14);
  g.fillStyle = '#c0d3da';
  g.fillRect(766, 292, 138, 4);
  g.fillStyle = '#8fa8b2';
  g.fillRect(772, 296, 6, 22);
  g.fillRect(1030, 296, 6, 22); // will be off body but keeps perspective
  g.fillStyle = '#2b2b36';
  g.beginPath(); g.arc(780, 320, 7, 0, TAU); g.fill();
  g.beginPath(); g.arc(890, 320, 7, 0, TAU); g.fill();

  // nurses' station / monitor cart
  g.fillStyle = '#4f9aa6';
  g.fillRect(1300, 254, 190, 60);
  g.fillStyle = '#d9eef0';
  g.fillRect(1292, 246, 206, 12);
  g.fillStyle = '#20222a';
  g.fillRect(1340, 200, 80, 44);
  g.fillStyle = '#0c2a2c';
  g.fillRect(1345, 205, 70, 32);
  g.fillStyle = '#64f0c8';
  g.font = 'bold 9px "Courier New", monospace';
  g.textAlign = 'center';
  g.fillText('ECG', 1380, 222);
  g.strokeStyle = '#64f0c8';
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(1350, 228); g.lineTo(1360, 228); g.lineTo(1364, 221); g.lineTo(1368, 233); g.lineTo(1372, 228); g.lineTo(1408, 228); g.stroke();
  stage.ecgMonitors.push({ x: start + 1345, y: 205, w: 70, h: 32, phase: 1.2 });

  // IV stand and wheelchair silhouettes
  g.fillStyle = '#b8c4cd';
  g.fillRect(2120, 170, 3, 142);
  g.fillStyle = '#e8f4ff';
  g.fillRect(2112, 178, 20, 26);
  g.fillStyle = '#8fe0ff';
  g.fillRect(2115, 181, 14, 20);
  g.fillStyle = '#222';
  g.beginPath(); g.arc(2130, 316, 7, 0, TAU); g.fill();
  g.fillStyle = '#3c5660';
  g.fillRect(2600, 270, 54, 6);
  g.fillRect(2606, 276, 4, 38);
  g.beginPath(); g.arc(2618, 320, 10, 0, TAU); g.fill();

  // floor
  let y = 322, row = 0;
  while (y < h) {
    const rh = 14 + row * 1.8;
    for (let x = 0; x < w; x += 64) {
      const alt = ((x / 64 | 0) + row) % 2 === 0;
      g.fillStyle = alt ? '#dff0ee' : '#c2e0dd';
      g.fillRect(x, y, 64, rh);
    }
    g.fillStyle = 'rgba(70, 130, 130, 0.22)';
    g.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = 'rgba(70, 130, 130, 0.14)';
      g.fillRect(x, y, 1, rh);
    }
    y += rh;
    row++;
  }
  g.fillStyle = 'rgba(64, 176, 140, 0.30)';
  g.fillRect(0, 452, w, 3);
  g.fillStyle = 'rgba(64, 176, 140, 0.12)';
  g.fillRect(0, 455, w, 12);
  for (let x = 300; x < w; x += 600) {
    g.fillStyle = 'rgba(80, 220, 200, 0.20)';
    g.beginPath();
    g.moveTo(x, 476); g.lineTo(x + 20, 490); g.lineTo(x + 40, 476); g.lineTo(x + 30, 476); g.lineTo(x + 20, 484); g.lineTo(x + 10, 476);
    g.closePath();
    g.fill();
  }

  drawPixelNoise(g, 0, 60, w, 260, '#ffffff', 10, 0.035);
  return g.canvas;
}

function buildPatientRoom(stage) {
  const w = 2400, h = 540;
  const g = makeBackdrop(w, h, stage.game.renderScale);
  const start = HOSPITAL_ROOM_START;

  // ceiling
  g.fillStyle = '#d3e2e6';
  g.fillRect(0, 0, w, 58);
  g.fillStyle = '#aec5cc';
  for (let x = 0; x < w; x += 160) g.fillRect(x, 0, 8, 58);
  for (let x = 360; x < w; x += 520) {
    g.fillStyle = '#f8ffff';
    g.fillRect(x, 26, 120, 6);
    g.fillStyle = '#c9e8f0';
    g.fillRect(x + 4, 32, 112, 3);
    const lg = g.createRadialGradient(x + 60, 32, 4, x + 60, 32, 150);
    lg.addColorStop(0, 'rgba(220, 250, 255, 0.32)');
    lg.addColorStop(1, 'rgba(220, 250, 255, 0)');
    g.fillStyle = lg;
    g.fillRect(x - 90, 0, 300, 220);
    stage.hospitalLights.push({ x: start + x + 60, y: 32, color: '#d9f6ff', r: 100, zone: 2 });
  }
  g.fillStyle = '#7d9aa3';
  g.fillRect(0, 54, w, 5);

  // wall
  const wall = g.createLinearGradient(0, 60, 0, 322);
  wall.addColorStop(0, '#e8f0f2');
  wall.addColorStop(0.55, '#d2e2e5');
  wall.addColorStop(1, '#b5cfd4');
  g.fillStyle = wall;
  g.fillRect(0, 60, w, 262);
  g.strokeStyle = 'rgba(110, 155, 164, 0.22)';
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 36) {
    g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 322); g.stroke();
  }
  for (let y = 96; y < 322; y += 36) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  g.fillStyle = '#93b4b9';
  g.fillRect(0, 300, w, 22);
  g.fillStyle = '#7b9da4';
  g.fillRect(0, 316, w, 6);

  // window with blinds
  g.fillStyle = '#8a7c6e';
  g.fillRect(1280, 88, 620, 210);
  g.fillStyle = '#3a5f74';
  g.fillRect(1290, 98, 600, 190);
  const night = g.createLinearGradient(0, 98, 0, 288);
  night.addColorStop(0, '#091b2e');
  night.addColorStop(0.7, '#12384f');
  night.addColorStop(1, '#1b5266');
  g.fillStyle = night;
  g.fillRect(1296, 104, 588, 178);
  // city lights
  for (let i = 0; i < 26; i++) {
    const lx = 1310 + (i * 73) % 560;
    const ly = 190 + (i * 37) % 80;
    g.fillStyle = i % 3 === 0 ? '#ffe08a' : '#8fe6ff';
    g.globalAlpha = 0.35 + (i % 4) * 0.12;
    g.fillRect(lx, ly, 4, 3);
  }
  g.globalAlpha = 1;
  // blinds
  for (let y = 104; y < 282; y += 12) {
    g.fillStyle = 'rgba(214, 232, 235, 0.72)';
    g.fillRect(1296, y, 588, 6);
    g.fillStyle = 'rgba(120, 150, 160, 0.35)';
    g.fillRect(1296, y + 6, 588, 1);
  }
  g.fillStyle = '#6f6152';
  g.fillRect(1288, 92, 604, 8);
  g.fillRect(1288, 282, 604, 8);
  // curtain
  g.fillStyle = '#9bbfc6';
  g.fillRect(1250, 78, 46, 230);
  g.fillStyle = '#c6dfe3';
  g.fillRect(1254, 82, 10, 222);
  g.fillStyle = '#9bbfc6';
  g.fillRect(1890, 78, 46, 230);
  g.fillStyle = '#c6dfe3';
  g.fillRect(1894, 82, 10, 222);

  // hospital bed (headboard, frame, mattress)
  g.fillStyle = '#8fa4ad';
  g.fillRect(952, 208, 30, 9);
  g.fillRect(956, 216, 6, 112);
  g.fillRect(970, 216, 6, 112);
  g.fillRect(1414, 224, 24, 8);
  g.fillRect(1422, 231, 6, 97);
  g.fillStyle = '#9fb0b8';
  g.fillRect(978, 250, 444, 12);
  g.fillStyle = '#7d929c';
  g.fillRect(978, 260, 444, 4);
  g.fillStyle = '#f4fbfd';
  g.fillRect(986, 238, 428, 14);
  g.fillStyle = '#d3e5ea';
  g.fillRect(986, 250, 428, 3);
  // pillow
  g.fillStyle = '#ffffff';
  g.fillRect(1004, 228, 104, 22);
  g.fillStyle = '#e2eef2';
  g.fillRect(1004, 244, 104, 6);
  g.fillStyle = '#c7dde2';
  g.fillRect(1008, 249, 96, 2);
  // blanket body (drawn before head so the chin tucks behind the edge)
  g.fillStyle = '#5fb8a8';
  g.fillRect(1066, 234, 272, 24);
  g.fillStyle = '#7dd4c2';
  g.fillRect(1066, 234, 272, 5);
  g.fillStyle = '#4aa295';
  g.fillRect(1066, 254, 272, 4);
  g.fillStyle = '#6cc7b6';
  g.fillRect(1112, 229, 126, 7);            // chest bump
  g.fillStyle = '#4a9e92';
  g.fillRect(1148, 240, 2, 16);             // folds
  g.fillRect(1214, 240, 2, 16);
  g.fillRect(1276, 238, 2, 18);
  g.fillStyle = '#e8f4f7';
  g.fillRect(1066, 258, 272, 7);            // blanket edge
  g.fillStyle = '#cfe4e8';
  g.fillRect(1330, 238, 12, 27);            // foot drape
  g.fillStyle = '#8fc3c9';
  g.fillRect(1337, 248, 5, 21);
  // patient head resting on the pillow, profile facing right
  g.fillStyle = '#e0ab7e';
  g.fillRect(1032, 208, 40, 30);            // head
  g.fillStyle = '#f0c292';
  g.fillRect(1034, 210, 32, 8);             // forehead light
  g.fillStyle = '#c98c62';
  g.fillRect(1032, 236, 36, 3);             // jaw shadow
  g.fillStyle = '#b47c55';
  g.fillRect(1038, 222, 4, 7);              // ear
  // messy dark hair
  g.fillStyle = '#3b2b25';
  g.fillRect(1024, 200, 48, 12);
  g.fillRect(1024, 206, 10, 26);
  g.fillStyle = '#2b1e1a';
  g.fillRect(1028, 200, 32, 3);
  g.fillRect(1066, 202, 8, 4);
  // closed eye, nose, mouth
  g.fillStyle = '#241a20';
  g.fillRect(1054, 222, 9, 2);
  g.fillStyle = '#c98c62';
  g.fillRect(1070, 224, 5, 7);              // nose
  g.fillStyle = '#8d4f3e';
  g.fillRect(1054, 232, 9, 2);              // mouth
  // oxygen cannula
  g.fillStyle = 'rgba(214, 242, 250, 0.9)';
  g.fillRect(1048, 228, 18, 2);
  g.fillStyle = '#d8a178';
  g.fillRect(1056, 236, 10, 6);             // neck
  // arm resting on the blanket
  g.fillStyle = '#e0ab7e';
  g.fillRect(1104, 240, 76, 9);
  g.fillStyle = '#f0c292';
  g.fillRect(1108, 241, 62, 3);
  g.fillStyle = '#c98c62';
  g.fillRect(1172, 240, 11, 9);             // hand
  g.fillStyle = '#a56a47';
  g.fillRect(1176, 243, 6, 1);
  // ECG electrode + wire
  g.fillStyle = '#20222a';
  g.fillRect(1110, 236, 3, 4);
  g.strokeStyle = '#5c6a72';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(1111, 238);
  g.lineTo(1122, 244);
  g.stroke();
  // side rails
  g.fillStyle = '#c8d6dc';
  g.fillRect(992, 264, 8, 38);
  g.fillRect(1378, 264, 8, 38);
  g.fillStyle = '#e4eef2';
  g.fillRect(992, 264, 3, 38);
  g.fillStyle = '#a8b8be';
  g.fillRect(986, 292, 18, 5);
  g.fillRect(1372, 292, 18, 5);
  // legs + wheels
  g.fillStyle = '#8fa4ad';
  g.fillRect(986, 298, 6, 22);
  g.fillRect(1400, 298, 6, 22);
  g.fillStyle = '#2b2b36';
  g.beginPath(); g.arc(989, 326, 8, 0, TAU); g.fill();
  g.beginPath(); g.arc(1403, 326, 8, 0, TAU); g.fill();
  g.fillStyle = '#5a6470';
  g.beginPath(); g.arc(989, 326, 3, 0, TAU); g.fill();
  g.beginPath(); g.arc(1403, 326, 3, 0, TAU); g.fill();

  // IV stand + bag
  g.fillStyle = '#b8c4cd';
  g.fillRect(900, 174, 3, 146);
  g.fillStyle = '#e8f4ff';
  g.fillRect(890, 142, 24, 34);
  g.fillStyle = '#8fe0ff';
  g.fillRect(894, 146, 16, 26);
  g.fillStyle = '#c7d3dd';
  g.fillRect(903, 176, 1, 96);
  g.fillStyle = '#4a4a58';
  g.fillRect(888, 316, 30, 4);
  g.beginPath(); g.arc(894, 322, 5, 0, TAU); g.fill();
  g.beginPath(); g.arc(912, 322, 5, 0, TAU); g.fill();

  // bedside table
  g.fillStyle = '#c9a77a';
  g.fillRect(1450, 256, 110, 60);
  g.fillStyle = '#e1c798';
  g.fillRect(1444, 248, 122, 10);
  g.fillStyle = '#a77d51';
  g.fillRect(1455, 268, 100, 4);
  g.fillStyle = '#f4f7f8';
  g.fillRect(1470, 232, 20, 18);           // flowers vase
  g.fillStyle = '#ff7aa8';
  g.fillRect(1468, 222, 10, 12);
  g.fillRect(1478, 226, 8, 10);
  g.fillStyle = '#2f8f4c';
  g.fillRect(1476, 236, 3, 10);
  g.fillStyle = '#20222a';
  g.fillRect(1520, 220, 34, 28);           // lamp/monitor
  g.fillStyle = '#64f0c8';
  g.fillRect(1524, 224, 26, 8);

  // ECG monitor cart
  g.fillStyle = '#3c5660';
  g.fillRect(1560, 206, 130, 92);
  g.fillStyle = '#24343b';
  g.fillRect(1566, 212, 118, 64);
  g.fillStyle = '#0a1b1b';
  g.fillRect(1572, 218, 106, 52);
  g.fillStyle = '#64f0c8';
  g.font = 'bold 9px "Courier New", monospace';
  g.textAlign = 'left';
  g.fillText('ECG', 1578, 230);
  g.fillStyle = '#8d9aa8';
  g.fillRect(1568, 294, 5, 26);
  g.fillRect(1680, 294, 5, 26);
  g.fillStyle = '#2b2b36';
  g.beginPath(); g.arc(1570, 324, 5, 0, TAU); g.fill();
  g.beginPath(); g.arc(1682, 324, 5, 0, TAU); g.fill();
  stage.ecgMonitors.push({ x: start + 1572, y: 218, w: 106, h: 52, phase: 0.2 });

  // entry door
  hospitalDoor(g, 40, 128, '302', '#8fe6ff');
  // chair
  hospitalChair(g, 720, 250);
  // anatomy poster
  hospitalPoster(g, 360, 128, 'ANATOMÍA', '#4d86c6', 'cross');
  hospitalSign(g, 'HABITACIÓN 302', 250, 76, 160, 26, '#8fe6ff');
  // clock
  g.fillStyle = '#f2f5f7';
  g.beginPath(); g.arc(640, 130, 22, 0, TAU); g.fill();
  g.strokeStyle = '#31515d'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = '#31515d'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(640, 130); g.lineTo(640, 116); g.stroke();
  g.beginPath(); g.moveTo(640, 130); g.lineTo(650, 135); g.stroke();

  // floor
  let y = 322, row = 0;
  while (y < h) {
    const rh = 14 + row * 1.8;
    for (let x = 0; x < w; x += 64) {
      const alt = ((x / 64 | 0) + row) % 2 === 0;
      g.fillStyle = alt ? '#dcecef' : '#bedce2';
      g.fillRect(x, y, 64, rh);
    }
    g.fillStyle = 'rgba(80, 135, 145, 0.22)';
    g.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = 'rgba(80, 135, 145, 0.13)';
      g.fillRect(x, y, 1, rh);
    }
    y += rh;
    row++;
  }
  // window light reflection
  g.fillStyle = 'rgba(150, 225, 245, 0.10)';
  g.fillRect(1280, 322, 300, 190);
  drawPixelNoise(g, 0, 60, w, 260, '#ffffff', 10, 0.03);
  return g.canvas;
}

/* ------------------------------------------------------------
   Hospital gate — double doors at zone seams
   ------------------------------------------------------------ */
function buildHospitalGate(stage, label, sub, color) {
  const w = 300, h = 540;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');

  // dark opening
  g.fillStyle = '#09171c';
  g.fillRect(12, 0, 276, 334);
  g.fillStyle = 'rgba(160, 230, 240, 0.08)';
  g.fillRect(20, 100, 260, 210);

  // header
  g.fillStyle = '#e2eef1';
  g.fillRect(0, 58, 300, 76);
  g.fillStyle = '#9fb8c0';
  g.fillRect(0, 58, 300, 4);
  g.fillStyle = '#f2fbfd';
  g.fillRect(8, 66, 284, 60);
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.strokeRect(12, 70, 276, 52);
  g.fillStyle = color;
  g.font = '900 22px "Arial Black", sans-serif';
  g.textAlign = 'center';
  g.fillText(label, 150, 98);
  g.fillStyle = '#3f6a78';
  g.font = 'bold 8px "Courier New", monospace';
  g.fillText(sub, 150, 112);
  // red cross
  g.fillStyle = '#d9534f';
  g.fillRect(136, 14, 28, 40);
  g.fillRect(128, 22, 44, 24);
  g.fillStyle = '#ffffff';
  g.fillRect(144, 20, 12, 28);
  g.fillRect(136, 28, 28, 12);

  // door leaves
  for (let i = 0; i < 2; i++) {
    const x = 24 + i * 132;
    g.fillStyle = '#dcecef';
    g.fillRect(x, 140, 120, 184);
    g.fillStyle = '#9fc7ce';
    g.fillRect(x + 6, 146, 108, 54);
    g.fillStyle = '#cdeef5';
    g.fillRect(x + 10, 150, 100, 46);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(x + 14, 154, 8, 38);
    g.fillStyle = '#3d6878';
    g.fillRect(x + 6, 206, 108, 4);
    g.fillStyle = '#b9d9df';
    g.fillRect(x + 6, 212, 108, 72);
    g.fillStyle = '#4d7f8c';
    g.fillRect(x + 40, 238, 40, 5);
    g.fillStyle = '#8fe6ff';
    g.fillRect(x + 54, 166, 12, 4);
  }
  g.fillStyle = '#8ba9b2';
  g.fillRect(150, 140, 3, 184);
  g.fillStyle = '#5e7982';
  g.fillRect(8, 312, 284, 8);
  // floor threshold + light spill
  g.fillStyle = color;
  g.globalAlpha = 0.55;
  g.fillRect(20, 320, 260, 3);
  g.globalAlpha = 1;
  const spill = g.createLinearGradient(0, 324, 0, 400);
  spill.addColorStop(0, color + '44');
  spill.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = spill;
  g.fillRect(14, 324, 272, 76);

  return c;
}

/* ------------------------------------------------------------
   Hospital props + animated overlays
   ------------------------------------------------------------ */
function buildHospitalProps(stage) {
  // Reception
  stage.addProp('chair', 210, 430);
  stage.addProp('chair', 300, 430);
  stage.addProp('medcart', 760, 440);
  stage.addProp('bin', 1660, 470);
  stage.addProp('planter', 2320, 352);
  stage.addProp('chair', 250, 380);

  // Hallway
  stage.addProp('gurney', 2860, 430);
  stage.addProp('medcart', 3130, 444);
  stage.addProp('bin', 3520, 468);
  stage.addProp('chair', 3980, 430);
  stage.addProp('medcart', 4280, 440);
  stage.addProp('gurney', 4680, 430);
  stage.addProp('bin', 5080, 468);
  stage.addProp('planter', 5330, 352);

  // Patient room
  stage.addProp('iv', 5860, 440);
  stage.addProp('medcart', 6100, 444);
  stage.addProp('chair', 5960, 430);
  stage.addProp('bin', 7000, 468);
  stage.addProp('medcart', 7280, 440);
  stage.addProp('chair', 7600, 430);
}

function drawHospitalOverlays(stage, ctx, camX, time) {
  // fluorescent glow
  for (const l of stage.hospitalLights || []) {
    const sx = l.x - camX;
    if (sx < -120 || sx > CFG.W + 120) continue;
    const flicker = (Math.sin(time * 9 + l.x) > 0.97) ? 0.25 : 1;
    ctx.save();
    ctx.globalAlpha = 0.10 * flicker;
    ctx.fillStyle = l.color;
    ctx.shadowColor = l.color;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(sx, l.y + 60, l.r, l.r * 0.65, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ECG traces
  for (const e of stage.ecgMonitors || []) {
    const sx = e.x - camX;
    if (sx < -e.w || sx > CFG.W) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, e.y, e.w, e.h);
    ctx.clip();
    ctx.fillStyle = 'rgba(2, 18, 16, 0.86)';
    ctx.fillRect(sx, e.y, e.w, e.h);
    ctx.strokeStyle = 'rgba(100, 240, 200, 0.08)';
    ctx.lineWidth = 1;
    for (let gy = e.y + 6; gy < e.y + e.h; gy += 8) {
      ctx.beginPath(); ctx.moveTo(sx + 2, gy); ctx.lineTo(sx + e.w - 2, gy); ctx.stroke();
    }
    // waveform
    ctx.strokeStyle = '#64f0c8';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#64f0c8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const cycle = 46;
    const span = 26;
    const baseY = e.y + e.h * 0.6;
    const scroll = (time * 46 + e.phase * 20) % cycle;
    for (let px = 0; px <= e.w; px += 2) {
      const ph = ((px + scroll) % cycle) / cycle;
      let dy = Math.sin(ph * TAU) * 1.2;
      if (ph > 0.38 && ph < 0.48) dy = -Math.sin((ph - 0.38) / 0.1 * Math.PI) * span;
      else if (ph > 0.48 && ph < 0.55) dy = Math.sin((ph - 0.48) / 0.07 * Math.PI) * 7;
      if (px === 0) ctx.moveTo(sx + px, baseY + dy);
      else ctx.lineTo(sx + px, baseY + dy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = Math.sin(time * 6 + e.phase) > 0 ? '#ff5a6e' : '#42131c';
    ctx.fillRect(sx + 4, e.y + 4, 4, 4);
    ctx.fillStyle = 'rgba(200, 255, 240, 0.55)';
    ctx.font = 'bold 6px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HR 82', sx + 12, e.y + 9);
    ctx.restore();
  }

  // IV drips in the room
  for (const d of stage.ivDrips || []) {
    const sx = d.x - camX;
    if (sx < -40 || sx > CFG.W + 40) continue;
    const t = (time * 0.15 + d.phase) % 1;
    ctx.fillStyle = 'rgba(170, 235, 255, 0.7)';
    ctx.fillRect(sx, d.y + t * 40, 2, 4);
  }

  // sign glow
  for (const s of stage.hospitalSigns || []) {
    const sx = s.x - camX;
    if (sx < -s.r || sx > CFG.W + s.r) continue;
    const a = 0.05 + (Math.sin(time * 2.5 + s.x * 0.02) * 0.5 + 0.5) * 0.08;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.ellipse(sx, s.y, s.r, s.r * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/* ============================================================
   STAGE 2 BOSS — CRYPTOCINO
   ============================================================ */

const hospitalScenery = {
  zones: ZONES2,
  layers: ['hospitalLights', 'hospitalSigns', 'ecgMonitors', 'ivDrips'],
  backgrounds: [buildReception, buildHallway, buildPatientRoom],
  buildProps: buildHospitalProps,
  buildGate: buildHospitalGate,
  gates: [
    [2450, 'EMERGENCIA', 'RECEPCIÓN · HOSPITAL GENERAL', '#8fe6ff'],
    [5450, 'HABITACIONES', 'PISO 3 · ALA ESTE', '#a7f3d0'],
  ],
  itemPool: ['firstaid', 'juice', 'pastelito'],
  drawOverlays: drawHospitalOverlays,
  markers: {
    positions: [[2680, '#8fe6ff'], [5680, '#a7f3d0']],
    y: 450, margin: 120, opacity: 0.30, speed: 3, pulse: 0.08,
  },
};

export { hospitalScenery };
