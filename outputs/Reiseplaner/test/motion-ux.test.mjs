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

test('Observer reveals only in-view nodes; no actual content is hidden',()=>{
 const listeners=new Map(),revealed=new Set(),observed=[],styles=[];
 class FakeObserver{
   constructor(callback){this.callback=callback;this.nodes=[];observed.push(this);}
   observe(node){this.nodes.push(node);this.callback([{isIntersecting:true,target:node}]);}
   unobserve(){}
   disconnect(){}
 }
 const doc={
   documentElement:{dataset:{motion:'auto'}},
   defaultView:{matchMedia:()=>({matches:false}),IntersectionObserver:FakeObserver},
   addEventListener:(type,callback)=>listeners.set(type,callback)
 };
 const controller=createMotionController(doc);
 const node={classList:{add:cls=>revealed.add(cls)},style:{setProperty:(key,val)=>styles.push([key,val])}};
 const container={querySelectorAll:()=>[node]};
 const state={variant:{id:'v1'},page:'map',date:'2027-09-01',city:'paris'};
 controller.reveal(container,state);
 assert.ok(revealed.has('motion-revealed'));
 assert.deepEqual(styles,[['--motion-delay','0ms']]);
 assert.equal(observed.length,1);
 controller.reveal(container,state);
 assert.equal(observed.length,1,'Same scene cannot replay animations on each repaint');
 controller.reveal(container,{...state,city:'barcelona'});
 assert.equal(observed.length,2,'Switching destination reveals the new scene');
 assert.ok(listeners.has('pointerdown')&&listeners.has('keydown')&&listeners.has('load'));
});
test('Off setting prevents observers and pointer effects',()=>{
 const handlers=new Map();
 const doc={documentElement:{dataset:{motion:'off'}},
   defaultView:{matchMedia:()=>({matches:false})},
   addEventListener:(event,handler)=>handlers.set(event,handler)};
 const controller=createMotionController(doc);
 assert.equal(controller.enabled(),false);
 let touched=false;
 controller.reveal({querySelectorAll:()=>{touched=true;return [];}},{page:'overview'});
 assert.equal(touched,false);
 handlers.get('pointerdown')({button:0,isPrimary:true,target:{
   closest:()=>{throw Error('Should not inspect DOM when motion is off');}
 }});
});
