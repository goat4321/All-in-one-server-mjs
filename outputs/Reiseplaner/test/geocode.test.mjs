import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

test('Single explicit known-address lookup is rate-limited, cacheable, and never auto-saves the pin',async()=>{
  let requests=0;
  const fakeFetch=async url=>{
    requests++;
    assert.match(String(url),/^https:\/\/nominatim\.openstreetmap\.org\/search\?/);
    return {ok:true,json:async()=>[{
      lat:'41.3817',lon:'2.1763',display_name:'La Plata, Carrer de la Mercè 28, Barcelona',
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
    const input={variantId:'interrail_classic',itemId:'local:food-v03-005'};
    const before=store.current('interrail_classic').state;
    const a=await request(input);
    assert.equal(a.status,200);
    assert.equal(a.data.candidates.length,1);
    assert.deepEqual(a.data.candidates[0].point,[41.3817,2.1763]);
    assert.equal(requests,1);
    const b=await request(input);
    assert.equal(b.status,200);
    assert.equal(requests,1,'identical address uses provider cache');
    const after=store.current('interrail_classic').state;
    assert.deepEqual(after.edits,before.edits,'lookup must never change local map or provider data');
    assert.equal((await request({variantId:'interrail_classic',itemId:'not-real'})).status,404);
    assert.equal((await request({variantId:'interrail_august',itemId:input.itemId})).status,404);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    store.close();
  }
});

test('Offline mode blocks new network lookups and does not silently pin city center',async()=>{
  const {server,store}=await createApp({database:':memory:',upstream:false,
    fetcher:async()=>{throw new Error('Should never fetch')}} );
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/geocode',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        variantId:'interrail_classic',itemId:'local:food-v03-005'})});
    assert.equal(response.status,503);
    assert.equal(store.current('interrail_classic').state.edits['local:food-v03-005'],undefined);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    store.close();
  }
});
