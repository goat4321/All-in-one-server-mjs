import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyLastCityGapsV79} from '../lib/last-city-gaps-v79.mjs';
import {googleMapsPlaceQuery,googleMapsSearchLabel,googleMapsLocationStatus} from '../public/google-maps.mjs';
import {placeProfileModel,placeProfileHtml} from '../public/place-profile.mjs';
import {hasDocumentedOpeningReference,entryCompleteness} from '../public/entry-completeness.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';

const read=async path=>JSON.parse(await readFile(new URL('../data/'+path,import.meta.url),'utf8'));
const source=await read('research-v79/last-city-gaps.json');
const uploaded=await read('research-v50/uploaded-interrail-2027-candidates.json');
const catalog=await loadCatalog();
const items=catalog.trips.flatMap(t=>t.items).filter(x=>!x.removed&&!x.duplicateOf);
const idOf=item=>item.researchV50?.uploadedId??
 (item.id?.startsWith('uploaded:v50:')?item.id.slice('uploaded:v50:'.length):null);
const get=id=>items.find(i=>idOf(i)===id)
 ??items.find(i=>i.lastCityGuideV79?.sourceId==='city-v79:'+id)
 ??items.find(i=>i.mapsSearchV79?.query===source.conflicts.find(x=>x.id===id)?.mapsQuery);
const ctx={catalog,cities:catalog.cities,state:{placePhotos:{},favorites:[]},people:[{id:1},{id:2},{id:3}]};

