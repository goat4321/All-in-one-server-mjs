import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyOperatorDiscoveriesV54} from '../lib/operator-discoveries-v54.mjs';
import {curatedPlacePhoto,curatedPhotoCount} from '../public/curated-place-photos.mjs';
import {googleMapsSearchUrl,googleMapsLocationStatus} from '../public/google-maps.mjs';
import {browseOptionCard,foodBrowseCards} from '../public/browse-hub-v35.mjs';
import {explorerData} from '../public/map-explorer.mjs';

const archive=JSON.parse(await readFile(
 new URL('../data/research-v54/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(trip=>trip.items);
const added=all.filter(item=>item.discoveryV54);

test('Thirteen operator-sourced city discoveries attach to correct variants without duplicates',()=>{
 const stats=catalog.research.operatorDiscoveryV54.stats;
 assert.equal(archive.entries.length,13);
 assert.equal(stats.sourceCandidates,13);
 assert.equal(stats.uniqueCreated,13);
 assert.ok(stats.createdAcrossVariants>=13);
 assert.equal(added.length,stats.createdAcrossVariants);
 for(const trip of catalog.trips){
  const rows=trip.items.filter(x=>x.discoveryV54);
  assert.ok(rows.every(x=>trip.route.includes(x.city)));
  assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 }
 const known=new Set(archive.entries.map(x=>x.id));
 assert.deepEqual(new Set(added.map(x=>x.id.split('operator:v54:')[1])),known);
});
test('Official source/price references never become booked offers, budgets or fabricated GPS pins',()=>{
 for(const place of added){
  assert.equal(place.selected,false);
  assert.equal(place.booked,false);
  assert.equal(place.price,null);
  assert.equal(place.point,null);
  assert.equal(place.locationReferenceV07.exactKnown,false);
  assert.equal(place.discoveryV54.september2027TicketConfirmed,false);
  assert.equal(place.discoveryV54.september2027OpeningConfirmed,false);
  assert.ok(place.website.startsWith('https://'));
  assert.equal(catalog.sources[place.source[0]]?.url,place.website);
  assert.match(googleMapsSearchUrl(place,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search/);
  assert.match(googleMapsLocationStatus(place),/Adresse angegeben/);
  assert.match(decodeURIComponent(place.googleMapsUrl),new RegExp(place.city==='genoa'?'Genova|Genua':'', 'i'));
 }
});
test('Published rates are explicitly separated from confirmed September-2027 tickets',()=>{
 const sant=added.find(x=>x.id.endsWith('barcelona-sant-pau'));
 const swiss=added.find(x=>x.id.endsWith('kandersteg-blausee'));
 assert.ok(sant?.discoveryV54.priceReference.includes('2027'));
 assert.ok(swiss?.discoveryV54.priceReference.includes('CHF'));
 assert.equal(sant.discoveryV54.priceYear,'published_2027_reference');
 assert.equal(sant.price,null);
});
test('Sixteen actual Commons photos are matched to their intended existing and new places',()=>{
 const cases=[
 ['paris','Bouillon Pigalle','food','Bouillon_Pigalle'],
 ['paris','Coulée Verte René-Dumont (Promenade Plantée)','activity','Coul'],
 ['barcelona','Castell de Montjuïc','activity','Castell_de_Montju'],
 ['genoa','Mercato Orientale Genova (MOG)','food','Mercato_Orientale'],
 ['venice','Libreria Acqua Alta','activity','Libreria_Acqua_Alta'],
 ['venice','Punta della Dogana','activity','Punta_della_Dogana'],
 ['paris','Musée de la Vie Romantique','activity','Main_Building_in_the_Mus'],
 ['paris','Jardin des Plantes (Botanischer Garten)','activity','Grande_Galerie_du_Jardin'],
 ['barcelona','Recinte Modernista de Sant Pau','activity','Main_facade_of_Hospital'],
 ['barcelona','CaixaForum Barcelona','activity','CaixaForum_Barcelona'],
 ['nice','Musée Matisse Nice','activity','Matisse_Nice'],
 ['nice','Musée national Marc Chagall','activity','Marc_Chagall'],
 ['genoa','Galata Museo del Mare','activity','Galata_Museo_del_Mare'],
 ['genoa',"Castello d'Albertis – Museo delle Culture del Mondo",'activity','Castello_d'],
 ['venice',"Gallerie dell'Accademia Venezia",'activity','Gallerie_dell'],
 ['kandersteg','Naturpark Blausee (Kandergrund)','activity','Blausee_in_Kandergrund'],
 ];
 assert.ok(curatedPhotoCount>=80);
 for(const [city,name,category,key] of cases){
  const photo=curatedPlacePhoto({kind:'activity',city,name,category});
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(key),name);
  assert.match(photo.credit,/CC (BY|BY-SA|0)|Public Domain/,name);
  assert.match(photo.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
 }
 assert.equal(curatedPlacePhoto({kind:'lodging',city:'genoa',name:'Galata Museo del Mare'}),null);
 assert.equal(curatedPlacePhoto({kind:'activity',category:'food',city:'barcelona',name:'Park Güell Café'}),null);
});
test('Every new entry appears in the explorer with Maps link and 2026 source details on cards',()=>{
 const classic=catalog.trips.find(x=>x.id==='interrail_classic');
 const rows=explorerData(classic.items,classic,{city:'paris'});
 const item=classic.items.find(x=>x.id==='operator:v54:paris-vie-romantique');
 assert.ok(rows.unlocated.some(x=>x.id===item.id));
 const ctx={trip:classic,catalog,cities:catalog.cities,city:'paris',
  people:[{id:'1'},{id:'2'},{id:'3'}],state:{favorites:[],votes:{},verifications:{},placePhotos:{}},
  activeSet:new Set(),compareIds:new Set(),browseSavedIds:new Set(),date:'2027-09-02'};
 const html=browseOptionCard(item,ctx);
 assert.match(html,/Betreiber-Tarifreferenz/);
 assert.match(html,/www\.google\.com\/maps\/search/);
 assert.match(html,/Betreiberquelle/);
 const food=classic.items.find(x=>x.name==='Bouillon Pigalle');
 assert.ok(food);
 assert.match(foodBrowseCards(ctx,[food]),/www\.google\.com\/maps\/search/);
});
test('The new-source import refuses malformed, duplicate-ID or unsafe provider data',()=>{
 const minimal=[{id:'trip',route:['paris'],items:[]}];
 const broken=structuredClone(archive);
 broken.entries[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applyOperatorDiscoveriesV54(minimal,catalog.cities,broken),/V54 entry/);
 assert.equal(minimal[0].items.length,0);
 const missing=structuredClone(archive);missing.entries.pop();
 assert.throws(()=>applyOperatorDiscoveriesV54(minimal,catalog.cities,missing),/expected 13/);
});
