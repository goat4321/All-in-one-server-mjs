import { readFile } from 'node:fs/promises';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsLocationStatus } from '../public/google-maps.mjs';

const base = new URL('../data/research-v19-survey-first/', import.meta.url);
const names = ['trips','destinations','survey_profiles','activities','accommodations',
  'transport','fare_rules','budget_scenarios','day_plans','food_evenings','sources'];
const readJson = async name => JSON.parse(await readFile(new URL(name+'.json',base),'utf8'));
const namespaced = id => 'survey-v19:'+id;
const safePoint = (latitude, longitude) => Number.isFinite(latitude) && Number.isFinite(longitude)
  && latitude>=-90 && latitude<=90 && longitude>=-180 && longitude<=180
  ? [latitude,longitude] : null;
const insist = (condition, reason) => { if(!condition) throw new Error('Survey-first V19: '+reason); };
const uniq = (rows,key) => {
  insist(Array.isArray(rows) && new Set(rows.map(x=>x.id)).size===rows.length,key+' contains duplicate IDs');
};
const sourceIds = row => (row.source_ids??[]).map(namespaced);
const insertLinks = (item,cities) => ({
  ...item,
  googleMapsUrl:googleMapsSearchUrl(item,cities),
  googleTransitUrl:googleMapsDirectionsUrl(null,item,cities,'transit'),
  mapLocationQuality:googleMapsLocationStatus(item),
});
const oldTripFor = (archive,trip) => archive.trips.trips.find(row=>
  String(row.tripsy_id)===String(trip.externalId));

function parseCsvSemicolon(raw) {
  const rows=[],cells=[];let value='',quoted=false;
  const addCell=()=>{cells.push(value);value='';};
  const addRow=()=>{addCell();if(cells.some(x=>x!==''))rows.push(cells.splice(0));else cells.length=0;};
  for(let i=0;i<raw.length;i++){
    const ch=raw[i];
    if(ch==='"'){
      if(quoted && raw[i+1]==='"'){value+='"';i++;}
      else quoted=!quoted;
    }else if(ch===';'&&!quoted)addCell();
    else if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&raw[i+1]==='\n')i++;
      addRow();
    }else value+=ch;
  }
  if(value||cells.length)addRow();
  const [head,...body]=rows;
  insist(head?.includes('id')&&head.includes('issue'),'quality_issues.csv invalid');
  return body.map(row=>Object.fromEntries(head.map((key,i)=>[key,row[i]??''])));
}

export async function loadSurveyFirstV19() {
  const values = await Promise.all(names.map(readJson));
  const archive = Object.fromEntries(names.map((name,i)=>[name,values[i]]));
  const issues = await readFile(new URL('quality_issues.csv',base),'utf8');
  archive.qualityIssues=parseCsvSemicolon(issues);
  insist(archive.trips.trips.length===4 && archive.survey_profiles.participants.length===3,
    'expected 4 trips / 3 survey respondents');
  for(const [key,collection,count] of [
    ['activities',archive.activities.items,57],['accommodations',archive.accommodations.items,35],
    ['transport',archive.transport.legs,29],['fare_rules',archive.fare_rules.fares,14],
    ['budget_scenarios',archive.budget_scenarios.scenarios,4],
    ['day_plans',archive.day_plans.plans,17],['food_evenings',archive.food_evenings.items,40],
    ['sources',archive.sources.sources,28],['qualityIssues',archive.qualityIssues,24]]){
    insist(collection.length===count,key+' count mismatch');
    uniq(collection,key);
  }
  const sourceSet = new Set(archive.sources.sources.map(x=>x.id));
  const destinationSet = new Set(archive.destinations.destinations.map(x=>x.id));
  insist(archive.activities.items.every(x=>destinationSet.has(x.destination_id)
    && x.selected===false && x.booking_status==='not_booked'
    && x.source_ids.every(id=>sourceSet.has(id))),'invalid activity source/selection');
  insist(archive.accommodations.items.every(x=>destinationSet.has(x.destination_id)
    && x.selected===false && x.booking_status==='not_booked'
    && x.source_ids.every(id=>sourceSet.has(id))
    && Number.isSafeInteger(x.price.total_minor)&&x.price.total_minor>0),
    'invalid lodging search quote');
  insist(archive.transport.legs.every(x=>x.calendar_confirmed_2027===false
    && x.departure_local===null && x.arrival_local===null
    && x.seat_booking_status==='unbooked'),'date-only transport cannot be booked');
  return archive;
}

