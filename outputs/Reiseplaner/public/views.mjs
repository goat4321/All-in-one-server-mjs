import { railReviewTimeline } from './rail-review-timeline.mjs';
import { surveyV19DayPanel, surveyV19RailPanel, surveyV19FoodPanel, surveyV19BudgetPanel, surveyV19DataPanel } from './survey-v19-ui.mjs';
import {v20RailStatus,v20FoodResearch,v20DataLedger} from './research-v20-ui.mjs';
import {entryCoveragePanel} from './entry-coverage-ui.mjs';
import {renderHeaderHud,renderDayHud,renderMapHud,mapSelectionEvidence} from './travel-hud.mjs';
import {mapDayAgenda,mapImageIntro,mapFloatingControls,mapPhotoDiscovery} from './reference-map-scene.mjs';
import {fieldNoteStrip} from './field-notes-ui.mjs';
import { routeSketch } from './route-mini-map.mjs';
import { destinationIllustration } from './destination-illustration.mjs';
import { providerQuotePanel } from './provider-quotes-v13.mjs';
import { providerLocationPanel } from './provider-location-v13.mjs';
import { mediaCoveragePanel } from './media-coverage.mjs';
import { readinessPanel, readinessOverview } from './readiness-panel.mjs';
import { optionMatchesFilter, smartFilterHelp } from './smart-filters.mjs';
import { dailyBudgetHtml } from './daily-budget.mjs';
import { guideMarkup } from './tutorial.mjs';
import { googleMapsSearchUrl, googleMapsSearchLabel, googleMapsDirectionsUrl, googleMapsLocationStatus } from './google-maps.mjs';
import { categories, budgetBreakdown, calculateBudget, activeItems, conflicts, groupPrice, groceryBasket, interrail, localParts, mealDate, mealEstimate, money, ticketBreakEven, dateRange, planReadiness } from './model.mjs';
import { icon, esc, shortDay, longDay, dateText, dateLabel, status, btn, iconBtn, chip, empty, alert, categoryIcon, cost, unit, urlLink, sourceList, timeText, transitPlanners } from './ui.mjs';
import { transitFares, transitNetworks } from './transit.mjs';
import { railSalesStatus, reviewProgress } from './verification.mjs';
import { official2027Notices } from './official-rules-2027.mjs';
import { EXPLORER_GROUPS, explorerDetail, explorerCategory } from './map-explorer.mjs';
import {markerProvenance} from './poi-location-provenance.mjs';
import { explorerToolbar, explorerList, explorerDayStrip } from './explorer-ui.mjs';
import { dayRouteView } from './day-route-ui.mjs';
import {foodDirectory,marketCoverage} from './food-discovery-v36.mjs';
import {activityDirectory} from './activity-directory.mjs';
import {mapUnlocatedReview,mapUnverifiedPointsReview} from './map-unlocated-v39.mjs';
import {browseHero,browseToolbar,browseItems,browseMatch,mapBrowseModes,
  mapBrowsePanel,foodTypeTabs,foodBrowseCards,browseOptionCard} from './browse-hub-v35.mjs';
import {dayPlanPanel,dayPlanOverview} from './day-plans-ui.mjs';
import { placeQuickFacts, placeProfileHtml, placeImageHtml, placeThumbnailHtml } from './place-profile.mjs';
import { dayPeriod,planCostSignal } from './visual-experience.mjs';
import { curatedPlacePhoto } from './curated-place-photos.mjs';
import { lodgingPriceInsight, lodgingPriceMeter } from './price-insights.mjs';
import { stayComparisonBoard } from './stay-compare-ui.mjs';
import { voteSnippet, groupVoteBoard } from './group-vote.mjs';
import { assessStay, sortStayOptions, kitchenAccess } from './stay-analysis.mjs';
import { auditInterrailRoute, railAlternativeStatus } from './rail-analysis.mjs';

const navSections=[
  {title:'Planung', ids:['overview','plan','map']},
  {title:'Reise organisieren', ids:['activities','discover','lodging','rail','food']},
  {title:'Verwalten', ids:['budget','group','data']}
];
const mobileTabs=['overview','plan','map','activities','lodging','food'];
const tabs = [
  ['overview', 'Übersicht', 'compass'], ['plan', 'Tagesplan', 'calendar'], ['map', 'Karte', 'map'],
  ['rail', 'Bahn & Interrail', 'train'], ['lodging', 'Unterkünfte', 'bed'], ['activities', 'Aktivitäten', 'compass'], ['discover', 'Entdecken', 'pin'],
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
    ? '<details class="source-notice"><summary>'+icon('alert')
      +'<strong>Forschungsstand · Reisedaten teilweise unvollständig</strong><span>Mehr erfahren</span></summary>'
      +'<p>Nur Forschungsdaten verfügbar: Die privaten Tripsy-Originaldateien fehlen in diesem Projektordner. Termine, Quellenbezüge und Buchungsdetails sind unvollständig. Es wurden keine Buchungen oder Live-Fahrpläne importiert.</p></details>'
    : '';
  const activeNav=navSections.map(section=>
    '<section class="sidebar-section"><div class="side-label">'+esc(section.title)+'</div><nav aria-label="'+esc(section.title)+'">'
    +section.ids.map(id=>{
      const tab=tabs.find(t=>t[0]===id);
      return '<button type="button" class="nav-btn" data-action="page" data-value="'+id
        +'" aria-current="'+(page===id?'page':'false')+'">'+icon(tab[2])+'<span>'+esc(tab[1])+'</span></button>';
    }).join('')+'</nav></section>').join('');
  const referenceNav=page==='map'?'<div class="reference-nav-brand"><button type="button" class="reference-brand-menu" data-action="menu" aria-label="Reisevarianten und weitere Seiten öffnen">'
    +icon('menu')+'</button><strong>Reiseplaner</strong></div>'
    +'<nav class="reference-main-nav" aria-label="Reise-Navigation">'
    +'<button type="button" data-action="page" data-value="map" aria-current="page">'+icon('pin')+'<span>Reise</span></button>'
    +'<button type="button" data-action="page" data-value="discover">'+icon('compass')+'<span>Entdecken</span></button>'
    +'<button type="button" data-action="explorer-saved-only" aria-pressed="'+Boolean(ctx.explorer?.savedOnly)+'">'+icon('bookmark')+'<span>Merkliste</span></button>'
    +'</nav><label class="reference-global-search"><span class="sr-only">Reiseorte durchsuchen</span>'
    +icon('search')+'<input id="reference-top-search" type="search" maxlength="100" autocomplete="off"'
    +' value="'+esc(ctx.mapSearch??'')+'" placeholder="Ziele, Orte, Aktivitäten suchen …"></label>'
    : '';
  const mobileDock='<nav class="mobile-dock" aria-label="Schnellnavigation">'
    +mobileTabs.map(id=>{
      const tab=tabs.find(t=>t[0]===id);
      return '<button type="button" data-action="page" data-value="'+id
        +'" aria-current="'+(page===id?'page':'false')+'">'+icon(tab[2])+'<span>'+esc(tab[1])+'</span></button>';
    }).join('')+'</nav>';
  return `<div class="shell ${page==='map'?'reference-travel-shell'+(ctx.mapSimple?' simple-map-mode':''):''}"><aside class="sidebar ${menu ? 'open' : ''}" aria-label="Reisenavigation">
    <div class="brand"><span class="brandmark">${icon('train')}</span> Reiseplaner</div>
    <div class="sidebar-inner">
      <div class="side-label">Reisevariante</div>
      <div class="trip-picker"><select id="variant" aria-label="Reisevariante">${variants.map(v => {
        const base = ctx.catalog.trips.find(t => t.id === v.base);
        return '<option value="' + esc(v.id) + '"' + (v.id === variant.id ? ' selected' : '') + '>' + esc(v.state.title ?? base.title) + '</option>';
      }).join('')}</select><small>${dateLabel(trip.from, trip.to)} · ${variant.state.people.length} Reisende</small></div>
      ${activeNav}
      <details class="sidebar-places" ${ctx.cityNavOpen?'open':''}><summary>Reiseorte <span>${places.length}</span></summary>
      <nav aria-label="Reiseorte">${places.map(id => '<button type="button" class="city-btn" data-action="city" data-value="' + id
        + '" aria-current="' + (city === id) + '"><span class="dot"></span>' + esc(cities[id]?.name ?? id) + '</button>').join('')}</nav>
      </details>
    </div>
    <div class="sidebar-bottom">${icon('lock')} <span>Privat auf diesem Gerät</span>
      <button type="button" class="motion-preference-button" data-action="map-motion"
        data-value="${ctx.mapMotion==='off'?'on':'off'}"
        aria-pressed="${ctx.mapMotion!=='off'}"
        aria-label="${ctx.mapMotion==='off'?'Animationen aktivieren':'Animationen deaktivieren'}">
        ${icon('spark')} ${ctx.mapMotion==='off'?'Animationen einschalten':'Animationen ausschalten'}
      </button>
    </div>
  </aside><div class="main-column"><header class="topbar ${page==='map'?'reference-topbar':''}">
    ${referenceNav}
    <div class="crumb"><span class="mobile-menu">${iconBtn('menu', 'Navigation öffnen', 'menu')}</span><strong>${esc(currentTitle)}</strong>${icon('chevron')}<span>${esc(tabTitle)}</span></div>
    ${renderHeaderHud(ctx)}
    <div class="top-actions"><nav class="topbar-shortcuts" aria-label="Schnellzugriff">
      <button type="button" data-action="page" data-value="plan" aria-current="${page==='plan'?'page':'false'}">${icon('calendar')} Tag</button>
      <button type="button" data-action="page" data-value="map" aria-current="${page==='map'?'page':'false'}">${icon('map')} Karte</button>
      <button type="button" data-action="page" data-value="lodging" aria-current="${page==='lodging'?'page':'false'}">${icon('bed')} Unterkünfte</button>
      <button type="button" data-action="page" data-value="food" aria-current="${page==='food'?'page':'false'}">${icon('food')} Verpflegung</button>
    </nav><span class="status-icon">${saving ? 'Speichert …' : 'Lokal gespeichert'}</span>
    <button type="button" class="guide-launch" data-action="guide-start" aria-label="Interaktive Tour starten" title="Interaktive Tour starten">${icon('spark')}<span>Tour</span></button>
    ${iconBtn('theme', theme === 'dark' ? 'Helles Design' : 'Dunkles Design', theme === 'dark' ? 'sun' : 'moon')}
    ${iconBtn('undo', 'Letzte Änderung rückgängig', 'reset')}
    ${iconBtn('page', 'Daten importieren', 'upload', 'data')}</div>
  </header><main class="workspace" id="main">${page==='map'?'':sourceNotice}${content(ctx, cityName)}${page==='map'?sourceNotice:''}</main>${guideMarkup(ctx.guideIndex)}</div>${mobileDock}</div>`;
}

