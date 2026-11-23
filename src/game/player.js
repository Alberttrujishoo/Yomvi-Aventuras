import { drawSprite } from '../media/sprite-renderer.js';
import { drawShadow, text } from '../engine/canvas.js';
import { CFG, approach, chance, clamp, rand, sign } from '../engine/math.js';
import { Particle } from '../engine/particle.js';
import { Input } from '../input/actions.js';
import { Sound } from '../media/audio.js';
import { RoxyBurgerShot, RoxyFallingBurger } from './roxy.js';
import { SpecialEffect } from './special-effect.js';

const CHARGED_ATTACK = 4;
const PLAYER_ATTACKS = [
  { dur: 0.27, hitAt: 0.095, dmg: 6, reach: 67, knock: 80, hitstop: 0.02, sound: 'punch1', heavy: false, frame: 0 },
  { dur: 0.29, hitAt: 0.105, dmg: 8, reach: 72, knock: 110, hitstop: 0.025, sound: 'punch2', heavy: false, frame: 1 },
  { dur: 0.50, hitAt: 0.20, dmg: 17, reach: 89, knock: 340, hitstop: 0.04, sound: 'heavy', heavy: true, frame: 2 },
  { dur: 0.34, hitAt: 0.10, dmg: 13, reach: 91, knock: 300, hitstop: 0.04, sound: 'heavy', heavy: true, frame: 2 },
  { dur: 0.6, hitAt: 0.16, dmg: 30, reach: 121, knock: 430, hitstop: 0.06, sound: 'heavy', heavy: true, frame: 2 },
];

class Player {
  constructor(game, x, y) {
    this.game = game;
    this.x = x; this.y = y; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.facing = 1;
    this.lastFacing = 1;
    this.turnT = 0;
    this.stepT = 0;
    this.baseMaxHp = 100;
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.level = 1;
    this.killsToLevel = 0;
    this.killsPerLevel = 5;
    this.attackMul = 1;
    this.defenseMul = 1;
    this.lives = 3;
    this.state = 'idle';
    this.stateT = 0;
    this.animT = 0;
    this.walkT = 0;
    this.invuln = 1.2;
    this.flash = 0;
    this.squash = 1;
    this.buffer = { attack: 0, chargedAttack: false, jump: 0, special: 0 };
    this.attackIndex = 0;
    this.attackT = 0;
    this.attackHit = new Set();
    this.comboCount = 0;
    this.comboTimer = 0;
    this.grabTarget = null;
    this.grabT = 0;
    this.dashT = 0;
    this.dashUsed = false;
    this.specialT = 0;
    this.specialTick = 0;
    this.specialEffect = null;
    this.downT = 0;
    this.deadT = 0;
    this.alive = true;
    this.airAttackHit = false;
    this.jumpHoldT = 0;
    this.landSquash = 0;
    this.specialCost = 12;
    this.hurtT = 0;
    this.muzzleT = 0;
    this.stats = { hits: 0, kills: 0, damage: 0 };
  }

  captureInput() {
    if (this.alive && Input.hit('chargedAttack')) this.buffer.chargedAttack = true;
    if (Input.hit('attack')) this.buffer.attack = 0.24;
    if (Input.hit('jump')) this.buffer.jump = 0.16;
    if (Input.hit('special')) this.buffer.special = 0.2;
  }

  tickBuffers(dt) {
    this.buffer.attack = Math.max(0, this.buffer.attack - dt);
    this.buffer.jump = Math.max(0, this.buffer.jump - dt);
    this.buffer.special = Math.max(0, this.buffer.special - dt);
  }

  get footY() { return this.y - this.z; }

  getSpecialCost() {
    return Math.max(1, this.specialCost / this.defenseMul);
  }

