import {entryCompleteness} from './entry-completeness.mjs';
import {placeThumbnailHtml,placeProfileModel} from './place-profile.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';
import {esc,btn,urlLink} from './ui.mjs';

const isSwiss=ctx=>ctx?.trip?.id==='interrail_swiss'&&ctx.trip.dayPlansV32?.length===14;
const sourceFor=(item,ctx)=>{
 const rows=(Array.isArray(item?.source)?item.source:[])
   .map(id=>ctx.catalog?.sources?.[id]).filter(Boolean)
   .map(s=>({url:typeof s==='string'?s:s.url,title:typeof s==='string'?'Webbeleg':s.publisher??'Quellenseite'}))
   .filter(r=>/^https:\/\//.test(r.url??''));
 if(/^https:\/\//.test(item.website??''))rows.push({url:item.website,title:'Website des Eintrags (Angebot ungeprüft)'});
 return rows[0]??null;
};
const correspondingItems=(ctx,day)=>{
 const all=ctx.all??ctx.trip?.items??[];
 return [...new Set((day?.slots??[]).map(row=>row.id))].map(id=>all.find(i=>i.id===id&&!i.removed))
  .filter(Boolean);
};
/** Live source/gap inventory for the actual 14-day Swiss variant.
 * A trip-wide card for an option is counted once even when repeated on days.
 */
export function swiss14QualityInventory(ctx){
 if(!isSwiss(ctx))return null;
 const days=ctx.trip.dayPlansV32.map(day=>{
  const items=correspondingItems(ctx,day);
  return {date:day.date,city:day.city,rideCount:day.rides?.length??0,
   entries:items.map(item=>{
    const evidence=entryCompleteness(item,ctx);
    const source=sourceFor(item,ctx);
    return {id:item.id,name:item.name,city:item.city,kind:item.kind,
      hasPhoto:evidence.hasPhoto,photoScope:evidence.photoEvidenceScope,
      sourceUrl:source?.url??null,priceKnown:evidence.hasPrice,hoursDocumented:evidence.publishedHours,
      gaps:evidence.gaps.map(g=>({key:g.key,label:g.label,reason:g.reason??g.next}))};
   })};
 });
 const unique=new Map(days.flatMap(day=>day.entries).map(e=>[e.id,e]));
 return {days,unique:[...unique.values()],
  gaps:[...unique.values()].filter(e=>e.gaps.length),
  imageGaps:[...unique.values()].filter(e=>!e.hasPhoto),
  sourceGaps:[...unique.values()].filter(e=>!e.sourceUrl)};
}
export function renderSwiss14QualityDay(ctx){
 if(!isSwiss(ctx)||!ctx.dayPlan)return '';
 const day=ctx.dayPlan,items=correspondingItems(ctx,day);
 // The existing chronology remains below; this preview only prioritizes proof.
 const ranked=items.map(item=>({item,evidence:entryCompleteness(item,ctx)}))
  .sort((a,b)=>Number(!b.evidence.hasPhoto)-Number(!a.evidence.hasPhoto)
      ||b.evidence.gaps.length-a.evidence.gaps.length);
 const cards=ranked.slice(0,4).map(({item,evidence})=>{
  const source=sourceFor(item,ctx),profile=placeProfileModel(item,ctx);
  const detail=String(item.detail??item.note??item.swissGuideV75?.summary??'')
     .trim().slice(0,260);
  // Attribution stays below the media, even if external images are blocked.
  const photo=profile?.photo;
  const media=photo
   ?'<div class="swiss-quality-media">'+placeThumbnailHtml(item,ctx)+'</div>'
      +'<div class="swiss-quality-credit">Bild: '+esc(photo.credit)
      +' · '+urlLink(photo.sourceUrl,'Bildquelle')
      +(photo.licenseUrl?' · '+urlLink(photo.licenseUrl,'Lizenz'):'')+'</div>'
   :'<div class="swiss-quality-media swiss-quality-no-photo"><strong>Kein verifiziertes Objektfoto</strong>'
      +'<small>Nur Orts-/Symbolvorschau – nicht mit einem konkreten Foto verwechseln.</small></div>';
  const airbnb=item.provider==='Airbnb'||item.id.startsWith('wishlist:airbnb:');
  const maps=(!airbnb&&item.pointPrecision!=='unverified_or_not_single_location'
      &&item.kind==='activity')?googleMapsSearchUrl(item,ctx.cities):null;
  return '<article class="swiss-quality-card" data-quality-id="'+esc(item.id)+'">'
    +'<div class="swiss-quality-photo">'+media+'</div>'
    +'<div class="swiss-quality-body"><small>'+esc(item.id)+' · '
     +(evidence.hasPhoto?'Lizenzbild im Detail':'Kein verifiziertes Objektfoto')+'</small>'
    +'<h4>'+esc(item.name)+'</h4>'
    +(detail?'<p>'+esc(detail)+'</p>':'<p>Ausführliche objektbezogene Beschreibung fehlt noch.</p>')
    +'<p class="swiss-quality-status">Preis: '+esc(profile?.priceLabel??'offen')
     +' · Öffnung: '+(evidence.publishedHours?'historische Referenz vorhanden':'für 2027 nicht bestätigt')+'</p>'
    +'<p class="swiss-quality-gaps">'+(evidence.gaps.length
      ?'<strong>Offen:</strong> '+esc(evidence.gaps.slice(0,4).map(x=>x.label).join(' · '))
      :'Datenfelder laut vorhandenem Katalog abgedeckt; 2027 dennoch neu prüfen')+'</p>'
    +'<div class="swiss-quality-actions">'+btn('details','Details & Quellen','folder',item.id,'subtle')
    +(maps?urlLink(maps,'Google Maps Suche'):'')
    +(source?urlLink(source.url,'Vorhandenen Quellenbeleg öffnen'):'')
    +'</div></div></article>';
 }).join('');
 const ride=(day.rides??[]).length;
 const lodging=(ctx.active??[]).find(i=>i.kind==='lodging'&&i.city===day.city&&!i.removed
   &&i.stayFrom<=day.date&&day.date<=i.stayTo);
 return '<section class="swiss-quality-day" aria-label="Bilder und Quellen für diesen Reisetag">'
   +'<header><strong>Orte, Bilder & Quellen dieses Tages</strong>'
   +'<p>Quellenbewusste Vorschau der bereits vorhandenen Tagesideen; keine automatische Übernahme. '
   +'Der Filter stellt lückenhafte Einträge zuerst, ohne die Tagesreihenfolge zu verändern.</p></header>'
   +(cards?'<div class="swiss-quality-grid">'+cards+'</div>'
    :'<p>Bewusst keine zusätzlichen Aktivitäten an diesem Reise-/Ruhetag.</p>')
   +(ranked.length>4?'<p>'+ (ranked.length-4)+' weitere Ideen sind im vollständigen Tagesplan sichtbar.</p>':'')
   +'<div class="swiss-quality-facts"><p><strong>Transport:</strong> '+ride
    +' vorläufige Tagesverbindung(en); Fahrplan, Buchung und Zuschläge 2027 getrennt prüfen.</p>'
   +'<p><strong>Unterkunft:</strong> '+esc(lodging?.name??'Für diesen Tag nicht eindeutig ausgewählt')
    +' · Betten, Check-in/-out und Endpreis individuell bestätigen.</p>'
   +'<p><strong>Verpflegung:</strong> Tagesmenü, vorhandene Küche und Einkauf unter '
    +btn('page','Essen & Einkaufen öffnen','food','food','subtle')+'</p></div>'
   +'</section>';
}
export function swiss14GapSummary(ctx){
 const audit=swiss14QualityInventory(ctx);
 if(!audit)return '';
 const rows=audit.gaps.slice(0,24).map(e=>'<li><strong>'+esc(e.id)+'</strong>'
   +' · '+esc(e.name)+' · '+esc(ctx.cities?.[e.city]?.name??e.city)
   +'<small>'+esc(e.gaps.map(g=>g.key+': '+g.label).join(' · '))+'</small>'
   +(e.sourceUrl?' '+urlLink(e.sourceUrl,'Bestandsquelle'):'')
   +'</li>').join('');
 return '<details class="swiss-14-gap-summary"><summary>Schweizer 14-Tage-Fokus: '
   +audit.unique.length+' eindeutige Tagesideen, '+audit.imageGaps.length
   +' ohne spezifisches Foto, '+audit.sourceGaps.length+' ohne Webbeleg</summary>'
   +'<p>Automatische Live-Auswertung der bestehenden Tagesideen. Fehlende Preise,'
   +' Öffnungszeiten, Einzelnachweise und Geodaten werden nicht automatisch ergänzt.'
   +' Reisetage ohne Besichtigung bleiben absichtlich leer.</p>'
   +(rows?'<ol>'+rows+'</ol>':'<p>Keine offenen Datensätze in diesem Ausschnitt.</p>')
   +(audit.gaps.length>24?'<p>'+ (audit.gaps.length-24)
      +' weitere offene Einträge über die vollständige Datenlückenliste prüfen.</p>':'')
   +'</details>';
}
