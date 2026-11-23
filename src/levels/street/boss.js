import { drawSprite } from '../../media/sprite-renderer.js';
import { drawShadow } from '../../engine/canvas.js';
import { CFG, TAU, chance, choice, clamp, lerp, rand, sign } from '../../engine/math.js';
import { Particle } from '../../engine/particle.js';
import { Sound } from '../../media/audio.js';

class BurgerProjectile {
  constructor(game, x, y, vx, vz, dmg = 13, enraged = false) {
    this.game = game;
    this.x = x; this.y = y; this.z = 86;
    this.vx = vx; this.vz = vz;
    this.dmg = dmg;
    this.enraged = enraged;
    this.rot = 0;
    this.life = 3.4;
    this.dead = false;
    this.hit = false;
    this.bounces = 0;
    this.trail = [];
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    this.vz -= 900 * dt;
    this.rot += dt * 11;
    if (this.z <= 0) {
      this.z = 0;
      this.vz = Math.abs(this.vz) * 0.42;
      this.vx *= 0.68;
      this.bounces++;
      this.game.spawnDust(this.x, this.y, 4);
      Sound.sfx('coin');
      if (this.bounces > 2) this.dead = true;
    }
    const p = this.game.player;
    if (!this.hit && p.alive && Math.abs(p.x - this.x) < 30 && Math.abs(p.y - this.y) < 24 && Math.abs((p.z + 45) - this.z) < 78) {
      p.takeHit(this.dmg, this.x, { knock: 220, heavy: false });
      this.hit = true;
      this.dead = true;
    }
    if (this.life <= 0 || this.x < this.game.camera.x - 180 || this.x > this.game.camera.x + CFG.W + 180) {
      this.dead = true;
    }
  }

