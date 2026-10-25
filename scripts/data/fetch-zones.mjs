// Downloads the official tsunami evacuation zones from the Hawaiʻi Statewide GIS
// Program and writes public/data/zones.geojson in the shape the app expects.
// Field names checked against the live service on 2026-10-25.
import { arcgisGeoJson, bbox, islandName, today, writeCollection } from './lib.mjs';

const SERVICE = 'https://geodata.hawaii.gov/arcgis/rest/services/Hazards/MapServer';
const LAYERS = [
  { id: 2, kind: 'tsunami' }, // "For any Tsunami Warning evacuate out of these areas."
  { id: 12, kind: 'extreme-tsunami' }, // "Evacuate out of these areas for an Extreme Tsunami Warning."
];

const features = [];
for (const { id, kind } of LAYERS) {
  const raw = await arcgisGeoJson(`${SERVICE}/${id}`, {
    outFields: 'objectid,island,zone_type,zone_code',
    // ~1 m simplification (units follow outSR, so degrees) and ~10 cm precision. The
    // raw layers are many MB; this keeps the download small without moving any edge
    // by more than about a meter.
    maxAllowableOffset: '0.00001',
    geometryPrecision: '6',
  });
  let kept = 0;
  for (const f of raw) {
    if (!f.geometry || !['Polygon', 'MultiPolygon'].includes(f.geometry.type)) continue;
    const p = f.properties ?? {};
    features.push({
      type: 'Feature',
      properties: { id: `${kind}-${p.objectid}`, name: islandName(p.island), kind },
      geometry: f.geometry,
    });
    kept++;
  }
  console.log(`layer ${id} (${kind}): ${kept} of ${raw.length} features`);
}
if (features.length === 0) throw new Error('No features downloaded; refusing to overwrite.');

writeCollection(
  'public/data/zones.geojson',
  {
    sample: false,
    source:
      'Hawaiʻi Statewide GIS Program: Tsunami Evacuation Zones and Extreme Tsunami Evacuation Zones (Oʻahu: City and County of Honolulu, April 2025; Hawaiʻi Island: County of Hawaiʻi, March 2025, corrected November 2025; Kauaʻi: County of Kauaʻi, March 2025; Maui, Molokaʻi, Lānaʻi: County of Maui, 2013)',
    retrieved: today(),
    coverage: bbox(features, 0.05),
  },
  features,
);
