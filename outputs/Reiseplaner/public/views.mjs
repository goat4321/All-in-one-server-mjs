import { categories, budgetBreakdown, calculateBudget, activeItems, conflicts, groupPrice, groceryBasket, interrail, localParts, mealDate, mealEstimate, money, ticketBreakEven, dateRange, planReadiness } from './model.mjs';
import { icon, esc, shortDay, longDay, dateText, dateLabel, status, btn, iconBtn, chip, empty, alert, categoryIcon, cost, unit, urlLink, timeText, transitPlanners } from './ui.mjs';
import { transitFares, transitNetworks } from './transit.mjs';

const tabs = [
  ['overview', 'Übersicht', 'compass'], ['plan', 'Tagesplan', 'calendar'], ['map', 'Karte', 'map'],
  ['rail', 'Bahn & Interrail', 'train'], ['lodging', 'Unterkünfte', 'bed'], ['discover', 'Entdecken', 'pin'],
  ['food', 'Verpflegung', 'food'],
  ['budget', 'Budget', 'wallet'], ['group', 'Reisegruppe', 'people'], ['data', 'Daten & Fristen', 'folder'],
];
const heading = (title, note, actions = '') => '<header class="page-head"><div><h1>' + esc(title) + '</h1><p>' + esc(note) + '</p></div><div class="section-actions">' + actions + '</div></header>';
const table = (labels, rows) => '<div class="table-wrap panel"><table><thead><tr>' + labels.map(l => '<th scope="col">' + esc(l) + '</th>').join('')
  + '</tr></thead><tbody>' + rows.map(cells => '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const stat = (label, value, note = '') => '<div class="panel stat"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong>' + (note ? '<p>' + esc(note) + '</p>' : '') + '</div>';

export function renderShell(ctx) {
  const { city, trip, variants, variant, page, cities, menu, theme, saving } = ctx;
  const cityName = cities[city]?.name ?? 'Reise';
  const tabTitle = tabs.find(t => t[0] === page)?.[1];
  const places = [...new Set(trip.route)];
  const currentTitle = variant.state.title ?? trip.title;
  const sourceNotice = trip.dataMode === 'research_seed_fallback'
    ? '<div class="alert" role="status">Nur Forschungsdaten verfügbar: Die privaten Tripsy-Originaldateien fehlen in diesem Projektordner. Termine, Quellenbezüge und Buchungsdetails sind unvollständig. Es wurden keine Buchungen oder Live-Fahrpläne importiert.</div>'
    : '';
  const activeNav = tabs.map(([id, label, symbol]) => '<button type="button" class="nav-btn" data-action="page" data-value="' + id
    + '" aria-current="' + (page === id ? 'page' : 'false') + '">' + icon(symbol) + esc(label) + '</button>').join('');
  return `<div class="shell"><aside class="sidebar ${menu ? 'open' : ''}" aria-label="Reisenavigation">
    <div class="brand"><span class="brandmark">${icon('train')}</span> Reiseplaner</div>
    <div class="sidebar-inner">
      <div class="side-label">Reisevariante</div>
      <div class="trip-picker"><select id="variant" aria-label="Reisevariante">${variants.map(v => {
        const base = ctx.catalog.trips.find(t => t.id === v.base);
        return '<option value="' + esc(v.id) + '"' + (v.id === variant.id ? ' selected' : '') + '>' + esc(v.state.title ?? base.title) + '</option>';
      }).join('')}</select><small>${dateLabel(trip.from, trip.to)} · ${variant.state.people.length} Reisende</small></div>
      <nav aria-label="Module">${activeNav}</nav>
      <div class="side-label">Reiseorte</div>
      <nav aria-label="Reiseorte">${places.map(id => '<button type="button" class="city-btn" data-action="city" data-value="' + id
        + '" aria-current="' + (city === id) + '"><span class="dot"></span>' + esc(cities[id]?.name ?? id) + '</button>').join('')}</nav>
    </div>
    <div class="sidebar-bottom">${icon('lock')} <span>Privat auf diesem Gerät</span></div>
  </aside><div class="main-column"><header class="topbar">
    <div class="crumb"><span class="mobile-menu">${iconBtn('menu', 'Navigation öffnen', 'menu')}</span><strong>${esc(currentTitle)}</strong>${icon('chevron')}<span>${esc(tabTitle)}</span></div>
    <div class="top-actions"><span class="status-icon">${saving ? 'Speichert …' : 'Lokal gespeichert'}</span>
    ${iconBtn('theme', theme === 'dark' ? 'Helles Design' : 'Dunkles Design', theme === 'dark' ? 'sun' : 'moon')}
    ${iconBtn('undo', 'Letzte Änderung rückgängig', 'reset')}
    ${iconBtn('page', 'Daten importieren', 'upload', 'data')}</div>
  </header><main class="workspace" id="main">${sourceNotice}${content(ctx, cityName)}</main></div></div>`;
}

function content(ctx, city) {
  switch (ctx.page) {
    case 'overview': return overview(ctx);
    case 'map': return heading('Karte', ctx.total ? 'Gesamtroute der gewählten Variante' : (ctx.wholeDay ? 'Ganzer Tag' : city) + ' · ' + longDay(ctx.date))
      + (ctx.total ? '' : dayPlaces(ctx)) + mapPanel(ctx, true);
    case 'rail': return rail(ctx);
    case 'lodging': return options(ctx, true);
    case 'discover': return options(ctx, false);
    case 'food': return food(ctx);
    case 'budget': return budget(ctx);
    case 'group': return group(ctx);
    case 'data': return data(ctx);
    default: return plan(ctx, city);
  }
}

function plan(ctx, name) {
  const { trip, dates, date, city, people, day, budget, routes, selected, mobile } = ctx;
  const warnings = conflicts(day, ctx.conflictRoutes, ctx.fullDay);
  const dayTotal = day.reduce((sum, item) => {
    if (item.kind === 'transport' && item.role === 'Ankunft') return sum;
    if (item.kind === 'lodging' && item.role === 'Check-out') return sum;
    return sum + (budget.rows.find(r => r.id === item.id || r.forItem === item.id)?.euros ?? 0);
  }, 0) + budget.rows.filter(row => row.id === 'grocery-budget:' + city && row.date === date)
    .reduce((sum, row) => sum + (row.euros ?? 0), 0);
  const anchor = ctx.stops.find(item => item.anchor);
  const first = ctx.segments[0];
  const last = ctx.segments.at(-1);
  return `<section class="hero ${city === 'barcelona' ? 'photo' : ''}">
    <div class="hero-copy"><p class="hero-tag">${icon('pin')} ${esc(ctx.cities[city].country === 'ES' ? 'Spanien' : new Intl.DisplayNames('de', { type: 'region' }).of(ctx.cities[city].country))}</p>
    <h1>${esc(name)}</h1><div class="hero-meta"><span>${icon('calendar')} ${esc(longDay(date))}</span>
    <span>${icon('people')} ${people.length} Reisende</span><span>${icon('train')} ${esc(ctx.variant.state.title ?? trip.title)}</span></div></div>
    ${btn('show-route', 'Gesamtroute', 'map')}</section>
    <div class="subheading"><div><h2>Reiseplan</h2><p>${dateLabel(trip.from, trip.to)} · ${dates.length} Reisetage im Kalender</p></div>
    <div class="mobile-switch" aria-label="Ansicht">${chip('mobile', 'Liste', mobile === 'plan', 'plan', 'list')}${chip('mobile', 'Karte', mobile === 'map', 'map', 'map')}</div></div>
    <div class="days" aria-label="Reisetage">${dates.map(d => '<button type="button" class="day" data-action="day" data-value="' + d + '" aria-pressed="' + (d === date) + '"><strong>' + esc(shortDay(d)) + '</strong><small>' + esc(ctx.cities[ctx.cityForDay(d)]?.name ?? 'Reise') + '</small></button>').join('')}</div>
    ${dayPlaces(ctx)}
    <div class="plan-grid" data-mobile="${mobile}">
      <section class="panel timeline-panel"><div class="panel-head"><div><h2>Tagesablauf</h2><p>${day.length} ${day.length === 1 ? 'Eintrag' : 'Einträge'} · ${dayTotal ? money(dayTotal) + ' erfasst' : 'Kosten zum Teil offen'}</p></div>
      ${iconBtn('add', 'Planeintrag hinzufügen', 'plus')}</div>
      ${warnings.length ? '<div class="panel-pad">' + warnings.map(w => alert(w.text)).join('') + '</div>' : ''}
      <div class="timeline">${day.length ? [
        anchor && first?.from.anchor ? connector(first, routes[0], 0, 'Ab Unterkunft', people.length) : '',
        ...day.map((item, index) => {
          const after = ctx.segments.findIndex(segment => segment.from.entryKey === item.entryKey);
          const pinned = selected === item.entryKey;
          const name = item.kind === 'transport' ? item.role + ' · ' + (item.role === 'Ankunft' ? item.arrival : item.departure)
            : item.role ? item.role + ' · ' + item.name : item.name;
          const duration = item.duration ? item.duration + ' Min. · ' : '';
          const place = ctx.wholeDay ? (ctx.cities[item.placeCity]?.name ?? 'Ort offen') + ' · ' : '';
          const line = place + (item.kind === 'transport' ? item.name + (item.mode === 'roadtrip' ? ' · Autofahrt' : ' · Entwurf')
            : duration + (item.tags?.slice(0, 2).join(' · ') || item.category || 'Geplant'));
          return `<article class="timeline-event"><time>${esc(item.time ?? 'Flexibel')}</time><div class="axis"><span class="number">${index + 1}</span></div>
          <div class="event-card ${pinned ? 'selected' : ''}" data-event-id="${esc(item.id)}" ${!item.locked && !item.booked && item.kind !== 'transport' && item.kind !== 'lodging' ? 'draggable="true"' : ''}>
          <button type="button" class="event-content" data-action="select" data-value="${esc(item.entryKey)}" aria-pressed="${pinned}">
          <span class="category-icon ${item.category === 'food' ? 'food' : item.kind === 'transport' ? 'train' : ''}">${icon(categoryIcon(item))}</span><div>
          <h3>${esc(name)} ${item.locked || item.booked ? icon('lock') : ''}</h3><small>${esc(line)}</small></div></button>
          <button type="button" class="mini-action" data-action="edit" data-value="${esc(item.id)}" aria-label="Bearbeiten: ${esc(item.name)}">${icon('edit')}</button></div></article>`
          + (after >= 0 ? connector(ctx.segments[after], routes[after], after, ctx.segments[after] === last && last.to.anchor ? 'Zur Unterkunft' : '', people.length) : '');
        }),
      ].join('') : empty('Dieser Tag ist noch offen', 'Ergänze einen Termin oder übernimm eine Option aus Entdecken.')}</div>
      ${ctx.wholeDay ? '' : '<div class="insight">' + icon('spark') + '<div><strong>' + (anchor ? 'Unterkunft als Tagesanker' : 'Unterkunft vergleichen') + '</strong><div>'
        + (anchor ? esc(anchor.name) + ' fließt in verfügbare Hin- und Rückwege ein.' : 'Standorte und Gruppenpreise für diesen Aufenthalt ansehen.') + '</div></div></div>'}
      <div class="panel-pad inline">${btn('page', 'Unterkünfte', 'bed', 'lodging')}${btn('page', 'Aktivitäten', 'compass', 'discover')}${btn('page', 'Verpflegung', 'food', 'food')}${day.length > 1 ? btn('optimize', 'Tag prüfen', 'spark') : ''}</div>
    </section>${mapPanel(ctx)}</div>`;
}

function dayPlaces(ctx) {
  if (ctx.dayCities.length < 2) return '';
  return '<div class="day-places" aria-label="Orte am Reisetag">' + chip('day-place', 'Ganzer Tag', ctx.wholeDay, 'all')
    + ctx.dayCities.map(id => chip('day-place', ctx.cities[id]?.name ?? id, !ctx.wholeDay && ctx.city === id, id)).join('') + '</div>';
}

function connector(segment, route, index, label, peopleCount) {
  const details = route ? [route.mode, route.line, route.minutes + ' Min.',
    route.metres != null ? (route.metres / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' km' : null,
    route.fare ? money(groupPrice(route.fare, peopleCount), route.fare.currency) + ' für die Gruppe' : null].filter(Boolean).join(' · ')
    : segment.access?.label ?? (segment.from.point && segment.to.point ? 'Weg berechnen' : 'Wegdaten fehlen');
  return '<button type="button" class="connector" data-action="leg" data-value="' + index + '">' + icon(route?.mode === 'ÖPNV' ? 'train' : 'walk') + esc(label ? label + ' · ' + details : details) + '</button>';
}

export function mapDetail(ctx) {
  const item = ctx.detail;
  if (!item) return '';
  const rows = ctx.segments.flatMap((segment, index) => [segment.from, segment.to].some(stop => item.entryKey ? stop.entryKey === item.entryKey : stop.id === item.id)
    ? [connector(segment, ctx.routes[index], index, segment.from.name + ' → ' + segment.to.name, ctx.people.length)] : []);
  const info = item.kind === 'transport' ? timeText(item) : item.duration ? item.duration + ' Min. geplant' : 'Besuchsdauer offen';
  return `<div class="map-detail" id="point-detail"><div class="inline"><h3>${esc(item.name)}</h3>
  ${status(item.selected ? 'Im Plan' : 'Alternative', item.selected ? 'green' : '')}</div>
  <p>${esc(info)} · ${esc(cost(item, ctx.people.length))} gesamt · ${esc(unit(item, ctx.people.length))}</p>
  ${item.address ? '<p>' + esc(item.address) + '</p>' : ''}
  ${item.detail ? '<p>' + esc(item.detail) + '</p>' : ''}
  ${item.access ? '<p>' + esc(item.access) + '</p>' : ''}
  ${item.positionIssue ? alert(item.positionIssue) : ''}
  ${rows.length ? '<div class="local-routes">' + rows.join('').replaceAll('class="connector"', 'class="connector detail-connector"') + '</div>' : ''}
  <div class="row-actions">${btn('details', 'Quellen & Details', 'folder', item.id)}
  ${item.selected ? btn('edit', 'Bearbeiten', 'edit', item.id) : btn('choose', item.kind === 'lodging' ? 'Aufenthalt wählen' : 'In Tagesplan', 'plus', item.id, 'subtle')}</div></div>`;
}

function mapPanel(ctx, full = false) {
  const t = ctx.filters;
  const network = transitNetworks[ctx.city];
  const quickLayer = network?.quick;
  return `<section class="panel map-panel ${full ? 'map-full' : ''}" aria-label="Interaktive Karte">
    <div class="panel-head"><div><h2>${ctx.total ? 'Gesamtroute' : 'Karte'}</h2>
    <p>${ctx.total ? 'Originale Reihenfolge · Trassen schematisch' : esc(ctx.wholeDay ? 'Alle Tagesorte' : ctx.cities[ctx.city].name) + ' · ' + esc(shortDay(ctx.date))}</p></div>
    <div class="inline">${iconBtn('fit', 'Kartenausschnitt zurücksetzen', 'target')}${iconBtn('layers', 'Weitere Kartenebenen', 'layers')}</div></div>
    <div class="map-tools" aria-label="Kartenebenen">
      ${chip('map-mode', 'Tag', !ctx.total, 'day')}${chip('map-mode', 'Gesamt', ctx.total, 'total')}
      ${!ctx.total ? chip('filter', 'Fußwege', t.walk, 'walk', 'walk') + chip('filter', 'Alternativen', t.options, 'options', 'pin')
        + (quickLayer ? chip('transit', network.groups[quickLayer].title, t.transit[quickLayer], quickLayer, 'train') : '')
        + (ctx.cities[ctx.city].country === 'CH' ? chip('filter', 'Wanderwege', t.hiking, 'hiking', 'walk') : '') : ''}
    </div>
    ${!ctx.total && ctx.timetablePreview ? '<div class="map-preview"><span>' + esc('ÖPNV-Vorschau · '
      + dateText(ctx.timetablePreview.route.date) + ' · ' + ctx.timetablePreview.route.line) + '</span>'
      + iconBtn('transit-clear', 'Fahrplanvorschau schließen', 'close') + '</div>' : ''}
    <div class="map-wrap"><div id="map" tabindex="0" aria-label="Verschiebbare Karte mit Zoom"></div><div class="map-hint" id="map-hint" hidden></div></div>
    <div class="map-legend"><span><i class="legend-line ${ctx.total ? 'dashed' : ''}"></i> ${ctx.total ? 'Städtefolge · Schema' : 'Berechneter Fußweg'}</span>
    ${!ctx.total && t.stations && ctx.dayTravel.length ? '<span><i class="legend-line dashed"></i> Tagesfahrt · Schema</span>' : ''}
    ${!ctx.total && (ctx.timetablePreview || ctx.routes.some(route => route?.legs?.length)) ? '<span>ÖPNV · veröffentlichter Fahrplan</span>' : ''}
    ${!ctx.total ? '<span><i class="legend-dot"></i> Alternative</span>' : ''}
    ${!ctx.total && network?.dateLabel ? '<span>' + esc(network.dateLabel) + ' · Netzreferenz</span>' : ''}
    ${!ctx.total && ctx.cities[ctx.city].country === 'CH' && t.hiking ? '<span>Signalisiertes Netz · ab Zoomstufe 10</span>' : ''}
    ${!ctx.total ? urlLink(transitPlanners[ctx.city], 'ÖPNV-Planer') : ''}</div>
    <div id="detail-container">${mapDetail(ctx)}</div>
  </section>`;
}

function overview(ctx) {
  const { trip, catalog } = ctx;
  const readiness = planReadiness(trip, ctx.active, ctx.budget);
  const readinessRows = [
    ['Unterkunft', readiness.missingStays.length ? readiness.missingStays.length + ' Aufenthaltsorte noch nicht vollständig gewählt' : 'Alle bekannten Aufenthalte einer aktiven Unterkunft zugeordnet',
      'lodging', 'Unterkünfte prüfen'],
    ['Bahn', readiness.uncheckedTrains + ' ausgewählte Bahnabschnitte ohne bestätigten Fahrplan', 'rail', 'Bahn prüfen'],
    ['Kosten', readiness.unknownPrices + ' aktive Posten ohne umrechenbaren Gruppenpreis', 'budget', 'Budget öffnen'],
    ['Datenherkunft', readiness.missingOriginalSources ? 'Nur reduziertes Recherchearchiv – Original-Snapshots fehlen' : 'Lokale Tripsy-Quelldateien vorhanden',
      'data', 'Quellen prüfen'],
  ].map(([name, note, page, link]) => [esc(name), esc(note), btn('page', link, 'arrow', page)]);

  const variants = ctx.variants.map(v => {
    const base = catalog.trips.find(t => t.id === v.base);
    const selected = activeItems(base, v.state, v.imported);
    const b = calculateBudget(selected, v.state);
    const passDays = interrail(selected, v.state.pass);
    const shares = b.balances.map(balance => balance.share);
    const minShare = Math.min(...shares);
    const maxShare = Math.max(...shares);
    const shareLabel = minShare === maxShare ? money(minShare) : money(minShare) + '–' + money(maxShare);
    return [btn('variant', v.state.title ?? base.title, 'arrow', v.id), esc(dateLabel(base.from, base.to)),
      esc(base.route.map(id => ctx.cities[id]?.name ?? id).join(' → ')), esc(money(b.total)),
      esc(shareLabel), esc(String(b.unknown)), esc(passDays.days.length + ' / ' + v.state.pass.days),
      esc(String(v.state.people.length))];
  });
  return heading('Reiseübersicht', ctx.variant.state.title ?? trip.title, btn('copy', 'Variante duplizieren', 'plus'))
    + '<div class="stat-grid">' + stat('Zeitraum', dateLabel(trip.from, trip.to)) + stat('Reisegruppe', ctx.people.length + ' Personen')
    + stat('Reiseorte', new Set(trip.route).size + ' Orte') + stat('Bekannte Plankosten', money(ctx.budget.total), ctx.budget.unknown + ' Posten ohne EUR-Summe') + '</div>'
    + '<section class="section"><h2>Planungs-Check</h2><p class="muted">Direkt aus den aktuell ausgewählten Einträgen berechnet. Fehlende Angaben sind keine bestätigten Buchungen.</p>' + table(['Prüffeld', 'Aktueller Stand', 'Nächster Schritt'], readinessRows) + '</section>'
    + '<section class="section panel panel-pad"><h2>Originalroute</h2><p>' + esc(trip.route.map(id => ctx.cities[id]?.name).join(' → ')) + '</p><p class="muted">' + esc(trip.description) + '</p>'
    + '<div class="row-actions section">' + btn('show-route', 'Gesamtroute öffnen', 'map') + btn('page', 'Zum Tagesplan', 'calendar', 'plan') + '</div></section>'
    + '<section class="section"><h2>Varianten im Vergleich</h2>' + table(['Variante', 'Zeitraum', 'Originalroute', 'Bekannte Plankosten', 'Personenanteile', 'Preise offen', 'Pass-Tage', 'Gruppe'], variants) + '</section>';
}

function options(ctx, lodging) {
  const { all, city, cities, people, optionFilter, sort, state, compareIds, activeSet } = ctx;
  const predicate = item => item.city === city && item.kind === (lodging ? 'lodging' : 'activity') && !item.duplicateOf;
  const found = all.filter(predicate);
  const list = found.filter(item => {
    if (optionFilter === 'saved') return state.favorites.includes(item.id);
    if (optionFilter === 'known') return groupPrice(item.price, people.length) != null;
    if (optionFilter === 'kitchen') return Boolean(item.kitchen);
    if (optionFilter === 'evening') return Boolean(item.minAge) || item.tags?.some(t => /abend|nightlife|bar/i.test(t));
    if (optionFilter === 'food') return item.category === 'food';
    return true;
  });
  if (sort === 'price') list.sort((a, b) => (groupPrice(a.price, people.length) ?? Infinity) - (groupPrice(b.price, people.length) ?? Infinity));
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const compared = found.filter(i => compareIds.has(i.id));
  const stay = ctx.trip.stayByCity[city];
  const compareRows = compared.map(item => [esc(item.name), esc(cost(item, people.length)), esc(unit(item, people.length)),
    esc(lodging ? item.kitchen || 'Offen' : item.duration ? item.duration + ' Min.' : 'Offen'),
    esc(lodging ? item.room || 'Offen' : item.tags?.join(' · ') || 'Offen'),
    esc(lodging ? [ctx.hotelWalks[item.id]?.minutes != null
      ? (item.localStation ? 'Ab ' + item.localStation.name + ' · ' : '') + ctx.hotelWalks[item.id].minutes + ' Min. zu Fuß' : '',
      item.access].filter(Boolean).join(' · ') || 'Weg offen' : item.access || 'Weg im Tagesplan'),
    esc(lodging ? item.cancellation ?? 'Tarifbedingungen offen' : item.minAge ? item.minAge + '+' : 'Offen')]);
  const filters = [['all', 'Alle Optionen'], ['saved', 'Merkliste'], ['known', 'Mit Preisreferenz'],
    ...(lodging ? [['kitchen', 'Mit Küche']] : [['evening', 'Abend'], ['food', 'Verpflegung']])];
  const cards = list.map(item => {
    const active = activeSet.has(item.id);
    const highlighted = compareIds.has(item.id);
    const meal = ctx.catalog.mealPlans?.[city]?.find(plan => plan.venue === item.id);
    return `<article class="panel option-card">
      <div class="card-top"><span class="category-icon">${icon(categoryIcon(item))}</span><div class="chips">
      ${status(active ? 'Im Plan' : 'Alternative', active ? 'green' : '')}${item.minAge ? status(item.minAge + '+', 'warn') : ''}</div></div>
      <h3>${esc(item.name)}</h3>
      <div class="chips">${(lodging ? [item.kitchen || 'Küche offen'] : item.tags?.slice(0, 3) ?? []).map(t => status(t)).join('')}</div>
      <p>${esc(item.detail || 'Weitere Angaben stehen in den importierten Quellen.')}</p>
      <div class="option-facts"><small>${esc(lodging ? (item.stayFrom && item.stayTo ? dateLabel(item.stayFrom, item.stayTo) : 'Aufenthaltsdaten offen') : item.duration ? item.duration + ' Min.' : 'Dauer offen')}
      ${lodging && ctx.hotelWalks[item.id]?.minutes ? esc(' · ' + (item.localStation?.name ?? 'Bahnhof') + ' · ' + ctx.hotelWalks[item.id].minutes + ' Min. zu Fuß') : ''}</small>
      <div class="price-line"><span><strong>${esc(cost(item, people.length))}</strong><br><small>${esc(unit(item, people.length))}</small></span>
      <small>${esc(item.price?.label ?? 'Preis noch offen')}</small></div></div>
      <div class="row-actions">${btn(active ? 'edit' : meal ? 'meal-choose' : 'choose', active ? 'Bearbeiten' : lodging ? 'Auswahl prüfen' : 'Einplanen',
        active ? 'edit' : 'plus', !active && meal ? meal.id : item.id, 'subtle')}
      ${iconBtn('favorite', state.favorites.includes(item.id) ? 'Aus Merkliste entfernen' : 'Merken', state.favorites.includes(item.id) ? 'check' : 'bookmark', item.id)}
      ${chip('compare', 'Vergleichen', highlighted, item.id, 'compare')}
      ${iconBtn('details', 'Details: ' + item.name, 'folder', item.id)}${item.point ? iconBtn('option-map', 'Auf Karte: ' + item.name, 'pin', item.id) : ''}</div>
    </article>`;
  }).join('');
  return heading(lodging ? 'Unterkünfte' : 'Entdecken', cities[city].name + (lodging && stay ? ' · ' + dateLabel(stay.from, stay.to) : ' · ' + found.length + ' Einträge'),
    btn('page', 'Zum Tagesplan', 'calendar', 'plan'))
    + '<div class="filterbar">' + filters.map(([id, label]) => chip('option-filter', label, optionFilter === id, id)).join('')
    + '<label>Sortieren <select id="sort"><option value="source">Quelle</option><option value="price"' + (sort === 'price' ? ' selected' : '') + '>Preis</option><option value="name"' + (sort === 'name' ? ' selected' : '') + '>Name</option></select></label></div>'
    + (compared.length ? '<section class="section"><h2>Direkter Vergleich</h2>' + table(['Option', 'Für die Gruppe', 'Pro Person', lodging ? 'Küche' : 'Dauer', lodging ? 'Zimmer' : 'Erlebnis', 'Anbindung', lodging ? 'Storno' : 'Einlass'], compareRows) + '</section>' : '')
    + (cards ? '<div class="grid-cards">' + cards + '</div>' : empty('Keine Optionen in dieser Ansicht', 'Wechsle den Filter, wähle einen anderen Ort oder importiere deine Recherche.'));
}

function food(ctx) {
  const { city, date, people, mealHotel, state, budget, catalog } = ctx;
  const count = people.length;
  const plans = catalog.mealPlans?.[city] ?? [];
  const planned = ctx.active.filter(i => i.city === city && i.mealSlot === 'dinner' && mealDate(i) === date);
  const stay = ctx.trip.stayByCity[city];
  const dates = ctx.dates.filter(d => d === date || (stay ? stay.from <= d && d <= stay.to : ctx.cityForDay(d) === city));
  const planDate = '<label class="field meal-day"><span>Reisetag</span><select id="meal-date">' + dates.map(d =>
    '<option value="' + d + '"' + (d === date ? ' selected' : '') + '>' + esc(longDay(d)) + '</option>').join('') + '</select></label>';
  const plannedCooking = ctx.active.filter(item => !state.expenses.some(expense => expense.forItem === item.id));
  const basket = groceryBasket(plannedCooking, count, state.groceryOverrides ?? {}).filter(row => row.city === city);
  const basketTotal = basket.reduce((sum, row) => sum + row.total, 0);
  const basketTable = basket.length ? table(['Zutat', 'Benötigte Menge', 'Packungen', 'Packungspreis', 'Gruppe', ''],
    basket.map(row => [
      esc(row.name) + '<br><small>' + esc(row.adjustedForGroup ? 'Packungen an den gesamten Bedarf angepasst'
        : row.modified ? 'Preis/Menge selbst angepasst' : 'Preisreferenz, kein Filialangebot') + '</small>',
      esc(row.required + ' g'), esc(row.packs + ' × ' + row.pack + ' g'),
      money(row.unitCents), money(row.total),
      btn('grocery-edit', 'Anpassen', 'edit', row.key)
        + (row.modified ? btn('grocery-reset', 'Zurücksetzen', 'reset', row.key) : '')
        + urlLink(catalog.sources[row.source]?.url, 'Quelle'),
    ])) : '';
  const planCards = plans.map(plan => {
    const estimate = mealEstimate(plan, count);
    const venue = ctx.all.find(i => i.id === (plan.venue ?? plan.shop));
    const route = ctx.foodWalks[venue?.id];
    const plannedHere = planned.some(i => i.mealPlanId === plan.id);
    const rows = estimate.products.map(product => {
      const amount = product.quantity + (product.pack ? ' × ' + product.pack + ' g' : ' Portion(en)');
      return [esc(product.name), esc(amount), money(product.total),
        urlLink(catalog.sources[product.source ?? plan.source[0]]?.url, 'Quelle')];
    });
    const subtitle = plan.type === 'cook' ? plan.shopMinutes + ' Min. Einkauf · ' + plan.prep + ' Min. Kochen und Aufräumen'
      : plan.prep + ' Min. für das Essen eingeplant';
    return '<article class="panel option-card meal-card"><div class="card-top"><span class="category-icon food">' + icon('food') + '</span>'
      + (plannedHere ? status('Im Plan', 'green') : '') + '</div><h3>' + esc(plan.name) + '</h3>'
      + '<div class="price-line"><div><strong>' + money(estimate.base) + '</strong> für die Gruppe<br><small>Ø '
      + money(Math.round(estimate.base / count)) + ' p. P.</small></div>'
      + (estimate.terrace == null ? '' : '<small>Terrasse ' + money(estimate.terrace) + '</small>') + '</div>'
      + '<p>' + esc(plan.priceNote) + '</p><p class="muted">' + esc(subtitle) + '</p>'
      + (venue ? '<p>' + esc(venue.name + ' · ' + (route ? route.minutes + ' Min. zu Fuß ab Unterkunft' : venue.address)) + '</p>' : '')
      + '<details><summary>' + (plan.type === 'cook' ? 'Warenkorb und Mengen' : 'Bestellung und Preise') + '</summary><p>' + esc(plan.note) + '</p>'
      + table(['Position', 'Menge', 'Betrag', ''], rows) + '</details>'
      + '<div class="row-actions">' + btn('meal-choose', plannedHere ? 'Auswahl prüfen' : 'Einplanen', 'plus', plan.id, 'subtle') + '</div></article>';
  }).join('');
  const cook = plans.find(plan => plan.type === 'cook');
  const restaurant = plans.find(plan => plan.type === 'restaurant');
  const lodgings = ctx.all.filter(i => i.kind === 'lodging' && i.city === city && !i.duplicateOf && !i.removed
    && i.stayFrom <= date && date < i.stayTo);
  const scenarios = cook && restaurant ? lodgings.map(i => {
    const price = i.price?.currency === 'EUR' ? groupPrice(i.price, count) : null;
    const cooking = ['shared', 'private'].includes(i.kitchenMode);
    return [esc(i.name), esc(i.kitchen ?? 'Küche offen'),
      price == null ? 'Offen' : money(price) + '<br><small>' + esc(i.price.label ?? 'Planpreis') + '</small>',
      cooking && price != null ? money(price + mealEstimate(cook, count).base) : 'Offen',
      price == null ? 'Offen' : money(price + mealEstimate(restaurant, count).base)];
  }) : [];
  const places = ctx.foodPlaces.filter(i => !i.requiresKitchen).map(i => {
    const route = ctx.foodWalks[i.id];
    const meal = plans.find(plan => plan.venue === i.id);
    return [esc(i.name), esc(i.address ?? 'Adresse offen'), esc(route ? route.minutes + ' Min. zu Fuß ab Unterkunft' : i.tags?.join(' · ') ?? ''),
      btn('details', 'Details', 'folder', i.id) + (i.point ? iconBtn('option-map', 'Auf Karte: ' + i.name, 'pin', i.id) : '')
      + (ctx.activeSet.has(i.id) ? '' : btn(meal ? 'meal-choose' : 'choose', 'Einplanen', 'plus', meal?.id ?? i.id))];
  });
  return heading('Verpflegung', ctx.cities[city].name + ' · ' + count + ' Reisende', planDate)
    + '<section class="section panel panel-pad"><h2>Abendessen am ' + dateText(date) + '</h2><p>'
    + (planned.length ? planned.map(i => {
      const actual = budget.rows.find(row => row.forItem === i.id);
      return esc(i.name) + ' · ' + esc(cost(i, count)) + ' ' + (actual ? 'erfasst' : i.requiresKitchen && i.basketProducts ? 'Einzelschätzung, gemeinsamer Einkauf unten' : 'geplant') + ' '
        + btn('meal-cost', actual ? 'Ausgabe bearbeiten' : 'Ausgabe erfassen', 'wallet', i.id);
    }).join(' ') : 'Für den Tag ist noch kein Abendessen ausgewählt.')
    + '</p><p class="muted">' + (mealHotel ? esc(mealHotel.name + ' · ' + (mealHotel.kitchen ?? 'Küchenzugang offen'))
      : 'Unterkunft für diese Nacht offen. Küchenzugang und Ausstattung bei der Auswahl prüfen.') + '</p></section>'
    + (basket.length ? '<section class="section"><h2>Gemeinsamer Einkaufswarenkorb · ' + money(basketTotal)
      + '</h2><p class="muted">Für alle aktiven Koch-Mahlzeiten in dieser Stadt zusammengefasst. '
      + 'Packungen werden nur einmal im aktiven Budget gezählt, nicht pro Mahlzeit. '
      + 'Die Preise sind Planreferenzen oder von dir geänderte Annahmen; sie sind keine Kassenzettel. '
      + 'Bereits als echte Ausgabe erfasste Mahlzeiten sind aus dieser Planung ausgenommen.</p>' + basketTable + '</section>' : '')
    + (planCards ? '<section class="section"><h2>Selbst kochen oder auswärts essen</h2><div class="grid-cards">' + planCards + '</div></section>' : '')
    + (scenarios.length ? '<section class="section"><h2>Unterkunft und ein Abendessen</h2><p class="muted">Szenarien mit den vorhandenen Unterkunftspreisen für den gesamten Aufenthalt.</p>'
      + table(['Unterkunft', 'Küche', 'Aufenthalt', 'Mit Kochen', 'Mit Restaurant innen'], scenarios) + '</section>' : '')
    + '<section class="section"><h2>Einkauf und Restaurants</h2>'
    + (places.length ? table(['Ort', 'Adresse', 'Anbindung', ''], places) : empty('Verpflegungsorte offen', 'Vorhandene Vorschläge lassen sich unter Entdecken oder Daten & Fristen ergänzen.'))
    + '</section>';
}

function rail(ctx) {
  const { active, trip, state, people, catalog } = ctx;
  const legs = active.filter(i => i.kind === 'transport').sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const pass = interrail(legs, state.pass);
  const priced = legs.filter(l => l.reservation);
  const reservations = priced.reduce((sum, l) => sum + (groupPrice(l.reservation, people.length) ?? 0), 0);
  const singles = legs.map(l => groupPrice(l.price, people.length));
  const knownSingles = singles.reduce((sum, p) => sum + (p ?? 0), 0);
  const ticketUnknown = singles.filter(p => p == null).length;
  const candidates = ['Bahnverbindungen 2027 sind Planwerte. Buchungsfenster, Sitzplätze und Preise vor der Reise beim Betreiber prüfen.'];
  const reference = catalog.fares.pass_7d;
  if (pass.remaining < 0) candidates.push('Die geplanten Fahrten übersteigen die hinterlegte Zahl an Pass-Tagen.');
  const connections = legs.map((l, i) => {
    const next = legs[i + 1];
    const gap = l.end && next?.start ? (Date.parse(next.start) - Date.parse(l.end)) / 60_000 : null;
    const duration = l.start && l.end ? Math.round((Date.parse(l.end) - Date.parse(l.start)) / 60_000) : null;
    const sameDay = next && localParts(l.end, l.endZone ?? l.zone).date === localParts(next.start, next.zone).date;
    return `<article class="panel rail-card">
      <div class="inline">${status(l.mode === 'train' ? 'Zug' : l.mode)}${status(l.verification ?? 'Planung', 'warn')}
      <small>${dateText(localParts(l.start, l.zone).date)} · ${esc(l.operator ?? 'Betreiber offen')}${l.number ? ' · ' + esc(l.number) : ''}</small></div>
      <h3>${esc(l.name)}</h3><div class="times"><strong>${esc(timeText(l))}</strong><span>${duration == null ? 'Dauer offen' : Math.floor(duration / 60) + ' h ' + duration % 60 + ' Min.'}</span>
      <span>${l.reservation ? 'Reservierungsreferenz ' + esc(cost({ price: l.reservation }, people.length)) : 'Reservierungspreis offen'}</span></div>
      ${l.via ? '<small>' + esc(l.via) + '</small>' : ''}
      ${sameDay && gap != null && gap < 25 ? alert(gap < 0 ? 'Überschneidung mit der nächsten Fahrt.' : 'Nur ' + gap + ' Min. bis zum nächsten Zug. Umstieg prüfen.') : ''}
      <div class="row-actions">${btn('details', 'Quellen & Details', 'folder', l.id)}${btn('edit', 'Bearbeiten', 'edit', l.id)}
      ${urlLink(l.website || 'https://int.bahn.de/de', 'Fahrplan prüfen', 'button')}</div></article>`;
  }).join('');
  return heading('Bahn & Interrail', trip.title, btn('add-rail', 'Verbindung ergänzen', 'plus'))
    + '<div class="stat-grid">' + stat('Reisetage im Entwurf', pass.days.length + ' / ' + state.pass.days, pass.days.map(d => dateText(d).slice(0, 6)).join(' · '))
    + stat('Reservierungen bekannt', money(reservations), priced.length + ' Referenzen · keine Verfügbarkeitszusage')
    + stat('Pass + bekannte Reservierungen', state.pass.cost == null && !state.pass.purchased ? 'Passpreis offen' : money((state.pass.purchased ? 0 : state.pass.cost * people.length) + reservations), 'Zwischensumme')
    + stat('Einzeltickets', ticketUnknown ? 'Teilpreis ' + money(knownSingles) : money(knownSingles), ticketUnknown + ' Fahrten mit offenem Preis') + '</div>'
    + '<div class="panel panel-pad"><div class="inline">' + btn('pass', 'Pass konfigurieren', 'edit')
    + urlLink('https://help.interrail.com/hc/de/articles/38312789999261-Wie-funktionieren-Reisetage-bei-Nachtz%C3%BCgen', 'Nachtzugregel')
    + urlLink('https://www.interrail.eu/en/interrail-passes/what-is-interrail/travel-your-own-country', 'Wohnsitzland-Regel') + '</div>'
    + '<p class="muted">Flexi-Pass: Der Abfahrtstag zählt. Ein weiterer Zug nach Mitternacht belegt den nächsten Reisetag. Die Ankunft muss im Gültigkeitszeitraum liegen. Aktives Budget: '
    + (state.pass.budgetMode === 'interrail' ? 'Interrail mit Reservierungen.' : 'Einzeltickets.') + '</p>'
    + (reference ? '<small>Recherchewert ' + esc(reference.tariff_year) + ' · ' + money(reference.amount * 100) + ' Jugendpass p. P. · für 2027 offen.</small>' : '')
    + candidates.map(alert).join('') + pass.issues.map(i => alert(i.text)).join('') + '</div>'
    + '<section class="section"><h2>Verbindungen in Reihenfolge</h2><div class="stack">' + (connections || empty('Keine Verbindungen', 'Ergänze eine Fahrt oder wähle eine andere Variante.')) + '</div></section>';
}

function budget(ctx) {
  const { budget: b, trip, state, people, catalog } = ctx;
  const rows = b.rows.map(i => [esc(i.name), esc(categories[i.category] ?? i.category ?? 'Sonstiges'),
    esc(i.date ?? localParts(i.start, i.zone).date ?? '—'), esc(money(i.original, i.currency)), esc(money(i.euros)),
    status(i.payment === 'paid' ? 'Bezahlt' : i.payment === 'refund' ? 'Erstattet' : i.euros == null ? 'Preis offen' : 'Geplant', i.euros == null ? 'warn' : ''),
    state.expenses.some(e => e.id === i.id) ? btn('expense', 'Bearbeiten', 'edit', i.id) : '']);
  const cityRows = budgetBreakdown(b.rows, 'city').map(group => [
    esc(group.key === 'unassigned' ? 'Ohne Ortszuordnung' : ctx.cities[group.key]?.name ?? group.key),
    money(group.cents), esc(group.unknown ? group.unknown + ' offene Preise' : 'Keine'),
    esc(group.count),
  ]);
  const dayRows = budgetBreakdown(b.rows, 'date').map(group => [
    esc(group.key === 'unassigned' ? 'Noch keinem Datum zugeordnet' : dateText(group.key)),
    money(group.cents), esc(group.unknown ? group.unknown + ' offene Preise' : 'Keine'),
    esc(group.count),
  ]);
  const charts = Object.entries(b.byCategory).map(([key, cents]) => '<div><div class="inline"><strong>' + esc(categories[key] ?? key) + '</strong><small>'
    + esc(money(cents)) + '</small></div><div class="bar-track"><span style="width:' + (b.total > 0 ? Math.max(0, Math.min(100, cents * 100 / b.total)) : 0) + '%"></span></div></div>').join('');
  const single = catalog.fares.barcelona_single;
  const pass = catalog.fares.barcelona_tcasual;
  const rides = state.pass.rides;
  const be = ticketBreakEven({ single: Math.round(single.amount * 100), pass: Math.round(pass.amount * 100), included: 10, rides, travellers: people.length });
  return heading('Gruppenbudget', people.length + ' Reisende · bekannte Beträge in EUR',
    btn('budget-limit', 'Budgetrahmen', 'edit') + btn('expense', 'Ausgabe ergänzen', 'plus', '', 'primary'))
    + '<div class="stat-grid">' + stat('Bekannte Gesamtkosten', money(b.total), b.unknown + ' Posten offen')
    + stat('Netto bezahlt', money(b.paid)) + stat('Noch offen aus bekannten Kosten', money(b.total - b.paid))
    + stat('Budget nach bekannten Kosten', state.budgetLimit == null ? 'Kein Limit' : money(state.budgetLimit - b.total)) + '</div>'
    + '<div class="split"><section class="panel panel-pad"><h2>Kategorien</h2>' + (charts || '<p class="muted">Noch keine bezifferten Kosten im Plan.</p>') + '</section>'
    + '<section class="panel panel-pad"><h2>Aufteilung & Ausgleich</h2><ul class="sources-list">' + people.map((p, i) => '<li>' + esc(p.name) + ' · Anteil '
      + money(b.balances[i].share) + ' · bezahlt ' + money(b.balances[i].paid) + '</li>').join('') + '</ul>'
    + (b.transfers.length ? b.transfers.map(t => '<p>' + esc(people[t.from].name + ' → ' + people[t.to].name) + ' · ' + money(t.cents) + '</p>').join('')
      : '<p class="muted">Aus bezahlten Positionen ergibt sich kein offener Ausgleich.</p>') + '</section></div>'
    + '<section class="section"><h2>Nach Reiseziel und Buchungstag</h2>'
    + '<p class="muted">Nur belegte oder eingegebene Planbeträge. Eine Unterkunft wird mit ihrem Gesamtbetrag am zugeordneten Buchungs-/Aufenthaltsbeginn erfasst; nicht gleichmäßig auf Nächte verteilt. Fehlende Preise bleiben offen.</p>'
    + '<div class="split"><div><h3>Nach Ort</h3>' + (cityRows.length ? table(['Ort', 'Bekannt', 'Preis offen', 'Posten'], cityRows) : empty('Keine Beträge', '')) + '</div>'
    + '<div><h3>Nach Datum</h3>' + (dayRows.length ? table(['Datum', 'Bekannt', 'Preis offen', 'Posten'], dayRows) : empty('Keine Beträge', '')) + '</div></div></section>'
    + '<section class="section"><h2>Budgetpositionen</h2>' + (rows.length ? table(['Posten', 'Kategorie', 'Datum', 'Original', 'Gruppe (EUR)', 'Stand', ''], rows) : empty('Keine Budgetposten', 'Ausgewählte Optionen und manuelle Ausgaben erscheinen hier.')) + '</section>'
    + (trip.budgetReference ? '<section class="section panel panel-pad"><h2>Recherche-Referenz</h2><p><strong>' + money(Math.round(trip.budgetReference.calculated_total_eur_without_optional * 100)) + '</strong> ohne optionale Posten laut Seed · ' + dateText(trip.budgetReference.estimation_date) + '</p><small>Separates Schätzszenario ohne automatische Addition zum aktiven Budget.</small>'
      + '<details><summary>Originale Tripsy-Positionen anzeigen</summary><ul class="sources-list">' + trip.referenceExpenses.map(e => '<li>' + esc(e.title) + ' · ' + money(Math.round(e.price * 100), e.currency) + '</li>').join('') + '</ul></details></section>' : '')
    + (ctx.city === 'barcelona' && be ? '<section class="section panel panel-pad"><h2>Nahverkehr · T-casual</h2><p>' + rides + ' geplante, eingeschlossene Fahrten je Person · Tarife ' + single.tariff_year + '</p><div class="stat-grid">'
      + stat('Einzelfahrten · Gruppe', money(be.singles)) + stat('T-casual + weitere Einzeltickets', money(be.comparison))
      + stat(be.savings >= 0 ? 'Ersparnis' : 'Mehrkosten', money(Math.abs(be.savings)), 'Vorteil ab ' + (be.firstSaving ?? '—') + ' Fahrten p. P.')
      + '</div>' + btn('rides', 'Geplante Fahrten eingeben', 'edit') + ' ' + urlLink('https://www.tmb.cat/en/barcelona-fares-metro-bus/single-and-integrated', 'Tarife prüfen')
      + '<p class="muted">Manuelle Fahrtenzahl. Nur abgedeckte 1-Zonen-Fahrten eintragen. T-casual wird je Person gerechnet. Flughafenmetro separat prüfen.</p></section>' : '')
    + localMobility(ctx);
}

function localMobility(ctx) {
  const fare = transitFares[ctx.city];
  if (!fare) return '';
  const tickets = ctx.state.mobility?.[ctx.city] ?? 0;
  const compare = ticketBreakEven({ single: fare.single, pass: fare.pass, rides: tickets, travellers: ctx.people.length });
  return '<section class="section panel panel-pad"><h2>Nahverkehr · ' + esc(ctx.cities[ctx.city].name) + '</h2><p>'
    + tickets + ' Einzeltickets je Person · Tarifstand 12.11.2026 · Reisedatum 2027 offen</p><div class="stat-grid">'
    + stat(fare.ticket + ' · Gruppe', money(compare.singles)) + stat(fare.passName + ' · Gruppe', money(compare.comparison))
    + stat(compare.savings >= 0 ? 'Ersparnis' : 'Mehrkosten', money(Math.abs(compare.savings)), 'Vorteil ab ' + compare.firstSaving + ' Einzeltickets p. P.')
    + '</div>' + btn('mobility', 'Einzeltickets eingeben', 'edit') + ' ' + urlLink(fare.source, 'Offizielle Tarife')
    + (fare.singleSource ? ' ' + urlLink(fare.singleSource, 'Einzelfahrkarte') : '')
    + '<p class="muted">' + esc(fare.details) + ' Preisvergleich außerhalb des aktiven Budgets.</p></section>';
}

function group(ctx) {
  return heading('Reisegruppe', ctx.people.length + ' Personen', btn('people', 'Profile bearbeiten', 'edit'))
    + '<div class="grid-cards">' + ctx.people.map((p, i) => '<article class="panel option-card"><span class="category-icon">'
      + icon('people') + '</span><h3>' + esc(p.name) + '</h3><p>Alter zum Reisebeginn: ' + esc(p.age ?? 'Offen') + '</p>'
      + '<div class="price-line"><span>Bekannter Anteil</span><strong>' + money(ctx.budget.balances[i].share) + '</strong></div></article>').join('') + '</div>'
    + '<section class="section panel panel-pad"><h2>Reiseprofil</h2><p>Interessen und Komfortgrenzen wurden noch nicht erfasst. Einlass- oder Ermäßigungsregeln werden nur anhand hinterlegter Angaben bewertet.</p></section>';
}

function data(ctx) {
  const { trip, state, variant, all, catalog } = ctx;
  const imported = Object.entries(trip.importCounts).map(([key, value]) => [esc(({activities:'Aktivitäten',transportations:'Verbindungen',hostings:'Unterkünfte',expenses:'Budgetreferenzen',documents:'Dokumente'})[key] ?? key), esc(value ?? 'Kein Zugriff')]);
  const issues = all.filter(i => i.duplicateOf || i.positionIssue || i.importConflict)
    .map(i => '<li>' + esc(i.originalName ?? i.name) + ' · ' + esc([i.positionIssue, i.importConflict].filter(Boolean).join(' ') || 'Dublettenverdacht, Quelle erhalten') + '</li>');
  const deadlineRows = state.deadlines.slice().sort((a, b) => String(a.when ?? 'z').localeCompare(String(b.when ?? 'z'))).map(d => {
    const date = localParts(d.when, d.zone);
    return [esc(d.title), esc(d.when ? dateText(date.date) + ' ' + date.time + ' · ' + d.zone : 'Zeitpunkt offen'),
      status(d.done ? 'Erledigt' : !d.when ? 'Unklar' : Date.parse(d.when) < Date.now() ? 'Verstrichen' : 'Offen'), btn('deadline', 'Bearbeiten', 'edit', d.id)];
  });
  return heading('Daten & Fristen', 'Quellen, lokale Sicherung und Wiedervorlagen',
    btn('export', 'JSON sichern', 'download') + btn('ics', 'Kalender exportieren', 'calendar'))
    + '<section class="section panel panel-pad"><h2>Recherche importieren</h2><p class="muted">JSON oder CSV in die aktuelle Variante einlesen. Dateieinträge beginnen als Alternativen.</p>'
    + '<form id="import-form" class="row-actions section"><label class="field"><span>Datei</span><input type="file" name="file" accept=".csv,.json" required></label><button class="button primary" type="submit">' + icon('upload') + 'Importieren</button>'
    + '<div class="form-error" aria-live="polite"></div></form><small>Spalten: name, city oder destination_id, kind, id, amount, currency, price_scope, latitude, longitude, source_url.</small></section>'
    + (variant.logs?.length ? table(['Import', 'Neu', 'Vorhanden', 'Konflikte'], variant.logs.map(l => [esc(l.filename), l.inserted, l.existing, l.conflicts])) : '')
    + '<section class="section"><div class="subheading compact"><h2>Buchungen & Fristen</h2>' + btn('deadline', 'Frist erfassen', 'plus') + '</div>'
    + (deadlineRows.length ? table(['Eintrag', 'Ortszeit', 'Status', ''], deadlineRows) : empty('Keine bestätigten Fristen', 'Buchungsfenster und Stornierungsbedingungen sind für diese Reise offen.')) + '</section>'
    + '<section class="section"><h2>' + (trip.dataMode === 'research_seed_fallback' ? 'Lokales Recherchearchiv · reduzierter Bestand' : 'Tripsy-Import') + ' · ' + esc(dateText(trip.importedOn)) + '</h2>' + (trip.dataMode === 'research_seed_fallback' ? alert('Kein vollständiger Tripsy-Snapshot. Angezeigte Datensätze sind nur aus dem Forschungs-Seed rekonstruiert; die ursprünglichen Buchungen werden nicht ersetzt.') : '') + table(['Quelle', 'Verfügbar'], imported) + '</section>'
    + (issues.length ? '<section class="section panel panel-pad"><h2>Importhinweise</h2><ul class="sources-list">' + issues.join('') + '</ul></section>' : '')
    + '<section class="section panel panel-pad"><h2>Recherchequellen</h2><ul class="sources-list">'
    + Object.values(catalog.sources).map(s => '<li>' + (urlLink(s.url, s.publisher) || esc(s.publisher)) + ' · ' + esc(s.accessed_on || 'Prüfdatum offen') + '</li>').join('') + '</ul></section>';
}
