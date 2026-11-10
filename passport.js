/* My Passport (#/passport): a fun profile card that collects a stamp for every dish you cook, eat or try. Front end only. */
(function () {
  'use strict';
  const C = window.BHC;
  window.BHR = window.BHR || {};

  function create(bh) {
    const { bowl } = bh;
    const bowls = C.BOWL_PICKS.map((b, i) => `<button type="button" class="bp" data-bowlpick="${b}" aria-pressed="${i === 0}" aria-label="Bowl ${i + 1}">${bowl(b, 52)}</button>`).join('');
    return `<div class="wrap pagehead"><div class="kicker">Bhukkad Republic</div><h1>Get your passport</h1>
      <p class="lede">Free and quick. It is a fun profile card, not a travel document. It fills with a stamp for every dish you cook, eat or try.</p>
      <form id="pform" class="pform box" novalidate><div id="pf-errors" class="perr" role="alert" aria-live="assertive"></div>
        <label class="fld">Pick a handle<input id="pf-handle" maxlength="20" autocomplete="off" placeholder="letters, numbers and _"></label>
        <div class="fld">Pick your bowl<div class="bowlpick">${bowls}</div><input type="hidden" id="pbowl" value="${C.BOWL_PICKS[0]}"></div>
        <label class="check"><input type="checkbox" id="pf-fun"> I understand this is just for fun: not a real passport, ID or travel document.</label>
        <button class="btn" type="submit">Get my passport</button></form></div>`;
  }

  // Dishes you have a stamp for: the dishes in your own plates, and the plates you tried.
  function stamped(m) {
    const slugs = new Set(), tried = C.get(C.K.tried, []);
    C.get(C.K.posts, []).filter((p) => p.handle === m.handle && p.dish).forEach((p) => slugs.add(p.dish));
    C.allPosts().filter((p) => tried.includes(p.id) && p.dish).forEach((p) => slugs.add(p.dish));
    return slugs;
  }

  function card(bh) {
    const { esc, bowl, stampText } = bh, m = C.me(), bills = bh.billsLoad(), st = C.stats(bills);
    const got = [...stamped(m)].map((slug) => bh.dishes.find((d) => d.slug === slug)).filter(Boolean);
    const accepted = bills.filter((b) => b.status === 'Accepted').length;
    const no = 'BK-' + String(bh.hash(m.handle)).padStart(8, '0').slice(0, 8);
    const stamps = got.length
      ? `<div class="stampgrid">${got.map((d) => `<a class="slot on" href="#/dish/${esc(d.slug)}">${stampText('st-DOCUMENTED', 'Tasted', d.name)}</a>`).join('')}</div>`
      : '<p class="muted">No stamps yet. Post a plate, or tap "I tried this" on someone\'s plate, to collect your first one.</p>';
    const mine = C.get(C.K.posts, []).filter((p) => p.handle === m.handle);
    const plates = mine.length ? mine.map((p) => `<a class="mini box" href="#/chowk"><span><b>${esc(p.title)}</b><small>${esc(C.ago(p.at))}</small></span></a>`).join('') : '<p class="muted">No plates yet.</p>';
    const ok = st.points >= 10, ok2 = accepted >= 1;
    return `<div class="wrap pagehead"><div class="kicker">My Passport · fun profile, not a travel document</div><h1>@${esc(m.handle)}</h1>
      <div class="box passcard"><div class="pc-photo">${bowl(m.bowl || C.BOWL_PICKS[0], 96)}</div>
        <dl class="fields"><div><dt>Passport no.</dt><dd class="mono">${no}</dd></div><div><dt>Level</dt><dd>${esc(C.tier(st.points))}</dd></div>
          <div><dt>Points</dt><dd>${st.points}</dd></div><div><dt>Dish stamps</dt><dd>${got.length}</dd></div></dl>
        <p class="mrz" aria-hidden="true">CITIZEN&lt;XBK&lt;${esc(m.handle.toUpperCase())}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p></div>
      <h2 class="h2s">Dish stamps <span class="chip">${got.length}</span></h2>${stamps}
      <h2 class="h2s">Seat in the Parliament</h2>
      <div class="box rules"><p>A seat needs both of these:</p><ul class="reqs"><li class="${ok ? 'yes' : ''}">10 points (you have ${st.points})</li>
        <li class="${ok2 ? 'yes' : ''}">1 accepted, sourced contribution (you have ${accepted})</li></ul>
        <p class="small muted">The Parliament will decide which contributions are accepted. That part is not live yet.</p>
        <a class="btn alt" href="#/seats">How seats work</a></div>
      <h2 class="h2s">My plates</h2><div class="minis">${plates}</div>
      <p class="cta-row"><a class="btn" href="#/chowk/new">Post a plate</a><button class="btn alt" data-signout>Sign out of this device</button></p></div>`;
  }
  window.BHR.passport = (parts, params, bh) => ({ html: C.me() ? card(bh) : create(bh), nav: 'passport', title: 'My Passport' });
})();
