import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=n=>readFile(new URL('../public/'+n,import.meta.url),'utf8');
test('V129 journey design is scoped, responsive and supports reduced motion',async()=>{
 const [css,html,motion,views]=await Promise.all(['journey-design-v129.css','index.html','motion-ux.mjs','views.mjs'].map(read));
 assert.match(html,/journey-design-v129\.css/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/prefers-contrast/);
 assert.match(css,/body\.route123-active/);
 assert.match(views,/journey129-more/);
 assert.match(views,/route122-launch/);
 assert.match(motion,/journey129-photo-error/);
 assert.doesNotMatch(motion,/image\.addEventListener\('load'/);
});
