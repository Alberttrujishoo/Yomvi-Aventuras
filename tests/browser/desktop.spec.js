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
  });

  for (const [id, score] of [[1, 17249], [2, 47264], [3, 97280]]) {
    await page.evaluate(() => {
      const arena = GAME.locks.find((lock) => lock.boss);
      GAME.player.x = arena.triggerX;
      GAME.camera.x = arena.camX;
      GAME.activateLock(arena);
      GAME.updateLocks(0);
      GAME.boss.x = GAME.boss.introTarget;
      GAME.boss.update(1 / 60);
      GAME.player.hp = GAME.player.maxHp - 40;
      GAME.player.invuln = 5;
    });
    const recoveryTime = await page.evaluate(() => GAME.bossRecoveryTime);
    expect(recoveryTime).toBeGreaterThan(9);
    expect(recoveryTime).toBeLessThanOrEqual(16);
    await page.evaluate(() => { GAME.bossRecoveryTime = 0; });
    await expect.poll(() => page.evaluate(() => GAME.stage.items.filter(item => item.recovery).length)).toBe(1);
    const recovery = await page.evaluate(() => {
      const item = GAME.bossRecovery;
      const player = GAME.player;
      player.x = item.x;
      player.y = item.y;
      return { hp: player.hp, maxHp: player.maxHp, heal: item.def.heal, type: item.type };
    });
    expect(recovery.type).toBe(['pastelito', 'firstaid', 'burger'][id - 1]);
    await expect.poll(() => page.evaluate(() => GAME.player.hp)).toBe(Math.min(recovery.maxHp, recovery.hp + recovery.heal));
    const defeated = await page.evaluate(() => {
      // Use the actual hit and death logic, then skip the teaser for this test.
      GAME.boss.takeHit(GAME.boss.hp, -1);
      return !GAME.boss.alive;
    });
    expect(defeated).toBe(true);
    await expect.poll(() => state(page), { timeout: 8000 }).toBe('teaser');
    expect(await page.evaluate(() => GAME.score)).toBe(score);
    await page.evaluate(() => { GAME.teaserTime = 0; });
    if (id < 3) {
      await expect.poll(() => state(page)).toBe('stageclear');
      await page.evaluate(() => { GAME.stageClearTime = 0; });
      await expect.poll(() => page.evaluate(() => [GAME.state, GAME.stageId])).toEqual(['playing', id + 1]);
      expect(await page.evaluate(() => [
        GAME.player === window.previousPlayer, GAME.player.level, GAME.player.lives, GAME.score, GAME.kills,
      ])).toEqual([true, 4, 2, score, 12]);
    }
  }
  await expect.poll(() => state(page)).toBe('victory');
  await page.keyboard.press('Enter');
  await expect.poll(() => state(page)).toBe('title');
  expect(failures).toEqual([]);
});

test('the intro can be served as partial video content', async ({ request }) => {
  test.skip(Boolean(process.env.YOMVI_BASE_URL), 'Verifies the bundled local server');
  const clip = await request.get('/assets/video/intro.mp4', { headers: { Range: 'bytes=0-255' } });
  expect(clip.status()).toBe(206);
  expect(clip.headers()['content-type']).toBe('video/mp4');
  expect(clip.headers()['content-range']).toMatch(/^bytes 0-255\/\d+$/);
  expect(await clip.body()).toHaveLength(256);
});


test('the natural end of the intro hides the skip control during the black screen', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('button', { name: 'Omitir intro' });
  await skip.waitFor();
  await page.locator('#introVideo').evaluate((video) => video.dispatchEvent(new Event('ended')));
  await expect(skip).toBeHidden();
  expect(await state(page)).toBe('intro');
  await expect.poll(() => state(page)).toBe('title');
});


test('a standard gamepad can start, move, attack, jump, pause and resume', async ({ page }) => {
  await page.addInitScript(() => {
    window.testPad = {
      index: 0, mapping: 'standard', connected: true, axes: [0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
    };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.testPad] });
  });
  const button = (index, pressed) => page.evaluate(([index, pressed]) => {
    window.testPad.buttons[index].pressed = pressed;
  }, [index, pressed]);

  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).waitFor();
  await button(9, true);
  await expect.poll(() => state(page)).toBe('title');
  await button(9, false);
  await page.waitForTimeout(50);
  await button(9, true);
  await expect.poll(() => state(page)).toBe('briefing');
  await button(9, false);
  await page.waitForTimeout(50);
  await button(0, true);
  await expect.poll(() => state(page)).toBe('playing');
  await button(0, false);

  const x = await page.evaluate(() => GAME.player.x);
  await page.evaluate(() => { window.testPad.axes[0] = 0.8; });
  await expect.poll(() => page.evaluate(() => GAME.player.x)).toBeGreaterThan(x + 12);
  await button(2, true);
  await expect.poll(() => page.evaluate(async () => (await import('/src/input/actions.js')).Input.chargeProgress()))
    .toBeGreaterThan(0);
  await button(2, false);
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
  await page.evaluate(() => { window.testPad.axes[0] = 0; });
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('idle');
  await button(0, true);
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('jump');
  await button(0, false);

  await button(9, true);
  await expect.poll(() => state(page)).toBe('paused');
  await button(9, false);
  await page.waitForTimeout(50);
  await button(9, true);
  await expect.poll(() => state(page)).toBe('playing');
});


test('X taps to jump and a full charge deals a heavy hit on release', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir intro' }).click();
  await expect.poll(() => state(page)).toBe('title');
  await page.keyboard.press('1');
  await expect.poll(() => state(page)).toBe('playing');

  await page.keyboard.press('x');
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('jump');
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('idle');

  await page.keyboard.down('x');
  await expect.poll(() => page.evaluate(async () => (await import('/src/input/actions.js')).Input.chargeProgress()))
    .toBe(1);
  expect(await page.evaluate(() => GAME.player.state)).toBe('idle');
  const enemyHp = await page.evaluate(() => {
    const enemy = GAME.enemies[0];
    enemy.x = GAME.player.x + 95;
    enemy.y = GAME.player.y;
    GAME.player.invuln = 2;
    return enemy.hp;
  });
  await page.keyboard.up('x');
  await expect.poll(() => page.evaluate(() => GAME.player.state)).toBe('attack');
  await expect.poll(() => page.evaluate(() => GAME.enemies[0]?.hp ?? 0))
    .toBeLessThanOrEqual(Math.max(0, enemyHp - 30));
});
