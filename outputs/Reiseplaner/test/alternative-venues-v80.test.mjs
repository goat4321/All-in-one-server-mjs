import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyAlternativeVenuesV80} from '../lib/alternative-venues-v80.mjs';
import {venueAlternativesHtml} from '../public/venue-alternatives-v80.mjs';
import {googleMapsPlaceQuery,googleMapsLocationStatus,googleMapsSearchLabel} from '../public/google-maps.mjs';
import {placeProfileHtml,placeProfileModel} from '../public/place-profile.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';

const read=async path=>JSON.parse(await readFile(new URL('../data/'+path,import.meta.url),'utf8'));
const archive=await read('research-v80/alternative-venues.json');
const upload=await read('research-v50/uploaded-interrail-2027-candidates.json');
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(x=>x.items).filter(x=>!x.removed&&!x.duplicateOf);
const place=id=>all.find(x=>x.researchV50?.uploadedId===id)
 ??all.find(x=>x.id==='uploaded:v50:'+id);
const ctx={cities:catalog.cities,catalog,people:[{id:1},{id:2},{id:3}],state:{placePhotos:{}}};
const mapsUri=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);

test('V80 three historical business cases are matched in all variants with 7 distinct alternatives',()=>{
 assert.equal(archive.dossiers.length,3);
 assert.equal(archive.meta.alternativeCount,7);
 const report=catalog.research.alternativeVenuesV80.stats;
 assert.equal(report.matchedOriginals,3);
 assert.equal(report.uniqueAlternatives,7);
 assert.equal(report.importedIdentitiesReplaced,0);
 assert.equal(report.originalCoordinatesChanged,0);
 assert.equal(report.selectedSubstitutions,0);
 assert.equal(report.bookingsCreated,0);
 for(const d of archive.dossiers){
  const i=place(d.id);
  assert.ok(i,'Missing original '+d.id);
  const a=i.alternativeVenueReviewV80;
  assert.ok(a,'Missing V80 '+d.id);
  assert.equal(a.status,d.status);
  assert.equal(a.originalIdentityConfirmed,false);
  assert.equal(a.verifiedExactEntrance,false);
  assert.equal(a.alternatives.length,d.alternatives.length);
  assert.equal(a.evidenceLinks.length,d.sourceUrls.length);
  for(const row of a.alternatives){
   assert.equal(row.pinVerified,false);
   assert.equal(row.notAutomaticallyPlanned,true);
   assert.equal(row.confirmedTripDate2027,false);
   assert.match(row.officialUrl,/^https:\/\//);
   assert.ok(row.address.length>20);
   assert.equal(row.mapQuery,row.name+', '+row.address);
   assert.ok(catalog.sources['alt-v80:'+row.key]?.url===row.officialUrl);
  }
 }
});
test('V80 Bo de B corner alias is corroborated, not automatically geocoded or venue-renamed',()=>{
 const x=place('new_021');
 const review=x.alternativeVenueReviewV80;
 assert.equal(review.status,'corner_addresses_correlated');
 assert.match(review.evidenceSummary,/Fusteria 14/);
 assert.match(review.evidenceSummary,/Mercè 35/);
 assert.equal(review.alternatives.length,0);
 assert.ok(review.evidenceLinks.length>=2);
 assert.equal(googleMapsPlaceQuery(x,catalog.cities),review.mapQuery);
 assert.match(googleMapsLocationStatus(x),/Ecklage/);
 assert.match(googleMapsSearchLabel(x),/Ecklage/);
 const html=placeProfileHtml(x,ctx);
 assert.match(html,/Adressprüfung · vermutlich derselbe Eckstandort/);
 assert.doesNotMatch(html,/<strong>Identitätskonflikt:<\/strong>/);
 assert.doesNotMatch(html,/<strong>Quellenabgleich erforderlich:<\/strong>/);
 assert.match(html,/Eingangstür/);
 assert.ok(html.includes(mapsUri(review.mapQuery).replace(/&/g,'&amp;')));
 assert.ok(placeProfileModel(x,ctx).facts.some(([name])=>/Ecklagen-Adresse/.test(name)));
 assert.equal(x.sourceConflictV79.identityConfirmed,false);
});
test('V80 verified Tielle and grocery alternatives have independent operators and links',()=>{
 const tielles=place('new_047').alternativeVenueReviewV80;
 const groceries=place('new_049').alternativeVenueReviewV80;
 assert.equal(tielles.alternatives.length,4);
 assert.equal(groceries.alternatives.length,3);
 assert.equal(tielles.status,'original_identity_unconfirmed_with_sourced_alternatives');
 assert.equal(groceries.status,'original_identity_unconfirmed_with_sourced_alternatives');
 assert.deepEqual(new Set([...tielles.alternatives,...groceries.alternatives].map(x=>x.key)).size,7);
 assert.ok(groceries.alternatives.every(x=>x.officialUrl.includes('carrefour.fr')));
 assert.ok(tielles.alternatives.some(x=>x.name.includes('Giulietta')));
 assert.ok(tielles.alternatives.some(x=>x.name.includes('Dassé')));
 assert.ok(groceries.alternatives.some(x=>x.address.includes('Résistance')));
 for(const [id,review] of [['new_047',tielles],['new_049',groceries]]){
  const x=place(id);
  const html=placeProfileHtml(x,ctx);
  assert.match(html,/nicht automatisch eingeplant/);
  assert.match(html,/Originalanbieter|Offizielles Tourismusamt/);
  assert.match(html,/In Google Maps suchen/);
  assert.match(html,/Quellenabgleich erforderlich/);
  for(const a of review.alternatives){
   assert.ok(html.includes(a.officialUrl.replace(/&/g,'&amp;')),a.key);
   assert.ok(html.includes(mapsUri(a.mapQuery).replace(/&/g,'&amp;')),a.key);
  }
  assert.deepEqual(googleMapsPlaceQuery(x,catalog.cities),x.mapsSearchV79.query);
  assert.equal(x.alternativeVenueReviewV80.originalIdentityConfirmed,false);
 }
});
test('V80 alternative HTML remains compact in discovery and escapes all source text',()=>{
 const item=place('new_047');
 const html=venueAlternativesHtml(item,{compact:true});
 assert.match(html,/<details class="venue-alternatives-v80"/);
 assert.match(html,/4 überprüfbare Alternativen/);
 assert.equal((html.match(/class="venue-alt-v80-option"/g)||[]).length,4);
 assert.doesNotMatch(html,/class="venue-alt-v80-facts"/);
 const long=venueAlternativesHtml(item);
 assert.equal((long.match(/class="venue-alt-v80-facts"/g)||[]).length,4);
 const malicious=structuredClone(item);
 malicious.alternativeVenueReviewV80.alternatives[0].name='<img src=x onerror=alert(1)>';
 const escaped=venueAlternativesHtml(malicious);
 assert.ok(escaped.includes('&lt;img'));
 assert.ok(!escaped.includes('<img src=x onerror'));
 assert.equal(venueAlternativesHtml({id:'none',name:'Other'}),'');
});
test('V80 updates only separate evidence overlays, not original itinerary, prices or coordinates',()=>{
 const trips=structuredClone(catalog.trips);
 const before=trips.map(t=>({
  route:structuredClone(t.route),
  items:t.items.map(x=>({
   id:x.id,name:x.name,city:x.city,kind:x.kind,
   point:structuredClone(x.point??null),address:x.address??null,
   price:structuredClone(x.price??null),quote:structuredClone(x.quote??null),
   booked:x.booked??null,selected:x.selected??null
  }))
 }));
 const r=applyAlternativeVenuesV80(trips,catalog.cities,upload,archive);
 assert.equal(r.matchedOriginals,3);
 trips.forEach((trip,i)=>{
  assert.deepEqual(trip.route,before[i].route);
  trip.items.forEach((x,j)=>{
   const old=before[i].items[j];
   for(const k of ['id','name','city','kind','address'])
    assert.deepEqual(x[k]??null,old[k]??null);
   for(const k of ['point','price','quote'])
    assert.deepEqual(x[k]??null,old[k]??null);
   for(const k of ['booked','selected'])
    assert.deepEqual(x[k]??null,old[k]);
  });
 });
 const bad=structuredClone(archive);
 bad.dossiers[1].alternatives[0].officialUrl='javascript:alert(1)';
 assert.throws(()=>applyAlternativeVenuesV80(
  [{id:'interrail_classic',items:[],route:[]}],catalog.cities,upload,bad),/V80 invalid alternative/);
});
test('V80 two Sète contextual images include Commons attribution and cannot be mistaken for vendor photos',()=>{
 const item=place('new_047'),a=item.alternativeVenueReviewV80;
 assert.equal(a.contextPhotos.length,2);
 const stats=catalog.research.alternativeVenuesV80.stats;
 assert.equal(stats.licensedContextPhotos,2);
 assert.equal(stats.venuePhotosImpliedByContext,0);
 const licenses=new Set(['CC BY 2.0','CC BY 3.0']);
 for(const p of a.contextPhotos){
  assert.ok(licenses.has(p.license));
  assert.ok(p.url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'));
  assert.ok(p.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert.match(p.licenseUrl,/creativecommons.org\/licenses\/by/);
  assert.match(p.description,/kein Foto eines bestimmten|nicht einer bestimmten/);
  assert.match(p.scope,/_not_venue/);
 }
 const full=venueAlternativesHtml(item);
 const small=venueAlternativesHtml(item,{compact:true});
 assert.equal((full.match(/class="venue-alt-v80-context"/g)||[]).length,1);
 assert.equal((full.match(/<figure>/g)||[]).length,2);
 assert.equal((small.match(/<figure>/g)||[]).length,1);
 assert.match(full,/Kontextbild · kein konkreter Anbieter/);
 assert.match(full,/Jorge Franganillo/);
 assert.match(full,/TCY/);
 assert.match(full,/Bildquelle/);
 assert.match(full,/Lizenz/);
 assert.equal(curatedPlacePhoto(item),null,
  'Regional context may never fill the individual venue-photo field');
});

test('V80 distinct progress audit differentiates supported alias from unresolved identities',async()=>{
 const report=catalog.research.fourCityIdentityResolutionV80;
 assert.equal(report.distinctImports,65);
 assert.equal(report.directNamedSources,62);
 assert.deepEqual(report.additionalCornerAliasSupported,['new_021']);
 assert.deepEqual(report.remainingOriginalIdentityUnconfirmed,['new_047','new_049']);
 assert.equal(report.distinctAlternatives,7);
 assert.equal(report.userSelectionRequired,true);
 assert.equal(report.matchedBusinessCheckout2027,false);
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../public/venue-alternatives-v80.css',import.meta.url),'utf8');
 assert.match(html,/venue-alternatives-v80\.css/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/focus-visible/);
 // Distinct Sète businesses have no assumed redistributable business photography.
 assert.equal(curatedPlacePhoto(place('new_047')),null);
 assert.equal(curatedPlacePhoto(place('new_049')),null);
});
