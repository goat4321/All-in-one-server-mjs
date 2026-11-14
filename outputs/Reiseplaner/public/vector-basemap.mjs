/**
 * MapLibre paints a vector Positron basemap into the existing Leaflet map
 * without replacing Leaflet route overlays, controls, or source-backed pins.
 * The CARTO light raster stays in place on failed imports/WebGL/tile loads.
 */
const STYLE='https://tiles.openfreemap.org/styles/positron';
let importer=null;
const loadAdapter=()=>importer??=import(
 'https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/dist/leaflet-maplibre-gl.mjs'
).then(mod=>mod.maplibreGL).catch(error=>{importer=null;throw error});

export const vectorBasemapStyle=STYLE;
export function mapPalettePatch(gl){
 const layers=gl?.getStyle?.()?.layers??[];
 for(const layer of layers){
  const id=String(layer.id??'').toLowerCase();
  if(layer.type!=='fill')continue;
  try{
   if(id.includes('water'))gl.setPaintProperty(layer.id,'fill-color','#bde5f1');
   else if(/park|forest|wood|grass|landcover|landuse/.test(id))
    gl.setPaintProperty(layer.id,'fill-color','#e0efd7');
  }catch{/* some providers use data-driven paint rules; leave them intact */}
 }
}
export async function installSoftVectorBasemap(map,raster,{report=()=>{},alive=()=>true}={}){
 if(!map||!alive())return null;
 let layer=null,completed=false;
 try{
  const create=await loadAdapter();
  if(!alive())return null;
  layer=create({style:STYLE,interactive:false}).addTo(map);
  const gl=layer.getMaplibreMap();
  const cleanup=()=>{
   if(!completed){completed=true;
    if(map.hasLayer(layer))map.removeLayer(layer);
   }
  };
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('vector style timeout')),10000);
   const success=()=>{
    if(!alive()){clearTimeout(timer);reject(Error('map detached'));return;}
    try{mapPalettePatch(gl)}catch{}
    clearTimeout(timer);resolve();
   };
   gl.once('load',success);
   gl.once('error',error=>{
    if(!gl.isStyleLoaded()) {clearTimeout(timer);reject(Error(error?.error?.message||'vector style failed'));}
   });
  });
  if(!alive()){cleanup();return null;}
  completed=true;
  if(map.hasLayer(raster))map.removeLayer(raster);
  return layer;
 }catch(error){
  if(layer&&map.hasLayer(layer))map.removeLayer(layer);
  // No alarming UI message: fallback remains fully interactive.
  report('');
  return null;
 }
}
