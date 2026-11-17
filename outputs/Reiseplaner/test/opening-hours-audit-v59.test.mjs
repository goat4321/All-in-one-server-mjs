import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {hasDocumentedOpeningReference,entryCompleteness}
 from '../public/entry-completeness.mjs';
import {VERIFIED_PLACE_UPDATES_V58} from '../lib/verified-place-updates-v58.mjs';

const catalog=await loadCatalog();
const items=catalog.trips.flatMap(t=>t.items);

test('Placeholder that literally says opening hours not confirmed never satisfies the audit',()=>{
 const placeholder={id:'test',city:'paris',kind:'activity',category:'activity',
  name:'Flexible activity',
  openingHoursNote:'Öffnungszeiten und mögliche Veranstaltungen im September 2027 nicht bestätigt',
  detail:'Just an unverified 2027 idea',point:null,price:null};
 assert.equal(hasDocumentedOpeningReference(placeholder),false);
 const row=entryCompleteness(placeholder,{catalog,cities:catalog.cities,people:[{},{},{}]});
 assert.equal(row.publishedHours,false);
 assert.ok(row.gaps.some(g=>g.key==='hours'));
 assert.equal(hasDocumentedOpeningReference({
  ...placeholder,openingHoursNote:'Öffnungszeiten am Reisetag nicht bestätigt'}),false);
});
test('Actual opening hours on source-backed V58 pages count, but flexible event windows do not',()=>{
 const ground=items.find(i=>i.officialAccessV58?.sourceUrl===VERIFIED_PLACE_UPDATES_V58.new_013.sourceUrl);
 const marbella=items.find(i=>i.officialAccessV58?.sourceUrl===VERIFIED_PLACE_UPDATES_V58.new_033.sourceUrl);
 const bigo=items.find(i=>i.officialAccessV58?.sourceUrl===VERIFIED_PLACE_UPDATES_V58.new_072.sourceUrl);
 assert.ok(ground&&marbella&&bigo);
 assert.equal(hasDocumentedOpeningReference(ground),true);
 assert.equal(hasDocumentedOpeningReference(marbella),false);
 assert.equal(hasDocumentedOpeningReference(bigo),false);
 assert.ok(entryCompleteness(marbella,{catalog,cities:catalog.cities}).gaps.some(g=>g.key==='hours'));
});
test('Unverified upload notes cannot falsely fill hours for 105 original candidate rows',()=>{
 const uploaded=items.filter(i=>i.researchV50);
 assert.ok(uploaded.length>40,'Source-backed imported candidates exist across four trips');
 for(const item of uploaded){
  const note=String(item.openingHoursNote??'');
  if(!note.includes('im September 2027 nicht bestätigt'))continue;
  const actual=hasDocumentedOpeningReference(item);
  const official=[item.officialAccessV53,item.officialAccessV56,item.officialAccessV57,item.officialAccessV58];
  if(!official.some(Boolean)&&item.venueSourceV78?.publishedOpeningReference!==true)
   assert.equal(actual,false,item.id);
 }
});
test('Structured site hours, opening hours and qualified seasonal operator timetables remain usable',()=>{
 assert.equal(hasDocumentedOpeningReference({hours:['10:00','18:00']}),true);
 assert.equal(hasDocumentedOpeningReference({weekly:{hours:['09:00','17:00']}}),true);
 assert.equal(hasDocumentedOpeningReference({openingHoursNote:'Täglich 09:00–18:00 Uhr; Änderungen möglich'}),true);
 assert.equal(hasDocumentedOpeningReference({openingHoursNote:'Kein genauer Termin, noch offen'}),false);
 const cable=items.find(i=>i.officialAccessV57?.schedulingAssurance==='published_2027_timetable_weather_dependent');
 assert.ok(cable);
 assert.equal(hasDocumentedOpeningReference(cable),true);
 assert.equal(hasDocumentedOpeningReference(null),false);
});
