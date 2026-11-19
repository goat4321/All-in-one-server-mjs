import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {applyOperatorDiscoveriesV55} from '../lib/operator-discoveries-v55.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';
import {mediaCoveragePanel} from '../public/media-coverage.mjs';
import {googleMapsSearchUrl,googleMapsLocationStatus} from '../public/google-maps.mjs';

const archive=JSON.parse(await readFile(new URL(
 '../data/research-v55/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const added=catalog.trips.flatMap(x=>x.items.filter(i=>i.discoveryV55));

test('Eight separate destination sources are applied only to relevant route variants',()=>{
 assert.equal(archive.entries.length,8);
 const s=catalog.research.operatorDiscoveryV55.stats;
 assert.equal(s.sourceCandidates,8);
 assert.equal(s.uniqueCreated,8);
 assert.equal(s.duplicateAcrossVariants,0);
 assert.equal(added.length,s.createdAcrossVariants);
 assert.equal(new Set(added.map(i=>i.discoveryV55.sourceUrl)).size,8);
 for(const trip of catalog.trips){
  const own=trip.items.filter(i=>i.discoveryV55);
  assert.ok(own.every(i=>trip.route.includes(i.city)));
  assert.equal(new Set(own.map(i=>i.id)).size,own.length);
 }
 const glarus=added.filter(i=>i.name==='Kunsthaus Glarus');
 assert.equal(glarus.length,1);
 assert.equal(glarus[0].trip,'swiss_lakes');
});
test('New source prices never act as budget totals, tickets or independently verified GPS',()=>{
 for(const row of added){
  assert.equal(row.price,null);
  assert.equal(row.selected,false);
  assert.equal(row.booked,false);
  assert.equal(row.point,null);
  assert.equal(row.locationReferenceV07.exactKnown,false);
  assert.equal(row.discoveryV55.september2027OpeningConfirmed,false);
  assert.equal(row.discoveryV55.september2027TicketConfirmed,false);
  assert.equal(catalog.sources[row.source[0]]?.url,row.website);
  assert.match(googleMapsSearchUrl(row,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
  assert.match(googleMapsLocationStatus(row),/Adresse angegeben/);
 }
});
test('Five photo sources belong to exact place names, credit creators, and not to hotels',()=>{
 const cases=[
 ['sete','Musée Paul Valéry','Exposition_au_mus',/Aviwater.*CC BY-SA 4\.0/],
 ['nice','Parc Phoenix (Botanischer Park)','Parc_Ph',/Andr.*CC0 1\.0/],
 ['genoa','Palazzo Ducale Genova (Kulturzentrum)','Genova_Palazzo_Ducale',/Otr.*CC BY-SA 3\.0/],
 ['venice','Museo Correr (Museen am Markusplatz)','Museo_Correr_-_salone',/Monica.*CC BY-SA 4\.0/],
 ['appenzell','Kunstmuseum Appenzell','Das_Foyer_im_Kunstmuseum',/Urs Baumann.*CC BY-SA 4\.0/],
 ];
 for(const [city,name,part,credit] of cases){
  const photo=curatedPlacePhoto({kind:'activity',category:'activity',city,name});
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(part),name);
  assert.match(photo.credit,credit);
  assert.match(photo.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
 }
 assert.equal(curatedPlacePhoto({kind:'lodging',city:'appenzell',name:'Kunstmuseum Appenzell'}),null);
});
test('New entry details expose provider conditions and map access without invented checkout',()=>{
 const trip=catalog.trips.find(x=>x.id==='interrail_classic');
 const row=trip.items.find(x=>x.id==='operator:v55:paris-musee-art-moderne');
 const ctx={trip,catalog,cities:catalog.cities,city:'paris',
  people:[{id:'1'},{id:'2'},{id:'3'}],
  state:{favorites:[],votes:{},verifications:{},placePhotos:{}},activeSet:new Set(),
  compareIds:new Set(),browseSavedIds:new Set(),date:'2027-09-02'};
 const profile=placeProfileModel(row,ctx);
 assert.ok(profile.facts.some(f=>f[0]==='Preisreferenz'));
 assert.ok(profile.facts.some(f=>f[0]==='Veröffentlichte Öffnungszeiten'));
 const html=browseOptionCard(row,ctx);
 assert.match(html,/Betreiber-Tarifreferenz/);
 assert.match(html,/www\.google\.com\/maps\/search/);
});
test('Missing-photo panel links the map and the exact place Commons lookup',()=>{
 const trip=catalog.trips.find(x=>x.id==='interrail_classic');
 const panel=mediaCoveragePanel({
  all:trip.items,state:{placePhotos:{}},activeSet:new Set(),
  cities:catalog.cities,people:[{id:'a'},{id:'b'},{id:'c'}]});
 assert.match(panel,/Commons-Bildsuche/);
 assert.match(panel,/www\.google\.com\/maps\/search/);
 assert.match(panel,/commons\.wikimedia\.org/);
});
test('Invalid or repeated source IDs are rejected before writing entries',()=>{
 const fake=[{id:'test',route:['paris'],items:[]}];
 const broken=structuredClone(archive);broken.entries[0].sourceUrl='javascript:foo()';
 assert.throws(()=>applyOperatorDiscoveriesV55(fake,catalog.cities,broken),/V55 entry/);
 const same=structuredClone(archive);same.entries[1].id=same.entries[0].id;
 assert.throws(()=>applyOperatorDiscoveriesV55(fake,catalog.cities,same),/expected 8/);
 assert.equal(fake[0].items.length,0);
});
