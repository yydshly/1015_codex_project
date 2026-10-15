(() => {
  const frame = document.getElementById('capability-workbench');
  let pending = 'overview';
  let detail = null;
  const send = () => frame.contentWindow?.postMessage({type:'gitnexus-demo',mode:pending,detail},location.origin);
  frame.addEventListener('load', send);
  document.querySelectorAll('[data-lab-mode]').forEach(link => link.addEventListener('click', () => {
    pending = link.dataset.labMode;
    detail = link.dataset.labDetail || null;
    send();
  }));
  const modes = {context:'context',impact:'impact',trace:'flows',search:'search',change:'changes'};
  document.querySelectorAll('[data-set-mode],[data-show-effect]').forEach(link => link.addEventListener('click', () => {
    pending = modes[link.dataset.setMode || link.dataset.showEffect] || 'overview';
    send();
  }));
})();
