import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {explorerData,explorerCategory,validPoint} from '../public/map-explorer.mjs';
import {normalizeSupermarkets} from '../lib/supermarket-source.mjs';
import {discoveryBase,discoveryRows,discoveryMatches,discoveryCard,
  discoveryCards,discoveryCompare,discoveryFilterPanel,discoveryFactRows}
 from '../public/unified-discovery-v07.mjs';

const catalog=await loadCatalog();
const people=[{id:'a'},{id:'b'},{id:'c'}];
const ctx=trip=>({
 catalog,trip,cities:catalog.cities,all:trip.items,city:trip.route.includes('barcelona')
  ?'barcelona':trip.route.find(id=>id!=='munich')??trip.route[0],
 people,state:{favorites:[],votes:{},placePhotos:{},edits:{}},
 activeSet:new Set(),browseSavedIds:new Set(),compareIds:new Set(),marketItems:[],
 browseSearch:'',browseScope:'city',date:'2027-09-04',
 dates:['2027-09-04'],cityForDay:()=> 'barcelona',
 browseLimit:24
});
const trips=catalog.trips;
test('all four variants: discovery uses EXACT same map selector, deduplication and city scope',()=>{
 assert.equal(trips.length,4);
 for(const trip of trips){
  const current=ctx(trip);
  const source=explorerData(trip.items,trip,{city:current.city,group:'all',search:''});
  const expected=[...source.placed,...source.unlocated]
   .filter(item=>item.kind==='activity'
     &&['activity','food','shop'].includes(explorerCategory(item)))
   .map(item=>item.id).sort();
  const actual=discoveryBase(current).map(item=>item.id).sort();
  assert.deepEqual(actual,expected,'Map/catalogue parity for '+trip.id);
  const unique=new Set(actual);
  assert.equal(unique.size,actual.length,'No duplications for '+trip.id);
  assert.ok(discoveryBase(current).every(item=>item.city===current.city));
  const tripScope=discoveryBase({...current,browseScope:'trip'});
  assert.ok(tripScope.length>=actual.length);
  assert.ok(tripScope.every(item=>trip.route.includes(item.city)));
 }
});
test('search and category filters show the same source records as the map (including menu dishes)',()=>{
 const current=ctx(trips.find(x=>x.id==='interrail_classic'));
 const all=discoveryBase(current);
 for(const category of ['activity','food','shop']){
  const query=discoveryRows(current,{group:category});
  const mapped=explorerData(current.all,current.trip,{
    city:current.city,group:category,search:''});
  const expected=[...mapped.placed,...mapped.unlocated].filter(item=>item.kind==='activity')
   .map(item=>item.id).sort();
  assert.deepEqual(query.result.map(x=>x.id).sort(),expected,category);
  assert.equal(query.counts[category],expected.length);
 }
 const dish=current.all.find(item=>item.menuPriceResearchV08?.menuReference?.sample?.[0]?.name);
 if(dish){
  const phrase=dish.menuPriceResearchV08.menuReference.sample[0].name;
  assert.ok(discoveryBase({...current,browseSearch:phrase}).some(x=>x.id===dish.id));
  const map=explorerData(current.all,current.trip,{city:current.city,search:phrase});
  assert.ok([...map.placed,...map.unlocated].some(x=>x.id===dish.id));
 }
 const target=all.find(x=>x.name&&x.name.length>6);
 assert.ok(target);
 const query=target.name.slice(0,7);
 const searched=discoveryRows({...current,browseSearch:query},{group:'all'});
 assert.deepEqual(searched.result.map(x=>x.id).sort(),
   discoveryBase({...current,browseSearch:query}).map(x=>x.id).sort());
});
test('real external OSM shops appear only after explicit load and cannot silently enter a plan',()=>{
 const current=ctx(trips.find(x=>x.id==='interrail_classic'));
 const source=normalizeSupermarkets([
  {type:'node',id:20262028,lat:41.37,lon:2.13,
   tags:{shop:'supermarket',name:'Demo Store',brand:'Testbrand'}},
  {type:'way',id:20262029,center:{lat:41.40,lon:2.18},
   tags:{shop:'supermarket',name:'Demo Gebiet'}}],current.city);
 const before=discoveryBase(current);
 const after=discoveryBase({...current,marketItems:source});
 assert.equal(after.length,before.length+2);
 const record=after.find(x=>x.id===source[0].id);
 assert.ok(record?.readOnlyExternal);
 assert.equal(record.price,null);
 const content=discoveryCard(record,{...current,marketItems:source});
 assert.match(content,/Supermarkt/);
 assert.match(content,/OSM-Geodaten/);
 assert.match(content,/data-action="browse-map-item"/);
 assert.match(content,/data-action="compare"/);
 assert.doesNotMatch(content,/data-action="day-quick-add"|data-action="meal-choose"/);
 assert.doesNotMatch(content,/0,00\s?€/);
 const centroid=discoveryCard(source[1],{...current,marketItems:source});
 assert.match(centroid,/Gebietsreferenz, kein Eingang/);
});
test('facets compose strictly; missing prices, durations, images and coordinates stay unknown',()=>{
 const current=ctx(trips.find(x=>x.id==='interrail_classic'));
 const candidates=discoveryBase(current);
 const sample=candidates.find(x=>validPoint(x.point))??candidates[0];
 assert.ok(sample);
 const missing={...sample,id:'without-source',point:null,price:null,
  effectivePrice:null,geoEvidence:null,duration:null,placePhotos:null};
 assert.equal(discoveryMatches(missing,current,{evidence:'point'}),false);
 assert.equal(discoveryMatches(missing,current,{evidence:'missingPoint'}),true);
 assert.equal(discoveryMatches(missing,current,{duration:'short'}),false);
 assert.equal(discoveryMatches(missing,current,{duration:'unknown'}),true);
 assert.equal(discoveryMatches(missing,current,{evidence:'price'}),false);
 assert.equal(discoveryMatches(missing,current,{evidence:'unknownPrice'}),true);
 assert.equal(discoveryMatches(sample,{...current,browseSavedIds:new Set()},{savedOnly:true}),false);
 assert.equal(discoveryMatches(sample,{...current,browseSavedIds:new Set([sample.id])},
  {savedOnly:true}),true);
 const html=discoveryCards([missing],current);
 assert.match(html,/Einzelbild fehlt|Lizenzbild/);
 assert.match(html,/Auf Karte|Standort offen/);
 assert.equal(JSON.stringify(current.state),JSON.stringify({favorites:[],votes:{},placePhotos:{},edits:{}}));
});
test('comparison has category-specific decision facts, respects four and has no write action',()=>{
 const current=ctx(trips.find(x=>x.id==='interrail_classic'));
 const list=discoveryBase({...current,browseScope:'trip'});
 assert.ok(list.length>=5);
 const selected=list.slice(0,4);
 const compared={...current,compareIds:new Set(selected.map(x=>x.id))};
 const html=discoveryCompare(compared);
 assert.equal((html.match(/class="discovery-compare-card"/g)??[]).length,4);
 assert.match(html,/Saison \/ Öffnung|Gericht \/ Karte|Preissicherheit/);
 assert.match(html,/data-different=/);
 assert.doesNotMatch(html,/data-action="day-quick-add"|data-action="choose"|data-action="meal-choose"/);
 assert.match(html,/Nicht eingeplant/);
 assert.equal(current.state.favorites.length,0);
 assert.equal(current.activeSet.size,0);
 const filters=discoveryFilterPanel(current,discoveryRows(current,{group:'all'}));
 assert.match(filters,/data-action="discover-group"/);
 assert.match(filters,/id="discover-evidence"/);
 assert.match(filters,/id="discover-duration"/);
 assert.match(filters,/id="discover-sort"/);
 assert.match(filters,/role="status"/);
});
test('untrusted place names and sources are rendered escaped; no fabricated exact photo',()=>{
 const current=ctx(trips.find(x=>x.id==='interrail_classic'));
 const template=discoveryBase(current)[0];
 assert.ok(template);
 const malicious={...template,id:'unsafe',name:'<script>alert("x")</script>',
   website:'javascript:alert(1)',photo:null,
   city:'barcelona',point:null,price:null,effectivePrice:null};
 const html=discoveryCard(malicious,current);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>|href="javascript:/);
 assert.match(html,/Details/);
 const facts=discoveryFactRows(malicious,current);
 assert.ok(facts.some(([key])=>key==='Preisreferenz'));
});
