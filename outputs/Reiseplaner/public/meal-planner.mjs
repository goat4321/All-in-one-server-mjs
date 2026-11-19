import {mealDate,mealEstimate,localParts,utcFromLocal} from './model.mjs';
import {explorerCategory} from './map-explorer.mjs';
export const mealSlotLabels={breakfast:'Frühstück',lunch:'Mittagessen',dinner:'Abendessen'};
export const mealSlotTimes={breakfast:'08:00',lunch:'12:30',dinner:'19:00'};
export const plansForSlot=(plans,slot)=>plans.filter(p=>(p.slots??[p.slot]).includes(slot));

export function mealAccommodation(ctx,slot,time=mealSlotTimes[slot],duration=0){
 const date=ctx.date,city=ctx.city;
 const hotel=(ctx.active??[]).find(i=>i.kind==='lodging'&&i.city===city&&!i.removed
  &&(slot==='breakfast'?i.stayFrom<date&&date<=i.stayTo:i.stayFrom<=date&&date<i.stayTo))??null;
 if(!hotel)return {hotel:null,kitchenReady:false,notice:slot==='breakfast'
  ?'Unterkunft der vorherigen Nacht offen. Eine Ankunft am selben Tag belegt keinen Frühstücks- oder Küchenzugang.'
  :'Unterkunft für diese Nacht offen. Küchenzugang und Ausstattung prüfen.'};
 const arrival=localParts(hotel.start,hotel.zone),departure=localParts(hotel.end,hotel.endZone??hotel.zone);
 const beforeArrival=hotel.stayFrom===date&&(!arrival.time||!time||arrival.time>time);
 const checkoutDay=hotel.stayTo===date;
 const checkoutUnresolved=checkoutDay&&(!departure.time||!time);
 const minutes=clock=>Number(clock.slice(0,2))*60+Number(clock.slice(3,5));
 const afterDeparture=checkoutDay&&departure.time&&time
  &&(minutes(time)>=minutes(departure.time)||minutes(time)+duration>minutes(departure.time));
 const describedKitchen=['shared','private'].includes(hotel.kitchenMode);
 const notice=beforeArrival?'Check-in-Zeit oder Zugang vor der Mahlzeit ungeklärt; Küche nicht als verfügbar angenommen.'
  :checkoutUnresolved?'Check-out- oder Mahlzeitenzeit offen; Küchenzugang am Abreisetag nicht bestätigt.'
  :afterDeparture?'Mahlzeit oder Zubereitungsdauer überschreitet den geplanten Check-out; Zugang prüfen.'
  :describedKitchen?'Küche laut Unterkunftsbeschreibung; tatsächlichen Zugang, Kochgeschirr und Kühlung prüfen.'
  :'Küche nicht bestätigt. Für warme Gerichte Kochmöglichkeit klären.';
 return {hotel,kitchenReady:describedKitchen&&!beforeArrival&&!afterDeparture&&!checkoutUnresolved,notice};
}

export function currentMeals(ctx,slot){return (ctx.active??[]).filter(i=>i.mealSlot===slot&&mealDate(i)===ctx.date)}

export function mealSelectionPatch(ctx,option,{slot=option.slot,time='',duration=option.prep,seating='inside'}={},id){
 if(!mealSlotLabels[slot]||!plansForSlot([option],slot).length)throw Error('Diese Mahlzeit passt nicht zum Tagesabschnitt.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(ctx.date)||ctx.date<ctx.trip.from||ctx.date>ctx.trip.to||!ctx.trip.route.includes(ctx.city))throw Error('Ungültiger Reisetag.');
 if(!Number.isInteger(duration)||duration<1||duration>360||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Zeit oder Dauer der Mahlzeit ist ungültig.');
 const current=currentMeals(ctx,slot);
 if(current.some(i=>i.locked||i.booked))throw Error('Eine Mahlzeit im Plan ist gesperrt.');
 if(current.some(i=>ctx.state.expenses.some(e=>e.forItem===i.id)))throw Error('Für diese Mahlzeit ist schon eine Ausgabe erfasst. Passe den Betrag im Budget an.');
 const estimate=mealEstimate(option,ctx.people.length);
 const cents=seating==='terrace'&&estimate.terrace!==null?estimate.terrace:estimate.base;
 const zone=ctx.cities[ctx.city].timezone,recipe=option.type==='cook';
 const destination=ctx.all?.find(i=>i.id===option.venue);
 const item={id,trip:ctx.trip.id,city:ctx.city,kind:'activity',category:'food',selected:true,
  name:option.name+(seating==='terrace'?' · Terrasse':''),zone,date:ctx.date,mealSlot:slot,mealPlanId:option.id,seating,
  start:time?utcFromLocal(ctx.date,time,zone):null,end:null,duration,
  point:destination?.point??null,address:destination?.address,
  requiresKitchen:recipe&&(option.requiresKitchen??true),requiresColdStorage:Boolean(option.requiresColdStorage),
  ...(recipe?{basketProducts:option.products.map(p=>({...p}))}:{}),
  tags:[mealSlotLabels[slot],recipe?(option.requiresKitchen===false?'Ohne Herd':'Selbst kochen'):'Restaurant'],
  price:cents===null?null:{cents,currency:estimate.currency,scope:'group',party:ctx.people.length,label:option.priceNote},
  source:option.source,detail:[option.note,...(option.steps??[])].join('\n'),origin:'manuell',verification:'Preisreferenz'};
 const edits={...ctx.state.edits};for(const old of current)edits[old.id]={...edits[old.id],selected:false};
 return {...ctx.state,edits,manual:[...ctx.state.manual,item]};
}

export function shoppingCandidates(ctx){
 return [...new Map([...(ctx.all??[]),...(ctx.marketItems??[])].filter(i=>i.city===ctx.city&&!i.removed&&!i.duplicateOf&&!i.shoppingSourceId
  &&(i.category==='shopping'||explorerCategory(i)==='shop')).map(i=>[i.id,i])).values()];
}
export function shoppingStopDraft(ctx,store,{time='',duration=20}={},id){
 if(!shoppingCandidates(ctx).some(i=>i.id===store?.id)||store.city!==ctx.city)throw Error('Einkaufsort gehört nicht zur ausgewählten Stadt.');
 if((ctx.active??[]).some(i=>(i.shoppingSourceId===store.id||i.id===store.id)&&mealDate(i)===ctx.date))throw Error('Dieser Einkaufsort ist für den Tag bereits eingeplant.');
 if(ctx.date<ctx.trip.from||ctx.date>ctx.trip.to||!Number.isInteger(duration)||duration<5||duration>180
  ||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Reisetag, Zeit oder Einkaufsdauer ungültig.');
 const zone=ctx.cities[ctx.city].timezone;
 return {id,trip:ctx.trip.id,city:ctx.city,name:'Einkauf · '+store.name,kind:'activity',category:'food',selected:true,
  date:ctx.date,zone,start:time?utcFromLocal(ctx.date,time,zone):null,end:null,duration,
  point:store.point??null,address:store.address,geoEvidence:store.geoEvidence,source:store.source??[],website:store.website??store.sourceUrl,
  weekly:store.weekly,shoppingSourceId:store.id,
  price:{cents:0,currency:'EUR',scope:'group',label:'Nur Stoppzeit; Warenkosten bleiben im gemeinsamen Einkaufswarenkorb'},
  detail:'Optionaler Einkaufsstopp. Öffnung, Zugang und Produktbestand am Reisetag prüfen. Kein zusätzlicher Warenpreis und keine Buchung.'};
}
