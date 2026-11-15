import test from 'node:test';
import assert from 'node:assert/strict';
import {activityGroup,activityRows,activityDirectory,ACTIVITY_GROUPS} from '../public/activity-directory.mjs';
import {loadCatalog} from '../lib/catalog.mjs';
const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_classic');
const people=Array.from({length:3},(_,i)=>({id:'p'+(i+1)}));
const ctx={catalog,trip,cities:catalog.cities,all:trip.items,city:'barcelona',
 browseScope:'trip',browseSearch:'',browseLimit:24,activityCategory:'all',people,
 activitySavedOnly:false,activityOrder:'source',state:{favorites:[],votes:{},placePhotos:{}},
 browseSavedIds:new Set(),activeSet:new Set(),compareIds:new Set(),nightlyTargetEuro:35};
test('Activity tab classifies names without changing catalog data',()=>{
 assert.equal(activityGroup({name:'Plage de la Corniche',tags:[]}), 'water');
 assert.equal(activityGroup({name:'Museum der Stadt',tags:[]}), 'culture');
 assert.equal(activityGroup({name:'Bergwanderung',tags:['Wandern']}), 'nature');
 assert.equal(ACTIVITY_GROUPS.length,8);
});
test('Activities show the selected trip, excluding food and hotels',()=>{
 const result=activityRows(ctx);
 assert.ok(result.all.length>0);
 assert.ok(result.all.every(item=>item.kind==='activity'));
 assert.ok(result.all.every(item=>item.category!=='food'));
 assert.equal(result.counts.all,result.all.length);
});
test('Category, city, search and bookmark filters compose correctly',()=>{
 const all=activityRows(ctx).all;
 const target=all[0];
 const category=activityGroup(target);
 const filtered=activityRows({...ctx,activityCategory:category,
   browseSavedIds:new Set([target.id]),activitySavedOnly:true});
 assert.ok(filtered.filtered.some(x=>x.id===target.id));
 assert.ok(filtered.filtered.every(x=>activityGroup(x)===category));
 const scoped=activityRows({...ctx,browseScope:'city',city:target.city});
 assert.ok(scoped.all.every(x=>x.city===target.city));
 const notFound=activityRows({...ctx,browseSearch:'__unfindable_search__'});
 assert.equal(notFound.filtered.length,0);
});
test('Activity page includes actionable map, bookmark, and day buttons',()=>{
 const markup=activityDirectory(ctx);
 assert.match(markup,/data-action="activity-category"/);
 assert.match(markup,/data-action="activity-saved"/);
 assert.match(markup,/data-action="browse-map"/);
 assert.match(markup,/data-action="browse-save"/);
 assert.match(markup,/data-action="choose"/);
 assert.match(markup,/Aktivitäten auswählen/);
});
