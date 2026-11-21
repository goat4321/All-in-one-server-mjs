import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyVenueSourceReviewV78} from '../lib/venue-source-review-v78.mjs';
import {hasDocumentedOpeningReference,entryCompleteness} from '../public/entry-completeness.mjs';
import {placeProfileHtml,placeProfileModel} from '../public/place-profile.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';

const read=async file=>JSON.parse(await readFile(new URL('../data/'+file,import.meta.url),'utf8'));
const archive=await read('research-v78/venue-source-review.json');
const upload=await read('research-v50/uploaded-interrail-2027-candidates.json');
const catalog=await loadCatalog();
const items=catalog.trips.flatMap(t=>t.items).filter(x=>!x.duplicateOf&&!x.removed);
const itemFor=id=>items.find(i=>i.venueSourceV78?.sourceId==='venue-v78:'+id);
const conflictFor=id=>items.find(i=>i.venueIdentityReviewV78?.issue
  &&i.id==='uploaded:v50:'+id||i.venueIdentityReviewV78?.issue
    &&i.researchV50?.uploadedId===id);
const ctx={cities:catalog.cities,catalog,people:[{id:1},{id:2},{id:3}],
 state:{placePhotos:{},favorites:[],votes:{}},activeSet:new Set()};

test('V78 12 exact venue sources are used in existing catalog variants and not booked',()=>{
 assert.equal(archive.entries.length,12);
 assert.equal(archive.reviews.length,2);
 assert.equal(new Set(archive.entries.map(x=>x.id)).size,12);
 const stats=catalog.research.venueSourceReviewV78.stats;
 assert.equal(stats.uniqueEnriched,12);
 assert.equal(stats.uniqueConflicts,2);
 assert.deepEqual(stats.missedEntries,[]);
 assert.deepEqual(stats.missedReviews,[]);
 assert.equal(stats.live2027Offers,0);
 assert.equal(stats.modifiedBookings,0);
 for(const row of archive.entries){
   const item=itemFor(row.id);
   assert.ok(item,row.id+' not matched');
   const g=item.venueSourceV78;
   assert.equal(g.sourceType,row.sourceType);
   assert.equal(g.sourceUrl,row.sourceUrl);
   assert.equal(g.confirmedCheckout,false);
   assert.equal(g.individualTrip2027Offer,false);
   assert.equal(g.publishedOpeningReference,row.publishedOpeningReference);
   assert.equal(catalog.sources[g.sourceId]?.url,row.sourceUrl);
   assert.ok(item.source.includes(g.sourceId));
   assert.ok(placeProfileModel(item,ctx).facts.some(x=>x[0]==='Preisstand / Tarifgültigkeit'));
 }
});
test('V78 conflicting similarly named businesses are NOT stamped with unrelated venue sources',()=>{
 for(const r of archive.reviews){
  const item=conflictFor(r.id);
  assert.ok(item,r.id+' missing review');
  const c=item.venueIdentityReviewV78;
  assert.equal(c.status,r.status);
  assert.equal(c.explicitlyNotVenueSource,true);
  assert.equal(c.matchesImportedIdentity,false);
  assert.ok(!item.venueSourceV78);
  assert.ok(!item.source?.includes('venue-v78:'+r.id));
  const html=placeProfileHtml(item,ctx);
  assert.match(html,/Gegenquelle prüfen/);
  if(r.id==='new_021'){
   assert.match(html,/Adressprüfung · vermutlich derselbe Eckstandort/);
   assert.doesNotMatch(html,/<strong>Identitätskonflikt:<\/strong>/);
   assert.match(html,/exakte Eingangstür/);
  }else{
   assert.match(html,/Identitätskonflikt/);
   assert.ok(html.includes(r.issue.slice(0,12)),r.id+' identity warning visible');
  }
 }
});
test('V78 2027 published group brochure is explicitly NOT a quote for a trio',()=>{
 const onefam=itemFor('new_039');
 assert.ok(onefam);
 const g=onefam.venueSourceV78;
 assert.ok(g.sourceUrl.endsWith('.pdf'));
 assert.match(g.price,/32 €\/Bett/);
 assert.match(g.price,/36 €/);
 assert.match(g.caution,/(?:Drei|3)-Personen/);
 assert.equal(g.individualTrip2027Offer,false);
 assert.equal(onefam.booked,false);
 const html=placeProfileHtml(onefam,ctx);
 assert.match(html,/keine bestätigte Einzelbuchung September 2027/);
 assert.match(html,/Original-Betreiberinformation/);
});
test('V78 only explicitly confirmed operator published hours count as source references',()=>{
 const withHours=itemFor('new_022');
 assert.equal(withHours.venueSourceV78.publishedOpeningReference,true);
 assert.equal(hasDocumentedOpeningReference(withHours),true);
 const isolated={
  id:'test',kind:'activity',name:'Unknown',city:'nice',
  openingHoursNote:'Öffnungszeiten im September 2027 nicht bestätigt',
  venueSourceV78:{sourceType:'operator',publishedOpeningReference:false}
 };
 assert.equal(hasDocumentedOpeningReference(isolated),false);
 isolated.venueSourceV78.publishedOpeningReference=true;
 assert.equal(hasDocumentedOpeningReference(isolated),true);
 const noFake=entryCompleteness(itemFor('new_023'),ctx);
 assert.equal(noFake.hasPrice,false);
});
test('V78 supplies licensed Monaco sub-stop photo, and independent Commons search for missing images',()=>{
 const item=items.find(x=>x.name.startsWith('Tagesausflug Monaco & Monte-Carlo')&&x.city==='nice');
 assert.ok(item);
 const photo=curatedPlacePhoto(item);
 assert.ok(photo?.sourceUrl.endsWith('Palais_Princier_de_Monaco.jpg'));
 assert.match(photo.credit,/NUR TEILZIEL/);
 assert.match(photo.credit,/Jorge Franganillo/);
 assert.match(photo.licenseUrl,/creativecommons.org\/licenses\/by\/4.0/);
 assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null);
 const missing=items.find(x=>x.city==='barcelona'&&x.name==='Bo de B');
 assert.ok(missing);
 assert.equal(curatedPlacePhoto(missing),null);
 const profile=placeProfileModel(missing,ctx);
 assert.match(profile.photoSearchUrl,/commons.wikimedia.org/);
 assert.match(placeProfileHtml(missing,ctx),/Lizenzierte Fotos bei Wikimedia Commons suchen/);
});
test('V78 preserves routes, prices, room and booking state when re-attaching full archive',()=>{
 const sample=structuredClone(catalog.trips);
 const original=sample.map(t=>({
   id:t.id,route:structuredClone(t.route),
   items:t.items.map(x=>({id:x.id,city:x.city,kind:x.kind,point:structuredClone(x.point??null),
      price:structuredClone(x.price??null),room:x.room??null,
      booked:x.booked??false,selected:x.selected??false}))
 }));
 const stats=applyVenueSourceReviewV78(sample,catalog.cities,upload,archive);
 assert.equal(stats.uniqueEnriched,12);
 assert.equal(stats.uniqueConflicts,2);
 sample.forEach((trip,i)=>{
   assert.deepEqual(trip.route,original[i].route);
   trip.items.forEach((item,j)=>{
     const old=original[i].items[j];
     assert.equal(item.id,old.id);
     assert.equal(item.city,old.city);
     assert.equal(item.kind,old.kind);
     assert.deepEqual(item.point??null,old.point);
     assert.deepEqual(item.price??null,old.price);
     assert.equal(item.room??null,old.room);
     assert.equal(item.booked??false,old.booked);
     assert.equal(item.selected??false,old.selected);
   });
 });
 const invalid=structuredClone(archive);
 invalid.entries[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applyVenueSourceReviewV78([{
   id:'interrail_classic',route:[],items:[]}],catalog.cities,upload,invalid),/V78 invalid venue row/);
});
