import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { activeItems, fxAmount, groupPrice, mealDate, minor } from '../public/model.mjs';
import { VERIFICATION_FIELDS } from '../public/verification.mjs';

const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const goodText = (v, limit = 600) => typeof v === 'string' && v.length <= limit;
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const validDay = v => goodText(v, 10) && dayPattern.test(v) && !Number.isNaN(Date.parse(v))
  && new Date(v).toISOString().startsWith(v);
const validTime = v => v == null || (goodText(v, 40) && /T.*Z$/.test(v) && !Number.isNaN(Date.parse(v)));
const validPoint = v => v == null || (Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) && Math.abs(v[0]) <= 90 && Math.abs(v[1]) <= 180);
const validZone = zone => {
  if (!goodText(zone, 80)) return false;
  try { new Intl.DateTimeFormat('de', { timeZone: zone }); return true; } catch { return false; }
};
const group = n => Number.isInteger(n) && n >= 1 && n <= 12;
const validPrice = v => v == null || (object(v) && Number.isSafeInteger(v.cents) && Math.abs(v.cents) <= 100_000_000
  && ['EUR', 'CHF', 'GBP', 'USD', 'DKK', 'SEK', 'NOK', 'PLN', 'CZK'].includes(v.currency) && ['person', 'group'].includes(v.scope)
  && (v.party == null || group(v.party)) && (v.label == null || goodText(v.label)));

export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function initialState(trip) {
  return {
    people: Array.from({ length: trip.travellers }, (_, i) => ({ id: 'p' + (i + 1), name: 'Person ' + (i + 1), age: null })),
    edits: {}, manual: [], expenses: [], favorites: [], deadlines: [], localRoutes: {},
    pass: { from: trip.from, to: trip.to, days: 7, cost: null, rides: 0, purchased: false, budgetMode: 'tickets', includeReferences: false },
    mobility: {}, groceryOverrides: {}, verifications: {},
    budgetLimit: null, title: null,
  };
}

