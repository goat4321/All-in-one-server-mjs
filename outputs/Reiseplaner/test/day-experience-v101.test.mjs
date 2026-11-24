import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {
 dayExperienceStatsV101,renderDayNavigatorV101,
 swissDayExperienceModelV101,renderSwissDayExperienceV101,
 tripDayCoverageV104,renderTripDayCoverageV104
} from '../public/day-experience-v101.mjs';
import {itineraryPhotosV112,itineraryPhotoHtmlV112,itineraryDayImageV112} from '../public/place-profile.mjs';
import {SWISS_PROGRAM_V111,detailedDayModelV111,renderDetailedDayV111} from '../public/day-program-v111.mjs';
import {journeyModelV110,dayBudgetV110,dayMoveOptionsV110,renderDayJourneyControlsV110} from '../public/day-journey-v110.mjs';
import {dayEntries} from '../public/model.mjs';
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

test('V104 covers all variants and never treats zero-core or optional-only days as open',()=>{
 let days=0;
 for(const trip of catalog.trips){
  const input=ctx(trip);
  const m=tripDayCoverageV104(input);
  assert.ok(m,trip.id);
  assert.equal(m.rows.length,trip.dayPlansV32.length);
  assert.equal(m.rows.filter(r=>r.current).length,1);
  assert.equal(m.openDays,m.rows.filter(r=>r.core>0).length);
  assert.equal(m.adoptedDays,0);
  assert.equal(m.transferDays,trip.dayPlansV32.filter(p=>p.rides?.length||p.overnightArrivals?.length).length);
  const html=renderTripDayCoverageV104(input);
  assert.equal((html.match(/class="day104-card"/g)??[]).length,m.rows.length);
  assert.match(renderDayNavigatorV101(input),/day104-overview/);
  days+=m.rows.length;
 }
 assert.equal(days,46);
 for(const date of ['2027-09-10','2027-09-14']){
  const row=tripDayCoverageV104(ctx(swiss,date)).rows.find(r=>r.current);
  assert.equal(row.core,0);assert.equal(row.open,false);
  assert.ok(row.rides>0);
 }
});
test('V104 counts unique active core ideas on the correct date and skips optional or removed items',()=>{
 const date='2027-09-11',input=ctx(swiss,date);
 const core=input.dayPlan.slots.filter(s=>!s.optional);
 assert.ok(core.length>0);
 const active=core.map(s=>({id:s.id,kind:'activity',start:null,date}));
 const optional=input.dayPlan.slots.find(s=>s.optional);
 const extra=optional?[{id:optional.id,kind:'activity',start:null,date}]:[];
 const before=JSON.stringify(input.trip.dayPlansV32);
 const m=tripDayCoverageV104({...input,active:[...active,...active,...extra,
  {id:'removed',kind:'activity',date,removed:true},
  {id:'train',kind:'transport',date}]});
 const row=m.rows.find(r=>r.current);
 assert.equal(row.adopted,row.core);assert.equal(row.open,false);
 assert.equal(row.active,new Set([...active,...extra].map(x=>x.id)).size);
 assert.equal(row.optionalAdopted,extra.length);
 assert.equal(m.adoptedDays,1);
 assert.notEqual(m.nextOpen?.date,date);
 const moved=tripDayCoverageV104({...input,active:active.map(x=>({...x,date:'2027-09-12'}))});
 assert.equal(moved.rows.find(r=>r.current).adopted,0);
 assert.equal(JSON.stringify(input.trip.dayPlansV32),before);
 assert.equal(tripDayCoverageV104({...input,date:'2028-01-01'}),null);
});

