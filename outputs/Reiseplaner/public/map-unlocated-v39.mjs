import {esc,btn,chip,icon} from './ui.mjs';
import {explorerCategory} from './map-explorer.mjs';
import {hasIndependentPointEvidence,markerProvenance} from './poi-location-provenance.mjs';

// Missing coordinates are not a place category or a map position. A city
// orientation marker never becomes an item.point or is routed as a stop.
export const UNLOCATED_TYPES=Object.freeze([
 ['all','Alle offenen Positionen'],['address','Öffentliche Adressen'],
 ['unverified','Ohne Standortbeleg'],['concept','Gebiete und Ideen'],
 ['private','Private Unterkünfte']
]);
export function unlocatedKind(item){
 if(item?.provider==='Airbnb'||String(item?.id??'').startsWith('wishlist:airbnb:'))
   return {key:'private',label:'Private Unterkunft',
     reason:'Private Hausadresse nicht öffentlich nachgewiesen; kein erfundener Haustür-Pin.',
     action:'Grobe Lage und Buchungsbedingungen privat prüfen.'};
 if(item?.pointPrecision==='unverified_or_not_single_location'
   ||/concept|general_portal_or_concept_only/i.test(
     String(item?.researchV20?.reviewStatus??'')+' '+String(item?.researchStatus??'')))
   return {key:'concept',label:'Gebiet oder flexible Idee',
     reason:'Kein einzelner verifizierter Eingang oder Treffpunkt für diese Aktivität festgelegt.',
     action:'Konkreten öffentlichen Treffpunkt oder passenden OSM-POI auswählen.'};
 if(typeof item?.address==='string'&&item.address.trim())
   return {key:'address',label:'Adresse vorhanden',
     reason:'Eine Adresse ist gespeichert, aber ihre objektspezifische genaue GPS-Position ist nicht bestätigt.',
     action:'Öffentliche Anbieteradresse und Kartenpunkt einzeln prüfen.'};
 return {key:'unverified',label:'Standortbeleg fehlt',
   reason:'Kein belegter Einzelpunkt hinterlegt; ein Stadtzentrum wäre irreführend.',
   action:'Exakten öffentlichen Objektlink oder OSM-POI nachreichen.'};
}
// A user-triggered OSM lookup is research only; it does not update a pin.
// Never search an exact private short-let property address.
export function openStreetMapReviewUrl(item,city=''){
 const type=unlocatedKind(item).key;
 if(!['address','unverified'].includes(type))return null;
 const term=String(item.address??item.name??'').trim().slice(0,150);
 if(!term)return null;
 return 'https://www.openstreetmap.org/search?query='
   +encodeURIComponent(term+' '+String(city??'').slice(0,80));
}
const norm=value=>String(value??'').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function unlocatedOverview(ctx){
 const all=Array.isArray(ctx?.explorer?.unlocated)?ctx.explorer.unlocated:[];
 const cities=new Map(),kinds=new Map();
 for(const item of all){
  const city=item.city??'unknown';
  if(!cities.has(city))cities.set(city,[]);
  cities.get(city).push(item);
  const kind=unlocatedKind(item).key;
  kinds.set(kind,(kinds.get(kind)??0)+1);
 }
 const type=UNLOCATED_TYPES.some(([key])=>key===ctx.mapUnlocatedFilter)
   ?ctx.mapUnlocatedFilter:'all';
 const query=norm(ctx.mapUnlocatedSearch).trim().slice(0,100);
 const filtered=all.filter(item=>{
  if(type!=='all'&&unlocatedKind(item).key!==type)return false;
  const label=[item.name,item.city,ctx.cities?.[item.city]?.name,
   item.address,item.detail,item.note].join(' ');
  return !query||norm(label).includes(query);
 });
 const filteredCities=new Map();
 for(const item of filtered){
  const city=item.city??'unknown';
  if(!filteredCities.has(city))filteredCities.set(city,[]);
  filteredCities.get(city).push(item);
 }
 // A round-robin preview prevents a single high-volume city from hiding all
 // other cities. Within each city, prioritize verifiable public addresses.
 const priority={address:0,unverified:1,concept:2,private:3};
 const groups=[...filteredCities.entries()]
  .sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'de'))
  .map(([city,items])=>({city,items:[...items].sort((a,b)=>
    priority[unlocatedKind(a).key]-priority[unlocatedKind(b).key]
    ||String(a.name).localeCompare(String(b.name),'de'))}));
 const limit=Math.min(120,Math.max(12,Number(ctx.mapUnlocatedLimit)||12));
 const preview=[];
 for(let offset=0;preview.length<limit;offset++){
  let found=false;
  for(const g of groups){
   if(offset>=g.items.length)continue;
   preview.push({city:g.city,item:g.items[offset],reason:unlocatedKind(g.items[offset])});
   found=true;
   if(preview.length===limit)break;
  }
  if(!found)break;
 }
 return {total:all.length,cities,kinds,type,query,filteredTotal:filtered.length,
   preview,hasMore:filtered.length>preview.length};
}
export function mapUnlocatedReview(ctx){
 const state=unlocatedOverview(ctx);
 if(!state.total)return '';
 const placed=ctx.explorer?.placed??[];
 const independentlySourced=placed.filter(hasIndependentPointEvidence).length;
 const summary=placed.length+' mit Kartenposition · davon '
   +independentlySourced+' mit Quellenbeleg · '+state.total+' ohne Einzelpunkt';
 const list=state.preview.map(({city,item,reason})=>{
  const cityName=esc(ctx.cities?.[city]?.name??city);
  const canLookup=reason.key==='address'&&!item.booked&&item.provider!=='Airbnb';
  const osmLink=openStreetMapReviewUrl(item,ctx.cities?.[city]?.name??city);
  const publicAddressSource=reason.key==='address'
    ?(item.addressEvidenceV09?.sourceUrl??item.geoReviewV09?.sourceUrl??null):null;
  const evidenceLink=typeof publicAddressSource==='string'&&/^https:\/\//.test(publicAddressSource)
    ?publicAddressSource:null;
  return '<article class="map-unlocated-record" data-unlocated-type="'+reason.key+'">'
   +'<div class="map-unlocated-record-head"><span class="map-unlocated-kind">'
   +icon(explorerCategory(item)==='lodging'?'bed':'pin')+' '+esc(reason.label)+'</span>'
   +'<small>'+cityName+'</small></div>'
   +'<strong>'+esc(item.name??'Unbenannter Ort')+'</strong><p>'+esc(reason.reason)+'</p>'
   +'<p class="map-unlocated-next"><strong>Dein nächster Schritt:</strong> '+esc(reason.action)+'</p>'
   +'<div class="map-unlocated-actions">'
   +btn('details','Details & Quellen','folder',item.id,'subtle')
   +(canLookup?btn('geocode-lookup','Adresse prüfen','pin',item.id,'subtle'):'')
   +(osmLink?'<a class="button subtle" href="'+esc(osmLink)+'" target="_blank"'
     +' rel="noopener noreferrer">'+icon('external')+' In OpenStreetMap suchen</a>':'')
   +(evidenceLink?'<a class="button subtle" href="'+esc(evidenceLink)+'" target="_blank"'
     +' rel="noopener noreferrer">'+icon('external')+' Hinterlegte Adressquelle</a>':'')
   +'</div></article>';
 }).join('');
 const filters='<div class="map-unlocated-facets" role="group" aria-label="Offene Orte filtern">'
  +UNLOCATED_TYPES.map(([key,label])=>chip('map-unlocated-filter',label+' · '
    +(key==='all'?state.total:state.kinds.get(key)??0),state.type===key,key))
    .join('')+'</div>';
 const mapMarkers=Boolean(ctx.explorer?.showCityReferences);
 return '<details class="map-unlocated-review"'+(ctx.mapUnlocatedOpen?' open':'')+'>'
  +'<summary><span class="map-unlocated-summary-icon">'+icon('pin')+'</span>'
  +'<span><strong>'+state.total+(state.total===1?' Ort':' Orte')
  +' ohne genaue Position</strong><small>'+esc(summary)
  +' · Keine geschätzten Einzelpins</small></span>'
  +'<span class="map-unlocated-chevron">'+icon('chevron')+'</span></summary>'
  +'<div class="map-unlocated-body">'
  +'<p>Die Kartenpunkte und ihre Nachweislage werden getrennt bewertet. '
  +'Private Hausadressen bleiben privat. Hier kannst du alle offenen '
  +'Einträge schrittweise prüfen, ohne sie als fiktive Stadtpunkte einzuzeichnen.</p>'
  +filters
  +'<div class="map-unlocated-search"><input type="search" id="map-unlocated-search" '
  +'maxlength="100" value="'+esc(ctx.mapUnlocatedSearch??'')+'"'
  +' placeholder="Ort, Stadt oder Stichwort" aria-label="Offene Orte suchen">'
  +btn('map-unlocated-search','Suchen','search','','subtle')
  +(state.query?btn('map-unlocated-clear','Zurücksetzen','reset','','subtle'):'')
  +'</div>'
  +'<p class="map-unlocated-count" role="status">'+state.preview.length+' von '
  +state.filteredTotal+' passenden Orten angezeigt · '+state.total+' insgesamt offen</p>'
  +'<div class="map-unlocated-grid">'+list+'</div>'
  +(!state.preview.length
    ?'<p class="map-unlocated-empty">Keine passenden Orte. Wähle einen anderen Filter oder setze die Suche zurück.</p>':'')
  +(state.hasMore?'<div class="map-unlocated-pagination">'
    +btn('map-unlocated-more','Weitere Orte anzeigen','plus','','subtle')+'</div>':'')
  +'<div class="map-unlocated-switch">'+btn('explorer-references',
    mapMarkers?'Stadt-Sammelmarker ausblenden':'Ungefähre Stadtmarker anzeigen',
    'layers','','subtle')
  +'<small>Stadtmarker sind nur Orientierung, keine nachgewiesenen Gebäude-Pins.</small></div>'
  +'<div class="map-unlocated-footer">'+btn('hud-audit','Alle fehlenden Kartenpunkte im Daten-Audit prüfen',
    'arrow','location','primary')+'</div>'
  +'</div></details>';
}


