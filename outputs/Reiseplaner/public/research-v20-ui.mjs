import {btn,esc,status} from './ui.mjs';
import {money} from './model.mjs';
import {planCostSignal} from './visual-experience.mjs';
const research=ctx=>ctx.catalog.research?.researchV20;
const place=(ctx,id)=>ctx.cities[id]?.name??id;
const link=(url,label)=>typeof url==='string'&&/^https:\/\//.test(url)
  ?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':'';
const panel=(heading,sub,inner)=>'<section class="section panel panel-pad research-v20">'
  +'<div class="research-v20-heading"><span>WEBPRÜFUNG · 14.11.2026</span><h2>'+esc(heading)
  +'</h2><p>'+esc(sub)+'</p></div>'+inner+'</section>';

export function v20RailStatus(ctx){
  const r=research(ctx);
  if(!r)return '';
  const currentId=ctx.catalog.research?.surveyFirstV19?.variants?.[ctx.trip.id]?.archiveTripId;
  const legs=r.railFood?.transport?.filter(x=>x.tripId===currentId)??[];
  if(!legs.length)return '';
  return panel('Bahnprüfung: September 2027','Offizielle Buchungsfenster, aber keine erfundene Zugnummer oder Abfahrtszeit.',
    '<p>Die SNCF hat am 12.11.2026 TGV-Züge bis zum 02.07.2027 freigegeben. '
    +'Für die hier geplanten August-/Septemberfahrten ist dadurch weder ein passender Zug noch ein Reservierungsplatz bestätigt. '
    +link(r.railFood.railSalesReference,'Offizielle SNCF-Verkaufsfenster')+'</p>'
    +'<details><summary>'+legs.length+' individuelle Verbindungslücken und nächste Prüfschritte</summary>'
    +'<div class="research-v20-ledger">'+legs.map(x=>'<article><div><strong>'
      +esc(place(ctx,x.from))+' → '+esc(place(ctx,x.to))+'</strong> · '+esc(x.plannedDate)
      +' · <b>€?</b> Fahrtpreis offen'
      +(x.reservationReferenceCents!=null?' · Reservierungsreferenz '
        +esc(money(x.reservationReferenceCents,x.reservationReferenceCurrency))+' p. P.':'')
      +'</div><small>'+esc(x.rejectionReason)+'</small><small>'+esc(x.nextAction)+'</small>'
      +'<div class="row-actions">'+x.operatorLinks.map(url=>link(url,'Betreiber prüfen')).join(' ')+'</div>'
      +'</article>').join('')+'</div></details>');
}

export function v20FoodResearch(ctx){
  const r=research(ctx);if(!r)return '';
  const ideas=r.railFood?.food.filter(x=>x.city===ctx.city)??[];
  if(!ideas.length)return '';
  const newItems=new Map(ctx.all.filter(i=>i.id.startsWith('survey-v20-indoor:')).map(i=>[i.id,i]));
  return panel('Verifizierte Anbieter & offene Essensideen',
    'Konkrete, belegte Betreiber statt erfundener Restaurants. 2027er Menüs, Tickets und Öffnungszeiten müssen erneut geprüft werden.',
    '<div class="research-v20-food">'+ideas.map(x=>{
      const indoor=x.newIndoorCandidateIds.map(id=>newItems.get('survey-v20-indoor:'+id)).filter(Boolean);
      return '<article><strong>'+esc(x.originalIdea)+'</strong>'
        +'<small>'+esc(x.reason)+'</small>'
        +(indoor.length?'<div class="research-v20-offers">'+indoor.map(item=>{
          const s=planCostSignal(item,ctx.people.length);
          return '<div><div><strong>'+esc(item.name)+'</strong><small>'
            +'<b>'+esc(s.tier)+'</b> · '+esc(s.amount)+'</small></div>'
            +'<div class="row-actions">'+btn('details','Details','folder',item.id)
            +(ctx.activeSet.has(item.id)?status('Im Plan','green'):btn('choose','Einplanen','plus',item.id,'subtle'))
            +link(item.website,'Tarifquelle')+'</div></div>';
        }).join('')+'</div>':'')
        +(x.relatedFoodVenueReferences?.length?'<details><summary>'
          +x.relatedFoodVenueReferences.length+' ältere, konkret dokumentierte Essensbetriebe</summary>'
          +x.relatedFoodVenueReferences.map(v=>'<p><strong>'+esc(v.name)+'</strong> '
            +(v.sampleMenu?.length?' · Preisbeispiel '+esc(v.sampleMenu[0].name)+' '
              +esc(money(v.sampleMenu[0].cents))+' · '+esc(v.asOf):' · Menüpreis offen')
            +' · '+link(v.sourceUrl,'Quelle')+'</p>').join('')+'</details>':'')
        +'<small>Nächster Schritt: '+esc(x.nextAction)+'</small></article>';
    }).join('')+'</div>');
}

