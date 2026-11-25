// Publicly documented 2026 operator information for individual V50 places.
// These facts are *not* September 2027 opening or reservation confirmations.
// Never overwrite unknown 2027 prices with a 2026 ticket or a sample quote.
export const VERIFIED_PLACE_UPDATES_V53=Object.freeze({
  new_008:{
    status:'open_reference',checkedOn:'2026-11-16',
    summary:'Dauerausstellung kostenlos. Laut Betreiber Di–So 10–18 Uhr, letzter Einlass 17:15 Uhr. Temporäre Ausstellungen kosten extra; 2027 erneut prüfen.',
    visitorAddress:'23 rue Madame de Sévigné, 75003 Paris',
    sourceUrl:'https://www.carnavalet.paris.fr/visiter/informations-pratiques',
  },
  new_009:{
    status:'open_reference',checkedOn:'2026-11-16',
    summary:'Dauerausstellung und Garten kostenlos. Laut Betreiber Di–So 10–18 Uhr, letzter Einlass in die Dauerausstellung 17:15 Uhr; temporäre Ausstellungen kosten extra.',
    visitorAddress:'Avenue Winston-Churchill, 75008 Paris',
    sourceUrl:'https://www.petitpalais.paris.fr/visiter/preparer-votre-visite',
  },
  new_020:{
    status:'closed_reopening_unconfirmed',checkedOn:'2026-11-16',
    summary:'Die Panorama-Aussichtsplattform der Tour Montparnasse ist seit 31. März 2026 wegen Renovierung geschlossen. Keine Wiedereröffnung für September 2027 bestätigt – nicht als sichere Aktivität einplanen.',
    sourceUrl:'https://www.tourmontparnasse56.com/',
  },
  new_026:{
    status:'partial_access',checkedOn:'2026-11-16',
    summary:'Panoramabereich laut Betreiber ohne Eintritt zugänglich; Fahrgeschäfte, Freizeitpark und Anreise per Standseilbahn sind gesondert zu prüfen. Normales Freizeitparkticket laut 2026er Betreiberseite 39 € (Erwachsene); 2027er Öffnungstage und Tarife offen.',
    sourceUrl:'https://tibidabo.cat/en/panoramic-area',
    priceSourceUrl:'https://tibidabo.cat/en/plan-the-visit/rates',
  },
  new_058:{
    status:'closed_reopening_unconfirmed',checkedOn:'2026-11-16',
    summary:'MAMAC-Gebäude seit 7. Januar 2024 für eine rund vierjährige Renovierung geschlossen. Das Programm findet teils außerhalb des Museums statt; ein regulärer Innenbesuch im September 2027 ist nicht bestätigt.',
    sourceUrl:'https://www.mamac-nice.org/evenement/2024-2028/',
  },
  new_082:{
    status:'access_unconfirmed',checkedOn:'2026-11-16',
    summary:'Die frühere frei zugängliche Dachterrasse wurde 2025 mit dem Kaufhaus geschlossen. Berichte über einzelne Sonderöffnungen 2026 sind kein regelmäßiger 2027er Zugang; vor Einplanung offiziellen Reservierungszugang prüfen.',
    sourceUrl:'https://europeforvisitors.com/venice/articles/fondaco-dei-tedeschi-roof-terrace.htm',
    thirdPartySource:true,
  },
});
export function applyVerifiedPlaceUpdateV53(item,uploadedId){
  const update=VERIFIED_PLACE_UPDATES_V53[uploadedId];
  if(!update)return item;
  item.officialAccessV53={...update,forTravelYearConfirmed:false};
  item.website=update.sourceUrl;
  item.detail=(item.detail??'')+' Betreiber-/Quellenstand '+update.checkedOn+': '+update.summary;
  if(update.visitorAddress)item.address=update.visitorAddress;
  // Keep the user's approximate coordinates and their unverified provenance;
  // a verified entrance address is NOT a coordinate verification.
  return item;
}
