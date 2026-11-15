import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedPlacePhoto,curatedCityBackdrop} from '../public/curated-place-photos.mjs';

const exact=[
 ['barcelona','Bogatell Beach – Strand und lockerer Sport','Platja_del_Bogatell'],
 ['barcelona','Bunkers del Carmel / Turó de la Rovira – Aussicht','Bunkers_del_Carmel'],
 ['nice','Èze – Dorf und Aussicht als Halbtag','EZE_Village'],
 ['nice','Villefranche-sur-Mer – Plage des Marinières','Plage_des_Marini'],
 ['genoa','Spianata Castelletto – Hafenpanorama','Panorama_da_Spianata'],
 ['venice','Lido di Venezia – Strandpause','Spiaggia_del_Lido'],
 ['grindelwald','First – Cliff Walk und Panorama','First_Cliff_Walk']
];
test('New Commons photos bind to seven exact named landmarks, not city-only context',()=>{
 for(const [city,name,path] of exact){
  const item={id:'test:'+city+':'+name,kind:'activity',city,name};
  const photo=curatedPlacePhoto(item);
  assert.ok(photo?.curated, name);
  assert.match(photo.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  assert.ok(photo.sourceUrl.includes(path),name);
  assert.ok(photo.credit.includes('CC '),name);
  assert.ok(photo.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
 }
});
test('Same city does not imply the same site photo for generic or private entries',()=>{
 assert.equal(curatedPlacePhoto({id:'x',kind:'activity',city:'nice',name:'Unbekanntes Café'}),null);
 assert.equal(curatedPlacePhoto({id:'x',kind:'lodging',city:'genoa',name:'Spianata Castelletto Hotel'}),null);
 assert.ok(curatedCityBackdrop({id:'x',city:'nice'})?.contextualOnly);
});
