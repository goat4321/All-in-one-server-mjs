import {applyVerifiedPlaceUpdateV53} from './verified-place-updates-v53.mjs';
import {applyVerifiedPlaceUpdateV56} from './verified-place-updates-v56.mjs';
import {applyVerifiedPlaceUpdateV57} from './verified-place-updates-v57.mjs';
// Import user-provided September 2027 research WITHOUT pretending its
// "Verifiziert" string is a third-party source check or a confirmed booking.
const placeCities=Object.freeze({
 'Paris':'paris','Barcelona':'barcelona','Sète':'sete','Nizza':'nice',
 'Genua':'genoa','Venedig':'venice','Grindelwald':'grindelwald',
 'Appenzell':'appenzell','Appenzell / Wasserauen':'wasserauen',
 'Kandersteg':'kandersteg','Glarus':'glarus'
});
const fold=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLocaleLowerCase('de').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export const uploadedPlaceCity=name=>placeCities[name]??null;
export const uploadedPlaceType=entry=>{
 const category=String(entry.category??'').toLowerCase();
 if(/unterkunft|hostel|hotel/.test(category))return 'lodging';
 if(/supermarkt/.test(category))return 'shop';
 if(/abendaktivitat|abendaktivität|club|pub|nightlife|rooftop/.test(category))return 'nightlife';
 if(/restaurant|streetfood|bäckerei|backerei|markt|eisdiele|café|cafe|tapas|essen|kulinarik|foodhall|bar/.test(category))return 'food';
 return 'activity';
};
const sourceTags=entry=>{
 const t=uploadedPlaceType(entry),c=String(entry.category??'').toLowerCase();
 const tags=[entry.category,'Recherche 2026','Vorschlag 2027'];
 if(t==='nightlife'){
  tags.push('Nightlife','Abend');
  if(/\bclub\b|party/.test(c))tags.push('club','party');
  else if(/pub|bar|rooftop/.test(c))tags.push('bar','pub');
 }
 if(t==='food')tags.push('Essen');
 if(/sport|schwimmen|bad|kajak|wandern/.test(c))tags.push('Sport');
 return [...new Set(tags.filter(Boolean))];
};
const valid=(entry,cities)=>{
 const id=uploadedPlaceCity(entry.city);
 const city=cities[id];
 const ll=[entry.lat,entry.lon];
 if(!id||!city||!entry.id||!entry.name||!entry.category||!entry.address
   ||!entry.description||!['EUR','CHF'].includes(entry.currency)
   ||!ll.every(Number.isFinite)||Math.abs(ll[0])>90||Math.abs(ll[1])>180)
  return false;
 // Reject accidental cross-country points; a neighboring day trip can be
 // within roughly 70 km of its itinerary city, but never a different region.
 const km=111.2*Math.hypot(ll[0]-city.point[0],
  (ll[1]-city.point[1])*Math.cos(city.point[0]*Math.PI/180));
 return km<=70;
};
export function applyUploadedPlacesV50(trips,cities,source){
 if(source?.meta?.total_new_entries!==105
  ||!Array.isArray(source.new_entries)||source.new_entries.length!==105
  ||new Set(source.new_entries.map(e=>e.id)).size!==105
  ||source.new_entries.some(e=>!valid(e,cities)))
  throw new Error('Upload V50: 105 eindeutig identifizierte, regional plausible Rechercheorte erwartet.');
 const tally={sourceCandidates:105,createdAcrossVariants:0,dupesAcrossVariants:0,
  uniqueCreatedIds:new Set(),uniqueDuplicates:new Set(),byCity:{},nightlifeIds:new Set()};
 for(const trip of trips){
  const known=new Map();
  for(const item of trip.items)if(item.name&&!item.duplicateOf){
   const key=item.city+'|'+fold(item.name);
   if(!known.has(key))known.set(key,item.id);
  }
  const route=new Set(trip.route);
  for(const e of source.new_entries){
   const city=uploadedPlaceCity(e.city);
   if(!route.has(city))continue;
   const key=city+'|'+fold(e.name);
   const duplicateOf=known.get(key);
   if(duplicateOf){
    const existing=trip.items.find(x=>x.id===duplicateOf);
    if(existing){
      applyVerifiedPlaceUpdateV53(existing,e.id);
      applyVerifiedPlaceUpdateV56(existing,e.id);
      applyVerifiedPlaceUpdateV57(existing,e.id);
    }
    tally.dupesAcrossVariants++;
    tally.uniqueDuplicates.add(e.id);
    continue;
   }
   const group=uploadedPlaceType(e);
   const lodging=group==='lodging';
   const id='uploaded:v50:'+e.id;
   const item={
    id,trip:trip.id,city,zone:cities[city].timezone,
    kind:lodging?'lodging':'activity',
    category:lodging?'lodging':group==='shop'?'shop':group==='food'?'food':'activity',
    name:e.name,address:e.address,detail:e.description,tags:sourceTags(e),
    point:[e.lat,e.lon],pointPrecision:'user_submitted_unverified',
    locationReferenceV07:{precision:'uploaded_user_coordinate_unverified',exactKnown:false},
    geoEvidence:{source:'Nutzerdatei · Koordinate nicht unabhängig geprüft',
      confidence:'user_supplied_unverified',url:null,isCentroid:false,
      note:'Nur vom Nutzer gelieferter Kartenhinweis, kein bestätigter Objekteingang. Angaben für September 2027 erneut prüfen.'},
    pointSourceV50:'uploaded_coordinate_unverified',
    researchV50:{
      uploadedId:e.id,category:e.category,checkDate:e.check_date,
      claimedVerification:e.verification_status,
      independentSourceVerified:false,referencePrice:e.price,currency:e.currency,
      availableSeptember2027:false,entranceVerified:false,
      note:'Preisorientierung aus Nutzerrecherche, nicht als aktueller Tarif oder Buchung geprüft.'
    },
    origin:'Nutzer-Recherchepaket',verification:'Nutzerangabe · unabhängig ungeprüft',
    source:['user-upload-v50:'+e.id],price:null,
    selected:false,booked:false,removed:false,locked:false,
    start:null,end:null,duration:null,
    openingHoursNote:'Öffnungszeiten und mögliche Veranstaltungen im September 2027 nicht bestätigt',
    ...(lodging?{stayFrom:null,stayTo:null,room:null,quote:null,roomBedsConfirmed:false}:{}),
    ...(group==='nightlife'?{nightlifeResearch:{
      type:sourceTags(e).includes('club')?'club':'bar-or-evening',
      minAgeVerified:false,programForSeptember2027Verified:false,
      doorPriceVerified:false,openingHoursVerified:false,
      note:'Einlassalter, Veranstaltung, Eintritt, Dresscode und Ausweis bei Betreiber prüfen.'
    }}:{})
   };
   applyVerifiedPlaceUpdateV53(item,e.id);
   applyVerifiedPlaceUpdateV56(item,e.id);
   applyVerifiedPlaceUpdateV57(item,e.id);
   trip.items.push(item);known.set(key,id);
   tally.createdAcrossVariants++;
   tally.uniqueCreatedIds.add(e.id);
   tally.byCity[city]=(tally.byCity[city]??0)+1;
   if(group==='nightlife')tally.nightlifeIds.add(e.id);
  }
 }
 return {
  sourceCandidates:tally.sourceCandidates,
  createdAcrossVariants:tally.createdAcrossVariants,
  duplicatesAcrossVariants:tally.dupesAcrossVariants,
  uniqueCreated:tally.uniqueCreatedIds.size,
  uniqueDuplicates:tally.uniqueDuplicates.size,
  uniqueNightlifeCandidates:tally.nightlifeIds.size,
  byCity:tally.byCity,
  omittedSourceIds:source.new_entries.filter(e=>
   !tally.uniqueCreatedIds.has(e.id)&&!tally.uniqueDuplicates.has(e.id)).map(e=>e.id)
 };
}
