import { buildMultiStopDay } from './day-route.mjs';
import { esc, btn, status, urlLink } from './ui.mjs';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel } from './google-maps.mjs';
import { groupPrice } from './model.mjs';

export function dayRouteView(ctx) {
  if (!ctx.explorer) return '';
  const route = ctx.dayRoute;
  const items = route.items;
  let preview = null;
  if (items.length >= 2) {
    try { preview = buildMultiStopDay(items, route.routes, route.time); }
    catch (error) { preview = { complete:false, status:error.message, rows:[] }; }
  }
  const costs = items.map(i => (i.effectivePrice ?? i.price)?.currency === 'EUR' ? groupPrice(i.effectivePrice ?? i.price, ctx.people.length) : null);
  const sum = costs.filter(n=>Number.isSafeInteger(n)).reduce((a,b)=>a+b,0);
  const missing = costs.filter(n=>n==null).length;
  return '<section class="panel panel-pad day-route-builder" aria-label="Mehrstopp-Tagesroute">'
    + '<div class="subheading compact"><div><h2>Mehrstopp-Tagesroute</h2>'
    + '<p>2–8 Stopps aus der Ortsliste sammeln und als zusammenhängenden Tag prüfen</p></div>'
    + '<span class="muted">' + items.length + '/8 gewählt · ' + esc(ctx.cities[ctx.city]?.name ?? ctx.city)
      + ' · ' + esc(ctx.date) + '</span></div>'
    + '<div class="day-route-controls"><label>Start um <input id="day-route-start" type="time" value="'
      + esc(route.time) + '"></label>'
      + btn('day-route-optimize','Reihenfolge vorschlagen','shuffle')
      + btn('day-route-check','Fußwege und Zeiten berechnen','walk')
      + btn('day-route-clear','Liste leeren','reset') + '</div>'
    + '<p class="muted">Zwischen den gewählten Stopps findest du jetzt direkte Google-Maps-ÖPNV-Routen, deren Fahrplan und Fahrtzeit erst Google Maps bestimmt. Die Zeitplanung unten rechnet weiter ausschließlich mit berechneten Fußwegen.</p>'
    + '<p class="muted">„Reihenfolge vorschlagen“ verwendet nur Luftlinienentfernungen. Die echte Gehzeit entsteht ausschließlich aus den tatsächlich berechneten Fußwegen. Bestehende Buchungen werden nie verändert.</p>'
    + (items.length ? '<ol class="day-route-stops">' + items.map((item,i) =>
      '<li><div><strong>' + esc(item.name) + '</strong><small>'
      + esc(ctx.cities[item.city]?.name ?? item.city) + ' · '
      + (item.duration == null ? '60 Min. angenommene Besuchsdauer' : item.duration + ' Min. laut Planung')
      + '</small></div><div class="row-actions">'
      + (urlLink(googleMapsSearchUrl(item,ctx.cities),googleMapsSearchLabel(item)) || '')
      + (i > 0 ? (urlLink(googleMapsDirectionsUrl(items[i-1],item,ctx.cities,'transit'),'ÖPNV vom vorigen Stopp') || '') : '')
      + btn('day-route-up','Hoch','arrow-up',item.id) + btn('day-route-down','Runter','arrow-down',item.id)
      + btn('day-route-remove','Entfernen','x',item.id)
      + '</div></li>').join('') + '</ol>' : '<p>Wähle in der Ortsliste „Zur Tagesroute“.</p>')
    + (preview && preview.rows.length ? '<div class="day-route-preview"><h3>Zeitliche Vorschau</h3>'
      + preview.rows.map(r => '<p><strong>' + r.at + '–' + r.until + '</strong> · '
        + esc(r.name) + (r.walkMinutes != null ? ' · Fußweg vorher: ' + r.walkMinutes + ' Min.' : '')
        + (r.durationAssumed ? ' · <em>Dauer geschätzt</em>' : '') + '</p>').join('') + '</div>' : '')
    + (route.status ? '<p class="muted" role="status">' + esc(route.status) + '</p>' : '')
    + '<p class="explorer-status" role="status">' + esc(preview?.status ?? (items.length === 1
      ? 'Wähle einen zweiten Stopp, um die Route zu berechnen.' : 'Noch keine Stopps gewählt.')) + '</p>'
    + '<p><strong>Kostenreferenzen der Stopps:</strong> '
      + esc(new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(sum/100))
      + ' bekannte EUR-Beträge' + (missing ? ' · ' + missing + ' Preise oder Währungsumrechnung offen' : '') + '</p>'
    + (preview?.complete ? btn('day-route-commit','Alle Stopps mit diesen Zeiten in den Tagesplan übernehmen','check','','primary') : '')
    + '<p class="muted">Nicht enthalten: noch unbestätigte Tickets, Nahverkehrspreise und Wetterabhängigkeiten. Vor dem Speichern werden Terminüberschneidungen und Reisestatus geprüft.</p>'
    + '</section>';
}
