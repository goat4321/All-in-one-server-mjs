import test from 'node:test';
import assert from 'node:assert/strict';
import { readinessOverview,readinessPanel } from '../public/readiness-panel.mjs';

const example={trip:{stayByCity:{paris:{from:'2027-09-01',to:'2027-09-03'},
  barcelona:{from:'2027-09-03',to:'2027-09-05'}}},
  people:[{id:'p1'},{id:'p2'},{id:'p3'}],
  active:[{id:'hotel:1',kind:'lodging',city:'paris',stayFrom:'2027-09-01',stayTo:'2027-09-03'},
    {id:'train:1',kind:'transport',mode:'train'}],
  budget:{rows:[{euros:10000},{euros:null}]},
  state:{deadlines:[{done:true},{done:false}],verifications:{
    'hotel:1':{checks:{room:true,beds:true,taxes:true,cancellation:true,checkout:true},
      groupSize:3,evidenceUrl:'https://example.com',checkedAt:'2026-11-13'}}}};
test('Readiness shows factual ratios but does not treat self-review as actual booking',()=>{
 const rows=readinessOverview(example);
 assert.deepEqual(rows.map(r=>[r.done,r.total]),[[1,2],[1,1],[0,1],[1,2],[1,2]]);
 const html=readinessPanel(example);
 assert.match(html,/Fortschritt der Reisevorbereitung/);
 assert.match(html,/Selbst erfasste Prüfvermerke/);
 assert.match(html,/aria-valuenow="1"/);
 assert.match(html,/data-readiness="hotel-review"/);
});
test('Empty progress categories do not pretend verification',()=>{
 const ctx={trip:{stayByCity:{}},people:[{id:'p1'}],active:[],
   budget:{rows:[]},state:{verifications:{},deadlines:[]}};
 assert.ok(readinessOverview(ctx).every(x=>x.done===0&&x.total===0));
 assert.match(readinessPanel(ctx),/Noch keine entsprechenden Einträge/);
});
