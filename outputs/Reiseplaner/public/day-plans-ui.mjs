import {esc,icon,btn,shortDay,urlLink} from './ui.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';
import {hikingPanel} from './hiking.mjs';
import {placeThumbnailHtml} from './place-profile.mjs';
import {localParts} from './model.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';
import {swissInterrailDayV82} from './swiss-interrail-focus-v82.mjs';
import {renderSwissDayEditorialV85} from './swiss-day-editorial-v85.mjs';
const mapsForFixedPlace=(item,cities)=>item?.name&&item.kind==='activity'
 &&item.pointPrecision!=='unverified_or_not_single_location'
 &&!item.researchV20?.reviewStatus?.includes('concept')
 &&!/^(?:gemeinsam kochen|selbst kochen|flexible freizeit)$/i.test(item.name.trim())
 ?urlLink(googleMapsSearchUrl(item,cities),'Google Maps'):'';

const periods={morning:'Vormittag',noon:'Mittag',afternoon:'Nachmittag',evening:'Abend'};
const styles={reise:'Reisetag',rueckreise:'Rückreise',stadt:'Stadt entdecken',
  wasser:'Meer & Seen',berge:'Berge & Wandern'};
const types={reise:'train',rueckreise:'train',stadt:'compass',wasser:'beach',berge:'tree'};
const activeIds=(ctx,date=ctx.date)=>new Set((ctx.active??[]).filter(item=>item.kind==='activity'
  &&(localParts(item.start,item.zone).date??item.date)===date).map(item=>item.id));

/** Compact actions before the timeline; 46 researched day drafts stay intact. */
export function dayPlanQuickBar(ctx){
 const day=ctx.dayPlan;
 if(!day)return '';
 const active=new Set((ctx.active??[]).filter(x=>x.kind==='activity'&&
   (localParts(x.start,x.zone).date??x.date)===ctx.date).map(x=>x.id));
 const allowed=new Set(dayPlanCandidates(ctx,{includeOptional:true}).map(x=>x.id));
 const upcoming=day.slots.filter(x=>allowed.has(x.id)).slice(0,3);
 const batchCandidates=dayPlanCandidates(ctx);
 const removable=(ctx.active??[]).filter(x=>x.kind==='activity'&&!x.booked&&!x.locked
   &&(localParts(x.start,x.zone).date??x.date)===ctx.date);
 return '<section class="day-plan-quick-bar" aria-label="Tagesplan schnell ändern">'
   +'<div class="day-plan-quick-heading"><div><small>DEIN TAG · SCHNELL BEARBEITEN</small>'
   +'<strong>'+esc(day.title)+'</strong></div>'
   +'<span>'+active.size+' Aktivitäten geplant</span></div>'
   +'<div class="day-plan-quick-chips">'
   +removable.slice(0,4).map(item=>'<button type="button" class="day-plan-quick-chip is-added"'
     +' data-action="day-quick-remove" data-value="'+esc(item.id)+'"'
     +' aria-label="'+esc(item.name)+' aus diesem Tag entfernen"'
     +' title="Direkt aus dem Tag entfernen">'
     +icon('check')+'<span>'+esc(item.name)+'</span>'+icon('close')+'</button>').join('')
   +upcoming.map(slot=>'<button type="button" class="day-plan-quick-chip"'
     +' data-action="day-plan-add" data-value="'+esc(slot.id)+'"'
     +' aria-label="'+esc(slot.name)+' zum heutigen Tag hinzufügen"'
     +' title="Unverbindlich zum Tag hinzufügen">'
     +icon('plus')+'<span>'+esc(slot.name)+'</span></button>').join('')
   +(!upcoming.length&&!removable.length?'<span class="day-plan-quick-empty">'
     +'Noch keine Aktivität übernommen – Vorschläge weiter unten öffnen.</span>':'')
   +'</div><div class="day-plan-quick-bottom">'
   +(batchCandidates.length
      ?'<div class="day-plan-batch-cta">'
        +btn('day-plan-adopt',batchCandidates.length+' Tagesideen übernehmen','plus','','primary')
        +'<small>Ohne feste Uhrzeiten, unverbindlich</small></div>'
      :'')
   +'<a href="#day-plan-draft-detail">Alle '+day.slots.length+' Tagesideen & Transfers ansehen</a>'
   +'</div></section>';
}
export function dayPlanPanel(ctx,{compact=false}={}){
 const day=ctx.dayPlan;
 if(!day)return '';
 const added=activeIds(ctx),pending=dayPlanCandidates(ctx);
 const current=(ctx.active??[]).filter(item=>item.kind==='activity'
   &&(localParts(item.start,item.zone).date??item.date)===ctx.date
   &&!item.removed);
 const currentRows=current.map(item=>
  '<li class="day-plan-current-row"><strong>'+esc(item.name)+'</strong>'
   +'<small>'+esc(ctx.cities?.[item.city]?.name??item.city)
    +' · '+(item.start?'Mit eigener Zeit':'Flexibel, ohne feste Uhrzeit')+'</small>'
   +'<span class="day-plan-added">Im Tagesplan</span>'
   +(mapsForFixedPlace(item,ctx.cities)||'')
   +(item.booked||item.locked
     ?'<span class="day-plan-protected">Gebuchter/fester Eintrag</span>'
     :btn('day-quick-remove','Entfernen','close',item.id,'subtle'))
   +'</li>').join('');
 const selected=day.slots.filter(slot=>added.has(slot.id)).length;
 const total=day.slots.length;
 const pct=total?Math.round(100*selected/total):0;
 const progress=total?'<div class="day-plan-progress"><span>'+selected+' von '+total
   +' Tagesideen übernommen</span><div role="progressbar" aria-label="Tagesideen bereits in deinem Plan"'
   +' aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+selected+'">'
   +'<i style="width:'+pct+'%"></i></div></div>':'';
 const arrivals=(day.overnightArrivals??[]).map(t=>
    '<li class="day-plan-transport day-plan-night-arrival">'
    +'<span class="day-plan-rail-icon">'+icon('moon')+'</span>'
    +'<span><strong>Nachtzug: Ankunft '+esc(t.to)+'</strong>'
    +'<small>Plan '+esc(t.arrival)+' · 2027 nicht bestätigt</small></span></li>').join('');
 const rides=day.rides.map(t=>'<li class="day-plan-transport">'
    +'<span class="day-plan-rail-icon">'+icon(t.mode==='train'?'train':'car')+'</span>'
    +'<span><strong>'+esc(t.from)+' → '+esc(t.to)+'</strong>'
    +'<small>Plan '+esc(t.departure??'Zeit offen')+' – '+esc(t.arrival??'Zeit offen')
    +(t.planMinutes?' · '+(Math.round(t.planMinutes/60*10)/10).toLocaleString('de-DE')+' Std. Fahrplanreferenz':'')
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
    +(already?btn('day-quick-remove','Entfernen','close',slot.id,'subtle')
     :elsewhere?'<small>Anderweitig eingeplant</small>'
     :btn('day-plan-add',slot.optional?'Option hinzufügen':'Zum Tag','plus',slot.id,'subtle'))
    +btn('details','Details','folder',slot.id)
    +(mapsForFixedPlace(item,ctx.cities)||'')+'</div></li>';
 }).join('');
 const body='<div class="day-plan-inner">'
    +'<section class="day-plan-today" aria-label="Bereits eingeplante Aktivitäten">'
    +'<div class="day-plan-today-head"><strong>Dein Tagesplan · '
      +current.length+(current.length===1?' Aktivität':' Aktivitäten')+'</strong><small>Einträge direkt entfernen oder weitere hinzufügen</small></div>'
    +(currentRows?'<ul class="day-plan-current-list">'+currentRows+'</ul>'
      :'<p class="day-plan-today-empty">Noch keine zusätzlichen Aktivitäten übernommen.</p>')
    +'</section>'
    +progress
    +renderSwissDayEditorialV85(ctx)
    +swissInterrailDayV82(ctx)
    +hikingPanel(ctx)
    +(rides||arrivals?'<div class="day-plan-block"><h4>'+icon('train')+' Anreise / Transfers (vorläufig)</h4>'
    +'<ul class="day-plan-ride-list">'+arrivals+rides+'</ul></div>':'')
    +(slots?'<div class="day-plan-block"><h4>'+icon('calendar')+' Ideen nach Tagesabschnitt</h4>'
    +'<ol class="day-plan-stop-list">'+slots+'</ol></div>'
    :'<p class="day-plan-no-stops">Für diesen Reisetag sind bewusst keine zusätzlichen Aktivitäten fest vorgesehen.</p>')
    +'<div class="day-plan-notes">'+icon('alert')+'<p>'+esc(day.notes)+'</p></div>'
    +(day.reference?.url?'<p class="day-plan-official">'+urlLink(day.reference.url,'Betriebszeit offiziell prüfen')
       +'<small>'+esc(day.reference.note)+'</small></p>':'')
    +'<div class="day-plan-foot"><span>'+icon('clock')+' '
      +(day.estimatedActivityMinutes?day.estimatedActivityMinutes+' Min. Aktivitätsideen':'Bewusster Reise-/Puffertag')
      +(day.estimatedTravelMinutes?' · '+(Math.round(day.estimatedTravelMinutes/60*10)/10).toLocaleString('de-DE')+' Std. Fahrt nach Referenz':'')
      +' · keine bestätigten 2027-Uhrzeiten</span>'
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
 return '<section id="day-plan-draft-detail" class="day-plan-panel" aria-label="Tagesvorschlag">'
  +'<header class="day-plan-heading">'+heading+'</header>'+body+'</section>';
}

