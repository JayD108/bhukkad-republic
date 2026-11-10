/* The 50 seats of the fun Parliament, and its 10 cabinet seats. Front end only; every rule here is a DRAFT. */
(function () {
  'use strict';
  const C = window.BHC;
  window.BHR = window.BHR || {};
  const ROWS = [[88, 10], [122, 15], [158, 25]]; // inner row = the 10 cabinet seats, then 15 + 25 more: 50 in all
  const CABINET = [
    ['Udhaar Management', 'Keeps track of who owes whom twenty rupees. Motto: "kal dunga".'],
    ['Queue Affairs', 'Fair play in every mess queue. No cutting, no "bas ek minute".'],
    ['Maggi and Midnight Snacks', 'Guards the national dish and every 2 a.m. experiment.'],
    ['Chai and Breaks', 'Makes sure no study session or match starts without chai.'],
    ['Leftover Innovation', "Turns yesterday's roti into today's pizza."],
    ['Spice Control', 'Decides how tikha is too tikha, and warns the brave.'],
    ['Proof and Authenticity', 'Checks sources and stamps. Pehle sabut, phir swaad.'],
    ['Plating and Photos', 'Looks after photos, credits and the plating that earns yums.'],
    ['Kitchen Safety', 'Kettles, pans and gas: nothing is ever left unattended.'],
    ['Traveller Ingredients', 'Tells the story of every ingredient and how far it travelled.'],
  ];

  function spots() {
    const out = [];
    ROWS.forEach(([r, n], row) => {
      for (let k = 0; k < n; k++) {
        const a = Math.PI - (k / (n - 1)) * Math.PI;
        out.push({ x: 200 + r * Math.cos(a), y: 214 - r * Math.sin(a), a, row });
      }
    });
    return out;
  }

  function view(bh) {
    const { esc, seal } = bh, st = C.stats(bh.billsLoad()), m = C.me(), head = bh.COMMANDER;
    const accepted = bh.billsLoad().filter((b) => b.status === 'Accepted').length;
    const eligible = !!m && st.points >= 10 && accepted >= 1;
    const all = spots();
    const first = all.filter((s) => s.row > 0).sort((p, q) => Math.abs(p.a - Math.PI / 2) - Math.abs(q.a - Math.PI / 2) || p.x - q.x)[0];
    const circles = all.map((s) => {
      const cls = s.row === 0 ? 'seat cab' : eligible && s === first ? 'seat held' : 'seat';
      return `<circle class="${cls}" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="9"><title>${s.row === 0 ? 'Cabinet seat' : 'MP seat'}</title></circle>`;
    }).join('');
    const board = eligible
      ? `<div class="bill"><div><b>@${esc(m.handle)}</b><br><span class="small">${st.points} points</span></div><span class="chip mint">MP</span></div>`
      : '<div class="box" style="padding:16px">No MP yet. A seat needs 10 points and one accepted, sourced contribution.</div>';
    const cabinet = CABINET.map(([name, duty]) => `<div class="box cabcard"><h3>Minister of ${esc(name)}</h3><p>${esc(duty)}</p><span class="chip">Vacant</span></div>`).join('');
    return `<div class="wrap pagehead"><div class="kicker">Parliament of the Bhukkad Republic · just for fun</div><h1>The 50 seats</h1>${bh.parlTabs('seats')}
      <p class="lede">A fun, imaginary Parliament with no real powers. Seats go to citizens who cook, post and help, and whose sourced corrections get accepted.</p>
      <div class="box commander"><span class="seal-wrap">${seal(86)}</span><div><div class="kicker">${esc(head.subtitle)}</div><h2>${esc(head.title)}</h2>
        <p style="margin:6px 0 0">${esc(head.name)} of the Bhukkad Republic. This is the one seat nobody can win.</p></div></div>
      <div class="box hemi-box"><svg class="hemi" viewBox="0 0 400 236" role="img" aria-label="The Parliament: 10 cabinet seats and 40 MP seats">${circles}
        <circle class="seat cmd" cx="200" cy="196" r="22"><title>${esc(head.title)}</title></circle><text x="200" y="204" text-anchor="middle" font-size="22">★</text></svg>
        <p class="small muted" style="text-align:center;margin:6px 0 0">Inner row: the 10 cabinet seats. ${eligible ? 1 : 0} of 40 MP seats filled.</p></div>
      <h2 class="h2s">The cabinet <span class="chip">Draft</span></h2>
      <p class="muted">10 of the 50 MPs become ministers, chosen by ${esc(head.title)}. Each looks after one very serious part of life in the Republic.</p><div class="cabgrid">${cabinet}</div>
      <div class="two-col"><div class="box rules"><h3>How seats work <span class="chip">Draft</span></h3><ol>
        <li>There are 50 seats, no more. 10 of them are cabinet seats.</li><li>Seats go to citizens who are active and have an accepted, sourced contribution.</li>
        <li>How long activity counts, and how often seats are counted again, is still to be decided.</li></ol>
        <p class="small muted">${esc(head.title)} will keep planning this as the Republic grows.</p></div>
        <div class="box rules"><h3>How you earn points</h3><ul><li>Post a plate: +10 (up to 3 a day)</li><li>Comment on someone else's post: +2 (up to 5 a day)</li><li>Someone yums your post: +1</li><li>Introduce a bill: +5 (up to 2 a day)</li></ul>
        <p class="small muted">Comments on your own posts don't count. Names that look official are reserved.</p>
        <p class="small muted">Your points now: <b>${st.points}</b> (${esc(C.tier(st.points))}). You need 10 points and 1 accepted, sourced contribution (you have ${accepted}). Draft numbers.</p></div></div>
      <h2 class="h2s">The benches</h2>${board}
      <div class="basic"><b>Preview:</b> only people on this device are counted until accounts exist.</div>
      <p class="cta-row"><a class="btn" href="#/chowk/new">Post a plate, earn a seat</a><a class="btn alt" href="#/chowk">Open the Chowk</a></p></div>`;
  }
  window.BHR.seats = (parts, params, bh) => ({ html: view(bh), nav: 'parliament', title: 'The 50 seats · Parliament' });
})();