/**
 * Map pins without an independent object-specific coordinate source are
 * not "missing locations". They are a separate evidence queue. Displaying
 * a pin is not validation of the coordinate or building entrance.
 */
export function mapUnverifiedPinRows(ctx){
 const candidates=Array.isArray(ctx?.explorer?.placed)?ctx.explorer.placed:[];
 const rows=candidates.filter(item=>item?.id&&!item.explorerParent
  &&item.provider!=='Airbnb'&&!String(item.id).startsWith('wishlist:airbnb:')
  &&!hasIndependentPointEvidence(item));
 const type=ctx.mapEvidenceType==='provider'?'provider'
  :ctx.mapEvidenceType==='unverified'?'unverified':'all';
 const enriched=rows.map(item=>({item,source:markerProvenance(item)}));
 const sorted=enriched.sort((a,b)=>
   Number(a.source.kind==='provider')-Number(b.source.kind==='provider')
   ||String(a.item.city).localeCompare(String(b.item.city),'de')
   ||String(a.item.name).localeCompare(String(b.item.name),'de'));
 const filter=type==='all'?sorted:sorted.filter(x=>
   type==='provider'?x.source.kind==='provider':x.source.kind!=='provider');
 const limit=Math.max(10,Math.min(100,Number(ctx.mapEvidenceLimit)||10));
 return {total:rows.length,type,filteredTotal:filter.length,
  preview:filter.slice(0,limit),hasMore:filter.length>limit,
  providerCount:rows.filter(x=>markerProvenance(x).kind==='provider').length};
}
export function mapUnverifiedPointsReview(ctx){
 const d=mapUnverifiedPinRows(ctx);
 if(!d.total)return '';
 const buttons='<div class="map-evidence-facets" role="group" aria-label="Unsichere Kartenpunkte filtern">'
  +chip('map-evidence-type','Alle · '+d.total,d.type==='all','all')
  +chip('map-evidence-type','Anbieterpositionen · '+d.providerCount,d.type==='provider','provider')
  +chip('map-evidence-type','Andere ohne Beleg · '+(d.total-d.providerCount),
    d.type==='unverified','unverified')+'</div>';
 const cards=d.preview.map(({item,source})=>{
   const city=ctx.cities?.[item.city]?.name??item.city;
   const action=source.kind==='provider'
     ?'Anbieterposition – unabhängig mit Gebäude-/POI-Quelle abgleichen.'
     :'Gespeicherte GPS-Position – exakte öffentliche Objektquelle und Genauigkeit nachweisen.';
   return '<article class="map-unlocated-record map-evidence-record" data-source-quality="'
    +esc(source.kind)+'"><div class="map-unlocated-record-head">'
    +'<span class="map-unlocated-kind">'+icon('pin')+' '+esc(source.label)+'</span>'
    +'<small>'+esc(city)+'</small></div>'
    +'<strong>'+esc(item.name)+'</strong><p>'+esc(action)+'</p>'
    +'<div class="map-unlocated-actions">'
    +btn('details','Herkunft & Details prüfen','folder',item.id,'subtle')
    +'</div></article>';
 }).join('');
 return '<details class="map-unlocated-review map-evidence-review"'
   +(ctx.mapEvidenceOpen?' open':'')+'>'
   +'<summary><span class="map-unlocated-summary-icon">'+icon('alert')+'</span>'
   +'<span><strong>'+d.total+' Kartenpositionen ohne unabhängigen Koordinatenbeleg</strong>'
   +'<small>Die Karte zeigt diese Punkte als ungeprüft – nicht als bestätigten Eingang.</small></span>'
   +'<span class="map-unlocated-chevron">'+icon('chevron')+'</span></summary>'
   +'<div class="map-unlocated-body">'
   +'<p>Diese Datensätze haben bereits eine Koordinate, jedoch keinen hinreichenden '
   +'unabhängigen Einzelnachweis. Die genaue Position und insbesondere der Zugang müssen '
   +'weiter überprüft werden. Aktuelle Filter der Karte gelten auch für diese Liste.</p>'
   +buttons
   +'<p class="map-unlocated-count" role="status">'+d.preview.length+' von '
     +d.filteredTotal+' passenden Quellenprüfungen sichtbar</p>'
   +'<div class="map-unlocated-grid">'+cards+'</div>'
   +(!d.preview.length?'<p class="map-unlocated-empty">Kein Treffer in dieser Gruppe.</p>':'')
   +(d.hasMore?'<div class="map-unlocated-pagination">'
     +btn('map-evidence-more','Weitere Quellenprüfungen','plus','','subtle')+'</div>':'')
   +'<div class="map-unlocated-footer">'
   +btn('hud-audit','Koordinatenbelege im Daten-Audit öffnen','arrow','geo_evidence','primary')
   +'</div></div></details>';
}
