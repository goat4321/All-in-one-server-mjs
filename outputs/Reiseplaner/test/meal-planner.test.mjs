import test from 'node:test';
import assert from 'node:assert/strict';
import {mealPlans,mealResearch,mealSources} from '../lib/meal-catalog.mjs';
import {mealAccommodation,mealSelectionPatch,plansForSlot,shoppingStopDraft,shoppingCandidates,mealSlotLabels} from '../public/meal-planner.mjs';
import {initialState,validateState} from '../lib/store.mjs';
import {activeItems,calculateBudget} from '../public/model.mjs';
import {mealDayOverview,stapleComparison} from '../public/meal-planner-ui.mjs';
const trip={id:'test-meals',travellers:3,route:['paris','barcelona'],from:'2027-09-01',to:'2027-09-14',items:[]};
const ctx=()=>({trip,date:'2027-09-04',city:'barcelona',people:initialState(trip).people,state:initialState(trip),active:[],
 all:[],cities:{barcelona:{name:'Barcelona',timezone:'Europe/Madrid'},paris:{name:'Paris',timezone:'Europe/Paris'}},catalog:{mealPlans}});
const hotel={id:'hotel',kind:'lodging',city:'barcelona',name:'Ausgewählte Unterkunft',stayFrom:'2027-09-03',stayTo:'2027-09-06',kitchenMode:'shared',point:[41.4,2.1]};

