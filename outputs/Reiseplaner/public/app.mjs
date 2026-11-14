import { dailyBudgetDefaults } from './daily-budget.mjs';
import { GUIDE_STEPS, guideStep } from './tutorial.mjs';
import {createMotionController} from './motion-ux.mjs';
import {dayPlanDraftEdits} from './day-plans-logic.mjs';
import { activeItems, alpineAccess, calculateBudget, dateRange, dayEntries, groceryBasket, localParts, minor, priceForParty, utcFromLocal } from './model.mjs';
import { renderShell, mapDetail, mapSelectionPreview } from './views.mjs';
import { TripMap } from './map.mjs';
import { transitFares } from './transit.mjs';
import { railSalesStatus } from './verification.mjs';
import { explorerData, explorerRouteInput, validPoint, mapPointInBounds } from './map-explorer.mjs';
import { explorerList } from './explorer-ui.mjs';
import { readMapBookmarks, toggleMapBookmark } from './map-shortlist.mjs';
import { inspectorComparisonHtml } from './inspector-comparison.mjs';
import { applyCoverageFilters,resetCoverageFilters } from './coverage-filter.mjs';
import {commonsDefaultQuery,commonsSearchUrl,commonsWebSearchUrl,commonsResults} from './commons-photo-search.mjs';
import { googleMapsDirectionsUrl } from './google-maps.mjs';
import { arrangeDayStops, buildMultiStopDay } from './day-route.mjs';
import { btn, empty, esc, icon } from './ui.mjs';
import { chooseItem, closeDialog, deadlineForm, editItem, editPass, editPeople, expenseForm, itemDetails, layerForm, groceryEditForm, mealForm, openDialog, routeForm, simpleField, timetableForm, verificationForm } from './forms.mjs';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const motion = createMotionController(document);
let catalog, variant, currentMap, context, toastTimer, undo, revisionToken = 0, dragged, timetableSearch;
let saving = false, loading = false;
let commonsPhotoPick = null;
const query = new URLSearchParams(location.search);
const view = {
  page: 'overview', date: null, city: null, wholeDay: null, total: false, selected: null, mobile: 'plan', menu: false, timetablePreview: null,
  theme: localStorage.getItem('reiseplan-theme') ?? 'light',
  filters: { walk: true, options: false, hotels: true, stations: true, activities: true, hiking: false, transit: {} },
  optionFilter: 'all', sort: 'source', compareIds: new Set(), inspectorCompareIds: [],
  mapScope: 'city', mapGroup: 'all', mapSearch: '', mapListLimit: 60, mapShowCityReferences: true,
  mapSimple:localStorage.getItem('reiseplan-map-simple')!=='off',
  mapMotion: localStorage.getItem('reiseplan-map-motion')==='off'?'off':'auto',
  cityNavOpen:true,
  mapNearPointId: null, mapNearRadiusKm: 3,
  mapViewportOnly:false,mapViewportBounds:null,mapCompact:true,mapSavedOnly:false,
  mapFrom: null, mapTo: null, mapRouteMode: 'walk', mapRouteTime: '10:00', mapRouteResult: null,
  dayQueueIds: [], dayQueueRoutes: [], dayQueueTime: '09:00', dayQueueStatus: '',
  dayQueueFocus: 0, dayQueueDisplay: 'all',
  nightlyTargetEuro: Math.max(5,Math.min(1000,Number(localStorage.getItem('reiseplan-nightly-target')??35)||35)),
  mapTone: ['standard','midnight','sand'].includes(localStorage.getItem('reiseplan-map-tone'))
    ? localStorage.getItem('reiseplan-map-tone') : 'standard',
  mapExpanded: false,
  mapDesignOpen:false,
  mapAdvancedOpen:false,
  mapDayNotesOpen:false,
  guideIndex: null,
  showAllVotes: false,
  providerOnlyBudget: false,
  providerSort: 'price',
  dailyBudgetDate: null,
  dailyBudgetInputs: { ...dailyBudgetDefaults },
  geocodeReview: null,
};
const walks = new Map();
const pendingWalks = new Map();
const optionPages = ['lodging', 'discover'];

async function api(url, method = 'GET', data) {
  const response = await fetch(url, { method, ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Der lokale Server antwortet nicht.');
  return result;
}

const variantUrl = () => '/api/variant/' + encodeURIComponent(variant.id);
const dayOf = (item, end = false) => localParts(end ? item.end : item.start, end ? item.endZone ?? item.zone : item.zone).date ?? (end ? item.stayTo : item.date ?? item.stayFrom);
const pointKey = point => point?.map(n => n.toFixed(5)).join(',') ?? 'unknown';
const segmentKey = (a, b) => [a.id, pointKey(a.point), b.id, pointKey(b.point)].join('|');
const walkKey = (a, b) => [pointKey(a), pointKey(b)].join(';');

function buildContext() {
  const trip = catalog.trips.find(t => t.id === variant.base);
  const { state, imported } = variant;
  const people = state.people;
  const actualMeals = new Map(state.expenses.filter(expense => expense.forItem).map(expense => [expense.forItem, expense]));
  const withPrice = i => ({ ...i, effectivePrice: priceForParty(actualMeals.get(i.id) ?? i, people) });
  const all = [...trip.items, ...imported, ...state.manual].map(i => withPrice({ ...i, ...state.edits[i.id] }));
  const active = activeItems(trip, state, imported).map(withPrice);
  const activeSet = new Set(active.map(i => i.id));
  const dates = dateRange(trip.from, trip.to);
  const cityForDay = date => {
    const arrival = trip.arrivalByDay[date];
    if (arrival) return arrival;
    const stay = Object.entries(trip.stayByCity).find(([, s]) => s.from <= date && date < s.to);
    if (stay) return stay[0];
    return active.find(i => i.kind === 'activity' && dayOf(i) === date)?.city ?? trip.route[0];
  };
  const date = view.date ?? (trip.id === 'interrail_classic' || trip.id === 'interrail_swiss' ? '2027-09-04' : dates[0]);
  const city = view.city ?? cityForDay(date);
  const overnight = active.filter(item => item.kind === 'lodging' && dayOf(item) <= date && date < dayOf(item, true));
  const mealHotel = overnight.find(item => item.city === city);
  const mapKitchen = item => {
    if (!item.requiresKitchen) return item;
    const kitchen = overnight.find(hotel => hotel.city === item.city);
    return { ...item, point: kitchen?.point ?? null, address: kitchen?.address,
      kitchenReady: ['shared', 'private'].includes(kitchen?.kitchenMode) };
  };
  const fullDay = dayEntries(active, date).map(mapKitchen);
  const dayCities = [...new Set(fullDay.map(i => i.placeCity).filter(Boolean))];
  const wholeDay = dayCities.length > 1 && (view.wholeDay ?? trip.id === 'swiss_lakes');
  const day = wholeDay ? fullDay : dayEntries(active, date, city).map(mapKitchen);
  const arrivals = new Map(day.filter(i => i.role === 'Ankunft' && i.point).map(i => [i.id, i]));
  const dayTravel = wholeDay ? day.filter(i => i.role === 'Abfahrt' && i.point && arrivals.has(i.id))
    .map(departure => [departure, arrivals.get(departure.id)]) : [];
  const hotel = active.find(i => i.kind === 'lodging' && i.city === city && dayOf(i) <= date && date <= dayOf(i, true));
  const stops = [...day];
  const airportOrStation = stops.some(i => i.kind === 'transport' && i.role === 'Ankunft');
  const firstLodging = stops.some(i => i.kind === 'lodging');
  const anchor = !wholeDay && hotel && !firstLodging ? { ...hotel, anchor: true, placeCity: hotel.city } : null;
  if (anchor && !airportOrStation) stops.unshift(anchor);
  if (anchor && stops.length > 1 && !stops.some(i => i.kind === 'transport' && i.role === 'Abfahrt')) stops.push(anchor);
  const segments = stops.slice(1).flatMap((to, i) => {
    const from = stops[i];
    const access = alpineAccess(from, to);
    if (from.id === to.id || (from.point && to.point && pointKey(from.point) === pointKey(to.point))
      || (from.placeCity !== to.placeCity && !access?.source)) return [];
    const key = segmentKey(from, to);
    return [{ from, to, access, key, datedKey: date + '|' + key }];
  });
  const routes = segments.map(seg => {
    const manual = state.localRoutes[seg.datedKey] ?? state.localRoutes[seg.key];
    if (manual && (!manual.date || manual.date === date)) return manual;
    return (!seg.access && walks.get(walkKey(seg.from.point, seg.to.point))) || null;
  });
  const conflictRoutes = day.map((d, i) => routes[segments.findIndex(s => s.from.entryKey === d.entryKey && s.to.entryKey === day[i + 1]?.entryKey)]);
  const station = active.find(i => i.kind === 'transport' && i.toCity === city && i.toPoint)?.toPoint;
  const hotelWalks = Object.fromEntries(all.filter(i => i.city === city && i.kind === 'lodging' && i.point)
    .map(i => [i.id, walks.get(walkKey(i.localStation?.point ?? station, i.point))]));
  const foodPlaces = all.filter(i => i.city === city && i.category === 'food' && i.kind === 'activity'
    && !i.mealPlanId && !i.duplicateOf && !i.removed);
  const foodWalks = Object.fromEntries(foodPlaces.map(item => [item.id, walks.get(walkKey(mealHotel?.point, item.point))]));
  let detail = day.find(i => i.entryKey === view.selected) ?? all.find(i => i.id === view.selected);
  const nearbyAnchor = all.find(i=>i.id===view.mapNearPointId&&validPoint(i.point)) ?? null;
  const savedIds = readMapBookmarks(localStorage,variant.id);
  const explorer = view.page === 'map' ? {
    ...explorerData(all, trip, {
      city: view.mapScope === 'city' ? city : null,
      dayItemIds: view.mapScope === 'day' ? new Set(day.map(item=>item.id)) : null,
      group: view.mapGroup, search: view.mapSearch,
      nearbyPoint: nearbyAnchor?.point??null, radiusKm:view.mapNearRadiusKm,
      savedOnly:view.mapSavedOnly,savedIds,
    }),
    scope: view.mapScope, group: view.mapGroup, search: view.mapSearch,
    viewportOnly:view.mapViewportOnly,viewportBounds:view.mapViewportBounds,compact:view.mapCompact,
    saved:savedIds,savedOnly:view.mapSavedOnly,
    nearby:nearbyAnchor?{id:nearbyAnchor.id,name:nearbyAnchor.name,
      point:nearbyAnchor.point,radiusKm:view.mapNearRadiusKm}:null,
    showCityReferences: view.mapShowCityReferences,
    limit: view.mapListLimit, routeMode: view.mapRouteMode, routeTime: view.mapRouteTime,
    connection: {
      from: all.find(i => i.id === view.mapFrom) ?? null,
      to: all.find(i => i.id === view.mapTo) ?? null,
      status: view.mapRouteResult?.status ?? null,
      route: view.mapRouteResult?.route ?? null,
    },
  } : null;
  if (!detail && explorer) detail = [...explorer.placed, ...explorer.unlocated].find(i => i.id === view.selected) ?? null;
  const preview = view.timetablePreview;
  const timetablePreview = preview?.variantId === variant.id && preview.planDate === date && segments.some(s => s.key === preview.key) ? preview : null;
  return {
    ...view, catalog, variant, variants: catalog.variants, trip, cities: catalog.cities, state, people, all, active, activeSet,
    budget: calculateBudget(active, state), day, fullDay, dates, date, city, cityForDay, dayCities, wholeDay, dayTravel, detail, hotelWalks, station,
    dayPlan:trip.dayPlansV32?.find(row=>row.date===date)??null,
    mealHotel, foodPlaces, foodWalks, explorer,
    dayRoute: { items: view.dayQueueIds.map(id => all.find(x => x.id === id)).filter(Boolean),
      routes: view.dayQueueRoutes, time: view.dayQueueTime, status: view.dayQueueStatus,
      focusIndex: view.dayQueueFocus, displayMode: view.dayQueueDisplay },
    stops: stops.filter((item, i) => stops.indexOf(item) === i), segments, routes, conflictRoutes, saving, timetablePreview,
    options: all.filter(i => i.city === city && !activeSet.has(i.id) && !i.duplicateOf && !i.removed),
  };
}

function mapVisible(ctx) {
  return ctx.page === 'map' || ctx.page === 'plan' && (!matchMedia('(max-width:910px)').matches || ctx.mobile === 'map');
}

function paintMap(fit = false) {
  if (!currentMap) return;
  currentMap.paint({ trip: context.trip, city: context.city, cities: context.cities, entries: context.day, stops: context.stops,
    dayTravel: context.dayTravel, routes: context.routes, options: context.options, total: context.total,
    filters: context.filters, focused: context.page==='map'
      ?(context.day.find(i=>i.entryKey===context.selected)?.id??context.selected)
      :context.selected, timetablePreview: context.timetablePreview,
    explorer: context.explorer, dayRoute: context.dayRoute,
    profileCtx: {people:context.people,cities:context.cities,state:context.state} });
  if (fit) currentMap.fit();
}

function selectPoint(id, focusMap = true) {
  // Explorer markers are keyed by source item ID, but the day itinerary uses
  // an entryKey (sometimes distinct, e.g. transport arrival/departure).
  // Select its rich day entry while focusing the actual mapped source marker.
  const planned=context?.day?.find(item=>item.entryKey===id||item.id===id);
  const selectedKey=planned?.entryKey??id;
  const mapKey=planned?.id??id;
  view.selected = selectedKey;
  context = buildContext();
  const container = document.querySelector('#detail-container');
  if (container) container.innerHTML = mapDetail(context);
  const mapPreview=app.querySelector('#map-selection-preview');
  if(mapPreview)mapPreview.innerHTML=mapSelectionPreview(context);
  app.querySelectorAll('.explorer-place').forEach(card=>{
    card.dataset.selected=String(card.dataset.placeId===mapKey);
  });
  app.querySelectorAll('.reference-agenda-select').forEach(button=>{
    const pressed=button.dataset.value===selectedKey;
    button.setAttribute('aria-pressed',String(pressed));
    button.closest('.reference-agenda-item')?.classList.toggle('is-active',pressed);
  });
  // Marker selection brings its existing list item into view on desktop,
  // but must not jump the whole page away from the map on a phone.
  if(!focusMap && matchMedia('(min-width:1180px)').matches) {
    const card=[...app.querySelectorAll('.explorer-place')].find(el=>el.dataset.placeId===id);
    card?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  app.querySelectorAll('.map-day-stop').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.value===selectedKey));
  });
  app.querySelectorAll('.event-content').forEach(button => {
    const pressed = button.dataset.value === selectedKey;
    button.setAttribute('aria-pressed', pressed);
    button.closest('.event-card').classList.toggle('selected', pressed);
  });
  paintMap();
  motion.spotlight(app,mapKey);
  if (focusMap) currentMap?.focus(context.page==='map'?mapKey:selectedKey);
  if (focusMap && matchMedia('(max-width:910px)').matches && context.mobile === 'plan') {
    const item = context.detail;
    if (item?.point) {
      view.mobile = 'map';
      render({ focusMap: true });
    } else if (item) itemDetails(context, item, view.inspectorCompareIds);
  }
}

