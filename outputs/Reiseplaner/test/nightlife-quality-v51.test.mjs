import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {NIGHTLIFE_PROVIDER_REFERENCES_V51} from '../lib/nightlife-official-v51.mjs';
import {placeProfileModel} from '../public/place-profile.mjs';
import {placeInspectorHtml} from '../public/place-inspector.mjs';
import {dayPlanQuickBar} from '../public/day-plans-ui.mjs';
import {curatedPlacePhoto} from '../public/curated-place-photos.mjs';
const catalog=await loadCatalog();
const all=catalog.trips.flatMap(t=>t.items);
const find=(name,city)=>all.find(i=>i.name===name&&i.city===city&&i.nightlifeOfficialV51);
test('Official rules match four actual provider venues without claiming 2027 events',()=>{
 const v=catalog.research.nightlifeOfficialV51;
 assert.equal(NIGHTLIFE_PROVIDER_REFERENCES_V51.length,4);
 assert.deepEqual([...v.uniquePlaces].sort(),NIGHTLIFE_PROVIDER_REFERENCES_V51.map(x=>x.id).sort());
 assert.ok(v.matchedItems>=4);
 for(const item of all.filter(i=>i.nightlifeOfficialV51)){
  assert.equal(item.nightlifeOfficialV51.sep2027EventVerified,false);
  assert.equal(item.nightlifeOfficialV51.sep2027PriceVerified,false);
  assert.equal(item.nightlifeOfficialV51.photoReuseRightsVerified,false);
  assert.match(item.nightlifeOfficialV51.sourceUrl,/^https:\/\//);
 }
 const apolo=find('Sala Apolo','barcelona');
 assert.ok(apolo);
 assert.equal(apolo.nightlifeOfficialV51.publishedEntranceAge,18);
 assert.match(apolo.nightlifeOfficialV51.addressCaution,/113.*107/);
 assert.equal(apolo.researchV50.independentSourceVerified,false);
 const apoloPhoto=curatedPlacePhoto(apolo);
 assert.match(apoloPhoto.sourceUrl,/083_Sala_Apolo/);
 assert.match(apoloPhoto.credit,/Enric · CC BY-SA 4\.0/);
 assert.match(apoloPhoto.url,/Special:FilePath/);
 const razz=all.find(i=>i.nightlifeOfficialV51?.referenceId==='razzmatazz');
 assert.ok(razz);
 assert.equal(razz.nightlifeOfficialV51.publishedEntranceAge,18);
 const razzPhoto=curatedPlacePhoto(razz);
 assert.match(razzPhoto.sourceUrl,/0_-_Sala_Razzmatazz_-_facade/);
 assert.match(razzPhoto.credit,/Jordiferrer · CC BY-SA 3\.0/);
 const wayne=find("Wayne's Bar",'nice'),nolan=find("Ma Nolan's Irish Pub (Vieux Nice)",'nice');
 assert.ok(wayne&&nolan);
 assert.equal(wayne.nightlifeOfficialV51.publishedEntranceAge,null);
 assert.equal(nolan.nightlifeOfficialV51.publishedEntranceAge,null);
});
test('Nightlife detail has first-party rules and cites actual provider pages',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const item=trip.items.find(x=>x.name==='Sala Apolo');
 const ctx={people:[{id:'1'},{id:'2'},{id:'3'}],state:{placePhotos:{},votes:{}},
  catalog,cities:catalog.cities,trip,all:trip.items};
 const profile=placeProfileModel(item,ctx);
 assert.ok(profile.facts.some(([k,v])=>k==='Einlassalter laut Betreiber'&&v.includes('18')));
 assert.ok(profile.facts.some(([k,v])=>k==='Adresskonflikt beim Anbieter'&&v.includes('107')));
 assert.ok(profile.facts.some(([k,v])=>k==='Preis aus beigefügter Recherche'&&v.includes('nicht als 2027-Tarif')));
 const html=placeInspectorHtml(ctx,item);
 assert.match(html,/Offizielle Einlassbedingungen/);
 assert.match(html,/sala-apolo\.com\/en\/faqs/);
 assert.match(html,/2027/);
});
test('Day quick bar keeps real selected stops and researched suggestions separate',()=>{
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const day=trip.dayPlansV32.find(x=>x.slots.length);
 const ctx={trip,dayPlan:day,date:day.date,all:trip.items,active:[],activeSet:new Set(),
  state:{edits:{}},cities:catalog.cities};
 const html=dayPlanQuickBar(ctx);
 assert.match(html,/day-plan-quick-bar/);
 assert.match(html,/day-plan-draft-detail/);
 assert.match(html,/Tagesideen & Transfers ansehen/);
 assert.match(html,/data-action="day-plan-add"/);
 assert.match(html,/data-action="day-plan-adopt"/);
 assert.match(html,/Tagesideen übernehmen/);
 assert.match(html,/Ohne feste Uhrzeiten/);
});
