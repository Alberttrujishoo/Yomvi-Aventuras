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
