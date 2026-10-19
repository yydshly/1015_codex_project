(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { source: null, detail: null, line: 0, episode: 0, hls: null, query: '', page: 1, pages: 1, searchRun: 0, detailRun: 0, playRun: 0, retry: false };
  const video = $('video');
  const status = (id, message, error = false) => { $(id).textContent = message; $(id).classList.toggle('error', error); };
  const element = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; };
  async function api(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try { const response = await fetch(`/api/${path}`, { signal: controller.signal }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '接口请求失败'); return data; }
    catch (error) { if (error.name === 'AbortError') throw new Error('上游响应超时，请重试'); throw error; }
    finally { clearTimeout(timer); }
  }
  function renderCards(items) {
    $('results').replaceChildren();
    const ranked = [...items].sort((a, b) => Number(b.id === state.source?.fixture.id) - Number(a.id === state.source?.fixture.id));
    for (const item of ranked) {
      const card = element('button', 'movie-card'); card.type = 'button'; card.dataset.movieId = item.id; card.setAttribute('aria-label', `选择影片 ${item.title}`); card.setAttribute('aria-pressed', String(state.detail?.id === item.id));
      const poster = element('div', 'poster'); poster.append(element('span', 'poster-fallback', item.title.slice(0, 1)));
      if (/^https?:\/\//i.test(item.poster)) { const img = element('img'); img.src = item.poster; img.alt = `${item.title} 海报`; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => img.remove(), { once: true }); poster.append(img); }
      poster.append(element('span', 'poster-tag', item.id === state.source?.fixture.id ? '播放已实测' : (item.remarks || item.type || '影片')));
      card.append(poster, element('h3', '', item.title), element('p', '', [item.year, item.area, item.type].filter(Boolean).join(' · ')));
      card.addEventListener('click', () => selectMovie(item.id)); $('results').append(card);
    }
  }
  async function search(keyword, page = 1) {
    keyword = keyword.trim(); if (!keyword) return;
    const run = ++state.searchRun; $('search-button').disabled = true; $('search-button').textContent = '正在搜索…';
    status('search-status', `正在查询「${keyword}」…`);
    try {
      const data = await api(`search?q=${encodeURIComponent(keyword)}&page=${page}`); if (run !== state.searchRun) return;
      state.query = keyword; state.page = data.page; state.pages = data.pages;
      renderCards(data.items); $('results-title').textContent = `「${keyword}」的搜索结果`;
      $('result-count').textContent = `${data.total} 个结果 · ${data.elapsed_ms} ms`;
      status('search-status', data.items.length ? `来自 ${data.source} · 点击海报查看详情和集数` : '没有找到匹配的影片，换个片名试试。');
      $('pagination').hidden = data.pages <= 1; $('page-info').textContent = `${data.page} / ${data.pages}`;
      $('previous-page').disabled = data.page <= 1; $('next-page').disabled = data.page >= data.pages;
    } catch (error) { if (run === state.searchRun) { $('results').replaceChildren(); $('pagination').hidden = true; $('result-count').textContent = '搜索未完成'; status('search-status', error.message, true); } }
    finally { if (run === state.searchRun) { $('search-button').disabled = false; $('search-button').textContent = '搜索影片 ↗'; } }
  }
  function stopVideo() {
    video.pause(); if (state.hls) { state.hls.destroy(); state.hls = null; } video.removeAttribute('src'); video.load(); $('play-toggle').disabled = true; $('play-toggle').textContent = '▶ 播放'; state.retry = false;
  }
  async function selectMovie(id) {
    const run = ++state.detailRun; ++state.playRun; stopVideo(); state.detail = null; $('episodes').replaceChildren(); $('episode-empty').hidden = false; $('episode-empty').textContent = '正在读取集数…';
    $('line-label').hidden = true; $('previous-episode').disabled = true; $('next-episode').disabled = true;
    status('playback-status', '正在读取影片详情…');
    try {
      const data = await api(`detail?id=${encodeURIComponent(id)}`); if (run !== state.detailRun) return;
      state.detail = data; state.line = 0; state.episode = 0; $('movie-title').textContent = data.title;
      $('movie-meta').textContent = [data.year, data.area, data.type].filter(Boolean).join(' · '); $('description').textContent = data.description || '暂无简介'; $('description-box').hidden = false;
      $('line').replaceChildren(); data.lines.forEach((line, i) => { const option = element('option', '', line.name); option.value = String(i); $('line').append(option); });
      $('line-label').hidden = data.lines.length < 2;
      for (const card of document.querySelectorAll('.movie-card')) card.setAttribute('aria-pressed', String(card.dataset.movieId === id));
      if (!data.lines.length) { $('episode-empty').textContent = '这部影片没有可直接播放的 HLS / MP4 线路。'; status('playback-status', '此条目需要上游专用解析，当前 Demo 无法直接播放。', true); return; }
      renderEpisodes(); await chooseEpisode(0);
    } catch (error) { if (run === state.detailRun) { status('playback-status', error.message, true); $('episode-empty').textContent = '详情加载失败，请重新选择影片。'; } }
  }
  function renderEpisodes() {
    const episodes = state.detail.lines[state.line].episodes;
    $('episode-empty').hidden = true; $('episodes').replaceChildren(); $('episode-count').textContent = `共 ${episodes.length} 集`;
    episodes.forEach((episode, i) => { const button = element('button', '', episode.name); button.type = 'button'; button.setAttribute('aria-pressed', String(i === state.episode)); button.addEventListener('click', () => chooseEpisode(i)); $('episodes').append(button); });
    $('previous-episode').disabled = state.episode <= 0; $('next-episode').disabled = state.episode >= episodes.length - 1;
  }
  async function chooseEpisode(index) {
    if (!state.detail) return;
    const run = ++state.playRun; state.episode = index; stopVideo(); renderEpisodes();
    const name = state.detail.lines[state.line].episodes[index].name;
    $('player-badge').textContent = name; status('playback-status', `正在加载 ${name} 的播放信息…`);
    try {
      const data = await api(`play?id=${encodeURIComponent(state.detail.id)}&line=${state.line}&episode=${index}`); if (run !== state.playRun) return;
      $('player-placeholder').hidden = true; $('play-toggle').disabled = false; $('play-toggle').textContent = '▶ 播放';
      if (data.format === 'hls' && window.Hls?.isSupported()) {
        state.hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 40, backBufferLength: 10, maxBufferSize: 16000000, manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2, fragLoadingMaxRetry: 3 });
        state.hls.on(Hls.Events.ERROR, (_, info) => { if (run === state.playRun && info.fatal) { state.retry = true; video.pause(); status('playback-status', `视频加载失败（${info.details}）。可点击重试加载，或更换影片。`, true); $('player-badge').textContent = '加载失败'; state.hls?.stopLoad(); $('play-toggle').textContent = '↻ 重试加载'; } });
        state.hls.loadSource(data.url); state.hls.attachMedia(video);
      } else if (data.format !== 'hls' || video.canPlayType('application/vnd.apple.mpegurl')) { video.src = data.url; }
      else { throw new Error('当前浏览器不支持 HLS 播放，请使用新版 Chrome、Edge 或 Safari。'); }
      status('playback-status', `${name} · ${data.line} · 加载后点击播放`);
    } catch (error) { if (run === state.playRun) status('playback-status', error.message, true); }
  }
  $('search-form').addEventListener('submit', (event) => { event.preventDefault(); search($('query').value); });
  $('example').addEventListener('click', () => { $('query').value = state.source?.fixture.query || '头号外交官'; search($('query').value); });
  $('previous-page').addEventListener('click', () => search(state.query, state.page - 1)); $('next-page').addEventListener('click', () => search(state.query, state.page + 1));
  $('line').addEventListener('change', () => { state.line = Number($('line').value); chooseEpisode(0); });
  $('previous-episode').addEventListener('click', () => chooseEpisode(state.episode - 1)); $('next-episode').addEventListener('click', () => chooseEpisode(state.episode + 1));
  $('play-toggle').addEventListener('click', async () => { if (state.retry) { await chooseEpisode(state.episode); return; } if (video.paused) { try { await video.play(); } catch (error) { status('playback-status', `暂时无法播放：${error.message}`, true); } } else video.pause(); });
  video.addEventListener('loadedmetadata', () => status('playback-status', '媒体已就绪，点击播放开始观看。'));
  video.addEventListener('playing', () => { $('play-toggle').textContent = 'Ⅱ 暂停'; $('player-badge').textContent = `${state.detail.lines[state.line].episodes[state.episode].name} · 播放中`; status('playback-status', '正在播放'); });
  video.addEventListener('pause', () => { if (state.retry) return; $('play-toggle').textContent = '▶ 播放'; if (video.currentTime > 0 && !video.ended) { const episode = state.detail?.lines[state.line]?.episodes[state.episode]; if (episode) $('player-badge').textContent = `${episode.name} · 已暂停`; status('playback-status', '已暂停，可继续播放或选择其他集数。'); } });
  video.addEventListener('timeupdate', () => { if (!video.paused) { const t = Math.floor(video.currentTime); status('playback-status', `正在播放 · ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`); } });
  video.addEventListener('ended', () => { $('play-toggle').textContent = '↻ 重播'; status('playback-status', '本集已结束，可以选择下一集。'); });
  video.addEventListener('error', () => { if (video.getAttribute('src')) status('playback-status', `播放器无法解码或读取此视频（错误 ${video.error?.code || '未知'}）。`, true); });
  (async () => { try { const data = await api('status'); state.source = data.source; $('source-name').textContent = data.source.name; $('source-info').textContent = `来源：${data.source.config_name}配置 · 实时接口`; $('example').textContent = data.source.fixture.query; $('query').value = data.source.fixture.query; status('playback-status', '从下方结果选择影片，查看集数并播放。'); await search(data.source.fixture.query); } catch (error) { $('source-name').textContent = '本地服务未连接'; $('source-info').textContent = '请使用项目启动命令打开 Demo'; status('playback-status', error.message, true); } })();
})();
