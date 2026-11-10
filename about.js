/* About and fine print (#/about). Plain words, short sections. */
(function () {
  'use strict';
  window.BHR = window.BHR || {};
  const sections = [
    ['What this is', ['The Bhukkad Republic is a fun, imaginary food country. You get a passport, you post what you cooked or ate, you read how your favourite dishes began, and you catch the latest in the Daily Tadka.']],
    ['Just for fun', ['It is a game and a food-history project. It is not a real country, state, government, political party or official body.',
      'Our passport is a profile card. It is not a travel document, an ID, or anything legal. The Parliament and the Great Bhukkad are part of the game and have no real powers.']],
    ['Respect', ['We respect every nation\'s sovereignty and its food heritage. When people disagree about where a dish comes from, we show both sides.']],
    ['How facts work', ['Every fact about a dish carries one stamp and a source. Cleared means documented. Folk tale means a traditional story. Under review means experts disagree. Unknown means nobody knows yet.',
      'Recipes cooked by citizens are unverified. A recipe with a real source is marked as sourced.']],
    ['Photos', ['Dish photos come from Wikipedia and Wikimedia Commons under open licences. The photographer and licence are shown under each photo. If a photo is wrong, use the "Wrong photo?" link.']],
    ['Your data', ['This is a preview. Your passport, plates and bills are saved only in your own browser. Nothing is sent anywhere yet.']],
    ['Cooking safety', ['Never leave a kettle or pan unattended. Many hostels do not allow cooking in rooms, so check your rules.']],
  ];
  function about(bh) {
    const body = sections.map(([h, ps]) => `<section class="box aboutbox"><h2>${h}</h2>${ps.map((p) => `<p>${p}</p>`).join('')}</section>`).join('');
    return `<div class="wrap pagehead"><div class="kicker">About and fine print</div><h1>What is the Bhukkad Republic?</h1><div class="aboutlist">${body}</div></div>${bh.facts()}`;
  }
  window.BHR.about = (parts, params, bh) => ({ html: about(bh), nav: '', title: 'About and fine print' });
})();
