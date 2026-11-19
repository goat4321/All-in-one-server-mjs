import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {storyCityMotif,storyCityStops,storyPointBetween,storyProgress,storyLegProgress}
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

test('route playback moves along existing validated foot geometry, not its straight chord',()=>{
 const a=[41.38,2.18],b=[41.382,2.182];
 const pivot=[41.382,2.18];
 const points=[a,pivot,b];
 const leg={verified:true,walkOnly:true,points};
 const part=storyLegProgress(a,b,leg,.5);
 assert.equal(part.verified,true);
 assert.ok(part.path.length>=2&&part.path.length<=3);
 assert.notDeepEqual(part.point,storyPointBetween(a,b,.5),'actual route bends via the source vertex');
 assert.deepEqual(storyLegProgress(a,b,leg,1).path,points);
 const bad=storyLegProgress(a,b,{verified:true,points:[[40,0],[40.1,.1]]},.5);
 assert.equal(bad.verified,false,'geometry not meeting saved source endpoints is never presented as verified');
 assert.deepEqual(bad.point,storyPointBetween(a,b,.5));
 assert.equal(storyLegProgress(a,b,null,.5).verified,false);
 assert.equal(storyLegProgress([91,10],b,leg,.5),null);
 assert.deepEqual(points,[a,pivot,b],'never edit source geometry');
});
test('player exposes seek, skip, verified status and cancels animation on stop',async()=>{
 const player=await read('route-city-story-player-v70.mjs');
 assert.match(player,/jump\(index\)/);
 assert.match(player,/skip\(\)/);
 assert.match(player,/cancelAnimationFrame\(this\.frame\)/);
 assert.match(player,/storyLegProgress\(a\.point,b\.point/);
 assert.match(player,/this\.legs=this\.stops\.slice\(1\)/);
 assert.match(player,/this\.mode=mode==='studio'/);
 assert.doesNotMatch(player,/fetch\(|\/api\//);
});
