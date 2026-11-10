/* "What citizens cooked": the Chowk plates for one dish, shown on its dish file. */
(function () {
  'use strict';
  const C = window.BHC;
  window.BHR = window.BHR || {};

  window.BHR.plates = function (d, bh) {
    const { esc } = bh;
    const list = C.allPosts().filter((p) => p.dish === d.slug).sort((a, b) => b.at - a.at);
    const items = list.slice(0, 3).map((p) =>
      `<a class="mini box" href="#/chowk?dish=${esc(d.slug)}"><span class="av">${bh.bowl(p.bowl || d.id, 40)}</span>` +
      `<span><b>${esc(p.title)}</b><small>@${esc(p.handle)} · ${esc(C.PTYPES[p.type])}${p.sample ? ' · sample' : ''}</small></span></a>`).join('');
    const note = list.length
      ? `${list.length} ${list.length === 1 ? 'plate' : 'plates'} from citizens. They are unverified.`
      : 'No plates yet. Be the first citizen to post one.';
    const all = list.length ? `<a class="btn alt" href="#/chowk?dish=${esc(d.slug)}">See all plates</a>` : '';
    return `<section class="pg reveal" id="p-plates"><div class="pg-title"><h2>What citizens cooked</h2><span class="kicker">Chowk</span></div>` +
      `<p style="margin-top:0">${note}</p>${items ? `<div class="minis">${items}</div>` : ''}` +
      `<p class="cta-row"><a class="btn" href="#/chowk/new?dish=${esc(d.slug)}">Post your plate</a>${all}</p></section>`;
  };
})();
