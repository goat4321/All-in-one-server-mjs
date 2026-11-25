import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('V74 route overlay is compact and ideas require explicit action',async()=>{
 const [css,ui,controller,index]=await Promise.all([
  read('public/route-story-compact-v74.css'),read('public/views.mjs'),
  read('public/app.mjs'),read('public/index.html')]);
 assert.match(css,/width:min\(302px/);
 assert.match(css,/background:rgba\(14,42,35,\.69\)/);
 assert.match(css,/max-height:175px/);
 assert.match(css,/route-story-player\[data-expanded=true\]/);
 assert.match(css,/story-arrival-stage/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(ui,/route-story-ideas-toggle/);
 assert.match(ui,/aria-controls="route-story-ideas"/);
 assert.match(controller,/case 'route-story-ideas-toggle'/);
 assert.match(controller,/panel\.dataset\.expanded!=='true'/);
 assert.match(controller,/const available=inCity&&rows\.length>0/);
 assert.match(index,/route-story-compact-v74\.css/);
});
test('V74 nine linked public site guides are source-backed, not new bookings',async()=>{
 const archive=JSON.parse(await read('data/research-v68/existing-place-guides.json'));
 const ids=['new_008','new_009','new_026','new_030','new_043',
   'new_058','new_091','new_093','new_095'];
 assert.equal(archive.entries.filter(x=>x.sourceUrl).length,22);
 for(const id of ids){
  const row=archive.entries.find(x=>x.id===id);
  assert.ok(row?.sourceUrl?.startsWith('https://'),id);
 }
 const cat=await loadCatalog();
 for(const id of ids){
  assert.equal(cat.sources['guide-v68:'+id]?.url,
   archive.entries.find(x=>x.id===id).sourceUrl);
  const rows=cat.trips.flatMap(t=>t.items).filter(
   x=>x.publicPlaceGuideV68?.uploadedId===id);
  assert.ok(rows.length>0,id);
  assert.ok(rows.every(x=>x.publicPlaceGuideV68.september2027OpeningConfirmed===false));
 }
});
test('V74 four historical public-place photographs retain attribution and do not imply access',async()=>{
 const cat=await loadCatalog();
 for(const [id,author,license] of [
  ['new_058','Fred Romero','CC BY 2.0'],
  ['new_093','Corradox','CC BY-SA 3.0'],
  ['new_020','Guilhem Vellut','CC BY 2.0'],
  ['new_082','Ktiv','CC BY-SA 4.0']
 ]){
  const p=cat.trips.flatMap(x=>x.items).find(
    x=>x.publicPlaceGuideV68?.uploadedId===id);
  assert.ok(p,'item exists '+id);
  const photo=curatedPlacePhoto(p);
  assert.ok(photo?.curated,'photo for '+id+' / '+p.city+' / '+p.name);
  assert.ok(photo.credit.includes(author));
  assert.ok(photo.credit.includes(license));
  assert.match(photo.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.equal(p.booked,false);
 }
});
