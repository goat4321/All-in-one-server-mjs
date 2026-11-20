import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';
import {loadCatalog} from '../lib/catalog.mjs';
import {explorerData} from '../public/map-explorer.mjs';

const browser=[process.env.REISEPLAN_BROWSER,
 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);
assert.ok(browser,'Chromium needed for actual UI and map parity');
const folder=await mkdtemp(join(tmpdir(),'reise-discovery-'));
const output=process.env.REISEPLAN_DISCOVERY_OUTPUT
  ?resolve(process.env.REISEPLAN_DISCOVERY_OUTPUT):null;
if(output)await mkdir(output,{recursive:true});
const {server,store}=await createApp({database:join(folder,'test.sqlite'),upstream:false});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const catalog=await loadCatalog();
const snapshots=Object.fromEntries(['interrail_classic','interrail_swiss','interrail_august','swiss_lakes']
 .map(id=>[id,JSON.stringify(store.current(id).state)]));
const child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu',
 '--no-first-run','--disable-background-networking','--remote-debugging-port=0',
 '--user-data-dir='+folder,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,label,timeout=22000)=>{
 const end=Date.now()+timeout;while(Date.now()<end){
  try{const result=await fn();if(result)return result;}catch{}
  await delay(70);
 }throw Error('Timeout: '+label);
};
const report={errors:[],screens:[],layouts:[],mapParity:[],originalDataUnchanged:false};
let socket;
try{
 const port=await until(async()=>(await readFile(join(folder,'DevToolsActivePort'),'utf8')).split('\n')[0],'Chrome');
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await once(socket,'open');
 let seq=0;const pending=new Map();
 socket.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.method==='Runtime.exceptionThrown')
   report.errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
  const p=pending.get(m.id);if(!p)return;pending.delete(m.id);
  m.error?p.reject(Error(m.error.message)):p.resolve(m.result);
 });
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const js=async expression=>{
  const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);
  return r.result.value;
 };
 const click=async selector=>{
  await until(()=>js('Boolean(document.querySelector('+JSON.stringify(selector)+'))'),selector);
  await js('document.querySelector('+JSON.stringify(selector)+').click()');
 };
 const change=async(selector,value)=>{
  await js('(()=>{const x=document.querySelector('+JSON.stringify(selector)+');x.focus();x.value='+JSON.stringify(value)+';x.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await delay(120);
 };
 const screenshot=async name=>{
  if(!output)return;
  const image=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(join(output,name),Buffer.from(image.data,'base64'));
  report.screens.push(name);
 };
 const stateEdits=()=>JSON.stringify(store.current('interrail_classic').state.edits);
 const allIds=()=>js('[...document.querySelectorAll(".discovery-grid .discovery-card")].map(x=>x.dataset.discoverId)');
 const openDiscover=()=>click('.sidebar [data-action=page][data-value=discover]');
 await cdp('Runtime.enable');await cdp('Page.enable');
 await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['https://*']});
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?offlineMap&variant=interrail_classic'});
 await until(()=>js('Boolean(document.querySelector("#variant"))'),'Reiseplan loaded');
 await js('localStorage.setItem("reiseplan-guide-completed","1")');
 if(await js('Boolean(document.querySelector("[data-action=guide-close]"))'))
  await click('[data-action=guide-close]');
 await openDiscover();await change('#browse-city','barcelona');
 await until(()=>js('Boolean(document.querySelector(".discovery-grid .discovery-card"))'),'Catalogue');
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const initial=stateEdits();
 for(const group of ['activity','food','shop']){
  await click('[data-action=discover-group][data-value='+group+']');
  const expected=explorerData(trip.items,trip,{city:'barcelona',group,search:''});
  const total=[...expected.placed,...expected.unlocated].filter(item=>item.kind==='activity').length;
  const shown=await js('Number(document.querySelector(".discovery-count strong")?.textContent.match(/\\d+/)?.[0])');
  assert.equal(shown,total,'Browser category count matches actual map selector for '+group);
  assert.ok(await js('([...document.querySelectorAll(".discovery-card")].every(x=>x.dataset.kind==='+JSON.stringify(group)+'))'),
   'Only correct map category appears');
  report.mapParity.push({group,expected:total,shown});
 }
 await click('[data-action=discover-group][data-value=all]');
 const ids=await allIds();assert.ok(ids.length>=5,'At least five distinct real existing POIs');
 const firstName=await js('document.querySelector(".discovery-card h3").textContent');
 await js('(()=>{const x=document.querySelector("#browse-search");x.value='+JSON.stringify(firstName.slice(0,8))+';x.dispatchEvent(new Event("input",{bubbles:true}))})()');
 await until(()=>js('document.querySelector("#browse-search")?.value==='+JSON.stringify(firstName.slice(0,8))
   +'&&document.querySelectorAll(".discovery-card").length>0'
   +'&&[...document.querySelectorAll(".discovery-card h3")].some(x=>x.textContent==='+JSON.stringify(firstName)+')'),
   'Full-text search preserves requested POI and search term');
 await click('[data-action=browse-search-reset]');
 await change('#discover-evidence','point');
 assert.ok(await js('[...document.querySelectorAll(".discovery-card .discovery-essentials > span:nth-child(2)")].every(x=>/Kartenpunkt|Gebietsreferenz/.test(x.textContent))'),
   'Point filter includes recorded points and correctly labelled area centroids only');
 await change('#discover-evidence','all');
 await change('#discover-duration','unknown');
 await until(()=>js('Boolean(document.querySelector(".discovery-count"))'),'Duration facet');
 await change('#discover-duration','all');
 await change('#discover-sort','name');
 await change('#discover-sort','source');
 assert.equal(stateEdits(),initial,'Search, facets and sorting never write itinerary edits');
 await click('.discovery-card .discovery-preview summary');
 assert.equal(await js('document.querySelector(".discovery-card .discovery-preview").open'),true);
 assert.equal(stateEdits(),initial,'Preview never writes itinerary edits');
 await click('.discovery-card .discovery-preview summary');
 const savedSelector='.discovery-card[data-discover-id="'+ids[0]+'"] [data-action=browse-save]';
 await click(savedSelector);
 await until(()=>js('document.querySelector('+JSON.stringify(savedSelector)+')?.textContent.includes("Gemerkt")'),'Bookmark saved');
 await click('[data-action=discover-saved]');
 assert.ok(await js('document.querySelectorAll(".discovery-card").length>0'));
 await click('[data-action=discover-saved]');
 await click(savedSelector);
 await until(()=>js('document.querySelector('+JSON.stringify(savedSelector)+')?.textContent.includes("Merken")'),'Bookmark cleared');
 assert.equal(stateEdits(),initial,'Bookmark does not schedule anything');
 for(let i=0;i<4;i++){
  const selector='.discovery-card[data-discover-id="'+ids[i]+'"] [data-action=compare]';
  await click(selector);
  assert.equal(await js('document.querySelectorAll(".discovery-compare-card").length'),i+1);
 }
 await click('.discovery-card[data-discover-id="'+ids[4]+'"] [data-action=compare]');
 assert.equal(await js('document.querySelectorAll(".discovery-compare-card").length'),4,'Fifth comparison candidate refused');
 assert.equal(stateEdits(),initial,'Compare has no side effects');
 assert.ok(await js('Boolean(document.querySelector(".discovery-comparison [data-different=true]"))'));
 const initialTripScope=Number(await js('document.querySelector(".discovery-count strong").textContent.match(/\\d+/)[0]'));
 await click('[data-action=browse-scope][data-value=trip]');
 assert.ok(Number(await js('document.querySelector(".discovery-count strong").textContent.match(/\\d+/)[0]'))>=initialTripScope);
 await change('#browse-city','paris');
 assert.equal(await js('document.querySelectorAll(".discovery-compare-card").length'),0,'City switch clears stale comparison');
 await change('#browse-city','barcelona');
 await click('[data-action=discover-group][data-value=food]');
 await click('.hub-hero [data-action=browse-map]');
 await until(()=>js('Boolean(document.querySelector("#map"))'),'Actual map opened');
 assert.equal(await js('Boolean(document.querySelector("[data-action=explorer-group][data-value=food][aria-pressed=true]"))'),true,
   'Map reuses the selected category');
 await openDiscover();
 await click('[data-action=discover-group][data-value=all]');
 for(const width of [1440,820,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{
   width,height:width===390?850:1050,deviceScaleFactor:1,mobile:width===390
  });
  await delay(130);
  const layout=await js('(()=>{const c=document.querySelector(".discovery-grid"),r=c.getBoundingClientRect();return{vw:innerWidth,page:document.documentElement.scrollWidth,grid:r.width,cardCount:c.querySelectorAll(".discovery-card").length}})()');
  assert.ok(layout.page<=layout.vw+3,'No horizontal page overflow: '+JSON.stringify(layout));
  assert.ok(layout.grid<=layout.vw+3,'Grid fits: '+JSON.stringify(layout));
  report.layouts.push({width,...layout});
  await js('document.querySelector(".discovery-grid").scrollIntoView({block:"start"})');
  await screenshot('entdecken-liste-'+width+'.png');
  await js('document.querySelector(".discovery-filters").scrollIntoView({block:"start"})');
  await screenshot('entdecken-filter-'+width+'.png');
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 await click('.sidebar [data-action=page][data-value=food]');
 await click('[data-action=browse-food-type][data-value=restaurants]');
 assert.ok(await js('[...document.querySelectorAll(".hub-food-card")].every(x=>x.dataset.kind==="food")'),
   'Food page shares same cards and category logic');
 await change('#discover-evidence','unknownPrice');
 assert.ok(await js('Boolean(document.querySelector(".discovery-count"))'));
 await change('#discover-evidence','all');
 await click('[data-action=browse-food-type][data-value=markets]');
 assert.ok(await js('Boolean(document.querySelector(".hub-market-access"))'),
   'Shop data loading/error affordance present');
 await click('[data-action=browse-food-type][data-value=all]');
 await openDiscover();
 // Only "Zum Tag" may modify planning; tested on a valid city day.
 const planButton=await js('document.querySelector(".discovery-card [data-action=day-quick-add]")?.dataset.value');
 if(planButton){
  await click('.discovery-card [data-action=day-quick-add][data-value="'+planButton+'"]');
  assert.notEqual(stateEdits(),initial,'Explicit Add-to-Day changes the itinerary');
  report.explicitPlanChange=planButton;
  // Restore through app's existing undo; no effect on original catalog.
  const undo=await js('Boolean(document.querySelector("[data-action=undo]"))');
  if(undo){await click('[data-action=undo]');await until(()=>stateEdits()===initial,'Undo changed itinerary');}
 }
 await change('#variant','interrail_swiss');
 await until(()=>js('document.querySelector("#variant")?.value==="interrail_swiss"'),'Variant changed');
 assert.equal(await js('document.querySelectorAll(".discovery-compare-card").length'),0);
 for(const [id,snapshot] of Object.entries(snapshots)){
  if(id==='interrail_classic'&&report.explicitPlanChange)continue;
  assert.equal(JSON.stringify(store.current(id).state),snapshot,'Other trips preserved '+id);
 }
 report.originalDataUnchanged=true;
 assert.deepEqual(report.errors,[],'No uncaught JavaScript browser errors');
 if(output)await writeFile(join(output,'discovery-flows.json'),JSON.stringify(report,null,2));
 console.log('PASS: identical map/catalogue category, search, facets, 4-way compare, 390/820/1440, city/variant, bookmark and explicit day-write');
}finally{
 socket?.close();
 const ended=child.exitCode==null&&child.signalCode==null?once(child,'exit'):Promise.resolve();
 child.kill();await Promise.race([ended,delay(5000)]);
 server.closeAllConnections();await new Promise(r=>server.close(r));
 await rm(folder,{recursive:true,force:true,maxRetries:12,retryDelay:250});
}
