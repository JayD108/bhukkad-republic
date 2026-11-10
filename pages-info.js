/* The Fun hub (#/fun): games and light reads. */
(function () {
  'use strict';
  window.BHR = window.BHR || {};
  const cards = [
    ['#/quiz', 'Origin quiz', 'Is it home-grown, or did it travel here? Or: does it go into the dish?'],
    ['#/myths', 'Daily Tadka', 'Republic news, top plates, events and fact checks.'],
    ['#/state/hostel', 'Hostel Pradesh', 'Maggi, kettles and midnight cooking. Pure fun.'],
    ['#/seats', 'The 50 seats', 'How the fun Parliament works.'],
  ];
  function fun(bh) {
    const items = cards.map(([href, title, text]) => `<a class="box hubcard" href="${href}"><h3>${title}</h3><p>${text}</p></a>`).join('');
    return `<div class="wrap pagehead"><div class="kicker">Fun</div><h1>Play around</h1>
      <p class="lede">Games and light reads from the Bhukkad Republic.</p><div class="hub">${items}</div></div>${bh.beltSection()}`;
  }
  window.BHR.fun = (parts, params, bh) => ({ html: fun(bh), nav: 'fun', title: 'Fun' });
})();
