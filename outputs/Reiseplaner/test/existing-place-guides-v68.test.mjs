import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyExistingPlaceGuidesV68} from '../lib/existing-place-guides-v68.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel,placeProfileHtml} from '../public/place-profile.mjs';
import {googleMapsSearchUrl} from '../public/google-maps.mjs';

const guides=JSON.parse(await readFile(new URL(
 '../data/research-v68/existing-place-guides.json',import.meta.url),'utf8'));
const source=JSON.parse(await readFile(new URL(
 '../data/research-v50/uploaded-interrail-2027-candidates.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const labels=['Sehenswert','Praktische Besuchsplanung','Kombinierbar mit',
 'Anreise und Eingang','Vor Reisebeginn 2027 prüfen'];
function context(item){
 const trip=catalog.trips.find(t=>t.items.includes(item));
 return {trip,catalog,cities:catalog.cities,all:trip.items,city:item.city,
  people:[{id:1},{id:2},{id:3}],
  state:{placePhotos:{},favorites:[],votes:{}},
  activeSet:new Set(),compareIds:new Set(),browseSavedIds:new Set()};
}
test('V68 enriches exactly 37 known V50 destinations without creating new candidates',()=>{
 assert.equal(guides.entries.length,37);
 assert.equal(new Set(guides.entries.map(x=>x.id)).size,37);
 const stats=catalog.research.existingPlaceGuidesV68.stats;
 assert.equal(stats.sourceCandidates,37);
 assert.equal(stats.uniqueEnriched,37);
 assert.deepEqual(stats.missingAcrossVariants,[]);
 assert.equal(catalog.research.uploadedResearchV50.stats.sourceCandidates,105);
 for(const row of guides.entries){
  const targets=all.filter(i=>i.publicPlaceGuideV68?.uploadedId===row.id);
  assert.ok(targets.length>0,row.id);
  for(const item of targets){
   assert.deepEqual(item.publicPlaceGuideV68.visitorGuide,row.visitorGuide);
   assert.equal(item.publicPlaceGuideV68.september2027TicketConfirmed,false);
   assert.equal(item.publicPlaceGuideV68.september2027OpeningConfirmed,false);
   assert.ok(!['lodging','transport'].includes(item.kind),row.id);
   const ctx=context(item);
   const facts=placeProfileModel(item,ctx).facts;
   for(const label of labels)assert.ok(facts.some(([key])=>key===label),item.id+' '+label);
   assert.match(placeProfileHtml(item,ctx),/Google Maps/);
   assert.match(placeProfileHtml(item,ctx),/Vor Reisebeginn 2027 prüfen/);
   assert.match(googleMapsSearchUrl(item,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
   if(item.researchV50){
    assert.equal(item.researchV50.independentSourceVerified,false);
    assert.equal(item.price,null);
    assert.equal(item.booked,false);
    assert.equal(item.selected,false);
   }
   if(row.sourceUrl){
    assert.ok(item.source.includes('guide-v68:'+row.id));
    assert.equal(catalog.sources['guide-v68:'+row.id]?.url,row.sourceUrl);
    assert.equal(item.publicPlaceGuideV68.sourceUrl,row.sourceUrl);
   }
  }
 }
});
test('V68 source links are independent from provider prices or live status',()=>{
 assert.equal(guides.entries.filter(x=>x.sourceUrl).length,22);
 for(const r of guides.entries.filter(x=>x.sourceUrl)){
  assert.match(r.sourceUrl,/^https:\/\//);
  const item=all.find(i=>i.publicPlaceGuideV68?.uploadedId===r.id);
  const ctx=context(item);
  const html=placeProfileHtml(item,ctx);
  assert.ok(html.includes(r.sourceUrl)||html.includes('Zusätzliche offizielle Ortsquelle'),r.id);
 }
});
test('V68 rejects invalid archives and unknown entries before mutating user trips',()=>{
 const bad=structuredClone(guides);
 bad.entries[0].visitorGuide.highlights=[];
 const fake=[{id:'interrail_classic',route:['paris'],items:[]}];
 assert.throws(()=>applyExistingPlaceGuidesV68(fake,catalog.cities,source,bad),/V68: invalid/);
 assert.equal(fake[0].items.length,0);
 const missing=structuredClone(guides);
 missing.entries[0].id='new_999';
 assert.throws(()=>applyExistingPlaceGuidesV68(fake,catalog.cities,source,missing),/V68: invalid/);
 assert.equal(fake[0].items.length,0);
});
test('V68 seven public Commons photos match specific existing places, not private lodging',()=>{
 const cases=[
  ['paris','Île aux Cygnes (Schwaneninsel)','Statue de la Liberté, île aux Cygnes, Paris.jpg','Polymagou','CC BY-SA 4.0'],
  ['barcelona','Parc de Cervantes','Barcelona - Parc de Cervantes 01.jpg','Joe Mabel','CC BY-SA 4.0'],
  ['sete','Phare du Môle Saint-Louis','Phare de Sète (1).jpg','Christian Ferrer','CC BY-SA 3.0'],
  ['genoa','Via Garibaldi (Strade Nuove) & Palazzi dei Rolli','Genova via G. Garibaldi.jpg','Al*from*Lig','CC BY-SA 4.0'],
  ['barcelona','Carretera de les Aigües','Carretera de les aigues.jpg','Lizel','CC BY-SA 4.0'],
  ['nice','Mont Boron Wald- und Aussichtspark','Mont Boron, Nice (20260619-IMG 3716).jpg','Matti Blume','CC BY-SA 4.0'],
  ['venice','Giardini della Biennale & Parco delle Rimembranze','Giardini Biennale 2026.jpg','Baseluna014','CC BY-SA 4.0'],
 ];
 for(const [city,name,file,author,license] of cases){
  const item=all.find(x=>x.city===city&&x.name===name&&x.kind==='activity');
  assert.ok(item,'missing place '+name);
  const p=curatedPlacePhoto(item);
  assert.ok(p?.curated,'missing photo '+name);
  assert.ok(p.sourceUrl.includes(encodeURIComponent(file).replace(/%20/g,'_')),name);
  assert.ok(p.credit.includes(author),name);
  assert.ok(p.credit.includes(license),name);
  assert.match(p.url,/commons.wikimedia.org\/wiki\/Special:FilePath/);
  assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null);
 }
});
