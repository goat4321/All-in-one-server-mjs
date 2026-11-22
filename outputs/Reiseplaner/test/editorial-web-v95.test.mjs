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


test('V96.2 offline browse heroes shrink without suppressing real photo chapters',()=>{
 assert.match(css,/V96\.2 · An unavailable photo/);
 assert.match(css,/\.hub-hero:is\(\[data-photo=false\],\[data-photo=fallback\]\)/);
 assert.match(css,/min-height:0 !important/);
 assert.match(css,/\.hub-hero\[data-photo=true\]/);
});


test('V97 page, chapter and photo motion is discoverable and restrained',()=>{
 for(const token of ['@keyframes v97-scene-in','@keyframes v97-section-in',
  '@keyframes v97-photo-in','@keyframes v97-panel-in',
  '@keyframes v97-confirm','@keyframes v97-budget-bar',
  'main.workspace.motion-scene-enter','#app .motion-revealed',
  '.motion-photo-loaded','.motion-saved-success']){
   assert.ok(css.includes(token),'Missing motion affordance: '+token);
 }
 assert.match(css,/animation:v97-scene-in 285ms/);
 assert.match(css,/animation:v97-section-in 345ms/);
 assert.match(css,/animation-delay:var\(--motion-delay,0ms\)/);
 assert.doesNotMatch(css,/v97.*infinite/);
});
test('V97 disables animations and zoom on both OS and in-app opt-out',()=>{
 const v97=css.slice(css.indexOf('/* V97 · Purposeful motion system'));
 assert.match(v97,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(v97,/:root\[data-motion=off\]/);
 assert.match(v97,/main\.workspace\.motion-scene-enter/);
 assert.match(v97,/transition:none !important/);
 assert.match(v97,/\.destination-card:hover \.destination-cover img/);
 assert.doesNotMatch(v97,/perspective\s*:|rotate3d\(/);
});


test('V98 scroll, hover, and opening motion cover content without perpetual movement',()=>{
 for(const name of [
  '@keyframes v98-card-arrive','@keyframes v98-title-arrive',
  '@keyframes v98-meter-grow','.motion-scroll-revealed',
  '.destination-card:hover','.hub-option-card:hover',
  '.hub-food-card:hover','.reference-discovery-card:hover',
  '.button.primary:hover','.market-chain-card'
 ]){
  assert.ok(css.includes(name),'Missing V98 animation '+name);
 }
 assert.match(css,/animation:v98-card-arrive 440ms/);
 assert.match(css,/animation:v98-title-arrive 400ms/);
 assert.match(css,/animation:v98-meter-grow 530ms/);
 assert.doesNotMatch(css.slice(css.indexOf('/* V98 / Scroll-led travel experience')),
  /animation:[^;}\n]*\binfinite\b/i);
});
test('V98 movement is optional and cannot move Leaflet map tiles',()=>{
 const v98=css.slice(css.indexOf('/* V98 / Scroll-led travel experience'));
 assert.match(v98,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(v98,/:root\[data-motion=off\]/);
 assert.match(v98,/:hover\{transform:none !important/);
 assert.match(v98,/\.motion-scroll-revealed/);
 assert.doesNotMatch(v98, /(^|[\s,])(?:\.leaflet|\.maplibregl)[^{]*\{[^}]*transform:/m);
});


test('V99 scroll indicator uses native scroll timeline and only content pages',()=>{
 const v99=css.slice(css.indexOf('/* V99 / scroll progress and modal choreography'));
 assert.match(v99,/@keyframes v99-reading-progress/);
 assert.match(v99,/\.reference-travel-shell\.is-content-page>.main-column>.reference-topbar::after/);
 assert.match(v99,/@supports\(animation-timeline:scroll\(root block\)\)/);
 assert.match(v99,/animation-timeline:scroll\(root block\)/);
 assert.match(v99,/pointer-events:none/);
 assert.match(v99,/:root\[data-motion=off\]/);
 assert.match(v99,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(v99,/\.reference-travel-shell\.is-map-page[^{}]*reading-progress/);
});
test('V99 real modal and research chapters animate only when motion is allowed',()=>{
 const v99=css.slice(css.indexOf('/* V99 / scroll progress and modal choreography'));
 for(const token of ['@keyframes v99-modal-arrive',
  '@keyframes v99-backdrop-arrive','#dialog[open]',
  '#dialog[open]::backdrop','@keyframes v99-chapter-arrive',
  '.hub-food-planning','.swiss-editorial-head','.data-disclosure',
  'prefers-reduced-transparency:reduce']){
  assert.ok(v99.includes(token),token);
 }
 assert.match(v99,/:root\[data-motion=off\] #dialog\[open\]/);
 assert.match(v99,/#dialog\[open\],#dialog\[open\]::backdrop/);
 assert.doesNotMatch(v99,/animation:[^;}\n]*\binfinite\b/i);
});


test('V99 route is drawn once when revealed instead of moving forever',()=>{
 const v99=css.slice(css.indexOf('/* V99 / deliberate travel route tracing'));
 assert.match(views,/class="cockpit-route-line" pathLength="1"/);
 assert.match(v99,/@keyframes v99-route-trace/);
 assert.match(v99,/\.cockpit-route-surface\.motion-revealed/);
 assert.match(v99,/animation:v99-route-trace 1100ms/);
 assert.match(v99,/\.cockpit-route-line\{\s*stroke-dasharray:1 !important;/);
 assert.match(v99,/animation:none !important/);
 assert.match(v99,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(v99,/:root\[data-motion=off\]/);
 assert.doesNotMatch(v99,/animation:[^;}\n]*\binfinite\b/i);
});


test('V99 external photo failure switches to a readable action without tweening',()=>{
 const v99=css.slice(css.indexOf('/* V99 / stable attribution fallback contrast'));
 assert.match(v99,/\.hub-hero:is\(\[data-photo=false\],\[data-photo=fallback\]\)/);
 assert.match(v99,/\.hub-hero-actions \.button:not\(\.primary\)/);
 assert.match(v99,/transition:none !important/);
});
