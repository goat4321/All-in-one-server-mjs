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
