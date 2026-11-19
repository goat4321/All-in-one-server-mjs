import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import {createApp} from '../server.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/barcelona-foot-route.json',import.meta.url),'utf8'));
const pairKey=points=>points.map(point=>point.map(value=>Number(value).toFixed(5)).join(',')).join(';');
const pairs=fixture.stops.slice(1).map((stop,index)=>pairKey([fixture.stops[index].point,stop.point]));
const browser=[process.env.REISEPLAN_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);assert.ok(browser);
const folder=await mkdtemp(join(tmpdir(),'reise-route-race-'));
const {server,store}=await createApp({database:join(folder,'test.sqlite'),upstream:false});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address='http://127.0.0.1:'+server.address().port+'/?offlineMap&variant=interrail_swiss';
const child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+folder,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){const end=Date.now()+15000;while(Date.now()<end){try{const value=await fn();if(value)return value;}catch{}await delay(60);}throw Error('Timeout: '+label);}
let socket;
try{
 const port=await until(async()=>(await readFile(join(folder,'DevToolsActivePort'),'utf8')).split('\n')[0],'Chrome');
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 const pending=new Map(),held=[],errors=[];let sequence=0,armed=false;
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  if(message.method==='Fetch.requestPaused'){
   const body=JSON.parse(message.params.request.postData??'{}');
   if(armed&&Array.isArray(body.points)&&pairs.includes(pairKey(body.points)))held.push(message.params);
   else void cdp('Fetch.continueRequest',{requestId:message.params.requestId});
  }
  if(!pending.has(message.id))return;const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);
 });
 const js=async expression=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;};
 const click=async selector=>{await until(()=>js('Boolean(document.querySelector('+JSON.stringify(selector)+'))'),selector);await js('document.querySelector('+JSON.stringify(selector)+').click()');};
 const addStops=async count=>{
  await js('document.querySelector(".reference-places-drawer").open=true');
  for(const stop of fixture.stops.slice(0,count)){
   await js('document.querySelector("#map-search").value='+JSON.stringify(stop.name));await click('[data-action=explorer-search]');
   await click('[data-action=day-route-add][data-value="'+stop.id+'"]');
  }
 };
 const release=async paused=>{
  const index=pairs.indexOf(pairKey(JSON.parse(paused.request.postData).points));assert.ok(index>=0);
  const leg=fixture.response.routes[0].legs[index],points=leg.steps.flatMap(step=>step.geometry.coordinates).map(([lon,lat])=>[lat,lon]);
  await cdp('Fetch.fulfillRequest',{requestId:paused.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],
   body:Buffer.from(JSON.stringify({walkOnly:true,points,minutes:Math.max(1,Math.ceil(leg.duration/60)),metres:Math.round(leg.distance),source:'Recorded FOSSGIS observation',checked:fixture.observedOn})).toString('base64')});
  await js('new Promise(resolve=>setTimeout(resolve,250))');
 };
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['https://*']});
 await cdp('Fetch.enable',{patterns:[{urlPattern:'*/api/walk',requestStage:'Request'}]});
 await cdp('Page.navigate',{url:address});await until(()=>js('Boolean(document.querySelector("#variant"))'),'Anwendung');
 await click('.sidebar [data-action=city][data-value=barcelona]');await click('.sidebar [data-action=page][data-value=map]');
 await addStops(2);
 assert.equal(await js('document.querySelectorAll(".route-studio-stop").length'),2);
 const before=JSON.stringify(store.current('interrail_swiss').state);
 armed=true;await click('[data-action=day-route-check]');await until(()=>held.length===1,'Gehaltene echte Browseranfrage');
 await click('[data-action=day-route-clear]');
 await release(held[0]);
 assert.equal(await js('document.querySelectorAll(".route-studio-stop").length'),0);
 assert.equal(await js('document.querySelector(".day-route-builder").textContent.includes("Alle Fußwegstrecken berechnet")'),false,'A cleared route must not be marked computed by a late response');
 await addStops(2);await click('[data-action=day-route-check]');await until(()=>held.length===2,'Berechnung vor Umordnen');
 await click('[data-action=day-route-up][data-value="'+fixture.stops[1].id+'"]');await release(held[1]);
 assert.equal(await js('document.querySelectorAll(".route-studio-map-line:not(.schematic)").length'),0);
 assert.equal(await js('document.querySelector(".day-route-builder").textContent.includes("Alle Fußwegstrecken berechnet")'),false);
 await click('[data-action=day-route-clear]');await addStops(2);
 await click('[data-action=day-route-check]');await until(()=>held.length===3,'Ältere Generation');
 await click('[data-action=day-route-check]');await until(()=>held.length===4,'Neuere Generation');
 await release(held[3]);await until(()=>js('Boolean(document.querySelector("[data-action=day-route-commit]"))'),'Neuere Antwort angenommen');
 await release(held[2]);
 assert.equal(await js('Boolean(document.querySelector("[data-action=day-route-commit]"))'),true,'Old response cannot append a duplicate leg or revoke the newer result');
 await click('[data-action=day-route-clear]');await addStops(3);
 await click('[data-action=day-route-check]');await until(()=>held.length===5,'Gehaltene zweite Etappe');
 await js('document.querySelector("#variant").value="interrail_classic";document.querySelector("#variant").dispatchEvent(new Event("change",{bubbles:true}))');
 await until(()=>js('document.querySelector("#app").dataset.variantId==="interrail_classic"'),'Variantenwechsel');
 await release(held[4]);assert.equal(await js('document.querySelectorAll(".route-studio-stop").length'),0);
 assert.equal(await js('document.querySelector(".day-route-builder").textContent.includes("Alle Fußwegstrecken berechnet")'),false);
 await js('document.querySelector("#variant").value="interrail_swiss";document.querySelector("#variant").dispatchEvent(new Event("change",{bubbles:true}))');
 await until(()=>js('document.querySelector("#app").dataset.variantId==="interrail_swiss"'),'Hauptvariante zurück');
 await click('.sidebar [data-action=city][data-value=barcelona]');await addStops(3);
 await click('[data-action=day-route-check]');await until(()=>held.length===6,'Berechnung vor Datumswechsel');
 await click('.reference-stage-days [data-action=explorer-scope][data-value=day]');
 await click('.reference-day-steps button:last-child');
 await release(held[5]);assert.equal(await js('document.querySelectorAll(".route-studio-stop").length'),0);
 assert.equal(await js('document.querySelector(".day-route-builder").textContent.includes("Alle Fußwegstrecken berechnet")'),false);
 assert.equal(JSON.stringify(store.current('interrail_swiss').state),before);
 assert.deepEqual(errors,[]);console.log('PASS: held walking responses respect clear, reorder, newer generations, variant and date changes');
}finally{
 socket?.close();const exited=child.exitCode==null&&child.signalCode==null?once(child,'exit'):Promise.resolve();child.kill();await Promise.race([exited,delay(5000)]);
 await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true,maxRetries:12,retryDelay:250});
}
