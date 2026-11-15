import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {mapUnlocatedReview} from '../public/map-unlocated-v39.mjs';

const read=async rel=>JSON.parse(await readFile(new URL('../data/'+rel,import.meta.url),'utf8'));
const [address,unresolved]=await Promise.all([
 read('research-v09/verified-public-addresses.json'),
 read('research-v09/individual-unresolved-reasons.json')
]);
const catalog=await loadCatalog();

test('Old unresolved research never reintroduces a guessed Cittadella house number',()=>{
 const old=unresolved.items.find(x=>x.id==='research:bcom_13963152');
 const current=address.entries.find(x=>x.id==='research:bcom_13963152');
 assert.equal(old.knownPublicAddress,current.address);
 assert.equal(current.address,'Scalinata della Cittadella, 16126 Genova, Italy');
 assert.match(old.reason,/Geschossangabe/);
 assert.match(old.nextStep,/Hausnummer/);
 assert.ok(!old.googleMapsSearchUrl.includes('Cittadella%202%2C'));
 assert.ok(!old.googleTransitUrl.includes('Cittadella%202%2C'));
 const variants=catalog.trips.flatMap(t=>t.items.filter(x=>x.id===old.id));
 assert.ok(variants.length>0);
 for(const item of variants){
  assert.equal(item.point,null);
  assert.equal(item.address,current.address);
  assert.equal(item.geoReviewV09.knownPublicAddress,current.address);
  assert.match(item.geoReviewV09.reason,/Geschossangabe/);
  assert.match(item.addressEvidenceV09.addressQualification,/listing_floor_or_number_ambiguity/);
 }
});

test('Cavour operator hints are source-qualified, accessible and never 2027 booking promises',()=>{
 const row=address.entries.find(x=>x.id==='local:food-v03-015');
 assert.equal(row.point,null);
 assert.equal(row.operatorArrivalV47.notConfirmedFor2027,true);
 assert.match(row.operatorArrivalV47.sourceUrl,/modo21\.it/);
 assert.match(row.operatorArrivalV47.transitReference,/San Giorgio/);
 assert.match(row.operatorArrivalV47.historicalHours,/2026/);
 const entries=catalog.trips.flatMap(t=>t.items.filter(x=>x.id===row.id));
 assert.ok(entries.length>0);
 const item=entries[0];
 assert.equal(item.point,null);
 assert.equal(item.addressEvidenceV09.operatorArrivalV47.notConfirmedFor2027,true);
 const html=mapUnlocatedReview({
   explorer:{placed:[],unlocated:[item],showCityReferences:false},
   mapUnlocatedOpen:true,mapUnlocatedFilter:'sourced-address',cities:catalog.cities,
 });
 assert.match(html,/San Giorgio/);
 assert.match(html,/2027/);
 assert.match(html,/kein bestätigter 2027er Tisch/);
});

test('Bacarino mismatched house numbering is not promoted as exact entrance',()=>{
 const row=address.entries.find(x=>x.id==='local:food-v03-019');
 assert.equal(row.point,null);
 assert.match(row.remark,/5755/);
 assert.match(row.remark,/5756/);
 assert.match(row.secondaryAddressSourceUrl,/localshop24\.com/);
 assert.match(row.operatorArrivalV47.historicalHours,/nicht einheitlich/);
 const c=catalog.trips.flatMap(t=>t.items.filter(x=>x.id===row.id));
 assert.ok(c.length>0);
 for(const item of c){
  assert.equal(item.point,null);
  assert.equal(item.addressEvidenceV09.notABooking,true);
 }
});
