// Checks the data before data.js is written. Any problem stops the build with a plain list.
// Same rules as the project's CLAUDE.md: every history claim has one label and at least one real source.
const LABELS = new Set(['DOCUMENTED', 'TRADITIONAL', 'DISPUTED', 'UNKNOWN']);
const CATS = new Set(['snack', 'sweet', 'main', 'side', 'bread', 'rice', 'drink', 'breakfast', 'festival']);

export function validate(data) {
  const p = [];
  const ids = (list, name) => {
    const seen = new Set();
    for (const x of list) { if (seen.has(x.id)) p.push(`${name}: duplicate id "${x.id}"`); seen.add(x.id); }
    return seen;
  };
  const dishIds = ids(data.dishes, 'dishes'), ingIds = ids(data.ingredients, 'ingredients');
  const stateIds = ids(data.states, 'states'), srcIds = ids(data.sources, 'sources'), placeIds = ids(data.places, 'places');
  ids(data.myths, 'myths');
  const need = (where, set, id, kind) => { if (!set.has(id)) p.push(`${where}: unknown ${kind} "${id}"`); };
  const claim = (where, c) => {
    if (!c) return;
    if (!LABELS.has(c.label)) p.push(`${where}: label "${c.label}" is not one of the four stamps`);
    if (!c.citations || !c.citations.length) p.push(`${where}: a claim needs at least one source`);
    (c.citations || []).forEach((x) => need(where, srcIds, x.source_id, 'source'));
  };

  for (const d of data.dishes) {
    const w = `dish "${d.id}"`;
    if (!d.name || !d.slug || !d.summary) p.push(`${w}: name, slug and summary are required`);
    if (!CATS.has(d.category)) p.push(`${w}: unknown category "${d.category}"`);
    (d.state_ids || []).forEach((s) => need(w, stateIds, s, 'state'));
    (d.ingredients || []).forEach((r) => need(w, ingIds, r.ingredient_id, 'ingredient'));
    (d.related_dish_ids || []).forEach((r) => need(w, dishIds, r, 'related dish'));
    (d.place_ids || []).forEach((x) => need(w, placeIds, x, 'place'));
    (d.listed_in || []).forEach((x) => need(w, srcIds, x, 'source'));
    (d.history || []).forEach((h, i) => { claim(`${w} history ${i + 1}`, h); (h.sides || []).forEach((s) => (s.citations || []).forEach((x) => need(w, srcIds, x.source_id, 'source'))); });
    if (d.diet && d.diet.contains_egg && (d.diet.vegan || d.diet.pure_veg)) p.push(`${w}: diet says it has egg but is also vegan or pure veg`);
    (d.versions || []).forEach((v, i) => { if (!v.citations || !v.citations.length) console.warn(`  note: ${w} style ${i + 1} has no source, so the page marks it not publishable`); });
  }
  for (const i of data.ingredients) { claim(`ingredient "${i.id}" origin`, i.origin); claim(`ingredient "${i.id}" arrival`, i.arrival); claim(`ingredient "${i.id}" became_common`, i.became_common); }
  for (const m of data.myths) {
    claim(`myth "${m.id}"`, m);
    (m.dish_ids || []).forEach((x) => need(`myth "${m.id}"`, dishIds, x, 'dish'));
    (m.ingredient_ids || []).forEach((x) => need(`myth "${m.id}"`, ingIds, x, 'ingredient'));
  }
  for (const pl of data.places) { need(`place "${pl.id}"`, stateIds, pl.state_id, 'state'); (pl.dish_ids || []).forEach((x) => need(`place "${pl.id}"`, dishIds, x, 'dish')); }
  return p;
}
