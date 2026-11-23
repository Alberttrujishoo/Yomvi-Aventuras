import { CFG } from '../engine/math.js';
import { Assets } from '../media/assets.js';

const ENTER_DURATION = 0.18;
const EXIT_START = 0.94;
const EXIT_DURATION = 0.23;
const FEROZ_CAMEO_DURATION = EXIT_START + EXIT_DURATION;

function drawFerozCameo(ctx, age, reducedMotion) {
  const entrance = Math.min(age / ENTER_DURATION, 1);
  const leaving = Math.max(0, (age - EXIT_START) / EXIT_DURATION);

  ctx.save();
  ctx.beginPath();
  ctx.rect(CFG.W - 301, 85, 301, 153);
  ctx.clip();
  ctx.translate(CFG.W - 25, 222);
  if (!reducedMotion) {
    ctx.translate(260 * (1 - entrance) ** 3 + 240 * leaving ** 2, 0);
    ctx.rotate((1 - entrance) * -0.075 + Math.sin(entrance * Math.PI) * 0.035);
  }
  ctx.globalAlpha *= Math.min(entrance * 4, 1) * (1 - leaving);

  ctx.fillStyle = '#111a18';
  ctx.strokeStyle = '#b4e849';
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
  ctx.strokeStyle = '#eea648';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-256 + i * 15, -35 - i * 15);
    ctx.lineTo(-229 + i * 17, -77 - i * 11);
  }
  ctx.stroke();
  ctx.restore();

  if (Assets.ferozCameo) {
    ctx.drawImage(Assets.ferozCameo, -263, -94, 260, 105);
  }
  ctx.font = '900 34px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#07170b';
  ctx.fillStyle = '#efff9a';
  ctx.strokeText('¡FEROZ!', -110, -96);
  ctx.fillText('¡FEROZ!', -110, -96);
  ctx.restore();
}

export { FEROZ_CAMEO_DURATION, drawFerozCameo };
