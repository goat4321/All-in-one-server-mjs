import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installSoftVectorBasemap,vectorBasemapStyle,fallbackRasterUrl,
  fallbackRasterOptions,vectorAttribution,basemapLabels,vectorAdapterSources } from '../public/vector-basemap.mjs';

test('Free primary and fallback sources require no API key or CARTO service',()=>{
 assert.equal(vectorBasemapStyle,'https://tiles.openfreemap.org/styles/positron');
 assert.equal(fallbackRasterUrl,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
 assert.equal(fallbackRasterOptions.keepBuffer,0);
 assert.equal(fallbackRasterOptions.updateWhenIdle,true);
 assert.match(fallbackRasterOptions.attribution,/OpenStreetMap/);
 assert.match(vectorAttribution,/OpenFreeMap/);
 assert.match(basemapLabels.vector,/ohne API-Key/);
 const all=Object.values(basemapLabels).join(' ');
 assert.doesNotMatch(all,/CARTO|MapTiler|Mapbox/i);
 assert.equal(vectorAdapterSources.length,2);
 assert.ok(vectorAdapterSources.every(url=>/^https:\/\//.test(url)));
 assert.match(vectorAdapterSources[0],/unpkg\.com/);
 assert.match(vectorAdapterSources[1],/cdn\.jsdelivr\.net/);
 assert.ok(vectorAdapterSources.every(url=>url.includes('@0.1.4/dist/leaflet-maplibre-gl.mjs')));

});
test('Broken dynamic map adapter gracefully returns null for OSM fallback',async()=>{
 const map={};
 const vector=await installSoftVectorBasemap(map,null,{
   load:async()=>{throw new Error('blocked CDN')},alive:()=>true});
 assert.equal(vector,null);
});
test('Detached map avoids remote imports',async()=>{
 let requested=false;
 const result=await installSoftVectorBasemap({},null,{
   alive:()=>false,load:async()=>{requested=true}});
 assert.equal(result,null);
 assert.equal(requested,false);
});
test('Working vector map replaces the raster only after ready state',async()=>{
 const layers=new Set();
 const gl={getStyle:()=>({layers:[]}),isStyleLoaded:()=>true,
  on:()=>{},off:()=>{}};
 const layer={getMaplibreMap:()=>gl,addTo:map=>{layers.add(layer);return layer}};
 const raster={};
 layers.add(raster);
 const map={hasLayer:x=>layers.has(x),removeLayer:x=>{layers.delete(x)}};
 const result=await installSoftVectorBasemap(map,raster,{
   load:async()=>()=>layer,alive:()=>true});
 assert.equal(result,layer);
 assert.equal(layers.has(raster),false);
 assert.equal(layers.has(layer),true);
});
test('Main code no longer requests CARTO anonymous watermark tiles',async()=>{
 const [map,server,views,app]=await Promise.all([
  'public/map.mjs','server.mjs','public/views.mjs','public/app.mjs'].map(path=>
   readFile(new URL('../'+path,import.meta.url),'utf8')));
 assert.doesNotMatch(map,/basemaps\.cartocdn\.com/);
 assert.match(map,/useRasterFallback/);
 assert.match(server,/https:\/\/tile\.openstreetmap\.org/);
 assert.match(server,/https:\/\/cdn\.jsdelivr\.net/);
 assert.match(server,/https:\/\/unpkg\.com/);
 assert.match(views,/id="map-source-indicator"/);
 assert.match(app,/map-basemap-retry/);
});
