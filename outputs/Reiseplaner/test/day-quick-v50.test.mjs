import test from 'node:test';
import assert from 'node:assert/strict';
import {quickDayTargetDates,quickDayEdit} from '../public/day-quick-edits-v50.mjs';

const paris={id:'a',kind:'activity',city:'paris',name:'Paris event',selected:false,
 start:null,booked:false,locked:false,removed:false,duration:null};
const barca={...paris,id:'b',city:'barcelona',name:'Barcelona club'};
const base={all:[paris,barca],active:[],activeSet:new Set(),
  trip:{id:'interrail_classic',route:['paris','barcelona']},
  dates:['2027-09-01','2027-09-02','2027-09-03'],
  cityForDay:date=>date==='2027-09-03'?'barcelona':'paris',
  date:'2027-09-01',state:{edits:{}}
};

test('Quick add offers only itinerary days matching the selected place',()=>{
 assert.deepEqual(quickDayTargetDates(base,paris),['2027-09-01','2027-09-02']);
 assert.deepEqual(quickDayTargetDates(base,barca),['2027-09-03']);
 assert.equal(quickDayEdit(base,'b','2027-09-01').ok,false);
 assert.equal(quickDayEdit(base,'b','2027-09-03').ok,true);
 assert.equal(quickDayEdit(base,'z','2027-09-03').ok,false);
});

test('Quick add is untimed, duplicate safe and never mutates the input state',()=>{
 const r=quickDayEdit(base,'a','2027-09-02','add');
 assert.equal(r.ok,true);
 assert.equal(r.edits.a.selected,true);
 assert.equal(r.edits.a.date,'2027-09-02');
 assert.equal(r.edits.a.start,null);
 assert.equal(r.edits.a.end,null);
 assert.equal(r.edits.a.order,101);
 assert.deepEqual(base.state.edits,{});
 assert.equal(quickDayEdit({...base,activeSet:new Set(['a'])},'a','2027-09-02').ok,false);
});

test('Quick removal only deselects an unbooked activity and keeps catalogue unchanged',()=>{
 const selected={...paris,selected:true,date:'2027-09-01'};
 const ctx={...base,all:[selected],active:[selected],activeSet:new Set(['a']),
  state:{edits:{a:{selected:true,date:'2027-09-01',order:101}}}};
 const r=quickDayEdit(ctx,'a','2027-09-01','remove');
 assert.equal(r.ok,true);
 assert.equal(r.edits.a.selected,false);
 assert.equal(r.edits.a.removed,false);
 assert.equal(r.edits.a.date,null);
 assert.equal(ctx.state.edits.a.selected,true);
 for(const x of [{...selected,booked:true},{...selected,locked:true},
   {...selected,duplicateOf:'other'},{...selected,kind:'lodging'},
   {...selected,readOnlyExternal:true}]){
  assert.equal(quickDayEdit({...ctx,all:[x]},'a',ctx.date,'remove').ok,false);
 }
});
