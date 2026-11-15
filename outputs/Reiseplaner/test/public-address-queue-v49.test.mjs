import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {unlocatedOverview,mapUnlocatedReview} from '../public/map-unlocated-v39.mjs';

const read=async name=>JSON.parse(await readFile(new URL('../data/'+name,import.meta.url),'utf8'));
const [queue,addresses,providers]=await Promise.all([
 read('research-v49/public-address-checklist.json'),
 read('research-v09/verified-public-addresses.json'),
 read('research-v13/provider-location-leads.json')
]);
const catalog=await loadCatalog();

test('V49 research checklist covers exactly 14 currently unresolved public addresses',()=>{
 assert.equal(queue.schema,'reiseplaner_public_address_verification_queue_v49');
 assert.equal(queue.counts.total,14);
 assert.deepEqual(queue.counts.byCity,{sete:5,genoa:3,venice:6});
 assert.equal(queue.counts.historicalProviderHints,11);
 assert.deepEqual(queue.counts.byPriority,{critical:2,high:2,medium:9,low:1});
 assert.equal(new Set(queue.entries.map(x=>x.id+'|'+x.city)).size,14);
 const pending=addresses.entries.filter(x=>!x.point);
 assert.equal(pending.length,14);
 assert.deepEqual(new Set(queue.entries.map(x=>x.id+'|'+x.city)),
   new Set(pending.map(x=>x.id+'|'+x.city)));
 for(const x of queue.entries){
  const src=pending.find(y=>y.id===x.id&&y.city===x.city);
  assert.equal(x.addressSource,src.sourceUrl);
  assert.equal(x.publishedAddress,src.address);
  assert.equal(x.entranceVerified,false);
  assert.equal(x.booked2027,false);
  assert.equal(x.automaticallyGeocoded,false);
  assert.ok(x.nextManualCheck?.length>15);
  assert.ok(!x.id.startsWith('wishlist:airbnb:'));
  const p=providers.items.find(y=>y.id===x.id);
  if(p)assert.deepEqual(x.historicalProviderPoint,p.providerPoint);
 }
});

test('Current catalog carries only public source-review priorities; no provider GPS is promoted',()=>{
 assert.equal(catalog.research.publicAddressCheckV49.entries.length,14);
 for(const row of queue.entries){
  const existing=catalog.trips.flatMap(t=>t.items.filter(x=>x.id===row.id));
  assert.ok(existing.length>0,row.id);
  for(const item of existing){
   assert.equal(item.point,null,row.id);
   assert.equal(item.addressCheckV49.priority,row.reviewPriority);
   assert.equal(item.addressCheckV49.nextManualCheck,row.nextManualCheck);
   assert.equal(item.addressCheckV49.hasHistoricalProviderHint,Boolean(row.historicalProviderPoint));
   assert.equal(item.addressCheckV49.reviewedOn,queue.reviewDate);
  }
 }
 const conflicts=queue.entries.filter(x=>x.reviewPriority==='critical');
 assert.deepEqual(new Set(conflicts.map(x=>x.id)),
   new Set(['research:bcom_12257788','research:bcom_13963152']));
});

test('Source-only map ledger prioritizes identity conflicts and exposes next verification steps',()=>{
 const trip=catalog.trips.find(t=>t.items.some(x=>x.id==='research:bcom_13963152'));
 assert.ok(trip);
 const ctx={
  cities:catalog.cities,
  explorer:{placed:trip.items.filter(x=>x.point),
   unlocated:trip.items.filter(x=>!x.point),showCityReferences:false},
  mapUnlocatedOpen:true,mapUnlocatedFilter:'sourced-address',mapUnlocatedLimit:100,
 };
 const review=unlocatedOverview(ctx);
 assert.ok(review.filteredTotal>0);
 const flagged=review.preview.filter(x=>x.item.addressCheckV49?.priority==='critical');
 assert.ok(flagged.length>0);
 const rank={critical:0,high:1,medium:2,low:3};
 const priorities=review.preview.map(x=>rank[x.item.addressCheckV49?.priority]??4);
 assert.deepEqual(priorities,[...priorities].sort((a,b)=>a-b),
   'All urgent addresses must precede routine city round-robin entries');
 const markup=mapUnlocatedReview(ctx);
 assert.match(markup,/data-review-priority="critical"/);
 assert.match(markup,/Nächsten Quellencheck anzeigen/);
 assert.match(markup,/Anbietergebnis bezeichnet anderen Wohnungsstandort|Wohnungsstockwerk und Hausnummer/);
 assert.match(markup,/Nur Recherchehinweis/);
 assert.doesNotMatch(markup,/wishlist:airbnb:123.*data-review-priority="critical"/);
});
