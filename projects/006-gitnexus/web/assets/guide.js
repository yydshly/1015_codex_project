(() => {
  'use strict';
  const dialog = document.getElementById('guide-dialog');
  if (!dialog) return;
  const view = dialog.querySelector('.guide-view');
  const fitButton = document.getElementById('guide-fit');
  const originalButton = document.getElementById('guide-original');
  const fit = value => {
    dialog.classList.toggle('is-fit', value);
    fitButton.setAttribute('aria-pressed', String(value));
    originalButton.setAttribute('aria-pressed', String(!value));
  };
  document.querySelectorAll('[data-guide-open]').forEach(button => button.addEventListener('click', () => {
    fit(window.innerWidth >= 800);
    dialog.showModal();
    document.documentElement.classList.add('guide-is-open');
    view.scrollTop = 0;
    view.scrollLeft = 0;
  }));
  fitButton.addEventListener('click', () => fit(true));
  originalButton.addEventListener('click', () => fit(false));
  document.getElementById('guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('guide-is-open'));
})();
