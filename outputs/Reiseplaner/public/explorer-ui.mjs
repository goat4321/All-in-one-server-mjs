import { EXPLORER_GROUPS, explorerDetail, externalFootUrl } from './map-explorer.mjs';
import { esc, btn, chip, status, urlLink, empty, transitPlanners } from './ui.mjs';

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
      + btn('explorer-route', 'Verbindung prüfen', 'arrow')
      + btn('explorer-clear-route', 'Zurücksetzen', 'reset') + '</div>'
    + '<p role="status" class="explorer-status">' + esc(statusLine) + '</p>'
    + (from && to ? '<div class="inline">' + (urlLink(externalFootUrl(from, to), 'Fußweg in OpenStreetMap') || '')
      + (urlLink(transitUrl, 'ÖPNV beim Betreiber prüfen') || '') + '</div>' : '')
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
    const actions = located ? btn('explorer-start', 'Als Start', 'pin', item.id)
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
      + (located ? '' : ' · Exakter Kartenpunkt nicht belegt') + '</p>'
      + '<div class="row-actions">' + (located ? btn('explorer-focus', 'Auf Karte', 'map', item.id) : '')
      + btn('details', 'Alle Details & Quellen', 'folder', item.id)
      + actions
      + (canPlan ? btn('choose', 'Zum Tagesplan hinzufügen', 'plus', item.id, 'subtle')
        : active && item.kind === 'activity' ? btn('edit', 'Im Plan bearbeiten', 'edit', item.id) : '')
      + '</div></article>';
  }).join('');
  return '<section class="section explorer-list"><div class="subheading"><div><h2>Alle passenden Orte & Angebote</h2>'
    + '<p>' + ex.total + ' Einträge · ' + ex.placed.length + ' mit genauer Position · '
      + ex.unlocated.length + ' ohne belegte Koordinaten</p></div></div>'
    + '<p class="muted">Die Liste enthält auch Einträge ohne genaue Koordinaten. Nicht bestätigte Preise, Öffnungszeiten, Speisekarten und Zimmer werden ausdrücklich als offen angezeigt. Neue Tagespunkte werden nur nach deiner Auswahl gespeichert.</p>'
    + (items.length ? '<div class="explorer-list-grid">' + cards + '</div>' : empty('Keine passenden Einträge', 'Kategorie, Ort oder Suchbegriff ändern.'))
    + (items.length > ex.limit ? '<div class="explorer-more">' + btn('explorer-more', 'Weitere ' + Math.min(60, items.length - ex.limit) + ' anzeigen', 'plus') + '</div>' : '')
    + '</section>';
}
