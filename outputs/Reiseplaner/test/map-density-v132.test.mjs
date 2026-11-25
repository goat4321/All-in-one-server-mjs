import test from 'node:test';
import assert from 'node:assert/strict';
import {prioritizedPoiV132,photoBudgetV132,poiDensityPolicy} from '../public/poi-density.mjs';
test('V132 priorities and photo budget respect mobile and data saver',()=>{
 const rows=[{id:'a'},{id:'b',selected:true},{id:'c'},{id:'d'}];
 assert.deepEqual(prioritizedPoiV132(rows,'d',new Set(['c'])).map(i=>i.id),['d','c','b','a']);
 assert.equal(photoBudgetV132(poiDensityPolicy(15,'detail'),{width:390}),6);
 assert.equal(photoBudgetV132(poiDensityPolicy(15,'detail'),{saveData:true}),0);
 assert.equal(photoBudgetV132(poiDensityPolicy(15,'detail'),{effectiveType:'2g'}),0);
});
