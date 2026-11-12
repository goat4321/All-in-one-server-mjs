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
  let seq = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
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
  // Global trip explorer: all source-backed categories, geographic scope,
  // search, real routing attempt and explicitly adding a restaurant to a day.
  await click('.sidebar [data-action=page][data-value=map]');
  await text('h1', 'Karten-Explorer');
  await text('#main', 'Alle passenden Orte');
  await until(() => js('document.querySelectorAll("#map .pin.place-activity, #map .pin.place-food, #map .pin.place-lodging").length > 0'),
    'Kategorie-Pins im Reiseatlas');
  await text('#main', 'Tagesideen aus deinem älteren Reiseprofil');
  await click('[data-action=explorer-scope][data-value=city]');
  await click('[data-action=explorer-group][data-value=food]');
  await until(() => js('document.querySelectorAll("#map .pin.place-food").length > 0 && document.querySelectorAll("#map .pin.place-lodging").length === 0'), 'Nur Restaurantkategorie im Städtefilter');
  await text('#main', 'Bormuth');
  await set('#map-search', 'Bormuth');
  await click('[data-action=explorer-search]');
  await until(() => js('document.querySelectorAll(".explorer-place").length === 1'), 'Restaurantsuche');
  await text('.explorer-place', 'Bormuth');
  await set('#map-search', '');
  await click('[data-action=explorer-search]');
  await text('#main', 'Taberna Nardi');
  await click('[data-action=explorer-start][data-value="local:bormuth"]');
  await click('[data-action=explorer-end][data-value="local:nardi"]');
  await until(() => js('document.querySelector(".explorer-status")?.textContent.includes("Fußweg")'),
    'Fußroute oder ehrliche Router-Fehlermeldung');
  await text('#main', 'ÖPNV-Route extern ansehen');
  await click('[data-action=choose][data-value="local:nardi"]');
  await text('dialog', 'Aktivität einplanen');
  await save();
  assert.equal(store.current('interrail_classic').state.edits['local:nardi'].selected, true);
  assert.equal(store.current('interrail_swiss').state.edits['local:nardi'], undefined);
  await text('h1', 'Barcelona');
  // All archived research areas are exposed in the actual UI, read-only by default.
  await click('.sidebar [data-action=page][data-value=group]');
  await text('#main', 'Umfrage · drei Personen');
  await text('#main', 'Meer und Strände besuchen');
  await text('#main', '60 €');
  await click('.sidebar [data-action=page][data-value=lodging]');
  await text('#main', 'Suchpreis-Snapshots');
  await click('[data-action=option-filter][data-value=search]');
  await text('.grid-cards', 'HeyLola! Hostel');
  await text('.grid-cards', '31,77');
  assert.equal(await js('document.querySelectorAll(".option-card").length'), 13);
  assert.ok(await js('!document.querySelector(".option-card").textContent.includes("gebucht")')
    || await js('document.querySelector(".option-card").textContent.includes("nicht gebucht")'));
  await click('.sidebar [data-action=page][data-value=discover]');
  await text('.grid-cards', 'Gruppeninteresse');
  await set('#sort', 'score');
  await js('document.querySelector("#sort").dispatchEvent(new Event("change", { bubbles: true }))');
  await text('#main', 'Gruppeninteresse');
  await click('.sidebar [data-action=page][data-value=rail]');
  await text('#main', 'Fahrplan- und Preisrecherche · 2027');
  await text('#main', 'Alternative Bahnverbindungen · Hypothesen');
  await click('.sidebar [data-action=page][data-value=data]');
  await text('#main', 'Forschungsarchiv');
  await text('#main', 'Offene Datenqualitätsbefunde');
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
