// Downloads Oʻahu hurricane refuge areas from the City and County of Honolulu
// Department of Emergency Management and writes public/data/places.geojson.
// Field names checked against the live service on 2026-10-25. The layer's Status,
// Open_, and Close_ fields are ignored on purpose: an offline copy can't know whether
// a site is open right now, and the app must never imply that it is.
import { arcgisGeoJson, bbox, today, writeCollection } from './lib.mjs';

const LAYER =
  'https://services.arcgis.com/tNJpAOha4mODLkXz/arcgis/rest/services/Potential_Emergency_Shelter_Edit_EOC/FeatureServer/0';

const titleCase = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const raw = await arcgisGeoJson(LAYER, { outFields: 'OBJECTID,Name,Address,Place', orderByFields: 'OBJECTID' });
const features = raw
  .filter((f) => f.geometry?.type === 'Point' && String(f.properties?.Name ?? '').trim())
  .map((f) => {
    const p = f.properties;
    const town = titleCase(p.Place);
    const street = String(p.Address ?? '').trim();
    return {
      type: 'Feature',
      properties: {
        id: `hnl-refuge-${p.OBJECTID}`,
        name: String(p.Name).trim(),
        kind: 'hurricane-refuge',
        ...(street ? { address: town ? `${street}, ${town}` : street } : {}),
      },
      geometry: {
        type: 'Point',
        coordinates: f.geometry.coordinates.map((n) => +n.toFixed(6)),
      },
    };
  });
console.log(`refuge areas: ${features.length} of ${raw.length}`);
if (features.length < 10) throw new Error('Suspiciously few refuge areas; refusing to overwrite.');

writeCollection(
  'public/data/places.geojson',
  {
    sample: false,
    source: 'City and County of Honolulu Department of Emergency Management, Potential Hurricane Refuge Areas (updated August 2026)',
    retrieved: today(),
    // Oʻahu only; the layer covers no other island.
    coverage: [-158.3, 21.24, -157.63, 21.72],
  },
  features,
);
// Sanity check that every point is on Oʻahu.
const [w, s, e, n] = bbox(features);
if (w < -158.3 || e > -157.63 || s < 21.24 || n > 21.72) throw new Error(`Points outside Oʻahu: ${[w, s, e, n]}`);
