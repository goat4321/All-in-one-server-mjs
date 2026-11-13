import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { explorerData, validPoint } from '../public/map-explorer.mjs';

const catalog=await loadCatalog();
const published=catalog.research.publicAddressesV09;
const audit=catalog.research.unresolvedReasonsV09;
const geo=catalog.research.geoResearchV06;

test('50 public hotel/business addresses are individually sourced and keep exact location boundaries',()=>{
 assert.equal(published.schema,'verified_public_addresses_v09');
 assert.equal(published.entries.length,50);
 assert.equal(published.counts.entries,50);
 assert.equal(published.counts.withIndependentCoordinates,33);
 assert.equal(published.counts.verifiedAddressOnly,17);
 assert.equal(new Set(published.entries.map(e=>e.id)).size,published.entries.length);
 for(const record of published.entries){
  assert.ok(record.id&&record.city&&record.name&&record.address);
  assert.ok(/^https:\/\//.test(record.sourceUrl));
  assert.equal(record.airbnb,false);
  assert.equal(record.confirmedFor2027Checkout,false);
  assert.ok(!record.id.startsWith('wishlist:airbnb:'));
  assert.equal(catalog.sources['address-v09:'+record.id].url,record.sourceUrl);
  const occurrences=catalog.trips.flatMap(trip=>trip.items.filter(x=>x.id===record.id&&x.city===record.city));
  assert.ok(occurrences.length>0,record.id);
  for(const item of occurrences){
   assert.ok(item.address?.length);
   assert.equal(item.addressEvidenceV09.sourceUrl,record.sourceUrl);
   assert.equal(item.addressEvidenceV09.notABooking,true);
   assert.ok(item.googleMapsUrl.startsWith('https://www.google.com/maps/'));
   if(!validPoint(item.point)) assert.ok(item.googleMapsUrl.includes('query='));
  }
 }
});

test('All previously missing unique objects get an individual reason or a proven coordinate',()=>{
 assert.ok(geo.acceptedUnique>=174);
 assert.equal(geo.acceptedUnique+audit.actuallyUnresolvedUnique,290);
 assert.equal(audit.items.length,audit.actuallyUnresolvedUnique);
 assert.equal(new Set(audit.items.map(x=>x.id+'|'+x.city)).size,audit.items.length);
 for(const x of audit.items){
  assert.equal(x.coordinate,null);
  assert.equal(x.coordinateStatus,'not_verifiably_exact');
  assert.ok(x.reason.length>55,x.id);
  assert.ok(x.nextStep.length>20,x.id);
  assert.ok(x.reasonCode);
  assert.ok(x.googleMapsSearchUrl.startsWith('https://www.google.com/maps/search/'));
  assert.ok(x.googleTransitUrl.includes('travelmode=transit'));
 }
 assert.equal(audit.items.filter(x=>x.reasonCode==='PRIVATE_AIRBNB_UNPUBLISHED_ADDRESS').length,42);
 assert.ok(audit.items.some(x=>x.reasonCode==='PUBLISHED_POSTAL_ADDRESS_NEEDS_INDEPENDENT_GPS'));
 for(const trip of catalog.trips){
  const data=explorerData(trip.items,trip);
  for(const item of data.unlocated.filter(x=>audit.items.some(y=>y.id===x.id&&y.city===x.city))){
   assert.ok(item.geoReviewV09);
   assert.ok(item.geoReviewV09.reason);
   assert.equal(item.geoReviewV09.exactPointKnown,false);
  }
 }
});

test('Private Airbnb properties stay address-free, without a false pin or invented booking',()=>{
 for(const trip of catalog.trips)for(const item of trip.items.filter(x=>x.id.startsWith('wishlist:airbnb:'))){
  assert.equal(item.point,null);
  assert.equal(item.address,null);
  assert.equal(item.booked,false);
  assert.equal(item.price,null);
  assert.ok(!item.addressEvidenceV09);
  assert.ok(item.geoReviewV09);
  assert.equal(item.geoReviewV09.reasonCode,'PRIVATE_AIRBNB_UNPUBLISHED_ADDRESS');
 }
});
