/** On-demand public supermarket discovery for the current travel city.
 * Sources are OSM/Overpass, not Google/Apple ratings, and not verified shops.
 * Requires explicit user action; the local server caches for 24 hours.
 */
const API='https://overpass-api.de/api/interpreter';
export const SUPERMARKET_RADIUS=6500;
export const MAX_SUPERMARKETS=160;
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
 &&Math.abs(p[0])<=90&&Math.abs(p[1])<=180&&(p[0]!==0||p[1]!==0);
const clean=s=>String(s??'').trim().slice(0,180);
export function supermarketQuery(point){
 if(!valid(point))throw new Error('Ungültiger Ortsmittelpunkt');
 const [lat,lon]=point;
 return '[out:json][timeout:22];('+
  'node["shop"="supermarket"](around:'+SUPERMARKET_RADIUS+','+lat.toFixed(5)+','+lon.toFixed(5)+');'+
  'way["shop"="supermarket"](around:'+SUPERMARKET_RADIUS+','+lat.toFixed(5)+','+lon.toFixed(5)+');'+
  'relation["shop"="supermarket"](around:'+SUPERMARKET_RADIUS+','+lat.toFixed(5)+','+lon.toFixed(5)+');'+
  ');out center '+MAX_SUPERMARKETS+';';
}
export function normalizeSupermarkets(elements,city){
 const rows=[],ids=new Set();
 for(const element of elements??[]){
  if(!['node','way','relation'].includes(element?.type)
    ||!Number.isSafeInteger(element.id)||element.tags?.shop!=='supermarket')continue;
  const point=element.type==='node'
   ?[element.lat,element.lon]:[element.center?.lat,element.center?.lon];
  if(!valid(point))continue;
  const id='market:osm:'+element.type+':'+element.id;
  if(ids.has(id))continue;ids.add(id);
  const name=clean(element.tags.name||element.tags.brand||'Supermarkt');
  const tags=element.tags;
  const address=[tags['addr:street'],tags['addr:housenumber'],
    tags['addr:postcode'],tags['addr:city']].filter(Boolean).map(clean).join(' ');
  const node=element.type==='node';
  rows.push({
   id,explorerId:id,city,name,kind:'activity',category:'shop',explorerCategory:'shop',
   point,readOnlyExternal:true,selected:false,booked:false,
   address:address||null,price:null,effectivePrice:null,rating:null,
   source:'OpenStreetMap / Overpass',
   sourceUrl:'https://www.openstreetmap.org/'+element.type+'/'+element.id,
   locationReferenceV07:{exactKnown:node,precision:node?'mapped_node':'polygon_centre_not_entrance'},
   geoEvidence:{isCentroid:!node,source:'OSM / Overpass'},
   tags:['Supermarkt','Lebensmittel'],
   verification:'Offene Geodaten · Öffnungszeiten und Betrieb nicht bestätigt',
   detail:(node?'Kartierter Ladenstandort':'Mittelpunkt der kartierten Ladenfläche, nicht der nachgewiesene Eingang')
     +' · Öffnungszeiten und genaue Adresse vor Ort prüfen.',
  });
  if(rows.length>=MAX_SUPERMARKETS)break;
 }
 return rows;
}
export async function fetchSupermarkets(city,point,{fetcher=fetch}={}){
 const url=API+'?data='+encodeURIComponent(supermarketQuery(point));
 let response;
 try{
  response=await fetcher(url,{
   headers:{'User-Agent':'Reiseplaner-Local/1.0 (user-initiated supermarket search)'},
   signal:AbortSignal.timeout(16000),
  });
 }catch{
  throw Object.assign(new Error('Der Supermarktdienst ist zurzeit nicht erreichbar.'),{status:503});
 }
 if(!response.ok)throw Object.assign(new Error('Der Supermarktdienst ist ausgelastet.'),{status:503});
 let payload;
 try{payload=await response.json()}
 catch{throw Object.assign(new Error('Ungültige Antwort des Supermarktdienstes.'),{status:502})}
 const items=normalizeSupermarkets(payload.elements,city);
 return {city,items,count:items.length,cached:false,
  coverageRadiusMeters:SUPERMARKET_RADIUS,resultsLimited:items.length>=MAX_SUPERMARKETS,
  checkedOn:new Date().toISOString().slice(0,10),
  source:'OSM/Overpass · unbestätigte Geodaten',
  note:'Einmalige Abfrage im Radius von 6,5 km um den Ortsmittelpunkt, höchstens 160 Treffer. Keine vollständige Liste aller Stadtgeschäfte. Kartierte Flächenmittelpunkte sind keine bestätigten Eingänge.'};
}
