import {uploadedPlaceCity} from './uploaded-places-v50.mjs';

const fold=v=>String(v??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const https=v=>{try{
 const u=new URL(v);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false}};
const fields=['summary','address','opening','price','requirements','check2027'];
const kindSet=new Set(['municipality','operator','park','tourism']);
const conflictSet=new Set(['branch_identity_mismatch','published_hours_disagreement',
 'address_conflict','venue_identity_conflict']);
/** Adds checked visitor references only to existing V50 places.
 * Conflicting hours or identities are NOT silently resolved. Search aliases
 * are NOT exact pins or a Google Place ID. Bookings and coordinates untouched.
 */
export function applyLastCityGapsV79(trips,cities,uploads,archive){
 if(archive?.meta?.package!=='research-v79-last-city-gaps'
   ||archive.meta.checkedOn!=='2026-11-17'
   ||archive.meta.entries!==archive.entries?.length
   ||archive.meta.conflicts!==archive.conflicts?.length
   ||archive.entries.length!==7||archive.conflicts.length!==4)
  throw Error('V79 malformed archive');
 const originals=new Map((uploads?.new_entries??[]).map(x=>[x.id,x]));
 const byId=new Map(),byName=new Map(),issuesById=new Map(),issuesByName=new Map();
 for(const e of archive.entries){
  const orig=originals.get(e.id),city=uploadedPlaceCity(orig?.city);
  if(!orig||city!==e.city||!kindSet.has(e.kind)||byId.has(e.id)
    ||!https(e.sourceUrl)||e.checkedOn!==archive.meta.checkedOn
    ||e.live2027AvailabilityConfirmed!==false||e.realBookingConfirmed!==false
    ||e.photoReusePermissionConfirmed!==false
    ||typeof e.publishedOpeningReference!=='boolean'
    ||fields.some(k=>typeof e[k]!=='string'||e[k].length<12))throw Error('V79 invalid entry '+e?.id);
  byId.set(e.id,e);byName.set(city+'|'+fold(orig.name),e);
 }
 for(const c of archive.conflicts){
  const orig=originals.get(c.id),city=uploadedPlaceCity(orig?.city);
  if(!orig||city!==c.city||!conflictSet.has(c.type)||issuesById.has(c.id)
    ||!https(c.sourceUrl)||c.issue.length<35||c.action.length<30
    ||typeof c.mapsQuery!=='string'||c.mapsQuery.length<12||c.mapsQuery.length>160
    ||typeof c.mapsHint!=='string'||c.mapsHint.length<12
    ||/[\n\r<>]/.test(c.mapsQuery))throw Error('V79 invalid conflict '+c?.id);
  issuesById.set(c.id,c);issuesByName.set(city+'|'+fold(orig.name),c);
 }
 let attached=0,flagged=0;
 const attachedIds=new Set(),flaggedIds=new Set();
 for(const trip of trips){
  for(const item of trip.items){
   if(item.removed||item.duplicateOf||item.kind==='transport'||!item.name)continue;
   const id=item.researchV50?.uploadedId
     ??(item.id?.startsWith('uploaded:v50:')?item.id.slice('uploaded:v50:'.length):null);
   const key=item.city+'|'+fold(item.name);
   const data=(id?byId.get(id):null)??byName.get(key);
   const conflict=(id?issuesById.get(id):null)??issuesByName.get(key);
   if(data){
    item.lastCityGuideV79={
      checkedOn:archive.meta.checkedOn,sourceUrl:data.sourceUrl,
      sourceId:'city-v79:'+data.id,sourceType:data.kind,
      summary:data.summary,address:data.address,
      opening:data.opening,price:data.price,
      requirements:data.requirements,check2027:data.check2027,
      publishedOpeningReference:data.publishedOpeningReference,
      actualOpenOnTripDate:false,livePriceConfirmed:false,
      bookingConfirmed:false,photoReusePermissionConfirmed:false
    };
    if(!Array.isArray(item.source))item.source=[];
    if(!item.source.includes('city-v79:'+data.id))item.source.push('city-v79:'+data.id);
    attached++;attachedIds.add(data.id);
   }
   if(conflict){
    item.sourceConflictV79={
      checkedOn:archive.meta.checkedOn,type:conflict.type,
      issue:conflict.issue,action:conflict.action,
      otherSourceUrl:conflict.sourceUrl,identityConfirmed:false
    };
    item.mapsSearchV79={
      query:conflict.mapsQuery,hint:conflict.mapsHint,
      verifiedGooglePlaceId:null,confirmedPin:false
    };
    flagged++;flaggedIds.add(conflict.id);
   }
  }
 }
 const missing=[...byId.keys()].filter(k=>!attachedIds.has(k));
 const misses=[...issuesById.keys()].filter(k=>!flaggedIds.has(k));
 if(missing.length||misses.length)
  throw Error('V79 unmatched entries '+[...missing,...misses].join(','));
 return {uniqueEnriched:attachedIds.size,enrichedAcrossVariants:attached,
  uniqueConflicts:flaggedIds.size,flaggedAcrossVariants:flagged,
  missingEntries:missing,missingConflicts:misses,
  modifiedItineraries:0,liveBookings:0};
}
