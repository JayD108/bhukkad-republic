// Downloads the fonts once and serves them from our own folder, so visitors never talk to Google.
// All four families are under the SIL Open Font License, which allows this. Run: node fetch-fonts.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Bungee&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=Noto+Sans+Devanagari:wght@500;700&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'; // asks for woff2
const KEEP = new Set(['latin', 'devanagari']); // only the scripts we use

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();
const blocks = css.split('/* ').slice(1).map((b) => ({ subset: b.slice(0, b.indexOf(' */')), body: b.slice(b.indexOf('@font-face')) }));
mkdirSync(resolve(here, 'fonts'), { recursive: true });
let out = '/* Self-hosted fonts (SIL Open Font License). Made by fetch-fonts.mjs. */\n', n = 0;
for (const { subset, body } of blocks) {
  if (!KEEP.has(subset)) continue;
  const url = (body.match(/url\((https:[^)]+)\)/) || [])[1];
  const fam = (body.match(/font-family: '([^']+)'/) || [])[1], wt = (body.match(/font-weight: (\d+)/) || [])[1];
  if (!url || !fam) continue;
  const file = `${fam.replace(/\s+/g, '')}-${wt}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(resolve(here, 'fonts', file), buf); n++;
  out += body.replace(url, 'fonts/' + file).trim() + '\n';
}
writeFileSync(resolve(here, 'fonts.css'), out);
console.log(`fonts: ${n} files saved in fonts/, fonts.css written`);
