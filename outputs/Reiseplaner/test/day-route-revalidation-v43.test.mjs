import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMultiStopDay} from '../public/day-route.mjs';
import {routeStudioModel} from '../public/route-studio.mjs';
const stops=[
 {id:'a',name:'A',city:'barcelona',kind:'activity',point:[41.388,2.186],duration:45},
 {id:'b',name:'B',city:'barcelona',kind:'activity',point:[41.391,2.181],duration:45}
];
const route={walkOnly:true,minutes:9,metres:720,
 points:[[41.388,2.186],[41.3895,2.183],[41.391,2.181]]};
test('Day planner accepts only source-independent geometry for current stop pair',()=>{
 const ok=buildMultiStopDay(stops,[route],'09:00');
 assert.equal(ok.complete,true);
 assert.equal(ok.knownWalkMinutes,9);
 assert.equal(ok.rows[1].walkMinutes,9);
 const changed=[stops[0],{...stops[1],point:[41.43,2.225]}];
 const rejected=buildMultiStopDay(changed,[route],'09:00');
 assert.equal(rejected.complete,false);
 assert.equal(rejected.staleRoute,true);
 assert.equal(rejected.rows.length,1);
 assert.match(rejected.status,/erneut/);
 assert.deepEqual(rejected.unknownConnection,['a','b']);
 assert.equal(routeStudioModel(changed,[route]).staleGeometryCount,1);
});
test('Backward or far-away cached route is not accepted by itinerary even with finite duration',()=>{
 const cases=[
  {...route,points:[...route.points].reverse()},
  {...route,points:[[41.48,2.30],...route.points.slice(1)]},
  {...route,metres:NaN}
 ];
 for(const value of cases)assert.equal(buildMultiStopDay(stops,[value]).complete,false);
});
