import { transitNetworks } from './transit.mjs';
import { localParts } from './model.mjs';
import { explorerCategory, explorerUnlocatedCityClusters } from './map-explorer.mjs';
import { routeStudioModel } from './route-studio.mjs';

const metroColors = { L1: '#c8102e', L2: '#93328e', L3: '#368729', L4: '#b88600', L5: '#0072cf', L9: '#e75400', L10: '#077daf', L11: '#568508' };
const layersCache = new Map();
const quietMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const labelNode = label => {
  const el = document.createElement('span');
  el.textContent = label;
  return el;
};

function dataFile(file) {
  if (!layersCache.has(file)) layersCache.set(file, fetch('/transit/' + file + '.geojson').then(response => {
    if (!response.ok) throw new Error('Kartenebene fehlt.');
    return response.json();
  }));
  return layersCache.get(file);
}

export class TripMap {
  constructor(element, { focus, select, leg, visitCity, report, routeStop, hover }) {
    this.handlers = { focus, select, leg, visitCity, report, routeStop, hover };
    this.map = L.map(element, { zoomControl: true, scrollWheelZoom: false,
      preferCanvas: false, fadeAnimation: false, zoomAnimation: false,
      markerZoomAnimation: false, minZoom: 3, maxZoom: 19 });
    this.map.zoomControl.setPosition('bottomright');
    this.map.attributionControl.setPrefix(false);
    this.features = L.layerGroup().addTo(this.map);
    this.poiLayer = L.layerGroup().addTo(this.map);
    this.poiItems = []; this.poiKeys = new Set(); this.poiProfileCtx = null;
    this.map.on('zoomend', () => this.paintExplorerPins());
    this.transit = L.layerGroup().addTo(this.map);
    this.markers = new Map();
    const grid = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>',
      maxZoom: 19, keepBuffer: 1, updateWhenIdle: true,
    });
    let failures = 0;
    grid.on('tileload', () => { failures = 0; report(''); });
    grid.on('tileerror', () => {
      if (++failures > 2) report('Straßenkacheln derzeit nicht erreichbar · Orte und gespeicherte Wege bleiben sichtbar');
    });
    if (!new URLSearchParams(location.search).has('offlineMap')) grid.addTo(this.map);
    else this.map.attributionControl.addAttribution(grid.options.attribution);
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

  marker(point, id, text, number, style, click, offset = 0, popupHtml = null, group = this.features) {
    const icon = L.divIcon({ className: '', html: '<span class="pin ' + style + '"><span>' + number + '</span></span>',
      iconSize: [30, 30], iconAnchor: [14 - offset, 29] });
    const marker = L.marker(point, { icon, title: text, alt: text, keyboard: true,
      zIndexOffset: style.includes('focused') ? 1000 : 0 }).addTo(group);
    marker.bindTooltip(labelNode(text), { direction: 'top', offset: [offset, -22] });
    marker.on('click', click);
    marker.on('mouseover',()=>this.handlers.hover?.(id,true));
    marker.on('mouseout',()=>this.handlers.hover?.(id,false));
    if (popupHtml) marker.bindPopup(popupHtml, { maxWidth: 320, minWidth: 230, closeButton: true });
    this.markers.set(id, marker);
    return marker;
  }

  paint({ trip, city, cities, entries, stops, dayTravel, routes, options, total, filters, focused, timetablePreview, explorer = null, dayRoute = null, profileCtx = null }) {
    this.city = city;
    this.features.clearLayers();
    this.poiLayer.clearLayers();
    this.markers.clear(); this.poiKeys.clear(); this.poiItems = [];
    this.poiProfileCtx = profileCtx; this.poiFocused = focused; this.nearbyCircle = null;
    this.poiSaved=explorer?.saved??new Set();
    this.storyStops = [];
    this.storySegments = [];
    this.storyBounds = [];
    const area = [];
    if (total) {
      const ordered = trip.route.filter(id => cities[id]?.point);
      const coords = ordered.map(id => cities[id].point);
      L.polyline(coords, { color: '#71598c', weight: 4, opacity: .9, dashArray: '7 8' }).addTo(this.features)
        .bindTooltip(labelNode('Reihenfolge der Originalroute · schematischer Verlauf'));
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
      legend.textContent='?'+row.count;
      const icon=L.divIcon({className:'city-reference-icon',html:legend.outerHTML,
        iconSize:[52,36],iconAnchor:[-19,18]});
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
          top.bindTooltip(labelNode(leg.verified
            ? 'Berechneter Fußweg · '+leg.minutes+' Min. · '+Math.round(leg.metres)+' m'
            : 'Schematische Luftlinie · keine berechnete Gehzeit'));
          top.on('click',()=>this.handlers.routeStop?.(leg.index+1));
          if (leg.verified && active && !quietMotion()) {
            L.polyline(leg.points,{
              color:'#eafff8',weight:3,opacity:.88,dashArray:'2 17',
              className:'route-studio-map-flow',interactive:false,
            }).addTo(this.features);
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
    if (explorer?.connection?.route?.points?.length > 1) {
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
    if (!area.length && cities[city]?.point) area.push(cities[city].point);
    this.bounds = area;
  }

  // Leaflet zoom clustering only groups real recorded POI points. A cluster
  // is a visual aggregate, never a geocoded building, address or route stop.
  paintExplorerPins() {
    if (!this.poiLayer) return;
    this.poiLayer.clearLayers();
    for (const id of this.poiKeys ?? []) this.markers.delete(id);
    this.poiKeys = new Set();
    if (!this.poiItems?.length) return;
    const zoom=this.map.getZoom(),clustered=zoom<=12;
    const buckets=new Map();
    for(const item of this.poiItems){
      const p=item.point,xy=this.map.project(p,zoom);
      const key=clustered
        ? item.city+':'+Math.floor(xy.x/70)+':'+Math.floor(xy.y/70)
        :p.map(n=>n.toFixed(5)).join(',');
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(item);
    }
    for(const items of buckets.values()){
      if(clustered&&items.length>1){
        const center=[items.reduce((s,x)=>s+x.point[0],0)/items.length,
          items.reduce((s,x)=>s+x.point[1],0)/items.length];
        const count=items.length;
        const savedCount=items.filter(item=>this.poiSaved?.has(item.id)).length;
        const bubble=document.createElement('span');
        bubble.className='poi-cluster-count';
        bubble.textContent=String(count)+(savedCount?' ★':'');
        const icon=L.divIcon({className:'poi-cluster-icon',html:bubble.outerHTML,
          iconSize:[46,46],iconAnchor:[23,23]});
        const label=count+' eingetragene Kartenpunkte (Sammelansicht, keine genaue Einzelposition)'
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
        const id=item.explorerId??item.id,category=item.explorerCategory??'activity';
        const offset=(i-(items.length-1)/2)*24;
        this.marker(item.point,id,item.name,
          {lodging:'H',food:'R',shop:'S',activity:'A',transport:'B'}[category],
          'place-'+category+' explorer-pin'+(this.poiFocused===id?' focused':'')
            +(this.poiSaved?.has(item.id)?' bookmarked':''),
          ()=>this.handlers.select(id),offset,
          null,this.poiLayer);
        this.poiKeys.add(id);
      });
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

  fit() {
    this.map.invalidateSize({ pan: false });
    if (this.bounds?.length > 1) this.map.fitBounds(this.bounds, { padding: [35, 35], maxZoom: 15, animate: false });
    else if (this.bounds?.length) this.map.setView(this.bounds[0], 13, { animate: false });
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
    this.map.panTo(marker.getLatLng(),{animate:false});
    marker.openTooltip();
  }

  destroy() {
    // render() replaces this entire Leaflet instance. Stop pending camera
    // transitions before removal so rapid route/stop clicks cannot call
    // Leaflet positioning on a detached DOM pane.
    this.map.stop();
    this.map.remove();
  }
}
