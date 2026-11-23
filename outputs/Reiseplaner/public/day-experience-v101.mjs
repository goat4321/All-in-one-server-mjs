import {esc,shortDay,icon,urlLink} from './ui.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';
import {localParts} from './model.mjs';
import {SWISS_DAY_EDITORIAL_V85} from './swiss-day-editorial-v85.mjs';

const editorialByDate=new Map(SWISS_DAY_EDITORIAL_V85.map(day=>[day.date,day]));
const labels={morning:'Morgen',noon:'Mittag',evening:'Abend'};
const validFocus=new Set(['all','morning','noon','evening']);
const sameDay=(item,date)=>(localParts(item.start,item.zone).date??item.date)===date;
const currentActivities=ctx=>(ctx.active??[]).filter(item=>
 item.kind==='activity'&&!item.removed&&sameDay(item,ctx.date));

/** Progress reflects selected suggestions, not completed/booked activities. */
export function dayExperienceStatsV101(ctx){
 const day=ctx?.dayPlan,plans=ctx?.trip?.dayPlansV32??[];
 const index=plans.findIndex(row=>row.date===ctx.date);
 if(!day||index<0||day.tripId!==ctx.trip.id)return null;
 const activeIds=new Set(currentActivities(ctx).map(item=>item.id));
 const selected=day.slots.filter(slot=>activeIds.has(slot.id)).length;
 const total=day.slots.length;
 return {index,totalDays:plans.length,selected,total,
  percent:total?Math.round(100*selected/total):0,
  previous:index?plans[index-1].date:null,
  next:index<plans.length-1?plans[index+1].date:null,
  rideCount:day.rides?.length??0,
  activeCount:currentActivities(ctx).length};
}

/** Shared day navigation for all four original trip variants. */
export function renderDayNavigatorV101(ctx){
 const s=dayExperienceStatsV101(ctx);
 if(!s)return '';
 const previous=s.previous?
  '<button class="day101-navigation-button" type="button" data-action="day-plan-go" data-value="'+esc(s.previous)+'" aria-label="Vorheriger Reisetag, '+esc(shortDay(s.previous))+'">'+icon('chevron')+'<span>Vorheriger Tag</span></button>':
  '<button class="day101-navigation-button" type="button" disabled aria-label="Erster Reisetag">'+icon('chevron')+'<span>Vorheriger Tag</span></button>';
 const next=s.next?
  '<button class="day101-navigation-button" type="button" data-action="day-plan-go" data-value="'+esc(s.next)+'" aria-label="Nächster Reisetag, '+esc(shortDay(s.next))+'"><span>Nächster Tag</span>'+icon('chevron')+'</button>':
  '<button class="day101-navigation-button" type="button" disabled aria-label="Letzter Reisetag"><span>Nächster Tag</span>'+icon('chevron')+'</button>';
 return '<nav class="day101-navigator" aria-label="Zwischen den Reisetagen navigieren">'
  +previous
  +'<div class="day101-navigation-current"><span>TAG '+(s.index+1)+' VON '+s.totalDays+'</span>'
  +'<strong>'+esc(shortDay(ctx.date))+' · '+esc(ctx.cities?.[ctx.dayPlan.city]?.name??ctx.dayPlan.city)+'</strong>'
  +'<small>'+esc(ctx.dayPlan.title)+'</small></div>'
  +next+'</nav>'
  +'<section class="day101-progress" aria-label="Planungsstand für den ausgewählten Reisetag">'
  +'<div class="day101-progress-header"><strong>Deine Tagesideen</strong>'
  +'<span>'+s.selected+' von '+s.total+' übernommen</span></div>'
  +'<div class="day101-progress-meter" role="progressbar" aria-label="Übernommene Tagesideen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.percent+'">'
  +'<i style="width:'+s.percent+'%"></i></div>'
  +'<p>'+s.activeCount+' selbst eingeplante Aktivitäten · '+s.rideCount+' vorläufige Fahrten · keine automatisch bestätigten Buchungen</p>'
  +'</section>';
}

/** A functional period-filtered board. No fake clock times or automatic edits. */
export function swissDayExperienceModelV101(ctx){
 if(ctx?.trip?.id!=='interrail_swiss'||ctx.trip.travellers!==3
   ||ctx?.dayPlan?.tripId!=='interrail_swiss')return null;
 const editorial=editorialByDate.get(ctx.date);
 if(!editorial||editorial.city!==ctx.dayPlan.city||editorial.blocks.length!==3)return null;
 const currentIds=new Set(currentActivities(ctx).map(item=>item.id));
 const pendingIds=new Set(dayPlanCandidates(ctx,{includeOptional:true}).map(s=>s.id));
 const allSelected=ctx.activeSet??new Set((ctx.active??[]).map(item=>item.id));
 const blocks=editorial.blocks.map(block=>{
  const slot=block.activity?ctx.dayPlan.slots.find(s=>s.id==='survey-v19:'+block.activity):null;
  const item=slot?(ctx.all??[]).find(x=>x.id===slot.id):null;
  const selected=Boolean(slot&&currentIds.has(slot.id));
  return {...block,slot,item,selected,
   canAdd:Boolean(slot&&pendingIds.has(slot.id)&&!selected),
   elsewhere:Boolean(slot&&!selected&&allSelected.has(slot.id)),
   canRemove:Boolean(slot&&selected&&!item?.booked&&!item?.locked)};
 });
 return {editorial,blocks};
}