  registerKill() {
    this.killsToLevel++;
    if (this.stats) this.stats.kills = (this.stats.kills || 0) + 1;
    if (this.killsToLevel >= this.killsPerLevel) {
      this.killsToLevel -= this.killsPerLevel;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    const bonus = (this.level - 1) * 0.002; // +0.2% per level
    this.attackMul = 1 + bonus;
    this.defenseMul = 1 + bonus;
    const newMax = this.baseMaxHp * (1 + bonus);
    const gain = newMax - this.maxHp;
    this.maxHp = newMax;
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, gain) + 1);
    this.flash = Math.max(this.flash, 0.18);
    this.game.onPlayerLevelUp(this);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.flash = 0;
  }

  update(dt) {
    if (this.specialEffect && !this.specialEffect.update(dt)) this.specialEffect = null;
    this.stateT += dt;
    this.tickBuffers(dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.landSquash = Math.max(0, this.landSquash - dt);
    this.muzzleT = Math.max(0, this.muzzleT - dt);
    this.turnT = Math.max(0, this.turnT - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.comboCount = 0;

    if (!this.alive) {
      this.updateDead(dt);
      return;
    }

    if (this.state === 'down') {
      this.updateDown(dt);
      return;
    }

    if (this.state === 'grab') {
      this.updateGrab(dt);
      this.updateAir(dt);
      return;
    }

    // Jump physics / state
    this.updateAir(dt);

    switch (this.state) {
      case 'idle':
      case 'walk':
        this.updateGround(dt);
        break;
      case 'jump':
        this.updateJump(dt);
        break;
      case 'dash':
        this.updateDash(dt);
        break;
      case 'attack':
        this.updateAttack(dt);
        break;
      case 'airAttack':
        this.updateAirAttack(dt);
        break;
      case 'special':
        this.updateSpecial(dt);
        break;
      case 'hurt':
        this.updateHurt(dt);
        break;
      case 'getup':
        if (this.stateT > 0.4) this.setState('idle');
        break;
      default:
        this.setState('idle');
    }

    // keep inside playfield
    const g = this.game;
    this.x = clamp(this.x, g.minX() + 18, g.maxX() - 18);
    this.y = approach(this.y, clamp(this.y, CFG.FLOOR_TOP, CFG.FLOOR_BOTTOM), 400 * dt);

    if (this.facing !== this.lastFacing) {
      this.lastFacing = this.facing;
      this.turnT = 0.13;
    }
  }

  updateDead(dt) {
    this.deadT += dt;
    if (this.z > 0 || this.vz > 0) {
      this.z += this.vz * dt;
      this.vz -= CFG.GRAVITY * dt;
      this.x += this.vx * dt;
      this.vx *= Math.max(0, 1 - 2 * dt);
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
      }
    }
  }

  updateDown(dt) {
    this.downT -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - 3.2 * dt);
    this.vy *= Math.max(0, 1 - 4 * dt);
    if (this.z > 0 || this.vz > 0) {
      this.z += this.vz * dt;
      this.vz -= CFG.GRAVITY * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        this.landSquash = 0.12;
        this.game.shake(3, 0.08);
        Sound.sfx('land');
      }
    }
    if (this.downT <= 0 && this.z <= 0) {
      this.state = 'getup';
      this.stateT = 0;
      this.invuln = Math.max(this.invuln, 1.25);
    }
  }

  updateAir(dt) {
    if (this.z > 0 || this.vz > 0) {
      this.z += this.vz * dt;
      this.vz -= CFG.GRAVITY * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        this.landSquash = 0.1;
        this.game.spawnDust(this.x, this.y, 6);
        Sound.sfx('land');
        if (this.state === 'airAttack') {
          this.state = 'idle';
          this.stateT = 0;
        } else if (this.state === 'jump') {
          this.state = 'idle';
          this.stateT = 0;
        }
      }
    }
  }

  setState(s) {
    this.state = s;
    this.stateT = 0;
  }

  updateGround(dt) {
    const ix = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0);
    const iy = (Input.down('down') ? 1 : 0) - (Input.down('up') ? 1 : 0);
    const slippery = this.game.stage.isSlippery(this.x);
    const speed = 248;
    let tx = ix * speed;
    let ty = iy * speed * 0.62;
    if (ix && iy) { tx *= 0.84; ty *= 0.84; }

    const accel = slippery ? 900 : 2100;
    const decel = slippery ? 220 : 2500;
    this.vx = approach(this.vx, tx, (ix ? accel : decel) * dt);
    this.vy = approach(this.vy, ty, (iy ? accel : decel) * dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (ix !== 0) this.facing = ix;

    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 16) {
      this.state = 'walk';
      this.walkT += dt * clamp(spd / 190, 0.5, 1.5);
      this.animT += dt * clamp(spd / 165, 0.6, 1.5);

      this.stepT += dt * (spd / 240);
      if (this.stepT > 0.26) {
        this.stepT = 0;
        if (this.game.stage.isSlippery(this.x)) {
          this.game.spawnSparks(this.x - this.facing * 8, this.y, 2, 2, 'ice');
        } else {
          this.game.spawnDust(this.x - this.facing * 10, this.y, 1);
        }
      }
    } else {
      this.state = 'idle';
      this.stepT = 0;
      this.animT += dt;
    }

    if (this.buffer.chargedAttack) {
      this.buffer.chargedAttack = false;
      this.startAttack(CHARGED_ATTACK);
      return;
    }

    if (this.buffer.special > 0) {
      if (this.hp > this.getSpecialCost()) {
        this.buffer.special = 0;
        this.startSpecial();
        return;
      }
    }

    if (this.buffer.attack > 0) {
      this.buffer.attack = 0;
      if (!this.game.roxyMode && this.tryGrab()) return;
      this.startAttack(0);
      return;
    }

    if (this.buffer.jump > 0) {
      this.buffer.jump = 0;
      this.startJump();
      return;
    }

    if (Input.dash && !this.dashUsed) {
      this.dashUsed = true;
      this.startDash(Input.dash);
    }
    if (!Input.dash) this.dashUsed = false;
  }

  startJump() {
    this.z = Math.max(this.z, 1);
    this.vz = 560;
    this.setState('jump');
    Sound.sfx('jump');
    this.game.spawnDust(this.x, this.y, 4);
  }

  startDash(dir) {
    this.setState('dash');
    this.facing = dir;
    this.dashT = 0.24;
    this.vx = dir * 640;
    this.vy = 0;
    Sound.noise(0.18, 0.08, 'bandpass', 800, 2200);
    this.game.spawnDust(this.x, this.y, 5);
  }

  updateJump(dt) {
    const ix = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0);
    const iy = (Input.down('down') ? 1 : 0) - (Input.down('up') ? 1 : 0);
    this.vx = approach(this.vx, ix * 235, 1250 * dt);
    this.vy = approach(this.vy, iy * 145, 1000 * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.walkT += dt * 2;
    if (this.buffer.attack > 0) {
      this.buffer.attack = 0;
      this.state = 'airAttack';
      this.stateT = 0;
      this.attackT = 0;
      this.airAttackHit = false;
      Sound.sfx('punch1');
    }
  }

  updateDash(dt) {
    this.dashT -= dt;
    this.x += this.vx * dt;
    this.vx = approach(this.vx, this.facing * 240, 900 * dt);
    if (chance(0.7)) {
      this.game.particles.push(new Particle({
        x: this.x - this.facing * 18, y: this.y, z: this.z + rand(10, 70),
        vx: -this.facing * 30, vy: 0, vz: 10, life: 0.22,
        size: rand(3, 7), color: 'rgba(255,224,102,0.55)', gravity: 0, kind: 'pixel',
      }));
    }
    if (this.buffer.attack > 0) {
      this.buffer.attack = 0;
      this.startAttack(3);
      return;
    }
    if (this.dashT <= 0) this.setState('idle');
  }

  startAttack(index) {
    this.setState('attack');
    this.attackIndex = index;
    this.attackT = 0;
    this.attackHit.clear();
    this.facing = this.facing || 1;
    Sound.sfx(index >= 2 ? 'punch2' : 'punch1');
  }

  updateAttack(dt) {
    const a = PLAYER_ATTACKS[this.attackIndex];
    this.attackT += dt;

    if (this.attackIndex === CHARGED_ATTACK) {
      this.x += this.facing * 275 * dt * Math.max(0, 1 - this.attackT / a.hitAt);
    } else if (this.attackIndex === 3) {
      this.x += this.facing * 420 * dt * Math.max(0, 1 - this.attackT / 0.2);
    } else if (this.attackT < 0.09) {
      this.x += this.facing * 70 * dt;
    }

    if (this.attackT >= a.hitAt && !this.attackHit.has('swing')) {
      this.attackHit.add('swing');
      this.performHit(this.attackIndex);
    }

    if (this.attackT >= a.dur) {
      if (this.buffer.attack > 0 && this.attackIndex < 2) {
        this.buffer.attack = 0;
        this.startAttack(this.attackIndex + 1);
        return;
      }
      this.setState('idle');
    }
  }

  performHit(index) {
    if (this.game.roxyMode) {
      this.fireRoxyBurger(index);
      return;
    }
    const a = PLAYER_ATTACKS[index];
    const dir = this.facing;
    const g = this.game;
    const attackY = this.z;
    const dmg = a.dmg * this.attackMul;

    // slash visual
    g.addSlash(this.x + dir * 31, this.y, attackY + 74, dir, a.heavy);
    Sound.sfx(a.sound);

    let didHit = false;
    const hitTarget = (target, isProp) => {
      const dy = Math.abs(target.y - this.y);
      const dx = (target.x - this.x) * dir;
      const reach = isProp ? 30 : 0;
      const zTol = isProp ? 70 : 52;
      if (dy <= (isProp ? 26 : 27) &&
          dx > -14 - reach && dx < a.reach + reach &&
          Math.abs((target.z || 0) - attackY) < zTol) {
        return true;
      }
      return false;
    };

    for (const e of g.enemies.slice()) {
      if (!e.alive) continue;
      if (this.attackHit.has(e)) continue;
      if (hitTarget(e)) {
        this.attackHit.add(e);
        e.takeHit(dmg, dir, { knock: a.knock, heavy: a.heavy, source: this });
        didHit = true;
        this.registerHit(dmg, a.heavy);
      }
    }

    const boss = g.boss;
    if (boss && boss.alive && boss.active && !this.attackHit.has(boss)) {
      if (Math.abs(boss.y - this.y) < 34 && (boss.x - this.x) * dir > -34 && (boss.x - this.x) * dir < a.reach + 34 && Math.abs(boss.z - attackY) < 70) {
        this.attackHit.add(boss);
        boss.takeHit(dmg, dir, { knock: a.knock, heavy: a.heavy });
        didHit = true;
        this.registerHit(dmg, a.heavy);
      }
    }

    for (const prop of g.stage.props) {
      if (prop.dead) continue;
      if (this.attackHit.has(prop)) continue;
      if (hitTarget(prop, true)) {
        this.attackHit.add(prop);
        g.stage.hitProp(prop, 1, g);
        didHit = true;
      }
    }

    if (didHit) {
      g.hitstop(a.hitstop);
      g.shake(a.heavy ? 7 : 3, a.heavy ? 0.18 : 0.08);
    } else {
      g.shake(a.heavy ? 3 : 1, 0.06);
    }
  }

  fireRoxyBurger(index) {
    const a = PLAYER_ATTACKS[index];
    const g = this.game;
    const dir = this.facing;
    const dmg = a.dmg * 2 * this.attackMul;
    const muzzleX = this.x + dir * 40;

    g.projectiles.push(new RoxyBurgerShot(g, muzzleX, this.y, dir, dmg, this));
    this.muzzleT = 0.09;
    this.attackHit.add('swing');
    Sound.sfx('shotgun');
    g.shake(4, 0.1);
    g.spawnSparks(muzzleX, this.y, 64, 7, 'gold');
  }

  registerHit(dmg, heavy) {
    this.stats.hits++;
    this.comboCount++;
    this.comboTimer = 1.9;
    this.game.comboCount = this.comboCount;
    this.game.comboTimer = 1.9;
    this.game.addScore(heavy ? 30 : 10);
    if (this.comboCount >= 3) {
      this.game.comboFlash = 1;
    }
  }

  updateAirAttack(dt) {
    this.attackT += dt;
    this.vx = approach(this.vx, this.facing * 120, 500 * dt);
    this.x += this.vx * dt;
    if (this.z > 10 && !this.airAttackHit && this.attackT > 0.04) {
      this.airAttackHit = true;
      const g = this.game;
      const dir = this.facing;
      g.addSlash(this.x + dir * 24, this.y, this.z + 46, dir, false);
      const dmg = 12 * this.attackMul;
      const bossDmg = 14 * this.attackMul;
      for (const e of g.enemies.slice()) {
        if (!e.alive) continue;
        if (Math.abs(e.y - this.y) < 30 && (e.x - this.x) * dir > -18 && (e.x - this.x) * dir < 86 && Math.abs(e.z - this.z) < 62) {
          e.takeHit(dmg, dir, { knock: 240, heavy: false, source: this });
          this.registerHit(dmg, false);
          g.hitstop(0.03);
        }
      }
      const boss = g.boss;
      if (boss && boss.alive && boss.active &&
          Math.abs(boss.y - this.y) < 36 && (boss.x - this.x) * dir > -22 && (boss.x - this.x) * dir < 108 && Math.abs(boss.z - this.z) < 80) {
        boss.takeHit(bossDmg, dir, { knock: 200, heavy: false });
        this.registerHit(bossDmg, false);
        g.hitstop(0.03);
      }
      for (const prop of g.stage.props) {
        if (prop.dead) continue;
        if (Math.abs(prop.y - this.y) < 26 && (prop.x - this.x) * dir > -22 && (prop.x - this.x) * dir < 100) {
          g.stage.hitProp(prop, 1, g);
        }
      }
      g.shake(4, 0.1);
      Sound.sfx('punch2');
    }
  }

  startSpecial() {
    if (this.game.roxyMode) {
      this.setState('special');
      this.hp -= this.getSpecialCost();
      this.invuln = 1.05;
      this.specialT = 0.9;
      this.specialTick = 0;
      this.vx = 0;
      this.vy = 0;
      this.muzzleT = 0.16;
      Sound.sfx('special');
      this.game.shake(10, 0.5);
      this.game.spawnBurst(this.x, this.y, 34, '#ff5fae');
      this.game.ringText('¡LLUVIA DE HAMBURGUESAS!', this.x, this.y - 170, '#ff5fae');
      this.startRoxyRain();
      return;
    }

    this.setState('special');
    this.hp -= this.getSpecialCost();
    this.invuln = 1.05;
    this.specialT = 0.62;
    this.specialTick = 0;
    this.vx = 0; this.vy = 0;
    const { renderScale, reducedMotion } = this.game;
    const compact = renderScale < 1;
    this.specialEffect = new SpecialEffect(this.x, this.footY, { compact, reducedMotion });
    Sound.sfx('special');
    if (!reducedMotion) {
      this.game.shake(8, 0.4);
      this.game.spawnBurst(this.x, this.y, compact ? 22 : 34, '#ffe066');
    }
  }

  startRoxyRain() {
    const g = this.game;
    const dmg = PLAYER_ATTACKS[0].dmg * 3 * this.attackMul;
    const targets = [];

    for (const e of g.enemies) {
      if (!e.alive) continue;
      targets.push({ x: e.x, y: e.y });
      targets.push({ x: e.x + rand(-26, 26), y: e.y + rand(-12, 12) });
    }

    const boss = g.boss;
    if (boss && boss.alive && boss.active) {
      for (let i = 0; i < 3; i++) {
        targets.push({ x: boss.x + rand(-46, 46), y: boss.y + rand(-18, 18) });
      }
    }

    const cam = g.camera.x;
    for (let i = 0; i < 6; i++) {
      targets.push({
        x: cam + rand(70, CFG.W - 70),
        y: rand(CFG.FLOOR_TOP + 20, CFG.FLOOR_BOTTOM - 10),
      });
    }

    targets.slice(0, 26).forEach((t, i) => {
      g.projectiles.push(new RoxyFallingBurger(g, t.x, t.y, i * 0.05 + rand(0, 0.1), dmg, this));
    });
  }

  updateSpecial(dt) {
    if (this.game.roxyMode) {
      this.specialT -= dt;
      if (this.specialT <= 0) {
        this.setState('idle');
        this.squash = 0.9;
      }
      return;
    }
    this.specialT -= dt;
    this.specialTick -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.9;
    if (this.specialTick <= 0) {
      this.specialTick = 0.16;
      const g = this.game;
      const dmg = 10 * this.attackMul;
      const bossDmg = 9 * this.attackMul;
      for (const e of g.enemies.slice()) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - this.x, (e.y - this.y) * 1.3) < 130 && Math.abs(e.z - this.z) < 60) {
          e.takeHit(dmg, sign(e.x - this.x) || this.facing, { knock: 300, heavy: true, source: this });
          this.registerHit(dmg, false);
        }
      }
      const boss = g.boss;
      if (boss && boss.alive && boss.active && Math.hypot(boss.x - this.x, (boss.y - this.y) * 1.2) < 144) {
        boss.takeHit(bossDmg, sign(boss.x - this.x) || this.facing, { knock: 160, heavy: false });
        this.registerHit(bossDmg, false);
      }
      for (const prop of g.stage.props) {
        if (!prop.dead && Math.hypot(prop.x - this.x, (prop.y - this.y) * 1.3) < 120) {
          g.stage.hitProp(prop, 1, g);
        }
      }
      if (!g.reducedMotion) g.spawnSparks(this.x + rand(-50, 50), this.y, 40 + rand(0, 30), 4, 'gold');
    }
    if (this.specialT <= 0) {
      this.setState('idle');
      this.squash = 0.9;
    }
  }

  tryGrab() {
    const g = this.game;
    let best = null;
    let bestD = 999;
    for (const e of g.enemies) {
      if (!e.alive || !e.def.canGrab) continue;
      if (e.state === 'down' || e.state === 'getup' || e.state === 'dying') continue;
      if (e.state !== 'hurt' && e.stunTimer <= 0) continue;
      const dy = Math.abs(e.y - this.y);
      const dx = Math.abs(e.x - this.x);
      if (dy < 32 && dx < 50 && e.z < 24 && dx < bestD) {
        best = e;
        bestD = dx;
      }
    }
    if (!best) return false;
    this.grab(best);
    return true;
  }

  grab(enemy) {
    this.setState('grab');
    this.grabTarget = enemy;
    this.grabT = 2.0;
    this.facing = sign(enemy.x - this.x) || this.facing;
    this.vx = 0;
    this.vy = 0;
    enemy.state = 'grabbed';
    enemy.stateT = 0;
    enemy.grabbedBy = this;
    enemy.vx = 0; enemy.vy = 0;
    enemy.z = 16;
    Sound.sfx('grab');
    this.game.ringText('¡AGARRE!', this.x, this.y - 140, '#ffe066');
  }

  updateGrab(dt) {
    const e = this.grabTarget;
    if (!e || !e.alive || e.state !== 'grabbed') {
      this.grabTarget = null;
      this.setState('idle');
      return;
    }
    this.grabT -= dt;
    e.x = this.x + this.facing * 26;
    e.y = this.y + 3;
    e.z = 18;
    e.facing = -this.facing;
    e.animT += dt * 6;

    // Throw with jump key, or by holding away + attack
    const away = (this.facing > 0 && Input.down('left')) || (this.facing < 0 && Input.down('right'));
    if (this.buffer.jump > 0 || (away && this.buffer.attack > 0)) {
      this.buffer.jump = 0;
      this.buffer.attack = 0;
      this.throwTarget(e);
      return;
    }

    if (this.buffer.attack > 0) {
      this.buffer.attack = 0;
      e.takeHit(8 * this.attackMul, this.facing, { knock: 0, heavy: false, source: this, isGrabHit: true });
      this.grabT = Math.min(2.4, this.grabT + 0.55);
      this.registerHit(8 * this.attackMul, false);
      this.game.hitstop(0.03);
      this.game.shake(4, 0.1);
      Sound.sfx('punch2');
      if (!e.alive) this.releaseGrab();
      return;
    }

    if (this.grabT <= 0) this.releaseGrab();
  }

  throwTarget(e) {
    e.state = 'thrown';
    e.stateT = 0;
    e.grabbedBy = null;
    e.vx = this.facing * 560;
    e.vy = 0;
    e.vz = 300;
    e.z = 24;
    e.throwDamage = 18 * this.attackMul;
    e.throwDir = this.facing;
    e.hasHitOther = false;
    this.grabTarget = null;
    this.setState('idle');
    this.invuln = Math.max(this.invuln, 0.25);
    Sound.sfx('throw');
    this.game.shake(3, 0.1);
    this.game.addScore(50);
  }

  releaseGrab() {
    if (this.grabTarget && this.grabTarget.state === 'grabbed') {
      this.grabTarget.state = 'chase';
      this.grabTarget.stateT = 0;
      this.grabTarget.grabbedBy = null;
    }
    this.grabTarget = null;
    this.setState('idle');
  }

  updateHurt(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - 6 * dt);
    this.vy *= Math.max(0, 1 - 6 * dt);
    if (this.stateT > this.hurtT) this.setState('idle');
  }

  takeHit(dmg, fromX, o = {}) {
    if (!this.alive || this.game.state !== 'playing') return;
    if (this.invuln > 0 || this.state === 'down' || this.state === 'dead') return;

    if (this.state === 'grab') this.releaseGrab();

    const finalDmg = dmg / this.defenseMul;
    this.hp -= finalDmg;
    this.stats.damage += finalDmg;
    this.flash = 0.14;
    this.invuln = 0.82;
    this.game.damageFlash = 0.32;
    this.game.shake(o.heavy ? 9 : 5, o.heavy ? 0.25 : 0.12);
    this.game.hitstop(o.heavy ? 0.04 : 0.02);
    Sound.sfx(o.heavy ? 'heavy' : 'hit');
    this.game.spawnSparks(this.x, this.y, this.z + 84, o.heavy ? 10 : 6, 'hit');
    this.game.ringText('-' + Math.max(1, Math.round(finalDmg)), this.x, this.y - 120, '#ff5a6e');

    const dir = sign(this.x - fromX) || -this.facing;
    if (this.hp <= 0) {
      this.die(dir);
      return;
    }

    if (o.heavy || dmg >= 13) {
      this.state = 'down';
      this.stateT = 0;
      this.downT = 0.95;
      this.vx = dir * 210;
      this.vz = 300;
      this.z = Math.max(this.z, 2);
      this.grabTarget = null;
    } else {
      this.state = 'hurt';
      this.stateT = 0;
      this.hurtT = 0.26;
      this.vx = dir * 240;
      this.vy = 0;
    }
  }

  die(dir) {
    this.specialEffect = null;
    this.alive = false;
    this.state = 'dead';
    this.deadT = 0;
    this.hp = 0;
    this.vx = dir * 170;
    this.vz = 280;
    this.game.onPlayerDeath();
  }

  draw(ctx) {
    const g = this.game;
    const sx = this.x - g.camera.x;
    const persp = 0.92 + (this.y - CFG.FLOOR_TOP) / (CFG.FLOOR_BOTTOM - CFG.FLOOR_TOP) * 0.10;
    const h = 122 * persp * CFG.CHAR_SCALE;
    const footY = this.y - this.z;

    drawShadow(ctx, sx, this.y, 46 * persp * CFG.CHAR_SCALE, this.z, this.alive ? 1 : 0.7);

    if (!this.alive) {
      const t = this.deadT;
      drawSprite(ctx, g.heroSprite, 'hurt', 0, sx, footY, {
        h: h * 0.9,
        flip: this.facing < 0,
        sy: 0.55,
        sx: 1.18,
        tilt: this.facing * 0.25,
        alpha: clamp(1 - t / 2.0, 0, 1),
        flash: t < 0.12,
      });
      return;
    }

    let spriteState = 'idle';
    let frame = null;
    let tilt = 0;
    let scaleX = 1;
    let scaleY = 1;
    let offsetY = 0;
    let yLift = 0;

    switch (this.state) {
      case 'walk':
        spriteState = 'walk';
        offsetY = -Math.abs(Math.sin(this.walkT * 10)) * 1.8;
        tilt = this.facing * 0.025
          + clamp((this.vx * this.facing) / 7000, -0.05, 0.05)
          + Math.sin(this.walkT * 10) * 0.012 * this.facing;
        scaleY = 1 + Math.sin(this.walkT * 20) * 0.005;
        break;
      case 'attack': {
        spriteState = 'attack';
        const nAtk = (g.heroSprite.frames.attack || [1]).length;
        frame = Math.min(this.attackIndex, nAtk - 1);
        tilt = this.facing * (this.attackIndex >= 2 ? 0.10 : 0.05);
        offsetY = this.attackIndex >= 2 ? 2 : 0;
        break;
      }
      case 'airAttack':
        spriteState = 'jump';
        tilt = this.facing * 0.28;
        scaleY = 1.02;
        break;
      case 'jump':
        spriteState = 'jump';
        tilt = clamp(-this.vz / 2600, -0.14, 0.14) * this.facing;
        scaleY = 1.05;
        scaleX = 0.97;
        break;
      case 'dash':
        spriteState = 'walk';
        tilt = this.facing * 0.22;
        scaleX = 1.08;
        scaleY = 0.94;
        break;
      case 'special':
        if (g.roxyMode) {
          spriteState = 'attack';
          frame = 1;
          tilt = this.facing * 0.05;
          scaleX = 1;
          offsetY = 0;
        } else {
          spriteState = 'special';
          tilt = 0;
          scaleX = 0.34 + Math.abs(Math.cos(this.stateT * 22)) * 0.9;
          offsetY = -4;
        }
        break;
      case 'hurt':
        spriteState = 'hurt';
        tilt = -this.facing * 0.16;
        scaleX = 1.06;
        break;
      case 'down':
        spriteState = 'hurt';
        scaleY = 0.42;
        scaleX = 1.24;
        tilt = this.facing * 0.16;
        offsetY = -2;
        break;
      case 'getup':
        spriteState = 'hurt';
        scaleY = 0.7 + (this.stateT / 0.4) * 0.3;
        scaleX = 1.1;
        offsetY = -4;
        break;
      case 'grab':
        spriteState = 'attack';
        frame = 1;
        tilt = this.facing * 0.04;
        break;
      default:
        spriteState = 'idle';
        offsetY = -Math.sin(this.animT * 2.2) * 1.2;
        scaleY = 1 + Math.sin(this.animT * 2.2) * 0.006;
        tilt = Math.sin(this.animT * 1.4) * 0.004 * this.facing;
    }

    if (this.landSquash > 0) {
      const s = this.landSquash / 0.1;
      scaleY *= 1 - 0.16 * s;
      scaleX *= 1 + 0.14 * s;
    }
    if (this.turnT > 0) {
      const k = this.turnT / 0.13;
      scaleX *= 1 - 0.28 * Math.sin(k * Math.PI);
    }
    scaleY *= this.squash;
    if (this.state === 'special') yLift = g.roxyMode ? 0 : -6;

    const blink = this.invuln > 0 && this.state !== 'down' && this.state !== 'special';
    const alpha = blink ? (Math.sin(this.stateT * 38 + this.animT * 20) > 0 ? 0.45 : 1) : 1;

    const charge = g.state === 'playing' ? Input.chargeProgress() : 0;
    if (charge > 0) {
      const barY = Math.max(82, footY - h - 17);
      ctx.fillStyle = '#110a20';
      ctx.fillRect(sx - 24, barY, 48, 6);
      ctx.fillStyle = charge >= 1 ? '#ffe066' : '#7dffc4';
      ctx.fillRect(sx - 23, barY + 1, 46 * charge, 4);
      text(ctx, charge >= 1 ? 'LISTO' : 'CARGA', sx, barY - 4, 12, '#fff0b0', { align: 'center' });
    }

    this.specialEffect?.drawBehind(ctx, g.camera.x);
    drawSprite(ctx, g.heroSprite, spriteState, this.animT, sx, footY + offsetY + yLift, {
      h,
      flip: this.facing < 0,
      frame: frame == null ? undefined : frame,
      actionT: this.state === 'attack' ? this.attackT : this.stateT,
      actionFps: this.state === 'attack' ? 14 : 8,
      tilt,
      sx: scaleX,
      sy: scaleY,
      flash: this.flash > 0,
      alpha,
      walkFps: 7,
      glow: this.state === 'special' ? (g.roxyMode ? '#ff5fae' : '#ffe066') : (this.invuln > 0 ? '#ffe066' : null),
      glowSize: 12,
    });

    this.drawShotgun(ctx, sx, footY, h);

    this.specialEffect?.drawFront(ctx, g.camera.x);
  }

  drawShotgun(ctx, sx, footY, h) {
    const g = this.game;
    if (!g.roxyMode) return;
    if (!this.alive || this.state === 'down' || this.state === 'getup' || this.state === 'hurt') return;

    const scale = h / 150;
    const up = this.state === 'special';
    ctx.save();
    ctx.translate(sx + this.facing * 12 * scale, footY - h * 0.55);
    ctx.scale(this.facing * scale, scale);
    if (up) ctx.rotate(-1.05);

    // wooden stock
    ctx.fillStyle = '#6b3b24';
    ctx.beginPath();
    ctx.moveTo(-24, -3);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-8, 5);
    ctx.lineTo(-19, 4);
    ctx.closePath();
    ctx.fill();

    // receiver
    ctx.fillStyle = '#2b2b36';
    ctx.fillRect(-9, -5, 16, 10);
    ctx.fillStyle = '#4a4d59';
    ctx.fillRect(-9, -5, 16, 2);

    // barrel
    ctx.fillStyle = '#5a5f6c';
    ctx.fillRect(7, -4, 30, 5);
    ctx.fillStyle = '#9aa0ac';
    ctx.fillRect(7, -4, 30, 2);
    ctx.fillStyle = '#3b3e48';
    ctx.fillRect(35, -4, 3, 5);

    // pump
    ctx.fillStyle = '#8a4a26';
    ctx.fillRect(10, 1, 12, 4);
    ctx.fillStyle = '#b06a3a';
    ctx.fillRect(10, 1, 12, 1);

    // sight
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(30, -6, 3, 2);

    // muzzle flash
    if (this.muzzleT > 0) {
      ctx.save();
      ctx.translate(40, -1);
      ctx.globalAlpha = Math.min(1, this.muzzleT / 0.16 + 0.3);
      ctx.fillStyle = '#fff3b0';
      ctx.shadowColor = '#ff8a3d';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(17, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(17, 11);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff5fae';
      ctx.fillRect(-2, -2, 6, 4);
      ctx.restore();
    }
    ctx.restore();
  }
}

export { Player };
