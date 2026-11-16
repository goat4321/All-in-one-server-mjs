import {storyPointBetween,storyProgress} from './route-city-story-v70.mjs';

const STAY_MS=830;
const TRAVEL_MS=1350;
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

/** Animation is an independent Leaflet overlay.
 * It does not mutate the city, itinerary, tiles, selected place or route data.
 * Lines between city coordinates are only a schematic order, never rail geometry.
 */
export class RouteCityStoryPlayer{
 constructor(map,onChange=()=>{}){
  this.map=map;this.onChange=onChange;
  this.layer=L.layerGroup().addTo(map);
  this.stops=[];this.status='idle';this.index=0;this.part=0;
  this.speed=1;this.phase='dwell';this.elapsed=0;this.lastTime=null;
  this.frame=null;this.dot=null;this.trail=null;
  this.revealed=new Set();
  this.tick=this.tick.bind(this);
 }
 state(){
  const stop=this.stops[this.index]??null;
  const next=this.stops[this.index+1]??null;
  return {status:this.status,index:this.index,total:this.stops.length,
   name:stop?.name??'',symbol:stop?.symbol??'🧭',
   description:stop?.description??'',nextName:next?.name??'',
   progress:storyProgress(this.index,this.part,this.stops),speed:this.speed,
   schematic:true};
 }
 emit(){this.onChange(this.state());}
 reveal(index){
  if(this.revealed.has(index))return;
  const stop=this.stops[index];if(!stop)return;
  this.revealed.add(index);
  L.marker(stop.point,{icon:L.divIcon({
    className:'story-arrived-icon',html:markerContent(stop),
    iconSize:[96,70],iconAnchor:[48,62],
  }),interactive:false,keyboard:false,zIndexOffset:1800+index})
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
 play(stops=[]){
  this.stop(true);
  if(!Array.isArray(stops)||!stops.length){this.emit();return false;}
  this.stops=stops.map(stop=>({...stop,point:[...stop.point]}));
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
  this.reveal(0);this.draw();this.emit();
  this.frame=requestAnimationFrame(this.tick);
  return true;
 }
 tick(now){
  this.frame=null;
  if(this.status!=='playing')return;
  if(this.lastTime==null)this.lastTime=now;
  // Cap huge tab-resume frame deltas, so hidden tabs cannot silently skip cities.
  this.elapsed+=Math.max(0,Math.min(80,now-this.lastTime))*this.speed;
  this.lastTime=now;
  if(this.phase==='dwell'){
   if(this.elapsed>=STAY_MS){
    this.elapsed=0;
    if(this.index>=this.stops.length-1){this.finish();return;}
    this.phase='travel';
   }
  }else{
   const linear=Math.min(1,this.elapsed/TRAVEL_MS);
   // Ease smoothly into and out of the stop so arrival markers can pop naturally.
   this.part=linear*linear*(3-2*linear);
   this.draw();
   if(linear>=1){
    this.index+=1;this.part=0;this.phase='dwell';this.elapsed=0;
    this.reveal(this.index);this.draw();
   }
  }
  this.emit();
  this.frame=requestAnimationFrame(this.tick);
 }
 finish(){
  if(this.frame!=null)cancelAnimationFrame(this.frame);
  this.frame=null;this.lastTime=null;this.status='complete';
  this.index=this.stops.length-1;this.part=0;this.draw();this.emit();
 }
 pause(){
  if(this.status!=='playing')return false;
  if(this.frame!=null)cancelAnimationFrame(this.frame);
  this.frame=null;this.lastTime=null;this.status='paused';this.emit();return true;
 }
 resume(){
  if(this.status!=='paused')return false;
  if(reducedMotion()){
   this.stops.forEach((_,i)=>this.reveal(i));this.finish();return true;
  }
  this.status='playing';this.lastTime=null;this.emit();
  this.frame=requestAnimationFrame(this.tick);return true;
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
  this.dot=null;this.trail=null;
  if(!silent)this.emit();
 }
 destroy(){this.stop(true);this.map.removeLayer(this.layer);}
}
