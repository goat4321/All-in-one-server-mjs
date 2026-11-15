import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {markerProvenance,hasIndependentPointEvidence} from '../public/poi-location-provenance.mjs';

const read=async p=>JSON.parse(await readFile(new URL('../data/'+p,import.meta.url),'utf8'));
const official=await read('research-v45/ign-source-review.json');
const addresses=await read('research-v09/verified-public-addresses.json');
const legacy=await read('research-v06/geocoded-points.json');

test('Official BAN candidate review archives all seven public Sète addresses without guesses',()=>{
 assert.equal(official.schema,'ign_public_address_manual_review_v45');
 assert.equal(official.items.length,7);
 assert.equal(official.confirmedAddressPoints,1);
 assert.equal(official.unmatched,6);
 assert.equal(new Set(official.items.map(x=>x.id)).size,7);
 assert.equal(official.items.filter(x=>x.point!==null).length,1);
 assert.ok(official.items.every(x=>!x.id.startsWith('wishlist:airbnb:')));
 assert.ok(official.items.every(x=>x.officialCandidateQuery.startsWith(
   'https://data.geopf.fr/geocodage/search?')));
 assert.ok(official.items.filter(x=>x.point===null).every(x=>
   x.status==='no_strict_public_address_match'));
});
test('Le Pouffre BAN house number is separately sourced, never inserted into old OSM cohort',async()=>{
 const item=official.items.find(x=>x.id==='research:bcom_4032998');
 assert.deepEqual(item.point,[43.398442,3.694451]);
 assert.equal(item.banId,'34301_0850_00085');
 assert.equal(legacy.points.length,175);
 assert.ok(!legacy.points.some(x=>x.id===item.id));
 const record=addresses.entries.find(x=>x.id===item.id);
 assert.deepEqual(record.point,item.point);
 assert.equal(record.coordinateReferenceId,item.banId);
 assert.match(record.coordinateSourceUrl,/data\.geopf\.fr\/geocodage\/search/);
 assert.equal(addresses.counts.withIndependentCoordinates,34);
 assert.equal(addresses.counts.verifiedAddressOnly,16);
 const c=await loadCatalog();
 const occurrences=c.trips.flatMap(t=>t.items.filter(x=>x.id===item.id));
 assert.ok(occurrences.length>0);
 for(const x of occurrences){
  assert.deepEqual(x.point,item.point);
  assert.ok(x.geoEvidence.url.includes('data.geopf.fr'));
  assert.equal(x.geoEvidence.isCentroid,true);
  assert.equal(markerProvenance(x).kind,'area');
  assert.equal(hasIndependentPointEvidence(x),true);
  assert.equal(x.addressEvidenceV09.notABooking,true);
 }
 assert.ok(c.trips.every(t=>t.items.filter(x=>x.provider==='Airbnb')
   .every(x=>x.point===null)));
});
test('All six failed official house-number lookups stay unlocated and routeless',async()=>{
 const c=await loadCatalog();
 for(const x of official.items.filter(x=>x.point===null)){
  const occurrences=c.trips.flatMap(t=>t.items.filter(item=>item.id===x.id));
  assert.ok(occurrences.length>0,x.id);
  for(const row of occurrences)assert.equal(row.point,null,x.id);
 }
});
