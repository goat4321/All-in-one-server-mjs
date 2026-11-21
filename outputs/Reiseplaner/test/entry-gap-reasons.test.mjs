import test from 'node:test';
import assert from 'node:assert/strict';
import {explainMissingField} from '../public/entry-gap-reasons.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';
test('Airbnb position remains private and explicitly explained',()=>{
 const gap=explainMissingField({id:'wishlist:airbnb:abc',provider:'Airbnb'},
  {key:'location',next:'Prüfen',label:'Position'});
 assert.match(gap.reason,/Airbnb/);
 assert.match(gap.manual,/keine private Hausadresse/);
});
test('Every missing field has reason, next action and user contribution',()=>{
 const item={id:'x',kind:'activity',city:'barcelona',name:'Ungeklärte Aktivität'};
 const report=entryCompleteness(item,{people:[{id:'p1'}],state:{placePhotos:{}}});
 assert.ok(report.gaps.length>=3);
 assert.ok(report.gaps.every(g=>g.reason&&g.next&&g.manual&&g.priority));
});
