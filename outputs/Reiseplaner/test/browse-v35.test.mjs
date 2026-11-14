import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {browseMatch,browseItems,browseHero,browseToolbar,mapBrowseModes,
 mapBrowsePanel,foodTypeTabs,foodBrowseCards,browseOptionCard}
 from '../public/browse-hub-v35.mjs';
import {explorerData,explorerCategory} from '../public/map-explorer.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_classic');
assert.ok(trip);
const ctx={
 trip,cities:catalog.cities,city:'barcelona',
 all:trip.items,people:[{id:'p1'},{id:'p2'},{id:'p3'}],
 state:{favorites:[],votes:{},verifications:{},placePhotos:{}},
 activeSet:new Set(),active:[],hotelWalks:{},compareIds:new Set(),
 nightlyTargetEuro:35,sort:'source',browseScope:'city',browseSearch:'',
 browseFoodType:'all',optionFilter:'all',catalog, date:'2027-09-04',
};
test('Browsing is independent of the current day and can include all travel cities',()=>{
 const city=browseItems(ctx.all,ctx,{kind:'lodging'});
 const all=browseItems(ctx.all,{...ctx,browseScope:'trip'},{kind:'lodging'});
 assert.ok(city.length>0);
 assert.ok(all.length>=city.length);
 assert.ok(all.some(x=>x.city!=='barcelona'));
 assert.ok(city.every(x=>x.city==='barcelona'));
 assert.ok(city.every(x=>!x.duplicateOf&&!x.removed));
});
test('Search normalizes accents and matches city names without changing data',()=>{
 assert.equal(browseMatch({name:'Café con leche',city:'barcelona'},'cafe',catalog.cities),true);
 assert.equal(browseMatch({name:'Some café',city:'barcelona'},'Barcelona',catalog.cities),true);
 assert.equal(browseMatch({name:'Museum',city:'barcelona'},'unsupported',catalog.cities),false);
 const before=ctx.all.length;
 const searched=browseItems(ctx.all,{...ctx,browseSearch:'Hostel',browseScope:'trip'},{kind:'lodging'});
 assert.ok(searched.length>=1);
 assert.ok(searched.every(x=>browseMatch(x,'Hostel',catalog.cities)));
 assert.equal(ctx.all.length,before);
});
test('Map has explicit date, current city and whole trip modes',()=>{
 const ex=explorerData(ctx.all,ctx.trip,{city:'barcelona',group:'all'});
 const rendered=mapBrowseModes({...ctx,explorer:{...ex,scope:'city'}});
 assert.match(rendered,/Mein Tag/);
 assert.match(rendered,/Barcelona entdecken/);
 assert.match(rendered,/Alle Reiseorte/);
 assert.match(rendered,/data-value="city" aria-pressed="true"/);
});
test('Map browse panel counts all categories even while one filter is active',()=>{
 const full=explorerData(ctx.all,ctx.trip,{city:'barcelona',group:'all'});
 const foodOnly=explorerData(ctx.all,ctx.trip,{city:'barcelona',group:'food'});
 const rendered=mapBrowsePanel({...ctx,explorer:{...foodOnly,scope:'city',group:'food',
  marketsShown:true,marketCount:4}});
 assert.match(rendered,/Orte unabhängig vom Reisetag entdecken/);
 assert.match(rendered,/Essen & Cafés/);
 assert.match(rendered,/Supermärkte/);
 assert.match(rendered,/Alle Unterkünfte/);
 assert.match(rendered,/Essen & Einkaufen/);
 const lodging=full.placed.concat(full.unlocated).filter(x=>x.explorerCategory==='lodging').length;
 assert.ok(lodging>0);
 assert.match(rendered,new RegExp(lodging+' recherchierte Orte'));
});
test('Hotel and activity views have accessible city/trip scope, search and controls',()=>{
 const hero=browseHero(ctx,'lodging',5);
 const controls=browseToolbar(ctx,{kind:'lodging',total:50,filtered:5});
 assert.match(hero,/Unterkünfte entdecken/);
 assert.match(hero,/Unverbindlich|Aufenthalte vergleichen/);
 assert.match(hero,/Unterkünfte auf Karte/);
 assert.match(controls,/id="browse-city"/);
 assert.match(controls,/value="paris"/);
 assert.match(controls,/id="browse-search"/);
 assert.match(controls,/Alle Reiseorte/);
 assert.match(controls,/5 angezeigt/);
 assert.doesNotMatch(controls,/onsubmit=/i);
});
test('Lodging cards offer prominent essentials while retaining sources and group voting',()=>{
 const place=browseItems(ctx.all,ctx,{kind:'lodging'})[0];
 const markup=browseOptionCard(place,ctx,{lodging:true});
 assert.match(markup,/class="hub-option-card"/);
 assert.match(markup,/Preisorientierung/);
 assert.match(markup,/data-action="choose"/);
 assert.match(markup,/data-action="details"/);
 assert.match(markup,/data-action="browse-save"/);
 assert.match(markup,/data-action="compare"/);
 assert.match(markup,/class="hub-option-evidence"/);
 assert.match(markup,/group-vote-snippet/);
 assert.match(markup,/lodging-price-meter/);
 assert.match(markup,/Bildquelle|Bildquelle offen|Bildquelle in den Details/);
 assert.doesNotMatch(markup,/jetzt buchbar|verfügbar heute/i);
});
test('Food categories and cards remain separate from daily meal calculations',()=>{
 const food=ctx.all.filter(x=>x.kind==='activity'&&x.city==='barcelona'
  &&['food','shop'].includes(explorerCategory(x))&&!x.removed&&!x.duplicateOf);
 assert.ok(food.length>0);
 const tabs=foodTypeTabs({...ctx,browseFoodType:'restaurants'},
   {all:food.length,restaurants:food.length,markets:0,cook:0});
 assert.match(tabs,/Restaurants & Cafés/);
 assert.match(tabs,/data-value="restaurants" aria-pressed="true"/);
 assert.match(tabs,/Supermärkte/);
 const html=foodBrowseCards(ctx,food.slice(0,4));
 assert.match(html,/hub-food-grid/);
 assert.match(html,/Auf Karte|Details & Quellen/);
 assert.ok(!html.includes('4.8 / 5'));
});
test('All route browse scope can be selected without booking or rewriting the plan',()=>{
 const controls=browseToolbar({...ctx,browseScope:'trip'},{kind:'food',total:22,filtered:20});
 assert.match(controls,/data-value="trip" aria-pressed="true"/);
 assert.match(controls,/Restaurant, Café, Supermarkt/);
 assert.equal(ctx.state.favorites.length,0);
 assert.equal(ctx.activeSet.size,0);
});
