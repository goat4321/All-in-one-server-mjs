import test from 'node:test';
import assert from 'node:assert/strict';
import { routeStudioModel, routeStudioSummary, MAP_TONES } from '../public/route-studio.mjs';
import { dayRouteView } from '../public/day-route-ui.mjs';

const barcelona=[
 {id:'a',name:'Parc de la Ciutadella',city:'barcelona',point:[41.388,2.186],duration:55},
 {id:'b',name:'Arc de Triomf',city:'barcelona',point:[41.391,2.181],duration:40},
 {id:'c',name:'Plaça Catalunya',city:'barcelona',point:[41.387,2.170],duration:30},
];

test('Route Studio shows no fabricated distance/time for missing walking geometry',()=>{
 const model=routeStudioModel(barcelona,[]);
 assert.equal(model.stops.length,3);
 assert.equal(model.legs.length,2);
 assert.equal(model.verifiedCount,0);
 assert.equal(model.knownMinutes,0);
 assert.equal(model.knownMetres,0);
 assert.equal(model.complete,false);
 assert.ok(model.legs.every(leg=>leg.pointType==='schematic_straight_line'));
 assert.ok(model.legs.every(leg=>leg.minutes===null&&leg.metres===null));
 assert.match(routeStudioSummary(model),/gestrichelte Luftlinie/);
});

test('Only independently routed walking geometry adds minutes and distance',()=>{
 const route={walkOnly:true,minutes:7,metres:490,
   points:[[41.388,2.186],[41.390,2.185],[41.391,2.181]]};
 const model=routeStudioModel(barcelona,[route],1);
 assert.equal(model.selectedIndex,1);
 assert.equal(model.activeLeg,0);
 assert.equal(model.verifiedCount,1);
 assert.equal(model.knownMinutes,7);
 assert.equal(model.knownMetres,490);
 assert.deepEqual(model.legs[0].points,route.points);
 assert.equal(model.legs[0].pointType,'calculated_footpath');
 assert.equal(model.legs[1].pointType,'schematic_straight_line');
 assert.equal(model.complete,false);
 const invalid={...route,walkOnly:false,minutes:12};
 const fake=routeStudioModel(barcelona.slice(0,2),[invalid]);
 assert.equal(fake.knownMinutes,0);
 assert.equal(fake.legs[0].minutes,null);
});

test('Complete verified route totals are clear, focus selection is bounded',()=>{
 const routes=[
 {walkOnly:true,minutes:8,metres:680,points:[barcelona[0].point,[41.390,2.184],barcelona[1].point]},
 {walkOnly:true,minutes:15,metres:1200,points:[barcelona[1].point,[41.388,2.176],barcelona[2].point]}
 ];
 const m=routeStudioModel(barcelona,routes,999);
 assert.equal(m.selectedIndex,2);
 assert.equal(m.activeLeg,1);
 assert.equal(m.knownMinutes,23);
 assert.equal(m.knownMetres,1880);
 assert.equal(m.complete,true);
 assert.match(routeStudioSummary(m),/echter Weggeometrie/);
 const m2=routeStudioModel(barcelona,routes,-50);
 assert.equal(m2.selectedIndex,0);
 assert.equal(m2.activeLeg,0);
});

test('City mismatch or missing GPS never produces a misleading schematic segment',()=>{
 const out=routeStudioModel([barcelona[0],
   {...barcelona[1],city:'paris'}],[{walkOnly:true,minutes:1,metres:25,points:[barcelona[0].point,barcelona[1].point]}]);
 assert.equal(out.legs[0].pointType,'no_coordinates');
 assert.equal(out.legs[0].verified,false);
 assert.deepEqual(out.legs[0].points,[]);
 const absent=routeStudioModel([barcelona[0],{...barcelona[1],point:null}],[]);
 assert.equal(absent.legs[0].pointType,'no_coordinates');
 assert.ok(MAP_TONES.includes('midnight'));
 assert.ok(!MAP_TONES.includes('satellite'));
});

test('Route Studio renders accessible stop selection and visual mode controls',()=>{
 const ctx={explorer:{},dayRoute:{items:barcelona.slice(0,2),routes:[],
   time:'09:00',focusIndex:1,displayMode:'focus',status:''},
   people:[{id:'1'},{id:'2'},{id:'3'}],cities:{barcelona:{name:'Barcelona'}},
   city:'barcelona',date:'2027-09-04'};
 const html=dayRouteView(ctx);
 assert.match(html,/ROUTE STUDIO/);
 assert.match(html,/2\/8 gewählt/);
 assert.match(html,/data-action="day-route-focus"/);
 assert.match(html,/data-action="day-route-prev"/);
 assert.match(html,/data-action="day-route-next"/);
 assert.match(html,/data-action="day-route-fit"/);
 assert.match(html,/data-action="day-route-display"/);
 assert.match(html,/aria-pressed="true"/);
 assert.match(html,/gestrichelte Luftlinie/);
 assert.doesNotMatch(html,/23 Min\. berechnet/);
});
