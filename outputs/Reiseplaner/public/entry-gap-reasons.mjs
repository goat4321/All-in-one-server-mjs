// Rule-based explanations only. Never present a missing-field check as a
// completed web search or an unconfirmed 2027 quote as verified.
const info={
 photo:['Kein nachweisbar zum Eintrag gehörendes Foto mit Wiederverwendungsrechten hinterlegt.','Passendes Commons-Bild mit Lizenz und Urheber oder eigenes freigegebenes Foto schicken.'],
 description:['Objektspezifische Beschreibung fehlt oder ist zu knapp.','Offiziellen Ortslink oder belastbare Beschreibung mit Quelle senden.'],
 price:['Keine ausreichend vergleichbare und belegte Preisangabe für die Gruppe gespeichert.','Anbieterpreis mit Datum, Personenzahl, Währung und Tarifbedingungen bereitstellen.'],
 hours:['Tages- und Saisonöffnungszeiten sowie Ausnahmen sind nicht ausreichend nachgewiesen.','Offizielle Öffnungszeiten für den geplanten Tag verlinken.'],
 location:['Keine nachgewiesene einzelne Koordinate; ein Stadtzentrum wäre kein echter Gebäude-Pin.','Öffentliche Adresse oder präzisen OSM-Eintrag nennen; private Airbnb-Hausadressen nicht veröffentlichen.'],
 geo_evidence:['Ein Punkt ist vorhanden, aber seine genaue unabhängige Herkunft wurde nicht belegt.','Link zum offiziellen Eingang oder passenden OSM-Objekt senden.'],
 source:['Ein konkreter Webbeleg zum Eintrag fehlt.','Passenden offiziellen Betreiber- oder Tourismuslink schicken.'],
 booking:['Zimmer, Betten, Steuern, Storno und Endpreis wurden nicht gemeinsam für die Reisedaten geprüft.','Die konkrete Zimmerauswahl beim Anbieter privat prüfen und nur nicht-vertrauliche Eckdaten nennen.'],
 timetable:['Eine datierte bestätigte 2027er Verbindung mit Reservierung/Tarif fehlt.','Nach Öffnung des Verkaufs Buchungslink, Zugnummer, Zeit und Reservierung teilen.']
};
export function explainMissingField(item,gap){
 const [defaultReason,defaultManual]=info[gap.key]??['Konkreter Nachweis fehlt.','Objektbezogene Quelle bereitstellen.'];
 const privateAirbnb=gap.key==='location'&&(
  item.provider==='Airbnb'||String(item.id??'').startsWith('wishlist:airbnb:'));
 const concept=gap.key==='location'&&(
  /concept/i.test(item.researchV20?.reviewStatus??'')||
  item.pointPrecision==='unverified_or_not_single_location');
 return {...gap,
  reason:privateAirbnb?'Private Airbnb-Hausadressen sind nicht öffentlich nachgewiesen; absichtlich kein exakter Pin.':
    concept?'Flexible Aktivität oder Gebiet ohne einzelnen festgelegten Treffpunkt.':defaultReason,
  manual:privateAirbnb?'Nur die ungefähre Lage prüfen, keine private Hausadresse hier veröffentlichen.':
    concept?'Einen konkreten Treffpunkt oder Anbieter bestimmen.':defaultManual,
  priority:['booking','timetable','location','price','geo_evidence'].includes(gap.key)?'hoch':'mittel',
  category:privateAirbnb?'Datenschutz':concept?'Konzept ohne Punkt':'Einzeln prüfen'};
}
