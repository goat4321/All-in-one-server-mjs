import { dailyBudgetDefaults } from './daily-budget.mjs';
import {publicGeocodeLookupAllowed,publicGeocodeLookupBlockedReason} from './public-geocode-eligibility.mjs';
import { GUIDE_STEPS, guideStep } from './tutorial.mjs';
import {createMotionController} from './motion-ux.mjs';
import {mountJourneyStoryV121} from './journey-story-v121.mjs';
import {immersiveSceneV123,immersiveHtmlV123,previewDayTargetsV124,upcomingPhotoV124,formatPreviewTimeV124,previewStopTargetV124} from './immersive-route-v123.mjs';
import {routePreviewHtmlV122,routePreviewDayV122} from './route-preview-v122.mjs';
import {explorerMediaHtmlV125,explorerFallbackV125,upcomingActivityPhotoV125,syncExplorerMarkersV125,clearExplorerMarkersV125} from './route-explorer-v125.mjs';
import {dayPlanDraftEdits,timelineReorderV105} from './day-plans-logic.mjs';
import {journeyModelV110,dayMoveOptionsV110} from './day-journey-v110.mjs';
import {dayTimelineV126,dayPositionV126,dayStopTimeV126,daySceneHtmlV126} from './day-route-player-v126.mjs';
import {readPreparationV102,togglePreparationV102,preparationTextV102} from './day-preparation-v102.mjs';
import {quickDayEdit} from './day-quick-edits-v50.mjs';
import { activeItems, alpineAccess, calculateBudget, dateRange, dayEntries, groceryBasket, localParts, minor, priceForParty, utcFromLocal } from './model.mjs';
import {mountPhotoLibraryV114} from './photo-library-v114.mjs';
import { renderShell, mapDetail, mapSelectionPreview } from './views.mjs';
import { TripMap } from './map.mjs';
import {explorerCategory} from './map-explorer.mjs';
import { transitFares } from './transit.mjs';
import { railSalesStatus } from './verification.mjs';
import { explorerData, explorerRouteInput, validPoint, mapPointInBounds } from './map-explorer.mjs';
import { explorerList } from './explorer-ui.mjs';
import { readMapBookmarks, toggleMapBookmark } from './map-shortlist.mjs';
import { inspectorComparisonHtml } from './inspector-comparison.mjs';
import { applyCoverageFilters,resetCoverageFilters } from './coverage-filter.mjs';
import {buildFieldAudit,fieldAuditAsCsv} from './field-audit-export-v39.mjs';
import {commonsDefaultQuery,commonsSearchUrl,commonsWebSearchUrl,commonsResults} from './commons-photo-search.mjs';
import { googleMapsDirectionsUrl } from './google-maps.mjs';
import { arrangeDayStops, dayRouteSelection } from './day-route.mjs';
import {footpathMatchesStops} from './route-studio.mjs';
import {createDayRouteGate,queueFocusIndex} from './day-route-request.mjs';
import { btn, empty, esc, icon, urlLink } from './ui.mjs';
import {hikingPreview,hikingMapPreview} from './hiking.mjs';
import {mealAccommodation,mealSlotLabels} from './meal-planner.mjs';
import {renderDataSection,renderCoverageReasons} from './data-page.mjs';
import {shoppingStopForm,mapPinForm,marketQuoteForm} from './forms.mjs';
import { chooseItem, closeDialog, deadlineForm, editItem, editPass, editPeople, expenseForm, itemDetails, layerForm, groceryEditForm, groceryExtraForm, mealForm, openDialog, routeForm, simpleField, timetableForm, verificationForm } from './forms.mjs';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const motion = createMotionController(document);
let unmountJourneyStory;
let catalog, variant, currentMap, context, toastTimer, undo, revisionToken = 0, dragged, timetableSearch;
let saving = false, loading = false;
let commonsPhotoPick = null;
let browseSearchTimer=null;
const supermarketByCity=new Map();
const marketRequests=new Map();
const query = new URLSearchParams(location.search);
const view = {
  page: 'overview', date: null, city: null, wholeDay: null, total: false, selected: null, mobile: 'plan', menu: false, timetablePreview: null,
  theme: localStorage.getItem('reiseplan-theme') ?? 'light',
  filters: { walk: true, options: false, hotels: true, stations: true, activities: true, hiking: false, transit: {} },
  optionFilter: 'all', sort: 'source', compareIds: new Set(), inspectorCompareIds: [],
  stayFacets:{},stayFacetsOpen:false,staySwissResearchOpen:false,
  mapScope: 'city', mapGroup: 'all', mapSearch: '', mapListLimit: 60,
  mapShowCityReferences: localStorage.getItem('reiseplan-map-city-references')==='on',
  mapUnlocatedOpen:false,mapUnlocatedFilter:'all',mapUnlocatedSearch:'',mapUnlocatedLimit:12,
  mapEvidenceOpen:false,mapEvidenceType:'all',mapEvidenceSearch:'',mapEvidenceLimit:10,
  mapSimple:localStorage.getItem('reiseplan-map-simple')!=='off',
  mapListOpen:true,
  mapDensity:localStorage.getItem('reiseplan-map-density')==='detail'?'detail':'calm',
  mapMarketsShown:false,mapMarketsLoading:false,mapMarketsError:null,
  browseScope:'city',browseSearch:'',browseFoodType:'all',browseLimit:24,stayBrowseLimit:8,
  activityCategory:'all',activitySavedOnly:false,activityOrder:'source',activityEvidenceFilter:'all',
  browseFoodSavedOnly:false,browseMarketLoadingCity:null,browseMarketError:null,
  browseFilterOpen:false,browseResearchOpen:false,browseMealsOpen:false,browseFoodResearchOpen:false,
  dayJourneyMode:null,dayPlanOpen:false,dayPlanFocus:'all',hikePreviewId:null,mealSlot:'dinner',dataOpenSections:[],mapPinPicking:false,mapPinDraft:null,mapPinEditingId:null,mapPinsOpen:false,
  mapMotion: localStorage.getItem('reiseplan-map-motion')==='off'?'off':'auto',
  cityNavOpen:true,
  mapNearPointId: null, mapNearRadiusKm: 3,
  mapViewportOnly:false,mapViewportBounds:null,mapCompact:true,mapSavedOnly:false,
  mapFrom: null, mapTo: null, mapRouteMode: 'walk', mapRouteTime: '10:00', mapRouteResult: null,
  dayQueueIds: [], dayQueueRoutes: [], dayQueueTime: '09:00', dayQueueStatus: '',
  dayQueueFocus: 0, dayQueueDisplay: 'all',dayQueueLoading:false,
  nightlyTargetEuro: Math.max(5,Math.min(1000,Number(localStorage.getItem('reiseplan-nightly-target')??35)||35)),
  mapTone: ['standard','midnight','sand'].includes(localStorage.getItem('reiseplan-map-tone'))
    ? localStorage.getItem('reiseplan-map-tone') : 'standard',
  mapExpanded: false,
  mapFullscreen: false,mapFullscreenDrawer:false,routeImmersive:false,
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
const dayRouteGate=createDayRouteGate();
let dayRouteRequest=null;
function invalidateDayRoute(){
  dayRouteGate.invalidate();
  if(view.dayQueueLoading){view.dayQueueLoading=false;view.dayQueueStatus='Route geändert. Bitte Fußwege erneut berechnen.';}
}
function revealDayRouteFocus(){
  const track=app.querySelector('.route-studio-track');
  const focusedStop=track?.querySelector('.route-studio-stop[aria-pressed=true]');
  if(!focusedStop||!track.clientWidth)return;
  const item=focusedStop.getBoundingClientRect(),bounds=track.getBoundingClientRect();
  if(item.left<bounds.left)track.scrollLeft-=bounds.left-item.left;
  else if(item.right>bounds.right)track.scrollLeft+=item.right-bounds.right;
}
function openMapPin(item=null,seed={}){
  const wasPicking=view.mapPinPicking;
  view.mapPinPicking=false;
  if(wasPicking)render({restoreView:true,fetchRoutes:false});
  mapPinForm(context,item,save,pin=>{
    view.page='map';view.mobile='map';view.mapScope='city';view.total=false;view.mapGroup='all';
    view.mapSearch='';view.mapSavedOnly=false;view.mapViewportOnly=false;view.mapNearPointId=null;
    view.mapPinDraft=null;view.mapPinEditingId=null;
    view.mapPinsOpen=true;
    if(context.city!==pin.city)showCity(pin.city);
    view.city=pin.city;view.selected=pin.id;render({focusMap:true,fetchRoutes:false});
  },seed);
}
const optionPages = ['lodging', 'discover', 'activities'];

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
    const place=mealAccommodation({active,date,city:item.city},item.mealSlot??'dinner',localParts(item.start,item.zone).time,item.duration??0);
    const kitchen = place.hotel;
    return { ...item, point: kitchen?.point ?? null, address: kitchen?.address,
      kitchenReady: place.kitchenReady };
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
  // The map shortlist and itinerary favorites are two historical stores.
  // Read them as one selection, while leaving their original persistence intact.
  const savedIds = new Set([
    ...readMapBookmarks(localStorage,variant.id),
    ...(state.favorites??[]),
  ]);
  const marketData=view.mapMarketsShown
    ?(view.mapScope==='trip'
      ?[...supermarketByCity.values()].flatMap(data=>data.items??[])
      :supermarketByCity.get(city)?.items??[]):[];
  const loadedMarketCities=[...new Set(trip.route)].filter(id=>supermarketByCity.has(id));
  const marketItems=loadedMarketCities.filter(id=>view.browseScope==='trip'||id===city)
    .flatMap(id=>supermarketByCity.get(id)?.items??[]);
  const foodMarketCoverage={
    cityLoaded:supermarketByCity.has(city),
    loadedCities:loadedMarketCities.length,
    totalCities:new Set(trip.route).size,
    count:supermarketByCity.get(city)?.count??0,
    checkedOn:supermarketByCity.get(city)?.checkedOn??null,
    loading:view.browseMarketLoadingCity===city,
    error:view.browseMarketError,
  };
  const explorer = view.page === 'map' ? {
    ...explorerData([...all,...marketData], trip, {
      city: view.mapScope === 'city' ? city : null,
      dayItemIds: view.mapScope === 'day' ? new Set(day.map(item=>item.id)) : null,
      group: view.mapGroup, search: view.mapSearch,
      nearbyPoint: nearbyAnchor?.point??null, radiusKm:view.mapNearRadiusKm,
      savedOnly:view.mapSavedOnly,savedIds,
    }),
    scope: view.mapScope, group: view.mapGroup, search: view.mapSearch,
    marketCount:marketData.length,marketsLoading:view.mapMarketsLoading,
    marketsError:view.mapMarketsError,marketsShown:view.mapMarketsShown,
    marketsNote:supermarketByCity.get(city)?.note??null,
    viewportOnly:view.mapViewportOnly,viewportBounds:view.mapViewportBounds,compact:view.mapCompact,
    saved:savedIds,savedOnly:view.mapSavedOnly,
    nearby:nearbyAnchor?{id:nearbyAnchor.id,name:nearbyAnchor.name,
      point:nearbyAnchor.point,radiusKm:view.mapNearRadiusKm}:null,
    showCityReferences: view.mapShowCityReferences,
    density:view.mapDensity,
    // The calm map starts with 12 list cards rather than mounting 60 dense,
    // secondary-control-heavy rows before anyone asks for the full directory.
    // All placed/unlocated data and map pins remain available without truncation.
    limit: view.mapSimple && view.mapListLimit===60 ? 12 : view.mapListLimit,
    routeMode: view.mapRouteMode, routeTime: view.mapRouteTime,
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
  const result={
    ...view, catalog, variant, variants: catalog.variants, trip, cities: catalog.cities, state, people, all, active, activeSet,
    budget: calculateBudget(active, state), day, fullDay, dates, date, city, cityForDay, dayCities, wholeDay, dayTravel, detail, hotelWalks, station,
    dayPlan:trip.dayPlansV32?.find(row=>row.date===date)??null,
    preparationDone:readPreparationV102(localStorage,trip.id,date),
    mealHotel, foodPlaces, foodWalks, explorer, marketItems,foodMarketCoverage,
    browseSavedIds:savedIds,
    dayRoute: { items: view.dayQueueIds.map(id => all.find(x => x.id === id)).filter(Boolean),
      routes: view.dayQueueRoutes, time: view.dayQueueTime, status: view.dayQueueStatus,
      focusIndex: view.dayQueueFocus, displayMode: view.dayQueueDisplay },
    stops: stops.filter((item, i) => stops.indexOf(item) === i), segments, routes, conflictRoutes, saving, timetablePreview,
    options: all.filter(i => i.city === city && !activeSet.has(i.id) && !i.duplicateOf && !i.removed),
  };
  result.dayJourney=view.page==='plan'&&!view.total&&view.dayJourneyMode?journeyModelV110(result,view.dayJourneyMode,(a,b)=>walks.get(walkKey(a.point,b.point))):null;
  return result;
}


let day110Timer=null,day110Index=-1,day110Request=0;
let day126Time=0,day126Model=null,day126Timeline=null,day126SceneKey='',day126LastFrame=null;
function timelineDay126(){const m=context?.dayJourney;if(day126Model!==m){day126Model=m;day126Timeline=dayTimelineV126(m);day126SceneKey='';}return day126Timeline;}
function updateDay126Clock(time){const timeline=timelineDay126(),range=app.querySelector('#day126-time'),clock=app.querySelector('#day126-clock');day126Time=Math.max(0,Math.min(timeline.duration,time));if(range)range.value=String(day126Time);const label=Math.floor(day126Time/1000)+' / '+Math.ceil(timeline.duration/1000)+' s';if(clock&&clock.textContent!==label)clock.textContent=label;const progress=app.querySelector('.day110-track');const pct=Math.round(timeline.duration?day126Time/timeline.duration*100:0);if(progress&&progress.getAttribute('aria-valuenow')!==String(pct)){progress.setAttribute('aria-valuenow',String(pct));progress.querySelector('i').style.width=pct+'%';}}
function updateDay126Scene(index){const panel=app.querySelector('#day126-scene');if(!panel)return;const key=day110Key()+'|'+index;if(day126SceneKey===key&&panel.hasChildNodes())return;day126SceneKey=key;panel.innerHTML=daySceneHtmlV126(context,context.dayJourney,index);}
function day110Key(){return context?.dayJourney?[variant.id,context.date,context.dayJourney.mode].join('|'):null;}
function pauseDay110(announce=true){
 if(day110Timer!=null)cancelAnimationFrame(day110Timer);
 day110Timer=null;day126LastFrame=null;
 currentMap?.stopDayJourneyMotion?.();
 const status=app.querySelector('.day110-status');
 if(announce&&status)status.textContent='Vorschau pausiert · kein Live-Standort';
}
function focusDay110(index,animate=true,{keepClock=false}={}){
 const m=context?.dayJourney;
 if(!m||!Number.isInteger(index)||index<0||index>=m.stops.length)return false;
 day110Index=index;
 const stop=m.stops[index],leg=m.legs[index-1];
 if(!keepClock)updateDay126Clock(dayStopTimeV126(timelineDay126(),index)??0);
 updateDay126Scene(index);
 currentMap?.focusDayJourney(index,{animate:false});
 const panel=app.querySelector('.day110-player');
 if(!panel)return true;
 panel.querySelectorAll('.day110-stop').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.value)===index)));
 const active=panel.querySelector('.day110-stop[aria-pressed=true]');
 const rail=panel.querySelector('.day110-stops');
 if(active&&rail){
  const a=active.getBoundingClientRect(),r=rail.getBoundingClientRect();
  if(a.left<r.left)rail.scrollLeft-=r.left-a.left;
  else if(a.right>r.right)rail.scrollLeft+=a.right-r.right;
 }
 const status=panel.querySelector('.day110-status');
 if(status)status.textContent='Stopp '+(index+1)+' / '+m.stops.length+' · '+stop.name
  +(stop.point?'':' · ohne belegten Pin')+(leg?.type==='routed'?' · Fußweg '+leg.minutes+' Min.':leg?.type==='transfer'?' · Transfer schematisch':leg?.type==='schematic'||leg?.type==='connection'?' · Luftlinie':leg?.type==='gap'?' · Weg offen':'');
 const progress=panel.querySelector('.day110-track');
 const pct=Math.round(timelineDay126().duration?day126Time/timelineDay126().duration*100:0);
 if(progress){progress.setAttribute('aria-valuenow',String(pct));progress.querySelector('i').style.width=pct+'%';}
 return true;
}
function seekDay126(time){
 const timeline=timelineDay126(),pos=dayPositionV126(timeline,time);if(!pos)return;
 const prior=pos.kind==='stop'?pos.index:Math.max(0,pos.index-1);
 if(day110Index!==prior)focusDay110(prior,false,{keepClock:true});
 updateDay126Clock(pos.time);
 currentMap?.seekDayJourneyV126(pos);
 const status=app.querySelector('.day110-status');
 if(status&&pos.kind!=='stop'){
  const from=context.dayJourney.stops[pos.index-1]?.name,to=context.dayJourney.stops[pos.index]?.name;
  const label=(pos.kind==='walk'?'Berechneter Fußweg · '+pos.leg.minutes+' Min.':pos.kind==='transfer'?'Transfer · Fahrplan offen':pos.kind==='same'?'Gleicher Ort':'Verbindung offen')+' · '+from+' → '+to;
  if(status.textContent!==label)status.textContent=label;
 }else if(status&&pos.kind==='stop'&&!status.textContent.startsWith('Stopp '+(pos.index+1)+' /')){
  const stop=context.dayJourney.stops[pos.index];status.textContent='Stopp '+(pos.index+1)+' / '+context.dayJourney.stops.length+' · '+stop.name;
 }
}
function playDay110(){
 const m=context?.dayJourney,key=day110Key();if(!key||!m?.stops.length)return;
 const timeline=timelineDay126(),time=day126Time;
 pauseDay110(false);
 if(day110Index<0||time>=timeline.duration||day110Index===m.stops.length-1){focusDay110(0,false);}
 else seekDay126(time);
 if(!motion.enabled()){focusDay110(m.stops.length-1,false);updateDay126Clock(timeline.duration);return;}
 let elapsed=day126Time;day126LastFrame=null;
 const tick=now=>{
  day110Timer=null;
  if(day110Key()!==key||context?.dayJourney!==m){pauseDay110(false);return;}
  if(day126LastFrame===null)day126LastFrame=now;
  elapsed+=Math.max(0,Math.min(100,now-day126LastFrame));day126LastFrame=now;
  seekDay126(elapsed);
  if(elapsed<timeline.duration)day110Timer=requestAnimationFrame(tick);else day126LastFrame=null;
 };
 day110Timer=requestAnimationFrame(tick);
}
async function checkDay110Routes(){
 const m=context?.dayJourney,key=day110Key();
 if(!key)return;
 const request=++day110Request;
 pauseDay110(false);
 const status=app.querySelector('.day110-status');
 const legs=m.legs.filter(l=>l.type==='schematic').slice(0,8);
 if(!legs.length)return;
 if(status)status.textContent='Fußwege werden geprüft …';
 const button=app.querySelector('[data-action=day110-route]');if(button)button.disabled=true;
 let found=0;
 for(const leg of legs){
  if(request!==day110Request||key!==day110Key())return;
  const a=m.stops[leg.from],b=m.stops[leg.to];
  try{
   const route=await api('/api/walk','POST',{points:[a.point,b.point]});
   if(footpathMatchesStops(a,b,route)){walks.set(walkKey(a.point,b.point),route);found++;}
  }catch{}
 }
 if(request!==day110Request||key!==day110Key())return;
 render({restoreView:true,fetchRoutes:false});
 const next=app.querySelector('.day110-status');
 if(next)next.textContent=found+' von '+legs.length+' angefragten Fußwegen berechnet. Übrige Verbindungen bleiben schematisch.';
}
function openDay110(mode){
 if(view.page!=='plan'||!context?.dayPlan)return;
 day110Request++;day110Index=-1;day126Time=0;day126SceneKey='';
 view.dayJourneyMode=mode==='saved'?'saved':'draft';view.mobile='map';
 render({fetchRoutes:false});
 app.querySelector('.day110-player')?.scrollIntoView({block:'start',behavior:'instant'});
}

