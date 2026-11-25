import test from 'node:test';
import assert from 'node:assert/strict';
import {dayTimelineV126,dayPositionV126,dayStopTimeV126,routeSampleV126,dayRouteSummaryV126} from '../public/day-route-player-v126.mjs';
const stops=[{point:[48,11]},{point:[48.001,11.001]},{point:[48.002,11.002]},{point:null}];
const legs=[{type:'routed',points:[stops[0].point,[48,11.001],stops[1].point],minutes:12,metres:150},{type:'schematic',points:[stops[1].point,stops[2].point],minutes:null},{type:'gap',points:[]}];
const model={stops,legs};
test('V126 only measured matching geometry plays as a walk',()=>{
 const t=dayTimelineV126(model);assert.deepEqual(t.rows.map(x=>x.kind),['stop','walk','stop','gap','stop','gap','stop']);
 assert.equal(dayPositionV126(t,2100).kind,'walk');assert.equal(dayPositionV126(t,dayStopTimeV126(t,1)).kind,'stop');
 assert.equal(dayPositionV126(t,t.duration).index,3);assert.equal(dayPositionV126(t,-1).index,0);
 assert.equal(dayPositionV126(dayTimelineV126({stops:[]}),0),null);
 const invalid=dayTimelineV126({stops:stops.slice(0,2),legs:[{...legs[0],points:[[40,10],[41,11]]}]});
 assert.equal(invalid.rows[1].kind,'gap');
});
test('V126 distance weighted sampling follows actual bends and clamps',()=>{
 assert.deepEqual(routeSampleV126(legs[0].points,0),stops[0].point);
 assert.deepEqual(routeSampleV126(legs[0].points,1),stops[1].point);
 const p=routeSampleV126(legs[0].points,.2);assert.equal(p[0],48);assert.ok(p[1]>11);
 assert.equal(routeSampleV126([[0,0],[100,20]],.5),null);
 assert.deepEqual(dayRouteSummaryV126(model),{walks:1,minutes:12,metres:150,open:2});
});
