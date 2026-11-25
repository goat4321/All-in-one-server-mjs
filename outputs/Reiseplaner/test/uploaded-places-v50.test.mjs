import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {nightlifeType} from '../public/nightlife-v50.mjs';
import {hasIndependentPointEvidence,markerProvenance} from '../public/poi-location-provenance.mjs';
import {ACTIVITY_GROUPS,activityRows,activityGroupMatches} from '../public/activity-directory.mjs';

const data=JSON.parse(await readFile(new URL('../data/research-v50/uploaded-interrail-2027-candidates.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const rows=catalog.trips.flatMap(t=>t.items.filter(x=>x.researchV50));
const stats=catalog.research.uploadedResearchV50.stats;

test('Complete raw 105-row source is archived, and every record is imported or deduplicated',()=>{
 assert.equal(data.meta.total_new_entries,105);
 assert.equal(data.new_entries.length,105);
 assert.equal(new Set(data.new_entries.map(x=>x.id)).size,105);
 assert.equal(stats.sourceCandidates,105);
 assert.equal(stats.omittedSourceIds.length,0);
 assert.equal(stats.uniqueCreated+stats.uniqueDuplicates,105);
 assert.ok(stats.createdAcrossVariants>=stats.uniqueCreated);
 assert.ok(stats.createdAcrossVariants>0);
 assert.equal(rows.length,stats.createdAcrossVariants);
 const unique=new Set(rows.map(x=>x.researchV50.uploadedId));
 assert.equal(unique.size,stats.uniqueCreated);
 assert.ok(rows.every(x=>!x.duplicateOf&&x.id.startsWith('uploaded:v50:')));
});

test('Uploaded coordinates remain visibly unverified, and 2027 price/booking never enters the budget',()=>{
 for(const item of rows){
  assert.equal(item.selected,false);
  assert.equal(item.booked,false);
  assert.equal(item.price,null);
  assert.equal(item.locationReferenceV07.exactKnown,false);
  assert.equal(item.pointSourceV50,'uploaded_coordinate_unverified');
  assert.equal(item.geoEvidence.confidence,'user_supplied_unverified');
  assert.equal(hasIndependentPointEvidence(item),false);
  assert.equal(markerProvenance(item).kind,'unverified');
  assert.equal(item.researchV50.independentSourceVerified,false);
  assert.equal(item.researchV50.availableSeptember2027,false);
  assert.equal(item.researchV50.entranceVerified,false);
  assert.ok(item.researchV50.referencePrice);
  assert.ok(item.source[0].startsWith('user-upload-v50:'));
 }
 const lodgings=rows.filter(x=>x.kind==='lodging');
 assert.ok(lodgings.length>0);
 assert.ok(lodgings.every(x=>x.stayFrom===null&&x.stayTo===null&&x.quote===null));
});

test('Club and nightlife subfilters are distinct and admit source evening bars',()=>{
 assert.ok(ACTIVITY_GROUPS.some(x=>x[0]==='clubs'));
 assert.ok(ACTIVITY_GROUPS.some(x=>x[0]==='bars'));
 const club=rows.find(x=>x.name==='Sala Apolo');
 assert.ok(club);
 assert.equal(nightlifeType(club),'club');
 assert.equal(activityGroupMatches(club,'night'),true);
 assert.equal(activityGroupMatches(club,'clubs'),true);
 assert.equal(activityGroupMatches(club,'bars'),false);
 assert.equal(club.nightlifeResearch.minAgeVerified,false);
 const nice=rows.find(x=>x.name==="Wayne's Bar");
 assert.ok(nice);
 assert.equal(activityGroupMatches(nice,'bars'),true);
 const trip=catalog.trips.find(t=>t.id==='interrail_classic');
 const ctx={all:trip.items,trip,cities:catalog.cities,browseScope:'trip',browseSearch:'',
  people:[{id:'a'},{id:'b'},{id:'c'}],state:{favorites:[],votes:{},placePhotos:{}},activeSet:new Set(),
  browseSavedIds:new Set(),activityCategory:'clubs',activityEvidenceFilter:'all'};
 const list=activityRows(ctx);
 assert.ok(list.filtered.some(x=>x.id===club.id));
 assert.ok(list.filtered.every(x=>nightlifeType(x)==='club'));
});

test('Relevant city candidates are attached only to itineraries visiting that city',()=>{
 for(const trip of catalog.trips){
  assert.ok(rows.filter(x=>x.trip===trip.id).every(x=>trip.route.includes(x.city)));
 }
 const swiss=catalog.trips.find(t=>t.id==='swiss_lakes');
 assert.ok(swiss.items.some(x=>x.researchV50?.uploadedId==='new_105'));
 const classic=catalog.trips.find(t=>t.id==='interrail_classic');
 assert.equal(classic.items.some(x=>x.researchV50?.uploadedId==='new_105'),false);
});
