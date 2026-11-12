import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { activeItems, allocate, alpineAccess, calculateBudget, conflicts, dayEntries, fxAmount, groupPrice, interrail, localParts, mealEstimate, minor, priceForParty, ticketBreakEven, utcFromLocal } from '../public/model.mjs';
import { transitFares } from '../public/transit.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { openStore, parseDelimited } from '../lib/store.mjs';
import { createApp } from '../server.mjs';

const catalog = await loadCatalog();
const trip = catalog.trips[0];
const euro = (cents, scope = 'group') => ({ cents, currency: 'EUR', scope });

test('All four Tripsy originals remain independent, with the original group sizes and route order', () => {
  assert.deepEqual(catalog.trips.map(t => t.externalId), ['1297194', '1312180', '1275516', '1273324']);
  assert.deepEqual(catalog.trips.map(t => t.travellers), [3, 3, 3, 4]);
  assert.deepEqual(trip.route, ['munich', 'paris', 'barcelona', 'sete', 'nice', 'genoa', 'venice', 'munich']);
  assert.equal(catalog.trips[1].items.filter(i => i.kind === 'transport' && i.duplicateOf).length, 1);
  assert.ok(catalog.trips[1].items.filter(i => i.kind === 'activity' && i.duplicateOf).length > 0);
  const invalid = trip.items.find(i => i.name === 'Letzter Abend am Kanal');
  assert.ok(invalid.positionIssue);
  assert.equal(invalid.point, null);
});

test('Italian rail and activity corrections retain the original chronology and source conflicts', async () => {
  const original = JSON.parse(await readFile(new URL('../data/tripsy-1297194.json', import.meta.url), 'utf8'));
  const source = original.resources.transportations.items.find(i => Number(i.id) === 3842730);
  const leg = trip.items.find(i => i.id === 'tripsy:transport:3842730');
  assert.match([source.description, source.notes].join(' '), /Schweiz|Appenzell/);
  assert.equal(leg.start, source.departure_at);
  assert.equal(leg.end, source.arrival_at);
  assert.deepEqual(leg.point, [44.41635, 8.9225]);
  assert.deepEqual(leg.toPoint, [45.4409, 12.3222]);
  assert.equal(leg.arrivalAddress, 'Fondamenta Santa Lucia, Venezia');
  assert.match(leg.importConflict, /Schweizer/);
  assert.doesNotMatch(leg.detail, /Appenzell/);
  const port = trip.items.find(i => i.id === 'tripsy:activity:4323040');
  assert.ok(port.positionIssue && port.source.includes('it-genoa-walks'));
  assert.equal(port.address, 'Porto Antico, Genova');
  assert.deepEqual(port.point, [44.4108, 8.9269]);
  const august = catalog.trips.find(t => t.id === 'interrail_august');
  assert.equal(august.items.find(i => i.id === 'tripsy:activity:4241500').city, 'venice');
  const lodge = t => t.items.find(i => i.id === 'research:venice-generator');
  assert.notEqual(lodge(august).stayFrom, lodge(trip).stayFrom);
  assert.equal(lodge(trip).price, null);
  assert.equal(lodge(trip).selected, false);
  assert.equal(lodge(catalog.trips[1]), undefined);
});

test('Italian mobility comparison keeps ticket windows and amounts distinct from actual expenses', () => {
  const compare = ticketBreakEven({ single: 950, pass: 3500, rides: 4, travellers: 3 });
  assert.deepEqual(compare, { singles: 11400, comparison: 10500, savings: 900, firstSaving: 4 });
  assert.equal(ticketBreakEven({ single: 200, pass: 1000, rides: 5, travellers: 3 }).savings, 0);
  const store = openStore(':memory:', catalog);
  try {
    const { revision, state } = store.current(trip.id);
    const original = calculateBudget(activeItems(trip, state), state);
    store.save(trip.id, revision, { ...state, mobility: { venice: 4 } });
    const changed = store.current(trip.id).state;
    assert.equal(changed.mobility.venice, 4);
    assert.equal(calculateBudget(activeItems(trip, changed), changed).total, original.total);
    assert.equal(store.current(catalog.trips[1].id).state.mobility.venice, undefined);
  } finally { store.close(); }
});

