import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {providerLocationAudit,providerLocationPanel} from '../public/provider-location-v13.mjs';

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
 assert.ok(m.conflicts>=1);
 assert.equal(m.independentlyVerified,0);
 const html=providerLocationPanel(ctx);
 assert.match(html,/Adress-\/Identitätskonflikte/);
 assert.match(html,/Via Giuseppe Ratti/);
 assert.match(html,/Via Venezia/);
 assert.match(html,/nicht unabhängig verortet/);
});
