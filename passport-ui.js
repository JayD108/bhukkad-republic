/* My Passport: creating it and signing out. Front end only (saved in this browser). */
(function () {
  'use strict';
  const C = window.BHC, B = () => window.BH;

  function create(form) {
    const val = (id) => (document.getElementById(id) || {}).value || '';
    const handle = val('pf-handle').trim(), errs = [];
    const bad = C.handleProblem(handle);
    if (bad) errs.push(bad);
    if (!document.getElementById('pf-fun').checked) errs.push('Please tick the box to say you know this is just for fun.');
    const box = document.getElementById('pf-errors');
    box.innerHTML = errs.length ? '<b>Almost there:</b><ul>' + errs.map((e) => `<li>${B().esc(e)}</li>`).join('') + '</ul>' : '';
    if (errs.length) return;
    C.set(C.K.me, { handle, bowl: val('pbowl') || C.BOWL_PICKS[0], home: val('pf-home'), at: Date.now() });
    B().toast('Welcome to the Republic, @' + handle);
    B().rerender();
  }

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'pform') { e.preventDefault(); create(e.target); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-signout]')) return;
    if (confirm('Sign out on this device? Your plates stay saved here, but you will need to pick a handle again.')) {
      localStorage.removeItem(C.K.me); B().rerender();
    }
  });
})();
