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
