import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { placeProfileModel, placeProfileHtml, placeQuickFacts, placeImageHtml, placePopupHtml } from '../public/place-profile.mjs';

const catalog = await loadCatalog();
const ctx={people:[{id:'p1'},{id:'p2'},{id:'p3'}],cities:catalog.cities,catalog,state:{}};
test('All variant-scoped catalog entries have safe generic detail profiles',()=>{
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
  assert.ok(count>=400,'Alle Katalogeinträge der Reisevarianten erfasst');
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

test('Place photos require a credited explicit source and never appear for unknown images',()=>{
 const item=catalog.trips[0].items.find(i=>i.name&&i.id);
 assert.match(placeImageHtml(item,ctx),/Bildquelle offen/);
 const ctxWithPhoto={...ctx,state:{placePhotos:{[item.id]:{
   url:'https://upload.wikimedia.org/wikipedia/commons/example.jpg',
   sourceUrl:'https://commons.wikimedia.org/wiki/File:example.jpg',
   credit:'Example author · CC BY 4.0'
 }}}};
 const html=placeImageHtml(item,ctxWithPhoto);
 assert.match(html,/<img loading="lazy"/);
 assert.match(html,/Example author/);
 assert.match(html,/Bildquelle/);
 const popup=placePopupHtml(item,ctxWithPhoto);
 assert.match(popup,/data-action="details"/);
 assert.match(popup,/Google Maps/);
 assert.doesNotMatch(popup,/onclick=/);
});
