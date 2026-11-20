import test from 'node:test';
import assert from 'node:assert/strict';
import {assessStay,sortStayOptions} from '../public/stay-analysis.mjs';
import {stayComparisonRows,stayComparisonBoard} from '../public/stay-compare-ui.mjs';
import * as filters from '../public/smart-filters.mjs';

const people=[{id:'p1'},{id:'p2'},{id:'p3'}];
const ctx={people,cities:{barcelona:{name:'Barcelona'}},state:{verifications:{},favorites:[]},hotelWalks:{},nightlyTargetEuro:35};
const stay={id:'a',kind:'lodging',city:'barcelona',name:'Testunterkunft',stayFrom:'2027-09-03',stayTo:'2027-09-06',
 price:{cents:28590,currency:'EUR',scope:'group',party:3,label:'Historischer Suchpreis'},
 quote:{observedOn:'2026-11-12'},room:'Drei Einzelbetten laut Quelle',cancellation:'Nicht erstattbarer Tarif laut Angebot',booked:false};

test('Stay assessment cannot reuse a three-person group quote for four travellers',()=>{
 const four=[...people,{id:'p4'}];
 assert.equal(assessStay(stay,four).totalEuroCents,null);
 assert.equal(assessStay(stay,four).personNightEuroCents,null);
 assert.equal(assessStay(stay,people).totalEuroCents,28590);
 assert.equal(assessStay({...stay,price:{...stay.price,scope:'person'}},four).totalEuroCents,null);
});
test('Stay comparison exposes exact group total, dates, room and booking state without selecting it',()=>{
 const original=JSON.stringify(stay);const r=stayComparisonRows([stay],ctx)[0];
 assert.equal(r.groupTotalCents,28590);assert.equal(r.personTotalCents,9530);
 assert.equal(r.from,'2027-09-03');assert.equal(r.to,'2027-09-06');
 assert.equal(r.room,'Drei Einzelbetten laut Quelle');assert.equal(r.booked,false);
 assert.equal(r.observedOn,'2026-11-12');assert.equal(r.cancellation,stay.cancellation);
 const html=stayComparisonBoard([stay],ctx);
 assert.match(html,/285,90/);assert.match(html,/95,30/);assert.match(html,/Nicht bestätigt gebucht/);
 assert.doesNotMatch(html,/data-photo-scope="city_backdrop"/,'Missing hotel photo is not replaced with an unrelated city photo in direct comparison');
 assert.equal(JSON.stringify(stay),original);
});
test('A false free-cancellation flag never claims that paid cancellation is impossible',()=>{
 const rows=stayComparisonRows([{...stay,cancellation:false},{...stay,id:'b',cancellation:null}],ctx);
 assert.match(rows[0].cancellation,/Keine kostenlose Stornierung/);
 assert.doesNotMatch(rows[0].cancellation,/Nicht stornierbar/);assert.match(rows[1].cancellation,/Offen/);
});
test('CHF stay totals preserve their currency and never become a comparable EUR nightly price',()=>{
 const item={...stay,price:{...stay.price,currency:'CHF',cents:18000}};
 const row=stayComparisonRows([item],ctx)[0];
 assert.equal(row.groupTotalCents,18000);assert.equal(row.groupCurrency,'CHF');
 assert.equal(row.personTotalCents,6000);assert.equal(row.price.personNightCents,null);
 assert.match(stayComparisonBoard([item],ctx),/180,00.*CHF/);
});
test('Native totals cannot bypass party protection for imported per-person EUR or CHF quotes',()=>{
 const context={...ctx,people:[...people,{id:'p4'}]};
 for(const currency of ['EUR','CHF']){
  const item={...stay,price:{cents:9000,currency,scope:'person',party:3}};
  const row=stayComparisonRows([item],context)[0];
  assert.equal(row.groupTotalCents,null);assert.equal(row.personTotalCents,null);
  assert.doesNotMatch(stayComparisonBoard([item],context),/360,00/);
 }
});
test('Comparison excludes removed entries, duplicates and wrong kinds before limiting to four',()=>{
 const valid=['a','b','c','d','e'].map(id=>({...stay,id,name:id}));
 const rows=stayComparisonRows([{...stay,id:'removed',removed:true},{...stay,kind:'activity'},valid[0],valid[0],...valid.slice(1)],ctx);
 assert.deepEqual(rows.map(x=>x.id),['a','b','c','d']);
});
const matches=(item,facets,context=ctx)=>filters.stayMatchesFacets?.(item,facets,context);
test('Lodging price sorting compares EUR references without treating CHF amounts as EUR',()=>{
 const chf={...stay,id:'chf',name:'A CHF',price:{...stay.price,cents:1000,currency:'CHF'}};
 const eur={...stay,id:'eur',name:'B EUR',price:{...stay.price,cents:10000}};
 const unknown={...stay,id:'unknown',name:'Z Offen',price:null};
 assert.deepEqual(sortStayOptions([chf,eur,unknown],people,{},{} ,'price').map(x=>x.id),['eur','chf','unknown']);
});
test('Combined stay criteria use AND and unknown prices cannot satisfy an EUR cap',()=>{
 const kitchen={...stay,kitchenMode:'shared',website:'https://www.booking.com/hotel/es/example.html'};
 assert.equal(matches(kitchen,{kitchen:'usable',source:'booking',maxNight:'32'}),true);
 assert.equal(matches(kitchen,{kitchen:'usable',source:'airbnb',maxNight:'32'}),false);
 assert.equal(matches({...kitchen,price:null},{maxNight:'32'}),false);
 assert.equal(matches({...kitchen,price:{...stay.price,currency:'CHF'}},{maxNight:'32'}),false);
 assert.equal(matches({...kitchen,price:{...stay.price,party:4}},{maxNight:'32'}),false);
 assert.equal(matches(kitchen,{maxNight:'31.76'}),false);
 assert.equal(matches(kitchen,{maxNight:'31.77'}),true);
});
test('Source facets parse actual provider hostnames and allow a separate operator reference',()=>{
 assert.equal(matches({...stay,website:'https://www.booking.com/hotel/es/a.html'},{source:'booking'}),true);
 assert.equal(matches({...stay,website:'https://booking.com.evil.example/a'},{source:'booking'}),false);
 assert.equal(matches({...stay,website:'https://evil.example/?booking.com'},{source:'booking'}),false);
 assert.equal(matches({...stay,website:'javascript:alert(1)'},{source:'missing'}),true);
 assert.equal(matches({...stay,website:'https://www.airbnb.de/rooms/123'},{source:'airbnb'}),true);
 assert.equal(matches({...stay,venueSourceV78:{sourceType:'operator',sourceUrl:'https://hostel.example/'}},{source:'operator'}),true);
 assert.equal(matches({...stay,venueSourceV78:{sourceType:'tourism',sourceUrl:'https://city.example/'}},{source:'operator'}),false);
});
test('Cancellation descriptions remain separate from a positive or excluded cancellation claim',()=>{
 assert.equal(matches({...stay,cancellation:true},{cancellation:'possible'}),true);
 assert.equal(matches({...stay,cancellation:false},{cancellation:'excluded'}),true);
 assert.equal(matches(stay,{cancellation:'described'}),true);
 assert.equal(matches(stay,{cancellation:'possible'}),false);
 assert.equal(matches({...stay,cancellation:'Tarifbedingungen offen'},{cancellation:'unknown'}),true);
 assert.equal(matches({...stay,cancellation:null},{cancellation:'described'}),false);
});
test('Beds and walks require current-group review and an actual measured walk',()=>{
 const context={...ctx,state:{...ctx.state,verifications:{a:{groupSize:3,checks:{beds:true}}}},hotelWalks:{a:{minutes:15}}};
 assert.equal(matches(stay,{beds:'reviewed',walk:'15'},context),true);
 assert.equal(matches(stay,{beds:'reviewed',walk:'15'},{...context,people:[...people,{id:'p4'}]}),false);
 assert.equal(matches(stay,{walk:'15'},{...context,hotelWalks:{a:{minutes:15.1}}}),false);
 assert.equal(matches(stay,{walk:'unknown'}),true);
 assert.equal(matches({...stay,kitchen:'Keine Küche'},{kitchen:'usable'}),false);
});

