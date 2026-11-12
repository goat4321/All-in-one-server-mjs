import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog } from '../lib/catalog.mjs';
import { loadResearchV02, scopedQuote, validateResearchV02 } from '../lib/research-v02.mjs';
import { activeItems, allocate, budgetBreakdown, calculateBudget, groupPrice } from '../public/model.mjs';
import { initialState } from '../lib/store.mjs';

const read = async name => JSON.parse(await readFile(new URL('../data/' + name + '.json', import.meta.url), 'utf8'));
const oldTrips = await read('trips');
const research = await loadResearchV02(oldTrips);
const catalog = await loadCatalog();
const byId = id => catalog.trips.find(trip => trip.id === id);

test('All 16 curated JSON sources pass identity, joins, safety and cent integrity checks', () => {
  assert.equal(validateResearchV02(research, oldTrips), true);
  assert.equal(research.activities_comparison_catalog.length, 115);
  assert.equal(research.group_activity_ranking.length, 115);
  assert.equal(research.accommodation_comparison_catalog.length, 118);
  assert.equal(research.accommodation_market_quotes.length, 92);
  assert.equal(research.transport_research_queue.length, 35);
  assert.equal(research.transport_comparison_candidates.length, 13);
  assert.equal(research.fares.length, 35);
  assert.equal(research.sources.length, 65);
  assert.equal(research.data_quality.length, 32);
});

test('All original routes, group sizes, dates and independent variants stay intact', () => {
  assert.equal(catalog.trips.length, 4);
  for (const trip of oldTrips) {
    const imported = byId(trip.id);
    assert.equal(imported.externalId, trip.external_trip_id);
    assert.deepEqual(imported.route, trip.ordered_destination_ids);
    assert.equal(imported.from, trip.start_date);
    assert.equal(imported.to, trip.end_date);
    assert.equal(imported.travellers, trip.travellers);
    const originalActive = activeItems(imported, initialState(imported));
    assert.ok(originalActive.every(item => !item.quote));
  }
});

test('Legacy activity IDs remain unique; 42 survey suggestions are alternatives, not selected originals', () => {
  const activities = byId('interrail_classic').items.filter(item => item.kind === 'activity');
  const newSuggestions = activities.filter(item => item.id.startsWith('research:suggest_'));
  assert.equal(newSuggestions.length, 35);
  assert.ok(newSuggestions.every(item => !item.selected && (!item.point || (item.point.length === 2 && item.point.every(Number.isFinite)))));
  const ids = activities.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  const ranked = newSuggestions.find(item => item.preference?.score != null);
  assert.ok(ranked && ranked.preference.score <= 100);
  assert.ok(ranked.preference.individual.Naol >= 0);
  assert.ok(ranked.verification && ranked.source.length);
});

test('Quoted hotel candidates respect exact stay dates, original trip and party size', () => {
  const expected = {
    interrail_classic: 60, interrail_swiss: 40,
    interrail_august: 0, swiss_lakes: 32,
  };
  for (const [tripId, count] of Object.entries(expected)) {
    const trip = byId(tripId);
    const quoted = trip.items.filter(item => item.id.startsWith('research:bcom_'));
    assert.equal(quoted.length, count, tripId);
    for (const candidate of quoted) {
      assert.equal(candidate.quote.checkoutConfirmed, false);
      assert.equal(candidate.price.party, trip.travellers);
      assert.equal(candidate.selected, false);
      assert.equal(candidate.booked, false);
      assert.equal(candidate.price.scope, 'group');
      assert.equal(candidate.price.cents >= 0, true);
      assert.deepEqual([candidate.stayFrom, candidate.stayTo],
        [trip.stayByCity[candidate.city].from, trip.stayByCity[candidate.city].to]);
      assert.equal(groupPrice(candidate.price, trip.travellers), candidate.price.cents);
    }
    const active = activeItems(trip, initialState(trip));
    assert.ok(active.every(item => !item.quote), tripId + ' selected a search quote unexpectedly');
  }
  const quote = research.accommodation_market_quotes.find(x => x.destination_id === 'barcelona');
  assert.equal(scopedQuote(quote, byId('interrail_august'), byId('interrail_august').stayByCity.barcelona), false);
  assert.equal(scopedQuote(quote, byId('swiss_lakes'), byId('swiss_lakes').stayByCity.barcelona), false);
});

test('Search snapshots are not booked or added to any budget without an explicit selection', () => {
  const classic = byId('interrail_classic');
  const state = initialState(classic);
  const base = calculateBudget(activeItems(classic, state), state);
  const quote = classic.items.find(item => item.quote && item.city === 'barcelona');
  assert.ok(quote);
  const selected = activeItems(classic, { ...state, edits: { [quote.id]: { selected: true } } });
  const chosen = calculateBudget(selected, state);
  const old = activeItems(classic, state);
  assert.equal(old.some(i => i.id === quote.id), false);
  assert.ok(selected.some(i => i.id === quote.id));
  // A quote is a reference, not a payment and cannot be treated as 0 when unknown.
  assert.equal(quote.payment ?? 'open', 'open');
  assert.equal(quote.price.cents % 1, 0);
  assert.ok(chosen.total >= base.total);
  assert.ok(budgetBreakdown(chosen.rows, 'date').some(row =>
    row.key === quote.stayFrom && row.cents >= quote.price.cents));
  assert.deepEqual(allocate(10_000, [1, 1, 1]), [3334, 3333, 3333]);
});

test('Research diagnostics remain reference-only; the three-person survey does not attach to four-person Swiss trip', () => {
  assert.equal(byId('swiss_lakes').travellers, 4);
  assert.ok(byId('swiss_lakes').items.filter(item => item.preference).length === 0);
  assert.equal(catalog.research.groupPreferences.travellers.length, 3);
  assert.equal(catalog.research.budgetScenarios.length, 3);
  assert.ok(catalog.research.budgetScenarios.every(item => !item.is_approved && !item.is_booked));
  assert.ok(catalog.research.transportCandidates.every(item => !item.is_selected && !item.is_bookable_now));
});

test('Three newly observed provider searches remain unbooked and only apply to the matching 3-person Barcelona stay', () => {
  for (const id of ['interrail_classic', 'interrail_swiss', 'interrail_august', 'swiss_lakes']) {
    const trip = byId(id);
    const added = trip.items.filter(item => item.id.startsWith('provider:booking:'));
    assert.equal(added.length, ['interrail_classic','interrail_swiss'].includes(id) ? 3 : 0);
    assert.ok(added.every(item => !item.selected && !item.booked && item.quote.checkoutConfirmed === false));
    assert.ok(activeItems(trip, initialState(trip)).every(item => !added.some(other => other.id === item.id)));
  }
  const hostal = byId('interrail_classic').items.find(item => item.id.startsWith('provider:booking:275242'));
  assert.equal(hostal.price.cents, 47430);
  assert.ok(hostal.positionIssue);
  assert.equal(hostal.price.party, 3);
});
