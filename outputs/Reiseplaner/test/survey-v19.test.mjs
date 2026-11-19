import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSurveyFirstV19, applySurveyFirstV19 } from '../lib/research-v19.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { allocate } from '../public/model.mjs';
import { surveyV19DayPanel, surveyV19RailPanel, surveyV19FoodPanel,
  surveyV19BudgetPanel, surveyV19DataPanel } from '../public/survey-v19-ui.mjs';

test('survey-first archive preserves 20-file validated research boundaries',async()=>{
  const archive=await loadSurveyFirstV19();
  assert.equal(archive.activities.items.length,57);
  assert.equal(archive.accommodations.items.length,35);
  assert.equal(archive.transport.legs.length,29);
  assert.equal(archive.day_plans.plans.length,17);
  assert.equal(archive.food_evenings.items.length,40);
  assert.equal(archive.fare_rules.fares.length,14);
  assert.equal(archive.budget_scenarios.scenarios.length,4);
  assert.equal(archive.sources.sources.length,28);
  assert.equal(archive.qualityIssues.length,24);
  assert.deepEqual(allocate(10_000,[1,1,1]),[3334,3333,3333]);
});

test('four Tripsy variants stay distinct; candidates unselected; 2027 train times unknown',async()=>{
  const catalog=await loadCatalog();
  const data=catalog.research.surveyFirstV19;
  assert.equal(catalog.trips.length,4);
  assert.equal(data.counts.uniqueActivities,57);
  assert.equal(data.counts.uniqueAccommodations,35);
  assert.equal(data.counts.transportPlans,29);
  assert.equal(data.counts.activities,140);
  assert.equal(data.counts.accommodations,35);
  assert.deepEqual(
    Object.fromEntries(catalog.trips.map(t=>[t.id,data.variants[t.id].activities])),
    {interrail_classic:43,interrail_swiss:41,interrail_august:44,swiss_lakes:12}
  );
  assert.deepEqual(
    Object.fromEntries(catalog.trips.map(t=>[t.id,data.variants[t.id].accommodations])),
    {interrail_classic:24,interrail_swiss:0,interrail_august:0,swiss_lakes:11}
  );
  assert.equal(data.rejected.length,0);
  assert.equal(new Set(data.sources.map(s=>s.id)).size,28);
  for(const t of catalog.trips){
    const added=t.items.filter(x=>x.id.startsWith('survey-v19:'));
    assert.equal(added.length,data.variants[t.id].activities+data.variants[t.id].accommodations);
    assert.equal(new Set(added.map(x=>x.id)).size,added.length);
    assert.ok(added.every(x=>x.selected===false && x.booked===false && x.booking==='ungebucht'));
    assert.ok(added.every(x=>x.source.every(key=>Boolean(catalog.sources[key]))));
    assert.ok(data.variants[t.id].transport.every(x=>
      x.calendar_confirmed_2027===false && x.departure_local===null && x.arrival_local===null
      && x.ticket_price_minor===null && x.seat_booking_status==='unbooked'));
    assert.ok(added.filter(x=>x.kind==='lodging').every(x=>
      x.quote.checkoutConfirmed===false && x.quote.roomConfirmed===false && x.price.party===t.travellers));
    assert.equal(t.items.filter(x=>x.id.startsWith('survey-v19:')).length,added.length);
  }
  assert.ok(catalog.trips.find(t=>t.id==='interrail_swiss').items.some(x=>
    x.city==='grindelwald' && x.id.startsWith('survey-v19:act-')));
  const again=await loadCatalog();
  assert.deepEqual(catalog.trips.map(t=>t.items.length),again.trips.map(t=>t.items.length),
    'Repeat read must not append candidates');
});

test('proposal panels display supported values but do not create a booking or edit action',async()=>{
  const catalog=await loadCatalog();
  const trip=catalog.trips.find(t=>t.id==='interrail_classic');
  const survey=catalog.research.surveyFirstV19;
  const ctx={
    catalog,trip,cities:catalog.cities,city:'paris',date:'2027-09-01',people:[{},{},{}],
    all:trip.items,activeSet:new Set(),
  };
  const day=surveyV19DayPanel(ctx);
  assert.match(day,/Tagesvorschläge/);
  assert.match(day,/data-action="choose"/);
  assert.doesNotMatch(day,/data-action="book"/);
  const rail=surveyV19RailPanel(ctx);
  assert.match(rail,/Nicht buchbare Planung/);
  assert.match(rail,/Reservierung/);
  assert.match(surveyV19FoodPanel(ctx),/Essen, Abend/);
  assert.match(surveyV19BudgetPanel(ctx),/Nur Vergleich/);
  assert.match(surveyV19DataPanel(ctx),/Importprotokoll/);
  assert.equal(survey.allCandidatesUnselected,true);
});