test('The foot-route endpoint rejects a waterbus and caches a verified walking route', async () => {
  let mode = 'ferry';
  let calls = 0;
  const fetcher = async url => {
    assert.match(url, /steps=true/);
    calls++;
    return Response.json({ routes: [{ distance: 310, duration: 240,
      geometry: { type: 'LineString', coordinates: [[12.33, 45.43], [12.331, 45.432]] },
      legs: [{ steps: [{ mode: 'walking' }, { mode }] }],
    }] });
  };
  const { server } = await createApp({ database: ':memory:', fetcher });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const post = cachedOnly => fetch('http://127.0.0.1:' + server.address().port + '/api/walk', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ points: [[45.43, 12.33], [45.432, 12.331]], cachedOnly }),
  });
  try {
    const mixed = await post(false);
    assert.equal(mixed.status, 422);
    assert.match((await mixed.json()).error, /Verkehrsmittel/);
    assert.equal(await (await post(true)).json(), null);
    mode = 'walking';
    const foot = await (await post(false)).json();
    assert.deepEqual([foot.minutes, foot.price, foot.walkOnly], [4, 0, true]);
    assert.deepEqual(await (await post(true)).json(), foot);
    assert.equal(calls, 2);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('Published TMB trips return exact stops, dated times and a line-exclusion alternative', async () => {
  const { server } = await createApp({ database: ':memory:', upstream: false });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const query = (date, excluded = []) => fetch('http://127.0.0.1:' + server.address().port + '/api/transit', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ city: 'barcelona', points: [[41.379, 2.1402], [41.40363, 2.17436]], date, time: '15:30', excluded }),
  });
  try {
    const outside = await (await query('2027-09-04')).json();
    assert.deepEqual([outside.status, outside.meta.to, outside.routes.length], ['outside', '2027-06-18', 0]);
    assert.equal((await query('2027-02-30')).status, 400);
    const result = await (await query('2026-11-14')).json();
    assert.equal(result.status, 'scheduled');
    const route = result.routes[0];
    const [leg] = route.legs;
    assert.deepEqual([route.line, leg.from.name, leg.to.name], ['L5', 'Sants Estació', 'Sagrada Família']);
    assert.equal(leg.departure, '2026-11-14T14:33:35.000Z');
    assert.equal(leg.arrival, '2026-11-14T14:41:32.000Z');
    assert.ok(leg.points.length > 10 && route.access.seconds > 0);
    const alternative = (await (await query('2026-11-14', ['l5'])).json()).routes[0];
    assert.deepEqual(alternative.legs.map(l => l.name), ['L3', 'L2']);
    assert.ok(Date.parse(alternative.legs[0].arrival) < Date.parse(alternative.legs[1].departure));
    const entries = [{ id: 'stop', kind: 'activity', instant: '2026-11-14T14:33:00Z', duration: 2, zone: 'Europe/Madrid' },
      { id: 'visit', kind: 'activity', instant: '2026-11-14T15:00:00Z', zone: 'Europe/Madrid' }];
    assert.ok(conflicts(entries, [route]).some(warning => /ÖPNV-Fahrt/.test(warning.text)));
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('Meals count full packages and one paid expense replaces the same dinner estimate', () => {
  const [pasta, restaurant] = catalog.mealPlans.barcelona;
  const estimate = mealEstimate(pasta, 3);
  assert.equal(estimate.base, 280);
  assert.deepEqual(estimate.products.map(product => product.quantity), [1, 1, 1]);
  assert.equal(mealEstimate(pasta, 4).base, 480);
  assert.deepEqual([mealEstimate(restaurant, 3).base, mealEstimate(restaurant, 3).terrace], [4900, 5390]);
  const store = openStore(':memory:', catalog);
  try {
    const { state } = store.current(trip.id);
    const dinner = { id: 'manual:dinner-test', trip: trip.id, city: 'barcelona', zone: 'Europe/Madrid', kind: 'activity',
      category: 'food', name: pasta.name, date: '2027-09-03', start: '2027-09-03T19:00:00Z',
      selected: true, mealSlot: 'dinner', mealPlanId: pasta.id, price: euro(280) };
    const draft = { ...state, manual: [dinner] };
    assert.throws(() => store.save(trip.id, 0, draft), /Mahlzeit ist bereits/);
    draft.edits = { 'tripsy:activity:4323010': { selected: false } };
    store.save(trip.id, 0, draft);
    const active = activeItems(trip, draft);
    assert.equal(calculateBudget(active, draft).byCategory.food, 280);
    const expense = { id: 'receipt', name: 'Pasta · Kassenbon', date: dinner.date, kind: 'expense',
      forItem: dinner.id, category: 'food', price: euro(335), payment: 'paid', payer: 0 };
    const recorded = { ...draft, expenses: [expense] };
    store.save(trip.id, 1, recorded);
    const budget = calculateBudget(active, recorded);
    assert.equal(budget.byCategory.food, 335);
    assert.deepEqual(budget.rows.find(row => row.id === expense.id).split, [112, 112, 111]);
    assert.equal(budget.rows.some(row => row.id === dinner.id), false);
    assert.throws(() => store.save(trip.id, 2, { ...recorded, expenses: [expense, { ...expense, id: 'duplicate' }] }), /Zuordnung/);
    assert.equal(store.current('interrail_swiss').state.manual.length, 0);
  } finally { store.close(); }
});

test('Nice keeps separate stay dates, preserves the historical amount and compares valid ticket windows for three', () => {
  const august = catalog.trips.find(t => t.id === 'interrail_august');
  const original = t => t.items.find(i => i.id === 'research:opt-nice-antares');
  assert.equal(original(trip).stayFrom, '2027-09-08');
  assert.equal(original(august).stayFrom, '2027-08-22');
  assert.deepEqual(original(trip).point, [43.704986, 7.264144]);
  assert.equal(original(trip).price, null);
  assert.equal(trip.items.find(i => i.id === 'tripsy:lodging:1407386').price.cents, 26950);
  assert.equal(august.items.find(i => i.id === 'tripsy:activity:4241476').city, 'genoa');
  assert.deepEqual(ticketBreakEven({ ...transitFares.nice, rides: 5, travellers: 3 }),
    { singles: 2550, comparison: 2100, savings: 450, firstSaving: 5 });
  const store = openStore(':memory:', catalog);
  try {
    const { revision, state } = store.current(trip.id);
    store.save(trip.id, revision, { ...state, mobility: { nice: 5 } });
    const changed = store.current(trip.id).state;
    assert.equal(changed.mobility.nice, 5);
    assert.equal(store.current(august.id).state.mobility.nice, undefined);
    assert.equal(calculateBudget(activeItems(trip, changed), changed).total, calculateBudget(activeItems(trip, state), state).total);
  } finally { store.close(); }
});

test('A whole-day timeline preserves rail endpoints and the original Swiss car itinerary', () => {
  const swiss = catalog.trips.find(t => t.id === 'interrail_swiss');
  const lakes = catalog.trips.find(t => t.id === 'swiss_lakes');
  const train = dayEntries(swiss.items.filter(i => i.selected), '2027-09-10').filter(i => i.id === 'tripsy:transport:3890067');
  assert.deepEqual(train.map(i => [i.role, i.placeCity, i.time]), [['Abfahrt', 'nice', '07:20'], ['Ankunft', 'kandersteg', '19:30']]);
  assert.notEqual(train[0].entryKey, train[1].entryKey);
  assert.deepEqual(train[1].point, [46.49519, 7.67148]);
  const entries = dayEntries(lakes.items.filter(i => i.selected), '2027-09-06');
  assert.ok(entries.some(i => i.placeCity === 'appenzell' && i.mode === 'roadtrip'));
  const start = entries.find(i => i.placeRole === 'seealp-start');
  const lake = entries.find(i => i.placeRole === 'seealp-lake');
  assert.deepEqual([start.placeCity, lake.placeCity], ['wasserauen', 'seealpsee']);
  assert.match(alpineAccess(start, lake).label, /T2/);
  assert.equal(lakes.items.find(i => i.id === 'research:a040').price, null);
  const bachalp = dayEntries(lakes.items.filter(i => i.selected), '2027-09-08', 'bachalpsee');
  const first = dayEntries(lakes.items, '2027-09-08').find(i => i.placeRole === 'first-lift');
  assert.ok(conflicts(bachalp, []).some(warning => /First erreichen/.test(warning.text)));
  assert.equal(conflicts(bachalp, [], [first, ...bachalp]).some(warning => /First erreichen/.test(warning.text)), false);
});

test('The 2027 lift window and the walk after the gondola trigger distinct Swiss day warnings', () => {
  const swiss = catalog.trips.find(t => t.id === 'interrail_swiss');
  const lakes = catalog.trips.find(t => t.id === 'swiss_lakes');
  const swissDay = dayEntries(swiss.items.filter(i => i.selected), '2027-09-11', 'kandersteg');
  assert.ok(conflicts(swissDay, []).some(warning => /allein der Fußweg/.test(warning.text)));
  assert.equal(conflicts(swissDay, []).some(warning => /Gondelbetrieb am Reisetag/.test(warning.text)), false);
  const lakeDay = dayEntries(lakes.items.filter(i => i.selected), '2027-09-10');
  assert.ok(conflicts(lakeDay, []).some(warning => /08:30–18:00/.test(warning.text)));
  assert.equal(conflicts(lakeDay, []).some(warning => /allein der Fußweg/.test(warning.text)), false);
});

test('100 euros split exactly, negative amounts and weighted remainders are deterministic', () => {
  assert.deepEqual(allocate(10000, [1, 1, 1]), [3334, 3333, 3333]);
  assert.deepEqual(allocate(-10000, [1, 1, 1]), [-3334, -3333, -3333]);
  assert.deepEqual(allocate(101, [50, 25, 25]), [51, 25, 25]);
  assert.equal(minor('435,24'), 43524);
  assert.throws(() => minor('0,001'));
  assert.equal(groupPrice({ ...euro(10000), party: 3 }, 4), null);
});

test('Payments and refunds settle to zero, with dated conversion and no duplicate housing cost', () => {
  const store = openStore(':memory:', catalog);
  const { state } = store.current(trip.id);
  const lodging = trip.items.find(i => i.name === 'Bird House');
  state.edits[lodging.id] = { selected: true };
  state.expenses = [
    { id: 'expense:1', name: 'Vorauszahlung', price: euro(10000), payment: 'paid', payer: 0 },
    { id: 'expense:2', name: 'Teilrückerstattung', price: { ...euro(-5000), currency: 'CHF' }, payment: 'refund', payer: 0, fx: { rate: '1.06', date: '2026-11-09' } },
    { id: 'expense:3', name: 'Individueller Einkauf', price: euro(123), payment: 'paid', payer: 2, split: { mode: 'fixed', values: [0, 0, 123] } },
  ];
  const active = activeItems(trip, state);
  const result = calculateBudget(active, state);
  assert.equal(result.total, 43524 + 10000 - 5300 + 123);
  assert.equal(result.rows.filter(i => i.kind === 'lodging').length, 1);
  assert.equal(result.rows.some(i => i.name.startsWith('St Christopher')), false);
  assert.deepEqual(result.nets, [3133, -1566, -1567]);
  const running = result.nets.slice();
  for (const { from, to, cents } of result.transfers) { running[from] += cents; running[to] -= cents; }
  assert.deepEqual(running, [0, 0, 0]);
  assert.equal(fxAmount(1, { rate: '0.5', date: '2026-11-09' }), 1);
  assert.equal(fxAmount(100, { rate: '1.06' }), null);
  store.close();
});

test('Flexi Pass covers direct overnight journey on departure day, further train uses next day', () => {
  const ride = (id, start, end) => ({ id, kind: 'transport', mode: 'train', start, end, zone: 'Europe/Paris' });
  const night = ride('a', '2027-08-17T20:15:00Z', '2027-08-18T05:00:00Z');
  const connection = ride('b', '2027-08-18T08:42:00Z', '2027-08-18T09:58:00Z');
  const pass = { from: '2027-08-17', to: '2027-08-18', days: 7 };
  assert.deepEqual(interrail([night], pass).days, ['2027-08-17']);
  assert.deepEqual(interrail([night, connection], pass).days, ['2027-08-17', '2027-08-18']);
  assert.equal(interrail([night], { ...pass, to: '2027-08-17' }).issues.length, 1);
  assert.deepEqual(interrail([ride('early', '2027-08-17T13:00:00Z', '2027-08-18T01:00:00Z')], pass).days, ['2027-08-17']);
});

test('Local times handle midnight, different zones, gaps and ambiguous clocks', () => {
  assert.deepEqual(localParts('2027-09-04T21:30:00Z', 'Europe/Madrid'), { date: '2027-09-04', time: '23:30' });
  assert.equal(localParts('2027-09-04T22:30:00Z', 'Europe/Madrid').date, '2027-09-05');
  assert.equal(localParts('2027-09-04T22:30:00Z', 'Europe/London').date, '2027-09-04');
  assert.throws(() => utcFromLocal('2027-03-28', '02:30', 'Europe/Berlin'), /existiert/);
  assert.throws(() => utcFromLocal('2027-10-31', '02:30', 'Europe/Berlin'), /mehrdeutig/);
  assert.equal(utcFromLocal('2027-10-31', '02:30', 'Europe/Berlin', '2027-10-31T01:30:00Z'), '2027-10-31T01:30:00.000Z');
});

test('Opening times, overlaps and short transfers use current selected stops and data', () => {
  const list = [
    { id: 'a', name: 'Ort A', kind: 'activity', city: 'barcelona', start: '2027-09-04T08:00:00Z', duration: 60, zone: 'Europe/Madrid', hours: ['12:00', '21:00'] },
    { id: 'b', name: 'Ort B', kind: 'activity', city: 'barcelona', start: '2027-09-04T09:10:00Z', duration: 20, zone: 'Europe/Madrid', buffer: 5 },
    { id: 'c', name: 'Ort C', kind: 'activity', city: 'barcelona', start: '2027-09-04T09:25:00Z', zone: 'Europe/Madrid' },
  ];
  const warnings = conflicts(dayEntries(list, '2027-09-04', 'barcelona'), [{ minutes: 12 }]);
  assert.equal(warnings.length, 3);
  assert.match(warnings[0].text, /Öffnungsfenster/);
  assert.match(warnings[1].text, /Puffer/);
  assert.match(warnings[2].text, /überschneidet/);
});

test('Mobility card compares only entered eligible rides and adds extra single tickets beyond the limit', () => {
  const values = { single: 290, pass: 1300, included: 10, travellers: 3 };
  assert.deepEqual(ticketBreakEven({ ...values, rides: 5 }), { singles: 4350, comparison: 3900, savings: 450, firstSaving: 5 });
  assert.equal(ticketBreakEven({ ...values, rides: 12 }).comparison, 5640);
});

test('Age tariff preserves actual individual prices and uses the standard fare when unknown', () => {
  const option = trip.items.find(i => i.name === 'Sagrada Família');
  const people = [{ age: 18 }, { age: 40 }, { age: null }];
  const priced = priceForParty(option, people);
  assert.deepEqual(priced.individual, [2400, 2600, 2600]);
  assert.equal(priced.cents, 7600);
  const budget = calculateBudget([option], { people, expenses: [] });
  assert.deepEqual(budget.balances.map(b => b.share), [2400, 2600, 2600]);
});

test('An Interrail scenario charges the pass and opted-in seat cost once instead of the single ticket', () => {
  const legs = [
    { id: 'train-a', name: 'A → B', kind: 'transport', mode: 'train', price: euro(12000, 'person'), reservation: euro(3500, 'person') },
    { id: 'train-b', name: 'B → C', kind: 'transport', mode: 'train', passUse: false, price: euro(1000, 'person') },
  ];
  const state = { people: [{}, {}, {}], expenses: [], pass: { budgetMode: 'interrail', cost: 28600, includeReferences: true } };
  assert.equal(calculateBudget(legs, state).total, (28600 + 3500 + 1000) * 3);
  state.pass.purchased = true;
  assert.equal(calculateBudget(legs, state).total, (3500 + 1000) * 3);
  state.pass.includeReferences = false;
  const b = calculateBudget(legs, state);
  assert.equal(b.total, 3000);
  assert.equal(b.unknown, 1);
});

test('Paris and Sète extend the shared catalogue without moving original stops or carrying dates between variants', () => {
  const [classic, swiss, august] = catalog.trips;
  const eiffel = classic.items.find(i => i.id === 'research:a033');
  assert.equal(eiffel.city, 'paris');
  assert.equal(eiffel.price.cents, 1480);
  assert.equal(priceForParty(eiffel, [{ age: 18 }, { age: null }, { age: 10 }]).cents, 2600);
  assert.equal(classic.items.find(i => i.id === 'research:a032').price, null);
  const georges = t => t.items.find(i => i.id === 'research:opt-sete-georges');
  assert.ok(georges(classic).point);
  assert.equal(georges(classic).stayFrom, '2027-09-06');
  assert.equal(georges(august).stayFrom, '2027-08-20');
  assert.equal(georges(swiss).selected, false);
  assert.equal(georges(august).price, null);
});

test('SQLite preserves edits through reopen and rejects stale revisions, with independent copies', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'reiseplan-test-'));
  const filename = join(folder, 'test.sqlite');
  let db;
  try {
    db = openStore(filename, catalog);
    const { state } = db.current(trip.id);
    const option = trip.items.find(i => i.name === 'Park Güell · Monumentalzone');
    state.edits[option.id] = { selected: true, date: '2027-09-04' };
    db.save(trip.id, 0, state);
    assert.throws(() => db.save(trip.id, 0, state), /anderen Fenster/);
    const { id: copy } = db.duplicate(trip.id, 'Abweichende Variante');
    db.close();
    db = openStore(filename, catalog);
    assert.equal(db.current(trip.id).state.edits[option.id].selected, true);
    const v = db.current(copy);
    v.state.edits[option.id].selected = false;
    db.save(copy, v.revision, v.state);
    assert.equal(db.current(trip.id).state.edits[option.id].selected, true);
    assert.equal(db.current(catalog.trips[1].id).state.edits[option.id], undefined);
  } finally { db?.close(); await rm(folder, { force: true, recursive: true }); }
});

