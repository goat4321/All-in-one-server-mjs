import test from 'node:test';
import assert from 'node:assert/strict';
import {markerProvenance} from '../public/poi-location-provenance.mjs';

const point=[48.862,2.28873];
test('Map marker confidence comes from source evidence, never coordinates alone',()=>{
 assert.equal(markerProvenance({point}).kind,'unverified');
 assert.equal(markerProvenance({point,geoEvidence:{url:'https://www.openstreetmap.org/node/1697202142'}}).kind,'sourced');
 assert.equal(markerProvenance({point,geoEvidence:{isCentroid:true,url:'https://www.openstreetmap.org/way/1'}}).kind,'area');
 assert.equal(markerProvenance({point,locationReferenceV07:{precision:'sourced_area_center'}}).kind,'area');
 assert.equal(markerProvenance({point,locationReferenceV07:{precision:'provider_reported_unverified'},geoEvidence:{url:'https://a.test'}}).kind,'provider');
 assert.equal(markerProvenance({point:null}).kind,'none');
});
test('Plain coordinate and source quality labels do not assert verified entrances',()=>{
 for(const x of [
  {point,geoEvidence:{url:'https://www.openstreetmap.org/node/1697202142'}},
  {point,locationReferenceV07:{precision:'sourced_area_center'}},
  {point,locationReferenceV07:{precision:'provider_reported_unverified'}}
 ])assert.doesNotMatch(markerProvenance(x).label,/exakt bestätigt|Eingang bestätigt/);
});
