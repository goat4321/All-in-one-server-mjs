import {esc,urlLink} from './ui.mjs';
import {hasIndependentPointEvidence,markerProvenance} from './poi-location-provenance.mjs';
import {existingPinReviewUrl,publicPlaceReviewSearchUrl} from './map-location-review.mjs';

// Diagnostic only: two close map coordinates do not prove identity or a door.
// Thresholds distinguish probable mismatches for HUMAN verification.
export function providerReferenceDistanceState(distance){
 if(distance===null||!Number.isFinite(distance)||distance<0)
   return {kind:'uncompared',label:'Kein unabhängiger GPS-Vergleich möglich'};
 if(distance<=25)return {kind:'near',label:'Koordinaten nahe beieinander · kein nachgewiesener Eingang'};
 if(distance<=150)return {kind:'review',label:'Lageabweichung · getrennt prüfen'};
 return {kind:'conflict',label:'Großer Lageunterschied · Objektidentität prüfen'};
}
export function providerReviewMapLinks(row,cityLabel=''){
 if(!row||String(row.id??'').startsWith('wishlist:airbnb:')
   ||String(row.provider??'').toLowerCase()==='airbnb')return [];
 const currentAddress=row.currentPublishedAddress??row.publishedAddress;
 const publicItem={id:row.id,city:row.city,name:row.name,address:currentAddress};
 const lookup=publicPlaceReviewSearchUrl(publicItem,cityLabel);
 const hint=existingPinReviewUrl({...publicItem,point:row.providerPoint});
 return [
  ...(lookup?[{kind:'address-search',label:'Öffentliche Adresse in OSM suchen',url:lookup}]:[]),
  ...(hint?[{kind:'provider-hint',label:'Historischen Anbieterpin in OSM vergleichen',url:hint}]:[])
 ];
}


