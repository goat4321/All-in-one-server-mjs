import {esc,shortDay,icon} from './ui.mjs';

/**
 * V103: contextual navigation for long travel-day pages.
 * Only uses existing days and native day-plan-go action; never writes
 * bookings, activity selection, schedules, or route geometry.
 */
const jumpTargets=[
 {id:'interrail-schweiz-tagesablauf',text:'Tagesideen',swissOnly:true},
 {id:'day103-preparation',text:'Vorbereitung',swissOnly:true},
 {id:'day103-timeline',text:'Meine Einträge'},
 {id:'day-plan-draft-detail',text:'Alle Details'}
];
export function dayJumpRowsV103(ctx){
 const plans=ctx?.trip?.dayPlansV32??[];
 if(!ctx?.dayPlan||!plans.some(day=>day.date===ctx.date))return [];
 return plans.map((day,index)=>({
  date:day.date,index:index+1,
  label:ctx.cities?.[day.city]?.name??day.city,
  title:day.title,
  selected:day.date===ctx.date
 }));
}
export function renderDayJumpV103(ctx){
 const days=dayJumpRowsV103(ctx);
 if(!days.length)return '';
 const swiss=ctx.trip.id==='interrail_swiss';
 const buttons=days.map(day=>
  '<button type="button" data-action="day-plan-go" data-value="'+esc(day.date)+'"'
   +(day.selected?' aria-current="date"':'')
   +' aria-label="Tag '+day.index+': '+esc(shortDay(day.date))+', '+esc(day.label)+'">'
   +'<small>TAG '+day.index+'</small><strong>'+esc(shortDay(day.date))+'</strong>'
   +'<span>'+esc(day.label)+'</span></button>').join('');
 const links=jumpTargets.filter(t=>swiss||!t.swissOnly).map(t=>
  '<a class="day103-jump-link" href="#'+t.id+'">'+esc(t.text)+'</a>').join('');
 return '<section class="day103-navigation" id="day103-navigation" tabindex="-1"'
   +' aria-label="Schnellnavigation zum Tagesablauf">'
   +'<details class="day103-picker"><summary>'+icon('calendar')
   +'<span>Tag auswählen</span><strong>'+days.find(d=>d.selected).index
   +' / '+days.length+'</strong>'+icon('chevron')+'</summary>'
   +'<div class="day103-picker-list" role="group" aria-label="Reisetag auswählen">'
   +buttons+'</div></details>'
   +'<nav class="day103-jump-links" aria-label="Zu einem Abschnitt springen">'
   +links+'</nav></section>';
}
export function renderDayReturnV103(ctx){
 if(!dayJumpRowsV103(ctx).length)return '';
 return '<div class="day103-return"><a class="day103-jump-link" href="#day103-navigation">'
  +icon('chevron')+'Zur Tagesauswahl zurück</a></div>';
}
