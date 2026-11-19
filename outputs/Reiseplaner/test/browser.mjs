import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

const candidates = [process.env.REISEPLAN_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].filter(Boolean);
const browser = candidates.find(existsSync);
assert.ok(browser, 'Chrome oder Edge installieren oder REISEPLAN_BROWSER setzen.');
const profile = await mkdtemp(join(tmpdir(), 'reiseplan-browser-'));
const { server, store } = await createApp({ database: join(profile, 'test.sqlite'), upstream: false });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const liveTiles = process.env.REISEPLAN_CHECK_TILES === '1';
const url = 'http://127.0.0.1:' + server.address().port + (liveTiles ? '/' : '/?offlineMap');
const child = spawn(browser, ['--headless=new', '--remote-debugging-port=0', '--disable-gpu', '--disable-background-networking',
  '--disable-extensions', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + profile, '--window-size=1440,1050', 'about:blank'],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const stderr = [];
child.stderr.on('data', d => stderr.push(String(d)));
const exited = once(child, 'exit').catch(() => {});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(fn, label, time = 8000) {
  const until = Date.now() + time;
  while (Date.now() < until) {
    const value = await fn();
    if (value) return value;
    await delay(80);
  }
  throw new Error(label + ' · ' + stderr.slice(-3).join(''));
}

let socket;
const errors = [];
try {
  const port = await retry(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n')[0]; } catch { return null; }
  }, 'Browser-Debugger startet nicht', 14000);
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  const pending = new Map();
  let seq = 0;
  socket.addEventListener('message', event => {
    const frame = JSON.parse(event.data);
    if (frame.method === 'Runtime.exceptionThrown') errors.push(frame.params.exceptionDetails.exception?.description ?? frame.params.exceptionDetails.text);
    if (frame.id) {
      const callback = pending.get(frame.id);
      pending.delete(frame.id);
      if (frame.error) callback.reject(new Error(frame.error.message));
      else callback.resolve(frame.result);
    }
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++seq, { resolve, reject });
    socket.send(JSON.stringify({ id: seq, method, params }));
  });
  const js = async expression => {
    const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    return response.result.value;
  };
  const selector = s => 'document.querySelector(' + JSON.stringify(s) + ')';
  const wait = s => retry(() => js('Boolean(' + selector(s) + ')').catch(() => false), 'Element fehlt: ' + s);
  const click = async s => {
    await wait(s);
    await js(selector(s) + '.click()');
  };
  const hasText = (s, label) => retry(() => js(selector(s) + '?.textContent.includes(' + JSON.stringify(label) + ')').catch(() => false), label + ' fehlt in ' + s);
  const set = async (s, val) => {
    await wait(s);
    await js(selector(s) + '.value=' + JSON.stringify(val));
  };
  const chooseVariant = async id => {
    await set('#variant', id);
    await js('document.querySelector("#variant").dispatchEvent(new Event("change", { bubbles: true }))');
  };
  const save = async () => {
    await click('dialog [type=submit]');
    await retry(() => js('!document.querySelector("dialog").open'), 'Speichern schließt Dialog nicht');
  };
  const nav = id => click('.sidebar [data-action=page][data-value="' + id + '"]');
  const screenshot = async name => {
    const folder = process.env.REISEPLAN_SCREENSHOTS;
    if (!folder) return;
    await mkdir(folder, { recursive: true });
    const image = await cdp('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(folder, name + '.png'), Buffer.from(image.data, 'base64'));
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Page.navigate', { url });
  await hasText('h1', 'Barcelona');
  await hasText('.timeline', 'Poblenou & Bogatell Beach');
  await hasText('.timeline', '35 Min.');
  await wait('.leaflet-marker-icon');
  assert.ok(await js('document.querySelector("#map .leaflet-overlay-pane svg").getBoundingClientRect().width > 200'),
    'Die Vektorebene darf nicht auf Icon-Größe begrenzt sein.');
  if (liveTiles) {
    async function waitForTiles() {
      await retry(() => js('document.querySelectorAll(".leaflet-tile").length > 0 && [...document.querySelectorAll(".leaflet-tile")].every(i=>i.complete&&i.naturalWidth>0)'),
        'Nicht alle sichtbaren Straßenkacheln geladen', 16000);
    }
    await waitForTiles();
    await screenshot('barcelona-strassenkarte');
    await click('.sidebar [data-action=city][data-value=genoa]');
    await hasText('.timeline', '12 Min.');
    await click('[data-action=transit][data-value=metro]');
    await hasText('.leaflet-control-attribution', 'AMT / Comune di Genova');
    await waitForTiles();
    await screenshot('genua-strassenkarte');
    await click('.sidebar [data-action=city][data-value=venice]');
    await hasText('.timeline', '21 Min.');
    await click('[data-action=transit][data-value=ferry]');
    await hasText('.leaflet-control-attribution', 'ACTV / Comune di Venezia');
    await waitForTiles();
    await screenshot('venedig-strassenkarte');
    await click('.sidebar [data-action=city][data-value=nice]');
    await hasText('.timeline', '16 Min.');
    await click('[data-action=transit][data-value=tram]');
    await hasText('.leaflet-control-attribution', 'Lignes d’Azur');
    await waitForTiles();
    await screenshot('nizza-strassenkarte');
    await chooseVariant('swiss_lakes');
    await wait('.sidebar [data-action=city][data-value=wasserauen]');
    await click('[data-action=day][data-value="2027-09-06"]');
    await click('.map-tools [data-action=filter][data-value=hiking]');
    await hasText('.leaflet-control-attribution', 'Wanderwege © swisstopo');
    await retry(() => js('[...document.querySelectorAll(".hiking-reference .leaflet-tile")].some(i=>i.complete&&i.naturalWidth===256)'),
      'Amtliche Wanderwegkacheln fehlen', 16000);
    await waitForTiles();
    await screenshot('wasserauen-wanderwege');
    console.log('PASS Straßenkarte · Barcelona, Genua, Venedig, Nizza und Schweizer Wanderwegenetz');
  } else {
  await click('.event-content[data-value="tripsy:activity:4323012"]');
  await hasText('#point-detail', 'Poblenou & Bogatell Beach');
  assert.equal(await js('document.querySelectorAll(".pin.focused").length'), 1);
  await click('.leaflet-marker-icon[title="Parc de la Ciutadella"]');
  await hasText('#point-detail', 'Parc de la Ciutadella');
  assert.equal(await js(selector('.event-content[data-value="tripsy:activity:4323013"]') + '.getAttribute("aria-pressed")'), 'true');
  await click('[data-action=transit][data-value=metro]');
  await retry(() => js('document.querySelectorAll("#map path.leaflet-interactive").length > 20'), 'Metrogeometrie fehlt');
  await click('[data-action=transit][data-value=metro]');
  await screenshot('barcelona-desktop');
  console.log('PASS Desktop · Karte ↔ Timeline, echter Fußweg, Metro-Layer');

  await click('.timeline .connector[data-action=leg]');
  await click('dialog [data-action=scheduled-route]');
  await hasText('dialog', 'Für euren Reisetag 04.09.2027');
  await set('dialog [name=time]', '15:30');
  await click('dialog [type=submit]');
  await hasText('dialog', 'außerhalb des veröffentlichten Fahrplanpakets');
  await set('dialog [name=serviceDate]', '2026-11-14');
  await click('dialog [type=submit]');
  await hasText('dialog', 'Fahrplanreferenz · 14.11.2026');
  await hasText('.timetable-result', 'Ciutadella | Vila Olímpica');
  await hasText('.timetable-result', '8,70');
  assert.equal(await js('Boolean(document.querySelector("dialog [data-action=transit-adopt]"))'), false);
  await click('dialog [data-action=transit-preview]');
  await hasText('.map-preview', '14.11.2026 · L4');
  await wait('path.timetable-preview-line');
  assert.equal(Object.keys(store.current('interrail_classic').state.localRoutes).length, 0);
  await screenshot('barcelona-fahrplan');
  await click('[data-action=transit-clear]');
  console.log('PASS Barcelona · Datumsprüfung, TMB-Fahrplanreferenz und Kartenverlauf');

  await nav('lodging');
  await hasText('h1', 'Unterkünfte');
  await hasText('.grid-cards', '30 Min. zu Fuß');
  await click('[data-action=compare][data-value="tripsy:lodging:1407384"]');
  await click('[data-action=compare][data-value="research:opt-barcelona-stchristophers"]');
  await hasText('table', 'St Christopher');
  await hasText('table', 'Gemeinschaftsküche');
  await click('[data-action=choose][data-value="tripsy:lodging:1407384"]');
  await hasText('dialog', '435,24');
  await save();
  await hasText('.insight', 'Bird House');
  await hasText('.timeline', 'Ab Unterkunft · Fußweg · 69 Min.');
  await nav('budget');
  await hasText('.stat-grid', '435,24');
  await hasText('.split', '145,08');
  assert.equal((await js('document.querySelector("table").textContent.match(/Bird House/g)?.length')), 1);
  assert.equal(await js('document.querySelector("table").textContent.includes("St Christopher")'), false);
  await nav('lodging');
  await click('[data-action=choose][data-value="research:opt-barcelona-stchristophers"]');
  await hasText('dialog', 'Ersetzt Bird House');
  await save();
  await hasText('.insight', 'St Christopher');
  await hasText('.timeline', 'Ab Unterkunft · Fußweg · 56 Min.');
  await nav('budget');
  await hasText('table', 'St Christopher');
  assert.equal(await js('document.querySelector("table").textContent.includes("Bird House")'), false);
  await click('.topbar [data-action=undo]');
  await hasText('table', 'Bird House');
  console.log('PASS Auswahl · Gruppenpreis einmal, Alternativen ohne Effekt, Wechsel und Undo');

  await nav('discover');
  await click('[data-action=choose][data-value="research:a035"]');
  await set('dialog [name=start]', '17:00');
  await save();
  await hasText('.timeline', 'Sagrada Família');
  await nav('budget');
  await hasText('.stat-grid', '513,24');
  await nav('rail');
  await hasText('h1', 'Bahn & Interrail');
  await hasText('.stack', 'Barcelona Sants');
  await js('document.querySelector("#variant").value="interrail_swiss"; document.querySelector("#variant").dispatchEvent(new Event("change",{bubbles:true}))');
  await hasText('.crumb strong', 'Schweiz Variante');
  await nav('plan');
  assert.equal(await js('document.querySelector(".timeline").textContent.includes("Sagrada Família")'), false);
  await js('document.querySelector("#variant").value="interrail_classic"; document.querySelector("#variant").dispatchEvent(new Event("change",{bubbles:true}))');
  await hasText('.timeline', 'Sagrada Família');
  await cdp('Page.reload', {});
  await hasText('.timeline', 'Sagrada Família');
  await hasText('.insight', 'Bird House');
  assert.equal(store.current('interrail_classic').state.edits['research:a035'].selected, true);
  console.log('PASS Aktivität · synchrones Budget, separate Variante und Reload');

  await click('[data-action=add]');
  await set('dialog [name=name]', 'Abnahmetest Pause');
  await set('dialog [name=start]', '16:30');
  await set('dialog [name=duration]', '80');
  await save();
  await hasText('.timeline', 'Abnahmetest Pause');
  await hasText('.timeline-panel .alert', 'überschneidet');
  await click('.event-card:has(.event-content[data-value^="manual:"]) [data-action=edit]');
  await click('dialog [data-action=remove]');
  await retry(async () => !(await js('document.querySelector(".timeline").textContent.includes("Abnahmetest Pause")')), 'Gelöschte Pause bleibt sichtbar');
  await click('[data-action=show-route]');
  await hasText('.map-panel', 'Trassen schematisch');
  assert.ok(await js('document.querySelectorAll(".leaflet-marker-icon").length >= 7'));
  await click('.leaflet-marker-icon[title="Barcelona"]');
  await hasText('h1', 'Barcelona');
  console.log('PASS Tageslogik · Anlegen, Konflikt, Löschen und Navigation über Gesamtroute');

  await click('.sidebar [data-action=city][data-value=genoa]');
  await hasText('h1', 'Genua');
  await hasText('.timeline', 'Genova Piazza Principe');
  await hasText('.timeline', '12 Min.');
  await click('[data-action=transit][data-value=metro]');
  await hasText('.leaflet-control-attribution', 'AMT / Comune di Genova');
  await wait('.leaflet-overlay-pane path.leaflet-interactive');
  await click('.event-content[data-value="tripsy:transport:3842729"]');
  await hasText('#point-detail', 'Piazza Acquaverde');
  await nav('lodging');
  await hasText('.grid-cards', 'Ostello Bello / Hotel Britannia');
  await hasText('.grid-cards', '3 Min. zu Fuß');

  await nav('plan');
  await click('.sidebar [data-action=city][data-value=venice]');
  await hasText('h1', 'Venedig');
  await hasText('.timeline', '21 Min.');
  await click('[data-action=transit][data-value=ferry]');
  await hasText('.leaflet-control-attribution', 'ACTV / Comune di Venezia');
  await retry(() => js('document.querySelectorAll("#map path.leaflet-interactive").length > 20'), 'Vaporetto-Geometrie fehlt');
  await screenshot('venedig-vaporetto');
  await nav('lodging');
  await hasText('.grid-cards', 'Generator Venice');
  await hasText('.grid-cards', 'Venezia Mestre');
  await click('[data-action=compare][data-value="research:venice-ao-mestre"]');
  await click('[data-action=compare][data-value="research:venice-generator"]');
  await hasText('table', 'Ab Venezia Mestre');
  await hasText('table', 'Vaporetto zum Anleger Zitelle');
  await nav('budget');
  await click('[data-action=mobility]');
  await set('dialog [name=value]', '4');
  await save();
  await hasText('#main', '114,00');
  await hasText('#main', '105,00');
  await hasText('#main', '9,00');
  assert.equal(store.current('interrail_classic').state.mobility.venice, 4);
  assert.equal(store.current('interrail_swiss').state.mobility.venice, undefined);
  await nav('plan');
  console.log('PASS Städtepaket · Italienische Tageswege, Netzebenen, Unterkunftsvergleich und Gruppenpreise');

  await click('.sidebar [data-action=city][data-value=nice]');
  await hasText('.timeline', '16 Min.');
  await click('[data-action=transit][data-value=tram]');
  await hasText('.leaflet-control-attribution', 'Lignes d’Azur');
  await hasText('.map-legend', '12.11.–22.12.2026');
  await click('.map-panel [data-action=layers]');
  await click('dialog [data-action=transit][data-value=bus]');
  await click('dialog [data-action=close]');
  await retry(() => js('document.querySelectorAll("#map path.leaflet-interactive").length > 2700'), 'Nizzas Busnetz fehlt');
  await click('.map-panel [data-action=layers]');
  await click('dialog [data-action=transit][data-value=bus]');
  await click('dialog [data-action=close]');
  await nav('lodging');
  await hasText('.grid-cards', '4 Min. zu Fuß');
  await click('[data-action=compare][data-value="tripsy:lodging:1407386"]');
  await click('[data-action=compare][data-value="research:opt-nice-antares"]');
  await hasText('table', '269,50');
  await hasText('table', 'Dreibettzimmer');
  await nav('budget');
  await click('[data-action=mobility]');
  await set('dialog [name=value]', '5');
  await save();
  await hasText('#main', '25,50');
  await hasText('#main', '21,00');
  await hasText('#main', '4,50');
  assert.equal(store.current('interrail_classic').state.mobility.nice, 5);
  await nav('plan');
  await click('.timeline .connector[data-action=leg]');
  await set('dialog [name=mode]', 'ÖPNV');
  await set('dialog [name=minutes]', '17');
  await set('dialog [name=line]', 'Testlinie L1');
  await set('dialog [name=source]', 'https://www.lignesdazur.com/');
  await set('dialog [name=price]', '1,70');
  await set('dialog [name=scope]', 'person');
  await save();
  await hasText('.timeline', 'Testlinie L1 · 17 Min.');
  await hasText('.timeline', '5,10');
  const [savedWay] = Object.values(store.current('interrail_classic').state.localRoutes);
  assert.deepEqual([savedWay.date, savedWay.fare.cents, savedWay.fare.scope], ['2027-09-08', 170, 'person']);
  assert.equal(store.current('interrail_swiss').state.localRoutes && Object.keys(store.current('interrail_swiss').state.localRoutes).length, 0);
  await click('.timeline .connector[data-action=leg]');
  await hasText('dialog', '08.09.2027');
  await hasText('dialog', '1,70');
  await click('dialog [data-action=close]');
  console.log('PASS Nizza · Tram, Bus, Unterkunftsvergleich, Tarifrechnung und datierter Wegpreis');

  await chooseVariant('interrail_swiss');
  await wait('.sidebar [data-action=city][data-value=kandersteg]');
  await click('[data-action=day][data-value="2027-09-10"]');
  await click('[data-action=day-place][data-value=all]');
  await hasText('.map-legend', 'Tagesfahrt · Schema');
  await wait('#map path[stroke-dasharray="7 8"]');
  await click('.event-content[data-value="tripsy:transport:3890067:Abfahrt"]');
  await hasText('#point-detail', 'Avenue Thiers');
  await click('.event-content[data-value="tripsy:transport:3890067:Ankunft"]');
  await hasText('#point-detail', 'Bahnhof Kandersteg');
  assert.equal(await js('document.querySelectorAll(".pin.focused").length'), 1);
  await click('[data-action=day][data-value="2027-09-11"]');
  await hasText('.timeline-panel', 'allein der Fußweg rund 30 Min.');
  await hasText('.timeline', 'Gondel + ca. 30 Min. zu Fuß ab Bergstation');
  await click('.timeline .connector[data-action=leg]');
  await hasText('dialog', 'Offizielle Wegbeschreibung');
  assert.equal(await js('Boolean(document.querySelector("dialog [data-action=calculate]"))'), false);
  await click('dialog [data-action=close]');
  await screenshot('kandersteg-tagesplan');
  await chooseVariant('swiss_lakes');
  await wait('.sidebar [data-action=city][data-value=wasserauen]');
  await click('[data-action=day][data-value="2027-09-06"]');
  await hasText('.timeline', 'Parkplatz & Wanderstart Wasserauen');
  await hasText('.timeline', 'Seealpsee-Wanderung');
  await hasText('.timeline', 'Rundtour T2');
  await hasText('.timeline', 'Autofahrt');
  assert.ok(await js(`(() => {
    const [arrival, start] = ['Ankunft · Appenzell → Wasserauen', 'Parkplatz & Wanderstart Wasserauen'].map(title =>
      [...document.querySelectorAll('.leaflet-marker-icon')].find(marker => marker.title.includes(title)));
    return Math.abs(arrival.getBoundingClientRect().x - start.getBoundingClientRect().x) >= 20;
  })()`));
  await click('[data-action=day-place][data-value=seealpsee]');
  assert.equal(await js('document.querySelector(".timeline").textContent.includes("Parkplatz & Wanderstart")'), false);
  await click('[data-action=day][data-value="2027-09-10"]');
  await hasText('.timeline-panel', '08:30–18:00');
  await chooseVariant('interrail_classic');
  await wait('.sidebar [data-action=city][data-value=venice]');
  await click('.sidebar [data-action=city][data-value=barcelona]');
  console.log('PASS Schweiz · Ganzer Tag, Ortsfilter, beide Bahnmarker und Gondel-Zeitfenster');

  await nav('food');
  await wait('#meal-date');
  assert.equal(await js(`(() => {
    const select = document.querySelector('#meal-date');
    select.value = '2027-09-03';
    const date = select.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return date;
  })()`), '2027-09-03');
  await hasText('#main', 'Abendessen am 03.09.2027');
  await hasText('.grid-cards', '2,80');
  await hasText('.grid-cards', '49,00');
  await hasText('.grid-cards', '53,90');
  await hasText('#main', 'Bird House');
  await screenshot('barcelona-verpflegung');
  await click('.meal-card [data-action=meal-choose][data-value=pasta]');
  await hasText('dialog', 'El Born & günstige Tapas');
  await save();
  await hasText('.timeline', 'Pasta mit Tomate und Kichererbsen');
  assert.ok(await js('!document.querySelector(".timeline").textContent.includes("El Born & günstige Tapas")'));
  assert.equal(store.current('interrail_classic').state.edits['tripsy:activity:4323010'].selected, false);
  await nav('budget');
  await hasText('table', '2,80');
  await nav('food');
  await click('.meal-card [data-action=meal-choose][data-value=bormuth]');
  await hasText('dialog', 'Ersetzt im Tagesplan Pasta');
  await set('dialog [name=seating]', 'terrace');
  await save();
  await hasText('.timeline', 'Tapas bei Bormuth · Terrasse');
  await nav('food');
  await hasText('#main', '53,90');
  await click('[data-action=meal-cost]');
  await hasText('dialog', 'ersetzt den Planwert');
  await set('dialog [name=price]', '52,90');
  await save();
  await nav('budget');
  await hasText('table', '52,90');
  assert.ok(await js('!document.querySelector("table").textContent.includes("53,90") && !document.querySelector("table").textContent.includes("Pasta mit Tomate")'));
  const mealState = store.current('interrail_classic').state;
  assert.equal(mealState.expenses.find(e => e.forItem).price.cents, 5290);
  assert.equal(store.current('interrail_swiss').state.expenses.length, 0);
  await nav('plan');
  console.log('PASS Verpflegung · Warenkorb, Mahlzeitenwechsel und Ausgabenabgleich für drei');

  await click('[data-action=day][data-value="2027-09-04"]');
  const beach = 'tripsy:activity:4323012';
  const park = 'tripsy:activity:4323013';
  const eventSelector = id => '.event-card[data-event-id="' + id + '"]';
  const dragEvent = async (from, to) => js(`(() => {
    const origin = document.querySelector(${JSON.stringify(eventSelector(from))});
    const target = document.querySelector(${JSON.stringify(eventSelector(to))});
    const dataTransfer = new DataTransfer();
    origin.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    origin.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer }));
  })()`);
  await click(eventSelector(park) + ' [data-action=edit]');
  await js('document.querySelector("dialog [name=locked]").checked=true');
  await save();
  assert.equal(await js(selector(eventSelector(park)) + '.draggable'), false);
  const beforeLock = store.current('interrail_classic').revision;
  await dragEvent(beach, park);
  assert.equal(store.current('interrail_classic').revision, beforeLock);
  await click(eventSelector(park) + ' [data-action=edit]');
  await js('document.querySelector("dialog [name=locked]").checked=false');
  await save();
  assert.equal(await js(selector(eventSelector(park)) + '.draggable'), true);
  const beforeDrag = store.current('interrail_classic');
  await dragEvent(beach, park);
  await hasText('#toast', 'Aktivitäten getauscht');
  const afterDrag = store.current('interrail_classic');
  assert.equal(afterDrag.state.edits[beach].start, beforeDrag.state.edits[park].start);
  await click('.topbar [data-action=undo]');
  await hasText('#toast', 'Änderung rückgängig');
  await nav('rail');
  await click('[data-action=add-rail]');
  await set('dialog [name=name]', 'Abnahme · lokale Zugverbindung');
  await set('dialog [name=departure]', 'Barcelona Sants');
  await set('dialog [name=arrival]', 'Barcelona Passeig de Gràcia');
  await set('dialog [name=start]', '08:00');
  await set('dialog [name=end]', '08:25');
  await set('dialog [name=price]', '12,50');
  await save();
  await hasText('#main', 'Abnahme · lokale Zugverbindung');
  const train = store.current('interrail_classic').state.manual.find(item => item.kind === 'transport');
  assert.equal(train.price.cents, 1250);
  await click('[data-action=edit][data-value="' + train.id + '"]');
  await set('dialog [name=name]', 'Abnahme · Zug bearbeitet');
  await set('dialog [name=end]', '08:30');
  await save();
  await hasText('#main', 'Abnahme · Zug bearbeitet');
  await click('[data-action=edit][data-value="' + train.id + '"]');
  await click('dialog [data-action=remove]');
  await retry(() => js('!document.querySelector("#main").textContent.includes("Abnahme · Zug bearbeitet")'), 'Gelöschte Zugverbindung bleibt sichtbar');
  assert.equal(store.current('interrail_classic').state.edits[train.id].removed, true);
  await nav('plan');
  console.log('PASS Pilot-Bedienung · Sperren, Sortieren mit Drag-and-drop und Zug-CRUD');

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await wait('.mobile-switch');
  assert.ok(await js('document.documentElement.scrollWidth <= innerWidth'));
  await click('.mobile-switch [data-value=map]');
  await wait('.leaflet-marker-icon');
  await hasText('.map-panel', 'Barcelona');
  await click('.mobile-switch [data-value=plan]');
  assert.ok(await js('document.querySelector(".timeline-panel").getBoundingClientRect().width > 0'));
  await retry(() => js('!document.querySelector("#toast").textContent'), 'Toast noch sichtbar', 10000);
  await screenshot('barcelona-mobil');
  await click('.mobile-menu [data-action=menu]');
  await nav('data');
  await hasText('h1', 'Daten & Fristen');
  await js(`(() => { const dt=new DataTransfer(); dt.items.add(new File(['id;name;city\\nqa;Testimport;barcelona'], 'qa.csv')); document.querySelector('input[type=file]').files=dt.files; })()`);
  await click('#import-form [type=submit]');
  await hasText('#toast', '1 neu');
  await js(`(() => { const dt=new DataTransfer(); dt.items.add(new File(['id;name;city\\nqa;Testimport;barcelona'], 'qa.csv')); document.querySelector('input[type=file]').files=dt.files; })()`);
  await click('#import-form [type=submit]');
  await hasText('#toast', '1 vorhanden');
  assert.equal(store.current('interrail_classic').imported.length, 1);
  await click('.mobile-menu [data-action=menu]');
  await click('.sidebar [data-action=city][data-value=sete]');
  await navOnMobile('lodging');
  await hasText('.grid-cards', 'Georges Hostel');
  await hasText('.grid-cards', 'Gemeinschaftsküche');
  await click('.mobile-menu [data-action=menu]');
  await click('.sidebar [data-action=city][data-value=paris]');
  await navOnMobile('discover');
  await hasText('.grid-cards', 'Eiffelturm');
  await hasText('.grid-cards', '44,40');
  await hasText('.grid-cards', 'EWR');
  console.log('PASS Städtepaket · Paris-Tarife, Sète-Unterkunft und jeweilige Stadtansicht');
  // V69: real Chrome checks both viewport layout and retained Leaflet state.
  await navOnMobile('map');
  // V72: one primary scope control and a direct, understandable search journey.
  await wait('.map-context-summary');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=city]');
  await retry(()=>js('document.querySelector(".map-context-summary")?.textContent.includes("Orte mit Pin")'),
    'V72 map counters show individual places, not route hubs');
  assert.equal(await js('document.querySelector(".reference-places-drawer")?.open'),true);
  assert.equal(await js('getComputedStyle(document.querySelector(".reference-map-floating")).display'),'none',
    'V72 redundant floating scope controls must stay out of the cartographic area');
  const normalMobile=await js('(() => {const m=document.querySelector("#map").getBoundingClientRect(),h=document.querySelector(".map-panel>.panel-head").getBoundingClientRect();return {mapHeight:m.height,titleBottom:h.bottom,mapTop:m.top};})()');
  assert.ok(normalMobile.mapHeight>=400,'V72 mobile map canvas stays prominent');
  assert.ok(normalMobile.titleBottom<=normalMobile.mapTop+2,
    'V72 header actions must sit ABOVE the map, not obscure markers');
  await click('.map-context-summary [data-action=map-open-search]');
  await retry(()=>js('document.activeElement?.id==="map-search"'),'V72 search receives keyboard focus');
  await set('#map-search','Sagrada');
  await click('.explorer-search [data-action=explorer-search]');
  await retry(()=>js('document.querySelector(".map-active-filter")?.textContent.includes("Suche: Sagrada")'),
    'V72 search is visibly tagged as active');
  await click('.map-context-summary [data-action=map-clear-filters]');
  assert.equal(await js('document.querySelectorAll(".map-active-filter").length'),0);
  assert.equal(await js('document.querySelector("#map-search")?.value'),'');
  await click('.map-scope-modes [data-action=explorer-scope][data-value=trip]');
  await retry(()=>js('document.querySelector(".map-context-summary")?.textContent.includes("Städte")'),
    'V72 trip scope counts city hubs rather than all place markers');
  await click('.explorer-categories [data-action=explorer-group][data-value=food]');
  await retry(()=>js('document.querySelector(".map-context-summary")?.textContent.includes("Essen & Cafés")'),
    'V72 group filter is visible immediately');
  assert.equal(await js('document.querySelector(".map-scope-modes [data-value=city]")?.getAttribute("aria-pressed")'),'true',
    'V72 choosing a place category switches schematic trip to actual city POIs');
  await click('.map-context-summary [data-action=map-clear-filters]');
  await screenshot('karte-uebersicht-v72-mobil');
  await wait('.map-fullscreen-launch');
  const originalLeafletId=await js('document.querySelector("#map")._leaflet_id');
  await click('.map-fullscreen-launch');
  await retry(()=>js('document.body.classList.contains("map-fullscreen-active")'),'V69 mobile fullscreen active');
  const fullMobile=await js('(() => {const r=document.querySelector("#map").getBoundingClientRect();return {w:r.width,h:r.height,vw:innerWidth,vh:innerHeight};})()');
  assert.ok(fullMobile.w>=fullMobile.vw-2,'Mobile fullscreen map must fill viewport width');
  assert.ok(fullMobile.h>=fullMobile.vh-2,'Mobile fullscreen map must fill viewport height');
  assert.equal(await js('document.querySelector("#map")._leaflet_id'),originalLeafletId);
  await click('.map-fullscreen-drawer-toggle');
  await retry(()=>js('document.querySelector(".map-fullscreen-mode").classList.contains("fullscreen-drawer-open")'),'V69 drawer opens');
  assert.equal(await js('getComputedStyle(document.querySelector(".map-fullscreen-mode>.explorer-right")).visibility'),'visible');
  assert.ok(await js('Boolean(document.querySelector(".map-fullscreen-mode #map-search"))'));
  await click('.map-fullscreen-mode .map-fullscreen-categories [data-value=activity]');
  await retry(()=>js('document.querySelector(".map-fullscreen-categories [data-value=activity]")?.getAttribute("aria-pressed")==="true"'),'V69 activity filter');
  assert.equal(await js('document.querySelector("#map")._leaflet_id'),originalLeafletId);
  await js('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await retry(()=>js('!document.querySelector(".map-fullscreen-mode").classList.contains("fullscreen-drawer-open")'),'V69 first Escape closes drawer');
  await js('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await retry(()=>js('!document.body.classList.contains("map-fullscreen-active")'),'V69 second Escape exits');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
  await js('window.dispatchEvent(new Event("resize"))');
  await click('.map-fullscreen-launch');
  await retry(()=>js('document.body.classList.contains("map-fullscreen-active")'),'V69 desktop fullscreen active');
  const fullDesktop=await js('(() => {const r=document.querySelector("#map").getBoundingClientRect();return {w:r.width,h:r.height,vw:innerWidth,vh:innerHeight};})()');
  assert.ok(fullDesktop.w>=fullDesktop.vw-2,'Desktop fullscreen map must fill viewport width');
  assert.ok(fullDesktop.h>=fullDesktop.vh-2,'Desktop fullscreen map must fill viewport height');
  await click('.map-fullscreen-mode .map-fullscreen-scope [data-value=trip]');
  await retry(()=>js('document.querySelector(".map-fullscreen-scope [data-value=trip]")?.getAttribute("aria-pressed")==="true"'),'V69 trip scope');
  await click('.map-fullscreen-exit');
  await retry(()=>js('!document.body.classList.contains("map-fullscreen-active")'),'V69 close fullscreen');
  assert.equal(await js('document.querySelector("#map")._leaflet_id'),originalLeafletId,
    'Fullscreen transitions must not recreate Leaflet map');
  await screenshot('karte-vollbild-desktop');
  // V72 desktop also retains quick controls and genuinely larger map surface.
  const desktopMapInfo=await js('(() => {const m=document.querySelector("#map").getBoundingClientRect(),a=document.querySelector(".map-context-summary").getBoundingClientRect();return {height:m.height,statusHeight:a.height,layoutWidth:document.querySelector(".reference-map-workspace").getBoundingClientRect().width};})()');
  assert.ok(desktopMapInfo.height>=475,'V72 desktop map is not forced into old 375-437px card');
  assert.ok(desktopMapInfo.statusHeight>30&&desktopMapInfo.statusHeight<200,
    'V72 status should be a compact summary, not a second information sidebar');
  assert.ok(await js('Boolean(document.querySelector(".map-extra-details .map-tools"))'),
    'V72 map overlays remain available in technical details');
  await screenshot('karte-uebersicht-v72-desktop');
  // V70 real playback: city badges appear progressively and a traveling dot
  // moves along the pre-existing schematic city polyline without recreating Leaflet.
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  const storyMapId=await js('document.querySelector("#map")._leaflet_id');
  await click('.route-story-launch');
  await retry(()=>js('document.querySelector("#route-story-player")?.dataset.status==="playing"'),
    'V70 story should start');
  assert.equal(await js('document.querySelector("#map")._leaflet_id'),storyMapId);
  assert.ok(await js('document.querySelectorAll(".story-arrived-icon").length>=1'));
  // V71 visual choreography: the city marker wiggles and genuine catalog
  // categories spread radially, never showing fictional venue coordinates.
  await retry(()=>js('document.querySelectorAll(".story-arrival-bubble").length>=3'),
    'V71 city scene should reveal multiple recorded place types');
  await retry(()=>js('document.querySelector("#route-story-ideas")?.hidden===false'),
    'V71 actual place recap becomes visible');
  assert.ok(await js('document.querySelectorAll(".route-story-idea").length>=2'));
  assert.ok(await js('document.querySelector(".route-story-ideas-top").textContent.includes("vorhandene Orte")'));
  assert.ok(await js('document.querySelector(".story-arrived-current")!==null'));
  const orbit=await js('[...document.querySelectorAll(".story-arrival-bubble")].map(el=>({x:parseFloat(el.style.getPropertyValue("--burst-x")),y:parseFloat(el.style.getPropertyValue("--burst-y")),delay:parseFloat(el.style.getPropertyValue("--burst-delay"))}))');
  assert.ok(orbit.some(x=>x.x<0)&&orbit.some(x=>x.x>0),'V71 icons must fan out to both sides');
  assert.ok(orbit.some(x=>x.y<0)&&orbit.some(x=>x.y>0),'V71 icons must appear above and below');
  assert.ok(orbit.slice(1).every((x,i)=>x.delay>orbit[i].delay),'V71 icons must appear consecutively');
  assert.ok(await js('document.querySelectorAll(".route-story-rail-dot").length>=2'));
  await screenshot('stadtankunft-embleme-desktop');
  await retry(()=>js('Number(document.querySelector(".route-story-progress").getAttribute("aria-valuenow"))>0'),
    'V70 traveling dot should progress',5500);
  await click('#route-story-player [data-action=route-story-pause]');
  await retry(()=>js('document.querySelector("#route-story-player")?.dataset.status==="paused"'),
    'V70 pause');
  const pausedPct=await js('document.querySelector(".route-story-progress").getAttribute("aria-valuenow")');
  await delay(280);
  assert.equal(await js('document.querySelector(".route-story-progress").getAttribute("aria-valuenow")'),pausedPct,
    'Travel progress must freeze while paused');
  await click('#route-story-player [data-action=route-story-speed]');
  await hasText('#route-story-player', '1.5×');
  await click('#route-story-player [data-action=route-story-pause]');
  await retry(()=>js('document.querySelectorAll(".story-arrived-icon").length>=2'),
    'V70 second city popup',6000);
  await retry(()=>js('document.querySelector("#route-story-count")?.textContent.startsWith("2 /")'),
    'V71 moves on to second real city');
  assert.ok(await js('document.querySelectorAll(".story-arrival-icon").length===1'),
    'V71 only the current city keeps flying bubbles');
  assert.ok(await js('document.querySelector(".route-story-player").textContent.includes("schematisch")'));
  await screenshot('karte-route-mit-stadtsymbolen');
  await click('#route-story-player [data-action=route-story-stop]');
  await retry(()=>js('document.querySelector("#route-story-player")?.hidden===true'),
    'V70 stop clears overlay');
  assert.equal(await js('document.querySelectorAll(".story-traveler-icon").length'),0);
  assert.equal(await js('document.querySelector("#map")._leaflet_id'),storyMapId);

  // Motion preferences disable travel interpolation, while preserving all city reveals.
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('.route-story-launch');
  await retry(()=>js('document.querySelector("#route-story-player")?.dataset.status==="complete"'),
    'V70 accessible still view');
  const finalCount=await js('Number(document.querySelector("#route-story-count").textContent.split("/")[1].trim())');
  assert.ok(finalCount>=2);
  assert.equal(await js('document.querySelectorAll(".story-arrived-icon").length'),finalCount);
  // The idea CTA opens the selected city's genuine place browser, without
  // editing the itinerary. Verify mobile layout with real device metrics.
  await click('#route-story-player [data-action=route-story-explore]');
  await retry(()=>js('document.querySelector(".reference-places-drawer")?.open===true'),
    'V71 opens city place browser');
  assert.ok(await js('document.querySelector(".reference-map-floating [data-action=map-mode][data-value=city]")?.getAttribute("aria-pressed")==="true"'));
  assert.equal(await js('document.querySelector("#route-story-player")?.hidden'),true);
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await js('window.dispatchEvent(new Event("resize"))');
  await click('.route-story-launch');
  await retry(()=>js('document.querySelector("#route-story-player")?.dataset.status==="playing"'),
    'V71 mobile scene playback');
  await retry(()=>js('document.querySelectorAll(".story-arrival-bubble").length>=2'),
    'V71 mobile orbit symbols');
  const mobileArrival=await js('(() => {const r=document.querySelector("#route-story-player").getBoundingClientRect(),m=document.querySelector("#map").getBoundingClientRect();return {width:r.width,viewport:innerWidth,top:r.top,bottom:r.bottom,mapTop:m.top,mapBottom:m.bottom};})()');
  assert.ok(mobileArrival.width<=mobileArrival.viewport,'V71 mobile recap cannot overflow screen');
  assert.ok(mobileArrival.top>=mobileArrival.mapTop-1,'V71 recap must remain inside map');
  assert.ok(mobileArrival.bottom<=mobileArrival.mapBottom+1,'V71 recap must remain inside map');
  await screenshot('stadtankunft-embleme-mobil');
  await click('#route-story-player [data-action=route-story-stop]');
  assert.equal(await js('document.querySelectorAll(".story-arrival-icon").length'),0);
  console.log('PASS V71 Stadtszene · echtes Ortsinventar, gestaffelte Symbole, Wackeln, Kategorien, Städteübersicht, Mobil und Öffnen');
  console.log('PASS V70 Reiseanimation · beweglicher Punkt, Stadt-Popups, Pause, 1.5×, Replay-Fallback und Quellschutz');
  console.log('PASS V69 Vollbildkarte · Desktop, Mobil, bestehende Leaflet-Karte, Drawer, Filter, Esc, Scope');
  assert.deepEqual(errors, []);
  console.log('PASS Mobil · Liste/Karte, Navigation, reduzierte Bewegung und idempotenter CSV-Import');
  }
  async function navOnMobile(id) {
    await click('.mobile-menu [data-action=menu]');
    await nav(id);
  }
} finally {
  socket?.close();
  child.kill();
  await Promise.race([exited, delay(2400)]);
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }).catch(() => {});
}
