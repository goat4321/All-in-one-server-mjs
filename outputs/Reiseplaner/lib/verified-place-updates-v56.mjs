// Official 2026 operator-reference enrichment of existing V50 options.
// No September 2027 booking, admission price, entrance PIN or availability inferred.
export const VERIFIED_PLACE_UPDATES_V56=Object.freeze({
 new_010:{
  status:'programme_dependent',checkedOn:'2026-11-16',
  summary:'Atelier des Lumières: wechselnde immersive Ausstellungen mit veranstaltungsabhängigen Zeitfenstern. 2026 veröffentlichter Standardtarif ab 18 €, ermäßigt ab 16 € für 12–25-Jährige mit gültigem Nachweis. 2027-Programm offen; verbindliches Zeitfenster vor Besuch buchen.',
  priceReference:'2026: regulär ab 18 €, für 12–25 Jahre ermäßigt ab 16 €; abhängig von Ausstellung und Ticketzeit.',
  hoursReference:'Kein allgemein verbindlicher Wochentag-Öffnungsplan; Stunden im jeweiligen Ausstellungs-Ticketkalender.',
  visitorAddress:'38 rue Saint-Maur, 75011 Paris, Frankreich',
  sourceUrl:'https://www.atelier-lumieres.com/en/plan-your-visit/practical-information/rates',
  secondarySourceUrl:'https://www.atelier-lumieres.com/en/plan-your-visit/practical-information/opening-times',
 },
 new_029:{
  status:'schedule_2027_unconfirmed',checkedOn:'2026-11-16',
  summary:'Font Màgica: Die Stadt veröffentlicht tage- und saisonbezogene Musik- und Lichtshowzeiten sowie Wartungspausen. Für September 2027 ist mit der aktuell veröffentlichten Tabelle noch kein konkreter Vorführtermin bestätigt; kostenloser Blick auf die Anlage ist nicht gleichbedeutend mit einer laufenden Show.',
  priceReference:'Außenbereich frei zugänglich; Show- und Betriebszeiten für September 2027 offen.',
  hoursReference:'Städtische Programmübersicht saisonabhängig; 2027er Reisetag ausdrücklich offen.',
  visitorAddress:'Plaça de Carles Buïgas 1, 08038 Barcelona, Spanien',
  sourceUrl:'https://guia.barcelona.cat/en/detall/horari-il-luminacio-font-magica-fonts-de-montjuic_99400787700.html',
 },
 new_030:{
  status:'open_reference',checkedOn:'2026-11-16',
  summary:'MNAC: Museums-Eintritt derzeit 12 € regulär, Basiszugang inklusive Dach-Aussichtspunkt 2 €. Museum samstags ab 15 Uhr und jeden ersten Sonntag kostenlos; frühzeitige Online-Reservierung wird ausdrücklich empfohlen. Dachterrasse ist nicht durchgehend gratis.',
  priceReference:'2026: Museum 12 €, Basis-/Dachbesuch 2 €, Samstag nach 15 Uhr und erster Sonntag Museum gratis; Zutritts-/Reservierungsregeln prüfen.',
  hoursReference:'Mai–September Dienstag–Samstag 10–20 Uhr, Sonntag 10–15 Uhr, montags außer Feiertagen geschlossen.',
  visitorAddress:'Palau Nacional, Parc de Montjuïc, 08038 Barcelona, Spanien',
  sourceUrl:'https://www.museunacional.cat/en/opening-hours-and-prices',
 },
 new_043:{
  status:'open_reference',checkedOn:'2026-11-16',
  summary:'MIAM: Kunstmuseum von Dienstag bis Sonntag 10–18 Uhr, montags geschlossen. Tarif 5,60 € regulär; für 10–18-Jährige oder Studierende laut Betreiber 2,60 €. 18 Jahre ist noch in der genannten Altersspanne; Berechtigung mit aktuellem Ausweis nachweisen. Erster Sonntag des Monats laut Betreiber kostenlos.',
  priceReference:'2026: 5,60 € regulär, 2,60 € für 10–18-Jährige bzw. Studierende (Betreibertext), erster Sonntag gratis.',
  hoursReference:'Dienstag–Sonntag 10–18 Uhr, zusätzlich einzelne Jahresfeiertage geschlossen.',
  visitorAddress:'23 quai Maréchal de Lattre de Tassigny, 34200 Sète, Frankreich',
  sourceUrl:'https://miam.org/horaires-tarifs/',
 },
 new_095:{
  status:'weather_seasonal',checkedOn:'2026-11-16',
  summary:'Gletscherschlucht Grindelwald: gesicherte Stege und Spiderweb, insgesamt ca. 2 km hin und zurück. Betreiber nennt Mai–November als saisonale Richtlinie, 1–2 Stunden Besuchszeit, wetterabhängige Öffnung und CHF 21 Eintritt für Erwachsene. Bus 122 ab Bahnhof Grindelwald bis Gletscherschlucht; 2027er Fahrplan und Saison separat prüfen.',
  priceReference:'2026: CHF 21 Erwachsene, CHF 19 ab 10 Personen; Gästekartenrabatt laut Betreiber, Bedingungen aktuell prüfen.',
  hoursReference:'Saison grundsätzlich Mai–November, wetterabhängig; letzter Einlass 1 Stunde vor Schließung.',
  visitorAddress:'Gletscherschlucht 1, 3818 Grindelwald, Schweiz',
  sourceUrl:'https://www.outdoor.ch/de/outdoor-experience/gletscherschlucht-grindelwald',
  secondarySourceUrl:'https://grindelwald.swiss/de/map/detail/gletscherschlucht-grindelwald-aaa98968-c9e4-4a2a-b871-8c25abefc234.html',
 },
});
export function applyVerifiedPlaceUpdateV56(item,uploadedId){
 const update=VERIFIED_PLACE_UPDATES_V56[uploadedId];
 if(!update)return item;
 if(item.officialAccessV56)return item;
 item.officialAccessV56={...update,forTravelYearConfirmed:false};
 item.website=update.sourceUrl;
 if(!Array.isArray(item.source))item.source=[];
 if(!item.source.includes('operator-v56:'+uploadedId))
  item.source.push('operator-v56:'+uploadedId);
 if(update.visitorAddress)item.address=update.visitorAddress;
 item.detail=(item.detail??'')+' Betreiberstand '+update.checkedOn+': '+update.summary;
 // Previous user-uploaded GPS remains independent from the verified postal address.
 // No price, point, booking, selection, schedule or hotel data overwritten.
 return item;
}
