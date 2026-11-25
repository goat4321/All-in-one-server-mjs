import test from 'node:test';
import assert from 'node:assert/strict';
import {existingPinReviewUrl,publicPlaceReviewSearchUrl,publicPinReviewLinks,
 publicPinReviewSummary} from '../public/map-location-review.mjs';
import {mapUnverifiedPointsReview,mapUnverifiedPinRows} from '../public/map-unlocated-v39.mjs';

const hotel={id:'research:bcom_123',name:'Hotel am Kanal',city:'venice',kind:'lodging',
 point:[45.44512344,12.3378911],address:'Calle Example 12, Venice',
 provider:'Booking.com',
 locationReferenceV07:{precision:'provider_reported_unverified'},
 addressEvidenceV09:{sourceUrl:'https://www.example.org/public-location',
  publishedAddress:'Calle Example 12, Venice'}};

test('Existing unverified pins show a precise OSM marker WITHOUT treating it as evidence',()=>{
 assert.equal(existingPinReviewUrl(hotel),
  'https://www.openstreetmap.org/?mlat=45.445123&mlon=12.337891#map=17/45.445123/12.337891');
 assert.ok(existingPinReviewUrl(hotel,99).includes('#map=19/'));
 assert.ok(existingPinReviewUrl(hotel,-2).includes('#map=10/'));
 const links=publicPinReviewLinks(hotel,'Venedig');
 assert.deepEqual(links.map(x=>x.type),['saved','search','address']);
 assert.ok(decodeURIComponent(links[1].url).includes('Hotel am Kanal'));
 assert.ok(decodeURIComponent(links[1].url).includes('Calle Example 12'));
 assert.equal(links[2].url,hotel.addressEvidenceV09.sourceUrl);
 assert.match(publicPinReviewSummary(hotel).provenance,/kein unabhängiger Nachweis/);
 assert.match(publicPinReviewSummary(hotel).caveat,/weder Hausnummer noch Fußweg-Eingang/);
});
test('No private Airbnb link, no invalid GPS, no arbitrary source URL scheme',()=>{
 const secret={...hotel,id:'wishlist:airbnb:123',provider:'Airbnb'};
 assert.equal(existingPinReviewUrl(secret),null);
 assert.equal(existingPinReviewUrl({...secret,id:'other-id',provider:'AIRBNB'}),null);
 assert.equal(publicPlaceReviewSearchUrl(secret,'Venedig'),null);
 assert.deepEqual(publicPinReviewLinks(secret,'Venedig'),[]);
 assert.equal(publicPinReviewSummary(secret),null);
 assert.equal(existingPinReviewUrl({...hotel,point:[999,12.3]}),null);
 assert.equal(existingPinReviewUrl({...hotel,point:[0,0]}),null);
 assert.deepEqual(publicPinReviewLinks({...hotel,point:null}),[]);
 const injection={...hotel,addressEvidenceV09:{sourceUrl:'javascript:alert(1)'},
  geoEvidence:{url:'data:text/html,<script>alert(1)</script>'}};
 assert.deepEqual(publicPinReviewLinks(injection,'Venedig').map(x=>x.type),['saved','search']);
});
test('Evidence queue renders both real saved pin and a separate name lookup, never falsely promoting a point',()=>{
 const ctx={explorer:{placed:[hotel,{...hotel,id:'wishlist:airbnb:777',provider:'Airbnb'}]},
 cities:{venice:{name:'Venedig'}},mapEvidenceOpen:true};
 const queue=mapUnverifiedPinRows(ctx);
 assert.equal(queue.total,1);
 assert.equal(queue.providerCount,1);
 const html=mapUnverifiedPointsReview(ctx);
 assert.match(html,/Gespeicherter Pin: 45\.44512, 12\.33789/);
 assert.match(html,/Pin in OSM prüfen/);
 assert.match(html,/Objektname & Quellen vergleichen/);
 assert.match(html,/data-action="explorer-focus"/);
 assert.match(html,/Veröffentlichte Adresse prüfen/);
 assert.doesNotMatch(html,/data-action="geocode-apply"|wishlist:airbnb:777/);
});
