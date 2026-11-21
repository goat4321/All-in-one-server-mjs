import {uploadedPlaceCity} from './uploaded-places-v50.mjs';

const fold=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim();
const validHttps=value=>{try{
 const u=new URL(value);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false;}};
const legalStatuses=new Set(['corner_addresses_correlated',
 'original_identity_unconfirmed_with_sourced_alternatives']);
const safeText=value=>typeof value==='string'&&value.length>=12
 &&value.length<=800&&!/[<>]/.test(value);
/** A research-side choice list. Alternatives are independent venues, NOT an
 * overwrite of a user-supplied, unresolved import. Never create fake pins,
 * prices, room checkouts or automatic substitutions.
 */
export function applyAlternativeVenuesV80(trips,cities,uploads,archive){
 if(archive?.meta?.package!=='research-v80-alternative-venues'
  ||archive.meta.checkedOn!=='2026-11-17'
  ||archive.meta.count!==archive.dossiers?.length
  ||archive.meta.alternativeCount!==7
  ||archive.dossiers?.length!==3)
  throw Error('V80 malformed archive');
 const imported=new Map((uploads?.new_entries??[]).map(x=>[x.id,x]));
 const byId=new Map(),byName=new Map(),alternativeIds=new Set();
 for(const d of archive.dossiers){
  const record=imported.get(d.id),city=uploadedPlaceCity(record?.city);
  if(!record||city!==d.city||byId.has(d.id)
    ||!legalStatuses.has(d.status)
    ||!safeText(d.evidenceSummary)||!safeText(d.caveat)
    ||!safeText(d.mapQuery)||!safeText(d.mapHint)
    ||d.originalIdentityConfirmed!==false||d.verifiedExactEntrance!==false
    ||!Array.isArray(d.sourceUrls)||!d.sourceUrls.length
    ||d.sourceUrls.some(u=>!validHttps(u))
    ||!Array.isArray(d.alternatives))
    throw Error('V80 invalid dossier '+d?.id);
  for(const a of d.alternatives){
   if(!a.key||alternativeIds.has(a.key)
      ||typeof a.name!=='string'||a.name.trim().length<3
      ||!safeText(a.address)||!safeText(a.summary)
      ||!safeText(a.hours)||!safeText(a.price)
      ||!validHttps(a.officialUrl)
      ||!['operator','official_tourism'].includes(a.sourceType)
      ||a.pinVerified!==false||a.notAutomaticallyPlanned!==true)
    throw Error('V80 invalid alternative '+a?.key);
   alternativeIds.add(a.key);
  }
  if(d.status==='corner_addresses_correlated'&&d.alternatives.length)
    throw Error('V80 resolved corner cannot have substitute venues');
  if(d.contextPhotos!=null){
   if(!Array.isArray(d.contextPhotos)||d.contextPhotos.length>3
     ||d.contextPhotos.some(p=>!p.file||p.file.length<10
       ||!validHttps(p.sourceUrl)||!p.sourceUrl.includes('commons.wikimedia.org/wiki/File:')
       ||!validHttps(p.licenseUrl)||!p.licenseUrl.includes('creativecommons.org/licenses/')
       ||!['market_context_not_venue','city_food_context_not_venue'].includes(p.scope)
       ||!safeText(p.description)||!p.author
       ||!['CC BY 2.0','CC BY 3.0'].includes(p.license)
       ||!Number.isInteger(p.picturedYear)||p.picturedYear>2026))
      throw Error('V80 unsafe contextual photo '+d.id);
  }
  byId.set(d.id,d);byName.set(city+'|'+fold(record.name),d);
 }
 if(alternativeIds.size!==archive.meta.alternativeCount)
   throw Error('V80 missing alternatives');
 let attached=0,choices=0,matched=new Set();
 const contextCount=archive.dossiers.reduce((n,d)=>n+(d.contextPhotos?.length??0),0);
 for(const trip of trips){
  for(const item of trip.items){
   if(item.removed||item.duplicateOf||!item.name||item.kind==='transport')continue;
   const id=item.researchV50?.uploadedId
    ??(item.id?.startsWith('uploaded:v50:')?item.id.slice('uploaded:v50:'.length):null);
   const dossier=(id?byId.get(id):null)??byName.get(item.city+'|'+fold(item.name));
   if(!dossier)continue;
   item.alternativeVenueReviewV80={
    checkedOn:archive.meta.checkedOn,status:dossier.status,
    evidenceSummary:dossier.evidenceSummary,caveat:dossier.caveat,
    evidenceLinks:[...dossier.sourceUrls],
    mapQuery:dossier.mapQuery,mapHint:dossier.mapHint,
    originalIdentityConfirmed:false,verifiedExactEntrance:false,
    contextPhotos:(dossier.contextPhotos??[]).map(p=>({
      url:'https://commons.wikimedia.org/wiki/Special:FilePath/'
       +encodeURIComponent(p.file)+'?width=960',
      sourceUrl:p.sourceUrl,licenseUrl:p.licenseUrl,
      author:p.author,license:p.license,
      description:p.description,scope:p.scope,
      picturedYear:p.picturedYear,processed:p.processed
    })),
    alternatives:dossier.alternatives.map(a=>({
     key:a.key,name:a.name,address:a.address,category:a.category,
     sourceType:a.sourceType,officialUrl:a.officialUrl,
     summary:a.summary,hours:a.hours,price:a.price,
     mapQuery:a.name+', '+a.address,
     pinVerified:false,notAutomaticallyPlanned:true,
     confirmedTripDate2027:false
    }))
   };
   attached++;choices+=dossier.alternatives.length;matched.add(dossier.id);
  }
 }
 const missed=[...byId.keys()].filter(id=>!matched.has(id));
 if(missed.length)throw Error('V80 unmatched '+missed.join(','));
 return {matchedOriginals:matched.size,variantMatches:attached,
  uniqueAlternatives:alternativeIds.size,alternativeCardsAcrossVariants:choices,
  corroboratedCorner:matched.has('new_021')?1:0,
  licensedContextPhotos:contextCount,venuePhotosImpliedByContext:0,
  importedIdentitiesReplaced:0,originalCoordinatesChanged:0,
  selectedSubstitutions:0,bookingsCreated:0};
}
