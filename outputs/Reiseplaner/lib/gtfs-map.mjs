import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { parseDelimited } from './store.mjs';

const collection = features => ({ type: 'FeatureCollection', features });
const feature = (type, coordinates, properties) => ({ type: 'Feature', geometry: { type, coordinates }, properties });
const optionalText = file => readFile(file, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '';
  throw error;
});
const round = value => Math.round(Number(value) * 1e6) / 1e6;
const fallbackTypes = { 0: 'tram', 1: 'metro', 2: 'rail', 3: 'bus', 4: 'ferry', 7: 'funicular' };

export async function buildTransitLayers(folder, output, prefix) {
  const read = async table => parseDelimited(await optionalText(join(folder, table + '.txt')));
  const [routes, stops, trips, shapes] = await Promise.all(['routes', 'stops', 'trips', 'shapes'].map(read));
  const groups = new Map();
  const routeById = new Map();
  for (const route of routes) {
    const type = fallbackTypes[route.route_type];
    if (!type) continue;
    const group = groups.get(type) ?? { lines: [], stops: new Map() };
    groups.set(type, group);
    routeById.set(route.route_id, {
      group, name: route.route_short_name || route.route_long_name, color: route.route_color,
      description: route.route_long_name,
    });
  }
  const shapePoints = new Map();
  for (const shape of shapes) {
    if (!shapePoints.has(shape.shape_id)) shapePoints.set(shape.shape_id, []);
    shapePoints.get(shape.shape_id).push(shape);
  }
  const tripRoutes = new Map();
  const usedShapes = new Set();
  for (const trip of trips) {
    const route = routeById.get(trip.route_id);
    if (!route) continue;
    tripRoutes.set(trip.trip_id, route);
    const key = trip.route_id + '\0' + trip.shape_id;
    if (usedShapes.has(key) || !shapePoints.has(trip.shape_id)) continue;
    usedShapes.add(key);
    const coords = shapePoints.get(trip.shape_id).sort((a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence))
      .map(row => [round(row.shape_pt_lon), round(row.shape_pt_lat)]).filter(p => p.every(Number.isFinite));
    if (coords.length > 1) route.group.lines.push(feature('LineString', coords, {
      NAME: route.name, description: route.description, color: route.color,
    }));
  }
  const rows = createInterface({ input: createReadStream(join(folder, 'stop_times.txt')), crlfDelay: Infinity });
  let header, tripColumn, stopColumn;
  for await (const line of rows) {
    if (!header) {
      header = line.replace(/^\uFEFF/, '');
      const columns = header.split(',');
      tripColumn = columns.indexOf('trip_id');
      stopColumn = columns.indexOf('stop_id');
      if (tripColumn < 0 || stopColumn < 0) throw new Error('GTFS: stop_times.txt ohne trip_id/stop_id');
      continue;
    }
    if (!line) continue;
    let trip, stop;
    if (line.includes('"')) {
      const row = parseDelimited(header + '\n' + line)[0];
      trip = row.trip_id;
      stop = row.stop_id;
    } else {
      const columns = line.split(',');
      trip = columns[tripColumn];
      stop = columns[stopColumn];
    }
    const route = tripRoutes.get(trip);
    if (!stop || !route) continue;
    const lines = route.group.stops.get(stop) ?? new Set();
    lines.add(route.name);
    route.group.stops.set(stop, lines);
  }
  const counts = {};
  for (const [type, group] of groups) {
    const points = stops.filter(row => group.stops.has(row.stop_id) && row.stop_lat && row.stop_lon).flatMap(row => {
      const coords = [round(row.stop_lon), round(row.stop_lat)];
      if (!coords.every(Number.isFinite)) return [];
      return [feature('Point', coords, { NAME: row.stop_name, Linies: [...group.stops.get(row.stop_id)].sort().join(', ') })];
    });
    if (points.length) await writeFile(join(output, prefix + '-' + type + '-stops.geojson'), JSON.stringify(collection(points)));
    if (group.lines.length) await writeFile(join(output, prefix + '-' + type + '.geojson'), JSON.stringify(collection(group.lines)));
    if (points.length || group.lines.length) counts[type] = { stops: points.length, shapes: group.lines.length };
  }
  return counts;
}