export function renderSwissDayExperienceV101(ctx){
 const data=swissDayExperienceModelV101(ctx);
 if(!data)return '';
 const focus=validFocus.has(ctx.dayPlanFocus)?ctx.dayPlanFocus:'all';
 const filters=[['all','Ganzer Tag'],['morning','Morgen'],['noon','Mittag'],['evening','Abend']]
  .map(([id,label])=>'<button type="button" class="day101-filter" data-action="day-plan-focus" data-value="'+id+'"'
    +' aria-pressed="'+(focus===id)+'">'+esc(label)+'</button>').join('');
 const cards=data.blocks.map((block,index)=>{
  const hidden=focus!=='all'&&block.period!==focus?' hidden':'';
  const action=block.canAdd
   ?'<button type="button" class="day101-add" data-action="day-plan-add" data-value="'+esc(block.slot.id)+'">'+icon('plus')+'Zum Tag hinzufügen</button>'
   :block.canRemove
    ?'<button type="button" class="day101-remove" data-action="day-quick-remove" data-value="'+esc(block.slot.id)+'">'+icon('check')+'Im Tag · entfernen</button>'
    :block.selected?'<span class="day101-added">'+icon('check')+'Bereits im Tag</span>'
    :block.elsewhere?'<span class="day101-unavailable">An anderem Tag eingeplant</span>'
    :'<span class="day101-advisory">Unverbindliche Planungsidee</span>';
  return '<article class="day101-period-card" data-period="'+esc(block.period)+'"'
    +' style="--day101-step:'+index+'"'+hidden+'>'
    +'<div class="day101-period-top"><span class="day101-period-index">'+(index+1)+'</span>'
    +'<span>'+esc(labels[block.period])+'</span>'
    +(block.selected?'<small>IM PLAN</small>':'')+'</div>'
    +'<h3>'+esc(block.title)+'</h3>'
    +'<p>'+esc(block.detail)+'</p>'
    +'<div class="day101-period-footer">'+action+'</div></article>';
 }).join('');
 const facts=[['Essen & Küche',data.editorial.food],['Kostenstatus',data.editorial.cost],
  ['Verbindungen & Zugang',data.editorial.access],['Zeitpuffer',data.editorial.buffer],
  ['Alternative',data.editorial.alternative]];
 const factsHtml=facts.map(([title,detail])=>'<div class="day101-fact">'
   +'<strong>'+esc(title)+'</strong><p>'+esc(detail)+'</p></div>').join('');
 const sources=data.editorial.sources.map(([label,href])=>urlLink(href,label)).join('');
 const rideCount=ctx.dayPlan.rides?.length??0;
 return '<section class="day101-board" id="interrail-schweiz-tagesablauf" aria-label="Interaktive Tagesplanung für Interrail Schweiz">'
  +'<header class="day101-board-heading"><div><small>INTERRAIL SCHWEIZ · TAG '+(ctx.trip.dayPlansV32.findIndex(d=>d.date===ctx.date)+1)+'</small>'
  +'<h2>Morgen. Mittag. Abend.</h2>'
  +'<p>Die gesamten Tagesideen im Überblick. Wähle einen Abschnitt und übernimm nur passende Aktivitäten bewusst in deinen gespeicherten Reiseplan.</p></div>'
  +'<a href="#day-plan-draft-detail">Alle Vorschläge & Transfers</a></header>'
  +'<div class="day101-filters" role="group" aria-label="Tagesabschnitt auswählen">'+filters+'</div>'
  +'<p class="day101-filter-status" aria-live="polite">'+(focus==='all'?'Alle drei Abschnitte':labels[focus]+' ausgewählt')+'</p>'
  +'<div class="day101-period-grid">'+cards+'</div>'
  +'<div class="day101-board-bottom"><span>'+icon('train')+' '+rideCount+' vorläufige Fahrten</span>'
  +'<span>Keine fixierten Uhrzeiten oder Buchungen</span></div>'
  +'<details class="day101-source-details"><summary>Verpflegung, Alternativen, Puffer und Quellen ansehen '+icon('chevron')+'</summary>'
  +'<div class="day101-facts">'+factsHtml+'</div>'
  +'<div class="day101-official"><strong>Bestehende offizielle Quellen</strong><div>'+sources+'</div></div>'
  +'</details></section>';
}
