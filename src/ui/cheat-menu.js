import { clamp } from '../engine/math.js';
import { Input } from '../input/actions.js';

/* ============================================================
   YOMVI-TRAMPAS — hidden code entry
   Lets players type the secret codes without a physical
   keyboard, which is the only way to reach them on mobile.
   ============================================================ */

const BUTTON_Y = 0.71; // button position inside the canvas (0 = top, 1 = bottom)
const normalize = (value) => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const CheatMenu = {
  game: null,
  ready: false,
  open: false,
  visible: false,
  btn: null,
  panel: null,
  card: null,
  form: null,
  input: null,
  msg: null,

  init(game) {
    if (this.ready) return;
    this.game = game;
    this.btn = document.getElementById('trampasBtn');
    this.panel = document.getElementById('trampas');
    this.card = this.panel?.querySelector('.trampas-card') ?? null;
    this.form = document.getElementById('trampasForm');
    this.input = document.getElementById('trampasInput');
    this.msg = document.getElementById('trampasMsg');
    if (!this.btn || !this.panel || !this.form || !this.input) return;
    this.ready = true;

    this.btn.addEventListener('click', () => this.openPanel());
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    });
    document.getElementById('trampasClose')?.addEventListener('click', () => this.closePanel());
    this.input.addEventListener('input', () => this.setMessage(''));

    // Escape closes the dialog without reaching the game's pause action.
    document.addEventListener('keydown', (event) => {
      if (!this.open || event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      this.closePanel();
    }, true);

    // Keep the button glued to the canvas on resize, rotation and fullscreen.
    const reposition = () => {
      if (this.visible) this.position();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('orientationchange', () => setTimeout(reposition, 160));
    document.addEventListener('fullscreenchange', reposition);
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(reposition).observe(game.canvas);
    }
    this.sync();
  },

  position() {
    const rect = this.game?.canvas?.getBoundingClientRect?.();
    if (!rect || !rect.width || !this.btn) return;
    this.btn.style.left = `${rect.left + rect.width / 2}px`;
    this.btn.style.top = `${rect.top + rect.height * BUTTON_Y}px`;
    this.btn.style.fontSize = `${clamp(rect.height * 0.032, 12, 18)}px`;
  },

  sync() {
    if (!this.ready) return;
    if (this.open && this.game.state !== 'title') {
      this.closePanel();
      return;
    }
    const show = this.game.state === 'title' && !this.open && !this.game.viewBlocked;
    if (show === this.visible) return;
    this.visible = show;
    this.btn.hidden = !show;
    if (show) this.position();
  },

  openPanel() {
    if (!this.ready || this.open) return;
    this.open = true;
    this.game.uiLocked = true;
    Input.clear();
    this.input.value = '';
    this.setMessage('');
    this.card?.classList.remove('shake');
    this.panel.classList.remove('hidden');
    this.panel.removeAttribute('aria-hidden');
    document.body.classList.add('trampas-open');
    this.visible = false;
    this.btn.hidden = true;
    // Focusing the field is what raises the native keyboard on mobile.
    setTimeout(() => this.input.focus(), 30);
  },

  closePanel() {
    if (!this.open) return;
    this.open = false;
    if (this.game) this.game.uiLocked = false;
    this.input?.blur();
    this.panel.classList.add('hidden');
    this.panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('trampas-open');
    this.setMessage('');
    Input.clear();
    this.visible = false;
    if (this.btn) this.btn.hidden = true;
    // Restore the menu button right away, even when the loop is not painting.
    this.sync();
  },

  submit() {
    if (!this.open) return;
    const code = normalize(this.input.value);
    if (!code) {
      this.setMessage('ESCRIBE UN CÓDIGO');
      this.shake();
      return;
    }
    const accepted = this.game.applyCheatCode(code);
    if (!accepted) {
      this.setMessage('CÓDIGO NO RECONOCIDO');
      this.shake();
      return;
    }
    this.input.value = '';
    this.closePanel();
  },

  setMessage(text) {
    if (!this.msg) return;
    this.msg.textContent = text;
    this.msg.classList.toggle('show', !!text);
  },

  shake() {
    if (!this.card) return;
    this.card.classList.remove('shake');
    // Reading the offset restarts the animation on repeated mistakes.
    void this.card.offsetWidth;
    this.card.classList.add('shake');
  },
};

export { CheatMenu };
