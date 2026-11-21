import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {VERIFIED_PLACE_UPDATES_V57,applyVerifiedPlaceUpdateV57}
 from '../lib/verified-place-updates-v57.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {googleMapsSearchUrl,googleMapsPlaceQuery} from '../public/google-maps.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';

const catalog=await loadCatalog();
const candidates=catalog.trips.flatMap(t=>t.items);
const rows=Object.entries(VERIFIED_PLACE_UPDATES_V57);
const matching=id=>candidates.filter(item=>item.officialAccessV57?.sourceUrl===VERIFIED_PLACE_UPDATES_V57[id]?.sourceUrl);

test('Seven public operator references are attached to original V50 places without new duplicate ids',()=>{
 assert.equal(rows.length,7);
 assert.equal(catalog.research.operatorAccessV57.updatedOriginalCandidates,7);
 assert.equal(catalog.research.operatorAccessV57.publishedSeasonCandidates,4);
 for(const [id,source] of rows){
  const items=matching(id);
  assert.ok(items.length>=1,id);
  assert.equal(catalog.sources['operator-v57:'+id].url,source.sourceUrl);
  for(const item of items){
   assert.ok(item.source.includes('operator-v57:'+id));
   assert.equal(item.officialAccessV57.forTravelYearBookingConfirmed,false);
   assert.equal(item.address,source.visitorAddress);
   assert.equal(item.website,source.sourceUrl);
   assert.ok(item.detail.includes('Betreiberrecherche 2026-11-16'));
  }
 }
});
test('Published 2027 season references cannot be mistaken for actual booking or all-2027 hours',()=>{
 const hoh=VERIFIED_PLACE_UPDATES_V57.new_091;
 const all=VERIFIED_PLACE_UPDATES_V57.new_100;
 const sunn=VERIFIED_PLACE_UPDATES_V57.new_101;
 assert.equal(hoh.seasonWindow2027,'2027-08-16/2027-10-17');
 assert.equal(sunn.seasonWindow2027,'2027-06-26/2027-09-12');
 assert.equal(all.schedulingAssurance,'start_announced_2027_end_not_published');
 assert.equal(all.seasonWindow2027,'2027-05-06/start_only');
 assert.match(hoh.priceReference,/40/);
 assert.match(sunn.priceReference,/2026/);
 assert.match(sunn.hoursReference,/08:10/);
 assert.equal(hoh.forTravelYearBookingConfirmed,undefined);
 assert.ok(!matching('new_101').some(i=>i.booked));
});
test('Research upload GPS, historical fares, selected status and original booking survive access enrichment',()=>{
 const item={id:'test',name:'Mountain',kind:'activity',city:'kandersteg',
  detail:'Existing',source:[],point:[46.5,7.6],price:{cents:4000,currency:'CHF'},
  selected:true,booked:true,geoEvidence:{confidence:'user_supplied_unverified'}};
 const modified=applyVerifiedPlaceUpdateV57(item,'new_101');
 assert.equal(modified,item);
 assert.deepEqual(item.point,[46.5,7.6]);
 assert.equal(item.price.cents,4000);
 assert.equal(item.selected,true);
 assert.equal(item.booked,true);
 assert.equal(item.geoEvidence.confidence,'user_supplied_unverified');
 applyVerifiedPlaceUpdateV57(item,'new_101');
 assert.equal(item.source.length,1,'source refs are idempotent');
 assert.equal((item.detail.match(/Betreiberrecherche/g)||[]).length,1);
});
test('Maps now focus the sourced public Talstation rather than a large mountain route or exact property pin',()=>{
 const cable=matching('new_101')[0];
 const query=googleMapsPlaceQuery(cable,catalog.cities);
 assert.match(query,/Innere Dorfstrasse 219/);
 assert.doesNotMatch(query,/Gemmipass-Wanderung/);
 assert.match(googleMapsSearchUrl(cable,catalog.cities),/Innere%20Dorfstrasse/);
 const other=matching('new_091')[0];
 assert.match(googleMapsPlaceQuery(other,catalog.cities),/Brülisau/);
 assert.doesNotMatch(googleMapsPlaceQuery(other,catalog.cities),/Europa-Rundweg/);
 const privateStay=candidates.find(i=>i.provider==='Airbnb');
 assert.ok(privateStay);
 assert.doesNotMatch(googleMapsPlaceQuery(privateStay,catalog.cities),new RegExp(privateStay.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
test('Four individually documented CC photos stay exact place matches, not generic lodging images',()=>{
 const photos=[
 ['paris','Piscine Joséphine Baker','Piscine_Josephine_Baker_Paris','Cahtls'],
 ['appenzell','Hoher Kasten Drehrestaurant & Europa-Rundweg','Br%C3%BClisau_Kastenbahn_HoherKasten','Ark001'],
 ['kandersteg','Allmenalp Luftseilbahn & Wasserfälle','Klettersteig_Allmenalp_Kandersteg','BenHur'],
 ['kandersteg','Sunnbüel & Gemmipass-Wanderung','Seilbahn_Kandersteg-Sunnb%C3%BCel','Martin Abegglen'],
 ];
 for(const [city,name,file,author] of photos){
  const item={id:'fake',kind:'activity',category:'activity',city,name};
  const photo=curatedPlacePhoto(item);
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(file),name);
  assert.ok(photo.credit.includes(author),name);
  assert.match(photo.credit,/CC BY-SA [234]\.0/);
  assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null);
 }
});
test('2027 published mountain timetable is differentiated from older ticket prices on cards and profiles',()=>{
 const trip=catalog.trips.find(t=>t.id==='swiss_lakes');
 const item=trip.items.find(x=>x.officialAccessV57?.sourceUrl===VERIFIED_PLACE_UPDATES_V57.new_101.sourceUrl);
 assert.ok(item);
 const ctx={trip,catalog,cities:catalog.cities,all:trip.items,date:'2027-09-08',
  people:[{id:1},{id:2},{id:3}],state:{placePhotos:{},favorites:[]},
  browseSavedIds:new Set(),compareIds:new Set(),activeSet:new Set()};
 const profile=placeProfileModel(item,ctx);
 assert.ok(profile.facts.some(([k])=>k==='Saisoninformation für 2027 veröffentlicht'));
 assert.ok(profile.facts.some(([k])=>k==='Historischer Betreiberpreis · nicht im Budget'));
 assert.match(browseOptionCard(item,ctx),/Saisonfahrplan 2027 veröffentlicht/);
 assert.equal(item.officialAccessV57.forTravelYearBookingConfirmed,false);
});