export function validateState(state, trip, imported) {
  const error = message => { throw new InputError(message); };
  if (!object(state) || !Array.isArray(state.people) || !group(state.people.length)) error('Ungültige Reisegruppe.');
  if (new Set(state.people.map(p => p?.id)).size !== state.people.length || state.people.some((p, i) =>
    !p || p.id !== 'p' + (i + 1) || !goodText(p.name, 60) || !p.name.trim() || (p.age != null && (!Number.isInteger(p.age) || p.age < 0 || p.age > 125)))) error('Ungültiges Gruppenprofil.');
  for (const list of ['manual', 'expenses', 'favorites', 'deadlines']) {
    if (!Array.isArray(state[list]) || state[list].length > 1000) error('Ungültige Liste: ' + list);
  }
  if (!object(state.edits) || !object(state.localRoutes)) error('Ungültige Änderungen.');
  if (state.mobility != null && (!object(state.mobility) || Object.entries(state.mobility).some(([city, count]) =>
    !['genoa', 'nice', 'venice'].includes(city) || !trip.route.includes(city) || !Number.isInteger(count) || count < 0 || count > 100))) {
    error('Ungültige Nahverkehrsplanung.');
  }
  if (state.groceryOverrides != null
    && (!object(state.groceryOverrides) || Object.keys(state.groceryOverrides).length > 200
      || Object.entries(state.groceryOverrides).some(([key, value]) =>
        !/^[a-z0-9_-]{1,50}:[a-z0-9_-]{1,120}:[0-9]{1,7}:[0-9]{1,8}$/i.test(key)
        || !object(value) || !Number.isSafeInteger(value.packs) || value.packs < 1 || value.packs > 100
        || !Number.isSafeInteger(value.unitCents) || value.unitCents < 0 || value.unitCents > 100000))) {
    error('Ungültiger gemeinsamer Einkaufswarenkorb.');
  }
  if (state.title != null && !goodText(state.title, 160)) error('Ungültiger Variantentitel.');
  if (state.budgetLimit != null && (!Number.isSafeInteger(state.budgetLimit) || state.budgetLimit < 0 || state.budgetLimit > 100_000_000)) error('Ungültiges Budgetlimit.');
  const p = state.pass;
  if (!object(p) || !validDay(p.from) || !validDay(p.to) || p.to < p.from || !Number.isInteger(p.days)
      || p.days < 1 || p.days > 99 || !Number.isInteger(p.rides) || p.rides < 0 || p.rides > 100
      || (p.budgetMode != null && !['tickets', 'interrail'].includes(p.budgetMode))
      || (p.cost != null && (!Number.isSafeInteger(p.cost) || p.cost < 0 || p.cost > 100_000_000))) error('Ungültige Passangaben.');
  const itemMap = new Map([...trip.items, ...imported, ...state.manual].map(i => [i.id, i]));
  if (state.verifications != null) {
    if (!object(state.verifications) || Object.keys(state.verifications).length > 400)
      error('Ungültiges Prüfarchiv.');
    for (const [id, entry] of Object.entries(state.verifications)) {
      const source = itemMap.get(id);
      if (!source || !['lodging', 'transport'].includes(source.kind) || !object(entry)
        || entry.kind !== source.kind || !object(entry.checks)
        || Object.entries(entry.checks).some(([name, checked]) =>
          !VERIFICATION_FIELDS[source.kind].includes(name) || typeof checked !== 'boolean')
        || !validDay(entry.checkedAt)
        || (entry.evidenceUrl != null && (typeof entry.evidenceUrl !== 'string'
          || entry.evidenceUrl.length > 1200 || !/^https?:\/\/[^\s]+$/i.test(entry.evidenceUrl)))
        || !goodText(entry.note ?? '', 600)
        || (entry.groupSize != null && (!group(entry.groupSize) || entry.groupSize !== state.people.length))
        || (entry.quotedCents != null && (!Number.isSafeInteger(entry.quotedCents)
          || entry.quotedCents < 0 || entry.quotedCents > 100_000_000))) {
        error('Ungültiger manueller Prüfstatus.');
      }
    }
  }
  const validateItem = i => {
    if (!object(i) || !goodText(i.id, 180) || !goodText(i.name, 240) || !i.name.trim() || !trip.route.includes(i.city)
        || !['activity', 'lodging', 'transport', 'note'].includes(i.kind) || !validTime(i.start) || !validTime(i.end)
        || !validZone(i.zone) || (i.endZone != null && !validZone(i.endZone)) || !validPrice(i.price)
        || !validPoint(i.point) || !validPoint(i.toPoint) || (i.date != null && !validDay(i.date))
        || (i.duration != null && (!Number.isInteger(i.duration) || i.duration < 1 || i.duration > 2880))
        || (i.buffer != null && (!Number.isInteger(i.buffer) || i.buffer < 0 || i.buffer > 1440))) error('Ungültiger Planeintrag.');
    if (i.end && i.start && Date.parse(i.end) <= Date.parse(i.start)) error('Das Ende muss nach dem Beginn liegen.');
    if (i.kind === 'transport' && i.toCity && !trip.route.includes(i.toCity)) error('Der Zielort gehört nicht zur ursprünglichen Route.');
    if (i.basketProducts != null
      && (!i.requiresKitchen || !Array.isArray(i.basketProducts) || i.basketProducts.length > 30
        || i.basketProducts.some(product => !goodText(product?.name, 160)
          || !goodText(product?.source, 120) || !/^[a-z0-9_-]+$/i.test(product.source)
          || !Number.isSafeInteger(product.pack) || product.pack < 1 || product.pack > 100000
          || !Number.isSafeInteger(product.need) || product.need < 1 || product.need > 100000
          || !Number.isSafeInteger(product.cents) || product.cents < 0 || product.cents > 100000))) {
      error('Ungültiger Zutatenplan.');
    }
    if (i.mealSlot != null && (i.kind !== 'activity' || !['breakfast', 'lunch', 'dinner'].includes(i.mealSlot)
      || !validDay(mealDate(i)) || mealDate(i) < trip.from || mealDate(i) > trip.to)) error('Ungültige Mahlzeit oder Reisetag.');
  };
  for (const i of state.manual) {
    if (!goodText(i?.id, 180) || !i.id.startsWith('manual:')) error('Ungültige lokale Eintrags-ID.');
    validateItem(i);
  }
  if (new Set(state.manual.map(i => i.id)).size !== state.manual.length) error('Doppelte Eintrags-ID.');
  const permitted = new Set(['selected', 'removed', 'name', 'date', 'start', 'end', 'duration', 'detail', 'address', 'point',
    'price', 'order', 'locked', 'buffer', 'hours', 'toPoint', 'departure', 'arrival', 'operator', 'number', 'passUse',
    'booking', 'stayFrom', 'stayTo', 'toCity', 'zone', 'endZone', 'city', 'category']);
  for (const [id, edit] of Object.entries(state.edits)) {
    const source = itemMap.get(id);
    if (!source || source.duplicateOf || !object(edit) || Object.keys(edit).some(k => !permitted.has(k))) error('Unbekannter Eintrag oder Änderungsfeld.');
    if (source.booked && Object.keys(edit).length) error('Gebuchter Fixpunkt ist gesperrt.');
    validateItem({ ...source, ...edit });
    if (source.kind === 'transport' && source.externalId
        && ((edit.city != null && edit.city !== source.city) || (edit.toCity != null && edit.toCity !== source.toCity))) error('Die ursprüngliche Hauptstrecke bleibt erhalten.');
  }
  const meals = new Map();
  for (const item of activeItems(trip, state, imported).filter(item => item.mealSlot)) {
    const slot = mealDate(item) + ':' + item.mealSlot;
    const previous = meals.get(slot);
    if (previous && (item.mealPlanId || previous.mealPlanId)) error('Für diese Mahlzeit ist bereits eine Option aktiv.');
    meals.set(slot, item);
  }
  const linked = new Set();
  for (const i of state.expenses) {
    if (!goodText(i?.id, 180) || !goodText(i.name, 240) || !i.name.trim() || !validPrice(i.price) || !i.price ||
        !['open', 'paid', 'refund'].includes(i.payment) || !Number.isInteger(i.payer) || !state.people[i.payer]
        || (i.payment === 'refund') !== (i.price.cents < 0) || (i.date != null && !validDay(i.date))) error('Ungültiger Budgetposten.');
    if (i.forItem != null) {
      const item = itemMap.get(i.forItem);
      if (!item?.mealSlot || linked.has(i.forItem) || i.category !== 'food' || i.payment === 'refund') error('Ungültige Zuordnung zur Mahlzeit.');
      linked.add(i.forItem);
    }
    if (i.fx != null && (!/^\d+(\.\d{1,8})?$/.test(i.fx.rate) || +i.fx.rate <= 0 || +i.fx.rate > 1000 || !validDay(i.fx.date))) error('Ungültiger Wechselkurs oder Stichtag.');
    if (i.split != null && (!['fixed', 'weights'].includes(i.split.mode) || i.split.values?.length !== state.people.length
        || !i.split.values.every(v => Number.isSafeInteger(v) && v >= 0) || !i.split.values.some(Boolean))) error('Ungültige individuelle Kostenaufteilung.');
    if (i.split?.mode === 'fixed') {
      const amount = groupPrice(i.price, state.people.length);
      const euro = i.price.currency === 'EUR' ? amount : fxAmount(amount, i.fx);
      if (euro == null || i.split.values.reduce((a, b) => a + b, 0) !== Math.abs(euro)) error('Feste Anteile müssen dem EUR-Gesamtbetrag entsprechen.');
    }
  }
  if (new Set(state.expenses.map(i => i.id)).size !== state.expenses.length) error('Doppelte Ausgaben-ID.');
  for (const deadline of state.deadlines) {
    if (!goodText(deadline?.id, 180) || !goodText(deadline.title, 240) || !deadline.title.trim()
        || !validTime(deadline.when) || !validZone(deadline.zone)) error('Ungültige Frist.');
  }
  for (const route of Object.values(state.localRoutes)) {
    if (!object(route) || !Number.isInteger(route.minutes) || route.minutes < 1 || route.minutes > 1440
        || !goodText(route.source, 500) || !route.source.trim() || !['ÖPNV', 'Fußweg', 'Bergweg', 'Gondel & Fußweg'].includes(route.mode)
        || (route.line != null && !goodText(route.line, 100)) || (route.date != null && !validDay(route.date))
        || !validPrice(route.fare) || route.fare?.cents < 0) error('Ungültiger manueller Weg.');
    if (route.legs != null && (!Array.isArray(route.legs) || route.legs.length < 1 || route.legs.length > 3
      || !validDay(route.date) || !validZone(route.zone) || !route.start || !route.end || !validTime(route.start) || !validTime(route.end)
      || Date.parse(route.end) <= Date.parse(route.start) || !Number.isInteger(route.access?.seconds) || route.access.seconds < 0
      || route.legs.some(leg => !leg || !goodText(leg.name, 160) || !goodText(leg.mode, 60)
        || !leg.departure || !leg.arrival || !validTime(leg.departure) || !validTime(leg.arrival)
        || Date.parse(leg.arrival) < Date.parse(leg.departure)
        || ![leg.from, leg.to].every(stop => stop?.point && validPoint(stop.point) && goodText(stop.name, 200))
        || (leg.points != null && (!Array.isArray(leg.points) || leg.points.length > 3000
          || leg.points.some(point => !point || !validPoint(point))))))) error('Ungültige Fahrplanverbindung.');
  }
}

