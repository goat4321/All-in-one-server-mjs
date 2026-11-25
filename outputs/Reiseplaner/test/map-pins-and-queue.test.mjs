import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validateState} from '../lib/store.mjs';
import {activeItems} from '../public/model.mjs';
import {hasIndependentPointEvidence} from '../public/poi-location-provenance.mjs';
import {buildMultiStopDay} from '../public/day-route.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {footpathMatchesStops} from '../public/route-studio.mjs';

const trip={id:'pin-test',travellers:3,route:['barcelona'],items:[],from:'2027-09-03',to:'2027-09-05'};
const context=()=>({trip,variant:{id:trip.id,revision:0},page:'map',city:'barcelona',date:'2027-09-04',
 cities:{barcelona:{name:'Barcelona',timezone:'Europe/Madrid'}},state:initialState(trip),all:[]});
const a={id:'a',kind:'activity',name:'A',city:'barcelona',point:[41.38,2.18],duration:15};
const b={...a,id:'b',name:'B',point:[41.381,2.181]};
const route={walkOnly:true,points:[a.point,b.point],minutes:4,metres:180};

test('own pins start as unselected unverified places and survive normal state validation',async()=>{
 const {mapPinPatch}=await import('../public/map-pins.mjs');
 const ctx=context(),before=JSON.stringify(ctx.state);
 const next=mapPinPatch(ctx,null,{name:'Mein Treffpunkt',lat:41.38,lon:2.18,duration:15,detail:'Manueller Punkt'},'manual:pin');
 validateState(next,trip,[]);
 assert.equal(JSON.stringify(ctx.state),before);
 assert.equal(next.manual.length,1);assert.equal(next.manual[0].selected,false);
 assert.equal(next.manual[0].origin,'manuell');assert.equal(next.manual[0].verification,'ungeprüft');
 assert.equal(next.manual[0].start,null);assert.equal(next.manual[0].price,null);
 assert.equal(activeItems(trip,next).length,0);assert.equal(hasIndependentPointEvidence(next.manual[0]),false);
});

test('moving an own pin preserves its selected time but invalidates old coordinate evidence',async()=>{
 const {mapPinPatch}=await import('../public/map-pins.mjs');
 const ctx=context(),pin={...a,id:'manual:pin',userPin:true,zone:'Europe/Madrid',selected:false,price:null,
  geoEvidence:{url:'https://www.openstreetmap.org/node/1'},coordinatePrecision:'verified_exact'};
 ctx.state.manual=[pin];ctx.state.edits[pin.id]={selected:true,start:'2027-09-04T18:00:00.000Z',name:'Alter Name',point:a.point};
 ctx.all=[{...pin,...ctx.state.edits[pin.id]}];
 const next=mapPinPatch(ctx,ctx.all[0],{name:'Neuer Name',lat:41.39,lon:2.19,duration:20,detail:''});
 validateState(next,trip,[]);
 const active=activeItems(trip,next)[0];
 assert.equal(active.name,'Neuer Name');assert.equal(active.start,'2027-09-04T18:00:00.000Z');
 assert.deepEqual(active.point,[41.39,2.19]);assert.equal(hasIndependentPointEvidence(active),false);
 assert.ok(ctx.state.manual[0].geoEvidence.url,'Original input was not modified');
});

test('invalid pins, other source items, booked or locked own points cannot be changed',async()=>{
 const {mapPinPatch}=await import('../public/map-pins.mjs');
 const ctx=context(),fields={name:'Pin',lat:41.38,lon:2.18,duration:15};
 for(const patch of [{lat:''},{lon:null},{lat:91},{lat:NaN},{name:' '},{duration:0}])
  assert.throws(()=>mapPinPatch(ctx,null,{...fields,...patch},'manual:new'));
 assert.throws(()=>mapPinPatch(ctx,a,fields));
 for(const key of ['booked','locked']){
  const pin={...a,id:'manual:p',userPin:true,[key]:true};ctx.state.manual=[pin];
  assert.throws(()=>mapPinPatch(ctx,pin,fields));
 }
});

test('queue request gate rejects old generations, clear/readd and changed context or geometry',async()=>{
 const {createDayRouteGate}=await import('../public/day-route-request.mjs');
 const gate=createDayRouteGate(),ctx={...context(),all:[a,b]},ids=['a','b'];
 const first=gate.begin(ctx,ids);assert.equal(gate.isCurrent(first,ctx,ids),true);
 const second=gate.begin(ctx,ids);assert.equal(gate.isCurrent(first,ctx,ids),false);
 assert.equal(gate.isCurrent(second,ctx,['b','a']),false);
 for(const patch of [{date:'2027-09-05'},{city:'paris'},{page:'food'},
  {variant:{id:'other',revision:0}},{variant:{id:trip.id,revision:1}},
  {all:[a,{...b,point:[41.4,2.2]}]}])assert.equal(gate.isCurrent(second,{...ctx,...patch},ids),false);
 gate.invalidate();assert.equal(gate.isCurrent(second,ctx,ids),false);
});

test('an extra response or duplicate stop never yields a complete multi-stop itinerary',()=>{
 assert.equal(buildMultiStopDay([a,b],[route,route]).complete,false);
 assert.equal(buildMultiStopDay([a,{...b,id:a.id}],[route]).complete,false);
 assert.equal(buildMultiStopDay([a,b],[route]).complete,true);
 assert.equal(buildMultiStopDay([a,{...b,removed:true}],[route]).complete,false,'Deleted pins must never be rescheduled by a cached draft');
});

test('reordering or removing a preceding stop preserves focus on the same place',async()=>{
 const {queueFocusIndex}=await import('../public/day-route-request.mjs');
 assert.equal(queueFocusIndex(['a','b','c'],['b','a','c'],0),1);
 assert.equal(queueFocusIndex(['a','b','c'],['b','c'],2),1);
 assert.equal(queueFocusIndex(['a','b','c'],['a','c'],1),1);
 assert.equal(queueFocusIndex(['a'],[],0),0);
});

test('recorded public foot response has seven real walking legs joining eight stops',async()=>{
 const fixture=JSON.parse(await readFile(new URL('./fixtures/barcelona-foot-route.json',import.meta.url),'utf8'));
 assert.equal(createHash('sha256').update(JSON.stringify(fixture.response)).digest('hex'),fixture.responseSha256);
 assert.match(fixture.sourceUrl,/routing\.openstreetmap\.de\/routed-foot\//);
 assert.equal(fixture.observedOn,'2026-11-19');assert.equal(fixture.stops.length,8);
 assert.equal(fixture.response.routes[0].legs.length,7);
 const routes=fixture.response.routes[0].legs.map((leg,index)=>{
  assert.ok(leg.steps.every(step=>step.mode==='walking'));
  const route={walkOnly:true,minutes:Math.max(1,Math.ceil(leg.duration/60)),metres:Math.round(leg.distance),
   points:leg.steps.flatMap(step=>step.geometry.coordinates).map(([lon,lat])=>[lat,lon])};
  assert.equal(footpathMatchesStops(fixture.stops[index],fixture.stops[index+1],route),true);return route;
 });
 const stops=fixture.stops.map(stop=>({...stop,kind:'activity',duration:15}));
 const preview=buildMultiStopDay(stops,routes,'19:00');assert.equal(preview.complete,true);
 assert.equal(preview.rows.length,8);assert.equal(preview.end,'23:20');
 assert.equal(preview.knownWalkMinutes,140);
});
