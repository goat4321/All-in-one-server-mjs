/**
 * Selective provider first-party reference facts observed 2026-11-15.
 * A published rule is not a confirmation of the September 2027 event,
 * price, door availability or future minimum age.
 */
export const NIGHTLIFE_PROVIDER_REFERENCES_V51=Object.freeze([
 {id:'sala-apolo',city:'barcelona',pattern:/^Sala Apolo$/i,
  sourceUrl:'https://www.sala-apolo.com/en/faqs',
  secondaryUrl:'https://www.sala-apolo.com/en/contact',
  name:'Sala Apolo',
  publishedEntranceAge:18,
  ageScope:'Clubveranstaltungen ab Mitternacht; Konzertbedingungen unterscheiden sich.',
  publishedIdRequired:'Ausweis mit Lichtbild',
  publishedDressCode:'Keine Sportteam-Shirts oder -Embleme, keine Kostüme außerhalb entsprechender Themenveranstaltungen.',
  admissionReference:'Vorverkauf online, Restkarten an der Abendkasse nicht garantiert.',
  programmeReference:'Clubsessions enden laut Anbieter häufig um 05:00 oder 06:00; Eventprogramm separat prüfen.',
  addressCaution:'Anbieter-FAQ nennt Nou de la Rambla 113, Kontaktseite nennt 107. Eingang vor Besuch klären.',
  officialAddressVerified:false},
 {id:'razzmatazz',city:'barcelona',pattern:/\bRazzmatazz\b/i,
  sourceUrl:'https://www.salarazzmatazz.com/en/info/',
  name:'Sala Razzmatazz',
  publishedEntranceAge:18,
  ageScope:'Clubs/Discos. Für Konzerte abweichende Bedingungen möglich.',
  publishedIdRequired:'Gültiger Ausweis/Reisepass/Führerschein',
  admissionReference:'Abendkasse nur falls nicht ausverkauft, Vorverkauf empfohlen.',
  programmeReference:'Eventtermine, Räume und Ticketpreise hängen von der Veranstaltung ab.',
  officialAddressVerified:false},
 {id:'waynes-bar',city:'nice',pattern:/^Wayne.s Bar$/i,
  sourceUrl:'https://www.waynesbar-restaurant.com/',
  secondaryUrl:'https://www.waynesbar-restaurant.com/en/live-concerts',
  name:"Wayne's Bar",
  publishedEntranceAge:null,
  ageScope:'Kein generelles Einlassalter aus der öffentlichen Betreiberseite belegt.',
  programmeReference:'Laut Betreiber regelmäßig Livemusik, Rock/Dance/Pop-Rock; 2027-Termine nicht veröffentlicht.',
  publishedAddress:'15 rue de la Préfecture, 06300 Nice',
  officialAddressVerified:true},
 {id:'ma-nolans-vieux-nice',city:'nice',
  pattern:/Ma Nolan.s.*Vieux Nice/i,
  sourceUrl:'https://ma-nolans.com/',
  secondaryUrl:'https://ma-nolans.com/live-events/live-music/',
  name:"Ma Nolan's Vieux Nice",
  publishedEntranceAge:null,
  ageScope:'Keine allgemeine Altersfreigabe für den Pubbesuch aus der Betreiberseite belegt.',
  programmeReference:'Betreiber nennt Live-Sport und Musik, Termine für 2027 offen.',
  publishedAddress:'2 Rue St François de Paule, 06300 Nice',
  officialAddressVerified:true},
]);
export function attachNightlifeReferencesV51(trips){
 const stats={records:0,matchedItems:0,uniquePlaces:[]};
 const found=new Set();
 for(const trip of trips)trip.items=trip.items.map(item=>{
  const ref=NIGHTLIFE_PROVIDER_REFERENCES_V51.find(r=>r.city===item.city&&r.pattern.test(item.name));
  if(!ref||item.kind!=='activity')return item;
  stats.matchedItems++;found.add(ref.id);
  return {...item,
   // Content-based publication verification is independent of the map point:
   // do not promote user-uploaded lat/lon to a sourced precise entrance.
   nightlifeOfficialV51:{
    referenceId:ref.id,publishedOnReview:'2026-11-15',
    sourceUrl:ref.sourceUrl,secondaryUrl:ref.secondaryUrl??null,
    publishedEntranceAge:ref.publishedEntranceAge,
    ageScope:ref.ageScope,
    publishedIdRequired:ref.publishedIdRequired??null,
    publishedDressCode:ref.publishedDressCode??null,
    admissionReference:ref.admissionReference??null,
    programmeReference:ref.programmeReference,
    publishedAddress:ref.publishedAddress??null,
    officialAddressVerified:ref.officialAddressVerified??false,
    addressCaution:ref.addressCaution??null,
    sep2027EventVerified:false,sep2027PriceVerified:false,
    photoReuseRightsVerified:false},
   source:[...new Set([...(item.source??[]),'nightlife-official-v51:'+ref.id])],
  };
 });
 stats.uniquePlaces=[...found];stats.records=found.size;
 return stats;
}
