import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {hikingPanel,trailMetrics} from '../public/hiking.mjs';
import {mealFlowSummary} from '../public/meal-planner-ui.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(row=>row.id==='interrail_swiss');
const ctx=(date,city)=>({
 catalog,trip,date,city,cities:catalog.cities,all:trip.items,
 state:{expenses:[]},active:[],activeSet:new Set(),people:[{},{},{}],
 dayPlan:trip.dayPlansV32.find(row=>row.date===date),
 mealSlot:'lunch'
});

test('hike comparison shows contextual-photo disclaimer and prominent exposed terrain without altering route',()=>{
 const snapshot=structuredClone(trip.dayPlansV32);
 const september11=hikingPanel(ctx('2027-09-11','kandersteg'));
 assert.match(september11,/Heuberg/);
 assert.match(september11,/Gelände & Anforderungen/);
 assert.match(september11,/ausgesetzt/);
 assert.match(september11,/Wegzustand 2027/);
 assert.match(september11,/Keine Wegöffnung für September 2027/i);
 const september13=hikingPanel(ctx('2027-09-13','appenzell'));
 assert.match(september13,/Hüttentobel/);
 assert.match(september13,/Wildkirchli/);
 assert.match(september13,/unbrauchbare Platzhalter/);
 assert.equal((september13.match(/class="hike-profile"/g)??[]).length,1);
 assert.deepEqual(trip.dayPlansV32,snapshot);
 assert.equal(hikingPanel(ctx('2027-09-12','appenzell')),'');
});

test('shop flow displays source-safe separated currencies, stock, pending checkout and daily meals',()=>{
 const context=ctx('2027-09-04','barcelona');
 context.active=[{id:'meal:test',city:'barcelona',mealSlot:'lunch',date:context.date,
   mealPlanId:'barcelona-salad',start:null,zone:'Europe/Madrid',duration:15}];
 const stateBefore=structuredClone(context.state);
 const basket=[
  {name:'Haferflocken',currency:'EUR',stock:400,packs:1,total:79,checked:false},
  {name:'Milch',currency:'CHF',stock:0,packs:1,total:null,checked:false},
  {name:'Reis',currency:'EUR',stock:0,packs:0,total:0,checked:true},
 ];
 const html=mealFlowSummary(context,basket);
 assert.match(html,/3 Personen/);assert.match(html,/1 Auswahl/);
 assert.match(html,/1 Artikel mit hinterlegtem Vorrat/);
 assert.match(html,/2 offene Einkaufsposition/);
 assert.match(html,/EUR/);assert.match(html,/CHF/);
 assert.match(html,/offene Position/);
 assert.match(html,/Schätzungen sind keine Zahlungen/);
 assert.match(html,/href="#meal-recipe-choices"/);
 assert.match(html,/href="#meal-grocery-basket"/);
 assert.deepEqual(context.state,stateBefore);
});

test('GPX zero placeholders never become a flat vertical profile',()=>{
 const measure=trailMetrics([[[47.2,9.4,0],[47.201,9.4,0]]],{elevationsUsable:false});
 assert.equal(measure.profile,null);assert.equal(measure.ascent,null);
});
