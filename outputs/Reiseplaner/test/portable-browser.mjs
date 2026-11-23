import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

const browser = [process.env.REISEPLAN_BROWSER, '/usr/bin/google-chrome',
  '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);
assert.ok(browser, 'Chrome/Edge fehlt für den portablen Browsertest.');
const profile = await mkdtemp(join(tmpdir(), 'reiseplan-portable-'));
const { server, store, catalog } = await createApp({ database: join(profile, 'app.sqlite'), upstream: false });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = 'http://127.0.0.1:' + server.address().port + '/?offlineMap';
const child = spawn(browser, ['--headless=new', '--no-sandbox', '--remote-debugging-port=0',
  '--disable-background-networking', '--disable-extensions', '--no-first-run', '--disable-gpu',
  '--user-data-dir=' + profile, '--window-size=1280,900', 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString().slice(-600); stderr = stderr.slice(-1400); });
const waitMs = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label, timeout = 12000) {
  const stop = Date.now() + timeout;
  while (Date.now() < stop) {
    try { const value = await fn(); if (value) return value; } catch {}
    await waitMs(80);
  }
  throw new Error('Timeout: ' + label + '\n' + stderr);
}
let socket;
try {
  const port = await until(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0],
    'Chrome CDP Port', 30000);
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  const pending = new Map();
  const pageErrors = [];
  let seq = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown')
      pageErrors.push(message.params?.exceptionDetails?.text+' '+message.params?.exceptionDetails?.exception?.description);
    if (!message.id) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const js = async expression => {
    const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const selector = s => 'document.querySelector(' + JSON.stringify(s) + ')';
  const click = async s => {
    await until(() => js('Boolean(' + selector(s) + ')'), 'Element ' + s);
    await js(selector(s) + '.click()');
  };
  const text = (s, value) => until(() => js(selector(s) + '?.textContent.includes(' + JSON.stringify(value) + ')'), value + ' in ' + s);
  const set = async (s, value) => {
    await until(() => js('Boolean(' + selector(s) + ')'), 'Eingabe ' + s);
    await js(selector(s) + '.value = ' + JSON.stringify(value));
  };
  const screenshotDir=process.env.REISEPLAN_SCREENSHOT_DIR;
  const screenshot=async filename=>{
    if(!screenshotDir)return;
    // Observe the settled visual state, without transient entrance/toast overlays.
    await waitMs(460);
    await js('document.querySelector("#toast")?.replaceChildren()');
    await mkdir(screenshotDir,{recursive:true});
    const image=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    await writeFile(join(screenshotDir,filename),Buffer.from(image.data,'base64'));
  };
  const save = async () => {
    await click('dialog [type=submit]');
    const result = await until(() => js('(() => { const d = document.querySelector("dialog"); return d?.open === false ? "closed" : d?.querySelector(".form-error")?.textContent || null; })()'),
      'Dialog wird gespeichert');
    if (result !== 'closed') throw new Error('Validierungsfehler beim Speichern: ' + result);
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Page.navigate', { url: address });
  await text('h1', 'Reiseübersicht');
  assert.ok(await js('(() => {const quick=document.querySelector(".overview-start")?.getBoundingClientRect(),other=document.querySelector(".cockpit-layout")?.getBoundingClientRect();return quick&&other&&quick.top<other.top&&quick.height>=70})()'),
    'The home screen shows the large quick-start actions before technical dashboards');
  assert.equal(await js('document.querySelectorAll(".overview-quick-card").length'),4,
    'Four clearly named home choices are present');
  assert.ok(await js('document.querySelector(".day-plan-overview")?.querySelectorAll("[data-action=day-plan-go]").length===14'),
    '14 day outlines are accessible for the current two-week variant');
  assert.ok(await js('Array.from(document.querySelectorAll("link")).some(l=>l.getAttribute("href")==="/motion-polish.css")'),
    'Shared motion stylesheet is loaded');
  assert.ok(await js('Array.from(document.querySelectorAll("link")).some(l=>l.getAttribute("href")==="/calm-design-v91.css")'),
    'Shared calm stylesheet follows legacy visual layers');
  assert.equal(await js('document.querySelectorAll(".overview-quick-card.motion-revealed").length'),0,
    'Overview cards remain stable without staggered entrance animations');
  await js('document.querySelector(".overview-quick-card").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,clientX:95,clientY:180,pointerType:"mouse",isPrimary:true}))');
  assert.equal(await js('document.querySelectorAll(".motion-ripple").length'),0,
    'Pointer interactions must not inject transient ripple DOM');
  await js('document.documentElement.dataset.motion="off"');
  await js('document.querySelectorAll(".overview-quick-card")[1].dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,clientX:95,clientY:180,pointerType:"mouse",isPrimary:true}))');
  assert.equal(await js('document.querySelectorAll(".motion-ripple").length'),0,
    'Explicit off preference remains calm and side-effect free');
  await js('document.documentElement.dataset.motion="auto"');
  await screenshot('25-einfacher-startbildschirm-1280.png');
  // Dedicated activity directory and human-readable field audit are user-facing
  // screens, not merely isolated model helpers.
  await click('.sidebar [data-action=page][data-value=activities]');
  await text('h1','Alle Aktivitäten');
  assert.ok(await js('document.querySelectorAll(".activity-card-grid .hub-option-card").length>0'),
    'Activities show real existing trip options');
  assert.ok(await js('Boolean(document.querySelector(".activity-category-chip[data-value=water]"))'),
    'Activities expose visual category filters');
  await click('.activity-category-chip[data-value=water]');
  assert.equal(await js('document.querySelector(".activity-category-chip[data-value=water]")?.getAttribute("aria-pressed")'),'true');
  await click('.activity-category-chip[data-value=all]');
  await until(()=>js('Boolean(document.querySelector(".activity-evidence-chip[data-value=missingPhoto]"))'),
    'Datenqualitätsfilter sind in Aktivitäten zugänglich');
  await click('.activity-evidence-chip[data-value=missingPhoto]');
  await until(()=>js('document.querySelector(".activity-evidence-chip[data-value=missingPhoto]")?.getAttribute("aria-pressed")==="true"'),
    'Fehlende lizenzierte Bilder filtern');
  assert.equal(await js('document.querySelectorAll(".activity-card-grid .place-specific-photo").length'),0,
    'Ein dekoratives Stadtmotiv wird nicht als Objektfoto gezählt');
  await click('.activity-evidence-chip[data-value=all]');
  await click('.activity-evidence-chip[data-value=sourcedPoint]');
  await until(()=>js('document.querySelector(".activity-evidence-chip[data-value=sourcedPoint]")?.getAttribute("aria-pressed")==="true"'),
    'Aktivitäten nur mit belegter öffentlicher Koordinate');
  await click('.activity-evidence-chip[data-value=unverifiedPoint]');
  await until(()=>js('document.querySelector(".activity-evidence-chip[data-value=unverifiedPoint]")?.getAttribute("aria-pressed")==="true"'),
    'Aktivitäten mit vorhandener aber noch unbelegter Koordinate separat');
  await click('.activity-evidence-chip[data-value=all]');
  await screenshot('42-aktivitaeten-einzelnachweise-desktop.png');
  await screenshot('39-aktivitaeten-qualitaetsfilter-desktop.png');
  await screenshot('37-aktivitaeten-kategorien-desktop.png');
  assert.ok(await js('Boolean(document.querySelector(".activity-category-chip[data-value=clubs]"))'),
    'Separate Clubs & Partys filter is visible to all travellers');
  await click('.activity-category-chip[data-value=clubs]');
  await until(()=>js('document.querySelector(".activity-category-chip[data-value=clubs]")?.getAttribute("aria-pressed")==="true"'),
    'Clubs filter switches independently from bars and other evening plans');
  assert.ok(await js('Array.from(document.querySelectorAll(".hub-quick-day")).some(el=>el.dataset.quickDayId==="uploaded:v50:new_036")'),
    'Imported Barcelona nightclub Sala Apolo can be assigned to a compatible travel day');
  await click('[data-action=day-quick-add][data-value="uploaded:v50:new_036"]');
  await until(()=>js('Array.from(document.querySelectorAll("[data-action=day-quick-remove]")).some(el=>el.dataset.value==="uploaded:v50:new_036")'),
    'Activity quick-add immediately turns into a one-click remove control');
  assert.equal(store.current('interrail_classic').state.edits['uploaded:v50:new_036']?.selected,true,
    'Quick add persists the chosen day in existing editable state');
  const movedClubDate=await js('(()=>{const wrapper=Array.from(document.querySelectorAll(".hub-quick-day"))'
    +'.find(el=>el.dataset.quickDayId==="uploaded:v50:new_036");'
    +'const select=wrapper?.querySelector("select");'
    +'const current=select?.value;'
    +'const another=Array.from(select?.options??[]).find(x=>x.value!==current);'
    +'if(!another)return null;select.value=another.value;return another.value})()');
  assert.match(movedClubDate,/^2027-09-\d\d$/,
    'Club can be moved directly to another city-compatible travel day');
  await click('[data-action=day-quick-move][data-value="uploaded:v50:new_036"]');
  await until(()=>js('Array.from(document.querySelectorAll("[data-action=day-quick-move]")).some(x=>x.dataset.value==="uploaded:v50:new_036")'),
    'The move action remains available for already scheduled club');
  assert.equal(store.current('interrail_classic').state.edits['uploaded:v50:new_036']?.date,movedClubDate,
    'Direct move persists its new date without deleting and re-adding');
  await screenshot('52-clubabend-auf-anderen-reisetag-verschoben.png');
  const dayChosen=store.current('interrail_classic').state.edits['uploaded:v50:new_036']?.date;
  assert.match(dayChosen,/^2027-09-\d{2}$/);
  await click('.sidebar [data-action=page][data-value=plan]');
  await click('.days [data-action=day][data-value="'+dayChosen+'"]');
  await text('.timeline','Sala Apolo');
  assert.ok(await js('Array.from(document.querySelectorAll(".timeline-quick-remove")).some(b=>b.dataset.value==="uploaded:v50:new_036")'),
    'The newly selected club appears on its date and offers immediate removal within the day timeline');
  await screenshot('50-tagesplan-direkt-hinzufuegen-und-loeschen-1280.png');
  await click('.timeline-quick-remove[data-value="uploaded:v50:new_036"]');
  await until(()=>Promise.resolve(store.current('interrail_classic').state.edits['uploaded:v50:new_036']?.selected===false),
    'Removing the club from the actual timeline immediately updates saved trip state');
  await click('.sidebar [data-action=page][data-value=activities]');
  await until(()=>js('Array.from(document.querySelectorAll("[data-action=day-quick-add]")).some(el=>el.dataset.value==="uploaded:v50:new_036")'),
    'An activity can be removed with one click and then re-added');
  assert.equal(store.current('interrail_classic').state.edits['uploaded:v50:new_036']?.selected,false,
    'Day removal persists without deleting the researched source record');
  await js('document.querySelector(".activity-filter-panel").scrollIntoView({block:"start",behavior:"instant"})');
  assert.ok(await js('Array.from(document.querySelectorAll(".hub-option-card img.place-specific-photo")).some(x=>x.getAttribute("src")?.includes("Sala%20Apolo"))'),
    'Sala Apolo is illustrated with a specifically licensed venue facade, not a random Barcelona photo');
  assert.ok(await js('Array.from(document.querySelectorAll(".hub-option-card img.place-specific-photo")).some(x=>x.getAttribute("src")?.includes("Razzmatazz"))'),
    'Razzmatazz has a venue-specific Commons photograph with credited license');
  assert.ok(await js('Array.from(document.querySelectorAll(".hub-option-card .place-photo[data-image-unavailable=true]"))'
    +'.filter(el=>el.querySelector(".place-specific-photo"))'
    +'.every(el=>el.querySelector(".place-photo-unavailable-source")?.href.includes("commons.wikimedia.org"))'),
    'If licensed venue photography is offline, the actual Commons file stays openable from the card');
  assert.ok(await js('Array.from(document.querySelectorAll(".hub-option-card .place-photo[data-image-unavailable=true]"))'
    +'.filter(el=>el.querySelector(".place-specific-photo"))'
    +'.every(el=>{const hint=el.querySelector(".place-photo-unavailable");'
    +'const credit=el.querySelector(".place-specific-credit");'
    +'return hint&&credit&&hint.getBoundingClientRect().bottom+2<=credit.getBoundingClientRect().top})'),
    'Offline photo links never overlap the photographer and license line');
  assert.ok(await js('Array.from(document.querySelectorAll(".hub-option-card .place-photo[data-image-unavailable=true]"))'
    +'.filter(el=>el.querySelector(".place-specific-photo"))'
    +'.every(el=>{const ghost=el.querySelector(".place-photo-placeholder>strong");'
    +'return !ghost||getComputedStyle(ghost).display==="none"})'),
    'Failed venue images should not ghost another place title beneath the original-source label');
  await screenshot('52-clubs-mit-echten-lizenzierten-fassadenfotos-desktop.png');
  await screenshot('50-clubs-tagwahl-und-schnellplan-desktop.png');
  await click('.activity-category-chip[data-value=bars]');
  await until(()=>js('document.querySelector(".activity-category-chip[data-value=bars]")?.getAttribute("aria-pressed")==="true"'),
    'Bars & Pubs can be browsed separately from clubs');
  await click('.activity-category-chip[data-value=all]');
  await click('.sidebar [data-action=page][data-value=data]');
  await click('[data-data-section=gaps]>summary');
  await until(()=>js('Boolean(document.querySelector(".coverage-export-controls [data-action=coverage-export]"))'),
    'Missing data audit offers local JSON export');
  assert.ok(await js('document.querySelectorAll(".coverage-reasons").length>0'),
    'Missing entries show individual reasons and contribution instructions');
  assert.ok(await js('Boolean(document.querySelector(".coverage-export-controls [data-action=coverage-export-csv]"))'),
    'Prüflücken sind auch als Excel-kompatible CSV exportierbar');
  await click('.sidebar [data-action=page][data-value=overview]');
  await text('h1','Reiseübersicht');
  assert.equal(await js('document.querySelector(".motion-preference-button")?.getAttribute("aria-pressed")'),"true",
    'Global animation control is accessible from the existing sidebar');
  await click('.motion-preference-button');
  assert.equal(await js('document.documentElement.dataset.motion'),"off",
    'Motion preference can be disabled globally');
  await click('.motion-preference-button');
  assert.equal(await js('document.documentElement.dataset.motion'),"auto",
    'Motion preference can be enabled again');
  await click('.overview-quick-card[data-value=plan]');
  await text('h1', 'Barcelona');
  assert.ok(await js('Boolean(document.querySelector(".day-plan-panel .day-plan-stop-list"))'),
    'Selected travel date displays a full provisional day outline');
  assert.ok(await js('Boolean(document.querySelector(".day-plan-quick-bar [data-action=day-plan-add]"))'),
    'The day planner exposes one-click proposed stops before the long day draft');
  assert.ok(await js('Boolean(document.querySelector(".day-plan-quick-bar [data-action=day-plan-adopt]"))'),
    'A full day draft can be adopted with one click without scrolling to the detailed research list');
  assert.ok(await js('(()=>{const a=document.querySelector(".day-plan-quick-bar")?.getBoundingClientRect();'
    +'const b=document.querySelector(".plan-grid")?.getBoundingClientRect();'
    +'const c=document.querySelector("#day-plan-draft-detail")?.getBoundingClientRect();'
    +'return a&&b&&c&&a.bottom<=b.top+1&&b.bottom<=c.top+1})()'),
    'The actual itinerary is immediately after quick actions; longer research follows below');
  await screenshot('51-tagesplan-kurze-bedienung-1280.png');
  assert.ok(await js('Boolean(document.querySelector(".day-plan-panel [data-action=day-plan-adopt]"))'),
    'Planning candidates can be adopted explicitly without silently rewriting trips');
  await screenshot('27-tagesprogramm-barcelona-1280.png');
  // The tour navigates read-only and is dismissible by Escape.
  await click('[data-action=guide-start]');
  await text('.guide-panel', 'Tagesplan verstehen');
  assert.equal(await js('document.querySelector(".guide-panel")?.getAttribute("aria-modal")'),'true');
  await click('.guide-panel [data-action=guide-next]');
  await text('h1','Interrail Test 2');
  await text('.guide-panel', 'Orte und Routen entdecken');
  await click('.guide-panel [data-action=guide-next]');
  await text('h1','Unterkünfte');
  await text('.guide-panel', 'Unterkünfte vergleichen');
  await click('.guide-panel [data-action=guide-prev]');
  await text('h1','Interrail Test 2');
  await js('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await until(() => js('document.querySelector(".guide-panel") === null'), 'Tour per Escape geschlossen');
  await click('[data-action=guide-start]');
  for(let i=1;i<7;i++)await click('.guide-panel [data-action=guide-next]');
  await text('.guide-panel','Quellen und offene Fragen');
  await click('.guide-panel [data-action=guide-finish]');
  assert.equal(await js('localStorage.getItem("reiseplan-guide-completed")'),'1');
  await until(() => js('document.querySelectorAll(".sidebar-section").length === 3'), 'Gruppierte Navigation');
  await click('.sidebar [data-action=page][data-value=overview]');
  await until(() => js('document.querySelectorAll(".overview-quick-card").length === 4'), 'Vier Schnellzugriffe');
  await js('document.querySelector("#toast")?.replaceChildren()');
  await until(() => js('document.querySelectorAll(".destination-card").length>=4'),'Filmstreifen aus echten Reiseorten');
  await until(()=>js('document.querySelectorAll(".cockpit-route-point").length>=4'),'Routenkarte mit verorteten Städten');
  assert.ok(await js('document.querySelectorAll(".destination-art").length>=4'),
    'Jedes Reiseziel hat eine gestaltete lokale Illustration als Bild-Fallback');
  assert.ok(await js('document.querySelector(".destination-credit")?.textContent.includes("Illustration")===true'),
    'Illustration ist transparent als Symbolik bezeichnet');
  assert.ok(await js('document.querySelector(".cockpit-route-surface")?.textContent.includes("keine berechnete Bahntrasse")'),'Städtefolge bleibt klar als Schema gekennzeichnet');
  await until(() => js('document.querySelectorAll(".cockpit-progress-item").length===4'),'Vier nachvollziehbare Fortschrittsanzeigen');
  assert.equal(await js('document.querySelector(".cockpit-disclaimer")?.textContent.includes("keine bestätigten Buchungen")'),true);
  await screenshot('01-uebersicht-desktop.png');
  const imageStatus=await js('(() => { const img=document.querySelector(".destination-cover img"); if(!img)return "no-photo"; img.dispatchEvent(new Event("error")); return img.style.display; })()');
  assert.ok(['none','no-photo'].includes(imageStatus),'Ein fehlendes Wikimedia-Bild darf keine defekte Bildanzeige hinterlassen');
  if(await js('Boolean(document.querySelector(".cockpit-progress"))')){
    await js('document.querySelector(".cockpit-progress").scrollIntoView({block:"center"})');
    await screenshot('07-dashboard-fortschritt.png');
  }
  await click('.sidebar [data-action=page][data-value=plan]');
  await text('h1','Barcelona');
  await until(()=>js('document.querySelectorAll(".timeline-price").length===document.querySelectorAll(".timeline-event").length'),'Kostenkennzeichen nur bei echten Tageinträgen');
  await text('.travel-day-hud','Plankalendertag');
  await text('.travel-day-hud','mit Weblink');
  assert.equal(await js('Boolean(document.querySelector(".travel-day-track > span"))'),true,
    'Tages-HUD nutzt den tatsächlich ausgewählten Reisetag');
  // Global trip explorer: all source-backed categories, geographic scope,
  // search, real routing attempt and explicitly adding a restaurant to a day.
  await click('.sidebar [data-action=page][data-value=map]');
  await text('h1', 'Interrail Test 2');
  // Default onboarding is intentionally calmer than the advanced tool view.
  assert.ok(await js('document.querySelector(".simple-map-mode")!==null'),
    'Map starts in easy mode for a new visitor');
  assert.equal(await js('document.querySelectorAll(".map-scope-modes button").length'),3,
    'The primary map navigation shows exactly three map scopes');
  assert.equal(await js('getComputedStyle(document.querySelector(".reference-map-floating")).display'),'none',
    'Redundant floating controls are hidden in easy mode');
  assert.ok(await js('document.querySelector("#reference-top-search")?.getBoundingClientRect().width>100'),
    'The reference header has a single visible search input in desktop easy mode');
  assert.equal(await js('getComputedStyle(document.querySelector(".explorer-search")).display'),'none',
    'Duplicate explorer search is hidden in desktop easy mode');
  assert.ok(await js('document.querySelector(".map-scope-modes button").getBoundingClientRect().height>=44 && document.querySelector(".map-find-button").getBoundingClientRect().height>=44'),
    'The visible map modes and direct search use large touch targets');
  await screenshot('23-einfacher-reiseplaner-1280.png');
  await click('[data-action=map-simple-toggle]');
  assert.ok(await js('document.querySelector(".simple-map-mode")===null'),
    'Full map controls can be restored immediately');
  // The three reference-style map modes must change the actual explorer
  // dataset, not only the visual heading or the "total" overlay.
  const allMapCount=await js('document.querySelectorAll(".explorer-place").length');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=day]');
  assert.equal(await js('document.querySelector(".map-scope-modes [data-value=day]").getAttribute("aria-pressed")'),"true");
  await text('.explorer-day-scope-info','Nur die bereits für diesen Tag geplanten Stopps');
  await screenshot('20-planned-day-only-map-1280.png');
  const dayMapTotal=await js('Number((document.querySelector(".explorer-list")?.textContent??"").match(/(\\d+) passende Einträge/)?.[1]??0)');
  const actualDayVisible=await js('document.querySelectorAll(".explorer-place").length');
  assert.ok(actualDayVisible<=allMapCount,
    'A day-only map cannot show more search results than the full trip');
  assert.ok(dayMapTotal<=allMapCount||actualDayVisible<=allMapCount);
  if(await js('document.querySelectorAll(".reference-agenda-select").length>0')){
    const chosen=await js('document.querySelector(".reference-agenda-select")?.dataset.value');
    await click('.reference-agenda-select');
    assert.equal(await js('document.querySelector(".reference-agenda-select")?.getAttribute("aria-pressed")'),"true",
      'Clicking a planned stop highlights the corresponding day entry');
    assert.equal(await js('document.querySelector(".reference-agenda-select")?.dataset.value'),chosen);
    assert.ok(await js('Boolean(document.querySelector(".map-selected-place"))'),
      'Selecting a planned entry reveals its actual map inspector');
  }
  await click('.map-scope-modes [data-action=explorer-scope][data-value=city]');
  assert.equal(await js('document.querySelector(".map-scope-modes [data-value=city]").getAttribute("aria-pressed")'),"true");
  const cityMapCount=await js('document.querySelectorAll(".explorer-place").length');
  assert.ok(cityMapCount>=actualDayVisible,
    'City mode includes the current city research in addition to any planned day');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=trip]');
  assert.equal(await js('document.querySelector(".map-scope-modes [data-value=trip]").getAttribute("aria-pressed")'),"true");
  await text('.travel-map-hud','Kartenpunkte');
  await text('.travel-map-hud','ohne Pin');
  assert.equal(await js('document.querySelector(".travel-map-hud-track")?.getAttribute("role")'),"meter");
  await js('document.querySelector(".travel-map-evidence summary").click()');
  await text('.travel-map-hud','mit Weblink');
  await text('#main', 'Alle passenden Orte');
  await until(()=>js('document.querySelectorAll(".place-price-signal").length>0'),'€-Kennzeichen an Ortslisten');
  assert.equal(await js('(document.querySelector(".explorer-day-notes")?.open??false)'),false,'Zusätzliche Tagesideen anfangs zugeklappt');
  assert.equal(await js('document.querySelector(".explorer-view-advanced")?.open'),false,'Zusätzliche Kartenfilter anfangs zugeklappt');
  await click('.explorer-view-advanced summary');
  await until(()=>js('document.querySelector(".explorer-view-advanced")?.open===true'),'Zusätzliche Kartenfilter erreichbar');
  await click('[data-action=explorer-display][data-value=details]');
  await until(()=>js('document.querySelector(".explorer-view-advanced")?.open===true'),'Listenansicht merkt offene Filter');
  await click('[data-action=explorer-display][data-value=compact]');
  await click('.explorer-view-advanced summary');
  await until(()=>js('document.querySelector(".explorer-view-advanced")?.open===false'),
    'Standardansicht der Karte blendet sekundäre Filter wieder aus');
  await until(()=>js('document.querySelector(".explorer-compact-media .place-thumbnail")!==null'),
    'Kompakte Ortsliste mit Miniaturbild oder Symbol');
  await until(()=>js('document.querySelector(".explorer-place.is-compact, .explorer-place .explorer-more-actions")!==null'),'Sekundäre Ortsaktionen einklappbar');
  assert.equal(await js('document.querySelector(".explorer-more-actions")?.open'),false,'Kompaktliste zunächst ohne Aktionsüberladung');
  // Review at an actual wide desktop CSS viewport; default CI Chrome starts at 1280px.
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await until(()=>js('getComputedStyle(document.querySelector(".map-explorer-split")).gridTemplateColumns.split(" ").length===2'),
    'Desktop atlas has a real two-column split');
  assert.ok(await js('(() => { const e=document.querySelector("#reference-top-search")?.getBoundingClientRect(),b=document.querySelector(".reference-global-search")?.getBoundingClientRect(); return e&&b&&e.width>120&&e.left>=b.left-1&&e.right<=b.right+1&&Math.abs(e.top-b.top)<12; })()'),
    'Desktop-Suche steht sichtbar im Kopfbereich, ohne doppelte Suchleiste');
  assert.equal(await js('getComputedStyle(document.querySelector(".explorer-categories")).flexWrap'),'nowrap',
    'Ortskategorien sind eine scrollbare Zeile statt mehrerer Kachelreihen');
  await until(()=>js('document.querySelector("#map").getBoundingClientRect().top < window.innerHeight*.62'),
    'Die sichtbare Kartenfläche muss im ersten Desktop-Screen beginnen, nicht nur das Panel');
  await js('window.scrollTo({top:0,behavior:"instant"})');
  await screenshot('08-atlas-oben-desktop.png');
  assert.ok(await js('(() => { const shell=document.querySelector(".reference-travel-shell"),aside=document.querySelector(".reference-travel-shell>.sidebar"),m=document.querySelector(".reference-map-workspace>.map-panel"),l=document.querySelector(".reference-map-workspace>.explorer-right");if(!shell||!aside||!m||!l)return false;const mr=m.getBoundingClientRect(),lr=l.getBoundingClientRect();return getComputedStyle(aside).display==="none"&&mr.width>lr.width*2&&mr.top<210&&mr.left>lr.left; })()'),
   'Travel reference: full-width map, no permanent sidebar, map aligned within first 210px');
  await js('window.__mapBeforeScope = document.querySelector("#map")');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=city]');
  assert.ok(await js('window.__mapBeforeScope === document.querySelector("#map")'),
    'Wechsel von Kartenmodus erhält dasselbe Leaflet-Element ohne Karten-Neustart');
  assert.ok(await js('document.querySelector(".map-scope-modes [data-value=city]")?.getAttribute("aria-pressed")==="true"'),
    'City mode highlights the independent city discovery option');
  await screenshot('22-reference-city-map-1440.png');
   await screenshot('29-freie-stadtkarte-desktop-1440.png');
  assert.ok(await js('(() => { const root=document.querySelector(".reference-map-workspace"),map=root?.querySelector("#map"),head=root?.querySelector(".map-panel>.panel-head"),alert=root?.querySelector(".reference-map-schedule-notice"); if(!map||!head||!alert)return false; const m=map.getBoundingClientRect(),h=head.getBoundingClientRect(); return h.bottom<=m.top+3&&m.height>=475&&alert.querySelector("summary")?.textContent.includes("2027"); })()'),
    'V72 city view: toolbar remains above larger map, calendar caveat stays available in compact disclosure');
  assert.ok(await js('(() => {const gallery=document.querySelector(".reference-discovery"),map=document.querySelector("#map");if(!gallery||!map)return false;const g=gallery.getBoundingClientRect(),m=map.getBoundingClientRect();return g.top>=m.bottom-10&&g.top<m.bottom+300;})()'),
    'V72 licensed photo discovery follows the larger map without an unrelated report in between');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=trip]');
  assert.ok(await js('document.querySelector(".map-scope-modes [data-value=trip]")?.getAttribute("aria-pressed")==="true"'),
    'Whole trip mode is separate from the current day');
  assert.ok(await js('document.querySelector(".trip-schematic-flow")!==null'),
    'Route animation is present only as a schematically labeled line when motion is enabled');
  // V74: play the real story to check the rendered panel, not only a CSS
  // selector in a static unit test. Stop it again before unrelated UI checks.
  await click('.map-panel>.panel-head [data-action=route-story-play]');
  await until(()=>js('document.querySelector("#route-story-player")?.hidden===false'),
    'V74 story player becomes visible after pressing Route abspielen');
  assert.ok(await js('(() => {const p=document.querySelector("#route-story-player"),m=document.querySelector("#map");if(!p||!m)return false;const a=p.getBoundingClientRect(),b=m.getBoundingClientRect(),bg=getComputedStyle(p).backgroundColor;const alpha=Number(bg.split(",").at(-1).replace(")",""));return a.width<=310&&a.height<=205&&a.width<b.width*.55&&a.height<b.height*.5&&alpha>.4&&alpha<.85})()'),
    'V74 animation is a small transparent overlay with most of the map still visible');
  assert.equal(await js('document.querySelector("#route-story-ideas")?.hidden'),true,
    'V74 full city recommendations are hidden until explicitly requested');
  if(await js('document.querySelector(".route-story-ideas-toggle")?.hidden===false')){
    await click('.route-story-ideas-toggle');
    assert.equal(await js('document.querySelector(".route-story-ideas-toggle")?.getAttribute("aria-expanded")'),'true');
    assert.equal(await js('document.querySelector("#route-story-ideas")?.hidden'),false);
    await click('.route-story-ideas-toggle');
    assert.equal(await js('document.querySelector("#route-story-ideas")?.hidden'),true);
  }
  await screenshot('30-v74-translucent-route-animation-1440.png');
  await click('#route-story-player [data-action=route-story-stop]');
  await until(()=>js('document.querySelector("#route-story-player")?.hidden===true'),
    'V74 player closes and returns control of map to the user');
  assert.ok(await js('(() => { const m=document.querySelector(".reference-map-workspace>.map-panel")?.getBoundingClientRect(),a=document.querySelector(".reference-map-workspace>.explorer-right")?.getBoundingClientRect();return m&&a&&m.left>a.left&&m.width>a.width*1.12; })()'),
    'Reference layout uses compact agenda on left and wider interactive map on right');
  assert.ok(await js('Boolean(document.querySelector(".reference-map-intro h1"))'),
    'Source photo / airy city header appears before the map');
  assert.ok(await js('Boolean(document.querySelector(".map-scope-modes [data-action=explorer-scope]"))'),
    'Floating map route/day controls are real click actions');
  assert.ok(await js('Boolean(document.querySelector(".map-browse-panel"))'),
    'City browse categories are present beside the map, independently of the day');
  assert.ok(await js('Boolean(document.querySelector(".reference-discovery-card,.reference-discovery-empty"))'),
    'Only proven licensed pictures enter the discovery strip');
  assert.ok(await js('(() => {const d=document.querySelector(".reference-stage-days")?.getBoundingClientRect(),m=document.querySelector(".reference-map-workspace>.map-panel")?.getBoundingClientRect();return d&&m&&d.right<=m.left+2&&Math.abs(d.top-m.top)<10})()'),
    'Photo references: day date tabs and Leaflet map begin on the same row');
  assert.ok(await js('(() => {const d=document.querySelector(".reference-stage-days")?.getBoundingClientRect(),l=document.querySelector(".reference-map-workspace>.explorer-right")?.getBoundingClientRect(),m=document.querySelector(".reference-map-workspace>.map-panel")?.getBoundingClientRect();return d&&l&&m&&l.top>=d.bottom-15&&l.top<d.bottom+25&&l.top<m.bottom-130})()'),
    'Explorer agenda and search directly follow day carousel, not below full map height');
  assert.ok(await js('document.querySelectorAll(".map-browse-category").length===5'),
    'Browse panel exposes five categories even without a daily plan');
  assert.ok(await js('(() => {const box=document.querySelector(".reference-map-workspace");const gallery=box?.querySelector(":scope > .reference-discovery");const panel=box?.querySelector(":scope > .map-panel");const canvas=panel?.querySelector("#map");if(!gallery||!panel||!canvas)return false;const p=panel.getBoundingClientRect(),m=canvas.getBoundingClientRect(),g=gallery.getBoundingClientRect();return innerWidth<1180||(g.top>=m.bottom-15&&g.top<m.bottom+220&&g.left>=p.left-5&&g.width<=p.width+10);})()'),
     'Barcelona reference: photo carousel sits directly below the right-hand map, not as a full-width block');
  await screenshot('28-reference-embedded-photo-timeline-1440.png');
  await screenshot('18-reference-day-map-desktop-1440.png');
  if(await js('Boolean(document.querySelector(".reference-discovery-save"))')){
    const before=await js('document.querySelector(".reference-discovery-save").getAttribute("aria-pressed")');
    const itemId=await js('document.querySelector(".reference-discovery-save").dataset.value');
    await click('.reference-discovery-save');
    assert.notEqual(await js('document.querySelector(".reference-discovery-save").getAttribute("aria-pressed")'),
      before,'The photo bookmark button must change actual saved state');
    await js('document.querySelector(".reference-discovery-card")?.scrollIntoView({block:"center",behavior:"instant"})');
    await screenshot('21-licensed-photo-bookmark-1440.png');
    assert.equal(await js('document.querySelector(".reference-discovery-save").dataset.value'),
      itemId,'The same sourced photo remains in the gallery after saving');
    await click('.reference-discovery-save');
    assert.equal(await js('document.querySelector(".reference-discovery-save").getAttribute("aria-pressed")'),
      before,'A second bookmark click restores the original saved state');
    await js('document.querySelector(".map-explorer-split")?.scrollIntoView({block:"start",behavior:"instant"})');
  }
  await js('document.querySelector(".map-design-details:not([open]) > summary")?.click()');
  await click('[data-action=map-motion][data-value=off]');
  assert.equal(await js('document.documentElement.dataset.motion'),'off');
  assert.equal(await js('getComputedStyle(document.querySelector(".travel-map-hud")).animationName'),'none',
    'Benutzerpräferenz unterdrückt die HUD-Animation');
  await click('[data-action=map-motion][data-value=on]');
  assert.equal(await js('document.documentElement.dataset.motion'),'auto');
  await screenshot('16-hud-motion-controls-desktop.png');
  // Do not leave the map design section open: the original later test
  // explicitly opens it to check style switching and saved preferences.
  await js('document.querySelector(".map-design-details[open] > summary")?.click()');
  await until(()=>js('document.querySelector(".map-design-details")?.open===false'),
    'Map design details restored to initial closed state');
  await js('document.querySelector(".map-explorer-split").scrollIntoView({block:"start"})');
  await screenshot('02-atlas-desktop-map-list.png');
  assert.ok(await js('document.querySelector("#map").compareDocumentPosition(document.querySelector(".day-route-builder")) & 4'),
    'Karte muss vor dem umfangreichen Tagesrouten-Builder stehen');
  assert.equal(await js('document.querySelector(".explorer-route-settings")?.open'),false,
    'Erweiterter Routenplaner ist anfangs zugeklappt');
  await until(() => js('Boolean(document.querySelector(".explorer-list.is-compact"))'), 'Kompakte Ortsliste');
  assert.equal(await js('document.querySelector(".map-explorer-split > .explorer-right .explorer-toolbar")!==null'),true,
    'Suche und Filter stehen im rechten Atlasbereich statt über der Karte');
  await js('document.querySelector(".explorer-place")?.dispatchEvent(new PointerEvent("pointerover",{bubbles:true}))');
  assert.equal(await js('document.querySelector(".explorer-place")?.classList.contains("atlas-hover")'),true,
    'Hover hebt denselben Listenort ohne Karten-Rendering hervor');
  await js('document.querySelector(".explorer-place")?.dispatchEvent(new PointerEvent("pointerout",{bubbles:true}))');
  assert.equal(await js('document.querySelector(".explorer-list.is-compact .group-vote-snippet")===null'),true,
    'Kompaktliste ohne wiederholte Gruppenabstimmungs-Kästen');
  assert.ok(await js('document.querySelector(".explorer-more-actions [data-action=vote-open]")!==null'),
    'Gruppenabstimmung bleibt über weitere Aktionen erreichbar');
  await until(() => js('Boolean(document.querySelector(".map-explorer-split > .map-panel")) && Boolean(document.querySelector(".map-explorer-split > .explorer-right .explorer-list"))'), 'Karte und Liste nebeneinander');
  await click('[data-action=explorer-focus][data-value="local:bormuth"]');
  await until(() => js('Boolean(document.querySelector(".map-selected-place"))'),'Auswahlvorschau direkt auf der Karte');
  await until(() => js('document.querySelector(".explorer-place[data-place-id=\\\"local:bormuth\\\"]")?.dataset.selected==="true"'),'Ortsliste hebt gewählten Marker hervor');
  await click('.map-selected-actions [data-action=explorer-list-focus]');
  await until(() => js('Boolean(document.querySelector(".explorer-list .explorer-place[data-selected=true]"))'),'Kartenauswahl in Liste gefunden');
  await click('[data-action=explorer-viewport]');
  await until(() => js('document.querySelector("[data-action=explorer-viewport]")?.getAttribute("aria-pressed")==="true"'), 'Liste nur für Kartenausschnitt');
  await click('[data-action=explorer-viewport]');
  await click('[data-action=explorer-display][data-value=details]');
  await until(() => js('!document.querySelector(".explorer-list")?.classList.contains("is-compact")'), 'Ausführliche Ortskarten');
  await click('[data-action=explorer-display][data-value=compact]');
  await click('[data-action=explorer-save][data-value="local:bormuth"]');
  await until(() => js('document.querySelector(".explorer-place[data-place-id=\\\"local:bormuth\\\"]")?.dataset.bookmarked==="true"'), 'Karten-Merkliste');
  assert.ok(await js('JSON.parse(localStorage.getItem("reiseplan-map-shortlist:interrail_classic")).includes("local:bormuth")'));
  await click('[data-action=explorer-saved-only]');
  await until(() => js('document.querySelectorAll(".explorer-place").length===1'),'Nur gemerkte Orte');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=city]');
  assert.equal(await js('document.querySelector(".reference-map-floating [data-action=explorer-saved-only]")?.getAttribute("aria-pressed")'),"false",
    'Beim Scope-Wechsel darf ein unsichtbarer gespeicherte-Orte-Filter nicht aktiv bleiben');
  await until(()=>js('document.querySelectorAll(".explorer-place").length>1'),
    'Nach Scope-Wechsel wieder mehrere passende Stadtorte sichtbar');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=trip]');
  await text('#main', 'Reiseroute entdecken');
  assert.ok(await js('Array.from(document.querySelectorAll("link[rel=stylesheet]")).some(x=>x.getAttribute("href")==="/readability-day-v50.css")'),
    'Screenshot-specific contrast repair loads after legacy styles');
  await js('document.documentElement.dataset.theme="dark"');
  assert.equal(await js('getComputedStyle(document.querySelector(".reference-map-intro h1")).color'),
    'rgb(33, 59, 45)',
    'V95 keeps dark readable text on a deliberate pale map utility header');
  assert.equal(await js('getComputedStyle(document.querySelector(".reference-discovery-title strong")).color'),
    'rgb(237, 246, 238)',
    'V94 dark photo cards use light text on a dark surface, not legacy dark ink');
  assert.equal(await js('getComputedStyle(document.querySelector(".reference-discovery-card")).backgroundColor'),
    'rgb(32, 47, 38)',
    'V94 dark photo card surface is actually dark behind the light title');
  await js('document.documentElement.dataset.theme="light"');
  await js('document.querySelector(".reference-map-intro").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('50-lesbare-kartenkopfzeile-und-bildkarten-1280.png');
  assert.equal(await js('Array.from(document.querySelectorAll(".reference-discovery-euro")).some(el=>el.textContent.trim()==="€?")'),false,
    'No question-mark price badges in the route photo carousel');

  await until(() => js('document.querySelectorAll(".route-city-step").length >= 4'), 'Interaktive Stadtetappen');
  await until(() => js('document.querySelectorAll(".map-legend-control").length===5'),'Fünf anklickbare Kartenkategorien');
  await click('.map-legend-control[data-value=food]');
  await until(() => js('document.querySelector(".map-legend-control[data-value=food]")?.getAttribute("aria-pressed")==="true"'),'Kategorie direkt auf Kartenlegende gewählt');
  await click('[data-action=explorer-reset]');
  await until(() => js('document.querySelector(".explorer-scope")?.textContent.includes("Gesamte Reise")'), 'Kartenfilter zurückgesetzt');
  await click('.map-design-details summary');
  await until(()=>js('document.querySelector(".map-design-details")?.open===true'),'Kartengestaltung über Details erreichbar');
  await click('[data-action=map-tone][data-value=sand]');
  await until(()=>js('document.querySelector(".map-design-details")?.open===true'),'Karten-Designpanel bleibt nach Stilwahl geöffnet');
  await click('[data-action=map-tone][data-value=midnight]');
  await until(() => js('document.querySelector(".map-wrap")?.dataset.mapTone === "midnight"'), 'Midnight Kartenstil');
  assert.equal(await js('localStorage.getItem("reiseplan-map-tone")'),'midnight');
  await click('[data-action=map-tone][data-value=sand]');
  await until(() => js('document.querySelector(".map-wrap")?.dataset.mapTone === "sand"'), 'Sand Kartenstil');
  await click('[data-action=map-density][data-value=detail]');
  await until(()=>js('document.querySelector("[data-action=map-density][data-value=detail]")?.getAttribute("aria-pressed")==="true"'),
    'Detaillierte Kartenmarker auswählbar');
  assert.equal(await js('localStorage.getItem("reiseplan-map-density")'),'detail');
  await click('[data-action=map-density][data-value=calm]');
  await until(()=>js('document.querySelector("[data-action=map-density][data-value=calm]")?.getAttribute("aria-pressed")==="true"'),
    'Ruhige Kartenmarker-Dichte aktiv');
  assert.equal(await js('localStorage.getItem("reiseplan-map-density")'),'calm');
  await screenshot('38-ruhige-kartenmarker-desktop.png');
  await until(()=>js('Boolean(document.querySelector(".map-unlocated-review"))'),
    'Quellenbasierte Prüfliste ohne erfundene POI-Koordinaten');
  await until(()=>js('Boolean(document.querySelector(".map-evidence-review"))'),
    'Vorhandene aber unbelegte Kartenpositionen erhalten getrennte Quellenliste');
  await click('.map-evidence-review > summary');
  await until(()=>js('document.querySelector(".map-evidence-review")?.open===true'),
    'Koordinaten-Belegliste aufklappbar');
  await until(()=>js('Boolean(document.querySelector(".map-evidence-review [data-action=map-evidence-type][data-value=provider]"))'),
    'Anbieterquellen können gezielt getrennt geprüft werden');
  assert.ok(await js('document.querySelectorAll(".map-evidence-review .map-evidence-position").length>0'),
    'Unverified provider pins expose their saved coordinates instead of promising exact doors');
  assert.ok(await js('Array.from(document.querySelectorAll(".map-evidence-review .map-evidence-record a")).some(a=>a.getAttribute("href")?.startsWith("https://www.openstreetmap.org/?mlat="))'),
    'One-click review opens the existing pin in OSM without overwriting it');
  await click('.map-evidence-review .map-evidence-source-links>summary');
  await until(()=>js('document.querySelector(".map-evidence-review .map-evidence-source-links")?.open===true'),
    'Independent object name search expands in the existing-pin evidence card');
  assert.ok(await js('Array.from(document.querySelectorAll(".map-evidence-review .map-evidence-review-links a")).some(a=>a.getAttribute("href")?.startsWith("https://www.openstreetmap.org/search?query="))'),
    'The secondary OSM name search is linked separately from the unverified point');
  await js('document.querySelector(".map-evidence-review").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('47-ungepruefte-pins-quellenvergleich-desktop.png');
  await click('.map-evidence-review .map-evidence-source-links>summary');
  await click('.map-evidence-review [data-action=map-evidence-type][data-value=provider]');
  await until(()=>js('document.querySelector(".map-evidence-review [data-action=map-evidence-type][data-value=provider]")?.getAttribute("aria-pressed")==="true"'),
    'Anbieterpositionen sind filterbar');
  await click('.map-evidence-review [data-action=map-evidence-type][data-value=all]');
  await until(()=>js('Boolean(document.querySelector("#map-evidence-search"))'),
    'Unabhängige Quellenprüfungen sind durchsuchbar');
  await js('document.querySelector("#map-evidence-search").value="__kein_objekt__"');
  await click('.map-evidence-search [data-action=map-evidence-search]');
  await until(()=>js('document.querySelector(".map-evidence-review .map-unlocated-count")?.textContent.includes("0 von")'),
    'Quellenprüfung sucht innerhalb vorhandener, ungeprüfter Punkte');
  await click('.map-evidence-search [data-action=map-evidence-clear]');
  await until(()=>js('document.querySelector(".map-evidence-review .map-unlocated-count")?.textContent.includes(" von ")'),
    'Die Suche ist rücksetzbar');
  await screenshot('43-koordinaten-nachweispruefung-desktop.png');

  assert.equal(await js('Boolean(document.querySelector(".map-panel .map-unlocated-review"))'),false,
    'Die lange Prüfliste darf nicht innerhalb des sticky Kartenpanels sitzen');
  assert.equal(await js('document.querySelector(".map-unlocated-review")?.previousElementSibling?.classList.contains("map-explorer-split")'),true,
    'Prüfliste steht als eigener Bereich direkt unter der Karte');

  assert.equal(await js('document.querySelectorAll("#map .city-reference-icon").length'),0,
    'Ungenaue Stadt-Sammelmarker sind standardmäßig ausgeblendet');
  await click('.map-unlocated-review > summary');
  await until(()=>js('document.querySelector(".map-unlocated-review")?.open===true'),
    'Prüfliste für Orte ohne genaue Position aufklappbar');
  await text('.map-unlocated-review','Alle fehlenden Kartenpunkte im Daten-Audit prüfen');
  await until(()=>js('Boolean(document.querySelector(".map-unlocated-facets [data-value=all]"))'),
    'Filter für ungeklärte Koordinaten bereit');
  await click('.map-unlocated-facets [data-action=map-unlocated-filter][data-value=sourced-address]');
  await until(()=>js('document.querySelector(".map-unlocated-facets [data-value=sourced-address]")?.getAttribute("aria-pressed")==="true"'),
    'Öffentlich veröffentlichte Adressen ohne bestätigten Einzelpunkt gezielt filterbar');
  assert.ok(await js('document.querySelectorAll(".map-unlocated-review .map-unlocated-public-address").length>0'),
    'Mindestens eine echte veröffentlichte Hausadresse wird mit voller Anschrift gezeigt');
  assert.ok(await js('document.querySelector(".map-unlocated-review .map-unlocated-record[data-review-priority=critical]")!==null'),
    'Source-only list prioritizes identity and floor-vs-number conflicts');
  assert.ok(await js('document.querySelector(".map-unlocated-review .map-unlocated-next-check")!==null'),
    'Each published unresolved address offers a specific manual verification step');
  await click('.map-unlocated-review .map-unlocated-next-check>summary');
  await until(()=>js('document.querySelector(".map-unlocated-review .map-unlocated-next-check")?.open===true'),
    'Manual verification instructions expand without making unverified pins');
  await text('.map-unlocated-review','Nur Recherchehinweis');
  await js('document.querySelector(".map-unlocated-review").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('49-offene-hausadressen-priorisierte-quellenpruefung.png');
  await text('.map-unlocated-review','Adresse in Google Maps suchen');
  await click('.map-unlocated-review .map-unlocated-extra-actions > summary');
  await until(()=>js('document.querySelector(".map-unlocated-review .map-unlocated-extra-actions")?.open===true'),
    'Additional public address source links remain accessible on deliberate expansion');
  assert.ok(await js('document.querySelectorAll(".map-unlocated-review .map-unlocated-extra-links a").length>0'),
    'The exact source/map links stay available, even in compact address rows');
  await click('.map-unlocated-review .map-unlocated-extra-actions > summary');
  await js('document.querySelector(".map-unlocated-review").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('46-hausadressen-quellenpruefung-desktop.png');
  await click('.map-unlocated-facets [data-action=map-unlocated-filter][data-value=concept]');
  await until(()=>js('document.querySelector(".map-unlocated-facets [data-value=concept]")?.getAttribute("aria-pressed")==="true"'),
    'Konzept-Orte separat filterbar');
  await click('.map-unlocated-facets [data-action=map-unlocated-filter][data-value=all]');
  await until(()=>js('document.querySelector(".map-unlocated-facets [data-value=all]")?.getAttribute("aria-pressed")==="true"'),
    'Alle offenen Positionen wieder sichtbar');
  await js('document.querySelector("#map-unlocated-search").value="__keine_realen_orte__"');
  await click('.map-unlocated-search [data-action=map-unlocated-search]');
  await until(()=>js('document.querySelector(".map-unlocated-count")?.textContent.includes("0 von")'),
    'Öffentliche Prüfliste nach Stichwort suchbar');
  await click('.map-unlocated-search [data-action=map-unlocated-clear]');
  await until(()=>js('Number(document.querySelectorAll(".map-unlocated-record").length)>0'),
    'Suche ist ohne Datenverlust rücksetzbar');
  await js('document.querySelector(".map-unlocated-review").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('39-ungepruefte-orte-karte-desktop.png');
  await click('.map-unlocated-review [data-action=explorer-references]');
  await until(()=>js('localStorage.getItem("reiseplan-map-city-references")==="on"'),
    'Optionale Stadt-Hinweismarker einschaltbar');
  await click('.map-unlocated-review [data-action=explorer-references]');
  await until(()=>js('localStorage.getItem("reiseplan-map-city-references")==="off"'),
    'Optionale Stadt-Hinweismarker ausblendbar und lokal gespeichert');
  await click('[data-action=map-expand]');
  await until(() => js('document.querySelector(".map-panel")?.classList.contains("map-immersive")'), 'Große Kartendarstellung');
  await click('[data-action=map-expand]');
  await until(() => js('!document.querySelector(".map-panel")?.classList.contains("map-immersive")'), 'Normale Kartendarstellung');
  await until(() => js('document.querySelectorAll("#map .photo-marker-container, #map .pin.place-activity, #map .poi-cluster-icon").length > 0'),
    'Kategorie-Pins im Reiseatlas');
  await text('#main', 'Alle Reiseorte');
  await click('[data-action=explorer-scope][data-value=city]');
  await until(()=>js('document.querySelector(".map-atlas-hud strong")?.textContent.includes("Barcelona")===true'),'Reisedatum und Stadt als Kartenkontext');
  if(await js('document.querySelectorAll(".map-day-stop").length>0')){
    await click('.map-day-stop');
    await until(()=>js('document.querySelector(".map-day-stop")?.getAttribute("aria-pressed")==="true"'),
      'Tagesstopp über Zeitachse auswählbar');
  }
  await click('[data-action=explorer-group][data-value=food]');
  await until(() => js('(document.querySelectorAll("#map .photo-marker-container .group-food").length + document.querySelectorAll("#map .poi-cluster-icon").length) > 0 && document.querySelectorAll("#map .photo-marker-container .group-lodging").length === 0'), 'Nur Restaurantkategorie im Städtefilter');
  await text('#main', 'Bormuth');
  await click('[data-action=explorer-nearby][data-value="local:bormuth"]');
  await until(() => js('document.querySelector(".explorer-nearby-bar")?.textContent.includes("Bormuth")'), 'Echte Umkreissuche');
  await until(() => js('Boolean(document.querySelector("#map .explorer-nearby-ring"))'),'Sichtbarer Radiusring auf der Karte');
  await click('[data-action=explorer-near-radius][data-value="1"]');
  await until(() => js('document.querySelector(".explorer-nearby-bar [data-action=explorer-near-radius][aria-pressed=true]")?.dataset.value==="1"'), '1-km-Umkreis');
  await click('[data-action=explorer-near-clear]');
  await until(() => js('!document.querySelector(".explorer-nearby-bar")'), 'Umkreissuche deaktiviert');
  await set('#map-search', 'Bormuth');
  await click('[data-action=explorer-search]');
  await until(() => js('document.querySelectorAll(".explorer-place").length === 1'), 'Restaurantsuche');
  await text('.explorer-place', 'Bormuth');
  await until(()=>js('Boolean(document.querySelector("#map .photo-marker-container[title*=\\\"Bormuth\\\"]"))'),'Visible place marker for Bormuth');
  await click('#map .photo-marker-container[title*="Bormuth"]');
  await until(()=>js('document.querySelector(".map-selected-place")?.textContent.includes("Bormuth")===true'),
    'Clicking a real map marker synchronizes the selected preview');
  assert.ok(await js('(() => { const element=document.querySelector(".map-selected-place"); const r=element?.getBoundingClientRect();return r&&r.width>120&&r.height>50&&getComputedStyle(element).visibility==="visible"; })()'),
    'Auswahlvorschau muss tatsächlich sichtbar sein, nicht nur im DOM stehen');
  assert.equal(await js('document.querySelector(".map-wrap").contains(document.querySelector(".map-legend"))'),false,
    'Kartenlegende ist ein eigenes Layout-Element und kein Teil des Karten-Overlays');
  assert.ok(await js('(() => { const p=document.querySelector(".map-selection-preview")?.getBoundingClientRect(); const m=document.querySelector("#map")?.getBoundingClientRect(); return p&&m&&p.bottom<=m.bottom+1&&p.top>=m.top-1; })()'),
    'Kartenauswahl muss vollständig innerhalb des sichtbaren Leaflet-Ausschnitts bleiben');
  assert.equal(await js('document.querySelectorAll("#map .leaflet-popup").length'),0,
    'No redundant Leaflet popup may hide the selected map marker');
  assert.equal(await js('document.querySelector("#detail-container .map-detail")===null'),true,
    'Do not duplicate the full place profile under the explorer map');
  await until(()=>js('document.querySelector(".explorer-place")?.dataset.selected==="true"'),
    'Clicking a map marker synchronizes the result list');
  await js('document.querySelector(".map-explorer-split").scrollIntoView({block:"start"})');
  await screenshot('03-atlas-ausgewaehlter-ort.png');
  await set('#map-search', '');
  await click('[data-action=explorer-search]');
  await text('#main', 'Taberna Nardi');
  await text('#main', 'Mehrstopp-Tagesroute');
  await click('[data-action=day-route-add][data-value="local:bormuth"]');
  await click('[data-action=day-route-add][data-value="local:nardi"]');
  await text('.day-route-builder', '2/8 gewählt');
  await until(() => js('document.querySelectorAll(".route-studio-stop").length === 2'), 'Beide Route-Studio-Stopps');
  await until(() => js('document.querySelectorAll("#map .route-studio-map-pin").length === 2'), 'Nummerierte Kartenstopps');
  await until(() => js('document.querySelectorAll("#map .route-studio-map-line.schematic").length === 1'),
    'Nicht berechnete Luftlinie als ausdrücklich gestrichelter Weg');
  await text('.route-studio', '0 von 1 Fußetappen berechnet');
  assert.equal(await js('document.querySelectorAll("#map .route-studio-time-pill").length'),0,
    'Schematic connectors must never carry measured walking duration labels');
  assert.equal(await js('document.querySelectorAll("#map .route-studio-direction-icon").length'),0,
    'Schematic route must not pretend to have a calculated walking direction');
  assert.equal(await js('document.querySelectorAll("#map .route-studio-hit-target.leaflet-interactive").length'),1,
    'Schematic map path stays selectable through a generous invisible hit target');
  assert.equal(await js('document.querySelectorAll("#map .route-studio-map-flow").length'),0,
    'Unrouted straight lines must remain still even if route animations are enabled');
  await js('document.querySelector(".day-route-builder").scrollIntoView({block:"center"})');
  await screenshot('44-route-studio-schematic-desktop.png');
  await click('[data-action=day-route-focus][data-value="0"]');
  await until(() => js('document.querySelector(".route-studio-stop[aria-pressed=true]")?.dataset.value === "0"'),
    'Fokus auf erstem Tagesstopp');
  await click('[data-action=day-route-next]');
  await until(() => js('document.querySelector(".route-studio-stop[aria-pressed=true]")?.dataset.value === "1"'),
    'Navigation zum nächsten Stopp');
  await click('[data-action=day-route-display][data-value=focus]');
  await until(() => js('document.querySelector(".route-studio-settings [data-value=focus]")?.getAttribute("aria-pressed") === "true"'),
    'Stopp-Fokusmodus');
  await click('[data-action=day-route-fit]');
  await until(() => js('document.querySelectorAll("#map .route-studio-map-pin").length === 2'),
    'Ganze Tagesroute auf der Karte erhalten');
  await click('[data-action=day-route-display][data-value=all]');
  await until(() => js('document.querySelector(".route-studio-settings [data-value=all]")?.getAttribute("aria-pressed") === "true"'),
    'Zurück zur kompletten Etappenübersicht');
  assert.equal(pageErrors.length,0,'Keine Browser-JavaScript-Ausnahmen in Routen-Navigation');
  await click('[data-action=day-route-optimize]');
  await text('.day-route-builder', 'Luftlinien-Vorsortierung');
  assert.equal(store.current('interrail_classic').state.edits['local:nardi'], undefined);
  await click('[data-action=explorer-start][data-value="local:bormuth"]');
  await until(() => js('document.querySelector(".explorer-route-settings")?.open===true'),'Routenplaner öffnet sich bei Startauswahl');
  await click('[data-action=explorer-end][data-value="local:nardi"]');
  await until(() => js('document.querySelector(".explorer-status")?.textContent.includes("Fußweg")'),
    'Fußroute oder ehrliche Router-Fehlermeldung');
  await text('#main', 'Google Maps · ÖPNV A → B');
  await click('[data-action=explorer-swap]');
  await until(() => js('document.querySelector(".explorer-directions")?.textContent.includes("Taberna Nardi")'),
    'Start und Ziel tauschen');
  await until(() => js('Boolean(document.querySelector(".explorer-route-result"))'), 'Interaktives Routenresultat');
  await click('[data-action=explorer-zoom-route]');
  assert.equal(pageErrors.length,0,'Keine Browser-JavaScript-Ausnahme beim Tauschen/Zoomen: '+pageErrors.join(' | '));
  await click('[data-action=choose][data-value="local:nardi"]');
  await text('dialog', 'Aktivität einplanen');
  await save();
  assert.equal(store.current('interrail_classic').state.edits['local:nardi'].selected, true);
  assert.equal(store.current('interrail_swiss').state.edits['local:nardi'], undefined);
  // Unified sourced details, image editing and variant-scoped group voting.
  await click('[data-action=details][data-value="local:nardi"]');
  await until(() => js('Boolean(document.querySelector("dialog .place-profile"))'), 'Einheitliches Detailprofil im Dialog');
  await text('dialog', 'Preis für die Gruppe');
  await until(()=>js('document.querySelectorAll("dialog .inspector-tab").length===5'),
    'five real inspector tabs');
  await screenshot('11-place-inspector-overview.png');
  await click('dialog [data-action=inspector-tab][data-value=cost]');
  assert.equal(await js('document.querySelector("#inspector-panel-cost").hidden'),false);
  assert.equal(await js('document.querySelector("#inspector-panel-overview").hidden'),true);
  await screenshot('12-place-inspector-cost.png');
  await click('dialog [data-action=inspector-tab][data-value=sources]');
  await text('dialog #inspector-panel-sources','Webbelege');
  await click('dialog [data-action=inspector-tab][data-value=nearby]');
  await text('dialog #inspector-panel-nearby','Luftlinie');
  await click('dialog [data-action=inspector-tab][data-value=overview]');
  assert.equal(await js('document.querySelector("#inspector-panel-overview").hidden'),false);
  await click('dialog [data-action=inspector-compare-add]');
  await text('dialog','Aus Vergleich nehmen');
  await until(()=>js('Boolean(document.querySelector("dialog .inspector-footer-buttons [data-action=inspector-neighbor]"))'),
    'an adjacent candidate of same city and category');
  await click('dialog .inspector-footer-buttons [data-action=inspector-neighbor]');
  await click('dialog [data-action=inspector-compare-add]');
  await text('dialog','Vergleich (2)');
  await click('dialog [data-action=inspector-compare-view]');
  await text('dialog','Optionen gegenüberstellen');
  assert.equal(await js('document.querySelectorAll("dialog [data-action=inspector-compare-detail]").length'),2);
  assert.equal(await js('document.querySelectorAll("dialog .inspector-comparison-table tr").length>=9'),true);
  await screenshot('14-place-comparison-desktop.png');
  await click('dialog [data-action=inspector-compare-clear]');
  assert.equal(await js('document.querySelector("dialog").open'),false);
  await click('[data-action=details][data-value="local:nardi"]');
  await click('dialog [data-action=photo-edit]');
  await text('dialog','Foto und Bildquelle');
  await set('dialog [name=url]', 'https://upload.wikimedia.org/wikipedia/commons/example.jpg');
  await set('dialog [name=credit]', 'Eigene Testfreigabe · Beispielbild');
  await set('dialog [name=sourceUrl]', 'https://commons.wikimedia.org/wiki/File:example.jpg');
  await save();
  assert.equal(store.current('interrail_classic').state.placePhotos['local:nardi'].credit,
    'Eigene Testfreigabe · Beispielbild');
  assert.equal(store.current('interrail_swiss').state.placePhotos?.['local:nardi'],undefined);
  // chooseItem switched the UI to the daily plan; switch back to map explorer
  // before inspecting image cards and entering the separate traveller votes.
  await click('.sidebar [data-action=page][data-value=map]');
  await until(() => js('Boolean(document.querySelector(".explorer-place[data-place-id=\\\"local:nardi\\\"] img"))'), 'Quellenfoto in Ortskarten');
  await click('[data-action=vote-open][data-value="local:nardi"]');
  await text('dialog','Gruppenbewertung');
  await set('dialog select[name=p1]', '5');
  await set('dialog select[name=p2]', '3');
  await js('document.querySelector("dialog select[name=p1]").value="5"');
  await js('document.querySelector("dialog select[name=p2]").value="3"');
  await save();
  assert.equal(store.current('interrail_classic').state.votes['local:nardi'].p1,5);
  assert.equal(store.current('interrail_classic').state.votes['local:nardi'].p2,3);
  assert.equal(store.current('interrail_swiss').state.votes?.['local:nardi'],undefined);
  await text('h1', 'Interrail Test 2');
  // All archived research areas are exposed in the actual UI, read-only by default.
  await click('.sidebar [data-action=page][data-value=group]');
  await text('#main', 'Umfrage · drei Personen');
  await text('#main', 'Meer und Strände besuchen');
  await text('#main', '60 €');
  await click('.sidebar [data-action=page][data-value=lodging]');
  await screenshot('31-unterkuenfte-browse-desktop-1440.png');
  await until(() => js('Boolean(document.querySelector("#nightly-target"))'), 'Nachtbudget-Eingabe');
  // The search updates on typing (debounced), without another search click.
  await js('(() => { const x=document.querySelector("#browse-search");x.value="HeyLola";x.dispatchEvent(new Event("input",{bubbles:true})); })()');
  await until(() => js('(() => {const cards=[...document.querySelectorAll(".hub-option-card")];return cards.length>0&&cards.every(x=>x.textContent.includes("HeyLola"))})()'),
    'Live-Suche nach HeyLola filtert die Unterkunftskarten ohne Formular-Submit');
  await click('[data-action=browse-search-reset]');
  await until(() => js('document.querySelector("#browse-search")?.value===""'),'Suche wieder zurückgesetzt');
  await until(() => js('document.querySelectorAll(".lodging-price-meter").length > 0'), 'Unterkunfts-Budgetbalken');
  await until(() => js('document.querySelectorAll(".hub-option-card .hub-option-pricing strong").length > 0'), 'Alte und neue Unterkunftskarten zeigen €/€€/€€€ oder €?');
  await set('#nightly-target', '40');
  await js('document.querySelector("#nightly-target").dispatchEvent(new Event("change",{bubbles:true}))');
  await until(() => js('document.querySelector("#nightly-target")?.value === "40"'),'Budgetziel angepasst');
  assert.equal(await js('localStorage.getItem("reiseplan-nightly-target")'),'40');
  await js('document.querySelectorAll(".hub-option-card [data-action=compare]")[0].click()');
  await js('document.querySelectorAll(".hub-option-card [data-action=compare]")[1].click()');
  await until(() => js('document.querySelectorAll(".stay-compare-card").length === 2'),
    'Interaktiver Vergleich von zwei Unterkünften');
  await text('.stay-compare-board','Küche');
  await js('document.querySelector(".hub-technical-details:not([open]) > summary")?.click()');
   // The compact lodging page now labels the exact same source-bound historical
  // snapshots as "Neue Unterkunfts-Suchwerte", not the removed heading.
  await text('.provider-quote-panel', 'Neue Unterkunfts-Suchwerte');
  await text('.provider-quote-panel', '2027-09-03 bis 2027-09-06');
  await until(() => js('document.querySelectorAll(".provider-quote-card").length === 10'),
    '10 unbooked September Barcelona provider offers');
  assert.ok(await js('document.querySelector(".provider-quote-card")?.textContent.includes("HeyLola!")'));
  const priorProviderState=JSON.stringify(store.current('interrail_classic').state);
  await js('document.querySelector(".hub-technical-details:not([open]) > summary")?.click()');
   await click('.provider-quote-panel [data-action=provider-budget]');
  await until(() => js('document.querySelectorAll(".provider-quote-card").length < 10'),
    'Provider nightly budget filter');
  await js('document.querySelector(".hub-technical-details:not([open]) > summary")?.click()');
   await click('.provider-quote-panel [data-action=provider-budget]');
  await js('document.querySelector(".hub-technical-details:not([open]) > summary")?.click()');
   await set('#provider-quote-sort', 'rating');
  await js('document.querySelector("#provider-quote-sort").dispatchEvent(new Event("change",{bubbles:true}))');
  await until(() => js('document.querySelector(".provider-quote-card")?.textContent.includes("SM Hotel Sant Antoni")'),
    'Booking score sorting');
  assert.equal(JSON.stringify(store.current('interrail_classic').state),priorProviderState,
    'Research controls must not write to the trip');
  await text('#main', 'Detaillierter Preis- und Quellenvergleich');
  await js('document.querySelector(".hub-filter-more:not([open]) > summary")?.click()');
   await click('[data-action=option-filter][data-value=search]');
  await text('.hub-option-grid', 'HeyLola! Hostel');
  await text('.hub-option-grid', 'Preisorientierung');
  const scopedHotelSearchCount = catalog.trips.find(trip => trip.id === 'interrail_classic')
    .items.filter(item => item.city === 'barcelona' && item.kind === 'lodging'
      && item.quote && !item.duplicateOf).length;
  assert.equal(await js('document.querySelectorAll(".hub-option-card").length'), Math.min(8,scopedHotelSearchCount),
    'Initiale Unterkunftsoptionen werden in Acht-Schritten angezeigt; Recherchetreffer bleiben vollständig');
  await text('.hub-option-grid', 'Preisorientierung');
  assert.ok(await js('!document.querySelector(".hub-option-card").textContent.includes("gebucht")')
    || await js('document.querySelector(".hub-option-card").textContent.includes("nicht gebucht")'));
  await click('.sidebar [data-action=page][data-value=discover]');
  await text('.hub-option-grid', 'Gruppeninteresse');
  await set('#sort', 'score');
  await js('document.querySelector("#sort").dispatchEvent(new Event("change", { bubbles: true }))');
  await text('#main', 'Gruppeninteresse');
  await click('.sidebar [data-action=page][data-value=rail]');
  await text('#main', 'Fahrplan- und Preisrecherche · 2027');
  await text('#main', 'Pass-Reisetage und Tarifprüfung');
  await text('#main', 'Alternative Bahnverbindungen · Hypothesen');
  await text('#main', 'Bahnkorridore & offizielle Betreiber');
  await text('#main', 'Bahnprüfung: September 2027');
  await text('.rail-review-panel','Bahn-Prüfzeitleiste 2027');
  await until(() => js('document.querySelectorAll(".rail-review-step").length === 7'),
    'Seven original rail departures have review windows');
  await text('.rail-review-panel','Prüfung vormerken');
  await text('#main', '2027: Fahrzeit, Verfügbarkeit und Preise offen');
  await click('.sidebar [data-action=page][data-value=map]');
  await click('.travel-map-hud [data-action=hud-audit][data-value=photo]');
  await text('#main', 'Welche Einträge haben noch fehlende Angaben oder Bilder?');
  assert.equal(await js('document.querySelector("#coverage-filter-gap")?.value'),'photo',
    'HUD öffnet sofort den passenden fehlende-Fotos-Filter');
  await screenshot('17-map-hud-to-evidence-workqueue.png');
  await click('[data-data-section=archive]>summary');
  await click('[data-data-section=quality]>summary');
  await text('#main', 'Forschungsarchiv');
  await text('#main', 'Offene Datenqualitätsbefunde');
  await text('#main', 'Einzelprüfung aller alten und neuen Datensätze');
  await text('#main', 'Welche Einträge haben noch fehlende Angaben oder Bilder?');
  await until(()=>js('document.querySelectorAll(".coverage-city").length>0'),
    'Einzelne Ortsgruppen für fehlende Quellen und Bilder');
  await js('(() => { const el=document.querySelector("#coverage-filter-gap");'
    +'el.value="photo";el.dispatchEvent(new Event("change",{bubbles:true}));})()');
  assert.equal(await js('Array.from(document.querySelectorAll(".coverage-row:not([hidden])")).every'
    +'(x=>x.dataset.coverageGaps.split(" ").includes("photo"))'),true,
    'Photo filter contains only entries without individual image');
  await js('(() => {const el=document.querySelector("#coverage-filter-query");'
    +'el.value="SÈTE";el.dispatchEvent(new Event("input",{bubbles:true}));})()');
  assert.equal(await js('Array.from(document.querySelectorAll(".coverage-row:not([hidden])")).every'
    +'(x=>x.dataset.coverageCity==="sete"||x.dataset.coverageName.toLowerCase().includes("sète"))'),true,
    'Accent-insensitive keyword filter is applied to visible evidence queue');
  await screenshot('15-data-gaps-filtered.png');
  await click('[data-action=coverage-filter-clear]');
  assert.equal(await js('document.querySelector("#coverage-filter-query").value'),"",
    'Filter reset restores complete evidence ledger');
  assert.equal(await js('document.querySelectorAll(".coverage-row[hidden]").length'),0,
    'All incomplete entries are visible again after reset');
  await js('document.querySelector(".coverage-city summary").click()');
  await until(()=>js('document.querySelector(".coverage-city[open] .coverage-row [data-action=details]")!==null'),
    'Einzeln aufrufbare Datenlücken');
  await click('.coverage-city[open] .coverage-row [data-action=details]');
  await text('dialog','Lizenzfotos suchen');
  await text('dialog','Was fehlt noch?');
  await click('dialog [data-action=close]');
  await click('[data-data-section=locations]>summary');
  await text('#main', 'Standortprüfung · öffentliche Adressen');
  await click('[data-data-section=media]>summary');
  await text('#main', 'Bildabdeckung & offene Quellenfotos');
  assert.ok(await js('document.querySelector(".provider-location-panel")?.textContent.includes("Adress-/Identitätskonflikte")'));
  assert.ok(await js('document.querySelector(".provider-location-panel")?.textContent.includes("Via Giuseppe Ratti")'));
  assert.ok(await js('document.querySelector(".provider-location-panel")?.textContent.includes("14 von 17 offen")'),
    'Historic provider records are reconciled with two later independently sourced references');
  assert.ok(await js('document.querySelector(".provider-location-panel")?.textContent.includes("3 unabhängig belegte Referenzpunkte")'),
    'Newly confirmed points are not trapped under the historical 17-unverified headline');
  await js('document.querySelector(".provider-location-panel details").open=true');
  await until(()=>js('Boolean(document.querySelector(".provider-location-item.has-independent-point .provider-location-difference"))'),
    'Le Pouffre compares the official BAN address point with the old provider coordinate');
  await text('.provider-location-panel','ca. 3 m');
  await js('document.querySelector(".provider-location-panel").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('48-provider-bananbieter-positionen-vergleich.png');
  assert.ok(await js('Array.from(document.querySelectorAll(".provider-location-item")).some(x=>x.textContent.includes("Cittadella 3")&&x.textContent.includes("Stockwerk"))'),
    'Corrected street-only apartment location is visibly distinguished from historical unverified house number');
  await js('Array.from(document.querySelectorAll(".provider-location-item")).find(x=>x.querySelector("strong")?.textContent==="Cittadella 3")?.scrollIntoView({block:"center",behavior:"instant"})');
  await screenshot('48-provider-adresskonflikte-desktop.png');
  assert.ok(await js('Array.from(document.querySelectorAll(".provider-location-item .row-actions a")).some(a=>a.textContent.includes("Öffentliche Adresse in OSM suchen")&&a.href.includes("openstreetmap.org/search"))'),
    'Every public provider location offers an independent keyless OSM address search');
  assert.ok(await js('Array.from(document.querySelectorAll(".provider-location-item .row-actions a")).some(a=>a.textContent.includes("Historischen Anbieterpin in OSM vergleichen")&&a.href.includes("mlat="))'),
    'Existing provider coordinates can be inspected without being silently promoted as verified');
  assert.ok(await js('Array.from(document.querySelectorAll(".provider-location-difference")).every(el=>["near","review","conflict"].includes(el.dataset.distanceState))'),
    'Provider-point and independent street reference distances receive explicit diagnostic classifications');



  await click('.sidebar [data-action=page][data-value=budget]');
  await text('#main', 'Was-wäre-wenn-Szenarien');
  await click('.sidebar [data-action=page][data-value=overview]');
  await text('#main', 'Varianten im Vergleich');
  await text('#main', 'Offizielle Reiseregeln für 2027');
  await text('#main', 'Zugangsentgelt 2027');
  await text('#main', 'Eiffelturm · Eintritt 2027');
  await text('#main', 'Personenanteile');
  await text('#main', 'Pass-Tage');
  await text('#main', 'Preise offen');
  await click('.sidebar [data-action=page][data-value=food]');
  await screenshot('30-verpflegung-browse-desktop-1440.png');
  assert.ok(await js('document.querySelector(".hub-food-tabs [data-action=browse-food-saved]")!==null'),
    'Die Verpflegungsmerkliste ist ohne Tagesplan erreichbar');
  await click('[data-action=browse-food-type][data-value=markets]');
  await until(()=>js('Boolean(document.querySelector(".hub-market-access"))'),
    'Verpflegung bietet eine gekennzeichnete Supermarkt-Geodatenquelle');
  assert.ok(await js('Boolean(document.querySelector(".hub-market-access [data-action=browse-market-load],.hub-market-access [data-action=browse-supermarkets]"))'),
    'Supermarktdaten werden nur auf Nutzeraktion geladen');
  await screenshot('32-verpflegung-supermarkt-ui-1440.png');
  await click('[data-action=browse-food-type][data-value=all]');
  await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await text('#main', 'Selbst kochen oder auswärts essen');
  await text('#main', 'Verifizierte Anbieter & offene Essensideen');
  await click('.meal-card [data-action=meal-choose][data-value=pasta]');
  await text('dialog', 'Pasta mit Tomate');
  await save();
  await click('.sidebar [data-action=page][data-value=food]');
   await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await text('#main', 'Gemeinsamer Einkaufswarenkorb');
  await text('#main', '2,80');
  await click('[data-action=grocery-edit]');
  await set('dialog [name=unitPrice]', '1.25');
  await save();
  await text('#main', '3,25');
  const state = store.current('interrail_classic').state;
  assert.equal(Object.keys(state.groceryOverrides ?? {}).length, 1);
  await cdp('Page.navigate', { url: address });
  // Reload begins at the new overview screen, not the previously open day.
  await text('h1', 'Reiseübersicht');
  await click('.sidebar [data-action=page][data-value=food]');
   await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await text('#main', '3,25');
  await click('.sidebar [data-action=page][data-value=budget]');
  await text('#main', '3,25');
  // A second planned dinner must reuse packages and automatically increase
  // an earlier override if the combined quantity now needs more packs.
  await click('.sidebar [data-action=page][data-value=food]');
   await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await set('#meal-date', '2027-09-05');
  await js('document.querySelector("#meal-date").dispatchEvent(new Event("change", { bubbles: true }))');
  await text('#main', 'Abendessen am 05.09.2027');
  await click('.meal-card [data-action=meal-choose][data-value=pasta]');
  await save();
  await click('.sidebar [data-action=page][data-value=food]');
   await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await text('#main', '6,50');
  await text('#main', 'Packungen an den gesamten Bedarf angepasst');
  assert.equal(store.current('interrail_classic').state.manual.filter(i => i.mealPlanId === 'pasta').length, 2);
  await click('.sidebar [data-action=page][data-value=budget]');
  await text('#main', '6,50');
  await click('.sidebar [data-action=page][data-value=food]');
  await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await click('.grocery-section [data-action=grocery-edit]');
  await set('dialog [name=stock]', '1000');
  await set('dialog [name=packs]', '0');
  await save();
  await text('.grocery-section', '1000 g Vorrat');
  await text('.grocery-section', '4,00');
  const stockState = store.current('interrail_classic').state;
  const [stockKey] = Object.keys(stockState.shopping.pantry);
  assert.equal(stockState.shopping.pantry[stockKey], 1000);
  await click('.grocery-section [data-action=grocery-edit]');
  await set('dialog [name=packs]', '2');
  await save();
  await text('.grocery-section', '6,50');
  assert.equal(store.current('interrail_classic').state.groceryOverrides[stockKey].explicitPacks,true);
  await click('.grocery-section [data-action=grocery-edit]');
  await set('dialog [name=packs]', '0');
  await save();
  await text('.grocery-section', '4,00');
  await click('.grocery-section [data-action=grocery-check]');
  await until(() => js('document.querySelector(".grocery-section [data-action=grocery-check]")?.getAttribute("aria-pressed")==="true"'),
    'Einkaufsartikel ist abgehakt');
  assert.equal(store.current('interrail_classic').state.shopping.checked[stockKey], true);
  await click('.grocery-section [data-action=grocery-extra][data-value=""]');
  await set('dialog [name=name]', 'Einkaufstest Äpfel');
  await set('dialog [name=quantity]', '3');
  await set('dialog [name=price]', '0,60');
  await save();
  await text('.grocery-section', '5,80');
  await text('.grocery-section', 'Einkaufstest Äpfel');
  const extra = store.current('interrail_classic').state.shopping.extras[0];
  assert.equal(extra.unitCents, 60);
  await click('.grocery-section [data-action=grocery-extra][data-value="' + extra.id + '"]');
  await set('dialog [name=price]', '');
  await save();
  await text('.grocery-section', 'offene Beträge');
  await click('.grocery-section [data-action=grocery-remove][data-value="' + extra.id + '"]');
  // Saving is async; the 4,00 subtotal already exists elsewhere in this panel
  // and cannot prove that the delete commit has reached the SQLite store.
  await until(()=>store.current('interrail_classic').state.shopping.extras.length===0,
    'Removing the extra shopping item persists before continuing');
  await text('.grocery-section', '4,00');
  await js('document.querySelector(".grocery-section").scrollIntoView({block:"start"})');
  await screenshot('85-warenkorb-vorraete-desktop.png');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await js('document.querySelector(".grocery-section").scrollIntoView({block:"start"})');
  assert.ok(await js('document.documentElement.scrollWidth <= innerWidth + 5'), 'Warenkorb ohne mobilen Seitenüberlauf');
  await screenshot('85-warenkorb-vorraete-mobil.png');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  // Crossing the responsive breakpoint re-renders the page. Wait for that
  // browser event before focusing a control in the recreated disclosure.
  await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await js(`document.querySelector(${JSON.stringify('.grocery-section [data-action=grocery-extra][data-value=""]')}).focus()`);
  assert.equal(await js('document.activeElement.dataset.action'), 'grocery-extra');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await text('dialog', 'Einkaufsartikel ergänzen');
  assert.ok(await js('document.querySelector("dialog").contains(document.activeElement)'), 'Dialog übernimmt den Tastaturfokus');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  assert.equal(await js('document.querySelector("dialog").open'), false);
  assert.equal(await js('document.activeElement.dataset.action'), 'grocery-extra');
  await cdp('Page.navigate', { url: address });
  await text('h1', 'Reiseübersicht');
  await click('.sidebar [data-action=page][data-value=food]');
  await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
  await text('.grocery-section', '1000 g Vorrat');
  assert.equal(await js('document.querySelector(".grocery-section [data-action=grocery-check]").getAttribute("aria-pressed")'), 'true');
  assert.deepEqual(store.current('interrail_swiss').state.shopping.extras, []);
  assert.deepEqual(store.current('interrail_swiss').state.shopping.pantry, {});
  await click('.grocery-section [data-action=grocery-edit]');
  await set('dialog [name=stock]', '0');
  await set('dialog [name=packs]', '2');
  await save();
  await text('.grocery-section', '6,50');
  console.log('PASS: Vorräte, Zusatzartikel, offene Preise, Abhaken und Wiederladen');
  // An explicit hotel candidate selection is local, unbooked and confined
  // to the matching 3-person September classic variant.
  await click('.sidebar [data-action=page][data-value=lodging]');
  await js('document.querySelector(".hub-filter-more:not([open]) > summary")?.click()');
   await click('[data-action=option-filter][data-value=search]');
  await text('.hub-option-grid', 'HeyLola! Hostel');
  await click('[data-action=choose][data-value="research:bcom_12814471"]');
  await text('dialog', 'keine Reservierung oder Zahlung');
  await save();
  assert.equal(store.current('interrail_classic').state.edits['research:bcom_12814471'].selected, true);
  assert.equal(store.current('interrail_swiss').state.edits['research:bcom_12814471'], undefined);
  // Document a five-point, user-reported provider checkout; this only changes
  // the explicitly selected local plan price, never the supplier's booking.
  await click('.sidebar [data-action=page][data-value=lodging]');
  await js('document.querySelector(".hub-filter-more:not([open]) > summary")?.click()');
   await click('[data-action=option-filter][data-value=search]');
  await js('document.querySelector(\'[data-action=verify-item][data-value="research:bcom_12814471"]\')?.closest("details")?.setAttribute("open","")');
   await click('[data-action=verify-item][data-value="research:bcom_12814471"]');
  await text('dialog', 'keine erfolgte Buchung');
  await set('dialog [name=evidenceUrl]', 'https://www.booking.com/hotel/es/heylola-hostel.html');
  await set('dialog [name=quotedTotal]', '297.20');
  await js('document.querySelectorAll("dialog [name^=check_]").forEach(input => input.checked = true)');
  await js('document.querySelector("dialog [name=applyPrice]").checked = true');
  await save();
  const reviewed = store.current('interrail_classic').state;
  assert.equal(reviewed.verifications['research:bcom_12814471'].quotedCents, 29720);
  assert.equal(reviewed.verifications['research:bcom_12814471'].checks.beds, true);
  assert.equal(reviewed.edits['research:bcom_12814471'].price.cents, 29720);
  assert.equal(catalog.trips.find(x => x.id === 'interrail_classic').items
    .find(x => x.id === 'research:bcom_12814471').price.cents, 28590);
  // The new housing cards use an explicit evidence sentence instead of the
  // removed legacy button label. Assert the reviewed 5/5 state is rendered.
  await text('#main', 'Eigene Unterkunftsprüfung: 5/5');
  await click('.sidebar [data-action=page][data-value=budget]');
  await text('#main', '297,20');
  await set('#variant', 'swiss_lakes');
  await js('document.querySelector("#variant").dispatchEvent(new Event("change", { bubbles: true }))');
  await click('.sidebar [data-action=page][data-value=group]');
  await text('#main', 'Eigenständige Reisegruppe');
  await click('.sidebar [data-action=page][data-value=overview]');
  await text('#main', 'Schweizer Mietwagen · Mindestalter');
  await text('#main', 'Oeschinensee · Gondelbahn');
  assert.equal(store.current('swiss_lakes').state.people.length, 4);
  // The 14-day Swiss Interrail variant has a DIFFERENT practical finish than
  // the 7-day rental-car Swiss lakes trip. Verify the real browser interaction.
  await set('#variant', 'interrail_swiss');
  await js('document.querySelector("#variant").dispatchEvent(new Event("change", { bubbles: true }))');
  await click('.sidebar [data-action=page][data-value=overview]');
  await text('.swiss-focus-overview', 'Schweiz-Finale');
  await text('.swiss-focus-overview', 'Wasserauen');
  // V100: all fourteen existing day drafts must be immediately visible in
  // the correct variant, not hidden inside an overview disclosure.
  assert.equal(await js('document.querySelectorAll(".swiss-14-day-card").length'),14);
  assert.equal(await js('document.querySelectorAll(".swiss-14-day-block").length'),42);
  assert.equal(await js('document.querySelectorAll(".swiss-14-day-card [data-action=day-plan-go]").length'),14);
  assert.equal(await js('document.querySelector(".swiss-14-day-overview")?.closest("details")'),null,
    'V100 itinerary cannot be hidden in a collapsed details section');
  await js('document.querySelector(".swiss-14-day-overview").scrollIntoView({behavior:"instant",block:"start"})');
  await screenshot('v100-interrail-schweiz-14-tage-desktop.png');
  await cdp('Emulation.setDeviceMetricsOverride',{
    width:390,height:844,deviceScaleFactor:1,mobile:true
  });
  await until(()=>js('getComputedStyle(document.querySelector(".swiss-14-day-grid")).gridAutoFlow==="column"'),
    'V100 mobile day list is a horizontal swipe carousel');
  assert.equal(await js('document.querySelectorAll(".swiss-14-day-card").length'),14);
  assert.ok(await js('document.documentElement.scrollWidth <= innerWidth + 5'),
    'V100 carousel never creates page-wide mobile overflow');
  await js('document.querySelector(".swiss-14-day-overview").scrollIntoView({behavior:"instant",block:"start"})');
  await screenshot('v100-interrail-schweiz-14-tage-mobile.png');
  assert.ok(await js('(()=>{const list=document.querySelector(".swiss-14-day-grid");list.scrollLeft=list.scrollWidth;return list.scrollLeft>0})()'),
    'The final Swiss Interrail day is reachable by horizontal scrolling');
  await cdp('Emulation.setDeviceMetricsOverride',{
    width:1440,height:1000,deviceScaleFactor:1,mobile:false
  });
  const swissDraftBefore=JSON.stringify(store.current('interrail_swiss').state.edits);
  await click('.swiss-14-day-card [data-action=day-plan-go][data-value="2027-09-11"]');
  await until(()=>js('document.querySelector(".day101-board")?.textContent.includes("Oeschinensee")'),
    'V101 day card opens the full three-part interactive day board');
  assert.equal(await js('document.querySelectorAll(".day101-period-card").length'),3,
    'V101 Swiss day view has all three morning/noon/evening plans');
  assert.ok(await js('document.querySelector(".day101-navigator")?.textContent.includes("TAG 11 VON 14")'),
    'V101 navigator must use the actual September 2027 date sequence');
  await click('.day101-filter[data-value=morning]');
  assert.equal(await js('document.querySelectorAll(".day101-period-card:not([hidden])").length'),1,
    'V101 morning filter shows only the morning editorial plan');
  assert.equal(await js('document.querySelector(".day101-filter[data-value=morning]").getAttribute("aria-pressed")'),'true');
  await click('.day101-filter[data-value=all]');
  assert.equal(await js('document.querySelectorAll(".day101-period-card:not([hidden])").length'),3);
  await js('document.querySelector("#interrail-schweiz-tagesablauf").scrollIntoView({behavior:"instant",block:"start"})');
  await screenshot('v101-interrail-schweiz-tagesplanung-desktop.png');
  await cdp('Emulation.setDeviceMetricsOverride',{
    width:390,height:844,deviceScaleFactor:1,mobile:true
  });
  assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+3'),
    'V101 Swiss day planning must fit a 390px viewport without horizontal overflow');
  assert.equal(await js('document.querySelectorAll(".day101-filter").length'),4);
  await js('document.querySelector("#interrail-schweiz-tagesablauf").scrollIntoView({behavior:"instant",block:"start"})');
  await screenshot('v101-interrail-schweiz-tagesplanung-mobile.png');
  // V102: practical daily preparation is per-day, keyboard-friendly and
  // persistent in browser storage, but it never changes the actual trip.
  assert.equal(await js('document.querySelectorAll(".day102-check").length'),5);
  assert.ok(await js('document.querySelector(".day102-preparation")?.textContent.includes("kein Nachweis für eine Buchung")'));
  const beforeSwissChecks=JSON.stringify(store.current('interrail_swiss').state.edits);
  await click('.day102-check[data-value=food]');
  assert.equal(await js('document.querySelector(".day102-check[data-value=food]").getAttribute("aria-pressed")'),'true');
  assert.equal(await js('document.querySelector(".day102-meter").getAttribute("aria-valuenow")'),'1');
  assert.equal(JSON.stringify(store.current('interrail_swiss').state.edits),beforeSwissChecks,
    'V102 personal review checkboxes must not mutate actual trip entries');
  await js('document.querySelector(".day102-preparation").scrollIntoView({behavior:"instant",block:"start"})');
  await screenshot('v102-interrail-schweiz-tagescheck-mobile.png');

  await cdp('Emulation.setDeviceMetricsOverride',{
    width:1440,height:1000,deviceScaleFactor:1,mobile:false
  });
  await click('.day101-navigation-button[data-value="2027-09-12"]');
  await until(()=>js('document.querySelector(".day101-navigator")?.textContent.includes("TAG 12 VON 14")'),
    'V101 next-day action reaches the actual following day');
  await click('.day101-navigation-button[data-value="2027-09-11"]');
  assert.equal(await js('document.querySelector(".day102-check[data-value=food]").getAttribute("aria-pressed")'),'true',
    'V102 checklist must survive leaving and revisiting the day');
  await click('.day102-check[data-value=food]');
  assert.equal(await js('document.querySelector(".day102-meter").getAttribute("aria-valuenow")'),'0');
  assert.equal(await js('document.querySelectorAll(".day101-period-card:not([hidden])").length'),3,
    'V101 changing days resets the period filter');

  assert.equal(JSON.stringify(store.current('interrail_swiss').state.edits),swissDraftBefore,
    'Opening a day overview never silently changes the active Swiss trip plan');
  await click('.sidebar [data-action=page][data-value=overview]');

  assert.equal(await js('document.querySelectorAll(".swiss-focus-day-shortcuts [data-action=day-plan-go]").length'),5,
    'Five exact Swiss final-day navigation targets, no separate Swiss-lakes leakage');
  await click('.swiss-focus-day-shortcuts [data-action=day-plan-go][data-value="2027-09-11"]');
  await text('#main', 'Oeschinensee');
  await until(()=>js('Boolean(document.querySelector(".swiss-focus-day"))'),'Swiss day-specific notes after day jump');
  await text('.swiss-focus-day','24.04.');
  await click('.sidebar [data-action=page][data-value=rail]');
  await text('.swiss-focus-rail', 'Schweiz-Verbindungen');
  assert.equal(await js('document.querySelectorAll(".swiss-focus-corridor").length'),4,
    'Both Nice cross-border routing hypotheses and two Swiss onward corridors visible');
  await screenshot('47-interrail-schweiz-bahnrisiken.png');
  await text('.swiss-v84-rail','Brig–Kandersteg');
  await click('.swiss-v84-rail summary');
  assert.equal(await js('document.querySelectorAll(".swiss-v84-rail-note").length'),4,
    'Four independently sourced BLS/Interrail/local fare notes in the rail view');
  await text('.swiss-stay-rail-note','Kandersteg');
  await click('.swiss-stay-rail-note [data-action=page][data-value=lodging]');
  await click('.stay-swiss-research > summary');
  assert.equal(await js('document.querySelector(".stay-swiss-research").open'),true,
    'Archived Swiss room and price research is explicitly opened after primary lodging controls');
  await until(()=>js('Boolean(document.querySelector(".swiss-stay-board"))'),
    '3-person Swiss lodging comparison visible after rail-page button');
  await text('.swiss-stay-board','Alte Metzg');
  await text('.swiss-stay-board','KISC');
  assert.equal(await js('document.querySelectorAll(".swiss-stay-candidate").length'),8,
    'Eight sourced room categories, not invented room bookings');
  assert.equal(await js('document.querySelectorAll(".swiss-stay-original").length'),2,
    'Historic Tripsy Kandersteg and Appenzell offers remain separately labeled');
  await text('.swiss-stay-board','CHF 165');
  await text('.swiss-stay-board','CHF 170');
  await text('.swiss-v84-board','20 Preise');
  await text('.swiss-v84-board','415,78');
  await text('.swiss-v84-board','406,03');
  assert.equal(await js('document.querySelectorAll(".swiss-v84-hotel").length'),20,
    'Twenty exact-date provider search rows, not twenty confirmed bookings');
  assert.equal(await js('document.querySelectorAll(".swiss-v84-city").length'),2,
    'Both Swiss town dates covered for three adults');
  await screenshot('48-interrail-schweiz-unterkunftsvergleich.png');
  await screenshot('49-interrail-schweiz-datierte-preise.png');
  assert.equal(store.current('swiss_lakes').state.people.length,4,
    'Swiss Interrail inspection never changes the separate car trip group');
  await set('#variant', 'interrail_classic');
  await js('document.querySelector("#variant").dispatchEvent(new Event("change", { bubbles: true }))');
  await until(() => js('Boolean(document.querySelector(".sidebar [data-action=city][data-value=barcelona]"))'), 'Barcelona navigation after variant switch');
  await click('.sidebar [data-action=city][data-value=barcelona]');
  await click('.sidebar [data-action=page][data-value=plan]');
  await text('h1', 'Barcelona');
  assert.equal(store.current('interrail_classic').state.verifications['research:bcom_12814471'].quotedCents, 29720);
  await click('.sidebar [data-action=page][data-value=rail]');
  await text('#main', 'Verkaufsregel');
  await text('#main', 'Orientierungsfenster');
  await click('[data-action=rail-reminder][data-value="research_interrail_classic-t01"]');
  await text('dialog', 'kein garantierter Verkaufsbeginn');
  await save();
  const reminder = store.current('interrail_classic').state.deadlines.find(
    row => row.id === 'deadline:rail:research_interrail_classic-t01');
  assert.ok(reminder && reminder.when.startsWith('2027-03-01T08:00'));
  await click('[data-action=verify-item][data-value="tripsy:transport:3842725"]');
  await text('dialog', 'Abfahrt, Ankunft');
  await js('document.querySelector("dialog [name=check_operator]").checked = true');
  await save();
  assert.equal(store.current('interrail_classic').state.verifications['tripsy:transport:3842725'].checks.operator, true);
  await text('#main', 'Eigene Prüfung 1/5');
  await click('.sidebar [data-action=page][data-value=plan]');
  await text('h1', 'Barcelona');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await until(() => js('Boolean(document.querySelector(".mobile-switch"))'), 'mobiler Schalter');
  await until(() => js('getComputedStyle(document.querySelector(".mobile-dock")).display==="grid"'), 'Fixe mobile Schnellnavigation');
  assert.equal(await js('(()=>{const buttons=[...document.querySelectorAll(".mobile-dock button")];'
    +'return buttons.length===6&&buttons.every(b=>'
    +'Math.abs(b.getBoundingClientRect().top-buttons[0].getBoundingClientRect().top)<3);})()'),
    true,'Alle sechs mobilen Reiter müssen in EINER Zeile bleiben');
  assert.ok(await js('document.querySelector(".mobile-dock").getBoundingClientRect().height<100'),
    'Mobilnavigation belegt nicht unnötig zwei Bildschirmreihen');
  await click('[data-action=mobile][data-value=map]');
  await until(() => js('Boolean(document.querySelector("#map .leaflet-pane"))'), 'mobile Karte');
  await click('.mobile-dock [data-action=page][data-value=map]');
  await text('h1','Interrail Test 2');
  await until(() => js('Boolean(document.querySelector("#map .leaflet-pane"))'),'Karte auch über mobile Dock erreichbar');
  assert.ok(await js('document.documentElement.scrollWidth <= window.innerWidth + 5'), 'Mobiles Layout hat horizontalen Überlauf.');
  await js('document.querySelector(".map-explorer-split").scrollIntoView({block:"start"})');
  await screenshot('04-atlas-smartphone-390.png');
  await until(()=>js('Boolean(document.querySelector(".map-evidence-review"))'),
    'Quellenprüfungen für bestehende Marker auch auf Mobil erreichbar');
  await click('.map-evidence-review > summary');
  await js('document.querySelector(".map-evidence-review").scrollIntoView({block:"start",behavior:"instant"})');
  assert.ok(await js('(() => {const panel=document.querySelector(".map-evidence-review");'
    +'const bounds=panel.getBoundingClientRect();'
    +'return bounds.left>=-2&&bounds.right<=innerWidth+2;})()'),
    'Quellenprüfungsbereich liegt vollständig im Smartphone-Viewport');
  await screenshot('42-koordinatenquellen-smartphone-390.png');
  await click('.map-evidence-review > summary');
  await click('[data-action=explorer-scope][data-value=city]');
  await click('[data-action=explorer-group][data-value=food]');
  await click('[data-action=explorer-focus][data-value="local:bormuth"]');
  await until(()=>js('Boolean(document.querySelector(".map-selected-place"))'),'Mobile selected POI card');
  assert.ok(await js('(() => { const card=document.querySelector(".map-selection-preview")?.getBoundingClientRect(); const map=document.querySelector("#map")?.getBoundingClientRect(); return card&&map&&card.top>=map.bottom-1&&card.width<=390; })()'),
    'Mobile POI preview is in document flow below map; never under the dock');
  assert.ok(await js('(()=>{const a=document.querySelector(".map-context-summary")?.getBoundingClientRect();'
    +'const b=document.querySelector(".map-selection-preview")?.getBoundingClientRect();'
    +'const m=document.querySelector("#map")?.getBoundingClientRect();'
    +'return a&&b&&m&&a.bottom<=m.top+2&&b.top>=m.bottom-1&&a.right<=innerWidth+3;})()'),
    'Mobile search/filter status stays above the map; selection below it, with no overlap');

  await js('document.querySelector(".map-selection-preview").scrollIntoView({block:"center"})');
  await screenshot('43-mobile-karte-ohne-ueberlagerung-390.png');
  await screenshot('06-atlas-smartphone-auswahl-390.png');
  assert.ok(await js('(() => { const map=document.querySelector(".reference-map-workspace>.map-panel"),a=document.querySelector(".reference-map-workspace>.explorer-right");if(!map||!a)return false;const m=map.getBoundingClientRect(),l=a.getBoundingClientRect();return m.top<l.top&&m.right<=innerWidth+3&&l.right<=innerWidth+3; })()'),
    'Mobile reference layout stacks map above day timeline without horizontal overflow');
  assert.ok(await js('Boolean(document.querySelector(".reference-map-floating"))'),
    'Floating map controls become mobile-accessible below map viewport');
  assert.ok(await js('(() => {const d=document.querySelector(".reference-stage-days")?.getBoundingClientRect(),m=document.querySelector(".reference-map-workspace>.map-panel")?.getBoundingClientRect();return d&&m&&d.top<m.top&&d.right<=innerWidth+3})()'),
    'On mobile the date carousel stays above the map and remains within the viewport');
  await screenshot('19-reference-day-map-mobile-390.png');
  await click('.map-selected-place [data-action=details]');
  await until(()=>js('document.querySelector("dialog")?.open===true'),
    'Mobile destination inspector opened');
  await until(()=>js('document.querySelectorAll("dialog .inspector-tab").length===5'),
    'Five inspector tabs on mobile');
  assert.ok(await js('(() => {const dialog=document.querySelector("dialog"), r=dialog?.getBoundingClientRect();'
    +'return r&&r.left>=0&&r.right<=innerWidth+2})()'), 'Inspector fits 390px mobile viewport');
  await screenshot('13-place-inspector-mobile-390.png');
  await click('dialog [data-action=inspector-tab][data-value=nearby]');
  assert.equal(await js('document.querySelector("#inspector-panel-nearby").hidden'),false,
    'Mobile nearby tab switches without rerender');
  await click('dialog [data-action=close]');
  await cdp('Emulation.setDeviceMetricsOverride',{width:820,height:1180,deviceScaleFactor:1,mobile:false});
  await until(()=>js('getComputedStyle(document.querySelector(".map-explorer-split")).gridTemplateColumns.split(" ").length===1'),
    'Tablet uses readable stacked atlas layout');
  assert.ok(await js('document.documentElement.scrollWidth <= window.innerWidth + 5'),'Tablet-Layout without horizontal overflow');
  await screenshot('05-atlas-tablet-820.png');
  // Three meal slots use the same persistent Swiss variant and pooled basket.
  await cdp('Page.navigate',{url:address+'&variant=interrail_swiss'});
  await text('h1','Reiseübersicht');
  const openMeals=async()=>{
    await click('.sidebar [data-action=page][data-value=food]');
    await js('document.querySelector(".hub-food-planning:not([open]) > summary")?.click()');
    await text('.meal-day-overview','Frühstück');
  };
  await openMeals();
  // V86: the new city-chain comparison is visible independently of cookbook
  // state and manual quotes survive reload without changing purchases/budget.
  await text('.market-baskets-v86','Mercadona');
  await text('.market-baskets-v86','Lidl');
  await text('.market-baskets-v86','Aldi');
  assert.equal(await js('document.querySelectorAll(".market-chain-card").length'),3);
  assert.equal(await js('document.querySelector(".market-chain-card table tbody")?.rows.length'),10);
  assert.equal(await js('document.querySelectorAll(".market-chain-card[open]").length'),0,
    'All stores initially compact, detailed product matrix on demand');
  const marketKey='barcelona:mercadona:spaghetti';
  const beforeMarketExpenses=JSON.stringify(store.current('interrail_swiss').state.expenses);
  await click('.market-chain-card:first-child > summary');
  await click('.market-baskets-v86 [data-action=market-quote][data-value="'+marketKey+'"]');
  await text('dialog','Supermarkt-Produktpreis');
  await set('dialog [name=price]','1,15');
  await save();
  await text('.market-baskets-v86','Eigene Angabe');
  assert.equal(store.current('interrail_swiss').state.marketQuotes[marketKey].priceCents,115);
  assert.equal(JSON.stringify(store.current('interrail_swiss').state.expenses),beforeMarketExpenses);
  await cdp('Page.navigate',{url:address+'&variant=interrail_swiss'});
  await text('h1','Reiseübersicht');await openMeals();
  await click('.market-chain-card:first-child > summary');
  await text('.market-baskets-v86','Eigene Angabe');
  await click('.market-baskets-v86 [data-action=market-quote-reset][data-value="'+marketKey+'"]');
  await until(async()=>store.current('interrail_swiss').state.marketQuotes[marketKey]===undefined,
    'Manuelle Marktpreisreferenz wurde rücknehmbar gespeichert');
  assert.equal(store.current('swiss_lakes').state.marketQuotes?.[marketKey],undefined);
  await js('document.querySelector(".market-baskets-v86")?.scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('91-v86-barcelona-chain-baskets.png');
  for(const [slot,recipe] of [['breakfast','barcelona-oats'],['lunch','barcelona-salad'],['dinner','pasta']]){
    await click('.meal-slot-tabs [data-action=meal-slot][data-value='+slot+']');
    await click('.meal-card [data-action=meal-choose][data-value='+recipe+']');
    await set('dialog [name=start]','');
    await save();
    await openMeals();
  }
  const swissMeals=store.current('interrail_swiss').state.manual.filter(i=>i.mealSlot);
  assert.equal(swissMeals.length,3);
  assert.ok(swissMeals.every(i=>i.start===null));
  assert.equal(swissMeals.find(i=>i.mealSlot==='breakfast').requiresKitchen,false);
  await click('[data-action=browse-food-type][data-value=cook]');
  await text('.hub-food-grid','Kichererbsen-Mais-Salat');
  assert.equal(await js('[...document.querySelectorAll(".hub-food-card-type")].every(n=>n.textContent.includes("Selbstversorgung"))'),true);
  await click('[data-action=browse-food-type][data-value=restaurants]');
  assert.equal(await js('[...document.querySelectorAll(".hub-food-card h3")].some(n=>n.textContent.includes("Kichererbsen-Mais-Salat"))'),false);
  await click('[data-action=browse-food-type][data-value=all]');
  await openMeals();
  await text('.grocery-section','6,07');await text('.grocery-section','offene Beträge');
  const cornKey='barcelona:meal-es-corn:285:open';
  await click('.grocery-section [data-action=grocery-edit][data-value="'+cornKey+'"]');
  await set('dialog [name=unitPrice]','0,95');await save();
  await text('.grocery-section','7,97');
  assert.equal(store.current('interrail_swiss').state.groceryOverrides[cornKey].unitCents,95);
  const milkKey='barcelona:meal-es-milk:1000:83:EUR:ml';
  await click('.grocery-section [data-action=grocery-edit][data-value="'+milkKey+'"]');
  await set('dialog [name=stock]','200');await save();
  await text('.grocery-section','200 ml Vorrat');
  assert.equal(store.current('interrail_swiss').state.shopping.pantry[milkKey],200);
  const breakfast=swissMeals.find(i=>i.mealSlot==='breakfast');
  await click('.meal-day-slot [data-action=meal-cost][data-value="'+breakfast.id+'"]');
  await set('dialog [name=price]','2,00');await save();
  await text('.grocery-section','6,30');
  await click('.meal-slot-tabs [data-action=meal-slot][data-value=breakfast]');
  await click('.meal-card [data-action=meal-choose][data-value=barcelona-oats]');
  await click('dialog [type=submit]');
  await text('dialog .form-error','Ausgabe');await click('dialog [data-action=close]');
  await click('[data-action=shopping-stop]');
  await set('dialog [name=store]','local:carrefour-gran-via');
  await set('dialog [name=start]','18:00');await save();
  const shopping=store.current('interrail_swiss').state.manual.find(i=>i.shoppingSourceId==='local:carrefour-gran-via');
  assert.equal(shopping.price.cents,0);assert.equal(shopping.duration,20);
  await openMeals();await text('.grocery-section','6,30');
  await click('.top-actions [data-action=undo]');
  await until(()=>js('document.querySelector("#toast").textContent.includes("Änderung rückgängig")'),'Einkaufsstopp rückgängig');
  assert.equal(store.current('interrail_swiss').state.manual.some(i=>i.shoppingSourceId==='local:carrefour-gran-via'),false);
  await click('[data-action=shopping-stop]');await set('dialog [name=store]','local:carrefour-gran-via');await save();
  await openMeals();await click('[data-action=shopping-stop]');
  assert.equal(await js('Boolean(document.querySelector(\'dialog [name=store] option[value="'+shopping.id+'"]\'))'),false,'Ein Besuch wird nicht erneut als Laden angeboten');
  await set('dialog [name=store]','local:carrefour-gran-via');await click('dialog [type=submit]');
  await text('dialog .form-error','bereits');await click('dialog [data-action=close]');
  await cdp('Page.navigate',{url:address+'&variant=interrail_swiss'});
  await text('h1','Reiseübersicht');await openMeals();
  await text('.meal-day-slot[data-meal-slot=breakfast]','Haferflocken mit Milch');
  await text('.meal-day-slot[data-meal-slot=lunch]','Kichererbsen-Mais-Salat');
  await text('.meal-day-slot[data-meal-slot=dinner]','Pasta');
  await set('#meal-date','2027-09-05');
  await js('document.querySelector("#meal-date").dispatchEvent(new Event("change",{bubbles:true}))');
  await text('.meal-day-slot[data-meal-slot=breakfast]','Noch keine Mahlzeit');
  await set('#meal-date','2027-09-04');
  await js('document.querySelector("#meal-date").dispatchEvent(new Event("change",{bubbles:true}))');
  for(const width of [1440,820,390]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
    await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    await openMeals();
    await js('document.querySelector(".meal-day-overview").scrollIntoView({block:"start"})');
    assert.ok(await js('document.documentElement.scrollWidth<=innerWidth+5'),'Drei Mahlzeiten ohne Seitenüberlauf');
    await screenshot('86-drei-mahlzeiten-'+width+'.png');
    if(width===1440){
      await js('document.querySelector(".meal-slot-tabs [data-value=breakfast]").focus()');
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
      await text('.meal-day-overview h2','Frühstück am');
      assert.equal(await js('document.activeElement.dataset.value'),'breakfast','Mahlzeitentaste behält Tastaturfokus');
      await click('.meal-slot-tabs [data-value=dinner]');
    }
    await click('.meal-staple-comparison>summary');
    await js('document.querySelector(".meal-staple-comparison").scrollIntoView({block:"center"})');
    await screenshot('87-basiskorb-'+width+'.png');
  }
  await click('.sidebar [data-action=page][data-value=overview]');
  await click('.swiss-focus-day-shortcuts [data-action=day-plan-go][data-value="2027-09-11"]');
  await openMeals();await click('.meal-slot-tabs [data-value=breakfast]');
  await click('.meal-card [data-action=meal-choose][data-value=kandersteg-oats]');
  await text('dialog','CHF');await set('dialog [name=start]','');await save();
  await openMeals();await text('.grocery-section','2,10');await text('.grocery-section','CHF');
  assert.equal(store.current('interrail_swiss').state.manual.find(i=>i.mealPlanId==='kandersteg-oats').price.currency,'CHF');
  // V85: actual Chrome navigation and screenshots for all four critical Swiss days,
  // two city segments and a 390px viewport. All scenarios are read-only.
  const swissExpensesBefore=JSON.stringify(store.current('interrail_swiss').state.expenses);
  const showEditorialDay=async (date,swissFinal)=>{
    await click('.sidebar [data-action=page][data-value=overview]');
    const selector=swissFinal
      ?'.swiss-focus-day-shortcuts [data-action=day-plan-go][data-value="'+date+'"]'
      :'.day-plan-overview-row[data-action=day-plan-go][data-value="'+date+'"]';
    if(!swissFinal&&!await js('document.querySelector(".day-plan-overview")?.open'))
      await click('.day-plan-overview>summary');
    await click(selector);
    await until(()=>js('document.querySelector(".swiss-day-editorial")?.textContent.includes("Morgen, Mittag & Abend")'),
      'V85 editorial visible for '+date);
    assert.equal(await js('document.querySelectorAll(".swiss-day-editorial .swiss-editorial-block").length'),3,
      'Three visible editorial blocks on '+date);
    await until(()=>js('Boolean(document.querySelector(".swiss-quality-day"))'),
      'V87 source/photo cards visible for '+date);
    assert.equal(await js('document.querySelectorAll(".swiss-quality-card").length'),
      ['2027-09-10','2027-09-14'].includes(date)?0:Math.min(4,
        Number(await js('document.querySelectorAll(".day-plan-stop").length'))),
      'Evidence cards correspond only to existing daily optional stops '+date);
    assert.ok(await js('document.querySelector(".swiss-quality-day").getBoundingClientRect().right<=innerWidth+3'),
      'V87 evidence cards fit browser width '+date);
    assert.ok(await js('document.querySelector(".swiss-day-editorial .swiss-editorial-sources a")!==null'),
      'Official source links in day '+date);
    assert.ok(await js('document.querySelector(".swiss-day-editorial")?.getBoundingClientRect().width<=innerWidth+1'),
      'No editorial card exceeds viewport '+date);
  };
  for(const date of ['2027-09-10','2027-09-11','2027-09-12','2027-09-13']){
    await showEditorialDay(date,true);
    await screenshot('88-v85-swiss-'+date.slice(-2)+'-desktop.png');
    if(['2027-09-11','2027-09-13'].includes(date)){
      await js('document.querySelector(".swiss-quality-day")?.scrollIntoView({block:"start",behavior:"instant"})');
      await screenshot('92-v87-swiss-'+date.slice(-2)+'-quality.png');
    }
  }
  for(const date of ['2027-09-02','2027-09-05','2027-09-06']){
    await showEditorialDay(date,false);
    await screenshot('89-v85-city-'+date.slice(-2)+'-desktop.png');
    if(date==='2027-09-06'){
      await js('document.querySelector(".swiss-quality-day")?.scrollIntoView({block:"start",behavior:"instant"})');
      await screenshot('93-v87-sete-quality.png');
    }
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  for(const date of ['2027-09-11','2027-09-13']){
    await showEditorialDay(date,true);
    await until(()=>js('getComputedStyle(document.querySelector(".swiss-editorial-grid")).gridTemplateColumns.split(" ").length===1'),
      'V85 mobile three-part card stack '+date);
    assert.ok(await js('document.querySelector(".swiss-day-editorial").getBoundingClientRect().right<=innerWidth+2'),
      'V85 cards fit mobile viewport '+date);
    await screenshot('90-v85-swiss-'+date.slice(-2)+'-mobile.png');
    await js('document.querySelector(".swiss-quality-day")?.scrollIntoView({block:"start",behavior:"instant"})');
    await screenshot('94-v87-swiss-'+date.slice(-2)+'-quality-mobile.png');
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  assert.equal(JSON.stringify(store.current('interrail_swiss').state.expenses),swissExpensesBefore,
    'Reading V85 editorials does not edit the trip expenses');
  assert.equal(store.current('swiss_lakes').state.people.length,4,
    'The separate Swiss lakes four-person itinerary remains unchanged');
  console.log('PASS V85 Browser: days 10-13, Paris 02, Barcelona 05, 390px, source links, no budget writes');
  await cdp('Page.navigate',{url:address+'&variant=interrail_classic'});
  await text('h1','Reiseübersicht');await openMeals();
  await text('.meal-day-slot[data-meal-slot=breakfast]','Noch keine Mahlzeit');
  assert.equal(store.current('interrail_classic').state.manual.some(i=>i.mealSlot==='breakfast'),false);
  assert.deepEqual(pageErrors,[],'Keine Browser-JavaScript-Ausnahmen im gesamten Ablauf');
  console.log('PASS: drei Mahlzeiten, kalte Zutaten, offene Preise, Belegschutz, Einkaufsstopp, Datum/Varianten und drei Bildschirmgrößen');
  console.log('PASS: echter Chrome-Flow · Mahlzeit, gemeinsamer Warenkorb, Preisänderung, Persistenz, Budget und mobile Karte');
} finally {
  socket?.close();
  const exited = child.exitCode == null && child.signalCode == null ? once(child, 'exit') : Promise.resolve();
  child.kill();
  await Promise.race([exited, waitMs(5000)]);
  // The server closes the SQLite store itself in its 'close' listener.
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
}
