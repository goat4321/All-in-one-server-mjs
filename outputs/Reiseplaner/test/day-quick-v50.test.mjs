import test from 'node:test';
import assert from 'node:assert/strict';
import {quickDayTargetDates,quickDayEdit} from '../public/day-quick-edits-v50.mjs';
import {timelineMovesV105,timelineReorderV105} from '../public/day-plans-logic.mjs';
import {dayEntries} from '../public/model.mjs';

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

test('Direct move changes only a valid activity day, clears old times and preserves other edits',()=>{
 const selected={...paris,selected:true,date:'2027-09-01',
   start:'2027-09-01T09:00:00',end:'2027-09-01T10:00:00'};
 const ctx={...base,all:[selected],active:[selected],activeSet:new Set(['a']),
  state:{edits:{a:{selected:true,date:'2027-09-01',start:selected.start,
    end:selected.end,order:111},other:{selected:true,date:'2027-09-01'}}}};
 const moved=quickDayEdit(ctx,'a','2027-09-02','move');
 assert.equal(moved.ok,true);
 assert.equal(moved.edits.a.selected,true);
 assert.equal(moved.edits.a.date,'2027-09-02');
 assert.equal(moved.edits.a.start,null);
 assert.equal(moved.edits.a.end,null);
 assert.deepEqual(moved.edits.other,ctx.state.edits.other);
 assert.equal(ctx.state.edits.a.date,'2027-09-01');
 assert.equal(quickDayEdit(ctx,'a','2027-09-03','move').ok,false);
 assert.equal(quickDayEdit(ctx,'a','2027-09-01','move').ok,false);
 assert.equal(quickDayEdit({...ctx,activeSet:new Set()},'a','2027-09-02','move').ok,false);
 assert.equal(quickDayEdit({...ctx,all:[{...selected,booked:true}]},'a','2027-09-02','move').ok,false);
});

test('Swiss optional day trips are allowed only on matching city dates or explicitly researched day slots',()=>{
 const swissNoDayplan={...base,trip:{id:'swiss_lakes',route:['paris','barcelona']},
  all:[paris,barca]};
 assert.deepEqual(quickDayTargetDates(swissNoDayplan,barca),['2027-09-03'],
   'A Swiss route location does not automatically belong on every trip date');
 const swissWithDayplan={...swissNoDayplan,
  trip:{id:'swiss_lakes',route:['paris','barcelona'],dayPlansV32:[
   {tripId:'swiss_lakes',date:'2027-09-02',slots:[{id:'b'}]},
   {tripId:'swiss_lakes',date:'2027-09-01',slots:[{id:'a'}]}
  ]}};
 assert.deepEqual(quickDayTargetDates(swissWithDayplan,barca),
   ['2027-09-02','2027-09-03'],
   'Allow travel-day alternatives only if the actual researched day draft names the place');
 assert.equal(quickDayEdit(swissWithDayplan,'b','2027-09-01').ok,false);
 assert.equal(quickDayEdit(swissWithDayplan,'b','2027-09-02').ok,true);
});

const freeActivity=(id,order,extra={})=>({id,order,kind:'activity',city:'paris',date:base.date,start:null,end:null,...extra});
function timelineContext(rows){
 const day=dayEntries(rows,base.date);
 return {...base,day,fullDay:day,state:{edits:{b:{duration:50},fixed:{name:'Preserved'}}}};
}
test('V105 moves multiple untimed activities by changing only order and preserves other edits',()=>{
 const rows=[freeActivity('a',101),freeActivity('b',101),freeActivity('c',103)];
 const input=timelineContext(rows);
 assert.deepEqual(timelineMovesV105(input,'a'),{previous:null,next:'b'});
 const result=timelineReorderV105(input,'a','c');
 assert.equal(result.ok,true);
 assert.deepEqual(result.ids,['b','c','a']);
 assert.deepEqual(result.edits.fixed,{name:'Preserved'});
 assert.equal(result.edits.b.duration,50);
 for(const id of ['a','b','c']){
  assert.ok(Number.isFinite(result.edits[id].order));
  assert.equal('start' in result.edits[id],false);
  assert.equal('date' in result.edits[id],false);
 }
 const reordered=dayEntries(rows.map(row=>({...row,...result.edits[row.id]})),base.date);
 assert.deepEqual(reordered.map(row=>row.id),result.ids);
 assert.deepEqual(input.state.edits,{b:{duration:50},fixed:{name:'Preserved'}});
});
test('V105 rejects protected, timed, meal and other-city activities, including hidden full-day barriers',()=>{
 const rows=[freeActivity('timed',100,{start:'2027-09-01T08:00:00Z',zone:'Europe/Paris'}),
  freeActivity('a',101),freeActivity('b',102),freeActivity('fixed',103,{booked:true}),
  freeActivity('c',104),freeActivity('foreign',105,{city:'barcelona'}),
  freeActivity('d',106),freeActivity('meal',107,{mealSlot:'lunch'}),freeActivity('e',108)];
 const input=timelineContext(rows);
 for(const id of ['timed','fixed','c','foreign','d','meal','e','missing','a']){
  assert.equal(timelineReorderV105(input,'a',id).ok,false,id);
 }
 assert.equal(timelineReorderV105(input,'fixed','b').ok,false);
 const filtered={...input,day:input.day.filter(row=>row.city==='paris')};
 assert.equal(timelineReorderV105(filtered,'c','d').ok,false);
 const valid=timelineReorderV105(input,'b','a');
 assert.equal(valid.ok,true);
 assert.equal('order' in valid.edits.fixed,false);
 const after=dayEntries(rows.map(row=>({...row,...valid.edits[row.id]})),base.date);
 assert.deepEqual(after.map(row=>row.id),['timed','b','a','fixed','c','foreign','d','meal','e']);
});
test('V105 declines reordering when equal protected boundary orders leave no safe interval',()=>{
 const rows=[freeActivity('left',100,{locked:true}),freeActivity('a',100),
  freeActivity('b',100),freeActivity('right',100,{locked:true})];
 const input=timelineContext(rows);
 assert.deepEqual(timelineMovesV105(input,'a'),{previous:null,next:null});
 assert.equal(timelineReorderV105(input,'a','b').ok,false);
});
