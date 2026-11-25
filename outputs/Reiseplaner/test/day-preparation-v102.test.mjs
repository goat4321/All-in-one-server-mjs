import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {PREPARATION_ITEMS_V102,preparationStorageKeyV102,
 readPreparationV102,togglePreparationV102,preparationModelV102,
 preparationTextV102,renderDayPreparationV102
} from '../public/day-preparation-v102.mjs';

const catalog=await loadCatalog();
const swiss=catalog.trips.find(x=>x.id==='interrail_swiss');
const makeCtx=(trip,date,done=[])=>({
 trip,date,preparationDone:done,cities:catalog.cities,
 dayPlan:trip.dayPlansV32.find(x=>x.date===date),
 active:[],all:trip.items
});
const memoryStore=()=>{
 const map=new Map();
 return {getItem:key=>map.get(key)??null,
  setItem:(key,val)=>map.set(key,val),entries:()=>[...map.entries()]};
};

test('V102 preparation panel covers 14 existing Swiss days and four other trip boundaries',()=>{
 assert.equal(PREPARATION_ITEMS_V102.length,5);
 assert.equal(new Set(PREPARATION_ITEMS_V102.map(x=>x.id)).size,5);
 const before=JSON.stringify(swiss.dayPlansV32);
 for(const day of swiss.dayPlansV32){
  const ctx=makeCtx(swiss,day.date);
  const model=preparationModelV102(ctx);
  assert.ok(model,day.date);
  assert.equal(model.items.length,5);
  const html=renderDayPreparationV102(ctx);
  assert.equal((html.match(/data-action="day-preparation-toggle"/g)??[]).length,5);
  assert.match(html,/kein Nachweis für eine Buchung, Öffnung oder Reservierung/);
  assert.match(html,/aria-valuemax="5" aria-valuenow="0"/);
  assert.match(html,/day-preparation-copy/);
  const summary=preparationTextV102(ctx);
  assert.ok(summary.includes(day.title),day.date);
  assert.ok(summary.includes('Quellen:'));
  assert.ok(summary.includes('Unverbindliche Planung'));
  if(day.rides.length){
   assert.ok(html.includes('Vorläufige Transfers'));
   assert.ok(summary.includes('2027 ungeprüft'));
  }
 }
 assert.equal(JSON.stringify(swiss.dayPlansV32),before);
 for(const trip of catalog.trips.filter(x=>x.id!=='interrail_swiss')){
  const ctx=makeCtx(trip,trip.from);
  assert.equal(preparationModelV102(ctx),null);
  assert.equal(renderDayPreparationV102(ctx),'');
  assert.equal(preparationTextV102(ctx),'');
 }
});
test('V102 checklist persists only personal review states per trip and day',()=>{
 const storage=memoryStore();
 assert.equal(readPreparationV102(storage,'interrail_swiss','2027-09-11').length,0);
 assert.deepEqual(togglePreparationV102(storage,'interrail_swiss','2027-09-11','food'),['food']);
 assert.deepEqual(togglePreparationV102(storage,'interrail_swiss','2027-09-11','backup'),['food','backup']);
 assert.deepEqual(readPreparationV102(storage,'interrail_swiss','2027-09-10'),[]);
 const checked=renderDayPreparationV102(makeCtx(swiss,'2027-09-11',
  readPreparationV102(storage,'interrail_swiss','2027-09-11')));
 assert.equal((checked.match(/aria-pressed="true"/g)??[]).length,2);
 assert.match(checked,/aria-valuenow="2"/);
 assert.deepEqual(togglePreparationV102(storage,'interrail_swiss','2027-09-11','food'),['backup']);
 assert.deepEqual(readPreparationV102(storage,'interrail_swiss','2027-09-11'),['backup']);
 assert.ok(storage.entries()[0][0].includes(preparationStorageKeyV102('interrail_swiss','2027-09-11')));
 assert.deepEqual(readPreparationV102(storage,'interrail_swiss','2027-09-11'),['backup']);
 assert.equal(togglePreparationV102(storage,'interrail_swiss','2027-09-11','not-a-task'),null);
 assert.equal(togglePreparationV102(storage,'swiss_lakes','2027-09-11','food'),null);
 assert.equal(togglePreparationV102(storage,'interrail_swiss','2027-09-20','food'),null);
});
test('V102 malformed storage is rejected and never grants external verification',()=>{
 const storage={getItem:()=>'{invalid',setItem:()=>{}};
 assert.deepEqual(readPreparationV102(storage,'interrail_swiss','2027-09-02'),[]);
 const malicious={getItem:()=>JSON.stringify(['food','invalid','food','connection']),setItem:()=>{}};
 assert.deepEqual(readPreparationV102(malicious,'interrail_swiss','2027-09-02'),['food','connection']);
 assert.deepEqual(readPreparationV102(malicious,'swiss_lakes','2027-09-02'),[]);
 const blocked={getItem:()=>null,setItem:()=>{throw Error('blocked')}};
 assert.equal(togglePreparationV102(blocked,'interrail_swiss','2027-09-02','food'),null);
});
test('V102 DOM wiring is scoped to Swiss planning and respects reduced motion',async()=>{
 const [views,app,styles]=await Promise.all([
  readFile(new URL('../public/views.mjs',import.meta.url),'utf8'),
  readFile(new URL('../public/app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../public/editorial-web-v95.css',import.meta.url),'utf8')
 ]);
 assert.match(views,/renderDayPreparationV102\(ctx\)/);
 assert.match(app,/preparationDone:readPreparationV102\(localStorage,trip.id,date\)/);
 assert.match(app,/case 'day-preparation-toggle'/);
 assert.match(app,/case 'day-preparation-copy'/);
 assert.match(styles,/V102 \/ daily Swiss Interrail preparation/);
 assert.match(styles,/day102-feedback/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(styles,/:root\[data-motion=off\]/);
});
