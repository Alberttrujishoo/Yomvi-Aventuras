import { clamp } from './engine/math.js';
import { Game } from './game/game.js';
import { Input } from './input/actions.js';
import { TouchControls } from './input/touch.js';
import { Assets } from './media/assets.js';
import { Sound } from './media/audio.js';

/* ============================================================
   Boot: create the cabinet, load the PNG heroes, start the loop
   ============================================================ */
(function () {
  const canvas = document.getElementById('game');
  const loading = document.getElementById('loading');
  const statusEl = document.getElementById('loadStatus');
  const fillEl = document.getElementById('loadFill');

  Input.init();

  const game = new Game(canvas, { compact: TouchControls.detect() });
  window.GAME = game;
  // Hold the title screen until the creator intro video has finished.
  game.state = 'intro';
  if (typeof TouchControls !== 'undefined') TouchControls.init(game);

  const startCreatorIntro = () => {
    const intro = document.getElementById('intro');
    const video = document.getElementById('introVideo');
    const hint = document.getElementById('introHint');
    const skip = document.getElementById('skipIntro');
    if (!intro || !video) {
      game.state = 'title';
      Input.flush();
      return;
    }

    let finished = false;
    let blackTimer = 0;
    let safety = 0;

    const revealTitle = () => {
      if (blackTimer) { clearTimeout(blackTimer); blackTimer = 0; }
      game.state = 'title';
      Input.flush();
      intro.classList.add('hidden');
      intro.setAttribute('aria-hidden', 'true');
      intro.style.display = 'none';
    };

    const blackPhase = () => {
      if (finished) return;
      finished = true;
      if (safety) { clearTimeout(safety); safety = 0; }
      if (hint) hint.classList.remove('show');
      video.pause();
      introListeners.abort();
      video.style.opacity = '0';
      // Exactly two seconds of black before the presentation screen.
      blackTimer = setTimeout(revealTitle, 2000);
    };

    const unmute = () => {
      if (!video.muted) return;
      video.muted = false;
      video.volume = 0.9;
      if (hint) hint.classList.remove('show');
    };
    const introListeners = new AbortController();
    const { signal } = introListeners;
    window.addEventListener('pointerdown', unmute, { signal });
    window.addEventListener('keydown', unmute, { signal });
    skip?.addEventListener('click', () => {
      blackPhase();
      revealTitle();
    }, { signal });

    intro.style.display = 'flex';
    intro.classList.remove('hidden');
    intro.setAttribute('aria-hidden', 'false');
    video.style.opacity = '1';
    video.onended = blackPhase;
    video.onerror = blackPhase;
    // Safety net in case the video stalls and never fires "ended".
    safety = setTimeout(blackPhase, 20000);

    const tryPlay = (muted) => {
      video.muted = muted;
      video.volume = muted ? 0 : 0.9;
      let p;
      try { p = video.play(); } catch (e) { p = null; }
      if (!p || !p.then) return;
      p.then(() => {
        // Browsers usually block audible autoplay; offer a one-key unmute.
        if (!finished && muted && hint) hint.classList.add('show');
      }).catch(() => {
        if (finished) return;
        if (!muted) tryPlay(true);
        else blackPhase();
      });
    };
    tryPlay(false);
  };

  const setStatus = (msg, pct) => {
    if (statusEl) statusEl.textContent = msg;
    if (fillEl && typeof pct === 'number') fillEl.style.width = clamp(pct, 0, 100) + '%';
  };

  // A user gesture unlocks the Web Audio context (browser autoplay policy).
  const unlockAudio = () => {
    Sound.init();
    Sound.resume();
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);

  document.addEventListener('visibilitychange', () => {
    game.lastTs = 0;
    if (document.hidden) {
      Input.clear();
      if (game.state === 'playing') game.state = 'paused';
      Sound.suspend();
    }
  });

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
