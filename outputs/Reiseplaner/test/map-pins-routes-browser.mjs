import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';
import {localParts,activeItems} from '../public/model.mjs';

const fixture=JSON.parse(await readFile(new URL('./fixtures/barcelona-foot-route.json',import.meta.url),'utf8'));
const pairKey=points=>points.map(point=>point.map(value=>Number(value).toFixed(5)).join(',')).join(';');
const captured=new Map(fixture.response.routes[0].legs.map((leg,index)=>[
 pairKey([fixture.stops[index].point,fixture.stops[index+1].point]),
 {code:'Ok',routes:[{distance:leg.distance,duration:leg.duration,
  geometry:{type:'LineString',coordinates:leg.steps.flatMap(step=>step.geometry.coordinates)},legs:[leg]}]},
]));
const providerCalls=[];
const fetcher=async url=>{
 if(!String(url).startsWith('https://routing.openstreetmap.de/routed-foot/'))throw Error('Unrecorded upstream disabled in this test');
 const coords=new URL(url).pathname.split('/').at(-1).split(';').map(pair=>pair.split(',').map(Number)).map(([lon,lat])=>[lat,lon]);
 const key=pairKey(coords),response=captured.get(key);providerCalls.push({key,recorded:Boolean(response)});
 if(!response)return new Response(JSON.stringify({code:'NoRoute'}),{status:503});
 return Response.json(response);
};
const browser=[process.env.REISEPLAN_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(existsSync);assert.ok(browser);
const folder=await mkdtemp(join(tmpdir(),'reise-map-flow-'));
const output=process.env.REISEPLAN_MAP_AUDIT_OUTPUT?resolve(process.env.REISEPLAN_MAP_AUDIT_OUTPUT):null;if(output)await mkdir(output,{recursive:true});
const {server,store}=await createApp({database:join(folder,'test.sqlite'),upstream:true,fetcher});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const originalVariant=store.current('interrail_swiss');
const needsBusyFixture=!activeItems(originalVariant.trip,originalVariant.state).some(item=>item.kind==='activity'&&localParts(item.start,item.zone).date==='2027-09-04');
if(needsBusyFixture)store.save(originalVariant.id,originalVariant.revision,{...originalVariant.state,manual:[...originalVariant.state.manual,
 {id:'manual:fixture-busy',kind:'activity',category:'activity',city:'barcelona',zone:'Europe/Madrid',
  name:'Isolierter Testtermin für Konfliktprüfung',date:'2027-09-04',start:'2027-09-04T10:00:00.000Z',end:'2027-09-04T11:00:00.000Z',
  duration:60,point:null,price:null,selected:true,locked:true,booked:false,origin:'manuell',verification:'Annahme'}]});
const address='http://127.0.0.1:'+server.address().port+'/?offlineMap&variant=interrail_swiss';
const child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+folder,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label,timeout=20000){const end=Date.now()+timeout;while(Date.now()<end){try{const value=await fn();if(value)return value;}catch{}await delay(70);}throw Error('Timeout: '+label);}
const report={source:fixture.sourceUrl,observedOn:fixture.observedOn,fixture:true,sourceMode:originalVariant.trip.dataMode??'original',needsBusyFixture,screens:[],errors:[]};let socket;
try{
 const port=await until(async()=>(await readFile(join(folder,'DevToolsActivePort'),'utf8')).split('\n')[0],'Chrome');
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 let sequence=0;const pending=new Map();
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')report.errors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);if(!pending.has(message.id))return;const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);});
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const js=async expression=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
 const click=async selector=>{await until(()=>js('Boolean(document.querySelector('+JSON.stringify(selector)+'))'),selector);await js('document.querySelector('+JSON.stringify(selector)+').click()');};
 const set=async(selector,value)=>js('document.querySelector('+JSON.stringify(selector)+').value='+JSON.stringify(String(value)));
 const screenshot=async name=>{if(output){const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name),Buffer.from(shot.data,'base64'));}};
 const save=async()=>{await click('dialog [type=submit]');await until(()=>js('!document.querySelector("dialog").open'),'Speichern');};
 const toMap=async()=>{await click('.sidebar [data-action=page][data-value=map]');await until(()=>js('Boolean(document.querySelector("#map .leaflet-pane"))'),'Karte');};
 const openPin=async()=>{
  const selector='.map-panel>.panel-head [data-action=map-pin-new]';
  assert.equal(await js('document.querySelector('+JSON.stringify(selector)+')?.checkVisibility()'),true,'Own-pin entry is visibly available');
  await click(selector);await until(()=>js('Boolean(document.querySelector("dialog [data-map-pin-form]"))'),'Pinformular');
 };
 const findPin=name=>store.current('interrail_swiss').state.manual.find(item=>item.name===name);
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['https://*']});
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:address});await until(()=>js('Boolean(document.querySelector("#variant"))'),'Anwendung');
 await click('.sidebar [data-action=page][data-value=plan]');
 await click('.days [data-action=day][data-value="2027-09-04"]');await toMap();
 // Real Chrome: city-to-city is marked schematic, with native keyboard
 // buttons to seek, pause, skip and cancel. Playback never writes trip data.
 const stateBeforeStory=JSON.stringify(store.current('interrail_swiss').state);
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await click('.map-panel [data-action=route-story-play]');
 await until(()=>js('document.querySelector("#route-story-player")?.dataset.status==="playing"'),'City story started');
 assert.match(await js('document.querySelector(".route-story-disclaimer").textContent'),/Schematische Städtefolge/);
 assert.ok(await js('document.querySelectorAll(".route-story-rail-dot[data-action=route-story-jump]").length>=2'));
 await click('.route-story-rail-dot[data-value="1"]');
 assert.match(await js('document.querySelector("#route-story-count").textContent'),/^2 \/ /);
 await click('[data-action=route-story-pause]');
 assert.equal(await js('document.querySelector("#route-story-player").dataset.status'),'paused');
 await click('[data-action=route-story-next]');
 assert.ok(await js('Number(document.querySelector("#route-story-count").textContent.split(" / ")[0])>=2'));
 await screenshot('karte-story-sprung-und-pause-1440.png');
 await click('[data-action=route-story-stop]');
 await until(()=>js('document.querySelector("#route-story-player").hidden'),'City story stopped');
 assert.equal(JSON.stringify(store.current('interrail_swiss').state),stateBeforeStory,
   'City playback must not persist any costs, itinerary changes or pins');
 await click('[data-action=explorer-scope][data-value=city]');
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const original=JSON.stringify(store.current('interrail_swiss').state.edits);
 const otherVariants=Object.fromEntries(['interrail_classic','interrail_august','swiss_lakes'].map(id=>[id,JSON.stringify(store.current(id).state)]));
 await js('document.querySelector(".reference-places-drawer").open=true');
 // Record a real Chrome measurement before and after a filter transition.
 // A full app render would replace the original shell node and fail this test.
 const beforeFilter=await js('(()=>{const shell=document.querySelector(".reference-travel-shell"),map=document.querySelector("#map");shell.dataset.mapProbe="retained";map.dataset.mapProbe="retained";return{nodes:document.querySelectorAll("*").length,markers:document.querySelectorAll("#map .leaflet-marker-icon").length,time:performance.now(),source:document.querySelector("#map-source-indicator")?.dataset.state}})()');
 await click('[data-action=explorer-group][data-value=lodging]');
 const afterFilter=await js('(()=>({shellRetained:document.querySelector(".reference-travel-shell")?.dataset.mapProbe==="retained",mapRetained:document.querySelector("#map")?.dataset.mapProbe==="retained",nodes:document.querySelectorAll("*").length,markers:document.querySelectorAll("#map .leaflet-marker-icon").length,time:performance.now(),lodgingPressed:[...document.querySelectorAll("[data-action=explorer-group][data-value=lodging]")].every(el=>el.getAttribute("aria-pressed")==="true"),basemap:document.querySelector("#map-source-indicator")?.dataset.state}))()');
 assert.equal(beforeFilter.source,'offline','The offline badge must survive ordinary retained-map rerenders');
 assert.equal(afterFilter.basemap,'offline','Fast filtering must never regress to a fake loading state');
 assert.ok(afterFilter.shellRetained&&afterFilter.mapRetained,
   'A category filter must preserve the entire app shell and live Leaflet element');
 assert.ok(afterFilter.lodgingPressed,'Map category buttons remain synchronized after in-place filter update');
 report.filterProfiling={before:beforeFilter,after:afterFilter,elapsedMs:Math.round((afterFilter.time-beforeFilter.time)*100)/100};
 // Real map click and Escape return preserve the typed form draft.
 await openPin();await set('dialog [name=name]','Kartenklick-Testpunkt');
 await set('dialog [name=pinCategory]','food');
 await click('dialog [data-action=map-pin-pick]');
 await until(()=>js('document.querySelector("#map").classList.contains("is-placing-pin")'),'Pin-Klickmodus');
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert.equal(await js('document.querySelector("dialog [name=name]").value'),'Kartenklick-Testpunkt');
 await click('dialog [data-action=map-pin-pick]');
 await js('document.querySelector("#map").scrollIntoView({block:"center"})');
 const target=await js('(()=>{const r=document.querySelector("#map").getBoundingClientRect();return{x:r.left+r.width*.73,y:r.top+r.height*.27}})()');
 await cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...target});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...target});
 await until(()=>js('document.querySelector("dialog").open'),'Kartenklick öffnet Formular');
 assert.equal(await js('document.querySelector("dialog [name=name]").value'),'Kartenklick-Testpunkt');
 assert.ok(await js('Number.isFinite(Number(document.querySelector("dialog [name=lat]").value))&&document.querySelector("dialog [name=lat]").value!==""'));
 await save();const pin=findPin('Kartenklick-Testpunkt');assert.ok(pin?.userPin);assert.equal(pin.selected,false);assert.equal(pin.verification,'ungeprüft');
 assert.equal(pin.pinCategory,'food','Map-picked pin preserves its selected category');
 await click('.map-own-pins [data-action=explorer-save][data-value="'+pin.id+'"]');
 assert.ok(await js('localStorage.getItem("reiseplan-map-shortlist:interrail_swiss")?.includes('+JSON.stringify(pin.id)+')'),
   'Own pin can be bookmarked locally per variant');
 await set('#own-pins-search','unfindable123');
 await js('document.querySelector("#own-pins-search").dispatchEvent(new Event("input",{bubbles:true}))');
 assert.equal(await js('document.querySelector("[data-own-pin]")?.hidden'),true,
   'Filtering own pins does not rebuild the map');
 await set('#own-pins-search','');
 await js('document.querySelector("#own-pins-search").dispatchEvent(new Event("input",{bubbles:true}))');
 assert.equal(await js('document.querySelector("[data-own-pin]")?.hidden'),false);
 assert.equal(await js('document.querySelector(\'[data-action=explorer-group][data-value=all]\')?.getAttribute("aria-pressed")'),'true','Saving a pin clears an incompatible category filter');
 assert.equal(JSON.stringify(store.current('interrail_swiss').state.edits),original,'Adding an optional pin does not change existing itinerary');
 await click('.map-own-pins [data-action=edit][data-value="'+pin.id+'"]');
 await set('dialog [name=name]','Umbenannter Pin');
 await set('dialog [name=pinCategory]','lodging');
 await set('dialog [name=lat]',fixture.stops[0].point[0]);await set('dialog [name=lon]',fixture.stops[0].point[1]);await save();
 assert.deepEqual(findPin('Umbenannter Pin').point,fixture.stops[0].point);
 assert.equal(findPin('Umbenannter Pin').pinCategory,'lodging');
 assert.equal(findPin('Umbenannter Pin').kind,'activity','Pin symbol never changes the booking/activity model');
 await js('document.querySelector(".reference-places-drawer").open=true');
 await click('[data-action=explorer-group][data-value=shop]');
 await click('.map-own-pins [data-action=map-pin-focus][data-value="'+pin.id+'"]');
 assert.equal(await js('document.querySelector(\'[data-action=explorer-group][data-value=all]\')?.getAttribute("aria-pressed")'),'true','Own-pin focus reveals the point through filters');
 await click('.map-own-pins [data-action=remove][data-value="'+pin.id+'"]');
 await until(()=>!activeItems(store.current('interrail_swiss').trip,store.current('interrail_swiss').state).some(item=>item.id===pin.id),'Pin entfernt');
 await until(()=>js('!document.querySelector(\'.map-own-pins [data-own-pin="'+pin.id+'"]\')'),'Pin aus Liste entfernt');
 await click('.top-actions [data-action=undo]');await until(()=>js('Boolean(document.querySelector(\'.map-own-pins [data-own-pin="'+pin.id+'"]\'))'),'Pin Undo');
 await click('.map-own-pins [data-action=remove][data-value="'+pin.id+'"]');
 await until(()=>js('!document.querySelector(\'.map-own-pins [data-own-pin="'+pin.id+'"]\')'),'Testpin erneut entfernt');
 const pins=[];
 for(let index=0;index<fixture.stops.length;index++){
  const stop=fixture.stops[index],name='Teststopp '+(index+1)+' · '+stop.name;
  await openPin();await set('dialog [name=name]',name);await set('dialog [name=lat]',stop.point[0]);await set('dialog [name=lon]',stop.point[1]);await set('dialog [name=duration]',15);await save();pins.push(findPin(name));
 }
 assert.ok(pins.every(item=>item&&!item.selected));
 const addStop=async item=>{
  await js('document.querySelector(".reference-places-drawer").open=true');
  await set('#map-search',item.name);await click('[data-action=explorer-search]');
  await click('[data-action=day-route-add][data-value="'+item.id+'"]');
 };
 await addStop(pins[0]);await addStop(pins[1]);
 await click('[data-action=day-route-check]');
 await until(()=>js('Boolean(document.querySelector("[data-action=day-route-commit]"))'),'Zwei echte Fußstopps');
 assert.equal(await js('document.querySelector(".day-route-builder").checkVisibility()'),true,'Route controls must be visible, not just present in DOM');
 assert.ok(await js('document.querySelectorAll("#map .route-studio-map-line:not(.schematic)").length>=1'));
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await click('[data-action=route-studio-play]');
 await until(()=>js('document.querySelector("#route-story-player")?.dataset.status==="playing"'),'Route Studio animation');
 assert.match(await js('document.querySelector(".route-story-disclaimer").textContent'),
   /berechneter Fußweg/i,'Verified stop geometry drives the travel indicator');
 await screenshot('karte-route-studio-animation-1440.png');
 await click('.route-story-rail-dot[data-value="1"]');
 assert.equal(await js('document.querySelector("#route-story-count").textContent'),'2 / 2');
 await click('[data-action=route-story-play]');
 await until(()=>js('document.querySelector("#route-story-player")?.dataset.status==="playing" && document.querySelector("#route-story-count")?.textContent?.startsWith("1 /")'),
   'Restart repeats the actual Route Studio tour');
 assert.match(await js('document.querySelector(".route-story-disclaimer").textContent'),
   /berechneter Fußweg/i,'Restart must not silently switch to schematic city-to-city');
 await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await click('.map-own-pins [data-action=remove][data-value="'+pins[1].id+'"]');
 assert.equal(await js('document.querySelector("#route-story-player").hidden'),true,
   'Deleting a source pin cancels the active animation immediately');
 await until(()=>js('document.querySelectorAll(".route-studio-stop").length===1'),'Gelöschten Pin aus Entwurf entfernen');
 assert.equal(await js('Boolean(document.querySelector("[data-action=day-route-commit]"))'),false,'Deleted pin cannot be resurrected by adoption');
 await click('.top-actions [data-action=undo]');
 await until(()=>js('Boolean(document.querySelector(\'.map-own-pins [data-own-pin="'+pins[1].id+'"]\'))'),'Gelöschten Pin wiederherstellen');
 await addStop(pins[1]);
 await click('[data-action=day-route-clear]');
 for(const item of pins)await addStop(item);
 await click('[data-action=day-route-add][data-value="'+pins.at(-1).id+'"]');
 assert.equal(await js('document.querySelectorAll(".route-studio-stop").length'),8,'Duplicates do not exceed eight stops');
 await set('#map-search','La Plata');await click('[data-action=explorer-search]');
 await click('[data-action=day-route-add][data-value="local:food-v03-005"]');
 assert.equal(await js('document.querySelectorAll(".route-studio-stop").length'),8,'A ninth unique stop is refused');
 await click('[data-action=day-route-up][data-value="'+pins[1].id+'"]');
 assert.equal(await js('document.querySelector(".route-studio-stop strong").textContent'),pins[1].name);
 await click('[data-action=day-route-down][data-value="'+pins[1].id+'"]');
 await click('[data-action=day-route-up][data-value="'+pins.at(-1).id+'"]');
 assert.equal(await js('document.querySelector(".route-studio-stop[aria-pressed=true] strong").textContent'),pins.at(-1).name,'Focus follows the reordered place');
 await click('[data-action=day-route-down][data-value="'+pins.at(-1).id+'"]');
 await click('[data-action=day-route-focus][data-value="7"]');assert.equal(await js('document.querySelector(".route-studio-stop[aria-pressed=true]").dataset.value'),'7');
 await click('[data-action=day-route-prev]');assert.equal(await js('document.querySelector(".route-studio-stop[aria-pressed=true]").dataset.value'),'6');
 await js('document.querySelector("[data-action=day-route-next]").focus()');
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
 await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 assert.equal(await js('document.querySelector(".route-studio-stop[aria-pressed=true]").dataset.value'),'7','Native Enter advances focus');
 await click('[data-action=day-route-fit]');await click('[data-action=day-route-check]');
 await until(()=>js('Boolean(document.querySelector("[data-action=day-route-commit]"))'),'Acht echte Fußstopps',30000);
 assert.equal(await js('document.querySelectorAll("#map .route-studio-map-line.schematic").length'),0);
 const beforeCommit=JSON.stringify(store.current('interrail_swiss').state);
 await click('[data-action=day-route-commit]');
 await until(()=>js('document.querySelector("#toast").textContent.includes("überschneidet")'),'Bestehenden Tag schützen');
 assert.equal(JSON.stringify(store.current('interrail_swiss').state),beforeCommit);
 await set('#day-route-start','19:00');await js('document.querySelector("#day-route-start").dispatchEvent(new Event("change",{bubbles:true}))');
 await until(()=>js('document.querySelector("#toast").textContent===""'),'Vorherige Konfliktmeldung ausblenden');
 for(const width of [1440,820,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await js('new Promise(resolve=>setTimeout(resolve,120))');
  await js('document.querySelector(".day-route-builder").scrollIntoView({block:"start"});new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  assert.ok(await js('(()=>{const r=document.querySelector(".day-route-builder").getBoundingClientRect();return r.top>=55&&r.top<250&&r.width>200})()'),'Screenshot shows the actual route controls below the fixed header');
  assert.ok(await js('(()=>{const track=document.querySelector(".route-studio-track").getBoundingClientRect(),selected=document.querySelector(".route-studio-stop[aria-pressed=true]").getBoundingClientRect();return selected.left>=track.left-1&&selected.right<=track.right+1})()'),'Selected stop stays visible inside the horizontal route track');
  assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+5'),'Route Studio stays inside page');
  await screenshot('route-acht-stopps-'+width+'.png');report.screens.push({width,stops:await js('document.querySelectorAll(".route-studio-stop").length'),schematic:await js('document.querySelectorAll("#map .route-studio-map-line.schematic").length')});
 }
 await click('[data-action=day-route-commit]');await until(()=>js('!document.querySelector(".day-route-builder")'),'Route in Tagesplan');
 const state=store.current('interrail_swiss').state;
 assert.ok(pins.every(item=>state.edits[item.id]?.selected));
 assert.equal(localParts(state.edits[pins[0].id].start,'Europe/Madrid').time,'19:00');
 assert.equal(localParts(state.edits[pins.at(-1).id].start,'Europe/Madrid').time,'23:05');
 await click('.top-actions [data-action=undo]');await until(()=>!store.current('interrail_swiss').state.edits[pins[0].id]?.selected,'Undo gesamter Übernahme');
 assert.ok(pins.every(item=>!store.current('interrail_swiss').state.edits[item.id]?.selected));
 await toMap();for(const item of pins)await addStop(item);
 await click('[data-action=day-route-check]');await until(()=>js('Boolean(document.querySelector("[data-action=day-route-commit]"))'),'Erneute Übernahme vorbereiten');
 await click('[data-action=day-route-commit]');await until(()=>js('!document.querySelector(".day-route-builder")'),'Erneut speichern');
 await cdp('Page.navigate',{url:address});await until(()=>js('Boolean(document.querySelector("#variant"))'),'Reload');
 await click('.sidebar [data-action=page][data-value=plan]');await click('.days [data-action=day][data-value="2027-09-04"]');
 for(const item of pins)assert.equal(await js('Boolean(document.querySelector(\'.timeline-event .event-card[data-event-id="'+item.id+'"]\'))'),true,'Every adopted point survives reload in the actual timeline');
 assert.equal(store.current('interrail_swiss').state.manual.filter(item=>item.userPin&&!store.current('interrail_swiss').state.edits[item.id]?.removed).length,8);
 await set('#variant','interrail_classic');await js('document.querySelector("#variant").dispatchEvent(new Event("change",{bubbles:true}))');
 await until(()=>js('document.querySelector("#app").dataset.variantId==="interrail_classic"'),'Andere Variante');
 assert.equal(store.current('interrail_classic').state.manual.some(item=>item.userPin),false);
 await toMap();
 for(const width of [1440,820,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await js('new Promise(resolve=>setTimeout(resolve,120))');
  await screenshot('karte-normal-'+width+'.png');
  assert.equal(await js('document.querySelector(".map-local-actions [data-action=map-fullscreen]").checkVisibility()'),true,'Fullscreen has a visible normal-mode entry');
  await click('.map-local-actions [data-action=map-fullscreen]');
  await until(()=>js('Boolean(document.querySelector(".map-fullscreen-mode"))'),'Vollbild');
  assert.equal(await js('document.querySelector(".map-fullscreen-toolbar [data-action=map-pin-new]").checkVisibility()'),true,'Own-pin action remains available in fullscreen');
  assert.ok(await js('(()=>{const buttons=[...document.querySelectorAll(".map-fullscreen-toolbar button")].filter(button=>button.checkVisibility());return buttons.every(button=>{const r=button.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<innerHeight})})()'),'Every visible primary fullscreen action stays inside the viewport');
  assert.ok(await js('document.querySelector(".map-fullscreen-categories").getBoundingClientRect().top>=document.querySelector(".map-fullscreen-toolbar").getBoundingClientRect().bottom-1'),'Categories never overlap a wrapped fullscreen toolbar');
  const bounds=await js('(()=>{const r=document.querySelector("#map").getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()');
  assert.ok(bounds.left>=-1&&bounds.right<=width+1&&bounds.top>=0&&bounds.bottom<=1001,'Actual map surface fits fullscreen');
  await screenshot('karte-vollbild-'+width+'.png');
  if(width===390){
    await click('.map-fullscreen-drawer-toggle');
    await until(()=>js('Boolean(document.querySelector(".fullscreen-drawer-open"))'),'Mobile bottom sheet opens');
    const sheet=await js('(()=>{const r=document.querySelector(".map-fullscreen-mode>.explorer-right").getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height,width:r.width,viewportHeight:innerHeight,viewportWidth:innerWidth,title:document.querySelector(".map-fullscreen-drawer-heading strong")?.textContent,expanded:document.querySelector(".map-fullscreen-drawer-toggle")?.getAttribute("aria-expanded")}})()');
    assert.ok(sheet.top>=sheet.viewportHeight*.24&&sheet.bottom<=sheet.viewportHeight+2
      &&sheet.height<sheet.viewportHeight*.7&&sheet.width<=sheet.viewportWidth+2,
      'Fullscreen bottom sheet leaves actual map visible: '+JSON.stringify(sheet));
    assert.equal(sheet.expanded,'true','Bottom sheet announces expanded state');
    assert.ok(sheet.title?.length>4,'Bottom sheet says what scope its contents represent');
    await screenshot('karte-bottom-sheet-390.png');
    await click('.map-fullscreen-drawer-heading [data-action=map-fullscreen-drawer]');
    await until(()=>js('!document.querySelector(".fullscreen-drawer-open")'),'Bottom sheet closes');
  }
  await click('.map-fullscreen-toolbar [data-action=map-pin-new]');
  await until(()=>js('document.querySelector("dialog").open'),'Pinformular im Vollbild');
  await click('dialog [data-action=close]');
  await click('.map-fullscreen-toolbar [data-action=map-fullscreen]');
  await until(()=>js('!document.querySelector(".map-fullscreen-mode")'),'Vollbild schließen');
 }
 for(const [id,snapshot] of Object.entries(otherVariants))assert.equal(JSON.stringify(store.current(id).state),snapshot,'All other variant states remain unchanged');
 assert.equal(providerCalls.filter(call=>call.recorded).length,7,'Recorded routes are cached, not repeatedly fetched');
 assert.deepEqual(report.errors,[]);if(output)await writeFile(join(output,'map-flows.json'),JSON.stringify({...report,providerCalls},null,2));
 console.log('PASS: real map-click pin CRUD/Undo, two and eight recorded foot segments, ordering/focus, conflict protection, itinerary Undo, reload and variant isolation');
}finally{
 socket?.close();const exited=child.exitCode==null&&child.signalCode==null?once(child,'exit'):Promise.resolve();child.kill();await Promise.race([exited,delay(5000)]);
 await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true,maxRetries:12,retryDelay:250});
}
