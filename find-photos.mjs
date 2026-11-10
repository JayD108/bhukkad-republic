// Finds an openly licensed photo for each dish, using the lead image of its Wikipedia article.
// Rules (from the project's CLAUDE.md): only openly licensed images, and the credit + licence must be shown.
//   - Skips disambiguation pages and pages that don't read like an Indian food article.
//   - Keeps only CC BY, CC BY-SA, CC0 or public-domain files (never "fair use").
//   - Every match is marked reviewed:false: an editor still has to look at it.
// Run:  node find-photos.mjs     (needs internet; writes photos.json; then run node build-data.mjs)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(resolve(here, 'data.js'), 'utf8');
const D = JSON.parse(raw.replace(/^window\.DATA = /, '').replace(/;\s*$/, ''));
const dishes = D.dishes.filter((d) => !d.lore); // hostel lore has no real-world article

const UA = 'ThalipediaPhotoFinder/0.1 (design prototype; non-commercial)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Be gentle: about one request every 1.5 seconds, wait when the server says "slow down" (HTTP 429),
// and remember every answer on disk (.photo-cache.json) so a re-run never asks the same thing twice.
const CACHE_FILE = resolve(here, '.photo-cache.json');
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch { /* first run */ }
async function api(params) {
  const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  if (cache[url]) return cache[url];
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        const json = await res.json(); cache[url] = json; writeFileSync(CACHE_FILE, JSON.stringify(cache));
        await sleep(1500); return json;
      }
      const wait = Math.min(120, Number(res.headers.get('retry-after')) || 15 * attempt);
      console.log('\n  HTTP ' + res.status + ', waiting ' + wait + 's (attempt ' + attempt + ')');
      await sleep(wait * 1000);
    } catch (e) { console.log('\n  network error (' + e.message + '), retrying'); await sleep(5000 * attempt); }
  }
  console.log('\n  giving up on one batch, continuing'); return {};
}
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// ---- candidate article titles for each dish ----
const titleCase = (s) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
function candidates(d) {
  const base = d.name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = base.split(/\s*\/\s*/).filter(Boolean);
  const out = [];
  for (const p of parts) out.push(p, titleCase(p), p + ' (dish)');
  return [...new Set(out)];
}

const FOOD = /\b(dish|food|cuisine|sweet|snack|bread|rice|curry|dessert|beverage|drink|pancake|dumpling|fritter|savou?ry|lentil|chutney|roti|paratha|pudding|laddu|halwa|porridge|stew|soup|pickle|cake|biscuit|milk|yogou?rt|curd|flour|dough|pastry|confection|preparation|gravy|crepe|noodle|salad)\b/i;
const REGION = /(India|Indian|Bengal|Odisha|Orissa|Rajasthan|Punjab|Kashmir|Tamil|Bihar|Assam|Gujarat|Maharashtra|Kerala|Karnataka|Andhra|Telugu|Hindi|Pakistan|South Asia|Nepal|Sri Lanka|Bangladesh|Goa|Manipur|Mithila|Awadh|Marwar|Uttar|Jharkhand|Mewar|Konkan|Odia|Marathi|Bhojpuri|Sindhi|Gujarati|Punjabi|Kashmiri|Malayali|Himachal|Uttarakhand|Sikkim|Mizo|Naga|Meitei|Madhya)/i;

// ---- 1. look up every candidate title ----
const allTitles = [...new Set(dishes.flatMap(candidates))];
console.log(`${dishes.length} dishes, ${allTitles.length} candidate titles`);
const found = new Map(); // requested title -> page
for (const batch of chunk(allTitles, 20)) {
  const r = await api({
    action: 'query', redirects: '1', prop: 'pageimages|extracts|pageprops', piprop: 'name', ppprop: 'disambiguation',
    exintro: '1', explaintext: '1', exsentences: '2', exlimit: 'max', titles: batch.join('|'),
  });
  const q = r.query || {};
  const norm = new Map((q.normalized || []).map((x) => [x.from, x.to]));
  const redir = new Map((q.redirects || []).map((x) => [x.from, x.to]));
  const byTitle = new Map((q.pages || []).map((p) => [p.title, p]));
  for (const t of batch) {
    const n = norm.get(t) || t; const rd = redir.get(n) || n;
    const page = byTitle.get(rd); if (page) found.set(t, page);
  }
  process.stdout.write('.');
}
console.log();

