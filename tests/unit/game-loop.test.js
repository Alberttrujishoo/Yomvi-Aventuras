import assert from 'node:assert/strict';
import test from 'node:test';
import { Game } from '../../src/game/game.js';
import { Input } from '../../src/input/actions.js';

function simulate(hz) {
  const game = Object.assign(Object.create(Game.prototype), {
    lastTs: 0, simulationTime: 0, time: 0, frames: 0, actions: 0,
    state: 'playing', gamepad: { poll() {} }, renderScale: 0.75, viewBlocks: new Set(),
    lastRenderedState: 'playing', nextRenderTime: 1000 / 60,
    render() { this.frames++; },
    update() { if (Input.hit('attack')) this.actions++; },
  });
  Input.tap('attack');
  for (let i = 1; i <= hz; i++) game.loop(i * 1000 / hz);
  return game;
}

test('simulation keeps real time at 20 FPS and mobile renders near 60 FPS at 90 Hz', () => {
  const original = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => {};
  try {
    for (const hz of [20, 60, 90, 120]) {
      const game = simulate(hz);
      assert.ok(Math.abs(game.time - 1) < 1e-9);
      assert.equal(game.frames, Math.min(hz, 60));
      assert.equal(game.actions, 1);
    }
  } finally {
    globalThis.requestAnimationFrame = original;
    Input.clear();
  }
});
