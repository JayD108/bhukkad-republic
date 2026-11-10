// Writes one plain, fast HTML page per dish at /dish/<slug>/ so search engines and link previews can read it.
// Each page links into the full app. Run after build-data.mjs:  node build-seo.mjs
// Set "siteUrl" in site.json (e.g. "https://bhukkad.example") once you have a domain; then sitemap.xml is written too.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(resolve(here, 'data.js'), 'utf8').replace(/^window\.DATA = /, '').replace(/;\s*$/, ''));
const site = existsSync(resolve(here, 'site.json')) ? JSON.parse(readFileSync(resolve(here, 'site.json'), 'utf8')) : {};
const base = String(site.siteUrl || '').replace(/\/+$/, '');
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LABEL = { DOCUMENTED: 'Cleared (documented)', TRADITIONAL: 'Folk tale (traditional)', DISPUTED: 'Under review (disputed)', UNKNOWN: 'Unknown' };
const stateName = (id) => (D.states.find((s) => s.id === id) || {}).name || id;
const src = (id) => D.sources.find((s) => s.id === id);

function page(d) {
  const url = `/dish/${d.slug}/`, desc = d.summary.slice(0, 155), photo = (D.photos || {})[d.id];
  const states = d.state_ids.map(stateName).join(', ');
  const used = new Set(); (d.history || []).forEach((h) => h.citations.forEach((c) => used.add(c.source_id))); (d.listed_in || []).forEach((x) => used.add(x));
  const claims = (d.history || []).map((h) => `<div class="claim"><div class="when">${esc(h.era_label)} · ${esc(LABEL[h.label])}</div><p>${esc(h.text)}</p></div>`).join('') || '<p>No sourced history yet.</p>';
  const ings = (d.ingredient_names || d.ingredients.map((r) => (D.ingredients.find((i) => i.id === r.ingredient_id) || {}).name)).filter(Boolean);
  const sources = [...used].map(src).filter(Boolean).map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" rel="nofollow noopener">${esc(s.citation)}</a>` : esc(s.citation)}</li>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: `${d.name}: history, ingredients and where it comes from`, about: d.name, description: desc, inLanguage: 'en' };
  if (photo) ld.image = photo.src;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.name)} · dish file · Bhukkad Republic</title><meta name="description" content="${esc(desc)}">
${base ? `<link rel="canonical" href="${esc(base + url)}"><meta property="og:url" content="${esc(base + url)}">` : ''}
<meta property="og:type" content="article"><meta property="og:title" content="${esc(d.name)} · Bhukkad Republic"><meta property="og:description" content="${esc(desc)}">
${photo ? `<meta property="og:image" content="${esc(photo.src)}">` : ''}<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts.css"><link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head>
<body><main class="wrap pagehead"><p class="kicker"><a href="/">Bhukkad Republic</a> · dish file</p><h1>${esc(d.name)}</h1>
<p class="lede">${esc(d.summary)}</p><p class="muted">${esc(states)} · ${esc(d.category)}</p>
${photo ? `<figure style="margin:0;max-width:460px"><img src="${esc(photo.src)}" alt="${esc(d.name)}" style="width:100%;border:3px solid #1c1233;border-radius:12px"><figcaption class="credit">Photo: ${esc(photo.author)} · ${esc(photo.license)} · Wikimedia Commons</figcaption></figure>` : ''}
<p class="cta-row"><a class="btn" href="/#/dish/${esc(d.slug)}">Open the full dish file</a><a class="btn alt" href="/#/chowk/new?dish=${esc(d.slug)}">Post your plate</a></p>
<section class="pg"><h2>History</h2>${claims}</section>
${ings.length ? `<section class="pg"><h2>Ingredients</h2><p>${ings.map(esc).join(', ')}</p></section>` : ''}
${sources ? `<section class="pg"><h2>Sources</h2><ol class="sources">${sources}</ol></section>` : ''}</main>
<footer class="foot"><div class="wrap"><p class="legalnote"><b>Just for fun.</b> The Bhukkad Republic is an imaginary food country made for fun. It is not a real country, government or official body. We respect every nation's sovereignty and food heritage.</p><div class="fun-tag">★ JUST FOR FUN · AN IMAGINARY COUNTRY · NOT A REAL GOVERNMENT ★</div></div></footer></body></html>`;
}

let n = 0;
for (const d of D.dishes) { const dir = resolve(here, 'dish', d.slug); mkdirSync(dir, { recursive: true }); writeFileSync(resolve(dir, 'index.html'), page(d)); n++; }
writeFileSync(resolve(here, 'robots.txt'), `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
if (base) {
  const urls = ['/'].concat(D.dishes.map((d) => `/dish/${d.slug}/`)).map((u) => `<url><loc>${esc(base + u)}</loc></url>`).join('');
  writeFileSync(resolve(here, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
}
console.log(`seo: ${n} dish pages written${base ? ', sitemap.xml written' : '. No siteUrl in site.json yet, so no sitemap or canonical links.'}`);
