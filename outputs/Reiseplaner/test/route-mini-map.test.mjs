import test from 'node:test';
import assert from 'node:assert/strict';
import {routeSketch} from '../public/route-mini-map.mjs';
test('Schematic travel map respects the route order and valid city point evidence',()=>{
 const cities={a:{name:'A',point:[48,11]},b:{name:'B',point:[43,2]},
 c:{name:'C',point:[41,3]},bad:{point:null}};
 const r=routeSketch(['a','b','bad','c','a'],cities);
 assert.equal(r.stops.length,3);
 assert.deepEqual(r.stops.map(x=>x.id),['a','b','c']);
 assert.ok(r.path.startsWith('M '));
 assert.ok(r.stops.every(x=>x.x>=12&&x.x<=88&&x.y>=18&&x.y<=82));
 assert.deepEqual(routeSketch(['a','bad'],cities),{stops:[],path:''});
 assert.deepEqual(routeSketch([],cities),{stops:[],path:''});
});