function visibleBounds(map) {
  if(!map)return null;
  const bounds=map.getBounds();
  return [bounds.getSouth(),bounds.getWest(),bounds.getNorth(),bounds.getEast()];
}
// Only update the HTML results when the map is moved. Do not recreate Leaflet
// from its own moveend listener, which would erase pan/zoom state.
function refreshViewportList() {
  if(view.page!=='map'||!view.mapViewportOnly||!currentMap)return;
  const bounds=visibleBounds(currentMap.map);
  if(!bounds)return;
  const previous=view.mapViewportBounds;
  if(previous&&bounds.every((v,i)=>Math.abs(v-previous[i])<0.000001))return;
  view.mapViewportBounds=bounds;
  context=buildContext();
  const list=app.querySelector('.explorer-list');
  if(list)list.outerHTML=explorerList(context);
  const line=app.querySelector('#explorer-viewport-stat');
  if(line)line.textContent='Liste folgt dem sichtbaren Kartenausschnitt';
}

function render({ restoreView = false, focusMap = false, fetchRoutes = true } = {}) {
  if (!variant) return;
  const previous = currentMap && restoreView ? [currentMap.map.getCenter(), currentMap.map.getZoom()] : null;
  const active = document.activeElement;
  const focusAction = app.contains(active) ? active.dataset?.action : null;
  const focusValue = active?.dataset?.value;
  const sideScroll = app.querySelector('.sidebar-inner')?.scrollTop;
  const dateScroll = app.querySelector('.days')?.scrollLeft;
  currentMap?.destroy();
  currentMap = null;
  context = buildContext();
  document.documentElement.dataset.theme = view.theme;
  document.documentElement.dataset.motion = view.mapMotion;
  app.innerHTML = renderShell(context);
  motion.reveal(app,context);
  motion.images(app);
  if (guideStep(view.guideIndex)) {
    app.querySelector(guideStep(view.guideIndex).focus)?.classList.add('guide-spotlight');
    app.querySelector('.guide-next')?.focus({ preventScroll: true });
  }
  const sidebar = app.querySelector('.sidebar-inner');
  if (sidebar && sideScroll) sidebar.scrollTop = sideScroll;
  const days = app.querySelector('.days');
  if (days) {
    if (dateScroll && restoreView) days.scrollLeft = dateScroll;
    else {
      const picked = days.querySelector('[aria-pressed=true]');
      if (picked) days.scrollLeft = Math.max(0, picked.offsetLeft - days.offsetLeft - 92);
    }
  }
  if (focusAction) {
    const replacement = [...app.querySelectorAll('[data-action]')].find(b => b.dataset.action === focusAction && b.dataset.value === focusValue && b.offsetParent);
    replacement?.focus({ preventScroll: true });
  }
  const element = document.querySelector('#map');
  if (element && mapVisible(context) && window.L) {
    currentMap = new TripMap(element, {
      select: id => { selectPoint(id, false); },
      leg: index => action('leg', index), visitCity: id => action('city', id),
      routeStop: index => action('day-route-focus', String(index)),
      hover: (id,on)=>{
        const card=[...app.querySelectorAll('.explorer-place')].find(el=>el.dataset.placeId===id);
        card?.classList.toggle('atlas-hover',on);
      },
      report: message => {
        const hint = document.querySelector('#map-hint');
        if (hint) { hint.textContent = message; hint.hidden = !message; }
      },
    });
    paintMap(true);
    if (previous) currentMap.map.setView(previous[0], previous[1], { animate: false });
    if (focusMap) currentMap.focus(context.selected);
    currentMap.map.on('moveend',refreshViewportList);
    if(view.mapViewportOnly)refreshViewportList();
  }
  if (fetchRoutes) void fetchCachedRoutes(context);
}

async function fetchCachedRoutes(ctx) {
  if (!['plan', 'map', 'lodging', 'food'].includes(ctx.page) || ctx.total) return;
  const token = ++revisionToken;
  const tasks = [
    ...ctx.segments.filter(s => !s.access).map(s => [s.from.point, s.to.point]),
    ...ctx.all.filter(i => i.city === ctx.city && i.kind === 'lodging').map(i => [i.localStation?.point ?? ctx.station, i.point]),
    ...(ctx.page === 'food' ? ctx.foodPlaces.map(i => [ctx.mealHotel?.point, i.point]) : []),
  ];
  const unique = new Map(tasks.filter(([a, b]) => a && b && pointKey(a) !== pointKey(b)).map(([a, b]) => [walkKey(a, b), [a, b]]));
  const requests = [...unique.entries()].flatMap(([key, points]) => {
    if (walks.has(key)) return [];
    if (!pendingWalks.has(key)) {
      const pending = api('/api/walk', 'POST', { points, cachedOnly: true })
        .catch(() => null)
        .then(result => {
          if (!walks.has(key)) walks.set(key, result);
          return walks.get(key);
        }).finally(() => pendingWalks.delete(key));
      pendingWalks.set(key, pending);
    }
    return [pendingWalks.get(key)];
  });
  const results = await Promise.all(requests);
  if (results.some(Boolean) && token === revisionToken) render({ restoreView: true, fetchRoutes: false });
}

function say(message, reversible = false) {
  clearTimeout(toastTimer);
  toast.innerHTML = icon('check') + '<span>' + esc(message) + '</span>' + (reversible ? '<button type="button" data-action="undo">Rückgängig</button>' : '');
  toastTimer = setTimeout(() => { toast.textContent = ''; }, reversible ? 8500 : 4800);
}

async function save(next, message, recordUndo = true) {
  if (saving || loading) throw new Error('Eine Änderung wird bereits verarbeitet.');
  const before = variant.state;
  const id = variant.id;
  saving = true;
  const label = app.querySelector('.status-icon');
  if (label) label.textContent = 'Speichert …';
  try {
    const response = await api(variantUrl(), 'PUT', { state: next, revision: variant.revision });
    if (recordUndo) undo = { id, state: before };
    Object.assign(variant, { state: next, revision: response.revision });
    Object.assign(catalog.variants.find(v => v.id === id), { state: next, revision: response.revision });
    say(message, recordUndo);
  } finally {
    saving = false;
    render({ restoreView: true });
  }
}

