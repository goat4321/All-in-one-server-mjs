import {esc} from './ui.mjs';
import {curatedLibraryV114} from './curated-place-photos.mjs';
import {commonsResults} from './commons-photo-search.mjs';
import {PHOTO_GROUPS_V114,PHOTO_CANDIDATE_COUNT_V114} from './photo-manifest-v114.mjs';

import {PHOTO_GROUPS_V115,PHOTO_CANDIDATE_COUNT_V115} from './photo-manifest-v115.mjs';
import {PHOTO_GROUPS_V116,PHOTO_CANDIDATE_COUNT_V116} from './photo-manifest-v116.mjs';
import {PHOTO_GROUPS_V117,PHOTO_CANDIDATE_COUNT_V117} from './photo-manifest-v117.mjs';

import {PHOTO_GROUPS_V118,PHOTO_CANDIDATE_COUNT_V118} from './photo-manifest-v118.mjs';

export const ALL_PHOTO_GROUPS_V115=[...PHOTO_GROUPS_V114.map(g=>({...g,key:g.city,cities:[g.city,...(g.city==='appenzell'?['wasserauen','seealpsee']:g.city==='kandersteg'?['oeschinensee']:[])]})),...PHOTO_GROUPS_V115];
export const PHOTO_TOTAL_V115=()=>curatedLibraryV114().length+PHOTO_CANDIDATE_COUNT_V114+PHOTO_CANDIDATE_COUNT_V115;
export const ALL_PHOTO_GROUPS_V116=[...ALL_PHOTO_GROUPS_V115,...PHOTO_GROUPS_V116];
export const PHOTO_TOTAL_V116=()=>PHOTO_TOTAL_V115()+PHOTO_CANDIDATE_COUNT_V116;
// Additional associations checked against the existing survey activity IDs.
const v117Associations={
 'Louvre · Innenhof und Pyramide':{ids:['act-005']},
 'Eiffelturm · Architektur':{ids:['act-006']},
 'Burano · Kanäle':{ids:['act-041']},
 'Wasserauen · Tal und Berge':{cities:['wasserauen','appenzell'],ids:['act-045']},
 'Seealpsee · Seeufer':{cities:['seealpsee','appenzell'],ids:['act-045','act-046']},
 'Klöntal · Landschaft':{cities:['kloental','glarus'],ids:['act-047']},
};
export const ALL_PHOTO_GROUPS_V117=[...ALL_PHOTO_GROUPS_V116,...PHOTO_GROUPS_V117.map(g=>({...g,...v117Associations[g.title]}))];
export const PHOTO_TOTAL_V117=()=>PHOTO_TOTAL_V116()+PHOTO_CANDIDATE_COUNT_V117;
export const ALL_PHOTO_GROUPS_V118=[...ALL_PHOTO_GROUPS_V117,...PHOTO_GROUPS_V118];
export const PHOTO_TOTAL_V118=()=>PHOTO_TOTAL_V117()+PHOTO_CANDIDATE_COUNT_V118;
const norm=s=>String(s??'').replace(/^File:/i,'').replaceAll('_',' ').normalize('NFC').toLowerCase();
const cache=new Map();
export function photoMetadataUrlV114(files){
 if(!Array.isArray(files)||!files.length||files.length>20)throw Error('Ungültige Fotogruppe');
 const u=new URL('https://commons.wikimedia.org/w/api.php');
 u.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',titles:files.map(f=>'File:'+f).join('|'),
 prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'800',
 iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|Attribution|Credit|Copyrighted|Restrictions',origin:'*'}).toString();
 return u.toString();
}
export function licensedGroupV114(group,data){
 const permitted=new Set(group.files.map(norm));
 const pages=(data?.query?.pages??[]).filter(p=>permitted.has(norm(p.title)));
 // The existing Commons validator requires attribution, approved license, image MIME and source.
 const rows=commonsResults({query:{pages}}).filter(p=>{
  try {return new URL(p.url).hostname==='upload.wikimedia.org'&&
   ['creativecommons.org','www.creativecommons.org'].includes(new URL(p.licenseUrl).hostname);}
  catch{return false;}
 });
 const unique=new Map(rows.map(p=>[norm(p.name),p]));
 return group.files.map(f=>unique.get(norm(f))).filter(Boolean);
}
const link=(url,label)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';
const licenseFrom=p=>p.licenseUrl??(p.credit?.match(/CC (BY-SA|BY) ([234]\.0|2\.5)/i)?'https://creativecommons.org/licenses/'+p.credit.match(/CC (BY-SA|BY) ([234]\.0|2\.5)/i)[1].toLowerCase()+'/'+p.credit.match(/CC (BY-SA|BY) ([234]\.0|2\.5)/i)[2]+'/':null);
export function photoCardV114(p,{archive=false}={}){
 const image=p.url.replace(/\?width=960$/,'?width=640');
 const license=licenseFrom(p);
 return '<figure class="photo114-card"><a href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="Foto in der Galerie vergrößern">'
 +'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(image)+'" alt="'+esc(p.name)+'"></a>'
 +'<figcaption><strong>'+esc(p.name)+'</strong><small>'+esc(p.credit)+'</small>'
 +(p.subjectDisclaimer?'<small>'+esc(p.subjectDisclaimer)+'</small>':'')
 +'<small>'+(archive?'Archivfoto · ':'Kategoriebild · Motiv nicht einzeln geprüft · ')+link(p.sourceUrl,'Quelle')+(license?' · '+link(license,'Lizenz'):'')+'</small></figcaption></figure>';
}
export function renderPhotoLibraryV114(ctx,{day=false}={}){
 const route=new Set(ctx.trip?.route??[]);
 const city=ctx.city??ctx.dayPlan?.city;
 const groups=ALL_PHOTO_GROUPS_V118.filter(g=>g.cities.some(c=>day?c===city:route.has(c)));
 const archive=curatedLibraryV114();
 const relevant=archive.filter(p=>p.cities.some(c=>day?c===city:route.has(c)));
 if(day&&!groups.length&&!relevant.length)return '';
 const scopedCount=groups.reduce((n,g)=>n+g.files.length,0);
 const groupHtml=groups.map(groupMarkupV115).join('');
 const other=day?[]:ALL_PHOTO_GROUPS_V118.filter(g=>!groups.includes(g));
 const others=other.length?'<details class="photo115-other"><summary>Weitere Reisevarianten · '+other.reduce((n,g)=>n+g.files.length,0)+' Bildreferenzen</summary>'+other.map(groupMarkupV115).join('')+'</details>':'';
 const existing=(day?relevant:archive);
 return '<section class="photo114-library" aria-label="Reise-Fotobibliothek"><header><small>ECHTE REISEFOTOS · WIKIMEDIA COMMONS</small><h2>'+(day?'Mehr Bilder zu diesem Reiseziel':'Die Reise in Bildern')+'</h2>'
 +'<p>'+scopedCount+' zusätzliche Bildreferenzen für '+(day?'diesen Ort':'diese Route')+' · '+existing.length+' unterschiedliche bestehende Archivfotos'+(!day?' aus allen Reisevarianten':'')+'. Neue Fotos erscheinen erst nach Abruf der Lizenzdaten.</p></header>'
 +(!day?'<p class="photo115-total"><strong>'+PHOTO_TOTAL_V118()+'</strong> unterschiedliche Dateireferenzen in allen Varianten · '+ALL_PHOTO_GROUPS_V118.length+' Motivsammlungen</p>':'')
 +(!day?'<label class="photo118-search">Motiv suchen<input type="search" data-photo118-search placeholder="z. B. See, Paris, Hafen"></label><p class="photo118-search-status" role="status"></p>':'')+groupHtml+others
 +(existing.length?'<details class="photo114-group" data-photo114-archive="'+(day?esc(city):'all')+'"><summary><strong>Vorhandene Fotobibliothek</strong><span>'+existing.length+' Fotos</span></summary><div class="photo114-body"></div></details>':'')
 +'<p>Historische und kategorisierte Motive, keine Belege für Buchungen, Wetter oder Zugänglichkeit im Jahr 2027. Bilder werden erst beim Öffnen der Galerie geladen.</p></section>';
}
export async function mountPhotoLibraryV114(detail,fetcher=globalThis.fetch){
 if(!detail?.open||!detail.isConnected)return;
 const body=detail.querySelector(':scope > .photo114-body');
 if(!body||body.dataset.loaded==='true'||body.dataset.loading==='true')return;
 const archive=detail.dataset.photo114Archive;
 if(archive){
  const photos=curatedLibraryV114().filter(p=>archive==='all'||p.cities.includes(archive));
  body.innerHTML='<div class="photo114-grid"></div><button type="button" class="photo114-more">Weitere Archivbilder laden</button>';
  const grid=body.querySelector('.photo114-grid'),more=body.querySelector('.photo114-more');
  let offset=0;
  const next=()=>{grid.insertAdjacentHTML('beforeend',photos.slice(offset,offset+20).map(p=>photoCardV114(p,{archive:true})).join(''));offset+=20;more.hidden=offset>=photos.length;};
  more.addEventListener('click',next);next();
  body.dataset.loaded='true';return;
 }
 const group=ALL_PHOTO_GROUPS_V118.find(g=>g.key===detail.dataset.photo114Group);
 if(!group)return;
 // Load only a single 20-file metadata batch on open; additional batches
 // require explicit interaction. Failed batches are retried, never skipped.
 body.dataset.loaded='true';
 body.innerHTML='<p class="photo114-progress" role="status"></p><div class="photo114-grid"></div><button type="button" class="photo114-more">Weitere Bilder laden</button>';
 const status=body.querySelector('.photo114-progress');
 const grid=body.querySelector('.photo114-grid');
 const more=body.querySelector('.photo114-more');
 let offset=0,accepted=0;
 const next=async()=>{
  if(more.disabled||offset>=group.files.length||!detail.isConnected)return;
  more.disabled=true;
  status.textContent='Lizenzinformationen werden abgerufen …';
  const batch={...group,files:group.files.slice(offset,offset+20)};
  const key=group.key+':'+offset;
  try{
   let promise=cache.get(key);
   if(!promise){promise=loadPhotoGroupV115(batch,fetcher);cache.set(key,promise);}
   const result=await promise;
   if(result.failedBatches)throw Error('Bildabruf fehlgeschlagen');
   if(!detail.isConnected)return;
   grid.insertAdjacentHTML('beforeend',result.photos.map(p=>photoCardV114(p)).join(''));
   accepted+=result.photos.length;
   offset+=batch.files.length;
   status.textContent=accepted+' Bilder mit verwendbaren Lizenzdaten · '+offset+' von '+group.files.length+' Referenzen geprüft. Motive nicht einzeln geprüft.';
   more.hidden=offset>=group.files.length;
   more.textContent='Weitere Bilder laden';
  }catch{
   cache.delete(key);
   if(detail.isConnected){status.textContent='Bildabruf fehlgeschlagen. Diesen Abschnitt erneut versuchen.';more.textContent='Erneut versuchen';}
  }finally{more.disabled=false;}
 };
 more.addEventListener('click',next);
 await next();
}
export {PHOTO_GROUPS_V114,PHOTO_CANDIDATE_COUNT_V114};

