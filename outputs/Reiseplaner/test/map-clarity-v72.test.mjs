import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mapViewSummary} from '../public/map-view-summary-v72.mjs';

const trips={route:['paris','barcelona','paris','venice','unknown']};
const cities={paris:{name:'Paris',point:[48.85,2.35]},
 barcelona:{name:'Barcelona',point:[41.4,2.16]},
 venice:{name:'Venedig',point:[45.44,12.33]},
 unknown:{name:'Unklar',point:null}};
const base={trip:trips,cities,city:'paris',mapScope:'city',
 explorer:{scope:'city',placed:[{id:'a'},{id:'b'}],
  unlocated:[{id:'c'}],group:'all',search:'',saved:new Set(['a','c']),
  savedOnly:false,viewportOnly:false,nearby:null}};
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('V72 city scope counts map points and explicit unavailable location references',()=>{
 const s=mapViewSummary(base);
 assert.equal(s.title,'Paris entdecken');
 assert.equal(s.displayCount,2);
 assert.equal(s.unlocated,1);
 assert.match(s.hint,/keinen individuell belegten Kartenpunkt/);
 assert.equal(s.saved,2);
 assert.deepEqual(s.filters,[]);
 assert.equal(s.canClear,false);
});
test('V72 route mode counts city hubs only, not all available POIs',()=>{
 const s=mapViewSummary({...base,explorer:{...base.explorer,scope:'trip'}});
 assert.equal(s.scope,'trip');
 assert.equal(s.displayCount,3);
 assert.equal(s.displayLabel,'Städte');
 assert.match(s.description,/schematische/i);
 assert.match(s.hint,/Stadt/);
});
test('V72 explicitly labels all filters, provides truthful no-result guidance',()=>{
 const s=mapViewSummary({...base,explorer:{...base.explorer,
  placed:[],unlocated:[],group:'food',search:'  Café du Marché ',
  savedOnly:true,viewportOnly:true,nearby:{point:[48,2]}}});
 assert.equal(s.displayCount,0);
 assert.equal(s.empty,true);
 assert.equal(s.filters.length,5);
 assert.deepEqual(s.filters.map(x=>x.key),['group','search','saved','viewport','nearby']);
 assert.match(s.hint,/Keine Orte/);
 assert.equal(s.canClear,true);
 const day=mapViewSummary({...base,explorer:{...base.explorer,scope:'day',
   placed:[],unlocated:[]}});
 assert.match(day.hint,/Für diesen Tag/);
});
test('V72 map layout retains hidden-but-accessible research and always shows primary search',async()=>{
 const [views,app,style,index,reference]=await Promise.all([
  read('public/views.mjs'),read('public/app.mjs'),
  read('public/map-clarity-v72.css'),read('public/index.html'),
  read('public/reference-map-scene.mjs')
 ]);
 assert.match(views,/function mapContextSummary\(ctx\)/);
 assert.match(views,/data-action="map-open-search"/);
 assert.match(views,/data-action="map-clear-filters"/);
 assert.match(views,/map-extra-details/);
 assert.match(views,/renderMapHud\(ctx\)/);
 assert.match(views,/map-legend-disclosure/);
 assert.match(views,/map-selected-dismiss/);
 assert.match(views,/map-category-discovery/);
 assert.match(views,/map-day-more/);
 assert.match(app,/mapListOpen:true/);
 assert.match(app,/case 'map-open-search'/);
 assert.match(app,/case 'map-clear-filters'/);
 assert.match(app,/case 'map-clear-selection'/);
 assert.match(app,/if\(event\.target\.matches\('\.reference-places-drawer'\)\)view\.mapListOpen=/);
 assert.match(style,/map-context-summary/);
 assert.match(style,/\.map-tools\{/);
 assert.match(style,/map-extra-content/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.match(index,/map-clarity-v72\.css/);
 assert.match(reference,/mapFloatingControls/);
});
