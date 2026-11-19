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

test('FOSSGIS bike profile is distinct from foot, validates source endpoint and caches only bicycle output',async()=>{
 const {bikeRequestUrl,checkedBikeResponse,bikeRouteKey}=await import('../lib/bike-route.mjs');
 const points=fixture.stops.slice(0,2).map(stop=>stop.point);
 const url=bikeRequestUrl(points);
 assert.match(url,/\/routed-bike\/route\/v1\/driving\//);
 assert.match(url,/geometries=geojson/);
 assert.match(bikeRouteKey(points),/^bike:/);
 const [a,b]=points;
 const geometry={type:'LineString',coordinates:[[a[1],a[0]],[b[1],b[0]]]};
 const result={code:'Ok',routes:[{geometry,distance:190,duration:91,legs:[{steps:[]}]}]};
 assert.equal(checkedBikeResponse(result,a,b,'2026-11-19').minutes,2);
 assert.equal(checkedBikeResponse(result,a,b,'2026-11-19').mode,'Radweg');
 assert.throws(()=>checkedBikeResponse({...result,routes:[{...result.routes[0],
   geometry:{type:'LineString',coordinates:[[13,48],[14,48]]}}]},a,b),/75-m-Grenze/);
 assert.throws(()=>checkedBikeResponse({...result,code:'NoRoute'},a,b),/keine belegte Strecke/);
 assert.throws(()=>bikeRequestUrl([[91,2],b]),/gültige Fahrrad/);
 let calls=0;
 await withApp({upstream:true,fetcher:async(requestUrl)=>{
    calls++;assert.match(requestUrl,/routed-bike/);return Response.json(result);
  }},async post=>{
   const bike1=await post('/api/bike',{points});
   assert.equal(bike1.status,200);
   assert.equal(bike1.body.cycleOnly,true);
   assert.equal(bike1.body.walkOnly,false);
   assert.equal(bike1.body.metres,190);
   assert.equal(bike1.body.minutes,2);
   assert.equal(bike1.body.price,undefined,'No pretend zero euro transit fare');
   const bike2=await post('/api/bike',{points,cachedOnly:true});
   assert.equal(bike2.status,200);
   assert.deepEqual(bike2.body,bike1.body);
   assert.equal(calls,1,'Successful bike geometry is cached by mode and points');
  });
});
test('offline, invalid and mismatched cycling results never claim distance or duration',async()=>{
 const points=fixture.stops.slice(0,2).map(stop=>stop.point);
 await withApp({upstream:false},async post=>{
   const no=await post('/api/bike',{points});
   assert.equal(no.status,503);
   assert.equal(no.body.minutes,undefined);
   assert.equal(no.body.points,undefined);
   assert.equal((await post('/api/bike',{points,cachedOnly:true})).body,null);
   assert.equal((await post('/api/bike',{points:[[91,2],[91,3]]})).status,400);
 });
 let calls=0;
 await withApp({upstream:true,fetcher:async()=>{
   calls++;return Response.json({code:'NoRoute',routes:[]});
 }},async post=>{
   const wrong=await post('/api/bike',{points});
   assert.equal(wrong.status,503);
   assert.equal(wrong.body.minutes,undefined);
   assert.equal((await post('/api/bike',{points,cachedOnly:true})).body,null);
   assert.equal(calls,1,'Failed bike routes are never cached');
 });
});
