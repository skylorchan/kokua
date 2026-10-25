// Prints the schema of candidate shelter datasets. Output goes to the CI job log.
import { UA } from './lib.mjs';

async function get(url) {
  try {
    const res = await fetch(url, { headers: UA });
    return { status: res.status, text: await res.text() };
  } catch (e) {
    return { status: 0, text: String(e) };
  }
}
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const j = async (url) => {
  try {
    return JSON.parse((await get(url)).text);
  } catch {
    return {};
  }
};

async function search(q, n = 15) {
  console.log(`\n===== search: ${q} =====`);
  const s = await j(`https://www.arcgis.com/sharing/rest/search?q=${encodeURIComponent(q)}&num=${n}&sortField=modified&sortOrder=desc&f=json`);
  for (const r of s.results ?? [])
    console.log(`${new Date(r.modified).toISOString().slice(0, 10)} | ${r.type} | ${r.owner} | ${r.title} | ${r.url ?? ''} | ${r.id}`);
}

async function layer(base) {
  console.log(`\n===== ${base} =====`);
  const m = await j(`${base}?f=json`);
  if (m.error) return console.log('error', m.error);
  console.log({ name: m.name, geometryType: m.geometryType, copyright: m.copyrightText, lastEdit: m.editingInfo?.lastEditDate && new Date(m.editingInfo.lastEditDate).toISOString(), description: strip(m.description).slice(0, 600) });
  if (m.layers) {
    console.log('layers:', m.layers.map((l) => `${l.id} ${l.name}`).join(' | '));
    return;
  }
  console.log('fields:', (m.fields ?? []).map((f) => `${f.name}:${f.type.replace('esriFieldType', '')}`).join(', '));
  console.log('count:', (await get(`${base}/query?where=1%3D1&returnCountOnly=true&f=json`)).text);
  const sample = await j(`${base}/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=3&f=json`);
  console.log(JSON.stringify(sample.features, null, 1)?.slice(0, 3500));
}

await search('owner:holisgis shelter');
await search('owner:honolulugis shelter');
await search('shelter Oahu');
await search('"evacuation shelters" Hawaii');
await search('"emergency shelters" Honolulu');
await search('shelters Kauai OR Maui OR "Hawaii County"');
await layer('https://services1.arcgis.com/x4h61KaW16vFs7PM/arcgis/rest/services/Potential_Emergency_Shelters_PDC/FeatureServer');

// How old are the Hawaiʻi records in the FEMA / Red Cross National Shelter System layer?
const NSS = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Critical_Infrastructure_Map_Service/FeatureServer/0';
const stats = await j(`${NSS}/query?where=STATE%3D%27HI%27&outStatistics=${encodeURIComponent(JSON.stringify([{ statisticType: 'max', onStatisticField: 'CONTDATE', outStatisticFieldName: 'maxcont' }, { statisticType: 'max', onStatisticField: 'GEODATE', outStatisticFieldName: 'maxgeo' }, { statisticType: 'min', onStatisticField: 'GEODATE', outStatisticFieldName: 'mingeo' }, { statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'n' }]))}&f=json`);
const a = stats.features?.[0]?.attributes ?? {};
console.log('\nNSS HI:', { n: a.n, maxContact: a.maxcont && new Date(a.maxcont).toISOString(), geoRange: [a.mingeo && new Date(a.mingeo).toISOString(), a.maxgeo && new Date(a.maxgeo).toISOString()] });
for (const f of ['COUNTY', 'S_TYPE', 'ST_VERSION', 'AGENCY_OP']) {
  const g = await j(`${NSS}/query?where=STATE%3D%27HI%27&groupByFieldsForStatistics=${f}&outStatistics=${encodeURIComponent(JSON.stringify([{ statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'n' }]))}&f=json`);
  console.log(f, JSON.stringify(g.features?.map((x) => x.attributes)));
}
const svc = await j('https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Critical_Infrastructure_Map_Service/FeatureServer?f=json');
console.log('NSS service:', strip(svc.serviceDescription).slice(0, 600), '| copyright:', svc.copyrightText);
await search('"National Shelter System Facilities"', 5);
