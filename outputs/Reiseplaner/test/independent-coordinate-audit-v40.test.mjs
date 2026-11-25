import test from 'node:test';
import assert from 'node:assert/strict';
import {hasIndependentPointEvidence} from '../public/poi-location-provenance.mjs';
import {entryCompleteness,entryCompletenessReport} from '../public/entry-completeness.mjs';
import {loadCatalog} from '../lib/catalog.mjs';

test('Existing coordinates, address links and legacy exactKnown flags are not independently sourced',()=>{
 const location={id:'raw',kind:'lodging',city:'barcelona',name:'Raw',point:[41.39,2.18]};
 for(const record of [
  location,
  {...location,locationReferenceV07:{exactKnown:true}},
  {...location,addressEvidenceV09:{sourceUrl:'https://hotel.example/address'}},
  {...location,locationReferenceV07:{exactKnown:true,precision:'provider_reported_unverified'},
    geoEvidence:{url:'https://provider.example/property/coordinates'}}
 ]){
  assert.equal(hasIndependentPointEvidence(record),false,JSON.stringify(record));
  const result=entryCompleteness(record,{people:[{}],state:{}});
  assert.equal(result.sourcePoint,false);
  assert.ok(result.gaps.some(g=>g.key==='geo_evidence'));
 }
});
test('Source-linked OSM viewpoint and real documented area centroid count, without claiming an entrance',()=>{
 for(const record of [
  {id:'poi',name:'Public lookout',point:[48.862,2.28873],kind:'activity',
   geoEvidence:{url:'https://www.openstreetmap.org/node/1697202142',isCentroid:false}},
  {id:'area',name:'Public area',point:[41.38,2.18],kind:'activity',
   geoEvidence:{url:'https://www.openstreetmap.org/way/12',isCentroid:true}}
 ]){
  assert.equal(hasIndependentPointEvidence(record),true);
  assert.equal(entryCompleteness(record,{people:[{}],state:{}}).sourcePoint,true);
 }
});
test('Independent-source count cannot exceed any-point count in every seed variant',async()=>{
 const catalog=await loadCatalog();
 for(const trip of catalog.trips){
  const ctx={catalog,trip,all:trip.items,people:Array.from({length:trip.travellers},()=>({})),state:{placePhotos:{}}};
  const {counters}=entryCompletenessReport(trip.items,ctx);
  assert.ok(counters.independentGeo<=counters.withPoint);
  assert.ok(counters.withPoint-counters.independentGeo>=0);
 }
});
