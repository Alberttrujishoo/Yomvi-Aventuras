import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

async function openTitle(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('title');
}

async function startFromTitle(page) {
  await page.getByRole('button', { name: 'Iniciar', exact: true }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('briefing');
  await page.getByRole('button', { name: 'Empezar ya' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('playing');
}

async function startMobileGame(page) {
  await openTitle(page);
  await startFromTitle(page);
}

test('touch starts the game, keeps simultaneous actions and pauses on rotation', async ({ page, context, browserName }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await startMobileGame(page);
  expect(await page.evaluate(() => [GAME.canvas.width, GAME.canvas.height])).toEqual([720, 405]);

  const below = await page.evaluate(() => {
    const b = document.querySelector('#joystick').getBoundingClientRect();
    return { x: Math.round(b.x + b.width * 0.79), y: Math.round(b.y + b.height / 2), id: 1 };
  });
  const attack = page.getByRole('button', { name: 'Golpear' });
  const b = await attack.boundingBox();
  const button = { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), id: 2 };
  if (browserName === 'chromium') {
    const cdp = await context.newCDPSession(page);
    const touch = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    await touch('touchStart', [below]);
    await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('walk');
    await touch('touchStart', [below, button]);
    await expect.poll(() => page.evaluate(async () => (await import('/src/input/actions.js')).Input.chargeProgress()))
      .toBeGreaterThan(0);
    await touch('touchEnd', []);
    await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
    await cdp.detach();
  } else {
    await attack.tap();
    await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText('GIRA TU TELÉFONO', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('paused');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByText('GIRA TU TELÉFONO', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Reanudar' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('playing');
  expect(failures).toEqual([]);
});

test('plays the intro if the host sends a complete MP4 for range requests', async ({ page }) => {
  await page.route('**/assets/video/intro.mp4', async (route) => {
    const { range, ...headers } = route.request().headers();
    const response = await route.fetch({ headers });
    expect(response.status()).toBe(200);
    await route.fulfill({ response, headers: { 'Content-Type': 'video/mp4' } });
  });
  await page.goto('/');
  await expect.poll(() => page.locator('#introVideo').evaluate((video) => video.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.25);
  await page.getByRole('button', { name: 'Omitir intro' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('title');
});

test('portrait freezes briefing and continue timers and blocks keyboard resume', async ({ page }) => {
  await openTitle(page);
  await page.touchscreen.tap(420, 190);
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('briefing');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotateHint')).toBeVisible();
  await page.evaluate(() => { GAME.briefingTime = 0.2; });
  const time = await page.evaluate(() => GAME.time);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [GAME.state, GAME.briefingTime, GAME.time]))
    .toEqual(['briefing', 0.2, time]);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('playing');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('paused');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => GAME.state)).toBe('paused');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotateHint')).toBeHidden();
  await page.touchscreen.tap(420, 190);
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('playing');

  await page.evaluate(() => GAME.startContinue());
  await page.setViewportSize({ width: 667, height: 375 });
  const continueButton = page.getByRole('button', { name: 'Continuar', exact: true });
  await expect(continueButton).toBeVisible();
  const button = await continueButton.boundingBox();
  const canvas = await page.locator('#game').boundingBox();
  expect(button.x).toBeGreaterThan(canvas.x + canvas.width * 0.65);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotateHint')).toBeVisible();
  await page.evaluate(() => { GAME.continueTime = 0.2; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [GAME.state, GAME.continueTime])).toEqual(['continue', 0.2]);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('title');
});

test('the special renders two bottles and two compotes from the atlas and cleans up', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.specialSprites = [];
    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source instanceof HTMLImageElement && source.src.endsWith('/special-effect.webp')) {
        window.specialSprites.push(args.slice(0, 2));
      }
      return original.call(this, source, ...args);
    };
  });

  await startMobileGame(page);
  await expect.poll(() => page.evaluate(async () => Boolean((await import('/src/media/assets.js')).Assets.specialEffect)))
    .toBe(true);
  const initialHp = await page.evaluate(() => GAME.player.hp);
  await page.getByRole('button', { name: 'Giro especial' }).tap();
  await page.waitForFunction(() => GAME.player.specialEffect?.time >= 0.3);
  const frame = await page.evaluate(() => {
    window.specialSprites = [];
    GAME.render();
    return { sprites: window.specialSprites, hp: GAME.player.hp, compact: GAME.player.specialEffect.sparkCount };
  });
  expect(frame.sprites.filter(([x, y]) => x === 0 && y === 132)).toHaveLength(2);
  expect(frame.sprites.filter(([x, y]) => x === 40 && y === 132)).toHaveLength(2);
  expect(frame.sprites).toContainEqual([0, 0]);
  expect(frame.sprites).toContainEqual([0, 61]);
  expect(frame.hp).toBe(initialHp - 12);
  expect(frame.compact).toBeLessThan(22);
  await expect.poll(() => page.evaluate(() => GAME.player.specialEffect)).toBe(null);
  expect(errors).toEqual([]);
});

