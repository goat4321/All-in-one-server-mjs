import {esc,shortDay,icon} from './ui.mjs';
import {SWISS_DAY_EDITORIAL_V85} from './swiss-day-editorial-v85.mjs';

/**
 * V100 – Always-visible day-by-day overview for the existing Interrail Swiss
 * trip. Uses ONLY the 14 V32 plans and V85 editorial blocks already in the
 * repository. Does not create active items, bookings, budgets or fake times.
 */
const byDate=new Map(SWISS_DAY_EDITORIAL_V85.map(day=>[day.date,day]));
const periods={morning:'Morgen',noon:'Mittag',evening:'Abend'};
const isSwiss=ctx=>ctx?.trip?.id==='interrail_swiss'
  &&ctx.trip.travellers===3
  &&ctx.trip.from==='2027-09-01'
  &&ctx.trip.to==='2027-09-14';

export function swiss14DayRowsV100(ctx){
 if(!isSwiss(ctx))return [];
 const plans=ctx.trip.dayPlansV32??[];
 if(plans.length!==14)return [];
 const rows=plans.map((plan,index)=>{
  const editorial=byDate.get(plan.date);
  if(!editorial||editorial.city!==plan.city||editorial.blocks.length!==3)return null;
  return {date:plan.date,city:plan.city,index:index+1,title:plan.title,
   blocks:editorial.blocks,
   rides:plan.rides?.length??0,
   slots:plan.slots?.length??0,
   current:ctx.date===plan.date};
 });
 return rows.every(Boolean)?rows:[];
}

/** An open overview, not a collapsed detail element; all 14 dates accessible. */
export function renderSwiss14DayOverviewV100(ctx){
 const rows=swiss14DayRowsV100(ctx);
 if(rows.length!==14)return '';
 const cards=rows.map(row=>{
  const city=ctx.cities?.[row.city]?.name??row.city;
  const pieces=row.blocks.map(block=>
   '<li><span>'+esc(periods[block.period]??block.period)+'</span>'
    +'<strong>'+esc(block.title)+'</strong></li>').join('');
  return '<li class="swiss-14-day-card'+(row.current?' is-current':'')+'">'
    +'<button type="button" data-action="day-plan-go" data-value="'+esc(row.date)+'"'
    +' aria-label="Tag '+row.index+', '+esc(row.date)+': '+esc(row.title)
    +'. Tagesplan öffnen">'
    +'<span class="swiss-14-day-top"><span class="swiss-14-day-index">'
    +String(row.index).padStart(2,'0')+'</span>'
    +'<span class="swiss-14-day-date">'+esc(shortDay(row.date))+'</span></span>'
    +'<span class="swiss-14-day-city">'+esc(city)+'</span>'
    +'<strong class="swiss-14-day-title">'+esc(row.title)+'</strong>'
    +'<span class="swiss-14-day-parts"><span>Morgen</span><span>Mittag</span>'
    +'<span>Abend</span></span>'
    +'<ol class="swiss-14-day-blocks">'+pieces+'</ol>'
    +'<span class="swiss-14-day-foot">'
    +(row.rides?icon('train')+' Vorläufiger Transfer':'Ideen für diesen Tag')
    +(row.slots?' · '+row.slots+' optionale Aktivitäten':' · ohne zusätzliche Pflichtaktivitäten')
    +'</span></button></li>';
 }).join('');
 return '<section class="swiss-14-day-overview" id="interrail-schweiz-tagesplaene"'
    +' aria-label="Alle vierzehn Tagespläne Interrail mit Schweiz">'
    +'<header class="swiss-14-day-heading"><span>INTER RAIL · SCHWEIZ-VARIANTE</span>'
    +'<h2>14 Tage. Jeder Tag im Blick.</h2>'
    +'<p>Paris, Barcelona, Sète, Nizza, Kandersteg und Appenzell –'
    +' vom 1. bis 14. September 2027 für drei Reisende.'
    +' Tippe auf einen Tag, um den vollständigen Ablauf, Quellen und'
    +' vorhandene übernehmbare Aktivitäten anzusehen.</p></header>'
    +'<ol class="swiss-14-day-grid">'+cards+'</ol>'
    +'<p class="swiss-14-day-caveat">'
    +'Unverbindliche Tagesideen aus der bestehenden Reiseplanung.'
    +' Keine bestätigten Zugzeiten, Preise oder Buchungen; Aktivitäten werden'
    +' nicht automatisch übernommen. Reisevariante und gespeicherte Einträge bleiben unverändert.'
    +'</p></section>';
}

/** Top-of-day glance; the sourced three-block V85 panel stays intact below. */
export function renderSwissDayBriefV100(ctx){
 if(!isSwiss(ctx)||!ctx.dayPlan)return '';
 const day=byDate.get(ctx.date);
 if(!day||ctx.dayPlan.date!==day.date||ctx.dayPlan.city!==day.city)return '';
 const blocks=day.blocks.map(block=>
  '<div class="swiss-today-step"><small>'+esc(periods[block.period]??block.period)
    +'</small><strong>'+esc(block.title)+'</strong></div>').join('');
 return '<section class="swiss-today-brief" aria-label="Vorschlag für diesen Interrail-Tag">'
  +'<div class="swiss-today-heading"><div><small>DEIN HEUTIGER ENTWURF · SCHWEIZ-VARIANTE</small>'
  +'<strong>'+esc(ctx.dayPlan.title)+'</strong></div>'
  +'<span>'+esc(shortDay(ctx.date))+'</span></div>'
  +'<div class="swiss-today-steps">'+blocks+'</div>'
  +'<p>Ohne feste Uhrzeiten oder automatische Buchungen.'
  +' Der ausführliche Tagesablauf mit Transfers, Alternativen und Quellen steht weiter unten.</p>'
  +'</section>';
}
