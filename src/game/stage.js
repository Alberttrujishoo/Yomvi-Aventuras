import { drawShadow } from '../engine/canvas.js';
import { CFG, TAU, chance, choice, rand } from '../engine/math.js';
import { Sound } from '../media/audio.js';
import { Art } from '../media/procedural-art.js';

// Shared scene state, props, pickups, and drawing. Level backdrops live under levels/.

const PROP_DEFS = {
  bench: { sprite: 'bench', h: 36, hw: 38, hp: 2, drops: 0.8, score: 50 },
  trash: { sprite: 'trash', h: 48, hw: 20, hp: 1, drops: 0.9, score: 25 },
  palm: { sprite: 'palm', h: 168, hw: 36, hp: 3, drops: 0.75, score: 100 },
  planter: { sprite: 'planter', h: 54, hw: 24, hp: 1, drops: 0.65, score: 25 },
  crate: { sprite: 'crate', h: 44, hw: 26, hp: 2, drops: 0.85, score: 50 },
  stool: { sprite: 'stool', h: 40, hw: 18, hp: 1, drops: 0.6, score: 25 },
  medcart: { sprite: 'medcart', h: 56, hw: 26, hp: 2, drops: 0.9, score: 75 },
  bin: { sprite: 'bin', h: 52, hw: 20, hp: 1, drops: 0.85, score: 25 },
  chair: { sprite: 'chair', h: 40, hw: 22, hp: 1, drops: 0.35, score: 20 },
  iv: { sprite: 'iv', h: 100, hw: 18, hp: 1, drops: 0.5, score: 50 },
  gurney: { sprite: 'gurney', h: 46, hw: 40, hp: 2, drops: 0.65, score: 60 },
  trashcan: { sprite: 'trashcan', h: 50, hw: 20, hp: 1, drops: 0.95, score: 30 },
  cooler: { sprite: 'cooler', h: 36, hw: 28, hp: 2, drops: 1.0, score: 75 },
  streettable: { sprite: 'streettable', h: 44, hw: 34, hp: 2, drops: 0.8, score: 50 },
  burgercouch: { sprite: 'burgercouch', h: 56, hw: 44, hp: 3, drops: 0.85, score: 120 },
  burgertable: { sprite: 'burgertable', h: 46, hw: 34, hp: 2, drops: 0.75, score: 80 },
};

const PICKUPS = {
  'pastelito': { sprite: 'pastelito', heal: 28, score: 100, label: 'PASTELITO +28' },
  'tequeño': { sprite: 'tequeño', heal: 18, score: 75, label: 'TEQUEÑO +18' },
  'soda': { sprite: 'soda', heal: 12, score: 50, label: 'REFRESCO +12' },
  'firstaid': { sprite: 'firstaid', heal: 35, score: 150, label: 'BOTIQUÍN +35' },
  'juice': { sprite: 'juice', heal: 15, score: 60, label: 'JUGO +15' },
  'burger': { sprite: 'burger', heal: 40, score: 200, label: 'HAMBURGUESA +40' },
  'hotdog': { sprite: 'hotdog', heal: 30, score: 150, label: 'PERRO CALIENTE +30' },
};

class Stage {
  constructor(game, scenery) {
    this.game = game;
    this.scenery = scenery;
    this.zones = scenery.zones;
    this.width = this.zones.at(-1).end;
    this.props = [];
    this.items = [];
    this.bounceT = 0;
    this.time = 0;
    this.decor = [];

    for (const layer of scenery.layers) this[layer] = [];
    scenery.init?.(this);
    this.canvases = scenery.backgrounds.map(build => build(this));
    scenery.buildProps(this);
    this.gates = scenery.gates.map(([x, ...appearance]) => ({
      x, canvas: scenery.buildGate(this, ...appearance),
    }));
  }

  zoneAt(x) {
    for (const z of this.zones) if (x >= z.start && x < z.end) return z;
    return this.zones[this.zones.length - 1];
  }

  isSlippery(x) {
    return this.scenery.isSlippery?.(x) ?? false;
  }

  addProp(type, x, y, extra = {}) {
    const def = PROP_DEFS[type];
    this.props.push({
      type,
      def,
      x,
      y,
      hp: def.hp,
      maxHp: def.hp,
      dead: false,
      flash: 0,
      wobble: rand(0, TAU),
      ...extra,
    });
  }

  spawnItem(x, y, forcedType = null, { recovery = false } = {}) {
    const type = forcedType || choice(this.scenery.itemPool);
    const item = {
      type,
      recovery,
      def: PICKUPS[type],
      x,
      y,
      z: 14,
      vz: 120,
      seed: rand(0, TAU),
      life: recovery ? 14 : 26,
      dead: false,
      justSpawned: 0,
    };
    this.items.push(item);
    return item;
  }

