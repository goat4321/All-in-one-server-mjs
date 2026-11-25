import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {SWISS_DAY_EDITORIAL_V85,renderSwissDayEditorialV85} from '../public/swiss-day-editorial-v85.mjs';
import {dayPlanPanel} from '../public/day-plans-ui.mjs';

const catalog=await loadCatalog();
const target=catalog.trips.find(x=>x.id==='interrail_swiss');
const makeCtx=(trip,date)=>({
 trip,date,catalog,all:trip.items,active:[],activeSet:new Set(),
 people:Array.from({length:trip.travellers},(_,i)=>({id:i+1})),
 cities:catalog.cities,dayPlan:trip.dayPlansV32?.find(x=>x.date===date),
 state:{placePhotos:{}}
});
test('V85 has exactly 14 Swiss-Interrail dates, city sequence and 42 editorial slots',()=>{
 assert.ok(target);
 assert.equal(target.travellers,3);
 assert.equal(target.from,'2027-09-01');
 assert.equal(target.to,'2027-09-14');
 assert.equal(SWISS_DAY_EDITORIAL_V85.length,14);
 assert.deepEqual(SWISS_DAY_EDITORIAL_V85.map(x=>x.city),[
  'paris','paris','barcelona','barcelona','barcelona',
  'sete','sete','nice','nice','kandersteg','kandersteg',
  'appenzell','appenzell','appenzell']);
 assert.deepEqual(SWISS_DAY_EDITORIAL_V85.map(x=>x.date),
  Array.from({length:14},(_,i)=>'2027-09-'+String(i+1).padStart(2,'0')));
 for(const day of SWISS_DAY_EDITORIAL_V85){
  const old=target.dayPlansV32.find(x=>x.date===day.date);
  assert.equal(old?.city,day.city,day.date);
  assert.deepEqual(day.blocks.map(x=>x.period),['morning','noon','evening']);
  for(const block of day.blocks){
   assert.ok(block.title.length>8&&block.detail.length>45,day.date);
   if(block.activity)assert.ok(old.slots.some(s=>s.id==='survey-v19:'+block.activity),
    day.date+' must not invent another active stop');
  }
  for(const key of ['food','cost','access','buffer','alternative'])
   assert.ok(day[key].length>45,day.date+': '+key);
  assert.ok(day.sources.length>=2);
  for(const [label,url] of day.sources){
   assert.ok(label.length>2);
   const parsed=new URL(url);
   assert.equal(parsed.protocol,'https:');
   assert.ok(parsed.hostname.includes('.'));
  }
 }
});
test('V85 is a clearly read-only supplement, while existing actions retain explicit adoption',()=>{
 const original=JSON.stringify(catalog.trips);
 for(const day of SWISS_DAY_EDITORIAL_V85){
  const ctx=makeCtx(target,day.date),html=renderSwissDayEditorialV85(ctx);
  assert.match(html,/swiss-day-editorial/);
  assert.equal((html.match(/class="swiss-editorial-block"/g)||[]).length,3);
  assert.match(html,/Morgen, Mittag &amp; Abend/);
  assert.match(html,/nichts automatisch übernommen/);
  assert.match(html,/Keine Buchung und keine Änderung am Gruppenbudget/);
  assert.doesNotMatch(html,/data-action="day-plan-add"|data-action="day-plan-adopt"/);
  assert.ok(html.includes(day.sources[0][1].replaceAll('&','&amp;')));
  assert.match(dayPlanPanel(ctx),/swiss-day-editorial/);
 }
 assert.equal(JSON.stringify(catalog.trips),original);
});
test('V85 Swiss critical days are not padded with additional invented attractions',()=>{
 for(const date of ['2027-09-10','2027-09-14']){
  const row=SWISS_DAY_EDITORIAL_V85.find(x=>x.date===date);
  assert.equal(target.dayPlansV32.find(x=>x.date===date).slots.length,0);
  assert.ok(row.blocks.every(x=>!x.activity));
 }
 const sep10=renderSwissDayEditorialV85(makeCtx(target,'2027-09-10'));
 assert.match(sep10,/BLS RE1/);
 assert.match(sep10,/Check-in/);
 assert.doesNotMatch(sep10,/bestätigte 2027-Fahrplan/);
 const sep11=renderSwissDayEditorialV85(makeCtx(target,'2027-09-11'));
 assert.match(sep11,/24\.04.–19\.09\.2027/);
 assert.match(sep11,/08:30–18:00/);
 const sep12=renderSwissDayEditorialV85(makeCtx(target,'2027-09-12'));
 assert.match(sep12,/Sonntag/);
 const sep13=renderSwissDayEditorialV85(makeCtx(target,'2027-09-13'));
 assert.match(sep13,/Regionalticket/);
 assert.match(sep13,/T2/);
 assert.match(sep13,/Äscher/);
});
test('V85 does not show on the separate Swiss lakes or the two other Interrail variants',()=>{
 for(const trip of catalog.trips.filter(x=>x.id!=='interrail_swiss')){
  assert.equal(renderSwissDayEditorialV85(makeCtx(trip,trip.from)),'');
 }
 assert.equal(renderSwissDayEditorialV85({...makeCtx(target,'2027-09-11'),
  trip:{...target,travellers:4}}),'');
 assert.equal(renderSwissDayEditorialV85(makeCtx(target,'2027-09-15')),'');
});
