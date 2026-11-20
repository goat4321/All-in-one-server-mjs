import {esc,icon,btn,urlLink} from './ui.mjs';
import {placeThumbnailHtml} from './place-profile.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';
import {hasIndependentPointEvidence} from './poi-location-provenance.mjs';

/* All URLs are pre-existing provider/attraction references or the two
 * official rail timetable pages checked on 20 Nov 2026. A link is NOT a
 * September 2027 reservation, verified connection, checkout or price. */
export const SWISS_EDITORIAL_SOURCES=Object.freeze({
 interrail_res:['Interrail · internationale Reservierungen','https://www.interrail.com/en/book-reservations/reservation-fees/international-train-reservation-fees'],
 interrail_days:['Interrail · Regeln für Reisetage','https://www.interrail.com/en/support/interested-in-interrailing/what-is-a-travel-day'],
 interrail_home:['Interrail · Reise im Wohnsitzland','https://www.interrail.com/en/interrail-passes/what-is-interrail/travel-your-own-country'],
 interrail_fr_es:['Interrail · Frankreich/Spanien-Zugreservierung','https://help.interrail.com/hc/en-001/articles/18055734561053-How-do-I-book-trains-between-France-and-Spain'],
 sncf_window:['SNCF · Verkaufsvorlauf','https://www.sncf-connect.com/en-en/help/ticket-sales-opening'],
 eiffel:['Eiffelturm · Öffnung und Tickets','https://www.toureiffel.paris/en/rates-opening-times'],
 sagrada:['Sagrada Família · Tickets und Bedingungen','https://sagradafamilia.org/en/prices?inheritRedirect=true'],
 tmb:['TMB · ÖPNV Barcelona','https://www.tmb.cat/en/barcelona-fares-metro-bus/transport-ticket-fares'],
 ratp:['RATP · ÖPNV Paris','https://www.ratp.fr/en/titres-et-tarifs/ticket-metro-train-rer'],
 nice_tram:['Lignes d’Azur · ÖPNV Nizza','https://www.lignesdazur.com/en/travel-tickets'],
 oesch:['Oeschinensee · Gondel, Betriebszeit und Tarife','https://www.oeschinensee.ch/tarife-fahrplan/'],
 seealp:['Appenzellerland · Seealpsee-Wandervorschlag','https://www.appenzell.ch/en/summer/hiking/hiking-tour-suggestions.html?cHash=3676d92113ab42494b1be2b8e71ae7b6&tx_wstourismus_tourismus%5Baction%5D=show&tx_wstourismus_tourismus%5Bcontroller%5D=Tour&tx_wstourismus_tourismus%5Btour%5D=39'],
 sbb:['SBB · Fahrplan und Aktualitätsgrenzen','https://www.sbb.ch/en/help-and-contact/products-services/timetable.html'],
 appenzeller:['Appenzeller Bahnen · Fahrplan','https://appenzellerbahnen.ch/de/reiseinformationen/fahrplan.html'],
});
const phases={morning:['Vormittag','sun'],noon:['Mittag / Nachmittag','clock'],evening:['Abend','moon']};

export function swissDayEditorial(ctx) {
 const e=ctx?.catalog?.research?.interrailSwissEditorialV08?.days?.find(
  d=>d.date===ctx.date&&d.tripId==='interrail_swiss');
 if(ctx.trip?.id!=='interrail_swiss'||ctx.people?.length!==3||!e||!ctx.dayPlan
   ||e.city!==ctx.dayPlan.city||e.travellers!==3)return null;
 return e;
}

/** Source-backed UI only. This function never changes a draft or inserts an
 * activity. The existing day-plan-add handler is the ONLY adoption path. */
