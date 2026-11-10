# CLAUDE.md — Bhukkad Republic

## Hard rules
- **Never deploy, publish, push, or create accounts** (Netlify, Vercel, GitHub repos, etc.) without asking the owner first.
- **Every history claim needs exactly one label and at least one source.** Labels: `DOCUMENTED`, `TRADITIONAL`, `DISPUTED`, `UNKNOWN`. When unsure, pick the weaker label.
- **Never invent history, dates, sources or places.** If you add content, cite a real source and mark it `checked: false` so an editor reviews it.
- All text must be original writing. Images only if openly licensed (e.g. Wikimedia Commons) with credit + licence shown.
- Pure vegetarian site. Bebinca contains egg and is flagged — keep diet badges accurate.

## Design
- Look: truck-art meets neo-brutalism (tiffin yellow, hot pink, electric blue, chunky ink borders, hard shadows), light + dark mode.
- Read `CONCEPT.md` for the pitch, vocabulary and tone. It is a fun, imaginary country: the "just for fun" footer tag stays on every page.
- Mobile first (audience 16 to 50, mostly phones). No sideways scroll at 360px.

## Content model
- `content/*.json` is the source of truth. Dishes link to ingredients (`role: defining | optional`), states, places, sources, related dishes.
- "How old can it be?" box: a dish can't be older than the arrival in India of its newest **defining** ingredient. Native ingredients never set a limit. Undated arrivals are left out and said so.
- Places: show last-verified date; flag after 12 months, hide after 18. No data copied from Zomato, Swiggy, Google or TasteAtlas.

## Owner context
- Owner is a CSE student; explain non-obvious tech choices in plain words in the README.
- Docs/notes should be short, simple markdown.
