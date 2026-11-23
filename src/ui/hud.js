import { drawPortrait, drawSprite } from '../media/sprite-renderer.js';
import { FONT_MONO, drawShadow, roundRectPath, text } from '../engine/canvas.js';
import { CFG, TAU, clamp, padScore } from '../engine/math.js';
import { stageClear } from './stage-clear.js';

/* ============================================================
   YOMVI ADVENTURES — arcade HUD, boss bar, title + screens
   ============================================================ */

const UI = {
  gold: '#ffd166',
  goldHot: '#ffe066',
  red: '#ff3b5c',
  pink: '#ff5fae',
  cyan: '#5ad2ff',
  green: '#7dffc4',
  white: '#f4f0ff',
  dim: '#9a8ab0',
  dark: '#080510',
  black: '#0a0712',
  panel: '#160f26',
};

function drawHeart(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y + s * 0.2, s, s * 0.55);
  ctx.fillRect(x - s * 0.45, y + s * 0.05, s * 0.45, s * 0.45);
  ctx.fillRect(x + s, y + s * 0.05, s * 0.45, s * 0.45);
  ctx.fillRect(x - s * 0.45, y + s * 0.35, s * 0.2, s * 0.4);
  ctx.fillRect(x + s * 0.8, y + s * 0.35, s * 0.2, s * 0.4);
  ctx.restore();
}

function drawCoinIcon(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a9741c';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe9a3';
  ctx.fillRect(x - r * 0.18, y - r * 0.5, r * 0.36, r);
  ctx.restore();
}

