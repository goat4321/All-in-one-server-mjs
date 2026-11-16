import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mapViewSummary} from '../public/map-view-summary-v72.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const base={city:'paris',cities:{paris:{name:'Paris',point:[48.85,2.35]}},
 trip:{route:['paris']},explorer:{scope:'city',group:'all',search:'',
 placed:[{id:'a',point:[48.85,2.35]},{id:'b',point:[41.4,2.16]}],
 unlocated:[{id:'c'}],saved:new Set(),savedOnly:false,viewportOnly:false}};
test('V73 counts only in-bounds LIST hits when viewport filter is active',()=>{
 const ex={...base.explorer,viewportOnly:true,viewportBounds:[48.8,2.2,48.9,2.4]};
 const s=mapViewSummary({...base,explorer:ex});
 assert.equal(s.displayCount,1);
 assert.equal(s.displayLabel,'Ort in der Liste');
 assert.equal(s.unlocated,1);
 assert.match(s.hint,/Nur die Liste/);
 assert.equal(mapViewSummary({...base,explorer:{...ex,viewportBounds:[51,7,52,8]}}).displayCount,0);
 assert.equal(mapViewSummary({...base,explorer:{...ex,viewportBounds:null}}).displayCount,2);
});
test('V73 individual filter removal and mobile-first map controls are wired',async()=>{
 const [v,a,c,i]=await Promise.all(['public/views.mjs','public/app.mjs',
 'public/map-polish-v73.css','public/index.html'].map(read));
 assert.match(v,/data-action="map-remove-filter"/);
 assert.match(v,/aria-label="Filter /);
 assert.match(a,/case 'map-remove-filter'/);
 assert.match(a,/value==='viewport'/);
 assert.match(a,/value==='nearby'/);
 assert.match(a,/!view\.mapListOpen/);
 assert.match(a,/restoreView:!changedScope/);
 assert.match(c,/\.map-panel>\.map-context-summary/);
 assert.match(c,/order:1/);
 assert.match(c,/\.map-panel>\.map-wrap/);
 assert.match(c,/order:2/);
 assert.match(c,/focus-visible/);
 assert.match(c,/prefers-reduced-motion/);
 assert.match(i,/map-polish-v73\.css/);
});
