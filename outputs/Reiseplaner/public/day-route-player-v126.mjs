// One presentation clock. Durations below are preview time, never real ETAs.
import {esc} from './ui.mjs';
import {itineraryPhotoHtmlV112} from './place-profile.mjs';
import {validPoint} from './map-explorer.mjs';
import {footpathMatchesStops} from './route-studio.mjs';

export function dayTimelineV126(model){
 const rows=[];let cursor=0;
 const add=(kind,index,duration,leg=null)=>{const row={kind,index,start:cursor,end:cursor+duration,duration,leg};rows.push(row);cursor=row.end;};
 for(const [index,stop] of (model?.stops??[]).entries()){
  if(index){
   const leg=model.legs[index-1];
   const valid=leg?.type==='routed'&&footpathMatchesStops(model.stops[index-1],stop,{...leg,walkOnly:true})&&Number.isFinite(leg.minutes)&&leg.minutes>=0;
   add(valid?'walk':leg?.type==='transfer'?'transfer':leg?.type==='same'?'same':'gap',index,valid?Math.max(1000,Math.min(4200,leg.minutes*85)):650,leg);
  }
  add('stop',index,2100);
 }
 return {rows,duration:cursor};
}
export function dayPositionV126(timeline,ms){
 if(!timeline?.rows.length||!Number.isFinite(ms))return null;
 const time=Math.max(0,Math.min(timeline.duration,ms));
 const row=timeline.rows.find(r=>time<r.end)??timeline.rows.at(-1);
 return {...row,time,fraction:Math.max(0,Math.min(1,(time-row.start)/row.duration))};
}
export function dayStopTimeV126(timeline,index){return timeline?.rows.find(r=>r.kind==='stop'&&r.index===index)?.start??null;}
const distances=new WeakMap();
const metres=(a,b)=>{const rad=Math.PI/180;const h=Math.sin((b[0]-a[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2;return 12742000*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));};
export function routeSampleV126(points,fraction){
 if(!Array.isArray(points)||points.length<2||!Number.isFinite(fraction))return null;
 let data=distances.get(points);
 if(!data){if(!points.every(validPoint))return null;const cumulative=[0];for(let i=1;i<points.length;i++)cumulative.push(cumulative[i-1]+metres(points[i-1],points[i]));data={cumulative,total:cumulative.at(-1)};distances.set(points,data);}
 const {cumulative,total}=data;const f=Math.max(0,Math.min(1,fraction));
 if(f===0||total===0)return points[0];if(f===1)return points.at(-1);
 const target=total*f;let lo=1,hi=cumulative.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<target)lo=mid+1;else hi=mid;}
 const i=lo,a=points[i-1],b=points[i],length=cumulative[i]-cumulative[i-1],t=length?(target-cumulative[i-1])/length:0;
 return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}
export function dayRouteSummaryV126(model){
 const walks=(model?.legs??[]).filter(l=>l.type==='routed'&&Number.isFinite(l.minutes)&&l.minutes>=0);
 return {walks:walks.length,minutes:walks.reduce((n,l)=>n+l.minutes,0),metres:walks.every(l=>Number.isFinite(l.metres)&&l.metres>=0)?walks.reduce((n,l)=>n+l.metres,0):null,open:(model?.legs??[]).filter(l=>['gap','schematic','connection'].includes(l.type)).length};
}
export function daySceneHtmlV126(ctx,model,index){
 const stop=model?.stops[index];if(!stop)return '';
 const item=(ctx.all??[]).find(x=>x.id===stop.sourceId),leg=model.legs[index-1];
 const photo=item?itineraryPhotoHtmlV112(item,ctx,{context:false}):'';
 const route=leg?.type==='routed'?'Berechneter Fußweg · '+leg.minutes+' Min.'+(Number.isFinite(leg.metres)?' · '+(leg.metres/1000).toLocaleString('de-DE',{maximumFractionDigits:2})+' km':''):leg?.type==='transfer'?'Transfer · Weg und Fahrplan nicht bestätigt':leg?.type==='same'?'Gleicher Kartenpunkt':leg?'Verbindung offen · keine berechnete Gehzeit':'Start des Tages';
 return '<div class="day126-scene">'+(photo||'')+'<div><small>'+esc(stop.time)+'</small><h3>'+esc(stop.name)+'</h3><p>'+esc(route)+'</p><p>'+esc(Number.isFinite(stop.minutes)?stop.minutes+' Min. geplanter Aufenthalt':'Aufenthaltsdauer offen')+'</p>'+(item?'<button type="button" data-action="details" data-value="'+esc(item.id)+'">Ortsdetails öffnen</button>':'')+'</div></div>';
}
export function dayTimelineHtmlV126(model){
 const {duration}=dayTimelineV126(model),s=dayRouteSummaryV126(model);
 return '<section class="day126-timeline"><div class="day126-summary"><span>'+s.walks+' berechnete Fußwege</span><span>'+ (s.walks?Math.round(s.minutes)+' Min. bekannte Gehzeit':'Gehzeit offen')+'</span><span>'+s.open+' offene Verbindungen</span></div><label for="day126-time">Vorschauzeit <output id="day126-clock">0 / '+Math.ceil(duration/1000)+' s</output></label><input id="day126-time" type="range" min="0" max="'+Math.max(1,duration)+'" step="1" value="0" '+(!duration?'disabled':'')+'><div id="day126-scene"></div><p>Vorschauzeit ist keine Reisezeit. Nur berechnete Fußwege werden entlang ihrer Geometrie animiert.</p></section>';
}
