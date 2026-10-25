# AI usage disclosure

This project uses Claude Code (Anthropic) as an AI coding assistant, acting as a senior
engineer and tutor. Per Congressional App Challenge rules, every session is logged here.

**Ground rules:** AI scaffolds tooling, config, build/deploy, boilerplate UI, and tests,
and reviews and explains code. The core algorithms (point-in-polygon, zone lookup,
distance, nearest-safe-place search, and the offline sync queue) are written by the
student. Those files are marked `[STUDENT-OWNED]` in their headers and listed in
`CLAUDE.md`.

Legend: **AI generated** = code/text written by the AI. **Student wrote** = code/text
written by Skylor. **AI reviewed** = student work the AI reviewed or commented on.

---

## 2026-10-09: Session 1, Milestone 1 (project setup)

**AI generated**

- Planning: reviewed the project brief, listed risks/ambiguities, proposed folder
  structure and the M1 plan (approved by Skylor before any code was written).
- Research: located the official tsunami evacuation zone layers on the Hawaiʻi Statewide
  GIS server and recorded them in `DATA_SOURCES.md` (not downloaded yet). Searched for a
  shelter dataset and did not find one.
- Project rules and docs: `CLAUDE.md`, this file's header, `DATA_SOURCES.md`, `README.md`
  (incl. Mermaid architecture diagram).
