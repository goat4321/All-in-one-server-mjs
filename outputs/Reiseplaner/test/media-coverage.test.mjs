import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { initialState } from '../lib/store.mjs';
import { mediaCoverage, mediaCoveragePanel } from '../public/media-coverage.mjs';

const catalog=await loadCatalog(),trip=catalog.trips[0],state=initialState(trip);
const ctx={all:trip.items,state,people:state.people,activeSet:new Set(),
  cities:catalog.cities,catalog};
test('Image coverage derives real source-backed photos; unknown pictures stay open',()=>{
 const c=mediaCoverage(ctx);
 assert.ok(c.total>0);
 assert.ok(c.illustrated<=c.total);
 assert.equal(c.groups.reduce((sum,g)=>sum+g.total,0),c.total);
 assert.equal(c.groups.reduce((sum,g)=>sum+g.illustrated,0),c.illustrated);
 assert.ok(c.lacking.every(row=>row.hasPhoto===false));
 const html=mediaCoveragePanel(ctx);
 assert.match(html,/Bildabdeckung/);
 assert.match(html,/ohne Quellenfoto/);
 assert.match(html,/data-action="photo-edit"/);
 assert.doesNotMatch(html,/100 % garantiert/);
});
test('A self-sourced photo changes coverage but not the original catalog',()=>{
 const target=ctx.all.find(i=>!i.duplicateOf&&!i.removed);
 const before=mediaCoverage(ctx);
 const added={...ctx,state:{...state,placePhotos:{[target.id]:{
   url:'https://example.org/photo.jpg',sourceUrl:'https://example.org/license',
   credit:'Test author CC BY 4.0'}}}};
 const after=mediaCoverage(added);
 if(before.lacking.some(x=>x.item.id===target.id))
   assert.equal(after.illustrated,before.illustrated+1);
 assert.equal(after.total,before.total);
 assert.equal(ctx.all.find(i=>i.id===target.id)?.photo,undefined);
});
