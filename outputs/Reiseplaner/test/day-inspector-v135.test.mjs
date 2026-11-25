import test from 'node:test';
import assert from 'node:assert/strict';
import {dayInspectorModelV135,editDayDurationV135} from '../public/day-inspector-v135.mjs';
test('V135 separates currency and protects fixed activities',()=>{
 const a={id:'a',name:'A',kind:'activity',duration:60,price:{cents:1000,currency:'CHF',scope:'person'}};
 const b={id:'b',name:'B',kind:'activity',duration:30,start:'2027-09-01T10:00:00Z',price:{cents:500,currency:'EUR',scope:'group'}};
 const c={id:'c',name:'C',kind:'activity'};
 const ctx={fullDay:[a,b,c],activeSet:new Set(['a','b','c']),people:[{},{}],state:{edits:{a:{selected:true}}}};
 const m=dayInspectorModelV135(ctx,[{text:'Konflikt'},{text:'Konflikt'}]);
 assert.deepEqual(m.totals,[['CHF',2000],['EUR',500]]);assert.equal(m.minutes,90);assert.equal(m.unknownDuration,1);assert.equal(m.unknownPrice,1);assert.equal(m.warnings.length,1);
 assert.deepEqual(editDayDurationV135(ctx,'a',15).edits.a,{selected:true,duration:75});
 assert.equal(editDayDurationV135(ctx,'b',15).ok,false);
 assert.equal(editDayDurationV135(ctx,'c',15).ok,false);
 assert.equal(editDayDurationV135(ctx,'a',1).ok,false);
});
