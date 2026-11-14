import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {foodDirectory,marketCoverage} from '../public/food-discovery-v36.mjs';
import {foodBrowseCards,browseOptionCard} from '../public/browse-hub-v35.mjs';
import {optionMatchesFilter} from '../public/smart-filters.mjs';
import {normalizeSupermarkets} from '../lib/supermarket-source.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_classic');
assert.ok(trip,'The classic Interrail variant must exist');
const ctx={
 trip,cities:catalog.cities,city:'barcelona',all:trip.items,
 people:[{id:'p1'},{id:'p2'},{id:'p3'}],state:{favorites:[],votes:{},placePhotos:{}},
 browseScope:'city',browseSearch:'',browseFoodType:'all',
 browseFoodSavedOnly:false,activeSet:new Set(),hotelWalks:{},
 nightlyTargetEuro:35,
};
const markets=normalizeSupermarkets([
 {type:'node',id:2026001,lat:41.38,lon:2.15,
  tags:{shop:'supermarket',name:'Test Store', 'addr:street':'Carrer Test','addr:housenumber':'12'}},
 {type:'way',id:2026002,center:{lat:41.40,lon:2.18},
  tags:{shop:'supermarket',name:'Test Polygon Store'}},
],ctx.city);

test('Only the explicitly loaded market dataset augments the directory',()=>{
 const before=foodDirectory(ctx,[]);
 const loaded=foodDirectory(ctx,markets);
 assert.equal(loaded.available.markets,before.available.markets+2);
 assert.equal(loaded.shown.length,before.shown.length+2);
 assert.ok(loaded.shown.some(item=>item.id==='market:osm:node:2026001'));
 assert.equal(ctx.all.length,trip.items.length,'No catalog mutation');
});
test('City and trip scopes keep unrelated towns out of city shopping',()=>{
 const inCity=foodDirectory(ctx,markets);
 const inTrip=foodDirectory({...ctx,browseScope:'trip'},markets);
 assert.ok(inCity.shown.every(item=>item.city==='barcelona'));
 assert.ok(inTrip.shown.length>=inCity.shown.length);
 assert.ok(inTrip.shown.some(item=>item.city!=='barcelona'));
});
test('Search and category filters work with newly loaded OSM shops',()=>{
 const found=foodDirectory({...ctx,browseFoodType:'markets',browseSearch:'Test Store'},markets);
 assert.ok(found.shown.some(item=>item.id==='market:osm:node:2026001'));
 assert.ok(found.shown.every(item=>item.city==='barcelona'));
 const restaurants=foodDirectory({...ctx,browseFoodType:'restaurants'},markets);
 assert.ok(restaurants.shown.every(item=>item.category!=='shop'));
});
test('Saved-only food lists merge catalog favorites and browser map bookmarks',()=>{
 const existing=foodDirectory(ctx,[]).shown.find(item=>!item.readOnlyExternal);
 assert.ok(existing);
 const savedIds=new Set([existing.id,markets[0].id]);
 const both=foodDirectory({...ctx,browseFoodSavedOnly:true,browseSavedIds:savedIds},
  markets);
 assert.equal(both.shown.length,2);
 assert.ok(both.shown.some(item=>item.id===markets[0].id));
 const hotel=trip.items.find(item=>item.kind==='lodging'&&item.city==='barcelona');
 assert.ok(hotel);
 assert.equal(optionMatchesFilter(hotel,'saved',{
  ...ctx,browseSavedIds:new Set([hotel.id])},true),true);
});
test('Externally sourced shops are not described as purchasable inventory',()=>{
 const node=markets[0],way=markets[1];
 assert.equal(node.readOnlyExternal,true);
 assert.equal(way.geoEvidence.isCentroid,true);
 assert.equal(node.price,null);
 assert.equal(way.rating,null);
 const html=foodBrowseCards({...ctx,browseSavedIds:new Set()},markets);
 assert.match(html,/data-action="browse-map-item"/);
 assert.match(html,/Kartendatenquelle/);
 assert.match(html,/kein bestätigter Eingang/);
 assert.doesNotMatch(html,/data-action="choose"/);
 assert.doesNotMatch(html,/★ [0-9]/);
});
test('New cards escape untrusted public shop names',()=>{
 const malicious={...markets[0],name:'<script>alert("hi")</script>'};
 const html=foodBrowseCards(ctx,[malicious]);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
});
test('Loading status states the city coverage and never claims it is exhaustive',()=>{
 assert.match(marketCoverage({cityName:'Barcelona',cityLoaded:false}),/noch nicht abgefragt/);
 assert.match(marketCoverage({cityName:'Barcelona',cityLoaded:true,count:10,
  checkedOn:'2026-11-14'}),/10 kartierte Geschäfte/);
 assert.match(marketCoverage({scope:'trip',loadedCities:1,totalCities:6}),
  /1 von 6 Reiseorten/);
 assert.match(marketCoverage({cityLoaded:true}),/keine Öffnungsprüfung/);
});
test('Lodging cards reflect either favorites store in their state',()=>{
 const hotel=trip.items.find(item=>item.kind==='lodging'&&item.city==='barcelona');
 assert.ok(hotel);
 const html=browseOptionCard(hotel,{...ctx,browseSavedIds:new Set([hotel.id])},
  {lodging:true});
 assert.match(html,/data-action="browse-save"/);
 assert.match(html,/Gemerkt/);
});
