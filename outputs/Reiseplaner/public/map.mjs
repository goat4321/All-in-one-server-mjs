import { transitNetworks } from './transit.mjs';
import { localParts } from './model.mjs';
import { explorerCategory } from './map-explorer.mjs';

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
  constructor(element, { focus, select, leg, visitCity, report }) {
    this.handlers = { focus, select, leg, visitCity, report };
    this.map = L.map(element, { zoomControl: true, scrollWheelZoom: false, preferCanvas: false, fadeAnimation: false, minZoom: 3, maxZoom: 19 });
    this.map.zoomControl.setPosition('bottomright');
    this.map.attributionControl.setPrefix(false);
    this.features = L.layerGroup().addTo(this.map);
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

  marker(point, id, text, number, style, click, offset = 0) {
    const icon = L.divIcon({ className: '', html: '<span class="pin ' + style + '"><span>' + number + '</span></span>',
      iconSize: [30, 30], iconAnchor: [14 - offset, 29] });
    const marker = L.marker(point, { icon, title: text, alt: text, keyboard: true,
      zIndexOffset: style.includes('focused') ? 1000 : 0 }).addTo(this.features);
    marker.bindTooltip(labelNode(text), { direction: 'top', offset: [offset, -22] });
    marker.on('click', click);
    this.markers.set(id, marker);
    return marker;
  }

  paint({ trip, city, cities, entries, stops, dayTravel, routes, options, total, filters, focused, timetablePreview, explorer = null }) {
    this.city = city;
    this.features.clearLayers();
    this.markers.clear();
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
      if (filters.stations) for (const [departure, arrival] of dayTravel) {
        const line = L.polyline([departure.point, arrival.point], { color: '#71598c', weight: 3, dashArray: '7 8' }).addTo(this.features);
        line.bindTooltip(labelNode(departure.name + ' · schematischer Verlauf'));
        line.on('click', () => this.handlers.select(departure.entryKey));
      }
      if (filters.walk) routes.forEach((route, i) => {
        if (!route?.points?.length) return;
        const line = L.polyline(route.points, { color: '#24765a', weight: 4, opacity: .86 }).addTo(this.features);
        line.bindTooltip(labelNode(route.mode + ' · ' + route.minutes + ' Min.'));
        line.on('click', () => this.handlers.leg(i));
        area.push(...route.points);
      });
      routes.forEach((route, i) => {
        if (route?.legs?.length) area.push(...this.paintJourney(route, false, () => this.handlers.leg(i)));
      });
      if (timetablePreview) area.push(...this.paintJourney(timetablePreview.route, true));
      const all = [...stops, ...(filters.options && !explorer ? options : [])];
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
      // Existing markers from the day view are reused instead of drawn twice.
      // In the trip-wide mode the city anchors remain separate from POIs.
      const located = explorer.placed.filter(item => Array.isArray(item.point) && item.point.length === 2
        && !this.markers.has(item.explorerId ?? item.id));
      const grouped = Map.groupBy(located, item => item.point.map(value => value.toFixed(5)).join(','));
      for (const cluster of grouped.values()) cluster.forEach((item, index) => {
        const key = item.explorerId ?? item.id;
        const category = item.explorerCategory ?? 'activity';
        const offset = (index - (cluster.length - 1) / 2) * 24;
        this.marker(item.point, key, item.name, {lodging:'H',food:'R',shop:'S',activity:'A',transport:'B'}[category],
          'place-' + category + ' explorer-pin' + (focused === key ? ' focused' : ''),
          () => this.handlers.select(key), offset);
        area.push(item.point);
      });
    }
    if (explorer?.connection?.route?.points?.length > 1) {
      const route = explorer.connection.route;
      const points = route.points.filter(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
      if (points.length > 1) {
        L.polyline(points, {color:'#0c977b',weight:6,opacity:.95,className:'explorer-walk-line'})
          .addTo(this.features)
          .bindTooltip(labelNode('Berechneter Fußweg · ' + route.minutes + ' Min. · ' + route.metres + ' m'));
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

  focusConnection(a, b) {
    if (!a || !b) return;
    this.map.invalidateSize({pan: false});
    this.map.fitBounds([a,b], { padding: [58,58], maxZoom: 15, animate: false });
  }

  focus(id) {
    const marker = this.markers.get(id);
    if (!marker) return;
    this.map.panTo(marker.getLatLng(), { animate: !quietMotion(), duration: .25 });
    marker.openTooltip();
  }

  destroy() { this.map.remove(); }
}
