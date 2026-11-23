import { drawSprite } from '../media/sprite-renderer.js';
import { FONT_MONO, drawShadow, roundRectPath, text } from '../engine/canvas.js';
import { CFG, TAU, clamp, rand, sign } from '../engine/math.js';
import { Input } from '../input/actions.js';
import { Sound } from '../media/audio.js';
import { Art } from '../media/procedural-art.js';

function spawnNpc(game, lock) {
  const isStreet = game.stageId === 3;
  game.npc = {
    x: lock.camX + CFG.W - (isStreet ? 118 : 140),
    y: isStreet ? 446 : 440,
    facing: -1,
    animT: 0,
    phase: rand(0, TAU),
  };
  game.npcSprite = isStreet ? Art.npcGuy : Art.npcGirl;
  lock.npcSpawned = true;
  game.spawnBurst(game.npc.x, game.npc.y, 18, '#ffd166');
  Sound.sfx('select');
  game.ringText('!', game.npc.x, game.npc.y - 140, isStreet ? '#ffd166' : '#ff5fae');
}

function triggerNpcBubble(game) {
  if (game.npcBubble || game.npcDone) return;
  game.npcBubble = { t: 3.5, max: 3.5, blipT: 0 };
  game.spawnsPaused = true;
  Sound.sfx('dialog');
}

function finishNpcEvent(game) {
  if (game.npcDone) return;
  game.npcDone = true;
  game.npcBubble = null;
  game.spawnsPaused = false;
  const lock = game.activeLock;
  if (lock && !lock.cleared) game.clearLock(lock);
}

function updateNpcEvent(game, dt) {
  if (!game.npc) return;
  game.npc.animT += dt;
  if (!game.npcBubble && !game.npcDone) {
    game.npc.facing = sign(game.player.x - game.npc.x) || -1;
    if (Math.abs(game.player.x - game.npc.x) < 70 && Math.abs(game.player.y - game.npc.y) < 34) {
      triggerNpcBubble(game);
    }
  }
  if (game.npcBubble) {
    game.npcBubble.t -= dt;
    game.npcBubble.blipT -= dt;
    if (game.npcBubble.blipT <= 0) {
      game.npcBubble.blipT = 0.55;
      Sound.sfx('blip');
    }
    const armed = game.npcBubble.t < game.npcBubble.max - 0.25;
    if (armed && (Input.hit('attack') || Input.hit('jump'))) {
      finishNpcEvent(game);
      return;
    }
    if (game.npcBubble.t <= 0) finishNpcEvent(game);
  }
}

function drawNpc(game, ctx) {
  if (!game.npc) return;
  const sx = game.npc.x - game.camera.x;
  if (sx < -140 || sx > CFG.W + 140) return;
  const persp = 0.92 + (game.npc.y - CFG.FLOOR_TOP) / (CFG.FLOOR_BOTTOM - CFG.FLOOR_TOP) * 0.10;
  const h = 112 * persp * CFG.CHAR_SCALE;
  drawShadow(ctx, sx, game.npc.y, 40 * persp * CFG.CHAR_SCALE, 0, 0.9);
  drawSprite(ctx, game.npcSprite, 'idle', game.npc.animT, sx, game.npc.y, {
    h,
    flip: game.npc.facing < 0,
    glow: 'rgba(255, 255, 255, 0.2)',
    glowSize: 10,
  });
  if (!game.npcBubble && !game.npcDone) {
    const bob = Math.sin(game.npc.animT * 4) * 3;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 7, 18, 0.8)';
    ctx.beginPath();
    ctx.arc(sx, game.npc.y - h - 18 + bob, 11, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ff5fae';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 15px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', sx, game.npc.y - h - 12 + bob);
    ctx.restore();
  }
}

function drawNpcBubble(game, ctx) {
  if (!game.npcBubble || !game.player) return;

  if (game.stageId === 3 && game.npc) {
    const sx = clamp(game.npc.x - game.camera.x, 200, CFG.W - 200);
    const w = 436, h = 74;
    const x = sx - w / 2;
    const y = clamp(game.npc.y - 170 - h, 62, 330);
    const alpha = clamp(game.npcBubble.t / 0.5, 0, 1) * clamp((game.npcBubble.max - game.npcBubble.t) / 0.15, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    // drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRectPath(ctx, x + 6, y + 6, w, h, 10);
    ctx.fill();
    // comic bubble
    ctx.fillStyle = '#fff8e8';
    roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = '#151018';
    ctx.lineWidth = 4;
    ctx.stroke();
    // pixel tail pointing down at the NPC
    ctx.fillStyle = '#fff8e8';
    ctx.beginPath();
    ctx.moveTo(sx - 17, y + h);
    ctx.lineTo(sx, y + h + 24);
    ctx.lineTo(sx + 18, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#151018';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx - 17, y + h);
    ctx.lineTo(sx, y + h + 24);
    ctx.lineTo(sx + 18, y + h);
    ctx.stroke();
    ctx.fillStyle = '#fff8e8';
    ctx.fillRect(sx - 15, y + h - 3, 30, 6);
    // exact dialogue
    text(ctx, 'Esta muy rica la hamburguesa Yomvi, gracias papi', sx, y + 32, 12, '#1c1420', {
      align: 'center', outline: null, font: FONT_MONO, weight: 'bold', spacing: 0.1,
    });
    text(ctx, '[Z / X] CERRAR', sx, y + h - 13, 8, '#8a6a44', {
      align: 'center', outline: null, font: FONT_MONO, weight: 'bold', spacing: 0.5,
    });
    ctx.restore();
    return;
  }

  const p = game.player;
  const sx = clamp(p.x - game.camera.x, 180, CFG.W - 180);
  const footY = p.y - p.z;
  const by = clamp(footY - 195, 96, 420);
  const w = 306, h = 70;
  const x = sx - w / 2;
  const y = by - h;
  const alpha = clamp(game.npcBubble.t / 0.5, 0, 1) * clamp((game.npcBubble.max - game.npcBubble.t) / 0.15, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRectPath(ctx, x + 5, y + 5, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#151018';
  ctx.lineWidth = 4;
  ctx.stroke();
  // pixel tail
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(sx - 16, y + h);
  ctx.lineTo(sx, y + h + 22);
  ctx.lineTo(sx + 18, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#151018';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx - 16, y + h);
  ctx.lineTo(sx, y + h + 22);
  ctx.lineTo(sx + 18, y + h);
  ctx.stroke();
  ctx.fillStyle = '#151018';
  ctx.fillRect(sx - 14, y + h - 2, 28, 4);
  // text
  text(ctx, 'Te gusta el pipi o la totona?', sx, y + 33, 14, '#161018', {
    align: 'center', outline: null, font: FONT_MONO, weight: 'bold', spacing: 0.2,
  });
  text(ctx, '[Z / X] CERRAR', sx, y + h - 12, 8, '#7a6a86', {
    align: 'center', outline: null, font: FONT_MONO, weight: 'bold', spacing: 0.5,
  });
  ctx.restore();
}

export { drawNpc, drawNpcBubble, spawnNpc, updateNpcEvent };
