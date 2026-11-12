import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';
import { loadCatalog, distanceKm } from './lib/catalog.mjs';
import { InputError, openStore } from './lib/store.mjs';
import { routeTransit } from './lib/transit-route.mjs';

const publicDir = new URL('./public/', import.meta.url);
const types = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8', json: 'application/json', geojson: 'application/geo+json',
  png: 'image/png', jpg: 'image/jpeg', ico: 'image/x-icon',
};
const maxBody = 2_000_000;
const decompress = promisify(gunzip);
const json = (res, value, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
};

async function readJson(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new InputError('JSON erwartet.', 415);
  let size = 0;
  const parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBody) throw new InputError('Datei oder Änderung zu groß.', 413);
    parts.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw new InputError('Ungültiges JSON.'); }
}

function validateCoordinates(values) {
  return values.length === 2 && values.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180);
}

export function routeKey(points) {
  return points.map(p => p.map(v => v.toFixed(5)).join(',')).join(';');
}

export async function createApp({ database, fetcher = fetch, upstream = true } = {}) {
  const catalog = await loadCatalog();
  if (!database) {
    await mkdir(new URL('./private/', import.meta.url), { recursive: true });
    database = fileURLToPath(new URL('./private/reiseplan.sqlite', import.meta.url));
  }
  const store = openStore(database, catalog);
  const bundle = await readFile(new URL('./data/pilot-walks.json', import.meta.url), 'utf8')
    .then(JSON.parse).catch(() => ({}));
  const known = new Map(Object.entries(bundle));
  const transitSchedules = {};
  const timetableBundles = new Map();
  for (const city of ['barcelona', 'nice']) {
    const metaFile = new URL('./data/transit-' + city + '.meta.json', import.meta.url);
    try { transitSchedules[city] = JSON.parse(await readFile(metaFile, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }

  async function transit(input) {
    const { city, points, date, time, excluded = [] } = input ?? {};
    if (!Object.hasOwn(transitSchedules, city)) throw new InputError('Für diesen Ort ist kein Fahrplanpaket geladen.', 404);
    if (!Array.isArray(points) || !validateCoordinates(points) || distanceKm(...points) > 35
      || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || !Number.isFinite(Date.parse(date)) || !new Date(date).toISOString().startsWith(date)
      || typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
      || !Array.isArray(excluded) || excluded.length > 4 || excluded.some(line => typeof line !== 'string' || line.length > 80)) {
      throw new InputError('Zwei nahe Kartenpunkte, ein gültiges Datum und eine Ortszeit eingeben.');
    }
    const meta = transitSchedules[city];
    if (date < meta.from || date > meta.to) return { status: 'outside', meta, routes: [] };
    if (!timetableBundles.has(city)) {
      const loading = readFile(new URL('./data/transit-' + city + '.json.gz', import.meta.url))
        .then(decompress).then(raw => JSON.parse(raw.toString())).catch(error => {
          timetableBundles.delete(city);
          throw error;
        });
      timetableBundles.set(city, loading);
    }
    const data = await timetableBundles.get(city);
    try { return routeTransit(data, { points, date, time, excluded }); }
    catch (error) { throw new InputError(error.message, 422); }
  }

  let routeQueue = Promise.resolve();
  let previousRequest = 0;
  async function walk(points, cachedOnly) {
    if (!Array.isArray(points) || !validateCoordinates(points) || distanceKm(...points) > 25) {
      throw new InputError('Für den Fußweg sind zwei gültige, nahe Kartenpunkte nötig.');
    }
    const key = routeKey(points);
    const cached = () => {
      const stored = store.getRoute(key);
      return stored?.walkOnly ? stored : known.get(key);
    };
    if (cached()) return cached();
    if (cachedOnly) return null;
    if (!upstream) throw new InputError('Kein gespeicherter Fußweg für diese Verbindung.', 503);
    const task = routeQueue.then(async () => {
      if (cached()) return cached();
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 1050 - (Date.now() - previousRequest))));
      previousRequest = Date.now();
      const coords = points.map(([lat, lon]) => lon.toFixed(5) + ',' + lat.toFixed(5)).join(';');
      const url = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/' + coords + '?overview=full&geometries=geojson&steps=true';
      try {
        const response = await fetcher(url, {
          signal: AbortSignal.timeout(6500), headers: { 'User-Agent': 'Reiseplaner-Local/1.0 (interactive foot route)' },
        });
        if (!response.ok) throw new Error('Provider status ' + response.status);
        const route = (await response.json()).routes?.[0];
        if (!route || route.geometry?.type !== 'LineString' || !route.geometry.coordinates?.length) throw new Error('No foot route');
        const steps = route.legs?.flatMap(leg => leg.steps ?? []);
        if (!steps?.length) throw new Error('No route steps');
        if (steps.some(step => step.mode !== 'walking')) {
          throw new InputError('Dieser Vorschlag enthält ein Verkehrsmittel. Prüfe die Verbindung und den Tarif beim Betreiber.', 422);
        }
        const value = { points: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
          metres: Math.round(route.distance), minutes: Math.max(1, Math.ceil(route.duration / 60)),
          mode: 'Fußweg', price: 0, walkOnly: true, source: 'FOSSGIS / OSRM · OpenStreetMap', checked: new Date().toISOString().slice(0, 10) };
        store.saveRoute(key, value);
        return value;
      } catch (error) {
        if (error instanceof InputError) throw error;
        throw new InputError('Fußrouter nicht erreichbar oder keine Route gefunden. Externen Routenplaner öffnen oder Weg manuell hinterlegen.', 503);
      }
    });
    routeQueue = task.catch(() => {});
    return task;
  }

  const server = createServer(async (req, res) => {
    const localHost = req.headers.host;
    if (!/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(localHost ?? '')) return json(res, { error: 'Lokaler Host erforderlich.' }, 403);
    const origin = 'http://' + localHost;
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') {
      return json(res, { error: 'Zugriff nur aus dem lokalen Reiseplaner.' }, 403);
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org https://basemaps.cartocdn.com https://wms.geo.admin.ch; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      const pathname = new URL(req.url, origin).pathname;
      if (pathname === '/api/bootstrap' && req.method === 'GET') return json(res, { ...catalog, transitSchedules, variants: store.list() });
      if (pathname === '/api/transit' && req.method === 'POST') return json(res, await transit(await readJson(req)));
      if (pathname === '/api/walk' && req.method === 'POST') {
        const { points, cachedOnly } = await readJson(req);
        return json(res, await walk(points, cachedOnly === true));
      }
      const match = pathname.match(/^\/api\/variant\/([\w:%-]+)(?:\/(import|copy))?$/);
      if (match) {
        const [, encoded, action] = match;
        const id = decodeURIComponent(encoded);
        if (!action && req.method === 'GET') {
          const { trip, ...value } = store.current(id);
          return json(res, { ...value, logs: store.logs(id) });
        }
        if (req.method === 'PUT' && !action) {
          const { revision, state } = await readJson(req);
          if (!Number.isInteger(revision) || revision < 0) throw new InputError('Ungültige Version.');
          return json(res, store.save(id, revision, state));
        }
        if (req.method === 'POST' && action === 'copy') return json(res, store.duplicate(id, (await readJson(req)).title), 201);
        if (req.method === 'POST' && action === 'import') {
          const { filename, content } = await readJson(req);
          return json(res, store.import(id, filename, content));
        }
      }
      if (!['GET', 'HEAD'].includes(req.method) || !/^\/[\w./-]*$/.test(pathname) || pathname.startsWith('/api/')) return json(res, { error: 'Pfad nicht gefunden.' }, 404);
      const path = pathname === '/' ? 'index.html' : pathname.slice(1);
      const file = new URL(path, publicDir);
      const ext = path.split('.').at(-1);
      if (!file.href.startsWith(publicDir.href) || !types[ext]) return json(res, { error: 'Datei nicht gefunden.' }, 404);
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[ext], 'Content-Length': content.length,
        'Cache-Control': path.startsWith('vendor/') ? 'public, max-age=604800' : 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = error.status ?? (error.code === 'ENOENT' ? 404 : 500);
      if (status === 500) console.error(error);
      json(res, { error: status === 500 ? 'Interner Fehler im lokalen Reiseplaner.' : status === 404 && !error.status ? 'Datei nicht gefunden.' : error.message }, status);
    }
  });
  server.on('close', () => store.close());
  return { server, store, catalog };
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()) {
  const { server } = await createApp({ database: process.env.REISEPLAN_DB, upstream: process.env.REISEPLAN_OFFLINE !== '1' });
  const port = Number(process.env.REISEPLAN_PORT ?? 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('REISEPLAN_PORT muss zwischen 1024 und 65535 liegen.');
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? 'Port belegt. Bestehenden Reiseplaner öffnen oder REISEPLAN_PORT ändern.' : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    const address = 'http://127.0.0.1:' + port;
    console.log('Reiseplaner bereit · ' + address + '\nZum Beenden Strg+C drücken.');
    if (process.argv.includes('--open') && process.platform === 'win32') {
      const child = spawn('explorer.exe', [address], { detached: true, stdio: 'ignore' });
      child.on('error', () => console.log('Adresse bei Bedarf manuell öffnen.'));
      child.unref();
    }
  });
}
