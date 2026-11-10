/* Bhukkad Chowk, part 2: the screens (feed, post form, home preview). Front end only. */
(function () {
  'use strict';
  const C = window.BHC;
  window.BHR = window.BHR || {};
  const B = () => window.BH;
  const dishBySlug = (slug) => B().dishes.find((x) => x.slug === slug);

  function postCard(p, open) {
    const { esc, bowl } = B(), m = C.me(), mine = !!m && p.handle === m.handle;
    const liked = C.get(C.K.liked, []).includes(p.id), tried = C.get(C.K.tried, []).includes(p.id);
    const dish = p.dish ? dishBySlug(p.dish) : null, cms = p.comments || [];
    const badge = p.sample ? '<span class="chip">Sample</span>' : `<span class="chip mint">${esc(mine ? C.tier(C.stats(B().billsLoad()).points) : 'Citizen')}</span>`;
    return `<article class="post box" id="post-${esc(p.id)}">
      <header class="ph"><span class="av">${bowl(p.bowl || 'dhokla', 46)}</span>
        <div class="who"><b>@${esc(p.handle)}</b> ${badge}<br><small>${esc(C.ago(p.at))} · ${esc(C.PTYPES[p.type] || p.type)}</small></div>
        ${mine ? `<button class="linkbtn" data-delpost="${esc(p.id)}">delete</button>` : ''}</header>
      ${p.photo ? `<img class="pphoto" src="${p.photo}" alt="${esc(p.title)}" loading="lazy">` : ''}
      <h3>${esc(p.title)}</h3>
      ${dish ? `<a class="dishtag" href="#/dish/${esc(dish.slug)}">#${esc(dish.name)} · open its passport</a>` : ''}
      ${p.steps && p.steps.length ? '<span class="chip">Citizen recipe · unverified</span>' : ''}
      ${p.where ? `<p class="small"><b>Eaten at:</b> ${esc(p.where)}</p>` : ''}
      ${p.body ? `<p class="pbody">${esc(p.body)}</p>` : ''}
      ${p.steps && p.steps.length ? `<details class="psteps"><summary>How I made it (${p.steps.length} steps)</summary><ol class="rx-steps">${p.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>` : ''}
      <footer class="pf">
        <button class="pbtn" data-yum="${esc(p.id)}" data-base="${p.yums || 0}" aria-pressed="${liked}"${mine ? ' disabled title="You cannot yum your own post"' : ''}>Yum <b>${(p.yums || 0) + (liked ? 1 : 0)}</b></button>
        ${p.type === 'made' || p.type === 'hack' || p.type === 'ate' ? `<button class="pbtn" data-tried="${esc(p.id)}" data-base="${p.tried || 0}" aria-pressed="${tried}">I tried this <b>${(p.tried || 0) + (tried ? 1 : 0)}</b></button>` : ''}
        <button class="pbtn" data-cm="${esc(p.id)}">Comments <b>${cms.length}</b></button></footer>
      <div class="comments" id="cm-${esc(p.id)}"${open ? '' : ' hidden'}>
        ${cms.map((c) => `<div class="cmt"><b>@${esc(c.handle)}</b> <small>${esc(C.ago(c.at))}</small><p>${esc(c.text)}</p></div>`).join('') || '<p class="small muted">No comments yet. Be the first.</p>'}
        <form class="cmform" data-post="${esc(p.id)}">${m ? '' : '<input name="handle" maxlength="20" placeholder="pick a handle (letters, numbers, _)" aria-label="Your handle">'}
          <input name="text" maxlength="300" placeholder="Say something kind and useful" aria-label="Comment" required><button class="btn" type="submit">Reply</button></form></div></article>`;
  }

  function feed(params) {
    const { esc } = B(), type = params.get('type') || '', sort = params.get('sort') === 'yum' ? 'yum' : 'new';
    const dishF = params.get('dish') || '', dishObj = dishBySlug(dishF);
    const list = C.allPosts().filter((x) => (!type || x.type === type) && (!dishF || x.dish === dishF)).sort((a, b) => (sort === 'yum' ? (b.yums || 0) - (a.yums || 0) : b.at - a.at));
    const st = C.stats(B().billsLoad()), hidden = C.get(C.K.hide, false);
    const chips = Object.entries(C.PTYPES).map(([k, v]) => `<button class="fchip" data-ptype="${k}" aria-pressed="${type === k}">${esc(v)}</button>`).join('');
    return `<div class="wrap pagehead"><div class="kicker">Bhukkad Chowk · the public square</div><h1>What did you cook?</h1>
      <p class="lede">Post what you cooked or ate, ask for help, share a hack. No essays needed: a photo and one line is plenty.</p>
      ${dishObj ? `<p><span class="dishtag">Plates for ${esc(dishObj.name)} · <a href="#/chowk">show all</a></span></p>` : ''}
      <div class="cta-row"><a class="btn" href="#/chowk/new${dishObj ? '?dish=' + esc(dishObj.slug) : ''}">Post a plate</a><a class="btn alt" href="#/seats">The 50 seats</a></div>
      <div class="basic"><b>Preview:</b> the Chowk is not connected yet. Posts are saved only in this browser and nobody else can see them. Posts marked Sample are not real people.</div>
      <div class="filters" role="group" aria-label="Filter posts"><button class="fchip" data-ptype="" aria-pressed="${!type}">All</button>${chips}
        <button class="fchip" data-psort="new" aria-pressed="${sort === 'new'}">Latest</button><button class="fchip" data-psort="yum" aria-pressed="${sort === 'yum'}">Most yum</button>
        <button class="fchip" data-hidesamples aria-pressed="${hidden}">Hide samples</button></div>
      <div class="chowk-grid"><div class="feed">${list.length ? list.map((x) => postCard(x)).join('') : '<div class="box" style="padding:20px">Nothing here yet. Be the first to post.</div>'}</div>
        <aside class="side-col">
          <div class="box rules"><h3>Rules of the Republic</h3><ul><li>Pure vegetarian only.</li><li>Be kind. Argue with the food, not the person.</li><li>Cooking safety first. Never leave a kettle or pan unattended.</li><li>Only post photos you took yourself.</li></ul></div>
          <div class="box rules"><h3>Your standing</h3><p><b>${esc(C.tier(st.points))}</b> · ${st.points} points</p><p class="small muted">Post +10 · Comment on others +2 · Bill +5, with daily caps. <a href="#/seats">How seats work</a></p></div>
        </aside></div></div>`;
  }

  function compose(params) {
    const { esc, bowl, dishes } = B(), m = C.me(), t = params.get('type');
    const type = t in C.PTYPES ? t : 'made', pre = dishBySlug(params.get('dish') || '');
    const types = Object.entries(C.PTYPES).map(([k, v]) => `<label class="tchip"><input type="radio" name="ptype" value="${k}"${k === type ? ' checked' : ''}><span>${esc(v)}</span></label>`).join('');
    const who = m ? `<p class="small">Posting as <b>@${esc(m.handle)}</b></p>`
      : `<label class="fld">Pick a handle<input id="pp-handle" maxlength="20" placeholder="letters, numbers and _" autocomplete="off"></label>
         <div class="fld">Pick your bowl<div class="bowlpick">${C.BOWL_PICKS.map((b, i) => `<button type="button" class="bp" data-bowlpick="${b}" aria-pressed="${i === 0}" aria-label="Bowl ${i + 1}">${bowl(b, 52)}</button>`).join('')}</div><input type="hidden" id="pbowl" value="${C.BOWL_PICKS[0]}"></div>`;
    return `<div class="wrap pagehead"><div class="kicker">Bhukkad Chowk</div><h1>Post a plate</h1>
      <p class="lede">Cooked something, or ate something great somewhere? A photo and a line is enough. The how-to is optional.</p>
      <form id="postform" class="pform box" novalidate><div id="pp-errors" class="perr" role="alert" aria-live="assertive"></div>
        <fieldset class="tchips"><legend>What kind of post?</legend>${types}</fieldset>
        <label class="fld">Which dish? <small>(optional, links to its passport)</small><input id="pp-dish" list="pp-list" value="${esc(pre ? pre.name : '')}" autocomplete="off" placeholder="Type a dish name"><datalist id="pp-list">${dishes.map((d) => `<option value="${esc(d.name)}">`).join('')}</datalist></label>
        <label class="fld">Where did you eat it? <small>(for "I ate it" posts, optional: a stall, a dhaba, a friend's house)</small><input id="pp-where" maxlength="80" autocomplete="off"></label>
        <label class="fld">Title<input id="pp-title" maxlength="80" placeholder="e.g. Kettle Maggi, attempt three"></label>
        <label class="fld">Tell us in a line or two<textarea id="pp-body" rows="3" maxlength="500"></textarea></label>
        <label class="fld">How you made it <small>(optional, one step per line)</small><textarea id="pp-steps" rows="4" maxlength="1500"></textarea></label>
        <label class="fld">Photo <small>(optional, shrunk on your device, and its hidden info is removed)</small><input id="pphoto" type="file" accept="image/*"></label>
        <div id="pprev"></div>${who}
        <label class="check"><input type="checkbox" id="pp-veg"> This is vegetarian. The Republic is pure veg.</label>
        <p class="small muted" style="margin:0">Please don't put anything private in your post. Never leave a kettle or pan unattended.</p>
        <button class="btn" type="submit">Post it</button></form></div>`;
  }

  function teaser(bh) {
    const { esc, bowl } = bh, list = C.allPosts().sort((a, b) => b.at - a.at).slice(0, 3);
    const mini = list.map((p) => `<a class="mini box" href="#/chowk"><span class="av">${bowl(p.bowl || 'dhokla', 40)}</span><span><b>${esc(p.title)}</b><small>@${esc(p.handle)} · ${esc(C.PTYPES[p.type])} · ${esc(String((p.yums || 0)))} yum</small></span></a>`).join('');
    return `<section class="wrap sec"><div class="kicker">Bhukkad Chowk</div><h2>What is the Republic cooking?</h2>
      <p class="lede">Post what you made, ask for help, share a hack. The best talkers earn seats in the Parliament.</p>
      <div class="minis">${mini}</div>
      <p class="cta-row"><a class="btn" href="#/chowk/new">Post what you cooked</a><a class="btn alt" href="#/chowk">Open the Chowk</a><a class="btn alt" href="#/seats">The 50 seats</a></p></section>`;
  }

  window.BHR.chowk = (parts, params) => (parts[1] === 'new'
    ? { html: compose(params), nav: 'chowk', title: 'Post a plate · Chowk' }
    : { html: feed(params), nav: 'chowk', title: 'Bhukkad Chowk' });
  window.BHR.teaser = teaser;
})();
