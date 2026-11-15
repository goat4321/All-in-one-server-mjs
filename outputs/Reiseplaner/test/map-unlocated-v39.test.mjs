import test from 'node:test';
import assert from 'node:assert/strict';
import {unlocatedKind,unlocatedOverview,mapUnlocatedReview} from '../public/map-unlocated-v39.mjs';
import {explorerUnlocatedCityClusters} from '../public/map-explorer.mjs';

const people=[
 {id:'hotel1',kind:'lodging',city:'nice',name:'Private Airbnb',provider:'Airbnb'},
 {id:'idea',kind:'activity',city:'nice',name:'Inselrunde',pointPrecision:'unverified_or_not_single_location'},
 {id:'address',kind:'lodging',city:'barcelona',name:'Hotel Stadt',address:'Avinguda 1, Barcelona'},
 {id:'unknown',kind:'activity',city:'barcelona',name:'Flexibler Spaziergang'},
];
const ctx={
 explorer:{placed:[{id:'mapped',point:[48.9,2.3]}],unlocated:people,
   showCityReferences:false},mapUnlocatedOpen:false,
 cities:{nice:{name:'Nizza',point:[43.7,7.2]},barcelona:{name:'Barcelona',point:[41.4,2.1]}}
};
test('Missing coordinate review explicitly distinguishes private, area, address and unknown',()=>{
 assert.deepEqual(people.map(x=>unlocatedKind(x).key),
   ['private','concept','address','unverified']);
 assert.equal(unlocatedOverview(ctx).total,4);
 assert.equal(unlocatedOverview(ctx).cities.size,2);
});
test('No city marker is rendered without an explicit opt-in',()=>{
 assert.deepEqual(explorerUnlocatedCityClusters(ctx.explorer,ctx.cities),[]);
 assert.equal(explorerUnlocatedCityClusters({...ctx.explorer,showCityReferences:true},ctx.cities).length,2);
});
test('Review lists all locations without inventing coordinates and routes',()=>{
 const html=mapUnlocatedReview(ctx);
 assert.match(html,/4 Orte ohne genaue Position/);
 assert.match(html,/Kein einzelner verifizierter Eingang/);
 assert.match(html,/Private Hausadresse/);
 assert.match(html,/data-action="hud-audit" data-value="location"/);
 assert.match(html,/data-action="explorer-references"/);
 assert.equal((html.match(/data-action="geocode-lookup"/g)??[]).length,1);
 assert.doesNotMatch(html,/data-action="geocode-apply"/);
 assert.doesNotMatch(html,/data-action="day-route-add"/);
});
test('Empty maps show no misleading pin review card',()=>{
 assert.equal(mapUnlocatedReview({...ctx,explorer:{...ctx.explorer,unlocated:[]}}),'');
});