async function switchVariant(id) {
  if (loading || saving || !catalog.variants.some(v => v.id === id)) return;
  loading = true;
  try {
    variant = await api('/api/variant/' + encodeURIComponent(id));
    localStorage.setItem('reiseplan-variant', id);
    view.city = view.date = view.selected = view.wholeDay = null;
    view.mapFrom = view.mapTo = view.mapRouteResult = null;
    view.mapNearPointId=null;view.mapViewportOnly=false;view.mapViewportBounds=null;view.mapSavedOnly=false;
    view.dayQueueIds = []; view.dayQueueRoutes = []; view.dayQueueStatus = ''; view.dayQueueFocus = 0; view.geocodeReview=null;
    view.total = view.menu = false;
    view.compareIds.clear();view.inspectorCompareIds=[];
    view.dailyBudgetDate=null; view.showAllVotes=false;
    render();
  } finally { loading = false; }
}

function showCity(id, date, wholeDay = false) {
  if (!context.trip.route.includes(id)) return;
  if (id !== view.city || (date && date !== view.date)) {
    view.dayQueueIds = []; view.dayQueueRoutes = []; view.dayQueueStatus = ''; view.dayQueueFocus = 0;
  }
  view.city = id;
  view.timetablePreview = null;
  view.wholeDay = wholeDay;
  view.date = date || (context.city === id ? context.date : context.dates.find(d => context.cityForDay(d) === id)
    ?? context.trip.stayByCity[id]?.from ?? context.dates.find(d => dayEntries(context.active, d, id).length) ?? context.date);
  view.selected = null;
  view.mapNearPointId=null;view.mapViewportOnly=false;view.mapViewportBounds=null;
  view.total = view.menu = false;
  view.compareIds.clear();
  render();
}

function showTimetable(ctx, search) {
  timetableSearch = search;
  const segment = ctx.segments[search.index];
  timetableForm(ctx, search, async data => {
    const dialog = document.querySelector('#dialog');
    const form = dialog.querySelector('#modal-form');
    const date = String(data.get('serviceDate'));
    const time = String(data.get('time'));
    const excluded = String(data.get('excluded') ?? '').split(',').map(line => line.trim()).filter(Boolean);
    const result = await api('/api/transit', 'POST', { city: search.city, points: [segment.from.point, segment.to.point], date, time, excluded });
    if (!dialog.open || dialog.querySelector('#modal-form') !== form || variant.id !== ctx.variant.id) return;
    showTimetable(ctx, { ...search, date, time, excluded, result });
  });
}

async function calculateExplorerRoute() {
  if (!context || context.page !== 'map') return;
  const ctx = context;
  const pooled = [...ctx.all, ...(ctx.explorer?.placed ?? []), ...(ctx.explorer?.unlocated ?? [])];
  const from = pooled.find(item => item.id === view.mapFrom);
  const to = pooled.find(item => item.id === view.mapTo);
  const input = explorerRouteInput(from, to);
  if (!input) {
    const external = from?.id !== to?.id && googleMapsDirectionsUrl(from, to, ctx.cities, view.mapRouteMode === 'walk' ? 'walking' : 'transit');
    view.mapRouteResult = { status: external
      ? 'Keine genaue lokale Routenberechnung möglich. Google Maps kann mit Name bzw. Adresse eine Verbindung suchen; Ergebnis dort prüfen.'
      : 'Bitte zuerst zwei verschiedene Reiseorte auswählen.', route: null };
    render({ restoreView: true, fetchRoutes: false });
    return;
  }
  const selectedVariant = variant.id;
  const fromId = from.id, toId = to.id, mode = view.mapRouteMode, when = view.mapRouteTime, date = ctx.date;
  view.mapRouteResult = { status: 'Prüfe eine verfügbare Verbindungsquelle …', route: null };
  render({ restoreView: true, fetchRoutes: false });
  try {
    if (!input.sameCity) throw new Error('Orte liegen in unterschiedlichen Städten. Nutze die externe ÖPNV-Routenansicht oder das Bahnmodul. Eine lokale Stadtverbindung wird nicht erfunden.');
    if (!input.canWalk) throw new Error('Für diese Entfernung liegt keine belastbare lokale Wegberechnung vor. Eine externe Verkehrsplanung ist erforderlich.');
    let route;
    if (mode === 'walk') {
      route = await api('/api/walk', 'POST', { points: input.points });
      if (!route?.walkOnly || !Array.isArray(route.points) || route.points.length < 2)
        throw new Error('Fußrouter hat keine nachvollziehbare Straßenroute geliefert.');
    } else {
      const meta = catalog.transitSchedules?.[from.city];
      if (!meta || date < meta.from || date > meta.to)
        throw new Error('Kein gültiges ÖPNV-Fahrplanpaket für ' + date + ' verfügbar. Bitte die externe ÖPNV-Verbindung beim Anbieter prüfen.');
      const results = await api('/api/transit', 'POST', {
        city: from.city, points: input.points, date, time: when, excluded: [],
      });
      route = results.routes?.[0];
      if (!route?.legs?.length)
        throw new Error('Im vorhandenen Fahrplanpaket keine passende Verbindung gefunden. Betreiberplaner verwenden.');
    }
    if (variant.id !== selectedVariant || view.mapFrom !== fromId || view.mapTo !== toId
      || view.mapRouteMode !== mode || view.mapRouteTime !== when || context.date !== date) return;
    view.mapRouteResult = { status: 'Routenquelle wurde geladen; Öffnungs- und Tarifbedingungen am Reisetag prüfen.', route };
    render({ restoreView: true, fetchRoutes: false });
    currentMap?.focusConnection(from.point, to.point);
  } catch (error) {
    if (variant.id !== selectedVariant || view.mapFrom !== fromId || view.mapTo !== toId) return;
    view.mapRouteResult = { status: error.message, route: null };
    render({ restoreView: true, fetchRoutes: false });
  }
}


async function fetchDayQueueRoutes() {
  const ctx = context;
  if (!ctx || ctx.page !== 'map' || view.dayQueueIds.length < 2) throw new Error('Wähle mindestens zwei Aktivitäten.');
  const items = view.dayQueueIds.map(id => ctx.all.find(i => i.id === id));
  if (items.some(i => !i || !i.point || i.city !== ctx.city)) throw new Error('Stopps müssen geolokalisiert und in derselben gewählten Stadt liegen.');
  view.dayQueueRoutes = [];
  view.dayQueueStatus = 'Berechne die Fußwege über den Router …';
  render({ restoreView:true, fetchRoutes:false });
  for (let i = 1; i < items.length; i++) {
    const from = items[i-1], to = items[i];
    const input = explorerRouteInput(from,to);
    if (!input?.sameCity || !input.canWalk) {
      view.dayQueueStatus = 'Keine belegbare Fußroute für ' + from.name + ' → ' + to.name;
      render({ restoreView:true, fetchRoutes:false });
      return;
    }
    try {
      const route = walks.get(walkKey(from.point,to.point)) ?? await api('/api/walk','POST',{points:[from.point,to.point]});
      if (!route?.walkOnly || !route?.points?.length || !Number.isFinite(route.minutes)) throw new Error('Unvollständige Fußwegantwort.');
      walks.set(walkKey(from.point,to.point), route);
      view.dayQueueRoutes.push(route);
    } catch (e) {
      view.dayQueueStatus = 'Fußweg ' + from.name + ' → ' + to.name + ' nicht bestätigt: ' + e.message;
      render({ restoreView:true, fetchRoutes:false });
      return;
    }
  }
  view.dayQueueStatus = 'Alle Fußwegstrecken berechnet. Öffnungszeiten und Ticketverfügbarkeit weiterhin prüfen.';
  render({ restoreView:true, fetchRoutes:false });
}

async function commitDayQueue() {
  const ctx = context;
  const items = view.dayQueueIds.map(id=>ctx.all.find(x=>x.id===id));
  const preview = buildMultiStopDay(items,view.dayQueueRoutes,view.dayQueueTime);
  if (!preview.complete || !items.every(i=>i && i.city === ctx.city && !i.locked && !i.booked
      && !ctx.activeSet.has(i.id))) throw new Error('Nur freie, noch nicht eingeplante Aktivitäten mit vollständig berechneten Fußwegen übernehmen.');
  const edits = {...ctx.state.edits};
  const newWindows = preview.rows.map(r=>{
    const item=items.find(x=>x.id===r.id);
    const start=utcFromLocal(ctx.date,r.at,item.zone,item.start);
    const end=Date.parse(start) + r.duration * 60000;
    return {item,r,start:Date.parse(start),end};
  });
  const existing=ctx.active.filter(item=>item.kind==='activity' && dayOf(item)===ctx.date
    && item.start && !items.some(i=>i.id===item.id));
  if(newWindows.some(({start,end})=>existing.some(i=>{
    const x=Date.parse(i.start), y=x+(i.duration??60)*60000;
    return start<y && end>x;
  }))) throw new Error('Deine Tagesroute überschneidet sich mit bestehenden Aktivitäten. Bearbeite erst den bisherigen Tagesplan.');
  for(const {item,r} of newWindows) {
    if (item.minAge && ctx.people.some(p=>p.age!=null && p.age<item.minAge))
      throw new Error(item.name + ': Altersgrenze nicht für alle erfüllt.');
    if (item.requiresKitchen) throw new Error('Für ' + item.name + ' bitte Kochmöglichkeit separat prüfen.');
    edits[item.id]={...edits[item.id],selected:true,removed:false,date:ctx.date,
      start:utcFromLocal(ctx.date,r.at,item.zone,item.start),end:null,duration:r.duration};
  }
  await save({...ctx.state,edits},newWindows.length + ' Stopps in den Tagesplan übernommen');
  view.dayQueueIds=[];view.dayQueueRoutes=[];view.dayQueueStatus='';
  view.page='plan';view.mobile='plan';render();
}
function guideNavigate(next) {
  if (!guideStep(next)) return;
  view.guideIndex = next;
  const page = GUIDE_STEPS[next].page;
  if (view.page !== page) changePage(page);
  else render({ restoreView: true });
}
function closeGuide(completed = false) {
  view.guideIndex = null;
  if (completed) localStorage.setItem('reiseplan-guide-completed', '1');
  render({ restoreView: true });
}
function changePage(page) {
  if (!['overview', 'plan', 'map', 'rail', 'lodging', 'discover', 'food', 'budget', 'group', 'data'].includes(page)) return;
  view.page = page;
  view.menu = false;
  view.optionFilter = 'all';
  if (page !== 'map') view.total = false;
  if (page === 'map' && view.mapScope === 'trip') view.total = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}

