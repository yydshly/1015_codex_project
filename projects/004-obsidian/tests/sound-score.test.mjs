import test from 'node:test';
import assert from 'node:assert/strict';
import { soundWeights, normalizeSound, SOUND_SCENES, originalEventTiming } from '../web/assets/sound-score.mjs';

test('the reduced-motion twenty-second upstream edit maps its sound events into the same eighteen-second film take', () => {
  assert.deepEqual(originalEventTiming(12, 2, 18), { time: 12, speed: 2 });
  const event = originalEventTiming(12, 2, 20);
  assert.equal(event.time, 10.8); assert.ok(Math.abs(event.speed - 2 / .9) < 1e-10);
  assert.equal(originalEventTiming(20, 1, 20).time, 18);
});

test('all six sound scenes cover the film and adjacent form envelopes crossfade with unit total gain', () => {
  assert.deepEqual(SOUND_SCENES.map(s => s.start), [0, 18, 25, 32, 39, 46]);
  for (let t = 0; t < 48; t += .025) {
    const w = soundWeights(t), values = Object.values(w);
    assert.ok(values.every(v => v >= -1e-10 && v <= 1 + 1e-10));
    assert.ok(Math.abs(values.reduce((a, b) => a + b, 0) - 1) < 1e-10);
  }
  assert.equal(soundWeights(19).original, .5); assert.equal(soundWeights(19).galaxy, .5);
  assert.equal(soundWeights(47).original, .5); assert.equal(soundWeights(47).text, .5);
  assert.deepEqual(soundWeights(0), soundWeights(48));
});
test('audio normalization limits peaks without boosting quiet material and closes loop sample edges', () => {
  const a = Float32Array.from({ length: 4800 }, (_, i) => Math.sin(i * .03) * 2);
  const b = Float32Array.from(a, v => v * .7);
  const result = normalizeSound([a, b], 48000);
  assert.ok(result.peak <= .9); assert.ok(result.rms > .01);
  assert.equal(Math.abs(a[0]), 0); assert.equal(Math.abs(a.at(-1)), 0); assert.equal(Math.abs(b.at(-1)), 0);
  assert.ok([...a, ...b].every(v => Number.isFinite(v) && Math.abs(v) <= .900001));
  const quiet = new Float32Array(4800).fill(.1); normalizeSound([quiet], 48000);
  assert.ok(Math.abs(quiet[2000] - .1) < 1e-6);
});
test('invalid synthesis output fails rather than encoding NaN into the soundtrack', () => {
  assert.throws(() => normalizeSound([new Float32Array([0, NaN])], 48000), /无效采样/);
});
