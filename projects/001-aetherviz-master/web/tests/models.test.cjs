const test = require('node:test');
const assert = require('node:assert/strict');
const { newton, sine, waterGeometry, stepMotion, sampleHistory, frameDelta } = require('../models.js');
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const { collide, collisionExperiment } = require('../models.js');
const { collisionChapters, chapterCursor, advanceChapter } = require('../models.js');
test('分阶段讲解使用精确事件；碰前、冲量、碰后处于同一物理时刻', () => {
  const lab = collisionExperiment({}), chapters = collisionChapters(lab);
  assert.deepEqual(chapters.map(item => item.key), ['push', 'coast', 'before', 'impulse', 'after', 'braking', 'end']);
  for (const key of ['before', 'impulse', 'after']) {
    const chapter = chapters.find(item => item.key === key); near(chapter.start, lab.collision.time); near(chapter.end, lab.collision.time);
  }
  assert.equal(chapters[2].side, 'before'); assert.equal(chapters[3].side, 'after'); near(chapters.at(-1).start, lab.stopTime);
});
test('阅读停留不会推进物理时间，长帧也不能跳过冲量讲解', () => {
  const chapters = collisionChapters(collisionExperiment({})), before = chapterCursor(chapters, 2);
  const reading = advanceChapter(chapters, before, 5, .25); near(reading.time, before.time); near(reading.reading, 5); assert.equal(reading.side, 'before');
  const impulse = advanceChapter(chapters, reading, 100, 2); assert.equal(chapters[impulse.index].key, 'impulse'); near(impulse.time, before.time); near(impulse.reading, 0);
  const after = advanceChapter(chapters, impulse, 8, .1); assert.equal(chapters[after.index].key, 'after'); near(after.time, before.time);
});
test('0.25× 只放慢展示，碰撞前最后 0.2 s 进一步降到 0.1×', () => {
  const lab = collisionExperiment({}), chapters = collisionChapters(lab);
  const start = advanceChapter(chapters, chapterCursor(chapters), .4, .25); near(start.time, .1);
  const nearContact = { ...chapterCursor(chapters, 1), time: lab.collision.time - .25 };
  const slow = advanceChapter(chapters, nearContact, 1, .25); near(slow.time, lab.collision.time - .12);
});
test('没有碰撞、撞墙直接停下与无摩擦的讲解阶段反映各自实际结果', () => {
  const noHit = collisionChapters(collisionExperiment({ force: 0 })); assert.ok(noHit.every(item => !['before', 'impulse', 'after'].includes(item.key)));
  const wall = collisionChapters(collisionExperiment({ wall: true, restitution: 0, friction: 0 })); assert.ok(wall.every(item => item.key !== 'braking'));
  const coast = collisionChapters(collisionExperiment({ friction: 0 })); assert.equal(coast.at(-1).title, '仍在运动');
  const early = collisionChapters(collisionExperiment({ mass: 1, force: 20, duration: 2 })); assert.ok(early.every(item => item.key !== 'coast'));
});
test('自动讲解完整经过各阶段，最终状态与自由实验完全一致', () => {
  const lab = collisionExperiment({}), chapters = collisionChapters(lab), seen = new Set(); let cursor = chapterCursor(chapters);
  for (let i = 0; i < 10000 && !cursor.done; i++) { seen.add(chapters[cursor.index].key); cursor = advanceChapter(chapters, cursor, .02, .25); }
  seen.add(chapters[cursor.index].key); assert.equal(cursor.done, true); assert.equal(seen.size, chapters.length);
  const guided = lab.sample(cursor.time), original = lab.sample(lab.duration);
  near(guided.A.position, original.A.position); near(guided.B.position, original.B.position); near(guided.A.velocity, 0); near(guided.B.velocity, 0);
});
test('等质量弹性正碰交换速度，动量与动能守恒', () => {
  const hit = collide(2, 2, 5, 0, 1);
  near(hit.vA, 0); near(hit.vB, 5); near(hit.momentumBefore, hit.momentumAfter); near(hit.loss, 0); near(hit.impulseA, -hit.impulseB);
});
test('完全非弹性碰后同速，损失动能而不是动量', () => {
  const hit = collide(2, 3, 5, 0, 0);
  near(hit.vA, 2); near(hit.vB, 2); near(hit.momentumAfter, 10); near(hit.loss, 15);
});
test('轻车撞重车反弹；恢复系数符合相对速度定义', () => {
  const hit = collide(2, 8, 5, 0, .8);
  assert.ok(hit.vA < 0); near(hit.vB - hit.vA, .8 * 5); near(hit.momentumAfter, hit.momentumBefore);
});
test('撞墙的冲量改变小车动量，e=0 时速度瞬时归零', () => {
  const rebound = collide(2, 3, 5, 0, .6, true), stop = collide(2, 3, 5, 0, 0, true);
  near(rebound.vA, -3); near(rebound.impulseA, -16); near(stop.vA, 0); near(stop.loss, 25);
});
test('接触解析解：无摩擦 4 m/s² 推 1 s，在 1.7 s 接触，不穿透', () => {
  const lab = collisionExperiment({ force: 8, mass: 2, massB: 2, duration: 1, friction: 0, restitution: 1 });
  near(lab.collision.time, 1.7); near(lab.sample(1.7, 'before').A.position, 4.8);
  near(lab.sample(1.7, 'before').A.velocity, 4); near(lab.sample(1.7).A.velocity, 0); near(lab.sample(1.7).B.velocity, 4);
  const later = lab.sample(100); assert.ok(later.B.position - later.A.position >= 1.2); assert.equal(later.stopped, false);
});
test('碰撞早于设定撤力时刻，接触即撤力，能量账仍闭合', () => {
  const lab = collisionExperiment({ force: 20, mass: 1, duration: 2 });
  assert.ok(lab.forceEnd < 2); near(lab.forceEnd, lab.collision.time);
  const end = lab.sample(lab.duration); near(end.work, end.kinetic + end.frictionHeat + end.collisionHeat, 1e-8);
});
test('全程做功与能量去向闭合，摩擦精确停稳，无速度符号振荡', () => {
  const lab = collisionExperiment({});
  for (let i = 0; i <= 200; i++) {
    const s = lab.sample(lab.duration * i / 200); near(s.work, s.kinetic + s.frictionHeat + s.collisionHeat, 1e-8);
    assert.ok(s.B.position - s.A.position >= 1.2 - 1e-10);
  }
  const stop = lab.sample(lab.stopTime), end = lab.sample(lab.duration);
  near(stop.A.velocity, 0); near(stop.B.velocity, 0); near(end.A.position, stop.A.position); near(end.B.position, stop.B.position); assert.equal(end.stopped, true);
});
test('无摩擦粘连保持共同速度；结束观察不伪装静止', () => {
  const lab = collisionExperiment({ friction: 0, restitution: 0 }), end = lab.sample(lab.duration);
  assert.equal(lab.stopTime, Infinity); near(end.A.velocity, end.B.velocity); assert.ok(end.A.velocity > 0); assert.equal(end.stopped, false);
});
test('推力不足与中途停止都不会捏造碰撞', () => {
  for (const params of [{ force: 0 }, { force: 1, friction: .3 }, { force: 8, mass: 2, friction: .2, duration: .3 }]) {
    const lab = collisionExperiment(params); assert.equal(lab.collision, null); assert.equal(lab.sample(lab.duration).stopped, true);
  }
});
test('增大同组推力提高碰前速度，改变停止位置', () => {
  const low = collisionExperiment({ force: 12 }), high = collisionExperiment({ force: 16 });
  assert.ok(high.collision.uA > low.collision.uA); assert.ok(high.sample(high.stopTime).B.position > low.sample(low.stopTime).B.position);
});
test('边界组合：墙/两车、零/大摩擦、弹性/粘连均保持能量非负且平衡', () => {
  for (const wall of [false, true]) for (const force of [0, 2, 20]) for (const mass of [1, 10]) for (const friction of [0, .01, .3]) for (const restitution of [0, .5, 1]) {
    const lab = collisionExperiment({ wall, force, mass, friction, restitution, duration: 2 });
    for (const time of [0, lab.forceEnd, ...(lab.collision ? [lab.collision.time] : []), lab.duration]) {
      const s = lab.sample(time); near(s.work, s.kinetic + s.frictionHeat + s.collisionHeat, 1e-7);
      assert.ok(s.kinetic >= 0 && s.frictionHeat >= 0 && s.collisionHeat >= 0);
      if (!wall) assert.ok(s.B.position - s.A.position >= 1.2 - 1e-8);
    }
  }
});
test('恒力解析解：12 N / 3 kg，2 秒后速度 8 m/s，位移 8 m', () => {
  const result = newton(12, 3, 2);
  near(result.acceleration, 4); near(result.velocity, 8); near(result.position, 8);
});
test('力翻倍加速度翻倍，质量翻倍加速度减半', () => {
  near(newton(24, 3, 1).acceleration, 2 * newton(12, 3, 1).acceleration);
  near(newton(12, 6, 1).acceleration, newton(12, 3, 1).acceleration / 2);
});
test('轨道终点精确截停，零力保持静止，拒绝零质量', () => {
  near(newton(20, 1, 100).position, 60);
  near(newton(0, 2, 6).velocity, 0);
  assert.throws(() => newton(1, 0, 0), RangeError);
});
test('正弦的峰值、周期和相位符合定义', () => {
  near(sine(2, 1, 0, Math.PI / 2), 2);
  near(sine(1, 2, 0, .7), sine(1, 2, 0, .7 + Math.PI));
  near(sine(1, 1, Math.PI / 2, 0), 1);
});
test('水分子参考几何：两键均为 0.958 Å，夹角 104.5°', () => {
  const { H1, H2 } = waterGeometry();
  near(Math.hypot(...H1), .958); near(Math.hypot(...H2), .958);
  const dot = H1.reduce((sum, value, index) => sum + value * H2[index], 0);
  near(Math.acos(dot / (.958 ** 2)) * 180 / Math.PI, 104.5);
});
test('按住施力后松手：合力归零，速度连续，位置继续增加', () => {
  const pushed = stepMotion({ position: 0, velocity: 0 }, 8, 2, 1);
  near(pushed.velocity, 4); near(pushed.position, 2);
  const coasted = stepMotion(pushed, 0, 2, 2);
  near(coasted.velocity, 4); near(coasted.position, 10);
});
test('实时增大推力：保留已有位置与速度，分段计算', () => {
  const first = stepMotion({ position: 0, velocity: 0 }, 8, 2, 1);
  const second = stepMotion(first, 16, 2, 1);
  near(second.velocity, 12); near(second.position, 10);
});
test('任意长时间步均精确截在轨道末端，不穿越终点', () => {
  const result = stepMotion({ position: 0, velocity: 0 }, 20, 1, 100);
  near(result.position, 60); near(result.velocity, Math.sqrt(2400));
  assert.equal(result.finished, true);
});
test('回放在记录帧之间按运动方程采样，而非位置线性插值', () => {
  const initial = { position: 0, velocity: 0 }, applied = { forceA: 8, forceB: 8, massA: 2, massB: 4 };
  const history = [{ time: 0, A: initial, B: initial, applied }, { time: 2, A: stepMotion(initial, 8, 2, 2), B: stepMotion(initial, 8, 4, 2), applied }];
  const sampled = sampleHistory(history, 1);
  near(sampled.A.position, 2); near(sampled.A.velocity, 4); near(sampled.B.position, 1);
});
test('动画首帧时间早于初始化时不倒退；后台恢复不产生大跳跃', () => {
  near(frameDelta(99, 101), 0); near(frameDelta(1016, 1000), .016); near(frameDelta(10000, 1000), .05);
});
