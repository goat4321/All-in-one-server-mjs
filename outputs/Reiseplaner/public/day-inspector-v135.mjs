import {esc,btn} from './ui.mjs';
import {groupPrice,money} from './model.mjs';
import {timelineMovesV105} from './day-plans-logic.mjs';
const editable=i=>i?.kind==='activity'&&!i.start&&!i.end&&!i.instant&&!i.booked&&!i.locked&&!i.removed&&!i.duplicateOf&&!i.readOnlyExternal&&!i.mealSlot&&!i.role;
const duration=i=>Number.isInteger(i.duration)&&i.duration>0&&i.duration<=2880?i.duration:null;
export function dayInspectorModelV135(ctx,warnings=[]){
 const rows=[],seen=new Set(),totals=new Map();
 let minutes=0,unknownDuration=0,unknownPrice=0;
 for(const i of ctx.fullDay??ctx.day??[]){
  if(i.kind!=='activity'||i.removed||i.duplicateOf||i.mealSlot||seen.has(i.id))continue;
  seen.add(i.id);
  const mins=duration(i);if(mins===null)unknownDuration++;else minutes+=mins;
  const price=i.effectivePrice??i.price,count=ctx.people?.length??0,amount=count>0?groupPrice(price,count):null;
  if(amount===null||!Number.isSafeInteger(amount)||amount<0||!['EUR','CHF'].includes(price?.currency))unknownPrice++;
  else totals.set(price.currency,(totals.get(price.currency)??0)+amount);
  rows.push({id:i.id,name:i.name,minutes:mins,editable:editable(i)&&Boolean(ctx.activeSet?.has(i.id)),moves:timelineMovesV105(ctx,i.id)});
 }
 return {rows,totals:[...totals],minutes,unknownDuration,unknownPrice,warnings:[...new Set(warnings.map(w=>w.text).filter(Boolean))]};
}
export function editDayDurationV135(ctx,id,delta){
 const i=(ctx.fullDay??ctx.day??[]).find(i=>i.id===id);
 if(!editable(i)||!ctx.activeSet?.has(id)||![15,-15].includes(delta)||duration(i)===null)return {ok:false,reason:'Nur flexible, bereits eingeplante Aktivitäten mit bekannter Dauer und ohne feste Uhrzeit ändern.'};
 const next=duration(i)+delta;
 if(next<15||next>480)return {ok:false,reason:'Hier sind 15–480 Minuten möglich. Weitere Dauer im Ortsdetail bearbeiten.'};
 return {ok:true,edits:{...ctx.state.edits,[id]:{...ctx.state.edits?.[id],duration:next}}};
}
export function renderDayInspectorV135(ctx,warnings=[]){
 if(!ctx.dayPlan)return '';
 const m=dayInspectorModelV135(ctx,warnings);
 return '<section class="day135-inspector" aria-label="Planungscheck"><header><small>DEIN GESPEICHERTER TAG</small><h2>Planungscheck</h2><p>Nur gespeicherte Aktivitäten; Entwürfe, Verpflegung, Unterkunft und Transfers werden hier nicht addiert.</p></header>'
 +'<div class="day135-metrics"><span><strong>'+m.rows.length+'</strong> Aktivitäten</span><span><strong>'+m.minutes+' Min.</strong> bekannte Aufenthalte'+(m.unknownDuration?' · '+m.unknownDuration+' offen':'')+'</span><span><strong>'+esc(m.totals.map(([c,v])=>money(v,c)).join(' + ')||'Offen')+'</strong> bekannte Aktivitätskosten der Gruppe'+(m.unknownPrice?' · '+m.unknownPrice+' offen':'')+'</span></div>'
 +(m.warnings.length?'<details open class="day135-warnings"><summary>'+m.warnings.length+' Hinweise zu Zeiten und Zugang</summary><ul>'+m.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul></details>':'<p>Keine Hinweise aus der aktuellen Konfliktprüfung. Unbekannte Wege, Zeiten und Öffnung bleiben ungeprüft.</p>')
 +'<details class="day135-edit"><summary>Aufenthaltsdauer und Reihenfolge bearbeiten</summary>'
 +(m.rows.map(r=>'<div class="day135-row"><div><strong>'+esc(r.name)+'</strong><small>'+esc(r.minutes===null?'Dauer offen':r.minutes+' Min. geplant')+'</small></div><div class="day135-actions">'
 +(r.editable&&r.minutes!==null?[-15,15].map(d=>'<button type="button" data-action="day135-duration" data-value="'+esc(JSON.stringify([r.id,d]))+'" aria-label="'+esc(r.name+' '+(d<0?'15 Minuten kürzer':'15 Minuten länger'))+'"'+(r.minutes+d<15||r.minutes+d>480?' disabled':'')+'>'+ (d>0?'+15':'−15')+' min</button>').join(''):'')
 +(r.moves.previous?btn('day-timeline-move','Früher','arrow',JSON.stringify([r.id,r.moves.previous]),'subtle'):'')
 +(r.moves.next?btn('day-timeline-move','Später','arrow',JSON.stringify([r.id,r.moves.next]),'subtle'):'')
 +btn('details','Details','folder',r.id,'subtle')+'</div></div>').join('')||'<p>Noch keine Aktivitäten übernommen.</p>')+'</details></section>';
}
