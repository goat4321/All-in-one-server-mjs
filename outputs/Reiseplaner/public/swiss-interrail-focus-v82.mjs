import {esc,urlLink} from './ui.mjs';
const focus=ctx=>ctx?.trip?.id==='interrail_swiss'
 ?ctx.catalog?.research?.interrailSwissFocusV82??null:null;
const sourceLinks=(urls,labels=[])=>'<div class="swiss-focus-links">'
 +urls.map((u,i)=>urlLink(u,labels[i]??'Offizielle Quelle '+(i+1))).join('')+'</div>';
const dateLabel=date=>new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'})
 .format(new Date(date+'T12:00:00Z'));
const passport=(row)=>'<li><span class="swiss-focus-pass-date">'+esc(dateLabel(row.date))+'</span>'
 +'<strong>'+esc(row.from)+' → '+esc(row.to)+'</strong>'
 +(row.critical?'<small>Umstiege / Reservierungen zuerst prüfen</small>':'')
 +'</li>';
/** Focused executive control on the existing Interrail-Swiss variant ONLY.
 * Strictly read-only. Existing controls navigate to existing day plans.
 */
export function swissInterrailOverviewV82(ctx){
 const d=focus(ctx);if(!d)return '';
 const issues=d.priority.map(row=>
   '<article class="swiss-focus-task swiss-focus-task-'+esc(row.severity)+'">'
    +'<div class="swiss-focus-task-head"><span>'+esc(dateLabel(row.date))+'</span>'
    +'<strong>'+esc(row.title)+'</strong></div>'
    +'<p>'+esc(row.detail)+'</p>'
    +'<p class="swiss-focus-next"><b>Nächster Schritt:</b> '+esc(row.action)+'</p>'
    +sourceLinks(row.sourceUrls,['Betreiber / Regel','Weitere offizielle Quelle','Weg- und Betriebsstatus'])
    +'</article>').join('');
 return '<section class="swiss-focus-overview section" aria-label="Interrail Schweiz · konkrete Reiseprüfung">'
  +'<header class="swiss-focus-head"><div><span class="swiss-focus-kicker">EXKLUSIV · INTERRAIL MIT SCHWEIZ-ABSCHLUSS</span>'
  +'<h2>Schweiz-Finale: 5 Tage gezielt vorbereiten</h2>'
  +'<p>Kandersteg und Appenzell · 10.–14. September 2027 · '+ctx.people.length
  +' Personen. Die sieben Fernreisetage sind schon fest als Entwurf verteilt, nicht gebucht.</p></div>'
  +'<span class="swiss-focus-count">7 / 7<br><small>Pass-Tage verplant</small></span></header>'
  +'<div class="swiss-focus-stats">'
  +'<div><strong>12 Std. 10 Min.</strong><small>Nizza–Kandersteg laut unbestätigtem Tripsy-Zeitfenster</small></div>'
  +'<div><strong>11.09.</strong><small>Oeschinensee: veröffentlichter Sommerbetrieb 2027</small></div>'
  +'<div><strong>13.09.</strong><small>Wasserauen: separates Regionalticket prüfen</small></div>'
  +'</div>'
  +'<div class="swiss-focus-task-grid">'+issues+'</div>'
  +'<details class="swiss-focus-pass"><summary><strong>Welche sieben Tage verbraucht der Pass?</strong>'
  +'<span>Alle Fernreisetage und der zusätzliche lokale Ausflug</span></summary>'
  +'<ol>'+d.passDays.map(passport).join('')+'</ol>'
  +'<p>Der zusätzliche Zugausflug Appenzell ↔ Wasserauen am 13.09. ist nicht als 8. Interrail-Tag enthalten. '
  +'Separates Ticket für die drei Reisenden prüfen. Ein ausgefüllter Pass-Reisetag ist keine bestätigte Reservierung.</p>'
  +sourceLinks(['https://www.interrail.com/en/support/interested-in-interrailing/what-is-a-travel-day',
    'https://appenzellerbahnen.ch/de/reiseinformationen/fahrplan.html'],
    ['Interrail · Reisetag-Regel','Appenzeller Bahnen · Fahrplan'])
  +'</details>'
  +'<div class="swiss-focus-day-shortcuts"><span>Zum konkreten Tag:</span>'
  +d.days.map(day=>'<button type="button" data-action="day-plan-go" data-value="'+esc(day.date)+'">'
    +esc(dateLabel(day.date))+' · '+esc(day.city==='kandersteg'?'Kandersteg':'Appenzell')
    +'</button>').join('')+'</div>'
  +'<p class="swiss-focus-caveat">Betriebsreferenzen und Planungshypothesen sind bewusst getrennt. Keine '
   +'2027er Zugfahrplan- oder Preisgarantie; Routen, Unterkünfte und Buchungen wurden nicht geändert.</p>'
  +'</section>';
}
export function swissInterrailDayV82(ctx){
 const d=focus(ctx);if(!d)return '';
 const day=d.days.find(x=>x.date===ctx.date);if(!day)return '';
 const details=day.mustCheck.map(x=>'<li>'+esc(x)+'</li>').join('');
 return '<aside class="swiss-focus-day swiss-focus-day-'+esc(day.level)
  +'" aria-label="Schweizer Tagesplanung mit Prüfhinweisen">'
  +'<div class="swiss-focus-day-head"><strong>'+esc(day.label)+'</strong>'
  +'<span>'+esc(day.lead)+'</span></div>'
  +'<p class="swiss-focus-day-plan">'+esc(day.plan)+'</p>'
  +'<details><summary>Schlechtwetter-Alternative und Prüfungen ansehen</summary>'
  +'<p><b>Alternative:</b> '+esc(day.alternatives)+'</p>'
  +'<ul>'+details+'</ul>'
  +sourceLinks(day.sourceUrls,['Offizieller Reiseplaner / Betreiber','Tour- oder Ticketbedingungen','Weitere geprüfte Quelle'])
  +'</details>'
  +'<small>Unverbindlicher Tagesentwurf · keine automatisch ausgewählten Aktivitäten oder 2027-Tickets.</small>'
  +'</aside>';
}
export function swissInterrailRailV82(ctx){
 const d=focus(ctx);if(!d)return '';
 const group=d.corridors.map((route)=>
  '<article class="swiss-focus-corridor"><header><strong>'+esc(route.title)+'</strong>'
   +'<small>'+esc(route.kind)+'</small></header>'
   +'<p>'+esc(route.note)+'</p>'
   +'<p class="swiss-focus-target">'+esc(route.preferredFor)+'</p>'
   +sourceLinks(route.sourceUrls,['Betreiberfahrplan','Anschluss / SBB','Pass- und Reservierungsregel'])
   +'</article>').join('');
 return '<section class="section swiss-focus-rail" aria-label="Bahnrouten für Interrail Schweiz">'
  +'<header><span class="swiss-focus-kicker">RISIKO-CHECK · INTERRAIL SCHWEIZ</span>'
  +'<h2>Schweiz-Verbindungen: noch nicht als reale Züge bestätigt</h2>'
  +'<p>Die beiden Nizza–Kandersteg-Korridore müssen als komplette Reise mit passender Ankunft verglichen werden. '
   +'Ein einzelner passender Zug nach Genf oder Mailand genügt nicht.</p></header>'
  +'<div class="swiss-focus-corridor-grid">'+group+'</div>'
  +'<p class="swiss-focus-rail-foot">Wichtig: 7 von 7 Pass-Reisetagen für Fernstrecken. Wasserauen am 13.09. '
   +'separat kalkulieren; Gondelbahnen, Sitzreservierungen und lokale Züge nicht als kostenlos voraussetzen.</p>'
  +'</section>';
}
