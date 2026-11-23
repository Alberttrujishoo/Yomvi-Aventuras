import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

test('touch starts the game, keeps simultaneous actions and pauses on rotation', async ({ page, context, browserName }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('title');
  await page.touchscreen.tap(420, 190);
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('briefing');
  await page.touchscreen.tap(420, 190);
  await expect.poll(() => page.evaluate(() => [GAME.state, GAME.canvas.width, GAME.canvas.height]))
    .toEqual(['playing', 720, 405]);

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
    await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
    await touch('touchEnd', []);
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
  await page.touchscreen.tap(420, 190);
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
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).tap();
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('title');
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
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotateHint')).toBeVisible();
  await page.evaluate(() => { GAME.continueTime = 0.2; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [GAME.state, GAME.continueTime])).toEqual(['continue', 0.2]);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => GAME.state)).toBe('title');
});
