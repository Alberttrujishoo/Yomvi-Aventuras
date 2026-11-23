import { drawSprite } from '../media/sprite-renderer.js';
import { drawShadow } from '../engine/canvas.js';
import { CFG, chance, clamp, rand, sign } from '../engine/math.js';
import { Sound } from '../media/audio.js';

const ENEMY_TYPES = {
  punk: {
    name: 'MALL PUNK', hp: 28, speed: 205, dmg: 5, reach: 55,
    wind: 0.20, recover: 0.42, cd: 1.05, score: 150, halfW: 24,
    canGrab: true, h: 122, dropChance: 0.16, ai: 'rusher',
  },
  guard: {
    name: 'SEGURIDAD', hp: 64, speed: 138, dmg: 8, reach: 79,
    wind: 0.30, recover: 0.5, cd: 1.5, score: 250, halfW: 29,
    canGrab: true, h: 137, dropChance: 0.24, ai: 'flanker',
  },
  bouncer: {
    name: 'BOUNCER', hp: 138, speed: 100, dmg: 14, reach: 67,
    wind: 0.52, recover: 0.7, cd: 2.1, score: 450, halfW: 36,
    canGrab: false, h: 151, dropChance: 0.34, ai: 'heavy',
  },
  orderly: {
    name: 'ORDERLY', hp: 34, speed: 215, dmg: 6, reach: 55,
    wind: 0.18, recover: 0.4, cd: 0.95, score: 180, halfW: 24,
    canGrab: true, h: 124, dropChance: 0.2, ai: 'rusher',
  },
  doctor: {
    name: 'DOCTOR', hp: 72, speed: 148, dmg: 9, reach: 79,
    wind: 0.3, recover: 0.5, cd: 1.45, score: 300, halfW: 29,
    canGrab: true, h: 138, dropChance: 0.28, ai: 'flanker',
  },
  security: {
    name: 'SECURITY', hp: 158, speed: 104, dmg: 15, reach: 67,
    wind: 0.5, recover: 0.7, cd: 2.0, score: 500, halfW: 36,
    canGrab: false, h: 152, dropChance: 0.36, ai: 'heavy',
  },
  diner: {
    name: 'COMENSAL', hp: 38, speed: 218, dmg: 6, reach: 56,
    wind: 0.18, recover: 0.4, cd: 0.95, score: 190, halfW: 24,
    canGrab: true, h: 123, dropChance: 0.24, ai: 'rusher',
  },
  tough: {
    name: 'CALLEJERO', hp: 78, speed: 152, dmg: 9, reach: 80,
    wind: 0.29, recover: 0.5, cd: 1.4, score: 320, halfW: 29,
    canGrab: true, h: 138, dropChance: 0.3, ai: 'flanker',
  },
  streetbouncer: {
    name: 'BOUNCER CALLEJERO', hp: 170, speed: 108, dmg: 16, reach: 68,
    wind: 0.5, recover: 0.68, cd: 2.0, score: 540, halfW: 37,
    canGrab: false, h: 154, dropChance: 0.4, ai: 'heavy',
  },
};

/* ------------------------------------------------------------
   PLAYER — YOMVI
   ------------------------------------------------------------ */

class Enemy {
  constructor(game, type, x, y) {
    this.game = game;
    this.type = type;
    this.def = ENEMY_TYPES[type];
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.facing = -1;
    this.maxHp = this.def.hp;
    this.hp = this.maxHp;
    this.state = 'chase';
    this.stateT = 0;
    this.animT = rand(0, 4);
    this.walkT = rand(0, 4);
    this.flash = 0;
    this.cooldown = rand(0.4, 1.4);
    this.stunTimer = 0;
    this.downT = 0;
    this.alive = true;
    this.remove = false;
    this.hasSlot = false;
    this.laneSide = chance(0.5) ? 1 : -1;
    this.hpBarT = 0;
    this.chargeHit = false;
    this.slamDone = false;
    this.throwDamage = 0;
    this.throwDir = 1;
    this.hasHitOther = false;
    this.id = ++Enemy.counter;
    this.spawnDelay = 0;
    this.alpha = 1;
    this.deathT = 0;
    this.hurtDir = 1;
    this.prevX = x;
    this.velX = 0;
    this.lastFacing = this.facing;
    this.turnT = 0;
    this.landSquash = 0;
    this.stepT = rand(0, 0.2);
  }

  get footY() { return this.y - this.z; }

