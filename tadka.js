/* The Daily Tadka: the Republic's own newspaper. News and events (edit NEWS below), the top plates from the Chowk,
   the dish file of the day, and the fact checks underneath. */
(function () {
  'use strict';
  window.BHR = window.BHR || {};
  // Republic news. Newest first. Only write things that really happened on the site.
  const NEWS = [
    ['2026-11-10', 'Republic', 'The Chowk now takes "I ate it" posts', 'Ate something great at a stall, a dhaba or a friend\'s house? Post it, and say where.'],
    ['2026-11-10', 'Parliament', 'Ten cabinet seats wait for ministers', 'The Great Bhukkad will choose 10 ministers from the 50 MPs, from Udhaar Management to Spice Control.'],
    ['2026-11-09', 'Hostel Pradesh', 'Hostel Pradesh opens its gates', 'Fourteen hostel classics, from Kettle Maggi to Roti Pizza. Pure fun, and safety first.'],
    ['2026-11-09', 'Dish files', 'Dish files get photos', 'Openly licensed photos with credits now appear on many dish files. Spot a wrong one? Tap "Wrong photo?".'],
  ];
  window.BHR.tadkaTop = function (bh) {
    const { esc, bowl, dishes } = bh, C = window.BHC;
    const top = (C ? C.allPosts() : []).filter((p) => p.type !== 'help').sort((a, b) => (b.yums || 0) - (a.yums || 0)).slice(0, 3);
    const day = Math.floor(Date.now() / 864e5), dish = dishes.filter((d) => !d.lite && !d.lore)[day % dishes.filter((d) => !d.lite && !d.lore).length];
    const news = NEWS.map(([date, tag, title, body]) => `<div class="story"><div class="tag">${esc(tag)} · ${esc(date)}</div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('');
    const plates = top.map((p) => `<a class="mini box" href="#/chowk"><span class="av">${bowl(p.bowl || 'dhokla', 40)}</span><span><b>${esc(p.title)}</b><small>@${esc(p.handle)} · ${p.yums || 0} yum${p.sample ? ' · sample' : ''}</small></span></a>`).join('');
    return `<h2 class="tk-h">Republic news</h2><div class="news">${news}</div>
      <h2 class="tk-h">Top plates</h2>${plates ? `<div class="minis">${plates}</div>` : '<p>No plates yet.</p>'}
      ${dish ? `<h2 class="tk-h">Dish file of the day</h2><a class="mini box" href="#/dish/${esc(dish.slug)}"><span class="av">${bowl(dish.id, 40)}</span><span><b>${esc(dish.name)}</b><small>${esc(dish.summary.slice(0, 90))}…</small></span></a>` : ''}
      <h2 class="tk-h">Fact checks</h2>`;
  };
})();