// Only one upcoming photo is requested at a time; no catalogue-wide prefetch.
const route124Preloaded=new Map();
let route124PendingPhoto=null;
let route125ManualCamera=false;
function clearRoutePreloadV124(){if(route124PendingPhoto){route124PendingPhoto.onload=route124PendingPhoto.onerror=null;route124PendingPhoto.removeAttribute('src');route124PendingPhoto=null;}route124Preloaded.clear();}
function preloadRoutePhotoV124(url){
 const connection=navigator.connection;
 if(!url||route124Preloaded.has(url)||connection?.saveData||/^(slow-2g|2g)$/.test(connection?.effectiveType??''))return;
 if(route124PendingPhoto){route124PendingPhoto.onload=route124PendingPhoto.onerror=null;route124Preloaded.delete(route124PendingPhoto.getAttribute('src'));route124PendingPhoto.removeAttribute('src');}
 const img=new Image();route124PendingPhoto=img;
 img.onload=()=>{if(route124PendingPhoto===img)route124PendingPhoto=null;};img.onerror=()=>{if(route124PendingPhoto===img)route124PendingPhoto=null;route124Preloaded.delete(url);};img.referrerPolicy='no-referrer';img.decoding='async';img.fetchPriority='low';
 route124Preloaded.set(url,img);if(route124Preloaded.size>6)route124Preloaded.delete(route124Preloaded.keys().next().value);
 img.src=url;
}
function updateRouteStoryUi(state){
  const status=state?.status??'idle',visible=status!=='idle';
  document.body.classList.toggle('route-story-active',view.page==='map'&&visible);
  const panel=app.querySelector('#route-story-player');
  if(!panel)return;
  const previousStatus=panel.dataset.status;
  panel.hidden=!visible;panel.dataset.status=status;
  if(view.routeImmersive&&status==='paused'&&previousStatus==='playing')currentMap?.map.stop();
  if(!visible){clearExplorerMarkersV125(currentMap?.map);panel.dataset.previewKey='';panel.dataset.immersiveKey='';panel.dataset.immersiveContent='';panel.dataset.cameraKey='';clearRoutePreloadV124();return;}
  const immersive=panel.querySelector('#route123-preview');
  if(immersive){immersive.hidden=!view.routeImmersive;
   if(view.routeImmersive){
    const scene=immersiveSceneV123(context,state);
    const range=panel.querySelector('#route124-time'),clock=panel.querySelector('#route124-clock'),picker=panel.querySelector('#route124-day');
    if(range&&range.dataset.dragging!=='true'){const max=String(Math.max(1,Math.ceil(state.previewDuration??0))),value=String(Math.round(state.previewTime??0)),label=formatPreviewTimeV124(state.previewTime)+' / '+formatPreviewTimeV124(state.previewDuration);if(range.max!==max)range.max=max;if(range.value!==value)range.value=value;if(clock&&clock.textContent!==label){clock.textContent=label;range.setAttribute('aria-valuetext',label+' Vorschauzeit');}}
    const pickerKey=context.variant.id+'|'+state.index;
    if(picker&&picker.dataset.key!==pickerKey){const targets=previewDayTargetsV124(context,state);picker.replaceChildren(new Option('Reisetag auswählen',''));for(const d of targets)picker.add(new Option(d.date+' · '+(context.cities[d.city]?.name??d.city),d.date));picker.disabled=!targets.length;picker.dataset.key=pickerKey;}
    if(picker&&picker.value!==(scene.day?.date??''))picker.value=scene.day?.date??'';
    if(panel.dataset.immersiveKey!==scene.key){
     panel.dataset.immersiveKey=scene.key;
     if(panel.dataset.immersiveContent!==scene.contentKey){immersive.innerHTML=immersiveHtmlV123(context,state,scene);panel.dataset.immersiveContent=scene.contentKey;}
     else {
      const hero=immersive.querySelector('.route123-hero');
      if(hero)hero.innerHTML=explorerMediaHtmlV125(context,scene,explorerFallbackV125(context,state,scene));
      immersive.querySelectorAll('.route123-timeline li').forEach((row,index)=>{if(index===scene.index)row.setAttribute('aria-current','step');else row.removeAttribute('aria-current');row.querySelector('.route124-stop-seek')?.setAttribute('aria-pressed',String(index===scene.index));});
     }
     const root=immersive.querySelector('.route123-scene');if(root)root.dataset.route123Key=scene.key;
     preloadRoutePhotoV124(upcomingActivityPhotoV125(context,scene)??upcomingPhotoV124(context,state,scene));
     syncExplorerMarkersV125(currentMap?.map,window.L,context,scene,state,index=>{void action('route124-stop',String(index)).catch(error=>say(error.message));});
     const map=currentMap?.map,point=context.cities[state.cityId]?.point;
     const next=context.cities[state.routeOverview?.[state.index+1]?.id]?.point;
     const animate=motion.enabled()&&(state.status==='playing'||route125ManualCamera);
     if(map&&point){
      const target=scene.stop?.point??point,zoom=scene.stop?.point?13:10;
      const cameraKey=state.phase==='travel'&&next?'leg:'+point.join(',')+'>'+next.join(','):target.join(',')+'|'+zoom;
      if(panel.dataset.cameraKey!==cameraKey||status==='paused'){
       panel.dataset.cameraKey=cameraKey;map.stop();
       if(state.phase==='travel'&&next){const options={padding:[54,54],maxZoom:9,animate,duration:.55};if(animate&&map.flyToBounds)map.flyToBounds([point,next],options);else map.fitBounds([point,next],options);}
       else if(animate&&map.getZoom()===zoom)map.panTo(target,{animate:true,duration:.45,easeLinearity:.35});
       else if(animate&&map.flyTo)map.flyTo(target,zoom,{duration:.65});else map.setView(target,zoom,{animate:false});
      }
     }
    }
   }
  }
  const preview=panel.querySelector('#route122-preview');
  const previewKey=[state.index,state.cityId,state.phase,routePreviewDayV122(context,state)?.date].join('|');
  if(preview&&!view.routeImmersive&&panel.dataset.photoExpanded==='true'&&panel.dataset.previewKey!==previewKey){preview.innerHTML=routePreviewHtmlV122(context,state);panel.dataset.previewKey=previewKey;}
  if(preview)preview.hidden=view.routeImmersive||panel.dataset.photoExpanded!=='true';
  const write=(selector,value)=>{
    const el=panel.querySelector(selector);
    if(el&&el.textContent!==String(value))el.textContent=String(value);
  };
  // Populate real catalog names only when the story arrives/departs a city;
  // per-frame interpolation must not rebuild the interface or network map.
  const arrival=panel.querySelector('#route-story-ideas');
  const recaps=panel.querySelector('#route-story-idea-list');
  const ideaKey=String(state.cityId??'')+':'+String(state.phase??'')
    +':'+String(state.index??0);
  if(arrival&&recaps&&panel.dataset.ideaKey!==ideaKey){
    const inCity=state.phase==='dwell'||state.status==='complete';
    const rows=inCity?(state.ideas??[]).slice(0,5):[];
    const available=inCity&&rows.length>0;
    panel.dataset.ideasAvailable=String(available);
    arrival.hidden=!available||panel.dataset.expanded!=='true';
    const toggler=panel.querySelector('[data-action="route-story-ideas-toggle"]');
    if(toggler){
      toggler.hidden=!available;
      toggler.setAttribute('aria-expanded',String(available&&panel.dataset.expanded==='true'));
    }
    recaps.replaceChildren();
    if(rows.length){
      const fragment=document.createDocumentFragment();
      for(const item of rows){
        const chip=document.createElement('div');
        chip.className='route-story-idea';
        const symbol=document.createElement('span');
        symbol.className='route-story-idea-symbol';
        symbol.setAttribute('aria-hidden','true');
        symbol.textContent=item.symbol;
        const detail=document.createElement('span');
        detail.className='route-story-idea-copy';
        const title=document.createElement('strong');title.textContent=item.name;
        const type=document.createElement('small');
        type.textContent=item.label;
        detail.append(title,type);
        const statusLabel=document.createElement('span');
        statusLabel.className='route-story-idea-status'+(item.planned?' planned':'');
        statusLabel.textContent=item.note;
        chip.append(symbol,detail,statusLabel);
        fragment.append(chip);
      }
      recaps.append(fragment);
    }
    const count=panel.querySelector('#route-story-ideas-count');
    if(count)count.textContent=state.placesKnown+' vorhandene Orte · '
      +state.plannedCount+' im Plan · '+state.ideaCount+' Ideen';
    panel.dataset.ideaKey=ideaKey;
  }
  const rail=panel.querySelector('#route-story-stoprail');
  const route=Array.isArray(state.routeOverview)?state.routeOverview:[];
  if(rail&&panel.dataset.routeKey!==route.map(x=>x.id).join('|')){
    const fragment=document.createDocumentFragment();
    for(const [i,stop] of route.entries()){
      const dot=document.createElement('button');
      dot.type='button';dot.dataset.action='route-story-seek';dot.dataset.value=String(i);
      dot.className='route-story-rail-dot';
      dot.title=(i+1)+'. '+stop.name;
      dot.setAttribute('aria-label',(i+1)+'. '+stop.name);
      dot.dataset.stageIndex=String(i);
      fragment.append(dot);
    }
    rail.replaceChildren(fragment);
    panel.dataset.routeKey=route.map(x=>x.id).join('|');
    panel.dataset.railIndex='';
  }
  const railKey=String(state.index)+':'+state.phase;
  if(rail&&panel.dataset.railIndex!==railKey){
    for(const [i,node] of [...rail.children].entries()){
      node.classList.toggle('complete',i<state.index);
      node.classList.toggle('current',i===state.index);
      if(i===state.index)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
    }
    panel.dataset.railIndex=railKey;
  }
  panel.dataset.phase=String(state.phase??'dwell');
  for(const [name,disabled] of [['route122-prev',state.index===0],['route122-next',state.index>=state.total-1]]){
    const b=panel.querySelector('[data-action='+name+']');if(b)b.disabled=disabled;
  }
  const phaseFill=panel.querySelector('#route122-phase-fill');if(phaseFill)phaseFill.style.width=(100*(state.phaseProgress??0)).toFixed(1)+'%';
  const stageText=state.status==='complete'?'Ziel der Reisevorschau erreicht'
    :state.phase==='travel'?'Unterwegs nach '+(state.nextName||'der nächsten Stadt')
    :'Angekommen in '+state.name;
  write('#route-story-stage',stageText);
  write('#route-story-symbol',state.symbol);
  write('#route-story-city',state.name);
  write('#route-story-description',state.description);
  write('#route-story-count',(state.index+1)+' / '+state.total);
  const bar=panel.querySelector('.route-story-progress');
  if(bar)bar.setAttribute('aria-valuenow',String(Math.round(state.progress)));
  const fill=panel.querySelector('#route-story-progress-fill');
  if(fill)fill.style.width=state.progress.toFixed(2)+'%';
  const pause=panel.querySelector('[data-action="route-story-pause"]');
  if(pause){
    pause.setAttribute('aria-label',status==='paused'?'Animation fortsetzen':'Animation pausieren');
    pause.hidden=status==='complete';
    pause.disabled=status==='complete';
    const label=status==='paused'?'Fortsetzen':'Pause';
    if(pause.dataset.label!==label){
      pause.innerHTML=icon(status==='paused'?'play':'pause')+'<span>'+label+'</span>';
      pause.dataset.label=label;
    }
  }
  write('[data-action="route-story-speed"]',state.speed+'×');
  const announcement=panel.querySelector('#route-story-announcement');
  const key=status+':'+state.index;
  if(announcement&&panel.dataset.lastAnnouncement!==key){
    announcement.textContent=status==='complete'
      ?'Alle '+state.total+' Reiseorte gezeigt'
      :status==='paused'?'Pausiert · '+state.name
      :state.nextName&&state.index<state.total-1
        ?'Halt '+(state.index+1)+' · Als Nächstes: '+state.nextName
        :'Letzter Halt · '+state.name;
    panel.dataset.lastAnnouncement=key;
  }
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
    hikeRoute:hikingMapPreview(context),dayJourney:context.dayJourney,
    dayPreview:context.page==='map'&&view.mapSimple
      &&context.explorer?.scope==='day'&&!context.day.some(x=>x.kind==='activity')
      &&context.dayPlan?.slots.length
      ?{slots:context.dayPlan.slots,sourceItems:context.all}:null,
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
  currentMap?.selectMarkerOnly(context.page==='map'?mapKey:selectedKey);
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
  pauseDay110(false);
  const previous = currentMap && restoreView ? [currentMap.map.getCenter(), currentMap.map.getZoom()] : null;
  const active = document.activeElement;
  const focusAction = app.contains(active) ? active.dataset?.action : null;
  const focusValue = active?.dataset?.value;
  const sameStayContext=context?.page==='lodging'&&view.page==='lodging'&&context.variant.id===variant.id;
  const focusStayFacet=sameStayContext&&app.contains(active)&&active.matches('[data-stay-facet]')?active.id:null;
  const retainStayCap=focusStayFacet&&active.dataset.stayFacet==='maxNight'
    &&String(context.stayFacets?.maxNight??'')===String(view.stayFacets.maxNight??'')?active:null;
  if(context?.page==='lodging'&&view.page==='lodging'&&context.variant.id===variant.id){
    const facets=app.querySelector('.stay-facets');
    if(facets)view.stayFacetsOpen=facets.open;
    const research=app.querySelector('.stay-swiss-research');
    if(research)view.staySwissResearchOpen=research.open;
  }
  const sideScroll = app.querySelector('.sidebar-inner')?.scrollTop;
  const dateScroll = app.querySelector('.days')?.scrollLeft;
  // Retain the actual Leaflet DOM (tiles, vector canvas and all listeners)
  // through ordinary page rerenders. Previously every filter/day interaction
  // discarded the entire map, forcing another network/WebGL initialization.
  const oldMap=currentMap;
  context = buildContext();
  if(view.dayQueueLoading&&!dayRouteGate.isCurrent(dayRouteRequest,context,view.dayQueueIds)){
    invalidateDayRoute();context.dayRoute.status=view.dayQueueStatus;
  }
  app.dataset.variantId=variant.id;
  app.dataset.revision=String(variant.revision);
  const reuse=Boolean(oldMap?.element?.isConnected&&mapVisible(context)&&window.L);
  const mapNode=reuse?oldMap.element:null;
  if(reuse)mapNode.remove();
  else{oldMap?.destroy();currentMap=null}
  document.documentElement.dataset.theme = view.theme;
  document.documentElement.dataset.motion = view.mapMotion;
  if(view.page!=='map'||!view.mapFullscreen){view.routeImmersive=false;clearRoutePreloadV124();clearExplorerMarkersV125(currentMap?.map);}
  document.body.classList.toggle('map-fullscreen-active',view.page==='map'&&view.mapFullscreen);
  document.body.classList.toggle('route123-active',view.routeImmersive);
  unmountJourneyStory?.();
  app.innerHTML = renderShell(context);
  unmountJourneyStory=mountJourneyStoryV121(app);
  const replacement=app.querySelector('#map');
  if(mapNode&&replacement){
    replacement.replaceWith(mapNode);
    currentMap=oldMap;
  }else if(mapNode){
    oldMap.destroy();currentMap=null;
  }
  motion.reveal(app,context);
  motion.images(app);
  revealDayRouteFocus();
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
  if(focusStayFacet){
    const replacement=app.querySelector('#'+CSS.escape(focusStayFacet));
    if(retainStayCap&&replacement)replacement.replaceWith(retainStayCap);
    (retainStayCap??replacement)?.focus({preventScroll:true});
  }
  const element=app.querySelector('#map');
  if(element&&mapVisible(context)&&window.L){
    const retained=Boolean(currentMap&&currentMap.element===element);
    if(!retained){
      currentMap = new TripMap(element, {
        placePin:point=>{
          if(!view.mapPinPicking||context.page!=='map')return;
          const item=context.all.find(item=>item.id===view.mapPinEditingId)??null;
          openMapPin(item,{...view.mapPinDraft,lat:point[0],lon:point[1]});
        },
        select: id => { selectPoint(id, false); },
        dayJourneyStop:index=>{pauseDay110();focusDay110(index);},
        storyState:state=>updateRouteStoryUi(state),
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
    }
    // The layout has already settled by the time the map is reattached.
    currentMap.map.invalidateSize({pan:false});
    currentMap.element.classList.toggle('is-placing-pin',view.mapPinPicking);
    paintMap(!retained||!restoreView);
    if(context.dayJourney){if(day110Index>=context.dayJourney.stops.length)day110Index=-1;if(day110Index>=0)focusDay110(day110Index,false);}
    if(!retained&&previous)
      currentMap.map.setView(previous[0],previous[1],{animate:false});
    if(focusMap)currentMap.focus(context.selected);
    if(!currentMap.viewportListenerRegistered){
      currentMap.map.on('moveend',refreshViewportList);
      currentMap.viewportListenerRegistered=true;
    }
    if(view.mapViewportOnly)refreshViewportList();
    updateRouteStoryUi(currentMap.storyState());
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
  const dialog=document.querySelector('#dialog');
  if(dialog.open&&(dialog.dataset.variantId!==variant.id||Number(dialog.dataset.revision)!==variant.revision))
    throw new Error('Der Plan wurde inzwischen geändert. Bitte den Dialog schließen und erneut öffnen.');
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
  view.mapPinPicking=false;view.mapPinDraft=null;view.mapPinEditingId=null;
  try {
    currentMap?.stopCityStory();
    if(view.routeImmersive){view.routeImmersive=false;view.mapFullscreen=false;view.mapFullscreenDrawer=false;}
    variant = await api('/api/variant/' + encodeURIComponent(id));
    localStorage.setItem('reiseplan-variant', id);
    view.city = view.date = view.selected = view.wholeDay = null;
    view.dayJourneyMode=null;day110Index=-1;day110Request++;
    view.mapFrom = view.mapTo = view.mapRouteResult = null;
    view.mapNearPointId=null;view.mapViewportOnly=false;view.mapViewportBounds=null;view.mapSavedOnly=false;
    view.dayQueueIds = []; view.dayQueueRoutes = []; view.dayQueueStatus = ''; view.dayQueueFocus = 0; view.geocodeReview=null;
    view.total = view.menu = false;
    view.compareIds.clear();view.inspectorCompareIds=[];
    view.stayFacets={};view.stayFacetsOpen=false;view.staySwissResearchOpen=false;
    view.stayBrowseLimit=8;
    view.dailyBudgetDate=null; view.showAllVotes=false;
    view.dataOpenSections=[];
    render();
  } finally { loading = false; }
}

async function loadCityMarkets(cityId){
  if(supermarketByCity.has(cityId))return supermarketByCity.get(cityId);
  if(marketRequests.has(cityId))return marketRequests.get(cityId);
  const task=api('/api/supermarkets?city='+encodeURIComponent(cityId))
   .then(data=>{supermarketByCity.set(cityId,data);return data})
   .finally(()=>marketRequests.delete(cityId));
  marketRequests.set(cityId,task);
  return task;
}
function refreshMarketsOnCityChange(cityId){
  if(!view.mapMarketsShown||supermarketByCity.has(cityId))return;
  view.mapMarketsLoading=true;
  void loadCityMarkets(cityId).catch(error=>{
    view.mapMarketsError=error.message;
  }).finally(()=>{
    view.mapMarketsLoading=false;
    if(!loading&&!saving&&view.page==='map')render({restoreView:true,fetchRoutes:false});
  });
}
function showCity(id, date, wholeDay = false) {
  if (!context.trip.route.includes(id)) return;
  if (id !== view.city || (date && date !== view.date)) {
    view.dayPlanFocus='all';view.dayJourneyMode=null;day110Index=-1;day110Request++;
    view.mapPinPicking=false;view.mapPinDraft=null;view.mapPinEditingId=null;
    view.dayQueueIds = []; view.dayQueueRoutes = []; view.dayQueueStatus = ''; view.dayQueueFocus = 0;
  }
  currentMap?.stopCityStory();
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
  refreshMarketsOnCityChange(id);
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
      // The A→B planner must enforce the same endpoint check as Route Studio
      // and the day-plan saver. Valid road geometry alone proves neither stop.
      if (!footpathMatchesStops(from,to,route))
        throw new Error('Der Fußweg endet nicht ausreichend nah an den gewählten Orten (maximal 75 m Abweichung). Gehzeit und Weg werden nicht übernommen.');
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
  if (items.some(i => !i || i.removed || !i.point || i.city !== ctx.city)) throw new Error('Stopps müssen vorhanden, geolokalisiert und in derselben gewählten Stadt liegen.');
  const ids=[...view.dayQueueIds],token=dayRouteGate.begin(ctx,ids),results=[];
  dayRouteRequest=token;view.dayQueueLoading=true;
  view.dayQueueRoutes = [];
  view.dayQueueStatus = 'Berechne die Fußwege über den Router …';
  render({ restoreView:true, fetchRoutes:false });
  for (let i = 1; i < items.length; i++) {
    const from = items[i-1], to = items[i];
    const input = explorerRouteInput(from,to);
    if (!input?.sameCity || !input.canWalk) {
      view.dayQueueLoading=false;
      view.dayQueueStatus = 'Keine belegbare Fußroute für ' + from.name + ' → ' + to.name;
      render({ restoreView:true, fetchRoutes:false });
      return;
    }
    try {
      const route = walks.get(walkKey(from.point,to.point)) ?? await api('/api/walk','POST',{points:[from.point,to.point]});
      if(!dayRouteGate.isCurrent(token,context,view.dayQueueIds))return;
      if(!route?.walkOnly||!footpathMatchesStops(from,to,route)
        ||!Number.isFinite(route.minutes)||route.minutes<0
        ||!Number.isFinite(route.metres)||route.metres<0)
        throw new Error('Fußwegantwort nicht zu den aktuellen Stopps passend. Bitte erneut berechnen.');
      walks.set(walkKey(from.point,to.point), route);
      results.push(route);view.dayQueueRoutes=[...results];
    } catch (e) {
      if(!dayRouteGate.isCurrent(token,context,view.dayQueueIds))return;
      view.dayQueueLoading=false;
      view.dayQueueStatus = 'Fußweg ' + from.name + ' → ' + to.name + ' nicht bestätigt: ' + e.message;
      render({ restoreView:true, fetchRoutes:false });
      return;
    }
  }
  if(!dayRouteGate.isCurrent(token,context,view.dayQueueIds))return;
  view.dayQueueLoading=false;
  view.dayQueueStatus = 'Alle Fußwegstrecken berechnet. Öffnungszeiten und Ticketverfügbarkeit weiterhin prüfen.';
  render({ restoreView:true, fetchRoutes:false });
}

async function commitDayQueue() {
  const ctx=context,items=view.dayQueueIds.map(id=>ctx.all.find(item=>item.id===id));
  const plan=dayRouteSelection(ctx,items,view.dayQueueRoutes,view.dayQueueTime);
  await save({...ctx.state,edits:plan.edits},plan.rows.length+' Stopps in den Tagesplan übernommen');
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
  if (!['overview', 'plan', 'map', 'rail', 'lodging', 'discover', 'activities', 'food', 'budget', 'group', 'data'].includes(page)) return;
  if(view.page!==page){
    if(view.page==='lodging'||page==='lodging')view.compareIds.clear();
    view.mapPinPicking=false;view.mapPinDraft=null;view.mapPinEditingId=null;
    view.browseFilterOpen=false;view.browseResearchOpen=false;
    view.stayBrowseLimit=8;
    view.browseMealsOpen=false;view.browseFoodResearchOpen=false;
  }
  view.page = page;
  if(page!=='map'){view.mapFullscreen=false;view.mapFullscreenDrawer=false;}
  view.menu = false;
  view.optionFilter = 'all';
  if (page !== 'map') view.total = false;
  if(page!=='plan'){view.dayJourneyMode=null;day110Index=-1;day110Request++;}
  if (page === 'map' && view.mapScope === 'trip') view.total = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}

async function withEdit(item, edit, message) {
  if (!item) return;
  const { state } = variant;
  await save({ ...state, edits: { ...state.edits, [item.id]: { ...state.edits[item.id], ...edit } } }, message);
}

async function moveTimelineV105(fromId,toId,restoreFocus=false){
  if(view.page!=='plan'||saving||loading)return;
  const result=timelineReorderV105(context,fromId,toId);
  if(!result.ok){say(result.reason);return;}
  await save({...context.state,edits:result.edits},'Reihenfolge geändert');
  if(restoreFocus){
    const card=[...app.querySelectorAll('.event-card[data-event-id]')].find(node=>node.dataset.eventId===fromId);
    (card?.querySelector('.day105-move:not(:disabled)')??card?.querySelector('.event-content'))?.focus({preventScroll:true});
  }
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

/** One bookmark interaction for old plan favorites and the map shortlist.
 * Existing Map bookmarks stay browser-local; editable catalog entries are
 * saved to the variant's favorites. External POIs never enter variant state.
 */
async function toggleSavedEntry(ctx,item,{preferLocal=false}={}){
  if(!item?.id)return;
  const mapSaved=readMapBookmarks(localStorage,variant.id).has(item.id);
  const favorite=ctx.state.favorites?.includes(item.id)??false;
  const already=mapSaved||favorite;
  const localFirst=preferLocal||item.readOnlyExternal;
  if(!already){
    if(localFirst){
      toggleMapBookmark(localStorage,variant.id,item.id);
      say('Für diese Reisevariante gemerkt.');
      render({restoreView:true,fetchRoutes:false});
    }else{
      await save({...ctx.state,favorites:[...ctx.state.favorites,item.id]},
        'Ort zur Merkliste hinzugefügt');
    }
  }else{
    if(favorite){
      await save({...ctx.state,favorites:ctx.state.favorites.filter(id=>id!==item.id)},
        'Ort aus der Merkliste entfernt');
    }
    if(mapSaved){
      toggleMapBookmark(localStorage,variant.id,item.id);
      if(!favorite){
        say('Ort aus der Merkliste entfernt.');
      }
      render({restoreView:true,fetchRoutes:false});
    }
  }
  if(!already)motion.animateSaved(app,item.id);
}

async function action(name, value = '') {
  if (!context) return;
  const ctx = context;
  const item = ctx.all.find(i => i.id === value)
    ?? ctx.explorer?.placed.find(i => i.id === value)
    ?? ctx.explorer?.unlocated.find(i => i.id === value)
    ?? ctx.marketItems?.find(i=>i.id===value);
  switch (name) {
    case 'guide-start': guideNavigate(0); break;
    case 'guide-next': guideNavigate(Math.min(GUIDE_STEPS.length-1,view.guideIndex+1)); break;
    case 'guide-prev': guideNavigate(Math.max(0,view.guideIndex-1)); break;
    case 'guide-jump': guideNavigate(Number(value)); break;
    case 'guide-close': closeGuide(); break;
    case 'guide-finish': closeGuide(true); say('Einführung abgeschlossen. Du kannst sie oben jederzeit erneut starten.'); break;
    case 'page': changePage(value); break;
    case 'coverage-export':
    case 'coverage-export-csv': {
      if(ctx.page!=='data')break;
      const payload=buildFieldAudit(ctx);
      const csv=name==='coverage-export-csv';
      const text=csv?fieldAuditAsCsv(payload,ctx.cities):JSON.stringify(payload,null,2);
      const blob=new Blob([text],{type:csv?'text/csv;charset=utf-8':'application/json'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='reiseplaner-offene-daten-'+ctx.trip.id+(csv?'.csv':'.json');
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      say(payload.entries.length+' offene Einträge als '+(csv?'CSV':'JSON')+' lokal exportiert.');
      break;
    }
    case 'activity-category':
      if(!['all','culture','nature','water','view','sport','night','clubs','bars','other'].includes(value))break;
      view.activityCategory=value;view.browseLimit=24;render({fetchRoutes:false});break;
    case 'activity-evidence':
      if(!['all','photo','missingPhoto','point','sourcedPoint','unverifiedPoint','missingPoint','price','missingPrice'].includes(value))break;
      view.activityEvidenceFilter=value;view.browseLimit=24;
      render({fetchRoutes:false});break;
    case 'activity-saved':
      view.activitySavedOnly=!view.activitySavedOnly;view.browseLimit=24;
      render({fetchRoutes:false});break;
    case 'activity-reset':
      view.activityCategory='all';view.activitySavedOnly=false;view.activityEvidenceFilter='all';
      view.browseSearch='';view.browseLimit=24;view.browseScope='trip';
      render({fetchRoutes:false});break;
    case 'browse-scope':
      if(!['city','trip'].includes(value))break;
      view.browseScope=value;view.browseLimit=24;view.stayBrowseLimit=8;view.optionFilter='all';view.compareIds.clear();
      render({fetchRoutes:false});break;
    case 'browse-search-apply':
      clearTimeout(browseSearchTimer);
      browseSearchTimer=null;
      view.browseSearch=app.querySelector('#browse-search')?.value?.trim().slice(0,100)??'';
      view.browseLimit=24;view.stayBrowseLimit=8;render({fetchRoutes:false});break;
    case 'browse-search-reset':
      clearTimeout(browseSearchTimer);browseSearchTimer=null;
      view.browseSearch='';view.browseLimit=24;view.stayBrowseLimit=8;render({fetchRoutes:false});break;
    case 'browse-food-type':
      if(!['all','restaurants','markets','cook'].includes(value))break;
      view.browseFoodType=value;view.browseLimit=24;render({fetchRoutes:false});break;
    case 'browse-save':
      if(item)await toggleSavedEntry(ctx,item);
      break;
    case 'browse-food-saved':
      view.browseFoodSavedOnly=!view.browseFoodSavedOnly;
      view.browseLimit=24;render({fetchRoutes:false});break;
    case 'browse-reset':
      clearTimeout(browseSearchTimer);browseSearchTimer=null;
      view.browseSearch='';view.browseFoodType='all';
      view.browseFoodSavedOnly=false;view.optionFilter='all';
      if(ctx.page==='lodging')view.stayFacets={};
      view.browseLimit=24;view.stayBrowseLimit=8;render({fetchRoutes:false});break;
    case 'stay-facets-reset':
      view.stayFacets={};view.browseLimit=24;view.stayBrowseLimit=8;render({restoreView:true,fetchRoutes:false});break;
    case 'browse-market-load':{
      if(ctx.page!=='food')break;
      const cityId=ctx.city;
      if(supermarketByCity.has(cityId)){
        view.browseFoodType='markets';render({fetchRoutes:false});break;
      }
      view.browseMarketError=null;view.browseMarketLoadingCity=cityId;
      render({fetchRoutes:false});
      try{
        const data=await loadCityMarkets(cityId);
        if(ctx.variant.id===variant.id && context?.city===cityId){
          view.browseFoodType='markets';view.browseFoodSavedOnly=false;
          say(data.count+' kartierte Supermärkte für '+ctx.cities[cityId].name+' geladen.');
        }
      }catch(error){
        if(ctx.variant.id===variant.id && context?.city===cityId){
          view.browseMarketError=String(error.message??error);
          say('Supermarkt-Datenquelle: '+view.browseMarketError);
        }
      }finally{
        if(view.browseMarketLoadingCity===cityId)view.browseMarketLoadingCity=null;
        if(view.page==='food'&&ctx.variant.id===variant.id)
          render({fetchRoutes:false});
      }
      break;
    }
    case 'browse-more':
      if(view.page==='lodging')view.stayBrowseLimit=Math.min(2000,view.stayBrowseLimit+8);
      else view.browseLimit=Math.min(2000,view.browseLimit+24);
      render({fetchRoutes:false});break;
    case 'browse-map': {
      const kind=value==='lodging'?'lodging':value==='food'?'food':'activity';
      view.page='map';view.mapScope=view.browseScope==='trip'?'trip':'city';
      view.total=view.mapScope==='trip';view.mapGroup=kind;view.mapSearch='';
      view.selected=null;view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapSavedOnly=false;render({fetchRoutes:false});break;
    }
    case 'browse-supermarkets': {
      view.page='map';view.total=false;view.mapScope='city';view.mapGroup='shop';
      view.mapSearch='';view.mapMarketsShown=true;view.mapMarketsError=null;
      view.mapViewportOnly=false;view.mapViewportBounds=null;view.selected=null;
      render({fetchRoutes:false});
      if(!supermarketByCity.has(ctx.city)){
        view.mapMarketsLoading=true;render({restoreView:true,fetchRoutes:false});
        try{
          const data=await loadCityMarkets(ctx.city);
          say(data.count+' kartierte Supermärkte für '+ctx.cities[ctx.city].name);
        }catch(error){
          view.mapMarketsError=error.message;
          say('Supermarktsuche: '+error.message);
        }finally{
          view.mapMarketsLoading=false;
          render({restoreView:true,fetchRoutes:false});
        }
      }
      break;
    }
    case 'browse-map-item':
      if(!item||!item.point){say('Für diesen Eintrag ist kein genauer Kartenpunkt hinterlegt.');break;}
      if(document.querySelector('#dialog')?.open)closeDialog();
      view.page='map';view.city=item.city;
      view.date=ctx.dates.find(date=>ctx.cityForDay(date)===item.city)
        ??ctx.trip.stayByCity?.[item.city]?.from??ctx.date;
      view.wholeDay=false;view.mapScope='city';view.total=false;
      view.mapGroup=explorerCategory(item);view.mapSearch='';
      if(item.readOnlyExternal)view.mapMarketsShown=true;
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapSavedOnly=false;view.selected=item.id;
      render({focusMap:true,fetchRoutes:false});break;
    case 'menu': view.menu = !view.menu; render({ restoreView: true }); break;
    case 'theme':
      view.theme = view.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('reiseplan-theme', view.theme); render({ restoreView: true }); break;
    case 'variant': await switchVariant(value); break;
    case 'city':
      if (view.page === 'map') { view.mapScope = 'city'; view.total = false; }
      showCity(value); break;
    case 'journey121-map':
      if(!context.trip.route.includes(value))break;
      view.page='map';view.mapScope='city';view.total=false;view.mapFullscreen=false;view.mapFullscreenDrawer=false;
      view.mapSearch='';view.mapGroup='all';view.mapSavedOnly=false;
      showCity(value);window.scrollTo({top:0,behavior:'instant'});break;
    case 'trip-city':
      if (!context.trip.route.includes(value)) break;
      view.page='plan';view.total=false;
      showCity(value);break;
    case 'day': showCity(ctx.cityForDay(value), value, view.wholeDay === true || ctx.trip.id === 'swiss_lakes'); break;
    case 'hike-preview': {
      const trail=hikingPreview(ctx,value);if(!trail)break;
      view.hikePreviewId=trail.id;view.page='map';view.city=trail.city;view.selected=null;
      view.total=false;view.mapScope='day';view.mapSearch='';view.mapGroup='all';
      view.mapSavedOnly=false;view.mapNearPointId=null;
      render({focusMap:true,fetchRoutes:false});
      break;
    }
    case 'hike-preview-close':
      view.hikePreviewId=null;render({focusMap:true,fetchRoutes:false});break;
    case 'day-preparation-toggle': {
      if(ctx.trip.id!=='interrail_swiss'||view.page!=='plan')break;
      const next=togglePreparationV102(localStorage,ctx.trip.id,ctx.date,value);
      if(!next){say('Die persönliche Checkliste konnte nicht gespeichert werden.');break;}
      const panel=app.querySelector('.day102-preparation');
      if(!panel)break;
      const checked=next.includes(value);
      const button=[...panel.querySelectorAll('.day102-check')]
        .find(node=>node.dataset.value===value);
      if(button){
        button.setAttribute('aria-pressed',String(checked));
        button.classList.toggle('is-done',checked);
        button.setAttribute('aria-label',button.querySelector('strong').textContent
          +(checked?', persönlich geprüft':', noch nicht abgehakt'));
        const symbol=button.querySelector('.day102-check-symbol');
        if(symbol)symbol.textContent=checked?'✓':'+';
      }
      const indicator=panel.querySelector('.day102-count strong');
      if(indicator)indicator.textContent=next.length+' / 5';
      const bar=panel.querySelector('.day102-meter');
      if(bar){bar.setAttribute('aria-valuenow',String(next.length));
        const inner=bar.querySelector('i');
        if(inner)inner.style.width=(next.length*20)+'%';
      }
      break;
    }
    case 'day-preparation-copy': {
      if(ctx.trip.id!=='interrail_swiss'||view.page!=='plan')break;
      const text=preparationTextV102(ctx);
      if(!text)break;
      try{
        if(!navigator.clipboard?.writeText)throw new Error('Clipboard nicht verfügbar');
        await navigator.clipboard.writeText(text);
        const feedback=app.querySelector('.day102-copy-result');
        if(feedback)feedback.textContent='Tagesablauf einschließlich Quellen kopiert.';
      }catch{say('Kopieren nicht verfügbar. Prüfe die Berechtigung deiner Browser-Zwischenablage.');}
      break;
    }
    case 'day-plan-focus': {
      if(!['all','morning','noon','evening'].includes(value)
         ||ctx.trip.id!=='interrail_swiss'||view.page!=='plan')break;
      view.dayPlanFocus=value;
      const board=app.querySelector('#interrail-schweiz-tagesablauf');
      if(!board)break;
      board.querySelectorAll('.day101-filter').forEach(button=>
        button.setAttribute('aria-pressed',String(button.dataset.value===value)));
      board.querySelectorAll('.day101-period-card').forEach(card=>{
        card.hidden=value!=='all'&&card.dataset.period!==value;
      });
      const status=board.querySelector('.day101-filter-status');
      if(status)status.textContent=value==='all'?'Alle drei Abschnitte'
        :({morning:'Morgen',noon:'Mittag',evening:'Abend'}[value]+' ausgewählt');
      break;
    }

    case 'day111-map-stop': {
      openDay110('draft');
      const index=context?.dayJourney?.stops.findIndex(s=>s.sourceId===value)??-1;
      if(index>=0)focusDay110(index);
      break;
    }
    case 'day110-open':
    case 'day110-mode': openDay110(value);break;
    case 'day110-close':
      day110Request++;day110Index=-1;view.dayJourneyMode=null;render({fetchRoutes:false});break;
    case 'day110-focus': pauseDay110(false);focusDay110(Number(value));break;
    case 'day110-prev': pauseDay110(false);focusDay110(Math.max(0,day110Index-1));break;
    case 'day110-next': pauseDay110(false);focusDay110(Math.min((ctx.dayJourney?.stops.length??0)-1,day110Index+1));break;
    case 'day110-play': playDay110();break;
    case 'day110-pause': pauseDay110();break;
    case 'day110-route': await checkDay110Routes();break;
    case 'day110-move-confirm': {
      const pair=JSON.parse(value),option=dayMoveOptionsV110(ctx).find(x=>x.id===pair?.[0]&&x.date===pair?.[1]);
      if(!option)break;
      openDialog('Aktivität verschieben','<p>'+esc(option.name)+' auf '+esc(option.date)+' verschieben? Es wird kein neuer Termin gebucht.</p><div class="dialog-foot">'+btn('close','Abbrechen')+btn('day110-move-apply','Verschieben','check',value,'primary')+'</div>');
      break;
    }
    case 'day110-move-apply': {
      const pair=JSON.parse(value),option=dayMoveOptionsV110(ctx).find(x=>x.id===pair?.[0]&&x.date===pair?.[1]);
      if(!option)break;
      const draft=quickDayEdit(ctx,option.id,option.date,'move');
      if(!draft.ok){say(draft.reason);break;}
      await save({...ctx.state,edits:draft.edits},'Aktivität verschoben');
      closeDialog();break;
    }
    case 'day-timeline-move': {
      const pair=JSON.parse(value);
      if(Array.isArray(pair)&&pair.length===2&&pair.every(id=>typeof id==='string'))
        await moveTimelineV105(pair[0],pair[1],true);
      break;
    }
    case 'day-plan-go':
      if(!ctx.trip.dayPlansV32?.some(row=>row.date===value))break;
      view.page='plan';view.mobile='plan';
      showCity(ctx.cityForDay(value),value,ctx.trip.id==='swiss_lakes');
      // A jump from a deeply scrolled overview must land on the new day,
      // not in the middle of the previous page's scroll position.
      window.scrollTo({top:0,behavior:'instant'});
      break;
    case 'day-quick-add':
    case 'day-quick-move':
    case 'day-quick-remove': {
      const add=name==='day-quick-add',move=name==='day-quick-move';
      const picker=[...document.querySelectorAll('.hub-quick-day')]
        .find(el=>el.dataset.quickDayId===value);
      const targetDate=add||move
        ?(picker?.querySelector('select')?.value??ctx.date):ctx.date;
      const draft=quickDayEdit(ctx,value,targetDate,add?'add':move?'move':'remove');
      if(!draft.ok){say(draft.reason);break;}
      await save({...ctx.state,edits:draft.edits},
        add?'Zum '+targetDate+' hinzugefügt (unverbindlich)'
          :move?'Auf '+targetDate+' verschoben (unverbindlich)'
          :'Aktivität aus dem Tagesplan entfernt');
      break;
    }
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
      view.mapListOpen=true;
      view.mapScope='city';view.total=false;view.mapSavedOnly=false;
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapGroup='all';view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});
      const search=matchMedia('(min-width:1180px)').matches
        ?app.querySelector('#reference-top-search')??app.querySelector('#map-search')
        :app.querySelector('#map-search');
      if(search?.closest('.reference-places-drawer'))search.closest('details').open=true;
      search?.scrollIntoView({block:'center',behavior:'instant'});
      search?.focus({preventScroll:true});
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
      // Scope changes should not silently retain the prior "only saved" mask.
      // Keep explicit category/search filters, which the user can still see.
      view.mapSavedOnly=false;
      view.mapListLimit=60;view.mapViewportOnly=false;
      view.mapViewportBounds=null;view.mapNearPointId=null;
      view.selected=null;
      render({fetchRoutes:false}); break;
    case 'map-unlocated-filter':
      if(!['all','sourced-address','address','unverified','concept','private'].includes(value))break;
      view.mapUnlocatedFilter=value;view.mapUnlocatedLimit=12;view.mapUnlocatedOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-unlocated-search':
      view.mapUnlocatedSearch=app.querySelector('#map-unlocated-search')?.value?.trim().slice(0,100)??'';
      view.mapUnlocatedLimit=12;view.mapUnlocatedOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-unlocated-clear':
      view.mapUnlocatedSearch='';view.mapUnlocatedLimit=12;view.mapUnlocatedOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-unlocated-more':
      view.mapUnlocatedLimit=Math.min(120,view.mapUnlocatedLimit+12);view.mapUnlocatedOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-evidence-type':
      if(!['all','provider','unverified'].includes(value))break;
      view.mapEvidenceType=value;view.mapEvidenceLimit=10;view.mapEvidenceOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-evidence-search':
      view.mapEvidenceSearch=app.querySelector('#map-evidence-search')?.value.trim().slice(0,100)??'';
      view.mapEvidenceLimit=10;view.mapEvidenceOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-evidence-clear':
      view.mapEvidenceSearch='';view.mapEvidenceLimit=10;view.mapEvidenceOpen=true;
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-evidence-more':
      view.mapEvidenceLimit=Math.min(100,view.mapEvidenceLimit+10);
      view.mapEvidenceOpen=true;render({restoreView:true,fetchRoutes:false});break;
    case 'explorer-references':
      view.mapShowCityReferences = !view.mapShowCityReferences;
      localStorage.setItem('reiseplan-map-city-references',
        view.mapShowCityReferences?'on':'off');
      render({ restoreView: true,fetchRoutes:false }); break;
    case 'explorer-reset':
      view.mapGroup='all';view.mapSearch='';view.mapScope='trip';view.total=true;
      view.mapViewportOnly=false;view.mapViewportBounds=null;view.mapNearPointId=null;view.mapSavedOnly=false;
      view.mapListLimit=60;
      render({fetchRoutes:false});break;
    case 'map-points-toggle':
      view.total=!view.total;
      view.mapScope=view.total?'trip':'city';
      view.mapGroup='all';view.mapSearch='';view.mapListLimit=60;
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.selected=null;view.mapSavedOnly=false;view.mapNearPointId=null;
      render({fetchRoutes:false});
      break;
    case 'map-supermarkets': {
      view.mapMarketsShown=!view.mapMarketsShown;
      view.mapMarketsError=null;
      if(!view.mapMarketsShown){render({restoreView:true,fetchRoutes:false});break;}
      const cityId=ctx.city;
      if(supermarketByCity.has(cityId)){
        render({restoreView:true,fetchRoutes:false});break;
      }
      view.mapMarketsLoading=true;
      render({restoreView:true,fetchRoutes:false});
      try{
        const response=await loadCityMarkets(cityId);
        say(response.count+' Supermärkte aus der offenen Geodatenquelle gefunden.');
      }catch(error){
        view.mapMarketsError=error.message;
        say('Supermärkte: '+error.message);
      }finally{
        view.mapMarketsLoading=false;
        render({restoreView:true,fetchRoutes:false});
      }
      break;
    }
    case 'explorer-group':
      if (!['all', 'lodging', 'food', 'shop', 'activity', 'transport'].includes(value)) break;
      // In trip mode the base map intentionally renders city hubs only.
      // Move to the current city's POI map for category markers, rather than
      // implying that a category-filtered trip line plots individual venues.
      const switchingCity=view.mapScope==='trip'&&value!=='all';
      if(switchingCity){
        view.mapScope='city';view.total=false;
        view.mapViewportOnly=false;view.mapViewportBounds=null;
      }
      view.mapGroup=value;view.mapListOpen=true;view.mapListLimit=60;
      render({restoreView:!switchingCity,fetchRoutes:false});break;
    case 'explorer-search':
      view.mapSearch = document.querySelector('#map-search')?.value?.trim().slice(0, 100) ?? '';
      view.mapListOpen=true;
      view.mapListLimit = 60; render({ restoreView: true,fetchRoutes:false }); break;
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
    case 'explorer-save':
      if(!item||!item.id||!['activity','lodging','transport'].includes(item.kind)){
        say('Dieser Eintrag kann nicht zur Merkliste hinzugefügt werden.');break;
      }
      await toggleSavedEntry(ctx,item,{preferLocal:true});
      break;
    case 'nav-saved':
      view.mapSavedOnly=true;view.mapListLimit=60;view.mapListOpen=true;
      if(view.mapScope==='trip'){view.mapScope='city';view.total=false;}
      if(view.page!=='map')changePage('map');
      else render({restoreView:true,fetchRoutes:false});
      break;
    case 'explorer-saved-only': {
      const switching=view.mapScope==='trip'&&!view.mapSavedOnly;
      view.mapSavedOnly=!view.mapSavedOnly;view.mapListLimit=60;view.mapListOpen=true;
      if(switching){view.mapScope='city';view.total=false;}
      render({restoreView:!switching,fetchRoutes:false});break;
    }
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
      const visibleLimit=context.explorer?.limit??view.mapListLimit;
      if(index>=visibleLimit||!view.mapListOpen||view.mapFullscreen&&!view.mapFullscreenDrawer){
        // A selected marker must be reachable even outside the initial
        // 12-row calm-map viewport. Expanding does not change the filters.
        if(index>=visibleLimit){
          const step=view.mapSimple?12:60;
          view.mapListLimit=Math.ceil((index+1)/step)*step;
        }
        view.mapListOpen=true;
        if(view.mapFullscreen)view.mapFullscreenDrawer=true;
        render({restoreView:true,fetchRoutes:false});
      }
      const card=[...app.querySelectorAll('.explorer-place')].find(el=>el.dataset.placeId===item.id);
      if(card){card.scrollIntoView({block:'center',behavior:'smooth'});
        card.querySelector('[data-action=explorer-focus],[data-action=details]')?.focus({preventScroll:true});}
      break;
    }
    case 'explorer-more':
      // 12 → 24 → 48 in the calm map; keep the existing 60-row cadence in
      // the explicitly expanded explorer. No search results are discarded.
      if(view.mapSimple)view.mapListLimit=view.mapListLimit===60?24:view.mapListLimit+24;
      else view.mapListLimit+=60;
      render({ restoreView: true,fetchRoutes:false });break;
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
      if(!publicGeocodeLookupAllowed(item)){
        say(publicGeocodeLookupBlockedReason(item));
        break;
      }
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
      invalidateDayRoute();
      view.dayQueueIds=[...view.dayQueueIds,value];view.dayQueueRoutes=[];view.dayQueueStatus='';
      view.dayQueueFocus=view.dayQueueIds.length-1;
      view.total=false;view.mapScope='city';
      render({restoreView:true});currentMap?.focusStudioStop(view.dayQueueFocus); break;
    case 'map-pin-new':
      view.mapPinDraft=null;view.mapPinEditingId=null;openMapPin();break;
    case 'map-pin-focus':
      if(!item?.userPin||item.removed)break;
      view.page='map';view.mobile='map';view.mapScope='city';view.total=false;view.mapGroup='all';
      view.mapSearch='';view.mapSavedOnly=false;view.mapViewportOnly=false;view.mapNearPointId=null;
      if(ctx.city!==item.city)showCity(item.city);
      view.city=item.city;view.selected=item.id;render({focusMap:true,fetchRoutes:false});break;
    case 'day-route-open': {
      if(view.mapFullscreen){view.mapFullscreen=false;view.mapFullscreenDrawer=false;render({fetchRoutes:false});}
      const panel=app.querySelector('.day-route-builder.has-stops');
      panel?.scrollIntoView({block:'start'});panel?.querySelector('#day-route-start')?.focus({preventScroll:true});break;
    }
    case 'map-pin-pick': {
      const form=document.querySelector('dialog [data-map-pin-form]');
      if(!form)break;
      const draft=Object.fromEntries(new FormData(form)),id=form.dataset.pinId||null;
      const city=ctx.all.find(item=>item.id===id)?.city??ctx.city;
      closeDialog();view.page='map';view.mobile='map';
      if(context.city!==city)showCity(city);
      view.mapPinDraft=draft;view.mapPinEditingId=id;view.mapPinPicking=true;render({restoreView:true,fetchRoutes:false});
      currentMap?.element.scrollIntoView({block:'center'});currentMap?.element.focus();break;
    }
    case 'map-pin-cancel':
      openMapPin(ctx.all.find(item=>item.id===view.mapPinEditingId)??null,view.mapPinDraft??{});
      break;
    case 'day-route-remove': {
      invalidateDayRoute();
      const previous=[...view.dayQueueIds];
      view.dayQueueIds=view.dayQueueIds.filter(id=>id!==value);
      view.dayQueueFocus=queueFocusIndex(previous,view.dayQueueIds,view.dayQueueFocus);
      view.dayQueueRoutes=[];view.dayQueueStatus='';render({restoreView:true}); break;
    }
    case 'day-route-up':
    case 'day-route-down': {
      const at=view.dayQueueIds.indexOf(value), next=at+(name==='day-route-up'?-1:1);
      if (at>=0 && next>=0 && next<view.dayQueueIds.length) {
        invalidateDayRoute();
        const previous=[...view.dayQueueIds];
        [view.dayQueueIds[at],view.dayQueueIds[next]]=[view.dayQueueIds[next],view.dayQueueIds[at]];
        view.dayQueueFocus=queueFocusIndex(previous,view.dayQueueIds,view.dayQueueFocus);
        view.dayQueueRoutes=[];view.dayQueueStatus='';
        render({restoreView:true});
      }
      break;
    }
    case 'day-route-optimize': {
      invalidateDayRoute();
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
      invalidateDayRoute();
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
    case 'map-basemap-retry':
      currentMap?.retryBasemap();
      break;
    case 'map-density':
      if(!['calm','detail'].includes(value))break;
      view.mapDensity=value;
      localStorage.setItem('reiseplan-map-density',value);
      render({restoreView:true,fetchRoutes:false});break;
    case 'map-tone':
      if(!['standard','midnight','sand'].includes(value))break;
      view.mapTone=value;localStorage.setItem('reiseplan-map-tone',value);
      render({restoreView:true,fetchRoutes:false});
      break;
    case 'map-open-search': {
      if(view.page!=='map')break;
      // An explicit search request must reveal the actual search field even
      // when the default simple mode normally hides advanced explorer tools.
      view.mapSimple=false;
      view.mapListOpen=true;
      const changedScope=view.mapScope!=='city';
      if(changedScope){
        // Search returns individually mapped places instead of only route hubs.
        view.mapScope='city';view.total=false;view.mapViewportOnly=false;
        view.mapViewportBounds=null;view.mapListLimit=60;
      }
      if(view.mapFullscreen)view.mapFullscreenDrawer=true;
      render({restoreView:!changedScope,fetchRoutes:false});
      const drawer=app.querySelector('.reference-places-drawer');
      if(drawer)drawer.open=true;
      const search=app.querySelector('#map-search');
      if(!view.mapFullscreen)drawer?.scrollIntoView({block:'nearest',behavior:'auto'});
      search?.focus({preventScroll:true});
      break;
    }
    case 'map-remove-filter': {
      // Remove one constraint without disturbing the other active filters.
      if(!['group','search','saved','viewport','nearby'].includes(value))break;
      if(value==='group')view.mapGroup='all';
      if(value==='search')view.mapSearch='';
      if(value==='saved')view.mapSavedOnly=false;
      if(value==='viewport'){view.mapViewportOnly=false;view.mapViewportBounds=null;}
      if(value==='nearby')view.mapNearPointId=null;
      view.mapListLimit=60;
      render({restoreView:true,fetchRoutes:false});
      app.querySelector('.map-active-filter, .map-find-button')?.focus({preventScroll:true});
      break;
    }
    case 'map-clear-filters':
      view.mapGroup='all';view.mapSearch='';view.mapSavedOnly=false;
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapNearPointId=null;view.mapListLimit=60;view.mapListOpen=true;
      render({restoreView:true,fetchRoutes:false});
      break;
    case 'map-clear-selection':
      view.selected=null;
      render({restoreView:true,fetchRoutes:false});
      break;
    case 'map-fullscreen':
      if(view.page!=='map')break;
      if(view.routeImmersive){await action('route123-exit');break;}
      view.mapFullscreen=!view.mapFullscreen;
      view.mapFullscreenDrawer=false;
      render({restoreView:true,fetchRoutes:false});
      if(!view.mapFullscreen)
        app.querySelector('.map-fullscreen-launch')?.focus({preventScroll:true});
      else
        app.querySelector('.map-fullscreen-exit')?.focus({preventScroll:true});
      break;
    case 'map-fullscreen-drawer':
      if(view.page!=='map'||!view.mapFullscreen)break;
      view.mapFullscreenDrawer=!view.mapFullscreenDrawer;
      render({restoreView:true,fetchRoutes:false});
      if(view.mapFullscreenDrawer)app.querySelector('#map-search')?.focus({preventScroll:true});
      else app.querySelector('.map-fullscreen-drawer-toggle')?.focus({preventScroll:true});
      break;
    case 'route125-launch':
      await action('route123-launch');
      if(currentMap?.storyState().status!=='idle')currentMap?.seekCityStoryTime(0);
      break;
    case 'route123-launch':
      view.routeImmersive=true;view.mapFullscreen=true;view.mapFullscreenDrawer=false;view.total=true;view.mapScope='trip';changePage('map');
      await action('route-story-play');
      if(!currentMap||currentMap.storyState().status==='idle')await action('route123-exit');
      else app.querySelector('[data-action=route123-exit]')?.focus({preventScroll:true});break;
    case 'route123-exit':
      currentMap?.stopCityStory();currentMap?.map.stop();view.routeImmersive=false;view.mapFullscreen=false;view.mapFullscreenDrawer=false;
      render({fetchRoutes:false});app.querySelector('.map-fullscreen-launch')?.focus({preventScroll:true});break;
    case 'route123-day':
      if(!ctx.trip.dayPlansV32?.some(d=>d.date===value))break;
      currentMap?.stopCityStory();currentMap?.map.stop();view.routeImmersive=false;view.mapFullscreen=false;view.mapFullscreenDrawer=false;
      await action('day-plan-go',value);openDay110('draft');break;
    case 'route122-launch':
      view.total=true;view.mapScope='trip';changePage('map');
      await action('route-story-play');
      if(currentMap?.storyState().status!=='idle')await action('route122-toggle');break;
    case 'route122-toggle': {
      const panel=app.querySelector('#route-story-player');if(!panel||panel.hidden)break;
      const expanded=panel.dataset.photoExpanded!=='true';panel.dataset.photoExpanded=String(expanded);
      const preview=panel.querySelector('#route122-preview');if(preview)preview.hidden=!expanded;
      if(expanded&&currentMap)updateRouteStoryUi(currentMap.storyState());
      panel.querySelector('[data-action=route122-toggle]')?.setAttribute('aria-expanded',String(expanded));break;
    }
    case 'route124-stop': {
      if(!view.routeImmersive||!/^\d+$/.test(value))break;
      const state=currentMap?.storyState();if(!state||state.status==='idle')break;
      const target=previewStopTargetV124(state,immersiveSceneV123(context,state),Number(value));
      if(target!==null){route125ManualCamera=true;try{currentMap.seekCityStoryTime(target);}finally{route125ManualCamera=false;}}break;
    }
    case 'route122-prev':
    case 'route122-next': {
      const s=currentMap?.storyState();if(s&&s.status!=='idle')currentMap.seekCityStory(s.index+(name==='route122-prev'?-1:1));break;
    }
    case 'route-story-seek':
      if(view.page==='map'&&/^\d+$/.test(value))currentMap?.seekCityStory(Number(value));
      break;
    case 'route-story-play':
      if(view.page!=='map')break;
      // A fresh playback always begins as a tiny map overlay; the user may
      // explicitly expand city details while the playback is in a city.
      if(app.querySelector('#route-story-player')){
        app.querySelector('#route-story-player').dataset.expanded='false';
        app.querySelector('#route-story-player').dataset.previewKey='';
        app.querySelector('#route-story-player').dataset.photoExpanded='false';
        app.querySelector('[data-action=route122-toggle]')?.setAttribute('aria-expanded','false');
      }
      if(!view.total||view.mapScope!=='trip'){
        view.mapScope='trip';view.total=true;view.mapSavedOnly=false;
        view.mapGroup='all';view.mapSearch='';view.mapNearPointId=null;
        view.mapViewportOnly=false;view.mapViewportBounds=null;
        view.mapFullscreenDrawer=false;view.selected=null;
        render({fetchRoutes:false});
      }
      if(!currentMap?.playCityStory(context.trip,context.cities,context.all,context.activeSet,{immersive:view.routeImmersive}))
        say('Für die Routenanimation werden mindestens zwei Reisestädte mit Kartenposition benötigt.');
      break;
    case 'route-story-ideas-toggle': {
      const player=app.querySelector('#route-story-player');
      const trigger=player?.querySelector('[data-action="route-story-ideas-toggle"]');
      if(!player||!trigger||trigger.hidden)break;
      const expanded=player.dataset.expanded!=='true';
      player.dataset.expanded=String(expanded);
      trigger.setAttribute('aria-expanded',String(expanded));
      trigger.setAttribute('aria-label',expanded?'Ortsideen ausblenden':'Ortsideen anzeigen');
      const details=player.querySelector('#route-story-ideas');
      if(details)details.hidden=!expanded||player.dataset.ideasAvailable!=='true';
      break;
    }
    case 'route-story-pause':
      if(currentMap?.storyState().status==='paused')currentMap.resumeCityStory();
      else currentMap?.pauseCityStory();
      break;
    case 'route-story-speed': {
      const now=currentMap?.storyState().speed??1;
      currentMap?.storySpeed(now===1?1.5:now===1.5?2:1);
      break;
    }
    case 'route-story-stop':
      if(view.routeImmersive){await action('route123-exit');break;}
      currentMap?.stopCityStory();
      break;
    case 'route-story-explore': {
      if(view.page!=='map')break;
      const cityId=currentMap?.storyState().cityId;
      if(!cityId||!context.trip.route.includes(cityId))break;
      currentMap.stopCityStory();
      view.mapScope='city';view.total=false;
      view.mapSavedOnly=false;view.mapGroup='all';
      view.mapViewportOnly=false;view.mapViewportBounds=null;
      view.mapNearPointId=null;view.mapSearch='';
      if(view.mapFullscreen)view.mapFullscreenDrawer=true;
      showCity(cityId);
      const list=app.querySelector('.reference-places-drawer');
      if(list)list.open=true;
      app.querySelector('#map-search')?.focus({preventScroll:true});
      break;
    }
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
      if(!['photo','location','geo_evidence','price','source','hours'].includes(value))break;
      const city=ctx.page==='map'&&ctx.total?'all':ctx.city;
      view.dataOpenSections=[...new Set([...view.dataOpenSections,'gaps'])];
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
    case 'details':
      if(!item)break;
      if(item.readOnlyExternal){
        const precision=item.geoEvidence?.isCentroid
          ?'Mittelpunkt einer kartierten Supermarktfläche – kein nachgewiesener Eingang.'
          :'Als Punkt kartierter Supermarkt – genauer Eingang ungeprüft.';
        openDialog('Supermarkt · offene Kartendaten',
          '<div class="hub-market-dialog"><h3>'+esc(item.name)+'</h3>'
          +'<p>'+esc(item.address??'Öffentliche Hausadresse nicht verfügbar')+'</p>'
          +'<p>'+esc(precision)+'</p>'
          +'<p>Quelle: OpenStreetMap / Overpass. Ob das Geschäft aktuell geöffnet'
          +' oder überhaupt noch in Betrieb ist, wurde nicht unabhängig überprüft.</p>'
          +urlLink(item.sourceUrl,'Original-Datensatz in OpenStreetMap')
          +'<div class="dialog-foot">'+btn('browse-map-item','Auf Karte','pin',item.id)
          +btn('close','Schließen')+'</div></div>');
        break;
      }
      itemDetails(ctx,item,view.inspectorCompareIds);break;
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
    case 'edit': if(item&&!item.readOnlyExternal){if(item.userPin)openMapPin(item);else editItem(ctx,item,item.kind,save);}break;
    case 'choose': if(item&&!item.readOnlyExternal){
      // Browsing the whole trip must open the correct city's booking/plan form,
      // not silently assign a Nice/Paris option to Barcelona's current day.
      if(item.city!==ctx.city&&ctx.browseScope==='trip'
        &&['lodging','discover','food'].includes(ctx.page)){
        const match=ctx.dates.find(d=>ctx.cityForDay(d)===item.city)
          ??ctx.trip.stayByCity?.[item.city]?.from??ctx.date;
        showCity(item.city,match);
      }
      chooseItem(context,item,save,(city,date)=>{
        view.page='plan';showCity(city,date);
        view.selected=item.id;render({focusMap:true});
      });
    }break;
    case 'remove':
      if (item && !item.locked && !item.booked) {
        await withEdit(item, { removed: true, selected: false }, 'Aus dem Plan entfernt'); closeDialog();
        if(view.dayQueueIds.includes(item.id)){
          const previous=[...view.dayQueueIds];invalidateDayRoute();
          view.dayQueueIds=previous.filter(id=>id!==item.id);
          view.dayQueueFocus=queueFocusIndex(previous,view.dayQueueIds,view.dayQueueFocus);
          view.dayQueueRoutes=[];view.dayQueueStatus='';render({restoreView:true,fetchRoutes:false});
        }
      }
      break;
    case 'clone-item':
      if(item&&!item.readOnlyExternal){
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
    case 'option-filter': view.optionFilter = value; view.browseLimit=24;view.stayBrowseLimit=8;render({ restoreView: true }); break;
    case 'optimize': optimize(); break;
    case 'reorder': await reorder(...JSON.parse(value)); closeDialog(); break;
    case 'expense': expenseForm(ctx, ctx.state.expenses.find(e => e.id === value), save); break;
    case 'meal-cost':
      if (item?.mealSlot && ctx.activeSet.has(item.id)) expenseForm(ctx, ctx.state.expenses.find(e => e.forItem === item.id), save, item);
      break;
    case 'market-quote':
      marketQuoteForm(ctx,value,save);
      break;
    case 'market-quote-reset': {
      if(!ctx.state.marketQuotes?.[value]||!value.startsWith(ctx.city+':'))break;
      const updated={...ctx.state.marketQuotes};
      delete updated[value];
      await save({...ctx.state,marketQuotes:updated},'Eigene Marktpreisreferenz zurückgesetzt');
      break;
    }
    case 'grocery-edit': {
      const row = groceryBasket(ctx.active.filter(item => !ctx.state.expenses.some(e => e.forItem === item.id)),
        ctx.people.length, ctx.state.groceryOverrides ?? {}, ctx.state.shopping).find(entry => entry.key === value && entry.city === ctx.city);
      if (row) groceryEditForm(ctx, row, save);
      break;
    }
    case 'grocery-extra': {
      const extra = ctx.state.shopping?.extras?.find(row => row.id === value && row.city === ctx.city);
      if (!value || extra) groceryExtraForm(ctx, extra, save);
      break;
    }
    case 'grocery-check':
    case 'grocery-remove':
    case 'grocery-restore': {
      const shopping = ctx.state.shopping ?? { pantry: {}, checked: {}, excluded: {}, extras: [] };
      const row = groceryBasket(ctx.active.filter(item => !ctx.state.expenses.some(e => e.forItem === item.id)),
        ctx.people.length, ctx.state.groceryOverrides ?? {}, shopping).find(entry => entry.key === value && entry.city === ctx.city);
      if (!row) break;
      if (name === 'grocery-check') {
        await save({ ...ctx.state, shopping: { ...shopping, checked: { ...shopping.checked, [value]: !row.checked } } }, 'Einkaufsstatus gespeichert');
      } else if (row.extra) {
        const next = { ...shopping, extras: shopping.extras.filter(extra => extra.id !== value) };
        for (const field of ['pantry', 'checked', 'excluded']) {
          next[field] = { ...shopping[field] };
          delete next[field][value];
        }
        const overrides = { ...ctx.state.groceryOverrides };
        delete overrides[value];
        await save({ ...ctx.state, groceryOverrides: overrides, shopping: next }, 'Zusatzartikel entfernt');
      } else {
        await save({ ...ctx.state, shopping: { ...shopping, excluded: { ...shopping.excluded, [value]: name === 'grocery-remove' } } },
          name === 'grocery-remove' ? 'Zutat aus dem Einkauf genommen' : 'Zutat wieder im Einkauf');
      }
      break;
    }
    case 'grocery-reset': {
      const overrides = { ...ctx.state.groceryOverrides };
      if (!Object.hasOwn(overrides, value)) break;
      delete overrides[value];
      await save({ ...ctx.state, groceryOverrides: overrides }, 'Warenkorb-Referenz wiederhergestellt');
      break;
    }
    case 'meal-slot':
      if(mealSlotLabels[value]){view.mealSlot=value;view.browseMealsOpen=true;render({restoreView:true,fetchRoutes:false});}break;
    case 'shopping-stop':
      shoppingStopForm(ctx,save,()=>{view.page='plan';showCity(ctx.city,ctx.date);});break;
    case 'meal-choose': {
      const match=Object.entries(catalog.mealPlans??{}).find(([,plans])=>
        plans.some(plan=>plan.id===value));
      if(!match)break;
      const [mealCity,plans]=match;
      const option=plans.find(plan=>plan.id===value);
      if(mealCity!==ctx.city){
        const day=ctx.dates.find(d=>ctx.cityForDay(d)===mealCity)
          ??ctx.trip.stayByCity?.[mealCity]?.from??ctx.date;
        showCity(mealCity,day);
      }
      const target=context;
      mealForm(target,option,save,id=>{
        view.page='plan';view.mobile='plan';
        showCity(target.city,target.date);
        if(context.day.some(entry=>entry.id===id))selectPoint(id,false);
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

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&view.mapPinPicking&&!document.querySelector('#dialog').open){
    event.preventDefault();void action('map-pin-cancel');return;
  }
  if(event.key!=='Escape'||!view.mapFullscreen||view.page!=='map')return;
  if(document.querySelector('#dialog')?.open||document.querySelector('.photo118-viewer[open]')||guideStep(view.guideIndex))return;
  event.preventDefault();
  if(view.routeImmersive){void action('route123-exit');return;}
  if(view.mapFullscreenDrawer){
    view.mapFullscreenDrawer=false;
    render({restoreView:true,fetchRoutes:false});
    app.querySelector('.map-fullscreen-drawer-toggle')?.focus({preventScroll:true});
  }else{
    view.mapFullscreen=false;
    render({restoreView:true,fetchRoutes:false});
    app.querySelector('.map-fullscreen-launch')?.focus({preventScroll:true});
  }
});
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
  if(event.target.closest(':is(#route122-preview,#route123-preview) :is(.photo119-item>a,[data-action=details],.route125-activity summary)')&&currentMap?.storyState().status==='playing')currentMap.pauseCityStory();
  const button = event.target.closest('[data-action]');
  if (button) void action(button.dataset.action, button.dataset.value).catch(error => say(error.message));
});
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a.day103-jump-link[href^="#"]');
  if(!link||!app.contains(link))return;
  const target=document.getElementById(link.hash.slice(1));
  if(!target)return;
  event.preventDefault();
  // Use actual scroll ancestors and current header dimensions. A native
  // anchor jump remains deterministic after resize and with reduced motion.
  const header=app.querySelector('.reference-topbar');
  const nav=app.querySelector('.day103-navigation');
  if(nav?.querySelector('.day103-picker[open]'))nav.querySelector('.day103-picker').open=false;
  target.focus?.({preventScroll:true});
  const height=header?.getBoundingClientRect().height??0;
  const sticky=nav?parseFloat(getComputedStyle(nav).top)||0:0;
  const offset=target===nav?height+12:Math.max(height,sticky)+(nav?.getBoundingClientRect().height??0)+12;
  const previous=target.style.scrollMarginTop;
  target.style.scrollMarginTop=offset+'px';
  target.scrollIntoView({block:'start',inline:'nearest',behavior:'instant'});
  target.style.scrollMarginTop=previous;
  requestAnimationFrame(()=>{
   if(!target.isConnected)return;
   const top=target.getBoundingClientRect().top;
   const bottom=Math.max(header?.getBoundingClientRect().bottom??0,target===nav?0:nav?.getBoundingClientRect().bottom??0);
   if(top<bottom+8&&top>=-16)window.scrollBy({top:top-bottom-12,behavior:'instant'});
  });
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
  const detail=event.target;
  if(!detail.isConnected)return;
  if(detail.matches('[data-photo114-group],[data-photo114-archive]')){if(detail.open)void mountPhotoLibraryV114(detail);return;}
  if(context?.page==='data'&&detail.matches('[data-data-section]')){
    const key=detail.dataset.dataSection;
    view.dataOpenSections=detail.open?[...new Set([...view.dataOpenSections,key])]
      :view.dataOpenSections.filter(value=>value!==key);
    const body=detail.querySelector(':scope > .data-disclosure-body');
    if(detail.open&&!body.dataset.loaded){
      body.innerHTML=renderDataSection(context,key);body.dataset.loaded='true';
    }else if(!detail.open){body.replaceChildren();delete body.dataset.loaded;}
  }
  if(context?.page==='data'&&detail.matches('[data-coverage-reasons]')){
    const body=detail.querySelector('.coverage-reasons-body');
    if(detail.open)body.innerHTML=renderCoverageReasons(context,detail.dataset.coverageReasons);
    else body.replaceChildren();
  }
  if(event.target.matches('.sidebar-places'))view.cityNavOpen=event.target.open;
  if(event.target.matches('.map-own-pins'))view.mapPinsOpen=event.target.open;
  if(event.target.matches('.map-design-details'))view.mapDesignOpen=event.target.open;
  if(event.target.matches('.reference-places-drawer'))view.mapListOpen=event.target.open;
  if(event.target.matches('.map-evidence-review'))view.mapEvidenceOpen=event.target.open;
  else if(event.target.matches('.map-unlocated-review'))view.mapUnlocatedOpen=event.target.open;
  if(event.target.matches('.explorer-view-advanced'))view.mapAdvancedOpen=event.target.open;
  if(event.target.matches('.explorer-day-notes'))view.mapDayNotesOpen=event.target.open;
  if(event.target.matches('.day-plan-compact'))view.dayPlanOpen=event.target.open;
  if(event.target.matches('.hub-filter-more'))view.browseFilterOpen=event.target.open;
  if(event.target.matches('.stay-facets'))view.stayFacetsOpen=event.target.open;
  if(event.target.matches('.stay-swiss-research')){
    view.staySwissResearchOpen=event.target.open;
    if(detail.open&&detail.dataset.contentLoaded!=='true'){
      // Do not mount hundreds of unseen source nodes until deliberately opened.
      render({restoreView:true,fetchRoutes:false});
      app.querySelector('.stay-swiss-research > summary')?.focus({preventScroll:true});
      return;
    }
  }
  if(event.target.matches('.hub-food-planning'))view.browseMealsOpen=event.target.open;
  if(event.target.matches('.hub-food-research'))view.browseFoodResearchOpen=event.target.open;
  if(event.target.matches('.hub-technical-details:not(.hub-food-research)')){
    view.browseResearchOpen=event.target.open;
    if(context?.page==='lodging'&&detail.open&&detail.dataset.contentLoaded!=='true'){
      render({restoreView:true,fetchRoutes:false});
      app.querySelector('.hub-technical-details > summary')?.focus({preventScroll:true});
      return;
    }
  }
},true);
// Commons and explicitly sourced photos can fail when offline or blocked.
 // Keep a designed category fallback, not broken alt-text inside a photo tile.
app.addEventListener('error',event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement))return;
  const photo114=image.closest('.photo114-card');if(photo114){image.hidden=true;photo114.classList.add('photo114-unavailable');return;}
  const frame=image.closest('.destination-cover,.place-thumbnail,.place-photo,.reference-intro-photo,.reference-discovery-image,.reference-hero-thumb,.editorial-journey-media,.hub-hero-art,.day-editorial-media');
  if(!frame||image.dataset.fallbackApplied)return;
  // The decorative backup failing must not hide a separately sourced
  // and successfully loaded individual photo.
  if(image.classList.contains('place-context-image')){
    image.dataset.fallbackApplied='true';
    image.style.display='none';
    frame.classList.add('photo-context-failed');
    return;
  }
  image.dataset.fallbackApplied='true';
  image.style.display='none';
  frame.dataset.imageUnavailable='true';
  const editorialHero=frame.closest('.editorial-journey-hero,.hub-hero,.day-editorial-hero');
  if(editorialHero){
    editorialHero.dataset.photo='fallback';
    const credit=editorialHero.querySelector('.editorial-journey-credit,.hub-hero-photo-credit,.day-editorial-credit');
    if(credit)credit.setAttribute('title','Originalfoto konnte nicht geladen werden – Quellenlink');
  }
  if(frame.matches('.reference-intro-photo,.reference-discovery-image')){
    const label=document.createElement('span');
    label.className='reference-photo-fallback';
    label.textContent='Bild gerade nicht verfügbar';
    frame.append(label);
  }
  if(frame.classList.contains('place-photo')&&!frame.querySelector('.place-photo-unavailable')){
    const source=frame.querySelector('.place-specific-credit a[href^="https://commons.wikimedia.org/"]');
    const label=document.createElement('span');
    label.className='place-photo-unavailable';
    label.textContent='Foto gerade nicht geladen';
    if(source){
      const link=document.createElement('a');
      link.className='place-photo-unavailable-source';
      link.href=source.href;
      link.target='_blank';link.rel='noopener noreferrer';
      link.textContent='Originalfoto auf Wikimedia öffnen';
      label.append(document.createTextNode(' · '),link);
    }else label.append(' · Bildquelle in den Details');
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
  if(event.target.id==='browse-search'&&event.key==='Enter'){
    event.preventDefault();void action('browse-search-apply');return;
  }
  if(event.target.id==='reference-top-search'&&event.key==='Enter'){
    event.preventDefault();
    view.mapSearch=event.target.value.trim().slice(0,100);
    view.mapListLimit=60;
    render({restoreView:true,fetchRoutes:false});
    return;
  }
  if(event.target.id==='map-evidence-search'&&event.key==='Enter'){
    event.preventDefault();void action('map-evidence-search').catch(error=>say(error.message));
    return;
  }
  if(event.target.id==='map-unlocated-search'&&event.key==='Enter'){
    event.preventDefault();
    void action('map-unlocated-search').catch(error=>say(error.message));
    return;
  }
  if(event.target.id==='map-search'&&event.key==='Enter'){
    event.preventDefault();
    void action('explorer-search').catch(error=>say(error.message));
  }
});
app.addEventListener('keydown',event=>{
 if(!view.routeImmersive||event.target.id!=='route124-time')return;
 const delta={ArrowLeft:-1000,ArrowDown:-1000,ArrowRight:1000,ArrowUp:1000,PageDown:-5000,PageUp:5000}[event.key];
 if(delta===undefined&&event.key!=='Home'&&event.key!=='End')return;
 event.preventDefault();const range=event.target;delete range.dataset.dragging;currentMap?.seekCityStoryTime(event.key==='Home'?0:event.key==='End'?Number(range.max):Math.max(0,Math.min(Number(range.max),Number(range.value)+delta)));
});
let route124ScrubFrame=0;
function scheduleRouteScrubV124(range){if(route124ScrubFrame)return;route124ScrubFrame=requestAnimationFrame(()=>{route124ScrubFrame=0;if(view.routeImmersive&&range.isConnected&&range.dataset.dragging==='true')currentMap?.seekCityStoryTime(Number(range.value));});}
function finishRouteScrubV124(range){if(route124ScrubFrame){cancelAnimationFrame(route124ScrubFrame);route124ScrubFrame=0;}delete range.dataset.dragging;if(view.routeImmersive&&range.isConnected)currentMap?.seekCityStoryTime(Number(range.value));}
app.addEventListener('pointercancel',event=>{if(event.target.id==='route124-time'&&event.target.dataset.dragging==='true')finishRouteScrubV124(event.target);});
app.addEventListener('focusout',event=>{if(event.target.id==='route124-time'&&event.target.dataset.dragging==='true')finishRouteScrubV124(event.target);});
app.addEventListener('focusin',event=>{if(view.routeImmersive&&event.target.id==='route124-day')currentMap?.pauseCityStory();});
app.addEventListener('input',event=>{
  if(event.target.id==='day126-time'){pauseDay110(false);seekDay126(Number(event.target.value));return;}
  if(event.target.id==='route124-time'&&view.routeImmersive){const range=event.target;range.dataset.dragging='true';currentMap?.pauseCityStory();const clock=app.querySelector('#route124-clock');const label=formatPreviewTimeV124(Number(range.value))+' / '+formatPreviewTimeV124(Number(range.max));if(clock)clock.textContent=label;range.setAttribute('aria-valuetext',label+' Vorschauzeit');scheduleRouteScrubV124(range);return;}
  // Search the already-loaded catalog without another explicit submit.
  // A short debounce avoids rebuilding every card after each keystroke;
  // preserve the input focus and caret after rendering.
  if(event.target.id==='browse-search'&&!event.isComposing){
    clearTimeout(browseSearchTimer);
    const previous=event.target;
    browseSearchTimer=setTimeout(()=>{
      browseSearchTimer=null;
      if(!app.contains(previous)||!['food','lodging','discover','activities'].includes(view.page))return;
      const raw=previous.value.slice(0,100);
      if(raw===view.browseSearch)return;
      const focused=document.activeElement===previous;
      const caret=focused?previous.selectionStart:null;
      view.browseSearch=raw;view.browseLimit=24;
      render({restoreView:true,fetchRoutes:false});
      if(focused){
        const input=app.querySelector('#browse-search');
        input?.focus({preventScroll:true});
        if(input&&Number.isInteger(caret)&&input.type==='search'){
          const end=Math.min(caret,input.value.length);
          input.setSelectionRange(end,end);
        }
      }
    },320);
    return;
  }
  if(event.target.id==='coverage-filter-query'){
    applyCoverageFilters(app.querySelector('.entry-coverage'));
  }
});
app.addEventListener('change', event => {
  if(view.routeImmersive&&event.target.id==='route124-time'){finishRouteScrubV124(event.target);return;}
  if(view.routeImmersive&&event.target.id==='route124-day'){const state=currentMap?.storyState();if(!state)return;const target=previewDayTargetsV124(context,state).find(d=>d.date===event.target.value);if(target){route125ManualCamera=true;try{currentMap.seekCityStoryTime(target.ms);}finally{route125ManualCamera=false;}}return;}
  if(event.target.matches('[data-stay-facet]')&&context?.page==='lodging'){
    if(!event.target.checkValidity()){event.target.reportValidity();return;}
    const key=event.target.dataset.stayFacet;
    if(!['kitchen','beds','cancellation','source','walk','maxNight'].includes(key))return;
    view.stayFacets={...view.stayFacets,[key]:event.target.value};view.browseLimit=24;view.stayBrowseLimit=8;
    render({restoreView:true,fetchRoutes:false});return;
  }
  if(event.target.id==='browse-city'&&context?.trip?.route.includes(event.target.value)){
    view.browseScope='city';view.browseLimit=24;view.optionFilter='all';
    view.browseMarketError=null;showCity(event.target.value);return;
  }
  if(['coverage-filter-query','coverage-filter-kind','coverage-filter-gap',
    'coverage-filter-city'].includes(event.target.id)){
    applyCoverageFilters(app.querySelector('.entry-coverage'));
  }
  if (event.target.id === 'variant') void switchVariant(event.target.value).catch(error => say(error.message));
  if (event.target.id === 'sort') { view.sort = event.target.value; render({ restoreView: true }); }
  if (event.target.id === 'activity-order' && ['source','score','name','price'].includes(event.target.value)) {
    view.activityOrder=event.target.value; render({restoreView:true,fetchRoutes:false});
  }
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
    if(event.target.id==='reference-top-search'&&view.page!=='map'){
      view.mapScope='city';view.mapSavedOnly=false;
      changePage('map');
    } else render({restoreView:true,fetchRoutes:false});
  }
  if (event.target.id === 'explorer-time') { view.mapRouteTime = event.target.value; view.mapRouteResult = null; render({ restoreView: true }); }
  if (event.target.id === 'day-route-start') { view.dayQueueTime=event.target.value; render({restoreView:true,fetchRoutes:false}); }
  if (event.target.id === 'meal-date' && context.dates.includes(event.target.value)) showCity(context.city, event.target.value);
});
// The reference header search is global: route to the map BEFORE the user
// types, then restore focus so the first character is not lost on navigation.
app.addEventListener('focusin',event=>{
  if(event.target?.id!=='reference-top-search'||view.page==='map')return;
  view.mapScope='city';view.mapSavedOnly=false;view.mapListLimit=60;
  changePage('map');
  requestAnimationFrame(()=>document.querySelector('#reference-top-search')?.focus());
});
app.addEventListener('submit', async event => {
  if(event.target.id==='browse-search-form'){
    event.preventDefault();
    void action('browse-search-apply').catch(error=>say(error.message));
    return;
  }
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
function clearTimelineDragV105(){
  dragged=null;
  app.querySelectorAll('.day105-dragging,.day105-drop-target').forEach(node=>
    node.classList.remove('day105-dragging','day105-drop-target'));
}
function canDropTimelineV105(target){
  return Boolean(dragged&&target&&context&&view.page==='plan'&&!saving&&!loading
    &&dragged.variant===variant.id&&dragged.date===context.date
    &&timelineReorderV105(context,dragged.id,target.dataset.eventId).ok);
}
app.addEventListener('dragstart', event => {
  const target=event.target.closest('.event-card[draggable=true]');
  if(!target||!event.dataTransfer)return;
  dragged={id:target.dataset.eventId,variant:variant.id,date:context.date};
  event.dataTransfer.setData('text/plain',dragged.id);
  event.dataTransfer.effectAllowed='move';
  target.classList.add('day105-dragging');
});
app.addEventListener('dragover', event => {
  const target=event.target.closest('.event-card[draggable=true]');
  app.querySelectorAll('.day105-drop-target').forEach(node=>{if(node!==target)node.classList.remove('day105-drop-target');});
  if(canDropTimelineV105(target)){
    event.preventDefault();
    if(event.dataTransfer)event.dataTransfer.dropEffect='move';
    target.classList.add('day105-drop-target');
  }
});
app.addEventListener('dragleave',event=>{
  const target=event.target.closest('.day105-drop-target');
  if(target&&!target.contains(event.relatedTarget))target.classList.remove('day105-drop-target');
});
app.addEventListener('drop', event => {
  const target=event.target.closest('.event-card[draggable=true]');
  const allowed=canDropTimelineV105(target);
  const source=dragged?.id;
  clearTimelineDragV105();
  if(!allowed)return;
  event.preventDefault();
  void moveTimelineV105(source,target.dataset.eventId).catch(error=>say(error.message));
});
app.addEventListener('dragend',clearTimelineDragV105);
matchMedia('(max-width:910px)').addEventListener('change', () => render());
window.addEventListener('resize',()=>requestAnimationFrame(revealDayRouteFocus));

try {
  catalog = await api('/api/bootstrap');
  const preferred = query.get('variant') ?? localStorage.getItem('reiseplan-variant');
  await switchVariant(catalog.variants.find(v => v.id === preferred)?.id ?? catalog.variants[0].id);
} catch (error) {
  app.innerHTML = '<main class="workspace">' + empty('Reiseplaner konnte nicht starten', error.message) + '</main>';
}
