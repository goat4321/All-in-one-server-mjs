import {esc,btn,icon} from './ui.mjs';
import {explorerCategory} from './map-explorer.mjs';

// All records stay in the unlocated list, regardless of whether the user
// deliberately hides the approximate city-summary glyphs from the basemap.
// The reasons are conservative and do NOT represent a successful geocoding.
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
export function unlocatedOverview(ctx){
 const rows=Array.isArray(ctx?.explorer?.unlocated)?ctx.explorer.unlocated:[];
 const cities=new Map(),kinds=new Map();
 for(const item of rows){
  const city=item.city??'unknown';
  if(!cities.has(city))cities.set(city,[]);
  cities.get(city).push(item);
  const kind=unlocatedKind(item).key;
  kinds.set(kind,(kinds.get(kind)??0)+1);
 }
 return {total:rows.length,cities,kinds,
   preview:[...cities.entries()]
    .sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'de'))
    .flatMap(([city,items])=>{
      const priority={address:0,unverified:1,concept:2,private:3};
      return [...items].sort((a,b)=>priority[unlocatedKind(a).key]-priority[unlocatedKind(b).key])
        .slice(0,3).map(item=>({city,item,reason:unlocatedKind(item)}));
    })
    .slice(0,12)};
}
export function mapUnlocatedReview(ctx){
 const state=unlocatedOverview(ctx);
 if(!state.total)return '';
 const human=state.total===1?'Ort':'Orte';
 const summary=(ctx.explorer?.placed?.length??0)+' mit belegtem Kartenpunkt · '
  +state.total+' ohne individuellen Pin';
 const list=state.preview.map(({city,item,reason})=>{
  const name=esc(item.name??'Unbenannter Ort');
  const cityName=esc(ctx.cities?.[city]?.name??city);
  const canLookup=reason.key==='address'&&!item.booked
    &&item.provider!=='Airbnb';
  return '<article class="map-unlocated-record" data-unlocated-type="'+reason.key+'">'
   +'<div class="map-unlocated-record-head"><span class="map-unlocated-kind">'
   +icon(explorerCategory(item)==='lodging'?'bed':'pin')+' '+esc(reason.label)+'</span>'
   +'<small>'+cityName+'</small></div>'
   +'<strong>'+name+'</strong><p>'+esc(reason.reason)+'</p>'
   +'<p class="map-unlocated-next"><strong>Dein nächster Schritt:</strong> '+esc(reason.action)+'</p>'
   +'<div class="map-unlocated-actions">'
   +btn('details','Details & Quellen','folder',item.id,'subtle')
   +(canLookup?btn('geocode-lookup','Adresse prüfen','pin',item.id,'subtle'):'')
   +'</div></article>';
 }).join('');
 const badges=[
  ['private','Private Unterkünfte'],['concept','Gebiete / Ideen'],
  ['address','Adresse ohne Punkt'],['unverified','Ohne Standortbeleg']
 ].filter(([key])=>state.kinds.has(key))
 .map(([key,label])=>'<span class="map-unlocated-breakdown" data-kind="'+key+'">'
  +'<strong>'+state.kinds.get(key)+'</strong> '+esc(label)+'</span>').join('');
 const mapMarkers=Boolean(ctx.explorer?.showCityReferences);
 return '<details class="map-unlocated-review"'+(ctx.mapUnlocatedOpen?' open':'')+'>'
  +'<summary><span class="map-unlocated-summary-icon">'+icon('pin')+'</span>'
  +'<span><strong>'+state.total+' '+human+' ohne genaue Position</strong>'
  +'<small>'+esc(summary)+' · Prüfliste statt Fragezeichen auf der Karte</small></span>'
  +'<span class="map-unlocated-chevron">'+icon('chevron')+'</span></summary>'
  +'<div class="map-unlocated-body">'
  +'<p>Diese Orte werden <strong>nicht an geschätzten Positionen</strong> eingezeichnet.'
  +' Die Liste enthält Beispiele aus den aktuellen Kartenfiltern. Alle offenen'
  +' Angaben sind im Daten-Audit vollständig einzeln aufgelistet.</p>'
  +'<div class="map-unlocated-breakdowns">'+badges+'</div>'
  +'<div class="map-unlocated-switch">'+btn('explorer-references',
    mapMarkers?'Ungefähre Stadtmarker ausblenden':'Stadt-Sammelmarker anzeigen',
    'layers','','subtle')
  +'<small>Stadt-Sammelmarker sind keine Gebäude-Pins und werden nur auf Wunsch angezeigt.</small></div>'
  +'<div class="map-unlocated-grid">'+list+'</div>'
  +(state.total>state.preview.length
    ?'<p class="map-unlocated-more">Hier '+state.preview.length+' Beispiele · weitere '
     +(state.total-state.preview.length)+' Einträge im vollständigen Daten-Audit.</p>':'')
  +'<div class="map-unlocated-footer">'+btn('hud-audit','Alle fehlenden Kartenpunkte prüfen',
    'arrow','location','primary')+'</div>'
  +'</div></details>';
}
