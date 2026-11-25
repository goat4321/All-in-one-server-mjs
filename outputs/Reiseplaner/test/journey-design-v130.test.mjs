import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=n=>readFile(new URL('../public/'+n,import.meta.url),'utf8');
test('V130–131 preserve action wiring and accessible chapter progress',async()=>{
 const [views,story,css,motion]=await Promise.all(['views.mjs','journey-story-v121.mjs','journey-design-v129.css','motion-ux.mjs'].map(read));
 assert.match(views,/aria-label="Reise planen"/);assert.match(views,/aria-label="Reise erleben"/);
 for(const action of ['route123-launch','route125-launch','route122-launch'])assert.ok(views.includes(action));
 assert.match(story,/aria-valuenow="1"/);assert.match(story,/scrollIntoView/);assert.match(story,/clearPin/);
 assert.match(css,/journey130-action-group/);assert.match(css,/prefers-reduced-motion/);
 assert.match(motion,/observer!==localObserver/);
});
