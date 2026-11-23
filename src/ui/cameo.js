import { CFG } from '../engine/math.js';
import { Assets } from '../media/assets.js';

const ENTER_DURATION = 0.18;
const EXIT_START = 0.94;
const EXIT_DURATION = 0.23;
const CAMEO_DURATION = EXIT_START + EXIT_DURATION;
const CAMEOS = {
  toasty: { portraitKey: 'toastyCameo', lines: ['TOASTY!'], textSize: 34, border: '#ffb64d', ink: '#ffe790' },
  death: { portraitKey: 'deathCameo', lines: ['YO CREO QUE', 'SE MURIO!'], textSize: 23, border: '#71caff', ink: '#e1f6ff' },
};

function drawCameo(ctx, kind, age, reducedMotion, minimumTop) {
  const { portraitKey, lines, textSize, border, ink } = CAMEOS[kind];
  const entrance = Math.min(age / ENTER_DURATION, 1);
  const leaving = Math.max(0, (age - EXIT_START) / EXIT_DURATION);
  const top = Math.max(85, minimumTop);

  ctx.save();
  ctx.beginPath();
  ctx.rect(CFG.W - 301, top, 301, 153);
  ctx.clip();
  ctx.translate(CFG.W - 25, top + 137);
  if (!reducedMotion) {
    ctx.translate(260 * (1 - entrance) ** 3 + 240 * leaving ** 2, 0);
    ctx.rotate((1 - entrance) * -0.075 + Math.sin(entrance * Math.PI) * 0.035);
  }
  ctx.globalAlpha *= Math.min(entrance * 4, 1) * (1 - leaving);

  ctx.fillStyle = '#1c0c1c';
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-272, -67);
  ctx.lineTo(-226, -129);
  ctx.lineTo(25, -108);
  ctx.lineTo(20, 8);
  ctx.lineTo(-257, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha *= 0.42;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-256 + i * 15, -35 - i * 15);
    ctx.lineTo(-229 + i * 17, -77 - i * 11);
  }
  ctx.stroke();
  ctx.restore();

  const portrait = Assets[portraitKey];
  if (portrait) {
    const scale = 134 / Math.max(portrait.naturalWidth, portrait.naturalHeight);
    const width = portrait.naturalWidth * scale;
    const height = portrait.naturalHeight * scale;
    ctx.drawImage(portrait, 18 - width, 7 - height, width, height);
  }
  ctx.font = `900 ${textSize}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#260b16';
  ctx.fillStyle = ink;
  const firstLineY = lines.length === 1 ? -42 : -58;
  for (const [index, line] of lines.entries()) {
    const y = firstLineY + index * 29;
    ctx.strokeText(line, -248, y, 122);
    ctx.fillText(line, -248, y, 122);
  }
  ctx.restore();
}

export { CAMEO_DURATION, drawCameo };
