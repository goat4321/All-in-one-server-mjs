import test from 'node:test';
import assert from 'node:assert/strict';
import {unlocatedOverview,mapUnlocatedReview,openStreetMapReviewUrl,mapUnverifiedPinRows,mapUnverifiedPointsReview} from '../public/map-unlocated-v39.mjs';
const kinds=['address','unverified','concept','private'];
const items=Array.from({length:42},(_,i)=>({
 id:'place-'+i,city:i%3===0?'barcelona':i%3===1?'nice':'genoa',
 name:'Open place '+i,kind:i%4===3?'lodging':'activity',
 ...(i%4===0?{address:'Public Street '+i}:{}),
 ...(i%4===2?{pointPrecision:'unverified_or_not_single_location'}:{}),
 ...(i%4===3?{provider:'Airbnb'}:{})
}));
const ctx={explorer:{placed:[{id:'mapped',point:[41.4,2.2]}],unlocated:items,showCityReferences:false},
 cities:{barcelona:{name:'Barcelona'},nice:{name:'Nizza'},genoa:{name:'Genua'}},
 mapUnlocatedOpen:true,mapUnlocatedLimit:12,mapUnlocatedFilter:'all'};
test('Large unlocated work queue is paginated and category-filterable',()=>{
 const overview=unlocatedOverview(ctx);
 assert.equal(overview.total,42);
 assert.equal(overview.preview.length,12);
 assert.equal(overview.filteredTotal,42);
 assert.equal(overview.hasMore,true);
 assert.equal(new Set(overview.preview.map(x=>x.city)).size,3,'Preview distributes across cities');
 const full=unlocatedOverview({...ctx,mapUnlocatedLimit:48});
 assert.equal(full.preview.length,42);
 assert.equal(full.hasMore,false);
 assert.equal(new Set(full.preview.map(x=>x.item.id)).size,42);
 for(const key of kinds){
  const filtered=unlocatedOverview({...ctx,mapUnlocatedFilter:key,mapUnlocatedLimit:100});
  assert.ok(filtered.filteredTotal>0);
  assert.ok(filtered.preview.every(x=>x.reason.key===key));
 }
});
test('Search matches normalized names and stays local to missing items',()=>{
 const x=unlocatedOverview({...ctx,mapUnlocatedSearch:'OPÉN PLACE 37'});
 assert.equal(x.filteredTotal,1);
 assert.equal(x.preview[0].item.id,'place-37');
 const y=unlocatedOverview({...ctx,mapUnlocatedSearch:'not-present'});
 assert.equal(y.filteredTotal,0);
});
test('Review makes privacy and source confidence explicit with usable controls',()=>{
 const html=mapUnlocatedReview(ctx);
 assert.match(html,/Keine geschätzten Einzelpins/);
 assert.match(html,/1 mit Kartenposition · davon 0 mit Quellenbeleg/);
 assert.match(html,/data-action="map-unlocated-filter"/);
 assert.match(html,/data-action="map-unlocated-more"/);
 assert.match(html,/data-action="map-unlocated-search"/);
 assert.match(html,/Private Hausadresse/);
 assert.match(html,/data-action="hud-audit"/);
 assert.doesNotMatch(html,/data-action="day-route-add"/);
});

test('External OSM review is explicit and never built for private short lets or vague concepts',()=>{
 const pub=items[0],unverified=items[1],concept=items[2],privateStay=items[3];
 const addressUrl=openStreetMapReviewUrl(pub,'Barcelona');
 assert.ok(addressUrl?.startsWith('https://www.openstreetmap.org/search?query='));
 assert.ok(decodeURIComponent(addressUrl).includes('Public Street 0'));
 assert.ok(openStreetMapReviewUrl(unverified,'Nizza'));
 assert.equal(openStreetMapReviewUrl(concept,'Genua'),null);
 assert.equal(openStreetMapReviewUrl(privateStay,'Barcelona'),null);
 const html=mapUnlocatedReview(ctx);
 assert.match(html,/In OpenStreetMap suchen/);
 assert.doesNotMatch(html,/data-action="geocode-apply"/);
});


test('Existing unverified map pins form a distinct evidence queue without synthetic arrival or Airbnb',()=>{
 const placed=[
  {id:'src',kind:'activity',city:'nice',name:'OSM public point',
    point:[43.69,7.28],geoEvidence:{url:'https://www.openstreetmap.org/node/200'}},
  {id:'raw',kind:'activity',city:'nice',name:'No source coordinate',point:[43.70,7.28]},
  {id:'provider',kind:'lodging',city:'barcelona',name:'Provider hotel',
    point:[41.39,2.17],locationReferenceV07:{precision:'provider_reported_unverified'}},
  {id:'arrival:200',explorerParent:'200',kind:'transport',city:'nice',name:'Synthetic train arrival',point:[43.70,7.27]},
  {id:'wishlist:airbnb:200',provider:'Airbnb',kind:'lodging',city:'nice',
    name:'Private property',point:[43.69,7.25]}
 ];
 const c={...ctx,explorer:{placed,unlocated:items,showCityReferences:false},
  mapEvidenceOpen:true,mapEvidenceType:'all',mapEvidenceLimit:10};
 const summary=mapUnverifiedPinRows(c);
 assert.equal(summary.total,2);
 assert.equal(summary.providerCount,1);
 assert.equal(mapUnverifiedPinRows({...c,mapEvidenceType:'provider'}).filteredTotal,1);
 assert.equal(mapUnverifiedPinRows({...c,mapEvidenceType:'unverified'}).filteredTotal,1);
 const html=mapUnverifiedPointsReview(c);
 assert.match(html,/Kartenpositionen ohne unabhängigen Koordinatenbeleg/);
 assert.match(html,/data-action="hud-audit" data-value="geo_evidence"/);
 assert.match(html,/Provider hotel/);
 assert.doesNotMatch(html,/Private property|Synthetic train arrival|OSM public point/);
 assert.doesNotMatch(html,/day-route-add|geocode-apply/);
});