function activityItem(entry,trip,cities) {
  const cost=entry.cost;
  // Free public space (0) and individual admission references only.
  // Never turn one-way Swiss lift prices or bundled tickets into a whole-visit price.
  const usable=cost.amount_minor!=null
    && (cost.kind==='free_public_space_or_walk_without_paid_services'
      || cost.kind==='admission_reference')
    && Number.isSafeInteger(cost.amount_minor);
  const price=usable
    ? {cents:cost.amount_minor,currency:cost.currency,scope:'person',
      label:'Recherche 13.11.2026 · 2027 nicht garantiert · '+cost.kind}
    : null;
  return insertLinks({
    id:namespaced(entry.id),trip:trip.id,city:entry.destination_id,kind:'activity',
    category:entry.tags.includes('food')?'food':'activity',name:entry.name,
    tags:entry.tags,zone:cities[entry.destination_id].timezone,
    selected:false,booked:false,booking:'ungebucht',payment:'open',
    start:null,end:null,point:null,price,
    origin:'Umfragebasiertes Zusatzpaket 13.11.2026',
    verification:'Vorschlag · Quelle prüfen · 2027 nicht bestätigt',
    detail:entry.note??'Ungebuchte Option; Datum, Einlass und Treffpunkt vor Übernahme prüfen.',
    duration:entry.duration_plan_minutes,
    openingHoursNote:entry.opening_hours_trip_date,
    source:sourceIds(entry),sourceDate:'2026-11-13',
    preference:trip.travellers===3 && entry.group_score_0_100!=null
      ? {score:entry.group_score_0_100,individual:entry.per_person_score_0_5,
        confidence:'individual_user_survey',topics:entry.tags} : null,
    surveyV19:{rawId:entry.id,tripApplicability:entry.trip_applicability,
      scoreScope:entry.score_scope,priceKind:cost.kind,price2027Verified:cost.valid_for_2027,
      rainSuitability:entry.rain_suitability,precisePointVerified:false},
    positionIssue:'Aktivitätskoordinate noch nicht unabhängig nachgewiesen; kein genauer Pin.',
  },cities);
}

function accommodationItem(entry,trip,cities) {
  const loc=entry.location;
  const point=loc?.precision==='booking_provider_property_coordinate'
    ? safePoint(loc.latitude,loc.longitude):null;
  return insertLinks({
    id:namespaced(entry.id),trip:trip.id,city:entry.destination_id,kind:'lodging',
    category:'lodging',name:entry.name,zone:cities[entry.destination_id].timezone,
    selected:false,booked:false,booking:'ungebucht',payment:'open',
    start:null,end:null,stayFrom:entry.checkin,stayTo:entry.checkout,
    point,address:null,
    positionIssue:point
      ? 'Booking-Anbieterkoordinate; Gebäude/Eingang und genaue Wegroute nicht unabhängig nachgewiesen.'
      : 'Keine unabhängige, belegte Unterkunftskoordinate vorhanden.',
    price:{cents:entry.price.total_minor,currency:entry.price.currency,
      scope:'group',party:entry.guests,
      label:'Booking-Suchpreis '+entry.price.quoted_on+' · kein Checkout/Endpreis'},
    kitchen:entry.kitchen==='shared'?'Gemeinschaftsküche':entry.kitchen==='private'
      ?'Private Küche':null,
    kitchenMode:['shared','private'].includes(entry.kitchen)?entry.kitchen:'unknown',
    room:null,fees:null,cancellation:null,website:entry.booking_url,
    origin:'Booking.com · Zusatzsuche 13.11.2026',
    verification:'Datumsbezogene Suche · Betten/Steuern/Storno ungeprüft',
    source:sourceIds(entry),sourceDate:entry.price.quoted_on,
    detail:'Angebot für '+entry.guests+' Erwachsene, '+entry.checkin+' bis '+entry.checkout
      +'. Zimmer-/Bettenkonfiguration, Gebühren, Storno und finale Verfügbarkeit nicht geprüft.',
    quote:{id:entry.id,observedOn:entry.price.quoted_on,
      nights:Math.round((Date.parse(entry.checkout)-Date.parse(entry.checkin))/86400000),
      roomConfirmed:entry.beds_for_group_verified===true,
      taxesConfirmed:entry.price.taxes_and_local_fees_complete===true,
      checkoutConfirmed:false,beds:null,location:loc.area??null,
      availability:entry.availability_status,sourceId:namespaced('booking')},
    surveyV19:{rawId:entry.id,tripContext:entry.trip_context,
      locationPrecision:loc.precision,booked:false,selected:false,
      searchQuoteNotFinal:true},
  },cities);
}

