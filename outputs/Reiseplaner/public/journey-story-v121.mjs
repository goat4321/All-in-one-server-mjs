import {esc,shortDay,btn} from './ui.mjs';
import {editorialCityPhotoV119,photoIdentityV120,photoCropV120} from './place-profile.mjs';

// Route order remains the source of truth. Dates are drawn from the existing
// itinerary, not inferred from the number of cities or booking records.
export function journeyChaptersV121(ctx,{exclude=[]}={}){
 const route=[...new Set(ctx.trip?.route??[])];
 const days=ctx.trip?.dayPlansV32??[],seen=new Set(exclude);
 const all=ctx.all??ctx.trip?.items??[];
 return route.map((city,index)=>{
  const plans=days.filter(d=>d.city===city);
  const editorial=editorialCityPhotoV119(ctx,city,{exclude:[...seen]});
  if(editorial)seen.add(photoIdentityV120(editorial.photo));
  const ids=new Set(plans.flatMap(d=>(d.slots??[]).map(s=>s.id)));
  const activities=all.filter(i=>ids.has(i.id)&&i.city===city&&i.kind==='activity'&&!i.mealSlot&&!i.removed&&!i.duplicateOf);
  return {city,index,name:ctx.cities?.[city]?.name??city,plans,activities:activities.slice(0,3),editorial};
 });
}
export function renderJourneyStoryV121(ctx,options={}){
 const chapters=journeyChaptersV121(ctx,options);
 if(!chapters.length)return '';
 const links=chapters.map((c,i)=>'<a href="#journey121-'+i+'" data-journey121-index="'+i+'"'+(i===0?' aria-current="location"':'')+'><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(c.name)+'</a>').join('');
 return '<section class="journey121" aria-label="Reisegeschichte"><header class="journey121-heading"><small>DEINE ROUTE · KAPITEL</small><h2>Eine Reise. '+chapters.length+' Reiseziele.</h2><p>Entdecke die Orte in der Reihenfolge deiner Reisevariante. Alle Tagesideen bleiben unverbindliche Planvorschläge.</p></header>'
 +'<nav class="journey121-nav" aria-label="Städtekapitel"><div class="journey121-progress"><span data-journey121-status>1 / '+chapters.length+'</span><span class="journey121-track" role="progressbar" aria-label="Reisekapitel" aria-valuemin="0" aria-valuemax="'+chapters.length+'" aria-valuenow="1"><i></i></span></div><div class="journey121-links">'+links+'</div></nav>'
 +'<div class="journey121-chapters">'+chapters.map((c,i)=>{
  const photo=c.editorial?.photo,item=c.editorial?.item;
  const dateText=c.plans.length?c.plans.length+' '+(c.plans.length===1?'geplanter Tag':'geplante Tage'):'Tageszuordnung offen';
  const dayLinks=c.plans.map(d=>'<button type="button" data-action="day-plan-go" data-value="'+esc(d.date)+'" aria-label="Tagesplan '+esc(shortDay(d.date))+' öffnen">'+esc(shortDay(d.date))+'</button>').join('');
  return '<article class="journey121-chapter" id="journey121-'+i+'" data-journey121-chapter="'+i+'" tabindex="-1">'
   +'<div class="journey121-media photo119-rail">'+(photo?'<figure class="photo119-item" data-photo120-crop="'+photoCropV120(item,photo)+'"><a href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(item.name+' Foto vergrößern')+'"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(photo.url)+'" alt="'+esc(item.name)+'"></a><figcaption><small>'+esc(photo.credit)+'</small> <a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a></figcaption></figure>':'<div class="journey121-no-photo">Kein zugeordnetes Ortsfoto</div>')+'</div>'
   +'<div class="journey121-copy"><small>ETAPPE '+String(i+1).padStart(2,'0')+' / '+chapters.length+'</small><h3>'+esc(c.name)+'</h3><p>'+esc(dateText)+'</p>'
   +(dayLinks?'<div class="journey121-days" aria-label="Tage an diesem Reiseort">'+dayLinks+'</div>':'')
   +(c.activities.length?'<h4 class="journey121-subtitle">Aktivitäten im Tagesentwurf</h4><div class="journey121-ideas">'+c.activities.map(a=>'<button type="button" data-action="details" data-value="'+esc(a.id)+'">'+esc(a.name)+'</button>').join('')+'</div>':'')
   +'<div class="journey121-actions">'+(c.plans.length?btn('day-plan-go','Tagesplan','calendar',c.plans[0].date,'primary'):btn('trip-city','Tagesplan','calendar',c.city,'primary'))+btn('journey121-map','Auf Karte','map',c.city)+'</div>'
   +'</div></article>'+(i<chapters.length-1?'<div class="journey121-connector"><span aria-hidden="true"></span><small>Weiter nach '+esc(chapters[i+1].name)+'</small></div>':'');
 }).join('')+'</div></section>';
}
export function mountJourneyStoryV121(root){
 const story=root?.querySelector('.journey121');if(!story)return;
 const win=story.ownerDocument.defaultView,chapters=[...story.querySelectorAll('[data-journey121-chapter]')],links=[...story.querySelectorAll('[data-journey121-index]')];
 const status=story.querySelector('[data-journey121-status]'),nav=story.querySelector('.journey121-nav'),strip=story.querySelector('.journey121-links'),track=story.querySelector('.journey121-track');
 if(!chapters.length||!status||!nav||!strip)return;
 let active=-1,frame=0,pinned=null,settleTimer=null;
 const clearPin=()=>{pinned=null;if(settleTimer!==null){win.clearTimeout(settleTimer);settleTimer=null;}};
 const reduced=()=>story.ownerDocument.documentElement.dataset.motion==='off'||win.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const offset=()=>Math.max(0,root.querySelector('.reference-topbar')?.getBoundingClientRect().bottom??0,parseFloat(win.getComputedStyle(nav).top)||0)+nav.getBoundingClientRect().height+16;
 const activate=index=>{
  if(index===active)return;
  active=index;
  links.forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  status.textContent=(index+1)+' / '+chapters.length;
  track?.setAttribute('aria-valuenow',String(index+1));
  story.style.setProperty('--journey121-progress',String((index+1)/chapters.length));
  chapters.forEach((c,i)=>{c.classList.toggle('journey121-active',i===index);c.classList.toggle('journey121-passed',i<index);});
  const a=links[index],bounds=strip.getBoundingClientRect(),linkBounds=a.getBoundingClientRect();
  if(linkBounds.left<bounds.left||linkBounds.right>bounds.right){
   strip.scrollTo({left:strip.scrollLeft+linkBounds.left-bounds.left-(bounds.width-linkBounds.width)/2,behavior:reduced()?'instant':'smooth'});
  }
 };
 const update=()=>{
  frame=0;if(!story.isConnected)return;
  if(pinned!==null){
   const distance=Math.abs(chapters[pinned].getBoundingClientRect().top-offset());
   if(distance<=4){activate(pinned);clearPin();return;}
   return;
  }
  const line=Math.max(offset()+12,win.innerHeight*.42);
  let index=0;for(let i=0;i<chapters.length;i++){if(chapters[i].getBoundingClientRect().top<=line)index=i;}
  activate(index);
 };
 const schedule=()=>{if(!frame)frame=win.requestAnimationFrame(update);};
 const interrupt=()=>{if(pinned!==null){clearPin();schedule();}};
 const settle=()=>{if(pinned!==null){clearPin();schedule();}};
 const resize=()=>{clearPin();schedule();};
 story.addEventListener('click',e=>{
  const a=e.target.closest('[data-journey121-index]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const index=Number(a.dataset.journey121Index),chapter=chapters[index];if(!chapter)return;
  e.preventDefault();clearPin();pinned=index;activate(index);
  chapter.focus({preventScroll:true});
  const oldMargin=chapter.style.scrollMarginTop;
  chapter.style.scrollMarginTop=offset()+'px';
  chapter.scrollIntoView({block:'start',inline:'nearest',behavior:reduced()?'instant':'smooth'});
  chapter.style.scrollMarginTop=oldMargin;
  // Bound the lock even if scrolling is clamped at the end of a short page.
  settleTimer=win.setTimeout(settle,1000);schedule();
 });
 win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',resize,{passive:true});win.addEventListener('scrollend',settle,{passive:true});
 for(const type of ['wheel','touchstart','keydown'])win.addEventListener(type,interrupt,{passive:true});
 activate(0);schedule();
 return ()=>{win.removeEventListener('scroll',schedule);win.removeEventListener('resize',resize);win.removeEventListener('scrollend',settle);clearPin();for(const type of ['wheel','touchstart','keydown'])win.removeEventListener(type,interrupt);if(frame)win.cancelAnimationFrame(frame);};
}
