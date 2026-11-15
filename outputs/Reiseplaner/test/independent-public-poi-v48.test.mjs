import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {hasIndependentPointEvidence,markerProvenance} from '../public/poi-location-provenance.mjs';
import {routePositionQuality} from '../public/route-position-quality.mjs';
import {explorerData} from '../public/map-explorer.mjs';

const read=async path=>JSON.parse(await readFile(new URL('../data/'+path,import.meta.url),'utf8'));
const [review,addresses,legacy]=await Promise.all([
 read('research-v48/independent-public-poi-review.json'),
 read('research-v09/verified-public-addresses.json'),
 read('research-v06/geocoded-points.json')
]);

test('Reviewed independent restaurant POI matches same commercial civic and phone, not just similar naming',()=>{
 assert.equal(review.schema,'independent_public_poi_manual_review_v48');
 assert.equal(review.accepted,1);
 assert.equal(review.items.length,1);
 const entry=review.items[0];
 assert.equal(entry.id,'local:food-v03-015');
 assert.equal(entry.mappedAlternateName,'Molo Modo 21');
 assert.equal(entry.civicMatches,true);
 assert.equal(entry.phoneMatches,true);
 assert.equal(entry.entranceConfirmed,false);
 assert.equal(entry.booked2027,false);
 assert.deepEqual(entry.point,[44.406616,8.927979]);
 assert.match(entry.publicDirectoryUrl,/genova-notizie\.it\/luoghi/);
 assert.match(entry.coordinatePublicationUrl,/44\.406616%2C8\.927979/);
 assert.match(entry.industrySourceUrl,/ge\.camcom\.gov\.it/);
 const record=addresses.entries.find(x=>x.id===entry.id);
 assert.deepEqual(record.point,entry.point);
 assert.equal(record.coordinateSourceUrl,entry.publicDirectoryUrl);
 assert.equal(record.coordinateVerification.status,'accepted_public_poi_reference_not_verified_entrance');
 assert.equal(record.coordinateVerification.sameCivicConfirmed,true);
 assert.equal(record.coordinateVerification.samePhoneConfirmed,true);
 assert.equal(record.coordinateVerification.entranceConfirmed,false);
 assert.equal(addresses.counts.withIndependentCoordinates,35);
 assert.equal(addresses.counts.verifiedAddressOnly,15);
 assert.equal(legacy.points.length,175);
 assert.ok(!legacy.points.some(x=>x.id===entry.id));
});

test('Cavour POI appears in relevant trip variants but remains an area reference, not a verified entrance',async()=>{
 const catalog=await loadCatalog();
 const entry=review.items[0];
 const occurrences=catalog.trips.flatMap(trip=>trip.items.filter(x=>x.id===entry.id));
 assert.ok(occurrences.length>0);
 for(const x of occurrences){
  assert.deepEqual(x.point,entry.point);
  assert.equal(x.geoEvidence.isCentroid,true);
  assert.equal(x.geoEvidence.confidence,'crosschecked_public_poi_reference_not_entrance');
  assert.match(x.geoEvidence.url,/genova-notizie\.it/);
  assert.equal(markerProvenance(x).kind,'area');
  assert.equal(hasIndependentPointEvidence(x),true);
  assert.equal(routePositionQuality([x]).areaCount,1);
  assert.equal(routePositionQuality([x]).reviewCount,1);
  assert.equal(x.addressEvidenceV09.notABooking,true);
  assert.equal(x.addressEvidenceV09.coordinateReferenceId,'genova-notizie:molo-modo-21-piazza-cavour');
 }
 for(const trip of catalog.trips){
  const matches=trip.items.filter(x=>x.id===entry.id);
  if(!matches.length)continue;
  const explorer=explorerData(trip.items,trip);
  assert.ok(explorer.placed.some(x=>x.id===entry.id));
  assert.ok(!explorer.unlocated.some(x=>x.id===entry.id));
 }
 const unresolved=catalog.research.unresolvedReasonsV09;
 assert.ok(!unresolved.items.some(x=>x.id===entry.id));
 assert.equal(catalog.research.geoResearchV06.acceptedUnique+2+unresolved.actuallyUnresolvedUnique,290);
 assert.equal(catalog.research.geoResearchV06.acceptedUnique,175);
 assert.ok(catalog.trips.every(t=>t.items.filter(x=>x.provider==='Airbnb').every(x=>x.point===null)));
});

test('Other Italian ambiguous hotel and restaurant stay unlocated',async()=>{
 const c=await loadCatalog();
 for(const id of ['research:bcom_13963152','research:bcom_17205591','local:food-v03-019']){
  const occurrences=c.trips.flatMap(t=>t.items.filter(x=>x.id===id));
  assert.ok(occurrences.length>0,id);
  assert.ok(occurrences.every(x=>x.point===null),id);
 }
});