export function dayPlanOverview(ctx){
 const plans=ctx.trip?.dayPlansV32??[];
 if(!plans.length)return '';
 const rows=plans.map((day,index)=>{
  const used=activeIds(ctx,day.date);
  const selected=day.slots.filter(slot=>used.has(slot.id)).length;
  return '<li><button type="button" class="day-plan-overview-row" data-action="day-plan-go"'
   +' data-value="'+esc(day.date)+'">'
   +'<span class="day-plan-overview-number">'+(index+1)+'</span>'
   +'<span class="day-plan-overview-title"><strong>'+esc(shortDay(day.date))
   +' · '+esc(day.title)+'</strong>'
   +'<small>'+esc(ctx.cities?.[day.city]?.name??day.city)+' · '
   +esc(styles[day.pace]??'Tag')+' · '+day.slots.length+' Ideen'
   +(day.rides.length?' · '+day.rides.length+' Fahrten':'')
   +(selected?' · '+selected+' übernommen':'')+'</small></span>'
   +icon('chevron')+'</button></li>';
 }).join('');
 return '<details class="day-plan-overview">'
   +'<summary><span class="day-plan-overview-head-icon">'+icon('calendar')+'</span>'
   +'<span><strong>Alle '+plans.length+' Tagespläne ansehen</strong>'
   +'<small>Jeden Reisetag öffnen · neue Ideen auf Wunsch übernehmen</small></span>'
   +icon('chevron')+'</summary>'
   +'<ol class="day-plan-overview-list">'+rows+'</ol></details>';
}
