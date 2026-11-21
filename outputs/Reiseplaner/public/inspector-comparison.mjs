import {esc,btn,urlLink} from './ui.mjs';
import {placeProfileModel,placeThumbnailHtml} from './place-profile.mjs';
import {entryCompleteness} from './entry-completeness.mjs';
const groupLabels={activity:'Aktivitäten',lodging:'Unterkünfte',transport:'Verbindungen'};
const safe=val=>val==null||val===''?'Offen':String(val);
const row=(title,values,kind='')=>'<tr class="'+kind+'"><th scope="row">'+esc(title)+'</th>'
  +values.map(v=>'<td>'+v+'</td>').join('')+'</tr>';
export function inspectorComparisonHtml(ctx,ids=[]){
 const source=new Map((ctx.all??[]).map(x=>[x.id,x]));
 const first=source.get(ids[0]);
 const items=[...new Set(ids)].map(id=>source.get(id))
   .filter(x=>x&&first&&x.kind===first.kind&&x.city===first.city).slice(0,3);
 if(items.length<2) return '<section class="inspector-comparison-empty"><h3>Weitere Option auswählen</h3>'
   +'<p>Öffne zwei oder drei Einträge derselben Stadt und Kategorie und wähle '
   +'jeweils „Zum Vergleich“. Es werden ausschließlich Daten aus deinem aktuellen '
   +'Katalog verglichen – keine Live-Preise oder Buchungen.</p></section>';
 const profiles=items.map(x=>placeProfileModel(x,ctx));
 const conditions=items.map(x=>entryCompleteness(x,ctx));
 const linkToSource=x=>x.guideV22?.sourceUrl
   ??(x.source??[]).map(id=>ctx.catalog?.sources?.[id]?.url).find(u=>/^https:\/\//.test(u));
 const cells={
   photo:items.map(x=>'<div class="comparison-photo">'+placeThumbnailHtml(x,ctx)+'</div>'),
   name:items.map((x,i)=>'<div class="comparison-name"><strong>'+esc(x.name)+'</strong>'
     +'<small>'+esc(ctx.cities?.[x.city]?.name??x.city)+'</small></div>'
     +btn('inspector-compare-detail','Details öffnen','pin',x.id,'subtle')
     +btn('inspector-compare-remove','Entfernen','x',x.id,'subtle')),
   price:profiles.map(p=>'<strong class="comparison-cost">'+esc(p.priceTier.tier)+'</strong>'
     +'<small>'+esc(p.priceTier.amount)+'</small>'),
   priceNote:profiles.map(p=>'<small>'+esc(p.priceTier.note)+'</small>'),
 };
 // Source display is entirely derived from the actual item source references.
 const sourceCells=items.map((x,i)=>'<span>'
   +(conditions[i].hasSource?'Webquelle hinterlegt':'Keine belegte Einzelquelle')
   +'</span>'+ (linkToSource(x)?'<div>'+urlLink(linkToSource(x),'Quelle öffnen')+'</div>':'')); 
 const location=items.map((x,i)=>'<span>'
   +(conditions[i].hasPoint?'Kartenpunkt vorhanden':'Kein individueller Kartenpunkt')
   +'</span><small>'+(conditions[i].sourcePoint
     ?'Quellenbeleg zur Position im Datensatz'
     :'Exakter Eingang nicht bestätigt')+'</small>');
 const description=items.map(x=>'<p class="comparison-description">'
   +esc(safe(x.guideV22?.summary??x.detail??x.note))+'</p>');
 const guides=items.map(x=>x.guideV22?'<div class="comparison-tips">'
   +x.guideV22.highlights.slice(0,3).map(z=>'<p>'+esc(z)+'</p>').join('')
   +'</div>':'<small>Kein gesonderter aktueller Betreiber-Guide vorhanden</small>');
 const gaps=conditions.map(x=>'<strong>'+x.gaps.length+'</strong> noch zu prüfen'
   +(x.gaps.length?'<small>'+esc(x.gaps.slice(0,3).map(g=>g.label).join(' · '))+'</small>':''));
 const isBooked=items.map(x=>'<span>'+esc(x.booked?'Im Plan als gebucht eingetragen':'Nicht bestätigt gebucht')+'</span>');
 const rows=[
   row('Foto',cells.photo,'comparison-image-row'),
   row('Option',cells.name,'comparison-title-row'),
   row('Preisstufe',cells.price),
   row('Preis-Einordnung',cells.priceNote),
   row('Buchungsstatus',isBooked),
   row('Beschreibung',description),
   row('Betreiberinformationen',guides),
   row('Quellen',sourceCells),
   row('Position',location),
   row('Offene Angaben',gaps),
 ];
 return '<div class="inspector-comparison">'
   +'<div class="inspector-comparison-heading"><span class="inspector-eyebrow">'
   +esc(ctx.cities?.[first.city]?.name??first.city)+' · '
   +esc(groupLabels[first.kind]??'Einträge')+'</span>'
   +'<h3>'+items.length+' Optionen gegenüberstellen</h3>'
   +'<p>Vergleich innerhalb derselben Stadt und Kategorie. Bilder, Quellen,'
   +' Preisangaben und offene Nachweise bleiben unabhängig von Buchungen.</p></div>'
   +'<div class="inspector-comparison-scroll" role="region" tabindex="0"'
   +' aria-label="Horizontal scrollbarerer Vergleich von '+items.length+' Reiseorten">'
   +'<table class="inspector-comparison-table"><tbody>'+rows.join('')+'</tbody></table></div>'
   +'<div class="inspector-comparison-footer">'
   +btn('inspector-compare-clear','Auswahl zurücksetzen','x')
   +btn('close','Schließen','check')+'</div></div>';
}
