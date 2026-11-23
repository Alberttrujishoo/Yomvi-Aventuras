import { TAU, clamp, rand, sign } from '../engine/math.js';
import { drawShadow } from '../engine/canvas.js';
import { Sound } from '../media/audio.js';

/* ============================================================
   ROXYFOXY — hamburger shotgun / burger rain
   Hidden mode: every attack becomes a burger blast and the
   special button calls a rain of burgers from above.
   ============================================================ */

function drawBurger(ctx, x, y, rot = 0, scale = 1, glow = '#ffb347') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;

  // top bun
  ctx.fillStyle = '#f0b769';
  ctx.beginPath();
  ctx.ellipse(0, -5, 13, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e2a24e';
  ctx.fillRect(-13, -5, 26, 3);

  // sesame seeds
  ctx.fillStyle = '#fff3d6';
  ctx.fillRect(-7, -8, 3, 2);
  ctx.fillRect(2, -9, 3, 2);
  ctx.fillRect(7, -6, 2, 2);

  // lettuce, patty, cheese, bottom bun
  ctx.fillStyle = '#5fae3e';
  ctx.fillRect(-13, -2, 26, 3);
  ctx.fillStyle = '#8a4a26';
  ctx.fillRect(-12, 1, 24, 3);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(-12, 4, 24, 2);
  ctx.fillStyle = '#d38f3f';
  ctx.fillRect(-11, 6, 22, 4);

  ctx.restore();
}

class RoxyBurgerShot {
  constructor(game, x, y, dir, dmg, owner) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.z = 64;
    this.dir = dir;
    this.vx = dir * 760;
    this.dmg = dmg;
    this.owner = owner;
    this.rot = rand(0, TAU);
    this.life = 1.25;
    this.dead = false;
    this.trail = [];
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.rot += dt * 15;

    if (this.trail.length < 1 || Math.abs(this.trail[this.trail.length - 1].x - this.x) > 14) {
      this.trail.push({ x: this.x, y: this.y, z: this.z, life: 0.22 });
    }
    for (const t of this.trail) t.life -= dt;
    this.trail = this.trail.filter(t => t.life > 0);

    const g = this.game;
    const zDiff = (target) => Math.abs(((target.z || 0) + 45) - this.z);

    for (const e of g.enemies.slice()) {
      if (!e.alive || e.state === 'dying') continue;
      if (Math.abs(e.y - this.y) < 32 && (e.x - this.x) * this.dir > -20 && Math.abs(e.x - this.x) < 34 && zDiff(e) < 76) {
        e.takeHit(this.dmg, this.dir, { knock: 240, heavy: false, source: this.owner });
        this.owner.registerHit(this.dmg, false);
        this.impact();
        this.dead = true;
        return;
      }
    }

    const boss = g.boss;
    if (boss && boss.alive && boss.active &&
        Math.abs(boss.y - this.y) < 38 && (boss.x - this.x) * this.dir > -20 && Math.abs(boss.x - this.x) < 42 && zDiff(boss) < 80) {
      boss.takeHit(this.dmg, this.dir, { knock: 220, heavy: false });
      this.owner.registerHit(this.dmg, false);
      this.impact();
      this.dead = true;
      return;
    }

    for (const prop of g.stage.props) {
      if (prop.dead) continue;
      if (Math.abs(prop.y - this.y) < 28 && Math.abs(prop.x - this.x) < 34) {
        g.stage.hitProp(prop, 1, g);
        this.impact();
        this.dead = true;
        return;
      }
    }

    if (this.life <= 0 || this.x < g.camera.x - 180 || this.x > g.camera.x + 960 + 180) {
      this.dead = true;
    }
  }

  impact() {
    const g = this.game;
    g.spawnSparks(this.x, this.y, this.z, 9, 'gold');
    g.spawnBurst(this.x, this.y, 8, '#f2c14e');
    g.shake(4, 0.1);
    g.hitstop(0.02);
    Sound.sfx('splat');
  }

  draw(ctx) {
    const g = this.game;
    const sx = this.x - g.camera.x;

    // trail
    for (const t of this.trail) {
      const a = clamp(t.life / 0.22, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.4;
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(t.x - g.camera.x - 2, t.y - t.z - 2, 4, 4);
      ctx.restore();
    }

    drawShadow(ctx, sx, this.y, 24, this.z, 0.4);
    drawBurger(ctx, sx, this.y - this.z, this.rot, 1.05, '#ffb347');
  }
}

class RoxyFallingBurger {
  constructor(game, x, y, delay, dmg, owner) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.z = 430 + rand(0, 90);
    this.vy = 520 + rand(0, 90);
    this.delay = delay;
    this.dmg = dmg;
    this.owner = owner;
    this.rot = rand(0, TAU);
    this.scale = 1 + rand(0, 0.25);
    this.dead = false;
  }

  update(dt) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    this.z -= this.vy * dt;
    this.rot += dt * 9;
    if (this.z <= 0) {
      this.z = 0;
      this.impact();
      this.dead = true;
    }
  }

  impact() {
    const g = this.game;
    const p = g.player;
    let didHit = false;

    for (const e of g.enemies.slice()) {
      if (!e.alive || e.state === 'dying') continue;
      if (Math.abs(e.x - this.x) < 54 && Math.abs(e.y - this.y) < 42) {
        e.takeHit(this.dmg, sign(e.x - this.x) || 1, { knock: 280, heavy: true, source: this.owner });
        if (p) p.registerHit(this.dmg, true);
        didHit = true;
      }
    }

    const boss = g.boss;
    if (boss && boss.alive && boss.active &&
        Math.abs(boss.x - this.x) < 62 && Math.abs(boss.y - this.y) < 46) {
      boss.takeHit(this.dmg, sign(boss.x - this.x) || 1, { knock: 220, heavy: false });
      if (p) p.registerHit(this.dmg, true);
      didHit = true;
    }

    for (const prop of g.stage.props) {
      if (!prop.dead && Math.abs(prop.x - this.x) < 54 && Math.abs(prop.y - this.y) < 34) {
        g.stage.hitProp(prop, 1, g);
      }
    }

    g.spawnBurst(this.x, this.y, 16, '#f2c14e');
    g.spawnDust(this.x, this.y, 8);
    g.shake(3, 0.1);
    if (didHit) {
      g.hitstop(0.025);
      Sound.sfx('splat');
    }
  }

  draw(ctx) {
    const g = this.game;
    const sx = this.x - g.camera.x;
    drawShadow(ctx, sx, this.y, 26, this.z, 0.5);
    drawBurger(ctx, sx, this.y - this.z, this.rot, this.scale, '#ff8ac4');
  }
}

export { RoxyBurgerShot, RoxyFallingBurger };
