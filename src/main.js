import { clamp } from './engine/math.js';
import { Game } from './game/game.js';
import { Input } from './input/actions.js';
import { TouchControls } from './input/touch.js';
import { Assets } from './media/assets.js';
import { Sound } from './media/audio.js';
import { CheatMenu } from './ui/cheat-menu.js';
import { initFullscreen } from './ui/fullscreen.js';
import { playCreatorIntro } from './ui/intro.js';

/* ============================================================
   Boot: create the cabinet, load the PNG heroes, start the loop
   ============================================================ */
(function () {
  const canvas = document.getElementById('game');
  const loading = document.getElementById('loading');
  const statusEl = document.getElementById('loadStatus');
  const fillEl = document.getElementById('loadFill');

  Input.init();
  Sound.loadCoinSfx();

  const game = new Game(canvas, { compact: TouchControls.detect() });
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => { game.reducedMotion = motion.matches; };
  syncMotion();
  motion.addEventListener('change', syncMotion);
  window.GAME = game;
  TouchControls.init(game);
  CheatMenu.init(game);

  const startCreatorIntro = () => {
    game.skipIntro = playCreatorIntro(() => {
      game.skipIntro = null;
      game.state = 'title';
      Input.flush();
      CheatMenu.sync();
      initFullscreen();
    });
  };
  window.addEventListener('blur', () => game.gamepad.setFocused(false));
  window.addEventListener('focus', () => game.gamepad.setFocused(true));

  const setStatus = (msg, pct) => {
    if (statusEl) statusEl.textContent = msg;
    if (fillEl && typeof pct === 'number') fillEl.style.width = clamp(pct, 0, 100) + '%';
  };

  // A user gesture unlocks the Web Audio context (browser autoplay policy).
  const unlockAudio = () => {
    if (game.viewBlocked) return;
    Sound.init();
    Sound.resume();
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);

  const syncVisibility = () => game.setViewBlocked('hidden', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  void Assets.loadSpecialEffect();
  void Assets.loadCameos();
  Assets.loadTitle(setStatus).then(() => {
    game.applyAssets();
    game.muted = Sound.muted;

    // Do not let a key pressed during the loading screen skip the title.
    Input.flush();

    if (loading) {
      setTimeout(() => {
        loading.classList.add('hidden');
        setTimeout(() => { loading.style.display = 'none'; }, 500);
      }, 120);
    }
    game.startLoop();
    // Let the loading overlay fade before showing the creator intro.
    setTimeout(startCreatorIntro, 750);
  }).catch((err) => {
    console.warn('Asset load failed, using procedural art:', err);
    game.applyAssets();
    Input.flush();
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => { loading.style.display = 'none'; }, 400);
    }
    game.startLoop();
    setTimeout(startCreatorIntro, 650);
  });
})();
