import { esc, urlLink } from './ui.mjs';

export function providerLocationAudit(ctx) {
  const source=ctx.catalog?.research?.providerLocationsV13;
  if(!source)return null;
  const route=new Set(ctx.trip?.route??[]);
  const rows=source.items.filter(r=>route.has(r.city));
  return {rows,providerLeads:rows.filter(r=>Array.isArray(r.providerPoint)).length,
    conflicts:rows.filter(r=>r.reviewStatus==='provider_identity_address_conflict').length,
    unlocated:rows.length,independentlyVerified:rows.filter(r=>r.independentGpsVerified).length};
}

export function providerLocationPanel(ctx) {
  const m=providerLocationAudit(ctx);
  if(!m)return '';
  return '<section class="section panel panel-pad provider-location-panel" aria-label="Anbieterstandorte ohne unabhängige Koordinaten">'
    +'<div class="provider-location-head"><div><h2>Standortprüfung · öffentliche Adressen</h2>'
    +'<p>Nur öffentliche Hotel- und Geschäftsadressen. Anbieterkoordinaten sind Recherchehinweise, keine bestätigten Kartenpins.</p></div>'
    +'<strong>'+m.unlocated+' offen</strong></div>'
    +'<div class="provider-location-stats"><span>'+m.providerLeads+' Anbieterhinweise</span>'
    +'<span>'+m.conflicts+' Adress-/Identitätskonflikte</span>'
    +'<span>'+m.independentlyVerified+' unabhängig bestätigte neue Punkte</span></div>'
    +(m.rows.length?'<details><summary>Einzelprüfung und Quellen öffnen ('+m.rows.length+')</summary>'
      +'<div class="provider-location-list">'+m.rows.map(r=>
        '<article class="provider-location-item'+(r.reviewStatus==='provider_identity_address_conflict'?' has-conflict':'')+'">'
        +'<strong>'+esc(r.name)+'</strong><small>'+esc(ctx.cities?.[r.city]?.name??r.city)+'</small>'
        +'<p><b>Gespeicherte öffentliche Anschrift:</b> '+esc(r.publishedAddress??'Offen')+'</p>'
        +'<p><b>Anbieterangabe:</b> '+esc(r.providerAddress??'Kein Treffer in der aktuellen Suche')+'</p>'
        +'<p class="provider-location-status">'+(r.reviewStatus==='provider_identity_address_conflict'
          ?'Widerspruch: Objektidentität und Anschrift vor Nutzung unbedingt unabhängig prüfen'
          :r.providerPoint?'Anbieterpunkt vorhanden, noch nicht unabhängig verortet'
          :'Kein eindeutiger Anbieterpunkt; bitte nicht als präzisen Pin behandeln')+'</p>'
        +'<div class="row-actions">'+urlLink(r.publishedAddressSource,'Bisherige Quelle')
        +urlLink(r.providerUrl,'Aktuelles Anbieterangebot')+'</div></article>').join('')+'</div>'
      +'</details>':'')
    +'<p class="muted">Kein neuer Punkt wurde automatisch in die Karte übernommen. Airbnb-Wunschlistenadressen werden nicht ermittelt.</p>'
    +'</section>';
}