function content(ctx, city) {
  switch (ctx.page) {
    case 'overview': return overview(ctx);
    case 'map': return mapImageIntro(ctx)
      + '<div class="map-explorer-split reference-map-workspace" aria-label="Orte, Karte und Reiseplanung">'
      + '<div class="reference-stage-days">'+mapBrowseModes(ctx)
      +(ctx.explorer?.scope==='day'?explorerDayStrip(ctx):'')+'</div>'
      + mapPanel(ctx, true) + '<div class="explorer-right" aria-label="Kategorien, Orte und Tagesplanung">'
      +(ctx.explorer?.scope==='day'
        ?mapDayAgenda(ctx)+dayPlanPanel(ctx,{compact:true})+fieldNoteStrip(ctx)
        :mapBrowsePanel(ctx))
      + explorerToolbar(ctx) + explorerList(ctx) + '</div>'
      + mapPhotoDiscovery(ctx) + '</div>'
      + mapUnlocatedReview(ctx) + mapUnverifiedPointsReview(ctx) + dayRouteView(ctx);
    case 'rail': return rail(ctx) + surveyV19RailPanel(ctx) + v20RailStatus(ctx);
    case 'lodging': return options(ctx, true);
    case 'discover': return options(ctx, false);
    case 'activities': return activityDirectory(ctx);
    case 'food': return food(ctx)
      +'<details class="hub-technical-details hub-food-research"'
      +(ctx.browseFoodResearchOpen?' open':'')+'><summary>'
      +icon('chevron')+'<span><strong>Weitere Recherche & Quellen</strong>'
      +'<small>Umfrageauswertung, Betreiberinformationen und Preisbeispiele</small>'
      +'</span></summary><div class="hub-research-body">'
      +surveyV19FoodPanel(ctx)+v20FoodResearch(ctx)+'</div></details>';
    case 'budget': return budget(ctx) + surveyV19BudgetPanel(ctx);
    case 'group': return group(ctx);
    case 'data': return data(ctx) + entryCoveragePanel(ctx) + surveyV19DataPanel(ctx) + v20DataLedger(ctx);
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
    ${renderDayHud(ctx,dayTotal)}
    <div class="subheading"><div><h2>Reiseplan</h2><p>${dateLabel(trip.from, trip.to)} · ${dates.length} Reisetage im Kalender</p></div>
    <div class="mobile-switch" aria-label="Ansicht">${chip('mobile', 'Liste', mobile === 'plan', 'plan', 'list')}${chip('mobile', 'Karte', mobile === 'map', 'map', 'map')}</div></div>
    <div class="days" aria-label="Reisetage">${dates.map(d => '<button type="button" class="day" data-action="day" data-value="' + d + '" aria-pressed="' + (d === date) + '"><strong>' + esc(shortDay(d)) + '</strong><small>' + esc(ctx.cities[ctx.cityForDay(d)]?.name ?? 'Reise') + '</small></button>').join('')}</div>
    ${dayPlaces(ctx)}
    ${dayPlanPanel(ctx)}
    <div class="plan-grid" data-mobile="${mobile}">
      <section class="panel timeline-panel"><div class="panel-head"><div><h2>Tagesablauf</h2><p>${day.length} ${day.length === 1 ? 'Eintrag' : 'Einträge'} · ${dayTotal ? money(dayTotal) + ' erfasst' : 'Kosten zum Teil offen'}</p></div>
      ${iconBtn('add', 'Planeintrag hinzufügen', 'plus')}</div>
      ${warnings.length ? '<div class="panel-pad">' + warnings.map(w => alert(w.text)).join('') + '</div>' : ''}
      <div class="timeline">${day.length ? [
        anchor && first?.from.anchor ? connector(first, routes[0], 0, 'Ab Unterkunft', people.length) : '',
        ...day.map((item, index) => {
          const after = ctx.segments.findIndex(segment => segment.from.entryKey === item.entryKey);
          const period=dayPeriod(item.time);
          const lastPeriod=index?dayPeriod(day[index-1].time):null;
          const periodLabel=period&&period.key!==lastPeriod?.key
            ?'<div class="timeline-period '+period.key+'">'+icon(period.icon)+'<strong>'+period.title+'</strong></div>':'';
          const signal=planCostSignal(item,people.length);
          const pinned = selected === item.entryKey;
          const name = item.kind === 'transport' ? item.role + ' · ' + (item.role === 'Ankunft' ? item.arrival : item.departure)
            : item.role ? item.role + ' · ' + item.name : item.name;
          const duration = item.duration ? item.duration + ' Min. · ' : '';
          const place = ctx.wholeDay ? (ctx.cities[item.placeCity]?.name ?? 'Ort offen') + ' · ' : '';
          const line = place + (item.kind === 'transport' ? item.name + (item.mode === 'roadtrip' ? ' · Autofahrt' : ' · Entwurf')
            : duration + (item.tags?.slice(0, 2).join(' · ') || item.category || 'Geplant'));
          return periodLabel+`<article class="timeline-event"><time>${esc(item.time ?? 'Flexibel')}</time><div class="axis"><span class="number">${index + 1}</span></div>
          <div class="event-card ${pinned ? 'selected' : ''}" data-event-id="${esc(item.id)}" ${!item.locked && !item.booked && item.kind !== 'transport' && item.kind !== 'lodging' ? 'draggable="true"' : ''}>
          <button type="button" class="event-content" data-action="select" data-value="${esc(item.entryKey)}" aria-pressed="${pinned}">
          ${placeThumbnailHtml(item,ctx)}<div class="timeline-event-copy">
          <h3>${icon(categoryIcon(item))}${esc(name)} ${item.locked || item.booked ? icon('lock') : ''}</h3>
          <small>${esc(line)}</small><span class="timeline-price" title="${esc(signal.note)}">${esc(signal.tier)} · ${esc(signal.amount)}</span></div></button>
          <button type="button" class="mini-action" data-action="edit" data-value="${esc(item.id)}" aria-label="Bearbeiten: ${esc(item.name)}">${icon('edit')}</button></div></article>`
          + (after >= 0 ? connector(ctx.segments[after], routes[after], after, ctx.segments[after] === last && last.to.anchor ? 'Zur Unterkunft' : '', people.length) : '');
        }),
      ].join('') : empty('Dieser Tag ist noch offen', 'Ergänze einen Termin oder übernimm eine Option aus Entdecken.')}</div>
      ${ctx.wholeDay ? '' : '<div class="insight">' + icon('spark') + '<div><strong>' + (anchor ? 'Unterkunft als Tagesanker' : 'Unterkunft vergleichen') + '</strong><div>'
        + (anchor ? esc(anchor.name) + ' fließt in verfügbare Hin- und Rückwege ein.' : 'Standorte und Gruppenpreise für diesen Aufenthalt ansehen.') + '</div></div></div>'}
      <div class="panel-pad inline">${btn('page', 'Unterkünfte', 'bed', 'lodging')}${btn('page', 'Aktivitäten', 'compass', 'discover')}${btn('page', 'Verpflegung', 'food', 'food')}${day.length > 1 ? btn('optimize', 'Tag prüfen', 'spark') : ''}</div>
    </section>${mapPanel(ctx)}</div>${surveyV19DayPanel(ctx)}`;
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
  return '<div class="journey-connection"><button type="button" class="connector" data-action="leg" data-value="' + index + '">' + icon(route?.mode === 'ÖPNV' ? 'train' : 'walk') + esc(label ? label + ' · ' + details : details) + '</button>'
    + (urlLink(googleMapsDirectionsUrl(segment.from, segment.to, {}, 'transit'), 'ÖPNV Google Maps') || '') + '</div>';
}

export function mapDetail(ctx) {
  // Atlas visitors use the compact overlay, highlighted list card and
  // explicit full-details dialog. Avoid duplicating entire profiles below
  // the map (a second panel could make the sticky map taller than viewport).
  if(ctx.explorer)return '';
  const item = ctx.detail;
  if (!item) return '';
  const rows = ctx.segments.flatMap((segment, index) => [segment.from, segment.to].some(stop => item.entryKey ? stop.entryKey === item.entryKey : stop.id === item.id)
    ? [connector(segment, ctx.routes[index], index, segment.from.name + ' → ' + segment.to.name, ctx.people.length)] : []);
  return '<div class="map-detail" id="point-detail">'
    + placeProfileHtml(item,ctx,{compact:true})
    + (item.access ? '<p>' + esc(item.access) + '</p>' : '')
    + (item.positionIssue ? alert(item.positionIssue) : '')
    + (item.geoEvidence ? '<p class="muted"><strong>Standortbeleg:</strong> ' + esc(item.geoEvidence.note) + '</p>' : '')
    + (rows.length ? '<div class="local-routes">' + rows.join('').replaceAll('class="connector"', 'class="connector detail-connector"') + '</div>' : '')
    + '<div class="row-actions">' + btn('details', 'Alle Quellen & Details', 'folder', item.id)
    + (ctx.explorer && item.point ? btn('explorer-nearby', 'Im Umkreis', 'target', item.id)
      + btn('explorer-start', 'Start hier', 'pin', item.id)
      + btn('explorer-end', 'Ziel hier', 'arrow', item.id) : '')
    + (item.selected ? btn('edit','Bearbeiten','edit',item.id)
      : item.kind!=='transport' ? btn('choose',item.kind==='lodging'?'Aufenthalt wählen':'In Tagesplan','plus',item.id,'subtle') : '')
    + '</div></div>';
}

// Compact on-map selection works on phones; desktop users also see the
// corresponding highlighted card in the adjacent scrollable results pane.
export function mapSelectionPreview(ctx) {
  if(!ctx.explorer||!ctx.detail?.name)return '';
  const item=ctx.detail,id=item.explorerId??item.id;
  const category=EXPLORER_GROUPS[item.explorerCategory]?.label??'Reiseort';
  const signal=planCostSignal(item,ctx.people.length);
  const provenance=markerProvenance(item);
  const locationLabel={
    sourced:'Quellenpunkt',area:'Gebäude-/Gebietsreferenz',
    provider:'Anbieterposition prüfen',unverified:'Position prüfen',
    none:'Standort offen',
  }[provenance.kind]??'Standort prüfen';
  const selectedPrice=signal.tier==='€?'?signal.amount:signal.tier+' · '+signal.amount;
  const bookmarked=ctx.explorer.saved?.has(item.id)??false;
  return '<div class="map-selected-place" role="group" aria-label="Ausgewählter Reiseort">'
    +placeThumbnailHtml(item,ctx)
    +'<div class="map-selected-copy"><strong>'+esc(item.name)+'</strong><small>'
    +esc(ctx.cities[item.city]?.name??item.city)+' · '+esc(category)
    +' · '+esc(locationLabel)
    +'</small><small class="map-selected-cost" title="'+esc(signal.note)+'">'
    +esc(selectedPrice)
    +(item.time?' · '+esc(item.time):'')+'</small>'
    +mapSelectionEvidence(item,ctx)+'</div><div class="map-selected-actions">'
    +btn('explorer-save',bookmarked?'Merken entfernen':'Merken',bookmarked?'check':'bookmark',id)
    +btn('explorer-list-focus','In Liste','list',id)
    +btn('details','Details','folder',id)+'</div></div>';
}

function mapPanel(ctx, full = false) {
  const tourCities=[...new Set(ctx.trip.route)].filter(id=>ctx.cities[id]?.point);
  const tripJourney=ctx.total&&ctx.page==='map'
    ? '<details class="route-city-showcase" aria-label="Städte der Reiseroute">'
      + '<summary class="route-city-showcase-head"><strong>Reiseroute entdecken</strong>'
      + '<span>Reihenfolge aus deiner Planung · Verbindungen schematisch</span></summary>'
      + '<div class="route-city-steps">'+tourCities.map((id,i)=>
        '<button type="button" class="route-city-step" data-action="city" data-value="'+esc(id)
        +'" aria-label="Reiseort '+(i+1)+': '+esc(ctx.cities[id].name)+' öffnen">'
        +'<span>'+(i+1)+'</span><strong>'+esc(ctx.cities[id].name)
        +'</strong><small>'
        +esc(ctx.trip.stayByCity?.[id]?.from
          ?shortDay(ctx.trip.stayByCity[id].from)
            +(ctx.trip.stayByCity[id].to?' – '+shortDay(ctx.trip.stayByCity[id].to):'')
          :'Reiseort')
        +'</small></button>').join('')+'</div></details>'
    : '';
  const t = ctx.filters;
  const network = transitNetworks[ctx.city];
  const quickLayer = network?.quick;
  const timetable = ctx.catalog.transitSchedules?.[ctx.city];
  const outside = timetable && (ctx.date < timetable.from || ctx.date > timetable.to);
  const dayRail=ctx.explorer&&!ctx.total&&ctx.day.length
    ?'<nav class="map-day-rail" aria-label="Zeitfolge der ausgewählten Tagesplanung">'
      +'<span class="map-day-rail-label">'+icon('clock')+' Im Tagesplan</span>'
      +'<div class="map-day-rail-track">'+ctx.day.slice(0,9).map((entry,i)=>
        '<button type="button" class="map-day-stop" data-action="select" data-value="'+esc(entry.entryKey)
        +'" aria-pressed="'+(ctx.selected===entry.entryKey)+'" title="Planzeit, keine geprüfte Öffnungszeit">'
        +'<span class="map-day-stop-index">'+(i+1)+'</span><span>'
        +'<strong>'+esc(entry.time??'Flexibel')+'</strong><small>'+esc(entry.name)+'</small>'
        +'</span></button>').join('')+'</div>'
      +(ctx.day.length>9?'<small>+'+(ctx.day.length-9)+' weitere Einträge im Tagesplan</small>':'')+'</nav>'
    :'';
  return `<section class="panel map-panel ${full ? 'map-full' : ''} ${ctx.mapExpanded ? 'map-immersive' : ''}" aria-label="Interaktive Karte">
    <div class="panel-head"><div><h2>${ctx.total?'Gesamte Reiseroute':ctx.explorer?.scope==='day'
      ?'Tag '+(ctx.dates.indexOf(ctx.date)+1)+' · '+esc(ctx.cities[ctx.city].name)
      :esc(ctx.cities[ctx.city].name)+' entdecken'}</h2>
    <p>${ctx.total?'Reiseorte und vorhandene Kartenpunkte · schematische Bahnverbindungen'
      :ctx.explorer?.scope==='day'
        ?(ctx.day.length?ctx.day.length+' geplante Stopps':(ctx.dayPlan?.slots.length??0)+' Tagesideen')+' · '+esc(shortDay(ctx.date))
        :ctx.explorer?.placed.length+' Kartenpunkte · '+ctx.explorer?.unlocated.length+' Ortsangaben ohne Pin'}</p></div>
    <div class="inline">${iconBtn('fit', 'Kartenausschnitt zurücksetzen', 'target')}${iconBtn('layers', 'Weitere Kartenebenen', 'layers')}</div></div>
    <div class="map-tools" aria-label="Kartenebenen">
      ${chip('map-mode', 'Tag', !ctx.total, 'day')}${chip('map-mode', 'Gesamt', ctx.total, 'total')}
      ${ctx.explorer ? '<span class="muted">Alle vorhandenen Orte · farbige Kategorien · keine erfundenen Positionen</span>' : ''}
      ${!ctx.total ? chip('filter', 'Fußwege', t.walk, 'walk', 'walk') + chip('filter', 'Alternativen', t.options, 'options', 'pin')
        + (quickLayer ? chip('transit', network.groups[quickLayer].title, t.transit[quickLayer], quickLayer, 'train') : '')
        + (ctx.cities[ctx.city].country === 'CH' ? chip('filter', 'Wanderwege', t.hiking, 'hiking', 'walk') : '') : ''}
    </div>
    ${!full && !ctx.total && outside ? '<div class="alert" role="status">Kein gültiger Fahrplan für ' + esc(dateText(ctx.date)) + ' im lokalen Datenpaket. Die gespeicherte Referenz deckt nur ' + esc(dateText(timetable.from)) + '–' + esc(dateText(timetable.to)) + ' ab. Linien auf der Karte sind Orientierung, keine 2027er Echtzeitfahrten. ' + urlLink(transitPlanners[ctx.city], 'Betreiberplaner') + '</div>' : ''}
    ${!ctx.total && ctx.timetablePreview ? '<div class="map-preview"><span>' + esc('ÖPNV-Vorschau · '
      + dateText(ctx.timetablePreview.route.date) + ' · ' + ctx.timetablePreview.route.line) + '</span>'
      + iconBtn('transit-clear', 'Fahrplanvorschau schließen', 'close') + '</div>' : ''}
    <div class="map-wrap" data-map-tone="${esc(ctx.mapTone)}"><div id="map" tabindex="0" aria-label="Verschiebbare Karte mit Zoom"></div>
    <div class="map-source-indicator" id="map-source-indicator" data-state="loading" role="status" aria-live="polite">
      <span id="map-source-label">Kostenlose Karte wird geladen …</span>
      <button type="button" class="map-source-retry" id="map-source-retry" data-action="map-basemap-retry" hidden>Erneut laden</button>
    </div>
      ${mapFloatingControls(ctx)}
      ${ctx.page==='map'?'<div class="map-place-switches">'
        +'<button type="button" class="point-overview-toggle" data-action="map-points-toggle" aria-pressed="'
        +Boolean(ctx.total)+'">'+icon('pin')
        +(ctx.total?'Stadtansicht':'Alle Kartenpunkte')+'</button>'
        +(!ctx.total?'<button type="button" class="market-toggle" data-action="map-supermarkets" aria-pressed="'
          +Boolean(ctx.explorer?.marketsShown)+'">'+icon('folder')
          +(ctx.explorer?.marketsLoading?' Suche läuft …':ctx.explorer?.marketsShown
            ?ctx.explorer.marketCount+' Supermärkte':'Supermärkte anzeigen')
          +'</button>':'')
        +(ctx.explorer?.marketsError?'<span class="market-status">'+esc(ctx.explorer.marketsError)+'</span>':'')
        +(ctx.explorer?.marketsShown&&!ctx.total&&ctx.explorer.marketsNote
          ?'<span class="market-status" title="'+esc(ctx.explorer.marketsNote)+'">6,5 km Umkreis · Geodaten, Öffnung unbestätigt</span>':'')
        +'</div>':''}
      <div id="map-selection-preview" class="map-selection-preview" aria-live="polite">${mapSelectionPreview(ctx)}</div>
      ${renderMapHud(ctx)}
      ${ctx.explorer && ctx.dayRoute.items.length>1 && !ctx.total
        ? '<div class="route-map-hud"><span class="route-map-pulse"></span><strong>Route Studio</strong><span>'
          +ctx.dayRoute.items.length+' Stopps · '
          +(ctx.dayRoute.routes.filter(r=>r?.walkOnly).length)+' Fußwege berechnet</span></div>' : ''}
      <div class="map-hint" id="map-hint" hidden></div>
      ${ctx.page==='map'&&ctx.mapSimple&&!ctx.total&&ctx.dayPlan?.slots.length
       &&!ctx.day.some(item=>item.kind==='activity')
        ?'<div class="reference-preview-map-note">'+icon('pin')
          +' Tagesideen · nur belegte Pins, Wege noch nicht berechnet</div>'
        :''}
    </div>
    ${full && !ctx.total && outside ? '<details class="reference-map-schedule-notice"><summary>'+icon('alert')+'<span>Fahrplan 2027 offen</span></summary>'
      +'<div>Die lokale Referenz deckt nur '+esc(dateText(timetable.from))+' bis '+esc(dateText(timetable.to))
      +' ab. Für '+esc(dateText(ctx.date))+' keine bestätigten Echtzeitfahrten. '
      +urlLink(transitPlanners[ctx.city],'Beim Betreiber prüfen')+'</div></details>' : ''}
    <details class="map-design-details" ${ctx.mapDesignOpen?'open':''}><summary>Darstellung & Kartengröße</summary>
    <div class="map-design-controls" role="group" aria-label="Design und Größe der Karte">
      <span class="map-design-caption">Kartenlook</span>
      ${chip('map-tone','Klassisch',ctx.mapTone==='standard','standard','map')}
      ${chip('map-tone','Midnight',ctx.mapTone==='midnight','midnight','moon')}
      ${chip('map-tone','Sand',ctx.mapTone==='sand','sand','sun')}
      ${chip('map-expand',ctx.mapExpanded?'Normalgröße':'Großansicht',ctx.mapExpanded,'toggle','target')}
      <span class="map-design-caption">Marker-Dichte</span>
      ${chip('map-density','Ruhige Karte',ctx.mapDensity!=='detail','calm','layers')}
      ${chip('map-density','Alle Einzelmarker',ctx.mapDensity==='detail','detail','pin')}
      ${chip('map-motion',ctx.mapMotion==='off'?'Animationen aus':'Sanfte Animationen',ctx.mapMotion!=='off',ctx.mapMotion==='off'?'on':'off','spark')}
    </div></details>
    ${tripJourney}
    <div class="map-legend"><span><i class="legend-line ${ctx.total ? 'dashed' : ''}"></i> ${ctx.total ? 'Städtefolge · Schema' : 'Berechneter Fußweg'}</span>
    ${ctx.explorer ? Object.entries(EXPLORER_GROUPS).map(([id, group]) =>
      '<button type="button" class="map-legend-control" data-action="explorer-group" data-value="'+esc(id)
      +'" aria-pressed="'+(ctx.explorer.group===id)+'" title="Nur diese Kategorie auf der Karte anzeigen">'
      +'<i class="category-swatch '+esc(id)+'"></i>'+esc(group.label)+'</button>').join('') : ''}
    ${ctx.explorer ? '<span class="map-source-legend" aria-label="Genauigkeit von Kartenpunkten">'
      +'<span><i class="map-provenance-swatch area"></i> Flächenpunkt · Eingang offen</span>'
      +'<span><i class="map-provenance-swatch provider"></i> Anbieterposition · ungeprüft</span>'
      +'<span><i class="map-provenance-swatch unverified"></i> Quellenstatus offen</span>'
      +'</span>' : ''}
    ${ctx.explorer?.showCityReferences && ctx.explorer.unlocated.length ? '<span>Grau gestrichelt ? = Stadt-Sammelmarker, keine nachgewiesene Objektposition</span>' : ''}
    ${!ctx.total && t.stations && ctx.dayTravel.length ? '<span><i class="legend-line dashed"></i> Tagesfahrt · Schema</span>' : ''}
    ${!ctx.total && (ctx.timetablePreview || ctx.routes.some(route => route?.legs?.length)) ? '<span>ÖPNV · gespeicherter / referenzierter Fahrplan, Reisedatum prüfen</span>' : ''}
    ${!ctx.total ? '<span><i class="legend-dot"></i> Alternative</span>' : ''}
    ${!ctx.total && network?.dateLabel ? '<span>' + esc(network.dateLabel) + ' · Netzreferenz</span>' : ''}
    ${!ctx.total && ctx.cities[ctx.city].country === 'CH' && t.hiking ? '<span>Signalisiertes Netz · ab Zoomstufe 10</span>' : ''}
    ${!ctx.total ? urlLink(transitPlanners[ctx.city], 'ÖPNV-Planer') : ''}</div>

    ${dayRail}
    <div id="detail-container">${mapDetail(ctx)}</div>
  </section>`;
}

function overview(ctx) {
  const { trip, catalog } = ctx;
  const readiness = planReadiness(trip, ctx.active, ctx.budget);
  const ruleRows = official2027Notices(trip).map(rule => [
    esc(rule.title), esc(rule.message), esc(rule.verification), urlLink(rule.source, 'Offizielle Quelle'),
  ]);
  const lodgingUnchecked = ctx.active.filter(item => item.kind === 'lodging'
    && !item.booked && !reviewProgress('lodging', ctx.state.verifications?.[item.id], ctx.people.length).complete).length;
  const railChecks = ctx.active.filter(item => item.kind === 'transport' && item.mode === 'train');
  const railUnchecked = railChecks.filter(item =>
    !reviewProgress('transport', ctx.state.verifications?.[item.id], ctx.people.length).complete).length;
  const validLocalSchedule = catalog.transitSchedules?.[ctx.city];
  const missingLocalSchedule = validLocalSchedule
    && (ctx.date < validLocalSchedule.from || ctx.date > validLocalSchedule.to);
  const readinessRows = [
    ['Unterkunft', readiness.missingStays.length ? readiness.missingStays.length + ' Aufenthaltsorte noch nicht vollständig gewählt' : 'Alle bekannten Aufenthalte einer aktiven Unterkunft zugeordnet',
      'lodging', 'Unterkünfte prüfen'],
    ['Bahn', readiness.uncheckedTrains + ' ausgewählte Bahnabschnitte ohne bestätigten Fahrplan', 'rail', 'Bahn prüfen'],
    ['Zuganbieter-Prüfung', railUnchecked + ' von ' + railChecks.length + ' Bahnabschnitten ohne vollständig dokumentierte Eigenprüfung; keine echte Reservierungsbestätigung', 'rail', 'Belege dokumentieren'],
    ['Unterkunfts-Checkout', lodgingUnchecked + ' ausgewählte, ungebuchte Unterkünfte ohne vollständigen eigenen Checkout-/Bettennachweis', 'lodging', 'Zimmer und Endpreise prüfen'],
    ['ÖPNV-Fahrplandaten', missingLocalSchedule ? 'Lokaler Fahrplan endet ' + dateText(validLocalSchedule.to) + ', Reisetag ' + dateText(ctx.date) + ' liegt außerhalb des Datenzeitraums' : validLocalSchedule ? 'Lokales GTFS-Paket deckt den gewählten Tag ab; Betrieb und Preise weiter prüfen' : 'Nur statische Kartenreferenz, kein vollständiger lokaler Fahrplandatensatz', 'map', 'Karten-/Fahrplanstand prüfen'],
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
  const shortcuts=[
    ['plan','Tagesplan öffnen','Termine, Wege und Reisestopps','calendar'],
    ['map','Karte entdecken','Orte, Umkreis und Routen','map'],
    ['lodging','Unterkünfte vergleichen','Suchpreise und Lage prüfen','bed'],
    ['rail','Zugfahrten prüfen','Buchungsfenster und Reservierungen','train']
  ];
  // Source-scoped destination imagery: never substitute a random hotel/provider
  // picture. Commons license credit and source stay visible with every photo.
  const destinationCards=[...new Set(trip.route)].slice(0,9).map(id=>{
    const photoItem=ctx.all.find(item=>item.city===id&&item.kind==='activity'&&curatedPlacePhoto(item));
    const photo=photoItem?curatedPlacePhoto(photoItem):null;
    return '<article class="destination-card"><button type="button" data-action="trip-city" data-value="'+esc(id)+'">'
      +'<span class="destination-cover">'
      +'<span class="destination-placeholder" aria-hidden="true">'+destinationIllustration(id)+'</span>'
      +(photo?'<img src="'+esc(photo.url)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="'+esc(photoItem.name)+'">':'')
      +'</span>'
      +'<span class="destination-name">'+esc(ctx.cities[id]?.name??id)+'</span>'
      +'<small>'+esc(photoItem?.name??'Reiseort erkunden')+'</small></button>'
      +(photo?'<a class="destination-credit" href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer" title="'+esc(photo.credit)+'">Bild: '+esc(photo.credit)+'</a>'
      :'<small class="destination-credit">Symbolische Illustration · kein Ortsfoto</small>')
      +'</article>';
  }).join('');
  const progress=readinessOverview(ctx).filter(r=>['stays','hotel-review','rail-review','cost'].includes(r.key));
  const progressLink={stays:'lodging','hotel-review':'lodging','rail-review':'rail',cost:'budget'};
  const routeGraphic=routeSketch(trip.route,ctx.cities);
  const routePoints=routeGraphic.stops.map(stop=>
    '<button class="cockpit-route-point" type="button" style="--px:'+stop.x+'%;--py:'+stop.y+'%"'
      +' data-action="trip-city" data-value="'+esc(stop.id)+'" title="'+esc(stop.name)+' im Tagesplan öffnen">'
      +'<span>'+stop.order+'</span><small>'+esc(stop.name)+'</small></button>').join('');
  const overviewRoute='<section class="cockpit-route-surface" aria-label="Schematische Städtefolge der Reise">'
    +'<div class="cockpit-route-head"><div><span class="cockpit-mini-label">DEINE ROUTE</span>'
    +'<h2>'+routeGraphic.stops.length+' Reiseziele. Eine Route.</h2>'
    +'<p>Städtefolge im Entwurf · keine berechnete Bahntrasse</p></div>'
    +btn('show-route','Karte öffnen','arrow')+'</div>'
    +'<div class="cockpit-route-canvas">'
    +(routeGraphic.stops.length>1
      ?'<svg viewBox="0 0 560 280" preserveAspectRatio="none" aria-hidden="true">'
       +'<path class="cockpit-route-under" d="'+routeGraphic.path+'"/>'
       +'<path class="cockpit-route-line" d="'+routeGraphic.path+'"/></svg>'+routePoints
      :'<div class="cockpit-route-empty">Für diese Variante sind noch keine zwei Stadt-Anker hinterlegt.</div>')
    +'</div><div class="cockpit-route-foot"><span>'+icon('map')+' Schematische Übersicht</span>'
    +'<span>'+esc(dateLabel(trip.from,trip.to))+'</span></div></section>';
  const quickStartHtml='<section class="overview-start" aria-label="Schnell zum nächsten Planungsschritt">'
    + '<div class="overview-start-copy"><strong>Wo möchtest du weiterplanen?</strong><span>Direkter Zugang zu den wichtigsten Aufgaben</span></div>'
    + '<div class="overview-quick-grid">'+shortcuts.map(([id,label,note,symbol])=>
      '<button type="button" class="overview-quick-card" data-action="page" data-value="'+id+'">'
      +'<span class="overview-quick-icon">'+icon(symbol)+'</span><span><strong>'+esc(label)+'</strong><small>'+esc(note)+'</small></span>'
      +icon('arrow')+'</button>').join('')+'</div></section>';
  return heading('Reiseübersicht', ctx.variant.state.title ?? trip.title, btn('copy', 'Variante duplizieren', 'plus'))
    + quickStartHtml
    + dayPlanOverview(ctx)
    + '<div class="cockpit-layout">'
    + '<section class="cockpit-welcome" aria-label="Reise auf einen Blick">'
    + '<div class="cockpit-intro"><span class="cockpit-eyebrow">'+icon('compass')+' DEIN REISE-COCKPIT</span>'
    +'<h2>'+esc(ctx.variant.state.title??trip.title)+'</h2>'
    +'<p>'+esc(trip.route.slice(0,5).map(id=>ctx.cities[id]?.name??id).join(' → '))
      +(trip.route.length>5?' → …':'')+'</p>'
    +'<div class="cockpit-facts">'
    +'<span>'+icon('calendar')+esc(dateLabel(trip.from,trip.to))+'</span>'
    +'<span>'+icon('pin')+new Set(trip.route).size+' Orte</span>'
    +'<span>'+icon('people')+ctx.people.length+' Reisende</span>'
    +'<span title="Bekannte Plankosten – kein endgültiger Buchungspreis">'+icon('wallet')+'Bekannte Plankosten: '+esc(money(ctx.budget.total))+'</span>'
    +'</div><p class="cockpit-disclaimer">'+ctx.budget.unknown+' Preisposten offen · Planwerte, keine bestätigten Buchungen</p></div>'
    +'<div class="cockpit-journey"><div class="cockpit-section-head"><div><strong>Reiseorte entdecken</strong>'
    +'<small>Fotos nur bei belegter Bildquelle</small></div>'
    +btn('show-route','Route öffnen','arrow')+'</div>'
    +'<div class="destination-filmstrip" aria-label="Reiseorte mit Quellenfotos">'+destinationCards+'</div></div></section>'
    +overviewRoute+'</div>'
    + '<section class="cockpit-progress" aria-label="Vorbereitung nachprüfen">'
    +'<div class="cockpit-section-head"><div><strong>Was ist schon vorbereitet?</strong>'
    +'<small>Nur in deinem Plan dokumentiert, nicht extern bestätigt</small></div>'
    +btn('page','Details & Fristen','arrow','data')+'</div>'
    +'<div class="cockpit-progress-track">'+progress.map(r=>{
      const pct=r.total?Math.min(100,Math.round(r.done/r.total*100)):0;
      return '<button type="button" class="cockpit-progress-item" data-action="page" data-value="'
      +progressLink[r.key]+'" aria-label="'+esc(r.title)+': '+r.done+' von '+r.total+'">'
      +'<span class="cockpit-progress-label"><strong>'+esc(r.title)+'</strong>'
      +'<small>'+r.done+' / '+r.total+'</small></span>'
      +'<span class="cockpit-progress-line" role="progressbar" aria-label="'+esc(r.title)
      +'" aria-valuemin="0" aria-valuemax="'+r.total+'" aria-valuenow="'+r.done+'"><i style="width:'+pct+'%"></i></span></button>';
    }).join('')+'</div></section>'
    + '<details class="cockpit-reference section"><summary><strong>Planungs-Check</strong>'
    +'<small>Alle Prüfungen und offenen Aufgaben anzeigen</small>'+icon('chevron')+'</summary>'
    +'<div class="cockpit-reference-body"><p class="muted">Direkt aus den ausgewählten Einträgen berechnet. Fehlende Angaben sind keine bestätigten Buchungen.</p>'
    +table(['Prüffeld', 'Aktueller Stand', 'Nächster Schritt'], readinessRows)+'</div></details>'
    + (ruleRows.length ? '<details class="cockpit-reference section"><summary><strong>Offizielle Reiseregeln für 2027</strong>'
      +'<small>Saisonale Hinweise und Quellen aufklappen</small>'+icon('chevron')+'</summary><div class="cockpit-reference-body">'
      +'<p class="muted">Nur belegte Saison- und Zugangsregeln, keine Garantie für Buchungen und Gültigkeit am Reisetag.</p>'
      +table(['Ort / Thema', 'Bekannte Regel und offene Punkte', 'Quellenstand', 'Prüfen'], ruleRows)+'</div></details>' : '')
    + '<details class="cockpit-reference section"><summary><strong>Varianten im Vergleich</strong>'
    +'<small>Kosten, Gruppen, Reisedauer und Pass-Tage vergleichen</small>'+icon('chevron')+'</summary>'
    +'<div class="cockpit-reference-body">'+table(['Variante', 'Zeitraum', 'Originalroute', 'Bekannte Plankosten', 'Personenanteile', 'Preise offen', 'Pass-Tage', 'Gruppe'], variants)+'</div></details>';
}

function options(ctx, lodging) {
  const { all, city, cities, people, optionFilter, sort, state, compareIds, activeSet } = ctx;
  const found=browseItems(all,{...ctx,browseSearch:''},
    {kind:lodging?'lodging':'activity'});
  const list=found.filter(item=>browseMatch(item,ctx.browseSearch,cities)
    &&optionMatchesFilter(item,optionFilter,ctx,lodging));
  if (sort === 'price') list.sort((a, b) => (groupPrice(a.price, people.length) ?? Infinity) - (groupPrice(b.price, people.length) ?? Infinity));
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  if (sort === 'score' && !lodging) list.sort((a, b) =>
    (b.preference?.score ?? -1) - (a.preference?.score ?? -1) || a.name.localeCompare(b.name, 'de'));
  if (lodging && sort==='person-night') list.sort((a,b)=>
    (lodgingPriceInsight(a,people.length,ctx.nightlyTargetEuro)?.personNightCents??Infinity)
     -(lodgingPriceInsight(b,people.length,ctx.nightlyTargetEuro)?.personNightCents??Infinity)
     || a.name.localeCompare(b.name,'de'));
  if (lodging && ['total','station','documentation'].includes(sort)) {
    const resorted = sortStayOptions(list,people,ctx.hotelWalks,state.verifications ?? {},sort);
    list.splice(0,list.length,...resorted);
  }
  const compared = found.filter(i => compareIds.has(i.id));
  const stay = ctx.trip.stayByCity[city];
  const stayEvaluations = lodging ? list.map(item => assessStay(item,people,ctx.hotelWalks[item.id],state.verifications?.[item.id])) : [];
  const comparisonGaps = lodging ? [
    ['Nicht bestätigte Betten',stayEvaluations.filter(x=>!x.bedsVerified).length],
    ['Preis oder Währung offen',stayEvaluations.filter(x=>x.totalEuroCents==null).length],
    ['Bahnhof-Fußweg offen',stayEvaluations.filter(x=>x.stationWalkMinutes==null).length],
    ['Keine vollständige Eigenprüfung',stayEvaluations.filter(x=>!x.review.complete).length],
  ] : [];
  const compareRows = compared.map(item => [esc(item.name), esc(cost(item, people.length)), esc(unit(item, people.length)),
    esc(lodging ? item.kitchen || 'Offen' : item.duration ? item.duration + ' Min.' : 'Offen'),
    esc(lodging ? item.room || 'Offen' : item.tags?.join(' · ') || 'Offen'),
    esc(lodging ? [ctx.hotelWalks[item.id]?.minutes != null
      ? (item.localStation ? 'Ab ' + item.localStation.name + ' · ' : '') + ctx.hotelWalks[item.id].minutes + ' Min. zu Fuß' : '',
      item.access].filter(Boolean).join(' · ') || 'Weg offen' : item.access || 'Weg im Tagesplan'),
    esc(lodging ? item.cancellation ?? 'Tarifbedingungen offen' : item.minAge ? item.minAge + '+' : 'Offen'),
    ...(lodging ? [esc((() => { const a=assessStay(item,people,ctx.hotelWalks[item.id],state.verifications?.[item.id]); return a.personNightEuroCents==null ? 'Preis offen' : money(a.personNightEuroCents) + ' p. P./Nacht'; })()),
      esc(assessStay(item,people,ctx.hotelWalks[item.id],state.verifications?.[item.id]).risk.slice(0,3).join(' · ')||'Eigenprüfung dokumentiert')] : [])]);
  const filters = [['all', 'Alle Optionen'], ['saved', 'Merkliste'], ['known', 'Mit Preisreferenz'],
    ...(lodging ? [['kitchen', 'Kochmöglichkeit beschrieben'], ['station','Bahnhof ≤15 Min. zu Fuß'],
      ['beds','Betten selbst geprüft'],['search', '2027-Suchpreise'],
      ['budget','Im Nachtbudget (inkl. Suchwerte)'], ['self_reviewed','Eigenprüfung dokumentiert']]
      : [['free','0-€-Preisreferenz'],['water','Wasser & Strand erwähnt'],
        ['swimming','Schwimmen erwähnt'],['consensus','Gruppenfavoriten ≥4'],
        ['evening', 'Abend'], ['food', 'Verpflegung']])];
  const cards=list.slice(0,ctx.browseLimit??24).map(item=>{
    const active=activeSet.has(item.id);
    const highlighted=compareIds.has(item.id);
    const meal=ctx.catalog.mealPlans?.[item.city]?.find(plan=>plan.venue===item.id);
    const verification=lodging
      ?reviewProgress('lodging',state.verifications?.[item.id],people.length):null;
    const stayStats=lodging?assessStay(item,people,ctx.hotelWalks[item.id],
      state.verifications?.[item.id]):null;
    return browseOptionCard(item,ctx,{lodging,active,highlighted,meal,
      verification,stayStats});
  }).join('');
  const cardLabel=lodging?'Unterkünfte':'Reiseideen';
  const quick=filters.slice(0,3).map(([id,label])=>
    chip('option-filter',label,optionFilter===id,id)).join('');
  const advanced=filters.slice(3).map(([id,label])=>
    chip('option-filter',label,optionFilter===id,id)).join('');
  return browseHero(ctx,lodging?'lodging':'discover',list.length)
    +browseToolbar(ctx,{kind:lodging?'lodging':'discover',total:found.length,
       filtered:list.length})
    +'<div class="hub-result-settings"><div class="hub-quick-filters">'+quick
    +'<details class="hub-filter-more"'+(ctx.browseFilterOpen?' open':'')
      +'><summary>'+icon('layers')
      +' Weitere Filter</summary><div>'+advanced+'</div></details></div>'
    +'<div class="hub-sort-controls">'
    +(lodging?'<label>Nachtbudget <input id="nightly-target" type="number"'
      +' min="5" max="1000" value="'+esc(ctx.nightlyTargetEuro)
      +'" aria-label="Budget pro Person und Nacht in Euro"> €</label>':'')
    +'<label>Sortieren <select id="sort">'
    +[['source','Quelle'],['price','Preis'],['name','Name'],
      ...(lodging?[['total','Gruppensumme'],['person-night','Pro Person/Nacht'],
         ['station','Bahnhof-Fußweg'],['documentation','Datenvollständigkeit']]
        :[['score','Gruppeninteresse']])]
      .map(([id,label])=>'<option value="'+id+'"'
       +(sort===id?' selected':'')+'>'+label+'</option>').join('')
    +'</select></label></div></div>'
    +'<p class="hub-results-title"><strong>'+list.length+' '+cardLabel+'</strong>'
    +'<span>'+esc(ctx.browseScope==='trip'?'In allen Reiseorten':cities[city].name)
    +' · '+esc(smartFilterHelp[optionFilter]??'Einträge aus deiner Recherche')
    +'</span></p>'
    +(compared.length?'<section class="hub-compare-summary">'
      +'<h2>'+compared.length+' Optionen im Vergleich</h2>'
      +btn('compare-clear','Auswahl leeren','close')
      +(lodging?stayComparisonBoard(compared,ctx):'')
      +'</section>':'')
    +(cards?'<div class="hub-option-grid">'+cards+'</div>'
      :'<div class="hub-empty"><strong>Keine passenden Optionen</strong>'
       +'<p>Versuche eine andere Stadt oder entferne die aktuellen Suchfilter.</p>'
       +btn('browse-reset','Suche und Filter zurücksetzen','reset','','primary')
       +'</div>')
    +(list.length>(ctx.browseLimit??24)
      ?'<div class="hub-more-button">'
        +btn('browse-more','Weitere '+Math.min(24,list.length-(ctx.browseLimit??24))
          +' Optionen anzeigen','plus','','primary')+'</div>':'')
    +'<details class="hub-technical-details"'+(ctx.browseResearchOpen?' open':'')
     +'><summary>'+icon('chevron')
     +'<span><strong>Detaillierter Preis- und Quellenvergleich</strong>'
     +'<small>Prüfpunkte, Suchwerte, Gruppenvergleich und Originaldaten</small></span></summary>'
    +(lodging
      ?'<p class="hub-technical-warning">Alle Unterkunftsangebote sind historische Such- oder Planwerte.'
       +' Keines ist automatisch für 2027 gebucht oder als Endpreis bestätigt.</p>'
       +'<div class="hub-risk-chips">'
       +comparisonGaps.map(([label,count])=>status(label+': '+count,'warn')).join('')
       +'</div>'+providerQuotePanel(ctx)
      :'')
    +(compared.length
      ?'<section><h2>Tabellarischer Direktvergleich</h2>'
       +table(['Option','Gruppe','Pro Person',lodging?'Küche':'Dauer',
         lodging?'Zimmer':'Erlebnis','Anbindung',lodging?'Storno':'Einlass',
         ...(lodging?['EUR p. P./Nacht','Offene Nachweise']:[])],compareRows)
       +'</section>':'')
    +'</details>';
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
  const menuItems=ctx.all.filter(item=>item.city===city && item.menuPriceResearchV08 && !item.duplicateOf && !item.removed);
  const priced=menuItems.filter(item=>item.menuPriceResearchV08.menuReference);
  const menuRows=menuItems.map(item=>{
    const audit=item.menuPriceResearchV08,ref=audit.menuReference;
    const displayed=ref?.sample?.map(sample=>{
      const amount=new Intl.NumberFormat('de-DE',{style:'currency',currency:ref.currency})
        .format(sample.amountCents/100);
      return esc(sample.name)+' · <strong>'+esc(amount)+'</strong>'
        +(sample.note?'<br><small>'+esc(sample.note)+'</small>':'');
    }).join('<hr>') ?? 'Kein genauer Einzelgericht- oder Komplettmenüpreis belegt';
    const kind=!ref?'Preis offen'
      :ref.sourceType==='delivery_menu_only'?'Nur Liefer-/Abholmenü'
      :ref.sourceType==='operator_retail_price_not_cafe_menu'?'Nur Laden-/Webshoppreis'
      :ref.sourceType==='tourism_2027_group_offer'?'2027 Gruppenmenü, Mindestgruppe prüfen'
      :['full_set_menu','fixed_menu_indicative','specific_day_fixed_menu'].includes(ref.precision)
        ?'Menüpreis / Festangebot':'Einzelgerichtpreis (kein kompletter Checkout)';
    return [
      esc(item.name)+'<br><small>'+esc(item.address??'Adresse ungeprüft')+'</small>',
      displayed,
      esc(kind)+'<br><small>'+esc(ref?.dateLabel??'Kein verlässlicher Preis')+'</small>'
        +(ref?.note?'<br><small>'+esc(ref.note)+'</small>':'')
        +(ref?.extraPercentage?'<br><small>Zusatz: '+ref.extraPercentage+'% '+esc(ref.extraAppliesTo)+'</small>':''),
      urlLink(audit.sourceUrl,'Speisekarte / Anbieter') || 'Original-Menü offen',
      urlLink(item.googleMapsUrl,'Google Maps')+' '+(urlLink(item.googleTransitUrl,'ÖPNV')||''),
    ];
  });
  const menuSection=menuRows.length
    ? '<section class="section panel panel-pad"><h2>Nachrecherchierte Speisekarten & Einzelpreise · '
      +esc(ctx.cities[city].name)+'</h2><p class="muted">'
      +priced.length+' von '+menuItems.length+' erfassten Lokalen mit veröffentlichten Preisbeispielen. '
      +'Diese Preise sind historische Betreiber-/Plattformbelege oder Angebote mit Bedingungen, KEINE garantierten September-2027-Endpreise. '
      +'Liefergebühren, italienischer Coperto, Getränke und Terrassenzuschlag sind nur bei ausdrücklichem Nachweis enthalten. CHF nicht in Euro umgerechnet. '
      +'Die Menüpreise werden nicht automatisch in das Gruppenbudget übernommen.</p>'
      +table(['Lokal','Konkrete Preisbeispiele','Art / Gültigkeit','Quelle','Anreise'],menuRows)
      +'</section>' : '';
  // The directory is independent of the selected day; imported supermarkets
  // stay explicitly read-only and never become a price or booking record.
  const {available,shown,total}=foodDirectory(ctx,ctx.marketItems??[]);
  const selectedType=ctx.browseFoodType??'all';
  const market=ctx.foodMarketCoverage??{};
  const marketStatus=marketCoverage({
    cityName:ctx.cities[city]?.name??city,cityLoaded:market.cityLoaded,
    loadedCities:market.loadedCities??0,totalCities:market.totalCities??1,
    scope:ctx.browseScope,count:market.count??0,checkedOn:market.checkedOn,
  });
  const marketCTA=selectedType==='all'||selectedType==='markets'
    ?'<section class="hub-market-access" aria-label="Zusätzliche Supermärkte">'
      +'<div><strong>'+icon('wallet')+' Offene Supermarkt-Kartendaten</strong>'
      +'<p>'+esc(marketStatus)+'</p>'
      +(market.error?'<p role="alert" class="hub-market-error">'+esc(market.error)+'</p>':'')
      +'</div>'
      +(market.loading?'<button type="button" class="button" disabled aria-busy="true">'
        +icon('clock')+' Datenquelle wird abgefragt …</button>'
        :market.cityLoaded
          ?btn('browse-supermarkets','Auf der Karte zeigen','map','','subtle')
          :btn('browse-market-load','Supermärkte in '+(ctx.cities[city]?.name??city)+' laden','plus','','primary'))
      +'</section>':'';
  const visualBrowse=browseHero(ctx,'food',shown.length)
    +browseToolbar(ctx,{kind:'food',total,filtered:shown.length})
    +foodTypeTabs(ctx,available)+marketCTA
    +(ctx.browseFoodSavedOnly?'<p class="hub-saved-notice">'
      +icon('bookmark')+' Nur selbst gemerkte Orte · '
      +btn('browse-food-saved','Alle anzeigen','close')+'</p>':'')
    +foodBrowseCards(ctx,shown.slice(0,ctx.browseLimit??24))
    +(shown.length>(ctx.browseLimit??24)
       ?'<div class="hub-more-button">'
         +btn('browse-more','Weitere '+Math.min(24,shown.length-(ctx.browseLimit??24))
           +' Orte anzeigen','plus','','primary')+'</div>':'');
  return visualBrowse + '<details class="hub-food-planning"'
    +(ctx.browseMealsOpen?' open':'')+'><summary>'
    +icon('calendar')+' Tagesmenüs, Einkaufswarenkorb & detaillierte Preisrecherche'
    +icon('chevron')+'</summary><div class="hub-food-planning-content">'
    +heading('Mahlzeiten am Reisetag',ctx.cities[city].name+' · '+count+' Reisende',planDate)
    + menuSection
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
    + '</section></div></details>';
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
  const researchQueue = (catalog.research?.transportQueue ?? []).filter(row => row.trip_id === trip.id);
  const suggestions = (catalog.research?.transportCandidates ?? []).filter(row => row.trip_id === trip.id);
  const railReference = catalog.research?.railReferenceV04;
  const corridors = (railReference?.corridors ?? []).filter(ref =>
    trip.route.includes(ref.from) && trip.route.includes(ref.to));
  const operatorV07 = catalog.research?.operatorV07;
  const railExamplesV07=(operatorV07?.railExamples ?? []).filter(x=>
    x.from == null || (trip.route.includes(x.from) && trip.route.includes(x.to)));
  const railExamplesRowsV07=railExamplesV07.map(x=>[
    esc(x.direction),esc(x.journeyReferenceDate),esc(x.sampleTime??'Keine Musterabfahrt'),
    x.durationMinutes==null?'Dauer offen':Math.floor(x.durationMinutes/60)+' h '+String(x.durationMinutes%60).padStart(2,'0')+' Min.',
    status('Nur Referenz, nicht für September 2027 bestätigt','warn'),
    urlLink(x.sourceUrl,'Offizielle SNCF-Quelle')
  ]);
  const bookingRulesV07=(operatorV07?.railBookingSources ?? []).map(x=>
    '<p class="muted">' + esc(x.note) + ' ' + (urlLink(x.url,'Offizielle Quelle') || '') + '</p>').join('');
  const corridorRows = corridors.map(ref => [
    esc((catalog.cities[ref.from]?.name ?? ref.from) + ' → '
      + (catalog.cities[ref.to]?.name ?? ref.to)),
    esc(ref.planning),
    ref.operators.map(operator => {
      const provider = railReference.operator_planners.find(x => x.id === operator);
      return provider ? urlLink(provider.url, provider.name) : '';
    }).filter(Boolean).join(' · '),
    status('2027: Fahrzeit, Verfügbarkeit und Preise offen', 'warn'),
  ]);
  const audit = auditInterrailRoute(legs,state.pass,researchQueue);
  const researchRows = researchQueue.map(row => {
    const window = railSalesStatus(row);
    const match = legs.find(leg => leg.researchTask?.id === row.id);
    const progress = match ? reviewProgress('transport', state.verifications?.[match.id], people.length) : null;
    return [
    esc(row.route), esc(dateText(row.date_local)),
    esc(row.operator_query_status ?? 'nicht bestätigt'),
    row.quote_cents == null ? 'Preis offen' : money(row.quote_cents),
    esc((row.must_check ?? []).slice(0, 3).join(' · ') || 'Betreiber und Bedingungen prüfen'),
    (window.earliestReview ? 'Ab etwa ' + dateText(window.earliestReview) + ' prüfen (nicht garantiert)' : 'Offen')
      + '<br><small>' + esc(window.text) + '</small>',
    urlLink(window.url, 'Verkaufsregel'),
    match ? btn('verify-item', 'Eigene Prüfung ' + progress.count + '/' + progress.total, 'check', match.id) : 'Tripsy-Verknüpfung offen',
    window.earliestReview ? btn('rail-reminder', 'Prüfung vormerken', 'calendar', row.id) : 'Datum offen',
    ];
  });
  const candidateRows = suggestions.map(row => [
    ...([]),
    esc(row.from + ' → ' + row.to), esc(dateText(row.date_local)),
    esc(row.routing_hypothesis),
    row.indicative_seat_reservation_eur_per_person == null ? 'Reservierung offen'
      : esc(money(Math.round(row.indicative_seat_reservation_eur_per_person * 100))) + ' p. P. · Referenz',
    esc(railAlternativeStatus(row).label),
  ]);
  const candidates = ['Bahnverbindungen 2027 sind Planwerte. Buchungsfenster, Sitzplätze und Preise vor der Reise beim Betreiber prüfen.'];
  const reference = catalog.fares.pass_7d;
  if (pass.remaining < 0) candidates.push('Die geplanten Fahrten übersteigen die hinterlegte Zahl an Pass-Tagen.');
  const connections = legs.map((l, i) => {
    const next = legs[i + 1];
    const gap = l.end && next?.start ? (Date.parse(next.start) - Date.parse(l.end)) / 60_000 : null;
    const duration = l.start && l.end ? Math.round((Date.parse(l.end) - Date.parse(l.start)) / 60_000) : null;
    const sameDay = next && localParts(l.end, l.endZone ?? l.zone).date === localParts(next.start, next.zone).date;
    const evidence = reviewProgress('transport', state.verifications?.[l.id], people.length);
    return `<article class="panel rail-card">
      <div class="inline">${status(l.mode === 'train' ? 'Zug' : l.mode)}${status(l.verification ?? 'Planung', 'warn')}
      <small>${dateText(localParts(l.start, l.zone).date)} · ${esc(l.operator ?? 'Betreiber offen')}${l.number ? ' · ' + esc(l.number) : ''}</small></div>
      <h3>${esc(l.name)}</h3><div class="times"><strong>${esc(timeText(l))}</strong><span>${duration == null ? 'Dauer offen' : Math.floor(duration / 60) + ' h ' + duration % 60 + ' Min.'}</span>
      <span>${l.reservation ? 'Reservierungsreferenz ' + esc(cost({ price: l.reservation }, people.length)) : 'Reservierungspreis offen'}</span></div>
      ${l.via ? '<small>' + esc(l.via) + '</small>' : ''}
      ${sameDay && gap != null && gap < 25 ? alert(gap < 0 ? 'Überschneidung mit der nächsten Fahrt.' : 'Nur ' + gap + ' Min. bis zum nächsten Zug. Umstieg prüfen.') : ''}
      <div class="row-actions">${btn('details', 'Quellen & Details', 'folder', l.id)}${btn('edit', 'Bearbeiten', 'edit', l.id)}${btn('verify-item', 'Eigene Prüfung ' + evidence.count + '/' + evidence.total, 'check', l.id)}
      ${urlLink(l.website || 'https://int.bahn.de/de', 'Fahrplan prüfen', 'button')}
      ${urlLink(googleMapsSearchUrl(l,catalog.cities),'Abfahrtsort Google Maps')}
      ${urlLink(googleMapsDirectionsUrl(
        {name:l.departure,city:l.city,point:l.point},
        {name:l.arrival,city:l.toCity,point:l.toPoint},
        catalog.cities,'transit'),'Strecke in Google Maps')}</div></article>`;
  }).join('');
  const passRows = audit.dayRows.map(day => [
    esc(dateText(day.day)),
    esc(day.names.join(' · ')),
    String(day.segments),
    day.overnight ? 'Übernachtfahrt · Wechsel nach Mitternacht / weiterer Zug gesondert prüfen' : 'Abfahrtstag des Passes',
    day.assumed2027 ? status('Fahrplan 2027 nicht bestätigt','warn') : status('Manuell prüfen')
  ]);
  return heading('Bahn & Interrail', trip.title, btn('add-rail', 'Verbindung ergänzen', 'plus'))
    + '<div class="stat-grid">' + stat('Reisetage im Entwurf', pass.days.length + ' / ' + state.pass.days, pass.days.map(d => dateText(d).slice(0, 6)).join(' · '))
    + stat('Reservierungen bekannt', money(reservations), priced.length + ' Referenzen · keine Verfügbarkeitszusage')
    + stat('Pass + bekannte Reservierungen', state.pass.cost == null && !state.pass.purchased ? 'Passpreis offen' : money((state.pass.purchased ? 0 : state.pass.cost * people.length) + reservations), 'Zwischensumme')
    + stat('Einzeltickets', ticketUnknown ? 'Teilpreis ' + money(knownSingles) : money(knownSingles), ticketUnknown + ' Fahrten mit offenem Preis') + '</div>'
    + railReviewTimeline(ctx)
    + '<section class="section panel panel-pad"><h2>Pass-Reisetage und Tarifprüfung</h2>'
    + '<p>Die Passrechnung verwendet Abfahrtstage, nicht die Anzahl der Züge. Bei Nachtzügen ist entscheidend, ob am nächsten Tag ein weiterer Zug benutzt wird. Keine Annahme über 2027er Sitzplätze.</p>'
    + (passRows.length ? table(['Abfahrtstag','Züge','Abschnitte','Nachtzug-Regel','2027er Quelle'],passRows) : '<p>Keine Zugfahrten im Pass-Entwurf.</p>')
    + '<p class="muted">' + audit.missingSchedules + ' Fahrpläne für 2027 unbestätigt · '
    + audit.unknownTicketPrices + ' Ticketpreise offen · '
    + audit.remainingDays + ' Pass-Reisetage verbleibend.</p>'
    + (audit.issues.length ? audit.issues.map(issue=>alert(issue)).join('') : '')
    + (audit.tightConnections.length ? '<h3>Anschlüsse mit Risiko</h3>'
      + audit.tightConnections.map(x=>alert(x.previous+' → '+x.next+': '+x.gapMinutes+' Min. · '+x.warning)).join('') : '')
    + '<p><a href="https://www.interrail.com/en/plan-your-trip/interrail-timetable" target="_blank" rel="noopener noreferrer">Offizieller Interrail-Fahrplan (vor dem Kauf prüfen)</a></p></section>'
    + '<div class="panel panel-pad"><div class="inline">' + btn('pass', 'Pass konfigurieren', 'edit')
    + urlLink('https://help.interrail.com/hc/de/articles/38312789999261-Wie-funktionieren-Reisetage-bei-Nachtz%C3%BCgen', 'Nachtzugregel')
    + urlLink('https://www.interrail.eu/en/interrail-passes/what-is-interrail/travel-your-own-country', 'Wohnsitzland-Regel') + '</div>'
    + '<p class="muted">Flexi-Pass: Der Abfahrtstag zählt. Ein weiterer Zug nach Mitternacht belegt den nächsten Reisetag. Die Ankunft muss im Gültigkeitszeitraum liegen. Aktives Budget: '
    + (state.pass.budgetMode === 'interrail' ? 'Interrail mit Reservierungen.' : 'Einzeltickets.') + '</p>'
    + (reference ? '<small>Recherchewert ' + esc(reference.tariff_year) + ' · ' + money(reference.amount * 100) + ' Jugendpass p. P. · für 2027 offen.</small>' : '')
    + candidates.map(alert).join('') + pass.issues.map(i => alert(i.text)).join('') + '</div>'
    + '<section class="section"><h2>Verbindungen in Reihenfolge</h2><div class="stack">' + (connections || empty('Keine Verbindungen', 'Ergänze eine Fahrt oder wähle eine andere Variante.')) + '</div></section>'
    + (corridorRows.length ? '<section class="section"><h2>Bahnkorridore & offizielle Betreiber</h2>'
      + '<p class="muted">Planungshypothesen ohne bestätigte Abfahrtszeiten oder reservierbare Sitzplätze im September 2027. Diese Optionen werden nicht automatisch gebucht und nicht in den aktiven Tagesplan übernommen.</p>'
      + table(['Korridor', 'Zu prüfende Verbindung', 'Betreiber-Fahrplan', 'Stand'], corridorRows)
      + '<h3>Regel-Referenzen</h3>' + (railReference?.rules ?? []).map(rule =>
        '<p class="muted">' + esc(rule.text) + ' ' + (urlLink(rule.url, 'Quelle') ?? '') + '</p>').join('')
      + '</section>' : '')
    + (railExamplesRowsV07.length ? '<section class="section"><h2>Bahn-Beispielverbindungen und 2027er Verkaufsstand</h2>'
      + '<p class="muted">Das sind echte Betreiber-Referenzen oder Veröffentlichungen aus 2026, keine Züge, Reservierungen oder Ticketangebote für September 2027. Preise bleiben offen.</p>'
      + table(['Abschnitt','Beispieldatum','Uhrzeit','Referenzdauer','Gültigkeit','Originalquelle'],railExamplesRowsV07)
      + bookingRulesV07 + '</section>' : '')
    + '<section class="section"><h2>Fahrplan- und Preisrecherche · 2027</h2>'
    + '<p class="muted">Offene Aufgaben, keine Echtzeitverbindungen. Jede Abfahrt und jeder Ticketpreis muss später für das konkrete Reisedatum beim Anbieter bestätigt werden.</p>'
    + (researchRows.length ? table(['Originalabschnitt', 'Reisedatum', 'Recherchestatus', 'Ticketpreis', 'Noch prüfen', 'Orientierungsfenster', 'Verkaufsregel', 'Eigenprüfung', 'Wiedervorlage'], researchRows)
      : empty('Noch keine Rechercheaufgaben', 'Für diese Variante enthält das Paket keine Bahnaufgaben.'))
    + '</section>'
    + (candidateRows.length ? '<section class="section"><h2>Alternative Bahnverbindungen · Hypothesen</h2>'
      + '<p class="muted">Nicht automatisch im Tagesplan oder Budget aktiv. Fehlende Dauer, Umstiege und Livepreise sind unbekannt, nicht null Minuten oder kostenlos.</p>'
      + table(['Route', 'Datum', 'Verlauf', 'Reservierungsreferenz', 'Status'], candidateRows) + '</section>' : '');
}

function budget(ctx) {
  const { budget: b, trip, state, people, catalog } = ctx;
  const scenarios = (catalog.research?.budgetScenarios ?? []).filter(item => item.trip_id === trip.id);
  const scenarioRows = scenarios.map(item => {
    const total = item.grand_total_group_cents_without_pass;
    const scenarioPeople = item.persons;
    const perPerson = total == null ? 'Gesamtsumme unbekannt' : Array.from({ length: scenarioPeople },
      (_, i) => Math.floor(total / scenarioPeople) + (i < total % scenarioPeople ? 1 : 0)).map(cents => money(cents)).join(' / ');
    return [esc(item.id.replaceAll('_', ' ')), money(item.lodging_group_cents),
      total == null ? 'Offen · nur Unterkunftsanteil' : money(total),
      esc(perPerson), esc(item.lodging_ids.length + ' ungeprüfte Suchangebote'),
      status('Hypothese · nicht ausgewählt', 'warn')];
  });
  const rows = b.rows.map(i => [esc(i.name), esc(categories[i.category] ?? i.category ?? 'Sonstiges'),
    esc(i.date ?? localParts(i.start, i.zone).date ?? (i.kind === 'lodging' ? i.stayFrom : null) ?? '—'), esc(money(i.original, i.currency)), esc(money(i.euros)),
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
    + dailyBudgetHtml(ctx)
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
    + (scenarioRows.length ? '<section class="section"><h2>Was-wäre-wenn-Szenarien · Research v0.2</h2>'
      + '<p class="muted">Nur rechnerische Vergleiche aus Suche vom 12.11.2026. Keine der Unterkünfte ist gebucht, vollständig steuer- und zimmergeprüft oder automatisch im aktiven Budget enthalten. Interrail-Pass, DiscoverEU-Status und Gebühren sind gesondert zu verifizieren.</p>'
      + table(['Szenario', 'Unterkünfte · Gruppe', 'Gruppe ohne Pass', 'Anteile je Person', 'Basis', 'Status'], scenarioRows)
      + '</section>' : '')
    + localMobility(ctx);
}

function localMobility(ctx) {
  const fare = transitFares[ctx.city];
  const operators = ctx.catalog.research?.operatorV07;
  const catalogFares = (ctx.catalog.research?.mappedFareRowsV07 ?? {})[ctx.city] ?? [];
  const cityPlanner=operators?.providerPlanning?.[ctx.city] ?? transitPlanners[ctx.city];
  const formatFare=ref=>new Intl.NumberFormat('de-DE',{style:'currency',
    currency:ref.currency}).format(ref.amountCents / 100);
  const officialTable=catalogFares.length
    ? '<details class="panel panel-pad"><summary>Alle ' + catalogFares.length
      + ' nachrecherchierten Ticketvarianten (2026)</summary>'
      + '<p class="muted">Die Beträge gelten nur als Betreiber-Referenzen für 2026; Tarifzonen, Ermäßigungen und 2027er Gültigkeit beim Kauf prüfen. Sie werden nicht automatisch ins Reisebudget übernommen.</p>'
      + table(['Ticket','Referenzpreis','Geltung','Hinweis','Quelle'],catalogFares.map(x=>[
        esc(x.name),esc(formatFare(x)),esc(x.scope),esc(x.qualifier),
        urlLink(x.sourceUrl,'Betreiber-Tarif')])) + '</details>' : '';
  if (!fare) return !cityPlanner ? '' : '<section class="section panel panel-pad"><h2>Nahverkehr · '
    + esc(ctx.cities[ctx.city]?.name ?? ctx.city)
    + '</h2><p>Für diesen Ort liegen keine verifizierten, vergleichbaren ÖPNV-Ticketpreise für 2027 vor. Der offizielle Betreiberplaner kann Zug-, Bus- und Bergbahnverbindungen getrennt prüfen.</p>'
    + (urlLink(cityPlanner,'Verbindungen beim Betreiber prüfen') || '') + officialTable + '</section>';
  const tickets = ctx.state.mobility?.[ctx.city] ?? 0;
  const compare = ticketBreakEven({ single: fare.single, pass: fare.pass, rides: tickets, travellers: ctx.people.length });
  return '<section class="section panel panel-pad"><h2>Nahverkehr · ' + esc(ctx.cities[ctx.city].name) + '</h2><p>'
    + tickets + ' Einzeltickets je Person · Tarifstand 12.11.2026 · Reisedatum 2027 offen</p><div class="stat-grid">'
    + stat(fare.ticket + ' · Gruppe', money(compare.singles)) + stat(fare.passName + ' · Gruppe', money(compare.comparison))
    + stat(compare.savings >= 0 ? 'Ersparnis' : 'Mehrkosten', money(Math.abs(compare.savings)), 'Vorteil ab ' + compare.firstSaving + ' Einzeltickets p. P.')
    + '</div>' + btn('mobility', 'Einzeltickets eingeben', 'edit') + ' ' + urlLink(fare.source, 'Offizielle Tarife')
    + (fare.singleSource ? ' ' + urlLink(fare.singleSource, 'Einzelfahrkarte') : '')
    + '<p class="muted">' + esc(fare.details) + ' Preisvergleich außerhalb des aktiven Budgets.</p>'
    + (urlLink(cityPlanner,'Routenplaner öffnen') || '') + '</section>' + officialTable;
}

function group(ctx) {
  const survey = ctx.trip.group === 'interrail_2027' && ctx.people.length === 3
    ? ctx.catalog.research?.groupPreferences : null;
  const priorities = survey?.group_priorities ?? [];
  const groupRows = priorities.slice(0, 12).map(p => [
    esc(p.topic), esc(p.consensus_score_0_100 + '/100'),
    esc(Object.entries(p.scores).map(([name, score]) => name + ': ' + score + '/5').join(' · ')),
    esc(p.priority_class.replaceAll('_', ' ')),
  ]);
  const targets = survey?.nightly_accommodation_targets_eur_per_person ?? {};
  return heading('Reisegruppe', ctx.people.length + ' Personen', btn('people', 'Profile bearbeiten', 'edit'))
    + '<div class="grid-cards">' + ctx.people.map((p, i) => '<article class="panel option-card"><span class="category-icon">'
      + icon('people') + '</span><h3>' + esc(p.name) + '</h3><p>Alter zum Reisebeginn: ' + esc(p.age ?? 'Offen') + '</p>'
      + '<div class="price-line"><span>Bekannter Anteil</span><strong>' + money(ctx.budget.balances[i].share) + '</strong></div></article>').join('') + '</div>'
    + (survey ? '<section class="section panel panel-pad"><h2>Umfrage · drei Personen</h2>'
      + '<p>Interessen: 0 bedeutet geringe Präferenz, kein Verbot. Das Gruppenranking ist heuristisch und keine objektive Bewertung. Persönliche Unterkunftszielwerte sind flexibel, keine Kostenobergrenze.</p>'
      + '<div class="chips">' + Object.entries(targets).map(([alias, value]) => status(alias + ': ca. ' + value.target + ' € p. P./Nacht')).join('') + '</div>'
      + table(['Interesse', 'Konsenswert', 'Einzelbewertungen', 'Einordnung'], groupRows)
      + '<p class="muted">Fehlende freie Antworten werden als unbekannt behandelt. Bei unterschiedlichen Vorlieben können Aktivitäten auch optional oder parallel geplant werden.</p>'
      + '</section>'
      : '<section class="section panel panel-pad"><h2>Eigenständige Reisegruppe</h2>'
        + '<p>Für diese Reise liegt keine passende Gruppenbefragung vor. Die Drei-Personen-Interrail-Umfrage wird auf die vierköpfige Schweizer Seenreise ausdrücklich nicht übertragen.</p></section>')
    + groupVoteBoard(ctx);
}

function data(ctx) {
  const { trip, state, variant, all, catalog } = ctx;
  const imported = Object.entries(trip.importCounts).map(([key, value]) => [esc(({activities:'Aktivitäten',transportations:'Verbindungen',hostings:'Unterkünfte',expenses:'Budgetreferenzen',documents:'Dokumente'})[key] ?? key), esc(value ?? 'Kein Zugriff')]);
  const research = catalog.research;
  const coverage=research?.coverageV07?.find(record=>record.variant===trip.id);
  const auditRows=(coverage?.entries??[]).map(x=>[
    esc(catalog.cities[x.city]?.name ?? x.city),esc(x.name),esc(x.category),
    x.geolocationMissing?status('Nur theoretische Stadtorientierung','warn'):status(
      x.pointStatus==='sourced_area_center'?'Quellbezogener Gebiets-/Objektmittelpunkt':x.pointStatus==='provider_reported_unverified'?'Anbieterkoordinate · nicht unabhängig geprüft':'Kartenpunkt belegt',''),
    esc(x.priceStatus==='source_price_reference'?'Historische Preisreferenz':
      x.priceStatus==='old_wishlist_sample_not_a_trip_price'?'Airbnb-Suchpreis-Snapshot'
      :x.priceStatus==='menu_observation_not_trip_price'?'Menüpreis-Beispiel · kein September-Checkout'
      :'2027-Preis offen'),
    esc(x.hoursStatus==='published_reference_recheck_2027'?'Öffnungsreferenz / Datum prüfen':'Öffnungszeiten offen'),
    esc(x.sourceStatus==='linked_source_reference'?'Quellenbezug vorhanden':'Kein eindeutiger Anbieterbeleg'),
    (urlLink(x.googleMapsUrl,'Karte') || '')+' '+(urlLink(x.googleTransitUrl,'ÖPNV') || ''),
  ]);
  const allMenuAudit=research?.foodMenuV08;
  const missingGeo=research?.unresolvedReasonsV09?.items
    .filter(item=>trip.route.includes(item.city))??[];
  const pendingGeoRows=missingGeo.map(item=>[
    esc(item.name),esc(catalog.cities[item.city]?.name??item.city),
    esc(item.reason),
    item.knownPublicAddress
      ? esc(item.knownPublicAddress)
        + (item.providerAddressSource?' '+(urlLink(item.providerAddressSource,'Anschriftenquelle')||''):'')
      : esc(item.privateAirbnbProperty?'Exakte Airbnb-Adresse nicht öffentlich':'Keine eindeutige Hausadresse bestätigt'),
    esc(item.nextStep),
    (urlLink(item.googleMapsSearchUrl,'Google Maps')??'Suche offen')+' '
      +(urlLink(item.googleTransitUrl,'ÖPNV-Anfahrt')??''),
  ]);
  const auditV08Panel=(allMenuAudit||missingGeo.length)
    ? '<section class="section panel panel-pad"><h2>Einzelrecherche: offene Standorte und Menüpreise v0.9</h2>'
      + '<div class="stat-grid">'
      + stat('Gastro-Einträge geprüft',String(allMenuAudit?.counts.total??0),
        (allMenuAudit?.counts.priced??0)+' mit Menü-/Artikelpreisbelegen')
      + stat('Einmalige ungeklärte Ortsdatensätze',String(missingGeo.length),
        'Innerhalb dieser Reisevariante, nicht 1:1 Kartenpins')
      + '</div><p class="muted">Jeder noch unlokalisierte Eintrag hat eine Begründung und eine Karten-Suche. '
      +'Auch für Airbnb ohne veröffentlichte Adresse und flexible Aktivitäten wird kein fingierter Punkt erzeugt. '
      +'Original-Ergebnisse der früheren Photon-Recherche sind gesichert; offene Kandidaten dürfen nicht ungeprüft übernommen werden.</p>'
      + (pendingGeoRows.length
        ? '<details><summary>Alle '+missingGeo.length+' noch offenen unterschiedlichen Orte dieser Route anzeigen</summary>'
          + table(['Name','Ort','Individuelle Begründung','Öffentliche Adresse / Beleg','Nächster Prüfschritt','Google Maps'],pendingGeoRows)+'</details>'
        : '')+'</section>' : '';
  const coveragePanel=coverage ? '<section class="section panel panel-pad"><h2>Vollständige Datenabdeckung dieser Reisevariante</h2>'
    + '<div class="stat-grid">'
    + stat('Datensätze',String(coverage.total),'Alle Kategorien')
    + stat('Kartenpunkte',String(coverage.withPrecisePoint),coverage.withoutPrecisePoint+' ohne präzisen Punkt')
    + stat('Preisreferenzen',String(coverage.withPriceReference),'Nicht gleich 2027er Checkout')
    + stat('Öffnungsreferenzen',String(coverage.withHoursReference),'Am Reisetag prüfen')
    + '</div><p class="muted">Jeder Eintrag ist einzeln geprüft und in der folgenden Datenmatrix enthalten. Der theoretische Stadtanker wird niemals als exakter Kartenpin dargestellt. Wo Preise/Öffnungszeiten nicht belegt sind, bleibt der Wert offen.</p>'
    + '<p class="muted">Kategorien: ' + Object.entries(coverage.byCategory).map(([k,v])=>esc(k)+': '+v).join(' · ') + '</p>'
    + '<details><summary>Alle ' + coverage.total + ' Datensätze, Quellenstände und Google-Maps-/ÖPNV-Links anzeigen</summary>'
    + table(['Ort','Eintrag','Kategorie','Kartengeometrie','Preis','Öffnungszeiten','Quellenstatus','Google Maps'],auditRows)
    + '</details></section>' : '';
  const quality = (research?.quality ?? []).filter(item => !item.resolved
    && (item.trip_id === 'all' || item.trip_id === trip.id));
  const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
  quality.sort((a, b) => (priorities[a.severity] ?? 9) - (priorities[b.severity] ?? 9));
  const qualityRows = quality.map(item => [
    status(item.severity === 'critical' ? 'Kritisch' : item.severity === 'high' ? 'Hoch'
      : item.severity === 'medium' ? 'Mittel' : 'Niedrig', ['critical','high'].includes(item.severity) ? 'warn' : ''),
    esc(item.domain), esc(item.finding), esc(item.action.replaceAll('_', ' ')),
    (item.source_ids ?? []).map(id => urlLink(catalog.sources[id]?.url, id) || esc(id)).join(' · ') || 'Keine Direktquelle',
  ]);
  const issues = all.filter(i => i.duplicateOf || i.positionIssue || i.importConflict)
    .map(i => '<li>' + esc(i.originalName ?? i.name) + ' · ' + esc([i.positionIssue, i.importConflict].filter(Boolean).join(' ') || 'Dublettenverdacht, Quelle erhalten') + '</li>');
  const deadlineRows = state.deadlines.slice().sort((a, b) => String(a.when ?? 'z').localeCompare(String(b.when ?? 'z'))).map(d => {
    const date = localParts(d.when, d.zone);
    return [esc(d.title), esc(d.when ? dateText(date.date) + ' ' + date.time + ' · ' + d.zone : 'Zeitpunkt offen'),
      status(d.done ? 'Erledigt' : !d.when ? 'Unklar' : Date.parse(d.when) < Date.now() ? 'Verstrichen' : 'Offen'), btn('deadline', 'Bearbeiten', 'edit', d.id)];
  });
  return heading('Daten & Fristen', 'Quellen, lokale Sicherung und Wiedervorlagen',
    btn('export', 'JSON sichern', 'download') + btn('ics', 'Kalender exportieren', 'calendar'))
    + readinessPanel(ctx)
    + mediaCoveragePanel(ctx)
    + providerLocationPanel(ctx)
    + coveragePanel
    + auditV08Panel
    + '<section class="section panel panel-pad"><h2>Recherche importieren</h2><p class="muted">JSON oder CSV in die aktuelle Variante einlesen. Dateieinträge beginnen als Alternativen.</p>'
    + '<form id="import-form" class="row-actions section"><label class="field"><span>Datei</span><input type="file" name="file" accept=".csv,.json" required></label><button class="button primary" type="submit">' + icon('upload') + 'Importieren</button>'
    + '<div class="form-error" aria-live="polite"></div></form><small>Spalten: name, city oder destination_id, kind, id, amount, currency, price_scope, latitude, longitude, source_url.</small></section>'
    + (variant.logs?.length ? table(['Import', 'Neu', 'Vorhanden', 'Konflikte'], variant.logs.map(l => [esc(l.filename), l.inserted, l.existing, l.conflicts])) : '')
    + '<section class="section"><div class="subheading compact"><h2>Buchungen & Fristen</h2>' + btn('deadline', 'Frist erfassen', 'plus') + '</div>'
    + (deadlineRows.length ? table(['Eintrag', 'Ortszeit', 'Status', ''], deadlineRows) : empty('Keine bestätigten Fristen', 'Buchungsfenster und Stornierungsbedingungen sind für diese Reise offen.')) + '</section>'
    + '<section class="section"><h2>' + (trip.dataMode === 'research_seed_fallback' ? 'Lokales Recherchearchiv · reduzierter Bestand' : 'Tripsy-Import') + ' · ' + esc(dateText(trip.importedOn)) + '</h2>' + (trip.dataMode === 'research_seed_fallback' ? alert('Kein vollständiger Tripsy-Snapshot. Angezeigte Datensätze sind nur aus dem Forschungs-Seed rekonstruiert; die ursprünglichen Buchungen werden nicht ersetzt.') : '') + table(['Quelle', 'Verfügbar'], imported) + '</section>'
    + (research ? '<section class="section"><h2>Forschungsarchiv · Stand ' + esc(research.observedOn) + '</h2>'
      + '<div class="stat-grid">' + stat('Aktivitäten gesamt', String(research.counts.activityCandidates), research.counts.addedActivities + ' neue Ideen')
      + stat('Unterkunfts-Suchpreise', String(research.counts.accommodationSearchQuotes), 'Nicht checkoutbestätigt')
      + stat('Zugabschnitte zur Prüfung', String(research.counts.transportLegs), 'Fahrplan 2027 offen')
      + stat('Datenprobleme dokumentiert', String(research.counts.issues), 'Ausführliche Liste unten')
      + '</div><p class="muted">Die 20 Quellen-Dateien sind als separate Referenz archiviert. '
      + 'Neue Vergleichsangebote sind weder bezahlt noch automatisch ausgewählt; 2027er Zeiten und Endpreise bleiben offen.</p></section>' : '')
    + (qualityRows.length ? '<section class="section"><h2>Offene Datenqualitätsbefunde dieser Reise</h2>'
      + table(['Schwere', 'Bereich', 'Feststellung', 'Nötiger Schritt', 'Quelle'], qualityRows)
      + '</section>' : '')
    + (issues.length ? '<section class="section panel panel-pad"><h2>Importhinweise</h2><ul class="sources-list">' + issues.join('') + '</ul></section>' : '')
    + '<section class="section panel panel-pad"><h2>Recherchequellen</h2><ul class="sources-list">'
    + Object.values(catalog.sources).map(s => '<li>' + (urlLink(s.url, s.publisher) || esc(s.publisher)) + ' · ' + esc(s.accessed_on || 'Prüfdatum offen') + '</li>').join('') + '</ul></section>';
}
