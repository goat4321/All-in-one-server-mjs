import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyCityGuidesV76} from '../lib/city-guides-v76.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel,placeProfileHtml} from '../public/place-profile.mjs';
import {googleMapsSearchUrl} from '../public/google-maps.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const archive=JSON.parse(await read('data/research-v76/city-details.json'));
const uploaded=JSON.parse(await read('data/research-v50/uploaded-interrail-2027-candidates.json'));
const catalog=await loadCatalog();
const cityIds=['paris','barcelona','sete','nice'];
test('V76 four-city guide archive covers all pre-existing active items without adding locations',()=>{
 assert.equal(archive.entries.length,24);
 assert.equal(archive.meta.entryCount,24);
 assert.deepEqual(Object.keys(archive.regions),cityIds);
 assert.equal(new Set(archive.entries.map(x=>x.id)).size,24);
 const stats=catalog.research.fourCityDetailsV76.stats;
 assert.equal(stats.sourceRules,24);
 assert.deepEqual(stats.missingRules,[]);
 assert.equal(stats.matchedRules,24);
 assert.ok(stats.covered>120);
 assert.ok(stats.specific>=24);
 assert.equal(stats.covered,stats.specific+stats.regional);
 for(const trip of catalog.trips){
  const targets=trip.items.filter(x=>cityIds.includes(x.city)
    &&x.kind!=='transport'&&!x.removed&&!x.duplicateOf&&x.name);
  assert.equal(stats.byTrip[trip.id].total,targets.length);
  for(const item of targets){
   const g=item.cityGuideV76;
   assert.ok(g,item.id+' missing city guide');
   assert.equal(g.bookingConfirmed,false);
   assert.equal(g.priceVerifiedFor2027,false);
   assert.equal(g.actualOpenOnTripDate,false);
   assert.equal(g.currentGoogleDataImported,false);
   assert.match(g.sourceUrl,/^https:\/\//);
   assert.ok(g.access&&g.focus&&g.check2027);
   assert.ok(['object','region'].includes(g.scope));
   if(g.scope==='region')assert.match(g.referenceLabel,/keine Quelle/);
  }
 }
});
test('V76 official links appear in place profiles, separately from Google Maps live info',()=>{
 for(const e of archive.entries){
  const item=catalog.trips.flatMap(x=>x.items).find(x=>x.cityGuideV76?.sourceId==='city-v76:'+e.id);
  assert.ok(item,'Missing existing named venue '+e.id);
  const ctx={cities:catalog.cities,catalog,state:{placePhotos:{}},
    people:[{id:1},{id:2},{id:3}],activeSet:new Set()};
  const p=placeProfileModel(item,ctx);
  const html=placeProfileHtml(item,ctx);
  assert.equal(p.cityDetailsUrl,e.sourceUrl);
  assert.equal(item.cityGuideV76.scope,'object');
  for(const field of ['Ortsrecherche · Sehenswert','Ortsrecherche · Anreise',
    'Veröffentlichte Öffnung / Saison','Veröffentlichte Kostenreferenz',
    'Vor dem Besuch 2027'])assert.ok(p.facts.some(x=>x[0]===field),item.id+' '+field);
  assert.match(html,/Google Maps · aktuelle Zeiten, Fotos und Bewertungen/);
  assert.match(html,/Kein Live-Abruf oder Speichern/);
  assert.ok(html.includes(e.sourceUrl.replace(/&/g,'&amp;')),'official URL '+e.id);
  assert.match(googleMapsSearchUrl(item,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
 }
});
test('V76 a regional city source is NOT an operator-specific verified opening time',()=>{
 const rows=catalog.trips.flatMap(x=>x.items).filter(x=>x.cityGuideV76?.scope==='region');
 assert.ok(rows.length>20);
 for(const row of rows.slice(0,50)){
  const guide=row.cityGuideV76;
  assert.match(guide.opening,/keine individuell geprüfte/);
  assert.match(guide.cost,/Kein individueller Eintrittspreis/);
  assert.equal(guide.directSourceConfirmed,false);
  assert.equal((row.source??[]).includes('city-v76:'+row.id),false);
 }
});
test('V76 no 2027 fee, booking or coordinates are changed when enriching original records',()=>{
 const base={
  id:'interrail_classic',route:['paris'],items:[{
   id:'demo',city:'paris',name:'Petit Palais',kind:'activity',price:null,
   point:[48.86,2.32],selected:false,booked:false,source:[]
  },{
   id:'private',city:'paris',name:'Unnamed holiday home',kind:'lodging',
   price:null,point:null,selected:false,booked:false,source:[],provider:'Airbnb'
  }]
 };
 const copy=structuredClone(base);
 const stats=applyCityGuidesV76([base],catalog.cities,uploaded,archive);
 assert.equal(stats.covered,2);
 assert.equal(stats.specific,1);
 assert.equal(stats.regional,1);
 for(let i=0;i<2;i++)for(const key of ['name','city','kind','point','price','selected','booked'])
   assert.deepEqual(base.items[i][key],copy.items[i][key]);
 const bad=structuredClone(archive);
 bad.entries[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applyCityGuidesV76([copy],catalog.cities,uploaded,bad),/V76 invalid evidence/);
});
test('V76 two coastal photos match exact locations and preserve licenses',()=>{
 for(const [city,name,file,author,lic] of [
  ['sete','Plage du Lazaret','Dike - Lazaret 01.jpg','Christian Ferrer','CC BY 4.0'],
  ['nice','Plage de la Réserve & Coco Beach','Nice la Réserve.jpg','CHRIS BONTEMPS','CC BY-SA 2.0']
 ]){
  const img=curatedPlacePhoto({city,name,kind:'activity'});
  assert.ok(img,name);
  assert.ok(img.sourceUrl.includes(encodeURIComponent(file).replace(/%20/g,'_')));
  assert.ok(img.credit.includes(author));
  assert.ok(img.credit.includes(lic));
  assert.match(img.licenseUrl,/creativecommons/);
  assert.equal(curatedPlacePhoto({city,name,kind:'lodging'}),null);
 }
});
