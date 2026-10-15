(function (root) {
  'use strict';
  const TRACK = 60;
  function newton(force, mass, time) {
    if (!(mass > 0) || force < 0 || time < 0) throw new RangeError('质量须大于零，力与时间须非负');
    const acceleration = force / mass;
    const end = acceleration > 0 ? Math.min(6, Math.sqrt(2 * TRACK / acceleration)) : 6;
    const t = Math.min(time, end);
    return { time: t, acceleration, velocity: acceleration * t, position: .5 * acceleration * t * t, end };
  }
  function sine(amplitude, frequency, phase, x) {
    return amplitude * Math.sin(frequency * x + phase);
  }
  function waterGeometry(angle = 104.5, length = .958) {
    const half = angle * Math.PI / 360;
    return { O: [0, 0, 0], H1: [-length * Math.sin(half), length * Math.cos(half), 0], H2: [length * Math.sin(half), length * Math.cos(half), 0] };
  }
  function stepMotion(motion, force, mass, delta, limit = TRACK) {
    if (![force, mass, delta, motion.position, motion.velocity].every(Number.isFinite) || mass <= 0 || force < 0 || delta < 0) throw new RangeError('运动参数必须是有限值，质量须为正');
    if (motion.position >= limit) return { ...motion, position: limit, finished: true };
    const acceleration = force / mass;
    const remaining = limit - motion.position;
    const arrival = acceleration > 0 ? 2 * remaining / (Math.sqrt(motion.velocity ** 2 + 2 * acceleration * remaining) + motion.velocity) : motion.velocity > 0 ? remaining / motion.velocity : Infinity;
    const used = Math.min(delta, arrival);
    return { position: Math.min(limit, motion.position + motion.velocity * used + .5 * acceleration * used ** 2), velocity: motion.velocity + acceleration * used, finished: arrival <= delta };
  }
  function sampleHistory(history, time) {
    if (!history.length) throw new RangeError('回放需要运动记录');
    if (time <= history[0].time) return { ...history[0] };
    const rightIndex = history.findIndex(sample => sample.time >= time);
    if (rightIndex < 0) return { ...history[history.length - 1] };
    const left = history[rightIndex - 1], right = history[rightIndex], dt = time - left.time;
    return { time, A: stepMotion(left.A, right.applied.forceA, right.applied.massA, dt), B: stepMotion(left.B, right.applied.forceB, right.applied.massB, dt), applied: right.applied };
  }
  function frameDelta(now, previous) { return Math.max(0, Math.min((now - previous) / 1000, .05)); }
  function collide(massA, massB, uA, uB, restitution, wall = false) {
    if (![massA, massB, uA, uB, restitution].every(Number.isFinite) || massA <= 0 || massB <= 0 || restitution < 0 || restitution > 1) throw new RangeError('碰撞参数无效');
    const momentumBefore = massA * uA + (wall ? 0 : massB * uB);
    const vA = wall ? -restitution * uA : (momentumBefore - massB * restitution * (uA - uB)) / (massA + massB);
    const vB = wall ? 0 : (momentumBefore + massA * restitution * (uA - uB)) / (massA + massB);
    const kineticBefore = .5 * massA * uA ** 2 + (wall ? 0 : .5 * massB * uB ** 2);
    const kineticAfter = .5 * massA * vA ** 2 + (wall ? 0 : .5 * massB * vB ** 2);
    return { uA, uB, vA, vB, momentumBefore, momentumAfter: massA * vA + (wall ? 0 : massB * vB), kineticBefore, kineticAfter, loss: Math.max(0, kineticBefore - kineticAfter), impulseA: massA * (vA - uA), impulseB: wall ? 0 : massB * (vB - uB) };
  }
  // Piecewise analytic 1D motion. Contact is an instantaneous impulse, not a guessed force pulse.
  function collisionExperiment(params) {
    const p = { force: 12, mass: 2, massB: 3, duration: 1, restitution: .6, friction: .08, wall: false, ...params };
    if (![p.force, p.mass, p.massB, p.duration, p.restitution, p.friction].every(Number.isFinite) || p.force < 0 || p.mass <= 0 || p.massB <= 0 || p.duration <= 0 || p.friction < 0 || p.restitution < 0 || p.restitution > 1) throw new RangeError('实验参数无效');
    const g = 9.81, drag = p.friction * g, acceleration = Math.max(0, p.force / p.mass - drag);
    const target = 6, contact = target - (p.wall ? .6 : 1.2);
    const releaseV = acceleration * p.duration, releaseX = .5 * acceleration * p.duration ** 2;
    const afterRelease = dt => {
      const used = drag > 0 ? Math.min(dt, releaseV / drag) : dt;
      return { position: releaseX + releaseV * used - .5 * drag * used ** 2, velocity: Math.max(0, releaseV - drag * used) };
    };
    let hitTime = acceleration > 0 ? Math.sqrt(2 * contact / acceleration) : Infinity;
    if (hitTime > p.duration) {
      const distance = contact - releaseX, discriminant = releaseV ** 2 - 2 * drag * distance;
      hitTime = releaseV > 0 && discriminant > 1e-12 ? p.duration + 2 * distance / (releaseV + Math.sqrt(discriminant)) : Infinity;
    }
    const hasCollision = Number.isFinite(hitTime), forceEnd = Math.min(p.duration, hitTime);
    const incoming = hasCollision ? (hitTime <= p.duration ? acceleration * hitTime : afterRelease(hitTime - p.duration).velocity) : 0;
    const collision = hasCollision ? { time: hitTime, positionA: contact, positionB: target, ...collide(p.mass, p.massB, incoming, 0, p.restitution, p.wall) } : null;
    const slide = (position, velocity, dt) => {
      const used = drag > 0 ? Math.min(dt, Math.abs(velocity) / drag) : dt;
      return { position: position + velocity * used - Math.sign(velocity) * .5 * drag * used ** 2, velocity: Math.sign(velocity) * Math.max(0, Math.abs(velocity) - drag * used) };
    };
    const stopTime = collision ? (Math.max(Math.abs(collision.vA), Math.abs(collision.vB)) < 1e-10 ? hitTime : drag > 0 ? hitTime + Math.max(Math.abs(collision.vA), Math.abs(collision.vB)) / drag : Infinity) : releaseV < 1e-10 ? p.duration : drag > 0 ? p.duration + releaseV / drag : Infinity;
    const duration = Number.isFinite(stopTime) ? Math.max(1, stopTime + .5) : (collision ? hitTime : p.duration) + 6;
    function sample(time, side = 'after') {
      const t = Math.max(0, Math.min(duration, time));
      const impacted = collision && (t > hitTime || (t === hitTime && side !== 'before'));
      let A, B = { position: target, velocity: 0 };
      if (impacted) {
        A = slide(contact, collision.vA, t - hitTime);
        if (!p.wall) B = slide(target, collision.vB, t - hitTime);
      } else A = t <= p.duration ? { position: .5 * acceleration * t ** 2, velocity: acceleration * t } : afterRelease(t - p.duration);
      const pushing = (t < forceEnd || (collision && t === hitTime && hitTime === forceEnd && side === 'before')) && !impacted;
      const drive = pushing ? p.force : 0;
      const frictionA = Math.abs(A.velocity) > 1e-10 ? -Math.sign(A.velocity) * drag * p.mass : pushing ? -Math.min(p.force, drag * p.mass) : 0;
      const frictionB = Math.abs(B.velocity) > 1e-10 ? -Math.sign(B.velocity) * drag * p.massB : 0;
      const driveX = .5 * acceleration * forceEnd ** 2;
      const work = p.force * (pushing ? A.position : driveX);
      const distanceA = impacted ? contact + Math.abs(A.position - contact) : A.position;
      const frictionHeat = drag * (p.mass * distanceA + (p.wall ? 0 : p.massB * Math.abs(B.position - target)));
      const collisionHeat = impacted ? collision.loss : 0;
      const kinetic = .5 * p.mass * A.velocity ** 2 + (p.wall ? 0 : .5 * p.massB * B.velocity ** 2);
      const stopped = t >= forceEnd && Math.abs(A.velocity) < 1e-9 && Math.abs(B.velocity) < 1e-9;
      const phase = stopped ? '静止' : impacted ? '碰撞后' : pushing ? (acceleration > 0 ? '施力加速' : '推力不足') : '撤力滑行';
      return { time: t, A, B, drive, frictionA, frictionB, work, frictionHeat, collisionHeat, kinetic, phase, impacted: Boolean(impacted), stopped };
    }
    return { params: p, collision, forceEnd, stopTime, duration, sample };
  }
  function collisionChapters(lab) {
    const chapters = [], hit = lab.collision, end = Number.isFinite(lab.stopTime) ? lab.stopTime : lab.duration;
    const moving = (key, title, start, finish) => { if (finish > start + 1e-9) chapters.push({ key, title, start, end: finish, side: 'after', hold: 0 }); };
    moving('push', lab.params.force > lab.params.friction * lab.params.mass * 9.81 ? '施力加速' : '推力不足', 0, lab.forceEnd);
    moving('coast', '撤力滑行', lab.forceEnd, hit ? hit.time : end);
    if (hit) {
      chapters.push({ key: 'before', title: '碰前一刻', start: hit.time, end: hit.time, side: 'before', hold: 6 });
      chapters.push({ key: 'impulse', title: '碰撞冲量', start: hit.time, end: hit.time, side: 'after', hold: 8 });
      chapters.push({ key: 'after', title: '碰后一刻', start: hit.time, end: hit.time, side: 'after', hold: 6 });
      moving('braking', lab.params.friction > 0 ? '摩擦减速' : '碰后匀速', hit.time, end);
    }
    chapters.push({ key: 'end', title: Number.isFinite(lab.stopTime) ? '最终静止' : '仍在运动', start: end, end, side: 'after', hold: 0 });
    return chapters;
  }
  function chapterCursor(chapters, index = 0) {
    const safeIndex = Math.max(0, Math.min(chapters.length - 1, index)), chapter = chapters[safeIndex];
    return { index: safeIndex, time: chapter.start, side: chapter.side, reading: 0, done: chapter.key === 'end' };
  }
  function advanceChapter(chapters, cursor, wallDelta, speed = .25) {
    if (![wallDelta, speed].every(Number.isFinite) || wallDelta < 0 || speed <= 0) throw new RangeError('讲解时间与倍率无效');
    if (cursor.done) return { ...cursor };
    const chapter = chapters[cursor.index];
    if (chapter.hold > 0) {
      const reading = cursor.reading + wallDelta;
      return reading >= chapter.hold ? chapterCursor(chapters, cursor.index + 1) : { ...cursor, reading };
    }
    // Slow the final 0.2 physical seconds before contact, then land on the exact event.
    const approachingContact = chapters[cursor.index + 1]?.key === 'before';
    const boundary = approachingContact ? Math.max(chapter.start, chapter.end - .2) : chapter.end;
    let time = cursor.time, remaining = wallDelta;
    if (time < boundary) {
      const used = Math.min(remaining, (boundary - time) / speed); time += used * speed; remaining -= used;
    }
    if (remaining > 0) time += remaining * speed * (approachingContact ? .4 : 1);
    // Do not spend overshoot on reading frames: every collision explanation must be seen.
    return time >= chapter.end - 1e-10 ? chapterCursor(chapters, cursor.index + 1) : { ...cursor, time };
  }
  const api = { newton, sine, waterGeometry, stepMotion, sampleHistory, frameDelta, collide, collisionExperiment, collisionChapters, chapterCursor, advanceChapter, TRACK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LabModels = api;
})(typeof window === 'undefined' ? globalThis : window);
