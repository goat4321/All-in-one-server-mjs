import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
import {loadCatalog} from '../lib/catalog.mjs';
import {publicGeocodeLookupAllowed,publicGeocodeLookupBlockedReason} from '../public/public-geocode-eligibility.mjs';
import {mapUnlocatedReview} from '../public/map-unlocated-v39.mjs';

const blank={id:'site',name:'Test',city:'sete',address:'42 Avenue Test, 34200 Sète',point:null,booked:false};
const conflicts=[
 {id:'research:bcom_12257788',city:'genoa'},
 {id:'research:bcom_13963152',city:'genoa'},
 {id:'research:bcom_17205591',city:'venice'},
 {id:'local:food-v03-019',city:'venice'}
];

test('Manual lookup is allowed for plain public addresses but not for disputed identifiers, postcodes or wrong POIs',()=>{
 assert.equal(publicGeocodeLookupAllowed(blank),true);
 for(const item of [
  {...blank,booked:true},{...blank,point:[43.4,3.6]},
  {...blank,provider:'AIRBNB'},{...blank,id:'wishlist:airbnb:xyz'},
  {...blank,address:''},{...blank,address:null},
  {...blank,addressCheckV49:{priority:'critical',identityConflict:true}},
  {...blank,addressCheckV49:{priority:'high'}},
  {...blank,addressEvidenceV09:{addressQualification:'listing_floor_or_number_ambiguity'}},
  {...blank,addressEvidenceV09:{addressQualification:'published_number_conflicting_postcode'}},
  {...blank,addressEvidenceV09:{addressQualification:'published_restaurant_address_distinct_from_similar_named_poi'}}
 ]){
  assert.equal(publicGeocodeLookupAllowed(item),false,JSON.stringify(item));
  assert.ok(publicGeocodeLookupBlockedReason(item)?.length>15);
 }
});

test('Public place cards and unresolved source panel cannot offer geocode action for a disputed listing',async()=>{
 const cat=await loadCatalog();
 const disputed=cat.trips.flatMap(t=>t.items.filter(x=>conflicts.some(c=>c.id===x.id&&c.city===x.city)));
 assert.ok(disputed.length>=4);
 for(const i of disputed){
  assert.equal(i.point,null);
  assert.equal(publicGeocodeLookupAllowed(i),false,i.id);
  const html=mapUnlocatedReview({
   explorer:{unlocated:[i],placed:[],showCityReferences:false},
   cities:cat.cities,mapUnlocatedOpen:true,mapUnlocatedFilter:'sourced-address'
  });
  assert.doesNotMatch(html,/data-action="geocode-lookup"/,i.id);
  assert.match(html,/Google Maps suchen|Adresse in Google Maps suchen/);
  assert.match(html,/Nächsten Quellencheck anzeigen/);
 }
});

test('Server rejects disputed-address geocoding even through direct API requests, without network calls or writes',async()=>{
 const catalog=await loadCatalog();
 let fetchCount=0;
 const {server,store}=await createApp({database:':memory:',upstream:true,
  fetcher:async()=>{fetchCount++;throw new Error('Blocked queries must not reach Nominatim')}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const {id,city} of conflicts){
   const trip=catalog.trips.find(t=>t.items.some(x=>x.id===id&&x.city===city));
   assert.ok(trip,id);
   const response=await fetch(base+'/api/geocode',{method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({variantId:trip.id,itemId:id})});
   assert.equal(response.status,409,id);
   assert.equal(store.current(trip.id).state.edits[id],undefined,id);
  }
  assert.equal(fetchCount,0);
 }finally{
  await new Promise(resolve=>server.close(resolve));
 }
});