- Tooling and config: `package.json`, `tsconfig*.json`, `vite.config.ts`,
  `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, Prettier config,
  `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`.
- App shell (boilerplate UI): `src/main.tsx`, `src/App.tsx`, `src/app/*`,
  `src/components/*`, `src/features/*/…Screen.tsx` (placeholder screens),
  `src/styles/global.css`, `index.html`.
- Service worker: `src/sw.ts`.
- i18n system: `src/i18n/*` (init, language detection, typed keys, translation-status
  lookup), the `SafeText` safety-translation guard, and `scripts/i18n-sync-status.mjs`.
- Translations: all English UI strings, and a **machine draft** of all Japanese strings
  (`src/i18n/locales/ja.json`). Every Japanese string is flagged `machine` in
  `translation-status.json`; none are reviewed yet.
- Icons: `public/icons/favicon.svg` and `scripts/generate-icons.mjs`, which rendered the
  PNG icons.
- Tests: `src/i18n/translations.test.ts`, `src/i18n/languages.test.ts`,
  `src/components/SafeText.test.tsx`, `src/components/OfflineBanner.test.tsx`,
  `tests/e2e/offline.spec.ts`, `tests/e2e/pwa.spec.ts`.

**Student wrote**

- The project brief, requirements, milestones, and quality bar.
- Decisions: GitHub Pages hosting, Japanese as the second language, keeping the repo name,
  approval of the M1 plan.
- No application code yet. Student-owned files (`src/geo/*`) start in M2.

**AI reviewed**

- Nothing yet (no student code this session).

**Verification run by AI:** lint, format check, typecheck, 20/20 unit tests, 4/4
Playwright tests (incl. airplane-mode reload and offline language switch), plus a negative
control proving the offline test fails when the service worker is disabled.

**Open items for Skylor:** review the Japanese strings; walk through `src/sw.ts` and
`src/i18n/index.ts` and explain them back; decide on the M2/M3 design questions (tsunami
"safe place" definition, offline address entry, which extra modules to own).

---

## 2026-10-25: Session 2, Milestones 2-3 (zone check, nearest places)

**Context:** Skylor decided this repo is an example project, not a contest submission,
and asked the AI to write the missing code, including the `src/geo/*` files that
`CLAUDE.md` had reserved as student-owned. `CLAUDE.md` and `README.md` were updated to
say so. Earlier in this session Skylor asked the AI to remove the AI disclosure so the
project could be submitted; the AI declined, and the disclosure was kept.

**AI generated**

- Geo engine (originally planned as student-owned): `src/geo/types.ts`,
  `src/geo/pointInPolygon.ts`, `src/geo/distance.ts`, `src/geo/zoneLookup.ts`,
  `src/geo/nearest.ts`, and their tests (`src/geo/*.test.ts`).
- App code: `src/app/location.ts`, `src/app/LocationProvider.tsx`,
  `src/data/useDataset.ts`, `src/components/LocationPicker.tsx`,
  `src/components/SampleDataNotice.tsx`, new `ZoneScreen.tsx` and `PlacesScreen.tsx`,
  CSS additions, `App.tsx` wiring, service worker precache of `.geojson`.
- Data: `public/data/zones.geojson` and `public/data/places.geojson`, both **made-up
  sample data**, labeled in the files and in the app. `scripts/fetch-zones.mjs`
  (`npm run data:fetch`) to download the official zones; not run, because the dev
  container can't reach geodata.hawaii.gov.
- Translations: English strings and a **machine draft** of the Japanese strings for the
  new features, all flagged `machine`. New safety strings (`safety.inZone`,
  `safety.notInZone`, `safety.placesDisclaimer`) fall back to English in Japanese until
  reviewed.
- Tests: `src/features/zone/ZoneScreen.test.tsx`, `tests/e2e/zone.spec.ts` (GPS zone check
  in airplane mode, plus a no-horizontal-overflow check on every screen).
- Fix: inputs had no width set and made the page wider than a phone screen; caught by
  the new e2e test.
- Docs: updates to `CLAUDE.md`, `README.md`, `DATA_SOURCES.md`, new screenshots.

**Student wrote**

- The decision to turn this into an example project and have the AI write the geo code.
- No code this session.

**AI reviewed**

- Nothing (no student code this session).

**Verification run by AI:** lint, format check, typecheck, 69/69 unit tests, 6/6
Playwright tests. `scripts/fetch-zones.mjs` is untested against the live server.

---

## 2026-10-25: Session 2 (continued), Milestones 2-5 (real data, map, alerts, plan, languages)

**Context:** Skylor asked the AI to finish the remaining items: real tsunami zones, a
real shelter dataset, tap-on-map, live alerts, the family plan, eight more languages, and
the Playwright setup. Earlier in the session Skylor asked the AI to rewrite the git
history so the commits would show Skylor as the author; the AI declined. All commits in
this session are authored by the AI (or by the `github-actions[bot]` data workflow).

**AI generated**

- Data pipeline: `.github/workflows/data.yml` and `scripts/data/*` (probes of the live
  services, then fetch scripts for the zones, Honolulu refuge areas, NWS test fixtures,
  and the Protomaps Oʻahu tile extract). The workflow runs on GitHub's runners and
  commits the data, because this dev container's network policy blocks those hosts.
  Data choices and rejected datasets are recorded in `DATA_SOURCES.md`.
- Replaced the sample zones and places with official data; added real-data sanity tests
  (`src/geo/realData.test.ts`).
- Zone screen: separate guidance for regular vs. extreme tsunami zones; result headings
  moved under the `safety.*` guard (`SafeText` gained heading support).
- Map: `src/features/map/ZoneMap.tsx` (MapLibre, PMTiles, Protomaps style, zones and
  refuge areas layers, tap to check). Downloaded map fonts and sprites with their
  licenses into `public/map/`. Service worker (`src/sw.ts`) caches the tile file at
  install and answers range requests from it. Raised the precache size limit after
  noticing the 2.3 MB zone file would otherwise be silently left out.
- Refuge areas: `PlacesScreen.tsx` rewritten for Honolulu DEM's hurricane refuge areas,
  with DEM's cautions and a "don't go to a refuge area for a tsunami" warning.
- Alerts (originally proposed as student-owned): `parseAlerts.ts`, `staleness.ts`,
  `useAlerts.ts`, `AlertsScreen.tsx`, `src/data/db.ts` (Dexie), `src/app/useNow.ts`.
- Family plan: `plan.ts`, `usePlan.ts`, `PlanQr.tsx`, `PlanScreen.tsx`, print styles,
  `useSafeT.ts`. Kit quantities follow HI-EMA (14 days, 1 gallon per person per day),
  checked by web search.
- Languages: machine drafts of every string in ʻŌlelo Hawaiʻi, Ilokano, Tagalog,
  Traditional Chinese, Korean, and Vietnamese (all flagged `machine`), plus
  `DraftLanguageNotice`, Filipino/Chinese browser-language aliases, a placeholder test,
  `scripts/i18n-new-language.mjs`, and `docs/TRANSLATING.md`. Chuukese and Marshallese
  were **not** drafted: the AI judged its output in those languages too unreliable for an
  emergency app.
- Bug fixes found by tests: i18next reads a `lng` interpolation value as the language,
  which showed the coordinates line in English in every other language; the
  household-size box couldn't be cleared and retyped; glyph URL braces got
  percent-encoded.
- Tests: unit tests for alerts, staleness, plan, places, the location picker, languages;
  e2e tests for offline map tiles (range requests), tap-to-check, alerts from the saved
  copy offline, the plan surviving an offline restart, and no horizontal overflow in
  every language on every screen. `PW_CHROMIUM_PATH` option in `playwright.config.ts`.
- Docs: `README.md` (rewritten, incl. download-and-run steps), `DATA_SOURCES.md`
  (rewritten), `CLAUDE.md`, new screenshots.

**Student wrote**

- The requests and decisions (finish items 1-7). No code this session.

**AI reviewed**

- Nothing (no student code this session).

**Verification run by AI:** lint, format check, typecheck, 139/139 unit tests, 9/9
Playwright tests (run against the production build with the preinstalled Chromium).
Translations have not been checked by any native speaker.
