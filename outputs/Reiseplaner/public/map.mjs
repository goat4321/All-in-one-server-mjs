import { transitNetworks } from './transit.mjs';
import { localParts } from './model.mjs';
import { explorerCategory, explorerUnlocatedCityClusters } from './map-explorer.mjs';
import { routeStudioModel, pointAlongRoute, routeDirectionAt } from './route-studio.mjs';
import { curatedPlacePhoto } from './curated-place-photos.mjs';
import { installSoftVectorBasemap, fallbackRasterUrl, fallbackRasterOptions,
  vectorAttribution, basemapLabels } from './vector-basemap.mjs';
import { markerTier, validMapCoordinate, bubbleMarkup } from './photo-map-model.mjs';
import {mapLegacyPinContent,mapIconForPlace,mapCategoryIcon} from './map-marker-icons-v64.mjs';
import { groupPoiForDisplay, poiDensityPolicy } from './poi-density.mjs';
import {markerProvenance} from './poi-location-provenance.mjs';
import {storyCityStops} from './route-city-story-v70.mjs';
import {RouteCityStoryPlayer} from './route-city-story-player-v70.mjs';
import {buildCityArrivalScenes} from './route-city-arrivals-v71.mjs';

const metroColors = { L1: '#c8102e', L2: '#93328e', L3: '#368729', L4: '#b88600', L5: '#0072cf', L9: '#e75400', L10: '#077daf', L11: '#568508' };
const layersCache = new Map();
const quietMotion = () => document.documentElement.dataset.motion==='off'
  || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const routeArrowIcon = bearing => {
 const angle=Math.round(bearing);
 const svg='<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">'
  +'<path d="M12 2L20 21L12 16.8L4 21Z" fill="currentColor" /></svg>';
 return L.divIcon({className:'route-studio-direction-icon',
  html:'<span class="route-studio-direction-arrow" aria-hidden="true" '
   +'style="--route-angle:'+angle+'deg">'+svg+'</span>',
  iconSize:[30,30],iconAnchor:[15,15]});
};
const labelNode = label => {
  const el = document.createElement('span');
  el.textContent = label;
  return el;
};

/** A draft route may only reference a sourced POI, not city-wide fallbacks. */
export function sourceBackedDayPreview(slots=[],all=[]){
  const sources=new Map((all??[]).map(item=>[item.id,item]));
  return (slots??[]).filter(slot=>!slot.optional).flatMap((slot,index)=>{
    const item=sources.get(slot.id);
    if(!item||item.kind!=='activity'||item.removed||item.duplicateOf)return [];
    const p=item.point;
    if(item.locationReferenceV07?.exactKnown!==true||item.geoEvidence?.isCentroid===true
      ||!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)
      ||Math.abs(p[0])>90||Math.abs(p[1])>180)return [];
    return [{id:item.id,name:item.name,point:p,city:item.city,ordinal:index+1}];
  });
}

function dataFile(file) {
  if (!layersCache.has(file)) layersCache.set(file, fetch('/transit/' + file + '.geojson').then(response => {
    if (!response.ok) throw new Error('Kartenebene fehlt.');
    return response.json();
  }));
  return layersCache.get(file);
}

export class TripMap {
  constructor(element, { focus, select, leg, visitCity, report, routeStop, hover, storyState,placePin,dayJourneyStop }) {
    this.handlers = { focus, select, leg, visitCity, report, routeStop, hover, storyState,placePin,dayJourneyStop };
    this.map = L.map(element, {zoomControl:true,scrollWheelZoom:true,
      preferCanvas:false,fadeAnimation:true,zoomAnimation:true,
      markerZoomAnimation:true,minZoom:3,maxZoom:19,zoomSnap:.5,
      maxBounds:[[-85,-180],[85,180]],maxBoundsViscosity:.85});
    this.map.zoomControl.setPosition('bottomright');
    this.map.on('click',event=>this.handlers.placePin?.([event.latlng.lat,event.latlng.lng]));
    this.map.attributionControl.setPrefix(false);
    this.features = L.layerGroup().addTo(this.map);
    this.poiLayer = L.layerGroup().addTo(this.map);
    // A separately stoppable schematic itinerary animation; never persisted.
    this.cityStory=new RouteCityStoryPlayer(this.map,state=>this.handlers.storyState?.(state));
    this.poiItems = []; this.poiKeys = new Set(); this.poiProfileCtx = null;
    // Rebuild only markers entering the viewport after a completed pan/zoom.
    this.map.on('moveend', () => this.paintExplorerPins());
    this.transit = L.layerGroup().addTo(this.map);
    this.markers = new Map();
    // Never load CARTO: since September 2026 their unauthenticated
    // tiles display the "API KEY REQUIRED" watermark.
    this.element=element;
    this.destroyed=false;
    this.basemapAttempt=0;
    this.basemap=null;
    this.fallbackLayer=null;
    this.basemapCredit=null;
    this.vectorGL=null;
    this.vectorGLOnError=null;
    this.offlineMap=new URLSearchParams(location.search).has('offlineMap');
    // Avoid fetching tiles for the temporary Europe-wide bootstrap view.
    // Raster is added after the first actual fit; vector upgrade is optional.
    this.basemapBooted=false;
    if(this.offlineMap)this.setBasemapStatus('offline');
    this.hiking = L.tileLayer.wms('https://wms.geo.admin.ch/', {
      layers: 'ch.swisstopo.swisstlm3d-wanderwege', format: 'image/png', transparent: true,
      minZoom: 10, maxNativeZoom: 18, maxZoom: 19, className: 'hiking-reference', opacity: .82,
      attribution: '<a href="https://api3.geo.admin.ch/rest/services/api/MapServer/ch.swisstopo.swisstlm3d-wanderwege/legend" target="_blank" rel="noopener">Wanderwege © swisstopo</a>',
    });
    this.hiking.on('tileerror', () => report('Wanderwegenetz derzeit nicht erreichbar.'));
    this.map.setView([46.7, 6.2], 5);
    this.map.on('focus', () => this.map.scrollWheelZoom.enable());
    this.map.on('blur', () => this.map.scrollWheelZoom.disable());
  }

