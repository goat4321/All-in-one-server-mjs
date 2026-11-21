/** V88 lab audit: seeded data and offlineMap; no real user Web Vitals or full WCAG certification. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';

const browser=[process.env.REISEPLAN_BROWSER,'/usr/bin/google-chrome','/usr/bin/chromium',
 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);
assert.ok(browser,'Chrome/Edge fehlt für das reproduzierbare UI-Audit');
const profile=await mkdtemp(join(tmpdir(),'reiseplan-quality-v88-'));
const {server,store}=await createApp({database:join(profile,'quality.sqlite'),upstream:false});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const address=base+'/?offlineMap&variant=interrail_swiss';
const output=process.env.REISEPLAN_QUALITY_OUTPUT??null;
const child=spawn(browser,['--headless=new','--no-sandbox','--remote-debugging-port=0',
 '--disable-background-networking','--disable-extensions','--no-first-run',
 '--disable-gpu','--user-data-dir='+profile,'--window-size=1440,900','about:blank'],
 {windowsHide:true,stdio:['ignore','ignore','pipe']});
let stderr='';
child.stderr.on('data',buf=>{stderr=(stderr+buf.toString()).slice(-1500)});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async(fn,label,ms=14000)=>{
 const limit=Date.now()+ms;
 while(Date.now()<limit){try{const x=await fn();if(x)return x}catch{}await sleep(80)}
 throw new Error('Timeout '+label+' '+stderr);
};
const pageNames=['overview','map','plan','lodging','discover','food','data'];
const rows=[];
let socket;
try{
 const htmlResponse=await fetch(base+'/');
 assert.equal(htmlResponse.status,200);
 const htmlBytes=Buffer.byteLength(await htmlResponse.text(),'utf8');
 const port=await until(async()=>(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0],'CDP Port',30000);
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
 await once(socket,'open');
 const pending=new Map(),exceptions=[];let seq=0;
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params?.exceptionDetails?.text??'Runtime.exceptionThrown');
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}
 });
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const js=async expression=>{
  const value=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(value.exceptionDetails)throw Error(value.exceptionDetails.text);
  return value.result.value;
 };
 await cdp('Runtime.enable');await cdp('Page.enable');
 await cdp('Page.navigate',{url:address});
 await until(()=>js('document.querySelector("h1")?.textContent?.includes("Reiseübersicht")'),'initial overview');
 const clickPage=async id=>{
  const query=JSON.stringify('[data-action="page"][data-value="'+id+'"]');
  await until(()=>js('Boolean(document.querySelector('+query+'))'),'page button '+id);
  return js('(async()=>{const button=document.querySelector('+query+');'+
   'const start=performance.now();button.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));'+
   'return Math.round((performance.now()-start)*10)/10})()');
 };
 const auditExpression='('+async function(){
   const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!el.closest('[hidden],[inert]')};
   const controls=[...document.querySelectorAll('button,a[href],input,select,textarea,summary')].filter(visible);
   const inputs=[...document.querySelectorAll('input,textarea,select')].filter(visible);
   const unlabeled=inputs.filter(el=>el.type!=='hidden'&&!el.labels?.length&&!el.getAttribute('aria-label')
      &&!el.getAttribute('aria-labelledby')&&!el.getAttribute('title')&&!el.closest('label'));
   const unnamed=controls.filter(el=>el.matches('button,a[href],summary')&&!el.textContent?.trim()
      &&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')&&!el.getAttribute('title'));
   const small=controls.filter(el=>{const r=el.getBoundingClientRect();return r.width<24||r.height<24});
   const media=[...document.querySelectorAll('img')];
   const failed=media.filter(i=>i.complete&&!i.naturalWidth&&i.getAttribute('src'));
   const started=performance.now();window.scrollTo(0,Math.min(document.body.scrollHeight,800));
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const nav=performance.getEntriesByType('navigation')[0];
   const form=document.querySelector('.hub-search-form'),
    submit=form?.querySelector('[data-action="browse-search-apply"]');
   const a=form?.getBoundingClientRect(),b=submit?.getBoundingClientRect();
   const searchButtonClipPx=a&&b?Math.round(Math.max(0,b.right-Math.min(a.right,innerWidth),
     Math.max(a.left,0)-b.left)*10)/10:null;
   // Token contrast is exact for these known solid colors; component-level
   // gradients/photos and all text combinations need separate visual review.
   const root=getComputedStyle(document.documentElement);
   const rgb=variable=>{
     const s=root.getPropertyValue(variable).trim();
     const match=/^#([0-9a-f]{6})$/i.exec(s);
     if(!match)return null;
     return [0,2,4].map(n=>parseInt(match[1].slice(n,n+2),16)/255);
   };
   const lumi=rgb=>rgb.map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4)
     .reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
   const contrast=(a,b)=>a&&b?Math.round(((Math.max(lumi(a),lumi(b))+0.05)/
      (Math.min(lumi(a),lumi(b))+0.05))*100)/100:null;
   const tokenContrast={
     textOnPaper:contrast(rgb('--text'),rgb('--paper')),
     mutedOnPaper:contrast(rgb('--muted'),rgb('--paper')),
     greenOnPaper:contrast(rgb('--green'),rgb('--paper'))
   };
   const probe=document.createElement('div');
   probe.style.animation='v88-probe 20s linear infinite';
   document.body.appendChild(probe);
   const motionProbeSeconds=parseFloat(getComputedStyle(probe).animationDuration);
   probe.remove();
   return {
    dom:document.getElementsByTagName('*').length,controls:controls.length,
    mapRenderedCards:document.querySelectorAll('.explorer-place').length,
    lodgingRenderedCards:document.querySelectorAll('.hub-option-card[data-kind="lodging"]').length,
    lodgingSwissResearchLoaded:document.querySelector('.stay-swiss-research')?.dataset.contentLoaded??null,
    lodgingSourceResearchLoaded:document.querySelector('.hub-technical-details')?.dataset.contentLoaded??null,
    unlabeled:unlabeled.map(el=>el.outerHTML.slice(0,130)).slice(0,8),
    unnamed:unnamed.map(el=>el.outerHTML.slice(0,130)).slice(0,8),
    smallTargetCount:small.length,smallTargets:small.map(el=>({
      tag:el.tagName,name:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,46)
    })).slice(0,10),
    images:media.length,lazyImages:media.filter(i=>i.loading==='lazy').length,failedOfflineImages:failed.length,
    horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
    mainWidth:Math.round(document.querySelector('main')?.getBoundingClientRect().width??0),
    searchButtonClipPx,
    navDomInteractiveMs:Math.round(nav?.domInteractive??0),navLoadMs:Math.round(nav?.loadEventEnd??0),
    scrollFrameMs:Math.round((performance.now()-started)*10)/10,
    reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,
    motionDataset:document.documentElement.dataset.motion,
    tokenContrast,motionProbeSeconds
   };
 }.toString()+')()';
 for(const width of [1440,768,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
  for(const page of pageNames){
   const renderMs=await clickPage(page);
   for(const [theme,reduce] of [['light',false],['dark',false],['light',true]]){
    await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduce?'reduce':'no-preference'}]});
    await js('document.documentElement.dataset.theme='+JSON.stringify(theme));
    const snapshot=await js(auditExpression);
    rows.push({page,width,theme,reduce,renderMs,htmlBytes,errors:exceptions.length,...snapshot});
    if(output&&theme==='light'&&!reduce){
     await mkdir(output,{recursive:true});
     await js('window.scrollTo(0,0)');
     await sleep(110);
     const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
     await writeFile(join(output,'v88-'+page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
    }
   }
  }
 }
 // Separate keyboard-only focus sample and an actual browse-search update.
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await clickPage('overview');
 const focusSequence=[];
 for(let n=0;n<8;n++){
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  focusSequence.push(await js('(()=>{const e=document.activeElement,r=e?.getBoundingClientRect();return {'+
    'tag:e?.tagName,name:(e?.getAttribute("aria-label")||e?.textContent||"").trim().slice(0,55),'+
    'visible:Boolean(r&&r.width>0&&r.height>0),outline:getComputedStyle(e).outlineStyle}})()'));
 }
 await clickPage('discover');
 const filterSample=await js('('+async function(){
  const input=document.querySelector('#browse-search');
  const button=document.querySelector('[data-action="browse-search-apply"]');
  if(!input||!button)return {available:false};
  input.value='Museum';const start=performance.now();button.click();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  return {available:true,frameMs:Math.round((performance.now()-start)*10)/10,
   countLabel:document.querySelector('.hub-filter-count')?.textContent?.trim().slice(0,100)??''};
 }.toString()+')()');
 // V89: the calm map's initial dataset is NOT truncated; only the DOM list is
 // progressive. A user may fetch additional matches without switching modes.
 await clickPage('map');
 const firstCardCount=await js('document.querySelectorAll(".explorer-place").length');
 assert.ok(firstCardCount<=12&&firstCardCount>0,
  'Calm map must render at most the first 12 researched places');
 const totalBefore=await js('Number((document.querySelector(".explorer-list")?.textContent??"").match(/(\\d+) passende Einträge/)?.[1]??0)');
 assert.ok(totalBefore>=firstCardCount);
 if(totalBefore>firstCardCount){
  const label=await js('document.querySelector("[data-action=explorer-more]")?.textContent');
  assert.match(label??'',/Weitere 12 anzeigen/);
  await js('document.querySelector("[data-action=explorer-more]").click()');
  await until(()=>js('document.querySelectorAll(".explorer-place").length>12'),
    'Progressive explorer exposes next batch');
  const second=await js('document.querySelectorAll(".explorer-place").length');
  assert.ok(second<=24,'First expansion reveals at most 24 cards');
  assert.equal(await js('Number((document.querySelector(".explorer-list")?.textContent??"").match(/(\\d+) passende Einträge/)?.[1]??0)'),totalBefore,
    'Expanding the list does not change total results or variant');
  // A user selecting a marker beyond the first dozen must be able to jump
  // back into the list without changing map scope, route or saved data.
  const targetId=await js('document.querySelectorAll(".explorer-place")['+(second-1)+']?.dataset.placeId');
  await js('document.querySelector(".explorer-categories [data-action=explorer-group][data-value=all]")?.click()');
  await until(()=>js('document.querySelectorAll(".explorer-place").length<=12'),
    'Calm list resets to first page');
  if(targetId){
   await js('(()=>{const b=document.createElement("button");b.dataset.action="explorer-list-focus";'+
     'b.dataset.value='+JSON.stringify(targetId)+';document.querySelector("#app").append(b);'+
     'b.click();b.remove()})()');
   await until(()=>js('[...document.querySelectorAll(".explorer-place")].some(el=>el.dataset.placeId==='+JSON.stringify(targetId)+')'),
     'Selected marker past the first page is reachable in explorer list');
  }
 }
 // V90: inspect actual real-browser accommodation controls, not merely the
 // data/model state. All cards, filters, 2–4 compares and disclosures remain
 // reachable despite an initial 8-card rendering budget.
 await clickPage('lodging');
 // The preceding discovery-filter probe intentionally left "Museum" active.
 // The app correctly carries search text between pages; clear it through
 // the actual UI before measuring the unfiltered lodging baseline.
 if(await js('Boolean(document.querySelector("[data-action=browse-search-reset]"))')){
   await js('document.querySelector("[data-action=browse-search-reset]").click()');
   await until(()=>js('document.querySelectorAll(".hub-option-card[data-kind=lodging]").length>0'),
     'Clearing prior discovery search restores lodging matches');
 }
 const originalExpenses=JSON.stringify(store.current('interrail_swiss').state.expenses);
 const stayStart=await js('document.querySelectorAll(".hub-option-card[data-kind=lodging]").length');
 assert.ok(stayStart>0&&stayStart<=8,'Stay page initially mounts no more than eight cards');
 assert.equal(await js('document.querySelector(".stay-swiss-research")?.dataset.contentLoaded'),'false');
 assert.equal(await js('document.querySelector(".hub-technical-details")?.dataset.contentLoaded'),'false');
 assert.ok(await js('Boolean(document.querySelector(".hub-results-title"))'));
 const stayMore=await js('Boolean(document.querySelector(".hub-more-button [data-action=browse-more]"))');
 if(stayMore){
   const beforeMore=stayStart;
   await js('document.querySelector(".hub-more-button [data-action=browse-more]").click()');
   await until(()=>js('document.querySelectorAll(".hub-option-card[data-kind=lodging]").length>'+beforeMore),
     'Next eight stays available without changing selected variant');
   assert.ok(await js('document.querySelectorAll(".hub-option-card[data-kind=lodging]").length<=16'));
 }
 const selected=await js('[...document.querySelectorAll(".hub-option-card[data-kind=lodging] [data-action=compare]")].slice(0,2).map(b=>b.dataset.value)');
 assert.equal(selected.length,2,'At least two stays available for comparison');
 for(const id of selected){
   await js('(()=>{const b=[...document.querySelectorAll("[data-action=compare]")].find(x=>x.dataset.value==='+JSON.stringify(id)+');b?.click()})()');
 }
 await until(()=>js('document.querySelectorAll(".hub-compare-summary").length===1'),
   'Comparison remains available above progressive listing');
 assert.ok(await js('document.querySelector(".hub-compare-summary")?.textContent.includes("Vergleich")'));
 await js('document.querySelector(".stay-swiss-research > summary")?.click()');
 await until(()=>js('document.querySelector(".stay-swiss-research")?.dataset.contentLoaded==="true"'),
   'Swiss 2027 historical research loads only when expanded');
 assert.ok(await js('document.querySelector(".stay-swiss-research")?.open'));
 await js('document.querySelector(".hub-technical-details > summary")?.click()');
 await until(()=>js('document.querySelector(".hub-technical-details")?.dataset.contentLoaded==="true"'),
   'Source and group comparison loads only after explicitly opened');
 assert.ok(await js('document.querySelector(".hub-technical-details")?.open'));
 assert.equal(JSON.stringify(store.current('interrail_swiss').state.expenses),originalExpenses,
   'Disclosure and compare must never create a budget entry');
 const lodgingProbe={startCards:stayStart,
   afterExpansion:await js('document.querySelectorAll(".hub-option-card[data-kind=lodging]").length'),
   comparisonSelected:selected,
   swissOpened:await js('document.querySelector(".stay-swiss-research")?.dataset.contentLoaded'),
   sourceOpened:await js('document.querySelector(".hub-technical-details")?.dataset.contentLoaded')};
 if(output){
   await js('document.querySelector(".hub-compare-summary")?.scrollIntoView({block:"start",behavior:"instant"})');
   const image=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
   await writeFile(join(output,'v90-lodging-compare-390.png'),Buffer.from(image.data,'base64'));
 }
 console.log('V90_LODGING_INTERACTION '+JSON.stringify(lodgingProbe));
 const result={environment:'headless Chrome, isolated seeded SQLite and offlineMap, 14-day interrail_swiss',
  measuredAt:new Date().toISOString(),htmlBytes,variants:store.list().length,
  rows,exceptions,focusSequence,filterSample,limits:'Synthetic lab snapshots, not field Core Web Vitals or WCAG certification'};
 if(output)await writeFile(join(output,'quality-v88-lab.json'),JSON.stringify(result,null,2));
 console.log('V88_AUDIT_SUMMARY '+JSON.stringify({htmlBytes,rows:rows.length,
  domMin:Math.min(...rows.map(x=>x.dom)),domMax:Math.max(...rows.map(x=>x.dom)),
  maxOverflow:Math.max(...rows.map(x=>x.horizontalOverflow)),
  unlabeledByPage:[...new Set(rows.filter(x=>x.unlabeled.length).map(x=>x.page))],
  smallTargetsMax:Math.max(...rows.map(x=>x.smallTargetCount)),
  maxRenderMs:Math.max(...rows.map(x=>x.renderMs)),exceptions:exceptions.length}));
 for(const row of rows.filter(r=>r.width===390&&r.theme==='light'&&!r.reduce))
   console.log('V88_PAGE '+JSON.stringify(row));
 assert.equal(store.list().length,4);
 assert.equal(exceptions.length,0,'Runtime exceptions during audit');
 assert.ok(rows.filter(row=>row.width===390&&['lodging','discover','food'].includes(row.page))
   .every(row=>row.searchButtonClipPx===null||row.searchButtonClipPx<=1),
   'Search action must remain inside its toolbar at 390px in food, lodging and discover');
 assert.ok(rows.filter(row=>row.reduce).every(row=>row.motionProbeSeconds<0.001),
  'Computed reduced-motion stylesheet must effectively suppress long animations');
 console.log('PASS V88 lab snapshots: seven pages × three widths × light/dark/reduced-motion');
}finally{
 socket?.close();
 const exited=child.exitCode==null&&child.signalCode==null?once(child,'exit'):Promise.resolve();
 child.kill();await Promise.race([exited,sleep(5000)]);
 await new Promise(resolve=>server.close(resolve));
 await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});
}
