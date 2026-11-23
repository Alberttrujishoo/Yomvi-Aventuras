import { text } from '../engine/canvas.js';
import { TAU, clamp, rand } from '../engine/math.js';

class Shockwave {
  constructor(game, x, y, maxR, dmg, color) {
    this.game = game;
    this.x = x; this.y = y;
    this.maxR = maxR;
    this.dmg = dmg;
    this.color = color;
    this.life = 0.55;
    this.maxLife = 0.55;
    this.r = 10;
    this.done = false;
    this.hitPlayer = false;
    this.timer = 0;
  }

  update(dt) {
    this.life -= dt;
    this.timer += dt;
    const t = 1 - clamp(this.life / this.maxLife, 0, 1);
    this.r = 10 + this.maxR * Math.pow(t, 0.55);

    const p = this.game.player;
    if (!this.hitPlayer && p.alive) {
      const d = Math.hypot(p.x - this.x, (p.y - this.y) * 1.7);
      if (Math.abs(d - this.r) < 34 && p.z < 46) {
        p.takeHit(this.dmg, this.x, { knock: 280, heavy: true });
        this.hitPlayer = true;
      }
    }
    if (this.life <= 0) this.done = true;
  }

  draw(ctx) {
    const sx = this.x - this.game.camera.x;
    const t = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.7 * t;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 6 * t + 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(sx, this.y, this.r, this.r * 0.4, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.22 * t;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(sx, this.y, this.r * 0.94, this.r * 0.36, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   FLOATING TEXT + SLASHES
   ------------------------------------------------------------ */
class FloatText {
  constructor(text, x, y, color) {
    this.text = text;
    this.x = x; this.y = y;
    this.color = color || '#fff';
    this.life = 0.9;
    this.maxLife = 0.9;
  }
  update(dt) {
    this.life -= dt;
    this.y -= 44 * dt;
    return this.life > 0;
  }
  draw(ctx, camX) {
    const t = clamp(this.life / this.maxLife, 0, 1);
    text(ctx, this.text, this.x - camX, this.y, 14, this.color, {
      align: 'center', outlineW: 4, alpha: t, spacing: 0.5,
    });
  }
}

class Slash {
  constructor(x, y, z, dir, heavy) {
    this.x = x; this.y = y; this.z = z;
    this.dir = dir;
    this.heavy = heavy;
    this.life = 0.14;
    this.maxLife = 0.14;
    this.spin = rand(-0.2, 0.2);
  }
  update(dt) {
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx, camX) {
    const t = clamp(this.life / this.maxLife, 0, 1);
    const sx = this.x - camX;
    const sy = this.y - this.z;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(this.dir, 1);
    ctx.rotate(-0.5 + this.spin);
    ctx.globalAlpha = t;
    ctx.strokeStyle = this.heavy ? '#ffe066' : '#ffffff';
    ctx.lineWidth = this.heavy ? 8 : 5;
    ctx.shadowColor = this.heavy ? '#ffb347' : '#9fe8ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, this.heavy ? 50 : 36, -1.9, -0.3);
    ctx.stroke();
    ctx.globalAlpha = t * 0.5;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.heavy ? 58 : 42, -1.8, -0.5);
    ctx.stroke();
    ctx.restore();
  }
}

export { FloatText, Shockwave, Slash };
