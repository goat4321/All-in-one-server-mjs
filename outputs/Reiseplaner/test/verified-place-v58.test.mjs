import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {VERIFIED_PLACE_UPDATES_V58,applyVerifiedPlaceUpdateV58}
 from '../lib/verified-place-updates-v58.mjs';
import {googleMapsPlaceQuery,googleMapsSearchUrl,googleMapsSearchLabel}
 from '../public/google-maps.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';

const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const entries=Object.entries(VERIFIED_PLACE_UPDATES_V58);
const matching=id=>all.filter(x=>x.officialAccessV58?.sourceUrl===VERIFIED_PLACE_UPDATES_V58[id]?.sourceUrl);

test('Five sourced V58 records enrich actual imported sites in relevant routes',()=>{
 assert.equal(entries.length,5);
 assert.equal(catalog.research.operatorAccessV58.updatedOriginalCandidates,5);
 for(const [id,note] of entries){
  const found=matching(id);
  assert.ok(found.length>=1,id);
  assert.equal(catalog.sources['operator-v58:'+id]?.url,note.sourceUrl);
  assert.match(note.sourceUrl,/^https:\/\//);
  for(const item of found){
   assert.equal(item.officialAccessV58.forTravelYearBookingConfirmed,false,id);
   assert.equal(item.officialAccessV58.september2027EventConfirmed,false,id);
   assert.ok(item.source.includes('operator-v58:'+id));
   assert.equal(item.website,note.sourceUrl);
   assert.equal(item.address,note.visitorAddress);
   assert.equal(item.price,null,'Older research may never become a confirmed live price');
   assert.equal(item.booked,false);
   assert.equal(item.selected,false);
   assert.match(item.detail,/Betreiber-\/Stadtquelle 2026-11-16/);
  }
 }
});
test('User coordinates/booking/price stay untouched and duplicate updates do not accumulate',()=>{
 const obj={id:'test',city:'genoa',kind:'activity',name:'Panoramalift',
  point:[44.408,8.927],price:{currency:'EUR',cents:1200},
  selected:true,booked:true,detail:'Originaltext',
  geoEvidence:{confidence:'user_supplied_unverified'},source:[]};
 const changed=applyVerifiedPlaceUpdateV58(obj,'new_072');
 assert.equal(changed,obj);
 assert.deepEqual(obj.point,[44.408,8.927]);
 assert.equal(obj.price.cents,1200);
 assert.equal(obj.booked,true);
 assert.equal(obj.selected,true);
 assert.equal(obj.geoEvidence.confidence,'user_supplied_unverified');
 applyVerifiedPlaceUpdateV58(obj,'new_072');
 assert.equal(obj.source.length,1);
 assert.equal((obj.detail.match(/Betreiber-\/Stadtquelle/g)||[]).length,1);
 assert.equal(applyVerifiedPlaceUpdateV58(obj,'nonexistent'),obj);
});
test('Google Maps searches verified public visitor addresses, not broad titles or uploaded GPS',()=>{
 for(const id of ['new_013','new_033','new_042','new_072','new_092']){
  const item=matching(id)[0];
  const query=googleMapsPlaceQuery(item,catalog.cities);
  assert.equal(query,VERIFIED_PLACE_UPDATES_V58[id].visitorAddress);
  assert.match(googleMapsSearchUrl(item,catalog.cities),/https:\/\/www\.google\.com\/maps\/search/);
  assert.match(googleMapsSearchLabel(item),/Betreiberadresse/);
 }
 const airbnb=all.find(i=>i.provider==='Airbnb');
 assert.ok(airbnb);
 assert.match(googleMapsSearchLabel(airbnb),/Umgebung/);
 assert.doesNotMatch(googleMapsPlaceQuery(airbnb,catalog.cities),/St. Josefstrasse/);
});
test('Bigo and Kronberg price age/booking rules are explicit, no inherited universal discount',()=>{
 assert.match(VERIFIED_PLACE_UPDATES_V58.new_072.priceReference,/6 €/);
 assert.match(VERIFIED_PLACE_UPDATES_V58.new_072.summary,/18-Jährige.*nicht automatisch/);
 assert.match(VERIFIED_PLACE_UPDATES_V58.new_092.priceReference,/CHF 9/);
 assert.match(VERIFIED_PLACE_UPDATES_V58.new_092.summary,/für eine oder zwei Personen/);
 assert.match(VERIFIED_PLACE_UPDATES_V58.new_092.hoursReference,/keine bestätigte September-2027/);
 assert.equal(VERIFIED_PLACE_UPDATES_V58.new_033.september2027EventConfirmed,false);
 assert.equal(VERIFIED_PLACE_UPDATES_V58.new_042.september2027EventConfirmed,false);
});
test('Three exact Commons files have authentic attribution and no lodging photo reuse',()=>{
 const targets=[
  ['paris','Ground Control','Paris_-_Ground_Control','Fred Romero · CC BY 2.0'],
  ['sete','Théâtre de la Mer','Th%C3%A9atre_de_la_Mer','Christian Ferrer · CC BY-SA 3.0'],
  ['genoa','Il Bigo (Panoramalift im Porto Antico)','Bigo_Genova.jpg','Al*from*Lig · CC BY-SA 4.0'],
 ];
 for(const [city,name,title,credit] of targets){
  const place={id:'test',kind:'activity',category:'activity',city,name};
  const photo=curatedPlacePhoto(place);
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(title),name);
  assert.ok(photo.credit.includes(credit),name);
  assert.match(photo.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  assert.equal(curatedPlacePhoto({...place,kind:'lodging'}),null);
 }
});
test('Operator rate displayed on card instead of unverified upload estimate, 2027 event status in profile',()=>{
 const item=matching('new_072')[0],trip=catalog.trips.find(t=>t.id===item.trip);
 const ctx={trip,catalog,cities:catalog.cities,all:trip.items,city:'genoa',
  date:trip.from,people:[{id:1},{id:2},{id:3}],
  state:{placePhotos:{},favorites:[]},activeSet:new Set(),browseSavedIds:new Set(),
  compareIds:new Set(),cityForDay:()=>item.city};
 const html=browseOptionCard(item,ctx);
 assert.match(html,/Betreiber-Tarifreferenz/);
 assert.match(html,/Betreiberquelle/);
 assert.match(html,/Google Maps/);
 assert.match(html,/6 €/);
 assert.match(html,/September 2027 prüfen/);
 const facts=placeProfileModel(item,ctx).facts;
 assert.ok(facts.some(([k])=>k==='Historischer Betreiberpreis · nicht im Budget'));
 assert.ok(facts.some(([k])=>k==='Konkrete Veranstaltung September 2027'));
});
