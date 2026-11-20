import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';
import {measureFlatContrast} from './browser-flat-contrast.mjs';

const browser=[process.env.REISEPLAN_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);assert.ok(browser);
const folder=await mkdtemp(join(tmpdir(),'reise-stay-'));
const output=process.env.REISEPLAN_STAY_OUTPUT?resolve(process.env.REISEPLAN_STAY_OUTPUT):null;if(output)await mkdir(output,{recursive:true});
const {server,store}=await createApp({database:join(folder,'test.sqlite'),upstream:false});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const snapshots=Object.fromEntries(['interrail_classic','interrail_swiss','interrail_august','swiss_lakes'].map(id=>[id,JSON.stringify(store.current(id).state)]));
const child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+folder,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label,timeout=25000){const end=Date.now()+timeout;while(Date.now()<end){try{const result=await fn();if(result)return result;}catch{}await delay(70);}throw Error('Timeout: '+label);}
const report={errors:[],screens:[],contrast:[],originalDataUnchanged:false};let socket;
try{
 const port=await until(async()=>(await readFile(join(folder,'DevToolsActivePort'),'utf8')).split('\n')[0],'Chrome');
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 let sequence=0,holdWalks=true;const pending=new Map(),heldWalks=[];
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')report.errors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);if(message.method==='Fetch.requestPaused'){if(holdWalks)heldWalks.push(message.params.requestId);else void cdp('Fetch.continueRequest',{requestId:message.params.requestId});}if(!pending.has(message.id))return;const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(Error(message.error.message)):p.resolve(message.result);});
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const js=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const click=async selector=>{await until(()=>js('Boolean(document.querySelector('+JSON.stringify(selector)+'))'),selector);await js('document.querySelector('+JSON.stringify(selector)+').click()');};
 const change=async(selector,value)=>{await js('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');e.focus();e.value='+JSON.stringify(value)+';e.dispatchEvent(new Event("change",{bubbles:true}))})()');await delay(80);if(selector.startsWith('#stay-'))assert.equal(await js('document.activeElement.id'),selector.slice(1),'Changing a facet retains keyboard focus '+JSON.stringify(await js('({open:document.querySelector(".stay-facets").open,active:document.activeElement.tagName,errors:[],visible:document.querySelector('+JSON.stringify(selector)+').checkVisibility()})'))+' '+JSON.stringify(report.errors));};
 const screenshot=async name=>{if(output){const r=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name),Buffer.from(r.data,'base64'));}};
 const count=()=>js('document.querySelectorAll(".stay-compare-card").length');
 const cardCount=()=>js('document.querySelectorAll(".hub-option-card").length');
 const ids=['research:bcom_12814471','research:bcom_386244','research:bcom_576580','research:bcom_11571362','research:bcom_482405'];
 const compare=id=>'.hub-option-card [data-action=compare][data-value="'+id+'"]';
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['https://*']});
 await cdp('Fetch.enable',{patterns:[{urlPattern:'*/api/walk',requestStage:'Request'}]});
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?offlineMap&variant=interrail_swiss'});
 await until(()=>js('Boolean(document.querySelector("#variant"))'),'App');await js('localStorage.setItem("reiseplan-guide-completed","1")');
 if(await js('Boolean(document.querySelector("[data-action=guide-close]"))'))await click('[data-action=guide-close]');
 await click('.sidebar [data-action=page][data-value=lodging]');await change('#browse-city','nice');
 assert.ok(await js('document.querySelector(".hub-hero").getBoundingClientRect().top+scrollY<500'),'Primary lodging controls precede long Swiss research blocks');
 assert.equal(await js('Boolean(document.querySelector(".stay-facets"))'),true,'Combined accommodation filters must be reachable');
 await js('document.querySelector(".stay-facets summary").focus()');
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await until(()=>js('document.querySelector(".stay-facets").open'),'Native Filteröffnung');
 assert.equal(await js('document.querySelector(".stay-facets").open'),true,'Native Enter opens filters');
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 assert.equal(await js('document.activeElement.id'),'stay-kitchen','Native Tab reaches first filter');
 await change('#stay-source','booking');
 await until(()=>heldWalks.length>0,'Angehaltene tatsächliche Bahnhof-Wege');
 await js('window.stayFacetBeforeWalk=document.querySelector("#stay-source")');
 holdWalks=false;await Promise.all(heldWalks.map(requestId=>cdp('Fetch.continueRequest',{requestId})));
 await until(()=>js('document.querySelector("#stay-source")!==window.stayFacetBeforeWalk'),'Neue Darstellung nach Gehwegantwort');
 assert.equal(await js('document.activeElement.id'),'stay-source','Late cached walk answers preserve the active accommodation filter');
 heldWalks.length=0;holdWalks=true;await change('#browse-city','appenzell');
 await until(()=>heldWalks.length>0,'Zweite angehaltene Gehweggruppe');
 await js('(()=>{const input=document.querySelector("#stay-maxNight");input.focus();input.value="32";input.dispatchEvent(new Event("input",{bubbles:true}));window.staySectionBeforeWalk=document.querySelector(".stay-facets")})()');
 holdWalks=false;await Promise.all(heldWalks.map(requestId=>cdp('Fetch.continueRequest',{requestId})));
 await until(()=>js('document.querySelector(".stay-facets")!==window.staySectionBeforeWalk'),'Neue Darstellung während Preiseingabe');
 assert.equal(await js('document.querySelector("#stay-maxNight").value'),'32','An unfinished cap draft survives late walk answers');
 assert.equal(await js('document.activeElement.id'),'stay-maxNight','Unfinished cap keeps keyboard focus');
 await change('#browse-city','barcelona');
 await change('#stay-maxNight','32');
 assert.equal(await cardCount(),1,'Only HeyLola matches the known three-person EUR cap');
 assert.match(await js('document.querySelector(".hub-option-card h3").textContent'),/HeyLola/);
 await change('#stay-kitchen','usable');assert.equal(await cardCount(),0,'Unknown kitchen cannot satisfy combined kitchen criterion');
 assert.match(await js('document.querySelector(".hub-empty").textContent'),/Keine passenden Optionen/);
 await click('.hub-empty [data-action=browse-reset]');assert.ok(await cardCount()>4);
 assert.equal(await js('Boolean(document.querySelector(".stay-list-area"))'),true,
   'Photo-first lodging list replaces dense multi-column tiles');
 assert.ok(await js('document.querySelectorAll(".stay-list-row.hub-option-card").length>4'));
 const firstRow=await js('(()=>{const row=document.querySelector(".stay-list-row"),media=row.querySelector(".stay-list-media");return {title:row.querySelector("h3")?.textContent,mediaHeight:media.getBoundingClientRect().height,mediaWidth:media.getBoundingClientRect().width,buttons:row.querySelectorAll("[data-action]")?.length}})()');
 assert.ok(firstRow.mediaHeight>=190&&firstRow.mediaWidth>=150,
   'Photo or explicit object-photo placeholder has editorial scale');
 assert.equal(await js('document.querySelector(".stay-list-preview").open'),false,'Extra lodging facts are hidden until requested');
 await click('.stay-list-preview summary');
 assert.equal(await js('document.querySelector(".stay-list-preview").open'),true,
   'Quick preview opens without replacing the whole page');
 assert.match(await js('document.querySelector(".stay-list-preview-body").textContent'),/Storno/);
 await click('.stay-list-preview summary');
 assert.equal(await js('document.querySelector("#stay-source").value'),'all');
 for(const value of ['possible','excluded']){await change('#stay-cancellation',value);assert.equal(await cardCount(),0,'Missing tariff evidence cannot match '+value);}
 await click('[data-action=stay-facets-reset]');
 for(let index=0;index<4;index++){
  await click(compare(ids[index]));assert.equal(await count(),index+1);
  if(index===1){assert.match(await js('document.querySelector(".stay-compare-board").textContent'),/285,90/);assert.match(await js('document.querySelector(".stay-compare-board").textContent'),/448,80/);}
 }
 await click(compare(ids[4]));assert.equal(await count(),4,'Fifth option refused');
 assert.ok(await js('document.querySelector(".stay-list-area").compareDocumentPosition(document.querySelector(".stay-compare-board")) & Node.DOCUMENT_POSITION_FOLLOWING'),
   'Accommodation list must lead, comparison follows after the results');
 assert.equal(await js('document.querySelector(".stay-compare-more").open'),false,
   'Less decisive documentation is collapsed by default');
 assert.equal(await js('document.querySelectorAll(".stay-compare-keyfacts > div").length'),24,
   'Six primary decision facts are aligned in each of four comparison columns');
 assert.match(await js('document.querySelector(".stay-compare-board").textContent'),/Nicht bestätigt gebucht/);
 assert.match(await js('document.querySelector(".stay-compare-board").textContent'),/2027-09-03/);
 assert.equal(await js('[...document.querySelectorAll(".stay-compare-board a")].filter(a=>a.textContent.includes("Originalangebot")).length'),4);
 await change('#stay-source','airbnb');assert.equal(await count(),4,'Filter changes retain compared candidates');
 await js('document.querySelector("#browse-search").value="kein-eintrag-123"');await click('[data-action=browse-search-apply]');assert.equal(await cardCount(),0);assert.equal(await count(),4,'Search retains comparison');
 await change('#sort','person-night');assert.equal(await count(),4);
 await click('[data-action=browse-reset]');
 for(const width of [1440,820,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width===390});await delay(150);
  await js('document.querySelector(".stay-list-area").scrollIntoView({block:"start"})');await delay(80);
  const listLayout=await js('(()=>{const row=document.querySelector(".stay-list-row"),media=row.querySelector(".stay-list-media");const r=row.getBoundingClientRect(),m=media.getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,rows:document.querySelectorAll(".stay-list-row").length,mediaHeight:m.height,mediaWidth:m.width,rowLeft:r.left,rowRight:r.right}})()');
  assert.ok(listLayout.overflow<=0&&listLayout.rowLeft>=-2&&listLayout.rowRight<=width+2,
    'Accommodation list fits screen without horizontal overflow: '+JSON.stringify(listLayout));
  assert.ok(listLayout.mediaHeight>=185,'Hotel photo/placeholder must not shrink to an icon');
  await screenshot('unterkunft-fotoliste-'+width+'.png');
  await js('document.querySelector(".stay-facets").scrollIntoView({block:"start"})');await screenshot('unterkunft-filter-'+width+'.png');
  await js('document.querySelector(".stay-compare-board").scrollIntoView({block:"start"})');await delay(80);
  const metrics=await js('(()=>{const board=document.querySelector(".stay-compare-board"),grid=board.querySelector(".stay-compare-grid");return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,cards:board.querySelectorAll(".stay-compare-card").length,columns:getComputedStyle(grid).gridTemplateColumns,controls:[...board.querySelectorAll("button,a")].filter(e=>e.checkVisibility()).map(e=>{const b=e.getBoundingClientRect();return {name:e.textContent.trim(),left:b.left,right:b.right,width:b.width,height:b.height}})}})()');
  assert.ok(metrics.overflow<=0,'No horizontal page overflow');assert.equal(metrics.cards,4);
  assert.ok(metrics.controls.every(c=>c.left>=0&&c.right<=width+1),'Comparison actions remain within viewport');
  if(width===1440)assert.ok(await js('(()=>{const cards=[...document.querySelectorAll(".stay-compare-card")];return cards.every(c=>Math.abs(c.querySelector("dt").getBoundingClientRect().top-cards[0].querySelector("dt").getBoundingClientRect().top)<2)})()'),'Comparison facts align across all four columns');
  await until(()=>js('!document.querySelector("#toast").textContent.trim()'),'Toast ausgeblendet');
  report.screens.push(metrics);await screenshot('unterkunft-vergleich-'+width+'.png');
  const contrast=await js('('+measureFlatContrast.toString()+')(".stay-compare-board,.stay-facets>summary,.stay-facets>p")');
  report.contrast.push({theme:'light',width,...contrast});assert.deepEqual(contrast.failures,[],'Measured flat text contrast in new comparison/filter disclosure');
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await click('[data-action=theme]');
 const dark=await js('('+measureFlatContrast.toString()+')(".stay-compare-board,.stay-facets>summary,.stay-facets>p")');
 report.contrast.push({theme:'dark',width:1440,...dark});assert.deepEqual(dark.failures,[],'Measured dark comparison text contrast');
 await js('document.querySelector(".stay-compare-board").scrollIntoView({block:"start"})');await screenshot('unterkunft-vergleich-dunkel-1440.png');
 await click('[data-action=theme]');
 await click('.stay-compare-card [data-action=compare]');assert.equal(await count(),3);
 await click('.stay-compare-board [data-action=compare-clear]');assert.equal(await count(),0);
 await change('#stay-source','booking');
 await js('(()=>{const e=document.querySelector("#stay-maxNight");e.focus();e.value="17";e.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-action=stay-facets-reset]").scrollIntoView({block:"center"})})()');
 const resetPoint=await js('(()=>{const r=document.querySelector("[data-action=stay-facets-reset]").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()');
 await cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...resetPoint});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...resetPoint});
 await until(()=>js('document.querySelector("#stay-maxNight").value===""&&document.querySelector("#stay-source").value==="all"'),'Echter Reset verwirft unbestätigten Preisentwurf');
 await change('#stay-source','booking');
 await change('#variant','interrail_august');await until(()=>js('document.querySelector("#variant").value==="interrail_august"&&document.querySelector("#stay-source")?.value==="all"'),'Andere Variante');
 assert.equal(await js('document.querySelector("#stay-source").value'),'all','Variant resets view facets');assert.equal(await count(),0);
 await cdp('Page.reload');await until(()=>js('Boolean(document.querySelector("#variant"))'),'Reload');
 for(const [id,snapshot] of Object.entries(snapshots))assert.equal(JSON.stringify(store.current(id).state),snapshot,'Comparison and filters do not change trip state or budget: '+id);
 report.originalDataUnchanged=true;assert.deepEqual(report.errors,[]);
 if(output)await writeFile(join(output,'stay-flows.json'),JSON.stringify(report,null,2));
 console.log('PASS: real 2–4 stay comparison, fifth limit, combined filters/empty/reset, price/source/date/status, native keyboard, search retention, three widths and unchanged four variants');
}finally{
 socket?.close();const exited=child.exitCode==null&&child.signalCode==null?once(child,'exit'):Promise.resolve();child.kill();await Promise.race([exited,delay(5000)]);
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true,maxRetries:12,retryDelay:250});
}
