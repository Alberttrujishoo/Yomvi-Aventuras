import { drawSprite } from '../media/sprite-renderer.js';
import { drawShadow, text } from '../engine/canvas.js';
import { CFG, TAU, chance, choice, clamp, damp, rand, sign } from '../engine/math.js';
import { Particle } from '../engine/particle.js';
import { FloatText, Shockwave, Slash } from './combat-effects.js';
import { Enemy, typeColor } from './enemy.js';
import { Player } from './player.js';
import { drawNpc, drawNpcBubble, spawnNpc, updateNpcEvent } from './npc-event.js';
import { PROP_DEFS, Stage } from './stage.js';
import { Input } from '../input/actions.js';
import { TouchControls } from '../input/touch.js';
import { LEVELS } from '../levels/index.js';
import { Assets } from '../media/assets.js';
import { Sound } from '../media/audio.js';
import { Art } from '../media/procedural-art.js';
import { HUD } from '../ui/hud.js';

/* ============================================================
   YOMVI ADVENTURES — game director
   Camera-locked waves, 2.5D depth sorting, arcade flow.
   ============================================================ */

class Game {
  constructor(canvas, { compact = false } = {}) {
    this.canvas = canvas;
    this.renderScale = compact ? 0.75 : 1;
    this.canvas.width = CFG.W * this.renderScale;
    this.canvas.height = CFG.H * this.renderScale;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;

    Art.build();

    this.state = 'intro'; // intro | title | playing | paused | continue | victory
    this.time = 0;
    this.lastTs = 0;
    this.score = 0;
    this.hiScore = this.loadHi();
    this.kills = 0;
    this.muted = false;
    this.ready = false;
    this.stageSelectIndex = 0;
    this.camera = { x: 0 };
    this.stageId = 1;
    this.stage = null;
    this.player = null;
    this.resetStageState();

    this.heroSprite = Art.hero;
    this.bossSprite = Art.boss;
    this.boss2Sprite = Art.boss2;
    this.boss3Sprite = Art.boss3;
    this.enemySprites = Art.enemies;
    this.paintTitleAux = 0;
    this.lastRenderedState = null;
    this.lastRenderTime = -Infinity;
    this.pendingStageMedia = new Map();
    this.applyAssets();

    this.loop = this.loop.bind(this);
  }

  /* ---------------- boot / assets ---------------- */
  applyAssets() {
    this.heroSprite = Assets.hero || Art.hero;
    this.bossSprite ||= Art.boss;
    this.boss2Sprite ||= Art.boss2;
    this.boss3Sprite ||= Art.boss3;
    this.enemySprites = Art.enemies;
    this.mainScreen = Assets.mainScreen;

    this.propSprites = {};
    for (const key of Object.keys(Art.props)) {
      this.propSprites[key] = {
        frames: { idle: [Art.props[key]] },
        targetH: (PROP_DEFS[key] && PROP_DEFS[key].h) || 50,
        pad: 2,
      };
    }
  }

  startLoop() {
    this.ready = true;
    this.lastTs = 0;
    requestAnimationFrame(this.loop);
  }

