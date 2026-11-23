import { expect, test } from '@playwright/test';

const state = (page) => page.evaluate(() => window.GAME?.state);

test('launches the packaged game and combines alternate keyboard bindings', async ({ page }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  const media = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/')) media.push(new URL(request.url()).pathname);
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).click();
  await expect.poll(() => state(page)).toBe('title');
  expect(media.some((url) => /\/audio\/|arthas|cryptocino|gaytelos/.test(url))).toBe(false);
  await page.keyboard.press('Enter');
  await expect.poll(() => state(page)).toBe('briefing');
  await page.keyboard.press('Enter');
  await expect.poll(() => state(page)).toBe('playing');

  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('d');
  await page.keyboard.up('ArrowRight');
  const before = await page.evaluate(() => GAME.player.x);
  await expect.poll(() => page.evaluate(() => GAME.player.x)).toBeGreaterThan(before + 8);
  await page.keyboard.up('d');
  await page.keyboard.press('z');
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
  await page.keyboard.press('p');
  await expect.poll(() => state(page)).toBe('paused');
  await page.keyboard.press('p');
  await expect.poll(() => state(page)).toBe('playing');

  expect(failures).toEqual([]);
});

test('direct entry starts levels two and three, and normal transitions preserve progress', async ({ page }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).click();
  await expect.poll(() => state(page)).toBe('title');
  for (const id of [2, 3]) {
    await page.keyboard.press(String(id));
    await expect.poll(() => page.evaluate(() => [GAME.state, GAME.stageId])).toEqual(['playing', id]);
    await page.evaluate(() => GAME.toTitle());
  }

  await page.keyboard.press('1');
  await expect.poll(() => state(page)).toBe('playing');
  await page.evaluate(() => {
    window.previousPlayer = GAME.player;
    GAME.player.level = 4;
    GAME.player.lives = 2;
    GAME.score = 1234;
    GAME.kills = 12;
    GAME.onBossDefeated();
    GAME.teaserTime = 0;
  });
  await expect.poll(() => state(page)).toBe('stageclear');
  await page.evaluate(() => { GAME.stageClearTime = 0; });
  await expect.poll(() => page.evaluate(() => [GAME.state, GAME.stageId])).toEqual(['playing', 2]);
  expect(await page.evaluate(() => [
    GAME.player === window.previousPlayer, GAME.player.level, GAME.player.lives, GAME.score, GAME.kills,
  ])).toEqual([true, 4, 2, 11234, 12]);
  await page.evaluate(() => {
    GAME.onBossDefeated();
    GAME.teaserTime = 0;
  });
  await expect.poll(() => state(page)).toBe('stageclear');
  await page.evaluate(() => { GAME.stageClearTime = 0; });
  await expect.poll(() => page.evaluate(() => [GAME.state, GAME.stageId])).toEqual(['playing', 3]);
  expect(await page.evaluate(() => [
    GAME.player === window.previousPlayer, GAME.player.level, GAME.player.lives, GAME.score, GAME.kills,
  ])).toEqual([true, 4, 2, 26234, 12]);
  await page.evaluate(() => {
    GAME.onBossDefeated();
    GAME.teaserTime = 0;
  });
  await expect.poll(() => state(page)).toBe('victory');
  await page.keyboard.press('Enter');
  await expect.poll(() => state(page)).toBe('title');
  expect(failures).toEqual([]);
});

test('the intro can be served as partial video content', async ({ request }) => {
  const clip = await request.get('/assets/video/intro.mp4', { headers: { Range: 'bytes=0-255' } });
  expect(clip.status()).toBe(206);
  expect(clip.headers()['content-type']).toBe('video/mp4');
  expect(clip.headers()['content-range']).toMatch(/^bytes 0-255\/\d+$/);
  expect(await clip.body()).toHaveLength(256);
});