  breakProp(prop, game) {
    if (prop.dead) return;
    prop.dead = true;
    game.spawnDebris(prop.x, prop.y, prop.type);
    game.shake(5, 0.18);
    game.addScore(prop.def.score, prop.x, prop.y - 30);
    if (chance(prop.def.drops)) {
      this.spawnItem(prop.x, prop.y, this.scenery.pickDrop?.());
    }
  }

  hitProp(prop, dmg, game) {
    if (prop.dead) return;
    prop.hp -= dmg;
    prop.flash = 0.12;
    prop.wobble = rand(0, TAU);
    game.spawnSparks(prop.x, prop.y, prop.def.h * 0.45, 4, 'wood');
    if (prop.hp <= 0) this.breakProp(prop, game);
    else game.shake(2, 0.08);
  }

  update(dt, game) {
    this.time += dt;
    if (this.bounceT > 0) this.bounceT = Math.max(0, this.bounceT - dt);

    // props flash decay
    for (const p of this.props) {
      if (p.flash > 0) p.flash -= dt;
      if (p.dead) continue;
    }

    // items float, collect, expire
    for (const it of this.items) {
      if (it.dead) continue;
      it.life -= dt;
      it.justSpawned += dt;
      it.z += it.vz * dt;
      it.vz -= 700 * dt;
      if (it.z < 0) {
        it.z = 0;
        it.vz = Math.abs(it.vz) > 60 ? -it.vz * 0.45 : 0;
      }
      const pl = game.player;
      if (pl?.alive && (!it.recovery || pl.hp < pl.maxHp) &&
          Math.abs(pl.x - it.x) < 30 && Math.abs(pl.y - it.y) < 26 && it.z < 30) {
        it.dead = true;
        pl.heal(it.def.heal);
        Sound.sfx('heal');
        game.spawnSparks(it.x, it.y - 20, 0, 8, 'heal');
        game.ringText(it.def.label, it.x, it.y - 40, '#7dffc4');
        if (!it.recovery) game.addScore(it.def.score, it.x, it.y - 60);
      }
      if (it.life <= 0) it.dead = true;
    }
    this.items = this.items.filter(i => !i.dead);

    this.scenery.update?.(this, dt);

    // prune props so sorting stays cheap (keep corpses for a beat)
    if (this.props.length > 60) this.props = this.props.filter(p => !p.dead);
  }

  /* ==========================================================
     DRAWING
     ========================================================== */
  drawBack(ctx, camX, time) {
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      const x = z.start - camX;
      if (x > CFG.W || x + (z.end - z.start) < 0) continue;
      const canvas = this.canvases[i];
      const scale = this.game.renderScale;
      ctx.drawImage(canvas, x, 0, canvas.width / scale, CFG.H);
    }

    // zone-transition doorways (mask the seam between backdrops)
    for (const gate of this.gates || []) {
      const gx = gate.x - camX;
      if (gx > CFG.W || gx + gate.canvas.width < 0) continue;
      ctx.drawImage(gate.canvas, gx, 0);
    }

    this.scenery.drawOverlays(this, ctx, camX, time);
    this.drawFloorMarkers(ctx, camX, time);
  }

  drawFloorMarkers(ctx, camX, time) {
    const { positions, y, margin, opacity, speed, pulse } = this.scenery.markers;
    for (const [x, color] of positions) {
      const sx = x - camX;
      if (sx < -margin || sx > CFG.W + margin) continue;
      ctx.save();
      ctx.globalAlpha = opacity + Math.sin(time * speed) * pulse;
      ctx.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        const left = sx + i * 26;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + 12, y + 10);
        ctx.lineTo(left, y + 20);
        ctx.lineTo(left + 6, y + 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawItem(ctx, it, camX, time) {
    if (it.dead) return;
    const sx = it.x - camX;
    const bob = Math.sin(time * 4 + it.seed) * 3;
    const sy = it.y - it.z - 10 + bob;
    const sprite = Art.items[it.def.sprite];
    drawShadow(ctx, sx, it.y, 24, it.z + 8, 0.6);
    ctx.save();
    ctx.globalAlpha = it.life < 4 ? (Math.sin(time * 16) > 0 ? 0.35 : 1) : 1;
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 10;
    const targetH = 26;
    const wpx = targetH * sprite.width / sprite.height;
    ctx.drawImage(sprite, sx - wpx / 2, sy - targetH, wpx, targetH);
    ctx.restore();
  }
}

export { PROP_DEFS, Stage };
