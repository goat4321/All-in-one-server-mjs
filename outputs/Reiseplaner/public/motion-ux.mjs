/**
 * Non-blocking UI motion enhancements.
 * This module never changes source data, routing coordinates or click actions.
 * Every enhancement is optional; without JS or IntersectionObserver, all
 * content remains visible and usable.
 */
const REVEAL_TARGETS=[
  '.overview-quick-card','.destination-card','.cockpit-route-surface',
  '.cockpit-progress-item','.cockpit-reference','.reference-discovery-card',
  '.reference-agenda-item','.reference-agenda-suggestion','.explorer-place',
  '.option-card','.rail-card','.stay-compare-card','.meal-card',
  '.timeline-event .event-card','.journey-connection','.stat',
  '.route-studio','.day-route-builder','.source-notice','.reference-map-intro',
  '.cockpit-welcome'
].join(',');
const IMAGE_TARGETS=[
  '.destination-cover img','.reference-discovery-image img',
  '.reference-intro-photo img','.reference-hero-thumb img',
  '.inspector-cover-photo img','.place-photo img'
].join(',');

export const motionEnabled=(preference='auto',reducedMotion=false)=>
  preference!=='off'&&!reducedMotion;
export const motionStagger=index=>Math.min(Math.max(0,Math.floor(index)%5),4)*32;
export const motionSceneKey=ctx=>[
  ctx?.variant?.id??'',ctx?.page??'',ctx?.date??'',ctx?.city??'',
  ctx?.mapScope??'',Boolean(ctx?.mapSimple)
].join('|');

export function createMotionController(doc){
  const view=doc.defaultView;
  let observer=null,lastScene=null;
  const canMove=()=>motionEnabled(doc.documentElement.dataset.motion,
    Boolean(view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  const imageReady=image=>{
    if(!canMove()||!image.isConnected)return;
    image.classList.add('motion-photo-loaded');
  };
  // A single delegated load listener also catches modal images added AFTER
  // the main page render. Capturing is required because load does not bubble.
  doc.addEventListener('load',event=>{
    const image=event.target;
    if(image?.tagName==='IMG'&&image.matches?.(IMAGE_TARGETS))imageReady(image);
  },true);
  // Interactions must never change or intercept a control's click semantics.
  doc.addEventListener('pointerdown',event=>{
    if(!canMove()||event.button!==0||event.isPrimary===false)return;
    const target=event.target?.closest?.('button:not([disabled]),summary,a.button');
    if(!target||target.closest('[hidden],[inert]')||target.matches('[aria-disabled=true]'))return;
    const rect=target.getBoundingClientRect();
    if(rect.width<15||rect.height<15||rect.width>750)return;
    const diameter=Math.min(330,Math.max(rect.width,rect.height)*1.35);
    const left=(event.clientX-rect.left-diameter/2).toFixed(1);
    const top=(event.clientY-rect.top-diameter/2).toFixed(1);
    const ripple=doc.createElement('span');
    ripple.className='motion-ripple';
    ripple.setAttribute('aria-hidden','true');
    ripple.style.width=diameter+'px';
    ripple.style.height=diameter+'px';
    ripple.style.left=left+'px';
    ripple.style.top=top+'px';
    target.classList.add('motion-ripple-host');
    target.appendChild(ripple);
    ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
    view?.setTimeout?.(()=>ripple.remove(),650);
  },{passive:true});
  doc.addEventListener('keydown',event=>{
    if(!canMove()||!['Enter',' '].includes(event.key)||event.repeat)return;
    const button=event.target?.closest?.('button:not([disabled]),summary');
    if(!button)return;
    button.classList.remove('motion-key-pressed');
    // Forced reflow is only for a single keyboard-activated control.
    void button.offsetWidth;
    button.classList.add('motion-key-pressed');
    view?.setTimeout?.(()=>button.classList.remove('motion-key-pressed'),250);
  });
  const reveal=(container,ctx)=>{
    if(observer){observer.disconnect();observer=null;}
    if(!canMove())return;
    const scene=motionSceneKey(ctx);
    if(scene===lastScene)return;
    lastScene=scene;
    if(typeof view?.IntersectionObserver!=='function')return;
    const nodes=Array.from(container.querySelectorAll(REVEAL_TARGETS)).slice(0,96);
    observer=new view.IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){
        entry.target.classList.add('motion-revealed');
        observer?.unobserve(entry.target);
      }
    },{root:null,rootMargin:'0px 0px -25px 0px',threshold:.02});
    nodes.forEach((node,i)=>{
      node.style.setProperty('--motion-delay',motionStagger(i)+'ms');
      observer.observe(node);
    });
  };
  const images=container=>{
    if(!canMove())return;
    for(const image of container.querySelectorAll(IMAGE_TARGETS)){
      if(image.complete&&image.naturalWidth>0)imageReady(image);
      else image.addEventListener('load',()=>imageReady(image),{once:true});
    }
  };
  const animateSaved=(container,id)=>{
    if(!canMove())return;
    for(const card of container.querySelectorAll('.explorer-place,.reference-discovery-card')){
      const matches=card.dataset.placeId===id
        ||card.querySelector('[data-action=explorer-save]')?.dataset.value===id;
      if(matches){
        card.classList.add('motion-saved-success');
        view?.setTimeout?.(()=>card.classList.remove('motion-saved-success'),650);
      }
    }
  };
  const spotlight=(container,id)=>{
    if(!canMove())return;
    const card=[...container.querySelectorAll('.explorer-place[data-selected=true]')]
      .find(node=>node.dataset.placeId===id);
    for(const node of [card,container.querySelector('.reference-agenda-select[aria-pressed=true]')]){
      if(!node)continue;
      node.classList.remove('motion-spotlight');
      void node.offsetWidth;
      node.classList.add('motion-spotlight');
      view?.setTimeout?.(()=>node.classList.remove('motion-spotlight'),580);
    }
  };
  return {reveal,images,animateSaved,spotlight,enabled:canMove};
}
