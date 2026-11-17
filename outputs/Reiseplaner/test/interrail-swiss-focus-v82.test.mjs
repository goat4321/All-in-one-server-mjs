import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {validateInterrailSwissFocusV82} from '../lib/interrail-swiss-focus-v82.mjs';
import {swissInterrailOverviewV82,swissInterrailDayV82,swissInterrailRailV82} from '../public/swiss-interrail-focus-v82.mjs';
import {dayPlanPanel} from '../public/day-plans-ui.mjs';

const read=async path=>JSON.parse(await readFile(new URL('../data/'+path,import.meta.url),'utf8'));
const archive=await read('research-v82/interrail-swiss-focus.json');
const rawRail=await read('transport.json');
const catalog=await loadCatalog();
const interrail=catalog.trips.find(t=>t.id==='interrail_swiss');
const lakes=catalog.trips.find(t=>t.id==='swiss_lakes');
const ctx=(trip,date='2027-09-11')=>({
 trip,date,catalog,people:Array.from({length:trip.travellers},(_,i)=>({id:i+1})),
 active:[],activeSet:new Set(),all:trip.items,state:{placePhotos:{}},
 cities:catalog.cities,dayPlan:trip.dayPlansV32.find(day=>day.date===date),
});
const expectedDates=['2027-09-01','2027-09-03','2027-09-06','2027-09-08',
 '2027-09-10','2027-09-12','2027-09-14'];