test('V110 all 46 day models, including all 42 Swiss editorial blocks, remain read-only',()=>{
 let total=0,blocks=0;
 for(const trip of catalog.trips)for(const d of trip.dayPlansV32){
  const input=ctx(trip,d.date);
  const before=JSON.stringify(d);
  const m=journeyModelV110(input);
  assert.ok(m);assert.equal(m.stops.length,d.slots.filter(s=>!s.optional).length);
  assert.equal(m.legs.length,Math.max(0,m.stops.length-1));
  const html=renderDayJourneyControlsV110(input,m);
  assert.match(html,/KEIN LIVE-STANDORT/);
  if(trip.id==='interrail_swiss'){
   assert.equal(m.editorial.blocks.length,3);blocks+=3;
   assert.match(html,/Vollständiger Tagesablauf/);
   for(const b of m.editorial.blocks)assert.ok(html.includes(b.title.replaceAll('&','&amp;')));
  }else assert.equal(m.editorial,null);
  assert.equal(JSON.stringify(d),before);total++;
 }
 assert.equal(total,46);assert.equal(blocks,42);
});
test('V110 transfer endpoints are distinct and never presented as routed footpaths',()=>{
 const date='2027-09-10',input=ctx(swiss,date);
 const a={id:'rail',entryKey:'rail:Abfahrt',kind:'transport',role:'Abfahrt',name:'Nizza–Kandersteg',departure:'Nice',city:'nice',placeCity:'nice',point:[43.7,7.26],time:'08:00'};
 const b={...a,entryKey:'rail:Ankunft',role:'Ankunft',arrival:'Kandersteg',placeCity:'kandersteg',point:[46.49,7.67],time:'20:00'};
 const m=journeyModelV110({...input,fullDay:[a,b]});
 assert.equal(m.stops.length,2);assert.equal(m.located,2);
 assert.equal(m.legs[0].type,'transfer');assert.equal(m.legs[0].minutes,null);
 assert.ok(m.stops.every(x=>x.transfer));
 assert.match(renderDayJourneyControlsV110(input,m),/2027 ungeprüft/);
});
test('V110 only uses exact non-provider non-area POI positions; missing stop interrupts a route',()=>{
 const date='2027-09-02',input=ctx(swiss,date),slots=input.dayPlan.slots.filter(s=>!s.optional);
 assert.equal(slots.length,3);
 const points=[[48.86,2.29],[48.87,2.30],[48.88,2.31]];
 const source=slots.map((s,i)=>({id:s.id,kind:'activity',city:'paris',point:points[i],locationReferenceV07:{exactKnown:true}}));
 const testCtx={...input,all:source};
 const route={points:[points[0],points[1]],walkOnly:true,minutes:17};
 const m=journeyModelV110(testCtx,'draft',(a,b)=>a.id===slots[0].id?route:null);
 assert.equal(m.located,3);assert.equal(m.legs[0].type,'routed');assert.equal(m.legs[1].type,'schematic');
 for(const precision of ['provider_reported_unverified','sourced_area_center']){
  const broken=journeyModelV110({...testCtx,all:source.map((x,i)=>i===1?{...x,locationReferenceV07:{exactKnown:true,precision}}:x)});
  assert.equal(broken.located,2);assert.ok(broken.legs.every(l=>l.type==='gap'));
 }
 const stale=journeyModelV110(testCtx,'draft',()=>({...route,points:[[0,1],[0,2]]}));
 assert.ok(stale.legs.every(l=>l.type==='schematic'));
});
test('V110 budget uses each ledger row once, preserves unknown CHF and excludes undated trip costs',()=>{
 const date='2027-09-02';
 const rows=[{id:'a',date,category:'activity',euros:1200},{id:'b',date,category:'food',euros:null,original:900,currency:'CHF'},{id:'c',date,category:'food',euros:null},{id:'d',date:'2027-09-03',euros:4000},{id:'pass:interrail',euros:9000}];
 const b=dayBudgetV110({date,people:[{},{},{}],budget:{rows}});
 assert.equal(b.rows,3);assert.equal(b.eur,1200);assert.equal(b.known,1);assert.equal(b.unknown,2);
 assert.equal(b.groups.find(g=>g.key==='food').other.CHF,900);
});
test('V110 cross-day proposals exclude booked, timed and meal entries',()=>{
 const date='2027-09-02',input=ctx(swiss,date),base={id:'free',name:'Test',kind:'activity',city:'paris',date,start:null,end:null};
 const m=dayMoveOptionsV110({...input,dates:['2027-09-01',date,'2027-09-03'],cityForDay:d=>d==='2027-09-03'?'barcelona':'paris',fullDay:[base,{...base,id:'locked',locked:true},{...base,id:'meal',mealSlot:'lunch'},{...base,id:'timed',start:'2027-09-02T09:00:00Z'}]});
 assert.deepEqual(m,[{id:'free',name:'Test',date:'2027-09-01'}]);
});

