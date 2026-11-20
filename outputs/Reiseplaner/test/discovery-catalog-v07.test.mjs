import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {normalizeSupermarkets} from '../lib/supermarket-source.mjs';
import {explorerData,explorerCategory} from '../public/map-explorer.mjs';
import {discoverySource,discoverySelect,discoveryPrice,discoverySourceUrl,
 discoveryQualityMatch,discoveryCard,discoveryCompareBoard,discoveryFilterBar}
 from '../public/discovery-catalog.mjs';
import {foodDirectory} from '../public/food-discovery-v36.mjs';
import {readFile} from 'node:fs/promises';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_classic');
const people=Array.from({length:3},(_,i)=>({id:'p'+i}));
const ctx={catalog,trip,cities:catalog.cities,city:'barcelona',
 all:trip.items,people,state:{favorites:[],votes:{},placePhotos:{}},
 browseScope:'city',browseSearch:'',browseFoodType:'all',
 discoveryCategory:'all',discoveryQuality:'all',discoveryOrder:'source',
 browseSavedIds:new Set(),activeSet:new Set(),discoveryCompareIds:new Set(),browseLimit:24};

test('same map source records power discovery, restaurant and supermarket filters',()=>{
 const map=explorerData(trip.items,trip,{city:'barcelona',group:'all',search:''});
 const expected=[...map.placed,...map.unlocated]
  .filter(item=>!item.explorerParent&&item.kind==='activity'
    &&['activity','food','shop'].includes(explorerCategory(item)));
 const source=discoverySource(ctx);
 assert.deepEqual(source.map(i=>i.id),expected.map(i=>i.id));
 const result=discoverySelect(ctx);
 assert.equal(result.filtered.length,source.length);
 assert.equal(result.counts.all,source.length);
 for(const key of ['activity','food','shop'])
   assert.ok(discoverySelect({...ctx,discoveryCategory:key}).filtered
     .every(i=>explorerCategory(i)===key));
 assert.ok(discoverySelect({...ctx,browseScope:'trip'}).source.length>source.length);
 assert.ok(discoverySelect({...ctx,browseSearch:'__nothing__'}).filtered.length===0);
 assert.ok(result.source.every(x=>x.kind==='activity'&&!x.duplicateOf));
});
test('loaded OSM shops appear in both discovery and the map, are source-only, and cannot be booked',()=>{
 const market=normalizeSupermarkets([{type:'node',id:609009,lat:41.38,lon:2.16,
    tags:{shop:'supermarket',name:'Test Market 07'}}],'barcelona')[0];
 const mixed={...ctx,marketItems:[market]};
 const found=discoverySource(mixed).find(i=>i.id===market.id);
 assert.ok(found);
 const map=explorerData([...ctx.all,market],ctx.trip,{city:'barcelona',group:'shop'});
 assert.ok(map.placed.some(i=>i.id===market.id));
 const food=foodDirectory(mixed,[market]);
 assert.ok(food.shown.some(i=>i.id===market.id));
 assert.equal(found.price,null);
 assert.equal(found.readOnlyExternal,true);
 const html=discoveryCard(found,mixed,{surface:'food'});
 assert.match(html,/Test Market 07/);
 assert.match(html,/OSM-Geodaten/);
 assert.match(html,/Kartendatenquelle/);
 assert.doesNotMatch(html,/data-action="choose"/);
 assert.doesNotMatch(html,/data-action="meal-choose"/);
 assert.match(html,/data-action="browse-map-item"/);
 assert.match(html,/data-action="browse-save"/);
 assert.match(html,/data-action="discovery-compare"/);
 assert.equal(trip.items.some(i=>i.id===market.id),false,'no mutation or import');
});
test('combined source/photo/point/price/search/bookmark filters do not create facts',()=>{
 const items=discoverySource(ctx);
 const point=items.find(i=>Array.isArray(i.point)&&i.point.length===2);
 const noPoint=items.find(i=>!Array.isArray(i.point));
 assert.ok(point&&noPoint);
 assert.equal(discoveryQualityMatch(point,ctx,'point'),true);
 assert.equal(discoveryQualityMatch(noPoint,ctx,'missingPoint'),true);
 const selected=discoverySelect({...ctx,discoveryQuality:'point',discoverySavedOnly:true,
   browseSavedIds:new Set([point.id])});
 assert.deepEqual(selected.filtered.map(i=>i.id),[point.id]);
 const noPrice=items.find(i=>discoveryPrice(i,3)===null);
 assert.ok(noPrice,'unknown price remains missing');
 assert.equal(discoveryQualityMatch(noPrice,ctx,'missingPrice'),true);
 assert.doesNotMatch(discoveryCard(noPrice,ctx),/0,00 € pro/);
 const html=discoveryFilterBar(ctx,discoverySelect(ctx));
 assert.match(html,/data-action="discovery-category"/);
 assert.match(html,/Nachweis/);
 assert.match(html,/data-action="discovery-saved"/);
});
test('sort does not compare CHF with EUR as the same nominal price',()=>{
 const items=discoverySource(ctx);
 const eur=items.find(i=>discoveryPrice(i,3)?.currency==='EUR');
 const empty=items.find(i=>!discoveryPrice(i,3));
 assert.ok(eur&&empty);
 const order=discoverySelect({...ctx,discoveryOrder:'price'}).filtered;
 const firstMissing=order.findIndex(i=>!discoveryPrice(i,3));
 assert.ok(firstMissing>=0);
 assert.ok(order.slice(firstMissing).every(i=>!discoveryPrice(i,3)));
});
test('source URLs are exact HTTPS only; no unknown photos/price references are manufactured',()=>{
 const item={name:'Example',kind:'activity',city:'barcelona',id:'t',
   price:null,point:null,sourceUrl:'javascript:alert(1)'};
 assert.equal(discoverySourceUrl(item),null);
 assert.equal(discoveryPrice(item,3),null);
 assert.equal(discoverySourceUrl({...item,sourceUrl:'https://example.org/sourced-item'}),'https://example.org/sourced-item');
 assert.doesNotMatch(discoveryCard(item,ctx),/data-action="browse-map-item"/);
 assert.match(discoveryCard(item,ctx),/Preis offen/);
 assert.doesNotMatch(discoveryCard(item,ctx),/<script/);
 const attack=discoveryCard({...item,name:'<img src=x onerror=alert(1)>'},ctx);
 assert.match(attack,/&lt;img/);
 assert.doesNotMatch(attack,/<img src=x onerror=/);
});
test('category-aware 2–4 way compare exposes meaningful differences without saving itinerary',()=>{
 const items=discoverySource(ctx);
 const activity=items.find(i=>explorerCategory(i)==='activity');
 const restaurant=items.find(i=>explorerCategory(i)==='food');
 const shop=items.find(i=>explorerCategory(i)==='shop');
 assert.ok(activity&&restaurant&&shop);
 const html=discoveryCompareBoard([activity,restaurant,shop],ctx);
 assert.match(html,/Aktivitäten|Aktivität/);
 assert.match(html,/Gericht \/ Menü/);
 assert.match(html,/Preissicherheit/);
 assert.match(html,/Saison \/ Einlass/);
 assert.match(html,/data-different="true"/);
 assert.match(html,/id="entdecken-vergleich"/);
 assert.equal(discoveryCompareBoard([activity],ctx),'');
 assert.deepEqual(ctx.state.favorites,[]);
 assert.deepEqual(ctx.discoveryCompareIds, new Set());
});
test('mobile layouts, source UI and changes to original data remain source-based',async()=>{
 const [styles,views,app]=await Promise.all([
  'design-foundations-v01.css','views.mjs','app.mjs'
 ].map(file=>readFile(new URL('../public/'+file,import.meta.url),'utf8')));
 assert.match(styles,/\.discovery-results-grid/);
 assert.match(styles,/@media\(max-width:650px\)/);
 assert.match(styles,/\.discovery-compare-scroll/);
 assert.match(views,/function discoverCatalog\(ctx\)/);
 assert.match(views,/discoverySelect\(ctx,\{surface:'discover'\}\)/);
 assert.match(app,/case 'discovery-compare'/);
 assert.match(app,/case 'discovery-reset'/);
 assert.match(app,/case 'browse-map-item'/);
});
