// Starts a new language: copies English into src/i18n/locales/<code>.json for a
// translator to overwrite, then flags every string as "machine" (unreviewed).
// Usage: npm run i18n:new -- chk
import { copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const code = process.argv[2];
if (!code || !/^[a-z]{2,3}(-[A-Za-z]{4})?$/.test(code)) {
  console.error('Usage: npm run i18n:new -- <language code, e.g. chk or mh>');
  process.exit(1);
}
const dest = new URL(`../src/i18n/locales/${code}.json`, import.meta.url);
if (existsSync(dest)) {
  console.error(`${code}.json already exists`);
  process.exit(1);
}
copyFileSync(new URL('../src/i18n/locales/en.json', import.meta.url), dest);
execFileSync('node', [new URL('./i18n-sync-status.mjs', import.meta.url).pathname], {
  stdio: 'inherit',
});
console.log(
  `Created src/i18n/locales/${code}.json. Next: add it to LANGUAGES in src/i18n/languages.ts.`,
);
