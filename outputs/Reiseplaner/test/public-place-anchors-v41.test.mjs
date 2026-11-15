import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {loadSurveyFirstV19} from '../lib/research-v19.mjs';
import {loadResearchV20} from '../lib/research-v20.mjs';
import {mapDistanceKm} from '../public/map-explorer.mjs';
const candidates=[
 ['act-034','genoa',[44.4083531,8.924189],'opentourism.it',true],
 ['act-048','glarus',[47.03587,9.00518],'mapcarta.com/N421910429',false],
 ['act-053','kandersteg',[46.501983,7.696813],'outdooractive.com/de/poi/kandersteg',false]
];
test('Three public locations use individually sourced coordinates and disclose their scope',async()=>{
 const c=await loadCatalog(),v19=await loadSurveyFirstV19();
 const archive=await loadResearchV20(v19.activities.items,c.cities);
 assert.equal(archive.activities.withSourcedPoint,35);
 assert.equal(archive.activities.withSpecificPublicEvidence,24);
 for(const [id,city,point,urlPart,centroid] of candidates){
  const x=archive.byActivity.get(id);
  assert.deepEqual(x.point,point);
  assert.ok(x.geoSourceUrl.includes(urlPart));
  assert.equal(x.isCentroid,centroid);
  assert.match(x.geoNote,/NICHT/);
  assert.ok(mapDistanceKm(point,c.cities[city].point)<50);
 }
});
test('Coordinates reach precisely matching public activities, never private accommodation',async()=>{
 const c=await loadCatalog();
 for(const t of c.trips){
  for(const [id,city,point,urlPart,centroid] of candidates){
   const x=t.items.find(x=>x.id==='survey-v19:'+id);
   if(!x)continue;
   assert.equal(x.city,city);
   assert.deepEqual(x.point,point);
   assert.ok(x.geoEvidence.url.includes(urlPart));
   assert.equal(x.geoEvidence.isCentroid,centroid);
  }
  for(const x of t.items.filter(x=>x.provider==='Airbnb'||String(x.id).startsWith('wishlist:airbnb:')))
   assert.equal(x.point,null);
 }
});
