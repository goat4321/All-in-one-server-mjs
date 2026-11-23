/**
 * Non-blocking UI motion enhancements.
 * This module never changes source data, routing coordinates or click actions.
 * Every enhancement is optional; without JS or IntersectionObserver, all
 * content remains visible and usable.
 */
// Scene transitions on actual page/date/city changes, never on filter repaints.
// Reveal a few structural chapters, not hundreds of cards or map markers.
const REVEAL_TARGETS=[
  '.editorial-journey-hero','.cockpit-welcome','.overview-start',
  '.editorial-research-heading','.cockpit-route-surface',
  '.reference-map-intro','.hub-hero','.hub-toolbar',
  '.hub-results-title','.page-head','.data-page-heading',
  '.data-checks','.timeline-panel','.day-editorial-hero'
].join(',');
// V98: More motion appears when actual content scrolls into view, not every
// time the user adjusts a search filter or a map marker. Never observe the
// virtualized map canvas, Leaflet tiles, or hundreds of result elements.
const SCROLL_TARGETS=[
  '.overview-quick-card','.swiss-14-day-card','.destination-filmstrip .destination-card',
  '.cockpit-progress-item','.hub-option-grid .hub-option-card',
  '.hub-food-grid .hub-food-card','.timeline-event',
  '.reference-discovery-card','.swiss-editorial-grid article',
  '.market-chain-list .market-chain-card','.hub-compare-summary',
  // V99 editorial chapters: reveal as they actually reach the reader.
  '.swiss-editorial-head','.hub-market-access','.hub-food-planning',
  '.day-plan-quick-bar','.stay-swiss-research',
  '.data-disclosure','.cockpit-reference.section'
].join(',');
const MAX_SCROLL_REVEALS=42;
const scrollIdentity=(node,index)=>{
  const identity=node.dataset?.placeId??node.dataset?.eventId
    ??node.querySelector?.('[data-event-id]')?.dataset?.eventId
    ??node.querySelector?.('[data-action][data-value]')?.dataset?.value
    ??node.querySelector?.('h3')?.textContent?.trim()
    ??node.querySelector?.('strong')?.textContent?.trim()??index;
  return String(node.className??'item')+'|'+String(identity);
};
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
  let completedReveals=new Set();
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
    if(!canMove()){
      // Re-enabling motion later should start a fresh, optional scene.
      lastScene=null;completedReveals.clear();
      return;
    }
    const scene=motionSceneKey(ctx);
    const changed=scene!==lastScene;
    if(changed){lastScene=scene;completedReveals.clear();}
    // One short scene transition for genuine navigation, never a filter repaint.
    // Leaflet and MapLibre map surfaces must never be transformed.
    if(changed&&ctx?.page!=='map')container.querySelector?.('main.workspace')
      ?.classList.add('motion-scene-enter');
    if(typeof view?.IntersectionObserver!=='function')return;
    const structural=changed
      ?Array.from(container.querySelectorAll(REVEAL_TARGETS)).slice(0,12):[];
    const scrolling=Array.from(container.querySelectorAll(SCROLL_TARGETS))
      .slice(0,MAX_SCROLL_REVEALS).map((node,index)=>({
        node,key:scrollIdentity(node,index),index
      })).filter(entry=>!completedReveals.has(entry.key));
    const entries=[
      ...structural.map((node,index)=>({
        node,key:'section:'+index,index,kind:'motion-revealed'
      })),
      ...scrolling.filter(entry=>!structural.includes(entry.node))
        .map(entry=>({...entry,kind:'motion-scroll-revealed'}))
    ];
    if(!entries.length)return;
    const pending=new Map(entries.map(entry=>[entry.node,entry]));
    observer=new view.IntersectionObserver(items=>{
      for(const item of items)if(item.isIntersecting){
        const entry=pending.get(item.target);
        if(!entry)continue;
        completedReveals.add(entry.key);
        // A structural node may also match the card selector. Its first
        // reveal must count for both to prevent replays after filter updates.
        if(entry.kind==='motion-revealed')
          completedReveals.add(scrollIdentity(item.target,entry.index));
        item.target.classList.add(entry.kind);
        observer?.unobserve(item.target);
        pending.delete(item.target);
      }
    },{root:null,rootMargin:'0px 0px -45px 0px',threshold:.08});
    for(const entry of entries){
      entry.node.style.setProperty('--motion-delay',motionStagger(entry.index)+'ms');
      observer.observe(entry.node);
    }
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
      // Selection is already communicated by aria-pressed and border color.
      // Do not force a synchronous reflow just to replay a highlight.
      if(node.classList.contains('motion-spotlight'))continue;
      node.classList.add('motion-spotlight');
      view?.setTimeout?.(()=>node.classList.remove('motion-spotlight'),240);
    }
  };
  return {reveal,images,animateSaved,spotlight,enabled:canMove};
}
