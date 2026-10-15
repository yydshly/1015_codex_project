/* View and download the same self-contained research SVG. No external services. */
const $ = selector => document.querySelector(selector);
const dialog = $('#understanding-dialog');
const scroller = $('#map-viewer-scroll');
const image = $('#understanding-large');
const status = $('#understanding-status');
let scale = 1;
let opener;
$("a[href='#understanding-text']").addEventListener('click', () => { $('#understanding-text').open = true; });

function zoom(next, preservePosition = true) {
  const old = scale;
  scale = Math.min(1.5, Math.max(.15, next));
  image.style.width = `${1920 * scale}px`;
  image.style.height = `${4280 * scale}px`;
  $('#map-zoom-level').textContent = `${Math.round(scale * 100)}%`;
  $('#map-zoom-out').disabled = scale <= .15;
  $('#map-zoom-in').disabled = scale >= 1.5;
  if (preservePosition) {
    scroller.scrollTop *= scale / old;
    scroller.scrollLeft *= scale / old;
  }
}
function fit() { zoom((scroller.clientWidth - 32) / 1920); }
function open(event) {
  opener = event.currentTarget;
  dialog.showModal();
  document.body.classList.add('map-is-open');
  if (scroller.clientWidth < 680) zoom(1, false);
  else fit();
  scroller.scrollTo(0, 0);
  $('#map-jump').value = '0';
}
$('#open-understanding').addEventListener('click', open);
$('#open-understanding-image').addEventListener('click', open);
$('#close-understanding').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('map-is-open');
  opener?.focus({ preventScroll: true });
});
$('#map-zoom-in').addEventListener('click', () => zoom(scale + .15));
$('#map-zoom-out').addEventListener('click', () => zoom(scale - .15));
$('#map-fit').addEventListener('click', fit);
$('#map-jump').addEventListener('change', event => {
  scroller.scrollTo({ top: Number(event.target.value) * scale, left: 0 });
});
$('#download-understanding-png').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  status.textContent = '正在生成 PNG，保留图内全部效果与文字…';
  let objectUrl;
  let downloadUrl;
  try {
    await document.fonts.ready;
    const response = await fetch($('#understanding-image').src);
    if (!response.ok) throw new Error('研究图加载失败');
    objectUrl = URL.createObjectURL(new Blob([await response.text()], { type: 'image/svg+xml;charset=utf-8' }));
    const raster = new Image();
    raster.src = objectUrl;
    await raster.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 4280;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法生成图片');
    context.drawImage(raster, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG 编码失败')), 'image/png'));
    downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'obsidian-understanding-1920.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    status.textContent = 'PNG 已生成 · 1920 × 4280 · 也可下载 SVG 保持文字与线条清晰';
  } catch (error) {
    status.textContent = `${error.message}。可使用旁边的“下载 SVG 原图”。`;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    button.disabled = false;
  }
});
