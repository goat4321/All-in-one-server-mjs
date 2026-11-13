import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyBudgetProjection,dailyBudgetHtml,dailyBudgetDefaults } from '../public/daily-budget.mjs';

test('Simulator splits hotel across stay nights exactly and does not mutate source rows',()=>{
  const rows=[{kind:'lodging',id:'a',stayFrom:'2027-09-04',stayTo:'2027-09-07',euros:10001},
    {kind:'activity',date:'2027-09-05',euros:3000},
    {kind:'transport',date:'2027-09-05',euros:null}];
  const before=JSON.stringify(rows);
  const projections=['04','05','06'].map(d=>
    dailyBudgetProjection(rows,3,'2027-09-'+d,{target:60,food:10,mobility:5,activities:0}));
  assert.equal(projections.reduce((s,p)=>s+p.lodgingCents,0),10001);
  assert.equal(projections[1].knownCents,3333+3000);
  assert.equal(projections[1].unpriced,1);
  assert.equal(projections[1].additionalPerPersonCents,1500);
  assert.equal(projections[1].projectedGroupCents,6333+4500);
  assert.equal(JSON.stringify(rows),before);
});

test('Simulator handles missing data, no silent missing-price-as-confirmed-zero and limits',()=>{
 const rows=[{kind:'lodging',stayFrom:'2027-09-04',stayTo:'2027-09-06',euros:null}];
 const a=dailyBudgetProjection(rows,3,'2027-09-04',{...dailyBudgetDefaults,target:30});
 assert.equal(a.unpriced,1);
 assert.equal(a.knownCents,0);
 assert.equal(a.within,false);
 assert.equal(dailyBudgetProjection(rows,0,'2027-09-04'),null);
 assert.equal(dailyBudgetProjection(rows,3,'2027-09-04',{target:-10}),null);
 assert.equal(dailyBudgetProjection(rows,3,'bad-date'),null);
 const html=dailyBudgetHtml({budget:{rows},people:[{},{},{}],dates:['2027-09-04'],
   date:'2027-09-04',dailyBudgetInputs:dailyBudgetDefaults});
 assert.match(html,/Tagesbudget-Simulator/);
 assert.match(html,/keine tatsächlichen Ausgaben/);
 assert.match(html,/data-budget-assumption="food"/);
});