test('V82 applies to original 14-day Swiss Interrail only and preserves 7/7 travel days',()=>{
 assert.ok(interrail);
 assert.ok(lakes);
 assert.equal(interrail.travellers,3);
 assert.equal(interrail.from,'2027-09-01');
 assert.equal(interrail.to,'2027-09-14');
 assert.deepEqual(interrail.route,archive.route);
 assert.equal(archive.meta.expectedPassTravelDays,7);
 assert.equal(archive.passDays.length,7);
 assert.deepEqual(archive.passDays.map(x=>x.date),expectedDates);
 assert.equal(archive.passDays.some(x=>x.date==='2027-09-13'),false);
 const stats=catalog.research.interrailSwissFocusV82.stats;
 assert.equal(stats.matchedTrip,'interrail_swiss');
 assert.equal(stats.baseTripDays,14);
 assert.equal(stats.passDays,7);
 assert.equal(stats.remainingUnusedPassDays,0);
 assert.equal(stats.localWaterauenTicketOutsidePass,true);
 assert.equal(stats.separateSwissLakesUnchanged,true);
 assert.equal(stats.confirmed2027TrainTickets,0);
 assert.equal(stats.modifiedBookings,0);
 assert.equal(stats.modifiedTripRoute,false);
 assert.deepEqual(stats.passDates,expectedDates);
});
test('V82 5 Swiss finish days match untouched old day plan and provide source-scoped alternatives',()=>{
 const dates=['2027-09-10','2027-09-11','2027-09-12','2027-09-13','2027-09-14'];
 assert.deepEqual(archive.days.map(x=>x.date),dates);
 assert.deepEqual(archive.days.map(x=>x.city),
 ['kandersteg','kandersteg','appenzell','appenzell','appenzell']);
 for(const d of archive.days){
  assert.ok(interrail.dayPlansV32.some(p=>p.date===d.date&&p.city===d.city));
  assert.ok(d.mustCheck.length>=3);
  assert.ok(d.alternatives.length>40);
  assert.ok(d.plan.length>80);
  assert.ok(d.sourceUrls.every(x=>x.startsWith('https://')));
  const c=ctx(interrail,d.date);
  const note=swissInterrailDayV82(c);
  assert.match(note,/Schweizer Tagesplanung/);
  assert.ok(note.includes(d.label));
  assert.ok(note.includes(d.plan.slice(0,28)));
  assert.match(note,/Unverbindlicher Tagesentwurf/);
  assert.ok(note.includes(d.sourceUrls[0].replace(/&/g,'&amp;')));
  assert.match(dayPlanPanel(c),/swiss-focus-day/);
 }
 const gondola=archive.days.find(x=>x.date==='2027-09-11');
 assert.match(gondola.mustCheck.join(' '),/24\.04.–19\.09./);
 assert.match(gondola.mustCheck.join(' '),/08:30–18:00/);
 assert.ok(gondola.sourceUrls.some(x=>x.includes('oeschinensee.ch')));
 const seealp=archive.days.find(x=>x.date==='2027-09-13');
 assert.match(seealp.mustCheck.join(' '),/7-Tage-Pass/);
 assert.match(seealp.plan,/Regionalbahnticket/);
 assert.match(seealp.alternatives,/Äscher–Seealpsee-Abstieg/);
});
test('V82 overview is usable, links actual days and highlights local rail cost',()=>{
 const html=swissInterrailOverviewV82(ctx(interrail));
 assert.match(html,/7 \/ 7/);
 assert.match(html,/Schweiz-Finale/);
 assert.match(html,/Nizza–Kandersteg/);
 assert.match(html,/12 Std. 10 Min./);
 assert.match(html,/Wasserauen: separates Regionalticket/);
 assert.match(html,/data-action="day-plan-go"/);
 assert.equal((html.match(/data-action="day-plan-go"/g)||[]).length,5);
 for(const date of archive.days.map(x=>x.date))assert.ok(html.includes('data-value="'+date+'"'));
 assert.equal((html.match(/class="swiss-focus-task swiss-focus-task-/g)||[]).length,4);
 assert.match(html,/keine bestätigten 2027-Uhrzeiten|keine bestätigte Reservierung|keine zugesagte/);
});
test('V82 rail view offers two Nice–Kandersteg corridors and two Alpine legs, with no invented schedules',()=>{
 const html=swissInterrailRailV82(ctx(interrail));
 assert.match(html,/Nizza/);
 assert.equal((html.match(/class="swiss-focus-corridor"/g)||[]).length,4);
 for(const r of archive.corridors){
  assert.ok(html.includes(r.title));
  assert.ok(html.includes(r.sourceUrls[0]));
 }
 assert.match(html,/Mailand/);
 assert.match(html,/Lyon/);
 assert.match(html,/Genf/);
 assert.match(html,/Spiez/);
 assert.match(html,/nicht als reale Züge bestätigt/);
 assert.match(html,/Wasserauen am 13.09/);
 assert.equal(archive.meta.train2027TimetableConfirmed,false);
 assert.equal(archive.meta.comparativeRoutesValidatedFor2027,false);
});
test('V82 is strictly hidden for separate Swiss lakes, classic Interrail and other variants',()=>{
 for(const trip of catalog.trips.filter(x=>x.id!=='interrail_swiss')){
  const c=ctx(trip,trip.from);
  assert.equal(swissInterrailOverviewV82(c),'');
  assert.equal(swissInterrailRailV82(c),'');
  assert.equal(swissInterrailDayV82(c),'');
 }
 assert.equal(swissInterrailDayV82(ctx(interrail,'2027-09-09')),'');
 assert.equal(swissInterrailDayV82(ctx(interrail,'2027-09-01')),'');
});
test('V82 validation fails on fabricated reservations, pass day 8 or swapped variants, without editing any trip',()=>{
 const original=structuredClone(catalog.trips);
 const originalRail=structuredClone(rawRail);
 const originalArchive=structuredClone(archive);
 const stats=validateInterrailSwissFocusV82(original,originalRail,originalArchive);
 assert.equal(stats.passDays,7);
 assert.deepEqual(original,catalog.trips,'Read-only guide must not alter source trips or bookings');
 assert.deepEqual(originalRail,rawRail);
 const eighth=structuredClone(archive);
 eighth.passDays.push({date:'2027-09-13',transportId:'interrail_swiss-local'});
 assert.throws(()=>validateInterrailSwissFocusV82(original,rawRail,eighth),/V82 pass-day mismatch|V82 invalid target trip/);
 const booked=structuredClone(rawRail);
 booked.find(x=>x.id==='interrail_swiss-t05').scheduled_2027_confirmed=true;
 assert.throws(()=>validateInterrailSwissFocusV82(original,booked,archive),/V82 pass-day mismatch/);
 const wrong=structuredClone(archive);
 wrong.route[5]='grindelwald';
 assert.throws(()=>validateInterrailSwissFocusV82(original,rawRail,wrong),/V82 invalid target trip/);
});
test('V82 citations, CSS and trip-specific viewport constraints survive integration',async()=>{
 assert.equal(archive.meta.checkedOn,'2026-11-17');
 assert.equal(archive.meta.partySize,3);
 assert.equal(archive.meta.otherTripsModified,false);
 assert.equal(archive.meta.selectedBookings,0);
 assert.ok(archive.priority.every(row=>row.sourceUrls.length>0&&row.sourceUrls.every(u=>u.startsWith('https://'))));
 for(const row of archive.priority)assert.equal(catalog.sources['swiss-v82:'+row.key].url,row.sourceUrls[0]);
 for(const row of archive.days)assert.equal(catalog.sources['swiss-v82-day:'+row.date].url,row.sourceUrls[0]);
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../public/swiss-interrail-focus-v82.css',import.meta.url),'utf8');
 assert.match(html,/swiss-interrail-focus-v82\.css/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(max-width:510px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/grid-template-columns:1fr/);
});
