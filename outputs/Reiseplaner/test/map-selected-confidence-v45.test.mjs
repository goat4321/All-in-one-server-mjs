import test from 'node:test';
import assert from 'node:assert/strict';
import {mapSelectionPreview} from '../public/views.mjs';

const ctx=(item)=>({
 explorer:{saved:new Set()},detail:item,people:[{id:'p'}],
 cities:{sete:{name:'Sète'}},catalog:{sources:{}},state:{}
});
test('On-map selected place uses source confidence rather than a generic validated-pin claim',()=>{
 const item={id:'map:a',name:'Le Pouffre',kind:'lodging',city:'sete',
   point:[43.398442,3.694451],geoEvidence:{
     url:'https://data.geopf.fr/geocodage/search?q=85',isCentroid:true}};
 const html=mapSelectionPreview(ctx(item));
 assert.match(html,/Gebäude-\/Gebietsreferenz/);
 assert.doesNotMatch(html,/Kartenpunkt vorhanden/);
 assert.doesNotMatch(html,/€\?/);
 assert.match(html,/Preis pro Nacht offen/);
 const unsourced=mapSelectionPreview(ctx({...item,id:'map:b',geoEvidence:null}));
 assert.match(unsourced,/Position prüfen/);
 const missing=mapSelectionPreview(ctx({...item,id:'map:c',point:null}));
 assert.match(missing,/Standort offen/);
});
