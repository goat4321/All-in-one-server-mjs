import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { seedCity, seedSnapshot } from '../lib/seed-fallback.mjs';
import { localParts } from '../public/model.mjs';

const load = async name => JSON.parse(await readFile(new URL('../data/' + name + '.json', import.meta.url), 'utf8'));
const [trips, destinations, transport, activities, accommodations] = await Promise.all(
  ['trips', 'destinations', 'transport', 'activities', 'accommodations'].map(load)
);
const cities = Object.fromEntries(destinations.map(city => [city.id, city]));
const input = { transport, activities, accommodations, cities };

test('Offline seed preserves four independent trip variants and source group sizes', () => {
  assert.equal(trips.length, 4);
  assert.deepEqual(trips.map(t => t.travellers), [3, 3, 3, 4]);
  for (const trip of trips) {
    const snapshot = seedSnapshot(trip, input);
    assert.equal(snapshot.seedFallback, true);
    assert.equal(snapshot.resources.transportations.count, transport.filter(row => row.trip_id === trip.id).length);
    assert.ok(snapshot.resources.transportations.items.every(row => row.fromSeed && row.id));
    assert.ok(snapshot.resources.hostings.items.every(row => row.fromSeed && !row.starts_at && row.seedFrom && row.seedTo));
    assert.ok(snapshot.resources.activities.items.every(row => row.fromSeed && row.all_day));
    assert.equal(snapshot.resources.expenses.count, 0);
  }
});

test('The provisional Paris–Toulouse night train has a next-day arrival in Toulouse local time', () => {
  const august = seedSnapshot(trips.find(trip => trip.id === 'interrail_august'), input);
  const night = august.resources.transportations.items.find(row => /Paris Austerlitz/i.test(row.departure_description) && /Toulouse/i.test(row.arrival_description));
  assert.ok(night);
  assert.deepEqual(localParts(night.departure_at, night.departure_timezone), { date: '2027-08-17', time: '22:15' });
  assert.deepEqual(localParts(night.arrival_at, night.arrival_timezone), { date: '2027-08-18', time: '07:00' });
  assert.ok(night.fromSeed);
});

test('Local 2027 plan values are not fabricated bookings, precise points or timetable confirmations', () => {
  for (const trip of trips) {
    const s = seedSnapshot(trip, input);
    assert.ok(s.description.includes('Tripsy-Rohkopien fehlen'));
    for (const row of s.resources.transportations.items) {
      assert.equal(row.latitude, undefined);
      assert.equal(row.longitude, undefined);
      assert.equal(row.booking_status, undefined);
      assert.equal(row.scheduled_2027_confirmed, undefined);
    }
  }
});

test('City mapping respects variant membership and does not assign foreign destinations', () => {
  const classic = trips.find(trip => trip.id === 'interrail_classic');
  assert.equal(seedCity('Paris Gare de Lyon', classic.ordered_destination_ids), 'paris');
  assert.equal(seedCity('Venezia Santa Lucia', classic.ordered_destination_ids), 'venice');
  assert.equal(seedCity('Toulouse Matabiau', classic.ordered_destination_ids), null);
});
