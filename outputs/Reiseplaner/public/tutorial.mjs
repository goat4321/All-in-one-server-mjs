import { esc, icon } from './ui.mjs';

// Read-only onboarding. Page navigation never mutates trips, votes or reservations.
export const GUIDE_STEPS=Object.freeze([
  {page:'plan',title:'Tagesplan verstehen',tag:'01 · Planung',focus:'.days',
    description:'Wähle einen Reisetag und einen Ort. Die Zeitleiste zeigt vorhandene Termine; den Reiseplan änderst du nur mit eigenen Aktionen.',
    tip:'Termine und Kartenmarker sind verknüpft. Auch mobil kannst du zur Karte wechseln.'},
  {page:'map',title:'Orte und Routen entdecken',tag:'02 · Karte',focus:'.explorer-toolbar',
    description:'Suche und filtere Hotels, Restaurants und Sehenswürdigkeiten. Wähle zwei bis acht Orte im Route Studio und berechne die Fußwege.',
    tip:'Gestrichelte Linien sind schematisch. Ohne genaue Position oder Routerergebnis gibt es keine echte Gehzeit.'},
  {page:'lodging',title:'Unterkünfte vergleichen',tag:'03 · Wohnen',focus:'.nightly-budget-control',
    description:'Lege dein Budget pro Person/Nacht fest. Wähle mit „Vergleichen“ bis zu vier Hotels oder Airbnbs für den Direktvergleich.',
    tip:'Ein Suchpreis ist keine Buchung. Historische Airbnb-Wunschlistenpreise sind keine bestätigten Endpreise für 2027.'},
  {page:'rail',title:'Bahn und Interrail prüfen',tag:'04 · Verkehr',focus:'.page-head',
    description:'Vergleiche Pass-Reisetage, Zugideen und Reservierungsregeln. Prüfe die offiziellen Betreiberlinks vor jeder Buchung.',
    tip:'Beispielverbindungen aus 2026 bestätigen keine Zugabfahrt, Verfügbarkeit oder Preise im September 2027.'},
  {page:'budget',title:'Budget richtig lesen',tag:'05 · Kosten',focus:'.stat-grid',
    description:'Hier findest du bekannte Plankosten, erfasste Zahlungen und die Verteilung auf alle Gruppenmitglieder.',
    tip:'Offene Preise zählen nicht als echte 0 €. Was-wäre-wenn-Szenarien verändern deinen Plan nicht.'},
  {page:'group',title:'Gemeinsam entscheiden',tag:'06 · Gruppe',focus:'.group-vote-board',
    description:'In der Gruppenübersicht können Reisende Unterkünfte und Aktivitäten mit 1–5 Punkten bewerten und Favoriten erkennen.',
    tip:'Bewertungen bleiben auf diesem Gerät und in der jeweiligen Reisevariante; es gibt noch keine Live-Synchronisierung.'},
  {page:'data',title:'Quellen und offene Fragen',tag:'07 · Nachweise',focus:'.page-head',
    description:'Unter Daten & Fristen findest du Belege, Standortunsicherheiten, Datenlücken und konkrete nächste Prüfschritte.',
    tip:'Die Tour ändert keine Daten und bucht nichts. Über „Tour“ oben kannst du sie jederzeit erneut starten.'},
]);
export function guideStep(index){
  return Number.isInteger(index)&&index>=0&&index<GUIDE_STEPS.length?GUIDE_STEPS[index]:null;
}
export function guideMarkup(index){
  const step=guideStep(index);
  if(!step)return '';
  const total=GUIDE_STEPS.length;
  const dots=GUIDE_STEPS.map((s,i)=>'<button type="button" class="guide-dot" data-action="guide-jump" data-value="'+i
    +'" aria-label="Schritt '+(i+1)+': '+esc(s.title)+'" aria-current="'+(i===index?'step':'false')+'">'+(i+1)+'</button>').join('');
  return '<div class="guide-scrim" aria-hidden="true"></div>'
    +'<section class="guide-panel" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-description" tabindex="-1">'
    +'<div class="guide-top"><span class="guide-kicker">'+icon('spark')+' Interaktive Einführung</span>'
    +'<button type="button" class="guide-close" data-action="guide-close" aria-label="Tour schließen">'+icon('x')+'</button></div>'
    +'<p class="guide-count">'+esc(step.tag)+' · Schritt '+(index+1)+' von '+total+'</p>'
    +'<div class="guide-progress" role="progressbar" aria-label="Tourfortschritt" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+(index+1)+'"><span style="width:'+((index+1)/total*100)+'%"></span></div>'
    +'<h2 id="guide-title">'+esc(step.title)+'</h2>'
    +'<p id="guide-description">'+esc(step.description)+'</p>'
    +'<p class="guide-tip">'+esc(step.tip)+'</p>'
    +'<nav class="guide-dots" aria-label="Tutorialschritte">'+dots+'</nav>'
    +'<div class="guide-actions"><button type="button" class="button" data-action="guide-close">Beenden</button>'
    +(index>0?'<button type="button" class="button" data-action="guide-prev">'+icon('arrow-left')+' Zurück</button>':'')
    +'<button type="button" class="button primary guide-next" data-action="'+(index===total-1?'guide-finish':'guide-next')+'">'
    +(index===total-1?'Tour abschließen':'Weiter '+icon('arrow-right'))+'</button></div>'
    +'<small class="guide-disclaimer">Nur Navigation und Hinweise · keine Änderung an deinen Reisedaten</small></section>';
}