test('Delimited research import is idempotent; mismatches are surfaced and remain alternatives', () => {
  assert.deepEqual(parseDelimited('\uFEFFid;name\r\n1;"Name; mit ""Anführungen"""'), [{ id: '1', name: 'Name; mit "Anführungen"' }]);
  const db = openStore(':memory:', catalog);
  const csv = 'id;name;city;amount;source_url\nA;Stadtspaziergang;barcelona;15;https://example.org/';
  assert.deepEqual(db.import(trip.id, 'source.csv', csv), { inserted: 1, existing: 0, conflicts: 0 });
  assert.deepEqual(db.import(trip.id, 'source.csv', csv), { inserted: 0, existing: 1, conflicts: 0 });
  assert.deepEqual(db.import(trip.id, 'source.csv', csv.replace(';15;', ';25;')), { inserted: 0, existing: 0, conflicts: 1 });
  const { state, imported } = db.current(trip.id);
  assert.equal(imported[0].price.cents, 1500);
  assert.equal(activeItems(trip, state, imported).some(i => i.id === imported[0].id), false);
  assert.equal(db.current(catalog.trips[1].id).imported.length, 0);
  db.close();
});

test('API serves checked foot routes and rejects invalid, private and cross-site requests', async () => {
  const { server } = await createApp({ database: ':memory:', upstream: false });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const post = body => fetch(url + '/api/walk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(url + '/data/tripsy-1297194.json')).status, 404);
    assert.equal((await fetch(url + '/api/bootstrap', { headers: { origin: 'https://example.org' } })).status, 403);
    assert.equal((await post({ points: [[0, 0], [99, 0]] })).status, 400);
    const cached = await (await post({ points: [[41.3955, 2.2077], [41.3886, 2.1867]], cachedOnly: true })).json();
    assert.ok(cached.points.length > 5 && cached.metres > 1000 && cached.minutes > 0);
    assert.match(cached.source, /OSRM/);
    assert.equal((await post({ points: [[41, 2], [41.01, 2.01]] })).status, 503);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
