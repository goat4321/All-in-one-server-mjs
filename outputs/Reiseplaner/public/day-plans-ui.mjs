import {esc,icon,btn,shortDay,urlLink} from './ui.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';
import {placeThumbnailHtml} from './place-profile.mjs';

const periods={morning:'Vormittag',noon:'Mittag',afternoon:'Nachmittag',evening:'Abend'};
const styles={reise:'Reisetag',rueckreise:'Rückreise',stadt:'Stadt entdecken',
  wasser:'Meer & Seen',berge:'Berge & Wandern'};
const types={reise:'train',rueckreise:'train',stadt:'compass',wasser:'beach',berge:'tree'};
const activeIds=(ctx)=>new Set((ctx.active??[]).filter(item=>item.kind==='activity'
  &&(item.date===ctx.date||item.start?.slice(0,10)===ctx.date)).map(item=>item.id));

export function dayPlanPanel(ctx,{compact=false}={}){
 const day=ctx.dayPlan;
 if(!day)return '';
 const added=activeIds(ctx),pending=dayPlanCandidates(ctx);
 const rides=day.rides.map(t=>'<li class="day-plan-transport">'
    +'<span class="day-plan-rail-icon">'+icon(t.mode==='train'?'train':'car')+'</span>'
    +'<span><strong>'+esc(t.from)+' → '+esc(t.to)+'</strong>'
    +'<small>Plan '+esc(t.departure??'Zeit offen')+' – '+esc(t.arrival??'Zeit offen')
    +' · 2027 nicht bestätigt</small></span></li>').join('');
 const slots=day.slots.map((slot,index)=>{
  const already=added.has(slot.id),elsewhere=ctx.activeSet?.has(slot.id)&&!already;
  const item=(ctx.all??[]).find(x=>x.id===slot.id);
  const photo=item?placeThumbnailHtml(item,ctx):'';
  return '<li class="day-plan-stop">'
    +'<span class="day-plan-index">'+(index+1)+'</span>'
    +'<span class="day-plan-photo">'+photo+'</span>'
    +'<span class="day-plan-stop-copy"><small>'+esc(periods[slot.period]??'Flexibel')
    +(slot.optional?' · Alternative':'')+'</small>'
    +'<strong>'+esc(slot.name)+'</strong>'
    +'<small>ca. '+slot.minutes+' Min. laut Planung · '
    +esc(ctx.cities?.[slot.city]?.name??slot.city)+'</small></span>'
    +'<div class="day-plan-item-actions">'
    +(already?'<span class="day-plan-added">'+icon('check')+' Im Tagesplan</span>'
     :elsewhere?'<small>Anderweitig eingeplant</small>'
     :btn('day-plan-add',slot.optional?'Option hinzufügen':'Zum Tag','plus',slot.id,'subtle'))
    +btn('details','Details','folder',slot.id)+'</div></li>';
 }).join('');
 const body='<div class="day-plan-inner">'
    +(rides?'<div class="day-plan-block"><h4>'+icon('train')+' Anreise / Transfers (vorläufig)</h4>'
    +'<ul class="day-plan-ride-list">'+rides+'</ul></div>':'')
    +(slots?'<div class="day-plan-block"><h4>'+icon('calendar')+' Ideen nach Tagesabschnitt</h4>'
    +'<ol class="day-plan-stop-list">'+slots+'</ol></div>'
    :'<p class="day-plan-no-stops">Für diesen Reisetag sind bewusst keine zusätzlichen Aktivitäten fest vorgesehen.</p>')
    +'<div class="day-plan-notes">'+icon('alert')+'<p>'+esc(day.notes)+'</p></div>'
    +(day.reference?.url?'<p class="day-plan-official">'+urlLink(day.reference.url,'Betriebszeit offiziell prüfen')
       +'<small>'+esc(day.reference.note)+'</small></p>':'')
    +'<div class="day-plan-foot"><span>'+icon('clock')+' '
      +(day.estimatedActivityMinutes?day.estimatedActivityMinutes+' Min. Aktivitätsideen zzgl. Wege/Transfers':'Bewusster Reise-/Puffertag')
      +' · noch keine fixen Uhrzeiten</span>'
    +(pending.length?btn('day-plan-adopt',pending.length+' Ideen zum Tag hinzufügen','check','','primary'):'')
    +'</div></div>';
 const heading='<span class="day-plan-eyebrow">'+icon(types[day.pace]??'calendar')
  +' '+esc(styles[day.pace]??'Entdecken')+' · unverbindlicher Entwurf</span>'
  +'<strong>'+esc(day.title)+'</strong>'
  +'<small>'+day.slots.length+' Aktivitätsideen · '+day.rides.length+' vorläufige Fahrten</small>';
 if(compact){
  const open=ctx.dayPlanOpen===true;
  return '<details class="day-plan-panel day-plan-compact"'+(open?' open':'')
    +' aria-label="Tagesideen für '+esc(ctx.date)+'">'
    +'<summary>'+heading+icon('chevron')+'</summary>'+body+'</details>';
 }
 return '<section class="day-plan-panel" aria-label="Tagesvorschlag">'
  +'<header class="day-plan-heading">'+heading+'</header>'+body+'</section>';
}

export function dayPlanOverview(ctx){
 const plans=ctx.trip?.dayPlansV32??[];
 if(!plans.length)return '';
 const rows=plans.map((day,index)=>
  '<li><button type="button" class="day-plan-overview-row" data-action="day-plan-go"'
   +' data-value="'+esc(day.date)+'">'
   +'<span class="day-plan-overview-number">'+(index+1)+'</span>'
   +'<span class="day-plan-overview-title"><strong>'+esc(shortDay(day.date))
   +' · '+esc(day.title)+'</strong>'
   +'<small>'+esc(ctx.cities?.[day.city]?.name??day.city)+' · '
   +esc(styles[day.pace]??'Tag')+' · '+day.slots.length+' Ideen'
   +(day.rides.length?' · '+day.rides.length+' Fahrten':'')+'</small></span>'
   +icon('chevron')+'</button></li>').join('');
 return '<details class="day-plan-overview">'
   +'<summary><span class="day-plan-overview-head-icon">'+icon('calendar')+'</span>'
   +'<span><strong>Alle '+plans.length+' Tagespläne ansehen</strong>'
   +'<small>Jeden Reisetag öffnen · neue Ideen auf Wunsch übernehmen</small></span>'
   +icon('chevron')+'</summary>'
   +'<ol class="day-plan-overview-list">'+rows+'</ol></details>';
}
