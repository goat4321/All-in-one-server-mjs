import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';

const browser=[process.env.REISEPLAN_BROWSER,
 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 '/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);
assert.ok(browser,'Chromium is required for actual Swiss 14-day visual review');
const dir=await mkdtemp(join(tmpdir(),'reise-swiss-editorial-'));
const output=process.env.REISEPLAN_SWISS_EDITORIAL_OUTPUT
 ?resolve(process.env.REISEPLAN_SWISS_EDITORIAL_OUTPUT):null;
if(output)await mkdir(output,{recursive:true});
const {server,store}=await createApp({database:join(dir,'trip.sqlite'),upstream:false});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const variantIds=['interrail_classic','interrail_swiss','interrail_august','swiss_lakes'];
const original=Object.fromEntries(variantIds.map(id=>[id,JSON.stringify(store.current(id).state)]));
const chrome=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-background-networking','--remote-debugging-port=0',
 '--user-data-dir='+dir,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async(fn,label,timeout=25000)=>{
 const end=Date.now()+timeout;while(Date.now()<end){try{let v=await fn();if(v)return v;}catch{}await delay(85);}
 throw Error('Timeout: '+label);
};
const report={passedDays:[],viewports:[],screenshots:[],errors:[],planAdoption:false,
 sourceReadOnly:true,originalsUnchanged:false};
let socket;
try{
 const port=await until(async()=>(await readFile(join(dir,'DevToolsActivePort'),'utf8')).split('\n')[0],
  'Chrome debugging port');
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
 await once(socket,'open');
 let seq=0;const pending=new Map();
 socket.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.method==='Runtime.exceptionThrown')
   report.errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
  const wait=pending.get(m.id);if(!wait)return;
  pending.delete(m.id);m.error?wait.reject(Error(m.error.message)):wait.resolve(m.result);
 });
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
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
 const screen=async name=>{
  if(!output)return;
  const r=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(join(output,name),Buffer.from(r.data,'base64'));
  report.screenshots.push(name);
 };
 const setWidth=async width=>{
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:width===390?855:1000,
    deviceScaleFactor:1,mobile:width===390});
  await delay(120);
 };
 const choose=async date=>{
  await click('.days [data-action=day][data-value="'+date+'"]');
  await until(()=>js('document.querySelector(".swiss-editorial-day")?.dataset.editorialDate==='+JSON.stringify(date)),
   'Swiss editorial date '+date);
  const summary=await js('(()=>{const p=document.querySelector(".swiss-editorial-day");return{blocks:p.querySelectorAll(".swiss-editorial-block").length,periods:[...p.querySelectorAll(".swiss-editorial-block")].map(n=>n.dataset.editorialPeriod),sourceLinks:p.querySelectorAll(".swiss-editorial-sources a").length,planButtons:p.querySelectorAll("[data-action=day-plan-add]").length,people:p.querySelector(".swiss-editorial-eyebrow").textContent,notes:p.querySelectorAll(".swiss-editorial-practical article").length}})()');
  assert.equal(summary.blocks,3);
  assert.deepEqual(summary.periods,['morning','noon','evening']);
  assert.equal(summary.notes,3);
  assert.match(summary.people,/3 REISENDE/);
  assert.ok(summary.sourceLinks>=0);
  report.passedDays.push({date,...summary});
  return summary;
 };
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');
 await cdp('Network.setBlockedURLs',{urls:['https://*']});
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await setWidth(1440);
 await cdp('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?offlineMap&variant=interrail_swiss'});
 await until(()=>js('Boolean(document.querySelector("#variant"))'),'Page loads');
 await js('localStorage.setItem("reiseplan-guide-completed","1")');
 if(await js('Boolean(document.querySelector("[data-action=guide-close]"))'))
  await click('[data-action=guide-close]');
 await click('.sidebar [data-action=page][data-value=day]');
 for(const date of ['2027-09-02','2027-09-04','2027-09-10','2027-09-11','2027-09-12','2027-09-13']){
  const summary=await choose(date);
  if(['2027-09-10'].includes(date))
   assert.equal(summary.planButtons,0,'Long transfer day contains no new attraction');
  if(['2027-09-11','2027-09-13'].includes(date))
   assert.ok(summary.planButtons>=2,'Existing hiking activities remain adoptable');
  if(['2027-09-11','2027-09-13'].includes(date))
   assert.ok(summary.sourceLinks>=1,'Official hiking evidence is directly accessible');
  await js('document.querySelector(".swiss-editorial-day").scrollIntoView({block:"start"})');
  await screen('tag-'+date.slice(-2)+'-desktop-1440.png');
 }
 const before=JSON.stringify(store.current('interrail_swiss').state.edits);
 await choose('2027-09-11');
 const add=await js('document.querySelector(".swiss-editorial-day [data-action=day-plan-add]")?.dataset.value');
 assert.ok(add,'At least one existing source-linked activity is adoptable');
 await click('.swiss-editorial-day [data-action=day-plan-add][data-value="'+add+'"]');
 await until(()=>JSON.stringify(store.current('interrail_swiss').state.edits)!==before,
  'Explicit Swiss day adoption persists');
 report.planAdoption=true;
 const undo=await js('Boolean(document.querySelector("[data-action=undo]"))');
 assert.ok(undo,'Undo exists for explicit adoption');
 await click('[data-action=undo]');
 await until(()=>JSON.stringify(store.current('interrail_swiss').state.edits)===before,
  'Undo returns to original plan');
 for(const width of [1440,820,390]){
  await setWidth(width);
  for(const date of ['2027-09-11','2027-09-13']){
   await choose(date);
   const layout=await js('(()=>{const p=document.querySelector(".swiss-editorial-day"),r=p.getBoundingClientRect();return{vw:innerWidth,pageWidth:document.documentElement.scrollWidth,left:r.left,right:r.right,blocks:p.querySelectorAll(".swiss-editorial-block").length}})()');
   assert.ok(layout.pageWidth<=layout.vw+3,'No page overflow '+JSON.stringify(layout));
   assert.ok(layout.left>=-3&&layout.right<=width+3,'Day cards are on-screen '+JSON.stringify(layout));
   report.viewports.push({date,width,...layout});
   await js('document.querySelector(".swiss-editorial-day").scrollIntoView({block:"start"})');
   await screen('tag-'+date.slice(-2)+'-'+width+'.png');
  }
 }
 for(const [id,state] of Object.entries(original))
  assert.equal(JSON.stringify(store.current(id).state),state,'Unchanged trip after undo: '+id);
 report.originalsUnchanged=true;
 assert.deepEqual(report.errors,[],'No uncaught browser errors');
 if(output)await writeFile(join(output,'swiss-editorial-flows.json'),JSON.stringify(report,null,2));
 console.log('PASS: source-backed Swiss editorial, 14 days / 42 phases, days 10–13, Paris Barcelona, 3 widths, explicit adoption & Undo, 4 variants unchanged');
}finally{
 socket?.close();
 const ended=chrome.exitCode==null&&chrome.signalCode==null?once(chrome,'exit'):Promise.resolve();
 chrome.kill();await Promise.race([ended,delay(5000)]);
 server.closeAllConnections();await new Promise(r=>server.close(r));
 await rm(dir,{recursive:true,force:true,maxRetries:12,retryDelay:250});
}
