import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyOperatorDiscoveriesV54} from '../lib/operator-discoveries-v54.mjs';
import {applyOperatorDiscoveriesV55} from '../lib/operator-discoveries-v55.mjs';
import {applyOperatorDiscoveriesV60} from '../lib/operator-discoveries-v60.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel,placeProfileHtml} from '../public/place-profile.mjs';

const archive=async n=>JSON.parse(await readFile(
  new URL('../data/research-v'+n+'/official-discoveries.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const guideLabels=['Sehenswert','Praktische Besuchsplanung','Kombinierbar mit',
 'Anreise und Eingang','Vor Reisebeginn 2027 prüfen'];

function context(item){
 const trip=catalog.trips.find(t=>t.items.includes(item));
 assert.ok(trip,item.id+' missing trip');
 return {trip,catalog,cities:catalog.cities,all:trip.items,city:item.city,
  people:[{id:1},{id:2},{id:3}],
  state:{placePhotos:{},favorites:[],votes:{}},
  activeSet:new Set(),compareIds:new Set(),browseSavedIds:new Set()};
}

test('V67: 37 distinct older V54/V55/V60 places have visitor guides in each eligible variant',async()=>{
 let total=0;
 for(const [version,expected] of [[54,13],[55,8],[60,16]]){
  const a=await archive(version);
  assert.equal(a.entries.length,expected);
  assert.equal(new Set(a.entries.map(x=>x.id)).size,expected);
  const imported=all.filter(x=>x['discoveryV'+version]);
  const unique=new Map(imported.map(x=>[x.id,x]));
  assert.equal(unique.size,expected);
  for(const row of a.entries){
   const records=imported.filter(x=>x.id==='operator:v'+version+':'+row.id);
   assert.ok(records.length>=1,row.id);
   assert.equal(row.visitorGuide.highlights.length>=2,true);
   for(const k of ['visitTip','combineWith','arrivalTip','check2027'])
    assert.ok(row.visitorGuide[k]?.trim(),row.id+' '+k);
   for(const item of records){
    assert.deepEqual(item['discoveryV'+version].visitorGuide,row.visitorGuide);
    assert.equal(item.price,null);
    assert.equal(item.booked,false);
    assert.equal(item.selected,false);
    assert.equal(item.start,null);
    assert.equal(item.end,null);
    assert.equal(item['discoveryV'+version].september2027TicketConfirmed,false);
    assert.equal(item['discoveryV'+version].september2027OpeningConfirmed,false);
    assert.equal(catalog.sources[item.source[0]]?.url,item.website);
    const profile=placeProfileModel(item,context(item));
    for(const label of guideLabels)assert.ok(profile.facts.some(([key])=>key===label),item.id+' '+label);
    const html=placeProfileHtml(item,context(item));
    assert.match(html,/Google Maps/);
    assert.match(html,/Originalangebot \/ Anbieter/);
    assert.match(html,/Vor Reisebeginn 2027 prüfen/);
   }
   total++;
  }
 }
 assert.equal(total,37);
});

test('V67: reject missing or malformed visitor guides before mutating trip items',async()=>{
 for(const [version,apply] of [[54,applyOperatorDiscoveriesV54],
   [55,applyOperatorDiscoveriesV55],[60,applyOperatorDiscoveriesV60]]){
  const a=await archive(version);
  a.entries[0].visitorGuide={...a.entries[0].visitorGuide,highlights:[]};
  const fake=[{id:'interrail_august',route:['toulouse','paris'],items:[]}];
  assert.throws(()=>apply(fake,catalog.cities,a),/invalid|lacks|valid/i);
  assert.equal(fake[0].items.length,0);
 }
});

test('V67: seven exact licensed images have matching subjects and source links',()=>{
 const cases=[
 ['venice','Museo Fortuny (Palazzo Pesaro degli Orfei)','Interno, Museo Fortuny, Venezia.jpg','Nicola Quirico','CC BY-SA 4.0'],
 ['sete','Musée de la Mer de Sète','Maquette du "Gabès" - Musée de la Mer de Sète, 2015.JPG','Anthony Levrot','CC BY-SA 4.0'],
 ['appenzell','Kunsthalle Appenzell (Ziegelhütte)','Appenzell-Kunsthalle.jpg','Roland Zumbuehl','CC BY 3.0'],
 ['toulouse','Halle de La Machine (Minotaure)','Minotaure.jpg','Frédéric Neupont','CC BY-SA 4.0'],
 ['toulouse','Musée Aeroscopia (Airbus A380)','Aeroscopia Blagnac.jpg','Patrice Bon','CC0 1.0'],
 ['narbonne','Musée Narbo Via','Musée Narbonne (1).jpg','Jcb-caz-11','CC BY-SA 4.0'],
 ['wasserauen','Berggasthaus Äscher','Äscher.jpg','FkMohr','CC BY-SA 3.0 DE']
 ];
 for(const [city,name,file,author,license] of cases){
  const item=all.find(x=>x.city===city&&x.name===name&&x.kind==='activity');
  assert.ok(item,name);
  const p=curatedPlacePhoto(item);
  assert.ok(p?.curated,name);
  assert.ok(p.sourceUrl.includes(encodeURIComponent(file).replace(/%20/g,'_')),name);
  assert.ok(p.credit.includes(author),name);
  assert.ok(p.credit.includes(license),name);
  assert.match(p.url,/commons.wikimedia.org\/wiki\/Special:FilePath/);
  assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null);
  if(file==='Äscher.jpg')assert.equal(p.licenseUrl,'https://creativecommons.org/licenses/by-sa/3.0/de/');
 }
});