export function swissDayEditorialPanel(ctx) {
 const day=swissDayEditorial(ctx);
 if(!day)return '';
 const existing=ctx.dayPlan.slots??[];
 const present=new Set((ctx.active??[]).filter(item=>
   item.kind==='activity'&&!item.removed&&item.date===ctx.date).map(item=>item.id));
 const cards=day.blocks.map((block,i)=>{
  const phase=phases[block.period]??['Flexibel','calendar'];
  const slot=block.activityId?existing.find(x=>x.activityId===block.activityId):null;
  const item=slot?(ctx.all??[]).find(x=>x.id===slot.id&&x.city===day.city):null;
  // Names and images come exclusively from the existing selected variant.
  // An editorial block without a matching v32 slot stays informational.
  const photo=item?placeThumbnailHtml(item,ctx):'';
  const canAdd=slot&&item&&dayPlanCandidates(ctx,{activityId:slot.id})
    .some(x=>x.id===slot.id);
  const already=Boolean(slot&&present.has(slot.id));
  const hasPoint=Boolean(item?.point?.length===2
    &&hasIndependentPointEvidence(item));
  const actions=item?'<div class="swiss-editorial-actions">'
    +(canAdd?btn('day-plan-add',slot.optional?'Option zum Tag':'Zum Tag','plus',slot.id,'primary')
      :already?'<span class="swiss-editorial-adopted">'+icon('check')+' Im Tagesplan</span>':'')
    +btn('details','Ort & Quellen','folder',item.id)
    +(hasPoint?urlLink(googleMapsSearchUrl(item,ctx.cities),'Auf Google Maps suchen'):'')
    +'</div>':'';
  return '<article class="swiss-editorial-block" data-editorial-period="'+esc(block.period)+'"'
    +(block.activityId?' data-editorial-activity="'+esc(block.activityId)+'"':'')+'>'
    +'<header><span class="swiss-editorial-day-number">'+String(i+1).padStart(2,'0')+'</span>'
    +'<span>'+icon(phase[1])+' '+esc(phase[0])+'</span>'
    +(slot?.optional?'<small>Option, nicht fest eingeplant</small>':'')+'</header>'
    +'<div class="swiss-editorial-block-body">'
    +(photo?'<div class="swiss-editorial-photo">'+photo+'</div>'
      :'<div class="swiss-editorial-icon" aria-label="Organisation statt überprüftem Objektfoto">'
        +icon(block.period==='morning'?'train':block.period==='evening'?'moon':'calendar')
        +'</div>')
    +'<div class="swiss-editorial-block-copy">'
    +'<h4>'+esc(item?.name??block.title)+'</h4>'
    +(item?.name&&block.title!==item.name?'<strong class="swiss-editorial-subtitle">'
      +esc(block.title)+'</strong>':'')
    +'<p>'+esc(block.note)+'</p>'
    +(slot?'<small>Bestehende Tagesidee · ca. '+slot.minutes
      +' Min. Planungsdauer · noch keine bestätigte Uhrzeit</small>'
      :'<small>Organisation / Puffer · kein neuer Kartenort und kein geschätzter Preis</small>')
    +actions+'</div></div></article>';
 }).join('');
 const sources=day.sourceIds.map(id=>SWISS_EDITORIAL_SOURCES[id]).filter(Boolean);
 return '<section class="swiss-editorial-day" aria-label="Redaktioneller Tagesentwurf für drei Reisende"'
  +' data-editorial-date="'+esc(day.date)+'">'
  +'<header class="swiss-editorial-head"><div>'
  +'<span class="swiss-editorial-eyebrow">14-TAGE-REISE · 3 REISENDE · UNVERBINDLICH</span>'
  +'<h3>Dein Tag in drei Abschnitten</h3><p>Vorhandene Ideen plus realistische Reise-, Essens- und Ruhephasen.'
  +' Nichts wird automatisch zum aktiven Tagesplan hinzugefügt.</p></div>'
  +'<span>Tag '+Number(day.date.slice(-2))+' / 14</span></header>'
  +'<div class="swiss-editorial-blocks">'+cards+'</div>'
  +'<div class="swiss-editorial-practical">'
  +'<article><strong>'+icon('food')+' Essen & Küche</strong><p>'+esc(day.food)+'</p></article>'
  +'<article><strong>'+icon('clock')+' Puffer & Transfer</strong><p>'+esc(day.buffer)+'</p></article>'
  +'<article><strong>'+icon('compass')+' Alternative</strong><p>'+esc(day.alternative)+'</p></article></div>'
  +'<div class="swiss-editorial-risk" role="note">'+icon('alert')
  +'<span><strong>Budget-, Öffnungs- und Buchungsstatus:</strong> '
  +esc(day.risk)+' Alle noch offenen Kosten bleiben offen. Angaben beziehen sich nur'
  +' auf Planung und bekannte Quellen, nicht auf Buchungen für September 2027.</span></div>'
  +(sources.length?'<nav class="swiss-editorial-sources" aria-label="Quellen zum Tag">'
    +'<strong>Quellen prüfen:</strong> '
    +sources.map(([label,url])=>urlLink(url,label)).join('')+'</nav>':'')
  +'</section>';
}
