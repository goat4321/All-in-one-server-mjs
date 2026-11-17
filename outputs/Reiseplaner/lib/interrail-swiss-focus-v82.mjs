/** Operational evidence for the existing 14-day interrail_swiss route only.
 * No dates, stops, ticket prices, schedule, pass usage or bookings are edited.
 */
const isHttps=u=>{try{
 const x=new URL(u);return x.protocol==='https:'&&x.hostname.includes('.')&&!x.username&&!x.password;
}catch{return false}};
const uniq=xs=>new Set(xs).size===xs.length;
export function validateInterrailSwissFocusV82(trips,transport,archive){
 const meta=archive?.meta,trip=trips.find(t=>t.id==='interrail_swiss');
 if(meta?.package!=='research-v82-interrail-swiss-practical'
   ||meta.checkedOn!=='2026-11-17'||meta.tripId!=='interrail_swiss'
   ||meta.partySize!==3||meta.expectedPassTravelDays!==7
   ||meta.selectedBookings!==0||meta.train2027TimetableConfirmed!==false
   ||meta.comparativeRoutesValidatedFor2027!==false
   ||meta.otherTripsModified!==false
   ||!trip||trip.travellers!==3
   ||trip.from!=='2027-09-01'||trip.to!=='2027-09-14'
   ||!Array.isArray(archive.passDays)||archive.passDays.length!==7
   ||!Array.isArray(archive.days)||archive.days.length!==5
   ||!Array.isArray(archive.corridors)||archive.corridors.length!==4
   ||!Array.isArray(archive.priority)||archive.priority.length!==4
   ||JSON.stringify(trip.route)!==JSON.stringify(archive.route))
   throw Error('V82 invalid target trip');
 const expected=['2027-09-01','2027-09-03','2027-09-06','2027-09-08',
   '2027-09-10','2027-09-12','2027-09-14'];
 const original=transport.filter(row=>row.trip_id==='interrail_swiss'&&row.mode==='train');
 if(original.length!==7
   ||!uniq(archive.passDays.map(x=>x.date))
   ||!uniq(archive.passDays.map(x=>x.transportId))
   ||archive.passDays.some((x,i)=>x.date!==expected[i]
     ||!original.some(y=>y.id===x.transportId&&y.date_local===x.date
       &&y.interrail_travel_day_plan===true&&y.scheduled_2027_confirmed===false
       &&y.booking_status==='unbooked')))
  throw Error('V82 pass-day mismatch');
 if(archive.passDays.some(x=>!x.transportId.startsWith('interrail_swiss-'))
   ||archive.days.some((x,i)=>x.date!==['2027-09-10','2027-09-11','2027-09-12','2027-09-13','2027-09-14'][i]
     ||!['kandersteg','appenzell'].includes(x.city)
     ||!Array.isArray(x.mustCheck)||x.mustCheck.length<3))
  throw Error('V82 invalid Swiss finale days');
 const lists=[...archive.priority,...archive.corridors,...archive.days];
 if(lists.some(x=>
   !Array.isArray(x.sourceUrls)||!x.sourceUrls.length||x.sourceUrls.some(u=>!isHttps(u))
   ||!['string'].includes(typeof(x.title??x.label))
   ||typeof(x.action??x.note??x.plan)!=='string'))
  throw Error('V82 missing source links or descriptions');
 if(!trip.dayPlansV32||trip.dayPlansV32.length!==14
   ||archive.days.some(d=>!trip.dayPlansV32.some(p=>p.date===d.date&&p.city===d.city))
   ||archive.days.find(d=>d.date==='2027-09-11')?.city!=='kandersteg'
   ||archive.priority.find(p=>p.key==='local-pass')?.date!=='2027-09-13')
  throw Error('V82 target day plan mismatch');
 const actualPassDates=original.map(x=>x.date_local).sort();
 return {
   matchedTrip:'interrail_swiss',separateSwissLakesUnchanged:true,
   baseTripDays:trip.dayPlansV32.length,
   passDays:actualPassDates.length,passDates:actualPassDates,
   remainingUnusedPassDays:0,localWaterauenTicketOutsidePass:true,
   focusedSwissDays:archive.days.length,criticalPlanningIssues:archive.priority.length,
   railOptionsToCheck:archive.corridors.length,
   confirmed2027TrainTickets:0,modifiedBookings:0,modifiedTripRoute:false
 };
}
