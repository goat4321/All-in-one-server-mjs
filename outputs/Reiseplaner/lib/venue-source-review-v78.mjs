import {uploadedPlaceCity} from './uploaded-places-v50.mjs';

const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const https=value=>{try{
 const u=new URL(value);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false;}};
const fields=['title','arrival','hours','price','caution','notes'];
const sourceTypes=new Set(['operator','tourism','editorial']);
const conflictTypes=new Set(['address_conflict','identity_conflict']);

/** References are descriptive evidence, never an accepted 2027 offer.
 * Conflicted entities are intentionally NOT attributed the competing business's
 * source, address, opening hours or coordinates. */
export function applyVenueSourceReviewV78(trips,cities,uploads,archive){
 if(archive?.meta?.package!=='research-v78-venue-source-review'
  ||archive.meta.checkedOn!=='2026-11-17'
  ||archive.meta.entries!==archive.entries?.length
  ||archive.meta.reviews!==archive.reviews?.length
  ||archive.entries.length<10||archive.reviews.length<2)
  throw Error('V78 invalid source review archive');
 const original=new Map(uploads.new_entries.map(x=>[x.id,x]));
 const byId=new Map(),byName=new Map(),byReviewId=new Map(),reviewByName=new Map();
 for(const e of archive.entries){
  const x=original.get(e.id),city=x?uploadedPlaceCity(x.city):null;
  if(!x||city!==e.city||byId.has(e.id)||!sourceTypes.has(e.sourceType)
    ||!https(e.sourceUrl)||e.validForSept2027!==false||e.bookable2027!==false
    ||typeof e.publishedOpeningReference!=='boolean'
    ||(e.publishedOpeningReference&&e.sourceType!=='operator')
    ||fields.some(field=>typeof e[field]!=='string'||e[field].length<12))
   throw Error('V78 invalid venue row '+e?.id);
  byId.set(e.id,e);byName.set(city+'|'+fold(x.name),e);
 }
 for(const r of archive.reviews){
  const x=original.get(r.id),city=x?uploadedPlaceCity(x.city):null;
  if(!x||city!==r.city||byReviewId.has(r.id)||byId.has(r.id)
   ||!conflictTypes.has(r.status)||!https(r.evidenceUrl)
   ||r.issue.length<30||r.action.length<25)
   throw Error('V78 invalid conflict '+r?.id);
  byReviewId.set(r.id,r);reviewByName.set(city+'|'+fold(x.name),r);
 }
 let enriched=0,flagged=0;const unique=new Set(),conflicts=new Set();
 for(const trip of trips){
  for(const item of trip.items){
   if(item.removed||item.duplicateOf||item.kind==='transport'||!item.name)continue;
   const id=item.researchV50?.uploadedId
    ??(item.id?.startsWith('uploaded:v50:')?item.id.slice('uploaded:v50:'.length):null);
   const key=item.city+'|'+fold(item.name);
   const data=(id?byId.get(id):null)??byName.get(key);
   const conflict=(id?byReviewId.get(id):null)??reviewByName.get(key);
   if(data){
    item.venueSourceV78={
     checkedOn:archive.meta.checkedOn,
     sourceUrl:data.sourceUrl,sourceId:'venue-v78:'+data.id,
     sourceType:data.sourceType,
     title:data.title,arrival:data.arrival,hours:data.hours,
     price:data.price,caution:data.caution,notes:data.notes,
     individualTrip2027Offer:false,confirmedCheckout:false,
     publishedReferenceOnly:true,
     publishedOpeningReference:data.publishedOpeningReference
    };
    if(!Array.isArray(item.source))item.source=[];
    if(!item.source.includes('venue-v78:'+data.id))item.source.push('venue-v78:'+data.id);
    enriched++;unique.add(data.id);
   }
   if(conflict){
    item.venueIdentityReviewV78={
     checkedOn:archive.meta.checkedOn,
     status:conflict.status,issue:conflict.issue,
     nextAction:conflict.action,evidenceUrl:conflict.evidenceUrl,
     matchesImportedIdentity:false,
     explicitlyNotVenueSource:true
    };
    flagged++;conflicts.add(conflict.id);
   }
  }
 }
 const missingEntries=archive.entries.filter(e=>!unique.has(e.id)).map(e=>e.id);
 const missingReviews=archive.reviews.filter(e=>!conflicts.has(e.id)).map(e=>e.id);
 if(missingEntries.length||missingReviews.length)
   throw Error('V78 could not match '+[...missingEntries,...missingReviews].join(','));
 return {enrichedAcrossVariants:enriched,flaggedAcrossVariants:flagged,
  uniqueEnriched:unique.size,uniqueConflicts:conflicts.size,
  missedEntries:missingEntries,missedReviews:missingReviews,
  live2027Offers:0,modifiedBookings:0};
}
