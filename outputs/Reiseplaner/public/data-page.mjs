import {esc,btn,icon,dateText,status,empty,alert,urlLink,table} from './ui.mjs';
import {localParts} from './model.mjs';
import {readinessPanel} from './readiness-panel.mjs';
import {mediaCoveragePanel} from './media-coverage.mjs';
import {providerLocationPanel} from './provider-location-v13.mjs';
import {entryCoveragePanel,gapReasonsHtml} from './entry-coverage-ui.mjs';
import {entryCompleteness} from './entry-completeness.mjs';
import {surveyV19DataPanel} from './survey-v19-ui.mjs';
import {v20DataLedger} from './research-v20-ui.mjs';

const stat=(label,value,note='')=>'<div class="panel stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong>'+(note?'<p>'+esc(note)+'</p>':'')+'</div>';

export const dataSections=[
 {id:'gaps',title:'Fehlende Angaben gezielt prüfen',note:'Nach Stadt, Kategorie und fehlendem Nachweis filtern; vollständigen Bericht exportieren'},
 {id:'quality',title:'Datenqualität & Importhinweise',note:'Widersprüche, offene Prüfaufgaben und erhaltene Originaleinträge'},
 {id:'media',title:'Fotos & Bildquellen',note:'Zuordnung, Lizenz und fehlende Orts- oder Unterkunftsfotos'},
 {id:'locations',title:'Unterkunftsorte abgleichen',note:'Anbieterpositionen, öffentliche Adressen und unabhängige Referenzen'},
 {id:'coverage',title:'Alle Einträge & Quellenstände',note:'Vollständige Matrix dieser Reise mit Karten-, Preis- und Öffnungsstatus'},
 {id:'open-places',title:'Offene Standorte & Menüpreise',note:'Einzelbegründungen und nächste Recherchequelle'},
 {id:'imports',title:'Recherche importieren & Importbestand',note:'JSON/CSV als neue Alternativen einlesen; bisherige Importe einsehen'},
 {id:'archive',title:'Recherchearchiv & frühere Prüfungen',note:'Importprotokolle, Umfragepakete und historische Prüfergebnisse'},
 {id:'sources',title:'Alle Recherchequellen',note:'Vollständiges gemeinsames Quellenverzeichnis mit Abrufdatum'},
];

export function renderDataSection(ctx,key){
 if(!dataSections.some(section=>section.id===key))return '';
 switch(key){
  case 'gaps':return entryCoveragePanel(ctx,{deferReasons:true});
  case 'media':return mediaCoveragePanel(ctx);
  case 'locations':return providerLocationPanel(ctx)||'<p>Keine passenden Anbieterpositionsdaten für diese Variante.</p>';
  case 'archive':return dataPart(ctx,key)+surveyV19DataPanel(ctx)+v20DataLedger(ctx);
  default:return dataPart(ctx,key)||'<p>Für diese Reise liegen hier keine weiteren Einträge vor.</p>';
 }
}

export function renderCoverageReasons(ctx,id){
 const item=ctx.all.find(item=>item.id===id);
 return item?gapReasonsHtml(entryCompleteness(item,ctx)):'';
}

export function renderDataPage(ctx){
 const open=new Set(ctx.dataOpenSections??[]);
 const quality=(ctx.catalog.research?.quality??[]).filter(q=>!q.resolved&&(q.trip_id==='all'||q.trip_id===ctx.trip.id));
 const urgent=quality.filter(q=>q.severity==='critical'||q.severity==='high').length;
 return '<header class="page-head data-page-heading"><div><h1>Daten & Fristen</h1><p>Vorbereitung im Blick. Quellen und Einzelprüfungen bei Bedarf öffnen.</p></div>'
  +'<div class="section-actions">'+btn('export','JSON sichern','download')+btn('ics','Kalender exportieren','calendar')+'</div></header>'
  +'<div class="data-page">'
  +dataPart(ctx,'deadlines')+readinessPanel(ctx)
  +'<section class="data-checks" aria-labelledby="data-checks-heading"><h2 id="data-checks-heading">Quellen & Prüfungen</h2>'
  +'<p>'+ctx.all.length+' Einträge dieser Reise · '+quality.length+' dokumentierte offene Datenbefunde'
  +(urgent?' · '+urgent+' mit hoher oder kritischer Priorität':'')+'. Ausführliche Prüfungen bleiben getrennt vom Tagesplan.</p>'
  +dataSections.map(section=>{
   const isOpen=open.has(section.id);
   return '<details class="data-disclosure" data-data-section="'+section.id+'"'+(isOpen?' open':'')+'>'
    +'<summary><span><strong>'+section.title+'</strong><small>'+section.note+'</small></span>'+icon('chevron')+'</summary>'
    +'<div class="data-disclosure-body"'+(isOpen?' data-loaded="true"':'')+'>'
    +(isOpen?renderDataSection(ctx,section.id):'')+'</div></details>';
  }).join('')+'</section></div>';
}

