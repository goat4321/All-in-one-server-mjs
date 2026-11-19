import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createApp} from '../server.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/barcelona-foot-route.json',import.meta.url),'utf8'));
async function withApp(options,check){
 const {server}=await createApp({database:':memory:',...options});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const post=async(path,payload)=>{const response=await fetch('http://127.0.0.1:'+server.address().port+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return{status:response.status,body:await response.json()};};
 try{await check(post);}finally{await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
}

test('unavailable foot routes and nonwalking provider steps do not become valid paths',async()=>{
 await withApp({upstream:false},async post=>{
  const result=await post('/api/walk',{points:[[48.85123,2.35123],[48.85234,2.35234]]});
  assert.equal(result.status,503);assert.ok(result.body.error);assert.equal(result.body.points,undefined);assert.equal(result.body.minutes,undefined);
 });
 let calls=0;
 const bad=structuredClone(fixture.response);bad.routes[0].legs[0].steps[0].mode='driving';
 await withApp({upstream:true,fetcher:async()=>{calls++;return Response.json(bad);}},async post=>{
  for(let attempt=0;attempt<2;attempt++){
   const result=await post('/api/walk',{points:fixture.stops.slice(0,2).map(stop=>stop.point)});
   assert.equal(result.status,422);assert.match(result.body.error,/Verkehrsmittel/);assert.equal(result.body.walkOnly,undefined);
  }
  assert.equal(calls,2,'Rejected provider result is never reused as a cached walking path');
 });
});

test('September2027 outside the actual transit package returns no invented connection',async()=>{
 let calls=0;
 await withApp({upstream:true,fetcher:async()=>{calls++;throw Error('No external transit fetch expected');}},async post=>{
  const result=await post('/api/transit',{city:'barcelona',points:fixture.stops.slice(0,2).map(stop=>stop.point),date:'2027-09-04',time:'09:00',excluded:[]});
  assert.equal(result.status,200);assert.equal(result.body.status,'outside');assert.deepEqual(result.body.routes,[]);
  assert.ok(result.body.meta.to<'2027-09-04');assert.equal(calls,0);
 });
});
