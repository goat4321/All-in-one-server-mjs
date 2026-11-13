import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { initialState, validateState } from '../lib/store.mjs';
import { kitchenAccess } from '../public/stay-analysis.mjs';
import { lodgingPriceInsight, lodgingPriceMeter } from '../public/price-insights.mjs';
import { stayComparisonRows, stayComparisonBoard } from '../public/stay-compare-ui.mjs';
import { voteSummary, groupVoteBoard, voteSnippet } from '../public/group-vote.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(x=>x.id==='interrail_classic');
const people=initialState(trip).people;
const ctx={people,cities:catalog.cities,catalog,city:'barcelona',
  state:initialState(trip),all:trip.items,activeSet:new Set(),hotelWalks:{},nightlyTargetEuro:35};

test('Kitchen filter distinguishes documented cooking options from unknown and negated text',()=>{
 assert.equal(kitchenAccess({kitchen:'Küche offen'}),'unknown');
 assert.equal(kitchenAccess({kitchen:'Keine Küche'}),'unknown');
 assert.equal(kitchenAccess({kitchenMode:'shared'}),'usable');
 assert.equal(kitchenAccess({kitchenMode:'limited'}),'limited');
 assert.equal(kitchenAccess({kitchen:'Gemeinschaftsküche'}),'usable');
 assert.equal(kitchenAccess({kitchen:'Küchenausstattung noch nicht bestätigt'}),'unknown');
});

test('Daily accommodation budget uses actual stay nights and group size',()=>{
 const item={id:'test:hotel',kind:'lodging',name:'Testhostel',city:'barcelona',
   stayFrom:'2027-09-04',stayTo:'2027-09-06',price:{cents:21000,currency:'EUR',scope:'group'}};
 const insight=lodgingPriceInsight(item,3,35);
 assert.equal(insight.personNightCents,3500);
 assert.equal(insight.status,'within-budget');
 assert.equal(insight.percentageExact,100);
 assert.equal(insight.isSample,false);
 assert.match(lodgingPriceMeter(item,3,35),/data-price-state="within-budget"/);
 assert.equal(lodgingPriceInsight(item,3,30).status,'over-budget');
 assert.equal(lodgingPriceInsight({...item,price:{...item.price,currency:'CHF'}},3,35).status,'unavailable');
});

test('Airbnb examples never become 2027 checkout prices or budget expenses',()=>{
 const airbnb=trip.items.find(x=>x.id.startsWith('wishlist:airbnb:')&&x.quote?.sampleTotalCents!=null);
 assert.ok(airbnb);
 assert.equal(airbnb.price,null);
 const insight=lodgingPriceInsight(airbnb,3,35);
 assert.equal(insight.isSample,true);
 assert.match(insight.source,/kein Checkout/);
 const mismatched={...airbnb,quote:{...airbnb.quote,sampleAdults:2}};
 assert.equal(lodgingPriceInsight(mismatched,3,35).personNightCents,null);
 const noDates={...airbnb,quote:{...airbnb.quote,sampleFrom:null,sampleTo:null}};
 assert.equal(lodgingPriceInsight(noDates,3,35).personNightCents,null);
});

test('Visual hotel comparison retains evidence gaps and never fabricates ratings',()=>{
 const base={kind:'lodging',city:'barcelona',stayFrom:'2027-09-04',
   stayTo:'2027-09-06',price:{cents:15000,currency:'EUR',scope:'group'}};
 const a={...base,id:'one',name:'Hotel One'};
 const b={...base,id:'two',name:'Hotel Two',price:{...base.price,cents:18000}};
 const board=stayComparisonBoard([a,b],ctx);
 const rows=stayComparisonRows([a,b],ctx);
 assert.equal(rows.length,2);
 assert.match(board,/Unterkünfte im Direktvergleich/);
 assert.match(board,/Küche nicht belegt/);
 assert.match(board,/Keine belegte Bewertung/);
 assert.match(board,/Entfernen/);
 assert.match(board,/mehr als niedrigster vergleichbarer Referenzwert/);
 const risky={...b,stayFrom:'2027-09-05'};
 assert.match(stayComparisonBoard([a,risky],ctx),/Keine belastbare Preis-Rangfolge/);
});

test('User trip votes are separate from third-party hotel ratings',()=>{
 const item=trip.items.find(x=>x.kind==='activity');
 const votes={[item.id]:{p1:5,p2:3}};
 const summary=voteSummary(item,people,votes);
 assert.equal(summary.count,2);
 assert.equal(summary.complete,people.length===2);
 assert.equal(summary.average,4);
 assert.equal(summary.difference,2);
 const html=voteSnippet(item,{...ctx,state:{...ctx.state,votes}});
 assert.match(html,/subjektive Reisendenmeinung/);
 assert.match(html,/4,0\/5/);
 const board=groupVoteBoard({...ctx,state:{...ctx.state,votes}});
 assert.match(board,/Gemeinsam entscheiden/);
 assert.match(board,/Keine Konten/);
});

test('Persistence rejects invented ratings, hidden locations and unsourced photos',()=>{
 const id=trip.items[0].id;
 const validVotes={...initialState(trip),votes:{[id]:{p1:5}}};
 assert.doesNotThrow(()=>validateState(validVotes,trip,[]));
 assert.throws(()=>validateState({...validVotes,votes:{[id]:{fake:5}}},trip,[]),
   /Gruppenbewertung/);
 assert.throws(()=>validateState({...validVotes,votes:{[id]:{p1:6}}},trip,[]),
   /Gruppenbewertung/);
 assert.throws(()=>validateState({...validVotes,placePhotos:{[id]:{
   url:'http://example.com/photo.jpg',credit:'unknown',sourceUrl:'https://example.com'
 }}},trip,[]),/Bild/);
 assert.doesNotThrow(()=>validateState({...validVotes,placePhotos:{[id]:{
   url:'https://example.com/photo.jpg',credit:'Own photo / permission',sourceUrl:'https://example.com/source'
 }}},trip,[]));
});
