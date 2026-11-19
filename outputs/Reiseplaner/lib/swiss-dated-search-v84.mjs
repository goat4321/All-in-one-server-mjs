/** Evidence from a dated Booking.com search, not room inventory, checkouts or
 * booking authorization. Shared across the 3-person interrail_swiss variant only.
 */
const requireIt=(condition,desc)=>{if(!condition)throw Error('V84 '+desc);};
const hasHttps=value=>{try{
 const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.');
}catch{return false;}};
export function validateSwissDatedSearchV84(trips,rawAccommodations,archive){
 const m=archive?.meta,trip=trips.find(t=>t.id==='interrail_swiss');
 requireIt(m?.package==='research-v84-interrail-swiss-dated-search'
  &&m.observedOn==='2026-11-17'&&m.tripId==='interrail_swiss'
  &&m.provider==='Booking.com'&&m.quoteStatus==='provider_search_result_not_checkout'
  &&m.partySize===3&&m.roomsRequested===1&&m.nightCountByCity===2
  &&m.groupCurrency==='EUR'&&m.providerSearchEntries===20
  &&m.originalIdentityLinks===2&&m.railCorrections===4
  &&m.liveAvailabilityConfirmed===false&&m.checkedOut===false
  &&m.booked===false&&m.originalRouteModified===false
  &&m.independentSwissLakesModified===false
  &&trip?.travellers===3&&trip.from==='2027-09-01'&&trip.to==='2027-09-14'
  &&archive.quotes?.length===2&&archive.identityChecks?.length===2
  &&archive.railClarifications?.length===4,'invalid archive or target');
 const seen=new Set(),groups={},all=[];
 for(const g of archive.quotes){
  const expected=g.city==='kandersteg'?['2027-09-10','2027-09-12']
   :g.city==='appenzell'?['2027-09-12','2027-09-14']:null;
  requireIt(expected&&g.checkin===expected[0]&&g.checkout===expected[1]
   &&g.rows?.length===10&&!groups[g.city],'incorrect city/date/entry count');
  let previous=0;
  for(const row of g.rows){
   const u=new URL(row.bookingUrl);
   requireIt(Number.isInteger(row.propertyId)&&row.propertyId>0
    &&!seen.has(row.propertyId)
    &&typeof row.name==='string'&&row.name.length>=8
    &&Number.isSafeInteger(row.amountCents)&&row.amountCents>0
    &&row.amountCents>=previous
    &&typeof row.address==='string'&&row.address.length>=9
    &&row.priceType===m.quoteStatus
    &&row.allMandatoryFeesVerified===false
    &&row.bedLayoutForDisplayedRateVerified===false
    &&row.freeCancellationVerified===false
    &&row.lateArrivalVerified===false
    &&row.booked===false&&row.selected===false
    &&u.protocol==='https:'&&u.hostname==='www.booking.com'
    &&u.pathname.startsWith('/hotel/ch/')
    &&u.searchParams.get('checkin')===g.checkin
    &&u.searchParams.get('checkout')===g.checkout
    &&u.searchParams.get('group_adults')==='3'
    &&u.searchParams.get('no_rooms')==='1'
    &&u.searchParams.get('selected_currency')==='EUR',
    'unsafe dated search quote '+row?.name);
   previous=row.amountCents;seen.add(row.propertyId);all.push({...row,city:g.city});
  }
  const observedGroupTotal=g.rows.reduce((n,x)=>n+x.amountCents,0);
  requireIt(observedGroupTotal===m.providerSnapshotTotals?.[g.city],
    'unsafe dated search quote totals for '+g.city);
  groups[g.city]={checkin:g.checkin,checkout:g.checkout,minCents:g.rows[0].amountCents,
   minName:g.rows[0].name,options:g.rows.length};
 }
 requireIt(seen.size===20&&groups.kandersteg&&groups.appenzell,
 'incomplete 20 quote search results');
 requireIt(m.providerSnapshotTotalAllCents===
   m.providerSnapshotTotals.kandersteg+m.providerSnapshotTotals.appenzell,
   'unsafe dated search quote overall total');
 const refs=new Set();
 for(const check of archive.identityChecks){
  const prev=rawAccommodations.find(a=>a.id===check.originalId&&a.trip_id==='interrail_swiss');
  const match=all.find(a=>a.propertyId===check.propertyId);
  const alternate=all.find(a=>a.propertyId===check.notSameAsId);
  requireIt(prev&&match&&alternate
   &&prev.name===check.importedName&&match.name===check.correctName
   &&alternate.name===check.notSameAsName
   &&prev.travellers===3&&prev.booking_status==='unbooked'
   &&prev.live_quote_total===null
   &&match.address.startsWith(check.correctAddress)
   &&check.notSameAsId!==check.propertyId
   &&check.notSameAsName!==check.correctName
   &&typeof check.providerQa==='string'&&check.providerQa.length>80
   &&!refs.has(check.originalId),'unsafe identity reconciliation '+check.originalId);
  refs.add(check.originalId);
 }
 const railIds=new Set();
 for(const row of archive.railClarifications){
  requireIt(typeof row.id==='string'&&!railIds.has(row.id)
   &&['2027-09-10','2027-09-11','2027-09-13'].includes(row.date)
   &&typeof row.topic==='string'&&row.topic.length>35
   &&typeof row.summary==='string'&&row.summary.length>70
   &&typeof row.check==='string'&&row.check.length>50
   &&row.sourceUrls?.length>=2&&row.sourceUrls.every(hasHttps)
   &&row.priceCents===null
   &&typeof row.train2027Confirmed==='boolean',
    'unsafe railway claim '+row?.id);
  railIds.add(row.id);
 }
 requireIt(railIds.has('bls-re1-bergstrecke')
  &&railIds.has('ec-reservation')
  &&railIds.has('ab-waterauen')
  &&railIds.has('oeschinen-timeslot'),'missing critical railway evidence');
 const oldTotals=archive.identityChecks.map(c=>{
  const a=rawAccommodations.find(x=>x.id===c.originalId);
  return {originalId:c.originalId,originalEuroCents:Math.round(a.historic_or_plan_total*100),
   currentDatedSearchCents:all.find(x=>x.propertyId===c.propertyId).amountCents,
   quoteNotCheckout:true};
 });
 return {tripId:'interrail_swiss',sources:seen.size,party:3,rooms:1,
  cities:groups,oldOriginalComparisons:oldTotals,
  cheapestDisplayedCombinationCents:groups.kandersteg.minCents+groups.appenzell.minCents,
  optionalExtraFeesKnown:false,roomAssignmentVerified:false,checkoutsCompleted:0,
  booked:0,actualTrain2027SchedulesConfirmed:0,railClarifications:railIds.size,
  originalRouteChanged:false,otherVariantChanged:false};
}
