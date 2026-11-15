import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {loadSurveyFirstV19} from '../lib/research-v19.mjs';
import {loadResearchV20} from '../lib/research-v20.mjs';
import {planCostSignal} from '../public/visual-experience.mjs';
import {v20RailStatus,v20FoodResearch,v20DataLedger} from '../public/research-v20-ui.mjs';
import {initialState} from '../lib/store.mjs';
import {activeItems} from '../public/model.mjs';

test('V20 archived research covers every 57/35/29/40 item, sourced points and offer scopes',async()=>{
  const archive=await loadSurveyFirstV19();
  const catalog=await loadCatalog();
  const raw=await loadResearchV20(archive.activities.items,catalog.cities);
  assert.equal(raw.activities.items.length,57);
  assert.equal(raw.activities.withSourcedPoint,35);
  assert.equal(raw.lodging.items.length,35);
  assert.equal(raw.lodging.updatedSearchOffers,22);
  assert.equal(raw.lodging.independentPointMatches,19);
  assert.equal(raw.lodging.providerLocationConflicts,1);
  assert.equal(raw.indoor.items.length,8);
  assert.equal(raw.railFood.transport.length,29);
  assert.equal(raw.railFood.food.length,40);
  assert.equal(new Set(raw.indoor.items.map(x=>x.id)).size,8);
  assert.ok(raw.railFood.transport.every(x=>x.departure===null&&x.arrival===null
    &&x.trainNumber===null&&x.ticketPriceCents===null&&x.bookableConfirmed===false));
  assert.ok(raw.railFood.food.every(x=>x.noAutomaticReplacement===true&&!x.noBooking===false));
});

test('Published 2027 rate, eligibility, precise provenance and CHF are correctly separated',async()=>{
  const c=await loadCatalog();
  const x=c.trips.find(t=>t.id==='interrail_classic');
  const eiffel=x.items.find(i=>i.id==='survey-v19:act-006');
  const louvre=x.items.find(i=>i.id==='survey-v19:act-005');
  const nice=x.items.find(i=>i.id==='survey-v19:act-024');
  const barcelona=x.items.find(i=>i.id==='survey-v19:act-012');
  const hotel=x.items.find(i=>i.id==='survey-v19:lod-001');
  assert.equal(eiffel.price.cents,760);
  assert.equal(eiffel.researchV20.priceKind,'published_2027');
  assert.ok(eiffel.geoEvidence.url.startsWith('https://'));
  assert.equal(louvre.price,null,'free admission must be conditional on EEA eligibility');
  assert.equal(planCostSignal(louvre,3).tier,'€?');
  assert.match(planCostSignal(louvre,3).amount,/Bedingt kostenlos/);
  assert.equal(nice.price.cents,0);
  assert.match(nice.openingHoursNote,/2027-09-30/);
  assert.equal(barcelona.price.cents,2400);
  assert.equal(barcelona.researchV20.priceKind,'current_tariff_not_2027_guaranteed');
  assert.ok(hotel.geoEvidence?.url.startsWith('https://'));
  assert.equal(hotel.price.cents,19760,'original quote must not mutate active financial sources');
  assert.equal(hotel.researchV20.lastSearch.totalCents,19760);
  assert.equal(hotel.researchV20.lastSearch.roomConfigurationVerified,false);
  assert.match(planCostSignal(hotel,3).note,/Checkout/);
  const swiss=c.trips.find(t=>t.id==='swiss_lakes');
  const gondola=swiss.items.find(i=>i.id==='survey-v19:act-053');
  assert.ok(gondola.researchV20.priceReference);
  assert.equal(gondola.price,null);
  const pool=swiss.items.find(i=>i.id==='survey-v20-indoor:indoor-sportzentrum-grindelwald-pool');
  assert.ok(pool);
  assert.equal(planCostSignal(pool,4).tier,'€?');
  assert.match(planCostSignal(pool,4).amount,/CHF/);
});

test('Euro-tier thresholds apply across old and new data, no artificial market ratings',()=>{
  const hotel=(cents,from='2027-09-01',to='2027-09-03')=>
    ({kind:'lodging',id:'h',stayFrom:from,stayTo:to,price:{cents,currency:'EUR',scope:'group',party:3}});
  assert.equal(planCostSignal(hotel(12000),3).tier,'€');
  assert.equal(planCostSignal(hotel(18000),3).tier,'€€');
  assert.equal(planCostSignal(hotel(40000),3).tier,'€€€');
  assert.equal(planCostSignal(hotel(18000,'2027-09-01','2027-09-01'),3).tier,'€?');
  const menu={kind:'activity',category:'food',price:null,
    menuPriceResearchV08:{menuReference:{dateLabel:'Nov 2026',
      sample:[{name:'Menu',kind:'fixed_menu',amountCents:2450}]}}};
  assert.equal(planCostSignal(menu,3).tier,'€€');
  const snack={...menu,menuPriceResearchV08:{menuReference:{dateLabel:'Nov 2026',
    sample:[{name:'Cicchetto',kind:'cicchetto',amountCents:200}]}}};
  assert.equal(planCostSignal(snack,3).tier,'€?');
  assert.equal(planCostSignal({kind:'activity',price:{cents:0,currency:'EUR',scope:'person'}},3).tier,'0 €');
});

test('All new indoor options remain opt-in and each price/point source resolves',async()=>{
  const c=await loadCatalog();
  const unique=new Set();
  for(const trip of c.trips){
    const newly=trip.items.filter(i=>i.id.startsWith('survey-v20-indoor:'));
    for(const i of newly){
      unique.add(i.id);
      assert.equal(i.booked,false);
      assert.equal(i.selected,false);
      assert.equal(i.point,null);
      assert.ok(i.source.every(ref=>Boolean(c.sources[ref])));
      assert.ok(i.website.startsWith('https://'));
    }
    const active=activeItems(trip,initialState(trip));
    assert.ok(active.every(i=>!i.id.startsWith('survey-v19:')&&!i.id.startsWith('survey-v20-indoor:')));
    assert.equal(new Set(trip.items.map(i=>i.id)).size,trip.items.length);
  }
  assert.equal(unique.size,8);
});

test('Evidence UI exposes details but no booking/payment actions',async()=>{
  const c=await loadCatalog();
  const trip=c.trips.find(t=>t.id==='interrail_classic');
  const ctx={catalog:c,trip,cities:c.cities,people:[{},{},{}],
    city:'paris',all:trip.items,activeSet:new Set()};
  const rail=v20RailStatus(ctx);
  assert.match(rail,/2027/);
  assert.match(rail,/Abfahrtszeit/);
  assert.doesNotMatch(rail,/data-action="book"/);
  assert.match(v20FoodResearch(ctx),/Essensideen/);
  const data=v20DataLedger(ctx);
  assert.match(data,/Einzelprüfung/);
  assert.match(data,/30/);
  assert.doesNotMatch(data,/data-action="pay"/);
});


test('Optional Montpellier Geo lead stays auditable but not auto-promoted into a journey',async()=>{
 const catalog=await loadCatalog();
 const {v20DataLedger}=await import('../public/research-v20-ui.mjs');
 const c={catalog,all:catalog.trips[0].items,cities:catalog.cities,trip:catalog.trips[0]};
 const html=v20DataLedger(c);
 assert.match(html,/verifizierte Georeferenz\(en\) für noch nicht aktive Alternativstädte/);
 assert.match(html,/Montpellier/);
 assert.match(html,/Place de la Comédie|Altstadt Montpellier/);
 assert.match(html,/mapcarta\.com\/W80524864/);
 assert.equal(catalog.cities.montpellier,undefined);
});
