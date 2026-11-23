/* ============================================================
   YOMVI ADVENTURES — Web Audio chiptune engine + retro SFX
   ============================================================ */

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* Two-hand 16-step chiptune loops (32 steps = 2 bars). */
const SONGS = {
  mall: {
    bpm: 132,
    len: 32,
    channels: [
      {
        type: 'triangle', gain: 0.16, dur: 0.20, oct: 0,
        notes: [
          36, null, 36, null, 43, null, 43, null, 45, null, 45, null, 41, null, 41, null,
          38, null, 38, null, 43, null, 43, null, 45, null, 45, null, 41, null, 43, null,
        ],
      },
      {
        type: 'square', gain: 0.050, dur: 0.11, oct: 0,
        notes: [
          72, null, 76, 79, 76, null, 72, 74, 77, null, 76, null, 72, null, 67, null,
          72, null, 76, 79, 84, null, 79, 76, 74, null, 72, 74, 76, null, 74, null,
        ],
      },
      {
        type: 'square', gain: 0.030, dur: 0.07, oct: 0,
        notes: [
          null, null, [60, 64, 67], null, null, null, [60, 64, 67], null,
          null, null, [62, 65, 69], null, null, null, [62, 65, 69], null,
          null, null, [60, 64, 67], null, null, null, [60, 64, 67], null,
          null, null, [59, 62, 67], null, null, null, [59, 62, 67], null,
        ],
      },
    ],
    drums: [
      'k', null, 'h', 'k', 's', null, 'h', 'k', 'k', null, 'h', null, 's', null, 'h', 'h',
      'k', null, 'h', 'k', 's', null, 'h', 'k', 'k', null, 'h', 'k', 's', null, 'h', 's',
    ],
  },

  ice: {
    bpm: 124,
    len: 32,
    channels: [
      {
        type: 'triangle', gain: 0.15, dur: 0.22, oct: 0,
        notes: [
          33, null, 33, null, 40, null, 40, null, 45, null, 45, null, 43, null, 43, null,
          41, null, 41, null, 40, null, 40, null, 38, null, 38, null, 36, null, 38, null,
        ],
      },
      {
        type: 'square', gain: 0.045, dur: 0.13, oct: 0,
        notes: [
          69, null, 72, null, 76, null, 72, null, 77, null, 76, null, 72, null, 69, null,
          72, null, 76, null, 79, null, 76, null, 74, null, 72, null, 69, null, 68, null,
        ],
      },
      {
        type: 'triangle', gain: 0.035, dur: 0.09, oct: 1,
        notes: [
          null, null, 81, null, null, null, 84, null, null, null, 88, null, null, null, 84, null,
          null, null, 81, null, null, null, 79, null, null, null, 76, null, null, null, 74, null,
        ],
      },
    ],
    drums: [
      'k', null, 'h', null, 's', null, 'h', null, 'k', null, 'h', null, 's', null, 'h', 'h',
      'k', null, 'h', null, 's', null, 'h', null, 'k', null, 'h', 'k', 's', null, 'h', null,
    ],
  },

  boss: {
    bpm: 152,
    len: 32,
    channels: [
      {
        type: 'sawtooth', gain: 0.075, dur: 0.16, oct: 0,
        notes: [
          38, null, 38, 38, 41, null, 38, null, 43, null, 41, null, 38, null, 36, null,
          38, null, 38, 38, 41, null, 43, null, 45, null, 43, null, 41, null, 38, null,
        ],
      },
      {
        type: 'square', gain: 0.050, dur: 0.12, oct: 0,
        notes: [
          74, null, 77, 81, 82, null, 81, 77, 74, null, 72, 74, 77, null, 74, 72,
          69, null, 72, 74, 77, null, 81, 82, 84, null, 82, 81, 77, null, 74, null,
        ],
      },
      {
        type: 'square', gain: 0.026, dur: 0.07, oct: 0,
        notes: [
          null, 62, null, null, 65, null, null, 62, null, null, 69, null, 65, null, null, null,
          null, 62, null, null, 65, null, null, 67, null, null, 69, null, 72, null, null, null,
        ],
      },
    ],
    drums: [
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 'k', 'h',
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 's', 'h',
    ],
  },

  hospital: {
    bpm: 150,
    len: 32,
    channels: [
      {
        type: 'sawtooth', gain: 0.070, dur: 0.16, oct: 0,
        notes: [
          45, null, 45, 45, 52, null, 45, null, 41, null, 41, 43, 45, null, 43, null,
          45, null, 45, 45, 52, null, 55, null, 53, null, 52, null, 48, null, 45, null,
        ],
      },
      {
        type: 'square', gain: 0.047, dur: 0.12, oct: 0,
        notes: [
          69, null, 72, 76, 81, null, 76, 72, 77, null, 76, 72, 69, null, 67, null,
          69, null, 72, 76, 81, null, 84, 81, 77, null, 76, 72, 69, null, 67, 64,
        ],
      },
      {
        type: 'triangle', gain: 0.035, dur: 0.09, oct: 1,
        notes: [
          null, 81, null, 84, null, 88, null, 84, null, 81, null, 77, null, 76, null, 72,
          null, 81, null, 84, null, 88, null, 91, null, 88, null, 84, null, 81, null, 77,
        ],
      },
    ],
    drums: [
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 'h', 'k',
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 's', 'h',
    ],
  },

  street: {
    bpm: 118,
    len: 32,
    channels: [
      {
        type: 'triangle', gain: 0.155, dur: 0.20, oct: 0,
        notes: [
          38, null, 38, null, 41, null, 45, null, 43, null, 41, null, 38, null, 36, null,
          38, null, 38, 41, 43, null, 45, null, 48, null, 45, 43, 41, null, 38, null,
        ],
      },
      {
        type: 'square', gain: 0.048, dur: 0.12, oct: 0,
        notes: [
          74, null, 77, 79, null, 77, 74, null, 79, null, 81, null, 79, 77, null, 74,
          76, null, 79, 81, null, 79, 76, null, 74, null, 77, 79, 81, null, 79, null,
        ],
      },
      {
        type: 'square', gain: 0.026, dur: 0.08, oct: 0,
        notes: [
          null, [62, 65, 69], null, null, [62, 65, 69], null, [60, 64, 67], null,
          null, [60, 64, 67], null, null, [62, 65, 69], null, [59, 62, 67], null,
          null, [62, 65, 69], null, null, [62, 65, 69], null, [60, 64, 67], null,
          null, [60, 64, 67], null, [62, 65, 69], null, [59, 62, 67], null, null,
        ],
      },
    ],
    drums: [
      'k', null, 'h', 'k', 's', null, 'h', null, 'k', 'h', null, 'k', 's', null, 'h', 'h',
      'k', null, 'h', 'k', 's', null, 'h', null, 'k', 'h', 'k', null, 's', null, 'h', 'k',
    ],
  },

  burger: {
    bpm: 174,
    len: 32,
    channels: [
      {
        type: 'sawtooth', gain: 0.082, dur: 0.15, oct: 0,
        notes: [
          40, null, 40, 43, 40, null, 47, null, 45, null, 43, null, 40, null, 38, null,
          40, null, 40, 43, 45, null, 47, null, 50, null, 47, 45, 43, null, 40, null,
        ],
      },
      {
        type: 'square', gain: 0.055, dur: 0.1, oct: 0,
        notes: [
          76, null, 79, 83, 84, null, 83, 79, 76, null, 74, 76, 81, null, 79, 76,
          71, null, 74, 76, 79, null, 83, 84, 86, null, 84, 83, 81, null, 79, 76,
        ],
      },
      {
        type: 'square', gain: 0.028, dur: 0.055, oct: 0,
        notes: [
          null, 64, null, 67, null, 71, null, 67, null, 64, null, 67, null, 69, null, 71,
          null, 64, null, 67, null, 71, null, 74, null, 71, null, 67, null, 64, null, 60,
        ],
      },
    ],
    drums: [
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 'k', 'h',
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 's', 'h', 'k', 'h', 's', 'k',
    ],
  },

  boss2: {
    bpm: 164,
    len: 32,
    channels: [
      {
        type: 'sawtooth', gain: 0.080, dur: 0.15, oct: 0,
        notes: [
          38, null, 38, 41, 38, null, 36, null, 43, null, 41, null, 38, null, 36, null,
          38, null, 38, 41, 38, null, 43, null, 45, null, 44, null, 43, null, 41, null,
        ],
      },
      {
        type: 'square', gain: 0.055, dur: 0.11, oct: 0,
        notes: [
          74, null, 77, 81, 82, null, 81, 77, 74, null, 72, 74, 79, null, 77, 74,
          69, null, 72, 74, 77, null, 81, 82, 84, null, 82, 81, 79, null, 77, 74,
        ],
      },
      {
        type: 'square', gain: 0.030, dur: 0.06, oct: 0,
        notes: [
          null, 62, null, 65, null, 69, null, 65, null, 62, null, 65, null, 67, null, 69,
          null, 62, null, 65, null, 69, null, 72, null, 69, null, 65, null, 62, null, 58,
        ],
      },
    ],
    drums: [
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 'k', 'h',
      'k', 'h', 'h', 'k', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'k', 's', 'h', 's', 'k',
    ],
  },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.musicOn = true;
    this.track = null;
    this.step = 0;
    this.nextTime = 0;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.noiseBuf = null;

    // optional external themes: Stage 1/2/3 + shared boss theme (Boss2.mp3)
    this.externalTracks = {
      level:   { el: null, ready: false, volume: 0.42 },
      level2:  { el: null, ready: false, volume: 0.44 },
      level3:  { el: null, ready: false, volume: 0.44 },
      bossMp3: { el: null, ready: false, volume: 0.5 },
    };
    this.external = null;        // currently active <audio> element
    this.externalName = null;    // 'level' | 'level2' | 'level3' | 'bossMp3'
    this.externalReady = false;  // active external theme is loaded
    this.externalPlaying = false;
    this.externalVolume = 0.42;
    this.wantsLevel = false;     // an external MP3 should be playing
    this.desiredTrack = null;

    // Hidden-code confirmation sound (Common coin.ogg).
    this.coinSfx = null;
    this.coinSfxVolume = 0.6;
    this.coinSfxPath = 'assets/audio/Common coin.ogg';
  }

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    try {
      this.ctx = new AC();
    } catch (e) {
      return;
    }

    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.72;
    this.master.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.0;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    const len = Math.floor(ctx.sampleRate * 1.2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    this.ready = true;
    this.musicBus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.3);

    if (this.wantsLevel) {
      const slot = this.externalTracks[this.externalName || 'level'];
      if (slot && slot.ready) this.startExternal(this.externalName || 'level');
    } else if (this.desiredTrack) {
      this.setTrack(this.desiredTrack, true);
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this.wantsLevel && !this.externalPlaying) {
      const name = this.externalName || 'level';
      const slot = this.externalTracks[name];
      if (slot && slot.ready) this.startExternal(name);
    }
  }

  suspend() {
    this.stopExternal();
    if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => {});
  }

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.now(), 0.03);
    }
    for (const key of Object.keys(this.externalTracks)) {
      const slot = this.externalTracks[key];
      if (!slot.el) continue;
      slot.el.muted = this.muted;
      slot.el.volume = this.muted ? 0 : slot.volume;
    }
    if (this.coinSfx) {
      this.coinSfx.muted = this.muted;
      this.coinSfx.volume = this.muted ? 0 : this.coinSfxVolume;
    }
    return this.muted;
  }

  /* ---------- external level themes (optional MP3) ---------- */
  hasExternal(name) {
    const slot = this.externalTracks[name];
    return !!(slot && slot.ready && slot.el);
  }

  /* ---------- hidden-code coin sound ---------- */
  loadCoinSfx() {
    if (this.coinSfx) return this.coinSfx;
    try {
      const el = new Audio(this.coinSfxPath);
      el.preload = 'auto';
      el.volume = this.muted ? 0 : this.coinSfxVolume;
      el.muted = this.muted;
      this.coinSfx = el;
    } catch (e) {
      this.coinSfx = null;
    }
    return this.coinSfx;
  }

  playCoinSfx() {
    const el = this.loadCoinSfx();
    if (!el) {
      this.sfx('coin');
      return;
    }
    el.muted = this.muted;
    el.volume = this.muted ? 0 : this.coinSfxVolume;
    try { el.currentTime = 0; } catch (e) { /* noop */ }
    let p = null;
    try { p = el.play(); } catch (e) { p = null; }
    if (p && p.catch) {
      p.catch(() => {
        // If the browser blocks the audio element, use the procedural coin.
        this.sfx('coin');
      });
    }
  }

  loadLevelMusic(paths, name = 'level') {
    const slot = this.externalTracks[name];
    return slot.load ??= this.loadExternalAlternatives(paths, slot, name);
  }

  async loadExternalAlternatives(paths, slot, name) {
    for (const src of paths) {
      const el = new Audio();
      el.preload = 'auto';
      el.loop = true;
      el.volume = 0;
      el.src = src;

      const ok = await new Promise((resolve) => {
        let done = false;
        const finish = (v) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          el.removeEventListener('canplaythrough', good);
          el.removeEventListener('error', bad);
          resolve(v);
        };
        const good = () => finish(true);
        const bad = () => finish(false);
        el.addEventListener('canplaythrough', good, { once: true });
        el.addEventListener('error', bad, { once: true });
        const timer = setTimeout(() => finish(el.readyState >= 2), 7000);
        el.load();
      });

      if (ok && el.readyState >= 2) {
        slot.el = el;
        slot.ready = true;
        el.volume = this.muted ? 0 : slot.volume;
        el.muted = this.muted;
        if (this.wantsLevel && this.externalName === name) this.startExternal(name);
        return true;
      }
      el.src = '';
    }
    return false;
  }

  startExternal(name) {
    const key = name || this.externalName || 'level';
    const slot = this.externalTracks[key];
    if (!slot || !slot.el) return false;

    // Only one external theme may sound at a time.
    for (const other of Object.keys(this.externalTracks)) {
      const t = this.externalTracks[other];
      if (!t.el || other === key) continue;
      try { t.el.pause(); } catch (e) { /* noop */ }
    }

    const el = slot.el;
    this.external = el;
    this.externalName = key;
    this.externalVolume = slot.volume;
    this.externalReady = true;
    el.muted = this.muted;
    el.volume = this.muted ? 0 : slot.volume;
    const request = Symbol('play');
    this.externalPlayRequest = request;
    this.externalPlaying = true;
    const blocked = () => {
      if (this.externalPlayRequest === request) this.externalPlaying = false;
    };
    try {
      el.play()?.catch(blocked);
    } catch {
      blocked();
    }
    return this.externalPlaying;
  }

  stopExternal() {
    this.externalPlayRequest = null;
    for (const key of Object.keys(this.externalTracks)) {
      const slot = this.externalTracks[key];
      if (!slot.el) continue;
      try { slot.el.pause(); } catch (e) { /* noop */ }
    }
    this.externalPlaying = false;
  }

  restartExternal() {
    const slot = this.externalTracks[this.externalName];
    if (!slot || !slot.el) return;
    try { slot.el.currentTime = 0; } catch (e) { /* noop */ }
    if (this.wantsLevel) this.startExternal(this.externalName);
  }

  setTrack(name, force = false) {
    this.desiredTrack = name;

    if (name === 'level' || name === 'level2' || name === 'level3' || name === 'bossMp3') {
      this.wantsLevel = true;
      this.track = null;
      this.externalName = name;
      const slot = this.externalTracks[name];
      this.external = slot ? slot.el : null;
      this.externalReady = !!(slot && slot.ready);
      if (this.musicBus) {
        this.musicBus.gain.cancelScheduledValues(this.now());
        this.musicBus.gain.setTargetAtTime(0, this.now(), 0.1);
      }
      if (slot && slot.ready) this.startExternal(name);
      return;
    }

    this.wantsLevel = false;
    this.stopExternal();

    if (!this.ready) {
      this.track = name;
      return;
    }
    if (this.track === name && !force) return;
    this.track = name;
    this.step = 0;
    this.nextTime = this.now() + 0.08;
    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(this.now());
      this.musicBus.gain.setTargetAtTime(name ? 0.5 : 0, this.now(), 0.12);
    }
  }

  stopMusic() {
    this.desiredTrack = null;
    this.wantsLevel = false;
    this.track = null;
    this.stopExternal();
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(0, this.now(), 0.1);
  }

  /* ---------- music sequencer ---------- */
  update() {
    if (!this.ready || !this.track) return;
    const ctx = this.ctx;
    const song = SONGS[this.track];
    if (!song) return;

    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.03;
    const stepDur = 60 / song.bpm / 4;

    let guard = 0;
    while (this.nextTime < ctx.currentTime + 0.18 && guard++ < 24) {
      this.scheduleStep(song, this.step, this.nextTime);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % song.len;
    }
  }

  scheduleStep(song, step, time) {
    for (const ch of song.channels) {
      const n = ch.notes[step];
      if (n == null) continue;
      const notes = Array.isArray(n) ? n : [n];
      for (const m of notes) this.musicNote(m + (ch.oct || 0) * 12, time, ch.dur, ch.type, ch.gain, ch);
    }
    const drum = song.drums[step];
    if (!drum) return;
    if (drum === 'k') this.kick(time);
    else if (drum === 's') this.snare(time);
    else if (drum === 'h') this.hat(time);
  }

  musicNote(midi, time, dur, type, gain, ch = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(midi), time);
    if (ch.slide) osc.frequency.exponentialRampToValueAtTime(midiToFreq(midi + ch.slide), time + dur);

    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  kick(time) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.13);
    g.gain.setValueAtTime(0.22, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    o.connect(g); g.connect(this.musicBus);
    o.start(time); o.stop(time + 0.17);
  }

  snare(time) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.10, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(time); src.stop(time + 0.12);
  }

  hat(time) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(time); src.stop(time + 0.04);
  }

  /* ---------- SFX primitives ---------- */
  tone(freq, dur, type = 'square', vol = 0.18, slideTo = null, delay = 0, bus = null) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur = 0.1, vol = 0.2, filterType = 'lowpass', freq = 1400, freqTo = null, delay = 0) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(freq, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    f.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // chord helper used by fanfares
  chord(midis, dur = 0.5, type = 'square', vol = 0.05, delay = 0) {
    midis.forEach((m, i) => this.tone(midiToFreq(m), dur, type, vol, null, delay + i * 0.012));
  }

  sfx(name) {
    if (!this.ready) return;
    switch (name) {
      case 'punch1':
        this.tone(240, 0.07, 'square', 0.13, 90);
        this.noise(0.05, 0.08, 'highpass', 2400);
        break;
      case 'punch2':
        this.tone(190, 0.09, 'square', 0.15, 70);
        this.noise(0.07, 0.10, 'bandpass', 1600);
        break;
      case 'heavy':
        this.tone(130, 0.19, 'sine', 0.30, 40);
        this.tone(320, 0.09, 'square', 0.10, 90);
        this.noise(0.16, 0.16, 'lowpass', 1200, 240);
        break;
      case 'hit':
        this.tone(420, 0.08, 'square', 0.10, 140);
        this.noise(0.06, 0.10, 'highpass', 3000);
        break;
      case 'jump':
        this.tone(300, 0.16, 'square', 0.10, 700);
        break;
      case 'land':
        this.noise(0.10, 0.12, 'lowpass', 620, 180);
        break;
      case 'throw':
        this.noise(0.24, 0.16, 'bandpass', 500, 2600);
        this.tone(180, 0.2, 'triangle', 0.08, 480);
        break;
      case 'shotgun':
        this.noise(0.16, 0.22, 'lowpass', 1800, 300);
        this.tone(95, 0.18, 'sawtooth', 0.24, 40);
        this.tone(260, 0.05, 'square', 0.10, 90);
        break;
      case 'splat':
        this.noise(0.12, 0.12, 'bandpass', 400, 1200);
        this.tone(120, 0.10, 'triangle', 0.12, 50);
        break;
      case 'special':
        this.tone(180, 0.42, 'sawtooth', 0.12, 1050);
        this.noise(0.38, 0.12, 'highpass', 900, 4200);
        this.chord([60, 64, 67, 72], 0.4, 'square', 0.03, 0.05);
        break;
      case 'ferozCameo': {
        if (this.muted) break;
        // Heavenis57drum.mid, 30.95–31.58 s: six tom hits in triplets into a kick and crash.
        const triplet = 60 / 190 / 3;
        const toms = [190, 190, 190, 145, 145, 145];
        for (const [index, frequency] of toms.entries()) {
          const delay = index * triplet;
          this.tone(frequency, 0.12, 'sine', 0.27, frequency * 0.62, delay);
          this.noise(0.04, 0.08, 'bandpass', 950, null, delay);
        }
        const accent = toms.length * triplet;
        this.tone(118, 0.15, 'sine', 0.28, 48, accent);
        this.noise(0.36, 0.19, 'highpass', 4100, 2500, accent);
        break;
      }
      case 'enemyDie':
        this.tone(340, 0.28, 'square', 0.11, 55);
        this.noise(0.26, 0.16, 'lowpass', 2600, 200);
        break;
      case 'bossHurt':
        this.tone(150, 0.22, 'sawtooth', 0.16, 60);
        this.noise(0.18, 0.13, 'lowpass', 900);
        break;
      case 'coin':
        this.tone(988, 0.06, 'square', 0.12);
        this.tone(1319, 0.22, 'square', 0.12, null, 0.07);
        break;
      case 'go':
        [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.13, null, i * 0.11));
        break;
      case 'heal':
        [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.10, null, i * 0.06));
        break;
      case 'levelup':
        [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.11, null, i * 0.055));
        this.tone(1568, 0.4, 'square', 0.07, null, 0.23);
        break;
      case 'token':
        this.tone(880, 0.12, 'square', 0.08, 1320);
        break;
      case 'slam':
        this.tone(95, 0.34, 'sine', 0.32, 30);
        this.noise(0.3, 0.22, 'lowpass', 900, 120);
        break;
      case 'grab':
        this.tone(220, 0.06, 'square', 0.08);
        this.tone(180, 0.07, 'square', 0.08, null, 0.05);
        break;
      case 'start':
        this.chord([60, 64, 67, 72], 0.3, 'square', 0.06);
        this.tone(1046, 0.4, 'triangle', 0.10, null, 0.15);
        break;
      case 'gameover':
        [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.42, 'triangle', 0.12, null, i * 0.24));
        break;
      case 'victory':
        [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) =>
          this.tone(f, i === 7 ? 0.9 : 0.26, 'square', 0.10, null, i * 0.15));
        break;
      case 'enrage':
        this.tone(90, 0.7, 'sawtooth', 0.18, 240);
        this.noise(0.6, 0.15, 'lowpass', 700, 2400);
        break;
      case 'stageclear':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i === 4 ? 0.8 : 0.22, 'triangle', 0.11, null, i * 0.13));
        break;
      case 'dialog':
        this.tone(880, 0.06, 'square', 0.10);
        this.tone(660, 0.06, 'square', 0.10, null, 0.09);
        this.tone(990, 0.08, 'square', 0.10, null, 0.18);
        break;
      case 'blip':
        this.tone(740, 0.045, 'square', 0.055);
        break;
      case 'candle':
        this.tone(1400, 0.10, 'square', 0.06, 420);
        this.tone(1900, 0.08, 'square', 0.04, 600, 0.04);
        break;
      case 'select':
        this.tone(660, 0.06, 'square', 0.09);
        break;
      default:
        break;
    }
  }
}

const Sound = new AudioEngine();

export { Sound };
