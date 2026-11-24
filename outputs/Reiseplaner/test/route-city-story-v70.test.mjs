import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {storyCityMotif,storyCityStops,storyPointBetween,storyProgress}
  from '../public/route-city-story-v70.mjs';

const read=name=>readFile(new URL('../public/'+name,import.meta.url),'utf8');
test('V70 story follows every original route city, in order, with exact existing reference points',()=>{
 const trip={route:['paris','barcelona','sete','nice','genoa','venice']};
 const cities={
  paris:{name:'Paris',point:[48.8566,2.3522]},
  barcelona:{name:'Barcelona',point:[41.3874,2.1686]},
  sete:{name:'Sète',point:[43.405,3.692]},
  nice:{name:'Nizza',point:[43.71,7.26]},
  genoa:{name:'Genua',point:[44.406,8.935]},
  venice:{name:'Venedig',point:[45.438,12.328]},
 };
 const route=storyCityStops(trip,cities);
 assert.deepEqual(route.map(s=>s.id),trip.route);
 assert.deepEqual(route.map(s=>s.point),trip.route.map(id=>cities[id].point));
 assert.equal(route[0].symbol,'🗼');
 assert.equal(route[1].symbol,'⛪');
 assert.equal(route[2].symbol,'⛵');
 assert.equal(route[5].symbol,'🚣');
 assert.ok(route.every(x=>x.name&&x.description&&x.symbol));
 assert.equal(trip.route.length,6,'Original route cannot be mutated');
});
test('Missing, private or invalid coordinates are never approximated by fabricated city points',()=>{
 const cities={
  cityA:{name:'A',point:[47.5,8.5]},
  cityB:{name:'B',point:null},
  cityC:{name:'C',point:[0,0]},
  cityD:{name:'D',point:[91,30]},
  cityE:{name:'E',point:[42,10]},
 };
 const stops=storyCityStops({route:['cityA','cityB','cityC','cityD','cityE']},cities);
 assert.deepEqual(stops.map(s=>s.id),['cityA','cityE']);
 assert.equal(storyCityMotif('unlisted').symbol,'📍');
 assert.deepEqual(storyCityStops(null,cities),[]);
 assert.deepEqual(storyCityStops({route:['cityA']},null),[]);
});
test('Story interpolation is bounded by sourced endpoints; no train metrics or geometry',()=>{
 const a=[47,9],b=[48,12];
 assert.deepEqual(storyPointBetween(a,b,0),a);
 assert.deepEqual(storyPointBetween(a,b,1),b);
 assert.deepEqual(storyPointBetween(a,b,.5),[47.5,10.5]);
 assert.deepEqual(storyPointBetween(a,b,5),b);
 assert.deepEqual(storyPointBetween(a,b,-5),a);
 assert.equal(storyPointBetween(null,b,.5),null);
 assert.equal(storyProgress(0,0,5),0);
 assert.equal(storyProgress(1,.5,5),37.5);
 assert.equal(storyProgress(4,0,5),100);
 assert.equal(storyProgress(9,0,5),100);
});
test('V70 motion, map schema and access to source details remain separate',async()=>{
 const [player,map,ui,css,html]=await Promise.all([
  read('route-city-story-player-v70.mjs'),read('map.mjs'),
  read('views.mjs'),read('route-city-story-v70.css'),
  read('index.html')
 ]);
 assert.match(player,/requestAnimationFrame\(this\.tick\)/);
 assert.match(player,/reducedMotion\(\)/);
 assert.match(player,/this\.arrive\(this\.index\)/);
 assert.match(player,/pause\(\)\{/);
 assert.match(player,/this\.layer\.clearLayers\(\)/);
 assert.match(map,/playCityStory\(trip,cities,items=/);
 assert.match(ui,/route-story-player/);
 assert.match(ui,/route-story-play/);
 assert.match(ui,/map-legend-disclosure/);
 assert.match(css,/storyPlacePop/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(html,/route-city-story-v70\.css/);
 assert.doesNotMatch(player,/fetch\(|\/api\//);
});

test('V122 previews use the current map city, real itinerary slots and an explicit archived transport only',async()=>{
 const {routePreviewModelV122,routePreviewHtmlV122}=await import('../public/route-preview-v122.mjs');
 const items=[
  {id:'a',kind:'activity',city:'paris',name:'Eiffelturm'},
  {id:'b',kind:'activity',city:'barcelona',name:'Sagrada Família'},
  {id:'ride',kind:'transport',city:'paris',toCity:'barcelona',start:'2025-09-01T08:00:00Z',end:'2025-09-01T14:30:00Z',zone:'Europe/Paris'}
 ];
 const ctx={trip:{route:['paris','barcelona'],items,dayPlansV32:[{city:'paris',date:'2027-09-01',slots:[{id:'a'}]},{city:'barcelona',date:'2027-09-02',slots:[{id:'b'}]}]},all:items,cities:{paris:{name:'Paris'},barcelona:{name:'Barcelona'}}};
 const state={cityId:'paris',index:0,phase:'travel',routeOverview:[{id:'paris'},{id:'barcelona'}]};
 const m=routePreviewModelV122(ctx,state);
 assert.equal(m.reference.minutes,390);assert.deepEqual(m.days.map(d=>d.date),['2027-09-01']);
 assert.deepEqual(m.activities.map(i=>i.id),['a']);
 assert.match(routePreviewHtmlV122(ctx,state),/Archiv.*Fahrplan 2027 offen/);
 assert.match(routePreviewHtmlV122(ctx,state),/data-value="2027-09-01"/);
 assert.doesNotMatch(routePreviewHtmlV122(ctx,state),/Sagrada Família/);
 assert.equal(routePreviewModelV122({...ctx,trip:{...ctx.trip,items:[...items,{...items[2],id:'ride2'}]}},state).reference,null);
 assert.equal(routePreviewModelV122(ctx,{...state,cityId:'unknown'}),null);
 const second=routePreviewModelV122(ctx,{...state,cityId:'barcelona',index:1,phase:'dwell'});
 assert.deepEqual(second.activities.map(i=>i.id),['b']);assert.equal(second.reference,null);
});
test('V122 manual seek resets interpolation and uses the existing player rather than a separate clock',async()=>{
 const {RouteCityStoryPlayer}=await import('../public/route-city-story-player-v70.mjs');
 const player=Object.assign(Object.create(RouteCityStoryPlayer.prototype),{
  stops:[{id:'a'},{id:'b'},{id:'c'}],status:'playing',frame:null,index:0,part:.5,elapsed:220,
  cityMarkers:[],revealed:new Set(),clearArrival(){},reveal(i){this.revealed.add(i);},
  draw(){this.drawn=this.index;},emit(){this.emitted=this.index;}
 });
 assert.equal(player.seek(2),true);assert.equal(player.status,'paused');assert.equal(player.index,2);
 assert.equal(player.part,0);assert.equal(player.elapsed,0);assert.equal(player.phase,'dwell');
 assert.equal(player.drawn,2);assert.equal(player.emitted,2);
 assert.deepEqual([...player.revealed],[1,2]);assert.equal(player.seek(3),false);
});

test('V122 day progression is bounded by the actual playback phase and uses only the active day slots',async()=>{
 const {routePreviewDayV122,routePreviewModelV122,routePreviewHtmlV122}=await import('../public/route-preview-v122.mjs');
 const items=[{id:'a',kind:'activity',city:'paris',name:'Museum A'},{id:'b',kind:'activity',city:'paris',name:'Museum B'}];
 const days=[{city:'paris',date:'2027-09-01',slots:[{id:'a'}]},{city:'paris',date:'2027-09-02',slots:[{id:'b'}]}];
 const ctx={trip:{route:['paris','barcelona'],items,dayPlansV32:days},all:items,cities:{paris:{name:'Paris'},barcelona:{name:'Barcelona'}}};
 const state={cityId:'paris',index:0,phase:'dwell',routeOverview:[{id:'paris'},{id:'barcelona'}]};
 assert.equal(routePreviewDayV122(ctx,{...state,phaseProgress:-1}),days[0]);
 assert.equal(routePreviewDayV122(ctx,{...state,phaseProgress:.49}),days[0]);
 assert.equal(routePreviewDayV122(ctx,{...state,phaseProgress:.5}),days[1]);
 assert.equal(routePreviewDayV122(ctx,{...state,phaseProgress:2}),days[1]);
 assert.equal(routePreviewDayV122(ctx,{...state,phase:'travel',phaseProgress:0}),days[1]);
 assert.deepEqual(routePreviewModelV122(ctx,{...state,phaseProgress:.5}).activities.map(i=>i.id),['b']);
 const html=routePreviewHtmlV122(ctx,{...state,phaseProgress:.5});
 assert.match(html,/data-route122-day="2027-09-02"/);
 assert.match(html,/data-value="2027-09-02" aria-current="date"/);
 assert.match(html,/data-action="details" data-value="b"/);
 assert.doesNotMatch(html,/Museum A/);
 assert.match(routePreviewHtmlV122(ctx,{...state,phase:'travel'}),/Weiter nach Barcelona/);
 assert.match(routePreviewHtmlV122(ctx,{...state,phase:'travel'}),/Fahrtzeit offen/);
 assert.equal(routePreviewDayV122(ctx,{...state,cityId:'barcelona'}),null);
});
