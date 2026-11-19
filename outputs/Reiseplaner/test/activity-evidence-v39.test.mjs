import test from 'node:test';
import assert from 'node:assert/strict';
import {activityEvidence,activityFacetMatch,activityRows,activityDirectory} from '../public/activity-directory.mjs';
import {loadCatalog} from '../lib/catalog.mjs';
const catalog=await loadCatalog(),trip=catalog.trips[0];
const ctx={catalog,trip,all:trip.items,cities:catalog.cities,people:[{id:1},{id:2},{id:3}],
 state:{favorites:[],placePhotos:{},votes:{}},browseScope:'trip',browseSearch:'',
 browseSavedIds:new Set(),activityCategory:'all',activitySavedOnly:false,
 activityEvidenceFilter:'all',activityOrder:'source',browseLimit:24,activeSet:new Set(),compareIds:new Set()};
test('Source evidence discriminates object photos from incidental same-city art',()=>{
 const generic={id:'not-a-landmark',kind:'activity',city:'barcelona',name:'Cafe ohne Foto'};
 const evidence=activityEvidence(generic,ctx);
 assert.equal(evidence.photo,false);
 assert.equal(evidence.point,false);
 assert.equal(evidence.price,false);
 assert.equal(activityFacetMatch(generic,ctx,'missingPhoto'),true);
 assert.equal(activityFacetMatch(generic,ctx,'missingPoint'),true);
});
test('All activity evidence facets partition the existing trip activities',()=>{
 const {all,evidenceCounts}=activityRows(ctx);
 assert.ok(all.length>0);
 assert.equal(evidenceCounts.all,all.length);
 for(const [yes,no] of [['photo','missingPhoto'],['point','missingPoint'],['price','missingPrice']])
  assert.equal(evidenceCounts[yes]+evidenceCounts[no],all.length);
 assert.equal(evidenceCounts.sourcedPoint+evidenceCounts.unverifiedPoint,evidenceCounts.point,
   'Coordinates with and without evidence partition the existing map-pin group');
 assert.ok(all.every(item=>!activityFacetMatch(item,ctx,'sourcedPoint')
   ||activityFacetMatch(item,ctx,'point')));
});
test('Evidence facet combines with category and existing browse scope',()=>{
 const x=activityRows({...ctx,activityEvidenceFilter:'photo',browseScope:'city',city:'barcelona'});
 assert.ok(x.filtered.every(item=>item.city==='barcelona'));
 assert.ok(x.filtered.every(item=>activityFacetMatch(item,ctx,'photo')));
 const html=activityDirectory(ctx);
 assert.match(html,/DATENQUALITÄT/);
 assert.match(html,/data-action="activity-evidence"/);
 assert.match(html,/Mit Quellenfoto/);
 assert.match(html,/Ohne Kartenpunkt/);
 assert.match(html,/Mit Koordinatenbeleg/);
 assert.match(html,/Punkt ohne Quellenbeleg/);
});
