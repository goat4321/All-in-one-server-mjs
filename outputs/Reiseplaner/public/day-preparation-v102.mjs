import {esc,icon,shortDay} from './ui.mjs';
import {SWISS_DAY_EDITORIAL_V85} from './swiss-day-editorial-v85.mjs';

const editorial=new Map(SWISS_DAY_EDITORIAL_V85.map(day=>[day.date,day]));
export const PREPARATION_ITEMS_V102=Object.freeze([
 {id:'connection',label:'Verbindungen und Reservierungen prüfen',hint:'Nur bei vorhandenen Transfers relevant. Fahrpläne für 2027 bleiben ungeprüft.'},
 {id:'accommodation',label:'Unterkunft und Anreiseweg prüfen',hint:'Check-in, Gepäck und Weg zur Unterkunft kontrollieren; keine Buchungsbestätigung.'},
 {id:'access',label:'Öffnung, Zugang oder Wanderweg prüfen',hint:'Betreiberstatus, Saison und gegebenenfalls Wetter beachten.'},
 {id:'food',label:'Verpflegung und Proviant planen',hint:'Einkauf, Wasser und gegebenenfalls verfügbare Küche abklären.'},
 {id:'backup',label:'Zeitpuffer und Alternative durchgehen',hint:'Verspätung oder Schlechtwetter einplanen.'}
]);
const valid=new Set(PREPARATION_ITEMS_V102.map(item=>item.id));
export const preparationStorageKeyV102=(tripId,date)=>
 'reiseplan-day-preparation-v102:'+tripId+':'+date;
export function readPreparationV102(storage,tripId,date){
 if(tripId!=='interrail_swiss'||!/^(2027-09-(0[1-9]|1[0-4]))$/.test(date))return [];
 try{
  const raw=JSON.parse(storage?.getItem(preparationStorageKeyV102(tripId,date))??'[]');
  return Array.isArray(raw)?[...new Set(raw.filter(v=>valid.has(v)))]:[];
 }catch{return []}
}
export function togglePreparationV102(storage,tripId,date,id){
 if(!valid.has(id)||tripId!=='interrail_swiss'||!editorial.has(date))return null;
 const set=new Set(readPreparationV102(storage,tripId,date));
 if(set.has(id))set.delete(id);else set.add(id);
 const next=[...set];
 try{storage?.setItem(preparationStorageKeyV102(tripId,date),JSON.stringify(next));}
 catch{return null}
 return next;
}
export function preparationModelV102(ctx){
 if(ctx?.trip?.id!=='interrail_swiss'||ctx.trip.travellers!==3
    ||ctx.dayPlan?.date!==ctx.date||ctx.dayPlan?.tripId!=='interrail_swiss')return null;
 const day=editorial.get(ctx.date);
 if(!day||day.city!==ctx.dayPlan.city)return null;
 const done=new Set(ctx.preparationDone??[]);
 const transfers=(ctx.dayPlan.rides??[]).map(t=>({
  from:t.from,to:t.to,departure:t.departure??null,
  arrival:t.arrival??null
 }));
 return {date:ctx.date,day,transfers,
  items:PREPARATION_ITEMS_V102.map(item=>({...item,done:done.has(item.id)})),
  count:PREPARATION_ITEMS_V102.filter(item=>done.has(item.id)).length};
}
export function preparationTextV102(ctx){
 const model=preparationModelV102(ctx);
 if(!model)return '';
 const lines=['Interrail mit Schweiz · '+shortDay(model.date),
  ctx.dayPlan.title,'Unverbindliche Planung, keine bestätigten Fahrpläne oder Buchungen.'];
 for(const [i,block] of model.day.blocks.entries()){
  lines.push(['Morgen','Mittag','Abend'][i]+': '+block.title+' – '+block.detail);
 }
 if(model.transfers.length){
  lines.push('Vorläufige Transfers:');
  for(const t of model.transfers)
   lines.push(t.from+' → '+t.to+' (Plan '+(t.departure??'Zeit offen')
     +' – '+(t.arrival??'Zeit offen')+', 2027 ungeprüft)');
 }
 lines.push('Verpflegung: '+model.day.food,'Zeitpuffer: '+model.day.buffer,
  'Alternative: '+model.day.alternative,'Quellen:');
 for(const [name,url] of model.day.sources)lines.push(name+': '+url);
 return lines.join('\n');
}
export function renderDayPreparationV102(ctx){
 const model=preparationModelV102(ctx);
 if(!model)return '';
 const buttons=model.items.map(item=>
  '<li><button type="button" class="day102-check'+(item.done?' is-done':'')+'"'
    +' data-action="day-preparation-toggle" data-value="'+item.id+'"'
    +' aria-pressed="'+item.done+'" aria-label="'+esc(item.label)
    +(item.done?', persönlich geprüft':', noch nicht abgehakt')+'">'
    +'<span class="day102-check-symbol">'+icon(item.done?'check':'plus')+'</span>'
    +'<span class="day102-check-label"><strong>'+esc(item.label)+'</strong>'
    +'<small>'+esc(item.hint)+'</small></span></button></li>').join('');
 const rides=model.transfers.length?'<div class="day102-rides"><strong>'
   +icon('train')+' Vorläufige Transfers</strong><ul>'
   +model.transfers.map(t=>'<li><span>'+esc(t.from)+' → '+esc(t.to)+'</span>'
      +'<small>Plan '+esc(t.departure??'Zeit offen')+' – '
      +esc(t.arrival??'Zeit offen')+' · nicht für 2027 bestätigt</small></li>').join('')
   +'</ul></div>':'';
 return '<section class="day102-preparation" id="day103-preparation" tabindex="-1" aria-label="Persönliche Vorbereitung für diesen Tag">'
    +'<header class="day102-preparation-head"><div><small>VORBEREITUNG · PERSÖNLICHE LISTE</small>'
    +'<h2>Was ist vor diesem Tag zu klären?</h2>'
    +'<p>Ein Haken bedeutet nur, dass du den Punkt für dich geprüft hast.'
    +' Er ist kein Nachweis für eine Buchung, Öffnung oder Reservierung.</p></div>'
    +'<div class="day102-count" aria-live="polite">'
    +'<strong>'+model.count+' / '+model.items.length+'</strong><span>geprüft</span></div></header>'
    +'<div class="day102-meter" role="progressbar" aria-label="Persönlich geprüfte Tagesaufgaben"'
    +' aria-valuemin="0" aria-valuemax="'+model.items.length+'" aria-valuenow="'+model.count+'">'
    +'<i style="width:'+(model.count/model.items.length*100)+'%"></i></div>'
    +'<ul class="day102-checklist">'+buttons+'</ul>'
    +rides
    +'<div class="day102-actions"><button type="button" class="day102-copy"'
    +' data-action="day-preparation-copy">'+icon('copy')+'Tagesablauf mit Quellen kopieren</button>'
    +'<span class="day102-copy-result" aria-live="polite"></span></div></section>';
}
