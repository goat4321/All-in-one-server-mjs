import {esc,shortDay} from './ui.mjs';
import {routePreviewDayV122,routePreviewModelV122} from './route-preview-v122.mjs';
import {photoCropV120} from './place-profile.mjs';
const periods={morning:'Vormittag',noon:'Mittag',afternoon:'Nachmittag',evening:'Abend'};
export const exactPreviewPointV123=item=>{
 const p=item?.point;
 return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180&&p.some(Boolean)
 &&item.locationReferenceV07?.exactKnown===true&&item.geoEvidence?.isCentroid!==true
 &&!['sourced_area_center','provider_reported_unverified'].includes(item.locationReferenceV07?.precision)
 &&item.pointPrecision!=='unverified_or_not_single_location'?p:null;
};
export function immersiveSceneV123(ctx,state){
 const day=routePreviewDayV122(ctx,state);
 const days=(ctx?.trip?.dayPlansV32??[]).filter(d=>d.city===state?.cityId);
 const all=new Map((ctx?.all??ctx?.trip?.items??[]).map(i=>[i.id,i]));
 const stops=(day?.slots??[]).flatMap(s=>{
  const item=all.get(s.id);
  if(!item||item.removed||item.duplicateOf||item.city!==state.cityId||item.kind!=='activity'||item.mealSlot||s.optional&&!ctx.activeSet?.has(s.id))return [];
  return [{id:s.id,name:item.name,period:periods[s.period]??'Flexibel',minutes:Number.isFinite(s.minutes)?s.minutes:null,point:exactPreviewPointV123(item)}];
 });
 const progress=Math.max(0,Math.min(1,Number(state?.phaseProgress)||0));
 const dayIndex=Math.max(0,days.indexOf(day));
 const local=Math.max(0,Math.min(1,progress*days.length-dayIndex));
 const index=state?.phase==='travel'?-1:Math.min(stops.length-1,Math.floor(local*stops.length));
 return {day,days,stops,index,stop:stops[index]??null,key:[state?.index,state?.cityId,state?.phase,day?.date,index].join('|')};
}
export function immersiveHtmlV123(ctx,state,scene=immersiveSceneV123(ctx,state)){
 const model=routePreviewModelV122(ctx,state);if(!model)return '';
 const {photo,item}=model.editorial??{};
 const title=ctx.cities?.[model.city]?.name??model.city;
 const travel=state.phase==='travel'&&model.next;
 const ref=model.reference;
 return '<section class="route123-scene" data-route123-key="'+esc(scene.key)+'">'
  +'<div class="route123-hero" data-photo120-crop="'+photoCropV120(item,photo)+'">'
  +(photo?'<figure class="photo119-item"><a href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Ortsfoto vergrößern"><img src="'+esc(photo.url.replace(/\?width=960$/,'?width=1440'))+'" alt="'+esc(item.name)+'" decoding="async" referrerpolicy="no-referrer"></a><figcaption><small>'+esc(photo.credit)+'</small> <a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a></figcaption></figure>':'<p class="route123-no-photo">Kein zugeordnetes Ortsfoto</p>')
  +'</div><div class="route123-heading"><small>'+esc(travel?'UNTERWEGS NACH '+(ctx.cities?.[model.next]?.name??model.next):'ETAPPE '+(state.index+1)+' / '+state.total)+'</small><h2>'+esc(title)+'</h2>'
  +(scene.day?'<p>'+esc(shortDay(scene.day.date))+' · Tag '+(scene.days.indexOf(scene.day)+1)+' / '+scene.days.length+'</p>':'<p>Tageszuordnung offen</p>')+'</div>'
  +(travel?'<p class="route123-transfer">'+(ref?'Archivreferenz: '+esc(ref.from.date)+' '+esc(ref.from.time)+' → '+esc(ref.to.date)+' '+esc(ref.to.time)+' · '+ref.minutes+' Min. · aktueller Fahrplan offen':'Fahrtzeit offen · schematische Städteverbindung')+'</p>':'')
  +'<ol class="route123-timeline" aria-label="Tagesentwurf">'+scene.stops.map((s,i)=>'<li'+(i===scene.index?' aria-current="step"':'')+'><span>'+esc(s.period)+(s.minutes!==null?' · '+s.minutes+' Min.':'')+'</span><button type="button" data-action="details" data-value="'+esc(s.id)+'">'+esc(s.name)+'</button><small>'+(s.point?'Belegter Orts-Pin':'Position offen')+'</small></li>').join('')+'</ol>'
  +(scene.day?'<button type="button" class="route123-day-open" data-action="route123-day" data-value="'+esc(scene.day.date)+'">Detaillierte Tagesroute öffnen</button>':'')
  +'<p class="route123-note">Vorschau des Tagesentwurfs · keine Live-Position oder bestätigte Buchung.</p></section>';
}
