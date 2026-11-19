import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {inspectorComparisonHtml} from '../public/inspector-comparison.mjs';
import {placeInspectorHtml} from '../public/place-inspector.mjs';
const catalog=await loadCatalog();
const context=trip=>({
  catalog,trip,cities:catalog.cities,people:Array.from({length:trip.travellers},(_,i)=>({id:'p'+(i+1)})),
  state:initialState(trip),all:trip.items
});
test('Places can be compared without automatically selecting or booking them',()=>{
 for(const trip of catalog.trips){
  const ctx=context(trip);
  const first=trip.items.find(x=>x.kind==='activity'&&!x.removed);
  const second=trip.items.find(x=>x.kind===first.kind&&x.city===first.city&&x.id!==first.id);
  assert.ok(second,'Each trip must offer two local candidates');
  const x=inspectorComparisonHtml(ctx,[first.id,second.id]);
  assert.match(x,/Optionen gegenüberstellen/);
  assert.match(x,/Preisstufe/);
  assert.match(x,/Buchungsstatus/);
  assert.match(x,/Position/);
  assert.match(x,/inspector-compare-remove/);
  assert.match(x,/Quellen/);
  assert.equal((x.match(/data-action="inspector-compare-detail"/g)||[]).length,2);
  assert.ok(trip.items.every(a=>a.booked===undefined||typeof a.booked==='boolean'));
  const card=placeInspectorHtml(ctx,first,[first.id]);
  assert.match(card,/Aus Vergleich nehmen/);
  const other=placeInspectorHtml(ctx,second,[first.id,second.id]);
  assert.ok(other.includes('Vergleich (2)'));
  assert.doesNotMatch(x,/on(?:click|change|load)=/i);
 }
});
test('Comparison respects exact trip/city/kind, ignores fake IDs and caps at three items',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const ctx=context(trip);
 const paris=trip.items.filter(x=>x.city==='paris'&&x.kind==='activity');
 assert.ok(paris.length>=4);
 const other=trip.items.find(x=>x.city!=='paris'&&x.kind==='activity');
 const x=inspectorComparisonHtml(ctx,[
   paris[0].id,paris[1].id,other.id,paris[2].id,paris[3].id,
   'not-a-real-id',
 ]);
 assert.equal((x.match(/data-action="inspector-compare-detail"/g)||[]).length,3);
 assert.ok(!x.includes(other.name));
 assert.match(inspectorComparisonHtml(ctx,[paris[0].id]),/Weitere Option auswählen/);
 assert.match(inspectorComparisonHtml(ctx,['not-a-real-id']),/Weitere Option auswählen/);
});
test('Actual published Eiffel youth fare and conditional Louvre price remain distinct',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_classic'),ctx=context(trip);
 const eiffel=trip.items.find(x=>x.id==='survey-v19:act-006');
 const louvre=trip.items.find(x=>x.id==='survey-v19:act-005');
 const x=inspectorComparisonHtml(ctx,[eiffel.id,louvre.id]);
 assert.match(x,/7,60/);
 assert.match(x,/Bedingt kostenlos|€\?/);
 assert.match(x,/Nicht bestätigt gebucht/);
 assert.match(x,/Quelle öffnen/);
});
