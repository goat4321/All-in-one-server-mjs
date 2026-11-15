import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {loadResearchV20} from '../lib/research-v20.mjs';
import {loadSurveyFirstV19} from '../lib/research-v19.mjs';
import {routeStudioModel} from '../public/route-studio.mjs';

const records=[
 ['act-015','barcelona',[41.4028473,2.1988557],'barcelonabusturistic.cat'],
 ['act-028','nice',[43.69835,7.28448],'mapcarta.com'],
 ['act-031','genoa',[44.39615,8.94572],'mapcarta.com'],
 ['act-038','venice',[45.44366,12.32556],'mapcarta.com'],
 ['act-055','kandersteg',[46.49553,7.671342],'geofinder.ch'],
 ['act-046','appenzell',[47.269558,9.401261],'deine-berge.de'],
 ['act-047','glarus',[47.03079,9.00390],'parkandhike.ch'],
 ['act-051','grindelwald',[46.624375,8.033506],'outdooractive.com'],
 ['act-052','grindelwald',[46.65988,8.05382],'bergbahnen.org'],
 ['act-054','kandersteg',[46.497737,7.714634],'outdooractive.com']
];
test('Ten additional public anchors are backed by sources and explicitly scoped',async()=>{
 const c=await loadCatalog(),s=await loadSurveyFirstV19();
 const research=await loadResearchV20(s.activities.items,c.cities);
 assert.equal(research.activities.items.filter(x=>x.point!==null).length,45);
 for(const [id,city,point,domain] of records){
   const r=research.byActivity.get(id);
   assert.equal(r.city,city);
   assert.deepEqual(r.point,point);
   assert.ok(r.geoSourceUrl.includes(domain));
   assert.equal(r.isCentroid,true,'landmark area or building point is not an entrance');
   assert.match(r.geoNote,/NICHT/,'all routes must disclose point scope');
   const used=c.trips.flatMap(t=>t.items.filter(x=>x.id==='survey-v19:'+id));
   for(const item of used){
     assert.deepEqual(item.point,point);
     assert.equal(item.geoEvidence.isCentroid,true);
     assert.ok(item.geoEvidence.url.includes(domain));
   }
 }
});
test('A mapped orientation point never becomes a confirmed pedestrian route',async()=>{
 const c=await loadCatalog(),trip=c.trips.find(t=>t.id==='swiss_lakes');
 const a=trip.items.find(x=>x.id==='survey-v19:act-052');
 const b=trip.items.find(x=>x.id==='survey-v19:act-051');
 if(!a||!b)return;
 const m=routeStudioModel([a,b],[]);
 assert.equal(m.verifiedCount,0);
 assert.equal(m.legs[0].minutes,null);
 assert.equal(m.positionQuality.areaCount,2);
});
test('No question-mark markers and motion only on calculated route overlays',async()=>{
 const [map,motion]=await Promise.all([
   readFile(new URL('../public/map.mjs',import.meta.url),'utf8'),
   readFile(new URL('../public/motion-polish.css',import.meta.url),'utf8')
 ]);
 assert.doesNotMatch(map,/legend\.textContent\s*=\s*['"]\?['"]\s*\+/);
 assert.match(map,/legend\.textContent=String\(row\.count\)/);
 assert.match(map,/if\(leg\.verified && active\)/);
 assert.match(map,/pointAlongRoute\(leg\.points,\.5\)/);
 assert.match(motion,/\.route-studio-map-flow\s*\{/);
 assert.match(motion,/prefers-reduced-motion:reduce/);
});
