const CHARGE_SECONDS = 0.65;

const START_SCREEN_LABELS = new Map([
  ['title', 'Iniciar'],
  ['stageselect', 'Seleccionar'],
  ['tramposo', 'Abrir'],
  ['briefing', 'Empezar ya'],
  ['paused', 'Reanudar'],
  ['continue', 'Continuar'],
  ['victory', 'Volver al título'],
]);

const ACTIONS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  attack: ['KeyZ', 'KeyJ'],
  jump: ['KeyK'],
  special: ['KeyC', 'KeyL'],
  start: ['Enter', 'NumpadEnter', 'KeyZ'],
  stage1: ['Digit1', 'Numpad1'],
  stage2: ['Digit2', 'Numpad2'],
  stage3: ['Digit3', 'Numpad3'],
  pause: ['KeyP', 'Escape'],
  mute: ['KeyM'],
};

const codes = new Map();
for (const [action, bindings] of Object.entries(ACTIONS)) {
  for (const code of bindings) {
    if (!codes.has(code)) codes.set(code, []);
    codes.get(code).push(action);
  }
}

// Typing inside a field (YOMVI-TRAMPAS) must never reach the arcade controls.
function isEditableTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
}

function createInput() {
  const held = new Map();
  const charging = new Map();
  const pressed = new Set();
  const lastTap = new Map();
  const keys = new Set();
  let typed = '';

  return {
    dash: 0,
    anyKey: false,

    init(target = window) {
      target.addEventListener('keydown', (e) => {
        if (isEditableTarget(e.target)) return;
        if (e.key === 'Enter' && e.target?.closest?.('button')) return;
        const actions = codes.get(e.code);
        if (actions && e.code.startsWith('Arrow')) e.preventDefault();
        if (e.repeat || keys.has(e.code)) return;
        keys.add(e.code);
        if (/^[a-z]$/i.test(e.key)) typed = (typed + e.key.toUpperCase()).slice(-24);
        if (e.code === 'KeyX') this.beginCharge(e.code, 'jump');
        for (const action of actions ?? []) this.press(action, e.code);
      }, { passive: false });

      target.addEventListener('keyup', (e) => {
        keys.delete(e.code);
        if (e.code === 'KeyX') this.releaseCharge(e.code);
        for (const action of codes.get(e.code) ?? []) this.release(action, e.code);
      });

      target.addEventListener('blur', () => this.clear());
    },

    down(action) { return !!held.get(action)?.size; },
    hit(action) { return pressed.has(action); },

    press(action, source) {
      let sources = held.get(action);
      if (!sources) {
        sources = new Set();
        held.set(action, sources);
      }
      if (sources.has(source)) return;
      const first = sources.size === 0;
      sources.add(source);
      if (!first) return;

      this.tap(action);
      if (action === 'left' || action === 'right') {
        const now = performance.now();
        if (now - (lastTap.get(action) ?? -Infinity) < 300) {
          this.dash = action === 'left' ? -1 : 1;
        }
        lastTap.set(action, now);
      }
    },

    release(action, source) {
      const sources = held.get(action);
      if (!sources) return;
      sources.delete(source);
      if (!sources.size) held.delete(action);
    },

    beginCharge(source, tapAction) {
      charging.set(source, { tapAction, time: 0 });
    },

    releaseCharge(source, completed = true) {
      const charge = charging.get(source);
      if (!charge) return;
      charging.delete(source);
      if (completed) this.tap(charge.time >= CHARGE_SECONDS ? 'chargedAttack' : charge.tapAction);
    },

    updateCharges(dt) {
      for (const charge of charging.values()) charge.time = Math.min(CHARGE_SECONDS, charge.time + dt);
    },

    chargeProgress() {
      let progress = 0;
      for (const charge of charging.values()) progress = Math.max(progress, charge.time / CHARGE_SECONDS);
      return progress;
    },

    cancelCharges() { charging.clear(); },

    tap(action) {
      pressed.add(action);
      this.anyKey = true;
    },

    secret(sequence) {
      if (!sequence || !typed.endsWith(sequence)) return false;
      typed = '';
      return true;
    },

    endFrame() {
      pressed.clear();
      this.dash = 0;
      this.anyKey = false;
    },

    flush() {
      this.endFrame();
      typed = '';
    },

    clear() {
      this.flush();
      held.clear();
      this.cancelCharges();
      keys.clear();
      lastTap.clear();
    },
  };
}

const Input = createInput();

export { Input, START_SCREEN_LABELS, createInput };
