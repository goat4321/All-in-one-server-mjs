import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=async file=>JSON.parse(await readFile(new URL('../data/research-v09/'+file,import.meta.url),'utf8'));
const [addresses,candidates,unresolved]=await Promise.all([
  read('verified-public-addresses.json'),read('address-candidates.json'),read('individual-unresolved-reasons.json')]);
test('Public-address evidence is internally reconciled without private Airbnb pins',()=>{
 assert.equal(addresses.schema,'verified_public_addresses_v09');
 assert.equal(addresses.entries.length,addresses.counts.entries);
 const mapped=addresses.entries.filter(x=>x.point!=null);
 const pending=addresses.entries.filter(x=>x.point==null);
 assert.equal(mapped.length,addresses.counts.withIndependentCoordinates);
 assert.equal(pending.length,addresses.counts.verifiedAddressOnly);
 assert.equal(mapped.length+pending.length,addresses.entries.length);
 assert.equal(new Set(addresses.entries.map(x=>x.id)).size,addresses.entries.length);
 for(const item of addresses.entries){
   assert.ok(item.sourceUrl?.startsWith('https://'),item.id+' missing address source');
   assert.ok(item.address,item.id+' missing public address');
   assert.notEqual(item.airbnb,true);
   assert.ok(!item.id.startsWith('wishlist:airbnb:'),'Private wishlists must never be geocoded');
   if(item.point)assert.ok(Array.isArray(item.point)&&item.point.length===2
     &&item.point.every(Number.isFinite),item.id);
 }
});
test('No failed street+number candidate is incorrectly promoted to precise POI',()=>{
 const byId=new Map(candidates.items.map(x=>[x.id,x]));
 assert.equal(candidates.items.length,candidates.queried);
 assert.equal(new Set(candidates.items.map(x=>x.id)).size,candidates.items.length);
 const pending=addresses.entries.filter(x=>x.point==null);
 for(const item of pending){
   const row=byId.get(item.id);
   assert.ok(row,item.id+' must have a documented geocoder audit');
   assert.equal(row.status,'no_exact_address_match',item.id);
   assert.equal(row.candidates.length,0,item.id);
   assert.equal(item.point,null,item.id);
 }
 assert.equal(pending.length,14);
 const restaurant=addresses.entries.find(x=>x.id==='local:food-v03-015');
 assert.equal(restaurant.coordinateVerification?.entranceConfirmed,false);
 assert.ok(!pending.some(x=>x.id===restaurant.id));
 assert.ok(unresolved.items.some(x=>x.privateAirbnbProperty===true),
   'Private rental uncertainty must remain explicitly recorded');
});
