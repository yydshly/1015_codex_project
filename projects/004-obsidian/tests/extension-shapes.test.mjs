import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTargets, settings } from '../web/assets/extension-shapes.mjs';

function verifySurface(target, bounds) {
  const offset = 256 * target.rows * 4;
  for (let id = 0; id < target.count; id++) {
    const at = id * 4, [x, y, z, size] = target.data.slice(at, at + 4);
    assert.ok([x, y, z, size].every(Number.isFinite), `Non-finite shard ${id}`);
    assert.ok(size > 0 && size < 100);
    assert.ok(x >= bounds[0] && x <= bounds[1] && y >= bounds[2] && y <= bounds[3] && z >= bounds[4] && z <= bounds[5], `Target outside bounds: ${x}, ${y}, ${z}`);
    const q = target.data.slice(offset + at, offset + at + 4);
    assert.ok(Math.abs(Math.hypot(...q) - 1) < 1e-5, `Invalid quaternion ${id}`);
  }
}

test('all three procedural surfaces remain finite and normalized at low and high budgets', () => {
  for (const count of [8036, 31883]) {
    verifySurface(generateTargets('galaxy', count, .16), [-21, 21, 8, 14, -21, 21]);
    verifySurface(generateTargets('tornado', count, .16), [-18, 18, 1, 28, -18, 18]);
    verifySurface(generateTargets('dna', count, .16), [-10, 10, 1, 30, -10, 10]);
  }
});

test('each form keeps nonzero depth instead of degenerating into a two-dimensional drawing', () => {
  for (const form of ['galaxy', 'tornado', 'dna']) {
    const target = generateTargets(form, 8036, .16);
    const axes = [[], [], []];
    for (let id = 0; id < target.count; id++) for (let axis = 0; axis < 3; axis++) axes[axis].push(target.data[id * 4 + axis]);
    axes.forEach(values => assert.ok(Math.max(...values) - Math.min(...values) > 1));
  }
});

test('samplers are deterministic and geometry parameters materially change positions', () => {
  for (const form of ['galaxy', 'tornado', 'dna']) {
    const a = generateTargets(form, 2048, .16), b = generateTargets(form, 2048, .16);
    assert.deepEqual(a.data, b.data);
    const changed = generateTargets(form, 2048, .16, { ...settings(form), a: form === 'galaxy' ? 7 : form === 'tornado' ? 18 : 6 });
    let changedPositions = 0;
    for (let id = 0; id < a.count; id++) if (Math.hypot(...[0, 1, 2].map(k => a.data[id * 4 + k] - changed.data[id * 4 + k])) > .1) changedPositions++;
    assert.ok(changedPositions > a.count / 2, form);
  }
});

test('text uses front, back and side targets, and responds to thickness', () => {
  const faces = [], edges = [];
  for (let x = 0; x < 60; x += 2) for (let y = 0; y < 40; y += 2) {
    faces.push([x, y]); if (x === 0 || x === 58) edges.push([x, y, x === 0 ? -1 : 1, 0]);
  }
  const glyph = { faces, edges, width: 60, height: 40, cx: 30, cy: 20, stride: 2 };
  const thin = generateTargets('text', 8036, .16, { a: .5 }, glyph);
  const thick = generateTargets('text', 8036, .16, { a: 6 }, glyph);
  verifySurface(thick, [-24, 24, 5, 23, -3.1, 3.1]);
  const depths = new Set();
  for (let id = 0; id < thick.count; id++) depths.add(Math.round(thick.data[id * 4 + 2] * 100));
  assert.ok(depths.has(300) && depths.has(-300) && depths.size > 30);
  assert.ok(Math.abs(thick.data[6] - thin.data[6]) > 2);
  const narrow = generateTargets('text', 8036, .16, { b: 24 }, glyph);
  const wide = generateTargets('text', 8036, .16, { b: 46 }, glyph);
  const width = target => {
    const xs = Array.from({ length: target.count }, (_, id) => target.data[id * 4]);
    return Math.max(...xs) - Math.min(...xs);
  };
  assert.ok(width(wide) - width(narrow) > 20, 'Width must respond even after the height cap is reached');
});

test('invalid settings are constrained and unsupported glyphs fail explicitly', () => {
  const safe = settings('galaxy', { a: 99, b: Infinity, assembly: -2, speed: 99, size: NaN, text: '1234567890' });
  assert.equal(safe.a, 7); assert.equal(safe.b, 1.2); assert.equal(safe.assembly, 0); assert.equal(safe.speed, 1.2); assert.equal(safe.size, 1); assert.equal(safe.text.length, 8);
  assert.throws(() => generateTargets('text', 8036, .16), /轮廓/);
  assert.throws(() => generateTargets('galaxy', 0, .16), /预算/);
});
