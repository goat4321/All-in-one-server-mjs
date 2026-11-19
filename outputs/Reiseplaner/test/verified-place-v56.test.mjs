import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {VERIFIED_PLACE_UPDATES_V56,applyVerifiedPlaceUpdateV56}
 from '../lib/verified-place-updates-v56.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {browseOptionCard} from '../public/browse-hub-v35.mjs';
import {mediaCoverage,mediaCoveragePanel} from '../public/media-coverage.mjs';
import {googleMapsSearchUrl,googleMapsLocationStatus} from '../public/google-maps.mjs';

const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const originals=Object.keys(VERIFIED_PLACE_UPDATES_V56);
const itemFor=id=>all.find(i=>i.officialAccessV56?.sourceUrl
 ===VERIFIED_PLACE_UPDATES_V56[id].sourceUrl);

test('Five actual original-upload sites get individual operator facts and address matches',()=>{
 assert.equal(originals.length,5);
 assert.equal(catalog.research.operatorAccessV56.updatedOriginalCandidates,5);
 for(const id of originals){
  const update=VERIFIED_PLACE_UPDATES_V56[id];
  const candidates=all.filter(i=>i.officialAccessV56?.sourceUrl===update.sourceUrl);
  assert.ok(candidates.length>=1,id);
  for(const item of candidates){
   assert.equal(item.officialAccessV56.forTravelYearConfirmed,false);
   assert.equal(item.price,null);
   assert.equal(item.booked,false);
   assert.equal(item.selected,false);
   assert.ok(item.source.includes('operator-v56:'+id));
   assert.equal(catalog.sources['operator-v56:'+id]?.url,update.sourceUrl);
   assert.equal(item.address,update.visitorAddress);
   assert.ok(googleMapsSearchUrl(item,catalog.cities).startsWith('https://www.google.com/maps/'));
   assert.match(googleMapsLocationStatus(item),/unabhängig|Koordinate|Adresse/);
   assert.match(item.detail,/Betreiberstand 2026-11-16/);
  }
 }
});
test('The update does not edit prices, markers, booking, or duplicate provenance',()=>{
 const o={id:'test',name:'Test',detail:'Aktivität',source:[],
  point:[45,4],price:null,selected:false,booked:false,
  geoEvidence:{confidence:'user_supplied_unverified'},researchV50:{uploadedId:'new_095'}};
 const same=applyVerifiedPlaceUpdateV56(o,'new_095');
 assert.equal(same,o);
 assert.deepEqual(o.point,[45,4]);
 assert.equal(o.price,null);
 assert.equal(o.selected,false);
 assert.equal(o.booked,false);
 assert.equal(o.geoEvidence.confidence,'user_supplied_unverified');
 assert.equal(o.source.length,1);
 applyVerifiedPlaceUpdateV56(o,'new_095');
 assert.equal(o.source.length,1);
});
test('Five real place photos use source-checked filename and credit; no private lodging fallthrough',()=>{
 const cases=[
 ['paris','Parc Montsouris','Parc_Montsouris_-_Paris_XIV',/Chabe01.*CC BY-SA 4\.0/],
 ['barcelona','Font Màgica de Montjuïc','Barcelona_Font_m',/Ad Meskens.*CC BY-SA 4\.0/],
 ['barcelona',"MNAC (Museu Nacional d'Art de Catalunya) – Dachterrasse & Vorplatz",'Museu_Nacional_d',/Vishwa\.ar.*CC BY-SA 3\.0/],
 ['sete','MIAM (Musée International des Arts Modestes)','MIAM.0',/Demeester.*CC BY-SA 3\.0/],
 ['grindelwald','Gletscherschlucht Grindelwald','GrindelwaldGletscherschlucht',/Herzi Pinki.*CC BY-SA 3\.0/],
 ];
 for(const [city,name,filePart,credit] of cases){
  const item={id:'source-photo-test',city,kind:'activity',category:'activity',name};
  const photo=curatedPlacePhoto(item);
  assert.ok(photo?.curated,name);
  assert.ok(photo.sourceUrl.includes(filePart),name);
  assert.match(photo.credit,credit,name);
  assert.ok(photo.url.includes('Special:FilePath'));
  assert.equal(curatedPlacePhoto({...item,kind:'lodging'}),null,name);
 }
});
test('Original options surface operator details in cards without confirming 2027 tickets',()=>{
 const trip=catalog.trips.find(x=>x.id==='interrail_classic');
 const ctx={trip,all:trip.items,catalog,cities:catalog.cities,city:'paris',
  people:[{id:'1'},{id:'2'},{id:'3'}],state:{placePhotos:{},favorites:[],votes:{}},
  activeSet:new Set(),browseSavedIds:new Set(),compareIds:new Set(),date:'2027-09-01'};
 const item=itemFor('new_010');
 const p=placeProfileModel(item,ctx);
 assert.ok(p.facts.some(([key])=>key==='Historischer Betreiberpreis · nicht im Budget'));
 assert.ok(p.facts.some(([key])=>key==='Betreiber-Öffnung · 2027 prüfen'));
 assert.match(browseOptionCard(item,ctx),/Betreiberhinweis \(2026\)/);
 assert.match(browseOptionCard(item,ctx),/12.25-J.hrige/);
 assert.equal(item.price,null);
});
test('Missing-photo list now covers every remaining entry, not only first 25',()=>{
 for(const trip of catalog.trips){
  const ctx={all:trip.items,trip,catalog,cities:catalog.cities,
   people:[{id:1},{id:2},{id:3}],state:{placePhotos:{}},activeSet:new Set()};
  const report=mediaCoverage(ctx),html=mediaCoveragePanel(ctx);
  const actions=(html.match(/data-action="photo-edit"/g)||[]).length;
  assert.equal(actions,report.lacking.length,trip.id);
  if(report.lacking.length>25)
   assert.match(html,/alle Städte durchsuchen/);
  assert.doesNotMatch(html,/ohne Quellenfoto \('foo'\)/);
 }
});
test('Private Airbnb accommodations do not get speculative public Commons photo suggestions',()=>{
 const trip=catalog.trips.find(x=>x.id==='interrail_classic');
 const privateStay=trip.items.find(i=>i.provider==='Airbnb');
 assert.ok(privateStay,'Private wishlist must exist');
 const ctx={all:[privateStay],cities:catalog.cities,people:[{id:1}],
  state:{placePhotos:{}},activeSet:new Set()};
 const html=mediaCoveragePanel(ctx);
 assert.match(html,/Privates Airbnb: kein öffentlich belegtes Objektfoto/);
 assert.doesNotMatch(html,/Commons-Bildsuche/);
 assert.match(html,/www\.google\.com\/maps\/search/);
});
