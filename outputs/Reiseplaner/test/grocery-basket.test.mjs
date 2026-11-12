import test from 'node:test';
import assert from 'node:assert/strict';
import { mealPlans } from '../lib/barcelona-meals.mjs';
import { allocate, budgetBreakdown, calculateBudget, groceryBasket, mealEstimate } from '../public/model.mjs';
import { initialState, validateState } from '../lib/store.mjs';

const recipe = mealPlans.barcelona.find(plan => plan.id === 'pasta');
const price = { cents: mealEstimate(recipe, 3).base, currency: 'EUR', scope: 'group' };
const basketProducts = recipe.products.map(({ name, pack, need, cents, source }) =>
  ({ name, pack, need, cents, source }));
const trip = {
  id: 'test', travellers: 3, route: ['barcelona'], from: '2027-09-03',
  to: '2027-09-06', items: [],
};
const meal = (id, date, city = 'barcelona') => ({
  id: 'manual:' + id, trip: 'test', kind: 'activity', category: 'food',
  selected: true, name: recipe.name, city, date, zone: city === 'barcelona' ? 'Europe/Madrid' : 'Europe/Paris',
  start: date + 'T18:00:00Z', end: null, price, mealSlot: 'dinner',
  mealPlanId: recipe.id, requiresKitchen: true, basketProducts,
});
const first = meal('first', '2027-09-03');
const second = meal('second', '2027-09-04');
const third = meal('third', '2027-09-05');

test('Three cooked dinners share purchased packs without duplicate group cost', () => {
  const rows = groceryBasket([first, second, third], 3);
  assert.deepEqual(rows.map(row => [row.name, row.packs, row.total]), [
    ['Macarrones', 2, 160], ['Tomatensoße', 3, 360], ['Kichererbsen, abgetropft', 3, 240],
  ]);
  const state = initialState(trip);
  const budget = calculateBudget([first, second, third], state);
  assert.equal(budget.byCategory.food, 760);
  assert.equal(budget.total, 760);
  assert.equal(budget.rows.filter(row => row.id.startsWith('grocery-budget:')).length, 1);
  assert.equal(budget.rows.filter(row => row.id === first.id).length, 0);
  assert.deepEqual(budget.balances.map(balance => balance.share), allocate(760, [1, 1, 1]));
  assert.equal(budget.balances.reduce((sum, p) => sum + p.share, 0), 760);
});

test('Edited pack count and reference price update budget once, without changing recipe', () => {
  const base = groceryBasket([first, second, third], 3);
  const pasta = base[0];
  const state = { ...initialState(trip), groceryOverrides: {
    [pasta.key]: { packs: 3, unitCents: 100 },
  } };
  const rows = groceryBasket([first, second, third], 3, state.groceryOverrides);
  assert.deepEqual(rows[0].packs, 3);
  assert.equal(rows[0].total, 300);
  assert.equal(rows[0].modified, true);
  assert.equal(calculateBudget([first, second, third], state).total, 900);
  assert.equal(mealEstimate(recipe, 3).base, 280);
  assert.throws(() => groceryBasket([first], 3, { [pasta.key]: { packs: 0, unitCents: 0 } }), /Ungültige/);
});

test('A group increase automatically raises manually saved pack counts when necessary', () => {
  const pasta = groceryBasket([first, second, third], 3)[0];
  const rows = groceryBasket([first, second, third], 4, {
    [pasta.key]: { packs: 2, unitCents: 80 },
  });
  assert.equal(rows[0].minPacks, 3);
  assert.equal(rows[0].packs, 3);
  assert.equal(rows[0].adjustedForGroup, true);
  assert.equal(rows.reduce((sum, row) => sum + row.total, 0), 1040);
});

test('A paid meal receipt replaces only that meal forecast and does not create a duplicate', () => {
  const state = {
    ...initialState(trip),
    expenses: [{
      id: 'receipt', name: 'Bezahltes Abendessen', date: '2027-09-03',
      category: 'food', payment: 'paid', payer: 0, forItem: first.id,
      price: { cents: 335, currency: 'EUR', scope: 'group' },
    }],
  };
  const budget = calculateBudget([first, second, third], state);
  assert.equal(budget.byCategory.food, 895);
  assert.equal(budget.rows.filter(row => row.forItem === first.id).length, 1);
  assert.equal(budget.rows.filter(row => row.id === first.id).length, 0);
  assert.equal(budget.rows.filter(row => row.id.startsWith('grocery-budget:')).length, 1);
});

test('Separate cities and variants never share shopping baskets', () => {
  const paris = meal('paris', '2027-09-05', 'paris');
  const rows = groceryBasket([first, paris], 3);
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map(row => row.city)).size, 2);
  const state = initialState({ ...trip, route: ['barcelona', 'paris'] });
  assert.equal(calculateBudget([first, paris], state).rows.filter(r => r.id.startsWith('grocery-budget:')).length, 2);
});

test('Store validates editable groceries and rejects invalid overrides or recipes', () => {
  const state = { ...initialState(trip), manual: [first] };
  assert.doesNotThrow(() => validateState(state, trip, []));
  assert.throws(() => validateState({ ...state, groceryOverrides: {
    'barcelona:bcn-food-pasta:500:80': { packs: -1, unitCents: 80 },
  } }, trip, []), /Einkaufswarenkorb/);
  assert.throws(() => validateState({ ...state, manual: [{
    ...first, basketProducts: [{ ...basketProducts[0], pack: 0 }],
  }] }, trip, []), /Zutatenplan/);
});

test('Budget city/day breakdown counts known amounts exactly once and keeps unknown prices visible', () => {
  const state = initialState(trip);
  const budget = calculateBudget([first, second, third], state);
  const city = budgetBreakdown(budget.rows, 'city');
  const day = budgetBreakdown(budget.rows, 'date');
  assert.equal(city.find(row => row.key === 'barcelona').cents, 760);
  assert.equal(day.find(row => row.key === '2027-09-03').cents, 760);
  assert.equal(day.find(row => row.key === '2027-09-04'), undefined);
  const rows = [...budget.rows, { name: 'Unpriced train', city: 'barcelona',
    date: '2027-09-04', euros: null }, { name: 'Unknown city', euros: 125 }];
  assert.equal(budgetBreakdown(rows, 'city').find(row => row.key === 'barcelona').unknown, 1);
  assert.equal(budgetBreakdown(rows, 'date').find(row => row.key === '2027-09-04').unknown, 1);
  assert.equal(budgetBreakdown(rows, 'city').find(row => row.key === 'unassigned').cents, 125);
  assert.equal(budgetBreakdown(rows, 'date').reduce((sum, row) => sum + row.cents, 0), 885);
  assert.throws(() => budgetBreakdown(rows, 'unknown'), /Budgetauswertung/);
});