async function withEdit(item, edit, message) {
  if (!item) return;
  const { state } = variant;
  await save({ ...state, edits: { ...state.edits, [item.id]: { ...state.edits[item.id], ...edit } } }, message);
}

async function reorder(fromId, toId) {
  const from = context.day.find(i => i.id === fromId);
  const to = context.day.find(i => i.id === toId);
  const can = i => i && !i.locked && !i.booked && i.kind === 'activity';
  if (!can(from) || !can(to) || from === to || from.city !== to.city) throw new Error('Nur flexible Aktivitäten am selben Ort und Tag lassen sich tauschen.');
  const updates = { ...context.state.edits };
  for (const [item, dest] of [[from, to], [to, from]]) {
    const delta = item.start && item.end ? Date.parse(item.end) - Date.parse(item.start) : null;
    updates[item.id] = { ...updates[item.id], date: context.date, start: dest.start ?? null,
      end: delta && dest.start ? new Date(Date.parse(dest.start) + delta).toISOString() : null,
      order: context.day.indexOf(dest) };
  }
  await save({ ...context.state, edits: updates }, 'Aktivitäten getauscht');
}

function optimize() {
  const candidates = context.day.filter(i => i.kind === 'activity' && i.city === context.city && i.point && i.start && !i.locked && !i.booked);
  if (candidates.length < 2) {
    openDialog('Tag prüfen', '<p>Zwei flexible Aktivitäten mit Zeiten und Koordinaten sind für einen Tausch nötig.</p>');
    return;
  }
  const [first, second] = candidates;
  const forward = walks.get(walkKey(first.point, second.point));
  const backward = walks.get(walkKey(second.point, first.point));
  openDialog('Reihenfolge prüfen', '<p>Vorschau für einen Tausch der Startzeiten. Gesperrte Einträge behalten ihren Platz.</p>'
    + '<div class="stack"><p><strong>Aktuell</strong> ' + esc(first.name + ' → ' + second.name)
    + (forward ? ' · ' + forward.minutes + ' Min.' : ' · Wegzeit offen') + '</p><p><strong>Vorschlag</strong> '
    + esc(second.name + ' → ' + first.name) + (backward ? ' · ' + backward.minutes + ' Min.' : ' · Wegzeit offen')
    + '</p></div><div class="dialog-foot">' + btn('close', 'Abbrechen') + btn('reorder', 'Tausch übernehmen', 'check', JSON.stringify([first.id, second.id]), 'primary') + '</div>');
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCalendar() {
  const escape = value => String(value ?? '').replace(/[\\,;]/g, s => '\\' + s).replace(/\r?\n/g, '\\n');
  const stamp = date => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const rows = [
    ...context.active.filter(i => i.start).map(i => ({ id: i.id, start: i.start, end: i.end, title: i.name })),
    ...context.state.deadlines.filter(d => d.when && !d.done).map(d => ({ id: d.id, start: d.when, title: d.title })),
  ];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Reiseplaner lokal//DE', ...rows.flatMap(i => [
    'BEGIN:VEVENT', 'UID:' + escape(variant.id + '-' + i.id) + '@reiseplan.local', 'DTSTAMP:' + stamp(Date.now()),
    'DTSTART:' + stamp(i.start), ...(i.end ? ['DTEND:' + stamp(i.end)] : []), 'SUMMARY:' + escape(i.title), 'END:VEVENT',
  ]), 'END:VCALENDAR'];
  download('reiseplan.ics', lines.join('\r\n') + '\r\n', 'text/calendar;charset=utf-8');
}

async function discoverCommonsPhotos(ctx,item){
  const previous=document.querySelector('#commons-photo-query');
  const query=(previous?.value?.trim() || commonsDefaultQuery(item,ctx.cities)).slice(0,110);
  const rid=Symbol('commonsPhotoSearch');
  commonsPhotoPick={request:rid,variantId:ctx.trip.id,itemId:item.id,results:[]};
  const sourceLink=commonsWebSearchUrl(query);
  const shell=(body)=>'<p class="muted">Die Ergebnisse sind nur Bildvorschläge. '
    +'Bitte prüfen, ob das Bild tatsächlich diesen Ort zeigt. Für Unterkünfte insbesondere: '
    +'keine Zimmer- oder Objektbilder anderer Anbieter übernehmen. Nur zulässige CC-/Public-Domain-Lizenzen '
    +'mit Urheber und Lizenzquelle werden zur Übernahme angeboten.</p>'
    +'<div class="commons-photo-searchbar"><label class="field"><span>Ort / Suchbegriff</span>'
    +'<input type="search" id="commons-photo-query" maxlength="110" value="'+esc(query)+'"></label>'
    +btn('commons-photo-search','Erneut suchen','compass',item.id)
    +'</div><p class="muted">'+
    '<a href="'+esc(sourceLink)+'" target="_blank" rel="noopener noreferrer">Suche direkt auf Wikimedia Commons öffnen</a>'
    +' · Externe Bilder werden erst nach deiner Bestätigung gespeichert.</p>'+body
    +'<div class="dialog-foot">'+btn('photo-edit','Bildlink manuell ergänzen','pin',item.id)
    +btn('close','Schließen')+'</div>';
  openDialog('Lizenzbilder finden · '+item.name,shell('<p role="status">Lizenzdaten und Vorschaubilder werden geladen …</p>'));
  try{
    const response=await fetch(commonsSearchUrl(query),{headers:{Accept:'application/json'},
      signal:AbortSignal.timeout(13000)});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    if(!commonsPhotoPick||commonsPhotoPick.request!==rid||variant.id!==ctx.trip.id
      ||!document.querySelector('#dialog')?.open)return;
    const results=commonsResults(data).slice(0,12);
    commonsPhotoPick.results=results;
    if(!results.length){
      openDialog('Lizenzbilder finden · '+item.name,shell(
        '<p role="status">Keine ausreichend lizenzierten Bilder gefunden. '
        +'Versuche einen anderen Ortsnamen oder nutze die Commons-Seite und den manuellen Bildlink.</p>'));
      return;
    }
    const cards='<div class="commons-photo-results">'+results.map((p,index)=>
      '<article><img loading="lazy" src="'+esc(p.url)+'" alt="Vorschau: '
      +esc(p.name)+'"><strong>'+esc(p.name)+'</strong><small>'+esc(p.credit)
      +'</small><div class="row-actions">'+btn('commons-photo-choose','Dieses Motiv übernehmen','check',String(index),'subtle')
      +'<a href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bild und Lizenz prüfen</a></div></article>'
    ).join('')+'</div>';
    openDialog('Lizenzbilder finden · '+item.name,shell(cards));
  }catch(err){
    if(!commonsPhotoPick||commonsPhotoPick.request!==rid
      ||!document.querySelector('#dialog')?.open)return;
    commonsPhotoPick.results=[];
    openDialog('Lizenzbilder finden · '+item.name,shell(
      '<p role="status">Wikimedia Commons ist derzeit nicht erreichbar ('
      +esc(String(err?.message??'Netzwerkfehler'))+'). '
      +'Du kannst die Suche extern öffnen und das Bild danach mit URL, Urheber und Lizenz manuell ergänzen.</p>'));
  }
}

