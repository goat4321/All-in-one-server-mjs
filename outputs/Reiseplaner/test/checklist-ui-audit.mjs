import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';

const project = resolve(process.env.REISEPLAN_AUDIT_PROJECT ?? '.');
const output = resolve(process.env.REISEPLAN_AUDIT_OUTPUT ?? 'private/checklist-audit');
const { createApp } = await import(pathToFileURL(join(project, 'server.mjs')));
const browser = [process.env.REISEPLAN_BROWSER, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
assert.ok(browser, 'Chromium-Browser fehlt.');
const profile = await mkdtemp(join(tmpdir(), 'reise-checklist-'));
const start = performance.now();
const { server } = await createApp({ database: ':memory:', upstream: false });
const bootstrapMs = performance.now() - start;
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = 'http://127.0.0.1:' + server.address().port;
const child = spawn(browser, ['--headless=new', '--remote-debugging-port=0', '--disable-gpu',
  '--disable-background-networking', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + profile, '--window-size=1440,1000', 'about:blank'],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const report = { capturedAt: new Date().toISOString(), project, bootstrapMs, mode: 'isolierte Daten, externe Medien blockiert, reduzierte Bewegung',
  pages: [], errors: [] };
let socket;
async function until(read, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const result = await read().catch(() => null);
    if (result) return result;
    await delay(75);
  }
  throw new Error('Timeout · ' + label);
}
try {
  await mkdir(output, { recursive: true });
  const port = await until(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0], 'Browserstart');
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') report.errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (!pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['https://*', 'http://*.google.com/*'] });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Page.navigate', { url: address + '/?offlineMap&variant=interrail_swiss' });
  await until(() => evaluate('Boolean(document.querySelector("#variant"))'), 'Anwendung');
  report.navigation = await evaluate('performance.getEntriesByType("navigation")[0].toJSON()');
  report.resources = await evaluate('performance.getEntriesByType("resource").filter(r=>r.name.startsWith(location.origin)).map(r=>({name:r.name.split(location.origin)[1],ms:r.duration,bytes:r.transferSize}))');
  for (const width of [1440, 820, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 1000 : 1180, deviceScaleFactor: 1, mobile: width === 390 });
    for (const page of ['overview', 'plan', 'map', 'lodging', 'activities', 'discover', 'rail', 'food', 'budget', 'group', 'data']) {
      const ready = performance.now();
      await evaluate(`(() => { const button=document.querySelector('.sidebar [data-action="page"][data-value="${page}"]'); button.click(); })()`);
      await until(() => evaluate(`document.querySelector('.sidebar [data-action="page"][data-value="${page}"]')?.getAttribute('aria-current')==='page'`), page);
      const interactionMs = performance.now() - ready;
      await evaluate('window.scrollTo(0,0)');
      await delay(160);
      const metrics = await evaluate(`(() => {
        const main=document.querySelector('#main');
        const controls=[...main.querySelectorAll('button,a,input,select,summary')].filter(element=>element.getBoundingClientRect().width>0);
        return {heading:main.querySelector('h1')?.textContent, overflow:document.documentElement.scrollWidth-innerWidth,
          nodes:document.querySelectorAll('*').length, visibleControls:controls.length,
          unnamedButtons:controls.filter(element=>element.tagName==='BUTTON'&&!element.textContent.trim()&&!element.getAttribute('aria-label')).length,
          reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
      })()`);
      const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const file = page + '-' + width + '.png';
      await writeFile(join(output, file), Buffer.from(screenshot.data, 'base64'));
      report.pages.push({ page, width, interactionMs, screenshot: file, ...metrics });
    }
  }
  await writeFile(join(output, 'metrics.json'), JSON.stringify(report, null, 2));
  assert.deepEqual(report.errors, [], 'Keine JavaScript-Ausnahmen');
  assert.ok(report.pages.every(page => page.overflow <= 5), 'Seiten ohne horizontalen Überlauf');
  assert.ok(report.pages.every(page => page.unnamedButtons === 0), 'Sichtbare Buttons brauchen eine Beschriftung');
  console.log(JSON.stringify({ pages: report.pages.length, bootstrapMs, maxInteractionMs: Math.max(...report.pages.map(page => page.interactionMs)),
    errors: report.errors, overflow: report.pages.filter(page => page.overflow > 5), output }, null, 2));
} finally {
  socket?.close();
  child.kill();
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 200 }).catch(() => {});
}
