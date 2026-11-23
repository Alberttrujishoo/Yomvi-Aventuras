const ACTIONS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  attack: ['KeyZ', 'KeyJ'],
  jump: ['KeyX', 'KeyK'],
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

function createInput() {
  const held = new Map();
  const pressed = new Set();
  const lastTap = new Map();
  const keys = new Set();
  let typed = '';

  return {
    dash: 0,
    anyKey: false,

    init(target = window) {
      target.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target?.closest?.('button')) return;
        const actions = codes.get(e.code);
        if (actions && e.code.startsWith('Arrow')) e.preventDefault();
        if (e.repeat || keys.has(e.code)) return;
        keys.add(e.code);
        if (/^[a-z]$/i.test(e.key)) typed = (typed + e.key.toUpperCase()).slice(-24);
        for (const action of actions ?? []) this.press(action, e.code);
      }, { passive: false });

      target.addEventListener('keyup', (e) => {
        keys.delete(e.code);
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
      keys.clear();
      lastTap.clear();
    },
  };
}

const Input = createInput();

export { Input, createInput };
