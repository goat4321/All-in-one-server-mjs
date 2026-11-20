import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {swissDayEditorial,swissDayEditorialPanel,SWISS_EDITORIAL_SOURCES}
 from '../public/swiss-day-editorial-v08.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_swiss');
const archive=catalog.research.interrailSwissEditorialV08;
const beforeTrip=JSON.stringify(trip.dayPlansV32);
const original=JSON.parse(await readFile(new URL('../data/day-plans-v32.json',import.meta.url)));
const sample=(date,overrides={})=>({
 trip,dayPlan:trip.dayPlansV32.find(day=>day.date===date),date,catalog,
 cities:catalog.cities,all:trip.items,active:[],activeSet:new Set(),
 people:[{id:'naol'},{id:'friend2'},{id:'friend3'}],state:{edits:{},placePhotos:{}},
 ...overrides
});
test('interrail_swiss only: exactly fourteen 2027 days, three travellers and 42 chronological phases',()=>{
 assert.equal(catalog.trips.length,4);
 assert.equal(archive.days.length,14);
 assert.equal(trip.dayPlansV32.length,14);
 assert.deepEqual(archive.days.map(x=>x.date),trip.dayPlansV32.map(x=>x.date));
 assert.deepEqual(archive.days.map(x=>x.city),trip.dayPlansV32.map(x=>x.city));
 assert.ok(archive.days.every(x=>x.tripId==='interrail_swiss'&&x.travellers===3&&x.status==='suggestion_only'));
 assert.ok(archive.days.every(x=>x.blocks.length===3));
 for(const day of archive.days){
  assert.deepEqual(day.blocks.map(b=>b.period),['morning','noon','evening']);
  assert.ok([day.food,day.buffer,day.alternative,day.risk].every(s=>s.length>=25),
    'Substantive meals, buffers, alternatives and caveats '+day.date);
  for(const block of day.blocks){
   assert.ok(block.title?.length>=10&&block.note?.length>=25);
   if(block.activityId)assert.ok(
    trip.dayPlansV32.find(p=>p.date===day.date).slots.some(s=>s.activityId===block.activityId),
    'Only a pre-existing matched v32 idea may receive an action: '+day.date+':'+block.activityId);
  }
  for(const sourceId of day.sourceIds)
   assert.ok(SWISS_EDITORIAL_SOURCES[sourceId]?.[1]?.startsWith('https://'),
    'Provider URL must be actually known '+sourceId);
 }
 assert.equal(archive.days.flatMap(x=>x.blocks).length,42);
 assert.equal(trip.people?.length??trip.travellers??3,3);
 assert.equal(archive.days[9].date,'2027-09-10');
 assert.equal(archive.days[13].date,'2027-09-14');
 assert.equal(archive.days[9].blocks.some(b=>b.activityId),false);
 assert.equal(archive.days[13].blocks.some(b=>b.activityId),false);
 assert.equal(JSON.stringify(trip.dayPlansV32),beforeTrip,'Never mutate source proposals');
 assert.equal(original.plans.filter(d=>d.tripId==='interrail_swiss').length,14);
});
test('every visible Swiss day renders exactly three blocks and no auto-written itinerary changes',()=>{
 const snapshot=JSON.stringify(trip.items);
 for(const day of archive.days){
  const ctx=sample(day.date);
  assert.ok(swissDayEditorial(ctx));
  const state=JSON.stringify(ctx.state);
  const html=swissDayEditorialPanel(ctx);
  assert.equal((html.match(/class="swiss-editorial-block"/g)??[]).length,3);
  assert.match(html,/3 REISENDE/);
  assert.match(html,/Budget-, Öffnungs- und Buchungsstatus/);
  assert.match(html,/Essen & Küche/);
  assert.match(html,/Puffer & Transfer/);
  assert.match(html,/Alternative/);
  assert.doesNotMatch(html,/on(?:load|click|error)=|<script|javascript:/i);
  assert.equal(JSON.stringify(ctx.state),state);
  if(day.date==='2027-09-10'||day.date==='2027-09-14')
   assert.doesNotMatch(html,/data-action="day-plan-add"/,'No fixed sightseeing on transfer-only day');
  assert.equal((html.match(/data-action="day-plan-add"/g)??[]).length,
   day.blocks.filter(x=>x.activityId).length,
   'Only the originally sourced slot may be adopted');
 }
 assert.equal(JSON.stringify(trip.items),snapshot);
});
test('10–13 September: rail reference, Gondel official time, rest, separate local train and hiking provenance',()=>{
 const d10=swissDayEditorialPanel(sample('2027-09-10'));
 const d11=swissDayEditorialPanel(sample('2027-09-11'));
 const d12=swissDayEditorialPanel(sample('2027-09-12'));
 const d13=swissDayEditorialPanel(sample('2027-09-13'));
 assert.match(d10,/12 Std\. 10 Min/);
 assert.match(d10,/HÖCHSTES RISIKO/);
 assert.doesNotMatch(d10,/2027er Gesamtverbindung bestätigt/);
 assert.match(d11,/24\.04\.–19\.09\.2027/);
 assert.match(d11,/08:30–18:00/);
 assert.match(d11,/www\.oeschinensee\.ch\/tarife-fahrplan/);
 assert.match(d12,/Kandersteg → Appenzell/);
 assert.match(d13,/Wasserauen/);
 assert.match(d13,/Appenzeller Bahnen/);
 assert.match(d13,/nicht stillschweigend als achten Pass-Tag/);
 assert.equal((d13.match(/data-action="day-plan-add"/g)??[]).length,2);
});
test('Paris and Barcelona reuse original activities, licensed-place thumbnails or clearly labelled city backdrop',()=>{
 for(const date of ['2027-09-01','2027-09-02','2027-09-03','2027-09-04','2027-09-05']){
  const html=swissDayEditorialPanel(sample(date));
  assert.match(html,/swiss-editorial-photo/);
  assert.match(html,/data-licensed="(?:true|false)"/);
  assert.match(html,/Ort & Quellen/);
  assert.match(html,/data-editorial-activity="act-/);
 }
});
test('four trips remain isolated and changing group size never invokes this three-person editorial',()=>{
 for(const other of catalog.trips.filter(t=>t.id!=='interrail_swiss')){
  const date=other.dayPlansV32[0].date;
  assert.equal(swissDayEditorialPanel(sample(date,{trip:other,
   dayPlan:other.dayPlansV32[0]})),'');
 }
 const ctx=sample('2027-09-11',{people:[{}, {}, {}, {}]});
 assert.equal(swissDayEditorialPanel(ctx),'');
 assert.equal(swissDayEditorial(ctx),null);
 assert.equal(JSON.stringify(trip.dayPlansV32),beforeTrip);
});
