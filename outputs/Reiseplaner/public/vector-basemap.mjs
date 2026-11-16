/**
 * Keyless map sources. OpenFreeMap vectors are the primary basemap; an
 * interactive OSM raster is loaded ONLY if the vector stack fails. Do not
 * preload map tiles or expose paid-provider API keys.
 */
const STYLE='https://tiles.openfreemap.org/styles/positron';
export const vectorBasemapStyle=STYLE;
export const fallbackRasterUrl='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const fallbackRasterOptions=Object.freeze({
  maxZoom:19,maxNativeZoom:19,keepBuffer:0,updateWhenIdle:true,
  attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-Mitwirkende</a>'
});
export const vectorAttribution='<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> © OpenMapTiles · Daten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-Mitwirkende</a>';
export const basemapLabels=Object.freeze({
 loading:'Kostenlose Karte wird geladen …',
 vector:'OpenFreeMap · ohne API-Key',
 fallback:'OpenStreetMap-Ersatzkarte · ohne API-Key',
 error:'Kartenhintergrund nicht erreichbar · Orte und Routen bleiben nutzbar',
 offline:'Offline-Testmodus · Kartenhintergrund ausgeschaltet'
});
// Two pinned, well-known public module CDNs improve the chance of keeping
// the much calmer OpenFreeMap vector map instead of falling back to raster
// tiles with dense/rotated road labels. Neither uses an API key.
const adapterSources=Object.freeze([
 'https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/dist/leaflet-maplibre-gl.mjs',
 'https://cdn.jsdelivr.net/npm/@maplibre/maplibre-gl-leaflet@0.1.4/dist/leaflet-maplibre-gl.mjs'
]);
export const vectorAdapterSources=adapterSources;
const vectorStylesheet='https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.css';
let cssRequested=false;
export function requestVectorStyles(){
 // A remote CSS link in static <head> blocked first paint. Load only while
 // upgrading an already visible Leaflet raster, never during initial HTML.
 if(typeof document==='undefined')return false;
 if(cssRequested)return true;
 cssRequested=true;
 const link=document.createElement('link');
 link.rel='stylesheet';link.href=vectorStylesheet;
 link.dataset.maplibreAsync='true';
 document.head.append(link);
 return true;
}
let importer=null;
const loadAdapter=()=>importer??=(async()=>{
 requestVectorStyles();
 let lastError;
 for(const url of adapterSources){
  try{
   const mod=await import(/* @vite-ignore */url);
   if(typeof mod.maplibreGL==='function')return mod.maplibreGL;
   lastError=new Error('Map adapter export missing');
  }catch(error){lastError=error}
 }
 importer=null;
 throw lastError??new Error('No MapLibre adapter CDN available');
})();

export function mapPalettePatch(gl){
 const layers=gl?.getStyle?.()?.layers??[];
 for(const layer of layers){
  const id=String(layer.id??'').toLowerCase();
  if(layer.type!=='fill')continue;
  try{
   if(id.includes('water'))gl.setPaintProperty(layer.id,'fill-color','#bde5f1');
   else if(/park|forest|wood|grass|landcover|landuse/.test(id))
    gl.setPaintProperty(layer.id,'fill-color','#e0efd7');
  }catch{/* Provider-specific expressions must not break the whole map. */}
 }
}

function awaitStyle(gl,timeoutMs){
 return new Promise((resolve,reject)=>{
  let ended=false,timer;
  const done=error=>{
   if(ended)return;
   ended=true;clearTimeout(timer);
   gl.off?.('load',loaded);gl.off?.('error',failed);
   if(error)reject(error);else resolve();
  };
  const loaded=()=>done(null);
  const failed=event=>{
   if(!gl.isStyleLoaded?.())done(new Error(event?.error?.message||'Map style unavailable'));
  };
  gl.on('load',loaded);gl.on('error',failed);
  timer=setTimeout(()=>done(new Error('Map style timed out')),timeoutMs);
  if(gl.isStyleLoaded?.())done(null);
 });
}

/**
 * The raster parameter is optional and is removed only AFTER the vector style
 * loads. The caller can keep a functioning raster in place during retries.
 * load is injectable for network-free regression tests.
 */
export async function installSoftVectorBasemap(map,raster=null,
 {alive=()=>true,load=loadAdapter,timeoutMs=10000}={}){
 if(!map||!alive())return null;
 let layer=null;
 try{
  const create=await load();
  if(!alive())return null;
  if(typeof create!=='function')throw new Error('MapLibre adapter unavailable');
  layer=create({style:STYLE,interactive:false}).addTo(map);
  const gl=layer.getMaplibreMap?.();
  if(!gl)throw new Error('MapLibre instance unavailable');
  await awaitStyle(gl,timeoutMs);
  if(!alive()){
   try{if(map.hasLayer(layer))map.removeLayer(layer)}catch{}
   return null;
  }
  mapPalettePatch(gl);
  if(raster&&map.hasLayer(raster))map.removeLayer(raster);
  return layer;
 }catch{
  try{if(layer&&map.hasLayer(layer))map.removeLayer(layer)}catch{}
  return null;
 }
}
