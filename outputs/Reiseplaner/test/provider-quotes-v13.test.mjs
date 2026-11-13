import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {providerQuoteModel,providerQuotePanel} from '../public/provider-quotes-v13.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(x=>x.id==='interrail_classic');
const state=initialState(trip);
const ctx={catalog,trip,city:'barcelona',people:state.people,state,
 nightlyTargetEuro:35,providerSort:'price',providerOnlyBudget:false};
test('Every imported 2027 provider search is date-aligned, unbooked, fee-unverified and source-linked',()=>{
 const s=catalog.research.providerSearchV13;
 assert.equal(s.schema,'provider_search_snapshot_v13');
 assert.equal(s.searches.length,6);
 assert.equal(s.searches.reduce((sum,g)=>sum+g.results.length,0),60);
 for(const g of s.searches)for(const row of g.results){
  assert.equal(row.from,g.from);
  assert.equal(row.to,g.to);
  assert.equal(row.adults,3);
  assert.equal(row.currency,'EUR');
  assert.equal(row.pointStatus,'provider_reported_unverified');
  assert.equal(row.bookingConfirmed,false);
  assert.equal(row.roomBedsConfirmed,false);
  assert.equal(row.mandatoryFeesConfirmed,false);
  assert.equal(row.cancellationConfirmed,false);
  assert.ok(row.url.includes('checkin='+g.from));
  assert.ok(row.url.includes('checkout='+g.to));
 }
});
test('Correct 3-night Barcelona price and live budget filter do not mutate trip',()=>{
 const m=providerQuoteModel(ctx);
 assert.equal(m.from,'2027-09-03');
 assert.equal(m.to,'2027-09-06');
 assert.equal(m.nights,3);
 assert.equal(m.all.length,10);
 assert.equal(m.visible[0].name,'HeyLola! Hostel');
 assert.equal(m.visible[0].searchTotalCents,28590);
 assert.equal(m.visible[0].perPersonNightCents,3177);
 const h=providerQuotePanel(ctx);
 assert.match(h,/Aktuelle Anbieter-Suchwerte/);
 assert.match(h,/Keine Buchung/);
 assert.match(h,/Pflichtgebühren/);
 assert.match(h,/data-action="provider-budget"/);
 assert.match(h,/2027-09-03/);
 const filtered=providerQuoteModel({...ctx,providerOnlyBudget:true});
 assert.ok(filtered.visible.every(r=>r.perPersonNightCents<=3500));
 assert.ok(filtered.visible.length<m.all.length);
 assert.equal(state.expenses.length,0);
 assert.equal(Object.keys(state.edits).length,0);
});
test('2027 provider prices are not shown for different August dates or four-person Switzerland',()=>{
 const august=catalog.trips.find(x=>x.id==='interrail_august');
 const switzerland=catalog.trips.find(x=>x.id==='swiss_lakes');
 assert.equal(providerQuoteModel({...ctx,trip:august}),null);
 assert.equal(providerQuotePanel({...ctx,trip:august}),'');
 assert.equal(providerQuoteModel({...ctx,trip:switzerland,people:initialState(switzerland).people}),null);
 assert.equal(providerQuoteModel({...ctx,city:'grindelwald'}),null);
 assert.equal(providerQuoteModel({...ctx,providerSort:'rating'}).visible[0].name,'SM Hotel Sant Antoni');
});