test('six core cities offer sourced recipes for all three slots with explicit preparation assumptions',()=>{
 assert.equal(Object.keys(mealPlans).length,6);assert.equal(mealResearch.stapleReferences.length,9);
 for(const [city,plans] of Object.entries(mealPlans))for(const slot of Object.keys(mealSlotLabels)){
  const options=plansForSlot(plans,slot);assert.ok(options.length>0,city+' '+slot);
  for(const p of options.filter(p=>p.type==='cook')){
   assert.ok(p.steps.length>=2);assert.ok(p.prep>=5&&p.prep<=35);
   assert.ok(p.products.every(product=>mealSources.some(s=>s.id===product.source)));
   assert.ok(p.note.includes('pro Person')||p.id==='pasta');
  }
 }
 assert.equal(mealPlans.barcelona.find(p=>p.id==='pasta').products[0].cents,80);
 assert.ok(mealResearch.missingProducts.every(p=>p.cents===null&&p.reason&&p.nextAction));
 assert.ok(mealResearch.stapleReferences.every(p=>p.checkedOn==='2026-11-19'&&p.available2027===false));
});
test('daily overview and comparable source basket render all slots without invented prices',()=>{
 const c=ctx();c.catalog.research={mealResearch};
 const overview=mealDayOverview(c),basket=stapleComparison(c);
 for(const label of Object.values(mealSlotLabels))assert.ok(overview.includes(label));
 assert.match(basket,/Produktquelle/);assert.match(basket,/Schweiz · CHF/);
 assert.match(basket,/3,59/);assert.match(basket,/2,87/);assert.match(basket,/3,45/);
 assert.match(basket,/lokale Filialpreise, Bestand und 2027 offen/);
});
test('breakfast uses the previous night; destination arrival does not grant morning kitchen access',()=>{
 const c={...ctx(),active:[hotel]};
 assert.equal(mealAccommodation(c,'breakfast').hotel.id,'hotel');
 assert.equal(mealAccommodation({...c,date:'2027-09-03'},'breakfast').hotel,null);
 assert.equal(mealAccommodation({...c,date:'2027-09-06'},'breakfast').hotel.id,'hotel');
 assert.equal(mealAccommodation({...c,date:'2027-09-06'},'dinner').hotel,null);
 const arrival=mealAccommodation({...c,date:'2027-09-03'},'lunch');
 assert.equal(arrival.kitchenReady,false);assert.match(arrival.notice,/Check-in/);
 assert.equal(mealAccommodation(c,'dinner').kitchenReady,true);
});
test('checkout breakfast access requires actual meal time, checkout time and a fitting duration',()=>{
 const c={...ctx(),date:'2027-09-06',active:[{...hotel,zone:'Europe/Madrid',end:'2027-09-06T08:00:00Z'}]};
 assert.equal(mealAccommodation(c,'breakfast',null).kitchenReady,false);
 assert.equal(mealAccommodation({...c,active:[hotel]},'breakfast','12:00').kitchenReady,false);
 assert.equal(mealAccommodation(c,'breakfast','09:45',30).kitchenReady,false);
 assert.equal(mealAccommodation(c,'breakfast','09:00',30).kitchenReady,true);
 const late={id:'manual:late',city:'barcelona',name:'Spätes Frühstück',mealSlot:'breakfast',date:c.date,zone:'Europe/Madrid',start:'2027-09-06T10:00:00Z',duration:30};
 const html=mealDayOverview({...c,mealSlot:'breakfast',active:[...c.active,late]});
 assert.match(html,/Check-out/);assert.ok(!html.includes('Küche laut Unterkunftsbeschreibung'));
});
test('three saved meal slots pool cold and warm products and replacing lunch keeps the other meals',()=>{
 let c=ctx();
 for(const [id,slot] of [['barcelona-oats','breakfast'],['barcelona-salad','lunch'],['pasta','dinner']]){
  const plan=mealPlans.barcelona.find(p=>p.id===id);
  c.state=mealSelectionPatch(c,plan,{slot,time:'',duration:plan.prep},'manual:'+slot);
  c.active=activeItems(trip,c.state);
 }
 assert.doesNotThrow(()=>validateState(c.state,trip,[]));
 assert.equal(c.active.length,3);assert.ok(c.active.every(i=>i.start===null));
 assert.equal(c.active.find(i=>i.mealSlot==='breakfast').requiresKitchen,false);
 const before=c.state;
 c.state=mealSelectionPatch(c,mealPlans.barcelona.find(p=>p.id==='barcelona-rice'),{slot:'lunch',time:'12:30',duration:30},'manual:replacement');
 const active=activeItems(trip,c.state);
 assert.equal(active.length,3);assert.ok(active.some(i=>i.id==='manual:breakfast'));assert.ok(active.some(i=>i.id==='manual:dinner'));
 assert.equal(before.edits['manual:lunch'],undefined,'Original state is immutable');
 assert.doesNotThrow(()=>validateState(c.state,trip,[]));
 assert.ok(calculateBudget(active,c.state).total>0);
});
test('paid and protected meal slots cannot be replaced and date or slot misuse is rejected',()=>{
 const c=ctx(),plan=mealPlans.barcelona.find(p=>p.id==='pasta');
 c.state=mealSelectionPatch(c,plan,{slot:'dinner',time:'19:00',duration:35},'manual:old');
 c.active=activeItems(trip,c.state);
 assert.throws(()=>mealSelectionPatch({...c,active:[{...c.active[0],booked:true}]},plan,{slot:'dinner',time:'19:00',duration:35},'manual:new'),/gesperrt/);
 assert.throws(()=>mealSelectionPatch({...c,state:{...c.state,expenses:[{forItem:'manual:old'}]}},plan,{slot:'dinner',time:'19:00',duration:35},'manual:new'),/Ausgabe/);
 assert.throws(()=>mealSelectionPatch(c,plan,{slot:'breakfast',time:'',duration:35},'manual:new'),/Mahlzeit/);
 assert.throws(()=>mealSelectionPatch({...c,date:'2028-09-04'},plan,{slot:'dinner',time:'',duration:35},'manual:new'),/Reisetag/);
});
test('an optional shopping stop adds time and source location, never a second grocery purchase',()=>{
 const c=ctx(),store={id:'store',name:'Carrefour Test',kind:'activity',category:'shopping',city:'barcelona',
  point:[41.38,2.16],source:['store-source'],website:'https://example.test/store'};
 c.all=[store];
 const stop=shoppingStopDraft(c,store,{time:'18:00',duration:20},'manual:shop');
 assert.equal(stop.price.cents,0);assert.match(stop.price.label,/Warenkosten/);
 assert.deepEqual(stop.point,store.point);assert.equal(stop.shoppingSourceId,'store');
 assert.equal(store.selected,undefined);assert.equal(c.state.manual.length,0);
 const state={...c.state,manual:[stop]};assert.doesNotThrow(()=>validateState(state,trip,[]));
 assert.deepEqual(shoppingCandidates({...c,all:[store,stop]}).map(i=>i.id),['store'],'Derived shopping visits are not source shops');
 assert.throws(()=>shoppingStopDraft({...c,active:[stop]},store,{time:'',duration:20},'manual:another'),/bereits/);
 assert.throws(()=>shoppingStopDraft({...c,active:[{...store,date:c.date}]},store,{time:'',duration:20},'manual:another'),/bereits/);
 assert.throws(()=>shoppingStopDraft({...c,city:'paris'},store,{time:'',duration:20},'manual:shop'),/Einkaufsort/);
});
