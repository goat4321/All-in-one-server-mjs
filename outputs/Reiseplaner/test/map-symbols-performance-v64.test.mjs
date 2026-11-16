import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mapCategoryIcon,mapLegacyPinContent,mapIconForPlace,MAP_ICON_CATEGORIES}
  from '../public/map-marker-icons-v64.mjs';
import {bubbleMarkup} from '../public/photo-map-model.mjs';
import {poiDensityPolicy} from '../public/poi-density.mjs';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [map,app,css,index]=await Promise.all([
 read('public/map.mjs'),read('public/app.mjs'),
 read('public/map-symbols-performance-v64.css'),read('public/index.html')
]);
test('Five recognizable built-in SVG symbols replace single-letter location markers',()=>{
 assert.deepEqual(MAP_ICON_CATEGORIES,['lodging','food','shop','activity','transport']);
 const paths=new Set();
 for(const kind of MAP_ICON_CATEGORIES){
  const html=mapCategoryIcon(kind);
  assert.match(html,/<svg[^>]*aria-hidden="true">/);
  assert.match(html,/<path /);
  assert.doesNotMatch(html,/<(?:script|img|use)\\b|\\s(?:href|src|onload|onerror)=/i);
  paths.add(html);
  assert.match(bubbleMarkup({id:'x',name:'Eintrag',category:kind,tier:'category'}),/map-category-icon/);
 }
 assert.equal(paths.size,5,'Every icon depicts a unique category');
 assert.match(mapCategoryIcon('lodging'),/m3 10 9-7/,'Hotel icon shows a house');
 assert.match(mapCategoryIcon('food'),/M4 3v7/,'Restaurants show cutlery');
 assert.match(mapCategoryIcon('transport'),/rect x="5"/,'Transport shows a train');
});
test('Finer map icons match only recorded park, beach, museum, club and viewpoint text',()=>{
 assert.equal(mapIconForPlace({name:'Parc de la Ciutadella'},'activity'),'park');
 assert.equal(mapIconForPlace({name:'Barceloneta Strand'},'activity'),'beach');
 assert.equal(mapIconForPlace({name:'Musée Curie'},'activity'),'museum');
 assert.equal(mapIconForPlace({name:'Optionaler Clubabend Barcelona'},'activity'),'nightlife');
 assert.equal(mapIconForPlace({name:'Gletscherschlucht Grindelwald'},'activity'),'viewpoint');
 assert.equal(mapIconForPlace({name:'Schlichte Unterkunft'},'lodging'),'lodging');
 assert.equal(mapIconForPlace({name:'Unbekannte Attraktion'},'activity'),'activity');
 assert.match(bubbleMarkup({category:'activity',iconType:'park',tier:'photo'}),/>Park<\/span>/);
});
test('Map legacy pins keep numbered day sequences but replace H/R/S/A/B letters',()=>{
 assert.match(mapLegacyPinContent('H','place-lodging'),/<svg/);
 assert.match(mapLegacyPinContent('R','place-food'),/<svg/);
 assert.match(mapLegacyPinContent('S','place-shop'),/<svg/);
 assert.match(mapLegacyPinContent('A','place-activity'),/<svg/);
 assert.match(mapLegacyPinContent('B','place-transport'),/<svg/);
 assert.match(mapLegacyPinContent(3,'train'),/>3<\/span>/);
 assert.doesNotMatch(mapLegacyPinContent('<img onerror=x>',''),/<img/);
});
test('Photo marker keeps a real licensed URL and shows house when photo is unavailable',()=>{
 const fallback=bubbleMarkup({id:'hotel',name:'Hotel',category:'lodging',
  photoUrl:'javascript:alert(1)',tier:'photo'});
 assert.match(fallback,/map-photo-disc/);
 assert.match(fallback,/map-category-icon/);
 assert.doesNotMatch(fallback,/src="javascript:/);
 const image=bubbleMarkup({id:'hotel',name:'Hotel',category:'lodging',
  photoUrl:'https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg?width=960',
  tier:'photo'});
 assert.match(image,/<img src="https:\/\/commons\.wikimedia\.org/);
});
test('First map loads at real fitted location, displays raster before optional vector',async()=>{
 const vector=await read('public/vector-basemap.mjs');
 assert.doesNotMatch(index,/<link[^>]+href="https:\/\/unpkg\.com\/maplibre-gl[^\"]+\.css"/);
 assert.match(vector,/requestVectorStyles\(\)/);
 assert.match(map,/this\.basemapBooted=false/);
 assert.match(map,/this\.useRasterFallback\(\);\s*void this\.startBasemap\(\)/);
 assert.match(map,/if\(!this\.fallbackLayer\)this\.setBasemapStatus\('loading'\)/);
 assert.match(map,/this\.map\.on\('moveend',\s*\(\) => this\.paintExplorerPins\(\)\)/);
});
test('Rerender keeps the same Leaflet map node and click does not repaint all POIs',()=>{
 assert.match(app,/const oldMap=currentMap/);
 assert.match(app,/const mapNode=reuse\?oldMap\.element:null/);
 assert.match(app,/replacement\.replaceWith\(mapNode\)/);
 assert.match(app,/const retained=Boolean\(currentMap&&currentMap\.element===element\)/);
 assert.match(app,/currentMap\.viewportListenerRegistered=true/);
 assert.match(app,/currentMap\?\.selectMarkerOnly/);
 assert.doesNotMatch(app,/selectMarkerOnly[^;]*;\s*paintMap\(\)/);
 assert.match(map,/selectMarkerOnly\(id\)/);
});
test('POI DOM is culled to viewport, CSS removes markers entrance animation',()=>{
 assert.match(map,/this\.map\.getBounds\?\.\(\)\.pad\(\.22\)/);
 assert.match(map,/this\.poiItems\.filter\(item=>visible\.contains\(item\.point\)\)/);
 assert.match(map,/groupPoiForDisplay\(onScreen,zoom/);
 assert.match(css,/\.map-category-bubble\.group-lodging/);
 assert.match(css,/\.map-photo-bubble\.group-food/);
 assert.match(css,/\.map-category-bubble,\s*\.reference-travel-shell \.poi-cluster-count/);
 assert.match(index,/map-symbols-performance-v64\.css/);
 assert.ok(poiDensityPolicy(13.5).clusterPixels>0);
});
