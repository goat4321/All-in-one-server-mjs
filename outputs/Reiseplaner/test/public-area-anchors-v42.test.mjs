import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {loadSurveyFirstV19} from '../lib/research-v19.mjs';
import {loadResearchV20} from '../lib/research-v20.mjs';
import {mapDistanceKm} from '../public/map-explorer.mjs';
const anchors=[
 ['act-025','nice',[43.69568,7.27494],'openstreetmap.org/node/13160620542',false],
 ['act-027','nice',[43.730885,7.3570576],'pdn-patrimonia.unicaen.fr/iejp/',false],
 ['act-039','venice',[45.43023,12.32323],'openstreetmap.org/way/342616318',true],
 ['act-040','venice',[45.41425372193,12.377187380404],'atlantearchitetturacontemporanea.cultura.gov.it/en/stabilimento-blue-moon/',false],
 ['act-057','toulouse',[43.60446,1.44344],'mapcarta.com/24949508',true],
];
test('Five named public anchors have coordinates and are not claimed as entire routes',async()=>{
 const catalog=await loadCatalog(),v19=await loadSurveyFirstV19();
 const a=await loadResearchV20(v19.activities.items,catalog.cities);
 assert.equal(a.activities.withSourcedPoint,35);
 assert.equal(a.activities.withSpecificPublicEvidence,24);
 for(const [id,city,point,source,isCentroid] of anchors){
  const x=a.byActivity.get(id);
  assert.deepEqual(x.point,point,id);
  assert.ok(x.geoSourceUrl.includes(source),id);
  assert.equal(x.isCentroid,isCentroid,id);
  assert.match(x.geoNote,/NICHT/,id);
  assert.ok(mapDistanceKm(x.point,catalog.cities[city].point)<50,id);
  assert.equal(x.researchStatus,'specific_public_evidence_checked',id);
  assert.ok(x.reviewedOn);
 }
});
test('Montpellier alternate square is preserved as a pending lead, not pinned in the active catalog',async()=>{
 const cities=(await loadCatalog()).cities;
 assert.equal(cities.montpellier,undefined);
 const base=await loadSurveyFirstV19();
 const archive=await loadResearchV20(base.activities.items,cities);
 const x=archive.byActivity.get('act-056');
 assert.equal(x.point,null);
 assert.deepEqual(x.candidatePoint,[43.6087,3.88006]);
 assert.match(x.candidateGeoSourceUrl,/mapcarta\.com\/W80524864/);
 assert.equal(x.candidateStatus,'public_named_square_pending_optional_city_catalog');
});
test('Archive points populate only exact selected public activity identities',async()=>{
 const catalog=await loadCatalog();
 for(const trip of catalog.trips){
  for(const [id,city,point,source,isCentroid] of anchors){
   const x=trip.items.find(x=>x.id==='survey-v19:'+id);
   if(!x)continue;
   assert.equal(x.city,city);
   assert.deepEqual(x.point,point);
   assert.ok(x.geoEvidence.url.includes(source));
   assert.equal(x.geoEvidence.isCentroid,isCentroid);
   assert.equal(x.selected,false);
  }
  const vague=trip.items.find(x=>x.id==='survey-v19:act-016');
  if(vague)assert.equal(vague.point,null,'Optional nightclub without venue remains unlocated');
  for(const item of trip.items.filter(x=>x.provider==='Airbnb'||String(x.id).startsWith('wishlist:airbnb:')))
   assert.equal(item.point,null,'Private short lets are not inferred from activity sources');
 }
});
test('No year-2026 hours or optional beach or garden fees become 2027 bookings',async()=>{
 const catalog=await loadCatalog();
 for(const trip of catalog.trips){
  const market=trip.items.find(x=>x.id==='survey-v19:act-025');
  if(market){
   assert.match(market.researchV20.condition,/2027 erneut prüfen/);
   assert.equal(market.booked,false);
   assert.equal(market.researchV20.publishedHours2027,null);
  }
  const garden=trip.items.find(x=>x.id==='survey-v19:act-027');
  if(garden)assert.match(garden.researchV20.condition,/getrennte optionale Sehenswürdigkeit/);
  const beach=trip.items.find(x=>x.id==='survey-v19:act-040');
  if(beach)assert.match(beach.geoEvidence.note,/keine Aussage/);
 }
});
