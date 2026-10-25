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

async function layer(base) {
  console.log(`\n===== ${base} =====`);
  const m = JSON.parse((await get(`${base}?f=json`)).text);
  console.log({ name: m.name, geometryType: m.geometryType, maxRecordCount: m.maxRecordCount, copyright: m.copyrightText, description: strip(m.description).slice(0, 1200), editingInfo: m.editingInfo });
  if (m.layers) console.log('layers:', m.layers.map((l) => `${l.id} ${l.name}`).join(' | '));
  if (!m.fields) return;
  console.log('fields:', m.fields.map((f) => `${f.name}:${f.type.replace('esriFieldType', '')}${f.domain ? `{${f.domain.codedValues?.map((c) => `${c.code}=${c.name}`).join(',')}}` : ''}`).join(', '));
  console.log('count:', (await get(`${base}/query?where=1%3D1&returnCountOnly=true&f=json`)).text);
  const sample = JSON.parse((await get(`${base}/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=4&f=json`)).text);
  console.log(JSON.stringify(sample.features, null, 1).slice(0, 5000));
  for (const field of ['TYPE', 'Type', 'type', 'SHELTER_TYPE', 'Shelter_Type', 'CATEGORY', 'Category', 'STATUS', 'Status', 'HAZARD', 'Hazard']) {
    if (!m.fields.some((f) => f.name === field)) continue;
    const s = await get(`${base}/query?where=1%3D1&groupByFieldsForStatistics=${field}&outStatistics=${encodeURIComponent(JSON.stringify([{ statisticType: 'count', onStatisticField: m.objectIdField ?? 'OBJECTID', outStatisticFieldName: 'n' }]))}&f=json`);
    console.log(`values of ${field}:`, s.text.slice(0, 1500));
  }
}

async function item(query) {
  console.log(`\n===== item search: ${query} =====`);
  const s = JSON.parse((await get(`https://www.arcgis.com/sharing/rest/search?q=${encodeURIComponent(query)}&num=5&f=json`)).text);
  for (const r of s.results ?? []) {
    const d = JSON.parse((await get(`https://www.arcgis.com/sharing/rest/content/items/${r.id}?f=json`)).text);
    console.log({ id: r.id, title: d.title, owner: d.owner, type: d.type, url: d.url, modified: new Date(d.modified).toISOString(), snippet: d.snippet, license: strip(d.licenseInfo).slice(0, 800), access: strip(d.accessInformation).slice(0, 400), description: strip(d.description).slice(0, 1500) });
  }
}

await layer('https://services.arcgis.com/tNJpAOha4mODLkXz/arcgis/rest/services/Public_Safety/FeatureServer');
await layer('https://services.arcgis.com/tNJpAOha4mODLkXz/arcgis/rest/services/Public_Safety/FeatureServer/5');
await item('title:"Potential Emergency Shelters" owner:holisgis');
await item('title:"Public Safety" owner:holisgis');
await layer('https://services1.arcgis.com/x4h61KaW16vFs7PM/arcgis/rest/services/Potential_Emergency_Shelters_PDC/FeatureServer/0');
await item('Potential_Emergency_Shelters_PDC');