export function v20DataLedger(ctx){
  const r=research(ctx);
  if(!r)return '';
  const ids=new Set(ctx.all.map(x=>x.id));
  const activityRows=r.activities.filter(x=>ids.has('survey-v19:'+x.id));
  const hotelRows=r.lodging.filter(x=>ids.has('survey-v19:'+x.id));
  const evidenceType={sourced_named_poi:'Quellenpunkt',sourced_object_area_center:'Gebietsmittelpunkt',
    building_area_reference:'Gebäude/Fläche',park_area_reference:'Parkbereich',
    tower_footprint:'Bauwerk',unverified_or_not_single_location:'Kein eindeutiger Einzelpunkt'};
  const a=activityRows.map(x=>'<tr><td>'+esc(place(ctx,x.city))+'</td><td>'+esc(x.name)+'</td>'
    +'<td>'+esc(evidenceType[x.pointPrecision]??x.pointPrecision)+'</td>'
    +'<td>'+esc(x.priceOverride?.kind??x.priceReference?.kind??'Keine neue Preisbestätigung')+'</td>'
    +'<td>'+esc(x.geoNote??'Offen')+'</td>'
    +'<td>'+link(x.sourceUrl,'Beleg')+'</td></tr>').join('');
  const hotels=hotelRows.map(x=>'<tr><td>'+esc(place(ctx,x.city))+'</td><td>'+esc(x.name)+'</td>'
    +'<td>'+esc(x.independentMapEvidence?'Öffentlich belegter Ort':x.geographyConflict?
      'Positionen widersprechen sich':'Nur Anbieterposition')+'</td>'
    +'<td>'+esc(x.newSearch?money(x.newSearch.totalCents)+' · Suche '+x.newSearch.observedOn:
      'Keine neue individuelle Suche')+'</td>'
    +'<td>'+esc(x.geographyConflict?'Konflikt '+x.geographyConflict.distanceMetres+' m · nicht als belegt übernehmen':
      x.remaining.slice(0,3).join('; '))+'</td>'
    +'<td>'+link(x.newSearch?.url??x.providerUrl,'Anbieter')+'</td></tr>').join('');
  const unmodeled=r.activities.filter(x=>Array.isArray(x.candidatePoint)
    &&!ctx.catalog.cities[x.city]);
  const optionalPlaces=unmodeled.length
    ?'<details class="research-v20-optional-places"><summary>'
       +unmodeled.length+' verifizierte Georeferenz(en) für noch nicht aktive Alternativstädte'
       +'</summary><p>Diese Quellenpunkte sind dokumentiert, aber bewusst nicht als'
       +' aktive Kartenmarker nutzbar. Die Stadt muss zunächst als Ziel mit Reisedaten'
       +' und Quellen in den Reisekatalog aufgenommen werden; danach kann der'
       +' öffentliche Orientierungspunkt gesondert freigegeben werden.</p>'
       +'<div class="table-wrap"><table><thead><tr><th>Alternative Stadt</th>'
       +'<th>Öffentlicher Bezugspunkt</th><th>Warum noch nicht auf der Karte?</th>'
       +'<th>Geografische Quelle</th></tr></thead><tbody>'
       +unmodeled.map(x=>'<tr><td>'+esc(x.city.charAt(0).toUpperCase()+x.city.slice(1))+'</td>'
         +'<td>'+esc(x.name)+'</td><td>'+esc(x.geoNote??'Nicht im aktiven Reisekatalog')+'</td>'
         +'<td>'+link(x.candidateGeoSourceUrl,'Öffentlichen Punkt prüfen')+'</td></tr>').join('')
       +'</tbody></table></div></details>':'';
  const stats=r.stats;
  return panel('Einzelprüfung aller alten und neuen Datensätze',
    'Das Originalarchiv bleibt erhalten; nur quellenbezogene Änderungen werden im Katalog übernommen.',
    '<div class="research-v20-statline">'
    +'<span><strong>'+stats.reviewedActivities+'</strong> Aktivitäten auditiert</span>'
    +'<span><strong>'+stats.activitySourcePoints+'</strong> geografische Aktivitätsbelege</span>'
    +'<span><strong>'+stats.independentLodgingPoints+'</strong> unabhängig zugeordnete Hotelorte</span>'
    +'<span><strong>'+stats.updatedLodgingSearches+'</strong> Unterkunftssuchpreise erneut gesehen</span>'
    +'<span><strong>'+stats.providerPositionConflicts+'</strong> Ortskonflikt(e)</span>'
    +'<span><strong>'+stats.indoorUnique+'</strong> neue Indoor-Betreiber</span></div>'
    +'<details><summary>Einzelrecherche: '+activityRows.length+' Aktivitäten dieser Variante</summary>'
    +'<div class="table-wrap"><table><thead><tr><th>Ort</th><th>Aktivität</th><th>Punktstatus</th>'
    +'<th>Tarifstatus</th><th>Offene Einschränkung</th><th>Quelle</th></tr></thead><tbody>'+a+'</tbody></table></div></details>'
    +'<details><summary>Einzelrecherche: '+hotelRows.length+' Unterkünfte dieser Variante</summary>'
    +'<div class="table-wrap"><table><thead><tr><th>Ort</th><th>Unterkunft</th><th>Lage</th>'
    +'<th>Neuester Suchstand</th><th>Offene Einschränkung</th><th>Link</th></tr></thead><tbody>'+hotels
    +'</tbody></table></div></details>'
    +optionalPlaces
    +'<details><summary>Alle 29 Bahn- und 40 Essens-/Abend-Prüffälle aus dem Archiv</summary>'
    +'<p>Alle Fälle sind einzeln in der Version 20 als JSON dokumentiert. '+stats.reviewedRailLegs
    +' Fahrt-/Transferreferenzen bleiben ohne 2027er Abfahrtszeit, '
    +stats.reviewedFoodAndEveningIdeas+' Ideen ohne automatische Buchung oder Menüzusage. '
    +'Die jeweils aktuellen Orts- und Tageslisten sind unter Bahn und Verpflegung zu finden.</p></details>'
    +'<p class="muted">€ bedeutet immer eine Vergleichsstufe aus dokumentierten EUR-Beträgen, nicht ein Stadtpreisniveau. '
    +'€? bedeutet fehlende Vergleichbarkeit. CHF- und bedingte Kind-/Ermäßigungspreise bleiben als solche erkennbar.</p>');
}
