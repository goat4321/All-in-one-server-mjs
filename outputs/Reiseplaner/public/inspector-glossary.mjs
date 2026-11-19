import {esc} from './ui.mjs';

// Small, fully keyboard-operable concept inspectors. These explain the data
// model; they never silently upgrade source references into verified bookings.
export const terms={
 priceTier:{title:'Was bedeutet € / €€ / €€€ / €?',
  detail:'Die Symbole sind relative Vergleichskategorien je Aktivität, Essen, Hotel oder Verkehr. €? bedeutet: kein belastbarer, vergleichbarer Euro-Gesamtpreis. Ein Preiszeichen ist weder ein Angebot noch eine Reservierung.'},
 source:{title:'Wie belastbar ist ein Quellenbeleg?',
  detail:'Eine verlinkte offizielle Quelle belegt nur die darin ausdrücklich genannte Information und ihren Prüfstand. Allgemeine Tourismusseiten belegen keine exakten Öffnungszeiten, Zimmerpreise oder verfügbaren Zugplätze.'},
 booking:{title:'Was bedeutet „noch nicht gebucht“?',
  detail:'Nur echte Buchungs- bzw. Bestätigungsnachweise erlauben eine verlässliche Reservierungsangabe. Ein Preis auf einer Suchseite, eine Interessenmarkierung oder ein Eintrag im Reiseplan sind keine tatsächliche Buchung.'},
 geography:{title:'Was bedeutet ein Kartenpunkt?',
  detail:'Ein POI-Punkt kann ein Museum, ein Flächenmittelpunkt oder eine Orientierung im Gelände sein. Ohne unabhängig belegten Eingang sind Zeitberechnungen ab dem Pin nur eine Annäherung. Private Airbnb-Adressen werden nicht angenommen.'},
 airDistance:{title:'Warum steht hier „Luftlinie“?',
  detail:'Die angezeigte Kilometerzahl wird aus zwei GPS-Referenzpunkten berechnet. Es werden keine Straßen, Brücken, Fähren, Steigungen, Wanderwege, ÖPNV-Fahrpläne oder echte Gehzeiten einbezogen.'},
 image:{title:'Darf ich das Bild übernehmen?',
  detail:'Die Wikimedia-Commons-Lizenz und Urheberangabe müssen für genau diese Datei geprüft werden. Zusätzlich muss das Bild wirklich den Eintrag zeigen. Bildrechte eines Hotels gelten nicht automatisch auch für dessen Zimmeransichten.'},
 future:{title:'Was gilt bereits für September 2027?',
  detail:'Nur explizit für 2027 veröffentlichte Tarif- oder Saisonangaben dürfen als solche bezeichnet werden. Reguläre Preislisten und Wochenzeiten können sich bis zum Reisetag ändern; auch eine bestätigte Saisonzeit bedeutet nicht, dass ein Ticket buchbar ist.'},
};
export function inspectorTerm(key){
 const t=terms[key];if(!t)return '';
 return '<details class="inspector-term"><summary>'
   +esc(t.title)+'<span aria-hidden="true">?</span></summary><p>'
   +esc(t.detail)+'</p></details>';
}
