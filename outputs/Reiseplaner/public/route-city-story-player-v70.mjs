import {storyPointBetween,storyProgress} from './route-city-story-v70.mjs';

// Deliberate pause in each city so the arrival and successive symbols can
// be perceived before the route continues. Durations are animations, not ETAs.
export const STAY_MS=5200;
export const TRAVEL_MS=1350;
export const dwellMsV124=(stop,immersive=false)=>immersive?Math.max(STAY_MS,Math.min(30000,6000*(stop?.previewDays??1))):STAY_MS;
export function storyTimelineV124(stops,immersive=false){
 let start=0;return stops.map((stop,index)=>{const dwell=dwellMsV124(stop,immersive),travel=index<stops.length-1?TRAVEL_MS:0;const row={index,start,dwell,travel,end:start+dwell+travel};start=row.end;return row;});
}
export function timelinePositionV124(rows,ms){
 if(!rows.length||!Number.isFinite(ms))return null;
 const t=Math.max(0,Math.min(rows.at(-1).end,ms));
 const row=rows.find(r=>t<r.end)??rows.at(-1),local=t-row.start;
 return {index:row.index,phase:local>=row.dwell&&row.travel?'travel':'dwell',elapsed:local>=row.dwell&&row.travel?local-row.dwell:Math.min(local,row.dwell)};
}
const BURST_DIRECTIONS=[
  [-82,-69],[82,-69],[-108,5],[108,10],[-40,100],
];
const reducedMotion=()=>document.documentElement.dataset.motion==='off'
  ||window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function markerContent(stop){
 const root=document.createElement('div');root.className='story-arrived-marker';
 const icon=document.createElement('span');icon.className='story-arrived-symbol';
 icon.setAttribute('aria-hidden','true');icon.textContent=stop.symbol;
 const label=document.createElement('strong');label.textContent=stop.name;
 root.append(icon,label);
 return root.outerHTML;
}
function travelerIcon(){
 const outer=document.createElement('div');outer.className='story-traveler-dot';
 outer.setAttribute('aria-hidden','true');
 const core=document.createElement('span');outer.append(core);
 return L.divIcon({className:'story-traveler-icon',html:outer.outerHTML,
  iconSize:[38,38],iconAnchor:[19,19]});
}

// No actual venue coordinates are used here: a radial burst is an
// illustration anchored to the existing city centre/reference point.
function arrivalBurstIcon(stop){
 const root=document.createElement('div');
 root.className='story-arrival-stage';
 root.setAttribute('aria-hidden','true');
 const pulse=document.createElement('span');
 pulse.className='story-arrival-pulse';
 root.append(pulse);
 for(const [i,item] of (stop.ideas??[]).slice(0,5).entries()){
  const bubble=document.createElement('span');
  bubble.className='story-arrival-bubble story-type-'+item.type;
  bubble.style.setProperty('--burst-x',BURST_DIRECTIONS[i][0]+'px');
  bubble.style.setProperty('--burst-y',BURST_DIRECTIONS[i][1]+'px');
  bubble.style.setProperty('--burst-delay',(0.23+i*.33)+'s');
  bubble.textContent=item.symbol;
  root.append(bubble);
 }
 return L.divIcon({className:'story-arrival-icon',html:root.outerHTML,
  iconSize:[0,0],iconAnchor:[0,0]});
}

/** Independent Leaflet presentation layer; it never changes route, prices,
 * selected places, real POI locations, tickets or the underlying tile map.
 */