test('photo-led hotel list shows only object-backed images and never invents a zero price',async()=>{
 const {stayListRow,stayList}=await import('../public/stay-list-ui.mjs');
 const missing={...stay,id:'unknown',price:null,quote:null,website:'https://www.booking.com/searchresults.html?city=-1'};
 const html=stayListRow(missing,ctx);
 assert.match(html,/Kein belegtes Objektfoto/);
 assert.doesNotMatch(html,/place-specific-photo/);
 assert.match(html,/Preis pro Person\/Nacht offen/);
 assert.match(html,/Gruppenpreis offen/);
 assert.doesNotMatch(html,/0,00/);
 assert.match(html,/Angebotslink offen|Link nicht objektspezifisch/);
 assert.doesNotMatch(html,/Objekt auf Booking.com/);
 assert.match(html,/stay-list-preview/);
 assert.match(html,/data-action="details"/);
 assert.match(stayList([missing],ctx),/stay-list-rows/);
 assert.equal(JSON.stringify(missing),JSON.stringify({...stay,id:'unknown',price:null,quote:null,website:'https://www.booking.com/searchresults.html?city=-1'}));
});
test('exact property listing links require host and object path, not generic searches',async()=>{
 const {stayExactListingUrl,stayLaundryState,stayLocationState}=await import('../public/stay-evidence.mjs');
 assert.equal(stayExactListingUrl({...stay,website:'https://www.booking.com/searchresults.html'}),null);
 assert.equal(stayExactListingUrl({...stay,website:'https://booking.com.evil.example/hotel/es/hotel.html'}),null);
 assert.equal(stayExactListingUrl({...stay,website:'https://www.booking.com/hotel/es/verified-property.html'}),
   'https://www.booking.com/hotel/es/verified-property.html');
 assert.equal(stayExactListingUrl({...stay,website:'https://www.airbnb.de/rooms/12345?check_in=2027-09-03'}),
   'https://www.airbnb.de/rooms/12345?check_in=2027-09-03');
 assert.equal(stayExactListingUrl({...stay,website:'javascript:alert(1)'}),null);
 assert.equal(stayLaundryState(stay),'unknown');
 assert.equal(stayLaundryState({...stay,washer:true}),'yes');
 assert.equal(stayLaundryState({...stay,laundry:'Keine Waschmaschine'}),'no');
 assert.equal(stayLocationState({...stay,point:[41.4,2.1],geoEvidence:{isCentroid:true}}),'Gebietspunkt · kein Hauseingang');
 assert.equal(stayLocationState({...stay,point:null}),'Kein belegter Kartenpunkt');
});
test('washer, source quality, location accuracy, travel dates combine as strict AND filters',async()=>{
 const {stayMatchesFacets}=await import('../public/stay-facets.mjs');
 const item={...stay,website:'https://www.booking.com/hotel/es/verified-property.html',
   washingMachine:true,point:[41.4,2.1],kitchenMode:'shared'};
 const trip={stayByCity:{barcelona:{from:'2027-09-03',to:'2027-09-06'}}};
 const local={...ctx,trip};
 assert.equal(stayMatchesFacets(item,{laundry:'yes',location:'point',sourceQuality:'listing',
   date:'matching',kitchen:'usable'},local),true);
 assert.equal(stayMatchesFacets({...item,geoEvidence:{isCentroid:true}},{location:'point'},local),false);
 assert.equal(stayMatchesFacets({...item,geoEvidence:{isCentroid:true}},{location:'area'},local),true);
 assert.equal(stayMatchesFacets({...item,website:'https://www.booking.com/searchresults.html'},{sourceQuality:'listing'},local),false);
 assert.equal(stayMatchesFacets({...item,washingMachine:undefined},{laundry:'yes'},local),false);
 assert.equal(stayMatchesFacets({...item,stayTo:'2027-09-07'},{date:'matching'},local),false);
 assert.equal(stayMatchesFacets({...item,price:null},{maxNight:'35'},local),false);
});
test('comparison highlights decision differences and keeps extended sources opt-in',async()=>{
 const items=[
  {...stay,id:'aa',name:'A',washingMachine:true},
  {...stay,id:'bb',name:'B',washingMachine:false,cancellation:false},
 ];
 const html=stayComparisonBoard(items,ctx);
 assert.match(html,/id="unterkunftvergleich"/);
 assert.match(html,/stay-compare-keyfacts/);
 assert.match(html,/Waschmaschine/);
 assert.match(html,/stay-compare-more/);
 assert.match(html,/data-different="true"/);
 assert.match(html,/Nicht bestätigt gebucht/);
 assert.doesNotMatch(html,/0,00 € für/);
});
