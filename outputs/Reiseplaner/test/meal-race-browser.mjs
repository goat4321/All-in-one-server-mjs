import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {once} from 'node:events';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server.mjs';
const browser=[process.env.REISEPLAN_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);
assert.ok(browser);
const folder=await mkdtemp(join(tmpdir(),'reise-meal-race-'));
const {server,store}=await createApp({database:join(folder,'app.sqlite'),upstream:false});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+folder,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){const end=Date.now()+20000;while(Date.now()<end){try{const v=await fn();if(v)return v}catch{}await delay(50)}throw Error('Timeout: '+label)}
let socket;
try{
 const port=await until(async()=>(await readFile(join(folder,'DevToolsActivePort'),'utf8')).split('\n')[0],'Chrome');
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 let sequence=0;const pending=new Map();
 socket.addEventListener('message',event=>{const r=JSON.parse(event.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.reject(Error(r.error.message)):p.resolve(r.result)});
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const js=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value};
 const click=selector=>js('document.querySelector('+JSON.stringify(selector)+').click()');
 await cdp('Page.enable');await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['https://*']});
 await cdp('Page.navigate',{url:base+'/?offlineMap&variant=interrail_swiss'});
 await until(()=>js('Boolean(document.querySelector("#variant"))'),'App');
 await click('.sidebar [data-action=page][data-value=food]');
 await js('document.querySelector(".hub-food-planning:not([open])>summary")?.click()');
 await click('.meal-slot-tabs [data-value=breakfast]');
 await click('.meal-card [data-value=barcelona-oats]');
 // Let the local server commit breakfast, but hold its response in the browser.
 await js(`(()=>{const original=window.fetch.bind(window);window.__realFetch=original;window.fetch=async(url,options)=>{
   const response=await original(url,options);if(options?.method==='PUT'&&!window.__heldOnce){window.__heldOnce=true;window.__held=true;await new Promise(resolve=>window.__release=resolve)}return response};})()`);
 await click('dialog [type=submit]');
 const first=await until(()=>js('window.__held?"held":document.querySelector("dialog .form-error")?.textContent'),'response held');
 assert.equal(first,'held','A fresh meal dialog must save normally before testing the stale one');
 assert.equal(store.current('interrail_swiss').state.manual.filter(i=>i.mealSlot).length,1);
 await click('dialog [data-action=close]');
 await click('.meal-slot-tabs [data-value=lunch]');
 await click('.meal-card [data-value=barcelona-salad]');
 await js('window.__release();window.fetch=window.__realFetch');
 await until(()=>js('document.querySelector("#toast").textContent.includes("Frühstück eingeplant")'),'first save acknowledged');
 await click('dialog [type=submit]');
 const outcome=await until(()=>js('document.querySelector("dialog").open?document.querySelector("dialog .form-error")?.textContent:"closed"'),'second submit');
 assert.match(outcome,/Plan.*geändert|Planstand|erneut öffnen/,'Stale dialog must be rejected before it replaces the saved breakfast');
 const meals=store.current('interrail_swiss').state.manual.filter(i=>i.mealSlot);
 assert.equal(meals.length,1);assert.equal(meals[0].mealSlot,'breakfast');
 console.log('PASS: held real PUT response cannot let a stale lunch dialog overwrite breakfast');
}finally{
 socket?.close();const exited=child.exitCode===null?once(child,'exit'):Promise.resolve();child.kill();await Promise.race([exited,delay(5000)]);
 await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true,maxRetries:12,retryDelay:250});
}
