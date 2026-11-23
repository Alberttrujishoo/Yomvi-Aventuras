function playCreatorIntro(onFinish) {
  const intro = document.getElementById('intro');
  const video = document.getElementById('introVideo');
  const hint = document.getElementById('introHint');
  const skip = document.getElementById('skipIntro');
  const controller = new AbortController();
  const { signal } = controller;
  const originalSource = video.src;
  let finished = false;
  let fallbackStarted = false;
  let objectURL;

  const safety = setTimeout(() => finish(0), 20_000);

  function finish(blackTime = 2_000) {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    controller.abort();
    skip.hidden = true;
    hint.classList.remove('show');
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.style.opacity = '0';
    if (objectURL) URL.revokeObjectURL(objectURL);

    const revealTitle = () => {
      intro.classList.add('hidden');
      intro.setAttribute('aria-hidden', 'true');
      onFinish();
    };
    if (blackTime) setTimeout(revealTitle, blackTime);
    else revealTitle();
  }

  async function play(muted) {
    const source = video.src;
    video.muted = muted;
    video.volume = muted ? 0 : 0.9;
    try {
      await video.play();
      if (!finished && video.muted) hint.classList.add('show');
    } catch (error) {
      if (finished || source !== video.src) return;
      if (video.error || error.name === 'NotSupportedError') void tryBufferedVideo();
      else if (!muted) void play(true);
      else finish(0);
    }
  }

  async function tryBufferedVideo() {
    if (finished) return;
    if (objectURL) {
      finish(0);
      return;
    }
    if (fallbackStarted) return;
    fallbackStarted = true;

    // WebKit can reject the native source when a static host ignores byte ranges.
    try {
      const response = await fetch(originalSource, { signal });
      if (!response.ok) throw Error('Intro unavailable');
      const clip = await response.blob();
      if (finished) return;
      objectURL = URL.createObjectURL(clip);
      video.src = objectURL;
      await play(true);
    } catch {
      finish(0);
    }
  }

  const unmute = () => {
    if (!video.muted) return;
    video.muted = false;
    video.volume = 0.9;
    hint.classList.remove('show');
  };

  window.addEventListener('pointerdown', unmute, { signal });
  window.addEventListener('keydown', unmute, { signal });
  skip.addEventListener('click', () => finish(0), { signal });
  video.addEventListener('ended', () => finish(), { signal });
  video.addEventListener('error', () => { void tryBufferedVideo(); }, { signal });

  intro.classList.remove('hidden');
  intro.setAttribute('aria-hidden', 'false');
  if (video.error) void tryBufferedVideo();
  else void play(false);
}

export { playCreatorIntro };
