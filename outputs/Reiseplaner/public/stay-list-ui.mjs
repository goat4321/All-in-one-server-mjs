import {placeProfileModel,placeImageHtml} from './place-profile.mjs';
import {lodgingPriceInsight} from './price-insights.mjs';
import {assessStay,kitchenAccess} from './stay-analysis.mjs';
import {stayCancellationLabel,staySourceLinks} from './stay-facets.mjs';
import {esc,btn,icon,urlLink} from './ui.mjs';
import {money} from './model.mjs';

/** Only a property-specific listing URL may be called an offer link.
 * A provider homepage, category search, generic city result, or referral
 * search is not proof of a particular accommodation or room. */
export function stayExactListingUrl(item){
 const offer=staySourceLinks(item).offer;
 if(!offer)return null;
 try{
   const u=new URL(offer),host=u.hostname.toLowerCase().replace(/^www\./,'');
   const path=decodeURIComponent(u.pathname).toLowerCase();
   if(host==='booking.com'&&/^\/hotel\/[a-z]{2}\/[^/]+(?:\.html)?\/?$/.test(path))
     return u.href;
   if(/^airbnb\.(com|de|fr|es|ch|co\.uk)$/.test(host)
      &&/^\/rooms\/\d+(?:\/|$)/.test(path))return u.href;
 }catch{}
 return null;
}
export function stayLaundryState(item){
 const explicit=item?.washingMachine??item?.washer;
 if(explicit===true)return 'yes';
 if(explicit===false)return 'no';
 const detail=[item?.laundry,item?.washingMachine,item?.washer,
   ...(Array.isArray(item?.amenities)?item.amenities:[])].filter(x=>typeof x==='string').join(' ').toLowerCase();
 if(/(?:keine|ohne|no)\s+(?:waschmaschine|washing machine|washer)/.test(detail))return 'no';
 if(/(?:waschmaschine|washing machine|washer)/.test(detail))return 'yes';
 return 'unknown';
}
export function stayLocationState(item){
 if(!Array.isArray(item?.point)||item.point.length!==2
   ||!item.point.every(Number.isFinite))return 'Kein belegter Kartenpunkt';
 if(item?.geoEvidence?.isCentroid===true)return 'Gebietspunkt · kein Hauseingang';
 if(item?.geoEvidence?.precision==='area')return 'Gebietsposition · ungeprüft';
 return 'Kartenpunkt vorhanden · Eingang prüfen';
}
export function stayStatus(item,ctx){
 if(item?.booked===true)return 'Als gebucht im Plan markiert';
 if(ctx.activeSet?.has(item?.id))return 'Im Reiseplan · Buchung offen';
 return 'Vergleichsoption · Buchung offen';
}
export function stayListRow(item,ctx){
 const people=ctx.people?.length??3,city=ctx.cities?.[item.city]?.name??item.city;
 const p=lodgingPriceInsight(item,people,ctx.nightlyTargetEuro);
 const e=assessStay(item,ctx.people,ctx.hotelWalks?.[item.id],ctx.state?.verifications?.[item.id]);
 const photo=placeProfileModel(item,ctx)?.photo??null;
 const direct=stayExactListingUrl(item),src=staySourceLinks(item);
 const saved=ctx.browseSavedIds?.has(item.id)??(ctx.state?.favorites??[]).includes(item.id);
 const compared=ctx.compareIds?.has(item.id)??false;
 const kitchen=kitchenAccess(item),laundry=stayLaundryState(item);
 const nights=p?.nights;
 const dates=p?.isSample?[item.quote?.sampleFrom,item.quote?.sampleTo]:
   [item.stayFrom,item.stayTo];
 const dateText=dates.every(Boolean)?dates.join(' → '):'Aufenthaltstermine nicht belegt';
 const pricing=p?.personNightCents!=null
   ?money(p.personNightCents)+' pro Person / Nacht'
   :'Preis pro Person/Nacht offen';
 const group=p?.groupTotalCents!=null
   ?money(p.groupTotalCents)+' für '+people+' Personen'
   :'Gruppenpreis offen';
 const kind=p?.isSample?'Alter Suchwert':p?.groupTotalCents!=null?'Plan-/Preisreferenz':'Preis offen';
 const beds=e.bedsVerified?'Betten selbst geprüft':item.bedsDisplayed!=null
   ?item.bedsDisplayed+' Betten angegeben · ungeprüft':'Betten für Gruppe ungeprüft';
 const wash=laundry==='yes'?'Waschmaschine angegeben · prüfen':laundry==='no'?'Keine Waschmaschine laut Quelle':'Waschmaschine offen';
 const sourceLabel=direct?(src.booking?'Booking.com · Objektlink':'Airbnb · Objektlink'):
   src.operator?'Betreiberquelle · Tarif offen':src.offer?'Link nicht objektspezifisch':'Angebotslink offen';
 const station=e.stationWalkMinutes==null?'Bahnhof-Fußweg offen':e.stationWalkMinutes+' Min. berechneter Bahnhof-Fußweg';
 return '<article class="stay-list-row" data-stay-id="'+esc(item.id)+'" data-stay-city="'+esc(item.city)+'">'
   +'<div class="stay-list-media">'
   +(photo?placeImageHtml(item,ctx,{small:true})
     :'<div class="stay-list-photo-empty" role="img" aria-label="Kein verifiziertes Foto dieser Unterkunft">'
       +icon('bed')+'<span>Kein belegtes Objektfoto</span><small>Kein erfundenes Hotelbild</small></div>')
   +'<span class="stay-list-photo-status">'+esc(photo?'Belegtes Objektfoto':'Foto fehlt')+'</span></div>'
   +'<div class="stay-list-main"><p class="stay-list-kicker">'+esc(city)
      +' · '+esc(stayLocationState(item))+'</p>'
   +'<h3>'+esc(item.name)+'</h3>'
   +'<p class="stay-list-location">'+esc(item.address??'Adresse nicht unabhängig bestätigt')+'</p>'
   +'<div class="stay-list-essentials">'
   +'<span>'+icon('people')+esc(beds)+'</span>'
   +'<span>'+icon('food')+esc(kitchen==='usable'?'Küche beschrieben · prüfen':'Küche ungeklärt')+'</span>'
   +'<span>'+icon('calendar')+esc(nights!=null?nights+' Nächte · '+dateText:dateText)+'</span>'
   +'<span>'+icon('pin')+esc(station)+'</span></div>'
   +'<div class="stay-list-source-line"><strong>'+esc(sourceLabel)+'</strong>'
   +'<span>'+esc(item.quote?.observedOn?'Suchstand '+item.quote.observedOn:'Prüfdatum offen')+'</span></div>'
   +'<details class="stay-list-preview"><summary>Kurzübersicht · Ausstattung & Quellen</summary>'
   +'<div class="stay-list-preview-body"><p>'+esc(item.detail??item.note??'Keine geprüfte Objektbeschreibung verfügbar')+'</p>'
   +'<dl><div><dt>Storno</dt><dd>'+esc(stayCancellationLabel(item))+'</dd></div>'
   +'<div><dt>Waschmaschine</dt><dd>'+esc(wash)+'</dd></div>'
   +'<div><dt>Zimmer</dt><dd>'+esc(item.room??'Zimmeraufteilung offen')+'</dd></div>'
   +'<div><dt>Standort</dt><dd>'+esc(stayLocationState(item))+'</dd></div>'
   +'<div><dt>Datenprüfung</dt><dd>'+e.risk.length+' offene Prüfpunkte</dd></div></dl>'
   +'<div class="stay-list-preview-links">'+btn('details','Vollständige Details & Quellen','folder',item.id)
     +(direct?urlLink(direct,src.booking?'Objekt auf Booking.com':'Objekt auf Airbnb'):'')
     +(src.operator?urlLink(src.operator,'Betreiber-Referenz'):'')+'</div></div></details>'
   +'</div><div class="stay-list-decision">'
   +'<span class="stay-list-kind">'+esc(kind)+'</span><strong>'+esc(pricing)+'</strong>'
   +'<span>'+esc(group)+'</span>'
   +'<small>'+esc(p?.isSample?'Historischer Suchwert, kein Checkout 2027':p?.source??'Preis offen')+'</small>'
   +'<span class="stay-list-booking">'+esc(stayStatus(item,ctx))+'</span>'
   +'<div class="stay-list-actions">'+btn('details','Details','folder',item.id,'primary')
   +btn('browse-save',saved?'Gemerkt':'Merken',saved?'check':'bookmark',item.id)
   +btn('compare',compared?'Vergleich aktiv':'Vergleichen','compare',item.id)
   +'</div></div></article>';
}
export function stayList(items,ctx){
 return '<section class="stay-list-area" aria-label="Unterkunftsliste" id="unterkunftsliste">'
   +'<header class="stay-list-heading"><div><h2>Unterkünfte mit Quellen</h2>'
   +'<p>Große Objektfotos nur mit Nachweis. Preise sind historische Plan-/Suchwerte, keine Verfügbarkeit für 2027.</p></div>'
   +'<span>'+items.length+' Einträge</span></header>'
   +'<div class="stay-list-rows">'+items.map(item=>stayListRow(item,ctx)).join('')+'</div></section>';
}
