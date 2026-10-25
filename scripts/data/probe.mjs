// Prints the schema and size of every external dataset the app might use, so the fetch
// scripts can be written against real field names. Runs in CI (the dev container
// can't reach these hosts). Output goes to the job log.
const UA = { 'User-Agent': 'kokua-data (github.com/skylorchan/2425)' };

async function get(url, accept = 'application/json') {
  try {
    const res = await fetch(url, { headers: { ...UA, Accept: accept } });
    const text = await res.text();
    return { status: res.status, text };
  } catch (e) {
    return { status: 0, text: String(e) };
  }
}

function section(title) {
  console.log(`\n===== ${title} =====`);
}

async function arcgisLayer(base) {
  section(base);
  const meta = await get(`${base}?f=json`);
  if (meta.status !== 200) return console.log('meta', meta.status, meta.text.slice(0, 300));
  const m = JSON.parse(meta.text);
  console.log({
    name: m.name,
    type: m.type,
    geometryType: m.geometryType,
    maxRecordCount: m.maxRecordCount,
    formats: m.supportedQueryFormats,
    copyright: m.copyrightText,
    description: (m.description ?? '').replace(/<[^>]+>/g, ' ').slice(0, 800),
  });
  console.log('fields:', (m.fields ?? []).map((f) => `${f.name}:${f.type}`).join(', '));
  if (m.layers) console.log('sublayers:', m.layers.map((l) => `${l.id} ${l.name}`).join(' | '));
  if (!m.geometryType) return;
  const count = await get(`${base}/query?where=1%3D1&returnCountOnly=true&f=json`);
  console.log('count:', count.text.slice(0, 200));
  const hi = await get(
    `${base}/query?where=1%3D1&geometry=-161,18.5,-154.5,22.5&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json`,
  );
  console.log('count in Hawaii bbox:', hi.text.slice(0, 200));
  const sample = await get(
    `${base}/query?where=1%3D1&geometry=-161,18.5,-154.5,22.5&geometryType=esriGeometryEnvelope&inSR=4326&outFields=*&returnGeometry=false&resultRecordCount=3&f=json`,
  );
  try {
    console.log('sample attrs:', JSON.stringify(JSON.parse(sample.text).features?.map((f) => f.attributes), null, 1).slice(0, 3000));
  } catch {
    console.log('sample:', sample.text.slice(0, 500));
  }
  const info = await get(`${base.replace(/\/\d+$/, '')}/info/iteminfo?f=json`);
  if (info.status === 200) {
    try {
      const i = JSON.parse(info.text);
      console.log('iteminfo license:', (i.licenseInfo ?? '').replace(/<[^>]+>/g, ' ').slice(0, 600));
      console.log('iteminfo accessInfo:', (i.accessInformation ?? '').slice(0, 300));
    } catch {}
  }
}

// Tsunami layers: zones, all zones incl. safe zones, extreme zones.
for (const id of [2, 11, 12]) await arcgisLayer(`https://geodata.hawaii.gov/arcgis/rest/services/Hazards/MapServer/${id}`);
await arcgisLayer('https://geodata.hawaii.gov/arcgis/rest/services/Hazards/MapServer');

// Look for anything shelter-like on the state server.
section('geodata.hawaii.gov folders and services');
const root = await get('https://geodata.hawaii.gov/arcgis/rest/services?f=json');
console.log(root.text.slice(0, 2000));
for (const svc of ['EmergMgmtPubSafety/MapServer', 'Infrastructure/MapServer', 'ParcelsZoning/MapServer']) {
  const r = await get(`https://geodata.hawaii.gov/arcgis/rest/services/${svc}?f=json`);
  try {
    console.log(svc, JSON.parse(r.text).layers?.map((l) => `${l.id} ${l.name}`).join(' | '));
  } catch {
    console.log(svc, r.status, r.text.slice(0, 200));
  }
}

// HIFLD National Shelter System Facilities (FEMA / American Red Cross).
await arcgisLayer('https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Critical_Infrastructure_Map_Service/FeatureServer/0');

// ArcGIS Hub search for Hawaiʻi shelter datasets.
section('hub search');
for (const q of ['shelter honolulu', 'emergency shelter hawaii', 'tsunami refuge hawaii']) {
  const r = await get(`https://hub.arcgis.com/api/search/v1/collections/dataset/items?q=${encodeURIComponent(q)}&limit=15`);
  try {
    const j = JSON.parse(r.text);
    for (const f of j.features ?? [])
      console.log(`[${q}]`, f.properties?.title, '|', f.properties?.owner, '|', f.properties?.modified, '|', f.properties?.url ?? f.links?.[0]?.href);
  } catch {
    console.log(q, r.status, r.text.slice(0, 200));
  }
}

// NWS alerts.
section('NWS active alerts HI');
const active = await get('https://api.weather.gov/alerts/active?area=HI', 'application/geo+json');
console.log('status', active.status);
try {
  const j = JSON.parse(active.text);
  console.log('top keys:', Object.keys(j), 'features:', j.features?.length, 'updated:', j.updated);
  if (j.features?.[0]) console.log(JSON.stringify(j.features[0], null, 1).slice(0, 4000));
} catch {
  console.log(active.text.slice(0, 500));
}
section('NWS recent alerts HI');
const recent = await get('https://api.weather.gov/alerts?area=HI&limit=8', 'application/geo+json');
try {
  const j = JSON.parse(recent.text);
  for (const f of j.features ?? [])
    console.log(f.properties.event, '|', f.properties.status, '|', f.properties.messageType, '|', f.properties.severity, '|', f.properties.sent, '|', f.properties.expires, '| geom:', f.geometry?.type ?? null);
} catch {
  console.log(recent.status, recent.text.slice(0, 500));
}

// Protomaps builds.
section('Protomaps builds');
const builds = await get('https://build-metadata.protomaps.dev/builds.json');
console.log(builds.status, builds.text.slice(-600));
