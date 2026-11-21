import test from 'node:test';
import assert from 'node:assert/strict';
import { optionMatchesFilter,smartFilterHelp } from '../public/smart-filters.mjs';

const p=[{id:'p1'},{id:'p2'},{id:'p3'}];
const ctx={people:p,state:{favorites:['saved'],votes:{beach:{p1:5,p2:3},museum:{p1:5,p2:5}},
  verifications:{hotel:{groupSize:3,checks:{beds:true}},unverified:{groupSize:2,checks:{beds:true}}}},
  nightlyTargetEuro:35,hotelWalks:{hotel:{minutes:12},other:{minutes:16}}};
const hotel={id:'hotel',name:'Testhotel',kind:'lodging',kitchenMode:'shared',
  stayFrom:'2027-09-04',stayTo:'2027-09-06',
  price:{cents:21000,currency:'EUR',scope:'group'}};
const noKitchen={...hotel,id:'other',kitchenMode:null,kitchen:'Keine Küche'};
const beach={kind:'activity',id:'beach',name:'Strandpromenade',price:null,tags:['Wasser']};
const museum={kind:'activity',id:'museum',name:'Kostenlose Ausstellung',price:{cents:0,currency:'EUR',scope:'group'}};
test('Smart stay filters only match source-backed kitchen, walks and party-specific beds',()=>{
 assert.equal(optionMatchesFilter(hotel,'kitchen',ctx,true),true);
 assert.equal(optionMatchesFilter(noKitchen,'kitchen',ctx,true),false);
 assert.equal(optionMatchesFilter(hotel,'station',ctx,true),true);
 assert.equal(optionMatchesFilter(noKitchen,'station',ctx,true),false);
 assert.equal(optionMatchesFilter(hotel,'beds',ctx,true),true);
 assert.equal(optionMatchesFilter({...hotel,id:'unverified'},'beds',ctx,true),false);
 assert.equal(optionMatchesFilter(hotel,'budget',ctx,true),true);
 assert.equal(optionMatchesFilter({...hotel,price:{...hotel.price,currency:'CHF'}},'budget',ctx,true),false);
});
test('Activity facets separate free price reference, water text, swimming and consensus',()=>{
 assert.equal(optionMatchesFilter(museum,'free',ctx,false),true);
 assert.equal(optionMatchesFilter(beach,'free',ctx,false),false);
 assert.equal(optionMatchesFilter(beach,'water',ctx,false),true);
 assert.equal(optionMatchesFilter(beach,'swimming',ctx,false),false);
 assert.equal(optionMatchesFilter({...beach,name:'Am See baden'},'swimming',ctx,false),true);
 assert.equal(optionMatchesFilter(museum,'consensus',ctx,false),true);
 assert.equal(optionMatchesFilter(beach,'consensus',ctx,false),true);
 assert.equal(optionMatchesFilter({...museum,id:'unknown'},'consensus',ctx,false),false);
 assert.match(smartFilterHelp.swimming,/separat prüfen/);
});
