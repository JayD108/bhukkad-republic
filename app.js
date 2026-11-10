/* Thali Passport Office: the whole front end in one file (no framework, no build step).
   Data comes from data.js (made by build-data.mjs from the real content files). */
(function () {
  'use strict';
  const D = window.DATA;
  const dishes = D.dishes, ings = D.ingredients, states = D.states, myths = D.myths, places = D.places;
  const ingById = new Map(ings.map((i) => [i.id, i]));
  const dishById = new Map(dishes.map((d) => [d.id, d]));
  const stateById = new Map(states.map((s) => [s.id, s]));
  const srcById = new Map(D.sources.map((s) => [s.id, s]));
  const app = document.getElementById('app');
  const dlg = document.getElementById('file');
  document.getElementById('built').textContent = D.built;

  /* ---------- tiny helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const CAT = { snack: 'Snack', sweet: 'Sweet', main: 'Main course', bread: 'Bread', rice: 'Rice dish', drink: 'Drink', breakfast: 'Breakfast', festival: 'Festival food', side: 'Side' };
  const LABEL = { DOCUMENTED: 'Cleared', TRADITIONAL: 'Folk tale', DISPUTED: 'Under review', UNKNOWN: 'Unknown' };
  const MEANING = { DOCUMENTED: 'Cleared = documented: backed by a written source', TRADITIONAL: 'Folk tale = traditional: a story people tell, not proven', DISPUTED: 'Under review = disputed: experts disagree', UNKNOWN: 'Unknown: nobody knows yet' };
  const stateNames = (d) => d.state_ids.map((s) => (stateById.get(s) || {}).name || s).join(' · ');
  const fy = (y) => (y < 0 ? Math.abs(y) + ' BCE' : y < 1000 ? y + ' CE' : String(y));
  const FALLBACK = [['#d9a441', '#c58a2c'], ['#c98a3c', '#e2b360'], ['#b8432a', '#cf5f34'], ['#6f8b3a', '#93a94e'], ['#e2c27e', '#efd8a2'], ['#a8662e', '#c8873f']];

  // The seal of the Bhukkad Republic: a ring of text around a bowl.
  let sealN = 0;
  function seal(size, cls) {
    const id = 'seal' + (++sealN);
    return `<svg class="seal ${cls || ''}" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Seal of the Bhukkad Republic">
      <defs><path id="${id}" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/></defs>
      <circle cx="100" cy="100" r="96" fill="#ff3d81" stroke="#1c1233" stroke-width="6"/><circle cx="100" cy="100" r="58" fill="#fff7e3" stroke="#1c1233" stroke-width="5"/>
      <text font-family="Bungee, Impact, sans-serif" font-size="14" fill="#fff" textLength="440" lengthAdjust="spacing"><textPath href="#${id}">BHUKKAD REPUBLIC ★ KHAANE KE LIYE JEENA HAI ★ </textPath></text>
      <ellipse cx="100" cy="118" rx="34" ry="30" fill="#aab2a8" stroke="#1c1233" stroke-width="3"/><ellipse cx="100" cy="115" rx="29" ry="25" fill="#f4f6f2"/><ellipse cx="100" cy="115" rx="22" ry="18" fill="#d9a441"/>
      <path d="M86 84c-6-8 6-12 0-20M100 82c-6-8 6-12 0-20M114 84c-6-8 6-12 0-20" fill="none" stroke="#1c1233" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  }
  function bowl(id, size) {
    const k = D.bowls[id], f = FALLBACK[hash(id) % FALLBACK.length];
    const c = k ? k[0] : f[0], c2 = k ? k[1] : f[1], dots = k ? k[2] : hash(id) % 3 === 0;
    return `<span class="bowl${dots ? ' dots' : ''}" style="--c:${c};--c2:${c2}${size ? ';--s:' + size + 'px' : ''}" aria-hidden="true"></span>`;
  }
  function stamp(label, sub, extra) {
    return `<span class="stamp st-${label} ${extra || ''}" title="${esc(MEANING[label] || '')}"><b>${esc(LABEL[label] || label)}</b>${sub ? `<i>${esc(sub)}</i>` : ''}</span>`;
  }
  function stampText(cls, text, sub, extra) {
    return `<span class="stamp ${cls} ${extra || ''}"><b>${esc(text)}</b>${sub ? `<i>${esc(sub)}</i>` : ''}</span>`;
  }
  // Machine-readable line: '<' filler characters, so it must be escaped before going into HTML.
  const mrz = (s, n) => esc((String(s).toUpperCase().replace(/[^A-Z0-9<]+/g, '<') + '<'.repeat(n)).slice(0, n));

  /* ---------- footnotes (sources numbered in the order they appear) ---------- */
  class Notes {
    constructor() { this.order = []; this.loc = {}; }
    n(c) { let i = this.order.indexOf(c.source_id); if (i < 0) { this.order.push(c.source_id); i = this.order.length - 1; } if (c.locator) (this.loc[c.source_id] = this.loc[c.source_id] || []).push(c.locator); return i + 1; }
    refs(cs) { const seen = new Set(); return cs.map((c) => { const n = this.n(c); if (seen.has(n)) return ''; seen.add(n); return `<a class="fn" href="#" data-fn="${n}" aria-label="Source ${n}">${n}</a>`; }).join(''); }
    list() {
      if (!this.order.length) return '';
      return '<ol class="sources">' + this.order.map((id, k) => {
        const s = srcById.get(id), loc = this.loc[id] ? ', ' + esc(this.loc[id].join('; ')) : '';
        const t = s ? (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.citation)}</a>` : esc(s.citation)) : esc(id);
        return `<li id="src-${k + 1}">${t}${loc} <small>(${s && s.reliability === 'primary' ? 'primary' : 'secondary'})</small></li>`;
      }).join('') + '</ol>';
    }
  }

  /* ---------- the rule behind "date of birth" ----------
     A dish can't be older than the arrival of its newest DEFINING ingredient.
     Native ingredients never set a limit. Undated arrivals are left out and said so. */
  function computeAge(d) {
    let floor = null, likely = null, optional = null; const undated = [];
    d.ingredients.forEach((r) => {
      const i = ingById.get(r.ingredient_id); if (!i) return;
      const y = i.native_to_india ? null : i.arrival.year_from;
      if (r.role === 'optional') { if (y !== null && (!optional || y > optional.y)) optional = { y, i }; return; }
      if (y === null) { if (!i.native_to_india) undated.push(i); return; }
      if (!floor || y > floor.y) floor = { y, i };
      const c = i.became_common && i.became_common.year_from;
      if (c != null && (!likely || c > likely.y)) likely = { y: c, i };
    });
    if (optional && floor && optional.y <= floor.y) optional = null;
    if (optional && !floor && optional.y < 500) optional = null;
    return { floor, likely, optional, undated, ancient: !floor || floor.y < 500 };
  }
  function passportShare(d) {
    const def = d.ingredients.filter((r) => r.role === 'defining').map((r) => ingById.get(r.ingredient_id)).filter(Boolean);
    return { total: def.length, abroad: def.filter((i) => !i.native_to_india).length };
  }

  /* ---------- reusable pieces ---------- */
  function flaps(text, base) {
    return [...String(text).toUpperCase()].map((ch, i) => `<span class="flap" style="--fd:${((base || 0) + i * 0.035).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  }
  function departures(list) {
    return `<div class="board" role="table" aria-label="States">
      <div class="board-head" role="row"><span>Gate</span><span>Destination</span><span>Dishes</span><span>Status</span></div>
      ${list.map((s, k) => {
        const n = dishes.filter((d) => d.state_ids.includes(s.id)).length;
        return `<a class="row" role="row" href="#/state/${esc(s.slug)}"><span class="code">${flaps(s.code, k * 0.07)}</span><span>${flaps(s.name, k * 0.07 + 0.1)}</span><span>${flaps(String(n).padStart(2, '0'), k * 0.07 + 0.3)}</span><span class="ok${s.status ? ' warn' : ''}">${esc(s.status || (n > 3 ? 'BOARDING' : 'ON TIME'))}</span></a>`;
      }).join('')}
    </div>`;
  }
  function pass(d, hide) {
    const share = passportShare(d);
    return `<a class="pass"${hide ? ' hidden' : ''} href="#/dish/${esc(d.slug)}"><span class="l">${bowl(d.id, 64)}</span>
      <span class="m"><h3>${esc(d.name)}</h3>${d.local_names[0] ? `<span class="deva muted" lang="${esc(d.local_names[0].lang)}">${esc(d.local_names[0].text)}</span>` : ''}
      <div class="route">${esc(stateNames(d))} → your plate · ${esc(CAT[d.category] || d.category)}${share.total ? ` · ${share.abroad}/${share.total} travellers` : ''}${d.lite ? ' · basic entry' : d.lore ? ' · hostel lore' : ''}</div></span><span class="r" aria-hidden="true"></span></a>`;
  }
  // Long lists show the first 36 and reveal the rest on tap. Keeps big lists (1000+ dishes) quick.
  const PAGE = 36;
  function passList(list) {
    return `<div class="passes">${list.map((d, i) => pass(d, i >= PAGE)).join('')}</div>` +
      (list.length > PAGE ? `<p style="text-align:center;margin-top:18px"><button class="btn alt" data-more>Show all ${list.length}</button></p>` : '');
  }
  function toast(msg) {
    let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  }
  function storyHtml(m, lead, full, notes) {
    return `<${full ? 'div' : 'a href="#/myths"'} class="story has-stamp reveal ${lead ? 'lead' : ''}">
      <div class="tag">Fact check</div><h3>${esc(m.question)}</h3>
      <p>${full ? esc(m.answer) + (notes ? notes.refs(m.citations) : '') : esc(m.answer.length > 150 ? m.answer.slice(0, 147) + '…' : m.answer)}</p>
      <span class="reveal-stamp">${stampText('st-' + m.label, m.verdict, LABEL[m.label])}</span></${full ? 'div' : 'a'}>`;
  }

  /* ---------- HOME ---------- */
  let beltDish = null;
  function home() {
    const featured = ['litti-chokha', 'rasagola', 'dhokla', 'vada-pav', 'idli', 'mysore-pak', 'kashmiri-dum-aloo'].map((id) => dishById.get(id)).filter(Boolean);
    const ring = featured.map((d, i) => {
      const a = (i / featured.length) * Math.PI * 2 - Math.PI / 2;
      return `<a href="#/dish/${esc(d.slug)}" style="left:${(50 + 37 * Math.cos(a)).toFixed(2)}%;top:${(50 + 37 * Math.sin(a)).toFixed(2)}%;margin:-11% 0 0 -11%" aria-label="${esc(d.name)}">${bowl(d.id)}<span class="nm">${esc(d.name)}</span></a>`;
    }).join('');
    const arrivals = ings.filter((i) => !i.native_to_india && i.arrival.era_label).map((i) => `<span>${esc(i.name.split(' (')[0].toUpperCase())} <em>✈</em> ${esc(i.arrival.era_label.toUpperCase())}</span>`);
    const tick = arrivals.concat(arrivals).join('');
    beltDish = beltDish || pick(dishes.filter((d) => d.ingredients.length >= 4), 1)[0];
    const usedStates = states.filter((s) => dishes.some((d) => d.state_ids.includes(s.id)));
    let slots = 0, abroad = 0; dishes.forEach((d) => { const p = passportShare(d); slots += p.total; abroad += p.abroad; });
    const topMyths = myths.slice(0, 5);
    const full = dishes.filter((d) => !d.lite && !d.lore), liteN = dishes.filter((d) => d.lite).length, loreN = dishes.filter((d) => d.lore).length;
    return `
    <div class="wrap hero">
      <div>
        <div class="republic-ribbon"><span aria-hidden="true">★</span> Welcome to the Bhukkad Republic <span aria-hidden="true">★</span></div>
        <div class="kicker" style="margin-top:12px">A fun food-history project</div>
        <h1>Get your <span class="hl">passport.</span><br><span class="hl2">Eat. Post. Repeat.</span></h1>
        <p class="lede">The Bhukkad Republic is a fun food country. Post what you cooked or ate, read how your favourite dishes began, and catch the latest in the Daily Tadka.</p>
        <form class="searchbar" id="hs" role="search"><label class="sr" for="hq" style="position:absolute;left:-9999px">Search dishes</label>
          <input id="hq" name="q" placeholder="Find a dish: dhokla, ढोकला, rasgulla…" autocomplete="off" /><button type="submit">GO</button></form>
        <p class="fun-note"><b>Just for fun:</b> an imaginary country, not a real one. <a href="#/about">Fine print</a></p>
        <div class="cta-row"><a class="btn" href="#/passport">Get your passport</a><a class="btn alt" href="#/chowk/new">Post what you cooked</a><a class="btn alt" href="#/dishes">Read a dish file</a></div>
      </div>
      <div class="thali-wrap"><div class="thali"><div class="ring">${ring}</div>
        <div class="thali-core"><span class="stamp"><b>Open<br>Kitchen</b><i>No chai bribes</i></span></div></div></div>
    </div>
    <div class="ticker-clip" aria-hidden="true"><div class="ticker"><div class="ticker-track">${tick}</div></div></div>

    <section class="wrap sec">
      <div class="kicker">Three doors</div><h2>What do you feel like?</h2>
      <div class="doors">
        <a class="box door" href="#/dishes"><small>Read</small><b>Open a dish file</b><span>How a dish began, and where its ingredients came from.</span></a>
        <a class="box door" href="#/chowk"><small>Cook</small><b>Post your plate</b><span>Share what you cooked or ate, ask for help, swap hacks.</span></a>
        <a class="box door" href="#/parliament"><small>Govern</small><b>Fix the facts</b><span>Spot a mistake? Bring a source to the fun Parliament.</span></a>
      </div>
      <p class="mono" style="margin:12px 0 0;font-size:13px">${dishes.length} dish files · ${ings.length} ingredient stories · ${D.sources.length} sources</p>
    </section>

    ${window.BHR && window.BHR.teaser ? window.BHR.teaser(window.BH) : ''}

    <section class="wrap sec">
      <div class="kicker">Fun</div><h2>Play around</h2>
      <div class="doors">
        <a class="box door" href="#/quiz"><small>Quiz</small><b>Origin quiz</b><span>Home-grown, or a traveller?</span></a>
        <a class="box door" href="#/state/hostel"><small>New state</small><b>Hostel Pradesh</b><span>Maggi, kettles and midnight cooking.</span></a>
        <a class="box door" href="#/myths"><small>Daily Tadka</small><b>Republic news</b><span>News, top plates, events and fact checks.</span></a>
      </div>
      <p class="cta-row"><a class="btn alt" href="#/fun">More fun</a><a class="btn alt" href="#/about">About the Republic</a></p>
    </section>`;
  }

  function factsSection() {
    return `    <section class="wrap sec">
      <div class="kicker">About the Republic</div><h2>The Bhukkad Republic, at a glance</h2>
      <div class="republic-facts">
        <div class="box reveal"><small>Motto</small><b>Jeene ke liye nahi, khaane ke liye jeena hai.</b><span>We don't eat to live. We live to eat.</span></div>
        <div class="box reveal"><small>Capital</small><b>The Hostel Pradesh</b><span>Where the mess is open for 45 minutes and closes before you reach the front.</span></div>
        <div class="box reveal"><small>Language</small><b>Hinglish</b><span>With extra masala.</span></div>
        <div class="box reveal"><small>Constitution</small><b>Ban raha hai abhi</b><span>Being drafted right now. The committee is still arguing about the chai break.</span></div>
        <div class="box reveal"><small>Dishes</small><b>${dishes.length} dish files and counting</b><span>Each with its history, styles and ingredient journeys.</span></div>
        <a class="box reveal" href="#/parliament"><small>Government</small><b>A fun Parliament that listens</b><span>Got a correction? Open the suggestion box →</span></a>
        <a class="box reveal" href="#/state/hostel"><small>National dish</small><b>Maggi</b><span>Chosen by unanimous 2 a.m. vote. Kettle optional.</span></a>
        <div class="box reveal"><small>National sport</small><b>Queue-cutting at the mess</b><span>Played daily, 7:30 to 7:45. No referee.</span></div>
        <div class="box reveal"><small>Currency</small><b>Udhaar</b><span>Everyone owes everyone twenty rupees. "Kal dunga."</span></div>
        <div class="box reveal"><small>Public holiday</small><b>The day the mess serves paneer</b><span>Declared on the spot, every single time.</span></div>
        <div class="box reveal"><small>Emergency helpline</small><b>Mummy, 24 × 7</b><span>Press 1 for "khana kha liya?"</span></div>
        <div class="box reveal"><small>Our rule</small><b>Pehle sabut, phir swaad.</b><span>Proof first, taste later. Every claim gets exactly one stamp and at least one source.</span></div>
      </div>
      <p class="mono" style="margin:14px 0 0;font-size:13px">All made up, except the sources.</p>
    </section>`;
  }
  function beltSection() {
    beltDish = beltDish || pick(dishes.filter((d) => d.ingredients.length >= 4), 1)[0];
    return `    <section class="wrap sec" id="claim">
      <div class="claim-head"><div>
        <div class="claim-sign"><span>Baggage claim</span><b id="belt-no">BELT 3</b></div>
        <h2>Whose bags are these?</h2>
        <p class="lede" style="margin-bottom:0">These suitcases belong to <b id="belt-name">${esc(beltDish.name)}</b>. Green: grown in India. Orange: travelled here. Pink: arrived after 1498. Tap a bag to read its story.</p>
      </div><button class="btn blue" data-belt>Next flight ✈</button></div>
      <div class="belt" id="belt">${belt(beltDish)}</div>
    </section>`;
  }

  function belt(d) {
    const items = d.ingredients.map((r) => ingById.get(r.ingredient_id)).filter(Boolean);
    let half = items.slice(); while (half.length < 9) half = half.concat(items);
    const one = (i, k) => {
      const late = !i.native_to_india && i.arrival.year_from != null && i.arrival.year_from >= 1498;
      const cls = i.native_to_india ? 'native' : '';
      const col = i.native_to_india ? '' : `style="--cc:${late ? 'var(--pink)' : 'var(--orange)'}"`;
      return `<button class="case ${cls}" ${col} data-ing="${esc(i.id)}" aria-label="Inspect ${esc(i.name)}"><span class="body"></span>
        <span class="tag">${esc(i.name.split(' (')[0])}<small>${i.native_to_india ? 'home-grown' : esc(i.arrival.era_label)}</small></span></button>`;
    };
    const row = half.map(one).join('');
    return `<div class="belt-track">${row}${row}</div><div class="belt-hint">▲ TAP A BAG TO INSPECT ▲</div>`;
  }

  /* ---------- DISH = A PASSPORT ---------- */
  function dishView(d) {
    const n = new Notes(), age = computeAge(d), share = passportShare(d);
    const lite = !!d.lite, lore = !!d.lore;
    const ph = (D.photos || {})[d.id];
    const report = (section) => `<a class="report" href="#/parliament?about=dish:${esc(d.slug)}&amp;section=${section}">⚑ report</a>`;
    const credit = ph ? `<div class="credit">Photo: ${esc(ph.author)} · <a href="${esc(ph.licenseUrl || ph.page)}" target="_blank" rel="noopener">${esc(ph.license)}</a> · <a href="${esc(ph.page)}" target="_blank" rel="noopener">Wikimedia</a> · <a href="#/parliament?about=dish:${esc(d.slug)}&amp;section=photo&amp;topic=photo">Wrong photo?</a></div>` : '';
    const listed = (d.listed_in || []).map((id) => srcById.get(id)).filter(Boolean);
    const listedHtml = lore ? '<div class="basic">Hostel lore: passed on by word of mouth. No research and no sources, just experience. Not history, and not a recommendation.</div>' : lite ? `<div class="basic">${'Basic entry: the full story is still being researched.'}${listed.length ? ' Listed in ' + listed.map((x) => esc(x.citation) + n.refs([{ source_id: x.id, locator: '' }])).join(', ') + '.' : ''}</div>` : '';
    const num = 'TH' + String(hash(d.id)).padStart(7, '0').slice(0, 7);
    const diet = []; if (d.diet.contains_egg) diet.push('Contains egg'); else if (d.diet.pure_veg) diet.push('Pure veg');
    if (d.diet.vegan) diet.push('Vegan'); if (d.diet.jain) diet.push('Jain-friendly'); if (d.diet.sattvik_vrat) diet.push('Sattvik'); if (d.gi && d.gi.has_tag) diet.push('GI ' + d.gi.year);
    const visas = d.ingredients.map((r) => ({ r, i: ingById.get(r.ingredient_id) })).filter((x) => x.i)
      .sort((a, b) => (a.i.native_to_india ? -1e9 : a.i.arrival.year_from == null ? 1e9 : a.i.arrival.year_from) - (b.i.native_to_india ? -1e9 : b.i.arrival.year_from == null ? 1e9 : b.i.arrival.year_from));
    const visaHtml = visas.map(({ r, i }, k) => {
      const late = !i.native_to_india && i.arrival.year_from != null && i.arrival.year_from >= 1498;
      const where = i.native_to_india ? 'Born in India' : /not stated/i.test(i.native_region) ? 'Origin not recorded' : 'From ' + i.native_region;
      const st = i.native_to_india ? stampText('st-NATIVE', 'Home-grown', 'grown here') : stamp(i.arrival.label, i.arrival.era_label);
      return `<a class="visa reveal-stamp reveal ${late ? 'late' : ''}" style="--d:${(k * 0.08).toFixed(2)}s" href="#/ingredient/${esc(i.slug)}">
        <span class="chip role ${r.role === 'defining' ? 'mint' : ''}">${r.role}</span><h3>${esc(i.name.split(' (')[0])}</h3><div class="from">${esc(where)}</div>
        <div class="when">${i.native_to_india ? 'Ancient' : esc(i.arrival.era_label.length > 18 ? 'Undated' : i.arrival.era_label)}</div>${st}</a>`;
    }).join('');

    let dob;
    if (lore) {
      dob = `<div class="lab">Earliest possible date of birth</div><div class="year" style="font-size:clamp(34px,8vw,64px)">BORN AT 2 A.M.</div>
        <p>Nobody knows who made it first. Every hostel swears it was theirs.</p>`;
    } else if (lite) {
      dob = `<div class="lab">Earliest possible date of birth</div><div class="year" style="font-size:clamp(30px,7vw,52px)">NOT YET ESTABLISHED</div>
        <p>This is a basic entry. Its ingredients haven't been traced yet, so we can't say how old the dish can be without guessing.</p>`;
    } else if (age.ancient || !age.floor) {
      const names = d.ingredients.filter((r) => r.role === 'defining').map((r) => (ingById.get(r.ingredient_id) || { name: '' }).name.split(/[ (,]/)[0].toLowerCase()).filter(Boolean).slice(0, 3);
      const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0] || 'ingredients';
      dob = `<div class="lab">Earliest possible date of birth</div><div class="year" style="font-size:clamp(34px,8vw,64px)">AS OLD AS ITS ${esc(list.toUpperCase())}</div>
        <p>No main ingredient sets a limit, so the age has to come from written history.${age.optional ? ` With optional ${esc(age.optional.i.name.toLowerCase())}, a version is no older than ${esc(age.optional.i.arrival.era_label)}.` : ''}</p>`;
    } else {
      const f = age.floor;
      dob = `<div class="lab">Earliest possible date of birth</div><div class="year">NOT BEFORE ${f.i.arrival.label === 'UNKNOWN' ? '' : 'c. '}${esc(fy(f.y))}</div>
        <p>Its newest main ingredient is <a href="#/ingredient/${esc(f.i.slug)}">${esc(f.i.name.split(' (')[0].toLowerCase())}</a>, which reached India ${esc(f.i.arrival.era_label)}.${f.i.arrival.label === 'DISPUTED' ? ' That date is itself disputed.' : ''}${age.likely && age.likely.y > f.y ? ` It probably wasn't common before ${esc(age.likely.i.became_common.era_label)}.` : ''}</p>`;
    }
    if (!lite && !lore && !(age.ancient || !age.floor)) dob += '<p class="note">This is the limit for the dish as it is served today. Some parts of it (like the dough or a sauce) may be much older.</p>';
    if (age.undated.length) dob += `<p class="note">Not counted, because the arrival isn't dated in our sources: ${age.undated.map((i) => esc(i.name.toLowerCase())).join(', ')}.</p>`;
    if (d.current_form_note) dob += `<p class="note">${esc(d.current_form_note)}</p>`;

    const claims = d.history.map((h) => `<div class="claim reveal reveal-stamp"><div class="when">${esc(h.era_label || '')}</div>${stamp(h.label)}<p>${esc(h.text)}${n.refs(h.citations)}</p>
      ${h.sides && h.sides.length ? `<div class="sides">${h.sides.map((s) => `<div class="side"><b>${esc(s.party)}</b><br>${esc(s.text)}${n.refs(s.citations)}</div>`).join('')}</div>` : ''}
      ${h.checked ? '' : '<div class="pen">page not checked yet, so read this as a lead</div>'}</div>`).join('');

    const pl = places.filter((p) => p.status !== 'closed' && (p.dish_ids.includes(d.id) || d.place_ids.includes(p.id)));
    const eat = pl.length ? pl.map((p) => `<div class="ticket"><div class="main"><h3>${esc(p.name)}</h3><div class="mono" style="font-size:12.5px">${esc(p.city)}${p.famous_since ? ' · ' + esc(p.famous_since) : ''} · ${esc(p.price_band)}</div><div class="pen">not verified yet: check it's open before you go</div></div><div class="stub">GATE<br>${esc(p.city.slice(0, 3).toUpperCase())}</div></div>`).join('')
      : '<p>No places listed yet. We only list places an editor can check, preferring old sweet shops, temple kitchens and street stalls.</p>';

    const rel = d.related_dish_ids.map((id) => dishById.get(id)).filter(Boolean);
    dishes.forEach((x) => { if (rel.length < 6 && x.id !== d.id && !rel.includes(x) && x.state_ids.some((s) => d.state_ids.includes(s))) rel.push(x); });
    const st0 = stateById.get(d.state_ids[0]);
    const idPage = `<section class="pg" id="p-id"><div class="pg-title"><h2>Identity</h2><span class="kicker">Page 1 ${report('identity')}</span></div>
          <div class="id-grid"><div class="photo-col"><div class="photo${ph ? ' has-img' : ''}">${bowl(d.id)}${ph ? `<img src="${esc(ph.src)}" alt="${esc(d.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>${credit}</div>
            <dl class="fields">
              <div class="full"><dt>Surname / Name</dt><dd class="big">${esc(d.name)}</dd></div>
              ${d.local_names.length ? `<div class="full"><dt>Native name</dt><dd class="deva">${d.local_names.map((l) => `<span lang="${esc(l.lang)}">${esc(l.text)}</span>`).join(' · ')}</dd></div>` : ''}
              <div><dt>Place of birth</dt><dd>${esc(stateNames(d))}</dd></div><div><dt>Type</dt><dd>${esc(CAT[d.category] || d.category)}</dd></div>
              <div><dt>File no.</dt><dd class="mono">${num}</dd></div><div><dt>Travelled ingredients</dt><dd>${share.total ? `${share.abroad} of ${share.total}` : 'n/a'}</dd></div>
              <div class="full"><dt>Dietary code</dt><dd class="badges">${diet.map((t) => `<span class="chip mint">${esc(t)}</span>`).join('')}</dd></div>
              ${d.festivals.length ? `<div class="full"><dt>Festivals</dt><dd>${esc(d.festivals.join(', '))}</dd></div>` : ''}
            </dl></div>
          <p class="lede" style="margin:18px 0 0;font-size:17px">${esc(d.summary)}</p>
          ${d.diet.nonveg_variants_note ? `<div class="pen">${esc(d.diet.nonveg_variants_note)}</div>` : ''}
          ${listedHtml}
          <p style="margin:14px 0 0"><button class="btn alt" data-share="${esc(d.slug)}">Share this dish file ↗</button></p>
          <div class="mrz" aria-hidden="true">${mrz('FILE<XBK<' + d.name, 44)}<br>${mrz(num + '<' + (st0 ? st0.code : 'XBK') + '<' + D.built.replace(/-/g, ''), 44)}</div></section>`;
    const pagehtml = `
      <div class="pill-bar" aria-label="Jump to a page"><a href="#" data-scroll="p-story">History</a><a href="#" data-scroll="p-cook">Recipes</a><a href="#" data-scroll="p-visas">Ingredients</a><a href="#" data-scroll="p-dob">Date of birth</a><a href="#" data-scroll="p-eat">Where to eat</a><a href="#" data-scroll="p-src">Endorsements</a></div>
      <div class="pages">
        <section class="pg reveal" id="p-story"><div class="pg-title"><h2>History, checked</h2><span class="kicker">Page 2 ${report('story')}</span></div>${lore ? '<p class="pen">No history to check here. This one lives in group chats and midnight whispers.</p>' : claims || (lite ? '<p class="pen">Sourced history hasn\'t been added yet. We only write what we can back with a source.</p>' : '<p>No statements on file yet.</p>')}</section>

        ${statementsPage('p-origin', 'Why it exists, who made it', 'Origin', (d.why_it_exists || []).concat(d.inventor || []), n)}
        ${recipesPage(d, n, report)}
        ${window.BHR && window.BHR.plates ? window.BHR.plates(d, window.BH) : ''}
        ${statementsPage('p-health', 'Body check', 'Health', d.health, n)}

        <section class="pg reveal" id="p-visas"><div class="pg-title"><h2>${lore ? 'Gadgets &amp; goods' : lite ? 'Declared goods' : 'Ingredient journeys'}</h2><span class="kicker">Page 4 ${report('ingredients')}</span></div>
          ${(lite || lore)
            ? `<p style="margin-top:0">${lore ? 'Whatever the hostel room has. Substitutions are always allowed, and always regretted.' : 'These are the ingredients as declared. Where each one came from hasn\'t been checked yet.'}</p><div class="badges">${d.device ? `<span class="chip pink">Gadget: ${esc(d.device)}</span>` : ''}${(d.ingredient_names || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`
            : `<p style="margin-top:0">${share.total ? `<b>${share.abroad} of ${share.total}</b> main ingredients travelled here.` : ''} Oldest first. Tap a card to read its journey.</p>
          <div class="visas">${visaHtml}</div><div class="legend">Pink-tinted = arrived after 1498, when Europeans reached India by sea.</div>`}</section>

        <section class="pg reveal" id="p-dob"><div class="pg-title"><h2>Date of birth</h2><span class="kicker">Page 5 ${report('dob')}</span></div>
          <div class="dob reveal-stamp reveal">${dob}</div></section>

        <section class="pg reveal" id="p-eat"><div class="pg-title"><h2>Where to eat it</h2><span class="kicker">Page 6 ${report('eat')}</span></div>${lore ? '<div class="ticket"><div class="main"><h3>Your room, after lights out</h3><div class="mono" style="font-size:12.5px">Hostel Pradesh · any floor · whenever the warden is not looking</div></div><div class="stub">ROOM<br>2 AM</div></div>' : eat}</section>

        ${rel.length ? `<section class="pg reveal"><div class="pg-title"><h2>Fellow passengers</h2><span class="kicker">Same flight</span></div><div class="passengers">${rel.slice(0, 7).map((x) => `<a href="#/dish/${esc(x.slug)}">${bowl(x.id, 80)}${esc(x.name)}</a>`).join('')}</div></section>` : ''}

        <section class="pg reveal" id="p-parl"><div class="pg-title"><h2>Spot a mistake?</h2><span class="kicker">Parliament</span></div>
          <p style="margin-top:0">Every page here can be wrong. If you know better, introduce a bill in the Parliament of the Bhukkad Republic. Bring a source.</p>
          <a class="btn" href="#/parliament?about=dish:${esc(d.slug)}">Open the suggestion box</a></section>

        <section class="pg reveal" id="p-src"><div class="pg-title"><h2>Endorsements</h2><span class="kicker">Sources</span></div>__SOURCES__</section>
      </div>`;
    const html = `
      <div class="wrap"><h1 class="sr-only">${esc(d.name)} · Dish file</h1><div class="book-wrap"><div class="book" id="stage">${idPage}
        <div class="cover" id="cover" role="button" tabindex="0" aria-label="Open the dish file">
          <div class="face front"><div class="cv"><div class="cv-rep">★ REPUBLIC OF BHUKKAD ★</div><h2>DISH<br>FILE</h2>${bowl(d.id)}<div class="cv-name">${esc(d.name.toUpperCase())}</div><div class="cv-fun">FUN PROJECT · NOT A TRAVEL DOCUMENT</div><div class="tap">TAP TO OPEN</div></div></div>
          <div class="face back"><div class="inside">${seal(84)}<small>THIS FILE IS ABOUT</small><b>${esc(d.name.toUpperCase())}</b><p>A fun dish file from the Bhukkad Republic, an imaginary food country. Not an official document. If found, please return to the nearest plate. Reward: one bite.</p></div></div>
        </div></div></div>
        ${pagehtml.replace('__SOURCES__', n.list() || '<p>No sources listed.</p>')}</div>`;
    return html;
  }

  /* ---------- ingredient = a visa file ---------- */
  function ingredientBody(i, n) {
    const ev = (title, e) => e ? `<div class="claim reveal reveal-stamp"><div class="when">${esc(title)} · ${esc(e.era_label)}</div>${stamp(e.label)}<p>${esc(e.text)}${n.refs(e.citations)}</p>${e.route ? `<div class="pen">route: ${esc(e.route)}</div>` : ''}</div>` : '';
    return ev('Origin', i.origin) + ev(i.native_to_india ? 'In India' : 'Reached India', i.arrival) + ev('Became common', i.became_common);
  }
  function ingredientView(i) {
    const n = new Notes(), uses = dishes.filter((d) => d.ingredients.some((r) => r.ingredient_id === i.id));
    const body = ingredientBody(i, n);
    return `<div class="wrap pagehead"><div class="kicker">Visa file</div><h1>${esc(i.name)}</h1>
      <p class="lede deva">${i.local_names.map((l) => esc(l.text)).join(' · ')}</p>
      <div class="badges">${i.native_to_india ? '<span class="chip mint">Home-grown</span>' : `<span class="chip pink">Traveller · ${esc(i.arrival.era_label)}</span><span class="chip">From ${esc(i.native_region)}</span>`}</div></div>
      <div class="wrap"><div class="pages"><section class="pg"><div class="pg-title"><h2>Journey</h2></div>${body}</section>
      <section class="pg"><div class="pg-title"><h2>Dishes that carry it</h2></div><div class="passes">${uses.map(pass).join('') || '<p>None yet.</p>'}</div></section>
      <section class="pg"><div class="pg-title"><h2>Endorsements</h2></div>${n.list() || '<p>No sources listed.</p>'}</section></div></div>`;
  }
  function openFile(id) {
    const i = ingById.get(id); if (!i) return;
    const n = new Notes(); const body = ingredientBody(i, n);
    dlg.innerHTML = `<div class="dlg"><button class="x" data-close aria-label="Close">✕</button><div class="kicker">Traveller check</div>
      <h3 id="file-title">${esc(i.name)}</h3><div class="row2">${i.native_to_india ? '<span class="chip mint">Home-grown</span>' : `<span class="chip pink">Traveller · ${esc(i.arrival.era_label)}</span><span class="chip">From ${esc(i.native_region)}</span>`}</div>
      ${body.replace(/class="claim reveal reveal-stamp"/g, 'class="claim"').replace(/<a class="fn"[^>]*>\d+<\/a>/g, '')}
      <p><a class="btn" href="#/ingredient/${esc(i.slug)}" data-close>Open full file</a></p></div>`;
    dlg.showModal(); dlg.querySelectorAll('.stamp').forEach((s) => (s.style.opacity = '.92'));
  }

  /* ---------- states, myths, search ---------- */
  function statesView() {
    const used = states.filter((s) => dishes.some((d) => d.state_ids.includes(s.id)));
    return `<div class="wrap pagehead"><div class="kicker">Explore</div><h1>Explore the states</h1><p class="lede">Every state has its own food. Pick one, or <button class="linkbtn" data-random>surprise me with a dish file</button>.</p><div class="basic"><b>Good to know:</b> these are the real states of India, and the food here is Indian food. The Bhukkad Republic is only a fun country of Bhukkad people (food lovers). It is not an Indian state or a real place. Hostel Pradesh is the one state we made up for fun.</div>${departures(used)}</div>`;
  }
  function stateView(s) {
    const ds = dishes.filter((d) => d.state_ids.includes(s.id));
    return `<div class="wrap pagehead"><div class="kicker">Now boarding · Gate ${esc(s.code)}</div><h1>${esc(s.name)}</h1><p class="lede deva" style="margin-bottom:6px">${esc(s.local_name.text)}</p>
      <p class="lede">${esc(s.intro)}</p>${s.id === 'hostel' ? HOSTEL_SAFETY : ''}${passList(ds)}</div>`;
  }
  function mythsView() {
    const n = new Notes();
    const items = myths.map((m, i) => storyHtml(m, i === 0, true, n)).join('');
    return `<div class="wrap pagehead"><div class="paper"><div class="paper-head"><h1>The Daily Tadka</h1><div class="sub"><span>News of the Republic</span><span>Top plates · dish of the day</span><span>Fact checks, stamped</span></div></div>${window.BHR && window.BHR.tadkaTop ? window.BHR.tadkaTop(window.BH) : ''}
      <div class="news">${items}</div><h3 style="margin:26px 0 8px;font-size:22px">Sources</h3>${n.list()}</div></div>`;
  }

  const norm = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
  const skel = (s) => norm(s).replace(/[^a-z]/g, '').replace(/h/g, '').replace(/[aeiouyw]/g, '').replace(/(.)\1+/g, '$1');
  const docs = dishes.map((d) => {
    const names = [d.name].concat(d.local_names.map((l) => l.translit));
    const hay = norm(names.concat(d.local_names.map((l) => l.text), d.state_ids.map((s) => (stateById.get(s) || {}).name || s), d.ingredients.map((r) => (ingById.get(r.ingredient_id) || {}).name || '').concat(d.ingredient_names || []), [d.category], d.festivals).join(' '));
    return { d, hay, sk: names.join(' ').split(/\s+/).map(skel).filter((k) => k.length >= 2) };
  });
  function matches(x, q) {
    if (!q) return true;
    return q.split(' ').every((w) => { if (x.hay.includes(w)) return true; const k = skel(w); if (k.length >= 3) return x.sk.some((s) => s.includes(k)); return k.length === 2 && w.length >= 4 && x.sk.some((s) => s === k); });
  }
  function searchView(params) {
    const q = params.get('q') || '', cat = params.get('cat') || '', st = params.get('state') || '';
    const cats = Object.keys(CAT).filter((c) => dishes.some((d) => d.category === c));
    const res = docs.filter((x) => matches(x, norm(q)) && (!cat || x.d.category === cat) && (!st || x.d.state_ids.includes(st))).map((x) => x.d);
    return `<div class="wrap pagehead"><div class="kicker">Dish files</div><h1>Every dish file</h1><p class="lede">Pick a dish to read how it began. Each file shows where it comes from.</p>${st ? `<p><span class="dishtag">From ${esc((stateById.get(st) || { name: st }).name)} · <a href="#/dishes">show all</a></span></p>` : ''}
      <form class="searchbar" id="sf" role="search" style="margin-top:18px"><input id="sq" name="q" value="${esc(q)}" placeholder="Try rasgulla, ढोकला, litti, sweet…" autocomplete="off" /><button type="submit">GO</button></form>
      <div class="filters" role="group" aria-label="Kind of dish">${cats.map((c) => `<button class="fchip" data-cat="${c}" aria-pressed="${cat === c}">${esc(CAT[c])}</button>`).join('')}</div>
      <p class="count">${res.length} ${res.length === 1 ? 'dish file' : 'dish files'} found</p>
      ${res.length ? passList(res) : '<div class="box" style="padding:18px">No dish file matches. Try a simpler spelling.</div>'}</div>`;
  }

  /* ---------- recipe / health / origin pages (appear only when the data has them) ---------- */
  // A dish can have several ways to make it ("versions"). Each version has its own place, its own source and its own steps.
  // Data that only has a single `recipe` is shown as one version.
  function versionsOf(d) {
    if (d.versions && d.versions.length) return d.versions;
    if (d.recipe) return [Object.assign({ name: 'The recipe' }, d.recipe)];
    return [];
  }
  function recipesPage(d, n, report) {
    if (d.lore) return lorePage(d);
    const vs = versionsOf(d);
    const head = `<section class="pg reveal" id="p-cook"><div class="pg-title"><h2>Recipes</h2><span class="kicker">Page 3 ${report('recipe')}</span></div>`;
    if (!vs.length) {
      return head + `<p style="margin-top:0">No recipe is published for this dish yet. A recipe only goes up with a source, so we show nothing rather than guess. Do you know one, or a different way to make it?</p>
        <a class="btn" href="#/parliament?about=dish:${esc(d.slug)}&amp;section=recipe&amp;topic=recipe">Send a recipe to the Parliament</a></section>`;
    }
    const key = (t) => String(t).toLowerCase().trim();
    // "Only in this version": ingredients that none of the other versions list. Worked out from the data, not written by hand.
    const only = vs.map((v, i) => {
      if (vs.length < 2) return [];
      const others = new Set(vs.filter((_, j) => j !== i).flatMap((o) => (o.ingredients || []).map((x) => key(x.item))));
      return (v.ingredients || []).filter((x) => !others.has(key(x.item))).map((x) => x.item);
    });
    const tabs = vs.length > 1
      ? `<div class="ver-tabs" role="tablist" aria-label="Ways to make ${esc(d.name)}">${vs.map((v, i) => `<button type="button" role="tab" class="vtab" data-ver="${i}" aria-selected="${i === 0}">${esc(v.name)}</button>`).join('')}</div>`
      : '';
    const panels = vs.map((v, i) => {
      const facts = [v.servings && ['Serves', v.servings], v.prep_minutes != null && ['Prep', v.prep_minutes + ' min'], v.cook_minutes != null && ['Cook', v.cook_minutes + ' min']].filter(Boolean);
      const diffs = (v.differences || []).map((t) => `<li>${esc(t)}</li>`).join('') + (only[i].length ? `<li>Only in this version: ${only[i].map(esc).join(', ')}</li>` : '');
      const cites = v.citations && v.citations.length ? `<p class="small">Method from ${n.refs(v.citations)}</p>` : '<div class="warn">No source yet, so this version is not publishable.</div>';
      return `<div class="ver-panel" role="tabpanel" data-ver-panel="${i}"${i ? ' hidden' : ''}>
        <h3 class="ver-name">${esc(v.name)}</h3>
        ${v.where || v.who ? `<div class="badges">${v.where ? `<span class="chip blue">${esc(v.where)}</span>` : ''}${v.who ? `<span class="chip">${esc(v.who)}</span>` : ''}</div>` : ''}
        ${v.summary ? `<p>${esc(v.summary)}</p>` : ''}
        ${diffs ? `<div class="diffbox"><b>What makes this version different</b><ul>${diffs}</ul></div>` : ''}
        ${facts.length ? `<div class="rx-facts">${facts.map(([k, x]) => `<div><small>${k}</small><b>${esc(x)}</b></div>`).join('')}</div>` : ''}
        <ul class="rx-ing">${(v.ingredients || []).map((x) => `<li><label><input type="checkbox"> <span><b>${esc(x.amount || '')}</b> ${esc(x.item)}${x.note ? ` <small>· ${esc(x.note)}</small>` : ''}</span></label></li>`).join('')}</ul>
        <ol class="rx-steps">${(v.steps || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        ${v.tips && v.tips.length ? `<div class="pen">Tips: ${v.tips.map(esc).join(' · ')}</div>` : ''}
        ${cites}${v.checked ? '' : '<div class="pen">not tested or checked yet, so treat it as a starting point</div>'}</div>`;
    }).join('');
    return head + '<p class="small muted" style="margin-top:0">These recipes have sources. Plates cooked by citizens are further down and are unverified.</p>' + (vs.length > 1 ? `<p style="margin-top:0">${vs.length} ways to make ${esc(d.name)}. Pick one.</p>` : '') + tabs + panels + '</section>';
  }
  function statementsPage(id, title, kicker, list, n) {
    if (!list || !list.length) return '';
    return `<section class="pg reveal" id="${id}"><div class="pg-title"><h2>${esc(title)}</h2><span class="kicker">${esc(kicker)}</span></div>${list.map((h) =>
      `<div class="claim reveal reveal-stamp"><div class="when">${esc(h.era_label || '')}</div>${stamp(h.label)}<p>${esc(h.text)}${n.refs(h.citations)}</p>${h.checked ? '' : '<div class="pen">page not checked yet, so read this as a lead</div>'}</div>`).join('')}</section>`;
  }

  /* ---------- hostel lore page ---------- */
  const HOSTEL_SAFETY = '<div class="basic"><b>Kitchen safety, for real:</b> many hostels ban cooking in rooms, so check your rules. Never fill a kettle past the max line, unplug it before opening the lid, only cook food in things made for food, and wash the kettle afterwards. When in doubt, eat in the mess.</div>';
  function lorePage(d) {
    const meter = (n) => `<span class="meter" aria-label="${n} out of 5">${'▮'.repeat(n)}<i>${'▮'.repeat(5 - n)}</i></span>`;
    return `<section class="pg reveal" id="p-cook"><div class="pg-title"><h2>Recipes</h2><span class="kicker">Hostel lore</span></div>
      <div class="reveal-stamp reveal">${stampText('st-UNKNOWN', 'Hostel lore', 'unverified')}</div>
      <p style="margin:12px 0 4px"><b>Chaos level</b> ${meter(d.chaos || 1)}</p>
      <ol class="rx-steps">${(d.steps || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      ${/kettle/i.test(d.device || '') ? HOSTEL_SAFETY : ''}<div class="pen">Got a better method? Hostel lore improves with every roommate.</div></section>`;
  }

  /* ---------- the tests: two modes ---------- */
  // Citizenship test: ingredients, born here or immigrant? Only ingredients with a documented story are used.
  const quizPool = ings.filter((i) => i.origin.label !== 'UNKNOWN' && i.arrival.label !== 'UNKNOWN' && !/not stated/i.test(i.native_region));
  // Kitchen check: does this ingredient go into this dish? Decoys are deliberately silly (garlic in a sweet, chocolate in a curry).
  const SAVOURY_DECOYS = ['onion', 'garlic', 'curry leaves', 'asafoetida'];
  const SWEET_DECOYS = ['rose water', 'condensed milk', 'chocolate', 'vanilla essence'];
  const nameList = (d) => (d.ingredient_names || d.ingredients.map((r) => (ingById.get(r.ingredient_id) || { name: '' }).name.split(' (')[0])).map((x) => String(x).toLowerCase()).filter(Boolean);
  const VAGUE = ['spices', 'water', 'hot water', 'salt', 'masala', 'seasoning'];
  const real = (x) => !VAGUE.includes(x);
  function kitchenDeck() {
    const pool = dishes.filter((d) => d.category !== 'drink' && nameList(d).filter(real).length >= 3);
    return pick(pool, 10).map((d) => {
      const names = nameList(d), sweet = d.category === 'sweet';
      const decoys = (sweet ? SAVOURY_DECOYS : SWEET_DECOYS).filter((x) => !names.some((nm) => nm.includes(x.split(' ')[0])));
      const inDish = Math.random() < 0.5 || !decoys.length;
      return { d, names, inDish, item: inDish ? pick(names.filter(real), 1)[0] : pick(decoys, 1)[0] };
    });
  }
  const newQuiz = (mode) => ({ mode, deck: mode === 'kitchen' ? kitchenDeck() : pick(quizPool, Math.min(10, quizPool.length)), i: 0, score: 0, streak: 0, best: 0, picked: null });
  let quiz = null;
  const TITLES = {
    citizen: [[9, 'Head of Origins'], [7, 'Origin Inspector'], [5, 'Trainee Inspector'], [3, 'Lost Tourist'], [0, 'Still in the Queue']],
    kitchen: [[9, 'Head Cook of the Republic'], [7, 'Dhaba Ustaad'], [5, 'Home Cook'], [3, 'Maggi-Only Chef'], [0, 'Kettle Beginner']],
  };
  const clip = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t);
  const isRight = (q, a) => (q.mode === 'kitchen' ? (a === 'in') === q.deck[q.i].inDish : (a === 'native') === q.deck[q.i].native_to_india);

  function quizView() {
    if (!quiz) {
      return `<div class="wrap pagehead"><div class="kicker">Interrogation room</div><h1>Pick your test</h1>
        <div class="modes">
          <button class="mode box" data-mode="citizen"><div class="kicker">Test 1</div><h3>Origin quiz</h3><p>Ten ingredients step up. Home-grown, or did it travel here?</p><span class="btn">Start</span></button>
          <button class="mode box" data-mode="kitchen"><div class="kicker">Test 2</div><h3>Kitchen check</h3><p>Does it go into the dish, or never? Garlic in a gulab jamun? Chocolate in a curry? You decide.</p><span class="btn blue">Start</span></button>
        </div></div>`;
    }
    const q = quiz, kitchen = q.mode === 'kitchen';
    const head = `<div class="wrap pagehead"><div class="kicker">${kitchen ? 'Kitchen check' : 'Origin quiz'}</div><h1>${kitchen ? 'Does it go in?' : 'Origin quiz'}</h1>`;
    if (q.i >= q.deck.length) {
      const title = TITLES[q.mode].find(([min]) => q.score >= min)[1];
      return `${head}<div class="qcard box"><div class="kicker">Your result</div><div class="qname">${q.score}/${q.deck.length}</div>
        <div class="reveal-stamp reveal in" style="margin:10px 0">${stampText('st-DOCUMENTED', title, 'rank awarded', 'big')}</div>
        <p>Longest streak: <b>${q.best}</b>. ${q.score >= 8 ? 'The republic bows to you.' : q.score >= 5 ? 'Not bad. A few slipped past you.' : 'Plenty slipped past you. Try again.'}</p>
        <div class="qbtns"><button class="btn" data-restart>Play again</button><button class="btn alt" data-copy>Share my score</button><button class="btn alt" data-menu>Change test</button></div></div></div>`;
    }
    const done = q.picked !== null, last = q.i === q.deck.length - 1, cur = q.deck[q.i], correct = done && isRight(q, q.picked);
    const meta = `<div class="qmeta"><span>Question ${q.i + 1} of ${q.deck.length}</span><span>Score ${q.score}</span><span>Streak ${q.streak}</span></div>`;
    const verdict = done ? `<div class="qres ${correct ? 'ok' : 'bad'}">${correct ? 'CLEARED. You know your stuff.' : 'UNDER REVIEW. Not quite.'}</div>` : '';
    if (kitchen) {
      const stp = cur.inDish ? stampText('st-NATIVE', 'Goes in', 'per our notes', 'big') : stampText('st-ARRIVED', 'Not in', 'our notes', 'big');
      return `${head}${meta}<div class="qcard box"><div class="qdish">${bowl(cur.d.id, 70)}<span>${esc(cur.d.name)}</span></div><div class="qname">${esc(cur.item)}</div>
        ${done ? `${verdict}<div class="reveal-stamp reveal in" style="margin:6px 0 10px">${stp}</div>
          <p>Our notes for <b>${esc(cur.d.name)}</b> list: ${esc(cur.names.join(', '))}. Recipes vary from home to home, so this is only what our notes say.</p>
          <div class="qbtns"><button class="btn blue" data-next>${last ? 'See my result' : 'Next dish →'}</button><a class="btn alt" href="#/dish/${esc(cur.d.slug)}">Open its passport</a></div>`
        : `<p class="qask">Does it go into ${esc(cur.d.name)}?</p><div class="qbtns"><button class="btn mintb" data-ans="in">Goes in</button><button class="btn" data-ans="out">Doesn't</button></div>`}</div></div>`;
    }
    const ing = cur;
    const fact = ing.native_to_india ? 'Born in India. ' + clip(ing.arrival.text, 240) : `From ${ing.native_region}. Reached India ${ing.arrival.era_label}. ${clip(ing.arrival.text, 220)}`;
    const st = ing.native_to_india ? stampText('st-NATIVE', 'Home-grown', 'grown here', 'big') : stamp(ing.arrival.label, ing.arrival.era_label, 'big');
    return `${head}${meta}<div class="qcard box"><div class="qname">${esc(ing.name.split(' (')[0])}</div>${ing.local_names[0] ? `<div class="deva muted" lang="${esc(ing.local_names[0].lang)}">${esc(ing.local_names[0].text)}</div>` : ''}
      ${done ? `${verdict}<div class="reveal-stamp reveal in" style="margin:6px 0 10px">${st}</div><p>${esc(fact)}</p>
        <div class="qbtns"><button class="btn blue" data-next>${last ? 'See my result' : 'Next ingredient →'}</button><a class="btn alt" href="#/ingredient/${esc(ing.slug)}">Open full file</a></div>`
      : `<p class="qask">Home-grown, or a traveller?</p><div class="qbtns"><button class="btn mintb" data-ans="native">Home-grown</button><button class="btn" data-ans="immigrant">Traveller</button></div>`}</div></div>`;
  }
  function quizRender() { app.innerHTML = quizView(); wire(); const m = app.querySelector('.qcard'); if (m) m.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
  function quizAnswer(a) {
    const q = quiz; if (!q || q.picked !== null) return;
    q.picked = a;
    if (isRight(q, a)) { q.score++; q.streak++; q.best = Math.max(q.best, q.streak); } else q.streak = 0;
    quizRender();
  }
  function shareScore() {
    const q = quiz, name = q.mode === 'kitchen' ? 'Thali Kitchen Check' : 'Thali Origin Quiz';
    const text = `I scored ${q.score}/${q.deck.length} on the ${name}. Can you beat me?`;
    const url = location.href.split('#')[0] + '#/quiz';
    if (navigator.share) navigator.share({ title: name, text, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(() => toast('Copied. Paste it anywhere.'));
  }

  /* ---------- share card: draws the passport onto a picture you can post ---------- */
  function rrect(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
  function fitText(x, text, maxW, size, font, weight) { let sz = size; do { x.font = `${weight || 400} ${sz}px ${font}`; sz -= 2; } while (x.measureText(text).width > maxW && sz > 18); }
  async function sharePassport(d) {
    toast('Stamping your dish file…');
    // Wait for the fonts, but never longer than 2 seconds (a slow connection must not block the share).
    try { await Promise.race([Promise.all([document.fonts.load('400 60px Bungee'), document.fonts.load('700 28px "Space Mono"'), document.fonts.load('700 40px "Noto Sans Devanagari"')]), new Promise((r) => setTimeout(r, 2000))]); } catch (e) { /* fonts optional */ }
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const INK = '#1c1233';
    const ph = (D.photos || {})[d.id];
    const img = ph ? await new Promise((res) => { const im = new Image(); im.crossOrigin = 'anonymous'; const t = setTimeout(() => res(null), 5000); im.onload = () => { clearTimeout(t); res(im); }; im.onerror = () => { clearTimeout(t); res(null); }; im.src = ph.src; }) : null;
    x.fillStyle = '#ffd23f'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(28,18,51,.13)'; for (let gy = 0; gy < H; gy += 44) for (let gx = 0; gx < W; gx += 44) { x.beginPath(); x.arc(gx + 11, gy + 11, 3, 0, 7); x.fill(); }
    // passport card with a hard shadow
    x.fillStyle = INK; rrect(x, 76, 126, 940, 1030, 38); x.fill();
    x.fillStyle = '#fff7e3'; x.strokeStyle = INK; x.lineWidth = 8; rrect(x, 60, 110, 940, 1030, 38); x.fill(); x.stroke();
    x.textAlign = 'center'; x.fillStyle = INK;
    x.font = '700 28px "Space Mono", monospace'; if ('letterSpacing' in x) x.letterSpacing = '6px'; x.fillText('DISH FILE · BHUKKAD REPUBLIC', 530, 176); if ('letterSpacing' in x) x.letterSpacing = '0px';
    // the bowl
    if (img) { // the photo, cropped to fill a rounded frame
      const fx = 300, fy = 200, fw = 460, fh = 300, sc = Math.max(fw / img.width, fh / img.height), sw = fw / sc, sh = fh / sc;
      x.save(); x.fillStyle = INK; rrect(x, fx + 8, fy + 10, fw, fh, 26); x.fill(); rrect(x, fx, fy, fw, fh, 26); x.clip();
      x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, fx, fy, fw, fh); x.restore();
      x.strokeStyle = INK; x.lineWidth = 6; rrect(x, fx, fy, fw, fh, 26); x.stroke();
    } else {
    const k = D.bowls[d.id], f = FALLBACK[hash(d.id) % FALLBACK.length], c1 = k ? k[0] : f[0], c2 = k ? k[1] : f[1], cx = 530, cy = 350, r = 140;
    x.save(); x.shadowColor = 'rgba(28,18,51,.35)'; x.shadowOffsetY = 12; x.fillStyle = '#aab2a8'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.restore();
    x.fillStyle = '#f4f6f2'; x.beginPath(); x.arc(cx, cy, r * 0.93, 0, 7); x.fill();
    const g = x.createRadialGradient(cx - r * .15, cy - r * .2, r * .05, cx, cy, r * .78); g.addColorStop(0, c2); g.addColorStop(1, c1);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 0.78, 0, 7); x.fill();
    if (k && k[2]) { x.fillStyle = 'rgba(43,43,43,.5)'; for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { const px = cx + a * 22, py = cy + b * 22; if (Math.hypot(a * 22, b * 22) < r * 0.62) { x.beginPath(); x.arc(px, py, 3.2, 0, 7); x.fill(); } } }
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(cx - r * .38, cy - r * .42, r * .1, 0, 7); x.fill();
    }
    // name
    x.fillStyle = INK; fitText(x, d.name.toUpperCase(), 860, 96, 'Bungee, Impact, sans-serif'); x.fillText(d.name.toUpperCase(), 530, 580);
    if (d.local_names[0]) { fitText(x, d.local_names[0].text, 800, 46, '"Noto Sans Devanagari", sans-serif', 700); x.fillText(d.local_names[0].text, 530, 640); }
    fitText(x, stateNames(d).toUpperCase(), 860, 30, '"Space Mono", monospace', 700); x.globalAlpha = .7; x.fillText(stateNames(d).toUpperCase(), 530, 690); x.globalAlpha = 1;
    const share = passportShare(d);
    if (share.total) { x.fillStyle = '#ff3d81'; fitText(x, `${share.abroad} OF ${share.total} MAIN INGREDIENTS TRAVELLED FROM FAR AWAY`, 860, 40, 'Bungee, Impact, sans-serif'); x.fillText(`${share.abroad} OF ${share.total} MAIN INGREDIENTS TRAVELLED FROM FAR AWAY`, 530, 770); }
    // date of birth panel
    const age = computeAge(d);
    const headline = d.lore ? 'BORN AT 2 A.M.' : d.lite ? 'NOT YET ESTABLISHED' : (age.ancient || !age.floor) ? 'AS OLD AS ITS INGREDIENTS' : `NOT BEFORE ${age.floor.i.arrival.label === 'UNKNOWN' ? '' : 'C. '}${fy(age.floor.y).toUpperCase()}`;
    x.fillStyle = '#151a4a'; x.strokeStyle = INK; x.lineWidth = 6; rrect(x, 110, 820, 840, 230, 26); x.fill(); x.stroke();
    x.fillStyle = '#ffd23f'; x.font = '700 26px "Space Mono", monospace'; if ('letterSpacing' in x) x.letterSpacing = '4px'; x.fillText('EARLIEST POSSIBLE DATE OF BIRTH', 530, 880); if ('letterSpacing' in x) x.letterSpacing = '0px';
    fitText(x, headline, 780, 92, 'Bungee, Impact, sans-serif'); x.fillText(headline, 530, 985);
    // stamp
    x.save(); x.translate(200, 450); x.rotate(-0.2); x.strokeStyle = '#1f3fd6'; x.fillStyle = '#1f3fd6'; x.lineWidth = 7; rrect(x, -150, -44, 300, 88, 10); x.stroke();
    x.lineWidth = 3; rrect(x, -140, -34, 280, 68, 6); x.stroke(); fitText(x, 'FILE CHECKED', 250, 30, 'Bungee, Impact, sans-serif'); x.fillText('FILE CHECKED', 0, 10); x.restore();
    // footer
    x.fillStyle = INK; fitText(x, 'WHERE DID YOUR DISH COME FROM?', 960, 54, 'Bungee, Impact, sans-serif'); x.fillText('WHERE DID YOUR DISH COME FROM?', 540, 1236);
    x.font = '700 28px "Space Mono", monospace'; x.globalAlpha = .75; x.fillText('A FUN FOOD PROJECT · BHUKKAD REPUBLIC', 540, 1292); x.globalAlpha = 1;
    if (img && ph) { const cr = 'Photo: ' + ph.author + ' · ' + ph.license + ' · Wikimedia Commons'; fitText(x, cr, 980, 20, '"Space Mono", monospace', 700); x.globalAlpha = .65; x.fillText(cr, 540, 1328); x.globalAlpha = 1; }
    c.toBlob(async (blob) => {
      if (!blob) { toast('Could not make the picture.'); return; }
      const file = new File([blob], d.slug + '-dish-file.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: d.name + ' dish file' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('Passport picture saved.');
    }, 'image/png');
  }

  /* ---------- Parliament: suggestion box (FRONT END ONLY for now) ----------
     Nothing is sent to a server yet. Bills are saved in this browser (localStorage) so the whole flow can be seen and tested. */
  const TOPICS = { fact: 'A fact is wrong', date: 'A date is wrong', source: 'A source is wrong or missing', ingredient: 'An ingredient is wrong', photo: 'The photo is wrong', place: 'The state or place is wrong', missing: 'A dish is missing', recipe: 'A recipe or version is missing', other: 'Something else' };
  const SECTIONS = { '': 'Not sure', identity: 'Identity page', ingredients: 'Visas / ingredients', dob: 'Date of birth', story: 'Statements / history', eat: 'Where to eat', recipe: 'Recipe', photo: 'Photo' };
  const STORE = 'bhukkad.bills';
  const billsLoad = () => { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { return []; } };
  const billsSave = (list) => { try { localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (e) { return false; } };
  let lastBill = null;
  function parlTabs(active) {
    return `<div class="ptabs" role="tablist"><a role="tab" href="#/parliament" aria-selected="${active === 'box'}">Suggestion box</a><a role="tab" href="#/seats" aria-selected="${active === 'seats'}">The 50 seats</a></div>`;
  }
  function resolveAbout(v) {
    const [type, slug] = String(v || '').split(':'); let o = null;
    if (type === 'dish') o = dishes.find((x) => x.slug === slug); else if (type === 'ingredient') o = ings.find((x) => x.slug === slug);
    else if (type === 'myth') o = myths.find((x) => x.slug === slug); else if (type === 'state') o = states.find((x) => x.slug === slug);
    return o ? { label: o.name || o.question, href: `#/${type === 'state' ? 'state' : type}/${slug}` } : null;
  }
  const opts = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');
  function parliamentView(params) {
    const pre = resolveAbout(params.get('about')), topic = params.get('topic') || '', section = params.get('section') || '';
    const bills = billsLoad();
    const head = `<div class="wrap pagehead"><div class="kicker">Parliament of the Bhukkad Republic</div><h1>Suggestion box</h1>${parlTabs('box')}`;
    const preview = `<div class="basic"><b>Preview:</b> this box isn't connected yet. Your bill is only saved on this device for now, and nothing is sent anywhere.</div>`;
    const list = bills.length ? `<h2 style="font-size:26px;margin:34px 0 12px">Bills on this device</h2><div class="bills">${bills.slice().reverse().map((b) =>
      `<div class="bill"><div><b>${esc(b.id)}</b> · <span class="mono">${esc(b.aboutLabel || 'No page named')}</span><br><span class="small">${esc(TOPICS[b.topic] || b.topic)}: ${esc(b.wrong.length > 110 ? b.wrong.slice(0, 107) + '…' : b.wrong)}</span></div><div class="bill-side"><span class="chip">${esc(b.status)}</span><button class="linkbtn" data-bill-del="${esc(b.id)}">delete</button></div></div>`).join('')}</div>` : '';
    if (lastBill) {
      const b = lastBill;
      return `${head}<p class="lede">Your bill has been introduced.</p>
        <div class="receipt box reveal-stamp reveal"><div class="kicker">Private member's bill</div><h2>${esc(b.id)}</h2>
          <dl class="rc"><div><dt>About</dt><dd>${b.aboutHref ? `<a href="${esc(b.aboutHref)}">${esc(b.aboutLabel)}</a>` : esc(b.aboutLabel || 'No page named')}</dd></div>
          <div><dt>Problem</dt><dd>${esc(TOPICS[b.topic])}${b.section ? ' · ' + esc(SECTIONS[b.section]) : ''}</dd></div></dl>
          <ol class="steps3"><li class="on">Introduced</li><li>Debated</li><li>Passed or rejected</li></ol>
          <div class="reveal-stamp reveal">${stampText('st-DOCUMENTED', 'Received', 'by the Parliament', 'big')}</div></div>
        ${preview}<div class="qbtns" style="justify-content:flex-start"><button class="btn" data-bill-new>Introduce another bill</button>${b.aboutHref ? `<a class="btn alt" href="${esc(b.aboutHref)}">Back to the page</a>` : ''}</div>${list}</div>`;
    }
    return `${head}<p class="lede">Found something wrong? Tell the Parliament. Every correction needs a source, because that is the rule of this republic. It is a fun Parliament with no real powers.</p>${preview}
      <form id="bill" class="pform box" novalidate>
        <div id="pb-errors" class="perr" role="alert" aria-live="assertive"></div>
        <label class="fld">Which page is it about?<input id="pb-about" name="about" list="pb-list" value="${esc(pre ? pre.label : '')}" placeholder="A dish, ingredient or myth name" autocomplete="off" required>
          <datalist id="pb-list">${dishes.slice(0, 400).map((d) => `<option value="${esc(d.name)}">`).join('')}${ings.map((i) => `<option value="${esc(i.name)}">`).join('')}</datalist></label>
        <input type="hidden" id="pb-href" value="${esc(pre ? pre.href : '')}">
        <div class="two"><label class="fld">What kind of problem?<select id="pb-topic" name="topic">${opts(TOPICS, topic in TOPICS ? topic : 'fact')}</select></label>
          <label class="fld">Which part of the page?<select id="pb-section" name="section">${opts(SECTIONS, section in SECTIONS ? section : '')}</select></label></div>
        <label class="fld">What looks wrong?<textarea id="pb-wrong" name="wrong" rows="4" maxlength="1200" placeholder="Tell us what you saw, in your own words" required></textarea></label>
        <label class="fld">What should it say instead? <small>(optional)</small><textarea id="pb-fix" name="fix" rows="3" maxlength="1200"></textarea></label>
        <label class="fld">A link that proves it <small>(optional, but bills with a source go first)</small><input id="pb-source" name="source" type="url" inputmode="url" placeholder="https://"></label>
        <label class="fld">Your name or email <small>(optional, only if you want a reply)</small><input id="pb-contact" name="contact" maxlength="120" autocomplete="off"></label>
        <p class="small muted" style="margin:0">Please don't put anything private in this box.</p>
        <button class="btn" type="submit">Introduce the bill</button>
      </form>${list}</div>`;
  }
  function submitBill(form) {
    const v = (id) => form.querySelector('#' + id).value.trim(), errs = [];
    const about = v('pb-about'), wrong = v('pb-wrong'), source = v('pb-source');
    if (about.length < 2) errs.push(['pb-about', 'Tell us which page this is about.']);
    if (wrong.length < 10) errs.push(['pb-wrong', 'Please say a little more about what looks wrong (at least 10 letters).']);
    if (source && !/^https?:\/\/\S+\.\S+/i.test(source)) errs.push(['pb-source', 'The link should start with http:// or https://']);
    const box = form.querySelector('#pb-errors');
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (errs.length) {
      box.innerHTML = '<b>Almost there:</b><ul>' + errs.map((e) => `<li>${esc(e[1])}</li>`).join('') + '</ul>';
      errs.forEach((e) => form.querySelector('#' + e[0]).setAttribute('aria-invalid', 'true'));
      form.querySelector('#' + errs[0][0]).focus(); return;
    }
    const href = v('pb-href'), match = resolveAbout(href.replace(/^#\/?/, '').replace('/', ':'));
    const list = billsLoad(), bill = {
      id: `PB-${new Date().getFullYear()}-${String(list.reduce((m, b) => Math.max(m, Number((String(b.id).match(/(\d+)$/) || [0, 0])[1])), 0) + 1).padStart(4, '0')}`, at: new Date().toISOString(),
      aboutLabel: about, aboutHref: match && match.label.toLowerCase() === about.toLowerCase() ? href : '',
      topic: v('pb-topic'), section: v('pb-section'), wrong, fix: v('pb-fix'), source, contact: v('pb-contact'), status: 'Introduced',
    };
    list.push(bill); if (!billsSave(list)) toast('Could not save on this device (private mode?). The bill was not kept.');
    lastBill = bill; app.innerHTML = parliamentView(new URLSearchParams()); wire(); window.scrollTo(0, 0);
  }

  /* ---------- router ---------- */
  function notFound(raw) {
    return `<div class="wrap pagehead"><div class="kicker">Error 404 · lost in the Republic</div><h1>This page is not on the menu</h1>
      <p class="lede">Nothing lives at <code>#/${esc(raw.replace(/^\/+/, ''))}</code>. The link may be old or mistyped.</p>
      <p class="cta-row"><a class="btn" href="#/">Go home</a><a class="btn alt" href="#/search">Search dishes</a><a class="btn alt" href="#/chowk">Open the Chowk</a></p></div>`;
  }

  // Back and forward remember where you were. A new page starts at the top. Showing the same page again keeps your place.
  const hist = { stack: [], idx: -1, saved: {} };
  // Jump straight there. (The page's smooth scrolling would make every new page slide up from where the old one ended.)
  const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  function settleScroll(key, prevY) {
    const cur = hist.stack[hist.idx];
    if (cur === key) { jump(prevY); return; }
    if (cur !== undefined) hist.saved[cur] = prevY;
    if (hist.idx > 0 && hist.stack[hist.idx - 1] === key) { hist.idx--; jump(hist.saved[key] || 0); }
    else if (hist.stack[hist.idx + 1] === key) { hist.idx++; jump(hist.saved[key] || 0); }
    else { hist.stack.length = hist.idx + 1; hist.stack.push(key); hist.idx++; jump(0); }
  }

  function route() {
    const prevY = window.scrollY;
    if (dlg.open) dlg.close();
    const raw = (location.hash || '#/').slice(1) || '/';
    const [path, qs] = raw.split('?'); const params = new URLSearchParams(qs || ''); const parts = path.split('/').filter(Boolean);
    let html, nav = '', title = 'Thali Passport Office · Bhukkad Republic';
    if (parts[0] !== 'parliament') lastBill = null;
    if (!parts.length) html = home();
    else if (parts[0] === 'dish' && dishes.find((x) => x.slug === parts[1])) { const d = dishes.find((x) => x.slug === parts[1]); html = dishView(d); title = d.name + ' · Dish file'; }
    else if (parts[0] === 'ingredient' && ings.find((i) => i.slug === parts[1])) { const i = ings.find((x) => x.slug === parts[1]); html = ingredientView(i); title = i.name + ' · Visa file'; }
    else if (parts[0] === 'state' && parts[1] !== 'hostel') { html = searchView(new URLSearchParams('state=' + (parts[1] || ''))); nav = 'dishes'; title = 'Dish files'; }
    else if (parts[0] === 'state' && states.find((s) => s.slug === parts[1])) { const s = states.find((x) => x.slug === parts[1]); html = stateView(s); nav = 'states'; title = s.name + ' · Explore'; }
    else if (parts[0] === 'myths') { html = mythsView(); nav = 'myths'; title = 'The Daily Tadka'; }
    else if (['search', 'dishes', 'states'].includes(parts[0])) { html = searchView(params); nav = 'dishes'; title = 'Dish files'; }
    else if (parts[0] === 'parliament') { html = parliamentView(params); nav = 'parliament'; title = 'Parliament · Suggestion box'; }
    else if (['chowk', 'seats', 'about', 'fun', 'passport'].includes(parts[0]) && window.BHR && window.BHR[parts[0]]) { const r = window.BHR[parts[0]](parts, params, window.BH); html = r.html; nav = r.nav || ''; title = r.title || title; }
    else if (parts[0] === 'quiz') { html = quizView(); nav = 'quiz'; title = 'Origin quiz'; }
    else { html = notFound(raw); nav = ''; title = 'Page not found'; }
    app.innerHTML = html; document.title = /Bhukkad/.test(title) ? title : title + ' · Bhukkad Republic';
    document.querySelectorAll('[data-nav]').forEach((a) => (a.dataset.nav === nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    { const on = parts.length === 0 ? 'home' : nav; document.querySelectorAll('.tabbar [data-tab]').forEach((a) => (a.dataset.tab === on ? a.setAttribute('data-on', '') : a.removeAttribute('data-on'))); }
    settleScroll(raw, prevY); wire(); app.focus({ preventScroll: true });
  }

  /* ---------- after-render: reveal-on-scroll, count-up, passport cover ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function wire() {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
      const c = e.target.querySelector('[data-count]'); if (c) countUp(c);
    }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    app.querySelectorAll('.reveal, .reveal-stamp').forEach((el) => (reduce ? el.classList.add('in') : io.observe(el)));
    const stage = document.getElementById('stage');
    if (stage) { const open = () => { if (stage.classList.contains('open')) return; stage.classList.add('open'); setTimeout(() => stage.classList.add('done'), reduce ? 0 : 1900); }; document.getElementById('cover').addEventListener('click', open); document.getElementById('cover').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); }); setTimeout(open, reduce ? 0 : 1500); }
  }
  function countUp(el) {
    const to = +el.dataset.count, suf = el.dataset.suffix || ''; if (reduce) { el.textContent = to + suf; return; }
    const t0 = performance.now();
    (function step(t) { const p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(t0);
  }

  /* ---------- events (one listener for everything) ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const fn = t.closest('[data-fn]'); if (fn) { e.preventDefault(); const el = document.getElementById('src-' + fn.dataset.fn); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const sc = t.closest('[data-scroll]'); if (sc) { e.preventDefault(); const el = document.getElementById(sc.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.closest('[data-bill-new]')) { lastBill = null; app.innerHTML = parliamentView(new URLSearchParams()); wire(); window.scrollTo(0, 0); return; }
    const bd = t.closest('[data-bill-del]'); if (bd) { billsSave(billsLoad().filter((b) => b.id !== bd.dataset.billDel)); app.innerHTML = parliamentView(new URLSearchParams(location.hash.split('?')[1] || '')); wire(); return; }
    const vt = t.closest('[data-ver]'); if (vt) {
      const sec = vt.closest('section'); sec.querySelectorAll('.vtab').forEach((b) => b.setAttribute('aria-selected', String(b === vt)));
      sec.querySelectorAll('.ver-panel').forEach((pn) => { pn.hidden = pn.dataset.verPanel !== vt.dataset.ver; }); return;
    }
    const more = t.closest('[data-more]'); if (more) { app.querySelectorAll('.pass[hidden]').forEach((el) => el.removeAttribute('hidden')); more.parentElement.remove(); return; }
    const sh = t.closest('[data-share]'); if (sh) { sharePassport(dishes.find((x) => x.slug === sh.dataset.share)); return; }
    const ans = t.closest('[data-ans]'); if (ans) { quizAnswer(ans.dataset.ans); return; }
    if (t.closest('[data-next]')) { quiz.i++; quiz.picked = null; quizRender(); return; }
    const md = t.closest('[data-mode]'); if (md) { quiz = newQuiz(md.dataset.mode); quizRender(); return; }
    if (t.closest('[data-menu]')) { quiz = null; quizRender(); return; }
    if (t.closest('[data-restart]')) { quiz = newQuiz(quiz.mode); quizRender(); return; }
    if (t.closest('[data-copy]')) { shareScore(); return; }
    if (t.closest('[data-random]')) { const d = pick(Math.random() < 0.65 ? dishes.filter((x) => !x.lite) : dishes, 1)[0]; location.hash = '#/dish/' + d.slug; return; }
    if (t.closest('[data-belt]')) { beltDish = pick(dishes.filter((d) => d.ingredients.length >= 4 && d !== beltDish), 1)[0]; document.getElementById('belt').innerHTML = belt(beltDish); document.getElementById('belt-name').textContent = beltDish.name; document.getElementById('belt-no').textContent = 'BELT ' + (1 + Math.floor(Math.random() * 9)); return; }
    const cs = t.closest('[data-ing]'); if (cs) { openFile(cs.dataset.ing); return; }
    if (t.closest('[data-close]')) { if (dlg.open) dlg.close(); return; }
    const ct = t.closest('[data-cat]'); if (ct) { const p = new URLSearchParams(location.hash.split('?')[1] || ''); p.get('cat') === ct.dataset.cat ? p.delete('cat') : p.set('cat', ct.dataset.cat); location.hash = '#/search?' + p.toString(); return; }
    if (t === dlg) dlg.close();
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'bill') { e.preventDefault(); submitBill(e.target); return; }
    if (e.target.id === 'hs' || e.target.id === 'sf') { e.preventDefault(); const q = e.target.querySelector('input').value.trim(); const p = new URLSearchParams(e.target.id === 'sf' ? location.hash.split('?')[1] || '' : ''); q ? p.set('q', q) : p.delete('q'); location.hash = '#/search?' + p.toString(); }
  });
  window.addEventListener('hashchange', route);
  const fseal = document.getElementById('foot-seal'); if (fseal) fseal.innerHTML = seal(92);
  window.BH = { facts: () => factsSection(), beltSection: () => beltSection(), parlTabs, esc, bowl, stamp, stampText, toast, seal, dishes, ings, pick, hash, reduce, app, billsLoad: () => billsLoad(), rerender: () => route(), wire: () => wire(), COMMANDER: { title: 'The Great Bhukkad', subtitle: 'Head of the Republic', name: 'The Founder' } };
  route();
})();
