# Bhukkad Republic

**A fun, imaginary food country.** Get your passport, post what you cooked or ate, read how your favourite dishes began,
and catch the latest in the Daily Tadka.

> Just for fun. The Bhukkad Republic is not a real country, government, political party or official body. The passport is a
> profile card, not a travel document. We respect every nation's sovereignty and food heritage.

Read **`MEM.md`** (how we built it, what is done, what is next), **`CONCEPT.md`** (pitch, words we use, what each page is for, the "just for fun" rules) and **`CLAUDE.md`** (content rules).

## What's inside
- **Dish files** (`#/dishes`): 298 dishes. Each file has its history (every fact carries a stamp and a source), styles/recipes,
  the journey of its ingredients, and "What citizens cooked". Stamps: **Cleared** (documented), **Folk tale** (traditional),
  **Under review** (disputed), **Unknown**.
- **Bhukkad Chowk** (`#/chowk`): post what you made or ate (and where), ask for help, share hacks. Citizen posts are unverified.
- **My Passport** (`#/passport`): a fun profile with a stamp for every dish you cook, eat or try.
- **Parliament** (`#/parliament`, `#/seats`): suggestion box ("bills"), 50 seats, 10 cabinet ministries. Head of the Republic:
  **The Great Bhukkad**. All rules are drafts.
- **Daily Tadka** (`#/myths`): Republic news and events, top plates, dish file of the day, fact checks.
- **Fun** (`#/fun`): Origin quiz, Kitchen check, Hostel Pradesh, baggage claim. Light and dark mode.

## Run it
```bash
python -m http.server 8010 --bind 0.0.0.0     # then open http://localhost:8010
```
To see it on a phone on the same Wi-Fi, open `http://<this computer's IPv4 address>:8010`.

## Rebuild after changing content
```bash
node build-data.mjs      # checks the data (stops on any problem) and writes data.js
node build-seo.mjs       # writes a plain page per dish at /dish/<slug>/ for search engines
node find-photos.mjs     # optional, slow: finds openly licensed photos (then run build-data again)
node fetch-fonts.mjs     # optional: re-downloads the self-hosted fonts
```
Put your domain in `site.json` (`"siteUrl": "https://..."`) so `build-seo.mjs` also writes `sitemap.xml` and canonical links.

## Files
| Path | What |
|---|---|
| `content/` | The source data: dishes, ingredients, states, myths, places, sources, batch imports, bowl colours |
| `hostel.json` | Hostel Pradesh: fun, unsourced "hostel lore", always labelled so |
| `index.html`, `styles.css`, `app.js` | The app shell, styles and main screens |
| `chowk*.js`, `plates.js` | The community |
| `passport*.js`, `seats.js`, `tadka.js`, `about.js`, `pages-info.js` | Passport, Parliament, Daily Tadka, About, Fun |
| `theme.js`, `totop.js` | Dark mode, back-to-top button |
| `validate.mjs` | The data check used by `build-data.mjs` |
| `photos.json`, `photo-skip.json` | Photo matches and the ones a person rejected |
| `dish/`, `robots.txt` | Generated pages for search engines |
| `fonts/`, `fonts.css` | Self-hosted fonts (SIL Open Font License) |

## Status: preview
- No server yet. Passports, plates, comments and bills are saved only in the visitor's own browser.
- Before going public: accounts, a server, moderation, a contact address, and a lawyer's check of the names
  Republic, Parliament and Passport, of user content and children's data, and of photo licences.
- Photos are matched automatically from Wikipedia lead images (CC BY, CC BY-SA, CC0 or public domain only), credited on the page,
  and marked `reviewed: false` until an editor checks them. They are hotlinked from Wikimedia for now.
