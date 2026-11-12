import { localParts, utcFromLocal } from '../public/model.mjs';
import { distanceKm } from './catalog.mjs';

const iso = seconds => new Date(seconds * 1000).toISOString();
const addDays = (date, count) => new Date(Date.parse(date + 'T12:00:00Z') + count * 86_400_000).toISOString().slice(0, 10);
const covered = ({ from, to }, date) => date >= from && date <= to;

function servicesOn(data, date) {
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  const services = new Set(data.days.filter(([, from, to, days]) => date >= from && date <= to && days[weekday])
    .map(([id]) => id));
  for (const [id, active] of data.changes[date] ?? []) {
    if (active) services.add(id);
    else services.delete(id);
  }
  return services;
}

function nearbyStops(data, point, modes) {
  const close = data.stops.flatMap((stop, index) => modes.has(index)
    ? [{ index, distance: distanceKm(point, stop.point) }] : [])
    .filter(stop => stop.distance <= 1.05).sort((a, b) => a.distance - b.distance);
  const bus = close.filter(stop => modes.get(stop.index) === 'Bus').slice(0, 14);
  const other = close.filter(stop => modes.get(stop.index) !== 'Bus').slice(0, 10);
  return [...bus, ...other].map(({ index, distance }) => ({
    index, metres: Math.ceil(distance * 1250), seconds: Math.ceil(distance * 1000),
  }));
}

function buildTransfers(data, modes) {
  const parents = Map.groupBy(data.stops.flatMap((stop, index) => stop.parent ? [{ ...stop, index }] : []), stop => stop.parent);
  const cell = point => point.map(value => Math.floor(value * 400));
  const grid = Map.groupBy([...modes.keys()], index => cell(data.stops[index].point).join(','));
  const allowed = data.stops.map((stop, index) => {
    const nearby = new Map([[index, 60]]);
    for (const sibling of parents.get(stop.parent) ?? []) {
      nearby.set(sibling.index, Math.max(90, Math.ceil(distanceKm(stop.point, sibling.point) * 1000)));
    }
    if (!modes.has(index)) return nearby;
    const [lat, lon] = cell(stop.point);
    for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) {
      for (const other of grid.get((lat + dy) + ',' + (lon + dx)) ?? []) {
        if (nearby.has(other) || (modes.get(index) !== 'Bus' && modes.get(other) !== 'Bus')) continue;
        const distance = distanceKm(stop.point, data.stops[other].point);
        if (distance <= 0.16) nearby.set(other, 75 + Math.ceil(distance * 1000));
      }
    }
    return nearby;
  });
  for (const [from, to, kind, seconds] of data.transfers) {
    if (kind === 3) allowed[from].delete(to);
    else if (kind <= 2) allowed[from].set(to, Math.max(1, seconds || 60));
  }
  return allowed;
}

function connections(data, day, start, end, excluded) {
  const list = [];
  for (const date of [addDays(day, -1), day, addDays(day, 1)]) {
    if (!covered(data.meta, date)) continue;
    const services = servicesOn(data, date);
    const base = Date.parse(utcFromLocal(date, '12:00', data.meta.zone)) / 1000 - 43_200;
    for (const [index, trip] of data.trips.entries()) {
      if (!services.has(trip.service) || excluded.has(data.routes[trip.route].name.toUpperCase())) continue;
      const { events } = trip;
      if (events[0][2] + base > end || events.at(-1)[1] + base < start) continue;
      for (let i = 0; i < events.length - 1; i++) {
        const [, , dep] = events[i];
        const [, arr] = events[i + 1];
        if (dep + base < start || arr + base > end || arr < dep) continue;
        list.push({ index, i, base, departure: dep + base, arrival: arr + base });
      }
    }
  }
  return list.sort((a, b) => a.departure - b.departure || a.arrival - b.arrival || a.i - b.i);
}

