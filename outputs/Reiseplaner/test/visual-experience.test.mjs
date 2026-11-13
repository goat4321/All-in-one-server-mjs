import test from 'node:test';
import assert from 'node:assert/strict';
import {dayPeriod,planCostSignal} from '../public/visual-experience.mjs';
test('Recorded day periods are grouped; flexible times are never invented',()=>{
 assert.equal(dayPeriod('08:45')?.title,'Morgen');
 assert.equal(dayPeriod('11:00')?.title,'Mittag');
 assert.equal(dayPeriod('14:15')?.title,'Nachmittag');
 assert.equal(dayPeriod('20:00')?.title,'Abend');
 assert.equal(dayPeriod('Flexibel'),null);
 assert.equal(dayPeriod('25:12'),null);
});
test('Price tiers use only real EUR plan numbers, no fake provider quotes',()=>{
 const food={kind:'activity',category:'food',price:{cents:1800,currency:'EUR',scope:'person'}};
 const p=planCostSignal(food,3);
 assert.equal(p.tier,'€€');
 assert.match(p.note,/Planwert/);
 assert.match(p.note,/keine bestätigte Ausgabe/);
 assert.equal(planCostSignal({...food,price:null},3).tier,'€?');
 assert.equal(planCostSignal({...food,price:{cents:999,currency:'CHF'}},3).known,false);
 assert.equal(planCostSignal({kind:'lodging',price:{cents:9000,currency:'EUR',scope:'group'}},3).tier,'€?');
 assert.equal(planCostSignal({...food,price:{cents:0,currency:'EUR',scope:'person'}},3).tier,'0 €');
});
