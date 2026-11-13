import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
  '--user-data-dir=' + profile, '--window-size=1280,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
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
  const save = async () => {
    await click('dialog [type=submit]');
    const result = await until(() => js('(() => { const d = document.querySelector("dialog"); return d?.open === false ? "closed" : d?.querySelector(".form-error")?.textContent || null; })()'),
      'Dialog wird gespeichert');
    if (result !== 'closed') throw new Error('Validierungsfehler beim Speichern: ' + result);
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Page.navigate', { url: address });
  await text('h1', 'Barcelona');
  // The tour navigates read-only and is dismissible by Escape.
  await click('[data-action=guide-start]');
  await text('.guide-panel', 'Tagesplan verstehen');
  assert.equal(await js('document.querySelector(".guide-panel")?.getAttribute("aria-modal")'),'true');
  await click('.guide-panel [data-action=guide-next]');
  await text('h1','Karten-Explorer');
  await text('.guide-panel', 'Orte und Routen entdecken');
  await click('.guide-panel [data-action=guide-next]');
  await text('h1','Unterkünfte');
  await text('.guide-panel', 'Unterkünfte vergleichen');
  await click('.guide-panel [data-action=guide-prev]');
  await text('h1','Karten-Explorer');
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
  await click('.sidebar [data-action=page][data-value=plan]');
  await text('h1','Barcelona');
  // Global trip explorer: all source-backed categories, geographic scope,
  // search, real routing attempt and explicitly adding a restaurant to a day.
  await click('.sidebar [data-action=page][data-value=map]');
  await text('h1', 'Karten-Explorer');
  await text('#main', 'Alle passenden Orte');
  await until(() => js('Boolean(document.querySelector(".explorer-list.is-compact"))'), 'Kompakte Ortsliste');
  await click('[data-action=explorer-viewport]');
  await until(() => js('document.querySelector("[data-action=explorer-viewport]")?.getAttribute("aria-pressed")==="true"'), 'Liste nur für Kartenausschnitt');
  await click('[data-action=explorer-viewport]');
  await click('[data-action=explorer-display][data-value=details]');
  await until(() => js('!document.querySelector(".explorer-list")?.classList.contains("is-compact")'), 'Ausführliche Ortskarten');
  await click('[data-action=explorer-display][data-value=compact]');
  await text('#main', 'Reiseroute entdecken');
  await until(() => js('document.querySelectorAll(".route-city-step").length >= 4'), 'Interaktive Stadtetappen');
  await until(() => js('document.querySelectorAll(".map-legend-control").length===5'),'Fünf anklickbare Kartenkategorien');
  await click('.map-legend-control[data-value=food]');
  await until(() => js('document.querySelector(".map-legend-control[data-value=food]")?.getAttribute("aria-pressed")==="true"'),'Kategorie direkt auf Kartenlegende gewählt');
  await click('[data-action=explorer-reset]');
  await until(() => js('document.querySelector(".explorer-scope")?.textContent.includes("Gesamte Reise")'), 'Kartenfilter zurückgesetzt');
  await click('[data-action=map-tone][data-value=midnight]');
  await until(() => js('document.querySelector(".map-wrap")?.dataset.mapTone === "midnight"'), 'Midnight Kartenstil');
  assert.equal(await js('localStorage.getItem("reiseplan-map-tone")'),'midnight');
  await click('[data-action=map-tone][data-value=sand]');
  await until(() => js('document.querySelector(".map-wrap")?.dataset.mapTone === "sand"'), 'Sand Kartenstil');
  await click('[data-action=map-expand]');
  await until(() => js('document.querySelector(".map-panel")?.classList.contains("map-immersive")'), 'Große Kartendarstellung');
  await click('[data-action=map-expand]');
  await until(() => js('!document.querySelector(".map-panel")?.classList.contains("map-immersive")'), 'Normale Kartendarstellung');
  await until(() => js('document.querySelectorAll("#map .pin.place-activity, #map .pin.place-food, #map .pin.place-lodging, #map .poi-cluster-icon").length > 0'),
    'Kategorie-Pins im Reiseatlas');
  await text('#main', 'Tagesideen aus deinem älteren Reiseprofil');
  await click('[data-action=explorer-scope][data-value=city]');
  await click('[data-action=explorer-group][data-value=food]');
  await until(() => js('(document.querySelectorAll("#map .pin.place-food").length + document.querySelectorAll("#map .poi-cluster-icon").length) > 0 && document.querySelectorAll("#map .pin.place-lodging").length === 0'), 'Nur Restaurantkategorie im Städtefilter');
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
  await text('h1', 'Karten-Explorer');
  // All archived research areas are exposed in the actual UI, read-only by default.
  await click('.sidebar [data-action=page][data-value=group]');
  await text('#main', 'Umfrage · drei Personen');
  await text('#main', 'Meer und Strände besuchen');
  await text('#main', '60 €');
  await click('.sidebar [data-action=page][data-value=lodging]');
  await until(() => js('Boolean(document.querySelector("#nightly-target"))'), 'Nachtbudget-Eingabe');
  await until(() => js('document.querySelectorAll(".lodging-price-meter").length > 0'), 'Unterkunfts-Budgetbalken');
  await set('#nightly-target', '40');
  await js('document.querySelector("#nightly-target").dispatchEvent(new Event("change",{bubbles:true}))');
  await until(() => js('document.querySelector("#nightly-target")?.value === "40"'),'Budgetziel angepasst');
  assert.equal(await js('localStorage.getItem("reiseplan-nightly-target")'),'40');
  await js('document.querySelectorAll(".option-card [data-action=compare]")[0].click()');
  await js('document.querySelectorAll(".option-card [data-action=compare]")[1].click()');
  await until(() => js('document.querySelectorAll(".stay-compare-card").length === 2'),
    'Interaktiver Vergleich von zwei Unterkünften');
  await text('.stay-compare-board','Küche');
  await text('#main', 'Suchpreis-Snapshots');
  await text('.provider-quote-panel', '2027-09-03 bis 2027-09-06');
  await until(() => js('document.querySelectorAll(".provider-quote-card").length === 10'),
    '10 unbooked September Barcelona provider offers');
  assert.ok(await js('document.querySelector(".provider-quote-card")?.textContent.includes("HeyLola!")'));
  const priorProviderState=JSON.stringify(store.current('interrail_classic').state);
  await click('.provider-quote-panel [data-action=provider-budget]');
  await until(() => js('document.querySelectorAll(".provider-quote-card").length < 10'),
    'Provider nightly budget filter');
  await click('.provider-quote-panel [data-action=provider-budget]');
  await set('#provider-quote-sort', 'rating');
  await js('document.querySelector("#provider-quote-sort").dispatchEvent(new Event("change",{bubbles:true}))');
  await until(() => js('document.querySelector(".provider-quote-card")?.textContent.includes("SM Hotel Sant Antoni")'),
    'Booking score sorting');
  assert.equal(JSON.stringify(store.current('interrail_classic').state),priorProviderState,
    'Research controls must not write to the trip');
  await text('#main', 'Datenlücken im Hotelvergleich');
  await click('[data-action=option-filter][data-value=search]');
  await text('.grid-cards', 'HeyLola! Hostel');
  await text('.grid-cards', '31,77');
  const scopedHotelSearchCount = catalog.trips.find(trip => trip.id === 'interrail_classic')
    .items.filter(item => item.city === 'barcelona' && item.kind === 'lodging'
      && item.quote && !item.duplicateOf).length;
  assert.equal(await js('document.querySelectorAll(".option-card").length'), scopedHotelSearchCount);
  await text('.grid-cards', 'Airbnb');
  assert.ok(await js('!document.querySelector(".option-card").textContent.includes("gebucht")')
    || await js('document.querySelector(".option-card").textContent.includes("nicht gebucht")'));
  await click('.sidebar [data-action=page][data-value=discover]');
  await text('.grid-cards', 'Gruppeninteresse');
  await set('#sort', 'score');
  await js('document.querySelector("#sort").dispatchEvent(new Event("change", { bubbles: true }))');
  await text('#main', 'Gruppeninteresse');
  await click('.sidebar [data-action=page][data-value=rail]');
  await text('#main', 'Fahrplan- und Preisrecherche · 2027');
  await text('#main', 'Pass-Reisetage und Tarifprüfung');
  await text('#main', 'Alternative Bahnverbindungen · Hypothesen');
  await text('#main', 'Bahnkorridore & offizielle Betreiber');
  await text('.rail-review-panel','Bahn-Prüfzeitleiste 2027');
  await until(() => js('document.querySelectorAll(".rail-review-step").length === 7'),
    'Seven original rail departures have review windows');
  await text('.rail-review-panel','Prüfung vormerken');
  await text('#main', '2027: Fahrzeit, Verfügbarkeit und Preise offen');
  await click('.sidebar [data-action=page][data-value=data]');
  await text('#main', 'Forschungsarchiv');
  await text('#main', 'Offene Datenqualitätsbefunde');
  await text('#main', 'Standortprüfung · öffentliche Adressen');
  await text('#main', 'Bildabdeckung & offene Quellenfotos');
  assert.ok(await js('document.querySelector(".provider-location-panel")?.textContent.includes("Adress-/Identitätskonflikte")'));
  assert.ok(await js('document.querySelector(".provider-location-panel")?.textContent.includes("Via Giuseppe Ratti")'));
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
  await text('#main', 'Selbst kochen oder auswärts essen');
  await click('.meal-card [data-action=meal-choose][data-value=pasta]');
  await text('dialog', 'Pasta mit Tomate');
  await save();
  await click('.sidebar [data-action=page][data-value=food]');
  await text('#main', 'Gemeinsamer Einkaufswarenkorb');
  await text('#main', '2,80');
  await click('[data-action=grocery-edit]');
  await set('dialog [name=unitPrice]', '1.25');
  await save();
  await text('#main', '3,25');
  const state = store.current('interrail_classic').state;
  assert.equal(Object.keys(state.groceryOverrides ?? {}).length, 1);
  await cdp('Page.navigate', { url: address });
  await text('h1', 'Barcelona');
  await click('.sidebar [data-action=page][data-value=food]');
  await text('#main', '3,25');
  await click('.sidebar [data-action=page][data-value=budget]');
  await text('#main', '3,25');
  // A second planned dinner must reuse packages and automatically increase
  // an earlier override if the combined quantity now needs more packs.
  await click('.sidebar [data-action=page][data-value=food]');
  await set('#meal-date', '2027-09-05');
  await js('document.querySelector("#meal-date").dispatchEvent(new Event("change", { bubbles: true }))');
  await text('#main', 'Abendessen am 05.09.2027');
  await click('.meal-card [data-action=meal-choose][data-value=pasta]');
  await save();
  await click('.sidebar [data-action=page][data-value=food]');
  await text('#main', '6,50');
  await text('#main', 'Packungen an den gesamten Bedarf angepasst');
  assert.equal(store.current('interrail_classic').state.manual.filter(i => i.mealPlanId === 'pasta').length, 2);
  await click('.sidebar [data-action=page][data-value=budget]');
  await text('#main', '6,50');
  // An explicit hotel candidate selection is local, unbooked and confined
  // to the matching 3-person September classic variant.
  await click('.sidebar [data-action=page][data-value=lodging]');
  await click('[data-action=option-filter][data-value=search]');
  await text('.grid-cards', 'HeyLola! Hostel');
  await click('[data-action=choose][data-value="research:bcom_12814471"]');
  await text('dialog', 'keine Reservierung oder Zahlung');
  await save();
  assert.equal(store.current('interrail_classic').state.edits['research:bcom_12814471'].selected, true);
  assert.equal(store.current('interrail_swiss').state.edits['research:bcom_12814471'], undefined);
  // Document a five-point, user-reported provider checkout; this only changes
  // the explicitly selected local plan price, never the supplier's booking.
  await click('.sidebar [data-action=page][data-value=lodging]');
  await click('[data-action=option-filter][data-value=search]');
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
  await text('#main', 'Eigene Prüfung 5/5');
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
  await click('[data-action=mobile][data-value=map]');
  await until(() => js('Boolean(document.querySelector("#map .leaflet-pane"))'), 'mobile Karte');
  assert.ok(await js('document.documentElement.scrollWidth <= window.innerWidth + 5'), 'Mobiles Layout hat horizontalen Überlauf.');
  console.log('PASS: echter Chrome-Flow · Mahlzeit, gemeinsamer Warenkorb, Preisänderung, Persistenz, Budget und mobile Karte');
} finally {
  socket?.close();
  child.kill();
  // The server closes the SQLite store itself in its 'close' listener.
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
