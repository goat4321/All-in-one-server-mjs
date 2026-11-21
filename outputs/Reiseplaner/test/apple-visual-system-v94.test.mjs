import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file=n=>readFile(new URL('../public/'+n,import.meta.url),'utf8');
const [html,css,views,packageText]=await Promise.all([
 file('index.html'),file('apple-visual-system-v94.css'),file('views.mjs'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
test('V94 visual system loads last, preserving older stylesheets',()=>{
 const sheets=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(sheets.at(-1),'/apple-visual-system-v94.css');
 assert.equal(sheets.at(-2),'/calm-design-v91.css');
 assert.equal(sheets.filter(x=>x.endsWith('.css')).length,new Set(sheets).size);
 assert.ok(packageText.includes('test/apple-visual-system-v94.test.mjs'));
});
test('V94 defines distinct light and dark semantic surfaces and actions',()=>{
 for(const token of ['--v94-canvas','--v94-surface','--v94-ink','--v94-stroke',
 '--v94-action','--v94-radius-card','--v94-ease']){
  assert.ok(css.includes(token+':'),token);
 }
 assert.match(css,/:root\[data-theme=dark\]/);
 assert.match(css,/:root\[data-motion=off\]/);
 assert.match(css,/@media\(prefers-contrast:more\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.doesNotMatch(css,/@font-face|@import|url\(\s*https?:|backdrop-filter:blur\(/);
});
test('V94 covers core page families rather than one-off photo tweaks',()=>{
 for(const s of ['.page-head','.overview-quick-card','.day-plan-quick-bar',
 '.reference-map-workspace','.hub-option-card','.reference-discovery-card',
 '.market-baskets-v86','.stay-compare-board','dialog','.mobile-dock']){
  assert.ok(css.includes(s),s);
 }
});
test('V94 keeps touch and keyboard affordances, without bounce animation',()=>{
 assert.match(css,/min-height:44px/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/@keyframes|translateY\(-[1-9]|animation:.*bounce/);
});
test('Missing explorer context does not print undefined as map counts',()=>{
 assert.match(views,/\(ctx\.explorer\?\.placed\?\.length\?\?0\)/);
 assert.match(views,/\(ctx\.explorer\?\.unlocated\?\.length\?\?0\)/);
 assert.doesNotMatch(views,/ctx\.explorer\?\.placed\.length\+' Kartenpunkte/);
});
test('V94 CSS braces stay balanced',()=>{
 let depth=0;
 for(const char of css){if(char==='{')depth++;if(char==='}')depth--;assert.ok(depth>=0);}
 assert.equal(depth,0);
});

test('V94 dark fixes address actual light-only component overrides',()=>{
 for(const s of ['.overview-start-copy strong','.hub-hero .hub-kicker',
  '.hub-toolbar','.day-plan-quick-bar','.reference-discovery-body p',
  '.reference-map-workspace>.map-panel>.panel-head p']){
   assert.ok(css.includes(s),s+' dark override absent');
 }
 assert.match(css,/min-height:44px !important/);
});

test('V94 combined food view leads with search and keeps detailed market evidence reachable',()=>{
 const start=views.indexOf("const visualBrowse=browseHero(ctx,'food'");
 const end=views.indexOf('  return visualBrowse',start);
 const section=views.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.ok(section.indexOf('browseToolbar(ctx')<section.indexOf('foodBrowseCards(ctx'));
 assert.ok(section.includes("marketFirst?'':marketPrices"));
 assert.ok(section.includes('#market-price-research'));
 assert.match(css,/\.hub-market-jump a/);
 assert.match(css,/:root\[data-theme=dark\] \.mobile-dock/);
});

test('V94 Wikimedia fallback photo link has a real mobile touch region',()=>{
 assert.match(css,/a\.place-photo-unavailable-source\{/);
 assert.match(css,/min-height:36px/);
 assert.match(css,/a\.place-photo-unavailable-source:focus-visible/);
});
