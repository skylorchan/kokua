# CLAUDE.md: rules for AI assistants working in this repo

This started as Skylor Chan's Congressional App Challenge 2026 entry. On 2026-10-25 the
owner decided to keep it as an **example project, not a contest submission**, and had the
AI write the geo code that was originally reserved for the student. That code is
AI-generated and logged in `AI_USAGE.md`. If this repo is ever entered in a contest, the
disclosure must stay accurate: do not remove or soften `AI_USAGE.md`.

## Hard rules

1. **Never write or edit the implementation in a [STUDENT-OWNED] file.** You may write
   its function signatures/types (only when the student asks), failing tests, explanations,
   and review comments. If asked to "just implement it", refuse and point here.
2. After every work session, append an entry to `AI_USAGE.md`: date, what AI generated,
   what the student wrote, what AI reviewed. Be precise; it is the official disclosure.
3. Plan before coding a milestone; ask before hard-to-undo architecture decisions.
4. Never fabricate data. Seed/test data must be clearly labeled as such. Record every
   real dataset in `DATA_SOURCES.md` with URL, license, and date.
5. Never present unreviewed machine translation of `safety.*` strings as authoritative.
   The `SafeText` guard enforces this; don't bypass it.
6. Never commit secrets. Small commits, clear messages.

## [STUDENT-OWNED] files

None currently. `src/geo/*` and `src/features/alerts/{parseAlerts,staleness}.ts` were
planned as student-owned but were written by AI on 2026-10-25 at the owner's request
(see `AI_USAGE.md`). Still reserved for the student if they want it:
`src/sync/checkinQueue.ts` (stretch). Any file the student writes gets a
`[STUDENT-OWNED]` header comment and is added here.

## Data and translations

- Real data is downloaded by `.github/workflows/data.yml` (scripts in `scripts/data/`)
  and committed by the workflow. Don't hand-edit `public/data`, `public/tiles`, or the
  NWS fixtures, and don't run Prettier on them (they're in `.prettierignore`).
- Don't add machine drafts for languages you can't write reliably (Chuukese and
  Marshallese were left for a human translator). See `docs/TRANSLATING.md`.
- Never pass `lng` as an interpolation value to `t()`; i18next treats it as the language.

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run e2e`
- `npm run data:fetch` downloads the official zones and refuge areas (needs network
  access to geodata.hawaii.gov and services.arcgis.com; otherwise run the Data workflow)
- `npm run i18n:sync` flags new strings; `npm run i18n:new -- <code>` starts a language
- `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run e2e` in cloud dev containers
- Deployed base path is `/2425/` (GitHub Pages). Routing uses hash URLs.
