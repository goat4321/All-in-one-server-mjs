import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applySwissGuidesV75} from '../lib/swiss-guides-v75.mjs';
import {placeProfileModel,placeProfileHtml} from '../public/place-profile.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';

const archive=JSON.parse(await readFile(new URL('../data/research-v75/swiss-entry-guides.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const swissIds=['interrail_swiss','swiss_lakes'];
const swissCountryItems=trip=>trip.items.filter(x=>catalog.cities[x.city]?.country==='CH'&&!x.duplicateOf&&!x.removed);
const samples=swissIds.map(id=>catalog.trips.find(t=>t.id===id));
test('V75 two Swiss variants receive separate verified-context guides for every existing CH record',()=>{
 assert.deepEqual(archive.meta.variants,swissIds);
 assert.ok(archive.rules.length>=39);
 assert.ok(samples.every(Boolean));
 const stats=catalog.research.swissEntryGuidesV75.stats;
 assert.deepEqual(stats.missing,[]);
 assert.equal(stats.covered,stats.specific+stats.regional);
 assert.ok(stats.specific>10);
 assert.ok(stats.covered>50);
 for(const trip of samples){
   const entries=swissCountryItems(trip);
   assert.equal(stats.byVariant[trip.id].total,entries.length);
   assert.ok(entries.length>10);
   for(const item of entries){
     const g=item.swissGuideV75;
     assert.ok(g,'missing guide for '+trip.id+' / '+item.city+' / '+item.name);
     assert.equal(g.bookingConfirmed,false);
     assert.equal(g.livePriceConfirmed,false);
     assert.equal(g.geographyChanged,false);
     assert.match(g.sourceUrl,/^https:\/\//);
     assert.ok(g.access.length>12&&g.cost.length>12&&g.caution.length>12);
     assert.equal(g.sourceScope==='object'||g.sourceScope==='region',true);
     const model=placeProfileModel(item,{cities:catalog.cities,catalog,
      people:Array.from({length:trip.travellers},(_,i)=>({id:i})),state:{placePhotos:{}}});
     for(const heading of ['Schweiz · Einordnung','Schweiz · Anreise / Einstieg',
       'Schweiz · Kosten','Schweiz · Wetter / Sicherheit',
       'Schweiz · Vorbereitung für 2027','Quellenumfang Schweiz']){
       assert.ok(model.facts.some(x=>x[0]===heading),item.id+' '+heading);
     }
     const html=placeProfileHtml(item,{cities:catalog.cities,catalog,
      people:Array.from({length:trip.travellers},(_,i)=>({id:i})),state:{placePhotos:{}}},{compact:true});
     // HTML attributes correctly escape query-string '&' to '&amp;'.
     const renderedUrl=g.sourceUrl.replace(/&/g,'&amp;');
     assert.ok(html.includes(renderedUrl)||html.includes('Schweiz · regionale Besucherinformation'),item.id+' source');
   }
 }
});
test('V75 regional sources are labelled as orientation, never verified accommodation or geocoding',()=>{
 const trip=samples.find(x=>x.id==='swiss_lakes');
 const regional=swissCountryItems(trip).filter(x=>x.swissGuideV75.sourceScope==='region');
 assert.ok(regional.length>5);
 assert.ok(regional.every(x=>x.swissGuideV75.sourceLabel.includes('KEIN Nachweis')));
 assert.ok(regional.every(x=>x.swissGuideV75.materiallyVerifiedFor2027===false));
});
test('V75 exact source rules and known 2027 season are separate from live bookings',()=>{
 const list=samples.flatMap(swissCountryItems);
 const oesch=list.find(x=>x.swissGuideV75?.title==='oesch-gondel')
  ??list.find(x=>x.swissGuideV75?.title==='oesch-ufer');
 assert.ok(oesch,'No Oeschinensee reference in Swiss trips');
 assert.match(oesch.swissGuideV75.sourceUrl,/oeschinensee\.ch/);
 const urlIds=['bernerhof','glarnerhof','appenzell-blatten-6og3',
  'appenzell-alte','grindel-hostel','sunnbuel'];
 for(const id of urlIds)assert.ok(archive.rules.some(x=>x.key===id&&x.sourceUrl.startsWith('https://')),id);
 assert.ok(archive.rules.some(x=>x.key==='sunnbuel'&&/2027/.test(x.check2027)));
 assert.ok(archive.rules.some(x=>x.key==='oesch-gondel'&&/2027/.test(x.check2027)));
});
test('V75 no original trip itinerary, geometry, price or room booking can be mutated',()=>{
 const example={id:'swiss_lakes',route:['kandersteg','appenzell'],travellers:4,
 items:[{id:'a',city:'kandersteg',name:'Oeschinensee Gondel & leichter Seeweg',
  kind:'activity',point:[46.5,7.73],price:null,booked:false,selected:false},
  {id:'b',city:'appenzell',name:'Unknown private lodging',kind:'lodging',
   point:null,price:null,booked:false,selected:false}]};
 const before=structuredClone(example);
 const stats=applySwissGuidesV75([example],catalog.cities,archive);
 assert.equal(stats.covered,2);
 assert.equal(stats.specific,1);
 assert.equal(stats.regional,1);
 assert.deepEqual(example.route,before.route);
 for(let i=0;i<example.items.length;i++){
   for(const field of ['id','name','city','point','price','booked','selected'])
     assert.deepEqual(example.items[i][field],before.items[i][field]);
 }
 const bad=structuredClone(archive);bad.rules[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applySwissGuidesV75([structuredClone(before)],catalog.cities,bad),/V75 invalid rule/);
});
test('V75 place-specific Swiss Commons files are licensed and never used for private rooms',()=>{
 const cases=[
  ['oeschinensee','Oeschinensee leichte Wanderung','OeschinenseeCH.jpg','kat.lis','CC BY-SA 4.0'],
  ['kloental','Klöntalersee Wanderung','Klöntalersee Schweiz.jpg','gabriel_20xx','CC BY-SA 4.0'],
 ];
 for(const [city,name,file,author,license] of cases){
   const p=curatedPlacePhoto({id:'test:'+city,city,name,kind:'activity'});
   assert.ok(p,prefix(city,name));
   assert.ok(p.sourceUrl.includes(encodeURIComponent(file).replace(/%20/g,'_')));
   assert.ok(p.credit.includes(author)&&p.credit.includes(license));
   assert.match(p.licenseUrl,/creativecommons/);
   assert.equal(curatedPlacePhoto({id:'private',city,name,kind:'lodging'}),null);
 }
});
function prefix(city,name){return city+' '+name;}
