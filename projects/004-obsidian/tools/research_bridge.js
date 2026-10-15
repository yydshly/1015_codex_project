  // Local research adapter and four additional targets in the original GPU shard pipeline.
  const researchContext = { renderer, camera, app, orbit, ui, meshes, U, ShardSystem, PostFX, Lighting, FullScreenQuad, tick, Edit, CONFIG, director, QualityManager, AudioEngine, Story, THREE, audio, Tour, Research, FilmSound };
  Research.attach(researchContext); Tour.attach(researchContext);
  FilmSound.attach(researchContext);
  document.addEventListener('visibilitychange', () => { if (document.hidden) FilmSound.stop(); else if (FilmSound.enabled) FilmSound.ctx?.resume(); });
  const exportFilm = new FilmExporter(Tour, Research, researchContext, (data) => {
    if (window.parent !== window) window.parent.postMessage({ type: 'obsidian:export', ...data }, location.origin);
  });
  window.addEventListener('keydown', event => { if (exportFilm.running) event.stopImmediatePropagation(); }, true);
  const queryShape = new URLSearchParams(location.search).get('shape');
  if (['galaxy', 'tornado', 'dna', 'text'].includes(queryShape)) Research.select(queryShape);
  if (new URLSearchParams(location.search).has('tour')) Tour.start();
  if (window.parent !== window) {
    const reportResearchState = (action) => window.parent.postMessage({
      type: 'obsidian:status', ready: true, playing: app.playing,
      time: app.t * CONFIG.cycleDuration, duration: CONFIG.cycleDuration,
      story: Edit.story(app.t), count: ShardSystem.bundle.count,
      tier: app.tier.key, orbit: app.free.on, qualityBusy: QualityManager.building,
      mode: Tour.active ? 'tour' : Research.active ? Research.form : 'original', params: Research.params,
      tourTime: Tour.time, tourDuration: 48, chapter: Tour.state.chapter.name,
      tourIndex: Tour.state.index, exporting: exportFilm.running, canExport: FilmExporter.supported,
      soundOn: app.soundOn, soundBusy: FilmSound.busy, soundReady: FilmSound.ready, volume: FilmSound.volume,
      soundActive: Tour.active || Research.active ? !!FilmSound.source && FilmSound.ctx?.state === 'running' : audio.enabled && audio.ctx?.state === 'running',
      mediaSupport: FilmExporter.capabilities,
      extensionTime: Research.clock, targets: Research.targetCount,
      vertices: ShardSystem.bundle.geo.attributes.position.count,
      stateTextures: ShardSystem.bundle.rt.textures.length,
      gpuExtension: Research.uniforms.uExtOn.value === 1, action,
    }, location.origin);
    window.addEventListener('message', async (event) => {
      if (event.source !== window.parent || event.origin !== location.origin) return;
      const m = event.data;
      if (!m || m.type !== 'obsidian:control') return;
      try {
        if (m.action === 'cancelExport') { exportFilm.cancel(); return; }
        if (exportFilm.running) return;
        if (m.action === 'tour') {
          Tour.start(m.profiles || {});
        } else if (m.action === 'tourSeek' && Tour.active && Number.isFinite(m.time)) {
          Tour.seek(m.time);
        } else if (m.action === 'export') {
          await exportFilm.record(m);
        } else if (m.action === 'shape' && ['galaxy', 'tornado', 'dna', 'text'].includes(m.form)) {
          Tour.leave();
          Research.select(m.form, m.params || {});
        } else if (m.action === 'parameters' && Research.active && m.params && typeof m.params === 'object') {
          Research.configure(m.params);
        } else if (m.action === 'original') {
          Tour.leave(); Research.leave(); app.playing = true; ui.setPlaying(true); tick(performance.now(), 0);
        } else if (m.action === 'reassemble' && Research.active) {
          Research.reassemble();
        } else if (m.action === 'resetView' && Research.active) {
          Research.resetView(); tick(performance.now(), 0);
        } else if (m.action === 'seek' && Number.isFinite(m.story) && m.story >= 0 && m.story < 36) {
          Tour.leave(); Research.leave(); app.forceT = null; app.t = Edit.fracOf(m.story, true);
          app.playing = false; ui.setPlaying(false); ui.wake(); tick(performance.now(), 0);
        } else if (m.action === 'play' && typeof m.value === 'boolean') {
          app.playing = m.value; ui.setPlaying(app.playing); ui.wake();
        } else if (m.action === 'sound' && typeof m.value === 'boolean') {
          await app.toggleSound(m.value);
        } else if (m.action === 'volume' && Number.isFinite(m.value)) {
          FilmSound.setVolume(m.value);
        } else if (m.action === 'orbit') {
          app.toggleOrbit();
        } else if (m.action === 'quality' && ['low', 'medium', 'high'].includes(m.value)) {
          if (QualityManager.building) throw new Error('已有画质生成任务，请完成后再切换');
          await QualityManager.apply(m.value);
        }
        if (['tour', 'shape', 'original', 'seek', 'parameters', 'play'].includes(m.action)) await FilmSound.route();
        reportResearchState(m.action);
      } catch (error) {
        window.parent.postMessage({ type: 'obsidian:error', message: error.message, action: m.action }, location.origin);
      }
    });
    setInterval(reportResearchState, 500);
    reportResearchState();
    FilmExporter.probe().then(() => reportResearchState());
  }
