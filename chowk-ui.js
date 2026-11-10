/* Bhukkad Chowk, part 3: what happens when you tap things (yum, comment, post, filter). Front end only. */
(function () {
  'use strict';
  const C = window.BHC, B = () => window.BH;
  let pendingPhoto = '';
  const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const keepScroll = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); };
  // returns a message when the handle can't be used, or '' when it is fine
  const handleProblem = (h) => (!/^[A-Za-z0-9_]{3,20}$/.test(h) ? 'Pick a handle: 3 to 20 letters, numbers or _.' : C.reserved(h) ? 'That name is reserved for the Republic. Please pick another.' : '');

  function go(patch) {
    const p = params();
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    location.hash = '#/chowk' + (p.toString() ? '?' + p.toString() : '');
  }
  function toggle(key, id) {
    const list = C.get(key, []), i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    C.set(key, list); return i < 0;
  }
  function pressed(btn, key, id) {
    const on = toggle(key, id);
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('b').textContent = String(Number(btn.dataset.base) + (on ? 1 : 0));
  }

  function addComment(form) {
    const id = form.dataset.post, text = form.elements.text.value.trim();
    if (!text) return;
    let m = C.me();
    if (!m) {
      const h = form.elements.handle ? form.elements.handle.value.trim() : '';
      const bad = handleProblem(h); if (bad) { B().toast(bad); return; }
      m = { handle: h, bowl: C.BOWL_PICKS[0] }; C.set(C.K.me, m);
    }
    const c = { handle: m.handle, text: text.slice(0, 300), at: Date.now() };
    const posts = C.get(C.K.posts, []), own = posts.find((x) => x.id === id);
    if (own) { own.comments = (own.comments || []).concat(c); C.set(C.K.posts, posts); }
    else { const cmx = C.get(C.K.cmx, {}); cmx[id] = (cmx[id] || []).concat(c); C.set(C.K.cmx, cmx); }
    keepScroll(() => B().rerender());
    const box = document.getElementById('cm-' + id); if (box) box.hidden = false;
    B().toast('Reply posted. +2 points');
  }

  function showErrors(box, list) {
    box.innerHTML = list.length ? '<b>Almost there:</b><ul>' + list.map((e) => `<li>${B().esc(e)}</li>`).join('') + '</ul>' : '';
  }
  function submitPost(form) {
    const val = (id) => (document.getElementById(id) || {}).value || '';
    const type = form.querySelector('input[name=ptype]:checked').value;
    const title = val('pp-title').trim(), body = val('pp-body').trim();
    const steps = val('pp-steps').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12);
    const dishName = val('pp-dish').trim().toLowerCase(), dish = B().dishes.find((d) => d.name.toLowerCase() === dishName);
    const m = C.me() || { handle: val('pp-handle').trim(), bowl: val('pbowl') || C.BOWL_PICKS[0] }, errs = [];
    if (title.length < 3) errs.push('Give your post a title (at least 3 letters).');
    if (!body && !steps.length && !pendingPhoto) errs.push('Add a line, some steps or a photo.');
    { const bad = handleProblem(m.handle); if (bad && !C.me()) errs.push(bad); }
    if (!document.getElementById('pp-veg').checked) errs.push('Please confirm this is vegetarian. The Republic is pure veg.');
    showErrors(document.getElementById('pp-errors'), errs);
    if (errs.length) return;
    const where = val('pp-where').trim().slice(0, 80);
    const post = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type, dish: dish ? dish.slug : '', where, title, body, steps,
      photo: pendingPhoto, handle: m.handle, bowl: m.bowl, at: Date.now(), yums: 0, tried: 0, comments: [] };
    if (!C.set(C.K.posts, [post].concat(C.get(C.K.posts, [])))) { B().toast('No room left in this browser. Try a smaller photo.'); return; }
    if (!C.me()) C.set(C.K.me, m);
    pendingPhoto = ''; B().toast('Posted! +10 points'); location.hash = '#/chowk';
  }

  function readPhoto(file) {
    return new Promise((resolve) => {
      if (!file || !/^image\//.test(file.type)) return resolve('');
      const fr = new FileReader();
      fr.onerror = () => resolve('');
      fr.onload = () => {
        const im = new Image();
        im.onerror = () => resolve('');
        im.onload = () => { // redrawing on a canvas shrinks the picture and drops its hidden camera/location info
          const k = Math.min(1, 720 / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.72));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target, q = (s) => t.closest(s);
    let el;
    if ((el = q('[data-yum]'))) { pressed(el, C.K.liked, el.dataset.yum); return; }
    if ((el = q('[data-tried]'))) { pressed(el, C.K.tried, el.dataset.tried); return; }
    if ((el = q('[data-cm]'))) { const box = document.getElementById('cm-' + el.dataset.cm); if (box) box.hidden = !box.hidden; return; }
    if ((el = q('[data-ptype]'))) { go({ type: el.dataset.ptype }); return; }
    if ((el = q('[data-psort]'))) { go({ sort: el.dataset.psort }); return; }
    if (q('[data-hidesamples]')) { C.set(C.K.hide, !C.get(C.K.hide, false)); keepScroll(() => B().rerender()); return; }
    if ((el = q('[data-delpost]'))) {
      if (confirm('Delete this post?')) { C.set(C.K.posts, C.get(C.K.posts, []).filter((x) => x.id !== el.dataset.delpost)); keepScroll(() => B().rerender()); }
      return;
    }
    if ((el = q('[data-bowlpick]'))) {
      document.querySelectorAll('[data-bowlpick]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      const h = document.getElementById('pbowl'); if (h) h.value = el.dataset.bowlpick;
    }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'postform') { e.preventDefault(); submitPost(e.target); }
    else if (e.target.classList && e.target.classList.contains('cmform')) { e.preventDefault(); addComment(e.target); }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'pphoto') return;
    readPhoto(e.target.files[0]).then((url) => {
      pendingPhoto = url;
      const prev = document.getElementById('pprev');
      if (prev) prev.innerHTML = url ? `<img class="pphoto" alt="Preview of your photo" src="${url}">` : '<p class="small muted">That file could not be used as a picture.</p>';
    });
  });
  window.addEventListener('hashchange', () => { pendingPhoto = ''; });
})();
