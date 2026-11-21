import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {loadFieldNotesV28,applyFieldNotesV28} from '../lib/research-v28.mjs';
import {fieldNoteHtml,fieldNoteStrip} from '../public/field-notes-ui.mjs';
import {placeInspectorHtml} from '../public/place-inspector.mjs';
import {initialState} from '../lib/store.mjs';
const archive=await loadFieldNotesV28(),catalog=await loadCatalog();
test('13 operator references match existing original activities',()=>{
 assert.equal(archive.entries.length,13);
 assert.equal(catalog.research.fieldNotesV28.assignedUnique,13);
 for(const n of archive.entries){
   assert.equal(n.bookingConfirmed,false);
   assert.equal(n.price2027CheckoutConfirmed,false);
   assert.equal(catalog.sources['field-note-v28:'+n.id].url,n.sourceUrl);
   assert.ok(catalog.trips.some(t=>t.items.some(x=>x.id==='survey-v19:'+n.id&&x.fieldNoteV28?.label===n.label)));
 }
});
test('Enrichment does not alter stored price or booking status',()=>{
 const item={id:'survey-v19:act-012',city:'barcelona',kind:'activity',name:'Keep',price:{cents:760,currency:'EUR'},booked:false,source:['base']},trip={items:[item]};
 applyFieldNotesV28([trip],{entries:archive.entries.filter(x=>x.id==='act-012')},[{id:'act-012',destination_id:'barcelona'}]);
 assert.equal(trip.items[0].price.cents,760);
 assert.equal(trip.items[0].booked,false);
 assert.deepEqual(trip.items[0].source,['base','field-note-v28:act-012']);
});
test('City map hints and place inspector are operable and escaped',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const ctx={catalog,trip,cities:catalog.cities,city:'barcelona',all:trip.items,day:[],
   people:[{id:1},{id:2},{id:3}],state:initialState(trip)};
 assert.match(fieldNoteStrip(ctx),/Besuchstipps mit Betreiberquelle/);
 const s=placeInspectorHtml(ctx,trip.items.find(x=>x.id==='survey-v19:act-012'));
 assert.match(s,/Besuch konkret planen/);
 assert.match(s,/Metro L2/);
 assert.match(s,/Offizielle Angaben öffnen/);
 assert.doesNotMatch(s,/onclick=|javascript:/i);
 const attacked=fieldNoteHtml({...archive.entries[0],check:'<img src=x onerror=alert(1)>'});
 assert.match(attacked,/&lt;img/);
 assert.doesNotMatch(attacked,/<img src=x/);
});
