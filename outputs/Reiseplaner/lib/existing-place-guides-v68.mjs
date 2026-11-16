import {uploadedPlaceCity,uploadedPlaceType} from './uploaded-places-v50.mjs';

const fold=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const validHttps=value=>{try{
 const url=new URL(value);
 return url.protocol==='https:'&&url.hostname.includes('.')
   &&!url.username&&!url.password;
}catch{return false;}};
const requiredText=value=>typeof value==='string'&&value.trim().length>=12;

/** Adds public-source visitor notes to EXISTING items, including V50 duplicates.
 * Never creates places, prices, tickets, private lodging points or schedules. */
export function applyExistingPlaceGuidesV68(trips,cities,uploadedArchive,guideArchive){
 const rows=guideArchive?.entries;
 if(guideArchive?.meta?.package!=='research-v68-existing-place-guides'
  ||guideArchive?.meta?.checkedOn!=='2026-11-16'
  ||guideArchive?.meta?.totalEntries!==37
  ||!Array.isArray(rows)||rows.length!==37
  ||new Set(rows.map(r=>r.id)).size!==37)
  throw new Error('V68: expected 37 distinct existing-place guides');
 const original=new Map(uploadedArchive?.new_entries?.map(e=>[e.id,e])??[]);
 for(const row of rows){
  const src=original.get(row.id),g=row.visitorGuide;
  if(!src||!cities[uploadedPlaceCity(src.city)]
    ||uploadedPlaceType(src)==='lodging'
    ||!g||!Array.isArray(g.highlights)||g.highlights.length<2
    ||g.highlights.some(s=>!requiredText(s))
    ||['visitTip','combineWith','arrivalTip','check2027'].some(k=>!requiredText(g[k]))
    ||(row.sourceUrl&&!validHttps(row.sourceUrl)))
   throw new Error('V68: invalid place guide or source: '+row.id);
 }
 let enriched=0,sourceLinks=0;const seen=new Set(),missing=[];
 const byId=new Map(rows.map(row=>[row.id,row]));
 for(const trip of trips){
  const index=new Map(trip.items.filter(item=>item.name&&!item.removed&&!item.duplicateOf)
    .map(item=>[item.city+'|'+fold(item.name),item]));
  for(const [uploadedId,row] of byId){
   const source=original.get(uploadedId),city=uploadedPlaceCity(source.city);
   if(!trip.route.includes(city))continue;
   const item=trip.items.find(item=>item.id==='uploaded:v50:'+uploadedId)
    ??index.get(city+'|'+fold(source.name));
   if(!item){missing.push(trip.id+':'+uploadedId);continue;}
   if(item.kind==='lodging')throw new Error('V68: unexpected private lodging: '+uploadedId);
   if(item.publicPlaceGuideV68)continue;
   const currentProvider=item.website;
   const officialLink=row.sourceUrl??null;
   item.publicPlaceGuideV68={
    checkedOn:guideArchive.meta.checkedOn,uploadedId,
    sourceUrl:officialLink??null,
    sourceStatus:officialLink?'independently_reviewed_public_venue_link'
      :'previously_imported_provider_note_or_pending_operator_link',
    visitorGuide:{...row.visitorGuide,highlights:[...row.visitorGuide.highlights]},
    september2027TicketConfirmed:false,
    september2027OpeningConfirmed:false,
    note:'Keine Änderung an Auswahl, Budget, Buchung, Koordinate oder 2027er Tagesöffnung.'
   };
   if(officialLink){
    item.website=currentProvider??officialLink;
    if(!Array.isArray(item.source))item.source=[];
    const sourceId='guide-v68:'+uploadedId;
    if(!item.source.includes(sourceId))item.source.push(sourceId);
    sourceLinks++;
   }
   seen.add(uploadedId);enriched++;
  }
 }
 return {sourceCandidates:rows.length,uniqueEnriched:seen.size,
  enrichedAcrossVariants:enriched,linkedAcrossVariants:sourceLinks,
  missingAcrossVariants:missing};
}