async function action(name, value = '') {
  if (!context) return;
  const ctx = context;
  const item = ctx.all.find(i => i.id === value)
    ?? ctx.explorer?.placed.find(i => i.id === value)
    ?? ctx.explorer?.unlocated.find(i => i.id === value);
  switch (name) {
    case 'guide-start': guideNavigate(0); break;
    case 'guide-next': guideNavigate(Math.min(GUIDE_STEPS.length-1,view.guideIndex+1)); break;
    case 'guide-prev': guideNavigate(Math.max(0,view.guideIndex-1)); break;
    case 'guide-jump': guideNavigate(Number(value)); break;
    case 'guide-close': closeGuide(); break;
    case 'guide-finish': closeGuide(true); say('Einführung abgeschlossen. Du kannst sie oben jederzeit erneut starten.'); break;
    case 'page': changePage(value); break;
    case 'menu': view.menu = !view.menu; render({ restoreView: true }); break;
    case 'theme':
      view.theme = view.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('reiseplan-theme', view.theme); render({ restoreView: true }); break;
    case 'variant': await switchVariant(value); break;
    case 'city':
      if (view.page === 'map') { view.mapScope = 'city'; view.total = false; }
      showCity(value); break;
    case 'trip-city':
      if (!context.trip.route.includes(value)) break;
      view.page='plan';view.total=false;
      showCity(value);break;
    case 'day': showCity(ctx.cityForDay(value), value, view.wholeDay === true || ctx.trip.id === 'swiss_lakes'); break;
    case 'day-plan-go':
      if(!ctx.trip.dayPlansV32?.some(row=>row.date===value))break;
      view.page='plan';view.mobile='plan';
      showCity(ctx.cityForDay(value),value);
      break;
    case 'day-plan-add':
    case 'day-plan-adopt': {
      if(!ctx.dayPlan)break;
      const prepared=dayPlanDraftEdits(ctx,{
        activityId:name==='day-plan-add'?value:null
      });
      if(prepared.skipped){
        say('Dieser Vorschlag ist bereits eingeplant oder nicht übernehmbar.');
        break;
      }
      await save({...ctx.state,edits:prepared.edits},
        prepared.added.length+' '+(prepared.added.length===1?'Aktivität':'Aktivitäten')
        +' als unverbindliche Ideen für '+ctx.date+' hinzugefügt');
      break;
    }
    case 'day-place':
      showCity(value === 'all' ? ctx.cityForDay(ctx.date) : value, ctx.date, value === 'all'); break;
    case 'mobile': view.mobile = value; render(); break;
    case 'show-route': view.total = true; changePage('map'); break;
    case 'map-simple-toggle':
      view.mapSimple=!view.mapSimple;
      localStorage.setItem('reiseplan-map-simple',view.mapSimple?'on':'off');
      render({restoreView:true,fetchRoutes:false});
      break;
    case 'simple-find':
      view.mapScope='city';view.total=false;view.mapSavedOnly=false;
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapGroup='all';view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});
      app.querySelector('#map-search')?.scrollIntoView({block:'center',behavior:'instant'});
      app.querySelector('#map-search')?.focus({preventScroll:true});
      break;
    case 'map-mode':
      if(!['day','city','total'].includes(value))break;
      view.mapScope=value==='total'?'trip':value;
      view.total=value==='total';
      view.mapListLimit=60;
      // A route/day switch must show the requested POIs, not retain a
      // bounding box or "only saved" filter from a different map scope.
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapSavedOnly=false;view.mapNearPointId=null;
      view.selected=null;
      render({fetchRoutes:false});
      break;
    case 'explorer-scope':
      if(!['day','city','trip'].includes(value))break;
      view.mapScope=value;
      view.total=value==='trip';
      view.mapListLimit=60;view.mapViewportOnly=false;
      view.mapViewportBounds=null;view.mapNearPointId=null;
      view.selected=null;
      render({fetchRoutes:false}); break;
    case 'explorer-references':
      view.mapShowCityReferences = !view.mapShowCityReferences;
      render({ restoreView: true }); break;
    case 'explorer-reset':
      view.mapGroup='all';view.mapSearch='';view.mapScope='trip';view.total=true;
      view.mapViewportOnly=false;view.mapViewportBounds=null;view.mapNearPointId=null;view.mapSavedOnly=false;
      view.mapListLimit=60;
      render({fetchRoutes:false});break;
    case 'explorer-group':
      if (!['all', 'lodging', 'food', 'shop', 'activity', 'transport'].includes(value)) break;
      view.mapGroup = value; view.mapListLimit = 60; render({ restoreView: true }); break;
    case 'explorer-search':
      view.mapSearch = document.querySelector('#map-search')?.value?.trim().slice(0, 100) ?? '';
      view.mapListLimit = 60; render({ restoreView: true }); break;
    case 'explorer-viewport':
      view.mapViewportOnly=!view.mapViewportOnly;
      view.mapViewportBounds=view.mapViewportOnly?visibleBounds(currentMap?.map):null;
      view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});break;
    case 'explorer-display':
      if(!['compact','details'].includes(value))break;
      view.mapCompact=value==='compact';
      render({restoreView:true,fetchRoutes:false});break;
    case 'explorer-nearby': {
      if(!item||!validPoint(item.point)){say('Für eine Umkreissuche ist ein belegter Kartenpunkt nötig.');break;}
      view.mapNearPointId=item.id;view.mapNearRadiusKm=3;
      view.total=false;view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});
      currentMap?.focusNearby();
      break;
    }
    case 'explorer-near-radius': {
      const radius=Number(value);
      if(![1,3,10].includes(radius)||!view.mapNearPointId)break;
      view.mapNearRadiusKm=radius;view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});
      currentMap?.focusNearby();
      break;
    }
    case 'explorer-near-clear':
      view.mapNearPointId=null;view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});break;
    case 'explorer-save': {
      if(!item||!item.id||!['activity','lodging','transport'].includes(item.kind)){
        say('Dieser Eintrag kann nicht auf die Karten-Merkliste gesetzt werden.');break;
      }
      const result=toggleMapBookmark(localStorage,variant.id,item.id);
      say(result.saved?'Ort für diese Reisevariante gemerkt.':'Ort aus der Merkliste entfernt.');
      render({restoreView:true,fetchRoutes:false});
      if(result.saved)motion.animateSaved(app,item.id);
      break;
    }
    case 'explorer-saved-only':
      view.mapSavedOnly=!view.mapSavedOnly;view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});break;
    case 'explorer-list-focus': {
      if(view.page!=='map'||!item)break;
      const displayItems=context.explorer?.viewportOnly&&context.explorer.viewportBounds
        ?context.explorer.placed.filter(i=>mapPointInBounds(i.point,context.explorer.viewportBounds))
        :[...(context.explorer?.placed??[]),...(context.explorer?.unlocated??[])];
      const index=displayItems.findIndex(i=>i.id===item.id);
      if(index<0){
        say('Dieser Ort liegt außerhalb des aktuellen Kartenfilters. Filter oder Kartenausschnitt ändern.');
        break;
      }
      if(index>=view.mapListLimit){
        view.mapListLimit=Math.ceil((index+1)/60)*60;
        render({restoreView:true,fetchRoutes:false});
      }
      const card=[...app.querySelectorAll('.explorer-place')].find(el=>el.dataset.placeId===item.id);
      if(card){card.scrollIntoView({block:'center',behavior:'smooth'});
        card.querySelector('[data-action=explorer-focus],[data-action=details]')?.focus({preventScroll:true});}
      break;
    }
    case 'explorer-more':
      view.mapListLimit += 60; render({ restoreView: true }); break;
    case 'explorer-focus':
      if (item?.point) selectPoint(value, true); break;
    case 'explorer-start':
    case 'explorer-end':
      // Google Maps can search by name/address even when the internal map has
      // no precise point. Internal route calculation still requires both points.
      if (!item?.name || !item?.city) { say('Für diesen Ort fehlt eine verwertbare Ortsangabe.'); break; }
      if (name === 'explorer-start') view.mapFrom = value;
      else view.mapTo = value;
      view.mapRouteResult = null;
      if (view.mapFrom && view.mapTo) await calculateExplorerRoute();
      else render({ restoreView: true }); break;
    case 'explorer-mode':
      view.mapRouteMode = value === 'transit' ? 'transit' : 'walk';
      view.mapRouteResult = null;
      if (view.mapFrom && view.mapTo) await calculateExplorerRoute();
      else render({ restoreView: true }); break;
    case 'explorer-route':
      view.mapRouteTime = document.querySelector('#explorer-time')?.value ?? view.mapRouteTime;
      await calculateExplorerRoute(); break;

    case 'geocode-lookup': {
      if(!item?.address || item.booked){ say('Für diese Option ist keine offene Rechercheadresse vorhanden.');break; }
      const result=await api('/api/geocode','POST',{variantId:variant.id,itemId:item.id});
      view.geocodeReview={id:item.id,variantId:variant.id,candidates:result.candidates};
      openDialog('Adresse auf der Karte prüfen',
        '<p>Rechercheadresse: '+esc(result.address)+'</p>'
        + '<p class="muted">'+esc(result.warning)+' Die Auswahl speichert nur einen nutzerbestätigten Kartenpunkt, keine Reservierung.</p>'
        + (result.candidates.length
          ? result.candidates.map((candidate,i)=>
            '<div class="panel panel-pad"><p>'+esc(candidate.displayName)+'</p><p>Koordinate: '
            +candidate.point.map(v=>v.toFixed(6)).join(', ')+'</p>'
            +btn('geocode-apply','Diesen Punkt bewusst übernehmen','pin',String(i))+'</div>').join('')
          : '<p>Keine plausiblen OSM-Suchergebnisse in der Zielregion; Adresse von Hand prüfen.</p>')
        + '<p><a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">© OpenStreetMap-Mitwirkende / Nominatim</a></p>');
      break;
    }
    case 'geocode-apply': {
      const review=view.geocodeReview;
      if(!review || review.variantId!==variant.id)throw new Error('Die Geokodierung gehört zu einer anderen Variante.');
      const candidate=review.candidates[Number(value)];
      const original=ctx.all.find(x=>x.id===review.id);
      if(!candidate || !original || original.booked || !original.address)
        throw new Error('Der Kartenpunkt ist nicht mehr zuordenbar.');
      const next={...ctx.state.edits,[original.id]:{
        ...ctx.state.edits[original.id],point:candidate.point,
        address:original.address,
        detail:(original.detail??'')+' · Kartenpunkt aus einer manuell bestätigten OpenStreetMap-Nominatim-Suche; genaue Eingangslage nicht unabhängig geprüft.',
      }};
      await save({...ctx.state,edits:next},'Nutzerbestätigten Kartenpunkt lokal gespeichert');
      view.geocodeReview=null;closeDialog();break;
    }
    case 'day-route-add':
      if (!item || item.kind !== 'activity' || !item.point || item.city !== ctx.city
        || ctx.activeSet.has(item.id) || item.locked || item.booked) {
        say('Wähle eine nicht eingeplante Aktivität mit genauer Position in der aktuellen Stadt.'); break;
      }
      if (view.dayQueueIds.includes(value)) { say('Dieser Stopp steht bereits in der Route.'); break; }
      if (view.dayQueueIds.length >= 8) { say('Maximal acht Stopps pro Tagesroute.'); break; }
      view.dayQueueIds=[...view.dayQueueIds,value];view.dayQueueRoutes=[];view.dayQueueStatus='';
      view.dayQueueFocus=view.dayQueueIds.length-1;
      view.total=false;view.mapScope='city';
      render({restoreView:true});currentMap?.focusStudioStop(view.dayQueueFocus); break;
    case 'day-route-remove':
      view.dayQueueIds=view.dayQueueIds.filter(id=>id!==value);
      view.dayQueueFocus=Math.min(view.dayQueueFocus,Math.max(0,view.dayQueueIds.length-1));
      view.dayQueueRoutes=[];view.dayQueueStatus='';render({restoreView:true}); break;
    case 'day-route-up':
    case 'day-route-down': {
      const at=view.dayQueueIds.indexOf(value), next=at+(name==='day-route-up'?-1:1);
      if (at>=0 && next>=0 && next<view.dayQueueIds.length) {
        [view.dayQueueIds[at],view.dayQueueIds[next]]=[view.dayQueueIds[next],view.dayQueueIds[at]];
        view.dayQueueRoutes=[];view.dayQueueStatus='';
        render({restoreView:true});
      }
      break;
    }
    case 'day-route-optimize': {
      const items=view.dayQueueIds.map(id=>ctx.all.find(i=>i.id===id));
      view.dayQueueIds=arrangeDayStops(items).map(i=>i.id);
      view.dayQueueFocus=0;
      view.dayQueueRoutes=[];
      view.dayQueueStatus='Luftlinien-Vorsortierung. Vor Zeitübernahme echte Fußwege berechnen.';
      render({restoreView:true});break;
    }
    case 'day-route-check':
      view.dayQueueTime=document.querySelector('#day-route-start')?.value??view.dayQueueTime;
      await fetchDayQueueRoutes(); break;
    case 'day-route-clear':
      view.dayQueueIds=[];view.dayQueueRoutes=[];view.dayQueueStatus='';view.dayQueueFocus=0;
      render({restoreView:true}); break;
    case 'day-route-commit':
      await commitDayQueue(); break;
    case 'day-route-focus':
    case 'day-route-prev':
    case 'day-route-next': {
      const length=view.dayQueueIds.length;
      if(!length)break;
      const destination=name==='day-route-prev' ? view.dayQueueFocus-1
        :name==='day-route-next' ? view.dayQueueFocus+1 : Number(value);
      if(!Number.isInteger(destination))break;
      view.dayQueueFocus=Math.max(0,Math.min(length-1,destination));
      view.mapScope='city';view.total=false;
      render({restoreView:true,fetchRoutes:false});
      currentMap?.focusStudioStop(view.dayQueueFocus);
      break;
    }
    case 'day-route-fit':
      view.mapScope='city';view.total=false;
      render({restoreView:true,fetchRoutes:false});
      currentMap?.focusStudio();
      break;
    case 'day-route-display':
      if(!['all','focus'].includes(value))break;
      view.dayQueueDisplay=value;
      view.mapScope='city';view.total=false;
      render({restoreView:true,fetchRoutes:false});
      if(value==='focus')currentMap?.focusStudioStop(view.dayQueueFocus);
      else currentMap?.focusStudio();
      break;
    case 'explorer-swap': {
      [view.mapFrom,view.mapTo]=[view.mapTo,view.mapFrom];
      view.mapRouteResult=null;
      if(view.mapFrom&&view.mapTo)await calculateExplorerRoute();
      else render({restoreView:true});
      break;
    }
    case 'explorer-zoom-route': {
      const from=ctx.explorer?.connection?.from,to=ctx.explorer?.connection?.to;
      if(from?.point&&to?.point)currentMap?.focusConnection(from.point,to.point);
      else say('Für beide Orte sind belegte Koordinaten notwendig, um die Route zu zoomen.');
      break;
    }
    case 'explorer-clear-route':
      view.mapFrom = view.mapTo = view.mapRouteResult = null;
      render({ restoreView: true }); break;
    case 'map-tone':
      if(!['standard','midnight','sand'].includes(value))break;
      view.mapTone=value;localStorage.setItem('reiseplan-map-tone',value);
      render({restoreView:true,fetchRoutes:false});
      break;
    case 'map-expand':
      view.mapExpanded=!view.mapExpanded;
      render({restoreView:true,fetchRoutes:false});
      break;
    case 'fit': currentMap?.fit(); break;
    case 'filter': view.filters[value] = !view.filters[value]; render({ restoreView: true }); break;
    case 'transit': view.filters.transit[value] = !view.filters.transit[value]; render({ restoreView: true }); break;
    case 'layers': layerForm(ctx); break;
    case 'select': selectPoint(value); break;
    case 'vote-open': {
      if (!item || !['activity','lodging'].includes(item.kind)) break;
      const saved=ctx.state.votes?.[item.id]??{};
      const selectors=ctx.people.map(person=>{
        const options=[[0,'Keine Stimme'],[1,'1 · Nein'],[2,'2 · Eher nicht'],
          [3,'3 · Neutral'],[4,'4 · Gerne'],[5,'5 · Unbedingt']];
        return '<label class="field"><span>'+esc(person.name)+'</span>'
          +'<select name="'+esc(person.id)+'">'
          +options.map(([n,label])=>'<option value="'+n+'"'
            +(saved[person.id]===n?' selected':'')+'>'+esc(label)+'</option>').join('')
          +'</select></label>';
      }).join('');
      openDialog('Gruppenbewertung · '+item.name,
        '<p class="muted">Jede Person hat eine Stimme mit 1–5 Punkten. Ihr tragt sie gemeinsam auf diesem Gerät ein; diese Funktion synchronisiert keine separaten Konten und bewertet nicht die Qualität des Anbieters.</p>'
        +'<form id="modal-form"><div class="form-grid">'+selectors
        +'</div><div class="form-error" aria-live="polite"></div><div class="dialog-foot">'
        +'<button type="button" data-action="close" class="button">Abbrechen</button>'
        +'<button class="button primary" type="submit">Stimmen speichern</button></div></form>',
        async data=>{
          const ballot={};
          for(const person of ctx.people){
            const value=Number(data.get(person.id));
            if(!Number.isInteger(value)||value<0||value>5)
              throw new Error('Erlaubte Bewertung: 0 (offen) oder 1–5.');
            if(value>0)ballot[person.id]=value;
          }
          const votes={...(ctx.state.votes??{})};
          if(Object.keys(ballot).length)votes[item.id]=ballot;else delete votes[item.id];
          await save({...ctx.state,votes},'Gruppenstimmen für diese Reisevariante aktualisiert');
        });
      break;
    }
    case 'commons-photo-search': {
      if(!item)break;
      const prev=ctx.state.placePhotos?.[item.id];
      const count=Array.isArray(prev)?prev.length:prev?1:0;
      if(count>=5){say('Fünf manuelle Galerieplätze sind bereits belegt.');break;}
      await discoverCommonsPhotos(ctx,item);
      break;
    }
    case 'commons-photo-choose': {
      const picked=commonsPhotoPick,position=Number(value);
      if(!picked||picked.variantId!==ctx.trip.id||!Number.isInteger(position)
        ||position<0||position>=picked.results.length)break;
      const selected=ctx.all.find(x=>x.id===picked.itemId);
      if(!selected)break;
      const p=picked.results[position];
      if(p.identityVerified!==false)break;
      const old=ctx.state.placePhotos?.[selected.id]??null;
      const photos=Array.isArray(old)?old:old?[old]:[];
      if(photos.length>=5){say('Maximal fünf Fotos je Ort.');break;}
      if(photos.some(x=>x.sourceUrl===p.sourceUrl)){say('Dieses Foto ist bereits gespeichert.');break;}
      await save({...ctx.state,placePhotos:{...ctx.state.placePhotos,
        [selected.id]:[...photos,{url:p.url,sourceUrl:p.sourceUrl,credit:p.credit,licenseUrl:p.licenseUrl}]}},
        'Ausgewähltes Commons-Foto mit Lizenzquelle in dieser Reisevariante gespeichert');
      commonsPhotoPick=null;
      closeDialog();
      break;
    }
    case 'photo-edit': {
      if (!item) break;
      const previous=ctx.state.placePhotos?.[item.id]??null;
      const photos=Array.isArray(previous)?previous:previous?[previous]:[];
      if(photos.length>=5){say('Maximal fünf eigene Fotos pro Ort. Entferne zuerst ein Bild.');break;}
      const wrap=(label,key,value)=>'<label class="field wide"><span>'+esc(label)+'</span>'
        +'<input name="'+key+'" type="text" value="'+esc(value??'')+'" maxlength="1200" required></label>';
      openDialog('Foto und Bildquelle · '+item.name,
        '<p class="muted">Nur Bilder verwenden, für die eine geeignete Nutzungserlaubnis besteht. Originalfoto oder Wikimedia-Commons-Bild mit korrekter Lizenzangabe und Quelle eintragen. Externe Bilder werden im Browser direkt vom Bildanbieter geladen.</p>'
        +'<form id="modal-form"><div class="form-grid">'
        +wrap('Direkter HTTPS-Bildlink','url','')
        +wrap('Urheber / Namensnennung / Lizenz','credit','')
        +wrap('HTTPS-Link zur Bild-/Lizenzquelle','sourceUrl','')
        +'</div><div class="form-error" aria-live="polite"></div>'
        +'<div class="dialog-foot"><button type="button" class="button" data-action="close">Abbrechen</button>'
        +'<button type="submit" class="button primary">Foto übernehmen</button></div></form>',
        async data=>{
          const photo={url:String(data.get('url')??'').trim(),
            credit:String(data.get('credit')??'').trim(),
            sourceUrl:String(data.get('sourceUrl')??'').trim()};
          if([photo.url,photo.sourceUrl].some(url=>url.length>1200
             || !/^https:\/\/[^\s]+$/i.test(url))
             || !photo.credit || photo.credit.length>180)
            throw new Error('Gültige HTTPS-Links sowie Urheber und Lizenz angeben.');
          const updated=[...photos,photo];
          await save({...ctx.state,placePhotos:{...(ctx.state.placePhotos??{}),[item.id]:updated.length===1?updated[0]:updated}},
            'Quellenfoto zur Galerie dieser Reisevariante hinzugefügt');
        });
      break;
    }
    case 'photo-remove-one': {
      let parsed;
      try{parsed=JSON.parse(value);}catch{break;}
      if(!Array.isArray(parsed)||parsed.length!==2)break;
      const [photoId,index]=parsed, saved=ctx.state.placePhotos?.[photoId];
      const photos=Array.isArray(saved)?saved:saved?[saved]:[];
      if(!ctx.all.some(x=>x.id===photoId)||!Number.isInteger(index)||index<0||index>=photos.length)break;
      const remaining=photos.filter((_,i)=>i!==index);
      const placePhotos={...ctx.state.placePhotos};
      if(remaining.length)placePhotos[photoId]=remaining.length===1?remaining[0]:remaining;
      else delete placePhotos[photoId];
      await save({...ctx.state,placePhotos},'Quellenfoto entfernt');
      closeDialog();
      break;
    }
    case 'photo-remove': {
      if(!item||!ctx.state.placePhotos?.[item.id])break;
      const photos={...ctx.state.placePhotos};delete photos[item.id];
      await save({...ctx.state,placePhotos:photos},'Ortsfoto aus Reisevariante entfernt');break;
    }
    case 'hud-audit': {
      if(!['photo','location','price','source','hours'].includes(value))break;
      const city=ctx.page==='map'&&ctx.total?'all':ctx.city;
      changePage('data');
      const panel=app.querySelector('.entry-coverage');
      if(panel){
        const gap=panel.querySelector('#coverage-filter-gap');
        const citySelect=panel.querySelector('#coverage-filter-city');
        if(gap)gap.value=value;
        if(citySelect)citySelect.value=[...citySelect.options].some(x=>x.value===city)?city:'all';
        applyCoverageFilters(panel);
        panel.scrollIntoView({block:'start',behavior:'auto'});
        panel.querySelector('#coverage-filter-query')?.focus({preventScroll:true});
      }
      break;
    }
    case 'coverage-filter-clear': {
      resetCoverageFilters(app.querySelector('.entry-coverage'));
      break;
    }
    case 'map-motion': {
      if(!['off','on'].includes(value))break;
      view.mapMotion=value==='off'?'off':'auto';
      localStorage.setItem('reiseplan-map-motion',view.mapMotion);
      render({restoreView:true});
      break;
    }
    case 'inspector-tab': {
      const tabId=String(value);
      const tabs=[...document.querySelectorAll('#dialog .inspector-tab')];
      if(!tabs.some(tab=>tab.dataset.value===tabId))break;
      for(const tab of tabs){
        const active=tab.dataset.value===tabId;
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex=active?0:-1;
        const panel=document.getElementById('inspector-panel-'+tab.dataset.value);
        if(panel)panel.hidden=!active;
      }
      document.querySelector('#dialog .dialog-body')?.scrollTo({top:0,behavior:'auto'});
      break;
    }
    case 'inspector-compare-add': {
      if(!item||!['activity','lodging','transport'].includes(item.kind))break;
      const current=view.inspectorCompareIds;
      const first=ctx.all.find(x=>x.id===current[0]);
      if(current.includes(item.id)){
        view.inspectorCompareIds=current.filter(id=>id!==item.id);
      }else if(first&&(first.city!==item.city||first.kind!==item.kind)){
        view.inspectorCompareIds=[item.id];
        say('Neuer Vergleich: Stadt oder Kategorie gewechselt. Die vorherige Auswahl wurde zurückgesetzt.');
      }else if(current.length>=3){
        say('Vergleiche höchstens drei Optionen derselben Stadt und Kategorie.');break;
      }else{
        view.inspectorCompareIds=[...current,item.id];
      }
      itemDetails(ctx,item,view.inspectorCompareIds);
      break;
    }
    case 'inspector-compare-view': {
      if(view.inspectorCompareIds.length<2){
        say('Wähle zunächst zwei oder drei vergleichbare Einträge.');break;
      }
      openDialog('Reiseoptionen vergleichen',inspectorComparisonHtml(ctx,view.inspectorCompareIds));
      break;
    }
    case 'inspector-compare-detail': {
      const selected=ctx.all.find(x=>x.id===value);
      if(selected)itemDetails(ctx,selected,view.inspectorCompareIds);
      break;
    }
    case 'inspector-compare-remove': {
      view.inspectorCompareIds=view.inspectorCompareIds.filter(id=>id!==value);
      if(view.inspectorCompareIds.length>=2){
        openDialog('Reiseoptionen vergleichen',inspectorComparisonHtml(ctx,view.inspectorCompareIds));
      }else{
        const last=ctx.all.find(x=>x.id===view.inspectorCompareIds[0]);
        if(last)itemDetails(ctx,last,view.inspectorCompareIds);
        else closeDialog();
      }
      break;
    }
    case 'inspector-compare-clear': {
      view.inspectorCompareIds=[];
      closeDialog();
      say('Unverbindlichen Ortsvergleich zurückgesetzt.');
      break;
    }
    case 'inspector-neighbor': {
      const target=ctx.all.find(x=>x.id===value)
        ?? ctx.explorer?.placed.find(x=>x.id===value)
        ?? ctx.explorer?.unlocated.find(x=>x.id===value);
      if(target)itemDetails(ctx,target,view.inspectorCompareIds);
      break;
    }
    case 'inspector-map': {
      if(!item)break;
      closeDialog();
      view.page='map';view.mapScope='city';view.city=item.city;
      view.total=false;view.mapGroup='all';view.mapSearch='';
      view.mapSavedOnly=false;view.mapNearPointId=null;view.selected=item.id;
      render({focusMap:Boolean(item.point)});
      break;
    }
    case 'details': if (item) itemDetails(ctx, item, view.inspectorCompareIds); break;
    case 'verify-item': if (item && ['lodging', 'transport'].includes(item.kind)) verificationForm(ctx, item, save); break;
    case 'rail-reminder': {
      const task = catalog.research?.transportQueue?.find(row => row.id === value && row.trip_id === ctx.trip.id);
      if (!task) break;
      const sales = railSalesStatus(task);
      if (!sales.earliestReview) { say('Kein belastbares Orientierungsdatum vorhanden.'); break; }
      simpleField('Bahnverkauf prüfen · nur Orientierung',
        'Wiedervorlage für ' + task.route + ' (kein garantierter Verkaufsbeginn)',
        sales.earliestReview, async date => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))
            || date < '2026-11-12' || date > task.date_local) {
            throw new Error('Wähle ein gültiges Prüfdatum zwischen jetzt und Abreise.');
          }
          const id = 'deadline:rail:' + task.id;
          const deadline = {
            id, title: 'Bahnverbindung prüfen · ' + task.route,
            when: utcFromLocal(date, '09:00', 'Europe/Berlin'),
            zone: 'Europe/Berlin', done: false,
          };
          await save({ ...ctx.state, deadlines: [
            ...ctx.state.deadlines.filter(d => d.id !== id), deadline,
          ] }, 'Lokale Wiedervorlage gespeichert · kein zugesagter Verkaufsstart');
        }, 'date', 'min="2026-11-12" max="' + task.date_local + '" required');
      break;
    }
    case 'option-map':
      if (item) { view.filters.options = true; view.selected = value; view.page = 'map'; view.total = view.wholeDay = false; render({ focusMap: true }); }
      break;
    case 'leg': routeForm(ctx, Number(value), null, save); break;
    case 'scheduled-route': {
      const index = Number(value);
      const segment = ctx.segments[index];
      const city = segment?.from.placeCity ?? ctx.city;
      if (!catalog.transitSchedules?.[city] || !segment?.from.point || !segment.to.point || segment.access) break;
      const from = segment.from;
      const instant = from.kind === 'activity' && from.instant ? from.end ?? Date.parse(from.instant) + (from.duration ?? 0) * 60_000 : from.instant;
      const time = localParts(instant, catalog.transitSchedules[city].zone).time ?? '17:00';
      showTimetable(ctx, { index, key: segment.key, city, date: ctx.date, time, excluded: [], variantId: variant.id, planDate: ctx.date, result: null });
      break;
    }
    case 'transit-reference': {
      const form = document.querySelector('#dialog #modal-form');
      if (form?.elements.serviceDate) { form.elements.serviceDate.value = value; form.requestSubmit(); }
      break;
    }
    case 'transit-preview':
    case 'transit-adopt': {
      const search = timetableSearch;
      const route = search?.result?.routes[Number(value)];
      const segment = ctx.segments.find(s => s.key === search?.key);
      if (!route || !segment || search.variantId !== variant.id || search.planDate !== ctx.date) break;
      if (name === 'transit-adopt') {
        if (search.date !== ctx.date || route.date !== ctx.date) throw new Error('Nur Fahrten am Reisetag lassen sich übernehmen.');
        const next = { ...route, source: search.result.meta.source, line: route.line, date: ctx.date };
        await save({ ...ctx.state, localRoutes: { ...ctx.state.localRoutes, [segment.datedKey]: next } }, 'Fahrplanweg übernommen');
        view.timetablePreview = null;
      } else {
        view.timetablePreview = { route, key: segment.key, planDate: ctx.date, variantId: variant.id };
        view.mobile = 'map';
      }
      closeDialog();
      render();
      break;
    }
    case 'transit-clear': view.timetablePreview = null; render({ restoreView: true }); break;
    case 'calculate': {
      const index = Number(value);
      const s = ctx.segments[index];
      if (!s?.from.point || !s?.to.point || s.access) break;
      routeForm(ctx, index, null, save, 'loading');
      const button = document.querySelector('dialog [data-action=calculate]');
      if (button) button.disabled = true;
      let error = '';
      try {
        const result = await api('/api/walk', 'POST', { points: [s.from.point, s.to.point] });
        walks.set(walkKey(s.from.point, s.to.point), result);
      } catch (e) { error = e.message; }
      const open = document.querySelector('dialog').open;
      render({ restoreView: true, fetchRoutes: false });
      if (open && ctx.date === context.date && ctx.city === context.city) routeForm(context, index, null, save, error);
      break;
    }
    case 'add': editItem(ctx, null, 'activity', save); break;
    case 'add-rail': editItem(ctx, null, 'transport', save); break;
    case 'edit': if (item) editItem(ctx, item, item.kind, save); break;
    case 'choose': if (item) chooseItem(ctx, item, save, (city, date) => {
      view.page = 'plan'; showCity(city, date); view.selected = item.id; render({ focusMap: true });
    }); break;
    case 'remove':
      if (item && !item.locked && !item.booked) { await withEdit(item, { removed: true, selected: false }, 'Aus dem Plan entfernt'); closeDialog(); }
      break;
    case 'clone-item':
      if (item) {
        const { id, externalId, originalName, ...source } = item;
        const clone = { ...source, id: 'manual:' + crypto.randomUUID(), name: source.name + ' (Kopie)', locked: false, booked: false,
          removed: false, selected: false, origin: 'manuell' };
        await save({ ...ctx.state, manual: [...ctx.state.manual, clone] }, 'Kopie angelegt');
        editItem(context, clone, clone.kind, save);
      }
      break;
    case 'favorite': {
      const fav = ctx.state.favorites;
      await save({ ...ctx.state, favorites: fav.includes(value) ? fav.filter(id => id !== value) : [...fav, value] }, 'Merkliste aktualisiert');
      break;
    }
    case 'compare':
      if (view.compareIds.has(value)) view.compareIds.delete(value);
      else if (view.compareIds.size < 4) view.compareIds.add(value);
      else { say('Bis zu vier Optionen gleichzeitig vergleichen.'); break; }
      render({ restoreView: true }); break;
    case 'compare-clear': view.compareIds.clear(); render({ restoreView: true }); break;
    case 'votes-expand': view.showAllVotes=!view.showAllVotes; render({ restoreView: true }); break;
    case 'provider-budget': view.providerOnlyBudget=!view.providerOnlyBudget; render({ restoreView: true }); break;
    case 'option-filter': view.optionFilter = value; render({ restoreView: true }); break;
    case 'optimize': optimize(); break;
    case 'reorder': await reorder(...JSON.parse(value)); closeDialog(); break;
    case 'expense': expenseForm(ctx, ctx.state.expenses.find(e => e.id === value), save); break;
    case 'meal-cost':
      if (item?.mealSlot && ctx.activeSet.has(item.id)) expenseForm(ctx, ctx.state.expenses.find(e => e.forItem === item.id), save, item);
      break;
    case 'grocery-edit': {
      const row = groceryBasket(ctx.active.filter(item => !ctx.state.expenses.some(e => e.forItem === item.id)),
        ctx.people.length, ctx.state.groceryOverrides ?? {}).find(entry => entry.key === value && entry.city === ctx.city);
      if (row) groceryEditForm(ctx, row, save);
      break;
    }
    case 'grocery-reset': {
      const overrides = { ...ctx.state.groceryOverrides };
      if (!Object.hasOwn(overrides, value)) break;
      delete overrides[value];
      await save({ ...ctx.state, groceryOverrides: overrides }, 'Warenkorb-Referenz wiederhergestellt');
      break;
    }
    case 'meal-choose': {
      const option = catalog.mealPlans?.[ctx.city]?.find(plan => plan.id === value);
      if (option) mealForm(ctx, option, save, id => {
        view.page = 'plan';
        view.mobile = 'plan';
        showCity(ctx.city, ctx.date);
        if (context.day.some(entry => entry.id === id)) selectPoint(id, false);
      });
      break;
    }
    case 'expense-remove':
      await save({ ...ctx.state, expenses: ctx.state.expenses.filter(e => e.id !== value) }, 'Ausgabe gelöscht'); closeDialog(); break;
    case 'deadline': deadlineForm(ctx, ctx.state.deadlines.find(d => d.id === value), save); break;
    case 'deadline-remove':
      await save({ ...ctx.state, deadlines: ctx.state.deadlines.filter(d => d.id !== value) }, 'Frist gelöscht'); closeDialog(); break;
    case 'people': editPeople(ctx, save); break;
    case 'pass': editPass(ctx, save); break;
    case 'budget-limit':
      simpleField('Budgetrahmen', 'Maximalbetrag für die Gruppe · EUR', ctx.state.budgetLimit == null ? '' : (ctx.state.budgetLimit / 100).toFixed(2),
        v => save({ ...ctx.state, budgetLimit: minor(v) }, 'Budgetrahmen gespeichert'), 'text', 'inputmode="decimal"'); break;
    case 'rides':
      simpleField('T-casual vergleichen', 'Geplante gültige Fahrten pro Person', ctx.state.pass.rides,
        v => save({ ...ctx.state, pass: { ...ctx.state.pass, rides: Number(v) } }, 'Fahrten gespeichert'), 'number', 'min="0" max="100" required'); break;
    case 'mobility': {
      const fare = transitFares[ctx.city];
      if (!fare) break;
      simpleField(fare.passName + ' vergleichen', 'Benötigte Einzeltickets je Person im Gültigkeitsfenster',
        ctx.state.mobility?.[ctx.city] ?? 0, v => save({ ...ctx.state,
          mobility: { ...ctx.state.mobility, [ctx.city]: Number(v) } }, 'Vergleich gespeichert'),
        'number', 'min="0" max="100" required');
      break;
    }
    case 'copy':
      simpleField('Variante duplizieren', 'Name', (ctx.state.title ?? ctx.trip.title).slice(0, 145) + ' – Kopie', async title => {
        const result = await api(variantUrl() + '/copy', 'POST', { title });
        catalog = await api('/api/bootstrap');
        await switchVariant(result.id);
        say('Variante dupliziert');
      }); break;
    case 'export':
      download('reiseplan-sicherung.json', JSON.stringify({ trip: ctx.trip, state: ctx.state, imported: variant.imported, sources: catalog.sources }, null, 2), 'application/json'); break;
    case 'ics': exportCalendar(); break;
    case 'undo':
      if (undo?.id === variant.id) {
        const previous = undo.state;
        await save(previous, 'Änderung rückgängig gemacht', false);
        undo = null;
      } else say('Für diese Variante liegt keine rückgängig machbare Änderung vor.');
      break;
    case 'close': closeDialog(); break;
  }
}

