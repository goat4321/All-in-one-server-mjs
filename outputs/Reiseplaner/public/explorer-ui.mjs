import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel, googleMapsPlaceQuery, googleMapsLocationStatus } from './google-maps.mjs';
import { EXPLORER_GROUPS, explorerDetail, externalFootUrl, externalTransitUrl } from './map-explorer.mjs';
import { esc, btn, chip, status, urlLink, empty, transitPlanners } from './ui.mjs';
import { dayRouteView } from './day-route-ui.mjs';

export function explorerToolbar(ctx) {
  const ex = ctx.explorer;
  if (!ex) return '';
  const keys = Object.entries(EXPLORER_GROUPS);
  const from = ex.connection?.from, to = ex.connection?.to;
  const route = ex.connection?.route;
  const statusLine = route?.mode === 'Fußweg'
    ? 'Berechneter Fußweg über Straßen und Wege · ' + route.minutes + ' Min. · '
      + (route.metres / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' km'
    : route?.legs?.length ? 'ÖPNV-Referenzfahrplan · ' + route.minutes + ' Min. · nur für gültige Fahrplandaten'
      : ex.connection?.status ?? 'Wähle auf Karte oder Liste zuerst Start und Ziel.';
  const transitUrl = transitPlanners[from?.city ?? ctx.city];
  return '<section class="panel explorer-toolbar" aria-label="Karten-Explorer-Steuerung">'
    + '<div class="explorer-scope"><strong>Orte anzeigen</strong>'
    + chip('explorer-scope', 'Gesamte Reise', ex.scope === 'trip', 'trip', 'map')
    + chip('explorer-scope', 'Nur ' + (ctx.cities[ctx.city]?.name ?? ctx.city), ex.scope === 'city', 'city', 'pin')
    + '<span class="muted">' + ex.placed.length + ' Kartenpunkte · ' + ex.unlocated.length + ' ohne genaue Koordinaten</span></div>'
    + '<div class="explorer-search"><label for="map-search">Orte und Angebote durchsuchen</label>'
    + '<input id="map-search" type="search" maxlength="100" value="' + esc(ex.search) + '" placeholder="Ort, Restaurant, Hostel, Sehenswürdigkeit …">'
    + btn('explorer-search', 'Suchen', 'search') + '</div>'
    + '<div class="explorer-categories" aria-label="Orte filtern">'
    + chip('explorer-group', 'Alle Kategorien', ex.group === 'all', 'all')
    + keys.map(([id, group]) => '<button class="explorer-chip" type="button" data-action="explorer-group" data-value="'
      + id + '" aria-pressed="' + (ex.group === id) + '"><i class="category-swatch ' + id
      + '"></i>' + esc(group.label) + '</button>').join('') + '</div>'
    + '<div class="explorer-directions"><div><strong>Route von A nach B</strong><p class="muted">'
    + esc(from?.name ?? 'Startpunkt wählen') + ' → ' + esc(to?.name ?? 'Zielpunkt wählen') + '</p></div>'
    + '<div class="inline">' + chip('explorer-mode', 'Zu Fuß', ex.routeMode === 'walk', 'walk', 'walk')
      + chip('explorer-mode', 'ÖPNV', ex.routeMode === 'transit', 'transit', 'train')
      + '<label for="explorer-time">Abfahrt</label><input id="explorer-time" type="time" value="' + esc(ex.routeTime) + '">'
      + btn('explorer-route', 'Verbindung prüfen', 'arrow')
      + btn('explorer-clear-route', 'Zurücksetzen', 'reset') + '</div>'
    + '<p role="status" class="explorer-status">' + esc(statusLine) + '</p>'
    + (from && to ? '<div class="inline">' + (ex.routeMode === 'walk' ? (urlLink(externalFootUrl(from, to), 'Fußweg in OpenStreetMap') || '') : '')
      + (urlLink(externalTransitUrl(from, to,ctx.cities), 'Google Maps · ÖPNV A → B') || '')
      + (urlLink(googleMapsDirectionsUrl(from,to,ctx.cities,'walking'), 'Google Maps · Zu Fuß A → B') || '')
      + (urlLink(transitUrl, 'Verkehrsbetrieb / Tarife prüfen') || '') + '</div>' : '')
    + '<p class="muted">Nur berechnete Fußwege werden als reale Straßen dargestellt. Fehlende oder außerhalb des Datenzeitraums liegende ÖPNV-Fahrten werden nicht geschätzt.</p>'
    + '</div></section>';
}

export function explorerList(ctx) {
  const ex = ctx.explorer;
  if (!ex) return '';
  const items = [...ex.placed, ...ex.unlocated];
  const cards = items.slice(0, ex.limit).map(item => {
    const details = explorerDetail(item, ctx.people.length);
    const category = item.explorerCategory;
    const located = Array.isArray(item.point) && item.point.length === 2;
    const active = ctx.activeSet.has(item.id);
    const canPlan = !active && item.kind !== 'transport';
    // A and B can be researched in Google Maps even before an exact POI pin is confirmed.
    // Internal OSRM/GTFS routing still requires exact coordinates.
    const actions = googleMapsPlaceQuery(item,ctx.cities)
      ? btn('explorer-start', 'Als Start', 'pin', item.id)
        + btn('explorer-end', 'Als Ziel', 'arrow', item.id) : '';
    return '<article class="explorer-place panel" data-place-id="' + esc(item.id) + '">'
      + '<div class="explorer-place-title"><span class="category-swatch ' + category + '"></span><div><h3>'
      + esc(item.name) + '</h3><small>' + esc(ctx.cities[item.city]?.name ?? item.city) + ' · '
      + esc(details.group.label) + '</small></div>' + (active ? status('Im Plan', 'green') : '') + '</div>'
      + '<p class="explorer-description">' + esc(details.description) + '</p>'
      + '<div class="explorer-facts"><span><strong>Preis:</strong> ' + esc(details.priceText) + '</span>'
      + '<span><strong>Öffnung:</strong> ' + esc(details.hours) + '</span>'
      + (item.address ? '<span><strong>Adresse:</strong> ' + esc(item.address) + '</span>' : '')
      + details.extra.slice(0, 5).map(line => '<span>' + esc(line) + '</span>').join('')
      + '</div>'
      + '<p class="muted">Quellenstand: ' + esc(details.sourceStatus)
      + ' · ' + esc(googleMapsLocationStatus(item)) + '</p>'
      + (item.positionIssue ? '<p class="muted">Positionskonflikt: ' + esc(item.positionIssue) + '</p>' : '')
      + '<div class="row-actions">' + (located ? btn('explorer-focus', 'Auf Karte', 'map', item.id) : '')
      + (urlLink(googleMapsSearchUrl(item,ctx.cities),googleMapsSearchLabel(item)) || '')
      + (urlLink(googleMapsDirectionsUrl(null,item,ctx.cities,'transit'),'Google Maps · ÖPNV-Anreise') || '')
      + btn('details', 'Alle Details & Quellen', 'folder', item.id)
      + (!located && item.address && !item.booked ? btn('geocode-lookup', 'Kartenstandort prüfen', 'pin', item.id) : '')
      + actions
      + (canPlan && located ? btn('day-route-add','Zur Mehrstopp-Route','plus',item.id) : '')
      + (canPlan ? btn('choose', 'Zum Tagesplan hinzufügen', 'plus', item.id, 'subtle')
        : active && item.kind === 'activity' ? btn('edit', 'Im Plan bearbeiten', 'edit', item.id) : '')
      + '</div></article>';
  }).join('');
  return '<section class="section explorer-list"><div class="subheading"><div><h2>Alle passenden Orte & Angebote</h2>'
    + '<p>' + ex.total + ' Einträge · ' + ex.placed.length + ' mit genauer Position · '
      + ex.unlocated.length + ' ohne belegte Koordinaten</p></div></div>'
    + '<p class="muted">Alle Angebote haben eine ortsbezogene Google-Maps-Suche sowie einen ÖPNV-Anreiselink. Bei fehlendem Pin wird nach Name/Adresse gesucht; Airbnb zeigt nur den bekannten Ortsbereich. Google ermittelt Fahrten erst beim Öffnen, es werden keine 2027er Zeiten vorgetäuscht.</p>'
    + (items.length ? '<div class="explorer-list-grid">' + cards + '</div>' : empty('Keine passenden Einträge', 'Kategorie, Ort oder Suchbegriff ändern.'))
    + (items.length > ex.limit ? '<div class="explorer-more">' + btn('explorer-more', 'Weitere ' + Math.min(60, items.length - ex.limit) + ' anzeigen', 'plus') + '</div>' : '')
    + '</section>';
}


const themeNames = {
  arrive_and_explore:'Ankommen und Erkunden', active_exploration:'Aktiv die Stadt erkunden',
  arrival_beach:'Anreise und Strand', high_activity:'Aktiver Tag', flex_day:'Flexibler Tag',
  arrival_relaxed:'Entspannte Anreise', nature_and_water:'Natur und Wasser',
  arrival_coast:'Anreise an die Küste', swim_and_view:'Schwimmen und Aussicht',
  arrival_old_town:'Ankommen in der Altstadt', scenic_coast:'Küstenpanorama',
  arrival_city:'Ankunft und Stadtbesuch', choose_group_water:'Inseln / Wasser als Gruppe wählen',
  return_train:'Rückfahrt – keine festen Aktivitäten',
};
const noteNames = {
  pause_after_train:'Nach der Anreise Pausen einplanen.',
  'C prefers more art than Naol; choose alternative rather than mandatory visit':'Architektur/Museum als freiwillige Paralleloption, nicht als Pflicht.',
  night_arrival_and_sleep:'Späte Ankunft: Erholung und Schlaf priorisieren.',
  'only planned club night on trip; do not force payment':'Optionale Clubnacht: kein Eintritt ohne bewusste Auswahl.',
  'rotate preferences, optional individual activity':'Unterschiedliche Interessen durch freiwillige Aktivitäten ausgleichen.',
  'train buffer':'Puffer für Umsteigen und Verspätungen lassen.',
  'allow leisure, heat-aware':'Erholung, Hitze und Schatten berücksichtigen.',
  'train connection buffer':'Puffer für Bahnanschluss lassen.',
  '2027 park closes 20:00':'Parkschließung um 20:00 Uhr laut bisheriger Referenz – am Reisetag erneut prüfen.',
  'check park possible closure':'Mögliche Parkschließung oder Öffnungszeiten erneut prüfen.',
  'long rail day':'Längerer Bahntag – keine überfrachtete Planung.',
  'island fares can exceed cheap local visit':'Inseltickets und Rückfahrten können einen günstig wirkenden Besuch verteuern.',
  'no fixed attractions before train':'Vor dem Rückreisezug keine festen Aktivitäten eintragen.',
};

export function explorerDayStrip(ctx) {
  if (!ctx.explorer) return '';
  const idea = ctx.catalog.research?.daySuggestions?.find(x => x.date === ctx.date && x.city === ctx.cityForDay(ctx.date));
  const info = ctx.catalog.research?.cityCoverage?.[ctx.city];
  const suggestions = idea ? [...idea.anchors.map(x=>({...x,role:'Tagesanker'})),
    ...idea.alternatives.map(x=>({...x,role:'Optional'}))] : [];
  return '<section class="explorer-day"><div class="days" aria-label="Reisetag auswählen">'
    + ctx.dates.map(date => '<button type="button" class="day" data-action="day" data-value="' + esc(date)
      + '" aria-pressed="' + (date === ctx.date) + '"><strong>' + esc(date.split('-').reverse().slice(0,2).join('.'))
      + '</strong><small>' + esc(ctx.cities[ctx.cityForDay(date)]?.name ?? 'Reise') + '</small></button>').join('')
    + '</div>'
    + (info ? '<p class="muted">Vorhandenes Stadtpaket ' + esc(ctx.cities[ctx.city]?.name ?? ctx.city)
      + ': ' + info.activityCount + ' Aktivitäten, ' + info.lodgingCount + ' Unterkunftskandidaten, '
      + info.quoteCount + ' Hotel-Suchpreise. Keine vollständigen 2027er Fahrpläne, finalen Zimmer-Checkouts oder verifizierten ÖPNV-Routen im alten Paket.</p>' : '')
    + (idea ? '<div class="panel explorer-ideas"><div><strong>Tagesideen aus deinem älteren Reiseprofil · '
      + esc(themeNames[idea.theme] ?? idea.theme) + '</strong><p class="muted">'
      + esc(noteNames[idea.note] ?? idea.note) + '</p></div><div class="explorer-idea-list">'
      + suggestions.map(row => '<div><span>' + esc(row.role + ': ' + row.name) + '</span>'
        + (row.candidateId && ctx.all.some(i => i.id === row.candidateId && !ctx.activeSet.has(i.id))
          ? btn('choose','Für diesen Tag prüfen','plus',row.candidateId) : status('Original / bereits vorhanden'))
        + '</div>').join('')
      + '</div><small>Nur Vorschläge. Keine Termine, Preise oder Buchungen wurden automatisch übernommen.</small></div>'
      : '<p class="muted">Für diesen Tag liegt keine frühere Tagesvorlage vor. Nutze Karte, Filter und „Zum Tagesplan hinzufügen“, um ihn selbst zu gestalten.</p>')
    + '</section>';
}

