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
  const activities=all.filter(i=>ids.has(i.id)&&i.city===city&&i.kind==='activity'&&!i.mealSlot);
  return {city,index,name:ctx.cities?.[city]?.name??city,plans,activities:activities.slice(0,3),editorial};
 });
}
export function renderJourneyStoryV121(ctx,options={}){
 const chapters=journeyChaptersV121(ctx,options);
 if(!chapters.length)return '';
 const links=chapters.map((c,i)=>'<a href="#journey121-'+i+'" data-journey121-index="'+i+'"'+(i===0?' aria-current="location"':'')+'><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(c.name)+'</a>').join('');
 return '<section class="journey121" aria-label="Reisegeschichte"><header class="journey121-heading"><small>DEINE ROUTE · KAPITEL</small><h2>Eine Reise. '+chapters.length+' Reiseziele.</h2><p>Entdecke die Orte in der Reihenfolge deiner Reisevariante. Alle Tagesideen bleiben unverbindliche Planvorschläge.</p></header>'
 +'<nav class="journey121-nav" aria-label="Städtekapitel"><div class="journey121-progress"><span data-journey121-status>1 / '+chapters.length+'</span><span class="journey121-track" aria-hidden="true"><i></i></span></div><div class="journey121-links">'+links+'</div></nav>'
 +'<div class="journey121-chapters">'+chapters.map((c,i)=>{
  const photo=c.editorial?.photo,item=c.editorial?.item;
  const dateText=c.plans.length?c.plans.map(d=>shortDay(d.date)).join(' · '):'Tageszuordnung offen';
  return '<article class="journey121-chapter" id="journey121-'+i+'" data-journey121-chapter="'+i+'" tabindex="-1">'
   +'<div class="journey121-media photo119-rail">'+(photo?'<figure class="photo119-item" data-photo120-crop="'+photoCropV120(item,photo)+'"><a href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(item.name+' Foto vergrößern')+'"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(photo.url)+'" alt="'+esc(item.name)+'"></a><figcaption><small>'+esc(photo.credit)+'</small> <a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a></figcaption></figure>':'<div class="journey121-no-photo">Kein zugeordnetes Ortsfoto</div>')+'</div>'
   +'<div class="journey121-copy"><small>ETAPPE '+String(i+1).padStart(2,'0')+' / '+chapters.length+'</small><h3>'+esc(c.name)+'</h3><p>'+esc(dateText)+'</p>'
   +(c.activities.length?'<div class="journey121-ideas">'+c.activities.map(a=>'<button type="button" data-action="details" data-value="'+esc(a.id)+'">'+esc(a.name)+'</button>').join('')+'</div>':'')
   +'<div class="journey121-actions">'+(c.plans.length?btn('day-plan-go','Tagesplan','calendar',c.plans[0].date,'primary'):btn('trip-city','Tagesplan','calendar',c.city,'primary'))+btn('journey121-map','Auf Karte','map',c.city)+'</div>'
   +'</div></article>'+(i<chapters.length-1?'<div class="journey121-connector"><span aria-hidden="true"></span><small>Weiter nach '+esc(chapters[i+1].name)+'</small></div>':'');
 }).join('')+'</div></section>';
}
export function mountJourneyStoryV121(root){
 const story=root?.querySelector('.journey121');if(!story)return;
 const win=story.ownerDocument.defaultView,chapters=[...story.querySelectorAll('[data-journey121-chapter]')],links=[...story.querySelectorAll('[data-journey121-index]')];
 const status=story.querySelector('[data-journey121-status]');
 const activate=index=>{
  links.forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  status.textContent=(index+1)+' / '+chapters.length;
  story.style.setProperty('--journey121-progress',String((index+1)/chapters.length));
  chapters.forEach((c,i)=>c.classList.toggle('journey121-active',i===index));
 };
 let frame=0;
 const update=()=>{
  frame=0;if(!story.isConnected){win.removeEventListener('scroll',schedule);win.removeEventListener('resize',schedule);return;}
  const line=win.innerHeight*.42;
  let active=0;for(let i=0;i<chapters.length;i++){if(chapters[i].getBoundingClientRect().top<=line)active=i;}
  activate(active);
 };
 const schedule=()=>{if(!frame)frame=win.requestAnimationFrame(update);};
 story.addEventListener('click',e=>{
  const a=e.target.closest('[data-journey121-index]');if(!a)return;
  const chapter=chapters[Number(a.dataset.journey121Index)];if(!chapter)return;
  e.preventDefault();const reduced=story.ownerDocument.documentElement.dataset.motion==='off'||win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  chapter.scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'});chapter.focus({preventScroll:true});
 });
 win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',schedule,{passive:true});activate(0);schedule();
 return ()=>{win.removeEventListener('scroll',schedule);win.removeEventListener('resize',schedule);if(frame)win.cancelAnimationFrame(frame);};
}