/** Specific activity links only, never a venue/property inferred from city imagery. */
export function renderItemPhotoGroupV114(item){
 if(!item||item.kind!=='activity'||item.mealSlot)return '';
 const id=item.id?.replace(/^survey-v19:/,'');
 const groups=ALL_PHOTO_GROUPS_V118.filter(g=>g.cities.includes(item.city)&&g.ids.includes(id));
 return groups.map(groupMarkupV115).join('');

}

function groupMarkupV115(g){
 return '<details class="photo114-group" data-photo114-group="'+esc(g.key)+'" data-photo118-label="'+esc(g.title+' '+g.cities.join(' '))+'"><summary><strong>'+esc(g.title)+'</strong><span>'+g.files.length+' Bildreferenzen</span></summary><div class="photo114-body" aria-live="polite"><p>Beim Öffnen werden Quelle und Lizenz abgerufen.</p></div><p class="photo114-source">'+link('https://commons.wikimedia.org/wiki/Category:'+encodeURIComponent(g.category.replaceAll(' ','_')),'Wikimedia-Quellkategorie')+'</p></details>';
}
/** At most 20 files per request, in sequence; retain successful batches on network errors. */
export async function loadPhotoGroupV115(group,fetcher=globalThis.fetch){
 const photos=[];let failedBatches=0;
 for(let i=0;i<group.files.length;i+=20){
  const batch={...group,files:group.files.slice(i,i+20)};
  try{
   const response=await fetcher(photoMetadataUrlV114(batch.files),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();if(data.error||!Array.isArray(data?.query?.pages))throw Error('Commons error');
   photos.push(...licensedGroupV114(batch,data));
  }catch{failedBatches++;}
 }
 if(failedBatches===Math.ceil(group.files.length/20))throw Error('Bildserver nicht erreichbar');
 return {photos:[...new Map(photos.map(p=>[norm(p.name),p])).values()],failedBatches};
}
export {PHOTO_GROUPS_V115,PHOTO_CANDIDATE_COUNT_V115};

export {PHOTO_GROUPS_V116,PHOTO_CANDIDATE_COUNT_V116};

export {PHOTO_GROUPS_V117,PHOTO_CANDIDATE_COUNT_V117};

export {PHOTO_GROUPS_V118,PHOTO_CANDIDATE_COUNT_V118};

// Native modal, one shared viewer for library, place and full day galleries.
// No modal or additional image request until the person opens a photo.
export function photoViewerEntriesV118(anchor){
 const group=anchor.closest('.photo114-grid,.place-gallery-grid,.day112-gallery,.photo119-rail,.photo119-map-rail');
 if(!group)return [];
 return [...group.querySelectorAll('.photo114-card>a,.place-gallery-item>a,.day112-photo>a,.photo119-item>a')].filter(a=>{
  const img=a.querySelector('img');return img&&!img.hidden&&!a.closest('.photo114-unavailable,.photo119-unavailable')&&img.getAttribute('src');
 });
}
export function installPhotoViewerV118(doc){
 if(!doc||doc.documentElement.dataset.photo118Installed)return;
 doc.documentElement.dataset.photo118Installed='true';
 let viewer,entries=[],index=0,trigger=null,touch=null;
 const create=()=>{
  const d=doc.createElement('dialog');
  d.className='photo118-viewer';d.setAttribute('aria-label','Fotoansicht');
  d.innerHTML='<div class="photo118-toolbar"><button type="button" data-photo118-prev aria-label="Vorheriges Foto">‹</button><span role="status" data-photo118-count></span><button type="button" data-photo118-next aria-label="Nächstes Foto">›</button><button type="button" data-photo118-close aria-label="Fotoansicht schließen">×</button></div><div class="photo118-stage"><img alt=""><p hidden>Bild derzeit nicht erreichbar.</p></div><div class="photo118-caption"></div>';
  doc.body.append(d);
  d.querySelector('[data-photo118-close]').addEventListener('click',()=>d.close());
  d.querySelector('[data-photo118-prev]').addEventListener('click',()=>step(-1));
  d.querySelector('[data-photo118-next]').addEventListener('click',()=>step(1));
  d.addEventListener('close',()=>{d.querySelector('img').removeAttribute('src');if(trigger?.isConnected)trigger.focus();entries=[];trigger=null;});
  d.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();step(e.key==='ArrowLeft'?-1:1);}});
  d.addEventListener('click',e=>{if(e.target===d)d.close();});
  const stage=d.querySelector('.photo118-stage'),img=stage.querySelector('img'),fallback=stage.querySelector('p');
  img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;});
  stage.addEventListener('touchstart',e=>{touch=e.touches.length===1?[e.touches[0].clientX,e.touches[0].clientY]:null;},{passive:true});
  stage.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];touch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx<0?1:-1);},{passive:true});
  return d;
 };
 const show=()=>{
  const a=entries[index],original=a.querySelector('img'),img=viewer.querySelector('img');
  img.hidden=false;viewer.querySelector('.photo118-stage p').hidden=true;
  img.alt=original.alt;img.src=original.getAttribute('src');
  const cap=viewer.querySelector('.photo118-caption');cap.replaceChildren();
  const fig=a.closest('figure'),caption=fig?.querySelector('figcaption');
  if(caption){const clone=caption.cloneNode(true);clone.querySelectorAll('button').forEach(b=>b.remove());const div=doc.createElement('div');div.append(...clone.childNodes);cap.append(div);}
  const source=doc.createElement('a');source.href=a.href;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Original / Quelle öffnen';cap.append(source);
  viewer.querySelector('[data-photo118-count]').textContent=(index+1)+' / '+entries.length;
  viewer.querySelector('[data-photo118-prev]').disabled=index===0;
  viewer.querySelector('[data-photo118-next]').disabled=index===entries.length-1;
 };
 const step=delta=>{const n=index+delta;if(n>=0&&n<entries.length){index=n;show();}};
 doc.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const control=e.target.closest?.('[data-photo119-scroll]');
  if(control){
   const rail=control.closest('.photo119-story')?.querySelector('.photo119-rail');
   if(rail){e.preventDefault();const reduced=doc.documentElement.dataset.motion==='off'||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const card=rail.querySelector('.photo119-item');
    rail.scrollBy({left:Number(control.dataset.photo119Scroll)*(card?card.getBoundingClientRect().width+16:rail.clientWidth),behavior:reduced?'instant':'smooth'});}
   return;
  }
  const a=e.target.closest?.('.photo114-card>a,.place-gallery-item>a,.day112-photo>a,.photo119-item>a');if(!a)return;
  const list=photoViewerEntriesV118(a);if(!list.includes(a))return;
  e.preventDefault();entries=list;index=list.indexOf(a);trigger=a;
  viewer??=create();show();if(!viewer.open)viewer.showModal();viewer.querySelector('[data-photo118-close]').focus();
 });
 doc.addEventListener('input',e=>{
  if(!e.target.matches?.('[data-photo118-search]'))return;
  const section=e.target.closest('.photo114-library'),q=e.target.value.trim().toLocaleLowerCase('de');
  let count=0;for(const g of section.querySelectorAll('[data-photo118-label]')){g.hidden=!g.dataset.photo118Label.toLocaleLowerCase('de').includes(q);if(!g.hidden)count++;}
  const other=section.querySelector('.photo115-other');if(other){other.hidden=!!q&&!other.querySelector('[data-photo118-label]:not([hidden])');if(q&&!other.hidden)other.open=true;}
  section.querySelector('.photo118-search-status').textContent=q?count+' passende Motivsammlungen':'';
 });
}
if(typeof document!=='undefined'){
 installPhotoViewerV118(document);
 // Fade in only loaded images that actually enter the viewport; no hidden content on unsupported browsers.
 const reduced=()=>document.documentElement.dataset.motion==='off'||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   const img=entry.target;observer.unobserve(img);
   if(img.isConnected&&img.naturalWidth&&!reduced()&&typeof img.animate==='function')img.animate([{opacity:.72,transform:'scale(1.015)'},{opacity:1,transform:'scale(1)'}],{duration:280,easing:'ease-out'});
  }
 },{threshold:.15}):null;
 const selector='.photo119-item img,.day112-photo img';
 const observe=img=>{if(img.matches?.(selector)&&img.complete&&img.naturalWidth)observer?.observe(img);};
 document.addEventListener('load',e=>observe(e.target),true);
 document.addEventListener('error',e=>{
  const img=e.target;if(!img.matches?.(selector))return;
  img.hidden=true;img.closest('figure,.day112-photo')?.classList.add('photo119-unavailable');
 },true);
 if(observer&&typeof MutationObserver==='function'){
  const scan=node=>{if(node.nodeType!==1)return;observe(node);node.querySelectorAll(selector).forEach(observe);};
  new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)scan(node);}).observe(document.body,{childList:true,subtree:true});
 }
}
