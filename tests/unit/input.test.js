import assert from 'node:assert/strict';
import test from 'node:test';
import { createInput } from '../../src/input/actions.js';

function keyboard() {
  const input = createInput();
  const target = new EventTarget();
  input.init(target);
  const key = (type, code, value) => {
    const event = Object.assign(new Event(type, { cancelable: true }), { code, key: value });
    target.dispatchEvent(event);
  };
  return { input, target, key };
}

test('a released binding leaves the other key and the joystick held', () => {
  const { input, key } = keyboard();
  const joystick = Symbol('joystick');
  key('keydown', 'ArrowRight', 'ArrowRight');
  assert.equal(input.hit('right'), true);
  input.endFrame();
  key('keydown', 'KeyD', 'd');
  input.press('right', joystick);
  assert.equal(input.hit('right'), false);
  assert.equal(input.dash, 0);
  key('keyup', 'ArrowRight', 'ArrowRight');
  assert.equal(input.down('right'), true);
  input.release('right', joystick);
  assert.equal(input.down('right'), true);
  key('keyup', 'KeyD', 'd');
  assert.equal(input.down('right'), false);
});

test('a real double tap still dashes and blur clears keyboard and touch', () => {
  const { input, target, key } = keyboard();
  key('keydown', 'KeyA', 'a');
  key('keyup', 'KeyA', 'a');
  input.endFrame();
  key('keydown', 'ArrowLeft', 'ArrowLeft');
  assert.equal(input.dash, -1);
  input.press('attack', Symbol('attack'));
  target.dispatchEvent(new Event('blur'));
  assert.equal(input.dash, 0);
  assert.equal(input.down('left'), false);
  assert.equal(input.down('attack'), false);
  assert.equal(input.hit('attack'), false);
});
