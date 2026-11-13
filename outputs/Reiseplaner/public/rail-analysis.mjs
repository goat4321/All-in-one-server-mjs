import { interrail, localParts } from './model.mjs';

export function auditInterrailRoute(legs, pass, researchQueue = []) {
  const train = legs.filter(i => i.kind === 'transport' && i.mode === 'train'
    && i.passUse !== false && !i.duplicateOf && !i.removed);
  const result = interrail(train, pass);
  const byDay = new Map();
  for (const leg of train) {
    const departureDate = localParts(leg.start,leg.zone).date;
    if (!departureDate) continue;
    if (!byDay.has(departureDate)) byDay.set(departureDate,[]);
    byDay.get(departureDate).push(leg);
  }
  const dayRows=[...byDay].sort(([a],[b])=>a.localeCompare(b)).map(([day,dayLegs])=>({
    day,segments:dayLegs.length,
    names:dayLegs.map(l=>l.name),
    overnight:dayLegs.some(l=>localParts(l.end,l.endZone??l.zone).date!==day),
    assumed2027:dayLegs.some(l=>!l.timetable2027Confirmed),
  }));
  const problems=[];
  if (result.remaining<0) problems.push('Mehr Reisetage eingeplant als der Pass erlaubt.');
  if (train.length && !Number.isSafeInteger(pass.cost)) problems.push('Interrail-Passpreis für die Gruppe nicht nachgewiesen.');
  const missingSchedules=researchQueue.filter(t=>t.is_selected_from_original_plan && !t.timetable_2027_confirmed).length;
  const unknownTicketPrices=researchQueue.filter(t=>t.is_selected_from_original_plan && t.quote_cents==null).length;
  if(missingSchedules)problems.push(missingSchedules+' ursprüngliche Reiseabschnitte ohne bestätigten Fahrplan 2027.');
  if(unknownTicketPrices)problems.push(unknownTicketPrices+' ursprüngliche Reiseabschnitte ohne gültigen 2027-Preis.');
  for(const leg of train) {
    if (!leg.start || !leg.end) {problems.push('Fahrzeit für '+leg.name+' noch offen.');continue;}
    if(Date.parse(leg.end)<=Date.parse(leg.start))problems.push('Ankunft vor Abfahrt: '+leg.name);
  }
  const ordered=[...train].sort((a,b)=>String(a.start).localeCompare(String(b.start));
  const tightConnections=[];
  for(let i=1;i<ordered.length;i++) {
    const prev=ordered[i-1],next=ordered[i];
    const same=prev.toCity===next.city;
    const gap=(Date.parse(next.start)-Date.parse(prev.end))/60000;
    if(same&&Number.isFinite(gap)&&gap<35) tightConnections.push({
      previous:prev.name,next:next.name,gapMinutes:Math.round(gap),
      warning:gap<0?'Zeitliche Überschneidung':gap<15?'Sehr knapper Anschluss':'Anschlusszeit prüfen',
    });
  }
  return { trainCount:train.length, days:result.days, dayRows,
    allowedDays:pass.days, remainingDays:result.remaining,
    missingSchedules, unknownTicketPrices,
    issues:[...result.issues.map(i=>i.text),...problems],
    tightConnections, all2027Confirmed:missingSchedules===0 && unknownTicketPrices===0 && train.length>0,
    passPurchased:Boolean(pass.purchased) };
}

export function railAlternativeStatus(alternative) {
  const confirmed=alternative?.timetable_verified_for_2027 === true
    && alternative?.is_bookable_now === true && alternative?.depart_at && alternative?.arrive_at
    && alternative?.ticket_price_eur != null;
  return {
    confirmed:Boolean(confirmed),
    label:confirmed?'Betreiberangebot mit Zeit und Preis':'Nur Routenidee – kein buchbares Angebot',
    valueCents:confirmed?Math.round(alternative.ticket_price_eur * 100):null,
    referenceReservationCents:alternative?.indicative_seat_reservation_eur_per_person==null
      ?null:Math.round(alternative.indicative_seat_reservation_eur_per_person*100),
  };
}
