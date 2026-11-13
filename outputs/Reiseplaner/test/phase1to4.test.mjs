import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { activeItems, interrail } from '../public/model.mjs';
import { initialState } from '../lib/store.mjs';
import { arrangeDayStops, buildMultiStopDay } from '../public/day-route.mjs';
import { assessStay, sortStayOptions } from '../public/stay-analysis.mjs';
import { auditInterrailRoute, railAlternativeStatus } from '../public/rail-analysis.mjs';

const catalog=await loadCatalog();
const classic=catalog.trips.find(x=>x.id==='interrail_classic');
const swiss=catalog.trips.find(x=>x.id==='swiss_lakes');

test('39 curated cafes, food and groceries are scoped to actual route cities without automatic selection', () => {
  assert.equal(catalog.research.foodVenueResearchV03.length,39);
  assert.equal(catalog.research.activityEvidenceV03.length,6);
  for(const trip of catalog.trips) {
    const added=trip.items.filter(x=>x.id.startsWith('local:food-v03-'));
    const applicable=catalog.research.foodVenueResearchV03.filter(x=>trip.route.includes(x.city));
    assert.equal(added.length,applicable.length,trip.id);
    assert.ok(added.every(x=>x.price==null && x.selected===false
      && (x.point==null || (x.geoEvidence?.url?.startsWith('https://')
        && ['verified_external_coordinates','street_address_match',
          'unique_osm_named_poi','reviewed_osm_named_location'].includes(x.geoEvidence.confidence)))));
    assert.ok(added.every(x=>x.website?.startsWith('https://www.google.com/maps/search/')));
    assert.deepEqual(added.filter(x=>!x.openingHoursNote?.includes('13.11.2026')).map(x=>({id:x.id,hours:x.openingHoursNote})),[],trip.id);
    const active=activeItems(trip,initialState(trip));
    assert.equal(active.filter(x=>x.id.startsWith('local:food-v03-')).length,0);
  }
  assert.ok(classic.items.some(x=>x.name==='La Plata'));
  assert.ok(swiss.items.some(x=>x.name==='Café 3692'));
});

test('Official landmark rules enrich details but never force a new booking or budget price', () => {
  const sf=classic.items.find(x=>x.id==='research:a035');
  const eiffel=classic.items.find(x=>/Eiffelturm zweite Etage/.test(x.name));
  const orsay=classic.items.find(x=>x.id==='official:orsay');
  assert.ok(sf && eiffel && orsay);
  assert.equal(sf.officialEvidence.under30Cents,2400);
  assert.equal(eiffel.officialEvidence.fareVariants[0].cents,740);
  assert.equal(orsay.price,null);
  assert.equal(orsay.selected,false);
  assert.ok(catalog.sources['official-v03:sfam'].url.startsWith('https://sagradafamilia.org'));
});

const a={id:'a',name:'Museum',kind:'activity',city:'barcelona',point:[41.3,2.17],duration:90,zone:'Europe/Madrid'};
const b={id:'b',name:'Restaurant',kind:'activity',city:'barcelona',point:[41.302,2.172],duration:45,zone:'Europe/Madrid'};
const c={id:'c',name:'Park',kind:'activity',city:'barcelona',point:[41.305,2.17],zone:'Europe/Madrid'};
const walk=(m,point1=a.point,point2=b.point)=>({mode:'Fußweg',minutes:m,metres:m*65,walkOnly:true,points:[point1,point2]});
test('3-stop schedule uses only verified walking minutes, preserves known visit durations and labels estimates', () => {
  const result=buildMultiStopDay([a,b,c],[walk(8),walk(12,b.point,c.point)],'09:00');
  assert.equal(result.complete,true);
  assert.deepEqual(result.rows.map(x=>x.at),['09:00','10:38','11:35']);
  assert.deepEqual(result.rows.map(x=>x.until),['10:30','11:23','12:35']);
  assert.equal(result.knownWalkMinutes,20);
  assert.equal(result.rows[2].durationAssumed,true);
  assert.equal(result.estimatedDuration,true);
});
test('Missing roads never receive invented ETA and cross-city routing is rejected', () => {
  const incomplete=buildMultiStopDay([a,b,c],[walk(8)],'09:00');
  assert.equal(incomplete.complete,false);
  assert.deepEqual(incomplete.unknownConnection,['b','c']);
  assert.throws(()=>buildMultiStopDay([a,{...b,city:'paris'}],[walk(5)]),/Stadt/);
  assert.throws(()=>buildMultiStopDay([a,b],[], '35:30'),/Startzeit/);
  assert.deepEqual(arrangeDayStops([a,c,b]).map(x=>x.id),['a','b','c']);
});

test('Accommodation comparison keeps unconfirmed room/taxes and no station-walk guesses', () => {
  const hotel=classic.items.find(x=>x.id==='research:bcom_12814471');
  assert.ok(hotel);
  const x=assessStay(hotel,[{id:'p1'},{id:'p2'},{id:'p3'}],null,null);
  assert.equal(x.totalEuroCents,28590);
  assert.equal(x.personNightEuroCents,3177);
  assert.equal(x.stationWalkMinutes,null);
  assert.equal(x.bedsVerified,false);
  assert.equal(x.checkoutVerifiedByProvider,false);
  assert.ok(x.risk.some(s=>s.includes('Betten')));
  const checked=assessStay(hotel,[{id:'p1'},{id:'p2'},{id:'p3'}],{minutes:11},{
    kind:'lodging',checkedAt:'2026-11-13',groupSize:3,evidenceUrl:'https://www.booking.com',
    checks:{room:true,beds:true,taxes:true,cancellation:true,checkout:true}});
  assert.equal(checked.review.complete,true);
  assert.equal(checked.checkoutVerifiedByProvider,false);
  assert.equal(checked.estimatedReturnWalkPerDay,22);
  const foreign=assessStay({...hotel,price:{cents:10000,currency:'CHF',scope:'group'}},[{id:'p1'}],null,null);
  assert.equal(foreign.totalEuroCents,null);
});
test('Hotel sorting uses only EUR total or real station walking minutes',()=>{
  const sample=classic.items.filter(x=>x.kind==='lodging'&&x.price?.currency==='EUR').slice(0,3);
  const people=Array.from({length:3},(_,i)=>({id:'p'+i}));
  const priceSorted=sortStayOptions(sample,people,{}, {},'total');
  const totals=priceSorted.map(x=>assessStay(x,people,null,null).totalEuroCents??Infinity);
  assert.deepEqual(totals,[...totals].sort((a,b)=>a-b));
  const walked=sortStayOptions(sample,people,{[sample[0].id]:{minutes:15},[sample[1].id]:{minutes:7}},{},'station');
  assert.equal(walked[0].id,sample[1].id);
});

test('Rail audit separates official timetable confirmation, hypothetical reservations, pass departure days and night trains',()=>{
  const legs=activeItems(classic,initialState(classic)).filter(x=>x.kind==='transport');
  const research=catalog.research.transportQueue.filter(x=>x.trip_id===classic.id);
  const audit=auditInterrailRoute(legs,initialState(classic).pass,research);
  assert.equal(audit.missingSchedules,research.filter(x=>x.is_selected_from_original_plan).length);
  assert.equal(audit.unknownTicketPrices,research.filter(x=>x.is_selected_from_original_plan).length);
  assert.ok(audit.dayRows.length>0);
  assert.ok(!audit.all2027Confirmed);
  const h=catalog.research.transportCandidates.find(x=>x.trip_id==='interrail_classic');
  assert.equal(railAlternativeStatus(h).confirmed,false);
  assert.equal(railAlternativeStatus(h).valueCents,null);
});
