// Turns the real content files into one data.js the page can load with no server logic.
// Run:  node build-data.mjs      (re-run whenever anything in content/ changes)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const content = resolve(here, 'content');
const read = (f) => JSON.parse(readFileSync(resolve(content, f), 'utf8'));

// Hand-picked bowl colours for the first dishes (content/bowl-colors.ts).
const colorsSrc = readFileSync(resolve(content, 'bowl-colors.ts'), 'utf8');
const body = colorsSrc.split('export const BOWL_COLORS')[1].split('= {')[1].split('\n};')[0];
const bowls = new Function(`return {${body}}`)();

// ---- Batch imports (content/dishes-batch*/): small draft entries. Same rules as the Astro site:
// show an entry only if it has a source AND every state it names exists in states.json. ----
const statesList = read('states.json');
const known = new Set(statesList.map((x) => x.id));
const LANG = { Devanagari: 'hi', Tamil: 'ta', Odia: 'or', 'Bengali-Assamese': 'bn' };
const liteDishes = [], liteSources = new Map();
let noSource = 0, newState = 0;
for (const folder of readdirSync(content, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith('dishes-batch'))) {
  for (const file of readdirSync(resolve(content, folder.name)).filter((f) => f.endsWith('.json'))) {
    const f = JSON.parse(readFileSync(resolve(content, folder.name, file), 'utf8'));
    if (f.needs_source || !f.sources || !f.sources.length) { noSource++; continue; }
    if (!f.state_ids.every((x) => known.has(x))) { newState++; continue; }
    for (const src of f.sources) {
      if (!liteSources.has(src.source_id)) {
        liteSources.set(src.source_id, { id: src.source_id, type: /wikipedia\.org/.test(src.url) ? 'website' : 'article', citation: src.title, url: src.url, reliability: 'secondary' });
      }
    }
    const history = f.origin && f.origin.citations && f.origin.citations.length
      ? [{ id: f.slug + '-origin', text: f.origin.text, era_label: 'origin', year_from: null, year_to: null, label: f.origin.label,
          citations: f.origin.citations.map((c) => ({ source_id: c.source_id, locator: '' })), checked: f.checked }]
      : [];
    liteDishes.push({
      id: f.slug, slug: f.slug, name: f.name,
      local_names: f.local_names.map((l) => ({ text: l.text, script: l.script, lang: l.script === 'Bengali-Assamese' && f.state_ids.includes('assam') ? 'as' : (LANG[l.script] || 'und'), translit: f.name })),
      state_ids: f.state_ids, category: f.category,
      diet: { pure_veg: f.diet.pure_veg, contains_egg: false, vegan: f.diet.vegan, jain: f.diet.jain, sattvik_vrat: false },
      gi: { has_tag: false }, summary: f.summary, history, ingredients: [], festivals: [], images: [], place_ids: [], related_dish_ids: [],
      status: 'published', lite: true, ingredient_names: f.ingredients, listed_in: f.sources.map((x) => x.source_id),
    });
  }
}

// ---- Hostel Pradesh: light-hearted student lore, written for this design concept (see hostel.json). ----
const hostel = JSON.parse(readFileSync(resolve(here, 'hostel.json'), 'utf8'));
const hostelDishes = hostel.dishes.map((h) => ({
  id: h.id, slug: h.id, name: h.name,
  local_names: [{ text: h.native, script: 'Devanagari', lang: 'hi', translit: h.name }],
  state_ids: ['hostel'], category: h.category,
  diet: { pure_veg: true, contains_egg: false, vegan: false, jain: false, sattvik_vrat: false },
  gi: { has_tag: false }, summary: h.summary, history: [], ingredients: [], festivals: [], images: [], place_ids: [], related_dish_ids: [],
  status: 'published', lore: true, ingredient_names: h.ingredients, device: h.device, chaos: h.chaos, steps: h.steps,
}));

// ---- Recipe versions: content/versions/<dish-slug>.json holds an array of versions for that dish (optional folder). ----
const versionsDir = resolve(content, 'versions');
const versionsBySlug = {};
if (existsSync(versionsDir)) {
  for (const f of readdirSync(versionsDir).filter((x) => x.endsWith('.json'))) {
    const list = JSON.parse(readFileSync(resolve(versionsDir, f), 'utf8'));
    versionsBySlug[f.replace(/\.json$/, '')] = list;
    list.forEach((v, i) => { if (!v.citations || !v.citations.length) console.warn(`WARNING: ${f} version ${i + 1} ("${v.name}") has no source, so it is not publishable.`); });
  }
}
const baseSources = read('sources.json');
const have = new Set(baseSources.map((x) => x.id));

// Photos from find-photos.mjs, minus the ones a person looked at and rejected (photo-skip.json).
function loadPhotos() {
  if (!existsSync(resolve(here, 'photos.json'))) return {};
  const photos = JSON.parse(readFileSync(resolve(here, 'photos.json'), 'utf8')).photos;
  // Licence links must be https (and never anything else, such as javascript:).
  for (const v of Object.values(photos)) { v.licenseUrl = String(v.licenseUrl || '').replace(/^http:\/\//, 'https://'); if (!/^https:\/\//.test(v.licenseUrl)) v.licenseUrl = ''; if (!/^https:\/\//.test(v.page)) v.page = ''; }
  const skipNames = existsSync(resolve(here, 'photo-skip.json')) ? Object.keys(JSON.parse(readFileSync(resolve(here, 'photo-skip.json'), 'utf8')).skip) : [];
  const allDishes = read('dishes.json').concat(liteDishes);
  for (const d of allDishes) if (skipNames.includes(d.name)) delete photos[d.id || d.slug];
  return photos;
}

const data = {
  dishes: read('dishes.json').filter((d) => d.status === 'published').concat(liteDishes, hostelDishes),
  ingredients: read('ingredients.json'),
  states: [hostel.state].concat(read('states.json')),
  myths: read('myths.json'),
  places: read('places.json'),
  sources: baseSources.concat([...liteSources.values()].filter((x) => !have.has(x.id))),
  bowls,
  // Openly licensed photos found by find-photos.mjs (optional file).
  photos: loadPhotos(),
  built: new Date().toISOString().slice(0, 10),
};
for (const d of data.dishes) if (versionsBySlug[d.slug]) d.versions = versionsBySlug[d.slug];
const problems = validate(data);
if (problems.length) {
  console.error(`
Data check failed (${problems.length} problems). data.js was NOT written:`);
  problems.slice(0, 60).forEach((x) => console.error('  - ' + x));
  process.exit(1);
}
console.log('data check: passed');
writeFileSync(resolve(here, 'data.js'), 'window.DATA = ' + JSON.stringify(data) + ';\n');
console.log(`batch imports: ${liteDishes.length} shown, ${noSource} left out (no source), ${newState} left out (state missing from states.json)`);
console.log(`photos: ${Object.keys(data.photos).length}`);
console.log(`hostel lore: ${hostelDishes.length} dishes`);
console.log(`data.js: ${data.dishes.length} dishes, ${data.ingredients.length} ingredients, ${data.myths.length} myths, ${data.states.length} states`);
