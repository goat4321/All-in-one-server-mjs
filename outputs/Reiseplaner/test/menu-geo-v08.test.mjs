import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { initialState } from '../lib/store.mjs';
import { activeItems } from '../public/model.mjs';
import { explorerData, validPoint } from '../public/map-explorer.mjs';

const catalog=await loadCatalog();
const menu=catalog.research.foodMenuV08;
const unresolved=catalog.research.geoUnresolvedV08;

test('All 39 curated restaurants have an independently classified menu research row',()=>{
  assert.equal(menu.schema,'food_menu_audit_v08');
  assert.equal(menu.items.length,39);
  assert.deepEqual(menu.counts,{total:39,priced:19,siteOnly:6,noPrice:14});
  assert.equal(new Set(menu.items.map(x=>x.id)).size,39);
  for(const row of menu.items){
    assert.ok(row.address);
    assert.ok(['priced_reference_found','provider_found_no_exact_menu_price',
      'no_reliable_item_price_found'].includes(row.status));
    if(row.menuReference){
      const ref=row.menuReference;
      assert.equal(ref.sep2027Confirmed,false);
      assert.equal(ref.includeInTripBudget,false);
      assert.equal(ref.mealGroupCheckoutVerified,false);
      assert.ok(/^https:\/\//.test(ref.sourceUrl));
      assert.ok(['EUR','CHF'].includes(ref.currency));
      assert.ok(ref.sample.length>0);
      assert.ok(ref.sample.every(x=>x.name&&Number.isSafeInteger(x.amountCents)&&x.amountCents>=0));
      assert.equal(catalog.sources['food-v08-menu:'+row.id].url,ref.sourceUrl);
    }
  }
});

test('Dated menu examples never turn into a chargeable selected meal or per-person checkout',()=>{
  const menuById=new Map(menu.items.map(x=>['local:'+x.id,x]));
  for(const trip of catalog.trips){
    const original=initialState(trip);
    const active=activeItems(trip,original);
    for(const item of trip.items.filter(x=>menuById.has(x.id))){
      const row=menuById.get(item.id);
      assert.equal(item.price,null);
      assert.equal(item.selected,false);
      assert.ok(!active.some(i=>i.id===item.id));
      assert.equal(item.menuPriceResearchV08.status,row.status);
      assert.deepEqual(item.menuPriceResearchV08.menuReference,row.menuReference);
      if(row.menuReference){
        assert.ok(item.source.includes('food-v08-menu:'+row.id));
        assert.equal(item.menuPriceResearchV08.menuReference.includeInTripBudget,false);
      }
    }
  }
  const sagrada=menuById.get('local:food-v03-006').menuReference;
  assert.equal(sagrada.sample.find(x=>x.name==='Patatas bravas').amountCents,510);
  assert.equal(sagrada.currency,'EUR');
  const terrace=menuById.get('local:food-v03-007').menuReference;
  assert.equal(terrace.extraPercentage,15);
  assert.equal(terrace.extraIncluded,false);
  const delivery=menuById.get('local:food-v03-015').menuReference;
  assert.equal(delivery.sourceType,'delivery_menu_only');
  const retail=menuById.get('local:food-v03-024').menuReference;
  assert.equal(retail.sourceType,'operator_retail_price_not_cafe_menu');
  const group=menuById.get('local:food-v03-009').menuReference;
  assert.equal(group.sourceType,'tourism_2027_group_offer');
  assert.equal(group.partySizeCondition,'group_unspecified');
  const swiss=menuById.get('local:food-v03-022').menuReference;
  assert.equal(swiss.currency,'CHF');
});

test('Previously unresolved coordinates have individual audit decisions; no Airbnb gets a fake location',()=>{
  assert.ok(catalog.research.geoResearchV06.acceptedUnique>=121);
  assert.equal(unresolved.length+catalog.research.geoResearchV06.acceptedUnique,290);
  assert.equal(unresolved.filter(x=>x.status==='review').length,
    catalog.research.geoResearchV06.reviewUnique);
  assert.equal(new Set(unresolved.map(x=>x.id+'|'+x.city)).size,unresolved.length);
  assert.equal(unresolved.filter(x=>x.privateAirbnbProperty).length,42);
  for(const row of unresolved){
    assert.ok(['review','unmatched','skipped'].includes(row.status));
    assert.ok(row.reviewReason);
    assert.ok(row.nextAction);
    assert.equal(row.placePrecision,'unverified_not_a_pin');
    assert.ok(row.url?.startsWith('https://www.google.com/maps/search/'));
  }
  for(const trip of catalog.trips){
    for(const item of trip.items.filter(x=>x.provider==='Airbnb')){
      assert.equal(item.point,null);
      assert.equal(item.address,null);
      assert.ok(item.googleMapsUrl);
      assert.equal(item.locationReferenceV07.exactKnown,false);
    }
    const map=explorerData(trip.items,trip);
    assert.ok(map.placed.every(x=>validPoint(x.point)));
    assert.ok(map.unlocated.every(x=>!validPoint(x.point)));
  }
});

test('Source-backed Sète restaurants are located by actual tourism-office GPS, not city centroid',()=>{
  for(const trip of catalog.trips){
    if(!trip.route.includes('sete'))continue;
    for(const id of ['local:food-v03-008','local:food-v03-010']){
      const item=trip.items.find(x=>x.id===id);
      assert.ok(item);
      assert.ok(validPoint(item.point));
      assert.ok(item.geoEvidence?.url?.includes('tourisme-sete.com'));
      assert.equal(item.geoEvidence.confidence,'verified_external_coordinates');
    }
  }
});
