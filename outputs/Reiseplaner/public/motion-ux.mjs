/**
 * Non-blocking UI motion enhancements.
 * This module never changes source data, routing coordinates or click actions.
 * Every enhancement is optional; without JS or IntersectionObserver, all
 * content remains visible and usable.
 */
// Only page identity enters softly. Cards remain stable when filtered or repainted.
const REVEAL_TARGETS=[
  '.cockpit-welcome','.reference-map-intro','.hub-hero','.page-head'
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
  // Broken remote photos should reveal the existing icon or city artwork.
  // Do not treat failed image fetches as successful source coverage.
  doc.addEventListener('error',event=>{
    const photo=event.target;
    if(photo?.tagName!=='IMG')return;
    if(photo.classList.contains('place-context-image')){
      photo.hidden=true;
      photo.closest('.place-photo-placeholder')?.classList.add('photo-context-failed');
      return;
    }
    const host=photo.closest?.('.place-photo, .place-thumbnail, .hub-hero-art, .map-photo-disc');
    if(host){photo.hidden=true;host.classList.add('photo-load-failed');}
  },true);
  // Interactions must never change or intercept a control's click semantics.
  // V91: rely on native :active and :focus-visible feedback. Injecting a ripple
  // into every button/summary caused extra DOM work and visually noisy presses.
  // Keyboard focus never depends on forced synchronous layout or animation.
  const reveal=(container,ctx)=>{
    if(observer){observer.disconnect();observer=null;}
    if(!canMove())return;
    const scene=motionSceneKey(ctx);
    if(scene===lastScene)return;
    lastScene=scene;
    if(typeof view?.IntersectionObserver!=='function')return;
    const nodes=Array.from(container.querySelectorAll(REVEAL_TARGETS)).slice(0,12);
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
