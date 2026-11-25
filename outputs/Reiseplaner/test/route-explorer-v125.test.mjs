import test from 'node:test';
import assert from 'node:assert/strict';
import {explorerActivityV125,explorerPhotoV125,explorerMediaHtmlV125,explorerMarkerRowsV125,upcomingActivityPhotoV125,syncExplorerMarkersV125,clearExplorerMarkersV125} from '../public/route-explorer-v125.mjs';
const a={id:'a',kind:'activity',city:'x',name:'<Museum>',detail:'Testbeschreibung',price:{cents:1500,currency:'CHF',scope:'person'}};
const b={id:'b',kind:'activity',city:'x',name:'B'};
const photo={url:'https://example.com/a.jpg',sourceUrl:'https://example.com/source',credit:'Autor CC BY 4.0'};
const ctx={all:[a,b],state:{placePhotos:{a:[photo],b:[{...photo,contextualOnly:true}]}}};
const stops=[{id:'a',name:a.name,period:'Vormittag',minutes:60,point:[47,8]},{id:'b',name:b.name,period:'Mittag',point:null}];
const scene={stop:stops[0],stops,index:0,day:{date:'2027-09-01'},contentKey:'day'};
test('V125 uses activity photos, excludes contextual-only photos and labels fallback',()=>{
 assert.equal(explorerActivityV125(ctx,stops[0]).photos[0],photo);
 assert.equal(explorerPhotoV125(ctx,scene).item,a);
 assert.equal(explorerPhotoV125(ctx,{...scene,stop:stops[1]},{item:a,photo}).contextual,true);
 assert.equal(upcomingActivityPhotoV125(ctx,scene),null);
 const html=explorerMediaHtmlV125(ctx,scene,null);
 assert.match(html,/&lt;Museum&gt;/);assert.match(html,/60 Min/);assert.match(html,/CHF/);assert.match(html,/pro Person/);assert.match(html,/Testbeschreibung/);
 assert.doesNotMatch(html,/<Museum>/);
});
test('V125 only creates markers for stops with points, and removes them during transfers',()=>{
 assert.equal(explorerMarkerRowsV125(ctx,scene).length,1);
 let added=0,removed=0,seek=-1,handler;
 const layer={addTo(){added++;return this},clearLayers(){}};
 const map={removeLayer(){removed++}};
 const leaflet={layerGroup:()=>layer,divIcon:o=>o,marker:()=>({addTo(){return this},on(_,fn){handler=fn},getElement(){return null},setZIndexOffset(){}})};
 syncExplorerMarkersV125(map,leaflet,ctx,scene,{phase:'dwell'},i=>seek=i);handler();assert.equal(seek,0);
 syncExplorerMarkersV125(map,leaflet,ctx,scene,{phase:'dwell'},()=>{});assert.equal(added,1);
 syncExplorerMarkersV125(map,leaflet,ctx,scene,{phase:'travel'},()=>{});assert.equal(removed,1);
 clearExplorerMarkersV125(map);assert.equal(removed,1);
});
