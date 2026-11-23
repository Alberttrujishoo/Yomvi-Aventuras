import { drawSprite } from '../../media/sprite-renderer.js';
import { drawShadow } from '../../engine/canvas.js';
import { CFG, TAU, chance, clamp, lerp, rand, sign } from '../../engine/math.js';
import { Particle } from '../../engine/particle.js';
import { Sound } from '../../media/audio.js';

class Boss {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.facing = -1;
    this.maxHp = 420;
    this.hp = this.maxHp;
    this.layerSize = 140;
    this.bossName = 'ARTHAS';
    this.state = 'intro';
    this.stateT = 0;
    this.animT = 0;
    this.walkT = 0;
    this.flash = 0;
    this.cooldown = 1.1;
    this.active = false;
    this.alive = true;
    this.phase = 1;
    this.enraged = false;
    this.enrageShown = false;
    this.summonCd = 8;
    this.windup = 0;
    this.chargeHit = false;
    this.leapTarget = null;
    this.leapFrom = null;
    this.leapT = 0;
    this.leapDur = 0.9;
    this.deadT = 0;
    this.defeated = false;
    this.halfShown = false;
    this.introTarget = x;
    this.actionCount = 0;
    this.tokensThrown = 0;
    this.lastFacing = this.facing;
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
      if (chance(0.35)) this.game.spawnExplosion(this.x + rand(-50, 50), this.y + rand(-20, 20), rand(30, 100), '#ff8a3d');
      if (this.deadT > 2.6 && !this.defeated) {
        this.defeated = true;
        this.game.onBossDefeated();
      }
      return;
    }

    if (this.state !== 'leap') this.updateNormalPhysics(dt);

    const p = this.game.player;
    if (!p.alive && this.state !== 'idle') {
      // finish current action then idle
    }

    switch (this.state) {
      case 'intro':
        if (Math.abs(this.x - this.introTarget) > 6) {
          this.x += sign(this.introTarget - this.x) * 235 * dt;
          this.walkT += dt;
          this.facing = sign(p.x - this.x) || -1;
        } else {
          this.x = this.introTarget;
          this.state = 'idle';
          this.stateT = 0;
          this.active = true;
          this.cooldown = 1.0;
          this.game.onBossReady();
        }
        break;

      case 'idle':
        this.facing = sign(p.x - this.x) || this.facing;
        if (p.alive && this.cooldown <= 0) this.chooseAction();
        break;

      case 'chargeWind':
        this.facing = sign(p.x - this.x) || this.facing;
        this.windup = this.stateT;
        if (this.stateT > (this.enraged ? 0.38 : 0.56)) {
          this.state = 'charge';
          this.stateT = 0;
          this.chargeHit = false;
          this.vx = this.facing * (this.enraged ? 760 : 680);
          Sound.sfx('throw');
          this.game.shake(4, 0.2);
        }
        break;

      case 'charge':
        this.x += this.vx * dt;
        this.facing = sign(this.vx) || this.facing;
        this.walkT += dt;
        if (chance(0.8)) {
          this.game.particles.push(new Particle({
            x: this.x - this.facing * 30, y: this.y, z: rand(10, 80),
            vx: -this.facing * 40, vy: 0, vz: 20, life: 0.28,
            size: rand(4, 10), color: '#ff4f8b', gravity: 0, kind: 'pixel', glow: '#ff2e63',
          }));
        }
        if (!this.chargeHit && p.alive && Math.abs(p.x - this.x) < 70 && Math.abs(p.y - this.y) < 36 && p.z < 60) {
          p.takeHit(this.enraged ? 20 : 17, this.x, { knock: 360, heavy: true });
          this.chargeHit = true;
        }
        if (this.stateT > 0.68 || this.x < this.game.minX() + 70 || this.x > this.game.maxX() - 70) {
          this.state = 'recover';
          this.stateT = 0;
          this.vx = 0;
          this.cooldown = this.enraged ? 0.6 : 0.9;
          this.game.shake(7, 0.2);
        }
        break;

      case 'stompWind':
        this.windup = this.stateT;
        if (this.stateT > 0.55) {
          this.state = 'stomp';
          this.stateT = 0;
          this.game.spawnShockwave(this.x, this.y, 252, 14, '#ffb347');
          this.game.shake(13, 0.34);
          this.game.spawnDust(this.x, this.y, 18);
          Sound.sfx('slam');
          this.cooldown = 1.2;
        }
        break;

      case 'stomp':
        if (this.stateT > 0.4) {
          this.state = 'recover';
          this.stateT = 0;
        }
        break;

      case 'throwWind':
        this.facing = sign(p.x - this.x) || this.facing;
        if (this.stateT > 0.36) {
          this.state = 'throw';
          this.stateT = 0;
          this.throwTokens(this.enraged ? 3 : 2);
          Sound.sfx('token');
        }
        break;

      case 'throw':
        if (this.stateT > 0.35) {
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = 0.75;
        }
        break;

      case 'leapWind':
        this.windup = this.stateT;
        if (this.stateT > 0.42) {
          this.state = 'leap';
          this.stateT = 0;
          this.leapT = 0;
          this.leapFrom = { x: this.x, y: this.y };
          this.leapTarget = { x: clamp(p.x, this.game.minX() + 80, this.game.maxX() - 80), y: p.y };
          this.vz = 560;
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
          this.game.spawnShockwave(this.x, this.y, 336, 22, '#ff2e63');
          this.game.shake(22, 0.6);
          this.game.spawnDust(this.x, this.y, 26);
          Sound.sfx('slam');
          this.cooldown = this.enraged ? 0.55 : 1.0;
        }
        break;
      }

      case 'summon':
        if (this.stateT > 0.75) {
          this.state = 'recover';
          this.stateT = 0;
          this.cooldown = 0.8;
        }
        break;

      case 'roar':
        if (this.stateT > 1.0) {
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = 0.4;
        }
        break;

      case 'recover':
        if (this.stateT > 0.35) {
          this.state = 'idle';
          this.stateT = 0;
        }
        break;

      case 'hurt':
        if (this.stateT > 0.24) {
          this.state = 'idle';
          this.stateT = 0;
          this.cooldown = Math.max(this.cooldown, 0.25);
        }
        break;

      default:
        this.state = 'idle';
    }

    this.x = this.state === 'intro' ? this.x : clamp(this.x, this.game.minX() + 50, this.game.maxX() - 50);
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
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
      }
    }
    if (this.state !== 'charge') {
      this.x += this.vx * dt;
      this.vx *= 0.86;
    }
    this.y = clamp(this.y, CFG.FLOOR_TOP + 10, CFG.FLOOR_BOTTOM - 8);
  }

  chooseAction() {
    const p = this.game.player;
    if (!p.alive) return;
    const dist = Math.abs(p.x - this.x);
    this.actionCount++;

    if (this.enraged && this.summonCd <= 0) {
      const punks = this.game.enemies.filter(e => e.alive).length;
      if (punks < 2) {
        this.startSummon();
        return;
      }
      this.summonCd = 16;
    }

    const roll = Math.random();

    if (this.enraged) {
      if (dist < 160) {
        if (roll < 0.42) this.startStomp();
        else if (roll < 0.72) this.startCharge();
        else this.startThrow();
        return;
      }
      if (roll < 0.36) this.startLeap();
      else if (roll < 0.62) this.startCharge();
      else if (roll < 0.82) this.startThrow();
      else this.startStomp();
      return;
    }

    if (dist > 280) {
      if (roll < 0.55) this.startCharge();
      else if (roll < 0.85) this.startThrow();
      else this.startStomp();
    } else if (dist < 140) {
      if (roll < 0.6) this.startStomp();
      else this.startThrow();
    } else {
      if (roll < 0.36) this.startCharge();
      else if (roll < 0.66) this.startStomp();
      else this.startThrow();
    }
  }

  startCharge() {
    this.state = 'chargeWind';
    this.stateT = 0;
    this.windup = 0;
    this.game.ringText('¡CUIDADO!', this.x, this.y - 150, '#ff5a6e');
  }

  startStomp() {
    this.state = 'stompWind';
    this.stateT = 0;
    this.windup = 0;
  }

  startThrow() {
    this.state = 'throwWind';
    this.stateT = 0;
  }

  startLeap() {
    this.state = 'leapWind';
    this.stateT = 0;
    this.windup = 0;
    this.game.ringText('¡SALTO!', this.x, this.y - 150, '#ff2e63');
  }

  startSummon() {
    this.state = 'summon';
    this.stateT = 0;
    this.summonCd = 15;
    const g = this.game;
    const spots = [
      { x: g.minX() + 90, y: CFG.FLOOR_TOP + 30 },
      { x: g.maxX() - 90, y: CFG.FLOOR_BOTTOM - 20 },
    ];
    for (const sp of spots) {
      g.spawnEnemy('punk', sp.x, sp.y, true);
      g.spawnBurst(sp.x, sp.y, 18, '#ff5fae');
    }
    Sound.sfx('enrage');
    g.ringText('¡REFUERZOS!', this.x, this.y - 170, '#ff5fae');
  }

  throwTokens(count) {
    const p = this.game.player;
    const handX = this.x + this.facing * 41;
    const handY = this.y;
    for (let i = 0; i < count; i++) {
      const targetX = p.x + rand(-60, 60) + (i - (count - 1) / 2) * 54;
      const targetY = clamp(p.y + rand(-16, 16), CFG.FLOOR_TOP, CFG.FLOOR_BOTTOM);
      const t = 0.85 + i * 0.06;
      const vz = (0.5 * 1250 * t * t - 90) / t;
      this.game.projectiles.push(new CoinToken(
        this.game, handX, handY, 88,
        (targetX - handX) / t, (targetY - handY) / t, vz
      ));
    }
  }

  takeHit(dmg, dir, o = {}) {
    if (!this.alive || this.state === 'dead' || this.state === 'leap' || this.state === 'intro') return false;

    this.hp -= dmg;
    this.flash = 0.11;
    Sound.sfx('bossHurt');
    this.game.spawnSparks(this.x, this.y, this.z + 90, o.heavy ? 9 : 4, 'hit');
    this.game.addScore(o.heavy ? 40 : 15);

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    if (!this.enraged && this.hp <= this.maxHp * 0.5 && !this.halfShown) {
      this.halfShown = true;
      this.enrage();
      return true;
    }

    if (o.heavy && this.state !== 'charge' && this.state !== 'stompWind' && this.state !== 'leapWind') {
      this.state = 'hurt';
      this.stateT = 0;
      this.vx = dir * 90;
    }
    return true;
  }

  enrage() {
    this.enraged = true;
    this.phase = 2;
    this.game.hitstop(0.12);
    this.game.shake(24, 0.9);
    this.game.banner('ARTHAS SE ENFURECE', 'FASE 2 · REFUERZOS EN CAMINO', '#ff2e63', 3.0);
    Sound.sfx('enrage');
    this.state = 'roar';
    this.stateT = 0;
    this.summonCd = 1.2;
    this.game.spawnBurst(this.x, this.y, 40, '#ff2e63');
  }

  die() {
    this.hp = 0;
    this.alive = false;
    this.state = 'dead';
    this.stateT = 0;
    this.deadT = 0;
    this.vz = 280;
    this.vx = 0;
    this.z = Math.max(this.z, 2);
    this.game.awardBossDefeat(this, this.y - 130);
    this.game.shake(26, 1.2);
    Sound.sfx('slam');
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (this.game.state === 'playing') {
          this.game.spawnExplosion(this.x + rand(-60, 60), this.y + rand(-20, 20), rand(30, 110), '#ff8a3d');
          Sound.sfx('enemyDie');
        }
      }, i * 160);
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
      case 'charge':
        spriteState = 'walk';
        tilt = this.facing * 0.06
          + clamp((this.vx * this.facing) / 6000, -0.05, 0.05)
          + Math.sin(this.walkT * 10) * 0.012 * this.facing;
        scaleX = 1.04;
        scaleY = 1 + Math.sin(this.walkT * 20) * 0.005;
        offsetY = -Math.abs(Math.sin(this.walkT * 10)) * 2.1;
        break;
      case 'chargeWind':
      case 'stompWind':
      case 'throwWind':
      case 'leapWind':
        spriteState = 'attack';
        frame = 0;
        tilt = -this.facing * 0.1;
        scaleX = 1.05;
        scaleY = this.state === 'leapWind' ? 0.85 : 1;
        break;
      case 'stomp':
        spriteState = 'attack';
        frame = 2;
        tilt = this.facing * 0.12;
        break;
      case 'throw':
        spriteState = 'attack';
        frame = 1;
        tilt = this.facing * 0.10;
        break;
      case 'summon':
      case 'roar':
        spriteState = 'attack';
        frame = 1;
        tilt = this.facing * 0.08;
        break;
      case 'leap':
        spriteState = 'jump';
        frame = 2;
        tilt = this.facing * 0.2;
        scaleX = 0.98;
        scaleY = 1.05;
        break;
      case 'hurt':
        spriteState = 'hurt';
        tilt = -this.facing * 0.15;
        break;
      case 'dead':
        spriteState = 'hurt';
        scaleY = 0.42;
        scaleX = 1.25;
        tilt = this.facing * 0.5;
        break;
      case 'recover':
        spriteState = 'idle';
        scaleY = 0.96;
        offsetY = -Math.sin(this.animT * 2) * 1.1;
        break;
      default:
        spriteState = 'idle';
        offsetY = -Math.sin(this.animT * 2) * 1.3;
        scaleY = 1 + Math.sin(this.animT * 2) * 0.006;
        tilt = Math.sin(this.animT * 1.5) * 0.006 * this.facing;
    }

    if (this.turnT > 0) {
      const k = this.turnT / 0.13;
      scaleX *= 1 - 0.26 * Math.sin(k * Math.PI);
    }
    if (this.landSquash > 0) {
      const s = this.landSquash / 0.18;
      scaleY *= 1 - 0.16 * s;
      scaleX *= 1 + 0.12 * s;
    }

    const tintPulse = this.enraged ? (0.18 + (Math.sin(this.animT * 11) * 0.5 + 0.5) * 0.34) : 0;
    drawSprite(ctx, g.bossSprite, spriteState, spriteState === 'walk' ? this.walkT : this.animT, sx, footY + offsetY, {
      h,
      flip: this.facing < 0,
      frame: frame == null ? undefined : frame,
      actionT: this.stateT,
      actionFps: 7,
      tilt,
      sx: scaleX,
      sy: scaleY,
      flash: this.flash > 0,
      tint: '#ff1f3d',
      tintAlpha: tintPulse,
      walkFps: 10,
      glow: this.enraged ? 'rgba(255,46,99,0.9)' : null,
      glowSize: 24,
      alpha: this.state === 'dead' ? clamp(1 - this.deadT / 2.6, 0.2, 1) : 1,
    });

    // wind-up warning
    if (['chargeWind', 'stompWind', 'leapWind', 'throwWind'].includes(this.state)) {
      const blink = Math.sin(this.stateT * 28) > -0.3;
      if (blink) {
        const ay = footY - h - 26;
        ctx.save();
        ctx.fillStyle = '#ff2e63';
        ctx.shadowColor = '#ff2e63';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(sx, ay - 16);
        ctx.lineTo(sx + 14, ay + 2);
        ctx.lineTo(sx - 14, ay + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '900 18px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx, ay + 4);
        ctx.restore();
      }
    }

    if (this.enraged && this.alive) {
      ctx.save();
      ctx.globalAlpha = 0.12 + Math.abs(Math.sin(this.animT * 6)) * 0.12;
      ctx.fillStyle = '#ff2e63';
      ctx.beginPath();
      ctx.ellipse(sx, footY - h * 0.5, h * 0.55, h * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------
   BOSS TOKEN PROJECTILE
   ------------------------------------------------------------ */
class CoinToken {
  constructor(game, x, y, z, vx, vy, vz) {
    this.game = game;
    this.x = x; this.y = y; this.z = z;
    this.vx = vx; this.vy = vy; this.vz = vz;
    this.rot = rand(0, TAU);
    this.life = 4;
    this.dead = false;
    this.dmg = 9;
    this.hit = false;
    this.bounces = 0;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
    this.vz -= 1250 * dt;
    this.rot += dt * 18;
    if (this.z <= 0) {
      this.z = 0;
      this.vz = Math.abs(this.vz) * 0.42;
      this.bounces++;
      this.vx *= 0.65;
      this.vy *= 0.65;
      if (this.bounces > 2) this.dead = true;
    }
    const p = this.game.player;
    if (!this.hit && p.alive && Math.abs(p.x - this.x) < 24 && Math.abs(p.y - this.y) < 22 && Math.abs(p.z + 40 - this.z) < 60) {
      p.takeHit(this.dmg, this.x, { knock: 160, heavy: false });
      this.hit = true;
      this.dead = true;
    }
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const sx = this.x - this.game.camera.x;
    const sy = this.y - this.z;
    drawShadow(ctx, sx, this.y, 22, this.z, 0.5);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(Math.cos(this.rot) * 0.6 + 0.4, 1);
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#a9741c';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe9a3';
    ctx.fillRect(-2, -4, 4, 8);
    ctx.restore();
  }
}

export { Boss };