function shapeSegment(data, trip, from, to) {
  const path = data.shapes[trip.shape];
  if (!path?.length) return null;
  let left = 0;
  let first = null;
  for (let stop = 0; stop <= to; stop++) {
    const target = data.stops[trip.events[stop][0]].point;
    let nearest = Infinity;
    let index = left;
    for (let candidate = left; candidate < path.length; candidate++) {
      const distance = distanceKm(path[candidate], target);
      if (distance < nearest) { nearest = distance; index = candidate; }
    }
    if (nearest > 0.3) return null;
    left = index;
    if (stop === from) first = index;
  }
  return first < left ? path.slice(first, left + 1) : null;
}

function describe(data, label, origin, time) {
  const legs = [];
  let ready = label;
  while (ready.ride) {
    const { trip, base, from, to, before } = ready.ride;
    const [fromId, , dep] = trip.events[from];
    const [toId, arr] = trip.events[to];
    legs.unshift({ ...data.routes[trip.route], direction: trip.direction, from: data.stops[fromId], to: data.stops[toId],
      departure: iso(dep + base), arrival: iso(arr + base), points: shapeSegment(data, trip, from, to) });
    ready = before;
  }
  return { mode: 'ÖPNV', line: legs.map(leg => leg.name).join(' → '), legs, start: iso(time), end: iso(label.end),
    minutes: Math.ceil((label.end - time) / 60), access: origin, egress: label.egress, zone: data.meta.zone,
    date: localParts(iso(time), data.meta.zone).date };
}

export function routeTransit(data, { points, date, time, excluded = [] }) {
  const { meta } = data;
  if (!covered(meta, date)) return { status: 'outside', meta, routes: [] };
  const start = Date.parse(utcFromLocal(date, time, meta.zone)) / 1000;
  const end = start + 3 * 3600;
  const schedule = connections(data, date, start, end, new Set(excluded.map(line => line.toUpperCase())));
  const modes = new Map();
  for (const { index, i } of schedule) {
    const trip = data.trips[index];
    const mode = data.routes[trip.route].mode;
    modes.set(trip.events[i][0], mode);
    modes.set(trip.events[i + 1][0], mode);
  }
  const origins = nearbyStops(data, points[0], modes);
  const ends = new Map(nearbyStops(data, points[1], modes).map(stop => [stop.index, stop]));
  const arrivals = [new Map(origins.map(origin => [origin.index, { ready: start + origin.seconds, origin }])),
    new Map(), new Map()];
  const aboard = arrivals.map(() => new Map());
  const best = arrivals.map(() => null);
  const transfer = buildTransfers(data, modes);

  for (const connection of schedule) {
    const { index, i, base, departure, arrival } = connection;
    const trip = data.trips[index];
    const [from, , , pickup] = trip.events[i];
    const [to, , , , drop] = trip.events[i + 1];
    const key = index + ':' + base;
    for (let rides = 0; rides < arrivals.length; rides++) {
      let boarded = aboard[rides].get(key);
      const previous = arrivals[rides].get(from);
      if (!boarded && pickup && previous?.ready <= departure && previous.ride?.trip.route !== trip.route) {
        boarded = { trip, base, from: i, before: previous };
        aboard[rides].set(key, boarded);
      }
      if (!boarded || !drop) continue;
      const ride = { ...boarded, to: i + 1 };
      const egress = ends.get(to);
      if (egress && arrival + egress.seconds < (best[rides]?.end ?? Infinity)) {
        best[rides] = { end: arrival + egress.seconds, egress, ride };
      }
      const next = arrivals[rides + 1];
      if (!next) continue;
      for (const [platform, seconds] of transfer[to]) {
        const ready = arrival + seconds;
        if (ready < (next.get(platform)?.ready ?? Infinity)) next.set(platform, { ready, ride });
      }
    }
  }
  const routes = best.filter((candidate, i) => candidate && !best.slice(0, i).some(simpler => simpler && simpler.end <= candidate.end))
    .sort((a, b) => a.end - b.end).map(label => {
    let first = label;
    while (first.ride) first = first.ride.before;
    return describe(data, label, first.origin, start);
  });
  const seen = new Set();
  return { status: routes.length ? 'scheduled' : 'none', meta, routes: routes.filter(route => {
    if (seen.has(route.line)) return false;
    seen.add(route.line);
    return true;
  }) };
}
