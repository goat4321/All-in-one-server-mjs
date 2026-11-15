import test from 'node:test';
import assert from 'node:assert/strict';
import {placeImageHtml} from '../public/place-profile.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';

const item={id:'abc',name:'Freigegebenes Ortsfoto',kind:'activity',city:'barcelona',category:'sight'};
const state={placePhotos:{abc:{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Foo.jpg',
 sourceUrl:'https://commons.wikimedia.org/wiki/File:Foo.jpg',
 credit:'Test-Autor · CC BY-SA 4.0'} }};
const ctx={people:[{id:'p1'}],state,cities:{barcelona:{name:'Barcelona'}}};
test('Verified object photo overlays a clearly attributed backup city image',()=>{
 const html=placeImageHtml(item,ctx);
 assert.match(html,/class="place-specific-photo"/);
 assert.match(html,/class="place-photo-placeholder photo-context"/);
 assert.match(html,/class="place-photo-credit context-backup-credit"/);
 assert.match(html,/Stadtmotiv · kein Foto dieses Eintrags/);
 assert.match(html,/Bild: Test-Autor/);
});
test('Backup does not change individual photo provenance',()=>{
 const report=entryCompleteness(item,ctx);
 assert.equal(report.hasPhoto,true);
 assert.equal(report.photoCount,1);
 const missing=entryCompleteness({...item,id:'no-photo'},ctx);
 assert.equal(missing.hasPhoto,false);
 assert.match(placeImageHtml({...item,id:'no-photo'},ctx),/Stadtmotiv · kein Foto dieses Eintrags/);
});
