import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,css,views,app]=await Promise.all([
 read('public/index.html'),
 read('public/reference-realignment-v63.css'),
 read('public/views.mjs'),
 read('public/app.mjs'),
]);

test('The visual reference CSS is loaded as the final local stylesheet',()=>{
 const styles=[...html.matchAll(/<link rel="stylesheet" href="(\/[^"]+\.css)"/g)]
  .map(x=>x[1]);
 assert.equal(styles.at(-1),'/reference-realignment-v63.css');
 assert.ok(styles.indexOf('/readability-day-v50.css')<styles.length-1);
 assert.ok(styles.includes('/map-photo-v34.css'));
 assert.ok(css.length>14000);
 assert.doesNotMatch(css,/display\s*:\s*none\s*!important\s*;?\s*\/\* delete/i);
});
test('The reference-style top navigation is shared by all pages, not only map',()=>{
 assert.match(views,/const referenceNav='<div class="reference-nav-brand">/);
 assert.match(views,/shell reference-travel-shell/);
 assert.match(views,/topbar reference-topbar/);
 assert.match(views,/data-action="nav-saved"/);
 assert.match(views,/data-value="discover"/);
 assert.match(views,/data-value="map"/);
 assert.match(views,/reference-top-search/);
 assert.match(views,/mobile-dock/);
});
test('Global saved and search actions navigate to real map tools',()=>{
 assert.match(app,/case 'nav-saved':/);
 assert.match(app,/view\.mapSavedOnly=true/);
 assert.match(app,/if\(view\.page!=='map'\)changePage\('map'\)/);
 assert.match(app,/event\.target\.id==='reference-top-search'&&view\.page!=='map'/);
 assert.match(app,/view\.mapScope='city'/);
});
test('Map keeps chronology visible in every scope, advanced filters still accessible',()=>{
 assert.match(views,/\+mapDayAgenda\(ctx\)/);
 assert.match(views,/reference-places-drawer/);
 assert.match(views,/explorerToolbar\(ctx\) \+ explorerList\(ctx\)/);
 assert.match(views,/mapPhotoDiscovery\(ctx\)/);
 assert.match(views,/reference-stage-days/);
 assert.match(css,/grid-template-columns:minmax\(330px,31\.5%\) minmax\(0,1fr\)/);
 assert.match(css,/reference-discovery-image[\s\S]*?height:153px/);
 assert.match(css,/reference-places-drawer>summary/);
});
test('Tablet and mobile variants preserve ordering, contrast and reduced motion',()=>{
 assert.match(css,/@media\(min-width:651px\) and \(max-width:1179px\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/reference-map-workspace>\.map-panel\{order:1/);
 assert.match(css,/reference-map-workspace>\.explorer-right\{\s*order:2/);
 assert.match(css,/reference-map-workspace>\.reference-discovery\{\s*order:3/);
 assert.match(css,/mobile-dock/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:root\[data-motion=off\]/);
 assert.match(css,/:root\[data-theme=dark\]/);
});
test('New visual layout does not rewrite plans, tickets or independently sourced map positions',async()=>{
 const catalog=await loadCatalog();
 assert.equal(catalog.trips.length,4);
 assert.ok(catalog.trips.every(t=>t.items.length>0));
 const planned=catalog.trips.flatMap(t=>t.items.filter(i=>i.booked));
 assert.equal(planned.length,0);
 const photos=await read('public/reference-realignment-v63.css');
 assert.doesNotMatch(photos,/https?:\/\/(?:maps\.google\.com|api\.mapbox\.com)/);
});
