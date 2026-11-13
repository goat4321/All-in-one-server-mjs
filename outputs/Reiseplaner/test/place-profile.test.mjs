import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { placeProfileModel, placeProfileHtml, placeQuickFacts } from '../public/place-profile.mjs';

const catalog = await loadCatalog();
const ctx={people:[{id:'p1'},{id:'p2'},{id:'p3'}],cities:catalog.cities,catalog,state:{}};
test('All 642 variant-scoped entries have safe generic detail profiles',()=>{
  let count=0;
  for (const trip of catalog.trips)for(const item of trip.items){
    const p=placeProfileModel(item,ctx);
    assert.ok(p && p.name && p.facts.length>=5,item.id);
    const html=placeProfileHtml(item,ctx);
    assert.match(html,/Quellen und Aktualität/);
    assert.match(html,/Google Maps/);
    assert.doesNotMatch(html,/undefined(?=<|&)/);
    count++;
  }
  assert.ok(count>=642,'Alle Varianten mit Ortsprofilen');
});
test('Airbnb preserves historical quote and approximate location',()=>{
  const airbnb=catalog.trips.flatMap(t=>t.items).find(i=>i.id.startsWith('wishlist:airbnb:')&&i.quote?.sampleTotalCents);
  const p=placeProfileModel(airbnb,ctx);
  assert.equal(p.isAirbnb,true);
  assert.equal(p.priceKnown,false);
  assert.match(p.priceLabel,/kein bestätigter Checkout/);
  assert.ok(p.facts.some(x=>/Privat/.test(x[1])));
  assert.match(placeQuickFacts(airbnb,ctx),/Nur ungefähr bekannt/);
});
test('Unverified price, rating and kitchen remain explicitly open',()=>{
 const demo={id:'test:unverified',kind:'lodging',city:'paris',name:'Demo & Private',price:null,point:null};
 const p=placeProfileModel(demo,ctx);
 assert.equal(p.priceKnown,false);
 assert.equal(p.priceLabel,'Preis offen');
 assert.equal(p.rating,'Keine belegte Bewertung');
 assert.ok(p.facts.some(x=>x[0]==='Küche'&&x[1]==='Nicht bestätigt'));
 assert.match(placeProfileHtml(demo,ctx),/Demo &amp; Private/);
 assert.doesNotMatch(placeProfileHtml(demo,ctx),/<h3>Demo & Private<\/h3>/);
});
