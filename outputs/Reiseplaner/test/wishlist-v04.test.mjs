import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { initialState } from '../lib/store.mjs';
import { activeItems } from '../public/model.mjs';
import { assessStay } from '../public/stay-analysis.mjs';

const catalog = await loadCatalog();
const all = catalog.research.airbnbWishlistResearchV04;

test('42 private Airbnb wishlist cards are retained with exactly 40 sample price observations', () => {
  assert.equal(all.length, 42);
  assert.equal(new Set(all.map(x => x.id)).size, 42);
  assert.equal(all.filter(x => x.sampleQuote.totalCents !== null).length, 40);
  assert.equal(all.filter(x => x.sampleQuote.totalCents === null).length, 2);
  assert.ok(all.every(x => x.point === null && x.address === null));
  assert.ok(all.every(x => x.sampleQuote.adults === 3));
  assert.ok(all.every(x => /^https:\/\/www\.airbnb\.de\/rooms\/\d+$/.test(x.website)));
});

test('Wishlist comparisons are included only in route cities and never treated as bookings', () => {
  for (const trip of catalog.trips) {
    const options = trip.items.filter(x => x.id.startsWith('wishlist:airbnb:'));
    const eligible = all.filter(x => trip.route.includes(x.city));
    assert.equal(options.length, eligible.length, trip.id);
    assert.ok(options.every(x => x.kind === 'lodging' && x.selected === false
      && x.booked === false && x.point === null && x.price === null), trip.id);
    assert.ok(options.every(x => x.quote?.checkoutConfirmed === false), trip.id);
    assert.ok(options.every(x => catalog.sources['wishlist-v04:' + x.id.split(':').at(-1)]));
    const active = activeItems(trip, initialState(trip));
    assert.equal(active.filter(x => x.id.startsWith('wishlist:airbnb:')).length, 0);
  }
});

test('Sample amounts do not enter the group budget or accommodation score as confirmed prices', () => {
  const trip = catalog.trips.find(x => x.id === 'interrail_classic');
  const option = trip.items.find(x => x.id === 'wishlist:airbnb:1556465665327103237');
  assert.equal(option.quote.sampleTotalCents, 6700);
  assert.equal(option.quote.sampleAdults, 3);
  assert.equal(option.price, null);
  const summary = assessStay(option, [{ id: '1' }, { id: '2' }, { id: '3' }], null);
  assert.equal(summary.totalEuroCents, null);
  assert.equal(summary.stationWalkMinutes, null);
  assert.equal(summary.checkoutVerifiedByProvider, false);
});

test('2026 operator fares are present for Paris, Barcelona, Sète and not mislabeled as 2027', async () => {
  const { transitFares } = await import('../public/transit.mjs');
  assert.deepEqual([transitFares.paris.single, transitFares.paris.pass], [255, 1230]);
  assert.deepEqual([transitFares.barcelona.single, transitFares.barcelona.pass], [290, 1200]);
  assert.deepEqual([transitFares.sete.single, transitFares.sete.pass], [130, 500]);
  assert.ok(/Bus\/Tram.*1,50/.test(transitFares.venice.details));
  assert.ok(/2027/.test(transitFares.paris.details));
});
