import {esc,urlLink} from './ui.mjs';

const reference=ctx=>ctx?.trip?.id==='interrail_swiss'
  ?ctx.catalog?.research?.interrailSwissDatedV84??null:null;
const money=cents=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'})
 .format(cents/100);
const cityName={kandersteg:'Kandersteg',appenzell:'Appenzell'};
const sourceLinks=urls=>'<div class="swiss-v84-links">'
  +urls.map((u,i)=>urlLink(u,i===0?'Primärquelle':'Weitere Betreiberinformation')).join('')
  +'</div>';
const linkWithCity=(q)=>'<span class="swiss-v84-provider">'
 +urlLink(q.bookingUrl,'Booking.com · 3 Erwachsene / 2 Nächte prüfen')+'</span>';

const hotelCard=(row,position)=>'<article class="swiss-v84-hotel">'
 +'<div class="swiss-v84-hotel-head">'
 +'<span class="swiss-v84-rank">'+position+'</span>'
 +'<div><strong>'+esc(row.name)+'</strong><small>'+esc(row.address)
   +(row.reviewScore!=null?' · Bewertungsstand '+esc(row.reviewScore.toFixed(1))+'/10':'')
   +'</small></div>'
 +'<span class="swiss-v84-hotel-price">'+money(row.amountCents)+'</span>'
 +'</div>'
 +'<p>Booking.com-Suchpreis für drei Erwachsene und zwei Nächte. '
   +'Bettenaufteilung, abschließende Gebühren, Storno und Verfügbarkeit im Checkout offen.</p>'
 +linkWithCity(row)
 +'</article>';
const cityPanel=(group,archives)=> {
 const original=archives.identityChecks.find(c=>c.correctAddress.startsWith(
   group.city==='kandersteg'?'76 Äussere':'Gaiserstrasse'));
 const baseline=archives.stats.oldOriginalComparisons.find(x=>
   x.originalId===(group.city==='kandersteg'?'iv-kandersteg':'iv-appenzell'));
 const room=group.rows.find(x=>x.propertyId===original?.propertyId);
 return '<section class="swiss-v84-city" data-city="'+esc(group.city)+'">'
  +'<div class="swiss-v84-city-head"><h3>'+esc(cityName[group.city])+'</h3>'
  +'<span>'+esc(group.checkin)+'–'+esc(group.checkout)
   +' · 3 Erwachsene · 2 Nächte</span></div>'
  +'<p class="swiss-v84-cheapest">Günstigster angezeigter Suchpreis: '
    +'<strong>'+money(group.rows[0].amountCents)+'</strong>'
    +' · '+esc(group.rows[0].name)+'</p>'
  +(original&&room?'<p class="swiss-v84-identity"><b>Identitätsprüfung:</b> '
    +esc(original.correctName)+' ('+esc(original.correctAddress)+') ist '
    +'<b>nicht dieselbe Unterkunft</b> wie '+esc(original.notSameAsName)
    +' ('+esc(original.notSameAsAddress)+'). '
    +esc(original.providerQa)+'</p>':'')
  +(baseline?'<p class="swiss-v84-compare">Bisheriger Tripsy-Richtwert: '
    +money(baseline.originalEuroCents)+' · neue Suchanzeige zum gleichen Objektnamen: '
    +money(baseline.currentDatedSearchCents)+'. '
    +'Der Unterschied ist kein Buchungsrabatt.</p>':'')
  +'<div class="swiss-v84-list">'+group.rows.slice(0,5).map((r,i)=>hotelCard(r,i+1)).join('')+'</div>'
  +'<details class="swiss-v84-more"><summary>Weitere 5 Unterkünfte anzeigen</summary>'
  +'<div class="swiss-v84-list">'+group.rows.slice(5).map((r,i)=>hotelCard(r,i+6)).join('')+'</div>'
  +'</details></section>';
};
export function swissDatedSearchBoardV84(ctx){
 const d=reference(ctx);if(!d)return '';
 return '<section class="swiss-v84-board section" aria-label="Interrail Schweiz · datierte Drei-Personen-Preissuche">'
 +'<header><span class="swiss-v84-kicker">SUCHERGEBNISSE · 17. NOVEMBER 2026</span>'
 +'<h2>20 Preise für eure tatsächlichen September-2027-Nächte</h2>'
 +'<p>Booking.com-Suchergebnisse: <b>3 Erwachsene · 1 Unterkunft/Zimmer · jeweils 2 Nächte</b>. '
  +'Die Preise sind veröffentlichte Suchanzeigen, keine vollständigen Zimmer-Checkouts. '
  +'Es wurde keine Unterkunft ausgewählt oder gebucht.</p></header>'
 +'<div class="swiss-v84-summary"><span>Günstigste Suchkombination '
  +'<strong>'+money(d.stats.cheapestDisplayedCombinationCents)+'</strong> '
  +'<small>Kandersteg + Appenzell, insgesamt 4 Nächte für die Dreiergruppe, '
   +'vor eventuell fehlenden Zusatzkosten</small></span>'
  +'<span>20 <small>vergleichbare Suchanzeigen</small></span></div>'
 +d.quotes.map(g=>cityPanel(g,d)).join('')
 +'<p class="swiss-v84-disclaimer"><b>Wichtig:</b> Verfügbar im Suchergebnis heißt nicht '
  +'garantiert buchbar. Verbindlich sind erst die konkrete Zimmer-/Bettenwahl und der '
  +'abschließende Checkout inklusive Gebühren. Währungsumrechnung zu CHF-Betreiberlisten '
  +'wird nicht als aktueller Wechselkurs behauptet.</p>'
 +'</section>';
}
export function swissRailPrecisionV84(ctx){
 const d=reference(ctx);if(!d)return '';
 return '<details class="swiss-v84-rail section">'
  +'<summary><span class="swiss-v84-kicker">NEUE BAHNPRÜFUNG · OFFIZIELLE LINIENREFERENZEN</span>'
  +'<strong>Brig–Kandersteg ohne Spiez-Umweg prüfen + Reservierungen</strong>'
  +'<small>4 gezielte Hinweise: Lötschberg-Bergstrecke, EuroCity, Wasserauen, Oeschinensee</small></summary>'
  +'<div class="swiss-v84-rail-grid">'+d.railClarifications.map(r=>
    '<article class="swiss-v84-rail-note"><strong>'+esc(r.topic)+'</strong>'
     +'<p>'+esc(r.summary)+'</p>'
     +'<p class="swiss-v84-rail-check"><b>Prüfung:</b> '+esc(r.check)+'</p>'
     +'<small>'+(r.train2027Confirmed
      ?'Veröffentlichte Gondel-Saison 2027; individuelle Tickets noch offen'
      :'Linien-/Tarifreferenz, kein bestätigter Zugfahrplan 2027')
      +'</small>'+sourceLinks(r.sourceUrls)+'</article>').join('')
  +'</div></details>';
}