test('V111 detailed itinerary covers every Swiss date and every existing V32 slot exactly once',()=>{
 let count=0,required=0,optional=0;
 const dates=swiss.dayPlansV32.map(d=>d.date);
 assert.deepEqual(Object.keys(SWISS_PROGRAM_V111),dates);
 for(const day of swiss.dayPlansV32){
  const input=ctx(swiss,day.date,{people:[{},{},{}],catalog,state:{edits:{},placePhotos:{}}});
  const before=JSON.stringify(day);
  const m=detailedDayModelV111(input);
  assert.ok(m.rows.length>=6,day.date);
  assert.deepEqual(m.rows.filter(x=>x.slot).map(x=>x.id).sort(),day.slots.map(x=>x.id).sort());
  assert.equal(m.activityMinutes,day.estimatedActivityMinutes);
  assert.ok(m.rows.some(x=>x.type==='meal'));
  assert.ok(m.rows.some(x=>['connection','pause','lodging'].includes(x.type)));
  for(const row of m.rows){
   const match=/^(\\d{2}):(\\d{2})–(\\d{2}):(\\d{2})$/.exec(row.time);
   if(match&&row.minutes!=null)assert.equal((+match[3]*60+ +match[4])-(+match[1]*60+ +match[2]),row.minutes,day.date+' '+row.title);
  }
  if(day.rides.length){assert.ok(m.rows.some(x=>x.type==='transfer'));assert.ok(m.rows.every(x=>!/^\\d{2}:/.test(x.time)));}
  if(['2027-09-10','2027-09-14'].includes(day.date))assert.equal(m.required,0);
  count+=m.rows.length;required+=m.required;optional+=m.rows.filter(x=>x.optional).length;
  assert.equal(JSON.stringify(day),before);
 }
 assert.ok(count>=90);assert.equal(required,26);assert.equal(optional,swiss.dayPlansV32.flatMap(d=>d.slots).filter(s=>s.optional).length);
 for(const trip of catalog.trips.filter(t=>t.id!=='interrail_swiss'))assert.equal(detailedDayModelV111(ctx(trip)),null);
});
test('V111 activity actions, group cost labels and map links use existing item IDs',()=>{
 const input=ctx(swiss,'2027-09-02',{people:[{},{},{}],catalog,state:{edits:{},placePhotos:{}}});
 const html=renderDetailedDayV111(input);
 assert.match(html,/09:45–10:35/);assert.match(html,/data-action="day111-map-stop"/);
 assert.match(html,/data-value="survey-v19:act-001"/);
 assert.match(html,/unverbindlichen Vorschläge/);
 assert.match(html,/Mittagspause/);
 const day=ctx(swiss,'2027-09-04',{people:[{},{},{}],catalog,state:{edits:{},placePhotos:{}}});
 const optional=renderDetailedDayV111(day);
 assert.match(optional,/data-optional="true"/);assert.match(optional,/Option übernehmen/);
});

test('V112 source-backed image coverage for all 14 days, no false lodging photos or nested anchors',()=>{
 for(const day of swiss.dayPlansV32){
  const input=ctx(swiss,day.date,{people:[{},{},{}],catalog,state:{edits:{},placePhotos:{}}});
  const cover=itineraryDayImageV112(input,day.date);
  assert.match(cover,/loading="lazy"/,day.date);
  assert.doesNotMatch(cover,/<a\s/);
  const html=renderDetailedDayV111(input);
  assert.match(html,/day112-gallery/,day.date);
 }
 const lodging={id:'unknown-lodging',kind:'lodging',city:'paris',name:'Unbekannte Unterkunft'};
 const imgs=itineraryPhotosV112(lodging);
 assert.equal(imgs.length,1);assert.equal(imgs[0].contextualOnly,true);
 assert.match(itineraryPhotoHtmlV112(lodging),/Stadtmotiv/);
 assert.match(itineraryPhotoHtmlV112(lodging),/Quelle/);
 assert.deepEqual(itineraryPhotosV112(lodging,{}, {context:false}),[]);
 const saved={url:'https://example.org/photo.jpg',sourceUrl:'https://example.org/source',credit:'Test CC BY 4.0'};
 assert.equal(itineraryPhotosV112(lodging,{state:{placePhotos:{[lodging.id]:[saved,saved]}}}).length,1);
});
