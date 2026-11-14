import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {dayPlanCandidates,dayPlanDraftEdits} from '../public/day-plans-logic.mjs';
import {dayPlanPanel,dayPlanOverview} from '../public/day-plans-ui.mjs';
import {dateRange} from '../public/model.mjs';

const catalog=await loadCatalog();
const trips=catalog.trips;
test('Exactly 46 complete, unique, source-backed days are provided across four variants',()=>{
 assert.equal(trips.length,4);
 const expected={interrail_classic:14,interrail_swiss:14,interrail_august:11,swiss_lakes:7};
 let days=0,ideas=0,rides=0;
 for(const trip of trips){
  const plans=trip.dayPlansV32;
  assert.equal(plans.length,expected[trip.id]);
  assert.deepEqual(plans.map(x=>x.date),dateRange(trip.from,trip.to));
  for(const day of plans){
   assert.equal(day.tripId,trip.id);
   assert.equal(day.status,'proposal_not_selected');
   assert.equal(day.verified2027Bookings,false);
   assert.equal(day.rides.every(t=>t.confirmed2027===false),true);
   assert.equal(new Set(day.slots.map(s=>s.id)).size,day.slots.length);
   for(const slot of day.slots){
    const item=trip.items.find(i=>i.id===slot.id);
    assert.ok(item&&item.surveyV19?.rawId===slot.activityId);
    assert.equal(item.city,slot.city);
    assert.equal(slot.minutes,item.duration);
    assert.equal(slot.optional===true||slot.optional===false,true);
   }
   days++;ideas+=day.slots.length;rides+=day.rides.length;
  }
 }
 assert.equal(days,46);assert.equal(ideas,97);assert.equal(rides,35);
});
test('Long transfer days stay deliberately free and optional tickets stay optional',()=>{
 const classic=trips.find(t=>t.id==='interrail_classic');
 assert.equal(classic.dayPlansV32.at(-1).slots.length,0);
 const swiss=trips.find(t=>t.id==='interrail_swiss');
 assert.equal(swiss.dayPlansV32.find(d=>d.date==='2027-09-10').slots.length,0);
 const club=classic.dayPlansV32.find(d=>d.date==='2027-09-04')
  .slots.find(s=>s.activityId==='act-016');
 assert.equal(club?.optional,true);
 const lakes=trips.find(t=>t.id==='swiss_lakes');
 assert.ok(lakes.dayPlansV32.find(d=>d.date==='2027-09-10').reference.url.startsWith('https://'));
});
const sample=(trip,date)=>{
 const plan=trip.dayPlansV32.find(p=>p.date===date);
 return {trip,dayPlan:plan,date,all:trip.items,cities:catalog.cities,
  activeSet:new Set(),active:[],state:{edits:{}}};
};
test('Bulk adoption creates drafts only, does not mutate source or book anything',()=>{
 const trip=trips.find(t=>t.id==='interrail_classic');
 const ctx=sample(trip,'2027-09-04');
 const original=JSON.stringify(ctx.state.edits);
 assert.equal(dayPlanCandidates(ctx).some(s=>s.optional),false);
 const result=dayPlanDraftEdits(ctx);
 assert.equal(result.added.length,2);
 assert.equal(JSON.stringify(ctx.state.edits),original);
 for(const slot of result.added){
  const edit=result.edits[slot.id];
  assert.equal(edit.selected,true);assert.equal(edit.date,ctx.date);
  assert.equal(edit.start,null);assert.equal(edit.end,null);
  assert.equal(edit.booked,undefined);assert.equal(edit.price,undefined);
 }
 const optional=ctx.dayPlan.slots.find(x=>x.optional);
 const single=dayPlanDraftEdits(ctx,{activityId:optional.id});
 assert.deepEqual(single.added.map(x=>x.id),[optional.id]);
 const taken={...ctx,activeSet:new Set([result.added[0].id])};
 assert.equal(dayPlanDraftEdits(taken).added.length,1);
});
test('All trips render discoverable day index and correct selected-day proposals',()=>{
 for(const trip of trips){
  const ctx=sample(trip,trip.dayPlansV32[0].date);
  const list=dayPlanOverview(ctx);
  assert.equal((list.match(/data-action="day-plan-go"/g)||[]).length,trip.dayPlansV32.length);
  assert.match(list,/Alle \d+ Tagespläne ansehen/);
  const open=dayPlanPanel({...ctx,day:[]});
  const compact=dayPlanPanel({...ctx,day:[]},{compact:true});
  assert.match(open,/Tagesvorschlag/);
  assert.match(compact,/day-plan-compact/);
  assert.match(open,/2027 nicht bestätigt|keine zusätzlichen Aktivitäten/i);
  assert.doesNotMatch(open,/on(?:click|load|change)=/i);
 }
});

test('Compact proposal cards start collapsed and expand when state requests it',()=>{
 const trip=trips.find(t=>t.id==='swiss_lakes');
 const ctx=sample(trip,'2027-09-06');
 const closed=dayPlanPanel({...ctx,day:[]},{compact:true});
 assert.doesNotMatch(closed,/class="day-plan-panel day-plan-compact" open/);
 const expanded=dayPlanPanel({...ctx,day:[],dayPlanOpen:true},{compact:true});
 assert.match(expanded,/class="day-plan-panel day-plan-compact" open/);
});

test('Map draft uses existing sourced photo or icon placeholder only',()=>{
 const trip=trips.find(t=>t.id==='interrail_classic'),ctx=sample(trip,'2027-09-04');
 const markup=dayPlanPanel({...ctx,day:[]},{compact:true});
 assert.equal((markup.match(/class="day-plan-photo"/g)||[]).length,ctx.dayPlan.slots.length);
 assert.match(markup,/place-thumbnail/);
 assert.doesNotMatch(markup,/javascript:|onerror=/i);
});
