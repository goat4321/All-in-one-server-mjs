import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyOperatorDiscoveriesV61} from '../lib/operator-discoveries-v61.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';
import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus}
 from '../public/google-maps.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';

const archive=JSON.parse(await readFile(new URL(
 '../data/research-v61/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog(),byTrip=Object.fromEntries(
 catalog.trips.map(t=>[t.id,t.items.filter(x=>x.discoveryV61)]));
const all=Object.values(byTrip).flat();

test('16 new, source-backed options are correctly scoped across all four variants',()=>{
 assert.equal(archive.entries.length,16);
 assert.equal(catalog.research.operatorDiscoveryV61.stats.sourceCandidates,16);
 assert.equal(catalog.research.operatorDiscoveryV61.stats.uniqueCreated,16);
 assert.equal(catalog.research.operatorDiscoveryV61.stats.duplicateAcrossVariants,0);
 assert.equal(catalog.research.operatorDiscoveryV61.stats.createdAcrossVariants,38);
 assert.deepEqual(Object.fromEntries(Object.entries(byTrip).map(([k,v])=>[k,v.length])),{
  interrail_classic:13,interrail_swiss:9,interrail_august:13,swiss_lakes:3
 });
 for(const trip of catalog.trips){
  const rows=byTrip[trip.id];
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  assert.ok(rows.every(r=>trip.route.includes(r.city)),trip.id);
 }
});
test('All new attractions retain booking, budget and GPS integrity',()=>{
 for(const row of all){
  assert.equal(row.kind,'activity');
  assert.equal(row.selected,false);
  assert.equal(row.booked,false);
  assert.equal(row.price,null);
  assert.equal(row.start,null);
  assert.equal(row.end,null);
  assert.equal(row.point,null);
  assert.equal(row.geoEvidence,null);
  assert.equal(row.locationReferenceV07.exactKnown,false);
  assert.equal(row.discoveryV61.september2027TicketConfirmed,false);
  assert.equal(row.discoveryV61.september2027OpeningConfirmed,false);
  assert.equal(catalog.sources[row.source[0]]?.url,row.website,row.id);
  assert.ok(row.detail.length>70);
  assert.match(googleMapsSearchUrl(row,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
  assert.match(googleMapsDirectionsUrl(null,row,catalog.cities,'transit'),/travelmode=transit/);
  assert.match(googleMapsLocationStatus(row),/Adresse angegeben/);
 }
});
test('One published 2027 Swiss museum season stays distinct from a booked ticket',()=>{
 const glarus=byTrip.swiss_lakes.find(x=>x.name==='Anna Göldi Museum Ennenda');
 assert.ok(glarus);
 assert.equal(glarus.discoveryV61.publishedSeason2027,true);
 assert.equal(glarus.discoveryV61.september2027TicketConfirmed,false);
 assert.equal(glarus.price,null);
 assert.match(glarus.openingHoursNote,/2027/);
 assert.ok(all.filter(x=>x.discoveryV61.publishedSeason2027).length===1);
});
test('Seven exact destination photographs have Commons attribution, never hotel imagery',()=>{
 const cases=[
  ['paris','Musée Bourdelle','Paris_musee_bourdelle_ext','Velvet'],
  ['barcelona','CosmoCaixa Barcelona','CosmoCaixa_building','Jirka Dl'],
  ['barcelona','El Born Centre de Cultura i Memòria','El_Born_Centre_Cultural','Bene Riobó'],
  ['barcelona',"Parc del Laberint d'Horta","Laberint_d'Horta",'Mirkaah'],
  ['genoa','Palazzo Reale di Genova','Genova-palazzo_Reale','Fernando Galardi'],
  ['venice','Museo di Palazzo Grimani','Palazzo_Grimani','Stavros Argyropoulos'],
  ['venice','Museo del Vetro Murano (Glasmuseum)','Murano_museo_del_vetro','Abxbay'],
 ];
 for(const [city,name,file,author] of cases){
  const row=all.find(x=>x.city===city&&x.name===name);
  assert.ok(row,name);
  const p=curatedPlacePhoto(row);
  assert.ok(p?.curated,name);
  assert.ok(p.sourceUrl.includes(file),name);
  assert.ok(p.credit.includes(author),name);
  assert.match(p.credit,/CC BY-SA [234]\.0/);
  assert.match(p.url,/Special:FilePath/);
  assert.equal(curatedPlacePhoto({...row,kind:'lodging'}),null);
 }
});
test('Age reductions and operator source data are visible, without being treated as real cost',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const row=byTrip.interrail_classic.find(x=>x.id==='operator:v61:genoa-palazzo-reale');
 assert.ok(row);
 const ctx={trip,catalog,cities:catalog.cities,all:trip.items,
  city:row.city,date:'2027-09-11',cityForDay:()=>row.city,
  people:[{id:'1'},{id:'2'},{id:'3'}],state:{placePhotos:{},favorites:[]},
  activeSet:new Set(),browseSavedIds:new Set(),compareIds:new Set()};
 const html=browseOptionCard(row,ctx);
 assert.match(html,/Betreiber-Tarifreferenz/);
 assert.match(html,/12 €/);
 assert.match(html,/2 €/);
 assert.match(html,/Google Maps/);
 const profile=placeProfileModel(row,ctx);
 assert.ok(profile.facts.some(([key,value])=>key==='Preisreferenz'&&value.includes('18–25')));
 assert.ok(profile.facts.some(([key])=>key==='Veröffentlichte Öffnungszeiten'));
 assert.equal(entryCompleteness(row,ctx).hasSource,true);
});
test('All imported place data is validated before writing anything',()=>{
 const trip=[{id:'dummy',route:['paris','barcelona'],items:[]}];
 const corrupt=structuredClone(archive);
 corrupt.entries[0].sourceUrl='javascript:fake()';
 assert.throws(()=>applyOperatorDiscoveriesV61(trip,catalog.cities,corrupt),/V61:/);
 const identical=structuredClone(archive);
 identical.entries[1].id=identical.entries[0].id;
 assert.throws(()=>applyOperatorDiscoveriesV61(trip,catalog.cities,identical),/expected 16/);
 const wrongGeo=structuredClone(archive);
 wrongGeo.entries[0].point=[48.8,2.3];
 assert.throws(()=>applyOperatorDiscoveriesV61(trip,catalog.cities,wrongGeo),/V61:/);
 assert.equal(trip[0].items.length,0);
});
