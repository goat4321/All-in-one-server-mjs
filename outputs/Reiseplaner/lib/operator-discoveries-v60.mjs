import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus}
 from '../public/google-maps.mjs';

const normalize=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de')
 .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const secureUrl=value=>{try{
 const u=new URL(value);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false;}};
const publicPoint=row=>Array.isArray(row.point)&&row.point.length===2
 &&row.point.every(Number.isFinite)&&Math.abs(row.point[0])<=90
 &&Math.abs(row.point[1])<=180&&row.point.some(Boolean);

export function applyOperatorDiscoveriesV60(trips,cities,archive){
 const rows=archive?.entries;
 if(archive?.meta?.package!=='research-v60-operator-discoveries'
  ||archive?.meta?.checkedOn!=='2026-11-16'||!Array.isArray(rows)
  ||rows.length!==16||new Set(rows.map(x=>x.id)).size!==16)
  throw new Error('V60 research: expected 16 distinct operator-sourced places.');
 for(const row of rows){
  if(!/^[a-z0-9-]+$/.test(row.id)||!cities[row.city]
   ||!String(row.name??'').trim()||!String(row.description??'').trim()
   ||!String(row.address??'').trim()||!String(row.priceReference??'').trim()
   ||!String(row.openingReference??'').trim()
   ||!['activity','food'].includes(row.category??'activity')
   ||!Number.isInteger(row.durationMinutes)||row.durationMinutes<15
   ||!Array.isArray(row.tags)||!row.tags.length
   ||!secureUrl(row.sourceUrl)
   ||(row.secondarySourceUrl&&!secureUrl(row.secondarySourceUrl))
   ||(row.point&&!publicPoint(row))
   ||(row.point&&(!secureUrl(row.geoSourceUrl)||!row.geoSourceNote)))
   throw new Error('V60 invalid public source, location, fare or hours: '+row.id);
 }
 const unique=new Set(),byCity={},tally={createdAcrossVariants:0,
  duplicateAcrossVariants:0,individuallySourcedAreaPoints:0};
 for(const trip of trips){
  const known=new Set(trip.items.filter(i=>i.name&&!i.removed&&!i.duplicateOf)
   .map(i=>i.city+'|'+normalize(i.name)));
  for(const row of rows){
   if(!trip.route.includes(row.city))continue;
   const key=row.city+'|'+normalize(row.name);
   if(known.has(key)){tally.duplicateAcrossVariants++;continue;}
   const hasPoint=publicPoint(row);
   const item={
    id:'operator:v60:'+row.id,trip:trip.id,city:row.city,
    zone:cities[row.city].timezone,kind:'activity',
    category:row.category??'activity',
    name:row.name,detail:row.description
      +(row.accessCaution?' Anreisehinweis: '+row.accessCaution:''),
    address:row.address,
    tags:[...row.tags,'Quellendaten 2026','Option 2027'],
    point:hasPoint?[...row.point]:null,
    pointPrecision:hasPoint?'sourced_public_area_point_not_entrance'
      :'source_postal_address_no_geocode',
    locationReferenceV07:{precision:hasPoint?'sourced_area_center'
      :'provider_postal_address_without_coordinates',exactKnown:false},
    geoEvidence:hasPoint?{
     source:'Unabhängiger öffentlicher POI-Datensatz',
     confidence:'public_poi_area_reference',
     url:row.geoSourceUrl,isCentroid:true,note:row.geoSourceNote,
    }:null,
    website:row.sourceUrl,source:['operator-v60:'+row.id],
    origin:'Betreiber-/Stadt-/Tourismusrecherche 16.11.2026',
    verification:'Existenz/Referenz überprüft; September 2027 nicht automatisch bestätigt',
    selected:false,booked:false,removed:false,locked:false,
    price:null,start:null,end:null,duration:row.durationMinutes,
    openingHoursNote:row.openingReference,
    discoveryV60:{
     checkedOn:archive.meta.checkedOn,
     sourceUrl:row.sourceUrl,secondarySourceUrl:row.secondarySourceUrl??null,
     priceReference:row.priceReference,priceYear:row.priceYear,
     openingReference:row.openingReference,
     accessCaution:row.accessCaution??null,
     published2027Period:row.published2027Period??null,
     september2027TicketConfirmed:false,
     september2027OpeningConfirmed:false,
     locationPrecision:hasPoint?'independent_public_poi_area_only'
       :'published_postal_address_no_verified_gps',
     note:'Keine automatische Buchung oder Budgetbuchung; Kalender, Alter und Zutritt separat prüfen.',
    },
   };
   item.googleMapsUrl=googleMapsSearchUrl(item,cities);
   item.googleTransitUrl=googleMapsDirectionsUrl(null,item,cities,'transit');
   item.mapLocationQuality=googleMapsLocationStatus(item);
   trip.items.push(item);known.add(key);unique.add(row.id);
   tally.createdAcrossVariants++;
   if(hasPoint)tally.individuallySourcedAreaPoints++;
   byCity[row.city]=(byCity[row.city]??0)+1;
  }
 }
 return {sourceCandidates:rows.length,uniqueCreated:unique.size,
  createdAcrossVariants:tally.createdAcrossVariants,
  duplicateAcrossVariants:tally.duplicateAcrossVariants,
  sourcedAreaPinsAcrossVariants:tally.individuallySourcedAreaPoints,byCity};
}
