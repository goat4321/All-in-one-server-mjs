import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {dayJumpRowsV103,renderDayJumpV103,renderDayReturnV103}
 from '../public/day-navigation-v103.mjs';

const catalog=await loadCatalog();
const ctx=(trip,date)=>({
 trip,date,cities:catalog.cities,
 dayPlan:trip.dayPlansV32.find(day=>day.date===date)
});

test('V103 day picker covers all 46 existing dates and protects each variant',()=>{
 let total=0;
 for(const trip of catalog.trips){
  for(const day of trip.dayPlansV32){
   const input=ctx(trip,day.date);
   const rows=dayJumpRowsV103(input);
   const picker=renderDayJumpV103(input);
   assert.equal(rows.length,trip.dayPlansV32.length);
   assert.equal(rows.filter(row=>row.selected).length,1);
   assert.equal((picker.match(/data-action="day-plan-go"/g)??[]).length,rows.length);
   assert.equal((picker.match(/aria-current="date"/g)??[]).length,1);
   assert.match(picker,/day103-picker/);
   assert.match(picker,/day103-navigation/);
   assert.match(picker,/day103-timeline/);
   assert.match(picker,/day-plan-draft-detail/);
   assert.match(renderDayReturnV103(input),/#day103-navigation/);
   if(trip.id==='interrail_swiss'){
    assert.match(picker,/#interrail-schweiz-tagesablauf/);
    assert.match(picker,/#day103-preparation/);
    assert.ok(picker.includes('Tag auswählen'));
   }else{
    assert.doesNotMatch(picker,/#interrail-schweiz-tagesablauf/);
    assert.doesNotMatch(picker,/#day103-preparation/);
   }
   total++;
  }
 }
 assert.equal(total,46);
});
test('V103 has no day navigation when a plan is missing or date is invalid',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_swiss');
 for(const date of ['2026-11-23','2027-09-15','evil&<>']){
  const input={trip,date,cities:catalog.cities,dayPlan:null};
  assert.deepEqual(dayJumpRowsV103(input),[]);
  assert.equal(renderDayJumpV103(input),'');
  assert.equal(renderDayReturnV103(input),'');
 }
});
test('V103 integrates semantic anchors, scoped smooth scrolling and opt-outs',async()=>{
 const base=new URL('../public/',import.meta.url);
 const [views,app,css,prep]=await Promise.all([
  readFile(new URL('views.mjs',base),'utf8'),
  readFile(new URL('app.mjs',base),'utf8'),
  readFile(new URL('editorial-web-v95.css',base),'utf8'),
  readFile(new URL('day-preparation-v102.mjs',base),'utf8')
 ]);
 assert.match(views,/renderDayJumpV103\(ctx\)/);
 assert.match(views,/renderDayReturnV103\(ctx\)/);
 assert.match(views,/id="day103-timeline"/);
 assert.match(prep,/id="day103-preparation"/);
 assert.match(app,/a\.day103-jump-link\[href\^="#day"\]/);
 assert.match(app,/target\.scrollIntoView/);
 assert.match(app,/window\.scrollTo\(\{top:0,behavior:'instant'\}\)/);
 assert.match(css,/\.day103-navigation\{/);
 assert.match(css,/position:sticky/);
 assert.match(css,/:root\[data-motion=off\]/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
