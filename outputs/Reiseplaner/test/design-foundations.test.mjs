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
  assert.match(views, /btn\('map-fullscreen','Vollbild'/);
  assert.match(css, /\.map-panel>\.panel-head \.map-fullscreen-launch\s*\{\s*display:none/);
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

test('home prioritizes an existing trip, licensed imagery and a real day action', () => {
  assert.match(views, /const heroHtml=/);
  assert.match(views, /journey-home-hero/);
  assert.match(views, /curatedPlacePhoto\(item\)/);
  assert.match(views, /coverMatch\.photo\.sourceUrl/);
  assert.match(views, /destinationIllustration\(coverCity\)/);
  assert.match(views, /class="button journey-home-primary" data-action="day-plan-go"/);
  assert.match(views, /class="journey-home-stage" data-action="trip-city"/);
  assert.match(views, /class="journey-home-task" data-action="page"/);
  assert.match(views, /swissInterrailOverviewV82\(ctx\)/);
  assert.match(views, /dayPlanOverview\(ctx\)/);
});

test('single home CSS layer includes responsive, contrast, dark and motion controls', () => {
  assert.match(css, /\.journey-home-hero\{/);
  assert.match(css, /\.journey-home-route-layout\.cockpit-layout\{/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /--ui-hairline:/);
  assert.match(css, /:root\[data-theme=dark\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /prefers-reduced-transparency:reduce/);
});