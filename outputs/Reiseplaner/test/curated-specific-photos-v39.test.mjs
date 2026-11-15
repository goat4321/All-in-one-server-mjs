import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedPlacePhoto,curatedPhotoCount} from '../public/curated-place-photos.mjs';
const photos=[
 ['paris','Quartier Latin – Streetfood und Abendrunde','Rue_de_ecole_Polytechnique_Quartier_Latin_Paris'],
 ['barcelona','Poblenou – Cafés und Straßen erkunden','Rambla_del_Poblenou'],
 ['nice','Port Lympia – Abendrunde','Port_Lympia_Nice'],
 ['venice','Murano/Burano – Inselrunde','Murano_Venice'],
 ['grindelwald','Grindelwald Dorf – Eigerblick und Snack','Grindelwald_village_seen_from_train']
];
test('Five exact public-area Wikimedia photos are attached with attribution',()=>{
 assert.ok(curatedPhotoCount>=49);
 for(const [city,name,expected] of photos){
  const source=curatedPlacePhoto({id:name,kind:'activity',city,name});
  assert.ok(source?.curated,name);
  assert.ok(source.sourceUrl.includes(expected),name);
  assert.match(source.credit,/CC(?: BY-SA|0)/,name);
  assert.match(source.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
 }
});
test('Private property, wrong-city, and arbitrary place images remain absent',()=>{
 assert.equal(curatedPlacePhoto({kind:'lodging',city:'nice',name:'Port Lympia Nice Hotel'}),null);
 assert.equal(curatedPlacePhoto({kind:'activity',city:'paris',name:'Port Lympia – Abendrunde'}),null);
 assert.equal(curatedPlacePhoto({kind:'activity',city:'grindelwald',name:'Bergrestaurant unbekannt'}),null);
});