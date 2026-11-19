import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFieldAudit,fieldAuditAsCsv} from '../public/field-audit-export-v39.mjs';
import {loadCatalog} from '../lib/catalog.mjs';

test('CSV lists every missing field in the selected variant without false values',async()=>{
 const catalog=await loadCatalog();
 const trip=catalog.trips[0];
 const ctx={catalog,trip,cities:catalog.cities,all:trip.items,
  people:Array.from({length:trip.travellers},()=>({})),state:{placePhotos:{}}};
 const report=buildFieldAudit(ctx),csv=fieldAuditAsCsv(report,catalog.cities);
 const total=report.entries.reduce((n,item)=>n+item.gaps.length,0);
 assert.equal(report.entries.length+report.summary.complete,report.summary.total);
 assert.equal(csv.split('\r\n').length,total+2);
 assert.match(csv,/Fehlendes Feld/);
 assert.match(csv,/Nächste Prüfung/);
 assert.match(csv,/Dein möglicher Beitrag/);
 assert.ok(!csv.includes('undefined'));
 assert.ok(report.entries.some(row=>row.gaps.some(g=>g.field==='location')));
 assert.match(csv,/Ort/);
});
test('CSV injection is neutralized, semicolons quoted and umlauts preserved',()=>{
 const report={variantId:'demo',entries:[{id:'=SUM(1+1)',city:'a',name:'-bad',
  kind:'activity',gaps:[{field:'photo',label:'Bild',
   reason:'a;"b"',next:'Prüfen',manualContribution:'=1+1',priority:'hoch',category:'Quelle'}]}]};
 const csv=fieldAuditAsCsv(report,{a:{name:'München'}});
 assert.equal(csv[0],'\uFEFF');
 assert.match(csv,/München/);
 assert.match(csv,/"'=SUM\(1\+1\)"/);
 assert.match(csv,/"'-bad"/);
 assert.match(csv,/"'=1\+1"/);
 assert.match(csv,/a;""b""/);
});
