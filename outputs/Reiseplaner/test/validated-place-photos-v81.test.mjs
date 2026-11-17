import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {curatedPlacePhoto,curatedCityBackdrop} from '../public/curated-place-photos.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';
import {placeImageHtml,placeProfileHtml,placeProfileModel,placeThumbnailHtml} from '../public/place-profile.mjs';

const read=async path=>JSON.parse(await readFile(new URL('../data/'+path,import.meta.url),'utf8'));
const audit=await read('research-v81/licensed-place-photos.json');
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(trip=>trip.items).filter(x=>!x.removed&&!x.duplicateOf);
const match=id=>all.find(x=>x.researchV50?.uploadedId===id)
  ??all.find(x=>x.id==='uploaded:v50:'+id);
const ctx={catalog,cities:catalog.cities,people:[{id:1},{id:2},{id:3}],state:{placePhotos:{}}};
test('V81 four documented Commons photos match exact imported subjects with distinct scopes',()=>{
 assert.equal(audit.meta.count,4);
 assert.equal(catalog.research.licensedPlacePhotosV81.stats.addedImages,4);
 assert.equal(catalog.research.licensedPlacePhotosV81.stats.individuallyMatched,3);
 assert.equal(catalog.research.licensedPlacePhotosV81.stats.historicVenueOnly,1);
 const scopes={
  new_004:'exact_historic_external',
  new_022:'at_venue_historic_food',
  new_032:'exact_historic_beach',
  new_034:'venue_site_not_event'
 };
 for(const entry of audit.images){
  const item=match(entry.id);
  assert.ok(item,'No matching imported venue '+entry.id);
  const photo=curatedPlacePhoto(item);
  assert.ok(photo,entry.name+' missing image');
  assert.equal(photo.photoScope,scopes[entry.id]);
  assert.equal(photo.photographed,entry.photographed);
  assert.ok(photo.credit.includes(entry.author));
  assert.ok(photo.credit.includes(entry.license));
  assert.equal(photo.licenseUrl,entry.licenseUrl);
  assert.equal(photo.sourceUrl,entry.sourceUrl);
  assert.equal(catalog.sources['photo-v81:'+entry.id]?.url,entry.sourceUrl);
  assert.equal(photo.curated,true);
  assert.match(photo.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  const html=placeImageHtml(item,ctx);
  assert.ok(html.includes('data-photo-scope="'+entry.scope+'"'));
  assert.match(html,/Bildquelle/);
  assert.match(html,/Lizenz/);
  assert.ok(html.includes(entry.author));
  assert.ok(placeThumbnailHtml(item,ctx).includes('data-photo-scope="'+entry.scope+'"'));
  assert.ok(placeProfileModel(item,ctx).facts.some(x=>x[0]==='Bildnachweis · Motiv und Datum'));
  assert.equal(entry.confirmedAs2027Opening,false);
 }
});
test('V81 market fire, dated food photo, beach and festival have no false current claims',()=>{
 for(const [id,expected] of [
  ['new_004','Brand'],['new_022','Speisen und Preise'],
  ['new_032','Badeflaggen'],['new_034','Festivalprogramm']
 ]){
  const item=match(id),p=curatedPlacePhoto(item),html=placeProfileHtml(item,ctx);
  assert.ok(p.subjectDisclaimer.includes(expected),id+' disclaimer');
  assert.ok(html.includes(expected),'Visible not just internal metadata: '+id);
  assert.ok(html.includes(p.sourceUrl.replace(/&/g,'&amp;')));
  const fallback=curatedCityBackdrop(item);
  assert.ok(fallback?.contextualOnly);
 }
 const event=match('new_034');
 const gaps=entryCompleteness(event,ctx);
 assert.equal(gaps.photoEvidenceScope,'venue_site_not_event');
 assert.equal(gaps.photoContextOnly,true);
 assert.equal(gaps.hasPhoto,false);
 assert.ok(gaps.gaps.some(g=>g.key==='photo'&&g.label.includes('Festivalfoto')));
 const beach=entryCompleteness(match('new_032'),ctx);
 assert.equal(beach.photoEvidenceScope,'exact_historic_beach');
 assert.equal(beach.hasPhoto,true);
 const restaurant=entryCompleteness(match('new_022'),ctx);
 assert.equal(restaurant.photoEvidenceScope,'at_venue_historic_food');
 assert.equal(restaurant.hasPhoto,true);
});
test('V81 public food imagery is allowed ONLY for an exact named venue, never for lodging',()=>{
 const v=match('new_022');
 const food={...v,kind:'food'};
 assert.equal(curatedPlacePhoto(food)?.photoScope,'at_venue_historic_food');
 assert.equal(curatedPlacePhoto({...v,kind:'lodging'}),null);
 assert.equal(curatedPlacePhoto({...v,kind:'transport'}),null);
 assert.equal(curatedPlacePhoto({...v,kind:'shop'})?.photoScope,'at_venue_historic_food');
 assert.equal(curatedPlacePhoto({...v,name:'Andere Bäckerei in Barcelona'}),null);
 assert.equal(curatedPlacePhoto({...v,city:'nice'}),null);
 for(const image of audit.images)assert.match(image.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
});
test('V81 missing-place city backdrops are scenic only, not random photos of other restaurants',()=>{
 const expected={
  paris:/(?:montmartre|eiffel|seineufer|trocad)/i,
  barcelona:/(?:montju|barceloneta|ciutadella)/i,
  sete:/(?:canal|mont.saint|pointe.courte|corniche)/i,
  nice:/(?:promenade.des.anglais|port.lympia|vieux|colline)/i,
 };
 for(const city of Object.keys(expected)){
  for(let i=0;i<18;i++){
   const item={id:'synthetic-city-fallback-'+i,city,name:'Unknown small café '+i,kind:'activity'};
   assert.equal(curatedPlacePhoto(item),null);
   const background=curatedCityBackdrop(item);
   assert.ok(background?.contextualOnly,city+' missing scenic fallback');
   assert.equal(background.photoScope,'city_backdrop');
   assert.match(background.sourceUrl,/commons.wikimedia.org/);
   const decoded=decodeURIComponent(background.url);
   assert.match(decoded,expected[city],city+' selected irrelevant property');
   assert.doesNotMatch(decoded,/Can Paixano|Palo Alto|Marché des Enfants-Rouges|Bouillon Pigalle|La Recyclerie/i);
   const card=placeThumbnailHtml(item,ctx);
   assert.ok(card.includes('data-licensed="false"'));
   assert.ok(card.includes('data-photo-scope="city_backdrop"'));
  }
 }
});
test('V81 audit source URLs reject implied private room images or 2027 certainty',()=>{
 for(const p of audit.images){
  assert.match(p.licenseUrl,/^https:\/\/creativecommons.org\/licenses\//);
  assert.match(p.resizeMethod,/CSS-Bildausschnitt/);
  assert.ok(p.caption.length>60);
  assert.ok(!p.isExactVenuePhotograph||p.scope.startsWith('exact_'));
  assert.ok(Number(p.photographed.slice(0,4))<2027);
  const x=catalog.research.licensedPlacePhotosV81.stats.imageEntries.find(x=>x.id===p.id);
  assert.ok(x);
  assert.equal(x.sourceUrl,p.sourceUrl);
 }
 assert.equal(catalog.research.licensedPlacePhotosV81.stats.current2027ConditionsVerified,0);
});
