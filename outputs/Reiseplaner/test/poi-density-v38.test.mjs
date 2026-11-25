import test from 'node:test';
import assert from 'node:assert/strict';
import {groupPoiForDisplay,poiDensityPolicy} from '../public/poi-density.mjs';
import {bubbleMarkup} from '../public/photo-map-model.mjs';

const pts=[
 {id:'near-a',city:'paris',point:[48.8583,2.2945]},
 {id:'near-b',city:'paris',point:[48.8584,2.2946]},
 {id:'far',city:'paris',point:[48.86,2.31]},
 {id:'other-city',city:'nice',point:[48.8583,2.2945]}
];
const project=([lat,lng])=>({x:lng*5000,y:lat*5000});
test('calm grouping reduces visual marker density without altering points',()=>{
 const before=JSON.stringify(pts);
 const groups=[...groupPoiForDisplay(pts,13,project).values()];
 assert.ok(groups.length<pts.length);
 assert.ok(groups.some(g=>g.length===2));
 assert.ok(groups.every(g=>g.every(x=>pts.includes(x))));
 assert.equal(JSON.stringify(pts),before);
});
test('focused pin stays individually selectable and city grouping stays separate',()=>{
 const groups=[...groupPoiForDisplay(pts,13,project,{focusedId:'near-a'}).values()];
 assert.ok(groups.some(g=>g.length===1&&g[0].id==='near-a'));
 assert.ok(groups.every(g=>!g.some(x=>x.city==='paris')||!g.some(x=>x.city==='nice')));
});
test('detail mode shows individual pins at 14+ and calm reduces photo count',()=>{
 assert.equal(poiDensityPolicy(14.4,'detail').clusterPixels,0);
 assert.equal(poiDensityPolicy(14.4,'calm').photoLimit,10);
 assert.equal(poiDensityPolicy(14.4,'detail').photoLimit,24);
});
test('failed remote photo retains a visible glyph in markup',()=>{
 const markup=bubbleMarkup({id:'p1',name:'Beach',category:'activity',
  photoUrl:'https://commons.wikimedia.org/wiki/Special:FilePath/Beach.jpg',tier:'photo'});
 assert.match(markup,/map-photo-disc/);
 assert.match(markup,/<span aria-hidden="true">/);
 assert.match(markup,/<img src=/);
});
test('malformed points or projected pixels never become clusters',()=>{
 const x=groupPoiForDisplay([...pts,{id:'unknown',point:[NaN,13]}],12,
  p=>Number.isFinite(p[0])?project(p):null);
 assert.equal([...x.values()].flat().length,4);
});
