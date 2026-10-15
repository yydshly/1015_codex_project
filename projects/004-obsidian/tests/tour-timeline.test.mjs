import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three/build/three.module.js';
import { DURATION, CHAPTERS, sampleTimeline, smooth, extensionCamera } from '../web/assets/tour-timeline.mjs';
import { TourSystem } from '../web/assets/tour-system.mjs';

test('the film covers the original, all four forms and a two-second return without gaps', () => {
  assert.equal(DURATION, 48);
  assert.deepEqual(CHAPTERS.map(c => c.form), ['original', 'galaxy', 'tornado', 'dna', 'text', 'original']);
  CHAPTERS.forEach((c, i) => { assert.equal(c.start, i ? CHAPTERS[i - 1].end : 0); assert.ok(c.end > c.start); });
  assert.equal(CHAPTERS.at(-1).end, DURATION);
  assert.equal(sampleTimeline(9).originalTime, 9);
  assert.equal(sampleTimeline(47).to, 'original');
});
test('the analytical timeline can seek backward, wrap and render in any order', () => {
  for (const t of [0, 9, 18, 19, 25, 26.5, 34, 40, 47.999]) {
    const a = sampleTimeline(t);
    for (const shifted of [t + 48, t - 48]) {
      const b = sampleTimeline(shifted);
      assert.equal(a.index, b.index); assert.equal(a.to, b.to); assert.equal(a.from, b.from);
      for (const key of ['time', 'fromTime', 'toTime', 'blend', 'originalTime']) assert.ok(Math.abs(a[key] - b[key]) < 1e-10);
    }
  }
  assert.equal(sampleTimeline(48).time, 0);
  assert.equal(sampleTimeline(-1).time, 47);
});

test('the original visual take remains eighteen seconds even if the reduced-motion edit is authored at twenty seconds', () => {
  const film = new TourSystem(THREE, { uniforms: { tExtTargets: { value: null } } });
  film.context = { app: { playing: false }, CONFIG: { cycleDuration: 20 }, Edit: { story: f => f * 36 } };
  film.active = true; film.time = 9; film.beforeFrame(0);
  assert.equal(film.context.app.t, .5); assert.equal(film.story, 18);
});
test('morph endpoints have zero speed and acceleration, with moving source clocks', () => {
  const h = 1e-5;
  assert.equal(smooth(-1), 0); assert.equal(smooth(2), 1);
  assert.ok(smooth(h) / h < 1e-6); assert.ok((1 - smooth(1 - h)) / h < 1e-6);
  for (const c of CHAPTERS.slice(1)) {
    assert.equal(sampleTimeline(c.start).blend, 0);
    assert.ok(sampleTimeline(c.start + 1).blend > .49);
    if (c.end - c.start > 2) assert.equal(sampleTimeline(c.start + 2).blend, 1);
  }
  assert.equal(sampleTimeline(26).fromTime, 8);
  assert.equal(sampleTimeline(26).toTime, 1);
});
test('camera paths move, stay finite, and blend continuously across form and loop boundaries', () => {
  const film = new TourSystem(THREE, { uniforms: { tExtTargets: { value: null } } });
  film.context = { CONFIG: { cycleDuration: 18 }, Edit: { story: f => f * 36 }, director: {
    evaluate(t, p, l) { p.set(10 + Math.sin(t * Math.PI / 18), 12, 40); l.set(0, 8, 0); return { fov: 40, dof: 0 }; },
  } };
  const pose = t => { film.time = t; const p = new THREE.Vector3(), l = new THREE.Vector3(); film.camera(p, l); return [...p, ...l]; };
  for (const t of [18, 25, 32, 39, 46, 48]) {
    const a = pose(t - 1e-5), b = pose(t + 1e-5);
    assert.ok(Math.hypot(...a.map((v, i) => v - b[i])) < .001, 'camera jump at ' + t);
  }
  for (const form of ['galaxy', 'tornado', 'dna', 'text']) {
    const a = extensionCamera(form, 2), b = extensionCamera(form, 6);
    assert.ok(a.position.every(Number.isFinite));
    assert.ok(Math.hypot(...a.position.map((v, i) => v - b.position[i])) > 1);
  }
});
