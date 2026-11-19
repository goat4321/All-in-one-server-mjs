import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyOperatorDiscoveriesV60} from '../lib/operator-discoveries-v60.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';
import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus}
 from '../public/google-maps.mjs';
import {markerProvenance,hasIndependentPointEvidence}
 from '../public/poi-location-provenance.mjs';

const archive=JSON.parse(await readFile(new URL(
 '../data/research-v60/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const added=all.filter(i=>i.discoveryV60);

test('All 16 unique new records are imported in the right trip variants without duplicating previous places',()=>{
 assert.equal(archive.entries.length,16);
 assert.equal(new Set(archive.entries.map(x=>x.id)).size,16);
 const stats=catalog.research.operatorDiscoveryV60.stats;
 assert.equal(stats.sourceCandidates,16);
 assert.equal(stats.uniqueCreated,16);
 assert.equal(stats.duplicateAcrossVariants,0);
 assert.equal(stats.createdAcrossVariants,added.length);
 assert.equal(new Set(added.map(x=>x.id)).size,16);
 assert.deepEqual(Object.keys(stats.byCity).sort(),
  ['toulouse','narbonne','marseille','ventimiglia','milan','glarus','wasserauen'].sort());
 for(const trip of catalog.trips){
  const own=trip.items.filter(x=>x.discoveryV60);
  assert.ok(own.every(x=>trip.route.includes(x.city)),trip.id);
  assert.equal(new Set(own.map(x=>x.id)).size,own.length);
  if(trip.id==='interrail_august')assert.equal(own.length,14);
  if(trip.id==='swiss_lakes')assert.equal(own.length,2);
  if(['interrail_classic','interrail_swiss'].includes(trip.id))assert.equal(own.length,0);
 }
});
test('Every new place is an optional source-backed 2027 option, not a booking or actual budget amount',()=>{
 for(const item of added){
  assert.equal(item.price,null,item.id);
  assert.equal(item.booked,false,item.id);
  assert.equal(item.selected,false,item.id);
  assert.equal(item.start,null,item.id);
  assert.equal(item.end,null,item.id);
  assert.equal(item.locationReferenceV07.exactKnown,false);
  assert.equal(item.discoveryV60.september2027TicketConfirmed,false);
  assert.equal(item.discoveryV60.september2027OpeningConfirmed,false);
  assert.equal(catalog.sources[item.source[0]]?.url,item.website);
  assert.ok(item.detail.length>60);
  assert.ok(item.duration>=40&&item.duration<=150);
  assert.match(googleMapsSearchUrl(item,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
  assert.match(googleMapsDirectionsUrl(null,item,catalog.cities,'transit'),/travelmode=transit/);
 }
});
test('Only Narbonne market and Hanbury garden have independent public area references and NEVER claim precise entrance pins',()=>{
 const geo=added.filter(x=>x.point);
 assert.deepEqual(geo.map(x=>x.name).sort(),['Giardini Botanici Hanbury','Les Halles de Narbonne'].sort());
 assert.equal(catalog.research.operatorDiscoveryV60.stats.sourcedAreaPinsAcrossVariants,2);
 for(const item of geo){
  assert.ok(item.geoEvidence.url.startsWith('https://'));
  assert.equal(item.geoEvidence.isCentroid,true);
  assert.equal(markerProvenance(item).kind,'area');
  assert.equal(hasIndependentPointEvidence(item),true);
  assert.match(googleMapsLocationStatus(item),/kein nachgewiesener Eingang/);
  assert.match(item.discoveryV60.locationPrecision,/area_only/);
 }
 for(const item of added.filter(x=>!x.point)){
  assert.equal(item.geoEvidence,null);
  assert.match(googleMapsLocationStatus(item),/Adresse angegeben/);
 }
});
test('Seven licensed Commons photos belong to exact public places and never private lodgings',()=>{
 const cases=[
  ['toulouse','Jardin Japonais Pierre Baudis','Jardin_Japonais','Mike Peel'],
  ['narbonne','Les Halles de Narbonne','Les_halles_de_Narbonne','Ptitgonevx'],
  ['marseille','Parc du Palais Longchamp','Palais_Longchamp.jpg','Papafred'],
  ['marseille','Fort Saint-Jean (Mucem-Außenanlagen)','Fort_Saint-Jean','Vlad Mandyev'],
  ['marseille','Centre de la Vieille Charité','La_Vieille_Charit','Vincent 13'],
  ['milan','Museo del Novecento Milano','Edificio_del_Museo_del_Novecento','Paolobon140'],
  ['milan','BAM – Biblioteca degli Alberi Milano','Milano_-_Biblioteca_degli_Alberi','Guilhem Vellut'],
 ];
 for(const [city,name,file,author] of cases){
  const item=added.find(x=>x.city===city&&x.name===name);
  assert.ok(item,name);
  const photo=curatedPlacePhoto(item);
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(file),name);
  assert.match(photo.credit,/CC BY(?:-SA)? [234]\.0/);
  assert.ok(photo.credit.includes(author),name);
  assert.match(photo.url,/Special:FilePath/);
  assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null);
 }
 assert.equal(curatedPlacePhoto({kind:'activity',city:'nice',name:'Les Halles de Narbonne'}),null);
});
test('Public operator fares, source URLs and individual transport warnings appear on cards and profiles',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_august');
 const ctx={trip,catalog,cities:catalog.cities,all:trip.items,
  city:'milan',date:'2027-08-25',cityForDay:()=> 'milan',
  people:[{id:'p1'},{id:'p2'},{id:'p3'}],
  state:{favorites:[],votes:{},verifications:{},placePhotos:{}},
  activeSet:new Set(),compareIds:new Set(),browseSavedIds:new Set()};
 const museum=trip.items.find(x=>x.id==='operator:v60:milan-museo-novecento');
 assert.ok(museum);
 const p=placeProfileModel(museum,ctx);
 assert.ok(p.facts.some(([key,value])=>key==='Preisreferenz'&&value.includes('18–25')));
 assert.ok(p.facts.some(([key])=>key==='Veröffentlichte Öffnungszeiten'));
 const html=browseOptionCard(museum,ctx);
 assert.match(html,/Betreiber-Tarifreferenz/);
 assert.match(html,/10 €/);
 assert.match(html,/www\.google\.com\/maps\/search/);
 const hann=trip.items.find(x=>x.id==='operator:v60:ventimiglia-hanbury');
 assert.ok(hann);
 assert.ok(placeProfileModel(hann,ctx).facts.some(([k])=>k==='Anreise / Lage'));
 const gap=entryCompleteness(museum,ctx);
 assert.equal(gap.hasSource,true);
 assert.equal(gap.publishedHours,true);
});
test('Food entries remain activity-style day options and do not acquire accommodation imagery',()=>{
 const halles=added.find(x=>x.id==='operator:v60:narbonne-les-halles');
 const aescher=added.find(x=>x.id==='operator:v60:wasserauen-aescher');
 assert.equal(halles.kind,'activity');
 assert.equal(aescher.kind,'activity');
 assert.equal(halles.category,'food');
 assert.equal(aescher.category,'food');
 assert.ok(curatedPlacePhoto(halles));
 assert.equal(aescher.price,null);
});
test('Importer rejects malicious source URLs, bad coordinates and duplicate IDs without partial writes',()=>{
 const trips=[{id:'interrail_august',route:['toulouse','narbonne'],items:[]}];
 const bad=structuredClone(archive);
 bad.entries[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applyOperatorDiscoveriesV60(trips,catalog.cities,bad),/V60 invalid/);
 const badPoint=structuredClone(archive);
 badPoint.entries[3].point=[900,100];
 assert.throws(()=>applyOperatorDiscoveriesV60(trips,catalog.cities,badPoint),/V60 invalid/);
 const dup=structuredClone(archive);
 dup.entries[1].id=dup.entries[0].id;
 assert.throws(()=>applyOperatorDiscoveriesV60(trips,catalog.cities,dup),/expected 16/);
 assert.equal(trips[0].items.length,0);
});
