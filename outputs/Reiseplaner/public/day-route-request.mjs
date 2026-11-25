// A route request belongs to one draft and one visible variant revision.
// Clearing/readding the same stops still invalidates the old generation.
const snapshot=(ctx,ids)=>JSON.stringify([
 ctx?.page,ctx?.variant?.id,ctx?.variant?.revision,ctx?.city,ctx?.date,
 ids.map(id=>{const item=ctx?.all?.find(item=>item.id===id);
  return[id,item?.point,item?.city,item?.duration,item?.locked,item?.booked,item?.selected];}),
]);
export function createDayRouteGate(){
 let current=null;
 return{
  begin(ctx,ids){current=Object.freeze({snapshot:snapshot(ctx,ids)});return current;},
  isCurrent(token,ctx,ids){return token===current&&ctx?.page==='map'&&token?.snapshot===snapshot(ctx,ids);},
  invalidate(){current=null;},
 };
}

export function queueFocusIndex(before,after,index){
 const found=after.indexOf(before[index]);
 return found>=0?found:Math.max(0,Math.min(index,after.length-1));
}