  draw(ctx) {
    const sx = this.x - this.game.camera.x;
    const sy = this.y - this.z;
    drawShadow(ctx, sx, this.y, 24, this.z, 0.4);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rot);
    if (this.enraged) {
      ctx.shadowColor = '#ff5fae';
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = '#ffb347';
      ctx.shadowBlur = 10;
    }
    // top bun
    ctx.fillStyle = '#f0b769';
    ctx.beginPath();
    ctx.ellipse(0, -5, 13, 8, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e2a24e';
    ctx.fillRect(-13, -5, 26, 3);
    // seeds
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
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

class Boss3 {
  constructor(game, x, y) {
    this.game = game;
    this.x = x; this.y = y; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.facing = -1;
    this.maxHp = 660;
    this.hp = this.maxHp;
    this.layerSize = 220;
    this.bossName = 'GAYTELOS';
    this.bossSub = '';
    this.state = 'intro';
    this.stateT = 0;
    this.animT = 0;
    this.walkT = 0;
    this.flash = 0;
    this.cooldown = 1.0;
    this.summonCd = 9;
    this.active = false;
    this.alive = true;
    this.phase = 1;
    this.enraged = false;
    this.deadT = 0;
    this.defeated = false;
    this.leapT = 0;
    this.leapDur = 0.82;
    this.leapFrom = null;
    this.leapTarget = null;
    this.chargeHit = false;
    this.introTarget = x;
    this.lastFacing = -1;
    this.turnT = 0;
    this.landSquash = 0;
    this.poundBounced = false;
    this.spinTick = 0;
    this.burgerThrown = false;
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
      if (chance(0.55)) {
        this.game.spawnExplosion(this.x + rand(-80, 80), this.y + rand(-20, 20), rand(20, 130), choice(['#ff5fae', '#ffd166', '#ffb347', '#fff3d6']));
        this.game.flashScreen = Math.max(this.game.flashScreen, 0.25);
        Sound.sfx('enemyDie');
      }
      if (this.deadT > 3.4 && !this.defeated) {
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
          this.x += sign(this.introTarget - this.x) * 250 * dt;
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

      case 'burgerWind':
        this.facing = sign(p.x - this.x) || this.facing;
        if (this.stateT > (this.enraged ? 0.24 : 0.38)) {
          this.throwBurgers();
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = this.enraged ? 0.42 : 0.72;
        }
        break;

      case 'dashWind':
        if (this.stateT > (this.enraged ? 0.17 : 0.28)) {
          this.state = 'dash';
          this.stateT = 0;
          this.chargeHit = false;
          this.vx = this.facing * (this.enraged ? 1080 : 940);
          Sound.sfx('throw');
          this.game.shake(4, 0.2);
        }
        break;

      case 'dash':
        this.x += this.vx * dt;
        this.facing = sign(this.vx) || this.facing;
        this.walkT += dt * 2.2;
        if (chance(0.8)) {
          this.game.particles.push(new Particle({
            x: this.x - this.facing * 32, y: this.y, z: rand(10, 100),
            vx: -this.facing * 60, vy: 0, vz: 30, life: 0.3,
            size: rand(4, 10), color: choice(['#ff5fae', '#ffd166', '#fff3d6']), gravity: 0, kind: 'pixel', glow: '#ff8ac4',
          }));
        }
        if (!this.chargeHit && p.alive && Math.abs(p.x - this.x) < 74 && Math.abs(p.y - this.y) < 38 && p.z < 62) {
          p.takeHit(this.enraged ? 21 : 17, this.x, { knock: 380, heavy: true });
          this.chargeHit = true;
        }
        if (this.stateT > 0.55 || this.x < this.game.minX() + 64 || this.x > this.game.maxX() - 64) {
          this.state = 'recover';
          this.stateT = 0;
          this.vx = 0;
          this.cooldown = this.enraged ? 0.4 : 0.65;
          this.game.shake(6, 0.2);
        }
        break;

      case 'poundWind':
        this.facing = sign(p.x - this.x) || this.facing;
        if (this.stateT > (this.enraged ? 0.34 : 0.48)) {
          this.state = 'pound';
          this.stateT = 0;
          this.poundBounced = false;
        }
        break;

      case 'pound':
        if (!this.poundBounced) {
          this.poundBounced = true;
          this.landSquash = 0.2;
          this.game.spawnShockwave(this.x, this.y, this.enraged ? 350 : 300, this.enraged ? 22 : 18, '#ffb347');
          this.game.stage.bounceT = 1.2;
          this.game.shake(24, 0.6);
          this.game.flashScreen = 0.3;
          this.game.spawnDust(this.x, this.y, 30);
          this.game.ringText('¡SALSA DE LA CASA!', this.x, this.y - 170, '#ffd166');
          Sound.sfx('slam');
        }
        if (this.stateT > 0.52) {
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = this.enraged ? 0.42 : 0.75;
        }
        break;

      case 'leapWind':
        if (this.stateT > 0.34) {
          this.state = 'leap';
          this.stateT = 0;
          this.leapT = 0;
          this.leapFrom = { x: this.x, y: this.y };
          this.leapTarget = { x: clamp(p.x, this.game.minX() + 90, this.game.maxX() - 90), y: p.y };
          this.vz = 620;
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
          this.state = 'spin';
          this.stateT = 0;
          this.spinTick = 0;
          this.landSquash = 0.2;
          this.game.spawnShockwave(this.x, this.y, 260, 16, '#ff5fae');
          this.game.stage.bounceT = 1.05;
          this.game.shake(20, 0.55);
          this.game.flashScreen = 0.32;
          this.game.spawnDust(this.x, this.y, 24);
          Sound.sfx('slam');
        }
        break;
      }

      case 'spin':
        this.spinTick -= dt;
        if (this.spinTick <= 0) {
          this.spinTick = 0.16;
          if (p.alive && Math.abs(p.x - this.x) < 152 && Math.abs(p.y - this.y) < 46 && p.z < 62) {
            p.takeHit(this.enraged ? 12 : 9, this.x, { knock: 260, heavy: false });
          }
          this.game.spawnSparks(this.x + rand(-60, 60), this.y, 50, 3, 'gold');
        }
        if (this.stateT > 0.66) {
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = this.enraged ? 0.45 : 0.8;
        }
        break;

      case 'summon':
        if (this.stateT > 0.8) {
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = 0.65;
        }
        break;

      case 'roar':
        if (this.stateT > 0.95) {
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = 0.32;
        }
        break;

      case 'recover':
        if (this.stateT > 0.3) {
          this.state = 'idle';
          this.stateT = 0;
        }
        break;

      case 'hurt':
        if (this.stateT > 0.22) {
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = Math.max(this.cooldown, 0.24);
        }
        break;

      default:
        this.state = 'idle';
    }

    if (this.state !== 'intro') {
      this.x = clamp(this.x, this.game.minX() + 58, this.game.maxX() - 58);
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
      if (dist < 190) {
        if (roll < 0.4) this.startLeap();
        else if (roll < 0.62) this.startPound();
        else if (roll < 0.82) this.startDash();
        else this.startBurger();
      } else {
        if (roll < 0.34) this.startLeap();
        else if (roll < 0.6) this.startBurger();
        else if (roll < 0.82) this.startDash();
        else this.startPound();
      }
      return;
    }

    if (dist < 170) {
      if (roll < 0.42) this.startPound();
      else if (roll < 0.72) this.startDash();
      else this.startBurger();
    } else {
      if (roll < 0.44) this.startBurger();
      else if (roll < 0.74) this.startDash();
      else this.startPound();
    }
  }

  startBurger() { this.state = 'burgerWind'; this.stateT = 0; }
  startDash() { this.state = 'dashWind'; this.stateT = 0; }
  startPound() {
    this.state = 'poundWind';
    this.stateT = 0;
    this.game.ringText('¡APLASTA HAMBURGUESA!', this.x, this.y - 170, '#ffb347');
  }
  startLeap() {
    if (!this.enraged) { this.startPound(); return; }
    this.state = 'leapWind';
    this.stateT = 0;
    this.game.ringText('¡SALTO DE QUESO!', this.x, this.y - 170, '#ff5fae');
  }

  startSummon() {
    this.state = 'summon';
    this.stateT = 0;
    this.summonCd = 15;
    const g = this.game;
    const count = this.enraged && chance(0.6) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const type = chance(0.5) ? 'tough' : 'diner';
      const x = i === 0 ? g.minX() + 100 : g.maxX() - 100;
      g.spawnEnemy(type, x, CFG.FLOOR_TOP + 30 + i * 60);
    }
    g.ringText('¡REFUERZOS!', this.x, this.y - 170, '#ff5fae');
    Sound.sfx('enrage');
  }