// The historical V13 provider leads are immutable observations. Reconcile
// them with later independent references rather than displaying 17 stale
// "unverified" flags after a public address/POI was manually reviewed.
const distanceMetres=(a,b)=>{
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==2||b.length!==2
   ||![...a,...b].every(Number.isFinite))return null;
 const rad=Math.PI/180,dl=(b[0]-a[0])*rad,dy=(b[1]-a[1])*rad;
 const h=Math.sin(dl/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dy/2)**2;
 return Math.round(6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.max(0,h)))));
};
export function providerLocationAudit(ctx){
 const source=ctx.catalog?.research?.providerLocationsV13;
 if(!source)return null;
 const route=new Set(ctx.trip?.route??[]);
 const addresses=new Map((ctx.catalog.research.publicAddressesV09?.entries??[])
   .map(row=>[row.id+'|'+row.city,row]));
 const items=new Map((ctx.trip?.items??[]).map(x=>[x.id+'|'+x.city,x]));
 const rows=source.items.filter(r=>route.has(r.city)).map(row=>{
   const key=row.id+'|'+row.city;
   const record=addresses.get(key),item=items.get(key);
   const addressQualification=record?.addressQualification??null;
   const qualificationHint={
     listing_floor_or_number_ambiguity:'Die veröffentlichte Angabe „2 piano“ könnte das Stockwerk statt der Hausnummer meinen. Der genaue Hauszugang bleibt ungeklärt.',
     published_number_conflicting_postcode:'Die Postleitzahl weicht zwischen öffentlichen Quellen ab (30174 bzw. 30173).',
     published_restaurant_address_distinct_from_similar_named_poi:'Ein ähnlich benannter Karten-POI gehört zu einem anderen Lokal; kein automatischer Standortabgleich.'
   }[addressQualification]??null;
   const addressConflict=row.reviewStatus==='provider_identity_address_conflict'
      ||Boolean(qualificationHint);
   const reference=Array.isArray(record?.point)&&Array.isArray(item?.point)
     &&hasIndependentPointEvidence(item)
     &&distanceMetres(record.point,item.point)!==null
     &&distanceMetres(record.point,item.point)<=30;
   return {...row,
     currentPublishedAddress:record?.address??row.publishedAddress,
     currentAddressSource:record?.sourceUrl??row.publishedAddressSource,
     historicalAddressChanged:Boolean(record?.address&&row.publishedAddress
       &&record.address!==row.publishedAddress),
     addressQualification,addressConflict,qualificationHint,
     verifiedReference:Boolean(reference),
     referencePoint:reference?record.point:null,
     referencePrecision:reference?record.precision:null,
     referenceUrl:reference?item.geoEvidence?.url??null:null,
     referenceKind:reference?markerProvenance(item).kind:null,
     providerDifferenceMetres:reference&&Array.isArray(row.providerPoint)
       ?distanceMetres(record.point,row.providerPoint):null
   };
 });
 return {
   rows,
   providerLeads:rows.filter(r=>Array.isArray(r.providerPoint)).length,
   conflicts:rows.filter(r=>r.addressConflict).length,
   unlocated:rows.filter(r=>!r.verifiedReference).length,
   independentlyVerified:rows.filter(r=>r.verifiedReference).length,
   unmatchedProviderPoints:rows.filter(r=>Array.isArray(r.providerPoint)&&!r.verifiedReference).length,
 };
}
export function providerLocationPanel(ctx){
 const m=providerLocationAudit(ctx);
 if(!m)return '';
 return '<section class="section panel panel-pad provider-location-panel" aria-label="Anbieterstandorte und unabhängige Koordinatenreferenzen">'
   +'<div class="provider-location-head"><div><h2>Standortprüfung · öffentliche Adressen</h2>'
   +'<p>Historische Anbieter-GPS-Angaben getrennt von später unabhängig belegten '
   +'Adress-/POI-Referenzen. Ein solcher Punkt bestätigt keinen Eingangsweg.</p></div>'
   +'<strong>'+m.unlocated+' von '+m.rows.length+' offen</strong></div>'
   +'<div class="provider-location-stats"><span>'+m.providerLeads+' historische Anbieterpunkte</span>'
   +'<span>'+m.unmatchedProviderPoints+' Anbieterpunkte ohne Quellenabgleich</span>'
   +'<span>'+m.conflicts+' Adress-/Identitätskonflikte</span>'
   +'<span>'+m.independentlyVerified+' unabhängig belegte Referenzpunkte</span></div>'
   +(m.rows.length?'<details><summary>Einzelprüfung und Quellen öffnen ('+m.rows.length+')</summary>'
     +'<div class="provider-location-list">'+m.rows.map(r=>
       '<article class="provider-location-item'
        +(r.addressConflict?' has-conflict':'')
        +(r.verifiedReference?' has-independent-point':'')+'">'
       +'<strong>'+esc(r.name)+'</strong><small>'+esc(ctx.cities?.[r.city]?.name??r.city)+'</small>'
       +'<p><b>Aktuell belegte Anschrift:</b> '+esc(r.currentPublishedAddress??'Offen')+'</p>'
       +(r.historicalAddressChanged
         ?'<details class="provider-location-history"><summary>Alte Adressfassung zeigen</summary>'
           +'<p><b>Nicht mehr als Hausnummer bestätigt:</b> '
           +esc(r.publishedAddress)+'</p></details>':'')
       +(r.qualificationHint
         ?'<p class="provider-location-address-warning">'+esc(r.qualificationHint)+'</p>':'')
       +'<p><b>Anbieterangabe (historisch):</b> '+esc(r.providerAddress??'Kein Anbieterpunkt vorhanden')+'</p>'
       +'<p class="provider-location-status">'
       +(r.reviewStatus==='provider_identity_address_conflict'
          ?'Achtung: Objektidentität/Anschrift widersprüchlich – keine automatische Übernahme. '
          :'')
       +(r.verifiedReference
          ?'Unabhängiger Referenzpunkt vorhanden · Gebäudezugang nicht nachgewiesen.'
          :r.providerPoint
            ?'Anbieterpunkt vorhanden, noch nicht unabhängig verortet.'
            :'Keine unabhängige genaue GPS-Referenz vorhanden.')
       +'</p>'
       +(r.providerDifferenceMetres!=null
         ?'<p class="provider-location-difference" data-distance-state="'
           +esc(providerReferenceDistanceState(r.providerDifferenceMetres).kind)+'">'
           +'Abstand zwischen Anbieterpin und öffentlicher Quellenposition: ca. '
           +r.providerDifferenceMetres+' m · '
           +esc(providerReferenceDistanceState(r.providerDifferenceMetres).label)
           +' · keine Eingangszertifizierung.</p>':'')
       +'<div class="row-actions">'+urlLink(r.currentAddressSource,'Adressquelle')
       +urlLink(r.providerUrl,'Historische Anbieteransicht')
       +urlLink(r.referenceUrl,'Unabhängige Kartenreferenz')
       +providerReviewMapLinks(r,ctx.cities?.[r.city]?.name??r.city)
         .map(link=>urlLink(link.url,link.label)).join('')
       +'</div></article>'
      ).join('')+'</div></details>':'')
   +'<p class="muted">Diese Prüfung ändert keine Positionsdaten automatisch. '
   +'Privatadressen aus Airbnb-Wunschlisten werden nicht ermittelt. '
   +'Tatsächliche Eingänge sowie Buchbarkeit für September 2027 sind separat zu prüfen.</p>'
   +'</section>';
}
