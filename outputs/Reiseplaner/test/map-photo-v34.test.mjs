import test from 'node:test';
import assert from 'node:assert/strict';
import {markerTier,MAP_ZOOM,bubbleMarkup,validMapCoordinate}
 from '../public/photo-map-model.mjs';
import {supermarketQuery,normalizeSupermarkets,fetchSupermarkets}
 from '../lib/supermarket-source.mjs';
import {vectorBasemapStyle,mapPalettePatch} from '../public/vector-basemap.mjs';

test('Zoom progressively reveals point, category and licensed photo',()=>{
 assert.equal(markerTier(5,true),'dot');
 assert.equal(markerTier(10.5,true),'dot');
 assert.equal(markerTier(11.5,true),'category');
 assert.equal(markerTier(14.5,false),'category');
 assert.equal(markerTier(14.5,true),'photo');
 assert.equal(markerTier(14.5,true,MAP_ZOOM.maxPhotos),'category');
 assert.equal(validMapCoordinate([41.4036,2.1744]),true);
 assert.equal(validMapCoordinate([0,0]),false);
 assert.equal(validMapCoordinate([91,2]),false);
});
test('Photo bubbles escape hostile text and never fabricate ratings',()=>{
 const safe=bubbleMarkup({id:'<x>',name:'<img src=x onerror=alert(1)>',
  category:'shop',photoUrl:'javascript:alert(1)',tier:'photo'});
 assert.doesNotMatch(safe,/<img[^>]*onerror=|src="javascript:/i);
 assert.match(safe,/&lt;img/);
 assert.doesNotMatch(safe,/★ [0-9]/);
 assert.match(safe,/Supermarkt/);
 const photo=bubbleMarkup({id:'a',name:'Landmark',category:'activity',
  tier:'photo',photoUrl:'https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg?width=960',
  rating:4.7});
 assert.match(photo,/<img src=/);
 assert.match(photo,/★ 4,7/);
});
test('Source query remains within numeric city coordinate and bounded radius',()=>{
 const q=supermarketQuery([41.4036,2.1744]);
 assert.match(q,/shop"="supermarket"/);
 assert.match(q,/around:6500,41\.40360,2\.17440/);
 assert.match(q,/out center 160/);
 assert.throws(()=>supermarketQuery([91,2]));
});
test('OSM nodes and polygon centres keep different precision; duplicates rejected',()=>{
 const items=normalizeSupermarkets([
  {type:'node',id:12,lat:41.4,lon:2.17,tags:{shop:'supermarket',name:'A'}},
  {type:'way',id:13,center:{lat:41.41,lon:2.19},tags:{shop:'supermarket',brand:'B'}},
  {type:'node',id:14,lat:99,lon:2.2,tags:{shop:'supermarket',name:'Invalid'}},
  {type:'node',id:15,lat:41.4,lon:2.2,tags:{shop:'bakery',name:'Wrong'}},
  {type:'node',id:12,lat:41.4,lon:2.17,tags:{shop:'supermarket',name:'Duplicate'}}
 ],'barcelona');
 assert.equal(items.length,2);
 assert.equal(items[0].locationReferenceV07.exactKnown,true);
 assert.equal(items[1].geoEvidence.isCentroid,true);
 assert.equal(items[0].rating,null);
 assert.equal(items[0].readOnlyExternal,true);
 assert.match(items[0].sourceUrl,/openstreetmap.org\/node\/12/);
});
test('On-demand query discloses limited coverage and avoids fake open-now',async()=>{
 let calls=0;
 const mockFetch=async(url,init)=>{
  calls++;
  assert.match(url,/overpass-api\.de/);
  assert.match(init.headers['User-Agent'],/Reiseplaner-Local/);
  return {ok:true,json:async()=>({elements:[
   {type:'node',id:7,lat:43.405,lon:3.695,tags:{shop:'supermarket',name:'Markt'}}
  ]})};
 };
 const result=await fetchSupermarkets('sete',[43.4,3.69],{fetcher:mockFetch});
 assert.equal(calls,1);
 assert.equal(result.count,1);
 assert.equal(result.coverageRadiusMeters,6500);
 assert.match(result.note,/keine vollständige/i);
 assert.equal(result.items[0].booked,false);
});
test('MapLibre Positron style and guarded pastel palette',()=>{
 assert.equal(vectorBasemapStyle,'https://tiles.openfreemap.org/styles/positron');
 const changed=[];
 mapPalettePatch({getStyle:()=>({layers:[
   {id:'water',type:'fill'},{id:'landcover',type:'fill'},
   {id:'city-label',type:'symbol'}]}),
   setPaintProperty:(...args)=>changed.push(args)});
 assert.deepEqual(changed,[['water','fill-color','#bde5f1'],['landcover','fill-color','#e0efd7']]);
});
