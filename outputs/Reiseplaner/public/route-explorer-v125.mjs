import {esc} from './ui.mjs';
import {itineraryPhotosV112,editorialPhotoScoreV119,photoCropV120,editorialCityPhotoV119} from './place-profile.mjs';
import {money} from './model.mjs';

const cache=new WeakMap();
function entries(ctx){
 let data=cache.get(ctx);
 if(!data){data={items:new Map((ctx.all??ctx.trip?.items??[]).map(item=>[item.id,item])),photos:new Map(),fallbacks:new Map()};cache.set(ctx,data);}
 return data;
}
export function explorerActivityV125(ctx,stop){
 if(!stop)return null;
 const data=entries(ctx),item=data.items.get(stop.id);
 if(!item||item.removed||item.duplicateOf||item.kind!=='activity')return null;
 if(!data.photos.has(item.id)){
  const photos=itineraryPhotosV112(item,ctx,{context:false}).filter(p=>!p.contextualOnly&&/^https:\/\//.test(p.url??'')&&/^https:\/\//.test(p.sourceUrl??'')&&p.credit);
  data.photos.set(item.id,photos.sort((a,b)=>editorialPhotoScoreV119(item,b)-editorialPhotoScoreV119(item,a)));
 }
 return {item,photos:data.photos.get(item.id),stop};
}
export function explorerFallbackV125(ctx,state,scene){
 const data=entries(ctx),key=scene.contentKey;
 if(!data.fallbacks.has(key)){
  data.fallbacks.set(key,editorialCityPhotoV119({...ctx,dayPlan:scene.day,date:scene.day?.date},state.cityId,{day:!!scene.day}));
 }
 return data.fallbacks.get(key);
}
export function explorerPhotoV125(ctx,scene,fallback=null){
 const activity=explorerActivityV125(ctx,scene.stop);
 const photo=activity?.photos[0];
 if(photo)return {item:activity.item,photo,contextual:false};
 return fallback?.photo&&fallback.item&&/^https:\/\//.test(fallback.photo.url??'')&&/^https:\/\//.test(fallback.photo.sourceUrl??'')&&fallback.photo.credit?{...fallback,contextual:true}:null;
}
export const explorerPhotoUrlV125=(photo,width=960)=>photo?.url?.replace(/\?width=960$/,'?width='+([20,40,60,120,250,330,500,960,1280,1920,3840].find(w=>w>=width)??3840))??null;
export function explorerMediaHtmlV125(ctx,scene,fallback){
 const entry=explorerPhotoV125(ctx,scene,fallback),activity=explorerActivityV125(ctx,scene.stop);
 const {item,photo,contextual}=entry??{};
 const title=activity?.item.name;
 const extra=activity?.photos.slice(1,3)??[];
 const price=activity?.item.effectivePrice??activity?.item.price;
 let priceLabel='Preis offen';
 if(price&&Number.isSafeInteger(price.cents)&&price.cents>=0){
  try{priceLabel=money(price.cents,price.currency??'EUR')+' · '+({person:'pro Person',group:'Gruppenpreis',unit:'pro Einheit'}[price.scope]??'Bezugsgröße prüfen')+' · '+(price.label??'Planpreis, nicht bestätigt');}catch{}
 }
 const minutes=activity?.stop.minutes??activity?.item.duration;
 const duration=Number.isFinite(minutes)&&minutes>=0?minutes+' Min. · geplant':'Dauer offen';
 return '<div class="route125-media" data-photo120-crop="'+photoCropV120(item,photo)+'">'
  +(photo?'<figure class="photo119-item"><a href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Ortsfoto vergrößern"><img src="'+esc(explorerPhotoUrlV125(photo))+'" alt="'+esc(item.name)+'" decoding="async" referrerpolicy="no-referrer"></a><figcaption><strong>'+esc(contextual?'Etappenmotiv · '+item.name:item.name)+'</strong><small>'+esc(photo.credit)+'</small>'+(photo.subjectDisclaimer?'<small>'+esc(photo.subjectDisclaimer)+'</small>':'')+' <a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a></figcaption></figure>':'<p class="route123-no-photo">Kein zugeordnetes Ortsfoto</p>')
  +(extra.length?'<details class="route138-extra"><summary>Weitere Ortsbilder ('+extra.length+')</summary><div class="photo119-map-rail">'+extra.map(p=>'<figure class="photo119-item" data-photo120-crop="'+photoCropV120(activity.item,p)+'"><a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Ortsfoto vergrößern"><img src="'+esc(explorerPhotoUrlV125(p,640))+'" alt="'+esc(activity.item.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a><figcaption><small>'+esc(p.credit)+'</small> '+(p.subjectDisclaimer?'<small>'+esc(p.subjectDisclaimer)+'</small>':'')+' <a href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a></figcaption></figure>').join('')+'</div></details>':'')
  +'</div>'+(activity?'<section class="route125-activity" aria-label="Aktuelle Aktivität"><small>AKTUELLER STOPP · '+esc(activity.stop.period)+'</small><h3>'+esc(title)+'</h3><div class="route125-facts"><span>'+esc(duration)+'</span><span>'+esc(priceLabel)+'</span></div><details><summary>Informationen zum Ort</summary><p>'+esc(activity.item.detail||activity.item.note||'Beschreibung noch offen')+'</p><p>'+esc(activity.item.address??'Adresse offen')+'</p><button type="button" data-action="details" data-value="'+esc(activity.item.id)+'">Vollständige Ortsdetails öffnen</button></details></section>':'');
}
export function explorerMarkerRowsV125(ctx,scene){
 const seen=new Set(),rows=[];
 for(const [index,stop] of scene.stops.entries()){
  if(!Array.isArray(stop.point)||stop.point.length!==2||!stop.point.every(Number.isFinite)||Math.abs(stop.point[0])>90||Math.abs(stop.point[1])>180||!stop.point.some(Boolean)||seen.has(stop.id))continue;
  const activity=explorerActivityV125(ctx,stop);if(!activity)continue;
  seen.add(stop.id);rows.push({index,id:stop.id,name:stop.name,point:stop.point,photo:activity.photos[0]??null});
  if(rows.length===12)break;
 }
 return rows;
}
const mapState=new WeakMap();
export function clearExplorerMarkersV125(map){
 if(!map)return;const record=mapState.get(map);
 if(record){record.layer.clearLayers();map.removeLayer(record.layer);mapState.delete(map);}
}
export function syncExplorerMarkersV125(map,leaflet,ctx,scene,state,onSeek){
 if(!map||!leaflet)return;
 if(state.phase==='travel'||!scene.day){clearExplorerMarkersV125(map);return;}
 const key=scene.contentKey;
 let record=mapState.get(map);
 if(!record||record.ctx!==ctx||record.key!==key){
  clearExplorerMarkersV125(map);
  record={ctx,key,layer:leaflet.layerGroup().addTo(map),markers:[]};mapState.set(map,record);
  let photos=0;
  const connection=globalThis.navigator?.connection;
  const photoLimit=connection?.saveData||/^(slow-2g|2g)$/.test(connection?.effectiveType??'')?0:8;
  for(const row of explorerMarkerRowsV125(ctx,scene)){
   const url=row.photo&&photos<photoLimit?explorerPhotoUrlV125(row.photo,160):null;if(url)photos++;
   const html='<span class="route125-map-pin"><span class="route125-pin-number" aria-hidden="true">'+(row.index+1)+'</span>'+(url?'<img src="'+esc(url)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">':'')+'</span>';
   const marker=leaflet.marker(row.point,{icon:leaflet.divIcon({className:'route125-map-marker',html,iconSize:[48,48],iconAnchor:[24,48]}),keyboard:true,title:row.name,alt:row.name,zIndexOffset:3200}).addTo(record.layer);
   marker.on('click',()=>onSeek(row.index));record.markers.push({marker,index:row.index});
  }
 }
 for(const {marker,index} of record.markers){
  const selected=index===scene.index;marker.getElement()?.classList.toggle('is-current',selected);marker.setZIndexOffset(selected?3900:3200);
 }
}
export function upcomingActivityPhotoV125(ctx,scene){
 const next=scene.stops[scene.index+1];
 return explorerPhotoUrlV125(explorerActivityV125(ctx,next)?.photos[0]);
}
