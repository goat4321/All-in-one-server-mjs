import {distanceKm} from './catalog.mjs';

// Only the FOSSGIS routed-bike instance is allowed to supply bike geometry.
// The "driving" URL segment is part of OSRM's API syntax, not a car profile.
// The actual server/profile is selected by the /routed-bike/ prefix.
export const BIKE_ROUTER_HOST='https://routing.openstreetmap.de/routed-bike/route/v1/driving/';
export const BIKE_CACHE_MS=24*60*60*1000;
const validPoint=p=>Array.isArray(p)&&p.length===2
  &&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180
  &&(p[0]!==0||p[1]!==0);
export const bikeRouteKey=points=>'bike:'+points.map(p=>p.map(v=>v.toFixed(5)).join(',')).join(';');
export function bikeRequestUrl(points){
 if(!Array.isArray(points)||points.length!==2||!points.every(validPoint)
   ||distanceKm(...points)>80)throw Error('Zwei gültige Fahrrad-Ziele im Umkreis von 80 km nötig.');
 return BIKE_ROUTER_HOST+points.map(([lat,lon])=>lon.toFixed(5)+','+lat.toFixed(5)).join(';')
   +'?overview=full&geometries=geojson&steps=true';
}
export function checkedBikeResponse(json,from,to,checked=new Date().toISOString().slice(0,10)){
 if(json?.code!=='Ok'||!Array.isArray(json.routes)||!json.routes.length)
   throw Error('Rad-Router liefert keine belegte Strecke.');
 const first=json.routes[0];
 const coords=first?.geometry?.type==='LineString'?first.geometry.coordinates:null;
 if(!Array.isArray(coords)||coords.length<2||coords.length>15000
   ||coords.some(p=>!Array.isArray(p)||p.length<2||p.length>3
     ||!p.slice(0,2).every(Number.isFinite)))throw Error('Radroute ohne gültige Liniengeometrie.');
 const points=coords.map(([lon,lat])=>[lat,lon]);
 if(points.some(p=>!validPoint(p)))throw Error('Radroute mit ungültiger Koordinate.');
 // Mismatched provider geometry must never create a false route, length or ETA.
 if(distanceKm(points[0],from)>0.075||distanceKm(points.at(-1),to)>0.075)
   throw Error('Radroute endet nicht an den gewählten Punkten (75-m-Grenze).');
 if(!Number.isFinite(first.distance)||first.distance<=0||first.distance>200000
   ||!Number.isFinite(first.duration)||first.duration<=0||first.duration>7*86400
   ||!Array.isArray(first.legs)||first.legs.length===0)
   throw Error('Radroute ohne belastbare Distanz oder Dauer.');
 return {mode:'Radweg',cycleOnly:true,walkOnly:false,points,
   metres:Math.round(first.distance),minutes:Math.max(1,Math.ceil(first.duration/60)),
   source:'FOSSGIS · OSRM-Fahrradprofil / © OpenStreetMap-Mitwirkende',
   sourceUrl:'https://routing.openstreetmap.de/about.html',
   checked};
}
