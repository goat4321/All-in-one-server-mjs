import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus} from '../public/google-maps.mjs';

const normalize=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de')
 .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const secure=url=>{try{const u=new URL(url);
 return u.protocol==='https:'&&!!u.hostname&&u.hostname.includes('.')
  &&!u.username&&!u.password;}catch{return false;}};

export function applyOperatorDiscoveriesV61(trips,cities,archive){
 const rows=archive?.entries;
 if(archive?.meta?.package!=='research-v61-operator-discoveries'
   ||archive?.meta?.checkedOn!=='2026-11-16'||!Array.isArray(rows)
   ||rows.length!==16||new Set(rows.map(r=>r.id)).size!==16)
  throw new Error('V61: expected 16 distinct official-source options.');
 for(const r of rows){
  if(!/^[a-z0-9-]+$/.test(r.id)||!cities[r.city]
   ||!r.name?.trim()||!r.address?.trim()||!r.description?.trim()
   ||!Array.isArray(r.tags)||!r.tags.length
   ||!r.priceReference?.trim()||!r.openingReference?.trim()
   ||!Number.isInteger(r.durationMinutes)||r.durationMinutes<20
   ||!r.visitorGuide||!Array.isArray(r.visitorGuide.highlights)
   ||r.visitorGuide.highlights.length<2
   ||r.visitorGuide.highlights.some(v=>typeof v!=='string'||!v.trim())
   ||['visitTip','combineWith','arrivalTip','check2027'].some(k=>typeof r.visitorGuide[k]!=='string'||!r.visitorGuide[k].trim())
   ||!secure(r.sourceUrl)||r.point!==undefined||r.price!==undefined)
   throw new Error('V61: invalid source or contents for '+r.id);
 }
 const included=new Set(),byCity={};let addedCount=0,duplicates=0;
 for(const trip of trips){
  const names=new Set(trip.items.filter(x=>x.name&&!x.removed&&!x.duplicateOf)
    .map(x=>x.city+'|'+normalize(x.name)));
  for(const r of rows){
   if(!trip.route.includes(r.city))continue;
   const key=r.city+'|'+normalize(r.name);
   if(names.has(key)){duplicates++;continue;}
   const item={
    id:'operator:v61:'+r.id,trip:trip.id,city:r.city,zone:cities[r.city].timezone,
    kind:'activity',category:'activity',
    name:r.name,detail:r.description,address:r.address,
    tags:[...r.tags,'Offizielle Betreiberreferenz','Zusatzoption 2027'],
    point:null,pointPrecision:'published_postal_address_not_geocoded',
    locationReferenceV07:{precision:'provider_postal_address_without_coordinates',exactKnown:false},
    geoEvidence:null,website:r.sourceUrl,source:['operator-v61:'+r.id],
    origin:'Betreiber-/Stadt-/Tourismusquelle · 16.11.2026',
    verification:'Referenz 2026; 2027er Eintritt und Tagesöffnung separat prüfen',
    price:null,selected:false,booked:false,removed:false,locked:false,
    start:null,end:null,duration:r.durationMinutes,
    openingHoursNote:r.openingReference,
    discoveryV61:{
     checkedOn:archive.meta.checkedOn,sourceUrl:r.sourceUrl,
     visitorGuide:{...r.visitorGuide,highlights:[...r.visitorGuide.highlights]},
     priceReference:r.priceReference,priceYear:r.priceYear,
     openingReference:r.openingReference,
     publishedSeason2027:r.special2027==='published_2027_operating_season',
     september2027TicketConfirmed:false,september2027OpeningConfirmed:false,
     locationPrecision:'published_address_no_independent_poi_coordinate',
     note:'Historische Preis- und Öffnungsreferenz, weder Buchung noch Budgetposition.',
    }
   };
   item.googleMapsUrl=googleMapsSearchUrl(item,cities);
   item.googleTransitUrl=googleMapsDirectionsUrl(null,item,cities,'transit');
   item.mapLocationQuality=googleMapsLocationStatus(item);
   trip.items.push(item);names.add(key);included.add(r.id);addedCount++;
   byCity[r.city]=(byCity[r.city]??0)+1;
  }
 }
 return {sourceCandidates:rows.length,uniqueCreated:included.size,
  createdAcrossVariants:addedCount,duplicateAcrossVariants:duplicates,byCity};
}
