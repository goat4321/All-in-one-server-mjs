import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const publicFile = name => readFile(new URL('../public/' + name, import.meta.url), 'utf8');
const [html, views, css] = await Promise.all([
  publicFile('index.html'),
  publicFile('views.mjs'),
  publicFile('design-foundations-v01.css'),
]);

test('new design layer loads once, after legacy styles', () => {
  const sheets = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)]
    .map(match => match[1]);
  assert.equal(sheets.filter(sheet => sheet === '/design-foundations-v01.css').length, 1);
  assert.equal(sheets.at(-1), '/design-foundations-v01.css');
  assert.match(css, /:root\[data-theme=dark\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /data-motion=off/);
});

test('travel map keeps an accessible fullscreen action without duplicate local button', () => {
  assert.match(views, /class="map-fullscreen-launch"/);
  assert.match(views, /data-action="map-fullscreen"/);
  assert.doesNotMatch(views, /btn\('map-fullscreen','Vollbild'/);
  assert.match(css, /\.map-fullscreen-mode \.map-fullscreen-ui/);
});

test('shopping table retains all columns in a labeled keyboard-scroll region', () => {
  assert.match(views, /\['Zutat', 'Benötigte Menge', 'Packungen', 'Packungspreis', 'Gruppe', ''\]/);
  assert.match(views, /aria-label="Einkaufstabelle, seitlich scrollbar"/);
  assert.match(views, /tabindex="0"/);
  assert.match(views, /grocery-scroll-hint/);
  assert.match(css, /\.grocery-section \.table-wrap>table\s*\{\s*min-width:780px/);
  assert.match(css, /data-photo-scope="missing"/);
});
