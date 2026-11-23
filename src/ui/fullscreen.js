function initFullscreen() {
  const root = document.documentElement;
  const button = document.getElementById('fullscreenBtn');
  let native = Boolean(document.fullscreenEnabled && root.requestFullscreen);

  function sync() {
    const expanded = document.fullscreenElement === root || root.classList.contains('game-expanded');
    const label = native ? 'Pantalla completa' : 'Ampliar juego';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(expanded));
    button.title = label;
    button.textContent = expanded ? '↙' : '⛶';
  }

  button.addEventListener('click', async () => {
    if (document.fullscreenElement === root) {
      await document.exitFullscreen().catch(sync);
      return;
    }
    if (native) {
      try {
        await root.requestFullscreen();
        return;
      } catch {
        native = false;
      }
    }
    root.classList.toggle('game-expanded');
    sync();
  });
  document.addEventListener('fullscreenchange', sync);
  sync();
  button.hidden = false;
}

export { initFullscreen };
