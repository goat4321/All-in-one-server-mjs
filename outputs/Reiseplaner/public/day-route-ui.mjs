import { buildMultiStopDay } from './day-route.mjs';
import { esc, btn, chip, status, urlLink } from './ui.mjs';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel } from './google-maps.mjs';
import { groupPrice } from './model.mjs';
import { routeStudioModel, routeStudioSummary } from './route-studio.mjs';

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
  const studio = routeStudioModel(items, route.routes, route.focusIndex);
  const chosen = studio.stops[studio.selectedIndex];
  const focusedLeg = studio.legs[studio.activeLeg];
  const knownWalk = studio.verifiedCount
    ? studio.knownMinutes + ' Min. · ' + (studio.knownMetres / 1000)
      .toLocaleString('de-DE',{maximumFractionDigits:1})+' km berechnet'
    : 'Noch keine echten Gehzeiten';
  const stopControls = studio.stops.map((stop,i)=>{
    const incoming=studio.legs[i-1];
    const selected=i===studio.selectedIndex;
    return '<button type="button" class="route-studio-stop" data-action="day-route-focus" data-value="'
      + i + '" aria-pressed="' + selected + '" aria-label="Stopp ' + (i+1)
      + ' anzeigen: ' + esc(stop.name) + '"><span class="route-studio-number">'
      + (i+1) + '</span><span class="route-studio-stop-copy"><strong>'
      + esc(stop.name) + '</strong><small class="route-studio-position-status"'
      +' data-location-confidence="'+esc(studio.positionQuality.stops[i]?.kind??'none')+'">'
      +esc(studio.positionQuality.stops[i]?.label??'Koordinaten offen')+'</small><small>'
      + (i===0?'Start':incoming?.verified
        ? (incoming.minutes.toLocaleString('de-DE',{maximumFractionDigits:0})+' Min. geprüfter Fußweg')
        :'Verbindung noch nicht berechnet') + '</small></span>'
      + (i<studio.stops.length-1?'<span class="route-studio-arrow" aria-hidden="true">›</span>':'')
      + '</button>';
  }).join('');
  const storyPanel = '<section class="route-studio" aria-label="Interaktives Route Studio">'
    + '<div class="route-studio-header"><div><span class="route-studio-eyebrow">ROUTE STUDIO · LIVE-PLANUNG</span>'
    + '<h3>Deine Tour. Auf einen Blick.</h3>'
    + '<p>' + esc(routeStudioSummary(studio)) + '</p></div>'
    + '<div class="route-studio-kpis"><span><strong>' + studio.stops.length
    + '</strong><small>Stopps</small></span><span><strong>'
    + studio.verifiedCount + '/' + studio.legs.length
    + '</strong><small>echte Wege</small></span></div></div>'
    + (studio.staleGeometryCount
      ? '<div class="route-studio-geowarning" role="alert"><strong>'
        +studio.staleGeometryCount+' bisherige Wegberechnung(en) passen nicht mehr zu den gewählten Stopps.</strong>'
        +'<p>Veraltete Gehzeiten werden nicht übernommen. Mit „Fußwege und Zeiten berechnen“ '
        +'die aktuellen Endpunkte erneut prüfen.</p></div>':'')
    + (studio.positionQuality.reviewCount?'<div class="route-studio-geowarning" role="status">'
      +'<strong>Positionen überprüfen: '+studio.positionQuality.reviewCount+' von '+studio.stops.length+' Stopps</strong>'
      +'<p>Eine berechnete Fußroute verbindet gespeicherte Koordinaten, aber bestätigt keine tatsächlichen Eingänge. '
      +'Anbieterpositionen und Gebietspunkte können vom Ziel abweichen.</p></div>'
      :studio.stops.length?'<p class="route-studio-geo-ok">Quellenpunkte vorhanden; konkrete Eingänge prüfen.</p>':'')
    + '<div class="route-studio-track" role="group" aria-label="Stopps auf der Karte auswählen">'
    + (stopControls || '<p class="route-studio-empty">Füge rechts aus der Ortsliste deinen ersten Stopp hinzu. Hier entsteht deine interaktive Reiseroute.</p>')
    + '</div>'
    + (studio.stops.length ? '<div class="route-studio-spotlight"><div>'
      + '<span class="route-studio-label">AKTUELLER KARTENFOKUS</span><strong>'
      + (studio.selectedIndex+1) + '. ' + esc(chosen?.name) + '</strong>'
      + '<small>' + esc(ctx.cities[chosen?.city]?.name??chosen?.city??'')
      + ' · ' + esc(knownWalk) + '</small></div>'
      + '<div class="route-studio-navigation">'
      + btn('day-route-prev','Zurück','arrow-left','','subtle')
      + btn('day-route-next','Weiter','arrow-right','','subtle')
      + btn('day-route-fit','Ganze Tour zeigen','target') + '</div></div>'
      + '<div class="route-studio-settings" aria-label="Routendarstellung">'
      + chip('day-route-display','Alle Etappen',route.displayMode!=='focus','all','map')
      + chip('day-route-display','Etappe hervorheben',route.displayMode==='focus','focus','pin')
      + '<small>' + esc(focusedLeg?.verified
        ? 'Grün = über echte Straßen/Weggeometrie berechnet.'
        : 'Gestrichelt = schematische Verbindung, keine tatsächliche Wegführung.') + '</small></div>'
      : '')
    + '</section>';
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
    + storyPanel
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