  setBasemapStatus(state){
    if(this.destroyed)return;
    const region=this.element.parentElement?.querySelector('#map-source-indicator');
    if(!region)return;
    region.dataset.state=state;
    const label=region.querySelector('#map-source-label');
    if(label)label.textContent=basemapLabels[state]??basemapLabels.error;
    const retry=region.querySelector('#map-source-retry');
    if(retry)retry.hidden=!(state==='fallback'||state==='error');
  }

  setBasemapCredit(credit){
    if(this.basemapCredit)this.map.attributionControl.removeAttribution(this.basemapCredit);
    this.basemapCredit=credit;
    if(credit)this.map.attributionControl.addAttribution(credit);
  }

  useRasterFallback(){
    if(this.destroyed)return;
    if(!this.fallbackLayer){
      const raster=L.tileLayer(fallbackRasterUrl,{...fallbackRasterOptions});
      let failed=0;
      raster.on('tileerror',()=>{
        if(this.destroyed||this.basemap!==raster)return;
        if(++failed>=3)this.setBasemapStatus('error');
      });
      raster.on('tileload',()=>{
        if(this.destroyed||this.basemap!==raster)return;
        failed=0;this.setBasemapStatus('fallback');
      });
      this.fallbackLayer=raster;
      raster.addTo(this.map);
    }
    this.basemap=this.fallbackLayer;
    this.setBasemapCredit(null); // Leaflet handles its raster attribution.
    this.setBasemapStatus('fallback');
  }

  async startBasemap(){
    if(this.destroyed||this.offlineMap)return;
    const attempt=++this.basemapAttempt;
    const alive=()=>!this.destroyed&&attempt===this.basemapAttempt
      &&this.element.isConnected;
    if(!this.fallbackLayer)this.setBasemapStatus('loading');
    const layer=await installSoftVectorBasemap(this.map,this.fallbackLayer,{alive});
    if(!alive()){
      try{if(layer&&this.map.hasLayer(layer))this.map.removeLayer(layer)}catch{}
      return;
    }
    if(!layer){this.useRasterFallback();return;}
    if(this.vectorGL&&this.vectorGLOnError)
      this.vectorGL.off?.('error',this.vectorGLOnError);
    this.vectorGL=layer.getMaplibreMap?.()??null;
    let errors=0;
    this.vectorGLOnError=()=>{
      if(!alive()||this.basemap!==layer)return;
      if(++errors<3)return;
      this.vectorGL?.off?.('error',this.vectorGLOnError);
      this.vectorGL=null;this.vectorGLOnError=null;
      try{if(this.map.hasLayer(layer))this.map.removeLayer(layer)}catch{}
      this.useRasterFallback();
    };
    this.vectorGL?.on?.('error',this.vectorGLOnError);
    this.fallbackLayer=null;
    this.basemap=layer;
    this.setBasemapCredit(vectorAttribution);
    this.setBasemapStatus('vector');
  }

  retryBasemap(){
    if(this.destroyed||this.offlineMap)return false;
    void this.startBasemap();
    return true;
  }

  marker(point, id, text, number, style, click, offset = 0, popupHtml = null, group = this.features) {
    const icon = L.divIcon({ className: '', html: '<span class="pin ' + style + '"><span>'
      + mapLegacyPinContent(number,style) + '</span></span>',
      iconSize: [30, 30], iconAnchor: [14 - offset, 29] });
    const marker = L.marker(point, { icon, title: text, alt: text, keyboard: true,
      zIndexOffset: style.includes('draft') ? 1800 : style.includes('focused') ? 1000 : 0 }).addTo(group);
    marker.bindTooltip(labelNode(text), { direction: 'top', offset: [offset, -22] });
    marker.on('click', click);
    marker.on('mouseover',()=>this.handlers.hover?.(id,true));
    marker.on('mouseout',()=>this.handlers.hover?.(id,false));
    if (popupHtml) marker.bindPopup(popupHtml, { maxWidth: 320, minWidth: 230, closeButton: true });
    this.markers.set(id, marker);
    return marker;
  }

