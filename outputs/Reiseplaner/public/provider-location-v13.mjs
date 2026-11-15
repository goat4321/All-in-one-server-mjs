import {esc,urlLink} from './ui.mjs';
import {hasIndependentPointEvidence,markerProvenance} from './poi-location-provenance.mjs';

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
   const reference=Array.isArray(record?.point)&&Array.isArray(item?.point)
     &&hasIndependentPointEvidence(item)
     &&distanceMetres(record.point,item.point)!==null
     &&distanceMetres(record.point,item.point)<=30;
   return {...row,
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
   conflicts:rows.filter(r=>r.reviewStatus==='provider_identity_address_conflict').length,
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
   +'<span>'+m.conflicts+' Identitäts-/Adresskonflikte</span>'
   +'<span>'+m.independentlyVerified+' unabhängig belegte Referenzpunkte</span></div>'
   +(m.rows.length?'<details><summary>Einzelprüfung und Quellen öffnen ('+m.rows.length+')</summary>'
     +'<div class="provider-location-list">'+m.rows.map(r=>
       '<article class="provider-location-item'
        +(r.reviewStatus==='provider_identity_address_conflict'?' has-conflict':'')
        +(r.verifiedReference?' has-independent-point':'')+'">'
       +'<strong>'+esc(r.name)+'</strong><small>'+esc(ctx.cities?.[r.city]?.name??r.city)+'</small>'
       +'<p><b>Veröffentlichte Anschrift:</b> '+esc(r.publishedAddress??'Offen')+'</p>'
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
         ?'<p class="provider-location-difference">Abstand zwischen Anbieterpin und '
           +'öffentlicher Quellenposition: ca. '+r.providerDifferenceMetres
           +' m · Koordinatenvergleich, keine Eingangszertifizierung.</p>':'')
       +'<div class="row-actions">'+urlLink(r.publishedAddressSource,'Adressquelle')
       +urlLink(r.providerUrl,'Historische Anbieteransicht')
       +urlLink(r.referenceUrl,'Unabhängige Kartenreferenz')+'</div></article>'
      ).join('')+'</div></details>':'')
   +'<p class="muted">Diese Prüfung ändert keine Positionsdaten automatisch. '
   +'Privatadressen aus Airbnb-Wunschlisten werden nicht ermittelt. '
   +'Tatsächliche Eingänge sowie Buchbarkeit für September 2027 sind separat zu prüfen.</p>'
   +'</section>';
}
