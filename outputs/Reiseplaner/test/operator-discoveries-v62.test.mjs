import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyOperatorDiscoveriesV62} from '../lib/operator-discoveries-v62.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';
import {googleMapsSearchUrl,googleMapsLocationStatus}
 from '../public/google-maps.mjs';
import {markerProvenance,hasIndependentPointEvidence}
 from '../public/poi-location-provenance.mjs';

const archive=JSON.parse(await readFile(new URL(
 '../data/research-v62/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const grouped=Object.fromEntries(catalog.trips.map(t=>[t.id,
 t.items.filter(x=>x.discoveryV62)]));
const added=Object.values(grouped).flat();

test('Ten unique official operators imported as 25 optional records in eligible variants',()=>{
 const stats=catalog.research.operatorDiscoveryV62.stats;
 assert.equal(archive.entries.length,10);
 assert.equal(stats.sourceCandidates,10);
 assert.equal(stats.uniqueCreated,10);
 assert.equal(stats.createdAcrossVariants,25);
 assert.equal(stats.duplicateAcrossVariants,0);
 assert.deepEqual(Object.fromEntries(Object.entries(grouped).map(([k,v])=>[k,v.length])),{
  interrail_classic:9,interrail_swiss:7,interrail_august:8,swiss_lakes:1});
 for(const trip of catalog.trips){
  assert.ok(grouped[trip.id].every(x=>trip.route.includes(x.city)),trip.id);
  assert.equal(grouped[trip.id].length,new Set(grouped[trip.id].map(x=>x.id)).size);
 }
});
test('Marie Curie museum is absent from the August-only route because official August closure',()=>{
 assert.equal(grouped.interrail_august.some(x=>x.name.includes('Musée Curie')),false);
 assert.ok(grouped.interrail_classic.some(x=>x.name.includes('Musée Curie')));
 assert.ok(grouped.interrail_swiss.some(x=>x.name.includes('Musée Curie')));
 const archived=archive.entries.find(x=>x.id==='paris-musee-curie');
 assert.deepEqual(archived.excludeTrips,['interrail_august']);
 assert.match(archived.openingReference,/August/);
});
test('No newly researched prices are counted as bookings or group costs',()=>{
 for(const row of added){
  assert.equal(row.price,null);
  assert.equal(row.booked,false);
  assert.equal(row.selected,false);
  assert.equal(row.start,null);
  assert.equal(row.end,null);
  assert.equal(row.discoveryV62.september2027OpeningConfirmed,false);
  assert.equal(row.discoveryV62.september2027TicketConfirmed,false);
  assert.equal(catalog.sources[row.source[0]]?.url,row.website);
  assert.match(googleMapsSearchUrl(row,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
 }
});
test('Tourism-board public Sète museum coordinate is source-backed area, not an entrance',()=>{
 const museum=grouped.interrail_classic.find(x=>x.id==='operator:v62:sete-musee-mer');
 assert.ok(museum);
 assert.deepEqual(museum.point,[43.39365,3.69172]);
 assert.equal(museum.geoEvidence.isCentroid,true);
 assert.match(museum.geoEvidence.url,/tourisme-sete/);
 assert.equal(markerProvenance(museum).kind,'area');
 assert.equal(hasIndependentPointEvidence(museum),true);
 assert.match(googleMapsLocationStatus(museum),/kein nachgewiesener Eingang/);
 assert.equal(catalog.research.operatorDiscoveryV62.stats.sourcedAreaPinsAcrossVariants,3);
 for(const row of added.filter(x=>!x.point)){
  assert.equal(row.geoEvidence,null);
  assert.match(googleMapsLocationStatus(row),/Adresse angegeben/);
 }
});
test('Museum rates, accessibility and 2027 uncertainty surface in museum cards',()=>{
 const trip=catalog.trips.find(x=>x.id==='interrail_classic');
 const row=grouped.interrail_classic.find(x=>x.id==='operator:v62:venice-museo-fortuny');
 const ctx={trip,catalog,cities:catalog.cities,all:trip.items,city:'venice',
  people:[{id:1},{id:2},{id:3}],date:'2027-09-12',cityForDay:()=> 'venice',
  state:{placePhotos:{},favorites:[],votes:{}},activeSet:new Set(),
  compareIds:new Set(),browseSavedIds:new Set()};
 assert.ok(row);
 const html=browseOptionCard(row,ctx);
 assert.match(html,/Betreiber-Tarifreferenz/);
 assert.match(html,/7,50 €/);
 assert.match(html,/Google Maps/);
 assert.ok(placeProfileModel(row,ctx).facts.some(([k])=>k==='Preisreferenz'));
 assert.ok(placeProfileModel(row,ctx).facts.some(([k])=>k==='Veröffentlichte Öffnungszeiten'));
 const garden=grouped.interrail_classic.find(x=>x.id==='operator:v62:genoa-villa-durazzo');
 assert.match(garden.detail,/Genova Pegli/);
 assert.equal(garden.point,null);
});
test('Nine V61 photographic gaps now have exact licensed Commons object images',()=>{
 const cases=[
  ['paris','Musée de la Libération de Paris',"Barri%C3%A8re_d'Enfer",'Coyau',/CC BY-SA 3\.0/],
  ['barcelona','Museu Marítim de Barcelona','001_Museu_Mar%C3%ADtim','Enric',/CC BY-SA 4\.0/],
  ['nice',"Villa Masséna (Musée d'Art et d'Histoire)",'Nice%2Cmus%C3%A9e','Finoskov',/CC BY-SA 4\.0/],
  ['nice','Musée de Préhistoire Terra Amata',"Vue_de_l'int%C3%A9rieur",'Jadakeo',/CC BY-SA 4\.0/],
  ['genoa',"Museo d'Arte Orientale Edoardo Chiossone","Museo_d'arte_orientale",'Cymothoa exigua',/CC BY-SA 3\.0/],
  ['venice',"Ca’ Pesaro – Galleria Internazionale d'Arte Moderna","Ca'_Pesaro",'Adriano',/CC BY-SA 3\.0/],
  ['appenzell','Seilbahn Alp Sigel (Pfannenstiel)','Auf_der_Alp_Sigel','Barbara Steinemann',/CC BY-SA 4\.0/],
  ['glarus','Anna Göldi Museum Ennenda','H%C3%A4nggiturm_Ennenda','Samuel Trümpy',/CC BY 2\.0/],
  ['glarus','Berglistüber-Wasserfall (Linthal)','Berglist%C3%BCber_F%C3%A4tschbach','allerlei',/CC0 1\.0/]
 ];
 for(const [city,name,file,author,license] of cases){
  const place=catalog.trips.flatMap(t=>t.items).find(x=>x.city===city&&x.name===name);
  assert.ok(place,name);
  const photo=curatedPlacePhoto(place);
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(file),name);
  assert.ok(photo.credit.includes(author),name);
  assert.match(photo.credit,license);
  assert.equal(curatedPlacePhoto({...place,kind:'lodging'}),null);
 }
});
test('V61 museum no longer falsely claims confirmed 2027 season',()=>{
 const row=grouped.swiss_lakes.find(x=>x.id==='operator:v62:appenzell-kunsthalle');
 assert.ok(row);
 const old=catalog.trips.flatMap(t=>t.items).find(i=>i.id==='operator:v61:glarus-anna-goeldi');
 assert.ok(old);
 assert.equal(old.discoveryV61.publishedSeason2027,false);
 assert.match(old.openingHoursNote,/Saison 2026/);
});
test('Archive rejects bad URLs, coordinates, and unknown excluded trips before mutating variant records',()=>{
 const fake=[{id:'interrail_classic',route:['paris','sete'],items:[]}];
 const url=structuredClone(archive);url.entries[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applyOperatorDiscoveriesV62(fake,catalog.cities,url),/V62 invalid/);
 const point=structuredClone(archive);point.entries[0].point=[91,190];
 assert.throws(()=>applyOperatorDiscoveriesV62(fake,catalog.cities,point),/V62 invalid/);
 const excluded=structuredClone(archive);excluded.entries[0].excludeTrips=['invalid-route'];
 assert.throws(()=>applyOperatorDiscoveriesV62(fake,catalog.cities,excluded),/V62 invalid/);
 const id=structuredClone(archive);id.entries[1].id=id.entries[0].id;
 assert.throws(()=>applyOperatorDiscoveriesV62(fake,catalog.cities,id),/expected 10/);
 assert.equal(fake[0].items.length,0);
});
