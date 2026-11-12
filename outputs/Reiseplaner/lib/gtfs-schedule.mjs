import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parseDelimited } from './store.mjs';

export function gtfsSeconds(clock) {
  const match = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(clock ?? '');
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
}

const dateText = compact => compact?.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

async function* stopTimes(path) {
  const rows = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let header;
  let columns;
  for await (const line of rows) {
    if (!header) {
      header = line.replace(/^\uFEFF/, '');
      columns = header.split(',');
    } else if (line) {
      if (line.includes('"')) yield parseDelimited(header + '\n' + line)[0];
      else {
        const values = line.split(',');
        yield Object.fromEntries(columns.map((column, i) => [column, values[i]]));
      }
    }
  }
}

export async function compileSchedule(directory, source) {
  const table = name => readFile(join(directory, name + '.txt'), 'utf8').then(parseDelimited).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const [feed, agencies, rawRoutes, rawStops, rawTrips, calendar, exceptions, rawTransfers, rawShapes, frequencies] =
    await Promise.all(['feed_info', 'agency', 'routes', 'stops', 'trips', 'calendar', 'calendar_dates', 'transfers', 'shapes', 'frequencies'].map(table));
  const meta = { from: dateText(feed[0]?.feed_start_date), to: dateText(feed[0]?.feed_end_date),
    version: feed[0]?.feed_version, provider: feed[0]?.feed_publisher_name, zone: agencies[0]?.agency_timezone, source };
  if (!meta.from || !meta.to || !meta.zone) throw new Error('Der Feed braucht einen Gültigkeitszeitraum und eine Zeitzone.');

  const types = { 0: 'Tram', 1: 'Metro', 2: 'Bahn', 3: 'Bus', 7: 'Standseilbahn' };
  const supportedRoutes = rawRoutes.filter(row => types[row.route_type]);
  const routes = supportedRoutes.map(row => ({ name: row.route_short_name || row.route_long_name,
    mode: types[row.route_type], color: row.route_color, url: row.route_url }));
  const routeIndex = new Map(supportedRoutes.map((row, i) => [row.route_id, i]));
  const platforms = rawStops.filter(row => ['0', '', undefined].includes(row.location_type) && row.stop_lat && row.stop_lon);
  const stops = platforms.map(row => ({ id: row.stop_id, name: row.stop_name, point: [Number(row.stop_lat), Number(row.stop_lon)], parent: row.parent_station || null }));
  const stopIndex = new Map(platforms.map((row, i) => [row.stop_id, i]));
  const frequencyIds = new Set(frequencies.map(row => row.trip_id));
  const supportedTrips = rawTrips.filter(row => routeIndex.has(row.route_id) && !frequencyIds.has(row.trip_id));
  const trips = supportedTrips.map(row => ({ route: routeIndex.get(row.route_id), service: row.service_id,
    shape: row.shape_id, direction: row.trip_headsign, events: [] }));
  const tripIndex = new Map(supportedTrips.map((row, i) => [row.trip_id, i]));
  for await (const row of stopTimes(join(directory, 'stop_times.txt'))) {
    const trip = trips[tripIndex.get(row.trip_id)];
    const stop = stopIndex.get(row.stop_id);
    const arrival = gtfsSeconds(row.arrival_time);
    const departure = gtfsSeconds(row.departure_time);
    if (trip && stop != null && arrival != null && departure != null) {
      trip.events.push([stop, arrival, departure, row.pickup_type && row.pickup_type !== '0' ? 0 : 1,
        row.drop_off_type && row.drop_off_type !== '0' ? 0 : 1, Number(row.stop_sequence)]);
    }
  }
  for (const trip of trips) trip.events = trip.events.sort((a, b) => a[5] - b[5]).map(row => row.slice(0, 5));
  const activeTrips = trips.filter(trip => trip.events.length > 1);
  if (!activeTrips.length) throw new Error('Der GTFS-Fahrplan enthält keine verwendbaren Fahrten.');
  const shapeIds = new Set(activeTrips.map(trip => trip.shape));
  const shapes = Object.groupBy(rawShapes.filter(row => shapeIds.has(row.shape_id)), row => row.shape_id);
  for (const [id, rows] of Object.entries(shapes)) {
    shapes[id] = rows.sort((a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence))
      .map(row => [Number(row.shape_pt_lat), Number(row.shape_pt_lon)]);
  }
  const transfers = rawTransfers.flatMap(row => {
    const from = stopIndex.get(row.from_stop_id);
    const to = stopIndex.get(row.to_stop_id);
    if (from == null || to == null || row.from_trip_id || row.to_trip_id || row.from_route_id || row.to_route_id) return [];
    return [[from, to, Number(row.transfer_type || 0), Number(row.min_transfer_time || 0)]];
  });
  const days = calendar.map(row => [row.service_id, dateText(row.start_date), dateText(row.end_date),
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(key => row[key] === '1')]);
  const changes = Object.groupBy(exceptions, row => dateText(row.date));
  for (const [date, rows] of Object.entries(changes)) changes[date] = rows.map(row => [row.service_id, row.exception_type === '1']);
  return { meta, routes, stops, trips: activeTrips, shapes, transfers, days, changes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, output, source] = process.argv.slice(2);
  if (!directory || !output || !source) throw new Error('Aufruf: node lib/gtfs-schedule.mjs GTFS-Ordner Ausgabedatei.json.gz Quellen-URL');
  const data = await compileSchedule(directory, source);
  await writeFile(output, gzipSync(JSON.stringify(data)));
  await writeFile(output.replace(/\.json\.gz$/, '.meta.json'), JSON.stringify(data.meta, null, 2));
  console.log(JSON.stringify({ ...data.meta, stops: data.stops.length, trips: data.trips.length, shapes: Object.keys(data.shapes).length }));
}
