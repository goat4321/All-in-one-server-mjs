import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {applyOfficialVenuesV77} from '../lib/official-venues-v77.mjs';
import {googleMapsSearchUrl,googleMapsPlaceQuery,googleMapsSearchLabel,googleMapsLocationStatus} from '../public/google-maps.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileHtml,placeProfileModel} from '../public/place-profile.mjs';
const load=async name=>JSON.parse(await readFile(new URL('../data/'+name,import.meta.url),'utf8'));
const archive=await load('research-v77/official-venues.json');
const uploaded=await load('research-v50/uploaded-interrail-2027-candidates.json');
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items).filter(x=>!x.duplicateOf&&!x.removed);
const match=id=>all.find(x=>x.officialVenueV77?.sourceId==='venue-v77:'+id);
const ctx={catalog,cities:catalog.cities,people:[{id:1},{id:2},{id:3}],state:{placePhotos:{}}};
test('V77 overlays existing venue references only, matching all 19 original records',()=>{
 assert.equal(archive.entries.length,19);
 assert.equal(archive.mapOverrides.length,11);
 const stats=catalog.research.officialVenuesV77.stats;
 assert.equal(stats.uniqueMatched,archive.entries.length);
 assert.deepEqual(stats.unmatchedVenueIds,[]);
 assert.equal(stats.uniqueExplicitMapIds,archive.mapOverrides.length);
 assert.ok(stats.attachedAcrossVariants>=archive.entries.length);
 assert.equal(new Set(archive.entries.map(e=>e.id)).size,archive.entries.length);
 for(const e of archive.entries){
  const item=match(e.id),g=item?.officialVenueV77;
  assert.ok(g,'Missing: '+e.id);
  assert.equal(g.checkedOn,'2026-11-17');
  assert.equal(g.bookingConfirmed,undefined);
  assert.equal(g.actualOpeningForSept2027Verified,false);
  assert.equal(g.actualAdmissionForSept2027Verified,false);
  assert.equal(g.noAutomaticBudget,true);
  assert.equal(g.sourceUrl,e.sourceUrl);
  assert.ok(item.source.includes('venue-v77:'+e.id));
  assert.equal(catalog.sources['venue-v77:'+e.id]?.url,e.sourceUrl);
  assert.ok(!item.mapsSearchV77?.verifiedPlaceId);
  assert.match(googleMapsSearchUrl(item,catalog.cities),/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
 }
});
test('V77 closed sites are visibly blocked but neither removed nor automatically unselected',()=>{
 for(const id of ['new_004','new_020']){
  const item=match(id);
  assert.equal(item.officialVenueV77.status,'closed_reopening_unknown');
  assert.equal(item.removed,false);
  assert.ok(item.officialVenueV77.conditions.includes('2027'));
  const html=placeProfileHtml(item,ctx);
  assert.match(html,/Planungshinweis/);
  assert.match(html,/Derzeit geschlossen/);
  assert.match(html,/Wiedereröffnung/);
  assert.ok(placeProfileModel(item,ctx).facts.some(([k])=>k==='Wichtiger Zugangsstatus'));
 }
 for(const id of ['new_034','new_036']){
  const item=match(id);
  assert.equal(item.officialVenueV77.status,'event_date_unconfirmed');
  assert.match(placeProfileHtml(item,ctx),/Veranstaltung für den konkreten Reisetag/);
 }
});
test('V77 Google Maps queries use a named POI or disclosed route stop instead of unverified user point',()=>{
 for(const ov of archive.mapOverrides){
  const item=all.find(x=>x.mapsSearchV77?.query===ov.query);
  assert.ok(item,'Missing query for '+ov.id);
  // Higher-trust public operator visitor address remains authoritative,
  // even when a V77 search alias exists (e.g. Base Náutica Barcelona).
  const officialAddress=item.officialAccessV58?.visitorAddress
    ??item.officialAccessV57?.visitorAddress
    ??item.officialAccessV56?.visitorAddress
    ??item.officialAccessV53?.visitorAddress;
  const expected=officialAddress??ov.query;
  assert.equal(googleMapsPlaceQuery(item,catalog.cities),expected);
  assert.equal(item.mapsSearchV77.sourceScope,'place_search_not_verified_pin');
  assert.equal(item.mapsSearchV77.verifiedPlaceId,null);
  const url=new URL(googleMapsSearchUrl(item,catalog.cities));
  assert.equal(url.searchParams.get('query'),expected);
 }
 const monte=all.find(x=>x.mapsSearchV77?.query==='Palais Princier, Monaco');
 assert.ok(monte);
 assert.match(googleMapsSearchLabel(monte),/Ausgangspunkt/);
 assert.match(monte.mapsSearchV77.hint,/nicht ganz Monte-Carlo/);
 const old={name:'Test Bistro',city:'paris',kind:'activity',point:[48.5,2.9],
  geoEvidence:{source:'Nutzerdatei',confidence:'user_submitted_unverified'}};
 assert.match(googleMapsPlaceQuery(old,catalog.cities),/Test Bistro/);
 assert.ok(!googleMapsPlaceQuery(old,catalog.cities).includes('48.5,'));
 assert.match(googleMapsLocationStatus(old),/unabhängiger Objektnachweis/);
 const airbnb={id:'wishlist:airbnb:fake',city:'paris',name:'Private Host Home',provider:'Airbnb',
  mapsSearchV77:{query:'Secret Address 11 rue',hint:'ignore'}};
 assert.ok(!googleMapsPlaceQuery(airbnb,catalog.cities).includes('Secret'));
 assert.match(googleMapsSearchLabel(airbnb),/Umgebung/);
});
test('V77 source facts are visible without presenting 2027 prices as live',()=>{
 for(const id of ['new_001','new_002','new_004','new_034','new_041','new_050','new_051','new_059','new_060']){
  const item=match(id),g=item.officialVenueV77;
  const p=placeProfileModel(item,ctx);
  const html=placeProfileHtml(item,ctx);
  for(const heading of ['Betreiber-/Tourismusangabe · Ort','Veröffentlichte Besucheradresse (kein GPS-Beleg)',
    'Betreiberzeiten / Veranstaltungszeiten','Eintritt / historische Preise','Hinweise und offene Fragen'])
    assert.ok(p.facts.some(x=>x[0]===heading),item.id+' '+heading);
  assert.ok(html.includes(g.sourceUrl.replace(/&/g,'&amp;'))||html.includes('Veröffentlichte Betreiber-/Tourismusangaben'));
  assert.match(html,/kein bestätigter Gruppenpreis September 2027/);
 }
});
test('V77 invalid source/status is rejected without changes',()=>{
 const base={id:'interrail_classic',route:['paris'],items:[{id:'a',city:'paris',name:'Bouillon Pigalle',kind:'activity',
  point:null,price:null,booked:false,selected:false}]};
 const keep=structuredClone(base);
 const done=applyOfficialVenuesV77([base],catalog.cities,uploaded,archive);
 assert.equal(done.uniqueMatched,1);
 for(const key of ['route'])assert.deepEqual(base[key],keep[key]);
 for(const key of ['id','name','city','point','price','booked','selected'])
  assert.deepEqual(base.items[0][key],keep.items[0][key]);
 const bad=structuredClone(archive);
 bad.entries[0].sourceUrl='javascript:alert(1)';
 assert.throws(()=>applyOfficialVenuesV77([keep],catalog.cities,uploaded,bad),/V77 invalid venue/);
});
test('V77 two historic object photos have independent attribution and are not used for rooms',()=>{
 for(const [name,credit,license] of [
   ['Atelier des Lumières','Emalquier','CC BY-SA 4.0'],
   ['La Recyclerie','Jeanne Menjoulet','CC BY 2.0']
 ]){
  const p=curatedPlacePhoto({city:'paris',name,kind:'activity',category:name==='La Recyclerie'?'food':'activity'});
  assert.ok(p,name);
  assert.ok(p.credit.includes(credit)&&p.credit.includes(license));
  assert.match(p.sourceUrl,/commons.wikimedia.org\/wiki\/File:/);
  assert.match(p.licenseUrl,/creativecommons/);
  assert.equal(curatedPlacePhoto({city:'paris',name,kind:'lodging'}),null);
 }
});
