import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel,placeProfileHtml} from '../public/place-profile.mjs';

const archive=JSON.parse(await readFile(new URL(
 '../data/research-v62/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const guides=all.filter(x=>x.discoveryV62?.visitorGuide);
const unique=new Map(guides.map(x=>[x.id,x]));

test('V65 adds complete actionable visitor guides to all existing V62 operator records',()=>{
 assert.equal(archive.entries.length,10);
 assert.equal(unique.size,10);
 for(const row of archive.entries){
  assert.ok(row.visitorGuide,row.id);
  assert.ok(row.visitorGuide.highlights.length>=2,row.id);
  for(const field of ['visitTip','combineWith','arrivalTip','check2027'])
   assert.ok(row.visitorGuide[field]?.length>20,row.id+' '+field);
  const item=unique.get('operator:v62:'+row.id);
  assert.ok(item,row.id);
  assert.deepEqual(item.discoveryV62.visitorGuide,row.visitorGuide);
  assert.equal(item.booked,false);
  assert.equal(item.selected,false);
  assert.equal(item.price,null);
  assert.equal(item.point===null || item.geoEvidence?.isCentroid===true,true);
 }
});

test('V65 visit facts and official Google Maps/source links are visible in existing detail UI',()=>{
 for(const item of unique.values()){
  const trip=catalog.trips.find(t=>t.items.some(x=>x===item));
  const ctx={trip,catalog,cities:catalog.cities,all:trip.items,city:item.city,
    people:[{id:1},{id:2},{id:3}],state:{placePhotos:{},favorites:[],votes:{}},
    activeSet:new Set(),compareIds:new Set(),browseSavedIds:new Set()};
  const facts=placeProfileModel(item,ctx).facts.map(([label])=>label);
  for(const label of ['Sehenswert','Praktische Besuchsplanung','Kombinierbar mit',
    'Anreise und Eingang','Vor Reisebeginn 2027 prüfen'])
    assert.ok(facts.includes(label),item.id+' missing '+label);
  const html=placeProfileHtml(item,ctx);
  assert.match(html,/Google Maps/);
  assert.match(html,/Originalangebot \/ Anbieter/);
  assert.match(html,/Vor Reisebeginn 2027 prüfen/);
  assert.match(html,/2027/);
 }
 const photography=unique.get('operator:v62:nice-musee-photographie');
 const trip=catalog.trips.find(t=>t.items.includes(photography));
 const html=placeProfileHtml(photography,{trip,catalog,cities:catalog.cities,all:trip.items,
  people:[{id:1},{id:2},{id:3}],state:{placePhotos:{},favorites:[],votes:{}}});
 assert.match(html,/Weitere offizielle Besucherinformationen/);
});

test('V65 seven licensed photos match their exact existing destinations',()=>{
 const photos=[
  ['paris-musee-curie','Musée Curie, Paris.JPG','Guilhem wilko','CC BY-SA 3.0'],
  ['paris-buttes-chaumont','Parc des Buttes-Chaumont.jpg','FreCha','CC BY-SA 4.0'],
  ['barcelona-cccb','Barcelona - Centre de Cultura Contemporània de Barcelona (CCCB).jpg','Zarateman','CC0 1.0'],
  ['nice-palais-lascaris','Palais Lascaris - Escalier.jpg','dalbera','CC BY 2.0'],
  ['nice-musee-photographie','Musee de la Photographie de Nice.jpg','Sprsarcastique','CC BY-SA 4.0'],
  ['genoa-villa-durazzo','Villa Durazzo- Pallavicini, Il Castello del Capitano a Genova Pegli, Italia.jpg','Faber1893','CC BY-SA 4.0'],
  ['genoa-parchi-nervi','Parchi di Nervi.jpg','Stefano Soresina','CC BY-SA 3.0'],
 ];
 for(const [id,file,author,license] of photos){
  const item=unique.get('operator:v62:'+id);
  assert.ok(item,id);
  const photo=curatedPlacePhoto(item);
  assert.ok(photo?.curated,id);
  assert.ok(photo.sourceUrl.includes(encodeURIComponent(file).replace(/%20/g,'_')),id);
  assert.ok(photo.credit.includes(author),id);
  assert.ok(photo.credit.includes(license),id);
  assert.match(photo.url,/commons.wikimedia.org\/wiki\/Special:FilePath/);
  assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null);
 }
});

test('V66 enriches 16 additional existing V61 entries across all applicable trip variants',async()=>{
 const v61=JSON.parse(await readFile(new URL(
  '../data/research-v61/official-discoveries.json',import.meta.url),'utf8'));
 assert.equal(v61.entries.length,16);
 const v61Items=all.filter(x=>x.discoveryV61?.visitorGuide);
 const unique61=new Map(v61Items.map(x=>[x.id,x]));
 assert.equal(unique61.size,16);
 for(const row of v61.entries){
  const item=unique61.get('operator:v61:'+row.id);
  assert.ok(item,row.id);
  assert.equal(item.booked,false);
  assert.equal(item.selected,false);
  assert.equal(item.price,null);
  assert.equal(item.point,null);
  assert.equal(item.discoveryV61.september2027OpeningConfirmed,false);
  assert.equal(item.discoveryV61.september2027TicketConfirmed,false);
  assert.deepEqual(item.discoveryV61.visitorGuide,row.visitorGuide);
  assert.ok(row.visitorGuide.highlights.length>=2);
  const trip=catalog.trips.find(t=>t.items.includes(item));
  const ctx={trip,catalog,cities:catalog.cities,all:trip.items,city:item.city,
   people:[{id:1},{id:2},{id:3}],state:{placePhotos:{},favorites:[],votes:{}}};
  const profile=placeProfileModel(item,ctx);
  assert.ok(profile.facts.some(([k])=>k==='Praktische Besuchsplanung'),row.id);
  assert.ok(profile.facts.some(([k])=>k==='Vor Reisebeginn 2027 prüfen'),row.id);
  assert.match(placeProfileHtml(item,ctx),/Google Maps/);
  assert.match(placeProfileHtml(item,ctx),/Originalangebot/);
 }
});
