// Shared helpers for the data scripts. These run in CI (see .github/workflows/data.yml).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const UA = { 'User-Agent': 'kokua-data (github.com/skylorchan/2425)' };

export async function getJson(url, accept = 'application/json') {
  const res = await fetch(url, { headers: { ...UA, Accept: accept } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`${url}: ${JSON.stringify(json.error)}`);
  return json;
}

/** All features of an ArcGIS layer as GeoJSON, following pagination. */
export async function arcgisGeoJson(layerUrl, params) {
  const features = [];
  for (let offset = 0; ;) {
    const url = new URL(`${layerUrl}/query`);
    url.search = new URLSearchParams({
      where: '1=1',
      outSR: '4326',
      f: 'geojson',
      orderByFields: 'objectid',
      resultOffset: String(offset),
      ...params,
    }).toString();
    const page = await getJson(url, 'application/geo+json');
    features.push(...(page.features ?? []));
    offset += page.features?.length ?? 0;
    const more = page.exceededTransferLimit || page.properties?.exceededTransferLimit;
    if (!more || !page.features?.length) break;
  }
  return features;
}

export function bbox(features, padDeg = 0) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (c) => {
    if (typeof c[0] === 'number') {
      box[0] = Math.min(box[0], c[0]);
      box[1] = Math.min(box[1], c[1]);
      box[2] = Math.max(box[2], c[0]);
      box[3] = Math.max(box[3], c[1]);
    } else c.forEach(visit);
  };
  for (const f of features) visit(f.geometry.coordinates);
  return [box[0] - padDeg, box[1] - padDeg, box[2] + padDeg, box[3] + padDeg].map(
    (n) => +n.toFixed(4),
  );
}

/**
 * Writes a FeatureCollection, but keeps the existing file (and its "retrieved" date)
 * when the features haven't changed, so re-running the job doesn't create noise commits.
 */
export function writeCollection(path, metadata, features) {
  if (existsSync(path)) {
    try {
      const old = JSON.parse(readFileSync(path, 'utf8'));
      if (!old.metadata?.sample && JSON.stringify(old.features) === JSON.stringify(features)) {
        console.log(`${path}: unchanged`);
        return;
      }
    } catch {}
  }
  const body = JSON.stringify({ type: 'FeatureCollection', metadata, features });
  writeFileSync(path, body + '\n');
  console.log(`${path}: ${features.length} features, ${(body.length / 1e6).toFixed(2)} MB`);
}

export const today = () => new Date().toISOString().slice(0, 10);

const ISLANDS = {
  NIIHAU: 'Niʻihau',
  KAUAI: 'Kauaʻi',
  OAHU: 'Oʻahu',
  MOLOKAI: 'Molokaʻi',
  LANAI: 'Lānaʻi',
  MAUI: 'Maui',
  KAHOOLAWE: 'Kahoʻolawe',
  HAWAII: 'Hawaiʻi Island',
};
export const islandName = (raw) =>
  ISLANDS[
    String(raw ?? '')
      .trim()
      .toUpperCase()
  ] ?? String(raw ?? '').trim();
