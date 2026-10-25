// Saves real api.weather.gov responses as unit-test fixtures (public domain, U.S.
// Government work). Only writes files that don't exist yet, so tests stay stable.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { getJson, today } from './lib.mjs';

const dir = 'src/features/alerts/fixtures';
mkdirSync(dir, { recursive: true });
const targets = [
  ['nws-active-HI.json', 'https://api.weather.gov/alerts/active?area=HI'],
  // Recent alerts including expired ones, for more variety (updates, cancellations).
  ['nws-recent-HI.json', 'https://api.weather.gov/alerts?area=HI&limit=50'],
];
for (const [name, url] of targets) {
  const path = `${dir}/${name}`;
  if (existsSync(path)) {
    console.log(`${path}: exists, kept`);
    continue;
  }
  const json = await getJson(url, 'application/geo+json');
  json._capture = { url, date: today(), note: 'Real NWS response saved as a test fixture.' };
  writeFileSync(path, JSON.stringify(json, null, 1) + '\n');
  console.log(`${path}: ${json.features?.length} features`);
  const kinds = {};
  for (const f of json.features ?? []) {
    const k = `${f.properties.event} / ${f.properties.messageType} / refs=${f.properties.references?.length ?? 0}`;
    kinds[k] = (kinds[k] ?? 0) + 1;
  }
  console.log(kinds);
}
