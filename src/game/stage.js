import { drawShadow, makeCanvas } from '../engine/canvas.js';
import { CFG, TAU, chance, choice, rand } from '../engine/math.js';
import { ZONES2, buildHallway, buildHospitalGate, buildHospitalProps, buildPatientRoom, buildReception, drawHospitalOverlays } from '../levels/hospital/scenery.js';
import { ZONES, buildArcade, buildMall, buildRink } from '../levels/mall/scenery.js';
import { ZONES3, buildBurgerRoom, buildFoodAlley, buildStreetExterior, buildStreetGate, buildStreetProps, drawStreetOverlays } from '../levels/street/scenery.js';
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
  constructor(game, variant = 1) {
    this.game = game;
    this.variant = variant;
    this.width = variant === 2 ? CFG.STAGE2_W : (variant === 3 ? CFG.STAGE3_W : CFG.STAGE_W);
    this.zones = variant === 2 ? ZONES2 : (variant === 3 ? ZONES3 : ZONES);
    this.canvases = [];
    this.props = [];
    this.items = [];
    this.neonSigns = [];
    this.crtScreens = [];
    this.hospitalLights = [];
    this.hospitalSigns = [];
    this.ecgMonitors = [];
    this.ivDrips = [];
    this.streetLights = [];
    this.steamVents = [];
    this.bulbStrings = [];
    this.streetSigns = [];
    this.bounceT = 0;
    this.itemPool = variant === 2
      ? ['firstaid', 'juice', 'pastelito']
      : variant === 3
        ? ['burger', 'hotdog', 'pastelito', 'soda']
        : ['pastelito', 'pastelito', 'tequeño', 'soda'];
    this.skaters = variant === 1 ? [
      { x: 240, dir: 1, speed: 34, lane: 0, phase: 0 },
      { x: 760, dir: -1, speed: 26, lane: 1, phase: 2.1 },
      { x: 1120, dir: 1, speed: 42, lane: 0, phase: 4.2 },
      { x: 1660, dir: -1, speed: 30, lane: 1, phase: 1.3 },
      { x: 2140, dir: 1, speed: 36, lane: 0, phase: 3.4 },
      { x: 2480, dir: -1, speed: 24, lane: 1, phase: 5.2 },
    ] : [];
    this.decor = [];
    this.time = 0;

    this.buildBackgrounds();
    this.buildProps();
    this.gates = variant === 2 ? [
      { x: 2450, canvas: buildHospitalGate(this, 'EMERGENCIA', 'RECEPCIÓN · HOSPITAL GENERAL', '#8fe6ff') },
      { x: 5450, canvas: buildHospitalGate(this, 'HABITACIONES', 'PISO 3 · ALA ESTE', '#a7f3d0') },
    ] : variant === 3 ? [
      { x: 3250, canvas: buildStreetGate(this, 'CALLEJÓN', 'PERROS · HAMBURGUESAS · NOCHE', '#ffb347') },
      { x: 5850, canvas: buildStreetGate(this, 'BURGER ROOM', 'LA ARENA FINAL DE GAYTELOS', '#ff5fae') },
    ] : [
      { x: 3050, canvas: this.buildGate('PISTA DE HIELO', 'ZONA FRÍA · RESBALADIZO', '#8fd8ff') },
      { x: 5850, canvas: this.buildGate('ARCADE', 'VIDEOJUEGOS · ARENA FINAL', '#ff5fae') },
    ];
  }

  /* A doorway that masks the seam between two pre-rendered zones. */
  buildGate(label, sub, color) {
    const w = 300, h = 540;
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');

    // dark portal interior (covers the hard background cut)
    const inner = g.createLinearGradient(0, 70, 0, 330);
    inner.addColorStop(0, '#0a0a18');
    inner.addColorStop(0.55, '#111a2c');
    inner.addColorStop(1, '#070610');
    g.fillStyle = inner;
    g.fillRect(34, 0, 232, 330);

    // glass sheen inside the portal
    g.save();
    g.globalAlpha = 0.10;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(48, 0);
    g.lineTo(104, 0);
    g.lineTo(60, 330);
    g.lineTo(34, 330);
    g.closePath();
    g.fill();
    ctxGlowLines: {
      g.globalAlpha = 0.25;
      g.strokeStyle = color;
      for (let y = 150; y < 320; y += 26) {
        g.beginPath();
        g.moveTo(46, y);
        g.lineTo(254, y);
        g.stroke();
      }
    }
    g.restore();

    // pillars
    for (const px of [0, 264]) {
      g.fillStyle = '#241a36';
      g.fillRect(px, 0, 36, 330);
      g.fillStyle = '#3b2a58';
      g.fillRect(px + 4, 0, 8, 330);
      g.fillStyle = '#140e22';
      g.fillRect(px + 28, 0, 8, 330);
      g.fillStyle = color;
      g.globalAlpha = 0.55;
      g.fillRect(px + (px === 0 ? 33 : 0), 70, 3, 248);
      g.globalAlpha = 1;
    }

    // header beam
    g.fillStyle = '#170f26';
    g.fillRect(0, 62, 300, 72);
    g.fillStyle = '#2a1b44';
    g.fillRect(4, 66, 292, 64);
    g.strokeStyle = color;
    g.globalAlpha = 0.65;
    g.lineWidth = 2;
    g.strokeRect(8, 70, 284, 56);
    g.globalAlpha = 1;

    g.save();
    g.shadowColor = color;
    g.shadowBlur = 18;
    g.fillStyle = color;
    g.font = '900 21px "Arial Black", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, 150, 94);
    g.shadowBlur = 0;
    g.fillStyle = '#e8e0ff';
    g.font = 'bold 8px "Courier New", monospace';
    g.fillText(sub, 150, 114);
    g.restore();

    // marquee bulbs
    for (let x = 16; x < 290; x += 22) {
      g.fillStyle = x % 44 === 16 ? color : '#ffe066';
      g.globalAlpha = 0.85;
      g.fillRect(x, 60, 4, 4);
      g.fillRect(x, 132, 4, 4);
    }
    g.globalAlpha = 1;

    // threshold
    g.fillStyle = '#0d0918';
    g.fillRect(28, 314, 244, 14);
    g.fillStyle = color;
    g.globalAlpha = 0.8;
    g.fillRect(34, 316, 232, 3);
    g.globalAlpha = 0.18;
    g.fillRect(34, 319, 232, 16);
    g.globalAlpha = 1;

    // warning chevrons on the floor edge
    g.fillStyle = '#ffe066';
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = 0.4;
      g.fillRect(110 + i * 22, 322, 10, 3);
    }
    g.globalAlpha = 1;

    // pass-through chevrons + floor light spill
    g.save();
    g.globalAlpha = 0.30;
    g.strokeStyle = color;
    g.lineWidth = 7;
    g.lineCap = 'square';
    for (let i = 0; i < 2; i++) {
      const ox = 112 + i * 30;
      g.beginPath();
      g.moveTo(ox, 230);
      g.lineTo(ox + 26, 256);
      g.lineTo(ox, 282);
      g.stroke();
    }
    const spill = g.createLinearGradient(0, 322, 0, 390);
    spill.addColorStop(0, color + '55');
    spill.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 1;
    g.fillStyle = spill;
    g.fillRect(28, 322, 244, 66);
    g.restore();

    return c;
  }

  zoneAt(x) {
    for (const z of this.zones) if (x >= z.start && x < z.end) return z;
    return this.zones[this.zones.length - 1];
  }

  isSlippery(x) {
    return this.variant === 1 && x > 3300 && x < 5300;
  }

  /* ==========================================================
     BACKGROUND BUILDERS
     ========================================================== */
  buildBackgrounds() {
    if (this.variant === 2) {
      this.canvases = [
        buildReception(this),
        buildHallway(this),
        buildPatientRoom(this),
      ];
      return;
    }
    if (this.variant === 3) {
      this.canvases = [
        buildStreetExterior(this),
        buildFoodAlley(this),
        buildBurgerRoom(this),
      ];
      return;
    }
    this.canvases = [
      buildMall(this),
      buildRink(this),
      buildArcade(this),
    ];
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

  buildProps() {
    if (this.variant === 2) {
      buildHospitalProps(this);
      return;
    }
    if (this.variant === 3) {
      buildStreetProps(this);
      return;
    }
    // ---- Zone 1: mall corridors (0..3200) ----
    this.addProp('palm', 330, 352);
    this.addProp('bench', 520, 432);
    this.addProp('trash', 610, 470);
    this.addProp('planter', 735, 348);
    this.addProp('palm', 880, 350);
    this.addProp('bench', 980, 400);
    this.addProp('trash', 1062, 360);
    this.addProp('crate', 1130, 456);
    this.addProp('planter', 1265, 358);
    this.addProp('bench', 1420, 448);
    this.addProp('palm', 1510, 350);
    this.addProp('trash', 1555, 480);
    this.addProp('palm', 1750, 350);
    this.addProp('bench', 1900, 430);
    this.addProp('trash', 2010, 468);
    this.addProp('planter', 2120, 352);
    this.addProp('palm', 2260, 350);
    this.addProp('crate', 2350, 440);
    this.addProp('bench', 2480, 400);
    this.addProp('trash', 2600, 474);
    this.addProp('planter', 2720, 354);
    this.addProp('palm', 2840, 350);
    this.addProp('bench', 2950, 445);

    // ---- Zone 2: ice rink (3200..6000) ----
    this.addProp('bench', 3430, 430);
    this.addProp('trash', 3550, 464);
    this.addProp('planter', 3680, 352);
    this.addProp('bench', 3820, 380);
    this.addProp('palm', 3960, 350);
    this.addProp('trash', 4100, 470);
    this.addProp('crate', 4220, 430);
    this.addProp('planter', 4360, 352);
    this.addProp('bench', 4500, 400);
    this.addProp('palm', 4640, 352);
    this.addProp('trash', 4780, 470);
    this.addProp('bench', 4920, 420);
    this.addProp('planter', 5060, 352);
    this.addProp('palm', 5200, 350);
    this.addProp('crate', 5340, 440);
    this.addProp('bench', 5480, 390);
    this.addProp('trash', 5620, 470);
    this.addProp('planter', 5750, 352);

    // ---- Zone 3: arcade (6000..9200) ----
    this.addProp('crate', 6280, 440);
    this.addProp('trash', 6400, 480);
    this.addProp('stool', 6540, 470);
    this.addProp('stool', 6700, 386);
    this.addProp('stool', 6860, 472);
    this.addProp('crate', 7020, 440);
    this.addProp('stool', 7180, 470);
    this.addProp('crate', 7340, 440);
    this.addProp('trash', 7480, 474);
    this.addProp('stool', 8420, 400);
    this.addProp('crate', 8560, 440);
    this.addProp('trash', 8700, 470);
    this.addProp('stool', 8840, 386);
    this.addProp('crate', 8980, 440);
    this.addProp('trash', 9100, 474);
  }

  spawnItem(x, y, forcedType = null) {
    const type = forcedType || choice(this.itemPool);
    this.items.push({
      type,
      def: PICKUPS[type],
      x,
      y,
      z: 14,
      vz: 120,
      seed: rand(0, TAU),
      life: 26,
      dead: false,
      justSpawned: 0,
    });
  }

  breakProp(prop, game) {
    if (prop.dead) return;
    prop.dead = true;
    game.spawnDebris(prop.x, prop.y, prop.type);
    game.shake(5, 0.18);
    game.addScore(prop.def.score, prop.x, prop.y - 30);
    if (chance(prop.def.drops)) {
      let forced = null;
      if (this.variant === 2) {
        forced = null;
      } else if (this.variant === 3) {
        // Street coolers & cans always cough up the good stuff.
        forced = chance(0.55) ? 'burger' : (chance(0.6) ? 'hotdog' : null);
      } else {
        forced = chance(0.25) ? 'soda' : null;
      }
      this.spawnItem(prop.x, prop.y, forced);
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
      if (pl && pl.alive && Math.abs(pl.x - it.x) < 30 && Math.abs(pl.y - it.y) < 26 && it.z < 30) {
        it.dead = true;
        pl.heal(it.def.heal);
        Sound.sfx('heal');
        game.spawnSparks(it.x, it.y - 20, 0, 8, 'heal');
        game.ringText(it.def.label, it.x, it.y - 40, '#7dffc4');
        game.addScore(it.def.score, it.x, it.y - 60);
      }
      if (it.life <= 0) it.dead = true;
    }
    this.items = this.items.filter(i => !i.dead);

    // skaters glide around the rink (Stage 1 only)
    if (this.variant === 1) {
      for (const s of this.skaters) {
        s.x += s.dir * s.speed * dt;
        if (s.x > 2580) { s.x = 2580; s.dir = -1; s.phase += 0.4; }
        if (s.x < 160) { s.x = 160; s.dir = 1; s.phase += 0.4; }
      }
    }

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

    if (this.variant === 2) {
      drawHospitalOverlays(this, ctx, camX, time);
      this.drawFloorMarkers(ctx, camX, time);
      return;
    }

    if (this.variant === 3) {
      drawStreetOverlays(this, ctx, camX, time);
      this.drawFloorMarkers(ctx, camX, time);
      return;
    }

    // ---- live overlays ----
    // Zone 1 neon / light pulse
    for (const s of this.neonSigns) {
      if (s.zone === 1 || s.zone === 2) continue;
      const sx = s.x - camX;
      if (sx < -s.r || sx > CFG.W + s.r) continue;
      if (s.type === 'light') {
        const a = 0.16 + Math.sin(time * 2.3 + s.x) * 0.05;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.ellipse(sx, s.y + 60, s.r, s.r * 0.7, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (s.type === 'sign') {
        const flicker = Math.sin(time * 7 + s.x * 0.1) > 0.94 ? 0.35 : 1;
        ctx.globalAlpha = 0.16 * flicker;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.ellipse(sx, s.y, s.r, s.r * 0.55, 0, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // Zone 2 skaters + ice sparkle
    const rinkVisible = camX + CFG.W > 3200 && camX < 6000;
    if (rinkVisible) {
      for (const s of this.skaters) {
        const wx = 3200 + s.x;
        const sx = wx - camX;
        if (sx < -60 || sx > CFG.W + 60) continue;
        this.drawSkater(ctx, sx, 245 + s.lane * 26, s.dir, time + s.phase);
      }
      // shimmer on the ice
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const wx = 3250 + ((i * 137 + time * 22) % 2600);
        const sx = wx - camX;
        if (sx < -20 || sx > CFG.W + 20) continue;
        ctx.globalAlpha = 0.12 + Math.sin(time * 2 + i) * 0.06;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, 170 + (i * 31) % 110, 26, 2);
      }
      ctx.restore();
    }

    // Zone 3 CRT screens + floor beams
    if (camX + CFG.W > 6000) {
      for (const crt of this.crtScreens) {
        const sx = crt.x - camX;
        if (sx < -crt.w || sx > CFG.W) continue;
        const flick = 0.6 + Math.sin(time * 12 + crt.phase) * 0.2 + (Math.sin(time * 31 + crt.phase * 3) > 0.85 ? 0.2 : 0);
        ctx.save();
        ctx.globalAlpha = 0.30 * flick;
        ctx.fillStyle = crt.color;
        ctx.shadowColor = crt.color;
        ctx.shadowBlur = 16;
        ctx.fillRect(sx, crt.y, crt.w, crt.h);
        ctx.globalAlpha = 0.65 * flick;
        ctx.fillStyle = '#eaffff';
        ctx.fillRect(sx + 4, crt.y + 4 + (time * 40 + crt.phase * 9) % (crt.h - 12), crt.w - 8, 2);
        ctx.restore();
      }

      // sweeping spotlights
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const bx = ((time * 36 + i * 300) % 3000) + 6100;
        const sx = bx - camX;
        if (sx < -200 || sx > CFG.W + 200) continue;
        const grad = ctx.createLinearGradient(sx, 60, sx + 90, 500);
        grad.addColorStop(0, ['rgba(255,70,150,0.10)', 'rgba(80,220,255,0.10)', 'rgba(255,220,80,0.09)'][i]);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx - 30, 50);
        ctx.lineTo(sx + 30, 50);
        ctx.lineTo(sx + 170, 520);
        ctx.lineTo(sx + 60, 520);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // neon marquee pulse
      for (const s of this.neonSigns) {
        if (s.zone !== 2) continue;
        const sx = s.x - camX;
        if (sx < -s.r || sx > CFG.W + s.r) continue;
        const a = 0.10 + (Math.sin(time * 4 + s.x) * 0.5 + 0.5) * 0.12;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.ellipse(sx, s.y, s.r, s.r * 0.55, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // zone banners painted on floor edges
    this.drawFloorMarkers(ctx, camX, time);
  }

  drawSkater(ctx, x, y, dir, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    const lean = Math.sin(t * 3) * 0.06;
    ctx.rotate(lean);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#122a44';
    // body
    ctx.fillRect(-5, -34, 10, 18);
    ctx.fillRect(-4, -42, 8, 8);
    // scarf
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(-10, -36, 8, 3);
    ctx.fillRect(-16, -34, 8, 2);
    // legs
    ctx.fillStyle = '#0c1d31';
    ctx.fillRect(-6, -17, 4, 14);
    ctx.fillRect(2, -17, 4, 14);
    // skates
    ctx.fillStyle = '#d9ecff';
    ctx.fillRect(-8, -4, 8, 3);
    ctx.fillRect(0, -4, 8, 3);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-22, -1, 20, 1);
    ctx.restore();
  }

  drawFloorMarkers(ctx, camX, time) {
    if (this.variant === 2) {
      for (const m of [{ x: 2680, col: '#8fe6ff' }, { x: 5680, col: '#a7f3d0' }]) {
        const sx = m.x - camX;
        if (sx < -120 || sx > CFG.W + 120) continue;
        ctx.save();
        ctx.globalAlpha = 0.30 + Math.sin(time * 3) * 0.08;
        ctx.fillStyle = m.col;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sx + i * 26, 450);
          ctx.lineTo(sx + i * 26 + 12, 460);
          ctx.lineTo(sx + i * 26, 470);
          ctx.lineTo(sx + i * 26 + 6, 460);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      return;
    }
    if (this.variant === 3) {
      for (const m of [{ x: 3310, col: '#ffb347' }, { x: 5920, col: '#ff5fae' }]) {
        const sx = m.x - camX;
        if (sx < -120 || sx > CFG.W + 120) continue;
        ctx.save();
        ctx.globalAlpha = 0.32 + Math.sin(time * 3.2) * 0.09;
        ctx.fillStyle = m.col;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sx + i * 26, 450);
          ctx.lineTo(sx + i * 26 + 12, 460);
          ctx.lineTo(sx + i * 26, 470);
          ctx.lineTo(sx + i * 26 + 6, 460);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      return;
    }
    // little zone chevrons painted on the floor
    const markers = [
      { x: 3380, col: '#8fd8ff', label: 'PISTA' },
      { x: 6180, col: '#ff6b9d', label: 'ARCADE' },
    ];
    for (const m of markers) {
      const sx = m.x - camX;
      if (sx < -100 || sx > CFG.W + 100) continue;
      ctx.save();
      ctx.globalAlpha = 0.36 + Math.sin(time * 3) * 0.1;
      ctx.fillStyle = m.col;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + i * 26, 452);
        ctx.lineTo(sx + i * 26 + 12, 462);
        ctx.lineTo(sx + i * 26, 472);
        ctx.lineTo(sx + i * 26 + 6, 462);
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
