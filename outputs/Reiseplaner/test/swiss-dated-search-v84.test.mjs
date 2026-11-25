import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {validateSwissDatedSearchV84} from '../lib/swiss-dated-search-v84.mjs';
import {swissDatedSearchBoardV84,swissRailPrecisionV84} from '../public/swiss-dated-search-v84.mjs';
import {swissInterrailRailV82} from '../public/swiss-interrail-focus-v82.mjs';

const read=async file=>JSON.parse(await readFile(new URL('../data/'+file,import.meta.url),'utf8'));
const archive=await read('research-v84/interrail-swiss-provider-rail.json');
const stays=await read('accommodations.json');
const previous=await read('research-v82/interrail-swiss-focus.json');
const catalog=await loadCatalog();
const trips=catalog.trips;
const real=trips.find(t=>t.id==='interrail_swiss');
const ctx=trip=>({trip,catalog,people:Array.from({length:trip.travellers},(_,i)=>({id:i+1}))});
const eur=(n)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n/100);

test('V84 provider search evidence is exact 3 adults, 1 room, 2 nights for September 2027',()=>{
 assert.equal(archive.meta.provider,'Booking.com');
 assert.equal(archive.meta.quoteStatus,'provider_search_result_not_checkout');
 assert.equal(archive.meta.providerSearchEntries,20);
 assert.equal(archive.quotes.length,2);
 const stats=catalog.research.interrailSwissDatedV84.stats;
 assert.equal(stats.tripId,'interrail_swiss');
 assert.equal(stats.sources,20);
 assert.equal(stats.party,3);
 assert.equal(stats.rooms,1);
 assert.equal(stats.booked,0);
 assert.equal(stats.checkoutsCompleted,0);
 assert.equal(stats.roomAssignmentVerified,false);
 assert.equal(stats.optionalExtraFeesKnown,false);
 assert.equal(stats.originalRouteChanged,false);
 assert.equal(stats.otherVariantChanged,false);
 const cityDates={
  kandersteg:['2027-09-10','2027-09-12'],
  appenzell:['2027-09-12','2027-09-14'],
 };
 for(const group of archive.quotes){
  assert.deepEqual([group.checkin,group.checkout],cityDates[group.city]);
  assert.equal(group.rows.length,10);
  let prev=0;
  for(const p of group.rows){
   assert.ok(p.amountCents>=prev);
   prev=p.amountCents;
   const url=new URL(p.bookingUrl);
   assert.equal(url.hostname,'www.booking.com');
   assert.equal(url.searchParams.get('checkin'),group.checkin);
   assert.equal(url.searchParams.get('checkout'),group.checkout);
   assert.equal(url.searchParams.get('group_adults'),'3');
   assert.equal(url.searchParams.get('no_rooms'),'1');
   assert.equal(url.searchParams.get('selected_currency'),'EUR');
   assert.equal(p.bedLayoutForDisplayedRateVerified,false);
   assert.equal(p.allMandatoryFeesVerified,false);
   assert.equal(p.lateArrivalVerified,false);
   assert.equal(p.freeCancellationVerified,false);
   assert.equal(p.booked,false);
   assert.equal(p.selected,false);
   assert.equal(catalog.sources['swiss-search-v84:'+p.propertyId]?.url,p.bookingUrl);
  }
 }
});
test('V84 separates original Alpina apartment 76 from Hotel Alpina 92, and two distinct Alte Metzg categories',()=>{
 const k=archive.identityChecks.find(x=>x.originalId==='iv-kandersteg');
 const a=archive.identityChecks.find(x=>x.originalId==='iv-appenzell');
 assert.ok(k&&a);
 assert.equal(k.propertyId,10432524);
 assert.equal(k.notSameAsId,66280);
 assert.match(k.correctAddress,/76 Äussere/);
 assert.match(k.notSameAsAddress,/92/);
 assert.equal(a.propertyId,7867225);
 assert.equal(a.notSameAsId,7304669);
 assert.equal(a.importedName,'Alte Metzg Hostel');
 assert.equal(a.correctName,'Alte Metzg - Hostel');
 assert.match(a.providerQa,/Boutique-Pension/);
 assert.deepEqual(catalog.research.interrailSwissDatedV84.stats.oldOriginalComparisons.map(r=>r.originalEuroCents),
  [41795,40815]);
 assert.deepEqual(catalog.research.interrailSwissDatedV84.stats.oldOriginalComparisons.map(r=>r.currentDatedSearchCents),
  [41578,40603]);
 const originalA=stays.find(x=>x.id==='iv-kandersteg');
 const originalB=stays.find(x=>x.id==='iv-appenzell');
 assert.equal(originalA.booking_status,'unbooked');
 assert.equal(originalB.booking_status,'unbooked');
 assert.equal(originalA.is_selected,false);
 assert.equal(originalB.is_selected,false);
});
test('V84 interface shows dated search amounts without pretending checkout, localizes prices and collapses long lists',()=>{
 const html=swissDatedSearchBoardV84(ctx(real));
 assert.match(html,/20 Preise/);
 assert.match(html,/Booking.com-Suchergebnisse/);
 assert.match(html,/keine vollständigen Zimmer-Checkouts/);
 assert.match(html,/82[01],81/);
 assert.match(html,/Alpina Appartment 2/);
 assert.match(html,/Hotel Alpina/);
 assert.match(html,/Alte Metzg - Hostel/);
 assert.match(html,/Alte Metzg - Boutique Pension/);
 assert.match(html,/nicht dieselbe Unterkunft/);
 assert.match(html,/Zusatzkosten/);
 assert.match(html,/417,95/);
 assert.match(html,/415,78/);
 assert.match(html,/408,15/);
 assert.match(html,/406,03/);
 assert.equal((html.match(/class="swiss-v84-hotel"/g)||[]).length,20);
 assert.equal((html.match(/class="swiss-v84-city"/g)||[]).length,2);
 assert.equal((html.match(/Weitere 5 Unterkünfte anzeigen/g)||[]).length,2);
 assert.match(html,/data-city="kandersteg"/);
 assert.match(html,/data-city="appenzell"/);
 assert.match(html,/2027-09-10&amp;checkout=2027-09-12/);
 assert.match(html,/2027-09-12&amp;checkout=2027-09-14/);
 assert.match(html,/Buchungsrabatt/);
});
test('V84 rail guidance fixes the unnecessary Brig–Spiez detour and distinguishes 2026 BLS from 2027 train times',()=>{
 const newRoute=previous.corridors.find(x=>x.key==='simplon');
 assert.match(newRoute.title,/Brig → Kandersteg/);
 assert.match(newRoute.title,/Goppenstein/);
 assert.doesNotMatch(newRoute.title,/Brig → Spiez → Kandersteg/);
 assert.ok(newRoute.sourceUrls.some(x=>x.includes('bls.ch')));
 assert.match(newRoute.note,/2027-Fahrplan/);
 const html=swissRailPrecisionV84(ctx(real));
 assert.match(html,/BLS RE1/);
 assert.match(html,/Brig–Kandersteg/);
 assert.match(html,/EuroCity/);
 assert.match(html,/Wasserauen/);
 assert.match(html,/Oeschinensee/);
 assert.match(html,/kein bestätigter Zugfahrplan 2027/);
 assert.equal((html.match(/class="swiss-v84-rail-note"/g)||[]).length,4);
 assert.match(swissInterrailRailV82(ctx(real)),/BLS RE1 via Goppenstein/);
 for(const row of archive.railClarifications){
  assert.ok(row.sourceUrls.length>=2);
  assert.equal(row.priceCents,null);
  assert.equal(catalog.sources['swiss-rail-v84:'+row.id]?.url,row.sourceUrls[0]);
 }
 assert.equal(archive.meta.liveAvailabilityConfirmed,false);
 assert.equal(catalog.research.interrailSwissDatedV84.stats.actualTrain2027SchedulesConfirmed,0);
});
test('V84 data cannot silently mutate routes, other trips, books, source total or room types',()=>{
 const copy=structuredClone(trips);
 const original=structuredClone(stays);
 const validated=validateSwissDatedSearchV84(copy,original,archive);
 assert.equal(validated.cheapestDisplayedCombinationCents,82181);
 assert.deepEqual(copy,trips);
 assert.deepEqual(original,stays);
 const bad=structuredClone(archive);
 bad.quotes[0].rows[0].amountCents=100;
 assert.throws(()=>validateSwissDatedSearchV84(copy,original,bad),/V84 unsafe dated search quote/);
 const falseBook=structuredClone(archive);
 falseBook.quotes[0].rows[0].booked=true;
 assert.throws(()=>validateSwissDatedSearchV84(copy,original,falseBook),/V84 unsafe dated search quote/);
 const fakeDate=structuredClone(archive);
 fakeDate.quotes[0].checkin='2027-09-11';
 assert.throws(()=>validateSwissDatedSearchV84(copy,original,fakeDate),/V84 incorrect city\/date/);
 const conflated=structuredClone(archive);
 conflated.identityChecks[0].notSameAsId=10432524;
 assert.throws(()=>validateSwissDatedSearchV84(copy,original,conflated),/V84 unsafe identity reconciliation/);
});
test('V84 only on Interrail with Swiss finale, not the 4-person separate car tour',async()=>{
 for(const t of trips.filter(x=>x.id!=='interrail_swiss')){
  assert.equal(swissDatedSearchBoardV84(ctx(t)),'');
  assert.equal(swissRailPrecisionV84(ctx(t)),'');
 }
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../public/swiss-dated-search-v84.css',import.meta.url),'utf8');
 assert.match(html,/swiss-dated-search-v84\.css/);
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(css,/@media\(max-width:510px\)/);
 assert.match(css,/focus-visible/);
 assert.equal(eur(82181),'821,81 €');
});
