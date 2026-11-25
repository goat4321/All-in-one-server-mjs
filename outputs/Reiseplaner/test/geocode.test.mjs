import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

test('Single explicit known-address lookup is rate-limited, cacheable, and never auto-saves the pin',async()=>{
  let requests=0;
  const fakeFetch=async url=>{
    requests++;
    assert.match(String(url),/^https:\/\/nominatim\.openstreetmap\.org\/search\?/);
    return {ok:true,json:async()=>[{
      lat:'43.404',lon:'3.693',display_name:'21 Rue de la Liberté, Sète',
      osm_type:'node',osm_id:'987654321'
    },{lat:'48.0',lon:'2.0',display_name:'Wrong city'}]};
  };
  const {server,store}=await createApp({database:':memory:',upstream:true,fetcher:fakeFetch});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address='http://127.0.0.1:'+server.address().port;
  const request=async input=>{
    const response=await fetch(address+'/api/geocode',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    return {status:response.status,data:await response.json()};
  };
  try{
    const input={variantId:'interrail_classic',itemId:'research:bcom_16577964'};
    const before=store.current('interrail_classic').state;
    const [a,parallel]=await Promise.all([request(input),request(input)]);
    assert.equal(parallel.status,200);
    assert.equal(requests,1,'parallel identical requests share provider result');
    assert.equal(a.status,200);
    assert.equal(a.data.candidates.length,1);
    assert.deepEqual(a.data.candidates[0].point,[43.404,3.693]);
    assert.equal(requests,1);
    const b=await request(input);
    assert.equal(b.status,200);
    assert.equal(requests,1,'identical address uses provider cache');
    const after=store.current('interrail_classic').state;
    assert.deepEqual(after.edits,before.edits,'lookup must never change local map or provider data');
    assert.equal((await request({variantId:'interrail_classic',itemId:'not-real'})).status,404);
    assert.equal(store.current('interrail_classic').state.edits[input.itemId],undefined);
    assert.equal(requests,1,'No additional provider request after repeated explicit lookup');
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
});

test('Offline mode blocks new network lookups and does not silently pin city center',async()=>{
  const {server,store}=await createApp({database:':memory:',upstream:false,
    fetcher:async()=>{throw new Error('Should never fetch')}} );
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/geocode',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        variantId:'interrail_classic',itemId:'research:bcom_16577964'})});
    assert.equal(response.status,503);
    assert.equal(store.current('interrail_classic').state.edits['research:bcom_16577964'],undefined);
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
});
