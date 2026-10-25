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

const HNL = 'https://services.arcgis.com/tNJpAOha4mODLkXz/arcgis/rest/services/Potential_Emergency_Shelter_Edit_EOC/FeatureServer';
await layer(HNL);
const svcMeta = await j(`${HNL}?f=json`);
for (const l of svcMeta.layers ?? []) {
  await layer(`${HNL}/${l.id}`);
  const m = await j(`${HNL}/${l.id}?f=json`);
  for (const f of m.fields ?? []) {
    if (!['esriFieldTypeString', 'esriFieldTypeSmallInteger', 'esriFieldTypeInteger'].includes(f.type)) continue;
    const g = await j(`${HNL}/${l.id}/query?where=1%3D1&groupByFieldsForStatistics=${f.name}&outStatistics=${encodeURIComponent(JSON.stringify([{ statisticType: 'count', onStatisticField: m.objectIdField ?? 'OBJECTID', outStatisticFieldName: 'n' }]))}&f=json`);
    const vals = g.features?.map((x) => `${x.attributes[f.name]}=${x.attributes.n}`) ?? [];
    if (vals.length && vals.length <= 25) console.log(`  ${f.name} (${f.alias}):`, vals.join(' | '));
    else console.log(`  ${f.name} (${f.alias}): ${vals.length} distinct`);
  }
}
const itemInfo = await j('https://www.arcgis.com/sharing/rest/content/items/5dcbab301711462e8cdaf0a3b69436d6?f=json');
console.log('item:', { title: itemInfo.title, snippet: itemInfo.snippet, license: strip(itemInfo.licenseInfo).slice(0, 800), access: strip(itemInfo.accessInformation), description: strip(itemInfo.description).slice(0, 2500), tags: itemInfo.tags });
const viewer = await j('https://www.arcgis.com/sharing/rest/content/items/14fad086020b4bc8acfcf2e3f79d4329?f=json');
console.log('viewer:', { title: viewer.title, snippet: viewer.snippet, license: strip(viewer.licenseInfo).slice(0, 600), description: strip(viewer.description).slice(0, 1500) });
const webmap = await j('https://www.arcgis.com/sharing/rest/content/items/16333aa20e724847a53824988c2c18b1/data?f=json');
console.log('webmap layers:', JSON.stringify(webmap.operationalLayers?.map((l) => ({ title: l.title, url: l.url, filter: l.layerDefinition?.definitionExpression }))));
await layer('https://services1.arcgis.com/x4h61KaW16vFs7PM/arcgis/rest/services/Potential_Emergency_Shelters_PDC/FeatureServer/36');