export function applySurveyFirstV19(trips,cities,archive) {
  const accepted={activities:0,accommodations:0};
  const rejected=[];
  const variants={};
  const tripIds=archive.trips.trips.map(x=>x.tripsy_id);
  insist(new Set(tripIds).size===4,'duplicate Tripsy IDs');
  for(const trip of trips) {
    const row=oldTripFor(archive,trip);
    insist(row,'no matching Tripsy ID for '+trip.id);
    insist(row.party_size===trip.travellers && row.start===trip.from && row.end===trip.to,
      'trip dates/guest count mismatch for '+trip.id);
    const checkCities=new Set(Object.keys(cities));
    const incoming=[];
    // Excursions outside the overnight route (e.g. Glarus/Grindelwald) are valid ideas.
    const allowed=entry=>checkCities.has(entry.destination_id);
    const relevantActs=archive.activities.items.filter(x=>x.trip_applicability.includes(row.id));
    const relevantHotels=archive.accommodations.items.filter(x=>x.trip_context.includes(row.id));
    for(const a of relevantActs){
      if(!allowed(a)){rejected.push({id:a.id,trip:trip.id,reason:'Zielort gehört nicht zu diesem Reisekatalog'});continue;}
      incoming.push(activityItem(a,trip,cities));accepted.activities++;
    }
    for(const a of relevantHotels){
      const stay=trip.stayByCity[a.destination_id];
      if(!allowed(a)||!stay||stay.from!==a.checkin||stay.to!==a.checkout||a.guests!==trip.travellers){
        rejected.push({id:a.id,trip:trip.id,reason:'Abweichende Reisedaten, Belegung oder nicht unterstützte Stadt'});continue;
      }
      incoming.push(accommodationItem(a,trip,cities));accepted.accommodations++;
    }
    const existingIds=new Set(trip.items.map(x=>x.id));
    insist(incoming.every(item=>!existingIds.has(item.id)),'import ID conflicts with prior catalogue');
    trip.items.push(...incoming);
    variants[trip.id]={
      archiveTripId:row.id,
      activities:incoming.filter(i=>i.kind==='activity').length,
      accommodations:incoming.filter(i=>i.kind==='lodging').length,
      transport:archive.transport.legs.filter(x=>x.trip_id===row.id),
      dayPlans:archive.day_plans.plans.filter(x=>x.trip_id===row.id),
      foodIdeas:archive.food_evenings.items.filter(x=>trip.route.includes(x.destination_id)),
      scenarios:archive.budget_scenarios.scenarios.filter(x=>x.trip_id===row.id),
    };
  }
  const sources=archive.sources.sources.map(s=>({
    id:namespaced(s.id),publisher:s.publisher,
    url:s.url??null,accessed_on:s.retrieved_on,
    validity:s.coverage??'source_unknown',is_live_availability:false,
  }));
  return {
    version:archive.activities.version,importedAt:'2026-11-14',
    counts:{uniqueActivities:archive.activities.items.length,
      uniqueAccommodations:archive.accommodations.items.length,
      transportPlans:archive.transport.legs.length,
      fareReferences:archive.fare_rules.fares.length,
      dayPlans:archive.day_plans.plans.length,
      foodIdeas:archive.food_evenings.items.length,
      sourceRecords:sources.length,qualityIssues:archive.qualityIssues.length,
      ...accepted},
    variants,fares:archive.fare_rules.fares,
    qualityIssues:archive.qualityIssues,
    rejected,sources,
    individualSurveyAppliesOnlyToThreePersonInterrail:true,
    allCandidatesUnselected:true,allTransportIsDateOnly:true,
  };
}
