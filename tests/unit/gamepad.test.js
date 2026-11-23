import assert from 'node:assert/strict';
import test from 'node:test';
import { createInput } from '../../src/input/actions.js';
import { createGamepadInput } from '../../src/input/gamepad.js';

function makePad(index, mapping = 'standard') {
  return {
    index, mapping, connected: true, axes: [0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
}

test('maps gamepad buttons on press, while held buttons do not trigger twice', () => {
  const input = createInput();
  const pad = makePad(0);
  const gamepad = createGamepadInput(input, () => [pad]);

  pad.buttons[0].pressed = true;
  gamepad.poll('title');
  assert.equal(input.hit('start'), true);
  input.endFrame();
  gamepad.poll('playing');
  assert.equal(input.hit('jump'), false);
  pad.buttons[0].pressed = false;
  gamepad.poll('playing');
  for (const [index, action] of [[0, 'jump'], [1, 'special'], [2, 'attack'], [9, 'pause']]) {
    pad.buttons[index].pressed = true;
    gamepad.poll('playing');
    assert.equal(input.hit(action), true);
    input.endFrame();
  }
  gamepad.suspend();
  gamepad.poll('paused');
  assert.equal(input.hit('start'), false);
  pad.buttons[9].pressed = false;
  gamepad.poll('paused');
  pad.buttons[9].pressed = true;
  gamepad.poll('paused');
  assert.equal(input.hit('start'), true);
});

test('releases only the detached pad and tolerates analog stick drift', () => {
  const input = createInput();
  const standard = makePad(0);
  const generic = makePad(1, '');
  const keyboard = Symbol('keyboard');
  const gamepad = createGamepadInput(input, () => [standard, generic]);

  input.press('right', keyboard);
  standard.axes[0] = 0.5;
  generic.buttons[12].pressed = true;
  gamepad.poll('playing');
  standard.axes[0] = 0.3;
  gamepad.poll('playing');
  input.release('right', keyboard);
  assert.equal(input.down('right'), true);
  assert.equal(input.down('up'), true);
  standard.connected = false;
  gamepad.poll('playing');
  assert.equal(input.down('right'), false);
  assert.equal(input.down('up'), true);
  gamepad.suspend();
  assert.equal(input.down('up'), false);
});
