// Route Studio is presentation-only: map lines may show confirmed footpaths
// or clearly labelled schematic orientation, never fabricated travel times.
import { validPoint } from './map-explorer.mjs';
import {routePositionQuality} from './route-position-quality.mjs';

export const MAP_TONES = Object.freeze(['standard', 'midnight', 'sand']);
// A previously cached route must actually join these current stops.
// It is not sufficient to have nonempty route geometry and a duration.
// Allow small routing-engine snapping offsets (<=75m), never kilometres.
const metresBetween=(a,b)=>{
 if(!validPoint(a)||!validPoint(b))return Infinity;
 const rad=Math.PI/180;
 const dl=(b[0]-a[0])*rad, dn=(b[1]-a[1])*rad;
 const h=Math.sin(dl/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dn/2)**2;
 return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.max(0,h))));
};
export function footpathMatchesStops(from,to,route,maxSnapMetres=75){
 if(!from||!to||!route?.walkOnly||!Array.isArray(route.points)
   ||route.points.length<2||!route.points.every(validPoint))return false;
 const first=route.points[0],last=route.points.at(-1);
 return metresBetween(first,from.point)<=maxSnapMetres
   &&metresBetween(last,to.point)<=maxSnapMetres;
}


/** A label on a routed polyline follows its travelled distance, not the
 * midpoint between endpoints. Coordinates remain presentation-only. */
export function pointAlongRoute(points=[],fraction=.5){
  if(!Array.isArray(points)||points.length<2||!points.every(validPoint))return null;
  const lengths=points.slice(1).map((p,i)=>metresBetween(points[i],p));
  const total=lengths.reduce((sum,n)=>sum+n,0);
  if(!Number.isFinite(total))return null;
  if(total===0)return [...points[0]];
  let left=total*Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:.5));
  for(let i=0;i<lengths.length;i++){
    if(left>lengths[i]){left-=lengths[i];continue;}
    const a=points[i],b=points[i+1],t=lengths[i]?left/lengths[i]:0;
    return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  }
  return [...points.at(-1)];
}

/** Geographic forward bearing (clockwise from north), attached to a
 * measured route section. Draw only on actual long-enough footpaths. */
export function routeDirectionAt(points=[],fraction=.73,minMetres=150){
 if(!Array.isArray(points)||points.length<2||!points.every(validPoint))return null;
 const lengths=points.slice(1).map((p,i)=>metresBetween(points[i],p));
 const total=lengths.reduce((sum,n)=>sum+n,0);
 if(!Number.isFinite(total)||total<minMetres)return null;
 let left=total*Math.min(1,Math.max(0,Number.isFinite(fraction)?fraction:.73));
 for(let i=0;i<lengths.length;i++){
  const len=lengths[i];
  if(len<=0)continue;
  if(left>len&&i<lengths.length-1){left-=len;continue;}
  const a=points[i],b=points[i+1],t=Math.min(1,Math.max(0,left/len));
  const rad=Math.PI/180;
  const dLon=(b[1]-a[1])*rad,lat1=a[0]*rad,lat2=b[0]*rad;
  const y=Math.sin(dLon)*Math.cos(lat2);
  const x=Math.cos(lat1)*Math.sin(lat2)-
    Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  const bearing=(Math.atan2(y,x)*180/Math.PI+360)%360;
  if(!Number.isFinite(bearing))return null;
  return {point:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],
    bearing,metres:total};
 }
 return null;
}

export function routeStudioModel(items = [], routes = [], current = 0) {
  const stops = Array.isArray(items) ? items : [];
  const checkedRoutes = Array.isArray(routes) ? routes : [];
  const legs = stops.slice(1).map((to, index) => {
    const from = stops[index];
    const walk = checkedRoutes[index];
    const sameCity = Boolean(from?.city && from.city === to?.city);
    const real = sameCity && footpathMatchesStops(from,to,walk)
      && Number.isFinite(walk?.minutes) && walk.minutes >= 0
      && Number.isFinite(walk?.metres) && walk.metres >= 0;
    const stale=Boolean(walk?.walkOnly&&Array.isArray(walk.points)&&!real);
    const canDraw = sameCity && validPoint(from.point) && validPoint(to.point);
    return {
      index, from, to,
      verified: Boolean(real),
      staleGeometry:stale,
      pointType: real ? 'calculated_footpath' : canDraw ? 'schematic_straight_line' : 'no_coordinates',
      points: real ? walk.points : canDraw ? [from.point, to.point] : [],
      minutes: real ? walk.minutes : null,
      metres: real ? walk.metres : null,
    };
  });
  const index = stops.length ? Math.max(0, Math.min(stops.length - 1, Number.isInteger(current) ? current : 0)) : 0;
  const verified = legs.filter(leg => leg.verified);
  const positionQuality=routePositionQuality(stops);
  return {
    stops, legs, selectedIndex: index,positionQuality,
    activeLeg: legs.length ? Math.min(Math.max(0, index - 1), legs.length - 1) : -1,
    verifiedCount: verified.length,
    staleGeometryCount:legs.filter(leg=>leg.staleGeometry).length,
    unknownCount: legs.length - verified.length,
    knownMinutes: verified.reduce((sum, leg) => sum + leg.minutes, 0),
    knownMetres: verified.reduce((sum, leg) => sum + leg.metres, 0),
    complete: legs.length > 0 && verified.length === legs.length,
  };
}

export function routeStudioSummary(model) {
  if (!model?.stops?.length) return 'Füge Reiseorte zur Tagesroute hinzu.';
  if (model.stops.length === 1) return 'Ein Stopp gewählt. Mindestens zwei Stopps für eine Route auswählen.';
  const count = model.legs.length;
  const geometry=model.complete
    ? 'Alle ' + count + ' Fußetappen anhand echter Weggeometrie berechnet.'
    : model.verifiedCount + ' von ' + count + ' Fußetappen berechnet. '
      + model.unknownCount + (model.unknownCount===1?' Verbindung':' Verbindungen')
      + ' als gestrichelte Luftlinie ohne Gehzeit.';
  return geometry+(model.positionQuality?.reviewCount
    ? ' Achtung: '+model.positionQuality.reviewCount+' von '+model.stops.length
      +' Stopp-Positionen prüfen.'
    : ' Quellenpunkte vorhanden; Zugänge separat prüfen.');
}
