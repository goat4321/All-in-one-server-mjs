import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calendarMonthsBefore, railSalesStatus, reviewProgress } from '../public/verification.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { initialState, validateState } from '../lib/store.mjs';
import { activeItems, calculateBudget } from '../public/model.mjs';

const catalog = await loadCatalog();
const classic = catalog.trips.find(t => t.id === 'interrail_classic');
const swiss = catalog.trips.find(t => t.id === 'swiss_lakes');
const firstHotel = classic.items.find(item => item.quote?.id === 'bcom_12814471');
const firstLeg = classic.items.find(item => item.kind === 'transport' && item.mode === 'train');
const evidence = 'https://www.booking.com/hotel/es/heylola-hostel.html';

test('Month arithmetic clamps calendar edge days (non leap-year February)', () => {
  assert.equal(calendarMonthsBefore('2027-09-01', 6), '2027-03-01');
  assert.equal(calendarMonthsBefore('2027-08-31', 6), '2027-02-28');
  assert.equal(calendarMonthsBefore('2028-08-31', 6), '2028-02-29');
  assert.throws(() => calendarMonthsBefore('2027-02-30', 6), /Ungültiger/);
});

test('SNCF September travel is outside officially announced 2 July 2027 bookable period', () => {
  const sncf = railSalesStatus({ route: 'Paris Gare de Lyon → Barcelona Sants', date_local: '2027-09-03' });
  assert.equal(sncf.status, 'not_in_published_window');
  assert.equal(sncf.publishedThrough, '2027-07-02');
  assert.match(sncf.text, /nicht|nach/i);
  const international = railSalesStatus({ route: 'München Hbf → Paris Est', date_local: '2027-09-01' });
  assert.equal(international.earliestReview, '2027-03-01');
  assert.ok(international.approximate);
});

test('Review is user-reported only, not booking verification', () => {
  const empty = reviewProgress('lodging', null);
  assert.deepEqual(empty, { count: 0, total: 5, complete: false, description: 'Noch nicht geprüft' });
  const complete = reviewProgress('lodging', {
    checkedAt: '2026-11-12', evidenceUrl: evidence,
    checks: { room: true, beds: true, taxes: true, cancellation: true, checkout: true },
  });
  assert.equal(complete.complete, true);
  assert.match(complete.description, /kein Buchungsnachweis/);
  assert.equal(reviewProgress('transport', { checkedAt: '2026-11-12', evidenceUrl: evidence,
    checks: { timetable: true, operator: true } }).complete, false);
});

test('Original research quote remains unselected after entering local-only evidence', () => {
  assert.ok(firstHotel);
  const state = initialState(classic);
  state.verifications[firstHotel.id] = {
    kind: 'lodging', checkedAt: '2026-11-12', evidenceUrl: evidence,
    checks: { beds: true, room: false, taxes: false, checkout: false, cancellation: false },
    quotedCents: 31000, groupSize: 3, note: 'Nur die Gruppengröße bekannt',
  };
  assert.doesNotThrow(() => validateState(state, classic, []));
  assert.equal(activeItems(classic, state).some(item => item.id === firstHotel.id), false);
  assert.equal(calculateBudget(activeItems(classic, state), state).rows.some(item => item.id === firstHotel.id), false);
  assert.equal(firstHotel.price.cents, 28590);
  assert.equal(swiss.items.some(item => item.id === firstHotel.id), false);
});

test('Unsupported item, future data shape, invalid URL, wrong party and negative amounts are rejected', () => {
  const state = initialState(classic);
  state.verifications[firstLeg.id] = {
    kind: 'transport', checkedAt: '2026-11-12', evidenceUrl: 'https://www.bahn.de',
    checks: { timetable: false }, groupSize: 3, quotedCents: null, note: '',
  };
  assert.doesNotThrow(() => validateState(state, classic, []));
  const corrupt = patch => ({ ...state, verifications: {
    [firstLeg.id]: { ...state.verifications[firstLeg.id], ...patch },
  } });
  assert.throws(() => validateState(corrupt({ checks: { hacked: true } }), classic, []), /Prüfstatus/);
  assert.throws(() => validateState(corrupt({ evidenceUrl: 'javascript:alert(1)' }), classic, []), /Prüfstatus/);
  assert.doesNotThrow(() => validateState(corrupt({ groupSize: 4 }), classic, []));
  assert.equal(reviewProgress('transport', {
    ...state.verifications[firstLeg.id], groupSize: 4,
  }, 3).description, 'Andere Gruppengröße · neu prüfen');
  assert.throws(() => validateState(corrupt({ quotedCents: -1 }), classic, []), /Prüfstatus/);
});