const HUD = {
  stageClear,
  draw(ctx, g) {
    const p = g.player;
    const t = g.time;

    /* ---------------- top arcade bar ---------------- */
    const barGrad = ctx.createLinearGradient(0, 0, 0, 66);
    barGrad.addColorStop(0, '#140c22');
    barGrad.addColorStop(0.75, '#0b0714');
    barGrad.addColorStop(1, '#080510');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, CFG.W, 66);
    ctx.fillStyle = UI.gold;
    ctx.fillRect(0, 63, CFG.W, 3);
    ctx.fillStyle = 'rgba(255, 79, 139, 0.55)';
    ctx.fillRect(0, 60, CFG.W, 1);

    // diagonal cabinet trim
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,79,139,0.10)' : 'rgba(90,210,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(0, i * 6);
      ctx.lineTo(26, i * 6);
      ctx.lineTo(6, i * 6 + 5);
      ctx.lineTo(0, i * 6 + 5);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.translate(CFG.W, 0);
      ctx.scale(-1, 1);
      ctx.fill();
      ctx.restore();
    }

    // portrait frame
    const px = 13, py = 8, ps = 48;
    ctx.fillStyle = '#2a193c';
    ctx.fillRect(px - 2, py - 2, ps + 4, ps + 4);
    ctx.fillStyle = UI.gold;
    ctx.fillRect(px - 1, py - 1, ps + 2, ps + 2);
    ctx.fillStyle = '#120a1e';
    ctx.fillRect(px, py, ps, ps);
    drawPortrait(ctx, g.heroSprite, px, py, ps, ps);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, ps - 1, ps - 1);

    // 1UP + name + score
    const blinkSlow = Math.sin(t * 3.4) > -0.3;
    text(ctx, '1UP', 70, 17, 11, UI.red, { font: FONT_MONO, outlineW: 2, alpha: blinkSlow ? 1 : 0.45 });
    text(ctx, 'YOMVI', 70, 34, 17, UI.goldHot, { outlineW: 4, spacing: 0.5 });
    text(ctx, padScore(g.score), 70, 52, 13, UI.white, { font: FONT_MONO, outlineW: 2, spacing: 0.5 });

    // level + XP (5 kills per level)
    text(ctx, 'NIV. ' + p.level, 160, 33, 10, UI.cyan, {
      font: FONT_MONO, outlineW: 2, spacing: 0.5,
    });
    for (let i = 0; i < 5; i++) {
      const pxp = 160 + i * 10;
      ctx.fillStyle = '#1a1024';
      ctx.fillRect(pxp, 40, 7, 6);
      if (i < p.killsToLevel) {
        ctx.fillStyle = UI.goldHot;
        ctx.fillRect(pxp + 1, 41, 5, 4);
      }
    }
    text(ctx, 'XP', 214, 46, 7, UI.dim, { font: FONT_MONO, outlineW: 2 });

    // health
    const hx = 236, hy = 24;
    text(ctx, 'ENERGÍA', hx, 16, 9, UI.dim, { font: FONT_MONO, outlineW: 2, spacing: 1 });
    const segs = 22;
    const segW = 12, segH = 14, segGap = 2;
    const hpFrac = clamp(p.hp / p.maxHp, 0, 1);
    const lit = Math.ceil(hpFrac * segs);
    const hpColor = hpFrac > 0.5 ? UI.green : hpFrac > 0.25 ? UI.gold : UI.red;
    ctx.fillStyle = '#1a0f24';
    ctx.fillRect(hx - 2, hy - 2, segs * (segW + segGap) + 4, segH + 4);
    for (let i = 0; i < segs; i++) {
      const x = hx + i * (segW + segGap);
      if (i < lit) {
        ctx.fillStyle = hpColor;
        ctx.fillRect(x, hy, segW, segH);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x, hy, segW, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(x + segW - 2, hy, 2, segH);
      } else {
        ctx.fillStyle = '#2b1420';
        ctx.fillRect(x, hy, segW, segH);
        ctx.fillStyle = '#170b13';
        ctx.fillRect(x + 1, hy + 1, segW - 2, segH - 2);
      }
    }
    // low-health pulse
    if (hpFrac <= 0.25 && hpFrac > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.abs(Math.sin(t * 8)) * 0.4;
      ctx.strokeStyle = UI.red;
      ctx.lineWidth = 2;
      ctx.strokeRect(hx - 4, hy - 4, segs * (segW + segGap) + 8, segH + 8);
      ctx.restore();
    }

    // lives
    text(ctx, 'VIDAS', hx, 56, 9, UI.dim, { font: FONT_MONO, outlineW: 2, spacing: 1 });
    for (let i = 0; i < Math.min(3, p.lives); i++) {
      drawHeart(ctx, hx + 40 + i * 16, 50, 6, i === 0 ? '#ff5a6e' : '#ff97a6');
    }
    if (p.lives > 3) text(ctx, '+' + (p.lives - 3), hx + 40 + 3 * 16, 56, 9, UI.dim, { font: FONT_MONO });

    // special hint
    const specialCost = p.getSpecialCost();
    text(ctx, `[C] GIRO -${Math.ceil(specialCost)}HP`, 352, 56, 8, p.hp > specialCost ? UI.gold : '#7a5566', {
      font: FONT_MONO, outlineW: 2, alpha: 0.9,
    });

    // right block
    text(ctx, 'HI-SCORE', 946, 15, 9, UI.cyan, { align: 'right', font: FONT_MONO, outlineW: 2, spacing: 1 });
    text(ctx, padScore(g.hiScore), 946, 33, 16, UI.white, { align: 'right', font: FONT_MONO, outlineW: 3, spacing: 0.5 });
    const blink = Math.sin(t * 4.6) > 0;
    const coinText = blink ? 'INSERT COIN' : 'FREE PLAY';
    text(ctx, coinText, 946, 53, 10, blink ? UI.goldHot : UI.green, {
      align: 'right', font: FONT_MONO, outlineW: 2, spacing: 1,
    });
    if (g.muted) {
      text(ctx, 'SONIDO OFF [M]', 796, 53, 8, UI.red, { align: 'right', font: FONT_MONO, outlineW: 2 });
    }

    /* ---------------- boss bar ---------------- */
    if (g.boss && g.boss.active && g.boss.alive && g.bossDefeated === false) {
      this.drawBossBar(ctx, g);
    }

    /* ---------------- wave / combo ---------------- */
    if (g.lockActive) {
      let label;
      if (g.activeLock && g.activeLock.boss) {
        label = `ARENA DEL JEFE · FASE ${g.boss && g.boss.enraged ? 2 : 1}`;
      } else if (g.activeLock && g.activeLock.event === 'npc' && g.activeLock.npcSpawned && !g.npcDone) {
        label = g.npcBubble ? 'EVENTO · HABLANDO...' : 'EVENTO · ACÉRCATE A LA CHICA';
      } else {
        let remaining = g.enemies.filter(e => e.alive).length;
        if (g.activeLock) remaining += g.activeLock.wave.filter(w => !w.spawned).length;
        label = `ÁREA BLOQUEADA · ${remaining} ENEMIGO${remaining === 1 ? '' : 'S'}`;
      }
      const bx = 16, by = 490, bw = 264, bh = 20;
      ctx.save();
      ctx.fillStyle = 'rgba(10, 5, 16, 0.82)';
      roundRectPath(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 59, 92, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      const a = 0.7 + Math.abs(Math.sin(t * 4)) * 0.3;
      ctx.fillStyle = UI.red;
      ctx.beginPath();
      ctx.arc(bx + 11, by + 10, 3.5, 0, TAU);
      ctx.fill();
      text(ctx, label, bx + 21, by + 14, 9, UI.white, {
        outlineW: 2, font: FONT_MONO, spacing: 0.5, alpha: a,
      });
      ctx.restore();
    }

    if (g.comboCount >= 3 && g.comboTimer > 0) {
      const pop = clamp(1.5 - Math.max(0, g.comboTimer - 1.6) * 2, 0.8, 1.2);
      ctx.save();
      ctx.translate(150, 116);
      ctx.scale(pop, pop);
      text(ctx, g.comboCount + ' HITS!', 0, 0, 20, UI.goldHot, {
        align: 'center', outlineW: 5, outline: '#3a0d1f', spacing: 1,
        shadow: UI.red, shadowX: 2, shadowY: 3,
      });
      ctx.restore();
    }

    /* ---------------- GO! arrow ---------------- */
    if (g.goActive) this.drawGoArrow(ctx, g);

    /* ---------------- grab prompt ---------------- */
    if (g.grabPrompt) {
      const pSX = p.x - g.camera.x;
      const bob = Math.sin(t * 9) * 2;
      const bx = pSX, by = p.y - p.z - 162 + bob;
      ctx.save();
      ctx.fillStyle = 'rgba(10,7,18,0.86)';
      roundRectPath(ctx, bx - 46, by - 12, 92, 22, 4);
      ctx.fill();
      ctx.strokeStyle = UI.gold;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, '[Z] AGARRAR', bx, by + 4, 10, UI.goldHot, { align: 'center', outlineW: 2, font: FONT_MONO });
      ctx.restore();
    }

    if (p.state === 'grab') {
      const pSX = p.x - g.camera.x;
      const bob = Math.sin(t * 8) * 2;
      const bx = pSX, by = p.y - p.z - 170 + bob;
      ctx.save();
      ctx.fillStyle = 'rgba(10,7,18,0.88)';
      roundRectPath(ctx, bx - 94, by - 12, 188, 22, 4);
      ctx.fill();
      ctx.strokeStyle = UI.goldHot;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, '[Z] RODILLA     [X] LANZAR', bx, by + 4, 9.5, UI.goldHot, { align: 'center', outlineW: 2, font: FONT_MONO });
      ctx.restore();
    }

    /* ---------------- level up / banner ---------------- */
    if (g.levelMsg) this.drawLevelUp(ctx, g);
    else if (g.bannerData && g.bannerData.t > 0) this.drawBanner(ctx, g);

    /* ---------------- damage vignette ---------------- */
    if (g.damageFlash > 0) {
      const a = g.damageFlash / 0.32;
      const grad = ctx.createRadialGradient(CFG.W / 2, CFG.H / 2, 180, CFG.W / 2, CFG.H / 2, 620);
      grad.addColorStop(0, 'rgba(255, 30, 60, 0)');
      grad.addColorStop(1, `rgba(255, 20, 50, ${0.42 * a})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
    }

    /* ---------------- scanlines + glass ---------------- */
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#000';
    for (let y = 0; y < CFG.H; y += 4) ctx.fillRect(0, y, CFG.W, 1);
    ctx.restore();

    /* ---------------- controls strip (desktop only) ---------------- */
    if (!g.touchMode) {
      ctx.fillStyle = 'rgba(7, 4, 12, 0.88)';
      ctx.fillRect(0, 514, CFG.W, 26);
      ctx.fillStyle = 'rgba(255, 209, 102, 0.28)';
      ctx.fillRect(0, 514, CFG.W, 1);
      text(ctx, 'WASD/FLECHAS MOVER   ·   Z/J GOLPEAR   ·   X/K SALTAR · PATADA AÉREA   ·   C/L GIRO (-12HP)   ·   DOBLE TOQUE DASH   ·   P PAUSA   ·   M SONIDO', 14, 532, 9, '#b9a8d0', {
        font: FONT_MONO, outlineW: 2, spacing: 0.3,
      });
    }
  },

  drawBossBar(ctx, g) {
    const b = g.boss;
    const bx = 210, by = 72, bw = 540;
    ctx.save();
    // panel
    ctx.fillStyle = 'rgba(10, 5, 16, 0.92)';
    roundRectPath(ctx, bx, by, bw, 52, 5);
    ctx.fill();
    ctx.strokeStyle = b.enraged ? UI.red : '#63243f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = b.enraged ? 'rgba(255,46,99,0.18)' : 'rgba(120, 40, 70, 0.14)';
    roundRectPath(ctx, bx + 2, by + 2, bw - 4, 48, 4);
    ctx.fill();

    // label
    const bossName = b.bossName || 'ARTHAS';
    const bossSub = b.bossSub !== undefined ? b.bossSub : '- JORGE SALINAS';
    text(ctx, bossName, bx + 14, by + 18, 15, UI.goldHot, {
      outlineW: 4, spacing: 1.5, shadow: UI.red, shadowX: 2, shadowY: 2,
    });
    if (bossSub) {
      text(ctx, bossSub, bx + 96, by + 18, 15, UI.white, { outlineW: 4, spacing: 0.5 });
    }
    if (b.enraged) {
      const a = Math.sin(g.time * 10) > 0 ? 1 : 0.35;
      text(ctx, 'ENFURECIDO', bx + bw - 14, by + 17, 11, UI.red, {
        align: 'right', outlineW: 3, spacing: 1, alpha: a,
      });
    } else {
      text(ctx, 'JEFE FINAL', bx + bw - 14, by + 17, 9, UI.pink, {
        align: 'right', outlineW: 2, font: FONT_MONO, spacing: 1,
      });
    }

    // three stacked life layers
    const lx = bx + 14, lw = bw - 28;
    const layerH = 6, gap = 3;
    const layerMax = b.layerSize;
    for (let i = 0; i < 3; i++) {
      // i=0 bottom (0..140), i=1 middle, i=2 top
      const frac = clamp((b.hp - i * layerMax) / layerMax, 0, 1);
      const y = by + 26 + (2 - i) * (layerH + gap);
      ctx.fillStyle = '#260c16';
      ctx.fillRect(lx, y, lw, layerH);
      ctx.fillStyle = '#14070d';
      ctx.fillRect(lx + 1, y + 1, lw - 2, layerH - 2);
      if (frac > 0) {
        const colors = ['#ffe066', '#ff8a3d', '#ff2e63'];
        const grad = ctx.createLinearGradient(lx, y, lx, y + layerH);
        grad.addColorStop(0, colors[i]);
        grad.addColorStop(1, i === 2 ? '#b3163f' : i === 1 ? '#b75416' : '#b3911f');
        ctx.fillStyle = grad;
        ctx.fillRect(lx, y, lw * frac, layerH);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(lx, y, lw * frac, 1);
        // hazard tick at the layer edge
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(lx + lw * frac - 1, y, 2, layerH);
      }
      // tick divisions
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let s = 1; s < 8; s++) ctx.fillRect(lx + (lw / 8) * s, y, 1, layerH);
    }
    ctx.restore();
  },

  drawGoArrow(ctx, g) {
    const t = g.time;
    const bob = Math.sin(t * 5) * 6;
    const pulse = 0.62 + Math.abs(Math.sin(t * 4.5)) * 0.38;
    const x = CFG.W - 118;
    const y = 300 + bob;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.translate(x, y);
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 24;
    // chevrons
    for (let i = 0; i < 3; i++) {
      const off = i * 20 + (t * 40 % 20);
      ctx.globalAlpha = pulse * (0.85 - i * 0.18);
      ctx.fillStyle = UI.goldHot;
      ctx.beginPath();
      ctx.moveTo(-58 + off, -16);
      ctx.lineTo(-36 + off, 0);
      ctx.lineTo(-58 + off, 16);
      ctx.lineTo(-48 + off, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = pulse;
    ctx.font = '900 34px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#3a1608';
    ctx.strokeText('GO!', -6, 12);
    ctx.fillStyle = UI.goldHot;
    ctx.fillText('GO!', -6, 12);
    ctx.restore();
  },

  drawBanner(ctx, g) {
    const b = g.bannerData;
    const life = b.t / b.max;
    const slide = clamp((1 - life) * 3, 0, 1);
    const fade = clamp(life * 4, 0, 1);
    const y = 150 + (1 - slide) * -24;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(9, 5, 16, 0.75)';
    ctx.fillRect(0, y - 34, CFG.W, 68);
    ctx.fillStyle = b.color;
    ctx.fillRect(0, y - 34, CFG.W, 2);
    ctx.fillRect(0, y + 34, CFG.W, 2);
    text(ctx, b.text, CFG.W / 2, y + 2, 27, b.color, {
      align: 'center', outlineW: 6, spacing: 2, shadow: '#120814', shadowX: 3, shadowY: 4,
    });
    if (b.sub) {
      text(ctx, b.sub, CFG.W / 2, y + 24, 10, UI.white, {
        align: 'center', outlineW: 3, font: FONT_MONO, spacing: 1.4,
      });
    }
    ctx.restore();
  },

  drawLevelUp(ctx, g) {
    const m = g.levelMsg;
    if (!m) return;
    const life = clamp(m.t / m.max, 0, 1);
    const fadeIn = clamp((m.max - m.t) / 0.25, 0, 1);
    const fadeOut = clamp(m.t / 0.6, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const y = 150;

    ctx.save();
    ctx.globalAlpha = alpha;

    // golden ribbon
    const bg = ctx.createLinearGradient(0, y - 44, 0, y + 44);
    bg.addColorStop(0, 'rgba(16, 8, 20, 0.95)');
    bg.addColorStop(0.5, 'rgba(44, 24, 12, 0.95)');
    bg.addColorStop(1, 'rgba(16, 8, 20, 0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, y - 44, CFG.W, 88);
    ctx.fillStyle = UI.goldHot;
    ctx.fillRect(0, y - 44, CFG.W, 2);
    ctx.fillRect(0, y + 42, CFG.W, 2);

    ctx.save();
    ctx.globalAlpha = alpha * 0.30;
    ctx.fillStyle = UI.goldHot;
    ctx.shadowColor = UI.goldHot;
    ctx.shadowBlur = 30;
    ctx.fillRect(CFG.W / 2 - 330, y - 10, 660, 20);
    ctx.restore();

    text(ctx, 'SUBISTE DE SAPONIVEL', CFG.W / 2, y + 1, 32, UI.goldHot, {
      align: 'center', outlineW: 8, outline: '#2a0a14', spacing: 2.5,
      shadow: '#8d0e31', shadowX: 3, shadowY: 4,
      glow: 'rgba(255, 209, 102, 0.75)', glowSize: 24,
    });
    text(ctx, m.sub, CFG.W / 2, y + 26, 10, UI.white, {
      align: 'center', outlineW: 3, font: FONT_MONO, spacing: 1.2,
    });

    // five little stars, one per kill toward the next level
    for (let i = 0; i < 5; i++) {
      const sx = CFG.W / 2 - 48 + i * 24;
      ctx.fillStyle = i < g.player.killsToLevel ? UI.goldHot : 'rgba(255, 209, 102, 0.20)';
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * TAU / 5;
        const r = 4;
        const px = sx + Math.cos(a) * r;
        const py = y + 38 + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },

  /* ==========================================================
     TITLE SCREEN
     ========================================================== */
  title(ctx, g) {
    const t = g.time;
    const pan = 40 + Math.sin(t * 0.18) * 30;
    ctx.save();
    ctx.drawImage(g.stage.canvases[0], -pan, 0);
    // darken + tint
    const grad = ctx.createLinearGradient(0, 0, 0, CFG.H);
    grad.addColorStop(0, 'rgba(10, 5, 20, 0.72)');
    grad.addColorStop(0.45, 'rgba(12, 6, 24, 0.55)');
    grad.addColorStop(1, 'rgba(6, 3, 12, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // neon horizon
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#ff4f8b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 330 + i * 26);
      ctx.lineTo(CFG.W, 330 + i * 26);
      ctx.stroke();
    }
    for (let i = -8; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(480 + i * 60, 330);
      ctx.lineTo(480 + i * 220, 540);
      ctx.stroke();
    }
    ctx.restore();

    // floating sparkles
    for (let i = 0; i < 22; i++) {
      const sx = (i * 97 + t * (12 + i % 5)) % CFG.W;
      const sy = 120 + ((i * 53) % 330) + Math.sin(t + i) * 8;
      ctx.globalAlpha = 0.25 + (Math.sin(t * 3 + i) * 0.5 + 0.5) * 0.45;
      ctx.fillStyle = ['#ffd166', '#ff5fae', '#5ad2ff'][i % 3];
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.globalAlpha = 1;

    // decorative neon halo behind the logo
    const halo = ctx.createRadialGradient(CFG.W / 2, 270, 40, CFG.W / 2, 270, 300);
    halo.addColorStop(0, 'rgba(255, 95, 174, 0.20)');
    halo.addColorStop(0.55, 'rgba(255, 95, 174, 0.07)');
    halo.addColorStop(1, 'rgba(255, 95, 174, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 90, CFG.W, 380);
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.abs(Math.sin(t * 0.8)) * 0.08;
    ctx.strokeStyle = '#ff5fae';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(CFG.W / 2, 270, 265, 132, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#5ad2ff';
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.ellipse(CFG.W / 2, 270, 300, 154, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // title logo — the only focus of the presentation screen
    text(ctx, 'GALERÍAS MALL', CFG.W / 2, 152, 16, UI.cyan, {
      align: 'center', outlineW: 4, spacing: 6, alpha: 0.95,
    });
    text(ctx, 'YOMVI', CFG.W / 2, 300, 106, UI.goldHot, {
      align: 'center', outlineW: 14, outline: '#2b0c1c', spacing: 6,
      shadow: '#b3123f', shadowX: 8, shadowY: 10, glow: '#ff5fae', glowSize: 38,
    });
    text(ctx, 'ADVENTURES', CFG.W / 2, 352, 36, UI.white, {
      align: 'center', outlineW: 8, outline: '#2b0c1c', spacing: 8,
      shadow: '#e01e5a', shadowX: 4, shadowY: 5,
    });
    text(ctx, 'MARACAIBO · VENEZUELA · 1991', CFG.W / 2, 382, 11, UI.gold, {
      align: 'center', outlineW: 3, spacing: 3.5, font: FONT_MONO,
    });
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = UI.gold;
    ctx.fillRect(CFG.W / 2 - 120, 398, 240, 1);
    ctx.restore();

    // start prompt
    const blink = Math.sin(t * 4) > -0.1;
    text(ctx, 'PRESS ENTER / Z TO START', CFG.W / 2, 458, 22, blink ? UI.white : UI.gold, {
      align: 'center', outlineW: 6, spacing: 2.5,
      alpha: blink ? 1 : 0.55,
      glow: blink ? 'rgba(255, 209, 102, 0.5)' : null, glowSize: 14,
    });
    text(ctx, '1 JUGADOR    ·    FREE PLAY', CFG.W / 2, 484, 10, UI.green, {
      align: 'center', outlineW: 3, spacing: 2.5, font: FONT_MONO,
    });
    text(ctx, 'PULSA 1 · 2 · 3 PARA SALTAR DE STAGE · DEBUG', CFG.W / 2, 510, 8, '#7c6e99', {
      align: 'center', outlineW: 2, spacing: 1, font: FONT_MONO, alpha: 0.85,
    });

    // insert coin (arcade cabinet corner)
    const blink2 = Math.sin(t * 5) > 0;
    text(ctx, blink2 ? 'INSERT COIN' : 'FREE PLAY', CFG.W - 20, 26, 13, blink2 ? UI.goldHot : UI.green, {
      align: 'right', outlineW: 3, spacing: 2, font: FONT_MONO,
    });
    drawCoinIcon(ctx, CFG.W - 26, 48, 7);
    ctx.restore();
  },

  /* ==========================================================
     HIDDEN STAGE SELECT (title → type AHPUCCA)
     ========================================================== */
  stageSelect(ctx, g) {
    const t = g.time;
    const cards = [
      {
        title: 'STAGE 1',
        name: 'GALERÍAS MALL',
        sub: 'MARACAIBO · VENEZUELA · 1991',
        boss: 'JEFE: ARTHAS / JORGE SALINAS',
        color: UI.gold,
        glow: 'rgba(255, 209, 102, 0.55)',
        zones: ['PASILLO', 'ARCADE', 'PISTA HIELO'],
      },
      {
        title: 'STAGE 2',
        name: 'HOSPITAL GENERAL',
        sub: 'RECEPCIÓN → HABITACIÓN 302',
        boss: 'JEFE: CRYPTOCINO',
        color: UI.cyan,
        glow: 'rgba(90, 210, 255, 0.55)',
        zones: ['RECEPCIÓN', 'PASILLO', 'HAB. 302'],
      },
      {
        title: 'STAGE 3',
        name: 'CALLE GALERÍAS',
        sub: 'PUESTOS DE COMIDA → BURGER ROOM',
        boss: 'JEFE: GAYTELOS',
        color: '#ff5fae',
        glow: 'rgba(255, 95, 174, 0.55)',
        zones: ['CALLE', 'CALLEJÓN', 'BURGER'],
      },
    ];

    const grad = ctx.createLinearGradient(0, 0, 0, CFG.H);
    grad.addColorStop(0, '#0b0616');
    grad.addColorStop(0.55, '#120a22');
    grad.addColorStop(1, '#06030d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // CRT scanlines
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#000000';
    for (let y = 0; y < CFG.H; y += 4) ctx.fillRect(0, y, CFG.W, 2);
    ctx.restore();

    // neon grid floor
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ff5fae';
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const y = 390 + i * 18;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CFG.W, y); ctx.stroke();
    }
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(CFG.W / 2 + i * 24, 390);
      ctx.lineTo(CFG.W / 2 + i * 120, CFG.H);
      ctx.stroke();
    }
    ctx.restore();

    text(ctx, 'STAGE SELECT', CFG.W / 2, 78, 46, UI.goldHot, {
      align: 'center', outlineW: 9, outline: '#2b0c1c', spacing: 5,
      shadow: '#b3123f', shadowX: 5, shadowY: 6,
      glow: 'rgba(255, 95, 174, 0.6)', glowSize: 22,
    });
    text(ctx, 'MENÚ OCULTO · ACCESO CONCEDIDO', CFG.W / 2, 104, 10, UI.cyan, {
      align: 'center', outlineW: 3, spacing: 3.5, font: FONT_MONO,
    });

    const cardW = 280, cardH = 232, gap = 18;
    const startX = (CFG.W - cardW * 3 - gap * 2) / 2;
    const cardY = 150;
    const zoneAccents = ['#ff5fae', '#8fe6ff', '#ffd166'];

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const selected = g.stageSelectIndex === i;
      const y = cardY + (selected ? Math.sin(t * 4) * 3 : 0);

      ctx.save();
      if (selected) {
        ctx.shadowColor = card.glow;
        ctx.shadowBlur = 26;
      }
      const cg = ctx.createLinearGradient(x, y, x, y + cardH);
      cg.addColorStop(0, selected ? 'rgba(38, 24, 58, 0.98)' : 'rgba(20, 14, 32, 0.92)');
      cg.addColorStop(1, '#0a0714');
      ctx.fillStyle = cg;
      roundRectPath(ctx, x, y, cardW, cardH, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = selected ? card.color : 'rgba(120, 100, 150, 0.45)';
      ctx.lineWidth = selected ? 3 : 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = selected ? 1 : 0.45;
      ctx.fillStyle = card.color;
      ctx.fillRect(x + 14, y + 12, cardW - 28, 3);
      ctx.restore();

      text(ctx, card.title, x + cardW / 2, y + 52, 25, selected ? card.color : UI.dim, {
        align: 'center', outlineW: 5, spacing: 3,
        alpha: selected ? 1 : 0.75,
        glow: selected ? card.glow : null, glowSize: 12,
      });
      text(ctx, card.name, x + cardW / 2, y + 84, 15.5, selected ? UI.white : '#b9a8d0', {
        align: 'center', outlineW: 4, spacing: 1, alpha: selected ? 1 : 0.8,
      });
      text(ctx, card.sub, x + cardW / 2, y + 105, 7.5, selected ? UI.cyan : UI.dim, {
        align: 'center', outlineW: 2, spacing: 1.2, font: FONT_MONO, alpha: selected ? 1 : 0.7,
      });

      const zw = (cardW - 60 - (card.zones.length - 1) * 8) / card.zones.length;
      let zx = x + 30;
      ctx.save();
      for (let k = 0; k < card.zones.length; k++) {
        ctx.globalAlpha = (selected ? 0.95 : 0.35) * (k === 0 ? 1 : 0.7);
        ctx.fillStyle = k === 0 ? card.color : zoneAccents[i % zoneAccents.length];
        ctx.fillRect(zx, y + 122, zw, 5);
        text(ctx, card.zones[k], zx, y + 143, 6.5, selected ? '#d8cdf0' : '#7c6e99', {
          font: FONT_MONO, outlineW: 2, spacing: 0.2, alpha: selected ? 0.95 : 0.6,
        });
        zx += zw + 8;
      }
      ctx.restore();

      text(ctx, card.boss, x + cardW / 2, y + 186, 8.5, selected ? UI.gold : '#8a7aa8', {
        align: 'center', outlineW: 3, spacing: 1, font: FONT_MONO, alpha: selected ? 1 : 0.7,
      });

      if (selected) {
        text(ctx, '▶', x + 16, y + 52, 15, card.color, {
          align: 'left', outlineW: 3, glow: card.glow, glowSize: 10,
        });
        text(ctx, '◀', x + cardW - 16, y + 52, 15, card.color, {
          align: 'right', outlineW: 3, glow: card.glow, glowSize: 10,
        });
      }
    });

    const blink = Math.sin(t * 5) > -0.2;
    text(ctx, '← → / ↑ ↓  ELEGIR', CFG.W / 2 - 118, 446, 11, UI.white, {
      align: 'center', outlineW: 3, spacing: 2, font: FONT_MONO, alpha: blink ? 1 : 0.7,
    });
    text(ctx, 'ENTER / Z  CONFIRMAR', CFG.W / 2 + 96, 446, 11, UI.green, {
      align: 'center', outlineW: 3, spacing: 2, font: FONT_MONO, alpha: blink ? 1 : 0.7,
    });
    text(ctx, 'ESC / P  VOLVER AL TÍTULO', CFG.W / 2, 472, 8, UI.dim, {
      align: 'center', outlineW: 2, spacing: 1.6, font: FONT_MONO,
    });

    const hint = g.stageSelectIndex === 2
      ? 'EMPIEZAS DIRECTO EN LA CALLE · CALLEJÓN · BURGER ROOM'
      : g.stageSelectIndex === 1
        ? 'EMPIEZAS DIRECTAMENTE EN EL HOSPITAL GENERAL'
        : 'AL VENCER A ARTHAS Y CRYPTOCINO SIGUEN LOS STAGES 2 Y 3';
    text(ctx, hint, CFG.W / 2, 505, 8, '#7c6e99', {
      align: 'center', outlineW: 2, spacing: 1.2, font: FONT_MONO, alpha: 0.9,
    });
  },

  /* ==========================================================
     DEMO / CONTROLS BRIEFING (title → level)
     ========================================================== */
  briefing(ctx, g) {
    const t = g.time;
    const elapsed = g.briefingMax - g.briefingTime;
    const alpha = clamp(elapsed / 0.35, 0, 1);
    const progress = clamp(1 - g.briefingTime / g.briefingMax, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // DEMO badge
    const bx = CFG.W / 2 - 66, by = 26;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255, 59, 92, 0.16)';
    roundRectPath(ctx, bx, by, 132, 28, 3);
    ctx.fill();
    ctx.strokeStyle = UI.red;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    text(ctx, 'DEMO', CFG.W / 2, by + 20, 16, UI.red, {
      align: 'center', outlineW: 3, spacing: 6, alpha,
    });
    text(ctx, 'PROTOTIPO JUGABLE · FREE PLAY', CFG.W / 2, 72, 9, UI.dim, {
      align: 'center', outlineW: 2, spacing: 2.2, font: FONT_MONO, alpha,
    });

    text(ctx, 'YOMVI ADVENTURES', CFG.W / 2, 116, 27, UI.goldHot, {
      align: 'center', outlineW: 5, spacing: 2.5, alpha,
      shadow: '#b3123f', shadowX: 2, shadowY: 3,
    });
    text(ctx, 'GALERÍAS MALL · MARACAIBO 1991', CFG.W / 2, 137, 9, UI.cyan, {
      align: 'center', outlineW: 2, spacing: 2.5, font: FONT_MONO, alpha,
    });

    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = UI.gold;
    ctx.fillRect(CFG.W / 2 - 130, 154, 260, 1);
    ctx.restore();

    text(ctx, 'CONTROLES', CFG.W / 2, 180, 20, UI.white, {
      align: 'center', outlineW: 4, spacing: 6, alpha,
    });

    const rowsL = g.touchMode ? [
      ['MOVER', 'JOYSTICK IZQUIERDO'],
      ['GOLPEAR', 'BOTÓN GOLPE (COMBO x3)'],
      ['SALTAR', 'BOTÓN SALTO (PATADA AÉREA)'],
      ['ESPECIAL', 'BOTÓN ESP. (GIRO · -12 HP)'],
      ['DASH', 'DOBLE FLICK ← →'],
    ] : [
      ['MOVER', 'WASD / FLECHAS'],
      ['GOLPEAR', 'Z / J  (COMBO x3)'],
      ['SALTAR', 'X / K  (PATADA AÉREA)'],
      ['ESPECIAL', 'C / L  (GIRO · -12 HP)'],
      ['DASH', 'DOBLE TOQUE ← →'],
    ];
    const rowsR = g.touchMode ? [
      ['AGARRE', 'GOLPE JUNTO A ENEMIGO'],
      ['LANZAR', 'SALTO MIENTRAS AGARRA'],
      ['PAUSA', 'BOTÓN II'],
      ['SONIDO', 'VOLUMEN DEL DISPOSITIVO'],
      ['CONSEJO', 'USA EL GIRO SI TE RODEAN'],
    ] : [
      ['AGARRE', 'Z JUNTO A ENEMIGO ATURDIDO'],
      ['LANZAR', 'X / K MIENTRAS AGARRA'],
      ['PAUSA', 'P / ESC'],
      ['SONIDO', 'M'],
      ['CONSEJO', 'USA EL GIRO SI TE RODEAN'],
    ];

    rowsL.forEach((row, i) => {
      const y = 215 + i * 25;
      text(ctx, row[0], 156, y, 9.5, UI.gold, {
        outlineW: 2, font: FONT_MONO, spacing: 0.8, alpha,
      });
      text(ctx, row[1], 286, y, 9.5, '#e4dcf2', {
        outlineW: 2, font: FONT_MONO, spacing: 0.4, alpha,
      });
    });
    rowsR.forEach((row, i) => {
      const y = 215 + i * 25;
      text(ctx, row[0], 516, y, 9.5, UI.gold, {
        outlineW: 2, font: FONT_MONO, spacing: 0.8, alpha,
      });
      text(ctx, row[1], 630, y, 9.5, '#e4dcf2', {
        outlineW: 2, font: FONT_MONO, spacing: 0.4, alpha,
      });
    });

    // objective panel
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    roundRectPath(ctx, 172, 348, 616, 98, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    text(ctx, 'OBJETIVO PRINCIPAL', CFG.W / 2, 368, 10, UI.cyan, {
      align: 'center', outlineW: 2, font: FONT_MONO, spacing: 3, alpha,
    });
    text(ctx, 'Yomvi debe vencer a sus', CFG.W / 2, 394, 17, '#efe9ff', {
      align: 'center', outlineW: 4, spacing: 1, alpha,
    });
    text(ctx, 'ENEMIGOS CLOAQUÍSTICOS', CFG.W / 2, 421, 23, UI.goldHot, {
      align: 'center', outlineW: 5, spacing: 1.5, alpha,
      shadow: '#8d0e31', shadowX: 2, shadowY: 3,
    });
    text(ctx, 'y llegar hasta Arthas en el Arcade.', CFG.W / 2, 439, 9.5, UI.dim, {
      align: 'center', outlineW: 2, font: FONT_MONO, spacing: 0.5, alpha,
    });

    // progress / transition
    text(ctx, 'INICIANDO NIVEL 1 · PASILLO CENTRAL', CFG.W / 2, 472, 10, UI.gold, {
      align: 'center', outlineW: 2, font: FONT_MONO, spacing: 1.5, alpha,
    });
    const barX = 300, barY = 484, barW = 360, barH = 8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#1a1026';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#ff5fae');
    grad.addColorStop(0.6, '#ffd166');
    grad.addColorStop(1, '#5ad2ff');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);
    ctx.restore();

    const dots = '.'.repeat(1 + (Math.floor(t * 3) % 3));
    text(ctx, 'PREPÁRATE' + dots, CFG.W / 2, 512, 9, UI.cyan, {
      align: 'center', outlineW: 2, font: FONT_MONO, spacing: 2, alpha: alpha * 0.85,
    });
    text(ctx, g.touchMode ? 'TOCA PARA INICIAR YA' : 'PULSA ENTER PARA INICIAR YA', CFG.W / 2, 530, 8, '#6f6288', {
      align: 'center', outlineW: 2, font: FONT_MONO, spacing: 0.6, alpha: alpha * 0.8,
    });
  },

  /* ==========================================================
     POST-BOSS BLACK TEASER (before the final score)
     ========================================================== */
  teaser(ctx, g) {
    const t = g.time;
    const elapsed = g.teaserMax - g.teaserTime;
    const fadeIn = clamp(elapsed / 1.2, 0, 1);
    const fadeOut = clamp(g.teaserTime / 0.8, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    text(ctx, 'PRÓXIMAMENTE', CFG.W / 2, 202, 10, '#6f8fa8', {
      align: 'center', outlineW: 3, spacing: 6, font: FONT_MONO, alpha: alpha * 0.9,
    });

    const { name, title, glow } = g.level.teaser;
    text(ctx, name + ' REGRESARA EN', CFG.W / 2, 270, 27, '#efe9ff', {
      align: 'center', outlineW: 5, outline: '#0b0712', spacing: 2.5,
      alpha, glow, glowSize: 12,
    });
    text(ctx, 'AMONGOLICUS ENDGAME', CFG.W / 2, 328, 42, UI.goldHot, {
      align: 'center', outlineW: 8, outline: '#1a0a12', spacing: 2.5,
      alpha, glow: 'rgba(255, 95, 174, 0.55)', glowSize: 24,
      shadow: '#8d0e31', shadowX: 4, shadowY: 5,
    });

    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = '#ff5fae';
    ctx.fillRect(CFG.W / 2 - 150, 358, 300, 1);
    ctx.fillStyle = '#5ad2ff';
    ctx.fillRect(CFG.W / 2 - 70, 358, 140, 1);
    ctx.restore();

    const dots = '.'.repeat(1 + (Math.floor(t * 2) % 3));
    text(ctx, dots, CFG.W / 2, 402, 26, '#5ad2ff', {
      align: 'center', outlineW: 3, spacing: 8, alpha: alpha * 0.8,
    });

    // Keep the player waiting the full teaser: no score, no HUD, no prompts.
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    text(ctx, title + ' HA CAÍDO', CFG.W / 2, 500, 8, '#8a7aa8', {
      align: 'center', outlineW: 2, font: FONT_MONO, spacing: 3,
    });
    ctx.restore();
  },

  /* ==========================================================
     CONTINUE / GAME OVER SCREEN
     ========================================================== */
  continueScreen(ctx, g) {
    const t = g.time;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 3, 10, 0.8)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    const zone = g.player ? g.stage.zoneAt(g.player.x) : g.stage.zones[0];
    const zi = g.stage.zones.indexOf(zone);
    const bg = g.stage.canvases[zi] || g.stage.canvases[0];
    ctx.drawImage(bg, -80 + Math.sin(t * 0.2) * 20, 0);
    ctx.fillStyle = 'rgba(8, 3, 16, 0.82)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // red scan glow
    ctx.fillStyle = 'rgba(255, 30, 70, 0.06)';
    for (let y = 0; y < CFG.H; y += 6) ctx.fillRect(0, y, CFG.W, 2);

    text(ctx, 'GAME OVER', CFG.W / 2, 120, 54, UI.red, {
      align: 'center', outlineW: 10, outline: '#200710', spacing: 6,
      shadow: '#48041a', shadowX: 5, shadowY: 6, glow: '#ff2e63', glowSize: 26,
    });

    text(ctx, 'CONTINUE?', CFG.W / 2, 190, 26, UI.goldHot, {
      align: 'center', outlineW: 6, spacing: 4,
    });

    const secs = Math.ceil(g.continueTime);
    const pulse = 1 + Math.abs(Math.sin(t * 3.2)) * 0.14;
    ctx.save();
    ctx.translate(CFG.W / 2, 300);
    ctx.scale(pulse, pulse);
    text(ctx, String(secs), 0, 0, 112, secs <= 3 ? UI.red : UI.goldHot, {
      align: 'center', outlineW: 12, outline: '#220a12', spacing: 2,
      shadow: '#a00f31', shadowX: 6, shadowY: 7, glow: secs <= 3 ? '#ff2e63' : '#ffb347', glowSize: 34,
    });
    ctx.restore();

    // coin slot visual
    const slotY = 358;
    ctx.fillStyle = '#1a1026';
    roundRectPath(ctx, CFG.W / 2 - 150, slotY, 300, 44, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawCoinIcon(ctx, CFG.W / 2 - 118, slotY + 22, 12);
    const blink = Math.sin(t * 6) > 0;
    text(ctx, g.touchMode ? 'TOCA PARA INSERTAR MONEDA' : 'PRESS ENTER TO INSERT COIN', CFG.W / 2 + 14, slotY + 19, 12, blink ? UI.goldHot : UI.green, {
      align: 'center', outlineW: 3, spacing: 1, font: FONT_MONO,
    });
    text(ctx, 'CONTINÚA CON ENERGÍA COMPLETA', CFG.W / 2 + 14, slotY + 34, 8, UI.dim, {
      align: 'center', outlineW: 2, font: FONT_MONO,
    });

    text(ctx, 'PUNTUACIÓN', CFG.W / 2 - 120, 440, 10, UI.dim, {
      align: 'center', font: FONT_MONO, outlineW: 2, spacing: 1,
    });
    text(ctx, padScore(g.score), CFG.W / 2 - 120, 462, 20, UI.white, {
      align: 'center', font: FONT_MONO, outlineW: 3,
    });
    text(ctx, 'RÉCORD', CFG.W / 2 + 120, 440, 10, UI.dim, {
      align: 'center', font: FONT_MONO, outlineW: 2, spacing: 1,
    });
    text(ctx, padScore(g.hiScore), CFG.W / 2 + 120, 462, 20, UI.goldHot, {
      align: 'center', font: FONT_MONO, outlineW: 3,
    });

    text(ctx, 'SIN CRÉDITOS → TÍTULO', CFG.W / 2, 505, 10, '#8a7aa8', {
      align: 'center', font: FONT_MONO, outlineW: 2, spacing: 1,
    });
    ctx.restore();
  },

  /* ==========================================================
     VICTORY SCREEN
     ========================================================== */
  victory(ctx, g) {
    const t = g.time;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 3, 12, 0.78)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    const grad = ctx.createRadialGradient(CFG.W / 2, 260, 40, CFG.W / 2, 260, 640);
    grad.addColorStop(0, 'rgba(255, 209, 102, 0.20)');
    grad.addColorStop(0.6, 'rgba(255, 95, 174, 0.08)');
    grad.addColorStop(1, 'rgba(10, 4, 20, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // confetti
    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + t * (28 + i % 7)) % CFG.W;
      const y = ((i * 71 + t * (40 + i % 5)) % (CFG.H + 100)) - 50;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 2 + i);
      ctx.fillStyle = ['#ffd166', '#ff5fae', '#5ad2ff', '#7dffc4', '#ffffff'][i % 5];
      ctx.globalAlpha = 0.7;
      ctx.fillRect(-3, -5, 6, 10);
      ctx.restore();
    }

    const isFinal = !g.level.nextStage;
    const finalBossSprite = g[g.level.bossSprite];
    const finalSubtitle = isFinal
      ? 'JUEGO COMPLETO · GAYTELOS DERROTADO · 3 STAGES A SALVO'
      : g.stageId === 2
        ? 'STAGE 2 CLEAR · CRYPTOCINO DERROTADO · HOSPITAL A SALVO'
        : 'STAGE 1 CLEAR · ARTHAS DERROTADO · GALERÍAS MALL A SALVO';

    text(ctx, isFinal ? '¡JUEGO COMPLETO!' : '¡VICTORIA!', CFG.W / 2, 132, isFinal ? 54 : 66, UI.goldHot, {
      align: 'center', outlineW: 12, outline: '#34101a', spacing: 4,
      shadow: '#c11d4c', shadowX: 6, shadowY: 8, glow: '#ffb347', glowSize: 30,
    });
    text(ctx, finalSubtitle, CFG.W / 2, 172, 11, UI.green, {
      align: 'center', outlineW: 3, spacing: 1.4, font: FONT_MONO,
    });

    // hero celebration
    const bob = Math.sin(t * 3) * 4;
    drawShadow(ctx, CFG.W / 2, 492, 132, 0, 1);
    drawSprite(ctx, g.heroSprite, 'idle', t, CFG.W / 2, 492 + bob, {
      h: 176, flip: false, glow: 'rgba(255, 209, 102, 0.35)', glowSize: 30,
    });
    // boss lying
    drawSprite(ctx, finalBossSprite, 'hurt', 0, CFG.W / 2 + 236, 500, {
      h: 142, flip: false, sy: 0.4, sx: 1.2, tilt: 0.15, alpha: 0.9,
    });
    drawShadow(ctx, CFG.W / 2 + 236, 500, 115, 0, 0.8);

    // stats
    ctx.fillStyle = 'rgba(10, 6, 18, 0.86)';
    roundRectPath(ctx, 300, 214, 360, 92, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'PUNTUACIÓN FINAL', CFG.W / 2, 236, 10, UI.dim, {
      align: 'center', font: FONT_MONO, outlineW: 2, spacing: 1.5,
    });
    text(ctx, padScore(g.score), CFG.W / 2, 266, 30, UI.white, {
      align: 'center', font: FONT_MONO, outlineW: 4, spacing: 2,
    });
    const vTime = Math.floor((g.stageTime || 0) / 60) + ':' + String(Math.floor((g.stageTime || 0) % 60)).padStart(2, '0');
    text(ctx, 'NIVEL ' + g.player.level + ' · GOLPES ' + g.player.stats.hits + ' · DERRIBOS ' + g.kills + ' · TIEMPO ' + vTime, CFG.W / 2, 290, 8.5, UI.gold, {
      align: 'center', font: FONT_MONO, outlineW: 2, spacing: 0.2,
    });
    text(ctx, 'RÉCORD ' + padScore(g.hiScore) + ' · GRACIAS POR JUGAR', CFG.W / 2, 303, 8, UI.dim, {
      align: 'center', font: FONT_MONO, outlineW: 2, spacing: 0.5,
    });

    // credits panel
    ctx.fillStyle = 'rgba(7, 8, 18, 0.84)';
    roundRectPath(ctx, 40, 318, 252, 172, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, 'CRÉDITOS', 166, 340, 10, UI.goldHot, {
      align: 'center', outlineW: 3, spacing: 3, font: FONT_MONO,
    });
    const creditLines = isFinal ? [
      'GAME DESIGN · YOMVI TEAM',
      'STAGE 1 · GALERÍAS MALL',
      'STAGE 2 · HOSPITAL GENERAL',
      'STAGE 3 · BURGER ROOM',
      'CHIPTUNE · WEB AUDIO 16-BIT',
      'JEFE3.png · GAYTELOS',
      'GRACIAS POR JUGAR',
    ] : [
      'GAME DESIGN · YOMVI TEAM',
      'PIXEL ART · GALERÍAS MALL',
      'CHIPTUNE · WEB AUDIO 16-BIT',
      'SPRITES · PERSONAJE.png',
      'JEFE.png · JEFE2.png',
      'HOMENAJE · ARCADE 1991',
      'GRACIAS POR JUGAR',
    ];
    creditLines.forEach((line, i) => {
      text(ctx, line, 166, 359 + i * 17, 7.5, i === 6 ? UI.green : '#c9c0dd', {
        align: 'center', outlineW: 2, font: FONT_MONO, spacing: 0.2,
      });
    });

    const blink = Math.sin(t * 4) > -0.1;
    text(ctx, g.touchMode ? 'TOCA PARA VOLVER AL TÍTULO' : 'PRESS ENTER PARA VOLVER AL TÍTULO', CFG.W / 2, 522, 16, blink ? UI.white : UI.gold, {
      align: 'center', outlineW: 5, spacing: 2, alpha: blink ? 1 : 0.5,
    });
    ctx.restore();
  },

  pause(ctx, g) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 3, 10, 0.72)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    text(ctx, 'PAUSA', CFG.W / 2, 240, 64, UI.goldHot, {
      align: 'center', outlineW: 10, outline: '#22101a', spacing: 8,
      shadow: '#a00f31', shadowX: 5, shadowY: 6,
    });
    text(ctx, g.touchMode ? 'TOCA LA PANTALLA PARA CONTINUAR' : 'P / ESC PARA CONTINUAR', CFG.W / 2, 290, 14, UI.white, {
      align: 'center', outlineW: 3, spacing: 2, font: FONT_MONO,
    });
    text(ctx, 'M: SONIDO ' + (g.muted ? 'OFF' : 'ON'), CFG.W / 2, 322, 11, UI.cyan, {
      align: 'center', outlineW: 2, spacing: 1, font: FONT_MONO,
    });
    ctx.restore();
  },
};

export { HUD, UI };