  update(dt) {
    this.prevX = this.x;
    this.stateT += dt;
    this.animT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.stunTimer = Math.max(0, this.stunTimer - dt);
    this.hpBarT = Math.max(0, this.hpBarT - dt);
    this.turnT = Math.max(0, this.turnT - dt);
    this.landSquash = Math.max(0, this.landSquash - dt);

    if (this.state === 'dying') {
      this.deathT += dt;
      this.updatePhysics(dt, true);
      this.alpha = clamp(1 - (this.deathT - 0.45) / 0.4, 0, 1);
      if (this.deathT > 0.85) this.remove = true;
      return;
    }

    if (this.state === 'grabbed') {
      // player positions us
      return;
    }

    if (this.state === 'thrown') {
      this.x += this.vx * dt;
      this.z += this.vz * dt;
      this.vz -= CFG.GRAVITY * dt;
      this.vx *= Math.max(0, 1 - 0.6 * dt);
      this.facing = sign(this.vx) || this.facing;
      // bowling through other enemies
      for (const other of this.game.enemies) {
        if (other === this || !other.alive) continue;
        if (!this.hasHitOther && Math.abs(other.x - this.x) < 46 && Math.abs(other.y - this.y) < 26) {
          other.takeHit(8, sign(this.vx), { knock: 160, heavy: false });
          this.hasHitOther = true;
          this.game.spawnSparks(other.x, other.y, 40, 6, 'hit');
        }
      }
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        this.state = 'down';
        this.stateT = 0;
        this.downT = 0.9;
        this.landSquash = 0.16;
        this.game.shake(5, 0.18);
        this.game.spawnDust(this.x, this.y, 10);
        this.game.hitstop(0.03);
        this.takeHit(this.throwDamage, -this.throwDir, { knock: 0, heavy: true, ignoreInvuln: true });
        this.game.addScore(30);
      }
      return;
    }

    if (this.z > 0 || this.vz > 0) this.updatePhysics(dt);

    switch (this.state) {
      case 'hurt':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= Math.max(0, 1 - 5 * dt);
        this.vy *= Math.max(0, 1 - 5 * dt);
        if (this.stateT > 0.32) {
          this.state = 'chase';
          this.stateT = 0;
        }
        break;
      case 'down':
        this.downT -= dt;
        this.x += this.vx * dt;
        this.vx *= Math.max(0, 1 - 3 * dt);
        if (this.downT <= 0 && this.z <= 0) {
          this.state = 'getup';
          this.stateT = 0;
        }
        break;
      case 'getup':
        if (this.stateT > 0.42) {
          this.state = 'chase';
          this.stateT = 0;
          this.cooldown = Math.max(this.cooldown, 0.35);
        }
        break;
      case 'windup':
        this.facing = sign(this.game.player.x - this.x) || this.facing;
        if (this.stateT >= this.def.wind) {
          this.state = 'attack';
          this.stateT = 0;
          this.strike();
        }
        break;
      case 'attack':
        if (this.stateT >= 0.22) {
          this.state = 'recover';
          this.stateT = 0;
        }
        break;
      case 'recover':
        if (this.stateT >= this.def.recover) {
          this.state = 'chase';
          this.stateT = 0;
          this.cooldown = this.def.cd;
          this.releaseSlot();
        }
        break;
      case 'retreat':
        this.moveAway(dt);
        if (this.stateT > 0.45) {
          this.state = 'chase';
          this.stateT = 0;
          this.releaseSlot();
        }
        break;
      case 'chargeWind':
        this.facing = sign(this.game.player.x - this.x) || this.facing;
        if (this.stateT > 0.85) {
          this.state = 'charge';
          this.stateT = 0;
          this.chargeHit = false;
          this.vx = this.facing * 430;
          Sound.sfx('throw');
        }
        break;
      case 'charge':
        this.x += this.vx * dt;
        this.vy = 0;
        this.facing = sign(this.vx) || this.facing;
        this.walkT += dt * 1.7;
        if (!this.chargeHit) {
          const p = this.game.player;
          if (p.alive && Math.abs(p.x - this.x) < 55 && Math.abs(p.y - this.y) < 34 && p.z < 54) {
            p.takeHit(this.def.dmg + 3, this.x, { knock: 320, heavy: true });
            this.chargeHit = true;
            this.game.spawnSparks(p.x, p.y, 70, 10, 'hit');
          }
        }
        if (this.stateT > 0.6 || this.x < this.game.minX() + 40 || this.x > this.game.maxX() - 40) {
          this.state = 'stunned';
          this.stateT = 0;
          this.vx = 0;
          this.releaseSlot();
        }
        break;
      case 'stunned':
        if (this.stateT > 0.9) {
          this.state = 'chase';
          this.stateT = 0;
          this.cooldown = 1.2;
        }
        break;
      case 'spawn':
        this.moveToward(this.game.player.x, this.game.player.y, this.def.speed, dt);
        if (this.stateT > 0.6) {
          this.state = 'chase';
          this.stateT = 0;
        }
        break;
      default:
        this.updateChase(dt);
    }

