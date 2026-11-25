// Lightweight schematic trip diagram. Only existing city anchors are used.
// This is deliberately not a geographical road/rail trace or location evidence.
export function routeSketch(route,cities){
 const distinct=[...new Set(route??[])];
 const stops=distinct.map((id,index)=>{
   const point=cities?.[id]?.point;
   if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)
     ||Math.abs(point[0])>90||Math.abs(point[1])>180)return null;
   return {id,name:cities[id].name??id,index,lat:point[0],lon:point[1]};
 }).filter(Boolean);
 if(stops.length<2)return {stops:[],path:''};
 const lat=stops.map(s=>s.lat),lon=stops.map(s=>s.lon);
 const xmin=Math.min(...lon),xmax=Math.max(...lon);
 const ymin=Math.min(...lat),ymax=Math.max(...lat);
 const dx=Math.max(1,xmax-xmin),dy=Math.max(1,ymax-ymin);
 const result=stops.map((s,i)=>{
   const x=12+76*(s.lon-xmin)/dx,y=18+64*(ymax-s.lat)/dy;
   return {...s,x:+x.toFixed(3),y:+y.toFixed(3),order:i+1};
 });
 const path=result.map((s,i)=>(i?' L ':'M ')+(s.x*5.6).toFixed(2)+' '+(s.y*2.8).toFixed(2)).join('');
 return {stops:result,path};
}
