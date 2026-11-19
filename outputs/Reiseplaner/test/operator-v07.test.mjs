import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { explorerData } from '../public/map-explorer.mjs';

const catalog=await loadCatalog();
const data=catalog.research.operatorV07;

test('Official v07 source bundle contains dated, unconfirmed 2026 prices only',()=>{
  assert.equal(data.schema,'official_reference_pack_v07');
  assert.equal(data.localTransitFareReferences.length,23);
  assert.equal(data.attractionReferences.length,8);
  assert.equal(data.railExamples.length,2);
  assert.ok(data.localTransitFareReferences.every(x=>Number.isSafeInteger(x.amountCents)
    && x.amountCents>=0 && x.referenceYear===2026
    && x.validForSep2027===false && /^https:\/\//.test(x.sourceUrl)));
  assert.ok(data.railExamples.every(x=>x.validForSeptember2027===false
    && x.priceCents===null));
  assert.equal(data.railExamples[0].durationMinutes,410);
  assert.equal(data.localTransitFareReferences.find(x=>x.id==='venice-rolling-72h').amountCents,3300);
  assert.equal(data.localTransitFareReferences.find(x=>x.id==='barcelona-tcasual').scope,'one-person-10-journeys');
  assert.equal(data.localTransitFareReferences.find(x=>x.id==='paris-metro').amountCents,255);
  assert.equal(data.localTransitFareReferences.find(x=>x.id==='sete-day').amountCents,500);
});

test('Every pre-existing catalog record has separate price, hours, source, and geo coverage',()=>{
  assert.equal(catalog.research.coverageV07.length,4);
  for(const trip of catalog.trips){
    const coverage=catalog.research.coverageV07.find(x=>x.variant===trip.id);
    assert.ok(coverage,trip.id);
    assert.equal(coverage.total,trip.items.filter(i=>!i.duplicateOf&&!i.removed).length);
    assert.equal(coverage.withPrecisePoint+coverage.withoutPrecisePoint,coverage.total);
    assert.equal(coverage.entries.length,coverage.total);
    for(const item of trip.items){
      assert.ok(item.locationReferenceV07,trip.id+'/'+item.id);
      assert.ok(item.googleMapsUrl,trip.id+'/'+item.id);
      assert.ok(item.googleTransitUrl,trip.id+'/'+item.id);
      if(item.locationReferenceV07.precision==='city_only_not_a_pin'){
        assert.equal(item.point??null,null,trip.id+'/'+item.id);
        assert.ok(item.locationReferenceV07.orientationCityPoint===null
          || Array.isArray(item.locationReferenceV07.orientationCityPoint));
      }
      const reference=item.operatorReferenceV07;
      if(reference){
        assert.ok(/^https:\/\//.test(reference.sourceUrl));
        assert.ok(reference.priceReference);
        assert.ok(reference.localTransitTip);
        assert.ok(!Number.isSafeInteger(item.price?.cents)
          || !reference.confirmedSep2027Hours || item.price?.label,
          'Seasonal hours cannot silently create a new price');
        assert.ok((item.source??[]).includes('operator-v07-attraction:'+reference.id));
      }
    }
    const map=explorerData(trip.items,trip);
    assert.ok(map.placed.length>0);
    assert.ok(map.unlocated.every(x=>x.point==null));
  }
});

test('Airbnb original 42 wishlist entries remain snapshots, never mapped as exact bookings',()=>{
  assert.equal(catalog.research.airbnbWishlistResearchV04.length,42);
  for(const trip of catalog.trips){
    const airbnbs=trip.items.filter(x=>x.provider==='Airbnb');
    assert.ok(airbnbs.every(x=>x.point===null && x.address===null && !x.booked
      && x.price===null && x.locationReferenceV07.precision==='city_only_not_a_pin'));
  }
});

test('Official operators and references are properly linked in catalog source registry',()=>{
  const all=catalog.sources;
  for(const ref of data.localTransitFareReferences)
    assert.equal(all['operator-v07-fare:'+ref.id].url,ref.sourceUrl);
  for(const ref of data.attractionReferences)
    assert.equal(all['operator-v07-attraction:'+ref.id].url,ref.sourceUrl);
  for(const ref of data.railExamples)
    assert.equal(all['operator-v07-rail:'+ref.id].url,ref.sourceUrl);
  assert.ok(catalog.research.mappedFareRowsV07.paris.length>=2);
  assert.ok(catalog.research.mappedFareRowsV07.barcelona.length>=3);
  assert.ok(catalog.research.mappedFareRowsV07.venice.length>=3);
});