export function parseDelimited(contents) {
  const text = String(contents).replace(/^\uFEFF/, '');
  const delimiter = text.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || !cell) quoted = !quoted;
      else cell += c;
    } else if (!quoted && (c === delimiter || c === '\n' || c === '\r')) {
      row.push(cell);
      cell = '';
      if (c === delimiter) continue;
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (quoted) throw new InputError('Eine CSV-Zeile hat ein ungeschlossenes Anführungszeichen.');
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() ?? [];
  return rows.map(values => {
    if (values.length !== headers.length) throw new InputError('CSV-Spaltenanzahl stimmt nicht.');
    return Object.fromEntries(headers.map((header, i) => [header.trim(), values[i]]));
  });
}

function importOptions(trip, cities, filename, content) {
  let data;
  try {
    data = filename.toLowerCase().endsWith('.csv') ? parseDelimited(content)
      : JSON.parse(content.replace(/^\uFEFF/, ''));
  } catch (err) { throw new InputError('Datei konnte nicht gelesen werden. ' + err.message); }
  const rows = Array.isArray(data) ? data : data?.options;
  if (!Array.isArray(rows) || !rows.length || rows.length > 1000) throw new InputError('Erwartet wird eine CSV- oder JSON-Liste mit bis zu 1000 Optionen.');
  const recognizedSources = ['übernommen', 'neu recherchiert', 'manuell'];
  const recognizedStatus = ['verifiziert', 'Annahme', 'ungeprüft', 'veraltet'];
  return rows.map((raw, index) => {
    if (!object(raw)) throw new InputError('Ungültige Zeile ' + (index + 1));
    const name = raw.name?.trim?.();
    const city = raw.city || raw.destination_id;
    const kind = raw.kind || (raw.check_in_date || raw.kitchen ? 'lodging' : 'activity');
    if (!name || !goodText(name, 240) || !trip.route.includes(city) || !['activity', 'lodging'].includes(kind)) {
      throw new InputError('Zeile ' + (index + 1) + ' braucht einen Namen und eine Stadt-ID aus der gewählten Reise.');
    }
    const provider = String(raw.provider || raw.source_system || 'Datei');
    const key = String(raw.external_id || raw.id || [kind, city, name.toLowerCase(), raw.planned_date ?? '', raw.address ?? ''].join('|'));
    const id = 'import:' + createHash('sha256').update(JSON.stringify([trip.id, provider, key])).digest('hex').slice(0, 28);
    const lat = raw.latitude === '' || raw.latitude == null ? null : Number(raw.latitude);
    const lon = raw.longitude === '' || raw.longitude == null ? null : Number(raw.longitude);
    const point = lat == null || lon == null ? null : [lat, lon];
    if (!validPoint(point)) throw new InputError('Ungültige Koordinaten in Zeile ' + (index + 1));
    const amount = raw.amount ?? raw.live_quote_total ?? raw.historic_or_plan_total;
    let cents;
    try { cents = minor(amount); } catch (err) { throw new InputError('Zeile ' + (index + 1) + ': ' + err.message); }
    const price = cents == null ? null : { cents, currency: raw.currency || raw.live_quote_currency || raw.historic_or_plan_currency || 'EUR',
      scope: raw.price_scope || (kind === 'lodging' ? 'group' : 'person'), label: 'Importierter Preis · Gültigkeit separat prüfen',
      party: kind === 'lodging' && group(Number(raw.travellers)) ? Number(raw.travellers) : null };
    if (!validPrice(price)) throw new InputError('Ungültiger Preis in Zeile ' + (index + 1));
    const status = raw.verification || raw.verification_status;
    const date = validDay(raw.planned_date) ? raw.planned_date : null;
    return {
      id, trip: trip.id, kind, city, name, selected: false, category: kind === 'lodging' ? 'lodging' : 'activity',
      source: [], importSource: { file: filename.slice(0, 200), provider, key, date: new Date().toISOString() },
      origin: recognizedSources.includes(raw.origin) ? raw.origin : 'übernommen',
      verification: recognizedStatus.includes(status) ? status : 'ungeprüft',
      zone: cities[city].timezone, point, date, start: null, end: null, price,
      detail: String(raw.detail || raw.note || '').slice(0, 4000), address: raw.address, kitchen: raw.kitchen,
      stayFrom: validDay(raw.check_in_date) ? raw.check_in_date : null,
      stayTo: validDay(raw.check_out_date) ? raw.check_out_date : null,
      website: raw.url || raw.source_url, checked: raw.checked || raw.accessed_on, raw,
    };
  });
}

