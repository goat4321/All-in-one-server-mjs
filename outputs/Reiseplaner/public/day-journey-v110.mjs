import {esc,icon,shortDay} from './ui.mjs';
import {localParts,money,categories} from './model.mjs';
import {footpathMatchesStops} from './route-studio.mjs';
import {quickDayTargetDates} from './day-quick-edits-v50.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';
import {SWISS_DAY_EDITORIAL_V85} from './swiss-day-editorial-v85.mjs';

const periods={morning:'Vormittag',noon:'Mittag',afternoon:'Nachmittag',evening:'Abend'};
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
const exactPoint=item=>validPoint(item?.point)&&item.locationReferenceV07?.exactKnown===true
 &&item.geoEvidence?.isCentroid!==true&&item.pointPrecision!=='unverified_or_not_single_location'?item.point:null;
const dayOf=item=>localParts(item.start,item.zone).date??item.date??item.stayFrom??null;
const editorial=new Map(SWISS_DAY_EDITORIAL_V85.map(row=>[row.date,row]));

/** Draft and saved itinerary are deliberately separate. Only source-backed
 * exact points receive a marker. Never bridge missing stops or city transfers. */
export function journeyModelV110(ctx,mode='draft',cachedRoute=()=>null){
 if(!ctx?.dayPlan||ctx.dayPlan.tripId!==ctx.trip?.id||ctx.dayPlan.date!==ctx.date)return null;
 const actual=ctx.fullDay??ctx.day??[];
 const today=new Set(actual.filter(x=>x.kind==='activity').map(x=>x.id));
 const source=new Map((ctx.all??[]).map(x=>[x.id,x]));
 const pending=new Set(dayPlanCandidates(ctx,{includeOptional:true}).map(s=>s.id));
 const allSlots=ctx.dayPlan.slots??[];
 const rows=mode==='saved'?actual.filter(x=>!x.removed).map(x=>({
  id:x.entryKey??x.id,sourceId:x.id,name:x.role?x.role+' · '+x.name:x.name,
  city:x.placeCity??x.city,point:exactPoint(x),time:x.time??'Flexibel',minutes:x.duration??null,
  selected:true,optional:false,canAdd:false
 })):allSlots.filter(s=>!s.optional||today.has(s.id)).map(s=>{
  const x=source.get(s.id);
  return {id:s.id,sourceId:s.id,name:s.name,city:s.city??x?.city,
   point:exactPoint(x),time:periods[s.period]??'Flexibel',minutes:s.minutes??null,
   selected:today.has(s.id),optional:Boolean(s.optional),canAdd:pending.has(s.id)};
 });
 const stops=rows.map((row,index)=>({...row,index,ordinal:index+1}));
 const legs=stops.slice(1).map((to,index)=>{
  const from=stops[index];
  if(!from.point||!to.point||from.city!==to.city)return {from:index,to:index+1,type:'gap',points:[],minutes:null};
  const route=cachedRoute(from,to);
  if(footpathMatchesStops(from,to,route)&&Number.isFinite(route.minutes)&&route.minutes>=0)
   return {from:index,to:index+1,type:'routed',points:route.points,minutes:route.minutes};
  if(from.point[0]===to.point[0]&&from.point[1]===to.point[1])
   return {from:index,to:index+1,type:'same',points:[],minutes:null};
  return {from:index,to:index+1,type:'schematic',points:[from.point,to.point],minutes:null};
 });
 return {date:ctx.date,mode,stops,legs,located:stops.filter(s=>s.point).length,
  transfers:[...(ctx.dayPlan.overnightArrivals??[]),...(ctx.dayPlan.rides??[])],
  editorial:ctx.trip.id==='interrail_swiss'?editorial.get(ctx.date)??null:null,
  optional:allSlots.filter(s=>s.optional&&!today.has(s.id)).map(s=>({...s,canAdd:pending.has(s.id)}))};
}

/** Existing budget ledger only. Assign each row once to its booked/planned date.
 * Lodging totals sit on check-in; shared grocery cost on its existing ledger date. */