  paint({ trip, city, cities, entries, stops, dayTravel, routes, options, total, filters, focused, timetablePreview, explorer = null, dayRoute = null, profileCtx = null, dayPreview = null, hikeRoute = null, dayJourney = null }) {
    this.stopDayJourneyMotion();
    this.dayJourney=null;this.journeyFocus=-1;this.journeyDot=null;
    if(!total&&this.cityStory.state().status!=='idle')this.cityStory.stop();
    this.city = city;
    this.features.clearLayers();
    this.poiLayer.clearLayers();
    this.markers.clear(); this.poiKeys.clear(); this.poiItems = [];
    this.poiProfileCtx = profileCtx; this.poiFocused = focused; this.nearbyCircle = null;
    this.poiDensity=explorer?.density==='detail'?'detail':'calm';
    this.poiSaved=explorer?.saved??new Set();
    this.storyStops = [];
    this.storySegments = [];
    this.storyBounds = [];
    const area = [];
    if(dayJourney&&!total){
      this.paintDayJourney(dayJourney);
      this.bounds=dayJourney.stops.filter(s=>s.point).map(s=>s.point);
      if(!this.bounds.length&&cities[city]?.point)this.bounds=[cities[city].point];
      return;
    }
    if (total) {
      const ordered = trip.route.filter(id => cities[id]?.point);
      const coords = ordered.map(id => cities[id].point);
      L.polyline(coords, { color: '#71598c', weight: 4, opacity: .9, dashArray: '7 8',
        className:'trip-schematic-route' }).addTo(this.features)
        .bindTooltip(labelNode('Reihenfolge der Reiseorte · nur schematische Luftlinien, keine Bahngleise'));
      if (!quietMotion() && coords.length>1) L.polyline(coords,{
        color:'#e9c56e',weight:3,opacity:.98,dashArray:'2 21',
        interactive:false,className:'trip-schematic-flow',
      }).addTo(this.features);
      ordered.forEach((id, i) => {
        area.push(cities[id].point);
        if (ordered.indexOf(id) === i) this.marker(cities[id].point, id, cities[id].name, i + 1, 'train', () => this.handlers.visitCity(id));
      });
    } else {
      if (!explorer && filters.stations) for (const [departure, arrival] of dayTravel) {
        const line = L.polyline([departure.point, arrival.point], { color: '#71598c', weight: 3, dashArray: '7 8' }).addTo(this.features);
        line.bindTooltip(labelNode(departure.name + ' · schematischer Verlauf'));
        line.on('click', () => this.handlers.select(departure.entryKey));
      }
      if (!explorer && filters.walk) routes.forEach((route, i) => {
        if (!route?.points?.length) return;
        const line = L.polyline(route.points, { color: '#24765a', weight: 4, opacity: .86 }).addTo(this.features);
        line.bindTooltip(labelNode(route.mode + ' · ' + route.minutes + ' Min.'));
        line.on('click', () => this.handlers.leg(i));
        area.push(...route.points);
      });
      if (!explorer) routes.forEach((route, i) => {
        if (route?.legs?.length) area.push(...this.paintJourney(route, false, () => this.handlers.leg(i)));
      });
      if (!explorer && timetablePreview) area.push(...this.paintJourney(timetablePreview.route, true));
      const all = explorer ? [] : [...stops, ...(filters.options ? options : [])];
      const visible = all.map((item, i) => ({ item, alt: i >= stops.length }))
        .filter(({ item }) => item.point && (item.kind !== 'lodging' || filters.hotels)
          && (item.kind !== 'transport' || filters.stations) && (item.kind !== 'activity' || filters.activities));
      const byPoint = Map.groupBy(visible, ({ item }) => item.point.map(value => value.toFixed(5)).join(','));
      for (const colocated of byPoint.values()) for (const [i, { item, alt }] of colocated.entries()) {
        const key = item.entryKey ?? item.id;
        const color = [explorer ? 'place-' + explorerCategory(item) : alt ? 'alt' : item.kind === 'transport' ? 'train' : '', key === focused ? 'focused' : ''].join(' ');
        const offset = (i - (colocated.length - 1) / 2) * 24;
        this.marker(item.point, key, item.role ? item.role + ' · ' + item.name : item.name,
          explorer ? ({lodging:'H',food:'R',shop:'S',activity:'A',transport:'B'}[explorerCategory(item)])
            : alt ? '+' : item.anchor ? 'H' : (entries.findIndex(entry => entry.entryKey === key) + 1 || '•'),
          color, () => this.handlers.select(key), offset);
        if (!alt) area.push(item.point);
      }
    }
    // Numbered source-backed draft markers. The dotted segments are straight
    // geographic connectors, explicitly NOT routed walking times or tracks.
    const previewPoints=!total&&explorer&&dayPreview?.slots?.length
      ?sourceBackedDayPreview(dayPreview.slots,dayPreview.sourceItems):[];
    if(previewPoints.length){
      const coords=previewPoints.map(point=>point.point);
      if(coords.length>1){
        L.polyline(coords,{color:'#fff',weight:9,opacity:.85,
          dashArray:'5 10',interactive:false,className:'day-schematic-halo'})
          .addTo(this.features);
        L.polyline(coords,{color:'#268b58',weight:5,opacity:.96,
          dashArray:'7 11',className:'day-schematic-route'})
          .addTo(this.features)
          .bindTooltip(labelNode('Tagesideen · schematische Luftlinie, keine berechnete Fußroute'));
        if(!quietMotion())L.polyline(coords,{color:'#edffd0',weight:3,
          opacity:.96,dashArray:'2 20',interactive:false,
          className:'day-schematic-flow'}).addTo(this.features);
      }
      for(const point of previewPoints)this.marker(point.point,point.id,
        point.ordinal+'. Tagesidee: '+point.name+' · nicht gebucht',point.ordinal,
        'draft',()=>this.handlers.select(point.id));
    }
    if (explorer?.placed?.length) {
      this.poiItems = explorer.placed.filter(item => Array.isArray(item.point)
        && item.point.length === 2 && item.point.every(Number.isFinite)
        && !this.markers.has(item.explorerId ?? item.id));
      area.push(...this.poiItems.map(item=>item.point));
      this.paintExplorerPins();
    }
    if (explorer?.nearby?.point && !total) {
      const n=explorer.nearby;
      this.nearbyCircle=L.circle(n.point,{radius:n.radiusKm*1000,color:'#0b9378',
        weight:2,opacity:.9,fillColor:'#19ac8b',fillOpacity:.08,
        dashArray:'7 9',className:'explorer-nearby-ring'}).addTo(this.features);
      L.circleMarker(n.point,{radius:7,color:'#fff',weight:3,fillColor:'#0b9378',fillOpacity:1})
        .addTo(this.features).bindTooltip(labelNode('Umkreiszentrum: '+n.name));
    }
    // Deliberately one city-reference cluster for many unlocated records,
    // never pretend that an accommodation or POI is at the city centre.
    // A cluster is not stored in this.markers and cannot be used as a route point.
    for (const row of explorerUnlocatedCityClusters(explorer, cities)) {
      const legend=document.createElement('span');
      legend.className='city-reference-count';
      legend.textContent=String(row.count);
      const icon=L.divIcon({className:'city-reference-icon',html:legend.outerHTML,
        iconSize:[60,44],iconAnchor:[-20,22]});
      const title=row.name+': '+row.count+' Einträge nur mit Stadtbezug – keine bestätigten POI-Koordinaten';
      const marker=L.marker(row.point,{icon,title,alt:title,keyboard:true,
        zIndexOffset:-100}).addTo(this.features);
      const examples=row.exampleNames.join(' · ');
      marker.bindTooltip(labelNode(title + (examples?' · Beispiele: '+examples:'')),
        {direction:'top'});
      marker.on('click',()=>this.handlers.visitCity(row.city));
      if(!area.length) area.push(row.point);
    }
    // Live Route Studio: actual walking geometry when verified by the routing
    // service, otherwise only a clearly dashed straight line. Never use a
    // schematic line for minutes, budget or journey-distance calculations.
    if (explorer && !total && dayRoute?.items?.length) {
      const studio = routeStudioModel(dayRoute.items, dayRoute.routes, dayRoute.focusIndex);
      if (studio.stops.every(stop=>stop.city===city)) {
        this.storyStops = studio.stops;
        this.storySegments = studio.legs;
        const spotlight = dayRoute.displayMode === 'focus';
        studio.legs.forEach(leg=>{
          if (leg.points.length<2) return;
          const active = leg.index===studio.activeLeg;
          const faint = spotlight && !active;
          const line = L.polyline(leg.points,{
            color:leg.verified?'#ffffff':'#f8e6c4',
            weight:leg.verified?(active?11:8):6,
            opacity:faint ? 0.35 : 0.9,
            interactive:false,
            className:'route-studio-halo',
            dashArray:leg.verified?null:'5 10',
          }).addTo(this.features);
          const top = L.polyline(leg.points,{
            color:leg.verified?(active?'#00ad82':'#16a085'):'#b97a27',
            weight:leg.verified?(active?7:5):3.5,
            opacity:faint ? 0.3 : 0.98,
            dashArray:leg.verified?null:'5 10',
            className:'route-studio-map-line'+(active?' current':'')
              +(leg.verified?' measured':' schematic'),
          }).addTo(this.features);
          // A visibly narrow SVG stroke was not clickable: top is rendered
          // non-interactive. A transparent wide hit target makes the chosen
          // section selectable by touch without changing the map appearance.
          const routeHit=L.polyline(leg.points,{
            color:'#ffffff',weight:19,opacity:.001,interactive:true,
            className:'route-studio-hit-target'
          }).addTo(this.features);
          routeHit.bindTooltip(labelNode(leg.verified
            ? 'Berechneter Fußweg · '+leg.minutes+' Min. · '+Math.round(leg.metres)+' m · zum Stopp'
            : 'Schematische Luftlinie · keine berechnete Gehzeit · zum Stopp'));
          routeHit.on('click',()=>this.handlers.routeStop?.(leg.index+1));
          if (leg.verified && active && !quietMotion()) {
            L.polyline(leg.points,{
              color:'#eafff8',weight:3,opacity:.88,dashArray:'2 17',
              className:'route-studio-map-flow',interactive:false,
            }).addTo(this.features);
          }
          // Route-length midpoint, not a misleading straight-line label.
          // Show duration only for a real routed segment; unverified endpoint
          // provenance is still disclosed in the Route Studio panel.
          if(leg.verified && active){
            const direction=routeDirectionAt(leg.points,.73);
            if(direction){
              L.marker(direction.point,{icon:routeArrowIcon(direction.bearing),
                interactive:false,keyboard:false,zIndexOffset:1050}).addTo(this.features);
            }
            const at=pointAlongRoute(leg.points,.5);
            if(at){
              const text=Math.round(leg.minutes)+' Min · '+Math.round(leg.metres)+' m';
              const icon=L.divIcon({className:'route-studio-time-icon',
                html:'<span class="route-studio-time-pill" aria-hidden="true">'
                  +'<span class="route-studio-time-walk">🚶</span>'+text+'</span>',
                iconSize:[128,34],iconAnchor:[64,17]});
              L.marker(at,{icon,interactive:false,keyboard:false,
                zIndexOffset:1100}).addTo(this.features);
            }
          }
          this.storyBounds.push(...leg.points);
        });
        studio.stops.forEach((stop,i)=>{
          if (!Array.isArray(stop.point)||stop.point.length!==2)return;
          const active = studio.selectedIndex===i;
          const html='<span class="route-studio-map-pin'+(active?' selected':'')
            +'" aria-hidden="true">'+(i+1)+'</span>';
          const icon=L.divIcon({className:'route-studio-pin-icon',html,
            iconSize:[38,38],iconAnchor:[19,35]});
          const marker=L.marker(stop.point,{icon,keyboard:true,
            zIndexOffset:active?2200:1700,title:(i+1)+'. '+stop.name,
            alt:(i+1)+'. '+stop.name}).addTo(this.features);
          marker.bindTooltip(labelNode((i+1)+'. '+stop.name),
            {direction:'top',offset:[0,-28]});
          marker.on('click',()=>this.handlers.routeStop?.(i));
          this.storyBounds.push(stop.point);
        });
        area.push(...this.storyBounds);
      }
    }
    if (explorer?.connection?.route?.walkOnly===true
      && explorer.connection.route?.points?.length > 1) {
      const route = explorer.connection.route;
      const points = route.points.filter(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
      if (points.length > 1) {
        L.polyline(points,{color:'#ffffff',weight:10,opacity:.85,interactive:false})
          .addTo(this.features);
        L.polyline(points, {color:'#0c977b',weight:6,opacity:.95,
          className:'explorer-walk-line route-studio-map-line measured current'})
          .addTo(this.features)
          .bindTooltip(labelNode('Berechneter Fußweg · ' + route.minutes + ' Min. · ' + route.metres + ' m'));
        if (!quietMotion()) L.polyline(points,{color:'#eafff8',weight:3,
          opacity:.9,dashArray:'2 17',interactive:false,
          className:'route-studio-map-flow'}).addTo(this.features);
        const direction=routeDirectionAt(points,.73);
        if(direction){
          L.marker(direction.point,{icon:routeArrowIcon(direction.bearing),
            interactive:false,keyboard:false,zIndexOffset:1050}).addTo(this.features);
          if(Number.isFinite(route.minutes)&&Number.isFinite(route.metres)){
            const at=pointAlongRoute(points,.5);
            if(at){
              const value=Math.round(route.minutes)+' Min · '+Math.round(route.metres)+' m';
              const badge=L.divIcon({className:'route-studio-time-icon',
                html:'<span class="route-studio-time-pill" aria-hidden="true">'
                  +'<span class="route-studio-time-walk">🚶</span>'+value+'</span>',
                iconSize:[128,34],iconAnchor:[64,17]});
              L.marker(at,{icon:badge,interactive:false,keyboard:false,
                zIndexOffset:1100}).addTo(this.features);
            }
          }
        }
        area.push(...points);
      }
    }
    if (explorer?.connection?.route?.legs?.length) {
      area.push(...this.paintJourney(explorer.connection.route, true));
    }
    if (explorer?.connection?.from?.point && explorer?.connection?.to?.point) {
      for (const [point, color, title] of [
        [explorer.connection.from.point, '#15803d', 'Start'],
        [explorer.connection.to.point, '#be123c', 'Ziel']]) {
        L.circleMarker(point,{radius:9,color:'#ffffff',weight:3,fillColor:color,fillOpacity:1})
          .addTo(this.features).bindTooltip(labelNode(title));
        area.push(point);
      }
    }
    if (!total && cities[city]?.country === 'CH' && filters.hiking) this.hiking.addTo(this.map);
    else this.hiking.remove();
    this.paintTransit(city, total ? {} : filters.transit);
    if(previewPoints.length>=2&&!explorer?.nearby)
      area.splice(0,area.length,...previewPoints.map(point=>point.point));
    if(!total&&hikeRoute?.segments?.length){
      const trailPoints=[];
      for(const segment of hikeRoute.segments){
        const points=segment.map(p=>p.slice(0,2));
        L.polyline(points,{color:'#ffffff',weight:9,opacity:.9,interactive:false}).addTo(this.features);
        L.polyline(points,{color:'#166749',weight:5,opacity:1,className:'hiking-source-track'})
          .addTo(this.features).bindTooltip(labelNode(hikeRoute.title+' · Original-GPX · Wegstatus separat prüfen'));
        trailPoints.push(...points);
      }
      for(const [point,label] of [[trailPoints[0],'Tourstart'],[trailPoints.at(-1),'Tourende']])
        L.circleMarker(point,{radius:7,color:'#ffffff',weight:2,fillColor:'#166749',fillOpacity:1})
          .addTo(this.features).bindTooltip(labelNode(label+' · GPX-Quellpunkt, Zugang separat prüfen'));
      area.splice(0,area.length,...trailPoints);
    }
    if (!area.length && cities[city]?.point) area.push(cities[city].point);
    this.bounds = area;
  }


  stopDayJourneyMotion(){
    if(this.journeyFrame!=null)cancelAnimationFrame(this.journeyFrame);
    this.journeyFrame=null;
    const stop=this.dayJourney?.stops[this.journeyFocus];
    if(stop?.point&&this.journeyDot)this.journeyDot.setLatLng(stop.point);
  }

  paintDayJourney(model){
    this.dayJourney=model;this.journeyPins=new Map();
    for(const leg of model.legs){
      if(!leg.points.length)continue;
      const routed=leg.type==='routed',transfer=leg.type==='transfer';
      L.polyline(leg.points,{color:'#fff',weight:8,opacity:.8,interactive:false}).addTo(this.features);
      L.polyline(leg.points,{color:routed?'#16845b':transfer?'#71598c':'#748397',weight:4,opacity:.94,
        dashArray:routed?null:'6 9',className:routed?'day110-routed':transfer?'day110-transfer':'day110-schematic'})
        .addTo(this.features).bindTooltip(labelNode(routed?'Berechneter Fußweg · '+leg.minutes+' Min.':transfer?'Vorläufiger Transfer · keine Bahngleise':'Schematische Luftlinie · keine Gehzeit'));
    }
    for(const stop of model.stops){
      if(!stop.point)continue;
      const icon=L.divIcon({className:'day110-map-icon',html:'<span class="day110-map-pin">'+stop.ordinal+'</span>',
        iconSize:[27,27],iconAnchor:[13,13]});
      const marker=L.marker(stop.point,{icon,keyboard:true,title:stop.ordinal+'. '+stop.name,alt:stop.name})
        .addTo(this.features).bindTooltip(labelNode(stop.ordinal+'. '+stop.name+' · '+(stop.transfer?'Transfer · 2027 ungeprüft':stop.selected?'Im Plan':'Vorschlag')));
      marker.on('click',()=>this.handlers.dayJourneyStop?.(stop.index));
      this.journeyPins.set(stop.index,marker);
    }
  }

  focusDayJourney(index,{animate=true}={}){
    if(!this.dayJourney)return false;
    const stop=this.dayJourney.stops[index];
    if(!stop)return false;
    this.stopDayJourneyMotion();
    const previous=this.journeyFocus;this.journeyFocus=index;
    for(const [i,marker] of this.journeyPins){
      marker.getElement()?.classList.toggle('day110-current',i===index);
      marker.setZIndexOffset(i===index?1800:0);
    }
    if(this.journeyDot){this.features.removeLayer(this.journeyDot);this.journeyDot=null;}
    if(!stop.point)return false;
    const leg=previous===index-1?this.dayJourney.legs[previous]:null;
    const points=leg?.points;
    const canAnimate=animate&&!quietMotion()&&points?.length>=2;
    this.journeyDot=L.circleMarker(canAnimate?points[0]:stop.point,{radius:6,color:'#fff',weight:2,
      fillColor:'#1469ca',fillOpacity:1,interactive:false,className:'day110-position-dot'}).addTo(this.features);
    this.map.panTo(stop.point,{animate:animate&&!quietMotion(),duration:.45});
    if(canAnimate){
      const start=performance.now(),dot=this.journeyDot;
      const tick=now=>{
        if(this.journeyDot!==dot||this.destroyed)return;
        const fraction=Math.min(1,(now-start)/1250);
        const p=pointAlongRoute(points,fraction);
        if(p)dot.setLatLng(p);
        if(fraction<1)this.journeyFrame=requestAnimationFrame(tick);
        else {dot.setLatLng(stop.point);this.journeyFrame=null;}
      };
      this.journeyFrame=requestAnimationFrame(tick);
    }
    this.journeyPins.get(index)?.openTooltip();
    return true;
  }

  // Leaflet zoom clustering only groups real recorded POI points. A cluster
  // is a visual aggregate, never a geocoded building, address or route stop.
  paintExplorerPins() {
    if (!this.poiLayer) return;
    this.poiLayer.clearLayers();
    for (const id of this.poiKeys ?? []) this.markers.delete(id);
    this.poiKeys = new Set();
    if (!this.poiItems?.length) return;
    const zoom=this.map.getZoom();
    const policy=poiDensityPolicy(zoom,this.poiDensity);
    let photoBubbleCount=0;
    const shownPhotoCells=new Set();
    // Group only existing source-record points by screen-space density.
    // The focused POI stays selectable; no cluster is written to trip data.
    // Marker DOM is the expensive layer: render only currently visible POIs.
    // Keep all source records in poiItems for search, selection and fit bounds.
    const visible=this.map.getBounds?.().pad(.22);
    const onScreen=visible?this.poiItems.filter(item=>visible.contains(item.point)):this.poiItems;
    const buckets=groupPoiForDisplay(onScreen,zoom,
      point=>this.map.project(point,zoom),{
        mode:this.poiDensity,focusedId:this.poiFocused
      });
    for(const items of buckets.values()){
      if(policy.clusterPixels>0&&items.length>1){
        const center=[items.reduce((s,x)=>s+x.point[0],0)/items.length,
          items.reduce((s,x)=>s+x.point[1],0)/items.length];
        const count=items.length;
        const savedCount=items.filter(item=>this.poiSaved?.has(item.id)).length;
        const kinds=items.map(item=>item.explorerCategory??explorerCategory(item));
        const commonKind=kinds.every(kind=>kind===kinds[0])?kinds[0]:'mixed';
        const bubble=document.createElement('span');
        bubble.className='poi-cluster-count group-'+commonKind;
        // A shared category gets a recognizable miniature icon; mixed
        // clusters display only their true item count, never a false type.
        bubble.innerHTML=(commonKind!=='mixed'&&count<100
          ?mapCategoryIcon(commonKind):'')+'<strong>'+count+'</strong>';
        if(savedCount){
          const savedDot=document.createElement('em');
          savedDot.className='poi-cluster-saved';
          savedDot.textContent='♥';
          bubble.appendChild(savedDot);
        }
        const icon=L.divIcon({className:'poi-cluster-icon',html:bubble.outerHTML,
          iconSize:[46,46],iconAnchor:[23,23]});
        const label=count+' eingetragene Orte · nur Bildschirm-Sammelmarker, kein eigener Ort'
          +(savedCount?' · '+savedCount+' gemerkt':'');
        const marker=L.marker(center,{icon,title:label,alt:label,keyboard:true})
          .addTo(this.poiLayer).bindTooltip(labelNode(label+' · Zum Aufteilen anklicken'));
        marker.on('click',()=>{
          const before=this.map.getZoom();
          this.map.fitBounds(items.map(x=>x.point),{padding:[50,50],maxZoom:Math.min(17,before+4),animate:false});
          if(this.map.getZoom()<=before)this.map.setZoom(Math.min(17,before+2));
        });
        continue;
      }
      items.forEach((item,i)=>{
        const id=item.explorerId??item.id;
        const category=item.explorerCategory??explorerCategory(item);
        const iconType=mapIconForPlace(item,category);
        const provenance=markerProvenance(item);
        const photo=curatedPlacePhoto(item);
        const pixel=this.map.project(item.point,zoom);
        const photoCell=Math.floor(pixel.x/policy.photoCellPixels)
          +':'+Math.floor(pixel.y/policy.photoCellPixels);
        const allowedPhoto=Boolean(photo)&&!shownPhotoCells.has(photoCell)
          &&photoBubbleCount<policy.photoLimit;
        const tier=markerTier(zoom,allowedPhoto,photoBubbleCount);
        if(tier==='photo'){photoBubbleCount++;shownPhotoCells.add(photoCell)}
        const content=bubbleMarkup({
          id,name:item.name,category,photoUrl:tier==='photo'?photo?.url:null,
          rating:item.rating??item.providerRating??null,
          saved:this.poiSaved?.has(item.id),tier,iconType,
        });
        const width=tier==='photo'?132:tier==='dot'?19:40;
        const height=tier==='photo'?132:tier==='dot'?19:40;
        const offset=(i-(items.length-1)/2)*Math.min(width,22);
        const icon=L.divIcon({className:'photo-marker-container tier-'+tier+' provenance-'+provenance.kind,
          html:content,iconSize:[width,height],
          iconAnchor:[width/2-offset,tier==='photo'?112:height/2]});
        const marker=L.marker(item.point,{icon,keyboard:true,
          title:item.name+' · '+provenance.label,
          alt:item.name+' · '+provenance.label,zIndexOffset:this.poiFocused===id?2300:950})
          .addTo(this.poiLayer);
        // Keep the tooltip compact on a phone. Full coordinate provenance
        // remains in the marker's accessible title and detailed place profile.
        marker.bindTooltip(labelNode(item.name),{
          direction:'top',className:'map-poi-tooltip'
        });
        marker.on('click',()=>this.handlers.select(id));
        marker.on('mouseover',()=>this.handlers.hover?.(id,true));
        marker.on('mouseout',()=>this.handlers.hover?.(id,false));
        this.markers.set(id,marker);
        this.poiKeys.add(id);
      });
    }
  }

  selectMarkerOnly(id){
    // Selection must not refetch the basemap or reconstruct every POI icon.
    this.poiFocused=id;
    for(const [key,marker] of this.markers){
      const selected=key===id;
      const el=marker.getElement?.();
      el?.classList.toggle('is-map-focused',selected);
      el?.querySelector('.pin')?.classList.toggle('focused',selected);
      marker.setZIndexOffset?.(selected?2300:(this.poiKeys.has(key)?950:0));
    }
  }

  focusNearby() {
    if(!this.nearbyCircle)return false;
    this.map.invalidateSize({pan:false});
    this.map.fitBounds(this.nearbyCircle.getBounds(),{padding:[35,35],maxZoom:15,animate:false});
    return true;
  }

  paintJourney(route, preview, click) {
    const points = [];
    for (const leg of route.legs) {
      const color = /^[\da-f]{6}$/i.test(leg.color ?? '') && leg.color.toUpperCase() !== 'FFFFFF' ? '#' + leg.color : '#6251a0';
      const label = leg.mode + ' ' + leg.name;
      const when = instant => localParts(instant, route.zone).time;
      const description = label + ' · ' + when(leg.departure) + ' ' + leg.from.name + ' → ' + when(leg.arrival) + ' ' + leg.to.name;
      if (leg.points?.length > 1) {
        const line = L.polyline(leg.points, { color, weight: 5, opacity: .86, dashArray: preview ? '9 6' : null,
          className: preview ? 'timetable-preview-line' : 'timetable-line' }).addTo(this.features);
        line.bindTooltip(labelNode(description));
        if (click) line.on('click', click);
        points.push(...leg.points);
      }
      for (const [stop, time] of [[leg.from, leg.departure], [leg.to, leg.arrival]]) {
        L.circleMarker(stop.point, { radius: 5, color, weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(this.features)
          .bindTooltip(labelNode(label + ' · ' + when(time) + ' ' + stop.name));
        points.push(stop.point);
      }
    }
    return points;
  }

  paintTransit(city, filters) {
    const key = city + JSON.stringify(filters);
    if (key === this.transitKey) return;
    this.transitKey = key;
    this.transit.clearLayers();
    for (const credit of this.transitCredits ?? []) this.map.attributionControl.removeAttribution(credit);
    this.transitCredits = new Set();
    const network = transitNetworks[city];
    if (!network) return;
    for (const [name, group] of Object.entries(network.groups)) {
      if (!filters?.[name]) continue;
      for (const file of group.files) dataFile(file).then(data => {
        if (key !== this.transitKey) return;
        const station = file.endsWith('-stops');
        const supplement = group.supplement?.file === file ? group.supplement : null;
        const label = f => {
          const p = f.properties;
          return p.NOM || p.Nom || p.NOMBRE || p.NAME || p.LINEA || p.LINIA || p.Nom_Linea_ || group.title;
        };
        L.geoJSON(data, {
          filter: f => f.geometry && !/previst|futur|projec|en obres/i.test(f.properties.Estat ?? f.properties.Est_onat ?? ''),
          style: f => {
            const feedColor = f.properties.color;
            const color = /^[\da-f]{6}$/i.test(feedColor ?? '') && feedColor.toUpperCase() !== 'FFFFFF' ? '#' + feedColor : null;
            return { color: color ?? (city === 'barcelona' ? metroColors[f.properties.NAME] : null) ?? group.color,
              weight: name === 'bus' ? 2 : 3, opacity: name === 'bus' ? .5 : .77 };
          },
          pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 3.2, weight: 1, color: group.color, fillColor: '#fff', fillOpacity: 1 }),
          onEachFeature: (f, layer) => {
            const suffix = station && (f.properties.LINIA_METR || f.properties.Linies) ? ' · ' + (f.properties.LINIA_METR || f.properties.Linies) : '';
            const description = f.properties.description ? ' · ' + f.properties.description : '';
            layer.bindTooltip(labelNode(label(f) + suffix + description + ' · ' + (f.properties.source ?? supplement?.provider ?? network.dateLabel ?? network.provider)));
          },
        }).addTo(this.transit);
        const credit = '<a href="' + (supplement?.source ?? network.attribution) + '" target="_blank" rel="noopener">Netzdaten '
          + (supplement?.provider ?? network.provider) + '</a>';
        if (!this.transitCredits.has(credit)) {
          this.transitCredits.add(credit);
          this.map.attributionControl.addAttribution(credit);
        }
      }).catch(() => {
        layersCache.delete(file);
        if (key === this.transitKey) this.handlers.report(group.title + ': Kartenebene nicht verfügbar.');
      });
    }
  }

  playCityStory(trip,cities,items=[],activeIds=new Set(),{immersive=false}={}){
    const stops=buildCityArrivalScenes(storyCityStops(trip,cities),items,activeIds);
    if(stops.length<2)return false;
    this.map.invalidateSize({pan:false});
    // Visible city symbols and the bottom playback HUD need some map breathing room.
    this.map.fitBounds(stops.map(stop=>stop.point),{
      paddingTopLeft:[48,142],paddingBottomRight:[48,162],
      maxZoom:8,animate:false,
    });
    return this.cityStory.play(stops.map(s=>({...s,previewDays:(trip.dayPlansV32??[]).filter(d=>d.city===s.id).length})),{immersive});
  }

  pauseCityStory(){return this.cityStory.pause();}
  resumeCityStory(){return this.cityStory.resume();}
  stopCityStory(){this.cityStory.stop();}
  storyState(){return this.cityStory.state();}
  storySpeed(speed){return this.cityStory.setSpeed(speed);}
  seekCityStory(index){return this.cityStory.seek(index);}
  seekCityStoryTime(ms){return this.cityStory.seekTime(ms);}

  fit() {
    this.map.invalidateSize({ pan: false });
    if (this.bounds?.length > 1) this.map.fitBounds(this.bounds, { padding: [35, 35], maxZoom: 15, animate: false });
    else if (this.bounds?.length) this.map.setView(this.bounds[0], 13, { animate: false });
    // Leaflet's responsive raster is available immediately; optional vector
    // scenery upgrades without holding up the first real map interaction.
    if(!this.offlineMap&&!this.basemapBooted){
      this.basemapBooted=true;
      this.useRasterFallback();
      void this.startBasemap();
    }
  }

  focusStudio() {
    if (!this.storyBounds?.length)return false;
    this.map.invalidateSize({pan:false});
    if(this.storyBounds.length>1) this.map.fitBounds(this.storyBounds,
      {padding:[54,54],maxZoom:16,animate:false});
    else this.map.setView(this.storyBounds[0],15,{animate:false});
    return true;
  }

  focusStudioStop(index) {
    const stop=this.storyStops?.[index];
    if(!stop?.point)return false;
    this.map.invalidateSize({pan:false});
    this.map.setView(stop.point,Math.max(13,Math.min(this.map.getZoom(),17)),
      {animate:false});
    return true;
  }

  focusConnection(a, b) {
    if (!a || !b) return;
    this.map.invalidateSize({pan: false});
    this.map.fitBounds([a,b], { padding: [58,58], maxZoom: 15, animate: false });
  }

  focus(id) {
    let marker=this.markers.get(id);
    if(!marker){
      const item=this.poiItems?.find(x=>(x.explorerId??x.id)===id);
      if(item?.point){
        this.map.setView(item.point,Math.max(14,this.map.getZoom()),{animate:false});
        this.paintExplorerPins();
        marker=this.markers.get(id);
      }
    }
    if(!marker)return;
    // Only user-initiated selection receives a short camera easing. Initial
    // fit, itinerary rerender and automatic map-size changes remain instant.
    this.map.panTo(marker.getLatLng(),{animate:!quietMotion(),duration:.24,easeLinearity:.4});
    marker.openTooltip();
  }

  destroy() {
    // Cancel asynchronous vector imports before detaching the Leaflet pane.
    this.destroyed=true;
    this.basemapAttempt++;
    if(this.vectorGL&&this.vectorGLOnError)
      this.vectorGL.off?.('error',this.vectorGLOnError);
    this.map.stop();
    this.stopDayJourneyMotion();
    this.cityStory.destroy();
    this.map.remove();
  }
}
