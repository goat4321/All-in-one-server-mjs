import test from 'node:test';
import assert from 'node:assert/strict';
import {stopPositionQuality,routePositionQuality} from '../public/route-position-quality.mjs';
const p=[48.86,2.29];
test('Raw, provider and area markers need more verification than a public POI',()=>{
 assert.equal(stopPositionQuality({point:p}).needsReview,true);
 assert.equal(stopPositionQuality({point:p,locationReferenceV07:{precision:'provider_reported_unverified'}}).kind,'provider');
 const area=stopPositionQuality({point:p,geoEvidence:{url:'https://www.openstreetmap.org/way/10',isCentroid:true}});
 assert.equal(area.kind,'area');assert.equal(area.independent,true);assert.equal(area.needsReview,true);
 const source=stopPositionQuality({point:p,geoEvidence:{url:'https://www.openstreetmap.org/node/10'}});
 assert.equal(source.needsReview,false);
});
test('Counts do not confuse independently sourced positions with safe entrances',()=>{
 const x=routePositionQuality([
  {id:'1',point:p},
  {id:'2',point:p,geoEvidence:{url:'https://www.openstreetmap.org/way/10',isCentroid:true}},
  {id:'3',point:p,geoEvidence:{url:'https://www.openstreetmap.org/node/10'}},
  {id:'4',point:null}
 ]);
 assert.equal(x.reviewCount,3);assert.equal(x.areaCount,1);
 assert.equal(x.independentCount,2);assert.equal(x.missingCount,1);
});

test('Simple A-to-B planner states endpoint provenance without claiming an entrance',async()=>{
 const {explorerToolbar}=await import('../public/explorer-ui.mjs');
 const from={id:'hotel',name:'Testhotel',city:'barcelona',
   point:[41.388,2.186],locationReferenceV07:{precision:'provider_reported_unverified'}};
 const to={id:'museum',name:'Museum',city:'barcelona',point:[41.391,2.181],
   geoEvidence:{url:'https://www.openstreetmap.org/node/100'}};
 const route={walkOnly:true,mode:'Fußweg',minutes:9,metres:650,
   points:[from.point,to.point]};
 const ex={connection:{from,to,route},saved:new Set(),placed:[],unlocated:[],
   scope:'city',group:'all',routeMode:'walk',routeTime:'10:00',search:''};
 const html=explorerToolbar({explorer:ex,city:'barcelona',cities:{barcelona:{name:'Barcelona'}}});
 assert.match(html,/1 von 2 Zielpunkten/);
 assert.match(html,/nicht den Gebäudezugang/);
 assert.match(html,/Berechnete Fußweg-Geometrie geladen/);
 const safe=explorerToolbar({explorer:{...ex,connection:{
   ...ex.connection,from:{...from,locationReferenceV07:null,
    geoEvidence:{url:'https://www.openstreetmap.org/node/20'}}}},
   city:'barcelona',cities:{barcelona:{name:'Barcelona'}}});
 assert.doesNotMatch(safe,/1 von 2 Zielpunkten/);
 assert.match(safe,/tatsächliche Eingang/);
});
