import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {loadSurveyFirstV19} from '../lib/research-v19.mjs';
import {loadResearchV20} from '../lib/research-v20.mjs';
import {mapDistanceKm} from '../public/map-explorer.mjs';
const references=[
 ['act-001','paris',[48.862,2.28873],'1697202142'],
 ['act-014','barcelona',[41.36668,2.16946],'2509826686'],
 ['act-024','nice',[43.69465,7.2799],'24630083']
];
test('Three concrete public viewpoints are source backed and keep route uncertainty',async()=>{
 const catalog=await loadCatalog(),v19=await loadSurveyFirstV19();
 const archive=await loadResearchV20(v19.activities.items,catalog.cities);
 assert.equal(archive.activities.withSourcedPoint,45);
 assert.equal(archive.activities.withSpecificPublicEvidence,24);
 for(const [id,city,point,osm] of references){
  const row=archive.byActivity.get(id);
  assert.deepEqual(row.point,point);
  assert.equal(row.pointPrecision,'sourced_named_poi');
  assert.equal(row.isCentroid,false);
  assert.ok(row.geoSourceUrl.endsWith('/node/'+osm));
  assert.match(row.geoNote,/(Aussichtspunkt|viewpoint)/i);
  assert.ok(mapDistanceKm(point,catalog.cities[city].point)<12);
 }
});
test('Only the intended catalog activity gets each point, private properties never inherit them',async()=>{
 const catalog=await loadCatalog();
 for(const trip of catalog.trips){
  for(const [id,city,point,osm] of references){
   const item=trip.items.find(x=>x.id==='survey-v19:'+id);
   if(!item)continue;
   assert.equal(item.city,city);
   assert.deepEqual(item.point,point);
   assert.ok(item.geoEvidence.url.endsWith('/node/'+osm));
   assert.equal(item.geoEvidence.isCentroid,false);
   assert.equal(item.selected,false);
  }
  const longWalk=trip.items.find(x=>x.id==='survey-v19:act-007');
  if(longWalk)assert.equal(longWalk.point,null,'Quartier Latin flexible walk is not one POI');
  for(const item of trip.items.filter(x=>itemHasPrivateProperty(x)))
   assert.equal(item.point,null,'Private Airbnb location must remain private');
 }
});
function itemHasPrivateProperty(item){
 return item.provider==='Airbnb'||String(item.id).startsWith('wishlist:airbnb:');
}
