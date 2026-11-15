import {browseHero,browseToolbar,browseItems,browseOptionCard} from './browse-hub-v35.mjs';
import {explorerCategory} from './map-explorer.mjs';
import {groupPrice} from './model.mjs';
import {esc,icon} from './ui.mjs';

// Every activity remains part of its existing trip variant. Categories are
// browsing heuristics based on names and tags, not verified provider facts.
export const ACTIVITY_GROUPS=Object.freeze([
 ['all','Alle Aktivitäten'],
 ['culture','Kultur & Museen'],
 ['nature','Natur & Wandern'],
 ['water','Strand & Baden'],
 ['view','Aussicht & Stadt'],
 ['sport','Sport & Erlebnisse'],
 ['night','Abend & Nightlife'],
 ['other','Weitere Ideen']
]);
const normalize=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function activityGroup(item){
 const subject=normalize([item?.name,...(item?.tags??[])].join(' '));
 if(/\b(museum|musee|museo|galerie|theater|ausstellung|kathedrale|basilika|kirche|palast|schloss|denkmal)\b/.test(subject))return 'culture';
 if(/\b(strand|plage|beach|baden|schwimmen|schwimmbad|badesee|wasserfall|lagune|seealpsee|oeschinensee|klontalersee|meer)\b/.test(subject))return 'water';
 if(/\b(wandern|wanderung|hike|hiking|berg|alpen|alps|natur|wald|park|parc|nationalpark|gletscher|seilbahn)\b/.test(subject))return 'nature';
 if(/\b(aussicht|panorama|viewpoint|mirador|observatorium|skyline|promenade|altstadt|stadtbummel|viertel|stadtfuhrung)\b/.test(subject))return 'view';
 if(/\b(sport|kajak|kayak|klettern|surfen|fahrrad|radfahren|rafting|bootstour|action|volleyball|fussball|skaten)\b/.test(subject))return 'sport';
 if(/\b(club|nightlife|nachtleben|barhop|abendprogramm|party|diskothek|disco)\b/.test(subject))return 'night';
 return 'other';
}
export function activityRows(ctx){
 const all=browseItems(ctx.all??[],{...ctx,browseSearch:''},{kind:'activity'})
   .filter(item=>explorerCategory(item)==='activity');
 const query=normalize(ctx.browseSearch).trim();
 const searched=all.filter(item=>!query||normalize([item.name,item.city,item.detail,item.note,
   ctx.cities?.[item.city]?.name,...(item.tags??[])].join(' ')).includes(query));
 const saved=ctx.browseSavedIds??new Set(ctx.state?.favorites??[]);
 const filtered=searched.filter(item=>
  ((ctx.activityCategory??'all')==='all'||activityGroup(item)===ctx.activityCategory)
  &&(!ctx.activitySavedOnly||saved.has(item.id)));
 const sort=ctx.activityOrder??'source';
 if(sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'de'));
 if(sort==='score')filtered.sort((a,b)=>(b.preference?.score??-1)-(a.preference?.score??-1)
   ||a.name.localeCompare(b.name,'de'));
 if(sort==='price')filtered.sort((a,b)=>(groupPrice(a.price,ctx.people?.length??3)??Infinity)
   -(groupPrice(b.price,ctx.people?.length??3)??Infinity)
   ||a.name.localeCompare(b.name,'de'));
 return {all,searched,filtered,counts:Object.fromEntries(ACTIVITY_GROUPS.map(([key])=>[
  key,key==='all'?searched.length:searched.filter(item=>activityGroup(item)===key).length
 ])),savedCount:searched.filter(item=>saved.has(item.id)).length};
}
export function activityDirectory(ctx){
 const data=activityRows(ctx);
 const groups=ACTIVITY_GROUPS.map(([key,label])=>
  '<button type="button" class="activity-category-chip" data-action="activity-category"'
  +' data-value="'+key+'" aria-pressed="'+((ctx.activityCategory??'all')===key)+'">'
  +esc(label)+' <small>'+data.counts[key]+'</small></button>').join('');
 const sort='<label class="activity-order">Sortieren <select id="activity-order" aria-label="Aktivitäten sortieren">'
  +[['source','Recherchefolge'],['score','Gruppeninteresse'],['name','Alphabetisch'],['price','Preisreferenz']]
   .map(([key,label])=>'<option value="'+key+'"'+((ctx.activityOrder??'source')===key?' selected':'')+'>'
    +esc(label)+'</option>').join('')+'</select></label>';
 const cards=data.filtered.slice(0,ctx.browseLimit??24).map(item=>
  browseOptionCard(item,ctx,{lodging:false,active:Boolean(ctx.activeSet?.has(item.id)),
    highlighted:Boolean(ctx.compareIds?.has(item.id))})).join('');
 return '<div class="activity-directory">'
  +browseHero(ctx,'activities',data.all.length)
  +browseToolbar(ctx,{kind:'discover',total:data.all.length,filtered:data.filtered.length})
  +'<section class="activity-filter-panel" aria-label="Aktivitäten nach Interesse filtern">'
  +'<div class="activity-filter-header"><div><small>DEINE ERLEBNISSE</small><h2>Aktivitäten auswählen</h2>'
  +'<p>Alle vorhandenen Aktivitätsideen der aktuellen Reisevariante, unabhängig vom Tagesplan. '
  +'Kategorien sind automatisch zugeordnet und können ungenau sein.</p></div>'+sort+'</div>'
  +'<div class="activity-filter-chips">'+groups
  +'<button type="button" class="activity-category-chip activity-bookmark-chip"'
  +' data-action="activity-saved" aria-pressed="'+Boolean(ctx.activitySavedOnly)+'">'
  +icon('bookmark')+' Gemerkt <small>'+data.savedCount+'</small></button></div>'
  +'<p class="activity-result-count" role="status">'+data.filtered.length+' von '+data.all.length
  +' Ideen sichtbar · Preise und Öffnungszeiten für 2027 teilweise offen</p></section>'
  +(cards?'<div class="hub-option-grid activity-card-grid">'+cards+'</div>'
   :'<div class="hub-empty"><strong>Keine passenden Aktivitäten</strong><p>Wähle einen anderen Ort oder Filter.</p>'
   +'<button type="button" data-action="activity-reset">Alle Aktivitäten zeigen</button></div>')
  +(data.filtered.length>(ctx.browseLimit??24)
   ?'<div class="hub-more-button"><button class="button primary" type="button" data-action="browse-more">'
    +'Weitere Aktivitäten anzeigen</button></div>':'')
  +'</div>';
}
