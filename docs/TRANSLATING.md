# Translating Kōkua

Every language except English starts as a **machine draft**. Drafts are marked
`"status": "machine"` in [`src/i18n/translation-status.json`](../src/i18n/translation-status.json),
and while a language has any machine strings the app shows a "this is a machine draft"
notice. Safety instructions (keys starting with `safety.`) are never shown from a draft:
the app shows the English original until a person reviews that string.

## Reviewing a language (native speakers)

1. Open `src/i18n/locales/<code>.json` next to `src/i18n/locales/en.json`.
2. Fix any string that is wrong or unnatural. Keep every `{{placeholder}}` exactly as it
   is (for example `{{gallons}}`, `{{time}}`). A test fails if one goes missing.
3. In `translation-status.json`, change each string you checked to
   `{ "status": "reviewed", "by": "Your Name", "date": "YYYY-MM-DD" }`.
4. Run `npm test`.

Safety strings matter most. Review the `safety.*` keys first.

## Adding a new language

```bash
npm run i18n:new -- chk     # creates src/i18n/locales/chk.json from English
```

Translate every string in the new file, add the language to `LANGUAGES` in
[`src/i18n/languages.ts`](../src/i18n/languages.ts), and run `npm test`.

### Wanted: Chuukese (`chk`) and Marshallese (`mh`)

Both are planned. The AI assistant used for this project did not produce drafts for
them, because its output in these languages would not have been reliable enough for an
emergency app. They need a human translator.

## Current languages

| Code      | Language       | State                     |
| --------- | -------------- | ------------------------- |
| `en`      | English        | Source                    |
| `haw`     | ʻŌlelo Hawaiʻi | Machine draft, unreviewed |
| `ilo`     | Ilokano        | Machine draft, unreviewed |
| `tl`      | Tagalog        | Machine draft, unreviewed |
| `ja`      | 日本語         | Machine draft, unreviewed |
| `zh-Hant` | 繁體中文       | Machine draft, unreviewed |
| `ko`      | 한국어         | Machine draft, unreviewed |
| `vi`      | Tiếng Việt     | Machine draft, unreviewed |
