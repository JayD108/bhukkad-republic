# MEM.md: how we built the Bhukkad Republic

A short memory of how we worked, what is done, and what we were planning. Newest decisions win.

## How we worked
- **The owner decides, Claude builds.** Every big idea (theme, names, rules) was proposed, the owner picked, then it was built.
- **Phases.** We stopped building, did a full self-review, then fixed things in phases instead of adding features forever.
- **Test everything in a real browser.** Each change was checked with headless Chrome: every page opened (360px and 320px wide,
  light and dark), JS errors counted, screenshots looked at. If it was not tested, we said so.
- **Never invent facts.** History needs a stamp and a source. Fun content (Hostel Pradesh, the Republic's jokes) is labelled as fun.
- **Look at the data, not just the code.** Auto-matched photos were checked by eye: a "Chicken Korma" photo, a fish photo and
  generic thalis were rejected (`photo-skip.json`).
- **Small files, small steps.** Long single edits sometimes got cut off, so big features were split into small files.
- **Ask before anything public.** Pushing to GitHub happened only when the owner asked. The repo is private.

## How the idea changed
1. **Thalipedia / The Taste Archives** (the owner's start): a sourced encyclopedia of Indian veg dishes. Built first in Astro
   (`the-taste-archives/site`, now on hold).
2. **Thali Passport Office** (design concept B): a funky passport/immigration theme. The owner loved it; it became the main design.
3. **Bhukkad Republic** (now): a fun, imaginary food country. Community first (Gen Z), history as the reading layer.
   - Dropped: "explore the states of India", dish passports, the words immigrant/detained, the rotating emblem on home.
   - Kept: dish history with sources, the passport look (now for people), stamps, the fun Parliament.

## What is done
- **Dish files** (298): history with stamps (Cleared / Folk tale / Under review / Unknown) and sources, styles/recipes,
  ingredient journeys, date of birth, "What citizens cooked", photos with credits (70 dishes).
- **Bhukkad Chowk**: post "I made it" or "I ate it" (with where), help, hacks, ideas; yum, "I tried this", comments.
  Citizen posts are marked unverified. Points with daily caps; official-looking handles are blocked.
- **My Passport**: fun profile card with a stamp for every dish you cook, eat or try.
- **Parliament**: suggestion box (bills), 50 seats, 10 cabinet ministries (Udhaar Management, Spice Control and more).
  A seat needs 10 points and one accepted, sourced contribution. Head: **The Great Bhukkad**; footer tag: Supreme Commander.
- **Daily Tadka**: Republic news and events, top plates, dish file of the day, fact checks.
- **Fun**: Origin quiz, Kitchen check, Hostel Pradesh (14 hostel dishes), baggage claim, share-as-picture dish card.
- **Quality**: dark mode, back-to-top, 404 page, scroll memory, contrast fixed, one h1 per page, data check that stops the build,
  self-hosted fonts, favicon and share image, 298 static pages for search engines.
- **"Just for fun" everywhere**: footer tag on every page, About page, passport and dish-file covers. No real country code,
  flag or passport layout (our fake code is `XBK`; we had used `BHR` by mistake, which is Bahrain).

## What we were planning
- **Phase 3 (needed before going public):** accounts, a server for posts and bills, moderation (reports, removal),
  a contact address, real seat counting, and a lawyer's check of the names Republic / Parliament / Passport,
  user content, children's data (India's DPDP Act) and photo licences.
- **Phase 4:** real sourced recipes and styles per dish (`content/versions/<dish>.json`), photos reviewed by an editor,
  more Daily Tadka news, choosing the 10 ministers.
- **Hosting:** pick a host and a domain, then set `siteUrl` in `site.json` and rerun `node build-seo.mjs` for the sitemap.
- **Open questions:** public or private repo; the 6 states missing for 15 batch dishes; 72 batch dishes without a source.

## Where things are
- Code: this repo (`JayD108/bhukkad-republic`). Concept and words: `CONCEPT.md`. Content rules: `CLAUDE.md`. How to run: `README.md`.
- Old Astro version: `Project Proximity/the-taste-archives/` on the owner's laptop (not on GitHub).
