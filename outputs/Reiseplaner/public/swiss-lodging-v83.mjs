import {esc,urlLink} from './ui.mjs';

const research=ctx=>ctx?.trip?.id==='interrail_swiss'
 ?ctx.catalog?.research?.interrailSwissLodgingV83??null:null;
const eur=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'})
 .format(v);
const dates={kandersteg:'10.–12.09.2027',appenzell:'12.–14.09.2027'};
const names={kandersteg:'Kandersteg',appenzell:'Appenzell'};
const kind={hotel:'Hotel',hostel:'Hostel',apartment:'Ferienwohnung',guesthouse:'Pension'};
const links=(row)=>'<div class="swiss-stay-links">'
 +urlLink(row.sourceUrl,'Zimmer beim Originalanbieter prüfen')
 +(row.secondaryUrls??[]).slice(0,2).map((u,i)=>urlLink(u,
   i===0?'Zweite Betreiberquelle':'Weitere Bedingung')).join('')
 +urlLink('https://www.google.com/maps/search/?api=1&query='
    +encodeURIComponent(row.mapsQuery),'Standort in Google Maps suchen')
 +'</div>';
const originalCard=row=>'<article class="swiss-stay-original">'
 +'<span class="swiss-stay-small">BISHERIGE TRIPSY-OPTION · NICHT GEBUCHT</span>'
 +'<strong>'+esc(row.name)+'</strong>'
 +'<p class="swiss-stay-original-price">'+eur(row.historicEuroTotal)
   +' <small>für 3 Personen / 2 Nächte · historischer Entwurf in EUR</small></p>'
 +'<p>'+esc(row.identityWarning)+'</p>'
 +'</article>';
const optionCard=row=>'<article class="swiss-stay-candidate">'
 +'<div class="swiss-stay-candidate-title"><span>'+esc(kind[row.category]??'Unterkunft')+'</span>'
 +'<strong>'+esc(row.name)+'</strong></div>'
 +'<p class="swiss-stay-price">'+esc(row.price)+'</p>'
 +'<div class="swiss-stay-features"><span>Betten: '+esc(row.bedConfiguration)+'</span>'
 +'<span>Bad: '+esc(row.bathroom)+'</span>'
 +'<span>Küche: '+esc(row.kitchen)+'</span></div>'
 +'<details class="swiss-stay-expand"><summary>Ankunft, Lage und Risiken prüfen</summary>'
 +'<div class="swiss-stay-more"><p><b>Check-in:</b> '+esc(row.checkin)+'</p>'
 +'<p><b>Anfahrt & Einordnung:</b> '+esc(row.practical)+'</p>'
 +'<p class="swiss-stay-critical"><b>Vor Zahlung klären:</b> '+esc(row.risk)+'</p>'
 +links(row)
 +'</div></details>'
 +'<small class="swiss-stay-disclaimer">Quelle: '+esc(row.checkedOn)
   +' · kein bestätigter Endpreis, keine Verfügbarkeit 2027</small>'
 +'</article>';
const issueCard=row=>'<li class="swiss-stay-check-'+esc(row.severity)+'">'
 +'<strong>'+esc(row.title)+'</strong><p>'+esc(row.text)+'</p>'
 +'<div class="swiss-stay-links">'
 +row.sourceUrls.map((x,i)=>urlLink(x,i===0?'Primärquelle':'Weitere offizielle Quelle')).join('')
 +'</div></li>';
export function swissLodgingSummaryV83(ctx){
 const d=research(ctx);if(!d)return '';
 return '<section class="swiss-stay-summary section" aria-label="Schweizer Unterkünfte für drei Personen">'
 +'<div class="swiss-stay-summary-copy"><span class="swiss-stay-small">SCHWEIZ · 3 REISENDE · 2 NÄCHTE JE ORT</span>'
 +'<strong>Kandersteg und Appenzell: Unterkünfte ohne unbestätigte Preisversprechen vergleichen</strong>'
 +'<p>2 alte Tripsy-Preiswerte, 8 individuell recherchierte Zimmer-/Unterkunftsoptionen, '
 +d.checks.length+' dokumentierte Buchungsprüfungen. '
 +'Die Preise werden nicht zwischen CHF und EUR umgerechnet und nicht ins aktive Budget übernommen.</p></div>'
 +'<button type="button" data-action="page" data-value="lodging">Unterkünfte vergleichen</button>'
 +'</section>';
}
export function swissLodgingCompareV83(ctx){
 const d=research(ctx);if(!d)return '';
 return '<section class="swiss-stay-board section" aria-label="Interrail Schweiz · Unterkunftsvergleich 3 Personen">'
 +'<header class="swiss-stay-head"><span class="swiss-stay-small">INTERRAIL SCHWEIZ · UNTERKÜNFTE FÜR DREI</span>'
 +'<h2>8 Betreiberoptionen statt unbestätigter Hotelpreise</h2>'
 +'<p>Die 2 bisherigen Tripsy-Unterkünfte bleiben im Reiseplan unverändert. '
 +'Verglichen werden nur nachweisbare Zimmerarten und veröffentlichte Preisreferenzen. '
 +'Angebote für September 2027, Betten und Check-out-Gesamtsummen sind nicht bestätigt.</p></header>'
 +['kandersteg','appenzell'].map(city=>{
  const o=d.originals.find(x=>x.city===city);
  const rooms=d.candidates.filter(x=>x.city===city);
  return '<div class="swiss-stay-city" data-city="'+esc(city)+'">'
   +'<header class="swiss-stay-city-head"><h3>'+esc(names[city])+'</h3>'
   +'<span>'+esc(dates[city])+' · 3 Personen · 2 Nächte</span></header>'
   +(o?originalCard(o):'')
   +'<div class="swiss-stay-cards">'+rooms.map(optionCard).join('')+'</div>'
   +'</div>';
 }).join('')
 +'<details class="swiss-stay-checks" open><summary>'
  +'<strong>5 wichtige Prüfungen vor einer Unterkunftsbuchung</strong>'
  +'<small>Spätanreise, Mindestnächte, KISC-Sperrzeit, Betreiberpreiswiderspruch, Ferienkarte</small>'
  +'</summary><ol>'+d.checks.map(issueCard).join('')+'</ol></details>'
 +'<p class="swiss-stay-endnote">Nicht vergleichbar: historische EUR-Tripsy-Gruppensummen '
 +'und heutige CHF-Betreiberpreise. Für alle acht Optionen eine Anfrage für exakt '
 +'3 Erwachsene und 2 Nächte einschließlich Steuern, Frühstück, Reinigung, Storno '
 +'und möglicher später Schlüsselübergabe durchführen.</p>'
 +'</section>';
}

/** Expose the real connection between the unverified late rail arrival and
 * overnight eligibility without suggesting an actual time or a hotel booking.
 */
export function swissLodgingRailNoteV83(ctx){
 const d=research(ctx);if(!d)return '';
 const issues=d.checks.filter(x=>['late-arrival','kisc-boundary'].includes(x.id));
 return '<aside class="swiss-stay-rail-note" aria-label="Kandersteg Ankunft und Unterkunft">'
  +'<strong>Wichtige Anschlussprüfung: Nizza → Kandersteg am 10. September</strong>'
  +issues.map(x=>'<p><b>'+esc(x.title)+':</b> '+esc(x.text)+'</p>').join('')
  +'<button type="button" data-action="page" data-value="lodging">'
  +'Passende 3er-Unterkünfte vergleichen</button>'
  +'<small>Der Reisefahrplan und die Ankunftszeit 2027 sind unbestätigt; keine Unterkunft ist gebucht.</small>'
  +'</aside>';
}
