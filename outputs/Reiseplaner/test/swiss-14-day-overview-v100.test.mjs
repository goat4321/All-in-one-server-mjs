import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {swiss14DayRowsV100,renderSwiss14DayOverviewV100,renderSwissDayBriefV100}
 from '../public/swiss-14-day-overview-v100.mjs';
import {SWISS_DAY_EDITORIAL_V85} from '../public/swiss-day-editorial-v85.mjs';

const catalog=await loadCatalog();
const swiss=catalog.trips.find(trip=>trip.id==='interrail_swiss');
const ctx=(trip,date='2027-09-01')=>({
 trip,date,cities:catalog.cities,
 dayPlan:trip.dayPlansV32?.find(day=>day.date===date)
});

test('V100 renders all 14 existing days and exactly three periods each',()=>{
 const rows=swiss14DayRowsV100(ctx(swiss));
 assert.equal(rows.length,14);
 assert.equal(rows.reduce((n,day)=>n+day.blocks.length,0),42);
 assert.deepEqual(rows.map(day=>day.date),SWISS_DAY_EDITORIAL_V85.map(day=>day.date));
 assert.deepEqual(rows.map(day=>day.city),
  ['paris','paris','barcelona','barcelona','barcelona','sete','sete',
   'nice','nice','kandersteg','kandersteg','appenzell','appenzell','appenzell']);
 const html=renderSwiss14DayOverviewV100(ctx(swiss));
 assert.equal((html.match(/class="swiss-14-day-card/g)??[]).length,14);
 assert.equal((html.match(/data-action="day-plan-go"/g)??[]).length,14);
 assert.equal((html.match(/class="swiss-14-day-block"/g)??[]).length,42);
 for(const date of rows.map(day=>day.date))assert.ok(html.includes('data-value="'+date+'"'),date);
 assert.match(html,/Alle vierzehn Tagespläne Interrail mit Schweiz/);
 assert.match(html,/Keine bestätigten Zugzeiten, Preise oder Buchungen/);
 assert.doesNotMatch(html,/data-action="day-plan-adopt"|data-action="day-plan-add"/);
});
test('V100 shows all 14 day labels in the real route, and protects long transfer days',()=>{
 const rows=swiss14DayRowsV100(ctx(swiss));
 for(const date of ['2027-09-10','2027-09-14']){
  const row=rows.find(day=>day.date===date);
  assert.equal(row.slots,0,date);
  assert.ok(row.rides>0,date);
  assert.equal(row.blocks.every(block=>!block.activity),true);
 }
 assert.equal(rows.at(-1).date,'2027-09-14');
 assert.match(rows.at(-1).title,/Rückfahrt/);
});
test('V100 current-day preview is readable and isolated to Swiss Interrail',()=>{
 const sept11=renderSwissDayBriefV100(ctx(swiss,'2027-09-11'));
 assert.match(sept11,/Oeschinensee/);
 assert.equal((sept11.match(/class="swiss-today-step"/g)??[]).length,3);
 assert.match(sept11,/Ohne feste Uhrzeiten oder automatische Buchungen/);
 const sept13=renderSwissDayBriefV100(ctx(swiss,'2027-09-13'));
 assert.match(sept13,/Seealpsee/);
 for(const trip of catalog.trips.filter(t=>t.id!=='interrail_swiss')){
  assert.equal(renderSwiss14DayOverviewV100(ctx(trip,trip.from)),'');
  assert.equal(renderSwissDayBriefV100(ctx(trip,trip.from)),'');
 }
});
test('V100 actual page imports summary and daily preview without changing source data',async()=>{
 const [views,styles]=await Promise.all([
  readFile(new URL('../public/views.mjs',import.meta.url),'utf8'),
  readFile(new URL('../public/editorial-web-v95.css',import.meta.url),'utf8')
 ]);
 assert.match(views,/renderSwiss14DayOverviewV100\(ctx\)/);
 assert.match(views,/renderSwissDayExperienceV101\\(ctx\\)/);
 assert.match(views,/renderDayNavigatorV101\\(ctx\\)/);
 assert.match(styles,/\.swiss-14-day-overview\{/);
 assert.match(styles,/\.swiss-14-day-grid\{/);
 assert.match(styles,/@media\(max-width:650px\)/);
 const before=JSON.stringify(swiss.dayPlansV32);
 renderSwiss14DayOverviewV100(ctx(swiss));
 renderSwissDayBriefV100(ctx(swiss,'2027-09-10'));
 assert.equal(JSON.stringify(swiss.dayPlansV32),before);
});
