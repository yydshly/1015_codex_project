import { smooth } from './tour-timeline.mjs';

export const SOUND_SCENES = [
  { form: 'original', start: 0, end: 18, label: '原作 · 风声 / 碎裂 / 钟鸣 / 鲸歌' },
  { form: 'galaxy', start: 18, end: 25, label: '星系 · 空间泛音与星尘钟' },
  { form: 'tornado', start: 25, end: 32, label: '龙卷 · 旋转风场与低频风压' },
  { form: 'dna', start: 32, end: 39, label: '双螺旋 · 左右交替声部与脉冲' },
  { form: 'text', start: 39, end: 46, label: '文字 · 碎片细点到落定和弦' },
  { form: 'return', start: 46, end: 48, label: '回归 · 原作重聚和弦与低鸣' },
];
export function originalEventTiming(time, speed, cycleDuration) {
  return { time: time * 18 / cycleDuration, speed: speed * cycleDuration / 18 };
}
export function soundWeights(time) {
  const t = ((time % 48) + 48) % 48;
  const weights = { original: t < 18 ? 1 : t < 20 ? 1 - smooth((t - 18) / 2) : t < 46 ? 0 : smooth((t - 46) / 2) };
  for (const s of SOUND_SCENES.slice(1, 5)) weights[s.form] = smooth((t - s.start) / 2) * (1 - smooth((t - s.end) / 2));
  return weights;
}
export function normalizeSound(channels, sampleRate) {
  let peak = 0, sum = 0;
  for (const data of channels) for (let i = 0; i < data.length; i++) {
    if (!Number.isFinite(data[i])) throw new Error('音轨生成出现无效采样');
    peak = Math.max(peak, Math.abs(data[i])); sum += data[i] * data[i];
  }
  const gain = peak > .9 ? .9 / peak : 1, fade = Math.round(sampleRate * .012);
  for (const data of channels) for (let i = 0; i < data.length; i++) {
    const edge = Math.min(1, i / fade, (data.length - 1 - i) / fade);
    data[i] *= gain * smooth(edge);
  }
  return { peak: peak * gain, rms: Math.sqrt(sum / (channels.length * channels[0].length)) * gain };
}