export function dayBudgetV110(ctx){
 const active=new Map((ctx.active??[]).map(x=>[x.id,x]));
 const rows=(ctx.budget?.rows??[]).filter(row=>{
  const linked=active.get(row.forItem??row.id.replace(/^reservation:/,''));
  const date=row.date??dayOf(row)??(linked?dayOf(linked):null);
  return date===ctx.date;
 });
 const groups=new Map();
 for(const row of rows){
  const key=row.category??'other';
  if(!groups.has(key))groups.set(key,{key,label:categories[key]??key,eur:0,known:0,unknown:0,other:{}});
  const g=groups.get(key);
  if(Number.isFinite(row.euros)){g.eur+=row.euros;g.known++;}
  else {g.unknown++;if(Number.isFinite(row.original)&&row.currency&&row.currency!=='EUR')
   g.other[row.currency]=(g.other[row.currency]??0)+row.original;}
 }
 return {groups:[...groups.values()],eur:rows.reduce((sum,r)=>sum+(Number.isFinite(r.euros)?r.euros:0),0),
  known:rows.filter(r=>Number.isFinite(r.euros)).length,unknown:rows.filter(r=>!Number.isFinite(r.euros)).length,
  people:ctx.people?.length??0,rows:rows.length};
}
export function renderDayBudgetV110(ctx){
 const b=dayBudgetV110(ctx);
 const value=b.known?money(b.eur):'Offen';
 return '<section class="day110-budget" aria-label="Tagesbudget"><header><small>KOSTEN · ERFASSTE PLANPOSTEN</small><h2>Tagesbudget</h2></header>'
  +'<div class="day110-budget-totals"><div><small>Gruppe · bekannte EUR</small><strong>'+esc(value)+'</strong></div>'
  +'<div><small>Ø pro Person</small><strong>'+esc(b.known&&b.people?money(Math.round(b.eur/b.people)):'Offen')+'</strong></div>'
  +'<div><small>Nicht in EUR beziffert</small><strong>'+b.unknown+'</strong></div></div>'
  +'<details><summary>Kosten nach Kategorien</summary><div class="day110-budget-rows">'
  +(b.groups.map(g=>'<div><strong>'+esc(g.label)+'</strong><span>'+esc(g.known?money(g.eur):'EUR offen')
   +Object.entries(g.other).map(([c,v])=>' · '+esc(money(v,c))+' ohne EUR-Kurs').join('')
   +(g.unknown?' · '+g.unknown+' offen / ohne Kurs':'')+'</span></div>').join('')||'<p>Für diesen Tag sind noch keine Budgetposten erfasst.</p>')
  +'</div></details><p>Teilbeträge, keine Preisgarantie. Unterkunft und Gruppeneinkauf werden einmal am zugeordneten Tag erfasst, nicht pro Nacht oder Mahlzeit erneut. Reiseweite Posten ohne Datum fehlen hier.</p></section>';
}
export function dayMoveOptionsV110(ctx){
 if(typeof ctx.cityForDay!=='function')return [];
 return (ctx.fullDay??ctx.day??[]).filter(x=>x.kind==='activity'&&!x.start&&!x.end&&!x.locked&&!x.booked&&!x.mealSlot&&!x.readOnlyExternal&&!x.removed&&!x.duplicateOf)
  .flatMap(item=>{
   const choices=quickDayTargetDates(ctx,item).filter(date=>date!==ctx.date)
    .sort((a,b)=>Math.abs(Date.parse(a)-Date.parse(ctx.date))-Math.abs(Date.parse(b)-Date.parse(ctx.date)));
   return choices.length?[{id:item.id,name:item.name,date:choices[0]}]:[];
  });
}
export function renderDayAlternativesV110(ctx){
 const m=journeyModelV110(ctx,'draft');
 if(!m)return '';
 const moves=dayMoveOptionsV110(ctx);
 return '<section class="day110-alternatives"><header><small>FLEXIBEL PLANEN</small><h2>Plan B &amp; Tageswechsel</h2></header>'
  +(m.editorial?'<div class="day110-backup"><strong>Bei Regen, Verspätung oder Erschöpfung</strong><p>'+esc(m.editorial.alternative)+'</p><strong>Zeitpuffer</strong><p>'+esc(m.editorial.buffer)+'</p></div>':'')
  +(m.optional.length?'<details><summary>'+m.optional.length+' optionale Ideen ansehen</summary><ul>'
   +m.optional.map(s=>'<li><span>'+esc(s.name)+'</span>'+(s.canAdd?'<button type="button" data-action="day-plan-add" data-value="'+esc(s.id)+'">Übernehmen</button>':'')+'</li>').join('')+'</ul></details>':'')
  +(moves.length?'<details><summary>Flexible Aktivitäten auf andere Tage verschieben</summary><ul>'+moves.map(x=>
    '<li><span>'+esc(x.name)+' · passender Tag '+esc(shortDay(x.date))+'</span><button type="button" data-action="day110-move-confirm" data-value="'+esc(JSON.stringify([x.id,x.date]))+'">Verschieben…</button></li>').join('')+'</ul><p>Nur ortsbezogen passende Tage, keine automatische Streckenoptimierung oder Terminverschiebung.</p></details>':'')
  +'</section>';
}
export function renderDayJourneyIntroV110(ctx){
 const m=journeyModelV110(ctx);
 if(!m)return '';
 return '<section class="day110-intro"><header><small>DEIN TAG · ROUTENVORSCHAU</small><h2>Den Tag auf der Karte erleben</h2><p>'
  +m.stops.length+' Hauptideen / übernommene Alternativen · '+m.located+' belegte Kartenpunkte · '+m.transfers.length+' vorläufige Transfers</p></header>'
  +'<button class="day110-primary" type="button" data-action="day110-open" data-value="draft">'+icon('map')+' Tagesroute ansehen</button>'
  +'<p>Die Punkte zeigen geplante Orte, nicht euren Live-Standort. Fehlende Wege bleiben gestrichelt oder offen.</p></section>';
}
export function renderDayJourneyControlsV110(ctx,model){
 if(!model)return '';
 const list=model.stops.map(s=>'<button type="button" class="day110-stop" data-action="day110-focus" data-value="'+s.index+'" aria-pressed="false" data-located="'+Boolean(s.point)+'">'
  +'<span class="day110-index">'+s.ordinal+'</span><span><small>'+esc(s.time)+'</small><strong>'+esc(s.name)+'</strong><small>'
  +esc((s.minutes!=null?s.minutes+' Min. Planzeit · ':'')+(s.selected?'Im Plan':'Vorschlag')+(s.point?'':' · Kein genauer Pin'))+'</small></span></button>').join('');
 return '<section class="day110-player" aria-label="Tagesroute abspielen"><header><small>PLANVORSCHAU · KEIN LIVE-STANDORT</small><h3>Tageszeitachse</h3><p>'+model.located+' / '+model.stops.length+' Stopps mit belegtem Punkt</p></header>'
  +'<div class="day110-mode" role="group" aria-label="Datenquelle"><button type="button" data-action="day110-mode" data-value="draft" aria-pressed="'+(model.mode==='draft')+'">Tagesvorschlag</button><button type="button" data-action="day110-mode" data-value="saved" aria-pressed="'+(model.mode==='saved')+'">Mein Plan</button><button type="button" data-action="day110-close">Normale Karte</button></div>'
  +'<div class="day110-player-actions"><button type="button" data-action="day110-prev"'+(!model.stops.length?' disabled':'')+'>←</button><button type="button" data-action="day110-play"'+(!model.stops.length?' disabled':'')+'>Abspielen</button><button type="button" data-action="day110-pause">Pause</button><button type="button" data-action="day110-next"'+(!model.stops.length?' disabled':'')+'>→</button><button type="button" data-action="day110-route"'+(!model.legs.some(l=>l.type==='schematic')?' disabled':'')+'>Fußwege prüfen</button></div>'
  +'<p class="day110-status" role="status" aria-live="polite">Wähle einen Stopp oder starte die Vorschau.</p><div class="day110-track" role="progressbar" aria-label="Abgespielte Stopps" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>'
  +'<div class="day110-stops">'+(list||'<p>Keine Aktivitäten für diesen Tag vorgesehen bzw. gespeichert.</p>')+'</div>'
  +(model.transfers.length?'<details><summary>Vorläufige Transfers ('+model.transfers.length+')</summary><ul>'+model.transfers.map(t=>'<li>'+esc(t.from??'')+' → '+esc(t.to??'')+' · '+esc(t.departure??'Zeit offen')+' – '+esc(t.arrival??'Zeit offen')+' · 2027 ungeprüft</li>').join('')+'</ul></details>':'')
  +'<p class="day110-legend">Durchgezogen: berechneter Fußweg. Gestrichelt: Luftlinie, keine Gehzeit. Lücken: fehlende Koordinaten oder Ortswechsel. Abspieltempo ist keine Reisezeit.</p></section>';
}
