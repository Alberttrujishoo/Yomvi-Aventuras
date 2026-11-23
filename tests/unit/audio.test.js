import assert from 'node:assert/strict';
import test from 'node:test';
import { Sound } from '../../src/media/audio.js';

test('the Toasty drum fill follows the MIDI timing and honors mute', () => {
  const tones = [];
  const noise = [];
  const audio = Object.create(Sound);
  audio.ready = true;
  audio.tone = (frequency, duration, type, volume, slide, delay) => tones.push([frequency, delay]);
  audio.noise = (duration, volume, filter, frequency, sweep, delay) => noise.push([filter, delay]);

  audio.muted = true;
  audio.sfx('toastyCameo');
  assert.deepEqual(tones, []);
  assert.deepEqual(noise, []);

  audio.muted = false;
  audio.sfx('toastyCameo');
  const triplet = 60 / 190 / 3;
  assert.deepEqual(tones, [190, 190, 190, 145, 145, 145, 118].map((frequency, i) => [frequency, i * triplet]));
  assert.deepEqual(noise.at(-1), ['highpass', 6 * triplet]);
});
