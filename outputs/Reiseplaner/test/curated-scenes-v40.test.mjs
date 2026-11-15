import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedPlacePhoto,curatedPhotoCount} from '../public/curated-place-photos.mjs';
const expected=[
 ['barcelona','Montjuïc – Aussicht und Grünanlagen','Mirador_de_l%27Alcalde','Invivi'],
 ['paris','Seineufer zwischen Île de la Cité und Louvre','%C3%8Ele_de_la_Cit%C3%A9','APK'],
 ['nice','Port Lympia – Abendrunde','Port_Lympia_01','Miniwark']
];
test('Three new public scene photos match named concepts with traceable Commons credits',()=>{
 assert.ok(curatedPhotoCount>=52);
 for(const [city,name,url,artist] of expected){
  const match=curatedPlacePhoto({id:'survey-v19:abc',kind:'activity',city,name});
  assert.ok(match,name);
  assert.ok(match.sourceUrl.includes(url),name);
  assert.ok(match.credit.includes(artist),name);
  assert.match(match.credit,/CC BY-SA/);
 }
});
test('No venue image leaks to private lodging or unrelated parks',()=>{
 assert.equal(curatedPlacePhoto({id:'x',kind:'lodging',city:'nice',name:'Hotel Port Lympia'}),null);
 assert.equal(curatedPlacePhoto({id:'x',kind:'activity',city:'venice',name:'Port Lympia'}),null);
});
