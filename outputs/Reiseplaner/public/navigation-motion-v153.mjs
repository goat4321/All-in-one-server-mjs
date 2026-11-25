// Small, bounded geometry reads only on genuine page changes. No scroll
// handlers, global animation loops, or movement of the live map surface.
const NAVS=['.reference-main-nav','.mobile-dock','.sidebar'];
const RAILS='.photo119-rail,.photo119-map-rail,.day112-gallery,.destination-filmstrip,.journey121-days,.map-day-rail-track';
const rectOf=node=>{
 if(!node)return null;
 const r=node.getBoundingClientRect();
 return r.width>0&&r.height>0?{x:r.x,y:r.y,width:r.width,height:r.height,value:node.dataset.value}:null;
};
export function navigationOffsetV153(before,after){
 if(!before||!after||before.value===after.value)return null;
 const x=before.x-after.x,y=before.y-after.y;
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>600||Math.abs(y)>600)return null;
 return {x,y};
}
export function captureNavigationV153(app){
 return NAVS.map(selector=>({selector,rect:rectOf(app.querySelector(selector+' [data-action=page][aria-current=page]'))}));
}
export function restoreNavigationV153(app,previous){
 for(const {selector,rect} of previous){
  const node=app.querySelector(selector+' [data-action=page][aria-current=page]');
  const offset=navigationOffsetV153(rect,rectOf(node));
  if(!offset)continue;
  node.style.setProperty('--nav153-x',offset.x+'px');
  node.style.setProperty('--nav153-y',offset.y+'px');
  node.classList.add('nav153-selected');
 }
}
const railKey=(node,index)=>{
 const title=node.closest('[data-event-id],[data-place-id],[data-photo114-group]')?.dataset;
 return node.className+'|'+(title?.eventId??title?.placeId??title?.photo114Group??index);
};
export function captureRailsV153(app){
 return new Map(Array.from(app.querySelectorAll(RAILS)).slice(0,30).map((node,index)=>[railKey(node,index),node.scrollLeft]));
}
export function restoreRailsV153(app,positions){
 for(const [index,node] of Array.from(app.querySelectorAll(RAILS)).slice(0,30).entries()){
  const left=positions.get(railKey(node,index));
  if(Number.isFinite(left)&&left!==node.scrollLeft)node.scrollLeft=left;
 }
}
