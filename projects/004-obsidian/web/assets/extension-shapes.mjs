// Deterministic 3-D surface samplers. All shapes target the original Voronoi shards.
export const SHAPES = {
  galaxy: { name: '星系盘', a: [2, 7, 1, 4, '旋臂数量'], b: [.4, 2.2, .1, 1.2, '旋臂卷曲'], speed: .22 },
  tornado: { name: '龙卷', a: [6, 18, .5, 12, '顶部半径'], b: [1, 7, .1, 4, '环绕圈数'], speed: .65 },
  dna: { name: '双螺旋', a: [1, 6, .1, 3, '螺旋圈数'], b: [3, 9, .1, 5.5, '螺旋半径'], speed: .22 },
  text: { name: '文字聚合', a: [.5, 6, .1, 2.4, '文字厚度'], b: [24, 46, 1, 38, '文字宽度'], speed: 0 },
};
const TAU = Math.PI * 2;
const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
export function settings(form, input = {}) {
  const spec = SHAPES[form];
  if (!spec) throw new Error('未知形态');
  return {
    a: form === 'galaxy' ? Math.round(clamp(input.a, spec.a[0], spec.a[1], spec.a[3])) : clamp(input.a, spec.a[0], spec.a[1], spec.a[3]),
    b: clamp(input.b, spec.b[0], spec.b[1], spec.b[3]),
    assembly: clamp(input.assembly, 0, 1, 1), speed: clamp(input.speed, 0, 1.2, spec.speed),
    size: clamp(input.size, .5, 1.8, 1), noise: clamp(input.noise, 0, 1.5, .08),
    text: Array.from(typeof input.text === 'string' ? input.text.trim() : '重组').slice(0, 8).join('') || '重组',
  };
}
function rng(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
function quaternion(nx, ny, nz, spin) {
  const length = Math.hypot(nx, ny, nz) || 1; nx /= length; ny /= length; nz /= length;
  let x, y, z, w;
  if (nz < -.99999) { x = 1; y = z = w = 0; }
  else { x = -ny; y = nx; z = 0; w = 1 + nz; const d = Math.hypot(x, y, w); x /= d; y /= d; w /= d; }
  const s = Math.sin(spin / 2), c = Math.cos(spin / 2);
  return [x * c + y * s, y * c - x * s, z * c + w * s, w * c - z * s];
}

export function generateTargets(form, count, gridSize, input = {}, glyph = null) {
  if (!Number.isInteger(count) || count < 1 || count > 100000 || !(gridSize > 0)) throw new Error('碎片预算无效');
  const params = settings(form, input), rows = Math.ceil(count / 256), section = 256 * rows * 4;
  const data = new Float32Array(section * 2), random = rng(0x512000 + count);
  let area = 1800;
  if (form === 'galaxy') area = Math.PI * 20 * 20 * 1.25;
  if (form === 'tornado') area = Math.PI * (params.a + 2) * Math.hypot(26, params.a - 2) * .55;
  if (form === 'dna') area = 2 * Math.hypot(26, TAU * params.b * params.a) * TAU * .58 + 160;
  if (form === 'text') {
    if (!glyph?.faces?.length || !glyph?.edges?.length || !(glyph.width > 0) || !(glyph.height > 0)) throw new Error('文字没有可采样的轮廓');
    const fx = params.b / glyph.width, fy = Math.min(16 / glyph.height, fx * 1.1);
    area = Math.max(50, glyph.faces.length * glyph.stride ** 2 * fx * fy * 2 + glyph.edges.length * glyph.stride * Math.sqrt(fx * fy) * params.a);
  }
  const scale = Math.sqrt(area / count) / gridSize * 1.12;
  for (let id = 0; id < count; id++) {
    const u = (id + .5) / count, r1 = random(), r2 = random(), r3 = random(), r4 = random();
    let x = 0, y = 14, z = 0, nx = 0, ny = 0, nz = 1;
    if (form === 'galaxy') {
      const radius = Math.sqrt(u) * 20, angle = (id % params.a) * TAU / params.a + params.b * TAU * Math.sqrt(u) + (r1 - .5) * .32;
      x = Math.cos(angle) * radius; z = Math.sin(angle) * radius; y = 11 + (r2 - .5) * (1.1 + 3 * (1 - u) ** 5);
      ny = r2 > .5 ? 1 : -1; nz = .12 * (r3 - .5); nx = .12 * (r4 - .5);
    } else if (form === 'tornado') {
      const h = u, angle = h * TAU * params.b + (id % 3) * TAU / 3 + (r1 - .5) * .8, radius = 1.4 + (params.a - 1.4) * h ** 1.65;
      x = Math.cos(angle) * radius; y = 1.2 + 26 * h; z = Math.sin(angle) * radius;
      nx = Math.cos(angle); nz = Math.sin(angle); ny = -.55 * h;
    } else if (form === 'dna') {
      const h = r1, angle = h * TAU * params.a, strand = id % 10 < 7;
      y = 2.5 + h * 26;
      if (strand) {
        const phase = angle + (id % 2) * Math.PI, ring = r2 * TAU, tube = .58;
        nx = Math.cos(phase) * Math.cos(ring); ny = Math.sin(ring); nz = Math.sin(phase) * Math.cos(ring);
        x = Math.cos(phase) * params.b + nx * tube; z = Math.sin(phase) * params.b + nz * tube; y += ny * tube;
      } else {
        const hh = Math.round(h * 23) / 23, phase = hh * TAU * params.a, along = r2 * 2 - 1, ring = r3 * TAU;
        nx = -Math.sin(phase) * Math.cos(ring); nz = Math.cos(phase) * Math.cos(ring); ny = Math.sin(ring);
        x = Math.cos(phase) * params.b * along + nx * .2; z = Math.sin(phase) * params.b * along + nz * .2; y = 2.5 + hh * 26 + ny * .2;
      }
    } else {
      const fx = params.b / glyph.width, fy = Math.min(16 / glyph.height, fx * 1.1), side = id % 5 === 0;
      const samples = side ? glyph.edges : glyph.faces, p = samples[Math.floor(r1 * samples.length)];
      x = (p[0] - glyph.cx) * fx; y = 14 - (p[1] - glyph.cy) * fy;
      if (side) { z = (r2 - .5) * params.a; nx = p[2]; ny = -p[3]; nz = 0; }
      else { const sign = id % 2 ? 1 : -1; z = sign * params.a / 2; nz = sign; }
    }
    const q = quaternion(nx, ny, nz, r4 * TAU), at = id * 4;
    data.set([x, y, z, scale * (.88 + r3 * .24)], at);
    data.set(q, section + at);
  }
  return { data, rows, count, params, area };
}
