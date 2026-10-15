import { Output, BufferTarget, Mp4OutputFormat, WebMOutputFormat, CanvasSource, AudioBufferSource, Quality, canEncodeVideo, canEncodeAudio } from '../vendor/mediabunny/dist/bundles/mediabunny.mjs';
import { DURATION } from './tour-timeline.mjs';

export class FilmExporter {
  constructor(tour, research, context, notify) {
    Object.assign(this, { tour, research, context, notify, running: false, cancelled: false });
  }
  static get supported() { return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'; }
  static capabilities = null;
  static async probe() {
    const safe = promise => promise.catch(() => false);
    const [mp4Video, mp4Audio, webmVideo, webmAudio] = await Promise.all([
      safe(canEncodeVideo('avc')), safe(canEncodeAudio('aac')), safe(canEncodeVideo('vp9')), safe(canEncodeAudio('opus')),
    ]);
    return this.capabilities = { mp4Video, mp4Audio, webmVideo, webmAudio };
  }
  cancel() { this.cancelled = true; }
  async record({ size = '1280x720', fps = 30, profiles = {}, format = 'mp4', withAudio = true } = {}) {
    if (this.running) return;
    if (!FilmExporter.supported) throw new Error('此浏览器没有视频编码能力，请在新版 Chrome 或 Edge 的 localhost / HTTPS 页面导出');
    if (!['1280x720', '1920x1080'].includes(size) || ![24, 30].includes(fps) || !['mp4', 'webm'].includes(format)) throw new Error('不支持的导出格式、尺寸或帧率');
    const { app, renderer, camera, orbit, ui, tick, QualityManager, FilmSound, audio } = this.context;
    if (QualityManager.building) throw new Error('请等待画质生成完成再导出');
    const [width, height] = size.split('x').map(Number), frames = DURATION * fps;
    const codec = format === 'mp4' ? 'avc' : 'vp9', audioCodec = format === 'mp4' ? 'aac' : 'opus';
    const quality = new Quality({ bitrate: width === 1280 ? 5_000_000 : 10_000_000 });
    if (!await canEncodeVideo(codec, { width, height, frameRate: fps, quality })) throw new Error('浏览器不支持此格式或尺寸的视频编码，请尝试 720p / WebM 或更新浏览器');
    if (withAudio && !await canEncodeAudio(audioCodec, { sampleRate: 48000, numberOfChannels: 2 })) throw new Error('此浏览器不支持当前格式的声音编码，请选择 WebM 或关闭导出声音');
    const was = { active: this.tour.active, time: this.tour.time, t: app.t, forceT: app.forceT, playing: app.playing,
      speed: app.speed, capSize: app.capSize, pr: app.pr, driftK: app.driftK, hidden: ui.forceHidden,
      extension: this.research.active, form: this.research.form, params: { ...this.research.params },
      clock: this.research.clock, angle: this.research.angle, freeOn: app.free.on, freeFov: app.free.fov,
      cameraPosition: camera.position.clone(), orbitTarget: orbit.target.clone(),
      canvasWidth: renderer.domElement.style.width, canvasHeight: renderer.domElement.style.height };
    this.running = true; this.cancelled = false;
    let output;
    try {
      this.notify({ status: 'start', frames, size, fps, withAudio, format });
      document.body.classList.add('research-export');
      FilmSound.stop(); await audio.setEnabled(false);
      this.tour.start(profiles); app.capturing = true; app.playing = false; app.speed = 1; app.driftK = 0;
      app.capSize = [width, height]; ui.forceHidden = true; app.resize();
      let soundBuffer;
      if (withAudio) {
        this.notify({ status: 'stage', stage: '正在合成原作与四种形态的立体声音轨…' });
        soundBuffer = await FilmSound.exportBuffer(this.tour.profiles, FilmSound.volume);
      }
      const target = new BufferTarget();
      output = new Output({ target, format: format === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat() });
      const video = new CanvasSource(renderer.domElement, { codec, quality, keyFrameInterval: 2, latencyMode: 'quality' });
      output.addVideoTrack(video, { frameRate: fps });
      const sound = withAudio ? new AudioBufferSource({ codec: audioCodec, quality: new Quality({ bitrate: 192000 }) }) : null;
      if (sound) output.addAudioTrack(sound);
      output.setMetadataTags({ title: 'Obsidian · 48-second complete film', artist: 'Techartist / Research Lab 004' });
      await output.start();
      for (let i = 0; i < frames; i++) {
        if (this.cancelled) { this.notify({ status: 'cancelled' }); return; }
        if (app.lost) throw new Error('图形设备连接中断，已停止导出；恢复后可重试');
        this.tour.time = i / fps; tick(performance.now(), 0);
        await video.add(i / fps, 1 / fps);
        // Let the UI process cancellation; timestamps remain exact even on a slow GPU.
        if (i % 4 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        if (i % fps === 0 || i === frames - 1) this.notify({ status: 'progress', frame: i + 1, frames, time: (i + 1) / fps });
      }
      if (this.cancelled) { this.notify({ status: 'cancelled' }); return; }
      if (sound) {
        this.notify({ status: 'stage', stage: '正在编码并合并 48 秒声音…' });
        await sound.add(soundBuffer);
      }
      if (this.cancelled) { this.notify({ status: 'cancelled' }); return; }
      this.notify({ status: 'stage', stage: '正在完成视频文件…' });
      await output.finalize();
      const blob = new Blob([target.buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
      this.notify({ status: 'done', blob, filename: `obsidian-complete-48s-${size}-${fps}fps${withAudio ? '-sound' : ''}.${format}`,
        bytes: blob.size, frames, fps, duration: DURATION, size, codec, audioCodec: withAudio ? audioCodec : null, format, volume: FilmSound.volume });
    } finally {
      if (output && !['finalized', 'canceled'].includes(output.state)) await output.cancel();
      this.tour.leave();
      Object.assign(app, { t: was.t, forceT: was.forceT, playing: was.playing, speed: was.speed, capSize: was.capSize, pr: was.pr, driftK: was.driftK });
      if (was.active) { this.tour.active = true; this.tour.time = was.time; document.body.classList.add('research-mode'); }
      else if (was.extension) {
        app.playing = false; this.research.select(was.form, was.params);
        this.research.clock = was.clock; this.research.angle = was.angle; app.playing = was.playing;
      }
      renderer.domElement.style.width = was.canvasWidth; renderer.domElement.style.height = was.canvasHeight;
      ui.forceHidden = was.hidden; ui.setPlaying(was.playing); app.resize(); tick(performance.now(), 0);
      if (was.freeOn) {
        app.toggleOrbit(true); app.free.fov = was.freeFov;
        camera.position.copy(was.cameraPosition); orbit.target.copy(was.orbitTarget); orbit.update(); tick(performance.now(), 0);
      }
      app.capturing = false; this.running = false; this.notify({ status: 'idle' });
      document.body.classList.remove('research-export');
      await FilmSound.route();
    }
  }
}
