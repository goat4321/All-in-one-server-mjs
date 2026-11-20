import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeImageHtml,placeThumbnailHtml} from '../public/place-profile.mjs';
import {renderSwiss14QualityDay,swiss14QualityInventory,swiss14GapSummary} from '../public/swiss-14-quality-v87.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_swiss');
const ctx=(date,tripArg=trip)=>{
 const state=initialState(tripArg);
 return {catalog,trip:tripArg,all:tripArg.items,people:state.people,state,
  cities:catalog.cities,date,city:tripArg.dayPlansV32.find(day=>day.date===date)?.city,
  active:[],activeSet:new Set(),dayPlan:tripArg.dayPlansV32.find(day=>day.date===date)};
};
test('all 14 days have an inspectable evidence inventory with original IDs and no extra travel stops',()=>{
 const c=ctx('2027-09-11'),a=swiss14QualityInventory(c);
 assert.equal(a.days.length,14);
 assert.equal(a.days.find(d=>d.date==='2027-09-10').entries.length,0);
 assert.equal(a.days.find(d=>d.date==='2027-09-14').entries.length,0);
 assert.equal(a.days.find(d=>d.date==='2027-09-12').city,'appenzell');
 assert.ok(a.unique.length>15);
 assert.equal(new Set(a.unique.map(x=>x.id)).size,a.unique.length);
 assert.ok(a.gaps.every(row=>row.gaps.length>0));
 const html=swiss14GapSummary(c);
 assert.match(html,/Schweizer 14-Tage-Fokus/);
 assert.ok(html.includes('offen')||html.includes('ohne spezifisches Foto'));
 assert.deepEqual(trip.dayPlansV32.find(d=>d.date==='2027-09-10').slots,[]);
 assert.equal(swiss14QualityInventory(ctx('2027-09-11',catalog.trips.find(t=>t.id==='swiss_lakes'))),null);
});
test('source-bound Swiss day cards expose photos/gaps and avoid fabricated provider offers',()=>{
 for(const date of ['2027-09-02','2027-09-04','2027-09-06','2027-09-07','2027-09-11','2027-09-13']){
  const html=renderSwiss14QualityDay(ctx(date));
  assert.match(html,/Orte, Bilder & Quellen dieses Tages/);
  assert.match(html,/data-quality-id/);
  assert.match(html,/Details &amp; Quellen/);
  assert.match(html,/Preis:/);
  assert.match(html,/Öffnung:/);
  assert.doesNotMatch(html,/class="place-photo small"/,'No overlaid credits on the V87 photo tile');
  assert.match(html,/class="swiss-quality-media/,'The preview contains its own fallback-safe media tile');
  assert.match(html,/für 2027 nicht bestätigt|historische Referenz vorhanden/);
 }
 const travel=renderSwiss14QualityDay(ctx('2027-09-10'));
 assert.match(travel,/keine zusätzlichen Aktivitäten/);
 assert.doesNotMatch(travel,/data-quality-id/);
});
test('new GPX routes use two specifically licensed historic photos with explicit partial-route disclaimers',()=>{
 for(const [id,file,author] of [
   ['hiking:heuberg','View over Oeschinensee from Aussichtspunkt Heuberg, Switzerland.jpg','Alltheswissthings'],
   ['hiking:ebenalp','Aescher-Wildkirchli 20210528 01.jpg','Daniel Kraft']
 ]){
  const item=trip.items.find(i=>i.id===id);
  assert.ok(item,'Missing optional source trail '+id);
  const photo=curatedPlacePhoto(item);
  assert.ok(photo,'Missing new licensed photo '+id);
  assert.equal(decodeURIComponent(photo.url).includes(file),true);
  assert.match(photo.licenseUrl,/^https:\/\/creativecommons.org\/licenses\/by-sa\//);
  assert.ok(photo.credit.includes(author));
  assert.ok(photo.subjectDisclaimer.includes('2027'));
  assert.match(photo.photoScope,/route_/);
  const html=placeImageHtml(item,ctx(item.date));
  assert.match(html,/Bildquelle/);
  assert.match(html,/Lizenz/);
  assert.match(html,/historisch|Historisch/);
  assert.match(placeThumbnailHtml(item,ctx(item.date)),/data-licensed="true"/);
 }
});