function dataPart(ctx,key) {
  const { trip, state, variant, all, catalog } = ctx;
  const imported = Object.entries(trip.importCounts).map(([key, value]) => [esc(({activities:'Aktivitäten',transportations:'Verbindungen',hostings:'Unterkünfte',expenses:'Budgetreferenzen',documents:'Dokumente'})[key] ?? key), esc(value ?? 'Kein Zugriff')]);
  const research = catalog.research;
  const coverage=key==='coverage'?research?.coverageV07?.find(record=>record.variant===trip.id):null;
  const auditRows=(coverage?.entries??[]).map(x=>[
    esc(catalog.cities[x.city]?.name ?? x.city),esc(x.name),esc(x.category),
    x.geolocationMissing?status('Nur theoretische Stadtorientierung','warn'):status(
      x.pointStatus==='sourced_area_center'?'Quellbezogener Gebiets-/Objektmittelpunkt':x.pointStatus==='provider_reported_unverified'?'Anbieterkoordinate · nicht unabhängig geprüft':'Kartenpunkt belegt',''),
    esc(x.priceStatus==='source_price_reference'?'Historische Preisreferenz':
      x.priceStatus==='old_wishlist_sample_not_a_trip_price'?'Airbnb-Suchpreis-Snapshot'
      :x.priceStatus==='menu_observation_not_trip_price'?'Menüpreis-Beispiel · kein September-Checkout'
      :'2027-Preis offen'),
    esc(x.hoursStatus==='published_reference_recheck_2027'?'Öffnungsreferenz / Datum prüfen':'Öffnungszeiten offen'),
    esc(x.sourceStatus==='linked_source_reference'?'Quellenbezug vorhanden':'Kein eindeutiger Anbieterbeleg'),
    (urlLink(x.googleMapsUrl,'Karte') || '')+' '+(urlLink(x.googleTransitUrl,'ÖPNV') || ''),
  ]);
  const allMenuAudit=key==='open-places'?research?.foodMenuV08:null;
  const missingGeo=research?.unresolvedReasonsV09?.items
    .filter(item=>key==='open-places'&&trip.route.includes(item.city))??[];
  const pendingGeoRows=missingGeo.map(item=>[
    esc(item.name),esc(catalog.cities[item.city]?.name??item.city),
    esc(item.reason),
    item.knownPublicAddress
      ? esc(item.knownPublicAddress)
        + (item.providerAddressSource?' '+(urlLink(item.providerAddressSource,'Anschriftenquelle')||''):'')
      : esc(item.privateAirbnbProperty?'Exakte Airbnb-Adresse nicht öffentlich':'Keine eindeutige Hausadresse bestätigt'),
    esc(item.nextStep),
    (urlLink(item.googleMapsSearchUrl,'Google Maps')??'Suche offen')+' '
      +(urlLink(item.googleTransitUrl,'ÖPNV-Anfahrt')??''),
  ]);
  const auditV08Panel=(allMenuAudit||missingGeo.length)
    ? '<section class="section panel panel-pad"><h2>Einzelrecherche: offene Standorte und Menüpreise v0.9</h2>'
      + '<div class="stat-grid">'
      + stat('Gastro-Einträge geprüft',String(allMenuAudit?.counts.total??0),
        (allMenuAudit?.counts.priced??0)+' mit Menü-/Artikelpreisbelegen')
      + stat('Einmalige ungeklärte Ortsdatensätze',String(missingGeo.length),
        'Innerhalb dieser Reisevariante, nicht 1:1 Kartenpins')
      + '</div><p class="muted">Jeder noch unlokalisierte Eintrag hat eine Begründung und eine Karten-Suche. '
      +'Auch für Airbnb ohne veröffentlichte Adresse und flexible Aktivitäten wird kein fingierter Punkt erzeugt. '
      +'Original-Ergebnisse der früheren Photon-Recherche sind gesichert; offene Kandidaten dürfen nicht ungeprüft übernommen werden.</p>'
      + (pendingGeoRows.length
        ? '<details><summary>Alle '+missingGeo.length+' noch offenen unterschiedlichen Orte dieser Route anzeigen</summary>'
          + table(['Name','Ort','Individuelle Begründung','Öffentliche Adresse / Beleg','Nächster Prüfschritt','Google Maps'],pendingGeoRows)+'</details>'
        : '')+'</section>' : '';
  const coveragePanel=coverage ? '<section class="section panel panel-pad"><h2>Vollständige Datenabdeckung dieser Reisevariante</h2>'
    + '<div class="stat-grid">'
    + stat('Datensätze',String(coverage.total),'Alle Kategorien')
    + stat('Kartenpunkte',String(coverage.withPrecisePoint),coverage.withoutPrecisePoint+' ohne präzisen Punkt')
    + stat('Preisreferenzen',String(coverage.withPriceReference),'Nicht gleich 2027er Checkout')
    + stat('Öffnungsreferenzen',String(coverage.withHoursReference),'Am Reisetag prüfen')
    + '</div><p class="muted">Die Matrix ordnet jedem Eintrag seine vorhandenen Quellenstände zu. Das ist keine erneute Betreiberbestätigung. Der theoretische Stadtanker wird niemals als exakter Kartenpin dargestellt. Wo Preise/Öffnungszeiten nicht belegt sind, bleibt der Wert offen.</p>'
    + '<p class="muted">Kategorien: ' + Object.entries(coverage.byCategory).map(([k,v])=>esc(k)+': '+v).join(' · ') + '</p>'
    + '<details><summary>Alle ' + coverage.total + ' Datensätze, Quellenstände und Google-Maps-/ÖPNV-Links anzeigen</summary>'
    + table(['Ort','Eintrag','Kategorie','Kartengeometrie','Preis','Öffnungszeiten','Quellenstatus','Google Maps'],auditRows)
    + '</details></section>' : '';
  const quality = (research?.quality ?? []).filter(item => key==='quality' && !item.resolved
    && (item.trip_id === 'all' || item.trip_id === trip.id));
  const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
  quality.sort((a, b) => (priorities[a.severity] ?? 9) - (priorities[b.severity] ?? 9));
  const qualityRows = quality.map(item => [
    status(item.severity === 'critical' ? 'Kritisch' : item.severity === 'high' ? 'Hoch'
      : item.severity === 'medium' ? 'Mittel' : 'Niedrig', ['critical','high'].includes(item.severity) ? 'warn' : ''),
    esc(item.domain), esc(item.finding), esc(item.action.replaceAll('_', ' ')),
    (item.source_ids ?? []).map(id => urlLink(catalog.sources[id]?.url, id) || esc(id)).join(' · ') || 'Keine Direktquelle',
  ]);
  const issues = all.filter(i => key==='quality' && (i.duplicateOf || i.positionIssue || i.importConflict))
    .map(i => '<li>' + esc(i.originalName ?? i.name) + ' · ' + esc([i.positionIssue, i.importConflict].filter(Boolean).join(' ') || 'Dublettenverdacht, Quelle erhalten') + '</li>');
  const deadlineRows = state.deadlines.slice().sort((a, b) => String(a.when ?? 'z').localeCompare(String(b.when ?? 'z'))).map(d => {
    const date = localParts(d.when, d.zone);
    return [esc(d.title), esc(d.when ? dateText(date.date) + ' ' + date.time + ' · ' + d.zone : 'Zeitpunkt offen'),
      status(d.done ? 'Erledigt' : !d.when ? 'Unklar' : Date.parse(d.when) < Date.now() ? 'Verstrichen' : 'Offen'), btn('deadline', 'Bearbeiten', 'edit', d.id)];
  });
  switch(key){
    case 'coverage':return coveragePanel;
    case 'open-places':return auditV08Panel;
    case 'imports':return '<section class="section panel panel-pad"><h2>Recherche importieren</h2><p class="muted">JSON oder CSV in die aktuelle Variante einlesen. Dateieinträge beginnen als Alternativen.</p>'
    + '<form id="import-form" class="row-actions section"><label class="field"><span>Datei</span><input type="file" name="file" accept=".csv,.json" required></label><button class="button primary" type="submit">' + icon('upload') + 'Importieren</button>'
    + '<div class="form-error" aria-live="polite"></div></form><small>Spalten: name, city oder destination_id, kind, id, amount, currency, price_scope, latitude, longitude, source_url.</small></section>'
    + (variant.logs?.length ? table(['Import', 'Neu', 'Vorhanden', 'Konflikte'], variant.logs.map(l => [esc(l.filename), l.inserted, l.existing, l.conflicts])) : '') + '<section class="section"><h2>' + (trip.dataMode === 'research_seed_fallback' ? 'Lokales Recherchearchiv · reduzierter Bestand' : 'Tripsy-Import') + ' · ' + esc(dateText(trip.importedOn)) + '</h2>' + (trip.dataMode === 'research_seed_fallback' ? alert('Kein vollständiger Tripsy-Snapshot. Angezeigte Datensätze sind nur aus dem Forschungs-Seed rekonstruiert; die ursprünglichen Buchungen werden nicht ersetzt.') : '') + table(['Quelle', 'Verfügbar'], imported) + '</section>';
    case 'deadlines':return '<section class="section"><div class="subheading compact"><h2>Buchungen & Fristen</h2>' + btn('deadline', 'Frist erfassen', 'plus') + '</div>'
    + (deadlineRows.length ? table(['Eintrag', 'Ortszeit', 'Status', ''], deadlineRows) : empty('Keine bestätigten Fristen', 'Buchungsfenster und Stornierungsbedingungen sind für diese Reise offen.')) + '</section>';
    case 'archive':return (research ? '<section class="section"><h2>Forschungsarchiv · Stand ' + esc(research.observedOn) + '</h2>'
      + '<div class="stat-grid">' + stat('Aktivitäten gesamt', String(research.counts.activityCandidates), research.counts.addedActivities + ' neue Ideen')
      + stat('Unterkunfts-Suchpreise', String(research.counts.accommodationSearchQuotes), 'Nicht checkoutbestätigt')
      + stat('Zugabschnitte zur Prüfung', String(research.counts.transportLegs), 'Fahrplan 2027 offen')
      + stat('Datenprobleme dokumentiert', String(research.counts.issues), 'Ausführliche Liste unten')
      + '</div><p class="muted">Die 20 Quellen-Dateien sind als separate Referenz archiviert. '
      + 'Neue Vergleichsangebote sind weder bezahlt noch automatisch ausgewählt; 2027er Zeiten und Endpreise bleiben offen.</p></section>' : '');
    case 'quality':return (qualityRows.length ? '<section class="section"><h2>Offene Datenqualitätsbefunde dieser Reise</h2>'
      + table(['Schwere', 'Bereich', 'Feststellung', 'Nötiger Schritt', 'Quelle'], qualityRows)
      + '</section>' : '')
    + (issues.length ? '<section class="section panel panel-pad"><h2>Importhinweise</h2><ul class="sources-list">' + issues.join('') + '</ul></section>' : '');
    case 'sources':return '<section class="section panel panel-pad"><h2>Recherchequellen</h2><ul class="sources-list">'
    + Object.values(catalog.sources).map(s => '<li>' + (urlLink(s.url, s.publisher) || esc(s.publisher)) + ' · ' + esc(s.accessed_on || 'Prüfdatum offen') + '</li>').join('') + '</ul></section>';
    default:return '';
  }
}
