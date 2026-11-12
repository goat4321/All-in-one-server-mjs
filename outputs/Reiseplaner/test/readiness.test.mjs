import test from 'node:test';
import assert from 'node:assert/strict';
import { planReadiness } from '../public/model.mjs';

test('Trip dashboard counts open lodging periods, provisional trains and unknown active prices', () => {
  const trip = {
    dataMode: 'research_seed_fallback',
    stayByCity: {
      paris: { from: '2027-09-01', to: '2027-09-03' },
      barcelona: { from: '2027-09-03', to: '2027-09-06' },
    },
  };
  const selected = [
    { kind: 'lodging', city: 'paris', stayFrom: '2027-09-01', stayTo: '2027-09-03' },
    { kind: 'lodging', city: 'barcelona', stayFrom: '2027-09-04', stayTo: '2027-09-06' },
    { kind: 'transport', mode: 'train', verification: 'Fahrplanentwurf' },
    { kind: 'transport', mode: 'train', verification: 'Fahrplan bestätigt' },
  ];
  assert.deepEqual(planReadiness(trip, selected, { unknown: 3 }), {
    missingStays: ['barcelona'], uncheckedTrains: 1, unknownPrices: 3, missingOriginalSources: true,
  });
  // Full cover removes the lodging warning without auto-selecting any alternatives.
  const repaired = [...selected, { kind: 'lodging', city: 'barcelona', stayFrom: '2027-09-03', stayTo: '2027-09-06' }];
  assert.deepEqual(planReadiness({ ...trip, dataMode: 'tripsy_snapshot' }, repaired, { unknown: 0 }), {
    missingStays: [], uncheckedTrains: 1, unknownPrices: 0, missingOriginalSources: false,
  });
});