const good = (p) => p && !p.missing && !(p.pageprops && 'disambiguation' in p.pageprops) && p.pageimage && /\.(jpe?g|png|webp)$/i.test(p.pageimage) &&
  p.extract && !/may refer to/i.test(p.extract) && FOOD.test(p.extract) && REGION.test(p.extract);

const pick = new Map(); // dish id -> page
for (const d of dishes) {
  for (const c of candidates(d)) { const p = found.get(c); if (good(p)) { pick.set(d.id, p); break; } }
}
console.log(`articles with a usable lead image: ${pick.size}/${dishes.length}`);

// ---- 2. check licence + author of each file ----
const files = [...new Set([...pick.values()].map((p) => p.pageimage))];
const info = new Map(); // "File:Name with spaces.jpg" -> imageinfo
for (const batch of chunk(files, 40)) {
  const r = await api({
    action: 'query', prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '640',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Credit|NonFree|Restrictions', titles: batch.map((f) => 'File:' + f).join('|'),
  });
  for (const p of (r.query && r.query.pages) || []) if (p.imageinfo && p.imageinfo[0]) info.set(p.title, p.imageinfo[0]);
  process.stdout.write('.');
}
console.log();

const strip = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const OPEN = /^(CC BY(-SA)?\b|CC0|Public domain|PD\b|No restrictions)/i;
// A photo is only kept when the article IS the dish (same name), never a broader or a related dish.
// These synonyms were checked by hand: the article is the same dish under another name.
const SAME_DISH = new Set(['rasagola / rosogolla', 'ven pongal', 'gupchup', 'jangiri', 'kuzhi paniyaram', 'pyaaz kachori', 'thayir sadam', 'uthappam', 'appalam', 'balushahi']);
const letters = (t) => t.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');
const NONVEG = /(chicken|mutton|lamb|beef|pork|fish|ilish|hilsa|prawn|shrimp|egg|eggs|meat|keema|kebab|kabab|tandoori chicken|biryani)/i;
const skipped = [];
const photos = {}, rejected = [];
for (const d of dishes) {
  let p = pick.get(d.id); if (!p) continue;
  const parts = d.name.split(/\s*\/\s*/);
  const sameName = parts.some((x) => letters(x) === letters(p.title));
  if (!sameName && !SAME_DISH.has(d.name.toLowerCase())) { skipped.push({ dish: d.name, article: p.title, reason: 'article is a different or broader dish' }); continue; }
  if (NONVEG.test(p.pageimage.replace(/_/g, ' ')) || NONVEG.test(p.title)) { skipped.push({ dish: d.name, article: p.title, reason: 'photo looks non-vegetarian' }); continue; }
  const key = 'File:' + p.pageimage.replace(/_/g, ' ');
  const ii = info.get(key); const m = ii && ii.extmetadata;
  if (!m) { rejected.push(`${d.name}: no file info`); continue; }
  const lic = strip(m.LicenseShortName && m.LicenseShortName.value);
  if (!OPEN.test(lic) || (m.NonFree && /true|1|yes/i.test(String(m.NonFree.value))) || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) { rejected.push(`${d.name}: licence "${lic}"`); continue; }
  let author = strip(m.Artist && m.Artist.value) || strip(m.Credit && m.Credit.value) || 'Unknown author';
  if (author.length > 90) author = author.slice(0, 87) + '...';
  photos[d.id] = {
    src: String(ii.thumburl).split('?')[0], page: ii.descriptionurl, file: p.pageimage.replace(/_/g, ' '), author, license: lic,
    licenseUrl: strip(m.LicenseUrl && m.LicenseUrl.value), article: p.title, width: ii.thumbwidth, height: ii.thumbheight, reviewed: false,
  };
}
writeFileSync(resolve(here, 'photos.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), source: 'Wikipedia lead images, licence checked via Wikimedia Commons metadata', photos, skipped }, null, 1));
console.log('skipped as not the same dish:', skipped.length);
const missing = dishes.filter((d) => !photos[d.id]);
console.log(`photos.json: ${Object.keys(photos).length} photos for ${dishes.length} dishes. No photo for ${missing.length}.`);
console.log('rejected for licence/file:', rejected.length ? rejected.join(' | ') : 'none');
