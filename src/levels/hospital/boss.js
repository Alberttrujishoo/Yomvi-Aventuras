import { drawSprite } from '../../media/sprite-renderer.js';
import { drawShadow } from '../../engine/canvas.js';
import { CFG, TAU, chance, choice, clamp, lerp, rand, sign } from '../../engine/math.js';
import { Particle } from '../../engine/particle.js';
import { Sound } from '../../media/audio.js';

class CandleWave {
  constructor(game, x, y, z, vx, color, delay = 0) {
    this.game = game;
    this.x = x; this.y = y; this.z = z;
    this.vx = vx;
    this.color = color;
    this.delay = delay;
    this.life = 1.6;
    this.dead = false;
    this.hit = false;
    this.phase = rand(0, TAU);
    this.trail = [];
  }

  update(dt) {
    if (this.delay > 0) { this.delay -= dt; return; }
    this.life -= dt;
    this.x += this.vx * dt;
    this.z = 55 + Math.sin(this.life * 12 + this.phase) * 14;
    this.trail.push({ x: this.x, y: this.y, z: this.z, life: 0.18 });
    for (const t of this.trail) t.life -= dt;
    this.trail = this.trail.filter(t => t.life > 0);
    const p = this.game.player;
    if (!this.hit && p.alive) {
      if (Math.abs(p.x - this.x) < 28 && Math.abs(p.y - this.y) < 24 && Math.abs((p.z + 45) - this.z) < 72) {
        p.takeHit(8, this.x, { knock: 150, heavy: false });
        this.hit = true;
        this.dead = true;
      }
    }
    if (this.life <= 0 || this.x < this.game.camera.x - 140 || this.x > this.game.camera.x + CFG.W + 140) {
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.delay > 0) return;
    const sx = this.x - this.game.camera.x;
    const sy = this.y;
    ctx.save();
    // chart trail
    for (const t of this.trail) {
      const tx = t.x - this.game.camera.x;
      const ty = t.y - t.z;
      ctx.globalAlpha = t.life * 2.6;
      ctx.fillStyle = this.color;
      ctx.fillRect(tx - 1, ty - 1, 3, 3);
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.color;
    ctx.fillRect(sx - 4, sy - this.z - 13, 8, 24);
    ctx.fillStyle = this.color === '#ff5a6e' ? '#ffd0d6' : '#c9ffd8';
    ctx.fillRect(sx - 2, sy - this.z - 10, 4, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 1, sy - this.z - 19, 2, 7);
    ctx.fillRect(sx - 1, sy - this.z + 11, 2, 6);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

class LaptopProjectile {
  constructor(game, x, y, vx, vz) {
    this.game = game;
    this.x = x; this.y = y; this.z = 78;
    this.vx = vx; this.vy = 0; this.vz = vz;
    this.rot = 0;
    this.life = 3.2;
    this.dead = false;
    this.hit = false;
    this.bounces = 0;
    this.dmg = 13;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    this.vz -= 850 * dt;
    this.rot += dt * 14;
    if (this.z <= 0) {
      this.z = 0;
      this.vz = Math.abs(this.vz) * 0.35;
      this.vx *= 0.6;
      this.bounces++;
      this.game.spawnDust(this.x, this.y, 3);
      if (this.bounces > 2) this.dead = true;
    }
    const p = this.game.player;
    if (!this.hit && p.alive && Math.abs(p.x - this.x) < 30 && Math.abs(p.y - this.y) < 24 && Math.abs((p.z + 45) - this.z) < 76) {
      p.takeHit(this.dmg, this.x, { knock: 240, heavy: false });
      this.hit = true;
      this.dead = true;
    }
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const sx = this.x - this.game.camera.x;
    const sy = this.y - this.z;
    drawShadow(ctx, sx, this.y, 26, this.z, 0.45);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rot);
    ctx.shadowColor = '#67e8ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#3a3d46';
    ctx.fillRect(-15, -10, 30, 20);
    ctx.fillStyle = '#67e8ff';
    ctx.fillRect(-11, -7, 22, 13);
    ctx.fillStyle = '#0d2a35';
    ctx.fillRect(-8, -4, 7, 2);
    ctx.fillRect(-8, 0, 12, 2);
    ctx.fillStyle = '#20222a';
    ctx.fillRect(-13, 10, 26, 3);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

class Boss2 {
  constructor(game, x, y) {
    this.game = game;
    this.x = x; this.y = y; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.facing = -1;
    this.maxHp = 480;
    this.hp = this.maxHp;
    this.layerSize = 160;
    this.bossName = 'CRYPTOCINO';
    this.bossSub = '';
    this.state = 'intro';
    this.stateT = 0;
    this.animT = 0;
    this.walkT = 0;
    this.flash = 0;
    this.cooldown = 1.0;
    this.summonCd = 8;
    this.active = false;
    this.alive = true;
    this.phase = 1;
    this.enraged = false;
    this.deadT = 0;
    this.defeated = false;
    this.leapT = 0;
    this.leapDur = 0.85;
    this.leapFrom = null;
    this.leapTarget = null;
    this.laptopThrown = false;
    this.chargeHit = false;
    this.introTarget = x;
    this.lastFacing = -1;
    this.turnT = 0;
    this.landSquash = 0;
  }

  get footY() { return this.y - this.z; }

  update(dt) {
    this.stateT += dt;
    this.animT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.summonCd = Math.max(0, this.summonCd - dt);
    this.turnT = Math.max(0, this.turnT - dt);
    this.landSquash = Math.max(0, this.landSquash - dt);

    if (this.state === 'dead') {
      this.deadT += dt;
      if (this.z > 0 || this.vz > 0) {
        this.z += this.vz * dt;
        this.vz -= CFG.GRAVITY * dt;
        if (this.z <= 0) { this.z = 0; this.vz = 0; }
      }
      if (chance(0.5)) {
        this.game.spawnExplosion(this.x + rand(-70, 70), this.y + rand(-20, 20), rand(20, 120), choice(['#ff5a6e', '#5dff8f', '#ffd166', '#67e8ff']));
        this.game.flashScreen = Math.max(this.game.flashScreen, 0.22);
        Sound.sfx('enemyDie');
      }
      if (this.deadT > 3.0 && !this.defeated) {
        this.defeated = true;
        this.game.onBossDefeated();
      }
      return;
    }

    if (this.state !== 'leap') this.updateNormalPhysics(dt);

    const p = this.game.player;
    switch (this.state) {
      case 'intro':
        if (Math.abs(this.x - this.introTarget) > 6) {
          this.x += sign(this.introTarget - this.x) * 245 * dt;
          this.walkT += dt;
          this.facing = sign(p.x - this.x) || -1;
        } else {
          this.x = this.introTarget;
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = 0.9;
          this.active = true;
          this.game.onBossReady();
        }
        break;

      case 'idle':
        this.facing = sign(p.x - this.x) || this.facing;
        if (p.alive && this.cooldown <= 0) this.chooseAction();
        break;

      case 'chartWind':
        this.facing = sign(p.x - this.x) || this.facing;
        if (this.stateT > (this.enraged ? 0.28 : 0.42)) {
          this.throwChart();
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = this.enraged ? 0.55 : 0.8;
          Sound.sfx('candle');
        }
        break;

      case 'dashWind':
        if (this.stateT > (this.enraged ? 0.2 : 0.3)) {
          this.state = 'dash';
          this.stateT = 0;
          this.chargeHit = false;
          this.vx = this.facing * (this.enraged ? 960 : 840);
          Sound.sfx('throw');
          this.game.shake(4, 0.2);
        }
        break;

      case 'dash':
        this.x += this.vx * dt;
        this.facing = sign(this.vx) || this.facing;
        this.walkT += dt * 2;
        if (chance(0.8)) {
          this.game.particles.push(new Particle({
            x: this.x - this.facing * 30, y: this.y, z: rand(10, 90),
            vx: -this.facing * 50, vy: 0, vz: 25, life: 0.3,
            size: rand(4, 9), color: choice(['#ff5a6e', '#5dff8f', '#ffd166']), gravity: 0, kind: 'pixel', glow: '#5dff8f',
          }));
        }
        if (!this.chargeHit && p.alive && Math.abs(p.x - this.x) < 70 && Math.abs(p.y - this.y) < 36 && p.z < 60) {
          p.takeHit(this.enraged ? 18 : 15, this.x, { knock: 360, heavy: true });
          this.chargeHit = true;
        }
        if (this.stateT > 0.55 || this.x < this.game.minX() + 60 || this.x > this.game.maxX() - 60) {
          this.state = 'recover';
          this.stateT = 0;
          this.vx = 0;
          this.cooldown = this.enraged ? 0.45 : 0.7;
          this.game.shake(6, 0.2);
        }
        break;

      case 'spinWind':
        if (this.stateT > 0.26) {
          this.state = 'spin';
          this.stateT = 0;
          this.laptopThrown = false;
          this.spinTick = 0;
          Sound.sfx('special');
        }
        break;

      case 'spin':
        this.spinTick = (this.spinTick || 0) - dt;
        if (this.spinTick <= 0) {
          this.spinTick = 0.2;
          if (p.alive && Math.abs(p.x - this.x) < 125 && Math.abs(p.y - this.y) < 42 && p.z < 60) {
            p.takeHit(9, this.x, { knock: 240, heavy: false });
          }
          this.game.spawnSparks(this.x + rand(-50, 50), this.y, 40, 3, 'gold');
        }
        if (!this.laptopThrown && this.stateT > 0.35) {
          this.laptopThrown = true;
          this.throwLaptop();
        }
        if (this.stateT > 0.75) {
          this.game.spawnShockwave(this.x, this.y, 190, 10, '#ffd166');
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = this.enraged ? 0.45 : 0.8;
          this.game.shake(7, 0.25);
        }
        break;

      case 'laptopWind':
        this.facing = sign(p.x - this.x) || this.facing;
        if (this.stateT > 0.32) {
          this.throwLaptop();
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = 0.8;
          Sound.sfx('throw');
        }
        break;

      case 'leapWind':
        if (this.stateT > 0.4) {
          this.state = 'leap';
          this.stateT = 0;
          this.leapT = 0;
          this.leapFrom = { x: this.x, y: this.y };
          this.leapTarget = { x: clamp(p.x, this.game.minX() + 80, this.game.maxX() - 80), y: p.y };
          this.vz = 580;
          this.z = Math.max(this.z, 1);
          Sound.sfx('jump');
          this.game.shake(4, 0.2);
        }
        break;

      case 'leap': {
        this.leapT += dt;
        const t = clamp(this.leapT / this.leapDur, 0, 1);
        this.z += this.vz * dt;
        this.vz -= CFG.GRAVITY * dt;
        this.x = lerp(this.leapFrom.x, this.leapTarget.x, t);
        this.y = lerp(this.leapFrom.y, this.leapTarget.y, t);
        if (this.z <= 0) {
          this.z = 0;
          this.vz = 0;
          this.state = 'recover';
          this.stateT = 0;
          this.landSquash = 0.18;
          this.game.spawnShockwave(this.x, this.y, 320, 20, '#ff8a3d');
          this.game.shake(22, 0.65);
          this.game.flashScreen = 0.35;
          this.game.spawnDust(this.x, this.y, 28);
          Sound.sfx('slam');
          this.cooldown = this.enraged ? 0.55 : 0.9;
        }
        break;
      }

      case 'summon':
        if (this.stateT > 0.75) {
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = 0.7;
        }
        break;

      case 'roar':
        if (this.stateT > 0.9) {
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = 0.35;
        }
        break;

      case 'recover':
        if (this.stateT > 0.32) {
          this.state = 'idle';
          this.stateT = 0;
        }
        break;

      case 'hurt':
        if (this.stateT > 0.22) {
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = Math.max(this.cooldown, 0.25);
        }
        break;

      default:
        this.state = 'idle';
    }

    if (this.state !== 'intro') {
      this.x = clamp(this.x, this.game.minX() + 55, this.game.maxX() - 55);
    }
    this.y = clamp(this.y, CFG.FLOOR_TOP + 10, CFG.FLOOR_BOTTOM - 8);
    if (this.facing !== this.lastFacing) {
      this.lastFacing = this.facing;
      this.turnT = 0.13;
    }
  }

  updateNormalPhysics(dt) {
    if (this.z > 0 || this.vz > 0) {
      this.z += this.vz * dt;
      this.vz -= CFG.GRAVITY * dt;
      if (this.z <= 0) { this.z = 0; this.vz = 0; }
    }
    if (this.state !== 'dash') {
      this.x += this.vx * dt;
      this.vx *= 0.85;
    }
    this.y = clamp(this.y, CFG.FLOOR_TOP + 10, CFG.FLOOR_BOTTOM - 8);
  }

  chooseAction() {
    const p = this.game.player;
    if (!p.alive) return;
    const dist = Math.abs(p.x - this.x);
    const roll = Math.random();

    if (this.enraged && this.summonCd <= 0) {
      const foes = this.game.enemies.filter(e => e.alive).length;
      if (foes < 2) { this.startSummon(); return; }
      this.summonCd = 15;
    }

    if (this.enraged) {
      if (dist < 170) {
        if (roll < 0.28) this.startSpin();
        else if (roll < 0.52) this.startDash();
        else if (roll < 0.76) this.startChart();
        else this.startLeap();
      } else {
        if (roll < 0.3) this.startLeap();
        else if (roll < 0.52) this.startChart();
        else if (roll < 0.74) this.startDash();
        else this.startSpin();
      }
      return;
    }

    if (dist < 150) {
      if (roll < 0.52) this.startSpin();
      else if (roll < 0.8) this.startChart();
      else this.startDash();
    } else {
      if (roll < 0.4) this.startDash();
      else if (roll < 0.72) this.startChart();
      else if (roll < 0.88) this.startSpin();
      else this.startLeap();
    }
  }

  startChart() { this.state = 'chartWind'; this.stateT = 0; }
  startDash() { this.state = 'dashWind'; this.stateT = 0; }
  startSpin() { this.state = 'spinWind'; this.stateT = 0; }
  startLeap() {
    if (this.phase < 2) { this.startDash(); return; }
    this.state = 'leapWind';
    this.stateT = 0;
    this.game.ringText('¡SALTO CRYPTO!', this.x, this.y - 170, '#ff8a3d');
  }

  startSummon() {
    this.state = 'summon';
    this.stateT = 0;
    this.summonCd = 16;
    const g = this.game;
    g.spawnEnemy('orderly', g.minX() + 100, CFG.FLOOR_TOP + 30);
    g.spawnEnemy('doctor', g.maxX() - 100, CFG.FLOOR_BOTTOM - 30);
    g.ringText('¡REFUERZOS!', this.x, this.y - 170, '#ff8a3d');
    Sound.sfx('enrage');
  }

  throwChart() {
    const p = this.game.player;
    const dir = sign(p.x - this.x) || -1;
    const lanes = [-60, 0, 55, 105];
    for (let i = 0; i < lanes.length; i++) {
      const y = clamp(p.y + lanes[i], CFG.FLOOR_TOP + 8, CFG.FLOOR_BOTTOM - 8);
      this.game.projectiles.push(new CandleWave(
        this.game, this.x + dir * 34, y, 55,
        dir * (this.enraged ? 600 : 500),
        i % 2 === 0 ? '#ff5a6e' : '#5dff8f',
        i * 0.055
      ));
    }
  }

  throwLaptop() {
    const p = this.game.player;
    const dir = sign(p.x - this.x) || -1;
    this.game.projectiles.push(new LaptopProjectile(
      this.game, this.x + dir * 30, this.y, dir * (this.enraged ? 460 : 390), 220
    ));
  }

  takeHit(dmg, dir, o = {}) {
    if (!this.alive || this.state === 'dead' || this.state === 'intro') return;
    this.hp -= dmg;
    this.flash = 0.11;
    this.game.spawnSparks(this.x, this.y, this.z + 100, o.heavy ? 9 : 4, 'hit');
    this.game.addScore(o.heavy ? 45 : 15);
    Sound.sfx('bossHurt');

    if (this.hp <= 0) {
      this.die();
      return;
    }

    if (!this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enrage();
      return;
    }

    if (o.heavy && this.state !== 'dash' && this.state !== 'spin' && this.state !== 'leapWind') {
      this.state = 'hurt';
      this.stateT = 0;
      this.vx = dir * 110;
    }
  }

  enrage() {
    this.enraged = true;
    this.phase = 2;
    this.game.hitstop(0.12);
    this.game.shake(22, 0.9);
    this.game.flashScreen = 0.3;
    this.game.banner('CRYPTOCINO SE ENFURECE', 'FASE 2 · AURA DORADA CRYPTO', '#ff8a3d', 3.0);
    this.game.spawnBurst(this.x, this.y, 42, '#ffd166');
    Sound.sfx('enrage');
    this.state = 'roar';
    this.stateT = 0;
    this.summonCd = 1.3;
    this.cooldown = 0.3;
  }

  die() {
    this.hp = 0;
    this.alive = false;
    this.state = 'dead';
    this.stateT = 0;
    this.deadT = 0;
    this.vz = 300;
    this.z = Math.max(this.z, 2);
    this.game.awardBossDefeat(this, this.y - 150);
    this.game.shake(26, 1.2);
    this.game.slowmoT = 2.6;
    this.game.flashScreen = 0.9;
    Sound.sfx('slam');
    for (let i = 0; i < 7; i++) {
      this.game.spawnExplosion(this.x + rand(-70, 70), this.y + rand(-20, 20), rand(20, 120), '#ff8a3d');
    }
  }

  draw(ctx) {
    const g = this.game;
    if (!this.active && this.state === 'intro' && this.x > g.camera.x + CFG.W + 120) return;
    const sx = this.x - g.camera.x;
    const persp = 0.92 + (this.y - CFG.FLOOR_TOP) / (CFG.FLOOR_BOTTOM - CFG.FLOOR_TOP) * 0.10;
    const h = 136 * persp * CFG.CHAR_SCALE;
    const footY = this.y - this.z;
    drawShadow(ctx, sx, this.y, 74 * persp * CFG.CHAR_SCALE, this.z, 1.1);

    let spriteState = 'idle';
    let frame = null;
    let tilt = 0;
    let scaleX = 1;
    let scaleY = 1;
    let offsetY = 0;

    switch (this.state) {
      case 'intro':
      case 'dash':
        spriteState = 'walk';
        tilt = this.facing * 0.1;
        scaleX = 1.04;
        offsetY = -Math.abs(Math.sin(this.walkT * 10)) * 2.0;
        break;
      case 'chartWind':
      case 'spinWind':
      case 'laptopWind':
      case 'leapWind':
        spriteState = 'attack';
        frame = 0;
        tilt = -this.facing * 0.1;
        scaleX = 1.04;
        break;
      case 'spin':
        spriteState = 'attack';
        frame = 2;
        scaleX = 0.35 + Math.abs(Math.cos(this.stateT * 24)) * 0.9;
        offsetY = -2;
        break;
      case 'leap':
        spriteState = 'jump';
        frame = 2;
        tilt = this.facing * 0.22;
        scaleX = 0.98;
        scaleY = 1.05;
        break;
      case 'summon':
      case 'roar':
        spriteState = 'attack';
        frame = 2;
        tilt = this.facing * 0.08;
        break;
      case 'hurt':
        spriteState = 'hurt';
        tilt = -this.facing * 0.15;
        break;
      case 'dead':
        spriteState = 'hurt';
        scaleY = 0.42;
        scaleX = 1.22;
        tilt = this.facing * 0.5;
        break;
      case 'recover':
        spriteState = 'idle';
        offsetY = -Math.sin(this.animT * 2) * 1.2;
        break;
      default:
        spriteState = 'idle';
        offsetY = -Math.sin(this.animT * 2) * 1.4;
        scaleY = 1 + Math.sin(this.animT * 2) * 0.006;
        tilt = Math.sin(this.animT * 1.5) * 0.006 * this.facing;
    }

    if (this.turnT > 0) scaleX *= 1 - 0.26 * Math.sin((this.turnT / 0.13) * Math.PI);
    if (this.landSquash > 0) {
      const s = this.landSquash / 0.18;
      scaleY *= 1 - 0.16 * s;
      scaleX *= 1 + 0.12 * s;
    }

    const aura = this.enraged ? (0.05 + (Math.sin(this.animT * 11) * 0.5 + 0.5) * 0.14) : 0;
    drawSprite(ctx, g.boss2Sprite, spriteState, spriteState === 'walk' ? this.walkT : this.animT, sx, footY + offsetY, {
      h,
      flip: this.facing < 0,
      frame: frame == null ? undefined : frame,
      actionT: this.stateT,
      actionFps: 8,
      tilt,
      sx: scaleX,
      sy: scaleY,
      flash: this.flash > 0,
      tint: this.enraged ? '#ff8a3d' : '#ff1f3d',
      tintAlpha: aura,
      walkFps: 10,
      glow: this.enraged ? 'rgba(255, 138, 61, 0.9)' : 'rgba(93, 255, 143, 0.4)',
      glowSize: 26,
      alpha: this.state === 'dead' ? clamp(1 - this.deadT / 3.0, 0.15, 1) : 1,
    });

    if (['chartWind', 'dashWind', 'spinWind', 'laptopWind', 'leapWind'].includes(this.state)) {
      if (Math.sin(this.stateT * 28) > -0.3) {
        const ay = footY - h - 28;
        ctx.save();
        ctx.fillStyle = this.enraged ? '#ff8a3d' : '#5dff8f';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(sx, ay - 16);
        ctx.lineTo(sx + 14, ay + 2);
        ctx.lineTo(sx - 14, ay + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#08120e';
        ctx.font = '900 18px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx, ay + 4);
        ctx.restore();
      }
    }

    if (this.enraged && this.alive) {
      const pulse = Math.sin(this.animT * 7) * 0.5 + 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // burning ring at his feet
      const gy = footY + 2;
      const rg = ctx.createRadialGradient(sx, gy, 3, sx, gy, h * 0.42);
      rg.addColorStop(0, `rgba(255, 160, 70, ${0.20 + pulse * 0.14})`);
      rg.addColorStop(0.7, `rgba(255, 90, 30, ${0.09 + pulse * 0.07})`);
      rg.addColorStop(1, 'rgba(255, 60, 20, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(sx, gy, h * 0.42, h * 0.13, 0, 0, TAU);
      ctx.fill();
      // ember wisps rising around him
      for (let i = 0; i < 6; i++) {
        const t = (this.animT * 0.75 + i * 0.17) % 1;
        const side = i % 2 ? 1 : -1;
        const ex = sx + side * h * (0.16 + (i % 3) * 0.07) + Math.sin(this.animT * 3 + i * 2.1) * 4;
        const ey = footY - t * h * 0.9;
        ctx.globalAlpha = (1 - t) * 0.55;
        ctx.fillStyle = i % 2 ? '#ffd166' : '#ff8a3d';
        ctx.fillRect(ex - 2, ey - 5, 4, 10);
      }
      ctx.restore();
    }
  }
}

/* ============================================================
   GAME — Stage 2 setup, hospital events, NPC, stage clear
   ============================================================ */

export { Boss2 };
