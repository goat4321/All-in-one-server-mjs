import {uploadedPlaceCity} from './uploaded-places-v50.mjs';

const norm=x=>String(x??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const validUrl=x=>{try{
 const u=new URL(x);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false}};
const required=['focus','access','opening','cost','caution','check2027'];

/** Enrich EXISTING entries only. Even when a public visitor reference matches
 * a place, 2027 booking/prices/times and exact pin are never certified.
 * Regional fallback is orientation only and NEVER a venue or lodging source.
 */
export function applyCityGuidesV76(trips,cities,upload,archive){
 if(archive?.meta?.package!=='research-v76-city-details'
   ||archive.meta.checkedOn!=='2026-11-17'
   ||!Array.isArray(archive.meta.focusCities)
   ||!Array.isArray(archive.entries)
   ||archive.entries.length!==archive.meta.entryCount
   ||archive.entries.length<20
   ||!archive.regions||typeof archive.regions!=='object')
  throw new Error('V76 invalid city-guide archive');
 const allUploads=new Map((upload?.new_entries??[]).map(x=>[x.id,x]));
 const matchedByKey=new Map(),seenIds=new Set();
 for(const e of archive.entries){
  const src=allUploads.get(e.id),city=src?uploadedPlaceCity(src.city):null;
  if(!src||city!==e.city||!archive.meta.focusCities.includes(e.city)
    ||seenIds.has(e.id)||!validUrl(e.sourceUrl)
    ||required.some(k=>typeof e[k]!=='string'||e[k].length<8)
    ||e.priceVerifiedFor2027!==false||e.actualOpenOnTripDate!==false)
   throw new Error('V76 invalid evidence for '+e?.id);
  seenIds.add(e.id);
  matchedByKey.set(e.city+'|'+norm(src.name),e);
 }
 for(const city of archive.meta.focusCities){
  const r=archive.regions[city];
  if(!cities[city]||!r||!validUrl(r.sourceUrl)
    ||['summary','arrival','weather','check2027'].some(k=>typeof r[k]!=='string'||r[k].length<12))
   throw new Error('V76 invalid fallback for '+city);
 }
 let covered=0,specific=0,regional=0;
 const perTrip={},ruleMatches=new Set();
 for(const trip of trips){
  const count={total:0,specific:0,regional:0,byCity:{}};
  for(const item of trip.items){
   if(!archive.meta.focusCities.includes(item.city)
     ||item.kind==='transport'||item.removed||item.duplicateOf
     ||!item.name)continue;
   const region=archive.regions[item.city];
   const v50Id=item.researchV50?.uploadedId
     ??(item.id?.startsWith('uploaded:v50:')?item.id.slice('uploaded:v50:'.length):null);
   const keyed=matchedByKey.get(item.city+'|'+norm(item.name));
   const selected=(v50Id?archive.entries.find(e=>e.id===v50Id):null)??keyed??null;
   const source=selected??region,scope=selected?'object':'region';
   item.cityGuideV76={
    checkedOn:archive.meta.checkedOn,
    scope,sourceId:scope==='object'?'city-v76:'+selected.id:'city-region-v76:'+item.city,
    sourceUrl:source.sourceUrl,
    referenceLabel:scope==='object'?'Offizielle Orts-/Betreiberseite':
       'Nur offizielle Stadtinformation, keine Quelle für dieses konkrete Angebot',
    focus:selected?.focus??region.summary,
    access:selected?.access??region.arrival,
    opening:selected?.opening??'Für diesen konkreten Ort liegt keine individuell geprüfte Öffnungszeit vor.',
    cost:selected?.cost??'Kein individueller Eintrittspreis oder Gruppenpreis aus regionalen Informationen ableitbar.',
    caution:selected?.caution??region.weather,
    check2027:selected?.check2027??region.check2027,
    directSourceConfirmed:Boolean(selected),
    currentGoogleDataImported:false,
    bookingConfirmed:false,
    priceVerifiedFor2027:false,
    actualOpenOnTripDate:false,
   };
   if(selected){
    ruleMatches.add(selected.id);
    // Exactly scoped evidence can enter the catalog source list. Regional
    // pages must NOT be attached as proof about hotels/restaurants.
    if(!Array.isArray(item.source))item.source=[];
    const key='city-v76:'+selected.id;
    if(!item.source.includes(key))item.source.push(key);
    specific++;count.specific++;
   }else{regional++;count.regional++;}
   covered++;count.total++;
   count.byCity[item.city]=(count.byCity[item.city]??0)+1;
  }
  perTrip[trip.id]=count;
 }
 return {covered,specific,regional,sourceRules:archive.entries.length,
  matchedRules:ruleMatches.size,missingRules:archive.entries.filter(x=>!ruleMatches.has(x.id)).map(x=>x.id),
  byTrip:perTrip};
}
