import test from 'node:test';
import assert from 'node:assert/strict';
import { routeStudioModel, routeStudioSummary, footpathMatchesStops, pointAlongRoute, MAP_TONES } from '../public/route-studio.mjs';
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

test('Real walking geometry does not remove warnings for unverified endpoints',()=>{
 const route={walkOnly:true,minutes:7,metres:490,points:[[41.388,2.186],[41.39,2.185]]};
 const items=[
  {...barcelona[0],locationReferenceV07:{precision:'provider_reported_unverified'}},
  {...barcelona[1],point:[41.39,2.185],geoEvidence:{url:'https://www.openstreetmap.org/node/100'}}
 ];
 const model=routeStudioModel(items,[route]);
 assert.equal(model.complete,true);
 assert.equal(model.positionQuality.reviewCount,1);
 assert.equal(model.positionQuality.providerCount,1);
 assert.equal(model.positionQuality.independentCount,1);
 assert.match(routeStudioSummary(model),/Achtung/);
 const ctx={explorer:{},dayRoute:{items,routes:[route],time:'09:00',focusIndex:1,
   displayMode:'all',status:''},people:[{id:'1'}],
   cities:{barcelona:{name:'Barcelona'}},city:'barcelona',date:'2027-09-05'};
 const html=dayRouteView(ctx);
 assert.match(html,/route-studio-geowarning/);
 assert.match(html,/data-location-confidence="provider"/);
 assert.match(html,/Positionen überprüfen: 1 von 2 Stopps/);
});


test('Old cached route geometry cannot supply new stops with fabricated walking time',()=>{
 const source=[
  {id:'1',name:'First',city:'barcelona',point:[41.388,2.186]},
  {id:'2',name:'Second',city:'barcelona',point:[41.391,2.181]}
 ];
 const oldRoute={walkOnly:true,minutes:7,metres:480,
   points:[[41.388,2.186],[41.389,2.185],[41.391,2.181]]};
 const valid=routeStudioModel(source,[oldRoute]);
 assert.equal(valid.verifiedCount,1);assert.equal(valid.staleGeometryCount,0);
 const moved=[source[0],{...source[1],point:[41.43,2.23]}];
 const stale=routeStudioModel(moved,[oldRoute]);
 assert.equal(stale.staleGeometryCount,1);
 assert.equal(stale.verifiedCount,0);
 assert.equal(stale.knownMinutes,0);
 assert.equal(stale.legs[0].pointType,'schematic_straight_line');
 assert.equal(stale.legs[0].staleGeometry,true);
 const ctx={explorer:{},dayRoute:{items:moved,routes:[oldRoute],
   time:'09:00',focusIndex:0,displayMode:'all',status:''},
   people:[{id:'p1'}],cities:{barcelona:{name:'Barcelona'}},
   city:'barcelona',date:'2027-09-05'};
 assert.match(dayRouteView(ctx),/bisherige Wegberechnung\(en\) passen nicht mehr/);
 assert.doesNotMatch(dayRouteView(ctx),/7 Min\. geprüfter Fußweg/);
});
test('Near-road snapping is allowed but reverse or distant route endpoints are rejected',()=>{
 const stops=[
  {id:'1',city:'barcelona',point:[41.388,2.186]},
  {id:'2',city:'barcelona',point:[41.391,2.181]}
 ];
 const route={walkOnly:true,minutes:7,metres:490,
   points:[[41.3885,2.1865],[41.390,2.184],[41.3915,2.1815]]};
 assert.equal(footpathMatchesStops(stops[0],stops[1],route),true);
 assert.equal(footpathMatchesStops(stops[0],stops[1],{...route,points:[...route.points].reverse()}),false);
 assert.equal(footpathMatchesStops(stops[0],stops[1],{...route,points:[[41.4,2.20],...route.points]}),false);
});

test('Map time chip follows the real walking path by distance, not air-line centre',()=>{
  const points=[[48.86,2.29],[48.86,2.30],[48.87,2.30]];
  const half=pointAlongRoute(points,.5);
  assert.ok(half[1]>2.299&&half[1]<=2.30,'distance-weighted point stays on routed legs');
  assert.deepEqual(pointAlongRoute(points,0),points[0]);
  assert.deepEqual(pointAlongRoute(points,1),points.at(-1));
  assert.equal(pointAlongRoute([[48.86,2.29]],.5),null);
  assert.equal(pointAlongRoute([[99,2.29],[48.86,2.3]],.5),null);
});

test('Excessive routing snap is rejected even when geometry otherwise looks valid',()=>{
 const stops=[
  {id:'a',city:'barcelona',point:[41.388,2.186]},
  {id:'b',city:'barcelona',point:[41.391,2.181]}
 ];
 const route={walkOnly:true,minutes:8,metres:600,
  points:[[41.389,2.186],[41.390,2.184],[41.391,2.181]]};
 assert.equal(footpathMatchesStops(stops[0],stops[1],route),false,
  'a route starting over 100m from its named stop must not claim verified geometry');
 const m=routeStudioModel(stops,[route]);
 assert.equal(m.verifiedCount,0);
 assert.equal(m.staleGeometryCount,1);
 assert.equal(m.knownMinutes,0);
 assert.equal(m.legs[0].minutes,null);
 const almost={...route,points:[[41.3883,2.1863],[41.390,2.184],[41.391,2.181]]};
 assert.equal(footpathMatchesStops(stops[0],stops[1],almost),true);
});