  throwBurgers() {
    const p = this.game.player;
    const dir = sign(p.x - this.x) || -1;
    const lanes = this.enraged ? [-58, -18, 22, 60] : [-50, 4, 54];
    for (let i = 0; i < lanes.length; i++) {
      const y = clamp(p.y + lanes[i], CFG.FLOOR_TOP + 8, CFG.FLOOR_BOTTOM - 8);
      this.game.projectiles.push(new BurgerProjectile(
        this.game, this.x + dir * 36, y,
        dir * (this.enraged ? 640 : 540), 250 + i * 18,
        this.enraged ? 16 : 13, this.enraged
      ));
    }
    Sound.sfx('throw');
  }

  takeHit(dmg, dir, o = {}) {
    if (!this.alive || this.state === 'dead' || this.state === 'intro') return;
    this.hp -= dmg;
    this.flash = 0.11;
    this.game.spawnSparks(this.x, this.y, this.z + 110, o.heavy ? 10 : 4, 'hit');
    this.game.addScore(o.heavy ? 50 : 16);
    Sound.sfx('bossHurt');

    if (this.hp <= 0) {
      this.die();
      return;
    }

    if (!this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enrage();
      return;
    }

    if (o.heavy && this.state !== 'dash' && this.state !== 'spin' && this.state !== 'leapWind' && this.state !== 'pound') {
      this.state = 'hurt';
      this.stateT = 0;
      this.vx = dir * 110;
    }
  }

  enrage() {
    this.enraged = true;
    this.phase = 2;
    this.game.hitstop(0.14);
    this.game.shake(24, 0.95);
    this.game.flashScreen = 0.4;
    this.game.banner('GAYTELOS SE ENFURECE', 'FASE 2 · AURA ROSA Y DORADA', '#ff5fae', 3.0);
    this.game.spawnBurst(this.x, this.y, 48, '#ff5fae');
    this.game.spawnBurst(this.x, this.y, 30, '#ffd166');
    Sound.sfx('enrage');
    this.state = 'roar';
    this.stateT = 0;
    this.summonCd = 1.1;
    this.cooldown = 0.3;
  }

  die() {
    this.hp = 0;
    this.alive = false;
    this.state = 'dead';
    this.stateT = 0;
    this.deadT = 0;
    this.vz = 320;
    this.z = Math.max(this.z, 2);
    this.game.awardBossDefeat(this, this.y - 160);
    this.game.shake(30, 1.4);
    this.game.slowmoT = 3.4;
    this.game.flashScreen = 1.0;
    Sound.sfx('slam');
    for (let i = 0; i < 9; i++) {
      this.game.spawnExplosion(this.x + rand(-80, 80), this.y + rand(-30, 30), rand(20, 140), choice(['#ff5fae', '#ffd166', '#ffb347']));
    }
  }