test('V79 seven remaining city venues receive exact official references, not a booking',()=>{
 assert.equal(source.entries.length,7);
 assert.equal(source.conflicts.length,4);
 const stats=catalog.research.lastCityGapsV79.stats;
 assert.equal(stats.uniqueEnriched,7);
 assert.equal(stats.uniqueConflicts,4);
 assert.deepEqual(stats.missingEntries,[]);
 assert.deepEqual(stats.missingConflicts,[]);
 assert.equal(stats.modifiedItineraries,0);
 assert.equal(stats.liveBookings,0);
 for(const row of source.entries){
  const item=items.find(x=>x.lastCityGuideV79?.sourceId==='city-v79:'+row.id);
  assert.ok(item,'Not covered: '+row.id);
  const g=item.lastCityGuideV79;
  assert.equal(g.sourceUrl,row.sourceUrl);
  assert.equal(g.actualOpenOnTripDate,false);
  assert.equal(g.livePriceConfirmed,false);
  assert.equal(g.bookingConfirmed,false);
  assert.equal(g.photoReusePermissionConfirmed,false);
  assert.ok(item.source.includes('city-v79:'+row.id));
  assert.equal(catalog.sources['city-v79:'+row.id]?.url,row.sourceUrl);
  const p=placeProfileModel(item,ctx);
  assert.ok(p.facts.some(x=>x[0]==='Neu: konkret recherchierter Ort'));
  assert.ok(p.facts.some(x=>x[0]==='Preisreferenz · kein 2027-Checkout'));
  const html=placeProfileHtml(item,ctx);
  assert.ok(html.includes(row.sourceUrl.replace(/&/g,'&amp;')),'Official source link visible '+row.id);
 }
});
test('V79 conflicts change neither the business identity nor the stored address or map coordinates',()=>{
 for(const row of source.conflicts){
  const item=items.find(x=>x.sourceConflictV79?.issue===row.issue);
  assert.ok(item,'Conflict missing '+row.id);
  assert.equal(item.sourceConflictV79.type,row.type);
  assert.equal(item.sourceConflictV79.identityConfirmed,false);
  assert.equal(item.mapsSearchV79.query,row.mapsQuery);
  assert.equal(item.mapsSearchV79.confirmedPin,false);
  assert.equal(item.mapsSearchV79.verifiedGooglePlaceId,null);
  const q=googleMapsPlaceQuery(item,catalog.cities);
  const independent=item.officialAccessV58?.visitorAddress
    ??item.officialAccessV57?.visitorAddress
    ??item.officialAccessV56?.visitorAddress
    ??item.officialAccessV53?.visitorAddress;
  const corner=item.alternativeVenueReviewV80?.status==='corner_addresses_correlated';
  assert.equal(q,independent??(corner?item.alternativeVenueReviewV80.mapQuery:row.mapsQuery));
  const html=placeProfileHtml(item,ctx);
  if(corner){
   assert.match(html,/Adressprüfung · vermutlich derselbe Eckstandort/);
   assert.match(googleMapsSearchLabel(item),/Ecklage/);
   assert.match(googleMapsLocationStatus(item),/Ecklage Fusteria\/Mercè/);
  }else{
   assert.match(html,/Quellenabgleich erforderlich/);
   if(row.type!=='published_hours_disagreement'){
    assert.match(googleMapsSearchLabel(item),/Adresse \/ Anbieter verifizieren/);
    assert.match(googleMapsLocationStatus(item),/Ortsidentität oder Adresse widersprüchlich/);
   }
  }
  assert.match(html,/Abweichende Quelle/);
 }
});
test('V79 published September 2027 municipal park opening does not certify other times',()=>{
 const island=items.find(x=>x.lastCityGuideV79?.sourceId==='city-v79:new_006');
 assert.ok(island);
 assert.equal(island.lastCityGuideV79.publishedOpeningReference,true);
 assert.match(island.lastCityGuideV79.opening,/01.–30.09.2027/);
 assert.equal(hasDocumentedOpeningReference(island),true);
 const route=items.find(x=>x.lastCityGuideV79?.sourceId==='city-v79:new_027');
 assert.ok(route);
 assert.equal(route.lastCityGuideV79.publishedOpeningReference,false);
 assert.match(route.lastCityGuideV79.opening,/Mountainbike-Tour/);
 assert.match(route.lastCityGuideV79.requirements,/afrikanischer Schweinepest/);
 const isolated={city:'barcelona',kind:'activity',name:'Trail',openingHoursNote:'Öffnungszeiten und mögliche Veranstaltungen im September 2027 nicht bestätigt',
  lastCityGuideV79:{publishedOpeningReference:false,sourceType:'park'}};
 assert.equal(hasDocumentedOpeningReference(isolated),false);
 isolated.lastCityGuideV79={publishedOpeningReference:true,sourceType:'municipality'};
 assert.equal(hasDocumentedOpeningReference(isolated),true);
});
test('V79 source-backed details do not turn room rates into booking or change original trip structure',()=>{
 const variant=structuredClone(catalog.trips);
 const before=variant.map(t=>({
   route:structuredClone(t.route),
   items:t.items.map(i=>({id:i.id,name:i.name,city:i.city,kind:i.kind,
    point:structuredClone(i.point??null),address:i.address??null,
    price:structuredClone(i.price??null),quote:structuredClone(i.quote??null),
    selected:i.selected??false,booked:i.booked??false}))
 }));
 const stats=applyLastCityGapsV79(variant,catalog.cities,uploaded,source);
 assert.equal(stats.uniqueEnriched,7);
 assert.equal(stats.uniqueConflicts,4);
 variant.forEach((trip,i)=>{
  assert.deepEqual(trip.route,before[i].route);
  trip.items.forEach((x,j)=>{
   const old=before[i].items[j];
   for(const key of ['id','name','city','kind','address'])
    assert.deepEqual(x[key]??null,old[key]??null);
   for(const key of ['selected','booked'])
    assert.equal(Boolean(x[key]),old[key]);
   for(const key of ['point','price','quote'])
    assert.deepEqual(x[key]??null,old[key]??null);
  });
 });
 const bad=structuredClone(source);
 bad.entries[0].sourceUrl='javascript:prompt(1)';
 assert.throws(()=>applyLastCityGapsV79(
   [{id:'interrail_classic',route:['paris'],items:[]}],catalog.cities,uploaded,bad),/V79 invalid entry/);
});
test('V79 existing independently licensed attraction photos remain exact, hotel rooms stay generic',()=>{
 const island=items.find(x=>x.lastCityGuideV79?.sourceId==='city-v79:new_006');
 const walk=items.find(x=>x.lastCityGuideV79?.sourceId==='city-v79:new_027');
 assert.ok(curatedPlacePhoto(island)?.sourceUrl?.includes('commons.wikimedia.org'));
 assert.ok(curatedPlacePhoto(walk)?.sourceUrl?.includes('commons.wikimedia.org'));
 const generator=items.find(x=>x.lastCityGuideV79?.sourceId==='city-v79:new_017');
 assert.equal(curatedPlacePhoto(generator),null,'No third-party hostel room photos masquerading as reusable');
 assert.equal(entryCompleteness(generator,ctx).hasPhoto,false);
});

test('V79 distinct source coverage separates 62 cited identities from 3 unresolved business matches',()=>{
 const report=catalog.research.fourCitySourceCoverageV79;
 assert.equal(report.importedUnique,65);
 assert.equal(report.withIndividualReference,62);
 assert.equal(report.unresolved.length,3);
 assert.deepEqual(new Set(report.unresolved.map(x=>x.id)),
   new Set(['new_021','new_047','new_049']));
 assert.ok(report.unresolved.every(x=>x.identityConflictKnown));
 assert.deepEqual(new Set(report.conflictIds),
   new Set(['new_021','new_047','new_048','new_049']));
 assert.match(report.label,/keine vollständige 2027-Öffnung/);
});
