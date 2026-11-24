import {esc} from './ui.mjs';
import {curatedLibraryV114} from './curated-place-photos.mjs';
import {commonsResults} from './commons-photo-search.mjs';
import {PHOTO_GROUPS_V114,PHOTO_CANDIDATE_COUNT_V114} from './photo-manifest-v114.mjs';

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
 return '<figure class="photo114-card"><a href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="Original und Bildinformationen öffnen">'
 +'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(image)+'" alt="'+esc(p.name)+'"></a>'
 +'<figcaption><strong>'+esc(p.name)+'</strong><small>'+esc(p.credit)+'</small>'
 +(p.subjectDisclaimer?'<small>'+esc(p.subjectDisclaimer)+'</small>':'')
 +'<small>'+(archive?'Archivfoto · ':'Kategoriebild · Motiv nicht einzeln geprüft · ')+link(p.sourceUrl,'Quelle')+(license?' · '+link(license,'Lizenz'):'')+'</small></figcaption></figure>';
}
export function renderPhotoLibraryV114(ctx,{day=false}={}){
 const route=new Set(ctx.trip?.route??[]);
 const city=ctx.dayPlan?.city??ctx.city;
 const groups=PHOTO_GROUPS_V114.filter(g=>day?g.city===city:route.has(g.city));
 const archive=curatedLibraryV114();
 const relevant=archive.filter(p=>p.cities.some(c=>day?c===city:route.has(c)));
 if(day&&!groups.length&&!relevant.length)return '';
 const scopedCount=groups.reduce((n,g)=>n+g.files.length,0);
 const groupHtml=groups.map(g=>'<details class="photo114-group" data-photo114-group="'+esc(g.city)+'"><summary><strong>'+esc(g.title)+'</strong><span>'+g.files.length+' neue Bildreferenzen</span></summary>'
 +'<div class="photo114-body" aria-live="polite"><p>Beim Öffnen werden Quelle und Lizenz abgerufen.</p></div>'
 +'<p class="photo114-source">'+link('https://commons.wikimedia.org/wiki/Category:'+encodeURIComponent(g.category.replaceAll(' ','_')),'Wikimedia-Quellkategorie')+'</p></details>').join('');
 const existing=(day?relevant:archive);
 return '<section class="photo114-library" aria-label="Reise-Fotobibliothek"><header><small>ECHTE REISEFOTOS · WIKIMEDIA COMMONS</small><h2>'+(day?'Mehr Bilder zu diesem Reiseziel':'Die Reise in Bildern')+'</h2>'
 +'<p>'+scopedCount+' zusätzliche Bildreferenzen für '+(day?'diesen Ort':'diese Route')+' · '+existing.length+' unterschiedliche bestehende Archivfotos'+(!day?' aus allen Reisevarianten':'')+'. Neue Fotos erscheinen erst nach Abruf der Lizenzdaten.</p></header>'
 +groupHtml
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
  body.innerHTML='<div class="photo114-grid">'+photos.map(p=>photoCardV114(p,{archive:true})).join('')+'</div>';
  body.dataset.loaded='true';return;
 }
 const group=PHOTO_GROUPS_V114.find(g=>g.city===detail.dataset.photo114Group);
 if(!group)return;
 body.dataset.loading='true';body.textContent='Lizenzinformationen werden abgerufen …';
 try {
  let promise=cache.get(group.city);
  if(!promise){
   promise=(async()=>{const response=await fetcher(photoMetadataUrlV114(group.files),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error('HTTP '+response.status);
    return licensedGroupV114(group,await response.json());})();
   cache.set(group.city,promise);
  }
  const photos=await promise;
  if(!detail.isConnected)return;
  body.innerHTML='<p>'+photos.length+' von '+group.files.length+' Dateien mit verwendbaren Lizenzdaten. Nicht passende oder unvollständige Angaben bleiben ausgeblendet.</p>'
   +'<div class="photo114-grid">'+photos.map(p=>photoCardV114(p)).join('')+'</div>';
  body.dataset.loaded='true';
 }catch{
  cache.delete(group.city);
  if(detail.isConnected)body.textContent='Bildserver nicht erreichbar. Galerie schließen und erneut öffnen oder die Quellkategorie nutzen.';
 }finally{delete body.dataset.loading;}
}
export {PHOTO_GROUPS_V114,PHOTO_CANDIDATE_COUNT_V114};
