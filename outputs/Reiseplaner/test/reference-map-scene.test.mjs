import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {dateRange} from '../public/model.mjs';
import {mapDayAgenda,mapImageIntro,mapFloatingControls,mapPhotoDiscovery,selectDiscoveryPhotos}
  from '../public/reference-map-scene.mjs';

const catalog=await loadCatalog();
const context=trip=>{
 const city=trip.route.find(c=>c!=='munich')??trip.route[0];
 const active=trip.items.filter(x=>!x.removed&&!x.duplicateOf);
 const placed=active.filter(x=>Array.isArray(x.point)&&x.point.every(Number.isFinite));
 return {
   trip,catalog,cities:catalog.cities,city,date:trip.from,
   people:Array.from({length:trip.travellers},()=>({})),
   state:initialState(trip),variant:{id:'test-'+trip.id,state:{title:trip.title}},
   dates:dateRange(trip.from,trip.to),day:[],
   total:true,selected:null,all:trip.items,
   explorer:{placed,unlocated:active.filter(x=>!placed.includes(x)),savedOnly:false}
 };
};
test('All trip variants render city-labeled hero, map floating scope controls and authentic images',()=>{
 for(const trip of catalog.trips){
   const ctx=context(trip);
   const intro=mapImageIntro(ctx),nav=mapFloatingControls(ctx),
     photo=mapPhotoDiscovery(ctx);
   assert.match(intro,/Karten-Explorer/);
   assert.match(intro,new RegExp(ctx.trip.from));
   assert.match(intro,/Reisende/);
   assert.match(nav,/aria-pressed="true"/);
   assert.match(nav,/data-action="map-mode" data-value="day"/);
   assert.match(nav,/data-action="map-mode" data-value="total"/);
   assert.match(nav,/data-action="explorer-saved-only"/);
   assert.match(photo,/MIT QUELLENFOTOS/);
   assert.match(photo,/Bildquelle|Fehlende Fotos prüfen/);
   const emptyDay=mapDayAgenda(ctx);
   if(ctx.all.some(x=>x.city===ctx.city&&x.guideV22?.sourceUrl&&x.kind==='activity')){
     assert.match(emptyDay,/Aus deiner Ortsrecherche/);
     assert.match(emptyDay,/nicht in den Tagesplan aufgenommen/);
     assert.match(emptyDay,/data-action="details"/);
   }
   assert.doesNotMatch(intro+nav+photo,/on(?:click|load|error|change)\s*=/i);
   assert.doesNotMatch(intro+nav+photo,/Echtzeitbewertung|direkt buchbar/i);
 }
});
test('Timeline shows exact plan times and source-backed price tiers; no fake schedule',()=>{
 const trip=catalog.trips[0],ctx=context(trip);
 const first=trip.items.find(x=>x.kind==='activity');
 const second=trip.items.find(x=>x.kind==='activity'&&x.id!==first.id);
 ctx.total=false;
 ctx.day=[{...first,entryKey:'plan-1',time:'09:40'},
          {...second,entryKey:'plan-2',time:'Flexibel'},
          {...first,id:'plan-3',entryKey:'plan-3',time:undefined,
            name:'Später offen'}];
 const html=mapDayAgenda(ctx);
 assert.match(html,/DEIN PLANTAG/);
 assert.match(html,/09:40/);
 assert.match(html,/2 flexibel/);
 assert.match(html,/aria-pressed="false"/);
 assert.match(html,/data-action="select" data-value="plan-1"/);
 assert.match(html,/data-action="select" data-value="plan-2"/);
 assert.match(html,/Tagesplan/);
 assert.match(html,/Planzeiten sind keine geprüften Öffnungszeiten/);
 assert.equal((html.match(/class="reference-agenda-item/g)||[]).length,3);
 assert.doesNotMatch(html,/26:00/);
});
test('Timeline caps preview at eight events, keeps all route data untouched',()=>{
 const ctx=context(catalog.trips[0]),original=catalog.trips[0].items.length;
 ctx.day=Array.from({length:11},(_,i)=>({id:'plan:'+i,entryKey:'plan:'+i,
   name:'Stopp '+i,kind:'activity',city:ctx.city,point:null,time:null}));
 const html=mapDayAgenda(ctx);
 assert.equal((html.match(/class="reference-agenda-item/g)||[]).length,8);
 assert.match(html,/\+3 weitere Stopps/);
 assert.equal(catalog.trips[0].items.length,original);
});
test('No photo is invented when city and catalog lack licensed media',()=>{
 const ctx=context(catalog.trips[0]);
 ctx.city='an_unlisted_city';
 ctx.explorer={placed:[{id:'test',name:'Kein Quellenbild',city:'an_unlisted_city',
   kind:'activity',point:[1,1],price:null}],unlocated:[],savedOnly:false};
 const intro=mapImageIntro(ctx),photo=mapPhotoDiscovery(ctx);
 assert.match(intro,/no-photo/);
 assert.doesNotMatch(intro,/reference-intro-photo/);
 assert.match(photo,/noch keine zugeordneten Quellenfotos/);
 assert.match(photo,/data-action="hud-audit" data-value="photo"/);
});

test('Three explicit map scopes distinguish planned calendar stops, city ideas and entire route',()=>{
 for(const trip of catalog.trips){
   const ctx=context(trip);
   for(const active of ['trip','city','day']){
     ctx.explorer.scope=active;
     const html=mapFloatingControls(ctx);
     assert.match(html,/data-action="map-mode" data-value="day"/);
     assert.match(html,/data-action="map-mode" data-value="city"/);
     assert.match(html,/data-action="map-mode" data-value="total"/);
     assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1,
       'One map scope must be active when bookmarks are off');
     const selected=active==='trip'?'total':active;
     assert.ok(html.includes('data-value="'+selected+'" aria-pressed="true"'),
       active+' must actually be selected, not inferred from stale total flag');
   }
 }
});
test('Calendar stepper exposes only neighboring real plan dates and correct disabled ends',()=>{
 const ctx=context(catalog.trips[0]);
 const dates=ctx.dates;
 const start=mapDayAgenda(ctx);
 assert.match(start,/Tag 1 \/ /);
 assert.match(start,/Vorheriger Reisetag" title="Vorheriger Reisetag"/);
 assert.match(start,/data-action="day" disabled aria-label="Vorheriger Reisetag"/);
 assert.ok(start.includes('data-value="'+dates[1]+'"'));
 ctx.date=dates[Math.floor(dates.length/2)];
 const mid=mapDayAgenda(ctx);
 assert.ok(mid.includes('data-value="'+dates[dates.indexOf(ctx.date)-1]+'"'));
 assert.ok(mid.includes('data-value="'+dates[dates.indexOf(ctx.date)+1]+'"'));
 ctx.date=dates.at(-1);
 const end=mapDayAgenda(ctx);
 assert.match(end,/data-action="day" disabled aria-label="Nächster Reisetag"/);
});
test('Sourced photo discovery favors current city and diversifies route, no repeated Commons file',()=>{
 for(const trip of catalog.trips){
   const ctx=context(trip);
   ctx.explorer.scope='trip';
   const selected=selectDiscoveryPhotos(ctx,8);
   assert.ok(selected.length<=8);
   assert.equal(new Set(selected.map(x=>x.photo.sourceUrl.toLowerCase())).size,
     selected.length,'A single image file must not be repeated as separate places');
   assert.ok(selected.every(row=>row.photo.credit&&row.photo.sourceUrl.startsWith('https://')));
   if(selected.some(row=>row.item.city===ctx.city))
     assert.equal(selected[0].item.city,ctx.city,
       'Focus city appears first when a licensed photo exists');
   const citySet=new Set(selected.map(x=>x.item.city));
   if(selected.length>3&&trip.route.length>2)assert.ok(citySet.size>=2,
     'Route carousel should not consist entirely of one city');
   const gallery=mapPhotoDiscovery(ctx);
   assert.equal((gallery.match(/class="reference-discovery-card"/g)||[]).length,
     selected.length);
   for(const x of selected){
     assert.ok(gallery.includes('data-value="'+x.item.id+'"'));
   }
   if(selected.length){
     assert.equal((gallery.match(/data-action="explorer-save"/g)||[]).length,
       selected.length,'Every sourced card offers an actual saved-place action');
     ctx.explorer.saved=new Set([selected[0].item.id]);
     const bookmarked=mapPhotoDiscovery(ctx);
     assert.ok(bookmarked.includes('data-action="explorer-save" data-value="'
       +selected[0].item.id+'" aria-pressed="true"'),
       'The saved state comes from actual variant bookmarks, not a fake heart icon');
   }
 }
});
test('Day mode gives an actionable city discovery path if the selected day is empty',()=>{
 const ctx=context(catalog.trips[0]);
 ctx.explorer.scope='day';
 assert.equal(ctx.day.length,0);
 const html=mapDayAgenda(ctx);
 assert.match(html,/keine noch nicht eingeplanten Orte/);
 assert.match(html,/data-action="map-mode" data-value="city"/);
 assert.doesNotMatch(html,/automatisch gebucht/);
});

test('Real plan warnings are surfaced inline, escaped, and never treated as confirmed reservations',()=>{
 const ctx=context(catalog.trips[0]);
 ctx.day=[{id:'warn-1',entryKey:'warn-1',city:ctx.city,kind:'activity',
   name:'Pasta <script>alert(1)</script>',requiresKitchen:true,kitchenReady:false}];
 ctx.fullDay=ctx.day;
 const html=mapDayAgenda(ctx);
 assert.match(html,/1 Planungshinweis/);
 assert.match(html,/Küchenzugang offen/);
 assert.match(html,/data-action="page" data-value="plan"/);
 assert.match(html,/Keine Buchungs- oder Fahrplangarantie/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});