    // stay inside arena
    if (this.game.lockActive && this.game.activeLock) {
      const lock = this.game.activeLock;
      this.x = clamp(this.x, lock.camX - 100, lock.camX + CFG.W + 100);
    }
    this.y = clamp(this.y, CFG.FLOOR_TOP, CFG.FLOOR_BOTTOM);

    this.velX = (this.x - this.prevX) / Math.max(dt, 1e-4);
    if (this.facing !== this.lastFacing) {
      this.lastFacing = this.facing;
      this.turnT = 0.12;
    }
    if (this.z <= 0 && Math.abs(this.velX) > 40 &&
        (this.state === 'chase' || this.state === 'spawn' || this.state === 'charge')) {
      this.stepT += dt * (Math.abs(this.velX) / 130);
      if (this.stepT > 0.46) {
        this.stepT = 0;
        this.game.spawnDust(this.x - this.facing * 8, this.y, 1);
      }
    }
  }

  updatePhysics(dt, dying = false) {
    this.z += this.vz * dt;
    this.vz -= CFG.GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.z <= 0) {
      this.z = 0;
      this.vz = 0;
      if (!dying && this.state !== 'thrown' && this.state !== 'down') {
        this.state = 'down';
        this.stateT = 0;
        this.downT = 0.8;
      }
      this.landSquash = 0.13;
    }
  }

  updateChase(dt) {
    const p = this.game.player;
    if (!p.alive) {
      this.moveToward(this.x + this.laneSide * 100, this.y, this.def.speed * 0.3, dt);
      return;
    }
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    this.facing = sign(dx) || this.facing;

    if (this.def.ai === 'flanker') {
      // Try to slip above/below Yomvi before closing in
      const desiredY = p.y + this.laneSide * (Math.abs(dx) > 90 ? 54 : 20);
      if (Math.abs(this.y - desiredY) > 6) {
        this.y += sign(desiredY - this.y) * this.def.speed * 0.62 * dt;
        this.walkT += dt * (this.def.speed / 160) * 0.7;
      }
      if (Math.abs(this.y - desiredY) > 12) {
        return;
      }
    } else {
      // align lane
      if (Math.abs(dy) > 6) {
        this.y += sign(dy) * this.def.speed * 0.55 * dt;
        this.walkT += dt * (this.def.speed / 160) * 0.7;
      }
    }

    const adx = Math.abs(dx);
    const aligned = Math.abs(p.y - this.y) < 24;

    if (this.def.ai === 'heavy') {
      if (this.cooldown <= 0 && adx > 120 && adx < 330 && aligned && this.game.requestAttackSlot(this)) {
        this.state = 'chargeWind';
        this.stateT = 0;
        Sound.sfx('token');
        return;
      }
      if (adx > this.def.reach * 0.75) {
        this.x += sign(dx) * this.def.speed * dt;
        this.walkT += dt * (this.def.speed / 160);
      } else if (aligned && this.cooldown <= 0) {
        this.startWindup();
      }
      return;
    }

    if (adx > this.def.reach * 0.68) {
      this.x += sign(dx) * this.def.speed * dt;
      this.walkT += dt * (this.def.speed / 160);
    } else if (aligned && this.cooldown <= 0 && this.game.requestAttackSlot(this)) {
      this.startWindup();
    }
  }

  startWindup() {
    this.state = 'windup';
    this.stateT = 0;
    this.vx = 0;
    this.vy = 0;
    if (this.type === 'bouncer') Sound.sfx('token');
  }

  strike() {
    const p = this.game.player;
    if (!p.alive) return;
    const dx = (p.x - this.x) * this.facing;
    const dy = Math.abs(p.y - this.y);
    const zClose = Math.abs(p.z - this.z) < 64;
    if (dx > -20 && dx < this.def.reach + 20 && dy < 27 && zClose) {
      p.takeHit(this.def.dmg, this.x, { knock: this.type === 'bouncer' ? 280 : 190, heavy: this.type === 'bouncer' });
    }
    Sound.noise(0.07, 0.06, 'bandpass', 1100, 400);
    if (this.type === 'bouncer') {
      this.game.shake(6, 0.16);
      this.game.spawnDust(this.x + this.facing * 30, this.y, 8);
    }
    if (this.type === 'punk') {
      // quick retreat after punching
      this.state = 'retreat';
      this.stateT = 0;
    }
  }

  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 2) {
      this.x += (dx / d) * speed * dt;
      this.y += (dy / d) * speed * 0.7 * dt;
      this.walkT += dt * (speed / 160);
      if (Math.abs(dx) > 4) this.facing = sign(dx);
    }
  }

  moveAway(dt) {
    const p = this.game.player;
    const dx = this.x - p.x;
    this.x += sign(dx) * this.def.speed * 0.8 * dt;
    const dy = this.y - p.y;
    if (Math.abs(dy) < 40) this.y += sign(dy || 1) * this.def.speed * 0.5 * dt;
    this.walkT += dt * (this.def.speed / 160);
  }

  takeHit(dmg, dir, o = {}) {
    if (!this.alive || this.state === 'dying') return;
    if (this.state === 'thrown' && o.isGrabHit) return;

    this.hp -= dmg;
    this.flash = 0.12;
    this.hpBarT = 2.2;
    this.stunTimer = Math.max(this.stunTimer, o.isGrabHit ? 0.9 : 0.4);
    this.hurtDir = dir;

    this.game.spawnSparks(this.x, this.y, this.z + this.def.h * 0.6, o.heavy ? 8 : 4, 'hit');
    Sound.sfx(o.heavy ? 'heavy' : 'hit');

    if (this.hp <= 0) {
      this.die(dir);
      return;
    }

    if (this.state === 'grabbed') {
      // stay held, just wobble
      return;
    }

    if (o.knock >= 230 || o.heavy) {
      this.state = 'down';
      this.stateT = 0;
      this.downT = 0.85;
      this.vx = dir * Math.min(340, o.knock || 200) * 0.6;
      this.vz = 230;
      this.z = Math.max(this.z, 2);
      this.releaseSlot();
    } else {
      this.state = 'hurt';
      this.stateT = 0;
      this.vx = dir * 150;
      this.vy = 0;
      this.releaseSlot();
    }
  }

  die(dir) {
    this.alive = false;
    this.state = 'dying';
    this.stateT = 0;
    this.deathT = 0;
    this.vx = dir * 190;
    this.vz = 250;
    this.z = Math.max(this.z, 2);
    this.releaseSlot();
    this.game.addScore(this.def.score, this.x, this.y - 90);
    this.game.addKill();
    this.game.spawnExplosion(this.x, this.y, this.def.h * 0.55, typeColor(this.type));
    Sound.sfx('enemyDie');
    this.game.shake(4, 0.14);
    if (chance(this.def.dropChance)) this.game.stage.spawnItem(this.x, this.y);
  }

  releaseSlot() {
    if (this.hasSlot) this.game.releaseAttackSlot(this);
    this.hasSlot = false;
  }

  draw(ctx) {
    const g = this.game;
    const sx = this.x - g.camera.x;
    if (sx < -140 || sx > CFG.W + 140) return;
    const persp = 0.92 + (this.y - CFG.FLOOR_TOP) / (CFG.FLOOR_BOTTOM - CFG.FLOOR_TOP) * 0.10;
    const h = this.def.h * persp;

    const sprite = g.enemySprites[this.type];
    drawShadow(ctx, sx, this.y, (this.def.halfW * 2.1) * persp, this.z, 0.95);

    const footY = this.y - this.z;
    let spriteState = 'idle';
    let frame = null;
    let tilt = 0;
    let scaleX = 1;
    let scaleY = 1;
    let offsetY = 0;

    switch (this.state) {
      case 'chase':
      case 'spawn':
      case 'retreat':
      case 'charge':
        spriteState = 'walk';
        offsetY = -Math.abs(Math.sin(this.walkT * 10)) * 1.8;
        tilt = this.facing * 0.02
          + clamp((this.velX * this.facing) / 5000, -0.06, 0.06)
          + Math.sin(this.walkT * 10) * 0.012 * this.facing;
        scaleY = 1 + Math.sin(this.walkT * 20) * 0.005;
        if (this.state === 'charge') { tilt += this.facing * 0.18; scaleX = 1.08; }
        break;
      case 'windup':
      case 'chargeWind':
        spriteState = 'attack';
        frame = 0;
        tilt = -this.facing * 0.12;
        scaleX = 1.04;
        break;
      case 'attack':
        spriteState = 'attack';
        frame = 1;
        tilt = this.facing * 0.14;
        break;
      case 'hurt':
        spriteState = 'hurt';
        tilt = -this.facing * 0.18;
        break;
      case 'down':
      case 'getup':
        spriteState = 'hurt';
        scaleY = this.state === 'getup' ? 0.7 : 0.4;
        scaleX = 1.2;
        tilt = this.hurtDir * 0.18;
        break;
      case 'grabbed':
        spriteState = 'hurt';
        tilt = this.facing * 0.25;
        break;
      case 'thrown':
        spriteState = 'hurt';
        tilt = this.facing * (1.1 + this.stateT * 4);
        break;
      case 'dying':
        spriteState = 'hurt';
        scaleY = 0.5;
        scaleX = 1.2;
        tilt = this.hurtDir * 0.6;
        break;
      case 'stunned':
        spriteState = 'hurt';
        tilt = this.facing * 0.16;
        break;
      default:
        spriteState = 'idle';
        offsetY = -Math.sin(this.animT * 2) * 1.2;
        scaleY = 1 + Math.sin(this.animT * 2) * 0.006;
    }

    if (this.turnT > 0) {
      const k = this.turnT / 0.12;
      scaleX *= 1 - 0.24 * Math.sin(k * Math.PI);
    }
    if (this.landSquash > 0) {
      const s = this.landSquash / 0.16;
      scaleY *= 1 - 0.14 * s;
      scaleX *= 1 + 0.1 * s;
    }

    drawSprite(ctx, sprite, spriteState, spriteState === 'walk' ? this.walkT : this.animT, sx, footY + offsetY, {
      h,
      flip: this.facing < 0,
      frame: frame == null ? undefined : frame,
      actionT: this.stateT,
      actionFps: 9,
      tilt,
      sx: scaleX,
      sy: scaleY,
      flash: this.flash > 0,
      alpha: this.alpha,
      walkFps: 13,
      tint: 'rgba(255, 40, 40, 0.55)',
      tintAlpha: this.state === 'chargeWind' && Math.sin(this.stateT * 26) > 0 ? 0.5 : 0,
    });

    // attack telegraph
    if (this.state === 'windup' || this.state === 'chargeWind') {
      const blink = Math.sin(this.stateT * 30) > -0.2;
      if (blink) {
        const ay = footY - h - 22;
        ctx.save();
        ctx.fillStyle = '#ff3b5c';
        ctx.shadowColor = '#ff3b5c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(sx, ay - 12);
        ctx.lineTo(sx + 9, ay);
        ctx.lineTo(sx - 9, ay);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '900 12px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx, ay + 8);
        ctx.restore();
      }
    }

    // mini health bar
    if (this.hpBarT > 0 && this.alive) {
      const bw = 44;
      const bx = sx - bw / 2;
      const by = footY - h - 14;
      ctx.save();
      ctx.fillStyle = 'rgba(8,5,12,0.8)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
      ctx.fillStyle = '#2b0f18';
      ctx.fillRect(bx, by, bw, 4);
      const frac = clamp(this.hp / this.maxHp, 0, 1);
      ctx.fillStyle = frac > 0.5 ? '#6bff9a' : frac > 0.25 ? '#ffe066' : '#ff5a6e';
      ctx.fillRect(bx, by, bw * frac, 4);
      ctx.restore();
    }
  }
}
Enemy.counter = 0;

function typeColor(type) {
  return type === 'punk' ? '#ff5fae'
    : type === 'guard' ? '#5ad2ff'
    : type === 'bouncer' ? '#ff9f43'
    : type === 'orderly' ? '#7dffc4'
    : type === 'doctor' ? '#9fe8ff'
    : type === 'security' ? '#ff8a3d'
    : type === 'diner' ? '#ffb347'
    : type === 'tough' ? '#ff5fae'
    : type === 'streetbouncer' ? '#ffe066'
    : '#fff';
}

export { Enemy, typeColor };
