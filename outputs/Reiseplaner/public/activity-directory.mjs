import {browseHero,browseToolbar,browseItems,browseOptionCard} from './browse-hub-v35.mjs';
import {explorerCategory,validPoint} from './map-explorer.mjs';
import {placeProfileModel} from './place-profile.mjs';
import {hasIndependentPointEvidence} from './poi-location-provenance.mjs';
import {groupPrice} from './model.mjs';
import {esc,icon} from './ui.mjs';
import {nightlifeType} from './nightlife-v50.mjs';
import {discoverySource,discoveryCompareBoard,discoveryCard} from './discovery-catalog.mjs';

// Every activity remains part of its existing trip variant. Categories are
// browsing heuristics based on names and tags, not verified provider facts.
export const ACTIVITY_GROUPS=Object.freeze([
 ['all','Alle Aktivitäten'],
 ['clubs','Clubs & Partys'],
 ['bars','Bars & Pubs'],
 ['night','Alle Abendideen'],
 ['sport','Sport & Erlebnisse'],
 ['water','Strand & Baden'],
 ['nature','Natur & Wandern'],
 ['view','Aussicht & Stadt'],
 ['culture','Kultur & Museen'],
 ['other','Weitere Ideen']
]);
export const ACTIVITY_EVIDENCE_FILTERS=Object.freeze([
 ['all','Alle Nachweise'],
 ['photo','Mit Quellenfoto'],
 ['missingPhoto','Ohne Einzelbild'],
 ['point','Mit Kartenpunkt'],
 ['sourcedPoint','Mit Koordinatenbeleg'],
 ['unverifiedPoint','Punkt ohne Quellenbeleg'],
 ['missingPoint','Ohne Kartenpunkt'],
 ['price','Mit Preisreferenz'],
 ['missingPrice','Preis offen']
]);
export function activityEvidence(item,ctx){
 return {
  photo:Boolean(placeProfileModel(item,ctx)?.photo),
  point:validPoint(item?.point),
  sourcedPoint:hasIndependentPointEvidence(item),
  price:groupPrice(item?.effectivePrice??item?.price,ctx?.people?.length??3)!=null
 };
}
export function activityFacetMatch(item,ctx,facet='all'){
 if(facet==='all')return true;
 const e=activityEvidence(item,ctx);
 return facet==='photo'?e.photo
  :facet==='missingPhoto'?!e.photo
  :facet==='point'?e.point
  :facet==='sourcedPoint'?e.sourcedPoint
  :facet==='unverifiedPoint'?e.point&&!e.sourcedPoint
  :facet==='missingPoint'?!e.point
  :facet==='price'?e.price
  :facet==='missingPrice'?!e.price
  :true;
}
const normalize=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function activityGroup(item){
 const subject=normalize([item?.name,item?.researchV50?.category,...(item?.tags??[])].join(' '));
 if(nightlifeType(item)!=='none')return 'night';
 if(/\b(museum|musee|museo|galerie|theater|ausstellung|kathedrale|basilika|kirche|palast|schloss|denkmal)\b/.test(subject))return 'culture';
 if(/\b(strand|plage|beach|baden|schwimmen|schwimmbad|badesee|wasserfall|lagune|seealpsee|oeschinensee|klontalersee|meer)\b/.test(subject))return 'water';
 if(/\b(wandern|wanderung|hike|hiking|berg|alpen|alps|natur|wald|park|parc|nationalpark|gletscher|seilbahn)\b/.test(subject))return 'nature';
 if(/\b(aussicht|panorama|viewpoint|mirador|observatorium|skyline|promenade|altstadt|stadtbummel|viertel|stadtfuhrung)\b/.test(subject))return 'view';
 if(/\b(sport|kajak|kayak|klettern|surfen|fahrrad|radfahren|rafting|bootstour|action|volleyball|fussball|skaten)\b/.test(subject))return 'sport';
 if(/\b(club|nightlife|nachtleben|barhop|abendprogramm|party|diskothek|disco)\b/.test(subject))return 'night';
 return 'other';
}
export function activityGroupMatches(item,key='all'){
 if(key==='all')return true;
 if(key==='clubs')return nightlifeType(item)==='club';
 if(key==='bars')return nightlifeType(item)==='bar';
 if(key==='night')return nightlifeType(item)!=='none';
 return activityGroup(item)===key;
}
export function activityRows(ctx){
 const all=discoverySource(ctx)
   .filter(item=>explorerCategory(item)==='activity'||nightlifeType(item)!=='none');
 const query=normalize(ctx.browseSearch).trim();
 const searched=all.filter(item=>!query||normalize([item.name,item.city,item.detail,item.note,
   ctx.cities?.[item.city]?.name,...(item.tags??[])].join(' ')).includes(query));
 const saved=ctx.browseSavedIds??new Set(ctx.state?.favorites??[]);
 const filtered=searched.filter(item=>
  activityGroupMatches(item,ctx.activityCategory??'all')
  &&(!ctx.activitySavedOnly||saved.has(item.id))
  &&activityFacetMatch(item,ctx,ctx.activityEvidenceFilter??'all'));
 const sort=ctx.activityOrder??'source';
 if(sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'de'));
 if(sort==='score')filtered.sort((a,b)=>(b.preference?.score??-1)-(a.preference?.score??-1)
   ||a.name.localeCompare(b.name,'de'));
 if(sort==='price')filtered.sort((a,b)=>(groupPrice(a.price,ctx.people?.length??3)??Infinity)
   -(groupPrice(b.price,ctx.people?.length??3)??Infinity)
   ||a.name.localeCompare(b.name,'de'));
 return {all,searched,filtered,counts:Object.fromEntries(ACTIVITY_GROUPS.map(([key])=>[
  key,key==='all'?searched.length:searched.filter(item=>activityGroupMatches(item,key)).length
 ])),savedCount:searched.filter(item=>saved.has(item.id)).length,
  evidenceCounts:Object.fromEntries(ACTIVITY_EVIDENCE_FILTERS.map(([key])=>[
    key,key==='all'?searched.length:searched.filter(item=>activityFacetMatch(item,ctx,key)).length
  ]))};
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
  discoveryCard(item,ctx,{surface:'activities'})).join('');
 return '<div class="activity-directory">'
  +browseHero(ctx,'activities',data.all.length)
  +browseToolbar(ctx,{kind:'discover',total:data.all.length,filtered:data.filtered.length})
  +'<section class="activity-filter-panel" aria-label="Aktivitäten nach Interesse filtern">'
  +'<div class="activity-filter-header"><div><small>DEINE ERLEBNISSE</small><h2>Aktivitäten auswählen</h2>'
  +'<p>Alle vorhandenen Aktivitätsideen der aktuellen Reisevariante, unabhängig vom Tagesplan. '
  +'Kategorien sind automatisch zugeordnet und können ungenau sein.</p>'
  +'<p class="activity-nightlife-guidance">Clubs und Bars: Einlass ab 18, Ausweis, '
  +'Programm, Eintritt und sichere Rückfahrt für 2027 separat prüfen.</p></div>'+sort+'</div>'
  +'<div class="activity-filter-chips">'+groups
  +'<button type="button" class="activity-category-chip activity-bookmark-chip"'
  +' data-action="activity-saved" aria-pressed="'+Boolean(ctx.activitySavedOnly)+'">'
  +icon('bookmark')+' Gemerkt <small>'+data.savedCount+'</small></button></div>'
  +'<div class="activity-evidence-header"><small>DATENQUALITÄT</small>'
  +'<span>Quellenfotos sind nicht mit Stadtmotiven gleichzusetzen. Unbekannte Preise bleiben offen.</span></div>'
  +'<div class="activity-evidence-chips" role="group" aria-label="Nachweise für Aktivitäten filtern">'
  +ACTIVITY_EVIDENCE_FILTERS.map(([key,label])=>'<button type="button" class="activity-evidence-chip"'
   +' data-action="activity-evidence" data-value="'+key+'" aria-pressed="'
   +((ctx.activityEvidenceFilter??'all')===key)+'">'+esc(label)
   +' <small>'+data.evidenceCounts[key]+'</small></button>').join('')
  +'</div>'
  +'<p class="activity-result-count" role="status">'+data.filtered.length+' von '+data.all.length
  +' Ideen sichtbar · Preise und Öffnungszeiten für 2027 teilweise offen</p></section>'
  +(cards?'<div class="hub-option-grid activity-card-grid">'+cards+'</div>'
   :'<div class="hub-empty"><strong>Keine passenden Aktivitäten</strong><p>Wähle einen anderen Ort oder Filter.</p>'
   +'<button type="button" data-action="activity-reset">Alle Aktivitäten zeigen</button></div>')
  +(data.filtered.length>(ctx.browseLimit??24)
   ?'<div class="hub-more-button"><button class="button primary" type="button" data-action="browse-more">'
    +'Weitere Aktivitäten anzeigen</button></div>':'')
  +discoveryCompareBoard(data.all.filter(item=>ctx.discoveryCompareIds?.has(item.id)),ctx)
  +'</div>';
}
