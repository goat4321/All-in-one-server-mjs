import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {motionEnabled,createMotionController} from '../public/motion-ux.mjs';

const load=name=>readFile(new URL('../public/'+name,import.meta.url),'utf8');
const [html,css,motion]=await Promise.all([
 load('index.html'),load('calm-design-v91.css'),load('motion-ux.mjs')
]);

test('Calm design is the final stylesheet; older page and map overrides stay loaded',()=>{
 const sheets=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(sheets.at(-1),'/calm-design-v91.css');
 assert.ok(sheets.indexOf('/motion-polish.css')<sheets.indexOf('/calm-design-v91.css'));
 assert.ok(sheets.indexOf('/stay-decision.css')<sheets.indexOf('/calm-design-v91.css'));
 assert.ok(sheets.includes('/map-clarity-v72.css'));
 assert.ok(sheets.includes('/browse-hub-v35.css'));
});

test('Light/dark token layers keep readable content and a restrained green accent',()=>{
 for(const token of ['--bg','--paper','--text','--muted','--green','--line',
  '--ref63-elevation','--calm-interaction']){
  assert.ok(css.includes(token+':'),token+' missing');
 }
 assert.match(css,/:root\[data-theme=dark\]/);
 assert.match(css,/--green:#176244/);
 assert.match(css,/--green:#ade6bf/);
 assert.match(css,/font-family:-apple-system,BlinkMacSystemFont/);
 assert.doesNotMatch(css,/@font-face/);
});

test('Visual system reconciles navigation, mobile dock, cards, maps and lodging',()=>{
 for(const component of ['.reference-topbar','.mobile-dock','.reference-map-intro',
  '.reference-map-workspace','.hub-hero','.hub-option-card',
  '.stay-compare-card','.reference-discovery-card','.reference-agenda-select']){
  assert.ok(css.includes(component),component+' should have a shared visual treatment');
 }
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
});

test('Movement is quiet and user-controlled, without 3D parallax or click ripples',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:root\[data-motion=off\]/);
 assert.match(css,/animation:calm-enter 230ms/);
 assert.match(css,/\.motion-ripple\{display:none !important\}/);
 assert.doesNotMatch(css,/(?:perspective\s*:|rotate3d\(|translateZ\()/);
 assert.equal(motionEnabled('off',false),false);
 assert.equal(motionEnabled('auto',true),false);
 assert.match(motion,/slice\(0,12\)/);
 assert.doesNotMatch(motion,/document\.createElement\('span'\)/);
 assert.doesNotMatch(motion,/offsetWidth/);
});

test('Motion controller does not install per-press DOM mutation listeners',()=>{
 const registered=[];
 const doc={documentElement:{dataset:{motion:'auto'}},
  defaultView:{matchMedia:()=>({matches:false})},
  addEventListener:(name)=>registered.push(name)};
 const controller=createMotionController(doc);
 assert.equal(typeof controller.reveal,'function');
 assert.deepEqual(registered.sort(),['error','load']);
});

test('CSS braces stay balanced and do not modify map or data sources',()=>{
 const stack=[];
 for(const c of css){if(c==='{')stack.push(c);if(c==='}')assert.ok(stack.pop());}
 assert.equal(stack.length,0);
 assert.doesNotMatch(css,/(?:https?:\/\/|@import|url\(https?:)/);
});
