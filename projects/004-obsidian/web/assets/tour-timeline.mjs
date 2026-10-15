export const DURATION = 48;
export const TRANSITION = 2;
export const CHAPTERS = [
  { form: 'original', name: '原作 · 巨石 / 教堂 / 巨鲸', start: 0, end: 18 },
  { form: 'galaxy', name: '星系盘', start: 18, end: 25 },
  { form: 'tornado', name: '龙卷', start: 25, end: 32 },
  { form: 'dna', name: '双螺旋', start: 32, end: 39 },
  { form: 'text', name: '文字聚合', start: 39, end: 46 },
  { form: 'original', name: '重聚巨石 · 接回开场', start: 46, end: 48 },
];
export const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * t * (t * (t * 6 - 15) + 10); };
export function sampleTimeline(seconds) {
  const time = ((seconds % DURATION) + DURATION) % DURATION;
  const index = CHAPTERS.findIndex(c => time >= c.start && time < c.end);
  const chapter = CHAPTERS[index], elapsed = time - chapter.start;
  const previous = index ? CHAPTERS[index - 1] : chapter;
  return { time, index, chapter, from: previous.form, to: chapter.form,
    fromTime: index ? time - previous.start : 0, toTime: elapsed,
    blend: index ? smooth(elapsed / TRANSITION) : 1,
    originalTime: index === 0 ? time : 0, extension: index !== 0 };
}
// Analytical paths: seeking and frame export never depend on earlier camera frames.
export function extensionCamera(form, seconds) {
  const t = seconds;
  const angle = form === 'text' ? -.12 + .035 * t : .38 + .095 * t;
  const radius = form === 'galaxy' ? 65 : form === 'text' ? 63 : 60;
  const y = form === 'galaxy' ? 40 + 3 * Math.sin(t * .25) : form === 'text' ? 16 : 23 + 3 * Math.sin(t * .25);
  return { position: [Math.sin(angle) * radius, y, Math.cos(angle) * radius], look: [0, 14, 0], fov: 42, dof: 0 };
}
