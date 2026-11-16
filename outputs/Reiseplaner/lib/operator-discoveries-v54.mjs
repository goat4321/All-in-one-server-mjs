import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus}
 from '../public/google-maps.mjs';

const normalize=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de')
 .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const validSource=url=>{try{
 const u=new URL(url);
 return u.protocol==='https:'&&u.hostname.includes('.');
}catch{return false;}};

export function applyOperatorDiscoveriesV54(trips,cities,archive){
 if(archive?.meta?.package!=='research-v54-operator-discoveries'
  ||archive?.meta?.checkedOn!=='2026-11-16'
  ||!Array.isArray(archive.entries)||archive.entries.length!==13
  ||new Set(archive.entries.map(e=>e.id)).size!==13)
  throw new Error('V54 research: expected 13 distinct operator-sourced places.');
 const tally={sourceCandidates:archive.entries.length,createdAcrossVariants:0,
  uniqueCreated:new Set(),duplicateAcrossVariants:0,byCity:{}};
 for(const row of archive.entries){
  if(!/^[a-z0-9-]+$/.test(row.id)||!cities[row.city]
   ||typeof row.name!=='string'||!row.name.trim()
   ||typeof row.address!=='string'||!row.address.trim()
   ||!validSource(row.sourceUrl)||!row.priceReference||!row.openingReference)
   throw new Error('V54 entry lacks a valid city, address, source, price or hours: '+row.id);
 }
 for(const trip of trips){
  const names=new Set(trip.items.filter(x=>x.name&&!x.removed&&!x.duplicateOf)
   .map(x=>x.city+'|'+normalize(x.name)));
  for(const row of archive.entries){
   if(!trip.route.includes(row.city))continue;
   const key=row.city+'|'+normalize(row.name);
   if(names.has(key)){tally.duplicateAcrossVariants++;continue;}
   const item={
    id:'operator:v54:'+row.id,trip:trip.id,city:row.city,
    zone:cities[row.city].timezone,kind:'activity',category:'activity',
    name:row.name,detail:row.description,address:row.address,
    tags:[...row.tags,'Betreiberquelle 2026','Vorschlag 2027'],
    point:null,pointPrecision:'source_postal_address_no_geocode',
    locationReferenceV07:{precision:'provider_postal_address_without_coordinates',exactKnown:false},
    geoEvidence:null,website:row.sourceUrl,source:['operator-v54:'+row.id],
    origin:'Offizielle Betreiberrecherche vom 16.11.2026',
    verification:'Existenz und Betreiberinformationen 2026 geprüft; Öffnung 2027 nicht bestätigt',
    selected:false,booked:false,removed:false,locked:false,
    price:null,start:null,end:null,duration:row.durationMinutes,
    openingHoursNote:row.openingReference,
    discoveryV54:{
     checkedOn:archive.meta.checkedOn,sourceUrl:row.sourceUrl,
     priceReference:row.priceReference,priceYear:row.priceYear,
     openingReference:row.openingReference,
     september2027TicketConfirmed:false,
     september2027OpeningConfirmed:false,
     locationPrecision:'published_address_no_independent_poi_coordinate',
     note:'Quellenangaben sind Referenzen; weder Buchung noch Budgetbetrag.'
    },
   };
   item.googleMapsUrl=googleMapsSearchUrl(item,cities);
   item.googleTransitUrl=googleMapsDirectionsUrl(null,item,cities,'transit');
   item.mapLocationQuality=googleMapsLocationStatus(item);
   trip.items.push(item);names.add(key);
   tally.createdAcrossVariants++;tally.uniqueCreated.add(row.id);
   tally.byCity[row.city]=(tally.byCity[row.city]??0)+1;
  }
 }
 return {sourceCandidates:tally.sourceCandidates,
  createdAcrossVariants:tally.createdAcrossVariants,
  uniqueCreated:tally.uniqueCreated.size,
  duplicateAcrossVariants:tally.duplicateAcrossVariants,
  byCity:tally.byCity};
}
