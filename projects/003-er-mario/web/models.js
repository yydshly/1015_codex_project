/* Original teaching models. Movement paths are illustrative, not libsm64 physics. */
(function (root) {
  'use strict';
  const actions = {
    triple: { name: '三段跳', en: 'TRIPLE JUMP', hint: '连续落地，再次起跳。', keys: ['移动', '跳跃 × 3'], description: '连续跳跃衔接更高的腾空动作，改变对台阶、屋顶和高低差的探索方式。', focus: '动作状态机', source: 'libsm64/src/decomp/game/mario_actions_airborne.c', duration: 5.4 },
    wall: { name: '蹬墙跳', en: 'WALL KICK', hint: '接触墙面，反向腾空。', keys: ['朝向墙面', '跳跃'], description: '墙面碰撞触发新的动作状态。马里奥必须收到准确的墙面法线，才能做出合理的反弹。', focus: '墙面与法线', source: 'src/havok_col.rs', duration: 4.2 },
    long: { name: '远跳', en: 'LONG JUMP', hint: '压低重心，越过间隙。', keys: ['移动', '蹲下', '跳跃'], description: '横向速度与低弧线带来不同于法环原生跳跃的空间体验。这里的轨迹仅用于解释动作。', focus: '运动逻辑复用', source: 'src/lib.rs', duration: 3.8 },
    pound: { name: '下砸', en: 'GROUND POUND', hint: '腾空、收身、垂直落地。', keys: ['跳跃', '空中蹲下'], description: '下落与着地是两个动作阶段；战斗层识别下砸命中，再把它转成法环的伤害与受击事件。', focus: '动作 → 战斗事件', source: 'src/combat.rs', duration: 3.8 },
    platform: { name: '移动平台', en: 'MOVING SURFACE', hint: '平台移动，碰撞表面同步更新。', keys: ['站上平台', '随平台移动'], description: '升降梯会从静态碰撞转成动态表面对象，每次更新位置。它也是项目仍需处理穿模的边界之一。', focus: '动态碰撞同步', source: 'src/moving.rs', duration: 5.6 }
  };
  const attacks = {
    punch: { name: '拳击', percent: 67, bossBonus: 1.5 },
    kick: { name: '踢击', percent: 67, bossBonus: 1.5 },
    pound: { name: '下砸', percent: 67, bossBonus: 1 },
    stomp: { name: '踩踏', percent: 50, bossBonus: 1 },
    dive: { name: '冲撞', percent: 34, bossBonus: 1.1 }
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const arc = t => 4 * t * (1 - t);
  function movement(name, progress) {
    const t = clamp(progress, 0, 1);
    let x = -4, y = 0, phase = '准备', flip = 0, facing = 1, platformY = 0;
    if (name === 'triple') {
      const stages = [[0, .24, -4, -2.1, 1.1], [.24, .51, -2.1, .15, 1.75], [.51, .91, .15, 3.8, 3.15]];
      const i = t < .24 ? 0 : t < .51 ? 1 : 2;
      const [start, end, a, b, height] = stages[i];
      const p = clamp((t - start) / (end - start), 0, 1);
      x = lerp(a, b, p); y = arc(p) * height;
      phase = t > .91 ? '落地 · 衔接完成' : ['第一跳', '第二跳', '第三跳 · 翻转'][i];
      if (i === 2) flip = p * Math.PI * 2;
    } else if (name === 'wall') {
      if (t < .42) { const p = t / .42; x = lerp(-3.7, 2.2, p); y = Math.sin(p * Math.PI * .5) * 2.2; phase = '腾空 · 接近墙面'; }
      else if (t < .88) { const p = (t - .42) / .46; x = lerp(2.2, -2.8, p); y = 2.2 * (1 - p) + arc(p) * 1.6; facing = -1; phase = '接触墙面 · 反向蹬跳'; }
      else { x = -2.8; facing = -1; phase = '落地'; }
    } else if (name === 'long') {
      const p = clamp((t - .12) / .72, 0, 1); x = lerp(-4, 4, p); y = arc(p) * 1.3;
      phase = t < .12 ? '助跑 · 蹲下' : t < .84 ? '向前远跳' : '落地';
    } else if (name === 'pound') {
      x = -.5;
      if (t < .38) { const p = t / .38; y = Math.sin(p * Math.PI / 2) * 3.7; phase = '起跳'; }
      else if (t < .58) { y = 3.7; flip = (t - .38) / .2 * Math.PI * 2; phase = '空中收身'; }
      else if (t < .77) { y = 3.7 * (1 - (t - .58) / .19); phase = '垂直下砸'; }
      else { phase = '着地 · 命中判定'; }
    } else if (name === 'platform') {
      x = .3; platformY = (1 - Math.cos(t * Math.PI * 2)) * 1.25; y = platformY + .2;
      phase = t < .5 ? '平台上升 · 表面同步' : '平台下降 · 表面同步';
    }
    return { x, y, z: 1.1, flip, facing, phase, platformY };
  }
  function damage(maxHp, boss, attack = 'punch') {
    if (!Number.isFinite(maxHp) || maxHp < 1) throw new RangeError('maxHp must be positive');
    const move = attacks[attack];
    if (!move) throw new RangeError('Unknown attack');
    // Integer weights keep the teaching calculation exact before rounding HP up.
    // The game's f32 precision and native hit are deliberately outside this model.
    const weight = move.percent * (boss ? 5 : 100) * (boss ? Math.round(move.bossBonus * 10) : 10);
    return { percent: weight / 1000, amount: Math.max(1, Math.ceil(maxHp * weight / 100000)), bonus: boss ? move.bossBonus : 1 };
  }
  // Faithful to take_share: leave at least 1 HP for the game's own finishing hit.
  function applyShare(hp, maxHp, boss, attack) { return Math.max(1, hp - damage(maxHp, boss, attack).amount); }
  function smToEr(origin, p) { return [origin[0] - p[0] * .01, origin[1] + p[1] * .01, origin[2] + p[2] * .01]; }
  function erToSm(origin, p) { return [-(p[0] - origin[0]) / .01, (p[1] - origin[1]) / .01, (p[2] - origin[2]) / .01]; }
  const api = { actions, attacks, movement, damage, applyShare, smToEr, erToSm, clamp };
  root.ERMarioModels = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
