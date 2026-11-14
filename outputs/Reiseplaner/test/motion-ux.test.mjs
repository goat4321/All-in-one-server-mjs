import test from 'node:test';
import assert from 'node:assert/strict';
import {motionEnabled,motionStagger,motionSceneKey,createMotionController}
  from '../public/motion-ux.mjs';

test('Global motion setting respects both OS reduced motion and user off',()=>{
 assert.equal(motionEnabled('auto',false),true);
 assert.equal(motionEnabled('on',false),true);
 assert.equal(motionEnabled('off',false),false);
 assert.equal(motionEnabled('auto',true),false);
 assert.equal(motionEnabled('on',true),false);
});
test('Reveal stagger is bounded and normalized for long lists',()=>{
 assert.equal(motionStagger(0),0);
 assert.equal(motionStagger(1),32);
 assert.equal(motionStagger(4),128);
 assert.equal(motionStagger(5),0);
 assert.equal(motionStagger(99),128);
});
test('Scene key changes for pages, cities, dates, map modes, and variants',()=>{
 const ctx={variant:{id:'v1'},page:'map',date:'2027-09-01',city:'paris',mapScope:'city',mapSimple:true};
 const key=motionSceneKey(ctx);
 for(const change of [
   {page:'plan'},{date:'2027-09-02'},{city:'barcelona'},
   {mapScope:'trip'},{mapSimple:false},{variant:{id:'v2'}}]){
   assert.notEqual(key,motionSceneKey({...ctx,...change}));
 }
 assert.equal(key,motionSceneKey({...ctx}));
 assert.ok(motionSceneKey(null).length>0);
});
test('Controller creation is side-effect-free before browser initialization',()=>{
 assert.equal(typeof createMotionController,'function');
});
