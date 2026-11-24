import {editorialCityPhotoV119,photoCropV120} from './place-profile.mjs';
import {esc,shortDay} from './ui.mjs';
import {localParts} from './model.mjs';

// The existing map player's current index and phase are the only playback clock.
export function routePreviewDayV122(ctx,state){
 const days=(ctx?.trip?.dayPlansV32??[]).filter(d=>d.city===state?.cityId);
 if(!days.length)return null;
 const fraction=Number.isFinite(state.phaseProgress)?Math.max(0,Math.min(1,state.phaseProgress)):0;
 return days[state.phase==='travel'?days.length-1:Math.min(days.length-1,Math.floor(fraction*days.length))];
}
export function routePreviewModelV122(ctx,state){
 if(!ctx?.trip||!state?.cityId||!ctx.trip.route.includes(state.cityId))return null;
 const city=state.cityId,all=ctx.all??ctx.trip.items??[];
 const days=(ctx.trip.dayPlansV32??[]).filter(d=>d.city===city);
 const next=state.routeOverview?.[state.index+1]?.id??null;
 const day=routePreviewDayV122(ctx,state);
 const editorial=editorialCityPhotoV119({...ctx,dayPlan:day,date:day?.date},city,{day:!!day});
 const ids=new Set((day?.slots??[]).map(s=>s.id));
 const activities=all.filter(i=>ids.has(i.id)&&i.city===city&&i.kind==='activity'&&!i.mealSlot&&!i.removed&&!i.duplicateOf).slice(0,3);
 // Only a unique, explicit archived point-to-point transport record qualifies.
 const legs=next?(ctx.trip.items??[]).filter(i=>i.kind==='transport'&&i.city===city&&i.toCity===next&&!i.removed&&!i.duplicateOf
  &&typeof i.start==='string'&&typeof i.end==='string'&&Date.parse(i.end)>Date.parse(i.start)): [];
 const leg=legs.length===1?legs[0]:null;
 let reference=null;
 if(leg){
  try{
   if(leg.zone){const from=localParts(leg.start,leg.zone),to=localParts(leg.end,leg.endZone??leg.zone);
   if(from.date&&to.date)reference={from,to,minutes:Math.round((Date.parse(leg.end)-Date.parse(leg.start))/60000)};}
  }catch{/* invalid archived zone is not a confirmed reference */}
 }
 return {city,days,day,activities,editorial,next,reference,phase:state.phase};
}
export function routePreviewHtmlV122(ctx,state){
 const m=routePreviewModelV122(ctx,state);if(!m)return '';
 const {photo,item}=m.editorial??{};
 const media=photo?'<div class="route122-media photo119-map-rail"><figure class="photo119-item" data-photo120-crop="'+photoCropV120(item,photo)+'"><a href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Ortsfoto vergrößern"><img src="'+esc(photo.url.replace(/\?width=960$/,'?width=640'))+'" alt="'+esc(item.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a><figcaption><small>'+esc(photo.credit)+'</small> <a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Quelle</a></figcaption></figure></div>':'';
 const ref=m.reference;
 const travel=m.phase==='travel'&&m.next?'<p class="route122-travel"><strong>Weiter nach '+esc(ctx.cities?.[m.next]?.name??m.next)+'</strong><br>'+(ref?'Archiv '+esc(ref.from.date)+' · '+esc(ref.from.time)+' → '+esc(ref.to.date)+' · '+esc(ref.to.time)+' · '+Math.floor(ref.minutes/60)+' h '+ref.minutes%60+' min · Fahrplan 2027 offen':'Fahrtzeit offen · keine bestätigte Verbindung')+'</p>':'';
 return '<div class="route122-scene" data-route122-city="'+esc(m.city)+'" data-route122-day="'+esc(m.day?.date??'')+'">'+media+'<div class="route122-copy"><strong>'+esc(ctx.cities?.[m.city]?.name??m.city)+'</strong>'
  +(m.day?'<small class="route122-day-label">Tag '+(m.days.indexOf(m.day)+1)+' / '+m.days.length+' · '+esc(shortDay(m.day.date))+'</small>':'<small>Tageszuordnung offen</small>')
  +(m.days.length?'<div class="route122-dates">'+m.days.map(d=>'<button type="button" data-action="day-plan-go" data-value="'+esc(d.date)+'"'+(d===m.day?' aria-current="date"':'')+'>'+esc(shortDay(d.date))+'</button>').join('')+'</div>':'')
  +(m.activities.length?'<ul>'+m.activities.map(i=>'<li><button type="button" data-action="details" data-value="'+esc(i.id)+'">'+esc(i.name)+'</button></li>').join('')+'</ul>':'<small>Keine Aktivitäten für diesen Tagesentwurf hinterlegt.</small>')
  +travel+'</div></div>';
}