test('the Toasty cameo slides in on the fifth combo hit without covering touch controls', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source instanceof HTMLImageElement && source.src.endsWith('/toasty-cameo.webp')) {
        const { a, e, f } = this.getTransform();
        window.toastyFrame = { left: e + args[0] * a, right: e + (args[0] + args[2]) * a, bottom: f + (args[1] + args[3]) * a };
      }
      return drawImage.call(this, source, ...args);
    };
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (label, ...args) {
      if (label === 'TOASTY!') window.toastyCaptionDrawn = true;
      return fillText.call(this, label, ...args);
    };
  });
  await startMobileGame(page);
  await expect.poll(() => page.evaluate(async () => Boolean((await import('/src/media/assets.js')).Assets.toastyCameo)))
    .toBe(true);

  await page.evaluate(async () => {
    const { Sound } = await import('/src/media/audio.js');
    const playSound = Sound.sfx.bind(Sound);
    window.toastySounds = [];
    Sound.sfx = (name) => {
      if (name === 'toastyCameo') {
        window.toastySounds.push([GAME.comboCount, GAME.toastyCameoAge, Sound.ready]);
      }
      playSound(name);
    };
  });

  const attack = page.getByRole('button', { name: 'Golpear' });
  expect(await page.evaluate(() => {
    const { player, enemies } = GAME;
    GAME.bannerData = null;
    player.comboCount = 3;
    player.registerHit(0, false);
    enemies[0].x = player.x + 50;
    enemies[0].y = player.y;
    return [player.comboCount, GAME.toastyCameoAge, window.toastySounds.length];
  })).toEqual([4, null, 0]);
  await attack.tap();
  await page.waitForFunction(() => GAME.comboCount === 5 && GAME.toastyCameoAge >= 0.2 && window.toastyFrame);
  expect(await page.evaluate(() => {
    const age = GAME.toastyCameoAge;
    GAME.player.registerHit(0, false);
    return [GAME.comboCount, age !== null && GAME.toastyCameoAge === age, window.toastySounds];
  })).toEqual([6, true, [[5, 0, true]]]);
  const frame = await page.evaluate(() => window.toastyFrame);
  const canvas = await page.locator('#game').boundingBox();
  const special = await page.getByRole('button', { name: 'Giro especial' }).boundingBox();
  expect(frame.left).toBeGreaterThan(590);
  expect(frame.right).toBeLessThan(720);
  expect(await page.evaluate(() => window.toastyCaptionDrawn)).toBe(true);
  expect(canvas.y + (frame.bottom / 405) * canvas.height).toBeLessThan(special.y);
  await page.screenshot({ path: testInfo.outputPath('toasty-landscape.png'), scale: 'css' });
  await expect.poll(() => page.evaluate(() => GAME.toastyCameoAge)).toBe(null);
  expect(errors).toEqual([]);
});

test('combos restart between levels and Toasty leaves boss health visible', async ({ page }, testInfo) => {
  await startMobileGame(page);
  await expect.poll(() => page.evaluate(async () => Boolean((await import('/src/media/assets.js')).Assets.toastyCameo)))
    .toBe(true);

  const transition = await page.evaluate(() => {
    for (let hit = 0; hit < 4; hit++) GAME.player.registerHit(0, false);
    GAME.onBossDefeated();
    for (let step = 0; step < 1010; step++) GAME.update(1 / 60);
    GAME.player.registerHit(0, false);
    return [GAME.stageId, GAME.comboCount, GAME.toastyCameoAge];
  });
  expect(transition).toEqual([2, 1, null]);

  const bossFrame = await page.evaluate(() => {
    const arena = GAME.locks.find(lock => lock.boss);
    GAME.player.x = arena.triggerX;
    GAME.camera.x = arena.camX;
    GAME.activateLock(arena);
    GAME.updateLocks(0);
    GAME.boss.x = GAME.boss.introTarget;
    GAME.boss.update(1 / 60);
    GAME.boss.hp = GAME.boss.layerSize * 2.43;
    GAME.currentZone = GAME.stage.zoneAt(GAME.player.x);
    GAME.bannerData = null;
    GAME.shakeT = 0;

    for (let hit = 0; hit < 3; hit++) GAME.player.registerHit(0, false);
    GAME.render();
    const readHealthStrip = () => GAME.ctx.getImageData(280, 54, 284, 19).data;
    const before = readHealthStrip();
    const colors = [485, 610, 660, 722].map(x => {
      const [red, green, blue] = GAME.ctx.getImageData(Math.round(x * GAME.renderScale), 63, 1, 1).data;
      if (red < 75) return 'empty';
      return green > blue ? 'amber' : 'magenta';
    });
    GAME.player.registerHit(0, false);
    const triggeredAt = GAME.toastyCameoAge;
    GAME.toastyCameoAge = 0.3;
    GAME.render();
    const after = readHealthStrip();
    return {
      bossActive: GAME.boss.active,
      hits: GAME.comboCount,
      triggeredAt,
      colors,
      healthUncovered: before.every((channel, index) => channel === after[index]),
    };
  });
  expect(bossFrame).toEqual({
    bossActive: true,
    hits: 5,
    triggeredAt: 0,
    colors: ['amber', 'amber', 'magenta', 'empty'],
    healthUncovered: true,
  });
  await page.screenshot({ path: testInfo.outputPath('toasty-boss.png'), scale: 'css' });
});

