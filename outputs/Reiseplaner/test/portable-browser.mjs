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
const { server, store } = await createApp({ database: join(profile, 'app.sqlite'), upstream: false });
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
    'Chrome CDP Port', 16000);
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
    await until(() => js('document.querySelector("dialog")?.open === false'), 'Dialog wird gespeichert');
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Page.navigate', { url: address });
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
  assert.equal(await js('document.querySelectorAll(".option-card").length'), 10);
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
  await click('.sidebar [data-action=page][data-value=plan]');
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
