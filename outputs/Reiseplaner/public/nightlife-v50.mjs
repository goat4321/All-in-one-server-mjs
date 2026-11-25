// Classification is for browsing, not a promise of the club's September 2027
// programme, age limit, door price or even its current opening status.
const fold=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase();
export function nightlifeType(item){
 const v=fold([item?.name,item?.researchV50?.category,
  ...(item?.tags??[])].join(' '));
 if(/\b(club|nightclub|diskothek|discotheque|disco|party|partys|dancefloor|rave)\b/.test(v))
   return 'club';
 if(/\b(pub|rooftop|cocktail|bar|bars|bierzelt|aperitivo|studentenviertel)\b/.test(v))
   return 'bar';
 if(/nachtleben|nightlife|abendaktivitat|abendprogramm|livemusik|live-musik|konzert|nachts/.test(v))
   return 'evening';
 return 'none';
}
export function nightlifeVenueNote(item){
 const type=nightlifeType(item);
 if(type==='none')return null;
 return {
  type,
  label:type==='club'?'Club / Party':type==='bar'?'Bar / Pub':'Abendidee',
  checklist:type==='club'
   ?'Eventabend, Einlassalter, Ausweis, Ticket-Endpreis und Rückfahrt prüfen.'
   :'Veranstaltungszeit, Einlassbedingungen, tatsächliche Preise und Rückweg prüfen.',
  current2027Verified:false,
  pointVerified:!(item?.pointSourceV50==='uploaded_coordinate_unverified')
 };
}