  loadHi() {
    try {
      const v = parseInt(localStorage.getItem('yomvi.hiscore') || '0', 10);
      return Number.isFinite(v) ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  saveHi() {
    try { localStorage.setItem('yomvi.hiscore', String(this.hiScore)); } catch (e) { /* noop */ }
  }

  /* ---------------- main loop ---------------- */
  loop(ts) {
    if (!this.lastTs) this.lastTs = ts;
    let dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
    const elapsed = Math.min(dt, 0.25);
    dt = Math.min(dt, 1 / 30);
    this.time += elapsed;

    if (Input.hit('mute')) {
      this.muted = Sound.toggleMute();
    }

    this.update(dt, elapsed);
    const staticFrame = this.state === 'intro' || this.state === 'title' || this.state === 'paused';
    TouchControls.sync();
    const renderDue = this.renderScale === 1 || ts - this.lastRenderTime >= 15;
    if (this.lastRenderedState !== this.state || (!staticFrame && renderDue)) {
      this.render();
      this.lastRenderedState = this.state;
      this.lastRenderTime = ts;
    }
    Input.endFrame();
    requestAnimationFrame(this.loop);
  }

  /* ---------------- state flow ---------------- */
  resetStageState() {
    this.stageTime = 0;
    this.stageClearTime = 0;
    this.stageClearMax = 6.5;
    this.stageClearStats = null;
    this.briefingTime = 0;
    this.briefingMax = 10;
    this.teaserTime = 0;
    this.teaserMax = 11;
    this.continueTime = 10;

    this.boss = null;
    this.bossDefeated = false;
    this.bossStarted = false;
    this.enemies = [];
    this.projectiles = [];
    this.shockwaves = [];
    this.particles = [];
    this.floatTexts = [];
    this.slashes = [];
    this.npc = null;
    this.npcBubble = null;
    this.npcDone = false;
    this.spawnsPaused = false;

    this.locks = [];
    this.roamSpawns = [];
    this.lockActive = false;
    this.goActive = false;
    this.activeLock = null;
    this.clearedLock = null;
    this.camera.x = 0;
    this.currentZone = null;

    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboFlash = 0;
    this.damageFlash = 0;
    this.grabPrompt = false;
    this.hitstopT = 0;
    this.shakeMag = 0;
    this.shakeT = 0;
    this.shakeDur = 0.2;
    this.slowmoT = 0;
    this.flashScreen = 0;
    this.bannerData = null;
    this.levelMsg = null;
  }

  startBriefing() {
    Sound.init();
    Sound.resume();
    Sound.stopMusic();
    this.resetStageState();
    this.player = null;
    this.stage = null;
    this.stageId = 1;
    this.state = 'briefing';
    this.briefingTime = this.briefingMax;
    this.prepareStageMedia(1);
    Input.flush();
  }

  beginStage(stageId, { preservePlayer = false, debug = false } = {}) {
    const level = LEVELS[stageId];
    Sound.init();
    Sound.resume();
    Sound.stopMusic();
    this.resetStageState();
    this.stageId = stageId;
    Art.buildLevel(stageId);
    this.applyAssets();
    this.stage = new Stage(this, stageId);
    this.state = 'playing';

    if (preservePlayer && this.player) {
      const p = this.player;
      Object.assign(p, {
        x: 150, y: 444, z: 0, vx: 0, vy: 0, vz: 0,
        state: 'idle', stateT: 0, alive: true, hp: p.maxHp,
        invuln: 2, flash: 0, grabTarget: null, lives: Math.max(1, p.lives),
      });
      p.buffer.attack = 0;
      p.buffer.jump = 0;
      p.buffer.special = 0;
    } else {
      this.score = 0;
      this.kills = 0;
      this.player = new Player(this, 150, 444);
      this.player.lives = 3;
      this.player.invuln = level.startInvulnerability;
    }

    this.locks = level.makeLocks();
    this.roamSpawns = level.makeRoamers();
    this.spawnEnemy(...level.firstEnemy);
    this.currentZone = this.stage.zoneAt(this.player.x);
    this.prepareStageMedia(stageId);
    this.setTrackForZone(true);
    Sound.restartExternal();
    Sound.sfx('start');
    this.banner(...(debug && level.debugBanner ? level.debugBanner : level.banner));
    Input.flush();
  }

  prepareStageMedia(stageId) {
    if (this.pendingStageMedia.has(stageId)) return this.pendingStageMedia.get(stageId);

    const level = LEVELS[stageId];
    const audioURL = (filename) => new URL('../../assets/audio/' + filename, import.meta.url);
    const refreshMusic = (loaded) => {
      if (loaded && this.state === 'playing' && this.stageId === stageId) {
        this.setTrackForZone(true);
      }
    };
    const bossSprite = ['bossSprite', 'boss2Sprite', 'boss3Sprite'][stageId - 1];
    const media = Promise.all([
      Assets.loadBoss(stageId, level.bossSheet).then((sprite) => {
        if (sprite) this[bossSprite] = sprite;
      }),
      Sound.loadLevelMusic(level.music.map(audioURL), level.track).then(refreshMusic),
      Sound.loadLevelMusic([audioURL('boss.mp3')], 'bossMp3').then((loaded) => {
        if (this.boss?.active) refreshMusic(loaded);
      }),
    ]);
    this.pendingStageMedia.set(stageId, media);
    return media;
  }

  toTitle() {
    this.saveHighScore();
    Sound.stopMusic();
    this.resetStageState();
    this.state = 'title';
    this.player = null;
    this.stageId = 1;
    this.stage = null;
    Input.flush();
  }

  saveHighScore() {
    this.hiScore = Math.max(this.hiScore, this.score);
    this.saveHi();
  }

  startContinue() {
    this.state = 'continue';
    this.continueTime = 10;
    this.hitstopT = 0;
    this.shakeT = 0;
    this.bannerData = null;
    this.levelMsg = null;
    this.hiScore = Math.max(this.hiScore, this.score);
    this.saveHi();
    Sound.stopMusic();
    Sound.sfx('gameover');
    this.projectiles = [];
    this.shockwaves = [];
  }
  continueGame() {
    const p = this.player;
    if (!p) return;
    this.state = 'playing';
    p.alive = true;
    p.hp = p.maxHp;
    p.lives = 1;
    p.state = 'idle';
    p.stateT = 0;
    p.deadT = 0;
    p.z = 0;
    p.vz = 0;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 3.0;
    p.flash = 0;
    p.x = clamp(this.camera.x + 200, 60, this.stage.width - 60);
    p.y = 444;
    p.grabTarget = null;
    this.damageFlash = 0;
    this.npcBubble = null;
    this.spawnsPaused = false;
    Sound.resume();
    Sound.sfx('coin');
    this.setTrackForZone(true);
    this.banner('¡CONTINÚA!', 'CRÉDITO INSERTADO · SUERTE', '#7dffc4', 2.2);
    this.continueTime = 10;
  }

  onPlayerDeath() {
    this.damageFlash = 0.5;
    this.shake(10, 0.4);
  }

  onBossReady() {
    // The boss has walked on screen: only now start the shared boss theme.
    this.setBossMusic(true);
    if (Sound.hasExternal('bossMp3')) Sound.restartExternal();

    if (this.stageId === 2) {
      this.banner('CRYPTOCINO', 'EL REY CRYPTO · FASE 1', '#ff8a3d', 2.8);
    } else if (this.stageId === 3) {
      this.banner('GAYTELOS', 'EL REY DE LA BURGER ROOM · FASE 1', '#ff5fae', 2.8);
    } else {
      this.banner('ARTHAS - JORGE SALINAS', 'EL REY DEL ARCADE · FASE 1', '#ff2e63', 2.8);
    }
    Sound.sfx('enrage');
  }

  onBossDefeated() {
    if (this.bossDefeated) return;
    this.bossDefeated = true;
    this.hiScore = Math.max(this.hiScore, this.score);
    this.hitstopT = 0;
    this.shakeT = 0;
    this.bannerData = null;
    Input.flush();
    Sound.stopMusic();

    if (this.stageId === 1) {
      this.addScore(10000);
      this.stageClearStats = {
        score: this.score,
        level: this.player ? this.player.level : 1,
        kills: this.kills,
        time: this.stageTime,
      };
      this.stageClearTime = 6.5;
      this.stageClearMax = 6.5;
    } else if (this.stageId === 2) {
      this.addScore(15000);
      this.stageClearStats = {
        score: this.score,
        level: this.player ? this.player.level : 1,
        kills: this.kills,
        time: this.stageTime,
      };
      this.stageClearTime = 6.5;
      this.stageClearMax = 6.5;
    } else {
      this.addScore(25000);
    }

    this.hiScore = Math.max(this.hiScore, this.score);
    this.saveHi();

    // Every stage gets a 10s black "AMONGOLICUS ENDGAME" teaser before
    // the tally (Stages 1/2) or the final victory/credits (Stage 3).
    this.state = 'teaser';
    this.teaserTime = 10;
    this.teaserMax = 10;
    this.slowmoT = 3.4;
    this.flashScreen = 0.8;
  }

  /* ---------------- input-sensitive update ---------------- */
  update(dt, elapsed = dt) {
    Sound.update();

    // Creator intro: keep the title and all gameplay input on hold.
    if (this.state === 'intro') return;

    if (this.state === 'title') {
      if (Input.secret('AHPUCCA')) {
        Input.flush();
        this.stageSelectIndex = 0;
        this.state = 'stageselect';
        Sound.sfx('select');
        return;
      }
      if (Input.hit('stage1')) {
        Input.flush();
        this.beginStage(1);
        return;
      }
      if (Input.hit('stage2')) {
        Input.flush();
        this.beginStage(2, { debug: true });
        return;
      }
      if (Input.hit('stage3')) {
        Input.flush();
        this.beginStage(3, { debug: true });
        return;
      }
      if (Input.hit('start')) {
        Input.flush();
        this.startBriefing();
      }
      return;
    }

    if (this.state === 'stageselect') {
      if (Input.hit('pause')) {
        Input.flush();
        Sound.sfx('select');
        this.toTitle();
        return;
      }
      if (Input.hit('up') || Input.hit('left') || Input.hit('down') || Input.hit('right')) {
        const dir = Input.hit('up') || Input.hit('left') ? -1 : 1;
        this.stageSelectIndex = (this.stageSelectIndex + dir + 3) % 3;
        Sound.sfx('select');
      }
      if (Input.hit('start')) {
        Input.flush();
        Sound.sfx('start');
        this.beginStage(this.stageSelectIndex + 1, { debug: true });
      }
      return;
    }

    if (this.state === 'briefing') {
      this.briefingTime -= elapsed;
      if (Input.hit('start') || this.briefingTime <= 0) {
        this.briefingTime = 0;
        this.beginStage(1);
      }
      return;
    }

    if (this.state === 'stageclear') {
      this.stageClearTime -= elapsed;
      if (this.stageClearTime <= 0) {
        this.stageClearTime = 0;
        this.beginStage(this.stageId + 1, { preservePlayer: true });
      }
      return;
    }

    if (this.state === 'paused') {
      if (Input.hit('pause') || Input.hit('start')) {
        this.state = 'playing';
        Sound.resume();
        this.setTrackForZone();
      }
      return;
    }

    if (this.state === 'continue') {
      this.continueTime -= elapsed;
      if (Input.hit('start')) {
        Input.flush();
        this.continueGame();
      } else if (this.continueTime <= 0) {
        this.continueTime = 0;
        this.toTitle();
      }
      return;
    }

    if (this.state === 'victory') {
      this.updateEffects(dt * 0.6);
      if (Input.hit('start')) {
        Input.flush();
        this.toTitle();
      }
      return;
    }

    if (this.state === 'teaser') {
      this.teaserTime -= elapsed;
      if (this.teaserTime <= 0) {
        this.teaserTime = 0;
        Input.flush();
        if (this.stageId === 3) {
          this.state = 'victory';
          Sound.sfx('victory');
        } else {
          this.state = 'stageclear';
          this.stageClearTime = 6.5;
          this.stageClearMax = 6.5;
          Sound.sfx('stageclear');
        }
      }
      return;
    }

    // ---- active gameplay ----
    if (Input.hit('pause')) {
      this.state = 'paused';
      return;
    }

    if (!this.player) return;

    this.player.captureInput();

    this.updateFlashTimers(dt);

    if (this.hitstopT > 0) {
      this.hitstopT -= dt;
      this.updateEffects(dt * 0.32);
      this.updateCamera(dt);
      return;
    }

    this.stageTime += dt;
    let worldDt = dt;
    if (this.slowmoT > 0) {
      this.slowmoT = Math.max(0, this.slowmoT - dt);
      worldDt = dt * 0.35;
    }

    this.player.update(worldDt);

    for (const e of this.enemies) {
      if (!e.alive && e.state !== 'dying') continue;
      e.update(worldDt);
    }
    if (this.boss) this.boss.update(dt);

    this.separateFighters(worldDt);

    for (const pr of this.projectiles) pr.update(worldDt);
    for (const s of this.shockwaves) s.update(worldDt);

    this.stage.update(worldDt, this);
    this.updateEffects(worldDt);
    this.updateCamera(dt);
    this.updateZone();
    this.updateLocks(worldDt);
    this.updateRoamers();
    this.updateCombo(worldDt);
    updateNpcEvent(this, dt);
    this.checkPlayerDeath();
    this.updateGrabPrompt();

    this.cleanup(worldDt);
  }

  updateFlashTimers(dt) {
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    this.comboFlash = Math.max(0, this.comboFlash - dt);
    this.flashScreen = Math.max(0, this.flashScreen - dt * 1.9);
    if (this.levelMsg) {
      this.levelMsg.t -= dt;
      if (this.levelMsg.t <= 0) this.levelMsg = null;
    }
    if (this.bannerData) {
      this.bannerData.t -= dt;
      if (this.bannerData.t <= 0) this.bannerData = null;
    }
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      if (this.shakeT <= 0) this.shakeMag = 0;
    }
    // go arrow hides after the player advances past the cleared screen
    if (this.goActive && this.clearedLock) {
      if (this.player.x > this.clearedLock.camX + CFG.W - 70) this.goActive = false;
    }
  }

  updateCamera(dt) {
    let target;
    if (this.lockActive && this.activeLock) {
      target = this.activeLock.camX;
    } else if (this.player) {
      target = this.player.x - CFG.W * 0.42;
    } else {
      target = 0;
    }
    target = clamp(target, 0, this.stage.width - CFG.W);
    this.camera.x = damp(this.camera.x, target, 8, dt);
    if (Math.abs(this.camera.x - target) < 0.3) this.camera.x = target;
  }

  updateZone() {
    if (!this.player) return;
    const z = this.stage.zoneAt(this.player.x);
    if (z !== this.currentZone) {
      this.currentZone = z;
      const col = this.stageId === 2
        ? (z.key === 'patient' ? '#ff8a3d' : '#8fe6ff')
        : this.stageId === 3
          ? (z.key === 'burger' ? '#ff5fae' : z.key === 'alley' ? '#ffd166' : '#ffb347')
          : (z.key === 'arcade' ? '#ff5fae' : z.key === 'ice' ? '#5ad2ff' : '#ffd166');
      this.banner(z.name, z.sub, col, 2.8);
      this.setTrackForZone();
    }
  }

  setBossMusic(force = false) {
    // Boss2.mp3 is shared by every boss fight. Fall back to the old
    // per-stage chiptune boss themes if the MP3 is missing.
    if (Sound.hasExternal('bossMp3')) {
      Sound.setTrack('bossMp3', force);
    } else {
      Sound.setTrack(this.stageId === 3 ? 'burger' : this.stageId === 2 ? 'boss2' : 'boss', force);
    }
  }

  setTrackForZone(force = false) {
    if (!this.player) return;

    // If a boss is already active, keep the shared boss theme (also after
    // a Continue). Before the boss appears, the normal stage theme plays.
    if (this.boss && this.boss.alive && this.boss.active) {
      this.setBossMusic(force);
      return;
    }

    if (this.stageId === 2) {
      if (Sound.hasExternal('level2')) {
        // user-provided Stage 2 theme (DDR Yomvi 2 long.mp3)
        Sound.setTrack('level2', force);
      } else {
        Sound.setTrack('hospital', force);
      }
      return;
    }
    if (this.stageId === 3) {
      if (Sound.hasExternal('level3')) {
        // user-provided Stage 3 theme (DDR Yomvi 3 long.mp3)
        Sound.setTrack('level3', force);
      } else {
        Sound.setTrack('street', force);
      }
      return;
    }
    const z = this.stage.zoneAt(this.player.x);
    if (Sound.hasExternal('level')) {
      // user-provided level theme (DDR Yomvi 1 long.mp3)
      Sound.setTrack('level', force);
    } else {
      Sound.setTrack(z.key === 'ice' ? 'ice' : 'mall', force);
    }
  }

  updateCombo(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboTimer = 0;
      }
    }
  }

  updateGrabPrompt() {
    this.grabPrompt = false;
    const p = this.player;
    if (!p || !p.alive || (p.state !== 'idle' && p.state !== 'walk')) return;
    for (const e of this.enemies) {
      if (!e.alive || !e.def.canGrab) continue;
      if (e.state === 'down' || e.state === 'getup' || e.state === 'dying' || e.state === 'grabbed') continue;
      if (e.state !== 'hurt' && e.stunTimer <= 0) continue;
      if (Math.abs(e.y - p.y) < 30 && Math.abs(e.x - p.x) < 42 && e.z < 24) {
        this.grabPrompt = true;
        break;
      }
    }
  }

  checkPlayerDeath() {
    const p = this.player;
    if (!p || p.alive || this.state !== 'playing') return;
    if (p.deadT > 1.55) {
      if (p.lives > 1) {
        p.lives--;
        this.respawnPlayer();
      } else {
        this.startContinue();
      }
    }
  }

  respawnPlayer() {
    const p = this.player;
    p.alive = true;
    p.hp = p.maxHp;
    p.state = 'idle';
    p.stateT = 0;
    p.deadT = 0;
    p.z = 0;
    p.vz = 0;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 2.8;
    p.flash = 0;
    p.grabTarget = null;
    p.x = clamp(this.camera.x + 210, 70, this.stage.width - 70);
    p.y = clamp(p.y, 360, 470);
    p.buffer.attack = 0;
    Sound.sfx('heal');
    this.spawnBurst(p.x, p.y, 18, '#7dffc4');
    this.banner('¡SIGUE EN PIE!', 'VIDAS: ' + p.lives, '#7dffc4', 1.6);
  }

  /* ---------------- camera-locked waves ---------------- */
  updateLocks(dt) {
    if (!this.player) return;

    if (this.lockActive && this.activeLock) {
      const l = this.activeLock;
      l.timer += dt;

      let allSpawned = true;
      for (let i = 0; i < l.wave.length; i++) {
        const w = l.wave[i];
        if (w.spawned) continue;
        allSpawned = false;
        if (!this.spawnsPaused && l.timer >= w.delay) {
          w.spawned = true;
          const side = i % 2 === 0 ? 1 : -1;
          const wx = side > 0 ? l.camX + CFG.W + 46 : l.camX - 56;
          this.spawnEnemy(w.type, wx, w.y);
        }
      }

      if (l.boss) {
        if (!this.bossStarted) {
          this.bossStarted = true;
          const BossType = LEVELS[this.stageId].boss;
          this.boss = new BossType(this, l.camX + CFG.W + 40, 438);
          this.boss.introTarget = l.camX + CFG.W * 0.62;
        }
      } else if (allSpawned && !this.enemies.some(e => e.alive)) {
        if (l.event === 'npc' && !l.npcDone) {
          if (!l.npcSpawned) {
            spawnNpc(this, l);
            l.npcSpawned = true;
          }
        } else {
          this.clearLock(l);
        }
      }
    } else {
      for (const l of this.locks) {
        if (l.cleared || l.started) continue;
        if (this.player.x > l.triggerX) {
          this.activateLock(l);
          break;
        }
      }
    }
  }

  updateRoamers() {
    if (!this.player || this.lockActive || this.spawnsPaused) return;
    for (const r of this.roamSpawns) {
      if (r.spawned || this.player.x < r.at) continue;
      r.spawned = true;
      const side = chance(0.5) ? 1 : -1;
      const x = this.camera.x + (side > 0 ? CFG.W + 50 : -50);
      this.spawnEnemy(r.type, x, rand(370, 460));
    }
  }

  activateLock(lock) {
    this.activeLock = lock;
    lock.started = true;
    lock.timer = 0;
    this.lockActive = true;
    this.goActive = false;

    // Leftovers from earlier screens don't teleport into the new arena.
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.x < lock.camX - 240 || e.x > lock.camX + CFG.W + 240) {
        e.alive = false;
        e.remove = true;
        e.releaseSlot();
        this.spawnBurst(e.x, e.y, 6, '#8a7aa8');
      }
    }
    this.enemies = this.enemies.filter(e => !e.remove);

    this.banner(
      lock.boss
        ? (this.stageId === 3 ? 'BURGER ROOM' : this.stageId === 2 ? 'HABITACIÓN 302' : 'ARENA FINAL')
        : (this.stageId === 3 ? '¡EMBOSCADA CALLEJERA!' : this.stageId === 2 ? '¡EMBOSCADA HOSPITALARIA!' : '¡EMBOSCADA!'),
      lock.boss
        ? (this.stageId === 3 ? 'GAYTELOS TE ESPERA' : this.stageId === 2 ? 'CRYPTOCINO TE ESPERA' : 'EL REY DEL ARCADE TE ESPERA')
        : 'DERROTA A TODOS PARA AVANZAR',
      lock.boss ? (this.stageId === 3 ? '#ff5fae' : this.stageId === 2 ? '#ff8a3d' : '#ff5fae') : '#ff5a6e',
      2.4
    );
    Sound.sfx('token');
  }

  clearLock(lock) {
    lock.cleared = true;
    this.lockActive = false;
    this.activeLock = null;
    this.clearedLock = lock;
    this.goActive = true;
    this.addScore(750);
    this.banner('¡ZONA DESPEJADA!', 'GO! → AVANZA A LA DERECHA', '#7dffc4', 2.6);
    Sound.sfx('go');
    this.spawnBurst(this.player.x, this.player.y, 20, '#7dffc4');
  }

  minX() {
    if (this.lockActive && this.activeLock) return this.activeLock.camX + 46;
    return this.camera.x + 42;
  }

  maxX() {
    if (this.lockActive && this.activeLock) return this.activeLock.camX + CFG.W - 56;
    return Math.min(this.camera.x + CFG.W - 56, this.stage.width - 44);
  }

  /* ---------------- spawning ---------------- */
  spawnEnemy(type, x, y, silent = false) {
    const e = new Enemy(this, type, x, y);
    e.facing = this.player ? sign(this.player.x - x) || -1 : -1;
    this.enemies.push(e);
    if (!silent) {
      this.spawnBurst(x, y, 12, typeColor(type));
      Sound.sfx('token');
    }
    return e;
  }

  requestAttackSlot(e) {
    if (e.hasSlot) return true;
    let n = 0;
    for (const other of this.enemies) {
      if (other !== e && other.hasSlot && other.alive) n++;
    }
    if (n >= 2) return false;
    e.hasSlot = true;
    return true;
  }

  releaseAttackSlot(e) {
    e.hasSlot = false;
  }

  separateFighters(dt) {
    const all = this.enemies;
    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      if (!a.alive || a.state === 'grabbed' || a.state === 'thrown') continue;
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        if (!b.alive || b.state === 'grabbed' || b.state === 'thrown') continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minD = (a.def.halfW + b.def.halfW) * 0.9;
        if (Math.abs(dx) < minD && Math.abs(dy) < 16) {
          const push = (minD - Math.abs(dx)) * 0.5;
          const s = sign(dx) || 1;
          a.x -= s * push * dt * 9;
          b.x += s * push * dt * 9;
        }
      }
    }
    // keep enemies from standing inside the player
    if (this.player && this.player.alive) {
      for (const e of all) {
        if (!e.alive || e.state === 'grabbed') continue;
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        if (Math.abs(dx) < 22 && Math.abs(dy) < 12) {
          e.x += (sign(dx) || 1) * 34 * dt;
        }
      }
    }
  }

  /* ---------------- scoring / FX ---------------- */
  addScore(n, x, y) {
    this.score += n;
    if (this.score > this.hiScore) this.hiScore = this.score;
    if (x != null && y != null) {
      this.floatTexts.push(new FloatText('+' + n, x, y, '#ffe066'));
      if (this.floatTexts.length > 30) this.floatTexts.shift();
    }
  }

  addKill() {
    this.kills++;
    if (this.state === 'playing' && this.player) this.player.registerKill();
  }

  onPlayerLevelUp(p) {
    const pct = ((p.attackMul - 1) * 100).toFixed(1);
    this.levelMsg = {
      text: 'SUBISTE DE SAPONIVEL',
      sub: `NIVEL ${p.level} · ATK +${pct}% · ENERGÍA +${pct}% · DEF +${pct}%`,
      t: 3.2,
      max: 3.2,
    };
    this.ringText('¡NIVEL ' + p.level + '!', p.x, p.y - 160, '#ffe066');
    this.spawnBurst(p.x, p.y, 30, '#ffe066');
    this.shake(3, 0.2);
    Sound.sfx('levelup');
  }

  ringText(txt, x, y, color) {
    this.floatTexts.push(new FloatText(txt, x, y, color));
    if (this.floatTexts.length > 30) this.floatTexts.shift();
  }

  banner(txt, sub, color, dur = 2.4) {
    this.bannerData = { text: txt, sub: sub || '', color: color || '#ffd166', t: dur, max: dur };
  }

  hitstop(t) {
    if (t > this.hitstopT) this.hitstopT = t;
  }

  shake(mag, dur) {
    if (mag >= this.shakeMag) {
      this.shakeMag = mag;
      this.shakeDur = dur;
      this.shakeT = Math.max(this.shakeT, dur);
    } else {
      this.shakeT = Math.max(this.shakeT, dur * 0.6);
    }
  }

  addSlash(x, y, z, dir, heavy) {
    this.slashes.push(new Slash(x, y, z, dir, heavy));
  }

  spawnShockwave(x, y, maxR, dmg, color) {
    this.shockwaves.push(new Shockwave(this, x, y, maxR, dmg, color));
  }

  spawnSparks(x, y, z, count, kind = 'hit') {
    const palettes = {
      hit: ['#ffffff', '#ffe066', '#ffb347', '#ff6b6b'],
      wood: ['#d9a05b', '#a96b2f', '#f0c58a'],
      gold: ['#ffe066', '#fff3b0', '#ffb347'],
      heal: ['#7dffc4', '#c6ffe3', '#3fa564'],
      ice: ['#e6f8ff', '#8fd8ff', '#ffffff'],
      boss: ['#ff5fae', '#ff2e63', '#ffe066'],
    };
    const pal = palettes[kind] || palettes.hit;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle({
        x: x + rand(-10, 10),
        y: y + rand(-6, 6),
        z: z + rand(-10, 16),
        vx: rand(-190, 190),
        vy: rand(-40, 40),
        vz: rand(60, 240),
        life: rand(0.18, 0.4),
        size: rand(2, 5),
        color: choice(pal),
        gravity: 700,
        kind: chance(0.45) ? 'star' : 'spark',
        glow: kind === 'hit' ? '#ffd166' : null,
      }));
    }
  }

  spawnDust(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle({
        x: x + rand(-14, 14),
        y: y + rand(-4, 4),
        z: rand(1, 12),
        vx: rand(-70, 70),
        vy: rand(-20, 20),
        vz: rand(20, 90),
        life: rand(0.25, 0.5),
        size: rand(3, 8),
        color: chance(0.5) ? 'rgba(220,206,190,0.7)' : 'rgba(160,145,135,0.55)',
        gravity: 240,
        kind: 'pixel',
        drag: 3,
      }));
    }
  }

  spawnExplosion(x, y, z, color) {
    this.spawnSparks(x, y, z, 18, 'boss');
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle({
        x: x + rand(-20, 20), y: y + rand(-8, 8), z: z + rand(-20, 20),
        vx: rand(-230, 230), vy: rand(-60, 60), vz: rand(80, 320),
        life: rand(0.3, 0.7), size: rand(3, 8),
        color: choice([color, '#ff8a3d', '#ffd166', '#ff2e63', '#2b1b2e']),
        gravity: 640, kind: chance(0.6) ? 'pixel' : 'star', drag: 1.2,
      }));
    }
    this.particles.push(new Particle({
      x, y, z, vx: 0, vy: 0, vz: 40, life: 0.45, size: 26,
      color: '#ffb347', gravity: 0, kind: 'ring', drag: 0,
    }));
  }

  spawnDebris(x, y, type) {
    for (let i = 0; i < 14; i++) {
      this.particles.push(new Particle({
        x: x + rand(-16, 16), y: y + rand(-6, 6), z: rand(4, 44),
        vx: rand(-180, 180), vy: rand(-30, 30), vz: rand(90, 280),
        life: rand(0.35, 0.7), size: rand(3, 8),
        color: choice(['#c98a4b', '#9a5f2b', '#e2b06b', '#6d4522', '#3c7f80']),
        gravity: 800, kind: 'pixel', drag: 0.8, spin: rand(-8, 8),
      }));
    }
    this.spawnDust(x, y, 6);
  }

  spawnBurst(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU;
      this.particles.push(new Particle({
        x, y, z: 30,
        vx: Math.cos(a) * rand(60, 200),
        vy: Math.sin(a) * rand(10, 50),
        vz: rand(40, 200),
        life: rand(0.3, 0.65),
        size: rand(2, 5),
        color,
        gravity: 500,
        kind: 'plus',
        glow: color,
      }));
    }
  }

  updateEffects(dt) {
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);

    for (const f of this.floatTexts) f.update(dt);
    this.floatTexts = this.floatTexts.filter(f => f.life > 0);

    for (const s of this.slashes) s.update(dt);
    this.slashes = this.slashes.filter(s => s.life > 0);

    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.dead);

    for (const s of this.shockwaves) s.update(dt);
    this.shockwaves = this.shockwaves.filter(s => !s.done);

    for (const e of this.enemies) {
      if (e.alive) continue;
      // handled by enemy.update for dying fade
    }
  }

  cleanup(dt = 0) {
    for (const e of this.enemies) {
      if (!e.alive) {
        if (e.state !== 'dying') e.remove = true;
        continue;
      }
      if (e.state === 'grabbed' || e.state === 'thrown') continue;
      const offscreen = e.x < this.camera.x - 520 || e.x > this.camera.x + CFG.W + 650;
      if (offscreen) {
        e.offscreenT = (e.offscreenT || 0) + dt;
        if (e.offscreenT > 1.4) {
          e.alive = false;
          e.state = 'dying';
          e.deathT = 0;
          e.remove = true;
          e.releaseSlot();
        }
      } else {
        e.offscreenT = 0;
      }
    }
    this.enemies = this.enemies.filter(e => !e.remove);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.shockwaves = this.shockwaves.filter(s => !s.done);
  }

  /* ---------------- render ---------------- */
  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#08050e';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    if (this.state === 'intro') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CFG.W, CFG.H);
      return;
    }

    if (this.state === 'title') {
      this.drawTitleScreen(ctx);
      return;
    }

    if (this.state === 'stageselect') {
      HUD.stageSelect(ctx, this);
      this.drawCabinetOverlay(ctx);
      return;
    }

    if (this.state === 'teaser') {
      HUD.teaser(ctx, this);
      return;
    }

    if (this.state === 'briefing') {
      HUD.briefing(ctx, this);
      return;
    }

    if (this.state === 'stageclear') {
      HUD.stageClear(ctx, this);
      return;
    }

    this.renderWorld(ctx);

    if (this.state === 'continue') {
      HUD.continueScreen(ctx, this);
      this.drawCabinetOverlay(ctx);
      return;
    }

    if (this.state === 'victory') {
      HUD.victory(ctx, this);
      this.drawCabinetOverlay(ctx);
      return;
    }

    HUD.draw(ctx, this);
    drawNpcBubble(this, ctx);
    if (this.state === 'paused') HUD.pause(ctx, this);
    this.drawCabinetOverlay(ctx);
  }

  drawTitleScreen(ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // The cover fills the title screen behind the start prompt.
    const img = this.mainScreen;
    if (img && img.naturalWidth > 0) {
      const scale = Math.max(CFG.W / img.naturalWidth, CFG.H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, (CFG.W - dw) / 2, (CFG.H - dh) / 2, dw, dh);
      ctx.imageSmoothingEnabled = smoothing;
    }

    text(ctx, this.touchMode ? 'Toca para iniciar' : 'Pulsa ENTER para iniciar', CFG.W / 2, CFG.H / 2, 32, '#ffffff', {
      align: 'center',
      baseline: 'middle',
      outline: '#140a18',
      outlineW: 7,
      shadow: '#000000',
      shadowX: 2,
      shadowY: 4,
      spacing: 1,
    });
  }

  renderWorld(ctx) {
    ctx.save();
    let ox = 0, oy = 0;
    if (this.shakeT > 0 && this.shakeMag > 0) {
      const k = clamp(this.shakeT / Math.max(0.001, this.shakeDur), 0, 1);
      ox = rand(-1, 1) * this.shakeMag * k;
      oy = rand(-1, 1) * this.shakeMag * 0.6 * k;
    }
    ctx.translate(Math.round(ox), Math.round(oy));

    this.stage.drawBack(ctx, this.camera.x, this.time);

    // ground shockwaves sit under everyone
    for (const s of this.shockwaves) s.draw(ctx);

    const drawlist = [];
    for (const pr of this.stage.props) {
      if (!pr.dead) drawlist.push({ y: pr.y, kind: 'prop', o: pr });
    }
    for (const it of this.stage.items) {
      drawlist.push({ y: it.y, kind: 'item', o: it });
    }
    for (const e of this.enemies) {
      if (e.alive || e.state === 'dying') drawlist.push({ y: e.y, kind: 'enemy', o: e });
    }
    if (this.boss) drawlist.push({ y: this.boss.y, kind: 'boss', o: this.boss });
    if (this.npc) drawlist.push({ y: this.npc.y, kind: 'npc', o: this.npc });
    if (this.player && this.player.alive) drawlist.push({ y: this.player.y, kind: 'player', o: this.player });
    else if (this.player) drawlist.push({ y: this.player.y, kind: 'player', o: this.player });

    drawlist.sort((a, b) => a.y - b.y);

    for (const d of drawlist) {
      if (d.kind === 'prop') this.drawProp(ctx, d.o);
      else if (d.kind === 'item') this.stage.drawItem(ctx, d.o, this.camera.x, this.time);
      else if (d.kind === 'npc') drawNpc(this, ctx);
      else d.o.draw(ctx);
    }

    for (const pr of this.projectiles) pr.draw(ctx);
    for (const p of this.particles) p.draw(ctx, this.camera.x);
    for (const s of this.slashes) s.draw(ctx, this.camera.x);
    for (const f of this.floatTexts) f.draw(ctx, this.camera.x);

    this.drawForeground(ctx);
    ctx.restore();
  }

  drawProp(ctx, p) {
    const sx = p.x - this.camera.x;
    if (sx < -220 || sx > CFG.W + 220) return;
    const sprite = this.propSprites[p.type];
    if (!sprite) return;
    let tilt = 0;
    if (p.type === 'palm') tilt = Math.sin(this.time * 1.4 + p.wobble) * 0.022;
    if (p.flash > 0) tilt += Math.sin(this.time * 65) * 0.05;
    drawShadow(ctx, sx, p.y, p.def.hw * 2.1, 0, 0.9);
    const bounce = (this.stage && this.stage.bounceT > 0)
      ? Math.abs(Math.sin(this.time * 26 + p.x * 0.02)) * 12 * this.stage.bounceT
      : 0;
    drawSprite(ctx, sprite, 'idle', this.time, sx, p.y - bounce, {
      h: p.def.h,
      tilt,
      flash: p.flash > 0,
    });
  }

  drawForeground(ctx) {
    if (this.renderScale === 1) {
      const grad = ctx.createRadialGradient(CFG.W / 2, CFG.H / 2, 260, CFG.W / 2, CFG.H / 2, 660);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(4, 1, 10, 0.42)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
    }

    // low health pulse
    if (this.player && this.player.alive && this.player.hp / this.player.maxHp < 0.25) {
      const a = 0.10 + Math.abs(Math.sin(this.time * 6)) * 0.12;
      const vg = ctx.createRadialGradient(CFG.W / 2, CFG.H / 2, 200, CFG.W / 2, CFG.H / 2, 640);
      vg.addColorStop(0, 'rgba(255, 20, 60, 0)');
      vg.addColorStop(1, `rgba(255, 20, 60, ${a})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
    }

    // boss explosion / slow-mo flash
    if (this.flashScreen > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.55, this.flashScreen * 0.45)})`;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
    }
  }

  drawCabinetOverlay(ctx) {
    if (this.renderScale < 1) return;
    // rounded screen mask + glass glare
    ctx.save();
    ctx.globalAlpha = 0.16;
    const glare = ctx.createLinearGradient(0, 0, CFG.W, CFG.H);
    glare.addColorStop(0, 'rgba(255,255,255,0.5)');
    glare.addColorStop(0.25, 'rgba(255,255,255,0)');
    glare.addColorStop(0.75, 'rgba(255,255,255,0)');
    glare.addColorStop(1, 'rgba(120, 220, 255, 0.25)');
    ctx.fillStyle = glare;
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.restore();
  }
}

export { Game };
