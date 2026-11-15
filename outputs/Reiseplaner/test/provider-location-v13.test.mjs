import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {providerLocationAudit,providerLocationPanel,providerReferenceDistanceState,providerReviewMapLinks} from '../public/provider-location-v13.mjs';

const catalog=await loadCatalog();
const archive=catalog.research.providerLocationsV13;
test('The 17 public address cases remain without verified new pins',()=>{
 assert.equal(archive.schema,'public_lodging_provider_location_leads_v13');
 assert.equal(archive.items.length,17);
 assert.equal(archive.items.filter(r=>r.providerPoint).length,13);
 assert.equal(archive.items.filter(r=>!r.providerPoint).length,4);
 assert.equal(archive.items.filter(r=>r.independentGpsVerified).length,0);
 assert.ok(archive.items.every(r=>!r.id.startsWith('wishlist:airbnb:')));
});
test('Genoa conflicting property identity and public address are not hidden',()=>{
 const conflict=archive.items.find(r=>r.id==='research:bcom_12257788');
 assert.equal(conflict.reviewStatus,'provider_identity_address_conflict');
 assert.match(conflict.publishedAddress,/Giuseppe Ratti/);
 assert.match(conflict.providerAddress,/Venezia/);
 assert.notEqual(conflict.publishedAddress,conflict.providerAddress);
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const ctx={catalog,trip,cities:catalog.cities};
 const m=providerLocationAudit(ctx);
 assert.ok(m.conflicts>=4);
 const cittadella=m.rows.find(r=>r.id==='research:bcom_13963152');
 assert.equal(cittadella.currentPublishedAddress,'Scalinata della Cittadella, 16126 Genova, Italy');
 assert.equal(cittadella.historicalAddressChanged,true);
 assert.match(cittadella.qualificationHint,/Stockwerk/);
 assert.equal(cittadella.verifiedReference,false);
 const mestre=m.rows.find(r=>r.id==='research:bcom_17205591');
 assert.match(mestre.qualificationHint,/30173/);
 assert.equal(mestre.verifiedReference,false);
 const bac=m.rows.find(r=>r.id==='local:food-v03-019');
 assert.match(bac.qualificationHint,/anderen Lokal/);
 assert.equal(m.independentlyVerified,3);
 assert.equal(m.unlocated,14);
 assert.equal(m.providerLeads,13);
 assert.equal(m.unmatchedProviderPoints,11);
 const lePouffre=m.rows.find(r=>r.id==='research:bcom_4032998');
 const cavour=m.rows.find(r=>r.id==='local:food-v03-015');
 assert.equal(lePouffre.verifiedReference,true);
 assert.equal(lePouffre.providerDifferenceMetres,3);
 assert.equal(lePouffre.referenceKind,'area');
 assert.equal(cavour.verifiedReference,true);
 assert.equal(cavour.providerDifferenceMetres,null);
 assert.match(cavour.referenceUrl,/genova-notizie\.it/);
 const html=providerLocationPanel(ctx);
 assert.match(html,/Adress-\/Identitätskonflikte/);
 assert.match(html,/Via Giuseppe Ratti/);
 assert.match(html,/Via Venezia/);
 assert.match(html,/noch nicht unabhängig verortet/);
 assert.match(html,/14 von 17 offen/);
 assert.match(html,/ca. 3 m/);
 assert.match(html,/3 unabhängig belegte Referenzpunkte/);
 assert.match(html,/Unabhängige Kartenreferenz/);
 assert.match(html,/Aktuell belegte Anschrift/);
 assert.match(html,/Alte Adressfassung zeigen/);
 assert.match(html,/Nicht mehr als Hausnummer bestätigt/);
 assert.match(html,/Die veröffentlichte Angabe/);
 assert.match(html,/Scalinata della Cittadella, 16126 Genova/);
});

test('Every public provider coordinate can be compared with independent address search without changing its saved point',()=>{
 const cases=[{distance:null,kind:'uncompared'},{distance:3,kind:'near'},
   {distance:25,kind:'near'},{distance:40,kind:'review'},
   {distance:150,kind:'review'},{distance:151,kind:'conflict'}];
 for(const entry of cases){
  assert.equal(providerReferenceDistanceState(entry.distance).kind,entry.kind);
 }
 const trip=catalog.trips.find(t=>t.route.includes('sete'));
 const m=providerLocationAudit({catalog,trip});
 const lePouffre=m.rows.find(r=>r.id==='research:bcom_4032998');
 const eternel=m.rows.find(r=>r.id==='research:bcom_4231096');
 assert.equal(eternel.verifiedReference,true);
 assert.ok(eternel.providerDifferenceMetres<25);
 assert.equal(providerReferenceDistanceState(eternel.providerDifferenceMetres).kind,'near');
 const links=providerReviewMapLinks(lePouffre,'Sète');
 assert.deepEqual(links.map(l=>l.kind),['address-search','provider-hint']);
 assert.ok(links[0].url.startsWith('https://www.openstreetmap.org/search?query='));
 assert.ok(decodeURIComponent(links[0].url).includes('Grande Rue Haute'));
 assert.ok(links[1].url.includes('mlat=43.398464'));
 const conflict=m.rows.find(r=>r.id==='research:bcom_12257788');
 // This row is city-dependent, and the Sète itinerary need not contain Genoa.
 if(conflict)assert.ok(providerReviewMapLinks(conflict,'Genua')[0].url.includes('openstreetmap.org/search'));
 assert.deepEqual(providerReviewMapLinks({...lePouffre,provider:'AIRBNB'},'Sète'),[]);
 assert.deepEqual(providerReviewMapLinks({...lePouffre,id:'wishlist:airbnb:999'},'Sète'),[]);
 assert.deepEqual(providerReviewMapLinks({...lePouffre,providerPoint:[999,999]},'Sète').map(x=>x.kind),['address-search']);
});
