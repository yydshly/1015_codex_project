import { DURATION, smooth } from './tour-timeline.mjs';
import { SOUND_SCENES, normalizeSound, originalEventTiming } from './sound-score.mjs';

const note = n => 440 * 2 ** ((n - 69) / 12);
const waitUI = () => new Promise(resolve => setTimeout(resolve, 0));

// The preserved upstream synthesizer is rendered into the same offline context
// as the new voices. Preview plays this exact buffer; export encodes its PCM.
export class FilmSoundtrack {
  constructor() { this.enabled = false; this.volume = .7; this.ready = false; this.busy = false; this.cache = new Map(); }
  attach(context) { this.context = context; context.audio.level = this.volume; }
  static get supported() { return typeof OfflineAudioContext !== 'undefined' && typeof AudioContext !== 'undefined'; }
  profiles() {
    const { Tour, Research } = this.context;
    return { ...Tour.profiles, ...(Research.active ? { [Research.form]: Research.params } : {}) };
  }
  async render(profiles = this.profiles()) {
    const key = JSON.stringify(profiles);
    if (this.cache.has(key)) return this.cache.get(key);
    const pending = this.compile(profiles).catch(error => { this.cache.delete(key); throw error; });
    this.cache.set(key, pending);
    if (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value);
    return pending;
  }
  async compile(profiles) {
    const { AudioEngine, Edit, Story, THREE, CONFIG } = this.context, sampleRate = 48000;
    const ctx = new OfflineAudioContext(2, DURATION * sampleRate, sampleRate);
    const mix = ctx.createGain(), limiter = ctx.createDynamicsCompressor();
    mix.gain.value = .85; limiter.threshold.value = -9; limiter.knee.value = 10; limiter.ratio.value = 6;
    limiter.attack.value = .003; limiter.release.value = .18; mix.connect(limiter); limiter.connect(ctx.destination);
    const nativeGate = ctx.createGain(); nativeGate.connect(mix);
    nativeGate.gain.setValueAtTime(1, 0);
    const curve = (reverse = false) => Float32Array.from({ length: 257 }, (_, i) => reverse ? 1 - smooth(i / 256) : smooth(i / 256));
    nativeGate.gain.setValueCurveAtTime(curve(true), 18, 2);
    nativeGate.gain.setValueAtTime(0, 20); nativeGate.gain.setValueCurveAtTime(curve(), 46, 2);
    const native = new AudioEngine(); native.buildEvents(); native.init(ctx, nativeGate); native.enabled = true;
    const lava = new THREE.Vector4();
    for (let i = 0; i <= 18 * 60; i++) {
      const real = Math.min(17.999999, i / 60), T = Edit.story(real / 18);
      native.scheduleTime = i / 60;
      Story.lava(T, T >= 6 ? Story.bulletTime(T - 6) : 0, lava);
      native.update(T, T > 6 && T < 7.6 ? Story.slowness(T - 6) : 0, lava);
      if (i % 240 === 0) await waitUI();
    }
    for (const event of native.events) {
      const mapped = originalEventTiming(event.t, event.sp, CONFIG.cycleDuration);
      native.scheduleTime = mapped.time; event.fn(mapped.speed);
    }
    native.scheduleTime = 18.02; native.update(0, 0, lava.set(0, 0, 0, 0));
    native.scheduleTime = 46.5; native.resolve();

    // Shared space uses the author's deterministic impulse response.
    const verb = ctx.createConvolver(), wet = ctx.createGain(); verb.buffer = native.verb.buffer;
    wet.gain.value = .22; verb.connect(wet); wet.connect(mix);
    const busFor = (start, end, level) => {
      const bus = ctx.createGain(), trim = ctx.createGain(); trim.gain.value = level;
      bus.connect(trim); trim.connect(mix); trim.connect(verb); bus.gain.value = 0;
      bus.gain.setValueCurveAtTime(curve(), start, 2); bus.gain.setValueAtTime(1, start + 2);
      bus.gain.setValueCurveAtTime(curve(true), end, 2); return bus;
    };
    const voice = (bus, at, frequency, duration, level, pan = 0, type = 'sine', glide = 1) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), p = ctx.createStereoPanner();
      osc.type = type; osc.frequency.setValueAtTime(frequency, at);
      if (glide !== 1) osc.frequency.exponentialRampToValueAtTime(frequency * glide, at + duration);
      const attack = Math.min(.08, duration * .1);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(level, at + attack);
      gain.gain.exponentialRampToValueAtTime(.00001, at + duration);
      p.pan.value = pan; osc.connect(gain); gain.connect(p); p.connect(bus); osc.start(at); osc.stop(at + duration + .01);
    };
    const noise = (bus, at, duration, frequency, level, fromPan = -.6, toPan = .6, toFrequency = frequency) => {
      const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), pan = ctx.createStereoPanner();
      src.buffer = native.noise; src.loop = true; filter.type = 'bandpass'; filter.Q.value = 1.3;
      filter.frequency.setValueAtTime(frequency, at); filter.frequency.exponentialRampToValueAtTime(toFrequency, at + duration);
      gain.gain.setValueAtTime(.00001, at); gain.gain.exponentialRampToValueAtTime(level, at + duration * .45);
      gain.gain.exponentialRampToValueAtTime(.00001, at + duration);
      pan.pan.setValueAtTime(fromPan, at); pan.pan.linearRampToValueAtTime(toPan, at + duration);
      src.connect(filter); filter.connect(gain); gain.connect(pan); pan.connect(bus); src.start(at, .37); src.stop(at + duration + .01);
    };
    const galaxy = busFor(18, 25, 5.5);
    [50, 57, 62, 66].forEach((n, i) => voice(galaxy, 18, note(n), 9, .035, (i - 1.5) / 3));
    const stars = Math.round(14 + (profiles.galaxy?.a || 4) * 2);
    for (let i = 0; i < stars; i++) voice(galaxy, 18.3 + i * 8 / stars, note([74, 78, 81, 85, 86][i % 5]), 1.1, .024, Math.sin(i * 2.4) * .8);
    const tornado = busFor(25, 32, 6), windRate = .42 - (profiles.tornado?.speed ?? .65) * .12;
    voice(tornado, 25, 36.7, 9, .07); voice(tornado, 25, 55, 9, .045, .15);
    for (let at = 25; at < 33; at += windRate) noise(tornado, at, 1.1, 350 + 950 * (.5 + .5 * Math.sin(at * 1.7)), .12, Math.sin(at * 2) * .8, Math.cos(at * 2) * .8, 1600);
    const dna = busFor(32, 39, 3), beat = .64;
    for (let i = 0; i < 24; i++) {
      const at = 32 + i * beat / 2;
      voice(dna, at, note((i % 2 ? 69 : 62) + (Math.floor(i / 4) % 2) * 12), .42, .08, i % 2 ? .7 : -.7, 'triangle');
      if (i % 2 === 0) voice(dna, at, 73.4, .23, .09);
    }
    const text = busFor(39, 46, 2), letters = Array.from(profiles.text?.text || '重组').length;
    for (let i = 0; i < 18 + letters * 3; i++) {
      const at = 39 + i * 1.9 / (18 + letters * 3);
      voice(text, at, 900 + (i * 683) % 2400, .11 + i * .007, .026, Math.sin(i * 1.4) * .75);
    }
    [50, 57, 62, 66, 69, 74].forEach((n, i) => voice(text, 41 + i * .06, note(n), 4.2, .07, (i - 2.5) / 4));
    [78, 81, 86].forEach((n, i) => voice(text, 42.6 + i * .75, note(n), 1.5, .027, i % 2 ? .5 : -.5));
    for (const at of [18, 25, 32, 39, 46]) noise(mix, at, 2, at === 46 ? 1200 : 300, .075, -.65, .65, at === 46 ? 180 : 2000);
    await waitUI();
    const buffer = await ctx.startRendering();
    this.metrics = normalizeSound([buffer.getChannelData(0), buffer.getChannelData(1)], sampleRate);
    return buffer;
  }
  stop() {
    if (!this.source) return;
    const source = this.source, gain = this.sourceGain, t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t); gain.gain.setTargetAtTime(0, t, .006);
    source.stop(t + .04); setTimeout(() => { source.disconnect(); gain.disconnect(); }, 100);
    this.source = null;
  }
  async route(on = this.context.app.soundOn) {
    const { audio, Tour, Research } = this.context;
    const film = Tour.active || Research.active;
    await audio.setEnabled(on && !film && this.context.app.playing && !this.context.app.capturing);
    this.enabled = on && film;
    if (!this.enabled) { this.stop(); return; }
    if (!this.ctx) { this.ctx = new AudioContext({ sampleRate: 48000 }); }
    await this.ctx.resume();
    const key = JSON.stringify(this.profiles());
    if (this.key !== key) {
      this.stop(); this.ready = false; this.busy = true; this.key = key;
      try {
        const buffer = await this.render(this.profiles());
        if (this.key !== key) return;
        this.buffer = buffer; this.ready = true;
      } catch (error) {
        if (this.key === key) { this.key = null; this.ready = false; throw error; }
      } finally { if (this.key === key || this.key === null) this.busy = false; }
    }
    this.sync();
  }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    this.context.audio.level = this.volume;
    if (this.sourceGain) this.sourceGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, .025);
  }
  sync() {
    if (!this.context) return;
    const { app, Tour, Research } = this.context;
    if ((!Tour.active && !Research.active) || !this.enabled || !this.ready || !app.playing || app.capturing || app.scrubbing || document.hidden) { this.stop(); return; }
    const scene = SOUND_SCENES.find(s => s.form === Research.form);
    const start = Tour.active ? 0 : scene.start + 2, end = Tour.active ? 48 : scene.end;
    const time = Tour.active ? Tour.time : start + Research.clock % (end - start);
    if (this.source) {
      const expected = start + ((this.offset - start + (this.ctx.currentTime - this.started) * this.rate) % (end - start));
      const delta = Math.abs(time - expected), drift = Math.min(delta, end - start - delta);
      if (this.rate === app.speed && this.loopStart === start && drift < .12) return;
      this.stop();
    }
    const source = this.ctx.createBufferSource(), gain = this.ctx.createGain(), now = this.ctx.currentTime;
    source.buffer = this.buffer; source.loop = true; source.loopStart = start; source.loopEnd = end; source.playbackRate.value = app.speed;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(this.volume, now + .02);
    source.connect(gain); gain.connect(this.ctx.destination); source.start(now, time);
    this.source = source; this.sourceGain = gain; this.started = now; this.offset = time; this.rate = app.speed; this.loopStart = start;
  }
  async exportBuffer(profiles, volume) {
    const source = await this.render(profiles), buffer = new AudioBuffer({ numberOfChannels: 2, length: source.length, sampleRate: source.sampleRate });
    for (let ch = 0; ch < 2; ch++) {
      const from = source.getChannelData(ch), to = buffer.getChannelData(ch);
      for (let i = 0; i < to.length; i++) to[i] = from[i] * volume;
    }
    return buffer;
  }
}
