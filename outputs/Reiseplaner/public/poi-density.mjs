/**
 * Presentation-only map grouping. This module must never modify a source
 * coordinate, create a trip stop or claim an estimated position as exact.
 */
export const POI_DENSITY_MODES=Object.freeze(['calm','detail']);
export function poiDensityPolicy(zoom,mode='calm'){
 const z=Number.isFinite(zoom)?zoom:0;
 const detail=mode==='detail';
 return {
   mode:detail?'detail':'calm',
   clusterPixels:detail?(z<=12?70:0)
     :z<11.5?78:z<13?68:z<14.5?56:z<16?38:0,
   photoLimit:detail?24:10,
   photoCellPixels:detail?145:190,
 };
}
export function groupPoiForDisplay(items,zoom,project,{mode='calm',focusedId=null}={}){
 const {clusterPixels}=poiDensityPolicy(zoom,mode);
 const buckets=new Map();
 for(const item of items??[]){
  const p=item?.point,id=item?.explorerId??item?.id;
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)
    ||!id)continue;
  const xy=project(p);
  if(!xy||!Number.isFinite(xy.x)||!Number.isFinite(xy.y))continue;
  const focused=id===focusedId;
  const key=focused?'focused:'+id:clusterPixels>0
     ?String(item.city??'unknown')+':'+Math.floor(xy.x/clusterPixels)
       +':'+Math.floor(xy.y/clusterPixels)
     :String(item.city??'unknown')+':'+p.map(n=>n.toFixed(5)).join(',');
  if(!buckets.has(key))buckets.set(key,[]);
  buckets.get(key).push(item);
 }
 // Preserves the original data ordering and stable grouping across repaint.
 return buckets;
}
