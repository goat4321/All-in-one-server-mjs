import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [html,css,views,browse]=await Promise.all([
 load('public/index.html'),load('public/editorial-web-v95.css'),
 load('public/views.mjs'),load('public/browse-hub-v35.mjs')
]);
test('V95 editorial is the final CSS layer, not an incompatible replacement',()=>{
 const sheets=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(sheets.slice(-3),[
  '/calm-design-v91.css','/apple-visual-system-v94.css','/editorial-web-v95.css'
 ]);
});
test('V95 homepage presents licensed image first and keeps journey planning',()=>{
 const hero=views.indexOf("const editorialHero=");
 const start=views.indexOf("const quickStartHtml=");
 const returnStart=views.indexOf("  return '<div class=\"editorial-overview-tools\"");
 assert.ok(hero>0&&hero<start&&returnStart>start);
 assert.match(views,/heroItem\?curatedPlacePhoto\(heroItem\):null/);
 assert.match(views,/esc\(heroPhoto\.sourceUrl\)/);
 const following=views.slice(returnStart,views.indexOf("\n}\n\nfunction ",returnStart));
 assert.ok(following.indexOf('editorialHero')<following.indexOf('quickStartHtml'));
 assert.ok(following.indexOf('cockpit-layout')<following.indexOf('swissInterrailOverviewV82(ctx)'));
 assert.match(following,/dayPlanOverview\(ctx\)/);
 assert.match(following,/Variants?|Varianten im Vergleich/);
});
test('V95 browse and day heroes preserve existing actions and sourced photo credits',()=>{
 assert.match(browse,/data-photo=/);
 assert.match(browse,/esc\(photo\.sourceUrl\)/);
 assert.match(views,/dayHeroItem\?curatedPlacePhoto\(dayHeroItem\):null/);
 assert.match(views,/day-editorial-credit/);
 assert.match(views,/data-action/);
});
test('V95 main editorial aesthetic is content-led and responsive',()=>{
 for(const s of ['.editorial-journey-hero','.editorial-research-heading',
  '.hub-hero[data-photo=true]','.hub-option-media .place-photo',
  '.day-editorial-hero','.reference-map-intro','.mobile-dock']){
   assert.ok(css.includes(s),s);
 }
 assert.match(css,/font-size:clamp\(49px,6\.4vw,88px\)/);
 assert.match(css,/min-height:clamp\(410px,46vw,570px\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/--e95-page:#ffffff/);
 assert.match(css,/--e95-link:#1469ca/);
});
test('V95 content remains accessible, without external design assets',()=>{
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/data-motion=off/);
 assert.match(css,/prefers-reduced-transparency:reduce/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/@font-face|@import|url\(\s*https?:/);
 let depth=0;for(const ch of css){if(ch==='{')depth++;if(ch==='}')depth--;assert.ok(depth>=0);}
 assert.equal(depth,0);
});

test('V95 hero photographs render above their card background with explicit fallback',()=>{
 for(const selector of ['.editorial-journey-media>img','.hub-hero-art>img',
 '.day-editorial-media','.hub-hero[data-photo=fallback]']){
  assert.ok(css.includes(selector),selector);
 }
 assert.match(css,/\.hub-hero-art>img\{\s*position:absolute/);
 assert.match(css,/\.editorial-journey-media\{\s*z-index:0 !important/);
 assert.match(css,/\.editorial-journey-hero h1 \.sr-only/);
 assert.match(views,/const heroRouteText=/);
 assert.match(views,/heroRouteText\+'<\/h1>'/);
});

test('V96 route-led editorial heading uses actual trip destinations',()=>{
 assert.match(views,/uniqueDestinations=\[\.\.\.new Set\(trip\.route\)\]/);
 assert.match(views,/const heroRouteText=/);
 assert.doesNotMatch(views,/Mehr sehen\.<br>/);
});
test('V96 artwork fallback is not an oversized fake photograph',()=>{
 assert.match(css,/\.hub-hero\[data-photo=false\] \.hub-hero-art/);
 assert.match(css,/\.hub-hero\[data-photo=fallback\] \.hub-hero-art/);
 assert.match(css,/\.editorial-journey-hero\[data-photo=false\] \.editorial-journey-media/);
});


test('V96.1 research warnings stay honest while visually compact',()=>{
 assert.match(views,/data-research-status="incomplete"/);
 assert.match(views,/Reisedaten teilweise unvollständig/);
 assert.match(views,/Nur Forschungsdaten verfügbar/);
 assert.match(views,/Die privaten Tripsy-Originaldateien fehlen/);
 assert.match(css,/source-notice\[data-research-status=incomplete\]/);
});
test('V96.1 specific map operator link is easy to hit without widening markers',()=>{
 assert.match(css,/\.reference-map-schedule-notice a\[href\]/);
 assert.match(css,/min-height:36px;min-width:36px/);
});
