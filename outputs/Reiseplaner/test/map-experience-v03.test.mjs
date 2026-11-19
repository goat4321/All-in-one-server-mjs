import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mapCategoryIcon,mapIconForPlace} from '../public/map-marker-icons-v64.mjs';
import {explorerData,explorerUnlocatedCityClusters} from '../public/map-explorer.mjs';
import {markerProvenance} from '../public/poi-location-provenance.mjs';
import {mapViewSummary} from '../public/map-view-summary-v72.mjs';

test('accommodation, meals and activities have distinct offline SVG marker icons',()=>{
 const hotel=mapCategoryIcon('lodging');
 assert.match(hotel,/m3 10 9-7/,'lodging marker includes an outline house');
 assert.match(hotel,/M7 18v-4/,'lodging marker shows an actual bed inside the house');
 assert.notEqual(hotel,mapCategoryIcon('food'));
 assert.notEqual(hotel,mapCategoryIcon('activity'));
 assert.equal(mapIconForPlace({kind:'lodging',name:'Test'},'lodging'),'lodging');
 assert.match(mapCategoryIcon('food'),/<svg/);
 assert.ok(!hotel.includes('<script')&&!hotel.includes('<image')&&!hotel.includes('href='),'marker glyphs need no remote image request');
});

test('my day is exactly its planned records, city all its real POIs, trip only route city hubs',()=>{
 const trip={route:['barcelona','paris']};
 const items=[
  {id:'planned',name:'Museum',kind:'activity',category:'activity',city:'barcelona',point:[41.4,2.17]},
  {id:'optional',name:'Lunch',kind:'activity',category:'food',city:'barcelona',point:[41.41,2.18]},
  {id:'missing',name:'Unlocated stay',kind:'lodging',city:'barcelona',point:null},
  {id:'paris',name:'Hotel',kind:'lodging',city:'paris',point:[48.86,2.34]},
 ];
 const day=explorerData(items,trip,{dayItemIds:new Set(['planned'])});
 assert.deepEqual(day.placed.map(x=>x.id),['planned']);
 assert.equal(day.unlocated.length,0);
 const city=explorerData(items,trip,{city:'barcelona'});
 assert.equal(city.placed.length,2);
 assert.equal(city.unlocated.length,1);
 const all=explorerData(items,trip);
 assert.equal(all.placed.length,3);
 assert.equal(all.unlocated.length,1);
 const summary=mapViewSummary({trip,cities:{barcelona:{name:'Barcelona',point:[41.4,2.1]},paris:{name:'Paris',point:[48.8,2.3]}},city:'barcelona',explorer:{scope:'trip',placed:all.placed,unlocated:all.unlocated}});
 assert.equal(summary.displayCount,2,'trip summary counts cities, not point-of-interest pins');
 assert.match(summary.description,/schematisch/i);
});

test('area- and city-centre references never become false precise lodging points',()=>{
 const centre={id:'c',name:'Hotelgebiet',kind:'lodging',city:'barcelona',
  point:[41.4,2.17],geoEvidence:{isCentroid:true,url:'https://example.com/source'}};
 assert.equal(markerProvenance(centre).kind,'area');
 assert.match(markerProvenance(centre).label,/kein genauer Eingang/);
 const cities={barcelona:{name:'Barcelona',point:[41.38,2.17]}};
 const rows=explorerUnlocatedCityClusters({showCityReferences:true,
  unlocated:[{id:'u',name:'Noch ohne Gebäude',kind:'lodging',city:'barcelona',point:null}]},cities);
 assert.equal(rows.length,1);
 assert.equal(rows[0].hotelCount,1);
 assert.equal(rows[0].count,1);
 assert.equal(rows[0].point,cities.barcelona.point);
 assert.equal(explorerData([{id:'u',name:'Noch ohne Gebäude',kind:'lodging',city:'barcelona',point:null}],{route:['barcelona']}).placed.length,0);
});

test('map filter optimization is scoped; mobile sheet has native focus and reduced motion',async()=>{
 const [app,map,css,views]=await Promise.all([
  'app.mjs','map.mjs','design-foundations-v01.css','views.mjs'
 ].map(file=>readFile(new URL('../public/'+file,import.meta.url),'utf8')));
 assert.match(app,/function updateMapResultsInPlace\(/);
 assert.match(app,/paintMap\(false\); \/\/ Reuse Leaflet/);
 assert.match(app,/if\(switchingCity\|\|!updateMapResultsInPlace\(\)\)/);
 assert.match(app,/dayPreview:null/,'unselected legacy day suggestions stay off the mapped itinerary');
 assert.match(app,/app\.querySelectorAll\('\[data-action=explorer-group\]'\)/,
   'all duplicate category controls are synchronized after a fast filter');
 assert.match(map,/this\.poiRenderSignature===signature|signature===this\.poiRenderSignature/);
 assert.match(map,/this\.poiReuseCount\+\+/);
 assert.match(map,/class="map-area-flag"/);
 assert.match(css,/\.map-fullscreen-mode\.fullscreen-drawer-open>\.explorer-right/);
 assert.match(css,/translateY\(calc\(100% \+ 8px\)\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(views,/map-sheet-handle/);
 assert.match(views,/Meine geplanten Stopps/);
 assert.match(views,/Keine eingeplanten Stopps mit Einzelpunkt/);
 assert.match(views,/data-action="explorer-scope" data-value="city"/);
});
