import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {loadResearchV22,applyResearchV22} from '../lib/research-v22.mjs';
import {placeInspectorHtml,inspectorNearby} from '../public/place-inspector.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';
import {placeProfileHtml} from '../public/place-profile.mjs';

const catalog=await loadCatalog();
test('21 independently sourced official guides preserve IDs, dates and non-booking status',async()=>{
 const archive=await loadResearchV22();
 assert.equal(archive.entries.length,21);
 assert.equal(archive.total,21);
 assert.equal(catalog.research.researchV22.entries.length,21);
 assert.ok(catalog.research.researchV22.assignments>=21);
 assert.equal(new Set(archive.entries.map(x=>x.id)).size,21);
 for(const row of archive.entries){
   assert.match(row.sourceUrl,/^https:\/\//);
   assert.ok(row.highlights.length>=2);
   assert.equal(row.bookingConfirmed,false);
   assert.equal(row.photoRightsProvided,false);
   assert.ok(catalog.trips.some(t=>t.items.some(x=>x.id==='survey-v19:'+row.id&&
     x.guideV22?.sourceUrl===row.sourceUrl)));
 }
 const classic=catalog.trips.find(x=>x.id==='interrail_classic');
 const eiffel=classic.items.find(x=>x.id==='survey-v19:act-006');
 const louvre=classic.items.find(x=>x.id==='survey-v19:act-005');
 assert.equal(eiffel.price.cents,760,'official 2027 ticket stays from V20');
 assert.equal(louvre.price,null,'Louvre free entry conditional, not assumed');
 assert.match(eiffel.guideV22.summary,/7,60/);
 assert.match(louvre.guideV22.practical,/Berechtigung/);
 const claims=catalog.sources['guide-v22:act-006'];
 assert.ok(claims.url?.startsWith('https://www.toureiffel.paris/'));
});
test('Guides never turn the underlying research into tickets or change optional choices',async()=>{
 const archive=await loadResearchV22();
 const testTrip={id:'test',items:[
   {id:'survey-v19:act-006',kind:'activity',city:'paris',name:'Keep name',
     detail:'Original description',price:{cents:400,currency:'EUR',scope:'person'},
     booked:false,selected:false,source:['original']},
 ]};
 const one={...archive,total:1,entries:[archive.entries.find(x=>x.id==='act-006')]};
 const result=applyResearchV22([testTrip],one);
 assert.equal(result.assignments,1);
 assert.equal(testTrip.items[0].name,'Keep name');
 assert.equal(testTrip.items[0].price.cents,400);
 assert.equal(testTrip.items[0].detail,'Original description');
 assert.equal(testTrip.items[0].booked,false);
 assert.equal(testTrip.items[0].selected,false);
 assert.deepEqual(testTrip.items[0].source,['original','guide-v22:act-006']);
});
test('Every trip entry has an accessible full inspector with independent evidence tabs',()=>{
 for(const trip of catalog.trips){
   const ctx={catalog,trip,cities:catalog.cities,
     people:Array.from({length:trip.travellers},(_,i)=>({id:'p'+(i+1)})),
     state:initialState(trip),all:trip.items};
   for(const item of trip.items){
     const html=placeInspectorHtml(ctx,item);
     assert.match(html,/inspector-shell/);
     assert.equal((html.match(/role="tabpanel"/g)||[]).length,5);
     assert.equal((html.match(/role="tab"/g)||[]).length,5);
     assert.match(html,/Auf Karte zeigen/);
     assert.match(html,/Quellen/);
     assert.match(html,/Kosten/);
     assert.match(html,/Was bedeutet €/);
     assert.match(html,/Wie belastbar ist ein Quellenbeleg/);
     assert.doesNotMatch(html,/onclick=|javascript:/i);
     assert.doesNotMatch(html,/>undefined</);
   }
 }
});
test('The inspector shows official specific claims with source and separates straight-line distances',()=>{
 const trip=catalog.trips.find(x=>x.id==='interrail_classic');
 const ctx={catalog,trip,cities:catalog.cities,
   people:[{id:'p1'},{id:'p2'},{id:'p3'}],
   state:initialState(trip),all:trip.items};
 const x=trip.items.find(p=>p.id==='survey-v19:act-011');
 const html=placeInspectorHtml(ctx,x);
 assert.match(html,/Turó de la Rovira/);
 assert.match(html,/09:00–19:30/);
 assert.match(html,/guia.barcelona.cat/);
 assert.match(html,/Nur Luftlinie/);
 assert.ok(entryCompleteness(x,ctx).hasStory);
 assert.match(placeProfileHtml(x,ctx),/Quellen und Aktualität/);
 const seenGuide=catalog.trips.flatMap(t=>t.items).find(x=>x.id==='survey-v19:act-045'&&x.guideV22);
 assert.match(seenGuide.guideV22.practical,/separate Wegvariante/);
 const neighbors=inspectorNearby(ctx,x);
 assert.ok(neighbors.every(a=>a.km<=5&&a.km>=0&&a.item.city===x.city));
 assert.ok(neighbors.every((a,i)=>i===0||neighbors[i-1].km<=a.km));
});
