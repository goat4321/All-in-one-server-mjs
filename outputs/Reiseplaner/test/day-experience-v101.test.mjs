import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {
 dayExperienceStatsV101,renderDayNavigatorV101,
 swissDayExperienceModelV101,renderSwissDayExperienceV101
} from '../public/day-experience-v101.mjs';
import {SWISS_DAY_EDITORIAL_V85} from '../public/swiss-day-editorial-v85.mjs';

const catalog=await loadCatalog();
const swiss=catalog.trips.find(trip=>trip.id==='interrail_swiss');
const ctx=(trip,date=trip.from,extra={})=>({
 trip,date,cities:catalog.cities,all:trip.items,active:[],
 activeSet:new Set(),dayPlan:trip.dayPlansV32?.find(d=>d.date===date),
 dayPlanFocus:'all',...extra
});

test('V101 navigation covers all days of all four variants, with safe boundaries',()=>{
 for(const trip of catalog.trips){
  for(const [i,day] of trip.dayPlansV32.entries()){
   const data=dayExperienceStatsV101(ctx(trip,day.date));
   assert.ok(data,trip.id+' '+day.date);
   assert.equal(data.index,i);
   assert.equal(data.totalDays,trip.dayPlansV32.length);
   assert.equal(data.previous,i?trip.dayPlansV32[i-1].date:null);
   assert.equal(data.next,i+1<trip.dayPlansV32.length?trip.dayPlansV32[i+1].date:null);
   const html=renderDayNavigatorV101(ctx(trip,day.date));
   assert.match(html,/day101-navigator/);
   assert.match(html,/day101-progress-meter/);
   assert.ok(html.includes('TAG '+(i+1)+' VON '+trip.dayPlansV32.length));
   assert.ok(html.includes('aria-valuenow="0"'));
   if(!i)assert.match(html,/aria-label="Erster Reisetag"/);
   if(i===trip.dayPlansV32.length-1)assert.match(html,/aria-label="Letzter Reisetag"/);
  }
 }
});
test('V101 Swiss plan is complete, sourced, and editable only through original items',()=>{
 assert.equal(SWISS_DAY_EDITORIAL_V85.length,14);
 for(const day of SWISS_DAY_EDITORIAL_V85){
  const input=ctx(swiss,day.date);
  const data=swissDayExperienceModelV101(input);
  assert.ok(data,day.date);
  assert.equal(data.blocks.length,3);
  const html=renderSwissDayExperienceV101(input);
  assert.equal((html.match(/class="day101-period-card"/g)??[]).length,3,day.date);
  assert.equal((html.match(/class="day101-filter"/g)??[]).length,4,day.date);
  assert.match(html,/day101-source-details/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/Keine fixierten Uhrzeiten oder Buchungen/);
  assert.ok(html.includes(day.sources[0][1].replaceAll('&','&amp;')),day.date);
  for(const block of data.blocks){
   assert.equal(block.slot?.id??null,block.activity?'survey-v19:'+block.activity:null);
   if(block.canAdd)assert.ok(html.includes('data-action="day-plan-add" data-value="'+block.slot.id+'"'));
  }
 }
});
test('V101 pure travel days cannot invent optional activities',()=>{
 for(const date of ['2027-09-10','2027-09-14']){
  const input=ctx(swiss,date);
  const data=swissDayExperienceModelV101(input);
  assert.equal(input.dayPlan.slots.length,0);
  assert.ok(data.blocks.every(block=>!block.slot&&!block.canAdd));
  assert.doesNotMatch(renderSwissDayExperienceV101(input),/data-action="day-plan-add"/);
 }
});
test('V101 actual selected items update day progress without new bookings',()=>{
 const input=ctx(swiss,'2027-09-11');
 const slot=input.dayPlan.slots.find(s=>s.id.startsWith('survey-v19:'));
 assert.ok(slot,'Oeschinensee must have existing candidate');
 const item=swiss.items.find(it=>it.id===slot.id);
 const selected={...item,kind:'activity',date:input.date,start:null,
  booked:false,locked:false,removed:false};
 const populated={...input,active:[selected],activeSet:new Set([slot.id])};
 const stats=dayExperienceStatsV101(populated);
 assert.equal(stats.selected,1);
 assert.equal(stats.percent,Math.round(100/input.dayPlan.slots.length));
 const html=renderSwissDayExperienceV101(populated);
 assert.ok(html.includes('data-action="day-quick-remove" data-value="'+slot.id+'"'));
 assert.doesNotMatch(html,/data-action="day-plan-adopt"/);
 const before=JSON.stringify(swiss.dayPlansV32);
 renderDayNavigatorV101(populated);renderSwissDayExperienceV101(populated);
 assert.equal(JSON.stringify(swiss.dayPlansV32),before);
});
test('V101 period selection only changes visibility and remains variant-scoped',async()=>{
 const input=ctx(swiss,'2027-09-13',{dayPlanFocus:'evening'});
 const html=renderSwissDayExperienceV101(input);
 assert.equal((html.match(/class="day101-period-card"[^>]* hidden/g)??[]).length,2);
 assert.match(html,/data-value="evening" aria-pressed="true"/);
 assert.match(html,/Abend ausgewählt/);
 for(const trip of catalog.trips.filter(trip=>trip.id!=='interrail_swiss')){
  assert.equal(renderSwissDayExperienceV101(ctx(trip,trip.from)),'');
  assert.equal(swissDayExperienceModelV101(ctx(trip,trip.from)),null);
 }
 const [views,app,css]=await Promise.all([
  readFile(new URL('../public/views.mjs',import.meta.url),'utf8'),
  readFile(new URL('../public/app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../public/editorial-web-v95.css',import.meta.url),'utf8')
 ]);
 assert.match(views,/renderDayNavigatorV101\(ctx\)/);
 assert.match(views,/renderSwissDayExperienceV101\(ctx\)/);
 assert.match(app,/case 'day-plan-focus'/);
 assert.match(app,/view\.dayPlanFocus='all'/);
 assert.match(css,/@keyframes day101-card-enter/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:root\[data-motion=off\]/);
});
