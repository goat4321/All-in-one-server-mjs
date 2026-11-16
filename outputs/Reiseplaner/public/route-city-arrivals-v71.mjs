// City-arrival scenes draw ideas from the user's actual Reiseplaner records.
// The floating emoji ring is illustrative, NEVER a position of any venue.
export const ARRIVAL_TYPES=Object.freeze({
 activity:{label:'Aktivität',symbol:'🎟️'},
 food:{label:'Essen & Trinken',symbol:'🍽️'},
 nature:{label:'Natur & Aussicht',symbol:'🌿'},
 nightlife:{label:'Abends ausgehen',symbol:'🎶'},
 lodging:{label:'Unterkunft',symbol:'🏠'},
 shop:{label:'Einkaufen',symbol:'🛍️'},
});
const canonical=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const usable=item=>item&&typeof item==='object'
 &&typeof item.id==='string'&&item.id.length>0
 &&typeof item.name==='string'&&item.name.trim().length>1
 &&typeof item.city==='string'&&item.city.length>0
 &&!item.removed&&!item.duplicateOf&&!item.readOnlyExternal
 &&!item.explorerParent&&!item.isCityReference
 &&!['transport','placeholder'].includes(item.kind)
 &&!item.isSynthetic&&item.kind!=='transit'
 &&!item.kind?.includes('reference');
export function arrivalType(item){
 const full=canonical([item.name,item.category,...(Array.isArray(item.tags)?item.tags:[])].join(' '));
 if(item.kind==='lodging')return 'lodging';
 if(item.kind==='shop'||/supermarkt|grocery|supermerc|einkauf|boutique|market hall/.test(full))return 'shop';
 if(/nachtclub|nightclub|nightlife|discoteca|disco |clubabend|party|festival|cocktailbar|rooftop bar/.test(full))return 'nightlife';
 if(item.category==='food'||item.kind==='food'
   ||/restaurant|trattoria|osteria|tapas|pizzeria|bistro|cafe|coffee|brunch|bäckerei|bakery/.test(full))return 'food';
 if(/\bpark\b|jardin|giardino|strand|beach|plage|seealp|oeschinen|lake|natur|mountain|berg|gletsch|schlucht|wald|wander|aussicht|viewpoint|panorama|garten/.test(full))return 'nature';
 if(item.category==='shop')return 'shop';
 return 'activity';
}
const safeEntries=items=>Array.isArray(items)?items:[];

/** Return a small, diverse, deterministic sample, never making up city POIs.
 * Selection is indicated only when an existing active IDs set contains it.
 * Names are copied from the underlying catalog, and no coordinates, times,
 * booking or price are copied or guessed.
 */
export function buildCityArrivalScenes(stops,items=[],activeIds=new Set(),limit=5){
 const ids=activeIds instanceof Set?activeIds:new Set(activeIds??[]);
 const max=Math.max(0,Math.min(5,Math.floor(Number(limit)||0)));
 const candidates=safeEntries(items).filter(usable);
 const cities=new Map();
 for(const item of candidates){
  const type=arrivalType(item);
  const bucket=cities.get(item.city)??[];
  bucket.push({id:item.id,city:item.city,name:item.name.trim(),type,
   symbol:ARRIVAL_TYPES[type].symbol,label:ARRIVAL_TYPES[type].label,
   planned:ids.has(item.id),note:ids.has(item.id)?'Im Plan':'Idee · prüfen'});
  cities.set(item.city,bucket);
 }
 return safeEntries(stops).map(stop=>{
  const all=cities.get(stop.id)??[];
  const seenIds=new Set(),seenNames=new Set();
  const unique=all.filter(item=>{
   const nameKey=item.city+':'+canonical(item.name);
   if(seenIds.has(item.id)||seenNames.has(nameKey))return false;
   seenIds.add(item.id);seenNames.add(nameKey);return true;
  });
  const categoryOrder=['activity','food','nature','nightlife','lodging','shop'];
  const order=(a,b)=>Number(b.planned)-Number(a.planned)
   ||a.name.localeCompare(b.name,'de');
  const categories=new Map(categoryOrder.map(cat=>[cat,unique.filter(x=>x.type===cat).sort(order)]));
  const highlights=[];
  for(const cat of categoryOrder){
   const item=categories.get(cat)?.shift();
   if(item&&highlights.length<max)highlights.push(item);
  }
  // Fill remaining slots with diverse, actually recorded secondary options.
  const rest=[...categories.values()].flat().sort(order);
  for(const item of rest)if(highlights.length<max)highlights.push(item);
  const plannedCount=unique.filter(item=>item.planned).length;
  return {...stop,ideas:highlights,
   placesKnown:unique.length,plannedCount,ideaCount:unique.length-plannedCount,
   labels:categoryOrder.filter(cat=>unique.some(item=>item.type===cat))
    .map(cat=>ARRIVAL_TYPES[cat].label)};
 });
}