document.addEventListener('keydown', event => {
  if (!guideStep(view.guideIndex)) return;
  if (event.key === 'Escape') { event.preventDefault(); closeGuide(); return; }
  if (event.key !== 'Tab') return;
  const dialog = app.querySelector('.guide-panel');
  const controls = [...(dialog?.querySelectorAll('button:not([disabled])') ?? [])];
  if (!controls.length) return;
  if (event.shiftKey && document.activeElement === controls[0]) {
    event.preventDefault(); controls.at(-1).focus();
  } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
    event.preventDefault(); controls[0].focus();
  }
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button) void action(button.dataset.action, button.dataset.value).catch(error => say(error.message));
});
// Two-way visual focus, without re-rendering Leaflet or changing the selected
// POI, bookings or map viewport. Clustered markers may not have DOM elements.
const hoverAtlasCard=(event,on)=>{
  const card=event.target?.closest?.('.explorer-place[data-place-id]');
  if(!card||card.contains(event.relatedTarget))return;
  card.classList.toggle('atlas-hover',on);
  currentMap?.markers.get(card.dataset.placeId)?.getElement()?.classList.toggle('atlas-hover',on);
};
app.addEventListener('pointerover',event=>hoverAtlasCard(event,true));
app.addEventListener('pointerout',event=>hoverAtlasCard(event,false));
app.addEventListener('toggle',event=>{
  if(event.target.matches('.sidebar-places'))view.cityNavOpen=event.target.open;
  if(event.target.matches('.map-design-details'))view.mapDesignOpen=event.target.open;
  if(event.target.matches('.explorer-view-advanced'))view.mapAdvancedOpen=event.target.open;
  if(event.target.matches('.explorer-day-notes'))view.mapDayNotesOpen=event.target.open;
},true);
// Commons and explicitly sourced photos can fail when offline or blocked.
 // Keep a designed category fallback, not broken alt-text inside a photo tile.
