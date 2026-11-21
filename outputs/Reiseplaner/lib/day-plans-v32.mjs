import {readFile} from 'node:fs/promises';

const isDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value);
const check=(ok,note)=>{if(!ok)throw Error('Tagespläne V32: '+note)};
const clockMinutes=value=>{
 const match=/^([01]\d|2[0-3]):([0-5]\d)/.exec(String(value??''));
 return match?Number(match[1])*60+Number(match[2]):null;
};
export const provisionalLegMinutes=(departure,arrival)=>{
 const from=clockMinutes(departure),to=clockMinutes(arrival);
 if(from===null||to===null)return null;
 const overnight=/\(\+1\)/.test(String(arrival));
 const diff=to+(overnight||to<from?1440:0)-from;
 return diff>0&&diff<=1440?diff:null;
};
const nextDay=value=>new Date(Date.parse(value+'T12:00:00Z')+86400000).toISOString().slice(0,10);

const dayRange=(first,last)=>{
 check(isDate(first)&&isDate(last),'ungültige Kalendergrenzen');
 let days=[];
 for(let t=Date.parse(first+'T12:00:00Z'),end=Date.parse(last+'T12:00:00Z');
    t<=end&&days.length<40;t+=86400000)days.push(new Date(t).toISOString().slice(0,10));
 return days;
};
/** Source-backed, purely proposed; never writes into the user's saved plan. */
export function attachDayPlansV32(trips,transport,archive){
 check(archive?.version==='v32'&&Array.isArray(archive.plans),'Archivformat');
 check(Array.isArray(trips)&&trips.length===4,'vier Varianten erwartet');
 check(Array.isArray(transport),'Fahrten-Quelldaten fehlen');
 const known=new Map(trips.map(t=>[t.id,t])),visited=new Set();
 const stats={days:0,trips:0,activityIdeas:0,plannedTransfers:0,unconfirmedTransfers:0};
 for(const row of archive.plans){
  check(row&&known.has(row.tripId),'falsche Variantenkennung');
  check(isDate(row.date)&&typeof row.title==='string','Datum/Titel fehlt');
  const key=row.tripId+'|'+row.date;
  check(!visited.has(key),'doppelter Tag '+key);visited.add(key);
  check(row.status==='proposal_not_selected'&&row.verified2027Bookings===false,
   'Plan darf keine Buchung behaupten');
  check(Array.isArray(row.slots)&&row.slots.length<=4,'ungültige Tagesbelegung');
 }
 check(visited.size===46,'46 Tagesvorschläge erwartet');
 for(const trip of trips){
  const expected=dayRange(trip.from,trip.to);
  const plans=archive.plans.filter(d=>d.tripId===trip.id).sort((a,b)=>a.date.localeCompare(b.date));
  check(plans.length===expected.length,'fehlende Tage bei '+trip.id);
  const refs=new Map(trip.items.filter(i=>i.kind==='activity'&&!i.duplicateOf)
    .map(item=>[item.id,item]));
  trip.dayPlansV32=plans.map((plan,index)=>{
   check(plan.date===expected[index],trip.id+' fehlt '+expected[index]);
   const used=new Set();
   const slots=plan.slots.map((slot,index)=>{
    const id='survey-v19:'+slot.activityId,found=refs.get(id);
    check(found?.surveyV19?.rawId===slot.activityId,'Aktivität nicht vorhanden '+trip.id+' '+id);
    check(!used.has(id),'doppelter Vorschlag '+id);used.add(id);
    check(['morning','noon','afternoon','evening'].includes(slot.period)
      &&typeof slot.optional==='boolean','ungültiges Zeitfenster');
    check(Number.isSafeInteger(slot.minutes)&&slot.minutes===found.duration,
      'Dauer entspricht nicht Quelle '+id);
    stats.activityIdeas++;
    return {...slot,id,name:found.name,city:found.city,order:index+1};
   });
   const rides=transport.filter(t=>t.trip_id===trip.id&&t.date_local===plan.date)
     .map(t=>({
      id:t.id,mode:t.mode,from:t.from,to:t.to,
      departure:t.departure_local,arrival:t.arrival_local,
      confirmed2027:Boolean(t.scheduled_2027_confirmed),
      status:t.timetable_status??'provisional',
      planMinutes:provisionalLegMinutes(t.departure_local,t.arrival_local),
     }));
   const overnightArrivals=transport.filter(t=>t.trip_id===trip.id
     &&nextDay(t.date_local)===plan.date&&/\(\+1\)/.test(String(t.arrival_local)))
     .map(t=>({id:t.id,to:t.to,arrival:t.arrival_local.replace(/\s*\(\+1\)/,''),
       confirmed2027:false}));

   check(rides.every(t=>!t.confirmed2027),'Fahrplanstatus muss separat geprüft werden');
   stats.plannedTransfers+=rides.length;stats.unconfirmedTransfers+=rides.length;stats.days++;
   return {...plan,slots,rides,overnightArrivals,
      estimatedTravelMinutes:rides.every(x=>x.planMinutes!==null)
        ?rides.reduce((total,x)=>total+x.planMinutes,0):null,
      estimatedActivityMinutes:slots.filter(x=>!x.optional).reduce((a,x)=>a+x.minutes,0)};
  });
  stats.trips++;
 }
 return stats;
}
export async function loadDayPlansV32(trips,transport){
 const archive=JSON.parse(await readFile(new URL('../data/day-plans-v32.json',import.meta.url),'utf8'));
 return attachDayPlansV32(trips,transport,archive);
}