test('Arthas rejecting an attack leaves the Toasty cameo waiting for the fifth effective hit', async ({ page }) => {
  await startMobileGame(page);
  const result = await page.evaluate(() => {
    const arena = GAME.locks.find(lock => lock.boss);
    GAME.player.x = arena.triggerX;
    GAME.camera.x = arena.camX;
    GAME.activateLock(arena);
    GAME.updateLocks(0);

    const { boss, player } = GAME;
    boss.x = boss.introTarget;
    boss.update(1 / 60);
    GAME.enemies = [];
    player.x = boss.x - 45;
    player.y = boss.y;
    player.facing = 1;

    const attack = () => {
      player.startAttack(0);
      player.performHit(0);
      return { hp: boss.hp, combo: GAME.comboCount, cameo: GAME.toastyCameoAge };
    };
    for (let hit = 0; hit < 3; hit++) attack();
    const fourth = attack();
    boss.state = 'leap';
    boss.z = 25;
    const rejected = attack();
    boss.state = 'idle';
    boss.z = 0;
    const fifth = attack();
    GAME.toastyCameoAge = 0.2;
    const sixth = attack();
    return { fourth, rejected, fifth, sixth };
  });

  expect(result.fourth).toEqual({ hp: 396, combo: 4, cameo: null });
  expect(result.rejected).toEqual(result.fourth);
  expect(result.fifth).toEqual({ hp: 390, combo: 5, cameo: 0 });
  expect(result.sixth).toEqual({ hp: 384, combo: 6, cameo: 0.2 });
});

