import test from 'node:test';
import assert from 'node:assert/strict';
const items=[
 {id:'a',name:'A',kind:'activity',city:'barcelona',point:[41.38,2.18],zone:'Europe/Madrid',duration:15},
 {id:'b',name:'B',kind:'activity',city:'barcelona',point:[41.381,2.181],zone:'Europe/Madrid',duration:15},
];
const routes=[{walkOnly:true,points:items.map(item=>item.point),minutes:4,metres:180}];
const context=active=>({date:'2027-09-04',city:'barcelona',active,activeSet:new Set(),people:[{id:'1',age:20}],state:{edits:{keep:{selected:true}}}});

test('route adoption rejects overlap with a train using its actual arrival time',async()=>{
 const {dayRouteSelection}=await import('../public/day-route.mjs');
 const ctx=context([{id:'train',kind:'transport',start:'2027-09-04T17:10:00Z',end:'2027-09-04T18:00:00Z'}]);
 const before=JSON.stringify(ctx.state);
 assert.throws(()=>dayRouteSelection(ctx,items,routes,'19:00'),/überschneidet/);
 assert.equal(JSON.stringify(ctx.state),before);
});

test('overnight activities conflict by instants and lodging does not occupy the whole day',async()=>{
 const {dayRouteSelection}=await import('../public/day-route.mjs');
 const overnight={id:'overnight',kind:'activity',start:'2027-09-03T21:00:00Z',end:'2027-09-04T08:00:00Z'};
 assert.throws(()=>dayRouteSelection(context([overnight]),items,routes,'09:00'),/überschneidet/);
 const ctx=context([{...overnight,kind:'lodging'}]);
 const result=dayRouteSelection(ctx,items,routes,'09:00');
 assert.equal(result.rows.length,2);assert.equal(result.edits.a.start,'2027-09-04T07:00:00.000Z');
 assert.equal(result.edits.b.start,'2027-09-04T07:19:00.000Z');
 assert.deepEqual(result.edits.keep,{selected:true});
 assert.equal(ctx.state.edits.a,undefined,'Pure preview does not mutate stored selections');
});

test('booked, locked, active or removed route targets cannot be adopted',async()=>{
 const {dayRouteSelection}=await import('../public/day-route.mjs');
 assert.equal(typeof dayRouteSelection,'function');
 for(const field of ['booked','locked','removed'])assert.throws(()=>dayRouteSelection(context([]),[{...items[0],[field]:true},items[1]],routes,'09:00'),/freie/);
 const ctx=context([]);ctx.activeSet.add('a');assert.throws(()=>dayRouteSelection(ctx,items,routes,'09:00'),/freie/);
});

test('the measured walking interval between visits is occupied time too',async()=>{
 const {dayRouteSelection}=await import('../public/day-route.mjs');
 const ctx=context([{id:'train-in-walk',kind:'transport',start:'2027-09-04T07:16:00Z',end:'2027-09-04T07:18:00Z'}]);
 assert.throws(()=>dayRouteSelection(ctx,items,routes,'09:00'),/überschneidet/);
});
