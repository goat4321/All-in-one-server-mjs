import {footpathMatchesStops} from './route-studio.mjs';
// A story about city-to-city order, NOT a train timetable or routed railway.
// Every map coordinate comes from the existing trip city references.
const motifs=Object.freeze({
  paris:['🗼','Eiffelturm & Seine'],barcelona:['⛪','Sagrada Família'],
  toulouse:['🧱','Rote Backsteinstadt'],narbonne:['🏛️','Historische Altstadt'],
  sete:['⛵','Hafen & Kanäle'],montpellier:['🌿','Plätze & Gassen'],
  marseille:['⛵','Alter Hafen'],nice:['🌊','Promenade am Meer'],
  cannes:['🎬','Filmstadt an der Küste'],genoa:['⚓','Palazzi & Hafen'],
  milan:['⛪','Mailänder Dom'],venice:['🚣','Kanäle & Gondeln'],
  rome:['🏛️','Antikes Rom'],madrid:['☀️','Plätze & Kultur'],
  appenzell:['🏔️','Alpstein & Bergwelt'],wasserauen:['🥾','Alpenwanderungen'],
  kandersteg:['🏞️','Oeschinensee & Berge'],grindelwald:['🏔️','Berner Oberland'],
  glarus:['⛰️','Glarner Alpen'],flims:['🌲','Bergseen'],
  zurich:['🏙️','Altstadt am See'],geneva:['⛲','Genfersee'],
  munich:['🏙️','Start oder Heimkehr'],muenchen:['🏙️','Start oder Heimkehr'],
});
const coordinates=point=>Array.isArray(point)&&point.length===2
  &&point.every(Number.isFinite)&&Math.abs(point[0])<=90&&Math.abs(point[1])<=180
  &&(point[0]!==0||point[1]!==0);
export function storyCityMotif(id){
  const row=motifs[String(id??'').toLowerCase()]??['📍','Etappe deiner Reise'];
  return {symbol:row[0],description:row[1]};
}
export function storyCityStops(trip,cities){
  if(!Array.isArray(trip?.route)||!cities||typeof cities!=='object')return [];
  return trip.route.flatMap((id,index)=>{
    const city=cities[id];
    if(!city||!coordinates(city.point))return [];
    return [{id,index,name:String(city.name??id),point:[...city.point],
      ...storyCityMotif(id)}];
  });
}
export function storyPointBetween(a,b,fraction){
  if(!coordinates(a)||!coordinates(b))return null;
  const f=Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:0));
  return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
}
export function storyProgress(stopIndex,part,stops){
  const count=Array.isArray(stops)?stops.length:Number(stops);
  if(!Number.isInteger(count)||count<2)return count===1?100:0;
  const x=Number.isInteger(stopIndex)?stopIndex:0;
  const segmentFraction=Number.isFinite(part)?part:0;
  return Math.max(0,Math.min(100,100*(x+Math.max(0,Math.min(1,segmentFraction)))/(count-1)));
}

/**
 * Progressively reveal the supplied geometry, never a guessed railway/road.
 * Verified means the existing Route Studio accepted a walked footpath that
 * joins the current source points. City-to-city travel is ALWAYS schematic.
 * The returned path is ONLY a temporary visualization, not an itinerary.
 */
export function storyLegProgress(from,to,leg,fraction=0){
 if(!coordinates(from)||!coordinates(to))return null;
 const t=Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:0));
 const verified=Boolean(leg?.verified===true && Array.isArray(leg.points)
   && footpathMatchesStops({point:from},{point:to},
     {walkOnly:true,points:leg.points}));
 const shape=verified?leg.points:[from,to];
 const segmentMetres=(a,b)=>{
   const rad=Math.PI/180,dp=(b[0]-a[0])*rad,dl=(b[1]-a[1])*rad;
   const h=Math.sin(dp/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)
     *Math.sin(dl/2)**2;
   return 6371000*2*Math.atan2(Math.sqrt(Math.max(0,h)),
     Math.sqrt(Math.max(0,1-h)));
 };
 const lengths=shape.slice(1).map((point,i)=>segmentMetres(shape[i],point));
 const remainingTotal=lengths.reduce((a,b)=>a+b,0);
 if(!Number.isFinite(remainingTotal))return null;
 let remaining=remainingTotal*t;
 const shown=[shape[0]];
 if(remainingTotal===0)return{point:[...from],path:[[...from]],verified};
 for(let i=0;i<lengths.length;i++){
   const len=lengths[i],a=shape[i],b=shape[i+1];
   if(remaining>=len){
     shown.push([...b]);remaining=Math.max(0,remaining-len);
   }else{
     const f=len?remaining/len:0;
     shown.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);
     break;
   }
 }
 return{point:shown.at(-1),path:shown,verified};
}