  draw(ctx) {
    const g = this.game;
    if (!this.active && this.state === 'intro' && this.x > g.camera.x + CFG.W + 120) return;
    const sx = this.x - g.camera.x;
    const persp = 0.92 + (this.y - CFG.FLOOR_TOP) / (CFG.FLOOR_BOTTOM - CFG.FLOOR_TOP) * 0.10;
    const h = 158 * persp * CFG.CHAR_SCALE;
    const footY = this.y - this.z;
    drawShadow(ctx, sx, this.y, 80 * persp * CFG.CHAR_SCALE, this.z, 1.1);

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
      case 'burgerWind':
      case 'poundWind':
      case 'leapWind':
      case 'summon':
      case 'roar':
        spriteState = 'attack';
        frame = 0;
        tilt = -this.facing * 0.1;
        scaleX = 1.05;
        break;
      case 'pound':
        spriteState = 'attack';
        frame = 2;
        scaleY = 0.88;
        scaleX = 1.12;
        offsetY = 4;
        break;
      case 'spin':
        spriteState = 'attack';
        frame = 2;
        scaleX = 0.35 + Math.abs(Math.cos(this.stateT * 26)) * 0.9;
        scaleY = 1.04;
        break;
      case 'leap':
        spriteState = 'jump';
        frame = 2;
        tilt = this.facing * 0.22;
        scaleX = 0.98;
        scaleY = 1.05;
        break;
      case 'hurt':
        spriteState = 'hurt';
        tilt = -this.facing * 0.15;
        break;
      case 'dead':
        spriteState = 'hurt';
        scaleY = 0.4;
        scaleX = 1.24;
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
      const s = this.landSquash / 0.2;
      scaleY *= 1 - 0.16 * s;
      scaleX *= 1 + 0.12 * s;
    }

    const aura = this.enraged ? (0.06 + (Math.sin(this.animT * 11) * 0.5 + 0.5) * 0.16) : 0;
    drawSprite(ctx, g.boss3Sprite, spriteState, spriteState === 'walk' ? this.walkT : this.animT, sx, footY + offsetY, {
      h,
      flip: this.facing < 0,
      frame: frame == null ? undefined : frame,
      actionT: this.stateT,
      actionFps: 8,
      tilt,
      sx: scaleX,
      sy: scaleY,
      flash: this.flash > 0,
      tint: this.enraged ? '#ff5fae' : '#ffd166',
      tintAlpha: aura,
      walkFps: 10,
      glow: this.enraged ? 'rgba(255, 95, 174, 0.9)' : 'rgba(255, 209, 102, 0.5)',
      glowSize: 28,
      alpha: this.state === 'dead' ? clamp(1 - this.deadT / 3.4, 0.15, 1) : 1,
    });

    // wind-up warning
    if (['burgerWind', 'dashWind', 'poundWind', 'leapWind'].includes(this.state)) {
      if (Math.sin(this.stateT * 30) > -0.3) {
        const ay = footY - h - 28;
        ctx.save();
        ctx.fillStyle = this.enraged ? '#ff5fae' : '#ffd166';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(sx, ay - 16);
        ctx.lineTo(sx + 14, ay + 2);
        ctx.lineTo(sx - 14, ay + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a0812';
        ctx.font = '900 18px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx, ay + 4);
        ctx.restore();
      }
    }

    // pink/gold flashing aura in phase 2
    if (this.enraged && this.alive) {
      const pulse = Math.sin(this.animT * 8) * 0.5 + 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gy = footY + 2;
      const rg = ctx.createRadialGradient(sx, gy, 4, sx, gy, h * 0.56);
      rg.addColorStop(0, `rgba(255, 95, 174, ${0.22 + pulse * 0.15})`);
      rg.addColorStop(0.55, `rgba(255, 209, 102, ${0.12 + pulse * 0.08})`);
      rg.addColorStop(1, 'rgba(255, 95, 174, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(sx, gy, h * 0.56, h * 0.18, 0, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        const t = (this.animT * 0.8 + i * 0.13) % 1;
        const side = i % 2 ? 1 : -1;
        const ex = sx + side * h * (0.13 + (i % 4) * 0.06) + Math.sin(this.animT * 3 + i * 2.1) * 5;
        const ey = footY - t * h * 1.0;
        ctx.globalAlpha = (1 - t) * 0.6;
        ctx.fillStyle = i % 2 ? '#ffd166' : '#ff5fae';
        ctx.fillRect(ex - 2, ey - 6, 4, 12);
      }
      // gold halo ring
      ctx.globalAlpha = 0.25 + pulse * 0.18;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, footY - h * 0.72, h * 0.34, h * 0.1, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/* ============================================================
   GAME — Stage 3 setup
   ============================================================ */

export { Boss3 };
