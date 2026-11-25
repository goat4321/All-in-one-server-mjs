import test from 'node:test';
import assert from 'node:assert/strict';
import {groceryBasket,mealEstimate,calculateBudget} from '../public/model.mjs';
import {initialState,validateState} from '../lib/store.mjs';
const trip={id:'meal-test',travellers:3,route:['barcelona','kandersteg'],from:'2027-09-01',to:'2027-09-14',items:[]};
const product=(source,cents,unit='g',currency='EUR')=>({name:source,source,pack:500,need:100,cents,unit,currency});
const item=(id,slot,products,city='barcelona')=>({id:'manual:'+id,name:id,trip:trip.id,kind:'activity',category:'food',
 city,date:'2027-09-04',zone:'Europe/Madrid',start:null,end:null,selected:true,mealSlot:slot,mealPlanId:id,
 requiresKitchen:false,basketProducts:products,price:null});

test('cold breakfast and lunch pool shared ingredients even without a stove',()=>{
 const p=product('shared-oats',100);
 const items=[item('breakfast','breakfast',[p]),item('lunch','lunch',[p])];
 const rows=groceryBasket(items,3);
 assert.equal(rows.length,1);assert.equal(rows[0].required,600);assert.equal(rows[0].packs,2);
 const state={...initialState(trip),manual:items};
 assert.doesNotThrow(()=>validateState(state,trip,[]));
 assert.equal(calculateBudget(items,state).total,200);
 assert.equal(calculateBudget(items,state).unknown,0);
});
test('unknown ingredient prices keep known subtotal and never create a complete zero meal',()=>{
 const option={type:'cook',products:[product('known',100),product('missing',null)]};
 const estimate=mealEstimate(option,3);
 assert.equal(estimate.base,null);assert.equal(estimate.knownBase,100);
 assert.equal(estimate.products[1].total,null);
 const meal=item('unknown','lunch',option.products);
 const state={...initialState(trip),manual:[meal]};
 assert.doesNotThrow(()=>validateState(state,trip,[]));
 const rows=groceryBasket([meal],3);
 assert.equal(rows[1].total,null); assert.match(rows[1].key,/:open$/);
 const budget=calculateBudget([meal],state);
 assert.equal(budget.total,100);assert.equal(budget.unknown,1);
 const override={packs:1,unitCents:85,explicitPacks:true};
 const updated={...state,groceryOverrides:{[rows[1].key]:override}};
 assert.doesNotThrow(()=>validateState(updated,trip,[]));
 assert.equal(calculateBudget([meal],updated).total,185);
 assert.equal(calculateBudget([meal],updated).unknown,0);
});
test('ingredient units and currencies do not merge or silently convert',()=>{
 const recipes=[item('eur','breakfast',[product('milk',100,'ml')]),
  item('chf','lunch',[product('milk',70,'ml','CHF')])];
 const rows=groceryBasket(recipes,3);
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.currency),['EUR','CHF']);
 assert.ok(rows.every(r=>r.unit==='ml'));
 const state={...initialState(trip),manual:recipes,groceryOverrides:{[rows[1].key]:{packs:1,unitCents:75}},
  shopping:{pantry:{[rows[1].key]:10},checked:{[rows[1].key]:true},excluded:{},extras:[]}};
 assert.doesNotThrow(()=>validateState(state,trip,[]));
 const budget=calculateBudget(recipes,state);
 assert.equal(budget.total,100);assert.ok(budget.rows.some(r=>r.currency==='CHF'&&r.original===75&&r.euros===null));
 assert.throws(()=>mealEstimate({type:'cook',currency:'EUR',products:[product('wrong',100,'g','CHF')]},3),/Währung/);
 const missing=item('missing-chf','dinner',[product('unknown-chf',null,'g','CHF')],'kandersteg');
 const missingBudget=calculateBudget([missing],{...initialState(trip),manual:[missing]});
 assert.equal(missingBudget.rows.find(r=>r.id.endsWith(':unknown')).currency,'CHF','Even an unknown amount keeps its source currency');
});
