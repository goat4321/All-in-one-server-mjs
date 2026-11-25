import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {dateRange} from '../public/model.mjs';
import {hudEvidence,hudSnapshot,renderMapHud,renderDayHud,
  renderHeaderHud,mapSelectionEvidence} from '../public/travel-hud.mjs';

const catalog=await loadCatalog();
const cx=trip=>{
 const dates=dateRange(trip.from,trip.to),city=trip.route.find(x=>x!=='munich')??trip.route[0];
 const all=trip.items,placed=all.filter(x=>Array.isArray(x.point)&&x.point.every(Number.isFinite));
 return {trip,catalog,cities:catalog.cities,state:initialState(trip),people:Array.from({length:trip.travellers},()=>({})),
   dates,date:dates[0],city,all,day:[],total:false,
   explorer:{placed,unlocated:all.filter(x=>!placed.includes(x))}};
};
test('HUD exposes measured photo/source and point facts across all four trips',()=>{
 assert.equal(catalog.trips.length,4);
 for(const trip of catalog.trips){
  const ctx=cx(trip);
  const model=hudSnapshot(ctx);
  const rows=ctx.all.filter(x=>x.city===ctx.city&&!x.removed&&!x.duplicateOf);
  assert.equal(model.area.total,new Set(rows.map(x=>x.id)).size);
  assert.equal(model.area.withPoint+model.area.withoutPoint,model.area.total);
  assert.ok(model.area.withPhoto<=model.area.total);
  assert.ok(model.area.withSource<=model.area.total);
  assert.ok(model.area.withGuide<=model.area.total);
  const header=renderHeaderHud(ctx),day=renderDayHud(ctx,0),map=renderMapHud(ctx);
  assert.match(header,/PLAN-TAG/);
  assert.match(header,/data-action="page"/);
  assert.match(day,/mit Weblink/);
  assert.match(day,/Kosten offen bzw. kostenlos/);
  assert.match(day,/Fotos prüfen/);
  assert.match(map,/Kartenpunkte/);
  assert.match(map,/Quellen & Bilder/);
  assert.match(map,/data-action="hud-audit" data-value="photo"/);
  assert.match(map,/data-action="hud-audit" data-value="location"/);
  assert.match(map,/kein Beleg für Öffnung, Preis oder exakte Eingänge/i);
  assert.doesNotMatch(map,/Echtzeit|live gebucht|garantiert/i);
 }
});
test('HUD deduplicates IDs, ignores removed placeholders, never labels a city midpoint an entrance',()=>{
 const rows=[
  {id:'x',name:'Ort',city:'paris',point:[48.86,2.35],source:['missing']},
  {id:'x',name:'Duplikat',city:'paris',point:[48.86,2.35]},
  {id:'removed',city:'paris',point:[48,2],removed:true},
  {id:'y',name:'Unverortet',city:'paris',point:null,
    guideV22:{sourceUrl:'https://example.org/guide'}},
 ];
 const counters=hudEvidence(rows,{placePhotos:{}},{});
 assert.equal(counters.total,2);
 assert.equal(counters.withPoint,1);
 assert.equal(counters.withoutPoint,1);
 assert.equal(counters.withSource,1);
 assert.equal(counters.withGuide,1);
 assert.equal(counters.withPhoto,0);
 assert.match(mapSelectionEvidence(rows.at(-1),{state:{},catalog:{sources:{}}}),/Kein individueller Pin/);
});
test('HUD reads original plan times and remains explicit that this is plan day, not real-time trip progress',()=>{
 const ctx=cx(catalog.trips[0]);
 ctx.date=ctx.dates[3];ctx.day=[{time:'10:30',name:'A'}, {time:'Flexibel',name:'B'},
   {time:null,name:'C'},{time:'25:00',name:'D'},{time:'18:30',name:'E'}];
 const h=hudSnapshot(ctx);
 assert.equal(h.dayIndex,3);
 assert.equal(h.scheduled,2);
 assert.equal(h.flexible,3);
 assert.equal(h.percent,Math.round(4/ctx.dates.length*100));
 const s=renderDayHud(ctx,21.5);
 assert.match(s,/2 mit Planzeit · 3 flexibel/);
 assert.match(s,/21,50/);
 assert.match(s,/Plankalendertag 4 von/);
});
test('HTML-escaping forbids injecting tags through location names',()=>{
 const ctx=cx(catalog.trips[0]);
 ctx.cities={...ctx.cities,[ctx.city]:{...ctx.cities[ctx.city],name:'<img src=x onerror=alert(1)>'}};
 const html=renderDayHud(ctx,0)+renderMapHud(ctx);
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/&lt;img/);
});
