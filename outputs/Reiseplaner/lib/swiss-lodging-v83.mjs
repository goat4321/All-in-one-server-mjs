/** Source-scoped booking research. Neither the two original Tripsy lodging
 * candidates nor the independent 7-day swiss_lakes trip may be changed.
 * All CHF prices are operator reference values, not 2027 checkout prices.
 */
const https=u=>{try{
 const x=new URL(u);return x.protocol==='https:'&&x.hostname.includes('.')&&!x.username&&!x.password;
}catch{return false;}};
const allowed=new Set(['kandersteg','appenzell']);
const safe=x=>typeof x==='string'&&x.length>=12&&x.length<=900&&!/[<>]/.test(x);
const assert=(v,msg)=>{if(!v)throw Error('V83 '+msg);};
export function validateSwissLodgingV83(trips,rawStays,archive){
 const m=archive?.meta,trip=trips.find(x=>x.id==='interrail_swiss');
 assert(m?.package==='research-v83-interrail-swiss-lodging'
   &&m.observedOn==='2026-11-17'&&m.tripId==='interrail_swiss'
   &&m.partySize===3&&m.count===8&&m.originals===2&&m.checks===5
   &&m.bookingsCreated===0&&m.availability2027Checked===false
   &&m.passTravelDatesChanged===false&&m.notSwissLakes===true
   &&Array.isArray(archive.originals)&&archive.originals.length===2
   &&Array.isArray(archive.candidates)&&archive.candidates.length===8
   &&Array.isArray(archive.checks)&&archive.checks.length===5
   &&trip?.travellers===3&&trip.from==='2027-09-01'&&trip.to==='2027-09-14',
   'invalid archive or target trip');
 const seen=new Set(),srcs=new Set();
 for(const original of archive.originals){
  const x=rawStays.find(v=>v.id===original.id);
  assert(x?.trip_id==='interrail_swiss'&&x.destination_id===original.city
    &&allowed.has(original.city)&&x.name===original.name
    &&x.check_in_date===original.from&&x.check_out_date===original.to
    &&x.travellers===3&&x.booking_status==='unbooked'
    &&x.is_selected===false&&x.live_quote_total===null
    &&x.historic_or_plan_total===original.historicEuroTotal
    &&original.currency==='EUR'&&original.guests===3
    &&safe(original.identityWarning),'original Tripsy lodging mismatch '+original.id);
 }
 const byCity={kandersteg:0,appenzell:0},byRoomType={};
 for(const c of archive.candidates){
  assert(allowed.has(c.city)&&!seen.has(c.id)
   &&c.sourceUrl&&https(c.sourceUrl)&&Array.isArray(c.secondaryUrls)
   &&c.secondaryUrls.every(https)
   &&['hotel','hostel','guesthouse','apartment'].includes(c.category)
   &&['name','bedConfiguration','bathroom','kitchen','checkin','price',
     'practical','risk','mapsQuery'].every(k=>safe(c[k]))
   &&c.checkedOn===m.observedOn
   &&c.confirmed2027Rate===false&&c.confirmed2027Availability===false
   &&c.booked===false&&c.roomPhotoLicenseVerified===false
   &&c.checkoutFeesFullyVerified===false
   &&c.exactMapPinVerified===false&&c.threeGuestsVerifiedForRoomType===true,
  'unsafe 2027 room candidate '+c.id);
  seen.add(c.id);srcs.add(c.sourceUrl);byCity[c.city]++;
  byRoomType[c.category]=(byRoomType[c.category]??0)+1;
 }
 assert(byCity.kandersteg===4&&byCity.appenzell===4,'city comparison count');
 assert(archive.candidates.find(c=>c.id==='kisc-new-chalet')?.risk.includes('GENAU der 10.09.2027')
  &&archive.candidates.find(c=>c.id==='altemetzg-hostel8')?.price.includes('CHF 165')
  &&archive.candidates.find(c=>c.id==='altemetzg-hostel8')?.price.includes('CHF 170')
  &&archive.candidates.find(c=>c.id==='alpina-triple')?.practical.includes('NICHT zweifelsfrei'),
  'missing key identity / price / date barriers');
 for(const check of archive.checks){
  assert(safe(check.title)&&safe(check.text)&&allowed.has(check.city)
    &&/2027-09-(10|12)/.test(check.day)
    &&['high','medium'].includes(check.severity)
    &&Array.isArray(check.sourceUrls)&&check.sourceUrls.length
    &&check.sourceUrls.every(https),'unsafe lodging check '+check.id);
 }
 const nightCount=archive.originals.map(x=>({id:x.id,city:x.city,nights:2,
  historicEuroTotal:x.historicEuroTotal,liveEuroTotal:null,
  threeGuestCheckoutConfirmed:false}));
 return {tripId:trip.id,partySize:3,stayCities:byCity,sourceCandidates:seen.size,
   categories:byRoomType,publishedReferenceSources:srcs.size,
   historicalOriginals:nightCount,highRiskChecks:archive.checks.filter(x=>x.severity==='high').length,
   publishedPricesAre2027Quotes:false,checkoutConfirmed:false,bookingsCreated:0,
   originalTripsChanged:false,swissLakesChanged:false,roomPhotosImported:0};
}
