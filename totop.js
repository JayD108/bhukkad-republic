/* A "back to top" button that appears after you scroll down. */
(function () {
  'use strict';
  const btn = document.createElement('button');
  btn.className = 'totop';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5 4 13l1.4 1.4L11 8.800V20h2V8.800l5.600 5.600L20 13l-8-8Z" fill="currentColor"/></svg>';
  document.body.appendChild(btn);
  const update = () => btn.classList.toggle('show', window.scrollY > 700);
  window.addEventListener('scroll', update, { passive: true });
  btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); document.getElementById('app').focus({ preventScroll: true }); });
  update();
})();
