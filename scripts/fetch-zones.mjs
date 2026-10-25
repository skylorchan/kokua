// Downloads the official tsunami evacuation zones from the Hawaiʻi Statewide GIS
// Program and writes public/data/zones.geojson in the shape the app expects.
// Run on a machine that can reach geodata.hawaii.gov: `npm run data:fetch`.
// After running, update the "Retrieved" column in DATA_SOURCES.md.
import { writeFileSync } from 'node:fs';

const SERVICE = 'https://geodata.hawaii.gov/arcgis/rest/services/Hazards/MapServer';
const LAYERS = [
  { id: 2, kind: 'tsunami', label: 'Tsunami evacuation zone' },
  { id: 12, kind: 'extreme-tsunami', label: 'Extreme tsunami evacuation zone' },
];
const PAGE = 1000;

async function fetchLayer({ id, kind, label }) {
  const features = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = new URL(`${SERVICE}/${id}/query`);
    url.search = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      outSR: '4326',
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
    }).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Layer ${id}: HTTP ${res.status}`);
    const page = await res.json();
    if (page.error) throw new Error(`Layer ${id}: ${JSON.stringify(page.error)}`);
    for (const f of page.features ?? []) {
      if (!f.geometry || !['Polygon', 'MultiPolygon'].includes(f.geometry.type)) continue;
      const p = f.properties ?? {};
      const objectId = p.OBJECTID ?? p.objectid ?? f.id ?? features.length;
      const place = p.island ?? p.ISLAND ?? p.zone_name ?? p.NAME ?? p.name;
      features.push({
        type: 'Feature',
        properties: {
          id: `${kind}-${objectId}`,
          name: place ? `${label} (${place})` : label,
          kind,
        },
        geometry: f.geometry,
      });
    }
    if (!page.exceededTransferLimit && !page.properties?.exceededTransferLimit) break;
  }
  console.log(`Layer ${id} (${kind}): ${features.length} features`);
  return features;
}

function bbox(features) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const f of features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys)
      for (const [x, y] of poly[0]) {
        box[0] = Math.min(box[0], x);
        box[1] = Math.min(box[1], y);
        box[2] = Math.max(box[2], x);
        box[3] = Math.max(box[3], y);
      }
  }
  // Pad ~5 km so points just offshore of the last zone still count as covered.
  return [box[0] - 0.05, box[1] - 0.05, box[2] + 0.05, box[3] + 0.05].map((n) => +n.toFixed(4));
}

const features = (await Promise.all(LAYERS.map(fetchLayer))).flat();
if (features.length === 0) throw new Error('No features downloaded; refusing to overwrite.');
const out = {
  type: 'FeatureCollection',
  metadata: {
    sample: false,
    source: `Hawaiʻi Statewide GIS Program, ${SERVICE} (layers ${LAYERS.map((l) => l.id).join(', ')})`,
    retrieved: new Date().toISOString().slice(0, 10),
    coverage: bbox(features),
  },
  features,
};
writeFileSync(new URL('../public/data/zones.geojson', import.meta.url), JSON.stringify(out) + '\n');
console.log('Wrote public/data/zones.geojson');
