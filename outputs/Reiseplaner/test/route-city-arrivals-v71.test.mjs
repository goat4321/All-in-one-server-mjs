import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {storyCityStops} from '../public/route-city-story-v70.mjs';
import {ARRIVAL_TYPES,arrivalType,buildCityArrivalScenes}
  from '../public/route-city-arrivals-v71.mjs';
import {loadCatalog} from '../lib/catalog.mjs';

const sample=[
 {id:'1',city:'paris',name:'Musée de Paris',kind:'activity',category:'museum'},
 {id:'2',city:'paris',name:'Bistro de la Ville',kind:'activity',category:'food'},
 {id:'3',city:'paris',name:'Jardin secret',kind:'activity'},
 {id:'4',city:'paris',name:'Nightclub Nova',kind:'activity'},
 {id:'5',city:'paris',name:'Hotel Rue du Nord',kind:'lodging'},
 {id:'6',city:'paris',name:'Supermarkt Rue',kind:'shop'},
 {id:'7',city:'paris',name:'Musée de Paris',kind:'activity',category:'museum'},
 {id:'8',city:'paris',name:'Deleted museum',kind:'activity',removed:true},
 {id:'9',city:'paris',name:'Bus to station',kind:'transport'},
 {id:'10',city:'paris',name:'Injected live shop',kind:'activity',readOnlyExternal:true},
 {id:'11',city:'paris',name:'Area centroid',kind:'activity',explorerParent:true},
 {id:'12',city:'paris',name:'Some placeholder',kind:'placeholder'},
 {id:'13',city:'venice',name:'Gondola museum',kind:'activity'},
 {id:'14',city:'paris',name:'Fake imported duplicate',kind:'activity',duplicateOf:'1'},
 {id:'15',city:'paris',name:'New optional activity',kind:'activity'},
];
const stops=[
 {id:'paris',name:'Paris',point:[48.85,2.35],symbol:'🗼'},
 {id:'venice',name:'Venedig',point:[45.44,12.33],symbol:'🚣'},
 {id:'unknown',name:'Offene Etappe',point:[43.5,8.5],symbol:'📍'},
];
test('V71 categorizes documented activities, restaurants, nature, clubs and lodging',()=>{
 assert.equal(arrivalType(sample[0]),'activity');
 assert.equal(arrivalType(sample[1]),'food');
 assert.equal(arrivalType(sample[2]),'nature');
 assert.equal(arrivalType(sample[3]),'nightlife');
 assert.equal(arrivalType(sample[4]),'lodging');
 assert.equal(arrivalType(sample[5]),'shop');
 assert.equal(new Set(Object.values(ARRIVAL_TYPES).map(x=>x.symbol)).size,6);
});
test('V71 arrives with five different authentic venue symbols, copied real names and status',()=>{
 const orig=structuredClone(sample);
 const scenes=buildCityArrivalScenes(stops,sample,new Set(['2','7']),5);
 assert.deepEqual(scenes.map(x=>x.id),stops.map(x=>x.id));
 const first=scenes[0];
 assert.equal(first.placesKnown,7,'deduplicated and excluded unsafe/draft records');
 assert.equal(first.plannedCount,2);
 assert.equal(first.ideaCount,5);
 assert.equal(first.ideas.length,5);
 assert.deepEqual(first.ideas.map(x=>x.type),
  ['activity','food','nature','nightlife','lodging']);
 assert.equal(first.ideas[0].id,'7','selected duplicate takes precedence');
 assert.equal(first.ideas[1].id,'2');
 assert.equal(first.ideas[0].note,'Im Plan');
 assert.equal(first.ideas[2].note,'Idee · prüfen');
 assert.equal(first.ideas[1].symbol,'🍽️');
 assert.deepEqual(scenes[1].ideas.map(x=>x.name),['Gondola museum']);
 assert.deepEqual(scenes[2].ideas,[]);
 assert.equal(scenes[2].placesKnown,0);
 assert.deepEqual(sample,orig,'never mutate catalog entries');
 for(const scene of scenes)for(const idea of scene.ideas){
  assert.ok(sample.some(item=>item.id===idea.id&&item.name===idea.name));
  assert.equal('point' in idea,false,'symbols are not precise POIs');
  assert.equal('price' in idea,false);
  assert.equal('booked' in idea,false);
 }
});
test('V71 has bounded inventory, no synthesised venues and category diversity',()=>{
 assert.equal(buildCityArrivalScenes(stops,sample,new Set(),0)[0].ideas.length,0);
 assert.equal(buildCityArrivalScenes(stops,sample,new Set(),99)[0].ideas.length,5);
 assert.equal(buildCityArrivalScenes(stops,[],new Set())[0].placesKnown,0);
 const a=buildCityArrivalScenes(stops,[
  {id:'a',city:'paris',name:'City Museum',kind:'activity'},
  {id:'b',city:'paris',name:'City Museum',kind:'activity'},
  {id:'c',city:'paris',name:'Fancy cafe',kind:'activity',category:'food'},
 ],new Set(['b']));
 assert.deepEqual(a[0].ideas.map(x=>x.id),['b','c']);
});
test('V71 original travel catalog shows only actual original places in route cities',async()=>{
 const catalog=await loadCatalog();
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 assert.ok(trip);
 const original=storyCityStops(trip,catalog.cities);
 const scene=buildCityArrivalScenes(original,trip.items,new Set());
 assert.equal(scene.length,original.length);
 assert.ok(scene.some(x=>x.placesKnown>3));
 for(const row of scene){
  assert.ok(row.ideas.length<=5);
  for(const item of row.ideas){
   assert.ok(trip.items.some(x=>x.id===item.id&&x.city===row.id&&x.name===item.name),
     'every shown place must exist in the original city catalog');
  }
 }
});
test('V71 animation respects reduced-motion and distinguishes decorative orbit from venue points',async()=>{
 const read=name=>readFile(new URL('../public/'+name,import.meta.url),'utf8');
 const [player,style,app,views,index]=await Promise.all([
  read('route-city-story-player-v70.mjs'),
  read('route-city-arrivals-v71.css'),read('app.mjs'),read('views.mjs'),read('index.html'),
 ]);
 assert.match(player,/animation|arrivalBurstIcon/);
 assert.match(player,/BURST_DIRECTIONS/);
 const {STAY_MS}=await import('../public/route-city-story-player-v70.mjs');
 assert.ok(STAY_MS>=3050&&STAY_MS<=10000,'arrival must remain readable without an excessive dwell');
 assert.match(player,/this\.clearArrival\(\)/);
 assert.match(player,/reducedMotion\(\)/);
 assert.match(player,/this\.arrive\(this\.index\)/);
 assert.match(player,/this\.layer\.clearLayers\(\)/);
 assert.match(player,/if\(index>=2/);
 assert.match(style,/story-arrival-bubble/);
 assert.match(style,/arrivalBadgeBurst/);
 assert.match(style,/arrivalCityWiggle/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.match(app,/route-story-explore/);
 assert.match(app,/textContent=item\.name/,'names must be safely inserted into the UI');
 assert.match(views,/route-story-idea-list/);
 assert.match(index,/route-city-arrivals-v71\.css/);
 assert.doesNotMatch(player,/item\.point|item\.price|item\.booked|fetch\(/);
});