app.addEventListener('error',event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement))return;
  const frame=image.closest('.destination-cover,.place-thumbnail,.place-photo,.reference-intro-photo,.reference-discovery-image,.reference-hero-thumb');
  if(!frame||image.dataset.fallbackApplied)return;
  image.dataset.fallbackApplied='true';
  image.style.display='none';
  frame.dataset.imageUnavailable='true';
  if(frame.matches('.reference-intro-photo,.reference-discovery-image')){
    const label=document.createElement('span');
    label.className='reference-photo-fallback';
    label.textContent='Bild gerade nicht verfügbar';
    frame.append(label);
  }
  if(frame.classList.contains('place-photo')&&!frame.querySelector('.place-photo-unavailable')){
    const label=document.createElement('span');
    label.className='place-photo-unavailable';
    label.textContent='Bild gerade nicht verfügbar · Bildquelle in den Details';
    frame.append(label);
  }
},true);
document.addEventListener('keydown',event=>{
  const tab=event.target.closest?.('#dialog .inspector-tab');
  if(tab&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
    event.preventDefault();
    const list=[...document.querySelectorAll('#dialog .inspector-tab')];
    const index=list.indexOf(tab);
    const next=event.key==='Home'?0:event.key==='End'?list.length-1:
      (index+(event.key==='ArrowRight'?1:-1)+list.length)%list.length;
    if(list[next]){
      void action('inspector-tab',list[next].dataset.value).then(()=>list[next].focus());
    }
    return;
  }
  if(event.target.id==='reference-top-search'&&event.key==='Enter'){
    event.preventDefault();
    view.mapSearch=event.target.value.trim().slice(0,100);
    view.mapListLimit=60;
    render({restoreView:true,fetchRoutes:false});
    return;
  }
  if(event.target.id==='map-search'&&event.key==='Enter'){
    event.preventDefault();
    void action('explorer-search').catch(error=>say(error.message));
  }
});
app.addEventListener('input',event=>{
  if(event.target.id==='coverage-filter-query'){
    applyCoverageFilters(app.querySelector('.entry-coverage'));
  }
});
app.addEventListener('change', event => {
  if(['coverage-filter-query','coverage-filter-kind','coverage-filter-gap',
    'coverage-filter-city'].includes(event.target.id)){
    applyCoverageFilters(app.querySelector('.entry-coverage'));
  }
  if (event.target.id === 'variant') void switchVariant(event.target.value).catch(error => say(error.message));
  if (event.target.id === 'sort') { view.sort = event.target.value; render({ restoreView: true }); }
  if (event.target.id==='provider-quote-sort' && ['price','rating','name'].includes(event.target.value)) {
    view.providerSort=event.target.value; render({ restoreView:true });
  }
  if (event.target.id === 'daily-budget-date') {
    if (context.dates.includes(event.target.value)) {
      view.dailyBudgetDate=event.target.value; render({ restoreView: true });
    }
  }
  if (event.target.dataset.budgetAssumption) {
    const field=event.target.dataset.budgetAssumption;
    const number=Number(event.target.value);
    if (Object.hasOwn(dailyBudgetDefaults,field)&&Number.isFinite(number)
      &&number>=(field==='target'?5:0)&&number<=1000) {
      view.dailyBudgetInputs={...view.dailyBudgetInputs,[field]:number};
      render({ restoreView: true });
    }
  }
  if (event.target.id === 'nightly-target') { const v=Number(event.target.value); if(Number.isFinite(v)&&v>=5&&v<=1000){view.nightlyTargetEuro=v;localStorage.setItem('reiseplan-nightly-target',String(v));render({restoreView:true});} }
  if (event.target.id === 'map-search' || event.target.id === 'reference-top-search') {
    view.mapSearch = event.target.value.trim().slice(0,100);
    view.mapListLimit = 60;
    render({restoreView:true,fetchRoutes:false});
  }
  if (event.target.id === 'explorer-time') { view.mapRouteTime = event.target.value; view.mapRouteResult = null; render({ restoreView: true }); }
  if (event.target.id === 'day-route-start') { view.dayQueueTime=event.target.value; view.dayQueueRoutes=[]; render({restoreView:true}); }
  if (event.target.id === 'meal-date' && context.dates.includes(event.target.value)) showCity(context.city, event.target.value);
});
app.addEventListener('submit', async event => {
  if (event.target.id !== 'import-form') return;
  event.preventDefault();
  const file = new FormData(event.target).get('file');
  const button = event.target.querySelector('button[type=submit]');
  const error = event.target.querySelector('.form-error');
  error.textContent = '';
  if (!file?.size || file.size > 1_000_000) { error.textContent = 'Bitte wähle eine Datei bis 1 MB.'; return; }
  button.disabled = true;
  try {
    const result = await api(variantUrl() + '/import', 'POST', { filename: file.name, content: await file.text() });
    variant = await api(variantUrl());
    catalog.variants.find(v => v.id === variant.id).imported = variant.imported;
    say(result.inserted + ' neu · ' + result.existing + ' vorhanden · ' + result.conflicts + ' Konflikte');
    render();
  } catch (e) { error.textContent = e.message; button.disabled = false; }
});
app.addEventListener('dragstart', event => {
  const target = event.target.closest('[draggable=true]');
  if (!target) return;
  dragged = target.dataset.eventId;
  event.dataTransfer.setData('text/plain', dragged);
  event.dataTransfer.effectAllowed = 'move';
});
app.addEventListener('dragover', event => {
  if (dragged && event.target.closest('[draggable=true]')) event.preventDefault();
});
app.addEventListener('drop', event => {
  const target = event.target.closest('[draggable=true]');
  if (!dragged || !target) return;
  event.preventDefault();
  const to = target.dataset.eventId;
  if (to !== dragged) void reorder(dragged, to).catch(error => say(error.message));
  dragged = null;
});
app.addEventListener('dragend', () => { dragged = null; });
matchMedia('(max-width:910px)').addEventListener('change', () => render());

try {
  catalog = await api('/api/bootstrap');
  const preferred = query.get('variant') ?? localStorage.getItem('reiseplan-variant');
  await switchVariant(catalog.variants.find(v => v.id === preferred)?.id ?? catalog.variants[0].id);
} catch (error) {
  app.innerHTML = '<main class="workspace">' + empty('Reiseplaner konnte nicht starten', error.message) + '</main>';
}