export function openStore(filename, catalog) {
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS variants (id TEXT PRIMARY KEY, base TEXT NOT NULL, revision INTEGER NOT NULL, state TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS imported_options (variant TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (variant, id));
    CREATE TABLE IF NOT EXISTS imports (id TEXT PRIMARY KEY, variant TEXT NOT NULL, filename TEXT NOT NULL, created_at TEXT NOT NULL, inserted INTEGER NOT NULL, existing INTEGER NOT NULL, conflicts INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS routes (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
  `);
  const setup = db.prepare('INSERT OR IGNORE INTO variants VALUES (?, ?, 0, ?)');
  for (const trip of catalog.trips) setup.run(trip.id, trip.id, JSON.stringify(initialState(trip)));
  const imports = id => db.prepare('SELECT payload FROM imported_options WHERE variant = ?').all(id).map(r => JSON.parse(r.payload));
  const all = () => db.prepare('SELECT * FROM variants ORDER BY rowid').all().map(r => ({ id: r.id, base: r.base,
    revision: r.revision, state: JSON.parse(r.state), imported: imports(r.id) }));
  const current = id => {
    const r = db.prepare('SELECT * FROM variants WHERE id = ?').get(id);
    if (!r) throw new InputError('Reisevariante wurde nicht gefunden.', 404);
    const trip = catalog.trips.find(t => t.id === r.base);
    return { id, base: r.base, revision: r.revision, state: JSON.parse(r.state), trip, imported: imports(id) };
  };
  const transaction = fn => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  return {
    list: all,
    current,
    close: () => db.close(),
    save(id, revision, state) {
      const { trip, imported } = current(id);
      validateState(state, trip, imported);
      const changed = db.prepare('UPDATE variants SET state = ?, revision = revision + 1 WHERE id = ? AND revision = ?').run(JSON.stringify(state), id, revision);
      if (!changed.changes) throw new InputError('Diese Variante wurde in einem anderen Fenster geändert. Bitte neu laden.', 409);
      return { revision: revision + 1 };
    },
    duplicate(id, title) {
      if (!goodText(title, 160) || !title.trim()) throw new InputError('Titel für die Kopie eingeben.');
      const data = current(id);
      const copy = 'variant:' + randomUUID();
      return transaction(() => {
        setup.run(copy, data.base, JSON.stringify({ ...data.state, title }));
        const insert = db.prepare('INSERT INTO imported_options VALUES (?, ?, ?)');
        for (const item of data.imported) insert.run(copy, item.id, JSON.stringify(item));
        return { id: copy };
      });
    },
    import(id, filename, content) {
      if (!goodText(filename, 200) || !goodText(content, 1_000_000) || !/\.(json|csv)$/i.test(filename)) throw new InputError('Bitte eine JSON- oder CSV-Datei bis 1 MB wählen.');
      const { trip } = current(id);
      const items = importOptions(trip, catalog.cities, filename, content);
      return transaction(() => {
        const insert = db.prepare('INSERT OR IGNORE INTO imported_options VALUES (?, ?, ?)');
        const get = db.prepare('SELECT payload FROM imported_options WHERE variant = ? AND id = ?');
        const counts = { inserted: 0, existing: 0, conflicts: 0 };
        for (const item of items) {
          const previous = get.get(id, item.id);
          if (previous) {
            const same = JSON.stringify(JSON.parse(previous.payload).raw) === JSON.stringify(item.raw);
            counts[same ? 'existing' : 'conflicts']++;
          } else {
            insert.run(id, item.id, JSON.stringify(item));
            counts.inserted++;
          }
        }
        db.prepare('INSERT INTO imports VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), id, filename, new Date().toISOString(),
          counts.inserted, counts.existing, counts.conflicts);
        return counts;
      });
    },
    logs(id) { return db.prepare('SELECT * FROM imports WHERE variant = ? ORDER BY created_at DESC LIMIT 30').all(id); },
    getRoute(key) {
      const row = db.prepare('SELECT payload FROM routes WHERE id = ?').get(key);
      return row ? JSON.parse(row.payload) : null;
    },
    saveRoute(key, route) { db.prepare('INSERT OR REPLACE INTO routes VALUES (?, ?)').run(key, JSON.stringify(route)); },
  };
}