test('the death portrait holds for three seconds before fading, across respawn and continue', async ({ page }, testInfo) => {
  await startMobileGame(page);
  await expect.poll(() => page.evaluate(async () => Boolean((await import('/src/media/assets.js')).Assets.deathCameo)))
    .toBe(true);
  const lateHit = await page.evaluate(async () => {
    const { RoxyFallingBurger } = await import('/src/game/roxy.js');
    const { Sound } = await import('/src/media/audio.js');
    const { player, enemies } = GAME;
    window.deathPortraits = 0;
    window.deathLines = new Set();
    const { ctx } = GAME;
    const drawImage = ctx.drawImage.bind(ctx);
    const fillText = ctx.fillText.bind(ctx);
    ctx.drawImage = (source, ...args) => {
      if (source instanceof HTMLImageElement && source.src.endsWith('/death-cameo.webp')) {
        window.deathPortraits++;
        window.deathOpacity = ctx.globalAlpha;
      }
      drawImage(source, ...args);
    };
    ctx.fillText = (label, ...args) => {
      if (label === 'YO CREO QUE' || label === 'SE MURIO!') window.deathLines.add(label);
      fillText(label, ...args);
    };
    GAME.showToastyCameo();
    player.comboCount = 3;
    player.registerHit(0, false);
    player.invuln = 0;
    player.takeHit(player.hp, player.x + 50);

    let posthumousDrumrolls = 0;
    const playSound = Sound.sfx.bind(Sound);
    Sound.sfx = (name) => {
      if (name === 'toastyCameo') posthumousDrumrolls++;
      playSound(name);
    };
    const enemy = enemies[0];
    const burger = new RoxyFallingBurger(GAME, enemy.x, enemy.y, 0, 18, player);
    burger.z = 1;
    burger.update(1 / 60);
    return [player.alive, GAME.comboCount, GAME.toastyCameoAge, posthumousDrumrolls];
  });
  expect(lateHit).toEqual([false, 5, null, 0]);
  await page.waitForFunction(() => !GAME.player.alive && GAME.player.deadT >= 0.2 && window.deathPortraits > 0);
  expect(await page.evaluate(() => [...window.deathLines].join(' '))).toBe('YO CREO QUE SE MURIO!');
  expect(await page.evaluate(() => GAME.toastyCameoAge)).toBe(null);
  await page.screenshot({ path: testInfo.outputPath('death-landscape.png'), scale: 'css' });
  await expect.poll(() => page.evaluate(() => [GAME.state, GAME.player.alive, GAME.player.lives]))
    .toEqual(['playing', true, 2]);
  expect(await page.evaluate(() => GAME.toastyCameoAge)).toBe(null);
  expect(await page.evaluate(() => {
    const count = window.deathPortraits;
    GAME.render();
    return [window.deathPortraits > count, window.deathOpacity];
  })).toEqual([true, 1]);

  await page.evaluate(() => {
    window.deathPortraits = 0;
    GAME.player.lives = 1;
    GAME.player.invuln = 0;
    GAME.player.takeHit(GAME.player.hp, GAME.player.x + 50);
  });
  await page.waitForFunction(() => !GAME.player.alive && window.deathPortraits > 0);
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('continue');
  const frames = await page.evaluate(() => {
    const opacity = () => {
      window.deathOpacity = null;
      GAME.render();
      return window.deathOpacity;
    };
    const onContinue = opacity();
    GAME.update(3.17 - GAME.deathCameoAge);
    const afterThreeSeconds = opacity();
    GAME.update(0.1);
    const duringFade = opacity();
    GAME.update(0.2);
    return { onContinue, afterThreeSeconds, duringFade, afterFade: opacity(), state: GAME.state };
  });
  expect(frames).toMatchObject({ onContinue: 1, afterThreeSeconds: 1, afterFade: null, state: 'continue' });
  expect(frames.duringFade).toBeGreaterThan(0);
  expect(frames.duringFade).toBeLessThan(1);
});

test('rapid taps on arcade buttons are handled as control input without zoom', async ({ page }) => {
  await startMobileGame(page);
  await page.evaluate(() => {
    window.controlTaps = [];
    window.addEventListener('touchend', event => {
      if (event.target.closest('[data-action="attack"]')) window.controlTaps.push(event.defaultPrevented);
    });
  });
  const attack = await page.getByRole('button', { name: 'Golpear' }).boundingBox();
  const x = attack.x + attack.width / 2;
  const y = attack.y + attack.height / 2;
  await page.touchscreen.tap(x, y);
  await page.touchscreen.tap(x, y);
  await expect.poll(() => page.evaluate(() => window.controlTaps)).toEqual([true, true]);
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
  expect(await page.evaluate(() => window.visualViewport.scale)).toBe(1);
});

test('fullscreen keeps touch controls usable and restores the game on exit', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  if (browserName === 'webkit') {
    await page.addInitScript(() => {
      // Playwright runs desktop WebKit. Model iPhone Safari's unavailable API.
      Object.defineProperty(document, 'fullscreenEnabled', { value: false });
    });
  }

  await openTitle(page);
  const fullscreen = page.getByRole('button', {
    name: browserName === 'webkit' ? 'Ampliar juego' : 'Pantalla completa',
  });
  const canvas = page.locator('#game');
  const initial = await canvas.boundingBox();
  await fullscreen.tap();
  await expect(fullscreen).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(browserName !== 'webkit');
  expect((await canvas.boundingBox()).width).toBeGreaterThan(initial.width);
  expect(await page.evaluate(() => GAME.state)).toBe('title');

  const startBox = await page.getByRole('button', { name: 'Iniciar', exact: true }).boundingBox();
  const fullscreenBox = await fullscreen.boundingBox();
  expect(fullscreenBox.x + fullscreenBox.width).toBeLessThan(startBox.x);
  await page.touchscreen.tap(startBox.x + startBox.width - 8, startBox.y + startBox.height - 8);
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('briefing');
  await expect(fullscreen).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Empezar ya' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('playing');
  await page.getByRole('button', { name: 'Giro especial' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('special');
  await fullscreen.tap();
  await expect(fullscreen).toHaveAttribute('aria-pressed', 'false');
  expect((await canvas.boundingBox()).width).toBeCloseTo(initial.width, 0);

  const manifest = await page.request.get('/assets/yomvi.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({ display: 'standalone' });
});