export class RouteCityStoryPlayer{
 constructor(map,onChange=()=>{}){
  this.map=map;this.onChange=onChange;
  this.layer=L.layerGroup().addTo(map);
  this.stops=[];this.status='idle';this.index=0;this.part=0;
  this.speed=1;this.phase='dwell';this.elapsed=0;this.lastTime=null;
  this.frame=null;this.dot=null;this.trail=null;
  this.burst=null;this.cityMarkers=[];
  this.revealed=new Set();
  this.tick=this.tick.bind(this);
 }
 dwellDuration(){return dwellMsV124(this.stops[this.index],this.immersive);}
 state(){
  const stop=this.stops[this.index]??null;
  const next=this.stops[this.index+1]??null;
  const timeline=this.timeline??storyTimelineV124(this.stops,this.immersive),row=timeline[this.index];
  return {status:this.status,phase:this.phase,index:this.index,total:this.stops.length,
   timeline,previewDuration:timeline.at(-1)?.end??0,previewTime:this.status==='complete'?(timeline.at(-1)?.end??0):(row?row.start+(this.phase==='travel'?row.dwell:0)+this.elapsed:0),
   phaseProgress:this.status==='complete'?1:Math.max(0,Math.min(1,this.elapsed/(this.phase==='dwell'?this.dwellDuration():TRAVEL_MS))),
   cityId:stop?.id??null,name:stop?.name??'',symbol:stop?.symbol??'🧭',
   description:stop?.description??'',nextName:next?.name??'',
   progress:storyProgress(this.index,this.part,this.stops),speed:this.speed,
   ideas:stop?.ideas??[],plannedCount:stop?.plannedCount??0,
   placesKnown:stop?.placesKnown??0,ideaCount:stop?.ideaCount??0,
   routeOverview:this.routeOverview??[],schematic:true};
 }
 emit(){this.onChange(this.state());}
 reveal(index){
  if(this.revealed.has(index))return;
  const stop=this.stops[index];if(!stop)return;
  this.revealed.add(index);
  const marker=L.marker(stop.point,{icon:L.divIcon({
    className:'story-arrived-icon',html:markerContent(stop),
    iconSize:[96,70],iconAnchor:[48,62],
  }),interactive:false,keyboard:false,zIndexOffset:1800+index})
    .addTo(this.layer);
  this.cityMarkers[index]=marker;
 }
 clearArrival(){
  if(this.burst){this.layer.removeLayer(this.burst);this.burst=null;}
  this.cityMarkers[this.index]?.getElement()
    ?.querySelector('.story-arrived-marker')?.classList.remove('story-arrived-current');
 }
 arrive(index){
  this.reveal(index);
  // Keep only recent city badges. The original route markers and mini-stepper
  // still show the entire trip without accumulating map overlays.
  if(index>=2&&this.cityMarkers[index-2]){
    this.layer.removeLayer(this.cityMarkers[index-2]);
    this.cityMarkers[index-2]=null;
  }
  this.cityMarkers[index]?.getElement()
    ?.querySelector('.story-arrived-marker')?.classList.add('story-arrived-current');
  if(reducedMotion())return;
  const stop=this.stops[index];if(!stop)return;
  this.burst=L.marker(stop.point,{icon:arrivalBurstIcon(stop),
   interactive:false,keyboard:false,zIndexOffset:2300})
   .addTo(this.layer);
 }
 draw(){
  const a=this.stops[this.index],b=this.stops[this.index+1];
  if(!a)return;
  const last=b?storyPointBetween(a.point,b.point,this.part):a.point;
  const points=[...this.stops.slice(0,this.index+1).map(stop=>stop.point),last];
  this.trail?.setLatLngs(points);
  this.dot?.setLatLng(last);
 }
 play(stops=[],{immersive=false}={}){
  this.stop(true);this.immersive=immersive;
  if(!Array.isArray(stops)||!stops.length){this.emit();return false;}
  this.stops=stops.map(stop=>({...stop,point:[...stop.point],
   ideas:Array.isArray(stop.ideas)?stop.ideas.map(idea=>({...idea})):[]}));
  this.routeOverview=this.stops.map(stop=>({id:stop.id,name:stop.name}));
  this.timeline=storyTimelineV124(this.stops,this.immersive);
  this.status='playing';this.index=0;this.part=0;this.phase='dwell';
  this.elapsed=0;this.lastTime=null;
  this.trail=L.polyline([this.stops[0].point],{
    color:'#12a77b',weight:6,opacity:.95,interactive:false,
    className:'story-travelled-track',
  }).addTo(this.layer);
  this.dot=L.marker(this.stops[0].point,{
    icon:travelerIcon(),interactive:false,keyboard:false,zIndexOffset:3000,
  }).addTo(this.layer);
  if(reducedMotion()){
   this.stops.forEach((_,i)=>this.reveal(i));
   this.index=this.stops.length-1;this.part=0;this.draw();
   this.status='complete';this.emit();return true;
  }
  this.arrive(0);this.draw();this.emit();
  this.frame=requestAnimationFrame(this.tick);
  return true;
 }
 tick(now){
  this.frame=null;
  if(this.status!=='playing')return;
  if(this.lastTime==null)this.lastTime=now;
  // Cap enormous tab-resume deltas: hidden tabs never skip several cities.
  this.elapsed+=Math.max(0,Math.min(80,now-this.lastTime))*this.speed;
  this.lastTime=now;
  if(this.phase==='dwell'){
   if(this.elapsed>=this.dwellDuration()){
    this.elapsed=0;
    if(this.index>=this.stops.length-1){this.clearArrival();this.finish();return;}
    this.clearArrival();
    this.phase='travel';
   }
  }else{
   const linear=Math.min(1,this.elapsed/TRAVEL_MS);
   this.part=linear*linear*(3-2*linear);
   this.draw();
   if(linear>=1){
    this.index+=1;this.part=0;this.phase='dwell';this.elapsed=0;
    this.arrive(this.index);this.draw();
   }
  }
  this.emit();
  this.frame=requestAnimationFrame(this.tick);
 }
 finish(){
  if(this.frame!=null)cancelAnimationFrame(this.frame);
  this.frame=null;this.lastTime=null;this.status='complete';
  this.index=this.stops.length-1;this.part=0;this.phase='dwell';
  this.draw();this.emit();
 }
 pause(){
  if(this.status!=='playing')return false;
  if(this.frame!=null)cancelAnimationFrame(this.frame);
  this.frame=null;this.lastTime=null;this.status='paused';
  this.burst?.getElement()?.classList.add('story-arrival-paused');
  this.cityMarkers[this.index]?.getElement()?.classList.add('story-arrival-paused');
  this.emit();return true;
 }
 resume(){
  if(this.status!=='paused')return false;
  if(reducedMotion()){
   this.clearArrival();
   this.stops.forEach((_,i)=>this.reveal(i));this.finish();return true;
  }
  this.burst?.getElement()?.classList.remove('story-arrival-paused');
  this.cityMarkers[this.index]?.getElement()?.classList.remove('story-arrival-paused');
  this.status='playing';this.lastTime=null;this.emit();
  this.frame=requestAnimationFrame(this.tick);return true;
 }
 // Manual navigation uses the same state, marker and trail as autoplay.
 seekTime(ms){
  const pos=timelinePositionV124(this.timeline??storyTimelineV124(this.stops,this.immersive),ms);
  if(!pos||this.status==='idle')return false;
  return this.seek(pos.index,pos);
 }
 seek(index,position=null){
  if(!Number.isInteger(index)||index<0||index>=this.stops.length||this.status==='idle')return false;
  if(this.frame!=null)cancelAnimationFrame(this.frame);
  this.frame=null;this.lastTime=null;this.clearArrival();
  for(const marker of this.cityMarkers)if(marker)this.layer.removeLayer(marker);
  this.cityMarkers=[];this.revealed.clear();
  this.index=index;this.phase=position?.phase??'dwell';this.elapsed=position?.elapsed??0;this.status='paused';
  const f=this.phase==='travel'?Math.max(0,Math.min(1,this.elapsed/TRAVEL_MS)):0;this.part=f*f*(3-2*f);
  if(index>0)this.reveal(index-1);
  this.reveal(index);
  this.cityMarkers[index]?.getElement()?.querySelector('.story-arrived-marker')?.classList.add('story-arrived-current');
  this.draw();this.emit();return true;
 }
 setSpeed(speed){
  if(![1,1.5,2].includes(speed))return false;
  this.speed=speed;this.emit();return true;
 }
 stop(silent=false){
  if(this.frame!=null)cancelAnimationFrame(this.frame);
  this.frame=null;this.lastTime=null;
  this.layer.clearLayers();this.revealed.clear();
  this.stops=[];this.status='idle';this.index=0;this.part=0;
  this.phase='dwell';this.elapsed=0;
  this.dot=null;this.trail=null;this.burst=null;this.cityMarkers=[];
  this.routeOverview=[];this.timeline=[];
  if(!silent)this.emit();
 }
 destroy(){this.stop(true);this.map.removeLayer(this.layer);}
}
