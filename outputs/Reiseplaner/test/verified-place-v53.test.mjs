import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {curatedPlacePhoto,curatedPhotoCount} from '../public/curated-place-photos.mjs';
import {VERIFIED_PLACE_UPDATES_V53,applyVerifiedPlaceUpdateV53}
 from '../lib/verified-place-updates-v53.mjs';
import {googleMapsSearchUrl} from '../public/google-maps.mjs';
import {browseOptionCard,foodBrowseCards} from '../public/browse-hub-v35.mjs';

const photoCases=[
 ['paris','Arènes de Lutèce','Ar%C3%A8nes_Lut%C3%A8ce'],
 ['paris','Musée Carnavalet','Carnavalet.jpg'],
 ['paris','Petit Palais','Petit_Palais_Paris_Facade'],
 ['barcelona','Tibidabo Vergnügungspark & Sky Walk','Amusement_Park_on_Tibidabo'],
 ['barcelona','Mercat de Santa Caterina','Mercat_de_Santa_Caterina'],
 ['sete','Cimetière Marin de Sète','Cimeti%C3%A8re_marin'],
 ['nice','Promenade du Paillon (Miroir d\'Eau)','Promenade_du_Paillon'],
 ['genoa','Cattedrale di San Lorenzo','Cattedrale_san_lorenzo_genova'],
 ['venice','Scala Contarini del Bovolo','Venezia_Scala_Contarini'],
 ['wasserauen','Ebenalp & Wildkirchli-Höhlen','Wildkirchli.JPG'],
];
test('Ten individually licensed image matches work, including a public market but no private properties',()=>{
 assert.ok(curatedPhotoCount>=64);
 for(const [city,name,source] of photoCases){
  const image=curatedPlacePhoto({kind:'activity',city,name});
  assert.ok(image?.curated,name);
  assert.ok(image.sourceUrl.includes(source),name);
  assert.match(image.credit,/CC BY|CC0|Public Domain/,name);
  assert.match(image.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
 }
 assert.equal(curatedPlacePhoto({kind:'lodging',city:'barcelona',name:'Mercat de Santa Caterina'}),null);
 assert.equal(curatedPlacePhoto({kind:'activity',city:'nice',name:'Petit Palais'}),null);
});
test('Six operator notes are separate from 2027 availability, prices, and original geo evidence',()=>{
 assert.equal(Object.keys(VERIFIED_PLACE_UPDATES_V53).length,6);
 const item={id:'test',name:'Tibidabo',point:[41.422,2.119],price:null,
  geoEvidence:{source:'Nutzerkoordinate',confidence:'user_supplied_unverified'},
  detail:'Aussicht über Barcelona'};
 applyVerifiedPlaceUpdateV53(item,'new_026');
 assert.match(item.detail,/Panoramabereich/);
 assert.equal(item.price,null);
 assert.equal(item.geoEvidence.confidence,'user_supplied_unverified');
 assert.equal(item.officialAccessV53.forTravelYearConfirmed,false);
 assert.ok(item.website.startsWith('https://tibidabo.cat/'));
 assert.equal(applyVerifiedPlaceUpdateV53(item,'not-a-match'),item);
});
const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_classic');
test('Published closure warnings and direct Google Maps links render in entry cards',()=>{
 const items=catalog.trips.flatMap(t=>t.items);
 for(const [id,record] of Object.entries(VERIFIED_PLACE_UPDATES_V53)){
  const item=items.find(i=>i.officialAccessV53?.sourceUrl===record.sourceUrl);
  assert.ok(item,'Operator fact '+id+' missing in catalog');
  assert.equal(item.officialAccessV53.forTravelYearConfirmed,false);
  assert.ok(googleMapsSearchUrl(item,catalog.cities)?.startsWith('https://www.google.com/maps/'));
 }
 const closed=items.find(i=>i.officialAccessV53?.status==='closed_reopening_unconfirmed');
 const food=trip.items.find(i=>i.name==='Mercat de Santa Caterina')
   ??trip.items.find(i=>i.category==='food'&&i.city==='barcelona');
 assert.ok(closed);assert.ok(food);
 const ctx={trip,cities:catalog.cities,catalog,city:'barcelona',
  people:[{id:'1'},{id:'2'},{id:'3'}],state:{favorites:[],votes:{},verifications:{},placePhotos:{}},
  activeSet:new Set(),compareIds:new Set(),browseSavedIds:new Set(),date:'2027-09-04'};
 const closedHtml=browseOptionCard(closed,ctx);
 assert.match(closedHtml,/Derzeit geschlossen/);
 assert.match(closedHtml,/www\.google\.com\/maps\/search/);
 const foodHtml=foodBrowseCards(ctx,[food]);
 assert.match(foodHtml,/www\.google\.com\/maps\/search/);
});
