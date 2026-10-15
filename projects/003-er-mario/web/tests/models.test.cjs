const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../models.js');

test('illustrated paths stay finite and above the demonstration floor', () => {
  for (const name of Object.keys(m.actions)) for (let i = 0; i <= 1000; i++) {
    const p = m.movement(name, i / 1000);
    for (const key of ['x', 'y', 'z', 'flip', 'platformY']) assert.ok(Number.isFinite(p[key]), name + ': ' + key);
    assert.ok(p.y >= 0, name + ' crosses the floor');
  }
});
test('jumps land and the elevator returns to its starting height', () => {
  for (const name of ['triple', 'wall', 'long', 'pound']) assert.equal(m.movement(name, 1).y, 0);
  assert.ok(Math.abs(m.movement('platform', 0).y - m.movement('platform', 1).y) < 1e-12);
  assert.ok(m.movement('platform', .5).y > m.movement('platform', 0).y + 2);
});
test('jump heights increase and the wall kick reverses direction', () => {
  assert.ok(m.movement('triple', .71).y > m.movement('triple', .375).y);
  assert.ok(m.movement('triple', .375).y > m.movement('triple', .12).y);
  assert.equal(m.movement('wall', .3).facing, 1);
  assert.equal(m.movement('wall', .6).facing, -1);
});
test('boss close-range bonus is distinct from ground-pound damage', () => {
  assert.equal(m.damage(1000, false, 'punch').amount, 670);
  assert.equal(m.damage(10000, true, 'punch').amount, 503);
  assert.equal(m.damage(10000, true, 'pound').amount, 335);
  assert.ok(Math.abs(m.damage(10000, true, 'punch').percent - 5.025) < 1e-10);
  assert.equal(m.damage(10000, true, 'stomp').amount, 250);
  assert.equal(m.damage(10000, true, 'dive').amount, 187);
});
test('proportional damage leaves the finishing HP to the host game', () => {
  assert.equal(m.applyShare(1000, 1000, false, 'punch'), 330);
  assert.equal(m.applyShare(330, 1000, false, 'punch'), 1);
  assert.equal(m.applyShare(1, 1000, false, 'punch'), 1);
});
test('coordinate conversion mirrors X, scales metres, and round-trips', () => {
  const origin = [120, 25, -43], p = [100, 200, -300];
  assert.deepEqual(m.smToEr(origin, p), [119, 27, -46]);
  assert.deepEqual(m.erToSm(origin, m.smToEr(origin, p)), p);
});
test('invalid combat inputs are rejected', () => {
  for (const hp of [0, -1, NaN, Infinity]) assert.throws(() => m.damage(hp, false), RangeError);
  assert.throws(() => m.damage(1000, false, 'unknown'), RangeError);
});
