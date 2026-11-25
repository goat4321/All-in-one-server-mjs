import {esc,shortDay} from './ui.mjs';
import {explorerMediaHtmlV125} from './route-explorer-v125.mjs';
import {routePreviewDayV122,routePreviewModelV122} from './route-preview-v122.mjs';
import {photoCropV120,editorialCityPhotoV119} from './place-profile.mjs';
const periods={morning:'Vormittag',noon:'Mittag',afternoon:'Nachmittag',evening:'Abend'};
export const exactPreviewPointV123=item=>{
 const p=item?.point;
 return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180&&p.some(Boolean)
 &&item.locationReferenceV07?.exactKnown===true&&item.geoEvidence?.isCentroid!==true
 &&!['sourced_area_center','provider_reported_unverified'].includes(item.locationReferenceV07?.precision)
 &&item.pointPrecision!=='unverified_or_not_single_location'?p:null;
};
const stopCache=new WeakMap();
export function immersiveSceneV123(ctx,state){
 const day=routePreviewDayV122(ctx,state);
 const days=(ctx?.trip?.dayPlansV32??[]).filter(d=>d.city===state?.cityId);
 let cache=stopCache.get(ctx);if(!cache){cache={all:new Map((ctx?.all??ctx?.trip?.items??[]).map(i=>[i.id,i])),days:new Map()};stopCache.set(ctx,cache);}
 const dayKey=state?.cityId+'|'+(day?.date??'');
 let stops=cache.days.get(dayKey);
 if(!stops){stops=(day?.slots??[]).flatMap(s=>{
  const item=cache.all.get(s.id);
  if(!item||item.removed||item.duplicateOf||item.city!==state.cityId||item.kind!=='activity'||item.mealSlot||s.optional&&!ctx.activeSet?.has(s.id))return [];
  return [{id:s.id,name:item.name,period:periods[s.period]??'Flexibel',minutes:Number.isFinite(s.minutes)?s.minutes:null,point:exactPreviewPointV123(item)}];
 });cache.days.set(dayKey,stops);}
 const progress=Math.max(0,Math.min(1,Number(state?.phaseProgress)||0));
 const dayIndex=Math.max(0,days.indexOf(day));
 const local=Math.max(0,Math.min(1,progress*days.length-dayIndex));
 const index=state?.phase==='travel'?-1:Math.min(stops.length-1,Math.floor(local*stops.length));
 return {day,days,stops,index,stop:stops[index]??null,contentKey:[state?.index,state?.cityId,state?.phase,day?.date].join('|'),key:[state?.index,state?.cityId,state?.phase,day?.date,index].join('|')};
}
export function immersiveHtmlV123(ctx,state,scene=immersiveSceneV123(ctx,state)){
 const model=routePreviewModelV122(ctx,state);if(!model)return '';
 const title=ctx.cities?.[model.city]?.name??model.city;
 const travel=state.phase==='travel'&&model.next;
 const ref=model.reference;
 return '<section class="route123-scene" data-route123-key="'+esc(scene.key)+'">'
  +'<div class="route123-hero">'+explorerMediaHtmlV125(ctx,scene,model.editorial)+'</div><div class="route123-heading"><small>'+esc(travel?'UNTERWEGS NACH '+(ctx.cities?.[model.next]?.name??model.next):'ETAPPE '+(state.index+1)+' / '+state.total)+'</small><h2>'+esc(title)+'</h2>'
  +(scene.day?'<p>'+esc(shortDay(scene.day.date))+' · Tag '+(scene.days.indexOf(scene.day)+1)+' / '+scene.days.length+'</p>':'<p>Tageszuordnung offen</p>')+'</div>'
  +(travel?'<p class="route123-transfer">'+(ref?'Archivreferenz: '+esc(ref.from.date)+' '+esc(ref.from.time)+' → '+esc(ref.to.date)+' '+esc(ref.to.time)+' · '+ref.minutes+' Min. · aktueller Fahrplan offen':'Fahrtzeit offen · schematische Städteverbindung')+'</p>':'')
  +'<ol class="route123-timeline" aria-label="Tagesentwurf">'+scene.stops.map((s,i)=>'<li'+(i===scene.index?' aria-current="step"':'')+'><span>'+esc(s.period)+(s.minutes!==null?' · '+s.minutes+' Min.':'')+'</span><button type="button" data-action="details" data-value="'+esc(s.id)+'">'+esc(s.name)+'</button><button type="button" class="route124-stop-seek" data-action="route124-stop" data-value="'+i+'" aria-label="Zu '+esc(s.name)+' springen" aria-pressed="'+(i===scene.index)+'">Zum Stopp</button><small>'+(s.point?'Belegter Orts-Pin':'Position offen')+'</small></li>').join('')+'</ol>'
  +(scene.day?'<button type="button" class="route123-day-open" data-action="route123-day" data-value="'+esc(scene.day.date)+'">Detaillierte Tagesroute öffnen</button>':'')
  +'<p class="route123-note">Vorschau des Tagesentwurfs · keine Live-Position oder bestätigte Buchung.</p></section>';
}

export function previewDayTargetsV124(ctx,state){
 const days=ctx?.trip?.dayPlansV32??[],route=state.routeOverview??[],timeline=state.timeline??[];
 return days.flatMap(day=>{
  const current=route[state.index]?.id===day.city?state.index:-1;
  const index=current>=0?current:route.findIndex(s=>s.id===day.city);
  const row=timeline[index];if(!row)return [];
  const matching=days.filter(d=>d.city===day.city);
  return [{date:day.date,city:day.city,ms:row.start+row.dwell*(matching.indexOf(day)+.001)/matching.length}];
 });
}
// Seek to the centre of the requested slot, avoiding floating point day boundaries.
export function previewStopTargetV124(state,scene,index){
 const row=state?.timeline?.[state.index],dayIndex=scene?.days?.indexOf(scene.day)??-1;
 if(!row||dayIndex<0||!Number.isInteger(index)||index<0||index>=scene.stops.length)return null;
 return row.start+row.dwell*(dayIndex+(index+.5)/scene.stops.length)/scene.days.length;
}
export const previewPhotoUrlV124=photo=>photo?.url?.replace(/\?width=960$/,'?width=1440')??null;
export function upcomingPhotoV124(ctx,state,scene){
 const nextDay=scene.days[scene.days.indexOf(scene.day)+1];
 const city=nextDay?state.cityId:state.routeOverview?.[state.index+1]?.id;
 if(!city)return null;
 const day=nextDay??(ctx.trip.dayPlansV32??[]).find(d=>d.city===city);
 const editorial=editorialCityPhotoV119({...ctx,dayPlan:day,date:day?.date},city,{day:!!day});
 return previewPhotoUrlV124(editorial?.photo);
}
export function formatPreviewTimeV124(ms){
 const seconds=Math.max(0,Math.floor((Number(ms)||0)/1000));
 return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}
