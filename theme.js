/* Light / dark switch. Remembers your choice; otherwise follows the phone's setting. */
(function () {
  'use strict';
  const KEY = 'bhukkad.theme', root = document.documentElement;
  const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const apply = (t) => {
    root.setAttribute('data-theme', t);
    const b = document.getElementById('themebtn');
    if (b) { b.setAttribute('aria-pressed', String(t === 'dark')); b.title = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'; }
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#150f26' : '#ffd23f');
  };
  apply(saved() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#themebtn')) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (err) { /* private mode: still switch for this visit */ }
    apply(next);
  });
})();
