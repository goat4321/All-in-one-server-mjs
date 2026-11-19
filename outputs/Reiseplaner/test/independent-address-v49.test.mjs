import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {hasIndependentPointEvidence,markerProvenance} from '../public/poi-location-provenance.mjs';
import {routePositionQuality} from '../public/route-position-quality.mjs';
import {providerLocationAudit,providerLocationPanel} from '../public/provider-location-v13.mjs';

const read=async name=>JSON.parse(await readFile(new URL('../data/'+name,import.meta.url),'utf8'));
const [review,addr,oldGeocoding]=await Promise.all([
 read('research-v49/independent-address-lookup.json'),
 read('research-v09/verified-public-addresses.json'),
 read('research-v06/geocoded-points.json')
]);

test('V49 26 Promenade Marty has independent house-number GPS, not apartment identity or entrance',()=>{
 assert.equal(review.schema,'independent_address_reference_review_v49');
 assert.equal(review.decision,'accept_house_number_reference_not_rental_property_poi');
 assert.equal(review.coordinateSource.fullCivicMatched,true);
 assert.equal(review.coordinateSource.pointPublishedForDifferentBusiness,true);
 assert.equal(review.secondaryCivicSource.sameHouseNumber,true);
 assert.equal(review.secondaryCivicSource.coordinatesNotProvided,true);
 assert.deepEqual(review.publicPoint,[43.396048,3.695277]);
 const point=addr.entries.find(x=>x.id==='research:bcom_4231096');
 assert.deepEqual(point.point,review.publicPoint);
 assert.equal(point.precision,'independent_third_party_house_number_reference');
 assert.match(point.coordinateSourceUrl,/annuairefrancais.fr\/sete/);
 assert.match(point.coordinateVerification.secondaryStreetNumberSourceUrl,/pappers.fr\/entreprise\/central-bar/);
 assert.equal(point.coordinateVerification.coordinateAtDifferentBusiness,true);
 assert.equal(point.coordinateVerification.stayIdentityConfirmed,false);
 assert.equal(point.coordinateVerification.entranceConfirmed,false);
 assert.equal(addr.counts.withIndependentCoordinates,36);
 assert.equal(addr.counts.verifiedAddressOnly,14);
 assert.equal(oldGeocoding.points.length,175,'Old verified OSM/Photon cohort is unchanged');
 assert.ok(!oldGeocoding.points.some(x=>x.id===point.id));
});

test('V49 address reference reaches all matching variants but cannot certify apartment access or booking',async()=>{
 const c=await loadCatalog(),id='research:bcom_4231096';
 const ref=review.publicPoint;
 const cases=c.trips.flatMap(t=>t.items.filter(x=>x.id===id));
 assert.ok(cases.length>0);
 for(const item of cases){
  assert.deepEqual(item.point,ref);
  assert.equal(markerProvenance(item).kind,'area');
  assert.equal(hasIndependentPointEvidence(item),true);
  assert.equal(item.geoEvidence.isCentroid,true);
  assert.equal(item.geoEvidence.confidence,'independent_third_party_house_number_not_lodging_entrance');
  assert.match(item.geoEvidence.note,/KEIN/);
  assert.equal(item.addressEvidenceV09.notABooking,true);
  assert.equal(item.addressEvidenceV09.coordinateVerification.stayIdentityConfirmed,false);
  assert.equal(item.addressEvidenceV09.coordinateVerification.entranceConfirmed,false);
  assert.equal(routePositionQuality([item]).reviewCount,1);
 }
 const audit=c.research.unresolvedReasonsV09;
 assert.ok(!audit.items.some(x=>x.id===id),'New address reference does not stay open as unlocated');
 assert.equal(c.research.geoResearchV06.acceptedUnique+3+audit.actuallyUnresolvedUnique,290);
 const m=providerLocationAudit({catalog:c,trip:c.trips.find(t=>t.route.includes('sete'))});
 const status=m.rows.find(x=>x.id===id);
 assert.equal(status.verifiedReference,true);
 assert.ok(status.providerDifferenceMetres>=0&&status.providerDifferenceMetres<20);
 assert.equal(m.unlocated,14);
 assert.equal(m.independentlyVerified,3);
 assert.ok(providerLocationPanel({catalog:c,trip:c.trips.find(t=>t.route.includes('sete'))}).includes('Gebäudezugang nicht nachgewiesen'));
});

test('Other source-only addresses remain without coordinates and all wishlist Airbnbs remain private',async()=>{
 const c=await loadCatalog();
 for(const id of ['research:bcom_4664508','research:bcom_12902044','research:bcom_13963152','local:food-v03-019']){
  const rows=c.trips.flatMap(t=>t.items.filter(x=>x.id===id));
  assert.ok(rows.length,id);
  assert.ok(rows.every(x=>x.point===null),id);
 }
 for(const t of c.trips)for(const x of t.items.filter(x=>String(x.id).startsWith('wishlist:airbnb:'))){
  assert.equal(x.point,null);
  assert.equal(x.address,null);
 }
});
