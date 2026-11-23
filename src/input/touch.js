import { Input } from './actions.js';

/* ============================================================
   YOMVI ADVENTURES — mobile / touch controls
   Virtual joystick, action buttons and tap-to-start.
   ============================================================ */

const joystickSource = Symbol('joystick');

const TouchControls = {
  game: null,
  isTouch: false,
  ready: false,
  joystick: null,
  knob: null,
  joystickPointer: null,
  active: false,
  intro: false,
  paused: false,
  resetButtons: [],
  dirs: { left: false, right: false, up: false, down: false },

  detect() {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  },

  init(game) {
    if (this.ready) return;
    this.ready = true;
    this.game = game;

    this.isTouch = this.detect();

    document.body.classList.toggle('touch', this.isTouch);
    game.touchMode = this.isTouch;
    this.updateOrientation();

    window.addEventListener('resize', () => this.updateOrientation());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateOrientation(), 160);
    });

    if (!this.isTouch) return;

    this.joystick = document.getElementById('joystick');
    this.knob = document.getElementById('joystickKnob');
    this.bindJoystick();
    this.bindButtons();
    this.bindPause();
    this.bindTapToStart();

    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });

    // Long-press context menus get in the way of arcade buttons.
    document.addEventListener('contextmenu', (e) => {
      if (e.target && e.target.closest && e.target.closest('#touch-controls')) {
        e.preventDefault();
      }
    });
  },

  updateOrientation() {
    const portrait = window.innerHeight > window.innerWidth;
    if (this.isTouch) {
      if (portrait) this.releaseAll();
      this.game.setViewBlocked('portrait', portrait);
    }
    document.body.classList.toggle('portrait', portrait);
    document.body.classList.toggle('landscape', !portrait);
  },

  sync() {
    if (!this.isTouch) return;
    const s = this.game && this.game.state;
    const active = s === 'playing' || s === 'paused';
    const paused = s === 'paused';
    if ((this.active && !active) || (paused && !this.paused)) this.releaseAll();
    this.paused = paused;
    if (active !== this.active) {
      document.body.classList.toggle('in-game', active);
      this.active = active;
    }
    const intro = s === 'intro';
    if (intro !== this.intro) {
      document.body.classList.toggle('in-intro', intro);
      this.intro = intro;
    }
  },

  releaseAll() {
    this.resetJoystick();
    for (const reset of this.resetButtons) reset();
  },

  bindJoystick() {
    const joy = this.joystick;
    const knob = this.knob;
    if (!joy || !knob) return;

    const setDir = (name, on) => {
      if (this.dirs[name] === on) return;
      this.dirs[name] = on;
      if (on) Input.press(name, joystickSource);
      else Input.release(name, joystickSource);
    };

    const move = (e) => {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = Math.max(1, rect.width * 0.34);
      const len = Math.hypot(dx, dy);
      if (len > max && len > 0) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      knob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      const nx = dx / max;
      const ny = dy / max;
      const dead = 0.3;
      setDir('left', nx < -dead);
      setDir('right', nx > dead);
      setDir('up', ny < -dead);
      setDir('down', ny > dead);
    };

    joy.addEventListener('pointerdown', (e) => {
      if (this.joystickPointer !== null) return;
      this.joystickPointer = e.pointerId;
      try { joy.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      e.preventDefault();
      move(e);
    }, { passive: false });

    joy.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joystickPointer) return;
      e.preventDefault();
      move(e);
    }, { passive: false });

    const end = (e) => {
      if (e.pointerId !== this.joystickPointer) return;
      this.joystickPointer = null;
      this.resetJoystick();
    };
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    joy.addEventListener('lostpointercapture', (e) => {
      if (e.pointerId === this.joystickPointer) {
        this.joystickPointer = null;
        this.resetJoystick();
      }
    });
  },

  resetJoystick() {
    const pointer = this.joystickPointer;
    this.joystickPointer = null;
    if (pointer !== null && this.joystick?.hasPointerCapture(pointer)) {
      this.joystick.releasePointerCapture(pointer);
    }
    if (this.knob) this.knob.style.transform = 'translate(0px, 0px)';
    for (const name of Object.keys(this.dirs)) {
      if (this.dirs[name]) Input.release(name, joystickSource);
      this.dirs[name] = false;
    }
  },

  bindButtons() {
    document.querySelectorAll('#touch-controls [data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      let pointerId = null;
      const source = Symbol(action);

      const down = (e) => {
        if (pointerId !== null) return;
        pointerId = e.pointerId;
        btn.classList.add('active');
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        e.preventDefault();
        Input.press(action, source);
      };

      const reset = () => {
        const pointer = pointerId;
        pointerId = null;
        if (pointer !== null && btn.hasPointerCapture(pointer)) btn.releasePointerCapture(pointer);
        btn.classList.remove('active');
        Input.release(action, source);
      };

      const up = (e) => {
        if (e.pointerId === pointerId) reset();
      };
      this.resetButtons.push(reset);
      btn.addEventListener('click', (e) => {
        if (e.detail === 0) Input.tap(action);
      });

      btn.addEventListener('pointerdown', down, { passive: false });
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    });
  },

  bindPause() {
    const btn = document.getElementById('pauseBtn');
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('active');
      Input.tap('pause');
    }, { passive: false });
    const up = () => btn.classList.remove('active');
    this.resetButtons.push(up);
    btn.addEventListener('click', (e) => {
      if (e.detail === 0) Input.tap('pause');
    });
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
  },

  bindTapToStart() {
    window.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (t && t.closest && (t.closest('#touch-controls') || t.closest('#intro') || t.closest('#rotateHint'))) return;
      const s = this.game.state;
      if (s === 'title' || s === 'stageselect' || s === 'briefing' || s === 'continue' || s === 'victory' || s === 'paused') {
        Input.tap('start');
      }
    }, { passive: true });
  },
};

export { TouchControls };
