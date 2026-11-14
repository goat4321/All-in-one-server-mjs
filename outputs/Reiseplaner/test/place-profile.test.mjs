import { curatedPlacePhoto, curatedPhotoCount } from '../public/curated-place-photos.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { placeProfileModel, placeProfileHtml, placeQuickFacts, placeImageHtml, placeThumbnailHtml, placePopupHtml, placeGalleryHtml } from '../public/place-profile.mjs';

const catalog = await loadCatalog();
const ctx={people:[{id:'p1'},{id:'p2'},{id:'p3'}],cities:catalog.cities,catalog,state:{}};
test('All variant-scoped catalog entries have safe generic detail profiles',()=>{
  let count=0;
  for (const trip of catalog.trips)for(const item of trip.items){
    const p=placeProfileModel(item,ctx);
    assert.ok(p && p.name && p.facts.length>=5,item.id);
    const html=placeProfileHtml(item,ctx);
    assert.match(html,/Quellen und Aktualität/);
    assert.match(html,/Google Maps/);
    assert.doesNotMatch(html,/undefined(?=<|&)/);
    count++;
  }
  assert.ok(count>=400,'Alle Katalogeinträge der Reisevarianten erfasst');
});
test('Airbnb preserves historical quote and approximate location',()=>{
  const airbnb=catalog.trips.flatMap(t=>t.items).find(i=>i.id.startsWith('wishlist:airbnb:')&&i.quote?.sampleTotalCents);
  const p=placeProfileModel(airbnb,ctx);
  assert.equal(p.isAirbnb,true);
  assert.equal(p.priceKnown,false);
  assert.match(p.priceLabel,/kein bestätigter Checkout/);
  assert.ok(p.facts.some(x=>/Privat/.test(x[1])));
  assert.match(placeQuickFacts(airbnb,ctx),/Nur ungefähr bekannt/);
});
test('Unverified price, rating and kitchen remain explicitly open',()=>{
 const demo={id:'test:unverified',kind:'lodging',city:'paris',name:'Demo & Private',price:null,point:null};
 const p=placeProfileModel(demo,ctx);
 assert.equal(p.priceKnown,false);
 assert.equal(p.priceLabel,'Preis offen');
 assert.equal(p.rating,'Keine belegte Bewertung');
 assert.ok(p.facts.some(x=>x[0]==='Küche'&&x[1]==='Nicht bestätigt'));
 assert.match(placeProfileHtml(demo,ctx),/Demo &amp; Private/);
 assert.doesNotMatch(placeProfileHtml(demo,ctx),/<h3>Demo & Private<\/h3>/);
});

test('Place photos require a credited explicit source and never appear for unknown images',()=>{
 const item=catalog.trips[0].items.find(i=>i.name&&i.id);
 assert.match(placeImageHtml(item,ctx),/Bildquelle offen/);
 const ctxWithPhoto={...ctx,state:{placePhotos:{[item.id]:{
   url:'https://upload.wikimedia.org/wikipedia/commons/example.jpg',
   sourceUrl:'https://commons.wikimedia.org/wiki/File:example.jpg',
   credit:'Example author · CC BY 4.0'
 }}}};
 const html=placeImageHtml(item,ctxWithPhoto);
 assert.match(placeThumbnailHtml(item,ctxWithPhoto),/data-licensed="true"/);
 assert.match(placeThumbnailHtml(item,ctx),/data-licensed="false"/);
 assert.match(html,/<img loading="lazy"/);
 assert.match(html,/Example author/);
 assert.match(html,/Bildquelle/);
 const popup=placePopupHtml(item,ctxWithPhoto);
 assert.match(popup,/data-action="details"/);
 assert.match(popup,/Google Maps/);
 assert.doesNotMatch(popup,/onclick=/);
});

test('Curated Commons images match only their named landmarks, not hotels or Airbnbs',()=>{
 assert.equal(curatedPhotoCount,25);
 const cases=[
  {name:'Sagrada Família',city:'barcelona'},
  {name:'Park Güell · Monumentalzone',city:'barcelona'},
  {name:'Eiffelturm zweite Etage',city:'paris'},
  {name:'Rialtobrücke',city:'venice'},
  {name:'Oeschinensee-Wanderung',city:'kandersteg'},
  {name:'Arc de Triomphe',city:'paris'},
  {name:'Parc de la Ciutadella',city:'barcelona'},
  {name:'Promenade des Anglais',city:'nice'},
  {name:'Porto Antico',city:'genoa'},
  {name:'Louvre (unter 26 EWR)',city:'paris'},
  {name:'Montmartre und Sacré-Cœur',city:'paris'},
  {name:'Barceloneta Strand',city:'barcelona'},
  {name:'Boccadasse Strand',city:'genoa'},
  {name:'Markusplatz und Gassen',city:'venice'},
  {name:'Vaporetto-Inselfahrt Burano',city:'venice'},
  {name:'Seealpsee Ufer',city:'seealpsee'},
  {name:'Seealpsee Wanderung ab Wasserauen',city:'appenzell'},
  {name:'Klöntalersee Rundweg',city:'kloental'},
  {name:'Bachalpsee-Wanderung',city:'bachalpsee'},
  {name:'Firstbahn und Bachalpsee',city:'grindelwald'},
  {name:'Colline du Château',city:'nice'},
 ];
 for(const record of cases){
  const asset=curatedPlacePhoto({id:'test',kind:'activity',...record});
  assert.ok(asset?.url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'),record.name);
  assert.match(asset?.credit ?? '',/CC BY-SA (3|4)\.0/);
  assert.ok(asset?.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
 }
 assert.equal(curatedPlacePhoto({id:'hotel',kind:'lodging',city:'paris',name:'Eiffel Tower Hotel'}),null);
  assert.equal(curatedPlacePhoto({id:'airbnb',kind:'lodging',provider:'Airbnb',city:'genoa',name:'Porto Antico Apartment'}),null);
  assert.equal(curatedPlacePhoto({id:'other',kind:'activity',city:'venice',name:'Porto Antico'}),null);
 assert.equal(curatedPlacePhoto({id:'food',kind:'activity',category:'food',city:'barcelona',name:'Park Güell Café'}),null);
});
