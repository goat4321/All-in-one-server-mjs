import {uploadedPlaceCity} from './uploaded-places-v50.mjs';

const fold=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de')
 .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const validUrl=url=>{try{
 const u=new URL(url);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false;}};
const allowedStatus=new Set(['check_date','closed_reopening_unknown','event_date_unconfirmed']);
const details=['summary','address','opening','price','conditions'];
/** Adds source-backed visitor notes only to already-imported objects.
 * Reuse of a mapped search query never verifies coordinates or 2027 opening.
 * A grouped day trip points to ONE clearly labeled start/anchor, not a fake
 * single place for the entire tour. The dataset never replaces user choices.
 */
export function applyOfficialVenuesV77(trips,cities,uploads,archive){
 if(archive?.meta?.package!=='research-v77-official-venues'
   ||archive.meta.checkedOn!=='2026-11-17'
   ||archive.meta.total!==archive.entries?.length
   ||archive.entries.length<15||!Array.isArray(archive.mapOverrides))
   throw new Error('V77 invalid official venues archive');
 const originals=new Map(uploads.new_entries.map(e=>[e.id,e]));
 const seen=new Set(),byName=new Map(),byId=new Map(),mapsByName=new Map(),mapsById=new Map();
 for(const entry of archive.entries){
  const orig=originals.get(entry.id);
  if(!orig||seen.has(entry.id)||entry.city!==uploadedPlaceCity(orig.city)
    ||!validUrl(entry.sourceUrl)||!allowedStatus.has(entry.status)
    ||details.some(field=>typeof entry[field]!=='string'||entry[field].trim().length<10)
    ||entry.liveAvailabilityConfirmed!==false
    ||entry.priceForSeptember2027Confirmed!==false
    ||entry.bookingConfirmed!==false)throw Error('V77 invalid venue '+entry.id);
  seen.add(entry.id);byId.set(entry.id,entry);byName.set(entry.city+'|'+fold(orig.name),entry);
 }
 for(const ov of archive.mapOverrides){
  const orig=originals.get(ov.id),city=orig?uploadedPlaceCity(orig.city):null;
  if(!city||mapsById.has(ov.id)
    ||typeof ov.query!=='string'||ov.query.length<12||ov.query.length>200
    ||/[\n\r<>]/.test(ov.query)
    ||typeof ov.hint!=='string'||ov.hint.length<12)
    throw Error('V77 invalid Maps query '+ov.id);
  mapsById.set(ov.id,ov);mapsByName.set(city+'|'+fold(orig.name),ov);
 }
 let attached=0,mapOverrides=0,perTrip={},matched=new Set(),mapped=new Set();
 for(const trip of trips){
  const counts={specific:0,maps:0,closures:0};
  for(const item of trip.items){
   if(item.removed||item.duplicateOf||!item.name||item.kind==='transport')continue;
   const id=item.researchV50?.uploadedId
    ??(item.id?.startsWith('uploaded:v50:')?item.id.slice('uploaded:v50:'.length):null);
   const key=item.city+'|'+fold(item.name);
   const venue=(id?byId.get(id):null)??byName.get(key);
   const map=(id?mapsById.get(id):null)??mapsByName.get(key);
   if(venue){
    item.officialVenueV77={
     checkedOn:archive.meta.checkedOn,sourceId:'venue-v77:'+venue.id,
     sourceUrl:venue.sourceUrl,
     summary:venue.summary,address:venue.address,opening:venue.opening,
     price:venue.price,conditions:venue.conditions,status:venue.status,
     actualOpeningForSept2027Verified:false,actualAdmissionForSept2027Verified:false,
     noAutomaticBudget:true};
    if(!Array.isArray(item.source))item.source=[];
    if(!item.source.includes('venue-v77:'+venue.id))item.source.push('venue-v77:'+venue.id);
    attached++;counts.specific++;matched.add(venue.id);
    if(venue.status==='closed_reopening_unknown')counts.closures++;
   }
   if(map){
    item.mapsSearchV77={query:map.query,hint:map.hint,
     sourceScope:'place_search_not_verified_pin',verifiedPlaceId:null};
    mapped.add(map.id);mapOverrides++;counts.maps++;
   }else if(venue){
    // Named, publicly sourced venue address is useful for Google SEARCH,
    // not for publishing a supposedly verified POI coordinate.
    item.mapsSearchV77={query:[item.name,venue.address].join(', '),
     hint:'Öffentliche Betreiberadresse; Google-Ergebnis und Eingang kontrollieren',
     sourceScope:'place_search_not_verified_pin',verifiedPlaceId:null};
    mapOverrides++;counts.maps++;
   }
  }
  perTrip[trip.id]=counts;
 }
 return {attachedAcrossVariants:attached,uniqueMatched:matched.size,
  unmatchedVenueIds:archive.entries.filter(e=>!matched.has(e.id)).map(e=>e.id),
  explicitMapOverrides:archive.mapOverrides.length,
  uniqueExplicitMapIds:mapped.size,searchesAcrossVariants:mapOverrides,perTrip};
}
