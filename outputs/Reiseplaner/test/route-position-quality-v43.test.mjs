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
