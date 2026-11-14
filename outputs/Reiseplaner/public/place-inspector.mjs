import {esc,btn,urlLink,sourceList} from './ui.mjs';
import {placeProfileModel,placeProfileHtml,placeImageHtml,placeGalleryHtml,placeThumbnailHtml} from './place-profile.mjs';
import {entryCompleteness} from './entry-completeness.mjs';
import {inspectorTerm} from './inspector-glossary.mjs';
import {fieldNoteHtml} from './field-notes-ui.mjs';
const labels={activity:'Aktivität',lodging:'Unterkunft',transport:'Verbindung',food:'Essen',shop:'Einkaufen'};
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
const distance=(a,b)=>{const r=Math.PI/180,p=a[0]*r,q=b[0]*r,lat=(b[0]-a[0])*r,lon=(b[1]-a[1])*r;
 const h=Math.sin(lat/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(lon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
const tabs=[['overview','Übersicht'],['gallery','Fotos'],['cost','Kosten'],['sources','Quellen'],['nearby','In der Nähe']];
function sameCity(ctx,item){
 const others=(ctx.all??[]).filter(x=>x.city===item.city&&x.kind===item.kind&&!x.removed&&!x.duplicateOf);
 const distinct=[...new Map(others.map(x=>[x.id,x])).values()];
 if(!distinct.some(x=>x.id===item.id))distinct.push(item);
 distinct.sort((a,b)=>a.name.localeCompare(b.name,'de'));
 const n=distinct.findIndex(x=>x.id===item.id);
 return {prev:distinct[n-1],next:distinct[n+1]};
}
export function inspectorNearby(ctx,item,max=5){
 if(!valid(item.point))return [];
 return (ctx.all??[]).filter(x=>x.city===item.city&&x.id!==item.id&&x.kind==='activity'
   &&!x.removed&&!x.duplicateOf&&valid(x.point))
   .map(x=>({item:x,km:distance(item.point,x.point)}))
   .filter(x=>x.km>=.015&&x.km<=5)
   .sort((a,b)=>a.km-b.km||a.item.name.localeCompare(b.item.name,'de')).slice(0,max);
}
function officialGuide(guide){
 if(!guide)return '<p class="muted">Noch kein gesondert recherchiertes offizielles Betreiberprofil für diesen Eintrag.</p>';
 const isConcept=/example_operator|optional|inspiration|alternative_city|transfer_reference/i.test(guide.validity);
 return '<div class="inspector-operator-guide"><span class="inspector-eyebrow">'
   +(isConcept?'Offizielle Kontextquelle · Anbieter/Route noch nicht gewählt':'Offiziell nachrecherchiert')
   +' · '+esc(guide.reviewedOn)+'</span><h4>'+esc(guide.title)+'</h4>'
   +'<p>'+esc(guide.summary)+'</p><ul>'+guide.highlights.map(x=>'<li>'+esc(x)+'</li>').join('')
   +'</ul><div class="inspector-practical"><strong>Für eure Planung</strong><p>'
   +esc(guide.practical)+'</p></div>'
   +urlLink(guide.sourceUrl,'Originalangaben überprüfen')
   +'<small class="inspector-disclaimer">Belegter Quellenstand ist keine Buchungs- oder Preisgarantie für September 2027.</small></div>';
}
export function placeInspectorHtml(ctx,item,compareIds=[]){
 const p=placeProfileModel(item,ctx);
 if(!p)return '';
 const quality=entryCompleteness(item,ctx),guide=item.guideV22;
 const city=ctx.cities?.[item.city]?.name??item.city;
 const {prev,next}=sameCity(ctx,item);
 const srcCount=(item.source??[]).filter(id=>ctx.catalog?.sources?.[id]?.url).length;
 const cover=p.photo?'<a href="'+esc(p.photo.url)
   +'" class="inspector-cover-photo" target="_blank" rel="noopener noreferrer">'
   +'<img src="'+esc(p.photo.url)+'" alt="'+esc(item.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
   +'<span>Bild vergrößern</span></a>'
   :'<div class="inspector-cover-missing"><span>'+esc(city)+'</span>'
   +'<strong>Ortsbild noch offen</strong><small>Nur belegte Motive werden übernommen.</small></div>';
 const near=inspectorNearby(ctx,item);
 const price=p.priceTier;
 const panels={
   overview:'<div class="inspector-reading"><p class="inspector-lead">'+esc(p.description)+'</p>'
     +officialGuide(guide)
     +fieldNoteHtml(item.fieldNoteV28)
     +'<details class="inspector-all-fields"><summary>Alle vorhandenen Einzelangaben anzeigen</summary>'
     +placeProfileHtml(item,ctx)+'</details></div>',
   gallery:'<div class="inspector-gallery">'+inspectorTerm('image')
     +(p.photo?placeImageHtml(item,ctx):'<p>Noch kein quellenbelegtes Foto zu diesem Ort hinterlegt.</p>')
     +placeGalleryHtml(item,ctx)
     +'<p class="muted">Achte auf Motivtreue, Lizenz und Urheber. Hotelbilder zeigen nicht zwingend die konkrete Zimmerkategorie.</p>'
     +btn('commons-photo-search','Lizenzierte Fotos suchen','compass',item.id)
     +btn('photo-edit','Bildlink manuell hinzufügen','pin',item.id)+'</div>',
   cost:'<div class="inspector-cost">'+inspectorTerm('priceTier')+inspectorTerm('booking')
     +'<div class="inspector-cost-amount">'
     +'<strong>'+esc(price.tier)+'</strong><span>'+esc(price.amount)+'</span></div>'
     +'<p>'+esc(price.note)+'</p>'
     +'<dl><div><dt>Bisheriger Plan- bzw. Suchwert</dt><dd>'+esc(p.priceLabel)+'</dd></div>'
     +'<div><dt>Buchungsstatus</dt><dd>'
     +esc(item.booked?'Im lokalen Plan als gebucht markiert – Anbieterbeleg kontrollieren'
       :'Keine tatsächliche Buchung dieses Eintrags bestätigt')+'</dd></div></dl>'
     +(guide?'<section class="inspector-practical"><strong>Offizielle Tarifhinweise</strong>'
       +'<p>'+esc(guide.highlights.filter(x=>/[€]|CHF|Preis|Eintritt|Ticket/i.test(x)).join(' · ')
         ||'In der Betreiberquelle ist kein vergleichbarer 2027-Gesamtpreis veröffentlicht.')+'</p>'
       +urlLink(guide.sourceUrl,'Betreiberquelle öffnen')+'</section>':'')
     +'<p class="muted">€-Kennzeichen sind Vergleichskategorien. Fremdwährungen, optionale Tickets,'
     +' Rabatte und nicht geprüfte Gebühren ergeben keinen bestätigten Reise-Gesamtpreis.</p></div>',
   sources:'<div class="inspector-sources">'+inspectorTerm('source')+inspectorTerm('future')
     +'<p><strong>'+srcCount
     +' verknüpfte Webbelege</strong> · Quellenangaben sind nicht automatisch live.</p>'
     +sourceList(item,ctx.catalog?.sources??{})
     +(guide?'<div class="inspector-operator-guide"><strong>Neue Betreiberrecherche</strong>'
       +'<p>'+esc(guide.summary)+'</p>'+urlLink(guide.sourceUrl,'Originallink aufrufen')
       +'<small>Stand '+esc(guide.reviewedOn)+' · '+esc(guide.validity.replaceAll('_',' '))+'</small></div>':'')
     +'<details class="inspector-all-fields"><summary>Fehlende Nachweise ('+quality.gaps.length+')</summary>'
     +'<ul>'+quality.gaps.map(x=>'<li><strong>'+esc(x.label)+'</strong><p>'
       +esc(x.next)+'</p></li>').join('')+'</ul></details></div>',
   nearby:'<div class="inspector-nearby">'+inspectorTerm('airDistance')+inspectorTerm('geography')
     +'<p class="muted">Nur Luftlinie zwischen gespeicherten POI-Punkten,'
     +' keine echten Fuß-, Zug- oder ÖPNV-Zeiten; Gebietskoordinaten sind nicht zwingend Eingänge.</p>'
     +(near.length?near.map(({item:x,km})=>
       '<div class="inspector-nearby-row">'+placeThumbnailHtml(x,ctx)
       +'<div><strong>'+esc(x.name)+'</strong><small>'+km.toFixed(2).replace('.',',')
       +' km Luftlinie</small></div>'
       +btn('inspector-neighbor','Details','pin',x.id,'subtle')+'</div>').join('')
       :'<p>Keine weiteren einzeln verorteten Aktivitäten innerhalb von fünf Kilometern.</p>')
     +'<div class="inspector-link-row">'+urlLink(p.maps,'Google Maps')
       +urlLink(p.route,'ÖPNV-Anreise')+'</div></div>',
 };
 const tabBar='<div class="inspector-tabs" role="tablist" aria-label="Ortsinformationen">'
   +tabs.map(([id,label],i)=>'<button type="button" role="tab" class="inspector-tab"'
     +' id="inspector-tab-'+id+'" aria-controls="inspector-panel-'+id+'"'
     +' aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'"'
     +' data-action="inspector-tab" data-value="'+id+'">'+label+'</button>').join('')+'</div>';
 const content=tabs.map(([id],i)=>'<section id="inspector-panel-'+id+'"'
   +' class="inspector-panel" role="tabpanel" aria-labelledby="inspector-tab-'+id+'"'
   +(i===0?'':' hidden')+'>'+panels[id]+'</section>').join('');
 return '<div class="inspector-shell"><div class="inspector-header">'
   +cover+'<div class="inspector-header-content"><span class="inspector-eyebrow">'
   +esc(city)+' · '+esc(labels[item.kind]??'Reiseort')+'</span>'
   +'<h3>'+esc(item.name)+'</h3><div class="inspector-meta">'
   +'<span><strong>'+esc(price.tier)+'</strong> '+esc(price.amount)+'</span>'
   +'<span>'+srcCount+' Quellen</span><span>'+p.photos.length+' Bilder</span>'
   +'<span>'+quality.gaps.length+' offene Punkte</span></div>'
   +'<div class="inspector-header-actions">'
   +btn('inspector-map','Auf Karte zeigen','pin',item.id)
   +(['activity','lodging','transport'].includes(item.kind)
     ?btn('inspector-compare-add',compareIds.includes(item.id)?'Aus Vergleich nehmen':'Zum Vergleich',
       compareIds.includes(item.id)?'check':'plus',item.id):'')
   +(compareIds.length>=2?btn('inspector-compare-view','Vergleich ('+compareIds.length+')','list',item.id):'')
   +btn('commons-photo-search','Foto suchen','compass',item.id)
   +'</div></div></div>'+tabBar+'<div class="inspector-panels">'+content+'</div>'
   +'<div class="inspector-footer"><div><small>'+esc(city)+'</small>'
   +'<strong>'+esc(item.name)+'</strong></div><div class="inspector-footer-buttons">'
   +(prev?btn('inspector-neighbor','← Vorheriger','pin',prev.id,'subtle'):'')
   +(next?btn('inspector-neighbor','Nächster →','pin',next.id,'subtle'):'')
   +'</div></div></div>';
}
