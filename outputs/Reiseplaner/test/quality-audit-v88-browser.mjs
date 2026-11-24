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
   const srSearchLabel=document.querySelector('.hub-search-form .sr-only');
   const searchLabelVisuallyHidden=srSearchLabel
     ?getComputedStyle(srSearchLabel).position==='absolute'
       &&srSearchLabel.getBoundingClientRect().width<=1.5
       &&srSearchLabel.textContent.includes('Angebote durchsuchen')
     :null;
   // V91: inspect the real final cascade in every 390/768/1440 light/dark/motion snapshot.
   const calmStyleLoaded=[...document.styleSheets].some(sheet=>
     sheet.href?.endsWith('/calm-design-v91.css'));
   const v94StyleLoaded=[...document.styleSheets].some(sheet=>
     sheet.href?.endsWith('/apple-visual-system-v94.css'));
   const v95StyleLoaded=[...document.styleSheets].some(sheet=>
     sheet.href?.endsWith('/editorial-web-v95.css'));
   const v95HomepageHero=document.querySelector('.editorial-journey-hero');
   const v95HomepageHeroHeight=v95HomepageHero?.getBoundingClientRect().height??null;
   const v95BrowseHero=document.querySelector('.hub-hero');
   const v95BrowseHeroHeight=v95BrowseHero?.getBoundingClientRect().height??null;
   const v962BrowseHeroMode=v95BrowseHero?.dataset.photo??null;
   const v961ResearchNotice=document.querySelector('.source-notice[data-research-status=incomplete]');
   const v961ResearchNoticeHeight=v961ResearchNotice?.getBoundingClientRect().height??null;
   const v96HeroCredit=document.querySelector('.hub-hero-photo-credit');
   const v96CreditRect=v96HeroCredit?.getBoundingClientRect();
   const v96TitleRect=document.querySelector('.hub-hero h1')?.getBoundingClientRect();
   const v96HeroCreditHeight=v96CreditRect?.height??null;
   const v96HeroCreditOverlap=Boolean(v96CreditRect&&v96TitleRect
     &&v96CreditRect.left<v96TitleRect.right&&v96CreditRect.right>v96TitleRect.left
     &&v96CreditRect.top<v96TitleRect.bottom&&v96CreditRect.bottom>v96TitleRect.top);
   const v96DayCreditRect=document.querySelector('.day-editorial-credit')?.getBoundingClientRect();
   const v96DayMetaRect=document.querySelector('.day-editorial-hero .hero-meta')?.getBoundingClientRect();
   const v96DayCreditOverlap=Boolean(v96DayCreditRect&&v96DayMetaRect
     &&v96DayCreditRect.left<v96DayMetaRect.right&&v96DayCreditRect.right>v96DayMetaRect.left
     &&v96DayCreditRect.top<v96DayMetaRect.bottom&&v96DayCreditRect.bottom>v96DayMetaRect.top);
   // V96: measure real foreground/background pairs rather than merely checking
   // if a CSS rule exists. The dark browse secondary button was white-on-white.
   const v96Contrast=selector=>{
     const el=document.querySelector(selector);
     if(!el)return null;
     const style=getComputedStyle(el);
     const rgb=value=>(value.match(/[0-9.]+/g)??[]).slice(0,3).map(Number);
     const luminance=value=>{
       const a=rgb(value).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});
       return .2126*(a[0]??0)+.7152*(a[1]??0)+.0722*(a[2]??0);
     };
     const fg=luminance(style.color),bg=luminance(style.backgroundColor);
     return Math.round((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)*100)/100;
   };
   const v96SecondaryActionContrast=v96Contrast('.hub-hero-actions .button:not(.primary)');
   const v96ScopeActiveContrast=v96Contrast('.hub-toolbar .hub-scope button[aria-pressed=true]');
   const v96FoodActiveContrast=v96Contrast('.hub-food-tabs button[aria-pressed=true]');
   const v94Primary=document.querySelector('.reference-travel-shell .button.primary');
   const v94PrimaryTouch=v94Primary?.getBoundingClientRect().height??null;
   const v94HeroTitle=document.querySelector('.hub-hero h1');
   const v94HeroTitleColor=v94HeroTitle?getComputedStyle(v94HeroTitle).color:null;
   const v94QuickTitle=document.querySelector('.day-plan-quick-heading strong');
   const v94QuickTitleColor=v94QuickTitle?getComputedStyle(v94QuickTitle).color:null;
   const v94OverviewStart=document.querySelector('.overview-start');
   const v94OverviewStartBg=v94OverviewStart?getComputedStyle(v94OverviewStart).backgroundColor:null;
   const v94FoodSearchFirst=(()=>{const bar=document.querySelector('.hub-toolbar'),
      market=document.querySelector('#market-price-research');
      return bar&&market?bar.getBoundingClientRect().top<market.getBoundingClientRect().top:null})();
   const v94Panel=document.querySelector('.reference-travel-shell .panel');
   const v94PanelRadius=v94Panel?getComputedStyle(v94Panel).borderTopLeftRadius:null;
   const calmTopbar=document.querySelector('.reference-topbar');
   const calmTopbarBg=calmTopbar?getComputedStyle(calmTopbar).backgroundColor:null;
   const calmRevealedNodes=document.querySelectorAll('#app .motion-revealed').length;
   const calmRevealNode=document.querySelector('#app .motion-revealed');
   const calmRevealDuration=calmRevealNode
     ?parseFloat(getComputedStyle(calmRevealNode).animationDuration):null;
   const v98ScrollRevealCount=document.querySelectorAll('#app .motion-scroll-revealed').length;
   const v98ScrollRevealNode=document.querySelector('#app .motion-scroll-revealed');
   const v98ScrollRevealDuration=v98ScrollRevealNode
     ?parseFloat(getComputedStyle(v98ScrollRevealNode).animationDuration):null;
   const v98ScrollRevealName=v98ScrollRevealNode
     ?getComputedStyle(v98ScrollRevealNode).animationName:null;
   const v97SceneNode=document.querySelector('main.workspace.motion-scene-enter');
   const v97SceneDuration=v97SceneNode
     ?parseFloat(getComputedStyle(v97SceneNode).animationDuration):null;
   const v97SceneName=v97SceneNode
     ?getComputedStyle(v97SceneNode).animationName:null;
   const calmNavButton=document.querySelector('.reference-main-nav button');
   const calmNavTransition=calmNavButton
     ?getComputedStyle(calmNavButton).transitionProperty:null;
   const calmInactiveNavText=document.querySelector('.reference-main-nav button[aria-current="false"] span');
   const calmInactiveNavColor=calmInactiveNavText?getComputedStyle(calmInactiveNavText).color:null;
   const calmSearchBg=document.querySelector('.reference-global-search')
     ?getComputedStyle(document.querySelector('.reference-global-search')).backgroundColor:null;
   const calmSearchProbe=(()=>{const el=document.querySelector('.reference-global-search');
     if(!el)return null;
     return {rootTheme:document.documentElement.dataset.theme,
       match:el.matches(':root[data-theme=dark] .reference-global-search'),
       withinShell:Boolean(el.closest('.reference-travel-shell')),
       inlineStyle:el.getAttribute('style'),
       ruleCount:[...document.styleSheets].filter(s=>s.href?.includes('calm-design-v91')).reduce((n,s)=>{try{return n+s.cssRules.length}catch{return n}},0),
       variable:getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
       transition:getComputedStyle(el).transitionDuration,
       elementPaper:getComputedStyle(el).getPropertyValue('--paper').trim(),
       appliedRules:[...document.styleSheets].flatMap(sheet=>{
         const found=[];const walk=rules=>{for(const rule of rules){
           if(rule.selectorText&&rule.selectorText.includes('reference-global-search')){
             try{if(el.matches(rule.selectorText)&&
               (rule.style?.getPropertyValue('background')||rule.style?.getPropertyValue('background-color')))
               found.push({source:sheet.href?.split('/').pop()||'inline',
                 selector:rule.selectorText.slice(0,180),
                 bg:rule.style.getPropertyValue('background'),
                 bgColor:rule.style.getPropertyValue('background-color'),
                 priority:rule.style.getPropertyPriority('background')||
                   rule.style.getPropertyPriority('background-color')});}catch{}
           }
           if(rule.cssRules)walk(rule.cssRules);
         }};
         try{walk(sheet.cssRules)}catch{}
         return found;
       }).slice(-20)};})();
   const calmTopAction=document.querySelector('.reference-topbar>.top-actions .icon-btn');
   const calmTopActionBg=calmTopAction?getComputedStyle(calmTopAction).backgroundColor:null;
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
    v94MapCountBroken:/undefined (?:Kartenpunkte|Ortsangaben ohne Pin)/.test(document.querySelector('.reference-map-workspace')?.textContent??''),
    searchButtonClipPx,searchLabelVisuallyHidden,
    calmStyleLoaded,v94StyleLoaded,v95StyleLoaded,v95HomepageHeroHeight,v95BrowseHeroHeight,v962BrowseHeroMode,v961ResearchNoticeHeight,v96HeroCreditHeight,v96HeroCreditOverlap,v96DayCreditOverlap,v96SecondaryActionContrast,v96ScopeActiveContrast,v96FoodActiveContrast,v94PrimaryTouch,v94HeroTitleColor,v94QuickTitleColor,v94OverviewStartBg,v94FoodSearchFirst,v94PanelRadius,calmTopbarBg,calmRevealedNodes,calmRevealDuration,v98ScrollRevealCount,v98ScrollRevealDuration,v98ScrollRevealName,v97SceneDuration,v97SceneName,calmNavTransition,
    calmInactiveNavColor,calmSearchBg,calmSearchProbe,calmTopActionBg,
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
   // V97: reset the previous page's reduced-motion emulation BEFORE
   // navigation. Otherwise the last reduced-motion snapshot suppresses every
   // new scene entrance, making the default-motion audit a false negative.
   await cdp('Emulation.setEmulatedMedia',{features:[
     {name:'prefers-reduced-motion',value:'no-preference'}
   ]});
   const renderMs=await clickPage(page);
   for(const [theme,reduce] of [['light',false],['dark',false],['light',true]]){
    await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduce?'reduce':'no-preference'}]});
    await js('document.documentElement.dataset.theme='+JSON.stringify(theme));
    // The design intentionally transitions text color for 190ms. Audit its
    // settled contrast rather than a transient frame after theme switching.
    await sleep(260);
    const snapshot=await js(auditExpression);
    rows.push({page,width,theme,reduce,renderMs,htmlBytes,errors:exceptions.length,...snapshot});
    if(output&&!reduce&&(theme==='light'||(theme==='dark'&&(width===390||width===1440)))){
     await mkdir(output,{recursive:true});
     await js('window.scrollTo(0,0)');
     await sleep(110);
     const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
     await writeFile(join(output,'v88-'+page+'-'+width+(theme==='dark'?'-dark':'')+'.png'),Buffer.from(shot.data,'base64'));
    }
   }
  }
 }
 // V98: exercise a genuinely lower section using the browser's scroll
 // engine, not only static CSS searches. It must animate when it enters view.
 await cdp('Emulation.setEmulatedMedia',{features:[
   {name:'prefers-reduced-motion',value:'no-preference'}
 ]});
 await clickPage('overview');
 const v98ScrollProbe=await js(`(async()=>{
   const target=document.querySelector('.cockpit-progress-item:last-child');
   if(!target)return {missing:true};
   const before=target.classList.contains('motion-scroll-revealed');
   target.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
   await new Promise(resolve=>setTimeout(resolve,220));
   const style=getComputedStyle(target);
   return {before,after:target.classList.contains('motion-scroll-revealed'),
     name:style.animationName,duration:parseFloat(style.animationDuration),
     translateY:new DOMMatrixReadOnly(style.transform).m42};
 })()`);
 console.log('V98_SCROLL_PROBE '+JSON.stringify(v98ScrollProbe));
 assert.ok(!v98ScrollProbe.missing&&v98ScrollProbe.after
   &&v98ScrollProbe.name==='v98-card-arrive'
   &&v98ScrollProbe.duration>=0.3
   &&v98ScrollProbe.translateY>0.5&&v98ScrollProbe.translateY<20,
   'V98 a below-fold planning card must visibly translate upward during its reveal');
 await js('window.scrollTo(0,0)');
 // V99: browser-test the native scroll-timeline progress and the real
 // <dialog> backdrop. All effects must disappear with reduced motion.
 await cdp('Emulation.setEmulatedMedia',{features:[
   {name:'prefers-reduced-motion',value:'no-preference'}
 ]});
 await clickPage('overview');
 const v99ReadingProbe=await js(`(async()=>{
   const bar=document.querySelector('.reference-travel-shell.is-content-page .reference-topbar');
   const sample=()=>{
     const style=getComputedStyle(bar,'::after');
     return {content:style.content,display:style.display,
       name:style.animationName,scale:new DOMMatrixReadOnly(style.transform).a};
   };
   const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   window.scrollTo({top:0,behavior:'instant'});await tick();
   const top=sample();
   const scrollMax=document.scrollingElement.scrollHeight-innerHeight;
   window.scrollTo({top:scrollMax,behavior:'instant'});await tick();
   const bottom=sample();
   window.scrollTo({top:0,behavior:'instant'});await tick();
   return {supported:CSS.supports('animation-timeline:scroll(root block)'),
     scrollMax,top,bottom};
 })()`);
 console.log('V99_READING_PROBE '+JSON.stringify(v99ReadingProbe));
 assert.ok(v99ReadingProbe.supported&&v99ReadingProbe.scrollMax>250
   &&v99ReadingProbe.top.name==='v99-reading-progress'
   &&v99ReadingProbe.bottom.scale>v99ReadingProbe.top.scale+0.6,
   'V99 native reading indicator must advance from page top to bottom');
 const v99Modal=await js(`(()=>{
   const d=document.querySelector('#dialog'),old=d.innerHTML;
   if(d.open)d.close();
   d.innerHTML='<h2>Animationstest</h2><button>Schließen</button>';
   d.showModal();
   const modal=getComputedStyle(d);
   const backdrop=getComputedStyle(d,'::backdrop');
   const result={name:modal.animationName,duration:parseFloat(modal.animationDuration),
     backdrop:backdrop.animationName,
     backDuration:parseFloat(backdrop.animationDuration),
     hasFocus:d.contains(document.activeElement)};
   d.close();d.innerHTML=old;return result;
 })()`);
 console.log('V99_MODAL_PROBE '+JSON.stringify(v99Modal));
 assert.ok(v99Modal.name==='v99-modal-arrive'&&v99Modal.duration>=0.25
  &&v99Modal.backdrop==='v99-backdrop-arrive'
  &&v99Modal.hasFocus,
  'V99 dialog open and backdrop must animate while preserving native focus');
 await cdp('Emulation.setEmulatedMedia',{features:[
   {name:'prefers-reduced-motion',value:'reduce'}
 ]});
 const v99Reduced=await js(`(()=>{
   const bar=document.querySelector('.reference-travel-shell.is-content-page .reference-topbar');
   const progress=getComputedStyle(bar,'::after').display;
   const d=document.querySelector('#dialog');d.showModal();
   const modal=getComputedStyle(d).animationName,
     backdrop=getComputedStyle(d,'::backdrop').animationName;
   d.close();return {progress,modal,backdrop};
 })()`);
 console.log('V99_REDUCED_PROBE '+JSON.stringify(v99Reduced));
 assert.ok(v99Reduced.progress==='none'
   &&v99Reduced.modal==='none'&&v99Reduced.backdrop==='none',
   'V99 progress and modal effects must be disabled with OS reduced motion');
 await cdp('Emulation.setEmulatedMedia',{features:[
   {name:'prefers-reduced-motion',value:'no-preference'}
 ]});
 // V99 schematic route: actual viewport activation must trace once, rather
 // than the historical endless nine-second moving dashed line.
 await clickPage('plan');
 await clickPage('overview');
 const v99RouteProbe=await js(`(async()=>{
   const section=document.querySelector('.cockpit-route-surface');
   const path=section?.querySelector('.cockpit-route-line');
   if(!path)return {missing:true};
   const before=section.classList.contains('motion-revealed');
   section.scrollIntoView({behavior:'instant',block:'center'});
   await new Promise(r=>setTimeout(r,350));
   const style=getComputedStyle(path);
   return {before,after:section.classList.contains('motion-revealed'),
     name:style.animationName,duration:parseFloat(style.animationDuration),
     offset:parseFloat(style.strokeDashoffset),pathLength:path.getAttribute('pathLength')};
 })()`);
 console.log('V99_ROUTE_PROBE '+JSON.stringify(v99RouteProbe));
 assert.ok(!v99RouteProbe.missing&&!v99RouteProbe.before&&v99RouteProbe.after
   &&v99RouteProbe.name==='v99-route-trace'
   &&v99RouteProbe.duration>=1&&v99RouteProbe.pathLength==='1'
   &&v99RouteProbe.offset>0.02&&v99RouteProbe.offset<1.1,
   'V99 route path must visibly trace once on entering the viewport');
 await cdp('Emulation.setEmulatedMedia',{features:[
   {name:'prefers-reduced-motion',value:'reduce'}
 ]});
 const v99RouteReduced=await js(`(()=>{
   const style=getComputedStyle(document.querySelector('.cockpit-route-line'));
   return {name:style.animationName,offset:parseFloat(style.strokeDashoffset)};
 })()`);
 assert.ok(v99RouteReduced.name==='none'&&v99RouteReduced.offset===0,
   'V99 route remains fully visible without movement under reduced motion');
 await cdp('Emulation.setEmulatedMedia',{features:[
   {name:'prefers-reduced-motion',value:'no-preference'}
 ]});
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
 await until(()=>js('document.querySelectorAll(".stay-compare-card").length===2'),
   'Both chosen accommodation cards are represented in the independent comparison');
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
 assert.ok(rows.every(row=>row.v95StyleLoaded),
   'V95 editorial web must be loaded on all pages, widths and themes');
 assert.ok(rows.filter(row=>row.page==='overview').every(row=>row.v95HomepageHeroHeight>=300),
   'Editorial homepage hero must be a prominent image-first first screen');
 assert.ok(rows.filter(row=>['discover','lodging','food'].includes(row.page))
   .every(row=>row.v96HeroCreditHeight===null||row.v96HeroCreditHeight<=48),
   'V96 photo source link must be a compact attribution, never a full-height overlay');
 // V96: on tablets, secondary source/route/food credits should be easier
 // to hit without expanding Leaflet map attribution overlays.
 const tabletRows=rows.filter(row=>row.width===768&&row.theme==='light'&&!row.reduce);
 assert.ok(tabletRows.length===7&&tabletRows.every(row=>row.smallTargetCount===0),
   'V96.1 every tablet page must have zero under-24px clickable regions');
 assert.ok(rows.filter(row=>row.width===390&&row.v961ResearchNoticeHeight!==null)
   .every(row=>row.v961ResearchNoticeHeight<=64),
   'V96.1 collapsed research warning stays compact without hiding its details on phones');
 assert.ok(rows.filter(row=>['discover','lodging','food'].includes(row.page)).every(row=>
   row.v96SecondaryActionContrast!==null&&row.v96SecondaryActionContrast>=4.5),
   'V96 browse secondary actions need >=4.5:1 computed foreground/background contrast');
 assert.ok(rows.filter(row=>['discover','lodging','food'].includes(row.page)).every(row=>
   row.v96ScopeActiveContrast!==null&&row.v96ScopeActiveContrast>=4.5),
   'V96 selected city/trip scope needs >=4.5:1 computed contrast');
 assert.ok(rows.filter(row=>row.page==='food').every(row=>
   row.v96FoodActiveContrast!==null&&row.v96FoodActiveContrast>=4.5),
   'V96 active food tabs need >=4.5:1 computed contrast');
 assert.ok(rows.every(row=>row.v96DayCreditOverlap===false),
   'V96 day plan source attribution must not cover day metadata at any width');
 assert.ok(rows.every(row=>row.v96HeroCreditOverlap===false),
   'V96 photo credit must not overlap the primary hero headline');
 assert.ok(rows.filter(row=>['discover','lodging','food'].includes(row.page))
   .every(row=>row.v962BrowseHeroMode==='true'
     ?row.v95BrowseHeroHeight>=295
     :(row.v95BrowseHeroHeight>=180
       &&row.v95BrowseHeroHeight<=(row.width===390?340:390))),
   'V96.2 loaded photo heroes stay immersive; unavailable-photo heroes stay compact');
 assert.ok(rows.every(row=>row.v94StyleLoaded),
   'V94 must be the loaded final design layer on every page and theme');
 assert.ok(rows.filter(r=>r.page==='food').every(r=>r.v94FoodSearchFirst===true),
   'Food navigation and search must be encountered before deep market evidence');
 assert.ok(rows.filter(r=>r.theme==='dark'&&r.page==='plan').every(r=>
   r.v94QuickTitleColor==='rgb(220, 239, 224)'),
   'Dark quick-day plan must not inherit the old light-only ink');
 assert.ok(rows.filter(r=>r.theme==='dark'&&['discover','food','lodging'].includes(r.page)).every(r=>
   r.v94HeroTitleColor==='rgb(237, 246, 238)'),
   'Dark photo heroes must keep clearly legible light headings');
 assert.ok(rows.filter(r=>r.theme==='dark'&&r.page==='overview').every(r=>
   r.v94OverviewStartBg==='rgb(28, 29, 32)'),
   'Dark overview quick navigation must not remain stark white');
 assert.ok(rows.every(row=>row.v94PrimaryTouch===null||row.v94PrimaryTouch>=42),
   'V94 primary buttons remain usable rather than tiny');
 assert.ok(rows.every(row=>row.calmStyleLoaded),
   'V91 final calm stylesheet must load for every page/width/theme');
 assert.ok(rows.every(row=>row.calmRevealedNodes<=12),
   'V97 section motion stays bounded to structural chapters, never hundreds of cards');
 assert.ok(rows.every(row=>row.v98ScrollRevealCount<=42),
   'V98 visible content reveals stay bounded rather than animating all result cards');
 assert.ok(rows.some(row=>row.page==='overview'&&!row.reduce
   &&row.v98ScrollRevealCount>0&&row.v98ScrollRevealName==='v98-card-arrive'),
   'V98 scroll reveal must visibly animate real travel cards in Chrome');
 assert.ok(rows.filter(row=>row.reduce).every(row=>
   row.v98ScrollRevealDuration===null||row.v98ScrollRevealDuration<0.001),
   'V98 scroll reveal must respect the operating system reduced-motion setting');
 assert.ok(rows.some(row=>row.page==='overview'&&!row.reduce
   &&row.v97SceneName==='v97-scene-in'&&row.v97SceneDuration>=0.2),
   'V97 meaningful navigation must visibly animate the content scene');
 assert.ok(rows.filter(row=>row.reduce).every(row=>
   row.v97SceneDuration===null||row.v97SceneDuration<0.001),
   'V97 whole-page transition must respect system reduced motion');
 assert.ok(rows.filter(row=>row.page==='map').every(row=>row.v97SceneDuration===null),
   'V97 never transforms the live map canvas');
 assert.ok(rows.filter(row=>row.reduce)
   .every(row=>row.calmRevealDuration===null||row.calmRevealDuration<0.001),
   'V91 reveal obeys OS reduce-motion across every page');
 assert.ok(rows.every(row=>row.calmNavTransition?.includes('background-color')),
   'Primary navigation keeps a quiet color transition');
 const lightNav=rows.find(row=>row.width===390&&row.page==='overview'&&row.theme==='light')?.calmTopbarBg;
 const darkNav=rows.find(row=>row.width===390&&row.page==='overview'&&row.theme==='dark')?.calmTopbarBg;
 assert.ok(lightNav&&darkNav&&lightNav!==darkNav,
   'Calm functional navigation needs distinct real light and dark backgrounds');
 const darkNavFailures=rows.filter(row=>row.theme==='dark'&&
   row.calmInactiveNavColor!=='rgb(237, 246, 238)');
 if(darkNavFailures.length)console.log('V91_DARK_NAV_DIAGNOSTIC '+JSON.stringify(
   darkNavFailures.map(row=>({page:row.page,width:row.width,actual:row.calmInactiveNavColor,topbar:row.calmTopbarBg}))));
 assert.ok(darkNavFailures.length===0,
   'Dark navigation labels must keep light, legible text across seven pages and three widths');
 const darkSearchFailures=rows.filter(row=>row.theme==='dark'&&row.width!==390&&row.calmSearchBg!=='rgb(32, 46, 37)');
 if(darkSearchFailures.length)console.log('V91_DARK_SEARCH_DIAGNOSTIC '+JSON.stringify(
   darkSearchFailures.slice(0,2).map(row=>({page:row.page,width:row.width,actual:row.calmSearchBg,topbar:row.calmTopbarBg,probe:row.calmSearchProbe}))));
 assert.ok(darkSearchFailures.length===0,
   'Dark desktop/tablet search must not remain bright white');
 assert.ok(rows.filter(row=>row.theme==='dark'&&row.width!==390).every(row=>
   row.calmTopActionBg==='rgb(32, 46, 37)'),
   'Dark header actions must match the dark material rather than white buttons');
 assert.ok(rows.filter(row=>['map','plan'].includes(row.page)).every(row=>
   !row.v94MapCountBroken), 'Map and plan must not show undefined counts');
 assert.ok(rows.every(row=>row.horizontalOverflow<=1),
   'Design changes must not introduce horizontal overflow at 390/768/1440');
 // V93: live browser inventory of the secondary mobile controls identified
 // in V92. Small labels remain visible; enlarge their hit regions without
 // altering routes, photos, source URLs, or desktop/tablet geometry.
 const mobileLinks=rows.filter(r=>r.width===390&&r.theme==='light'&&!r.reduce);
 for(const [page,maximum] of [['food',0],['plan',0],['map',0],['discover',0]]){
   const row=mobileLinks.find(r=>r.page===page);
   assert.ok(row&&row.smallTargetCount<=maximum,
     'V93 '+page+' mobile controls should have fewer under-24px hit regions: '
       +JSON.stringify(row?.smallTargets??[]));
 }
 // V92: the six first-screen destination photo credits and lodging/food hero
 // source links must not remain sub-24px tap targets on 390px phones.
 const mobileCreditPages=rows.filter(row=>row.width===390&&row.theme==='light'&&!row.reduce);
 const overviewCredits=mobileCreditPages.find(row=>row.page==='overview');
 const lodgingCredits=mobileCreditPages.find(row=>row.page==='lodging');
 assert.ok(overviewCredits?.smallTargetCount<=1,
   'Destination source credits should have usable phone-sized touch areas');
 assert.ok(lodgingCredits?.smallTargetCount===0,
   'The lodging photo source link should not be a tiny touch target');
 assert.ok(rows.filter(r=>['lodging','discover','food'].includes(r.page))
   .every(r=>r.searchLabelVisuallyHidden===true),
   'All browse search fields retain an accessible label without visible placeholder overlap');
 assert.ok(rows.filter(row=>row.width===390&&['lodging','discover','food'].includes(row.page))
   .every(row=>row.searchButtonClipPx===null||row.searchButtonClipPx<=1),
   'Search action must remain inside its toolbar at 390px in food, lodging and discover');
 assert.ok(rows.filter(row=>row.reduce).every(row=>row.motionProbeSeconds<0.001),
  'Computed reduced-motion stylesheet must effectively suppress long animations');

 // V118: actual native dialog and gallery navigation with local fixture images.
 // No external image availability or license claim is made by this test.
 await clickPage('overview');
 const v118=await js('('+async function(){
  const search=document.querySelector('[data-photo118-search]');
  if(!search)return {missingSearch:true};
  search.value='Burano';search.dispatchEvent(new Event('input',{bubbles:true}));
  const filtered=[...search.closest('.photo114-library').querySelectorAll('[data-photo118-label]:not([hidden])')];
  const filterOK=filtered.length>0&&filtered.every(el=>el.dataset.photo118Label.toLowerCase().includes('burano'));
  search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
  const fixture=document.createElement('div');fixture.className='photo114-grid';
  const src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  for(let i=1;i<=2;i++){
   const fig=document.createElement('figure');fig.className='photo114-card';
   const a=document.createElement('a');a.href='#';const img=document.createElement('img');img.src=src;img.alt='Fixture '+i;
   a.append(img);fig.append(a);const cap=document.createElement('figcaption');cap.textContent='Test '+i;fig.append(cap);fixture.append(fig);
  }
  document.body.append(fixture);
  const first=fixture.querySelector('a');first.focus();first.click();
  const dialog=document.querySelector('.photo118-viewer');
  const opened=dialog?.open&&dialog.querySelector('[data-photo118-count]').textContent==='1 / 2';
  dialog?.querySelector('[data-photo118-next]')?.click();
  const next=dialog?.querySelector('[data-photo118-count]').textContent==='2 / 2'&&dialog.querySelector('img').alt==='Fixture 2'&&dialog.querySelector('[data-photo118-next]').disabled;
  dialog?.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  const back=dialog?.querySelector('[data-photo118-count]').textContent==='1 / 2';
  const controls=dialog&&[...dialog.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height>=44);
  dialog?.querySelector('[data-photo118-close]')?.click();
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const closed=dialog&&!dialog.open&&document.activeElement===first;
  fixture.remove();
  return {filterOK,opened,next,back,controls,closed};
 }.toString()+')()');
 assert.deepEqual(v118,{filterOK:true,opened:true,next:true,back:true,controls:true,closed:true});
 console.log('PASS V118 gallery search, native modal, keyboard navigation and focus restoration');
 // V119: real scroll control and lightbox entry on an editorial story, no network required.
 const v119=await js('('+async function(){
  const fixture=document.createElement('section');fixture.className='photo119-story';
  fixture.innerHTML='<button data-photo119-scroll="1">Weitere Fotos</button><div class="photo119-rail" style="display:flex;overflow:auto;width:200px;gap:16px;scroll-snap-type:x mandatory"></div>';
  const rail=fixture.querySelector('.photo119-rail');
  for(let i=0;i<3;i++){
   const fig=document.createElement('figure');fig.className='photo119-item';fig.style.flex='0 0 180px';
   const a=document.createElement('a');a.href='#';const img=document.createElement('img');img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';img.alt='Tagesmotiv '+i;a.append(img);fig.append(a);rail.append(fig);
  }
  document.body.append(fixture);
  const previous=document.documentElement.dataset.motion;document.documentElement.dataset.motion='off';
  fixture.querySelector('button').click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const scrolled=rail.scrollLeft>0;
  rail.querySelector('a').click();const dialog=document.querySelector('.photo118-viewer');
  const opened=dialog?.open&&dialog.querySelector('[data-photo118-count]').textContent==='1 / 3';
  dialog?.querySelector('[data-photo118-close]')?.click();
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  if(previous===undefined)delete document.documentElement.dataset.motion;else document.documentElement.dataset.motion=previous;
  fixture.remove();return {scrolled,opened};
 }.toString()+')()');
 assert.deepEqual(v119,{scrolled:true,opened:true});
 console.log('PASS V119 editorial photo story controls and shared viewer');
 // V120: inspect real itinerary photo crop geometry on three responsive widths.
 await clickPage('plan');
 await js('(async()=>{if(!document.querySelector(".photo119-story")){for(const day of [...document.querySelectorAll(".days [data-action=day]")].map(b=>b.dataset.value)){document.querySelector(".days [data-value=\\\""+day+"\\\"]")?.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(document.querySelector(".photo119-story"))break;}}})()');
 const photoAudit=[];
 for(const width of [390,768,1440]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
  const sample=await js('('+async function(){
   const story=document.querySelector('.photo119-story');
   if(!story)return {missing:true};
   story.scrollIntoView({block:'start',behavior:'instant'});
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const rail=story.querySelector('.photo119-rail');
   const images=[...rail.querySelectorAll('.photo119-item>a')];
   const rect=rail.getBoundingClientRect();
   return {count:images.length,railWidth:rect.width,viewport:innerWidth,
    overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
    ratios:images.map(a=>{const r=a.getBoundingClientRect();return r.width/r.height}),
    crops:[...rail.querySelectorAll('[data-photo120-crop]')].map(x=>x.dataset.photo120Crop),
    loaded:images.filter(a=>a.querySelector('img')?.naturalWidth>0).length};
  }.toString()+')()');
  photoAudit.push({width,...sample});
  if(output&&!sample.missing){
   await mkdir(output,{recursive:true});
   const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
   await writeFile(join(output,'v120-day-photos-'+width+'.png'),Buffer.from(shot.data,'base64'));
  }
 }
 console.log('V120_PHOTO_AUDIT '+JSON.stringify(photoAudit));
 assert.ok(photoAudit.every(s=>!s.missing&&s.count>0&&s.count<=6&&s.overflow<=1&&s.railWidth<=s.viewport));
 assert.ok(photoAudit.every(s=>s.ratios.every(r=>Number.isFinite(r)&&r>=1.25&&r<=1.7)));
 assert.ok(photoAudit.every(s=>s.crops.length===s.count&&s.crops.every(c=>['architecture','landscape','balanced'].includes(c))));
 if(output)await writeFile(join(output,'v120-photo-audit.json'),JSON.stringify(photoAudit,null,2));



 // V121: exercise actual overview chapters and their navigation at mobile and desktop widths.
 const storyAudit=[];
 for(const width of [390,1440]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
  await clickPage('overview');
  const sample=await js('('+async function(){
   const story=document.querySelector('.journey121');if(!story)return {missing:true};
   const links=[...story.querySelectorAll('[data-journey121-index]')];
   const chapters=[...story.querySelectorAll('[data-journey121-chapter]')];
   const index=Math.min(1,chapters.length-1);
   const previous=document.documentElement.dataset.motion;document.documentElement.dataset.motion='off';
   links[index].click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const current=story.querySelector('[aria-current=location]');
   const status=story.querySelector('[data-journey121-status]')?.textContent;
   const box=chapters[index].getBoundingClientRect();
   const result={count:chapters.length,current:current?.dataset.journey121Index===String(index),status:status===(index+1)+' / '+chapters.length,visible:box.top>=0&&box.top<innerHeight,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
   if(previous===undefined)delete document.documentElement.dataset.motion;else document.documentElement.dataset.motion=previous;
   return result;
  }.toString()+')()');
  storyAudit.push({width,...sample});
  if(output&&!sample.missing){
   await mkdir(output,{recursive:true});
   const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
   await writeFile(join(output,'v121-city-chapter-'+width+'.png'),Buffer.from(shot.data,'base64'));
  }
 }
 console.log('V121_STORY_AUDIT '+JSON.stringify(storyAudit));
 assert.ok(storyAudit.every(s=>!s.missing&&s.count>0&&s.current&&s.status&&s.visible&&s.overflow<=1));
 if(output)await writeFile(join(output,'v121-story-audit.json'),JSON.stringify(storyAudit,null,2));
 console.log('PASS V88 lab snapshots: seven pages × three widths × light/dark/reduced-motion');
}finally{
 socket?.close();
 const exited=child.exitCode==null&&child.signalCode==null?once(child,'exit'):Promise.resolve();
 child.kill();await Promise.race([exited,sleep(5000)]);
 await new Promise(resolve=>server.close(resolve));
 await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});
}
