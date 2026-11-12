import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { activeItems } from '../public/model.mjs';
import { initialState } from '../lib/store.mjs';
import { explorerCategory, explorerData, explorerDetail, validPoint,
  explorerRouteInput, externalFootUrl, externalTransitUrl } from '../public/map-explorer.mjs';

const catalog = await loadCatalog();
const classic = catalog.trips.find(t => t.id === 'interrail_classic');

test('All four independent travel variants expose only source-backed place coordinates and never add choices', () => {
  assert.equal(catalog.trips.length, 4);
  for (const trip of catalog.trips) {
    const items = trip.items.map(x => ({ ...x }));
    const before = activeItems(trip, initialState(trip)).map(item => item.id).sort();
    const result = explorerData(items, trip);
    assert.ok(result.total > 0, trip.id);
    assert.equal(result.placed.length + result.unlocated.length, result.total);
    assert.ok(result.placed.every(x => validPoint(x.point)));
    assert.ok(result.unlocated.every(x => !validPoint(x.point)));
    assert.ok(result.placed.every(x => trip.route.includes(x.city)));
    assert.deepEqual(activeItems(trip, initialState(trip)).map(x => x.id).sort(), before);
  }
});

test('Search covers all available trip places and uses city, category, accent and raw description', () => {
  const all = explorerData(classic.items, classic);
  const city = explorerData(classic.items, classic, {city:'barcelona'});
  const food = explorerData(classic.items, classic, {city:'barcelona', group:'food'});
  const shop = explorerData(classic.items, classic, {city:'barcelona', group:'shop'});
  assert.ok(all.total > city.total);
  assert.ok(city.total > food.total);
  assert.ok(food.total > 0);
  assert.ok(shop.total > 0);
  assert.ok(food.placed.some(x => x.name.includes('Bormuth')));
  assert.ok(shop.placed.some(x => /Carrefour/i.test(x.name)));
  assert.ok(explorerData(classic.items, classic, {search:'sete'}).total > 0);
  assert.equal(explorerData(classic.items, classic, {search:'very-unlikely-query-12345'}).total, 0);
  assert.equal(explorerData(classic.items, classic, {city:'paris'}).placed.every(x => x.city === 'paris'), true);
});

test('Precise markers respect coordinate validation and duplicates; unknown locations remain in the list', () => {
  const trip = {route:['barcelona']};
  const fixture = [
    {id:'x',name:'Restaurant A',city:'barcelona',kind:'activity',category:'food',point:[41.3,2.2]},
    {id:'x',name:'Restaurant A duplicate',city:'barcelona',kind:'activity',category:'food',point:[41.3,2.2]},
    {id:'missing',name:'Hotel ohne Position',city:'barcelona',kind:'lodging',point:null},
    {id:'origin',name:'Falsche Nullkoordinate',city:'barcelona',kind:'lodging',point:[0,0]},
    {id:'stray',name:'Nicht-Reiseort',city:'nice',kind:'lodging',point:[43.7,7.2]},
    {id:'duplicate',name:'Duplicate',city:'barcelona',kind:'lodging',point:[41.4,2.2],duplicateOf:'x'},
  ];
  const result = explorerData(fixture,trip);
  assert.equal(result.total,3);
  assert.equal(result.placed.length,1);
  assert.deepEqual(result.unlocated.map(x=>x.id).sort(),['missing','origin']);
  assert.equal(validPoint([90.1,2]),false);
});

test('Restaurants, supermarkets, hotels, activities and transport get stable categories', () => {
  assert.equal(explorerCategory({kind:'lodging',name:'Hostel'}),'lodging');
  assert.equal(explorerCategory({kind:'transport',mode:'train'}),'transport');
  assert.equal(explorerCategory({kind:'activity',category:'food',name:'Bormuth Tapas'}),'food');
  assert.equal(explorerCategory({kind:'activity',category:'food',name:'Carrefour Supermarkt'}),'shop');
  assert.equal(explorerCategory({kind:'activity',name:'Museum'}),'activity');
});

test('Map detail displays actual source-backed prices, restaurant opening hours and hotel equipment', () => {
  const restaurant = classic.items.find(x => x.id === 'local:nardi');
  const supermarket = classic.items.find(x => x.id === 'local:carrefour-gran-via');
  const hotel = classic.items.find(x => x.name === 'Bird House' && x.kind === 'lodging');
  assert.ok(restaurant && supermarket && hotel);
  assert.match(explorerDetail(restaurant,3).hours,/13:00/);
  assert.match(explorerDetail(supermarket,3).hours,/09:00/);
  assert.match(explorerDetail(hotel,3).extra.join(' · '),/Küche/);
  assert.ok(explorerDetail(restaurant,3).priceText.includes('offen'));
  assert.ok(explorerDetail(restaurant,3).description.includes('Meeresfrüchte'));
});

test('A→B route constraints require real points; 2027 long-distance trip is not treated as a walk', () => {
  const a = {id:'a',city:'barcelona',point:[41.385873,2.182637]};
  const b = {id:'b',city:'barcelona',point:[41.385619,2.179640]};
  const across = {id:'c',city:'paris',point:[48.8584,2.2945]};
  const nearby = explorerRouteInput(a,b);
  assert.equal(nearby.canWalk,true);
  assert.equal(nearby.sameCity,true);
  assert.equal(explorerRouteInput(a,across).canWalk,false);
  assert.equal(explorerRouteInput(a,across).sameCity,false);
  assert.equal(explorerRouteInput(a,a),null);
  assert.equal(explorerRouteInput(a,{id:'missing',point:null}),null);
  assert.match(externalFootUrl(a,b),/^https:\/\/www.openstreetmap.org\/directions/);
  assert.match(externalTransitUrl(a,b),/travelmode=transit/);
  assert.equal(externalTransitUrl(a,{point:null}),null);
});
