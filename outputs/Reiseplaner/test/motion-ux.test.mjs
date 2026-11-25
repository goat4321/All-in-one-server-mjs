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
 assert.ok(listeners.has('load')&&listeners.has('error'));
 assert.equal(listeners.has('pointerdown'),false,'Calm design does not add ripple DOM');
 assert.equal(listeners.has('keydown'),false,'Native focus remains CSS-driven');
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
 assert.equal(handlers.has('pointerdown'),false,
  'Press feedback uses native CSS rather than injected click effects');
});


test('V97 scene motion occurs once per meaningful navigation, not each filter repaint',()=>{
 const observed=[],created=[],listeners=[];
 class Observer{
  constructor(cb){this.cb=cb;created.push(this);}
  observe(n){observed.push(n);this.cb([{isIntersecting:true,target:n}]);}
  unobserve(){}
  disconnect(){}
 }
 const workspace={classList:{add:x=>observed.push(x)}};
 const chapter={style:{setProperty(){}},classList:{add:x=>observed.push(x)}};
 const container={querySelector:q=>q==='main.workspace'?workspace:null,
  querySelectorAll:()=>[chapter]};
 const doc={documentElement:{dataset:{motion:'auto'}},
  defaultView:{matchMedia:()=>({matches:false}),IntersectionObserver:Observer},
  addEventListener:x=>listeners.push(x)};
 const controller=createMotionController(doc);
 const trip={page:'overview',variant:{id:'demo'},city:'paris',date:'2027-09-01'};
 controller.reveal(container,trip);
 assert.equal(observed.filter(x=>x==='motion-scene-enter').length,1);
 assert.equal(observed.filter(x=>x==='motion-revealed').length,1);
 controller.reveal(container,trip);
 assert.equal(observed.filter(x=>x==='motion-scene-enter').length,1,
  'A new filter or saved state must not replay the scene transition');
 controller.reveal(container,{...trip,page:'plan'});
 assert.equal(observed.filter(x=>x==='motion-scene-enter').length,2);
 controller.reveal(container,{...trip,page:'map'});
 assert.equal(observed.filter(x=>x==='motion-scene-enter').length,2,
  'Map navigation cannot animate the entire canvas or map controls');
 assert.deepEqual(listeners.sort(),['error','load']);
});
test('V97 reduced motion never assigns a scene class or creates observers',()=>{
 let calls=0;
 const container={querySelector(){calls++;return null},
  querySelectorAll(){calls++;return []}};
 const doc={documentElement:{dataset:{motion:'auto'}},
  defaultView:{matchMedia:()=>({matches:true}),IntersectionObserver:class{}},
  addEventListener(){}};
 createMotionController(doc).reveal(container,{page:'overview',variant:{id:'demo'}});
 assert.equal(calls,0);
});


test('V98 scroll cards enter once, including new cards after a filter repaint',()=>{
 const observers=[],events=[];
 class FakeIntersectionObserver{
  constructor(callback){this.callback=callback;this.observed=[];observers.push(this);}
  observe(node){this.observed.push(node);}
  unobserve(node){events.push('unobserve:'+node.label);}
  disconnect(){events.push('disconnect');}
  emit(node,intersects=true){this.callback([{isIntersecting:intersects,target:node}]);}
 }
 const node=(label,value)=>({
  label,className:'hub-option-card',dataset:{},
  querySelector(selector){
   return selector==='[data-action][data-value]'?{dataset:{value}}:null;
  },
  style:{setProperty(k,v){events.push(label+':'+k+'='+v);}},
  classList:{add(v){events.push(label+':'+v);}}
 });
 const a=node('a','hotel-a'),b=node('b','hotel-b');
 const a2=node('a2','hotel-a'),c=node('c','hotel-c');
 let cards=[a,b];
 const heading=node('heading','');
 const workspace={classList:{add(v){events.push('workspace:'+v);}}};
 const container={
  querySelector(s){return s==='main.workspace'?workspace:null;},
  querySelectorAll(s){
   return s.startsWith('.editorial-journey-hero')?[heading]:cards;
  }
 };
 const doc={
  documentElement:{dataset:{motion:'auto'}},
  defaultView:{matchMedia:()=>({matches:false}),IntersectionObserver:FakeIntersectionObserver},
  addEventListener(){}
 };
 const ctl=createMotionController(doc);
 const ctx={variant:{id:'test'},page:'lodging',date:'2027-09-01',city:'paris'};
 ctl.reveal(container,ctx);
 assert.equal(observers.length,1);
 assert.equal(observers[0].observed.length,3);
 assert.equal(events.filter(v=>v==='workspace:motion-scene-enter').length,1);
 assert.equal(events.some(v=>v==='b:motion-scroll-revealed'),false,
  'Offscreen items must not animate until the observer reports intersection');
 observers[0].emit(a,true);
 observers[0].emit(b,false);
 assert.ok(events.includes('a:motion-scroll-revealed'));
 assert.ok(!events.includes('b:motion-scroll-revealed'));
 observers[0].emit(b,true);
 cards=[a2,c];
 ctl.reveal(container,ctx);
 assert.equal(observers.length,2);
 assert.deepEqual(observers[1].observed.map(n=>n.label),['c'],
  'Previously visible cards should not replay after filter repaint');
 observers[1].emit(c,true);
 assert.ok(events.includes('c:motion-scroll-revealed'));
 assert.equal(events.filter(v=>v==='workspace:motion-scene-enter').length,1);
 ctl.reveal(container,{...ctx,city:'barcelona'});
 assert.equal(events.filter(v=>v==='workspace:motion-scene-enter').length,2);
});
test('V98 scroll reveals are optional when motion is disabled',()=>{
 let calls=0;
 const doc={
  documentElement:{dataset:{motion:'off'}},
  defaultView:{matchMedia:()=>({matches:false}),IntersectionObserver:class{}},
  addEventListener(){}
 };
 const ctl=createMotionController(doc);
 ctl.reveal({querySelectorAll(){calls++;return[]},querySelector(){calls++;return null}},
  {page:'overview'});
 assert.equal(calls,0);
 assert.equal(ctl.enabled(),false);
});

test('V152 extends bounded motion to rail, budget, group, activity and image galleries without animating map canvas',()=>{
 const selectors=[],observed=[];
 class Observer{
  constructor(){}
  observe(node){observed.push(node)}
  disconnect(){}
 }
 const cards=Array.from({length:120},(_,i)=>({dataset:{placeId:String(i)},className:'rail-card',style:{setProperty(){}},classList:{add(){}}}));
 const doc={documentElement:{dataset:{motion:'auto'}},defaultView:{matchMedia:()=>({matches:false}),IntersectionObserver:Observer},addEventListener(){}};
 const ctl=createMotionController(doc);
 ctl.reveal({querySelector(){return null},querySelectorAll(s){selectors.push(s);return s.startsWith('.editorial-journey-hero')?[]:cards}},{page:'rail'});
 assert.equal(observed.length,42);
 for(const name of ['.activity-filter-panel','.rail-review-panel','.stat-grid','.group-vote-board','.photo114-library','.rail-card','.group-vote-item','.day135-row']){
  assert.ok(selectors.some(s=>s.includes(name)),name);
 }
 assert.ok(selectors.every(s=>!s.includes('#map')&&!s.includes('.leaflet')));
});
