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
    assert.ok(item&&(item.hikingEvidence||item.surveyV19?.rawId===slot.activityId));
    assert.equal(item.city,slot.city);
    assert.equal(slot.minutes,item.duration);
    assert.equal(slot.optional===true||slot.optional===false,true);
   }
   days++;ideas+=day.slots.length;rides+=day.rides.length;
  }
 }
 assert.equal(days,46);assert.equal(ideas,100);assert.equal(rides,35);
 assert.equal(trips.flatMap(t=>t.dayPlansV32.flatMap(d=>d.slots)).filter(s=>s.id.startsWith('hiking:')).length,3);
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

test('Overnight train arrival is shown on the following day and transfer durations are only provisional',()=>{
 const august=trips.find(t=>t.id==='interrail_august');
 const departure=august.dayPlansV32.find(d=>d.date==='2027-08-17');
 const arrival=august.dayPlansV32.find(d=>d.date==='2027-08-18');
 assert.equal(departure.rides.length,2);
 assert.ok(departure.estimatedTravelMinutes>500);
 assert.equal(arrival.overnightArrivals.length,1);
 assert.match(arrival.overnightArrivals[0].to,/Toulouse/);
 assert.equal(arrival.overnightArrivals[0].confirmed2027,false);
 const html=dayPlanPanel(sample(august,'2027-08-18'));
 assert.match(html,/Nachtzug: Ankunft/);
 assert.match(html,/2027 nicht bestätigt/);
});

test('Progress indicators show only actually selected date-specific ideas',()=>{
 const trip=trips.find(t=>t.id==='interrail_classic');
 const ctx=sample(trip,'2027-09-04');
 const id=ctx.dayPlan.slots[0].id;
 const item=trip.items.find(i=>i.id===id);
 const rendered=dayPlanPanel({...ctx,
  active:[{...item,date:'2027-09-04',start:null,selected:true}],
  activeSet:new Set([id])});
 assert.match(rendered,/1 von 3 Tagesideen übernommen/);
 assert.match(rendered,/aria-valuenow="1"/);
 assert.match(rendered,/Im Tagesplan/);
 const index=dayPlanOverview({...ctx,
  active:[{...item,date:'2027-09-04',start:null,selected:true}]});
 assert.match(index,/1 übernommen/);
});

test('Concrete day-plan stops offer direct Google Maps lookup without claiming verified 2027 routes',()=>{
 let mapCount=0;
 for(const trip of trips)for(const day of trip.dayPlansV32){
  const ctx=sample(trip,day.date);
  const html=dayPlanPanel(ctx);
  const count=(html.match(/www\.google\.com\/maps\/search/g)||[]).length;
  mapCount+=count;
  if(count)assert.match(html,/2027 nicht bestätigt|keine bestätigten 2027/);
 }
 assert.ok(mapCount>0,'The 46 day plans should expose concrete place lookups');
});

test('Swiss editorial completes exactly 14 days with three sections, food, buffer and documented source checks',async()=>{
 const {SWISS_EDITORIAL_14,swissEditorialFor,swissEditorialPanel}
  =await import('../public/swiss-14-editorial-v08.mjs');
 const swiss=trips.find(t=>t.id==='interrail_swiss');
 assert.equal(SWISS_EDITORIAL_14.length,14);
 assert.deepEqual(SWISS_EDITORIAL_14.map(x=>x.date),dateRange(swiss.from,swiss.to));
 assert.equal(new Set(SWISS_EDITORIAL_14.map(x=>x.date)).size,14);
 const route=['paris','paris','barcelona','barcelona','barcelona','sete','sete',
  'nice','nice','kandersteg','kandersteg','appenzell','appenzell','appenzell'];
 assert.deepEqual(SWISS_EDITORIAL_14.map(x=>x.city),route);
 for(const [i,row] of SWISS_EDITORIAL_14.entries()){
  for(const key of ['morning','noon','evening','food','buffer','alternative']){
   assert.ok(typeof row[key]==='string'&&row[key].length>42,row.date+': '+key);
  }
  assert.ok(row.checks.length>=2);
  const base=sample(swiss,row.date);
  const ctx={...base,people:[{id:'a'},{id:'b'},{id:'c'}],catalog,day:[]};
  assert.equal(swissEditorialFor(ctx),row);
  const before=JSON.stringify(ctx.state);
  const html=swissEditorialPanel(ctx);
  assert.equal((html.match(/class="swiss-editorial-block"/g)||[]).length,3,row.date);
  assert.match(html,/Küche &amp; Lebensmittel/);
  assert.match(html,/Puffer/);
  assert.match(html,/Alternative/);
  assert.match(html,/Reisende · unverbindlicher Tagesentwurf/);
  assert.doesNotMatch(html,/on(?:click|load|change)=/i);
  assert.equal(JSON.stringify(ctx.state),before,'No writes even while rendering '+row.date);
  const orig=swiss.dayPlansV32[i];
  const actions=[...html.matchAll(/data-action="day-plan-add" data-value="([^"]+)"/g)]
   .map(m=>m[1]);
  assert.deepEqual(actions.sort(),orig.slots.map(s=>s.id).sort(),
   'Only original survey activities can be explicitly selected: '+row.date);
  assert.ok(!html.includes('data-action="day-plan-adopt"'),
   'Narrative never bulk-schedules an unsourced item');
 }
});
test('Swiss arrivals and return remain buffer-only; alpine checks stay explicit and original trips isolated',async()=>{
 const {swissEditorialPanel}=await import('../public/swiss-14-editorial-v08.mjs');
 const swiss=trips.find(t=>t.id==='interrail_swiss');
 const p=day=>swissEditorialPanel({...sample(swiss,day),people:[1,2,3],catalog});
 const ten=p('2027-09-10'),eleven=p('2027-09-11'),
  twelve=p('2027-09-12'),thirteen=p('2027-09-13'),
  last=p('2027-09-14');
 assert.doesNotMatch(ten,/data-action="day-plan-add"/);
 assert.doesNotMatch(last,/data-action="day-plan-add"/);
 assert.match(ten,/RE1/);
 assert.match(ten,/Check-in/);
 assert.match(eleven,/24.04.–19.09.2027/);
 assert.match(eleven,/Heuberg/);
 assert.match(twelve,/Sonntag/);
 assert.match(thirteen,/Regionalticket/);
 assert.match(thirteen,/T2/);
 assert.match(last,/Inbound/);
 for(const other of trips.filter(t=>t.id!=='interrail_swiss')){
  const ctx={...sample(other,other.from),people:[1,2,3],catalog};
  assert.equal(swissEditorialPanel(ctx),'','Never leak into '+other.id);
 }
 const four={...sample(swiss,'2027-09-13'),people:[1,2,3,4],catalog};
 assert.equal(swissEditorialPanel(four),'','4-person standalone Swiss trip must remain separate');
});
