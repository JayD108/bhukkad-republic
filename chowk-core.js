/* Bhukkad Chowk, part 1: storage, sample posts and points.
   FRONT END ONLY. Everything is saved in this browser (localStorage). Nothing is sent anywhere yet. */
(function () {
  'use strict';
  const K = { posts: 'bhukkad.posts', me: 'bhukkad.me', liked: 'bhukkad.liked', tried: 'bhukkad.tried', hide: 'bhukkad.hidesamples', cmx: 'bhukkad.samplecomments' };
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const PTYPES = { made: 'I made it', ate: 'I ate it', help: 'Need help', hack: 'Hack or tip', idea: 'Idea' };
  const BOWL_PICKS = ['dhokla', 'rasagola', 'vada-pav', 'idli', 'mysore-pak', 'kettle-maggi', 'litti-chokha', 'bandar-laddu'];
  const HR = 3600e3;

  // Clearly labelled SAMPLE posts, so the feed is not empty while the design is being looked at. They are not real people.
  const samples = () => {
    const now = Date.now();
    return [
      { id: 's1', sample: true, type: 'made', dish: 'kettle-maggi', title: 'Kettle Maggi, attempt three', body: 'Finally no clogged kettle. Rinse it straight away, trust me.',
        steps: ['Boil water, switch off and unplug.', 'Break the noodles in, lid on, wait four minutes.', 'Drain most of the water, add the masala and stir.'], photo: '', handle: 'sample_roommate', bowl: 'kettle-maggi', at: now - 2 * HR, yums: 24, tried: 7 },
      { id: 's6', sample: true, type: 'ate', dish: 'vada-pav', where: 'A stall outside the station', title: 'Best vada pav of my week', body: 'Crisp outside, soft inside, extra green chutney. Ate two.', steps: [], photo: '', handle: 'sample_snacker', bowl: 'vada-pav', at: now - 3 * HR, yums: 19, tried: 4 },
      { id: 's2', sample: true, type: 'help', dish: 'idli', title: 'My idlis come out flat. Help?', body: 'The batter rises overnight but the idlis are dense. What am I missing?',
        steps: [], photo: '', handle: 'sample_curious', bowl: 'idli', at: now - 5 * HR, yums: 9, tried: 0 },
      { id: 's3', sample: true, type: 'hack', dish: 'hot-water-poha', title: 'Poha with zero stove', body: 'Soak in hot kettle water, add lemon and onion. Done before your chai cools.',
        steps: [], photo: '', handle: 'sample_night_owl', bowl: 'dhokla', at: now - 9 * HR, yums: 31, tried: 12 },
      { id: 's4', sample: true, type: 'idea', dish: '', title: 'Idea: a leftover-roti week', body: 'Everyone posts one thing they made from leftover roti. The best one earns a seat in the Parliament.',
        steps: [], photo: '', handle: 'sample_planner', bowl: 'vada-pav', at: now - 22 * HR, yums: 17, tried: 0 },
      { id: 's5', sample: true, type: 'made', dish: 'dhokla', title: 'First time making dhokla', body: 'Soft in the middle, a bit dry on top. The tempering saved it.',
        steps: [], photo: '', handle: 'sample_first_timer', bowl: 'dhokla', at: now - 30 * HR, yums: 12, tried: 3 },
    ];
  };

  const me = () => get(K.me, null);
  function ago(t) {
    const sec = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (sec < 60) return 'just now';
    const m = Math.round(sec / 60); if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60); return h < 24 ? h + ' h ago' : Math.round(h / 24) + ' d ago';
  }
  // Draft point rules (the Maharasoiya will tune these): post +10, comment on someone else's post +2,
  // yum received +1, bill +5. Daily caps stop farming: 3 posts, 5 comments and 2 bills count per day.
  // Comments on your OWN posts never count. (This is only enforced in this browser. A server must enforce it for real.)
  const CAPS = { posts: 3, comments: 5, bills: 2 };
  function perDay(times, cap) {
    const seen = {}; let counted = 0;
    times.forEach((t) => { const day = new Date(t).toDateString(); seen[day] = (seen[day] || 0) + 1; if (seen[day] <= cap) counted++; });
    return counted;
  }
  function stats(bills) {
    const list = Array.isArray(bills) ? bills : [];
    const m = me(); if (!m) return { posts: 0, comments: 0, yums: 0, bills: 0, points: 0 };
    const all = get(K.posts, []), mine = all.filter((x) => x.handle === m.handle), cmx = get(K.cmx, {});
    const onOthers = all.filter((x) => x.handle !== m.handle).flatMap((x) => x.comments || []).concat(Object.values(cmx).flat());
    const myComments = onOthers.filter((c) => c.handle === m.handle).map((c) => c.at);
    const posts = perDay(mine.map((x) => x.at), CAPS.posts), comments = perDay(myComments, CAPS.comments);
    const billsCounted = perDay(list.map((b) => new Date(b.at || Date.now()).getTime()), CAPS.bills);
    const yums = mine.reduce((a, x) => a + (x.yums || 0), 0);
    return { posts, comments, yums, bills: billsCounted, points: posts * 10 + comments * 2 + yums + billsCounted * 5 };
  }
  // Names that look official can't be taken, so nobody can pretend to be the Maharasoiya or a moderator.
  const RESERVED = /(founder|admin|commander|moderator|official|parliament|supreme|bhukkad|staff|support|sample|system)/;
  const reserved = (h) => RESERVED.test(String(h).toLowerCase().replace(/[^a-z]/g, ''));
  const tier = (pts) => (pts >= 150 ? 'Senior citizen' : pts >= 50 ? 'Regular' : pts >= 10 ? 'Citizen' : 'Tourist');
  function allPosts() {
    const cmx = get(K.cmx, {});
    const sample = get(K.hide, false) ? [] : samples().map((x) => Object.assign(x, { comments: cmx[x.id] || [] }));
    return get(K.posts, []).concat(sample);
  }
  const handleProblem = (h) => (!/^[A-Za-z0-9_]{3,20}$/.test(h) ? 'Pick a handle: 3 to 20 letters, numbers or _.' : reserved(h) ? 'That name is reserved for the Republic. Please pick another.' : '');
  window.BHC = { K, get, set, PTYPES, BOWL_PICKS, CAPS, me, ago, stats, tier, allPosts, reserved, handleProblem };
})();
