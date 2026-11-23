import { FONT_MONO, roundRectPath, text } from '../engine/canvas.js';
import { CFG, clamp, padScore } from '../engine/math.js';
import { UI } from './hud.js';

function stageClear(ctx, g) {
  const t = g.time;
  const id = g.stageId || 1;
  const isStage2 = id === 2;
  const left = Math.max(0, g.stageClearTime);
  const max = g.stageClearMax || 6.5;
  const progress = clamp(1 - left / max, 0, 1);
  const stats = g.stageClearStats || { score: g.score, level: g.player ? g.player.level : 1, kills: g.kills, time: g.stageTime };

  const bgBase = isStage2 ? '#04131a' : '#0b0714';
  const accent = isStage2 ? '#8fe6ff' : '#ffd166';
  const accent2 = isStage2 ? '#7dffc4' : '#ff8a3d';
  const glow = isStage2 ? 'rgba(143, 230, 255, 0.55)' : 'rgba(255, 209, 102, 0.55)';
  const pattern = isStage2 ? '#8fe6ff' : '#ff5fae';
  const title = isStage2 ? 'STAGE 2 CLEAR' : 'STAGE 1 CLEAR';
  const sub = isStage2 ? 'HOSPITAL GENERAL · PACIENTES A SALVO' : 'GALERÍAS MALL · ZONA DESPEJADA';
  const next = isStage2 ? 'SIGUIENTE: CALLE GALERÍAS MALL' : 'SIGUIENTE: HOSPITAL GENERAL';
  const nextSub = isStage2 ? 'PUESTOS DE COMIDA · BURGER ROOM' : 'RECEPCIÓN · EMERGENCIA · HABITACIONES';
  const prep = isStage2 ? 'PREPARANDO STAGE 3' : 'PREPARANDO STAGE 2';

  ctx.fillStyle = bgBase;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  const bg = ctx.createRadialGradient(CFG.W / 2, 260, 40, CFG.W / 2, 260, 640);
  if (isStage2) {
    bg.addColorStop(0, 'rgba(28, 92, 105, 0.40)');
    bg.addColorStop(0.6, 'rgba(10, 40, 50, 0.2)');
    bg.addColorStop(1, 'rgba(3, 10, 14, 0.9)');
  } else {
    bg.addColorStop(0, 'rgba(104, 42, 22, 0.42)');
    bg.addColorStop(0.6, 'rgba(60, 18, 34, 0.22)');
    bg.addColorStop(1, 'rgba(8, 4, 12, 0.92)');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  // stage-themed diagonal pattern
  ctx.save();
  ctx.globalAlpha = isStage2 ? 0.06 : 0.08;
  ctx.strokeStyle = pattern;
  ctx.lineWidth = 2;
  for (let x = -100; x < CFG.W + 100; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (isStage2 ? 200 : -160), CFG.H);
    ctx.stroke();
  }
  ctx.restore();

  text(ctx, title, CFG.W / 2, 128, 54, isStage2 ? UI.cyan : UI.goldHot, {
    align: 'center', outlineW: 10, outline: '#170a12', spacing: 4,
    shadow: isStage2 ? '#0d5a72' : '#8d0e31', shadowX: 5, shadowY: 6, glow, glowSize: 26,
  });
  text(ctx, sub, CFG.W / 2, 162, 11, isStage2 ? '#7dffc4' : UI.cyan, {
    align: 'center', outlineW: 3, spacing: 2, font: FONT_MONO,
  });

  // stats panel
  ctx.fillStyle = isStage2 ? 'rgba(7, 24, 30, 0.86)' : 'rgba(26, 12, 18, 0.86)';
  roundRectPath(ctx, 270, 198, 420, 124, 8);
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.stroke();
  const rows = [
    ['PUNTUACIÓN', padScore(stats.score)],
    ['NIVEL DE YOMVI', 'NIV. ' + stats.level],
    ['DERRIBOS', String(stats.kills)],
    ['TIEMPO', Math.floor(stats.time / 60) + ':' + String(Math.floor(stats.time % 60)).padStart(2, '0')],
  ];
  rows.forEach((r, i) => {
    const y = 228 + i * 22;
    text(ctx, r[0], 300, y, 10, UI.dim, { font: FONT_MONO, outlineW: 2, spacing: 1 });
    text(ctx, r[1], 660, y, 12, isStage2 ? '#8fe6ff' : UI.goldHot, { align: 'right', font: FONT_MONO, outlineW: 2 });
  });

  text(ctx, next, CFG.W / 2, 366, 16, UI.white, {
    align: 'center', outlineW: 4, spacing: 2,
  });
  text(ctx, nextSub, CFG.W / 2, 388, 9, isStage2 ? '#8fb8c4' : '#d8b48a', {
    align: 'center', outlineW: 2, spacing: 1.5, font: FONT_MONO,
  });

  const barX = 280, barY = 430, barW = 400, barH = 10;
  ctx.fillStyle = isStage2 ? '#10242c' : '#241018';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, accent2);
  ctx.fillStyle = grad;
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);

  const dots = '.'.repeat(1 + (Math.floor(t * 3) % 3));
  text(ctx, prep + dots, CFG.W / 2, 466, 11, isStage2 ? UI.gold : '#ffd166', {
    align: 'center', outlineW: 2, font: FONT_MONO, spacing: 2,
  });
  text(ctx, 'DEMO · CONTINÚA AUTOMÁTICAMENTE', CFG.W / 2, 516, 9, isStage2 ? '#6f8f9a' : '#9a7f88', {
    align: 'center', outlineW: 2, font: FONT_MONO, spacing: 1,
  });
}

export { stageClear };
