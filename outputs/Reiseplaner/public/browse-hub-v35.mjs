import {esc,icon,btn,urlLink} from './ui.mjs';
import {curatedPlacePhoto} from './curated-place-photos.mjs';
import {destinationIllustration} from './destination-illustration.mjs';
import {placeImageHtml,placeProfileModel} from './place-profile.mjs';
import {planCostSignal} from './visual-experience.mjs';
import {explorerCategory,explorerData,EXPLORER_GROUPS} from './map-explorer.mjs';
import {voteSnippet} from './group-vote.mjs';
import {lodgingPriceMeter} from './price-insights.mjs';
import {googleMapsSearchUrl,googleMapsSearchLabel} from './google-maps.mjs';

const kindTitle={lodging:'Unterkünfte entdecken',food:'Essen & Einkaufen',discover:'Orte & Aktivitäten'};
const kindSub={lodging:'Aufenthalte vergleichen – erst prüfen, dann auswählen',
 food:'Restaurants, Cafés, Supermärkte und Selbstversorgung',
 discover:'Sehenswürdigkeiten, Strand, Wanderungen und neue Ideen'};
const normalize=value=>String(value??'').normalize('NFD')
 .replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('de');
export const browseMatch=(item,query,cities={})=>{
 const needle=normalize(query).trim();if(!needle)return true;
 return normalize([item.name,item.address,item.detail,item.note,
   cities[item.city]?.name,...(item.tags??[])].join(' ')).includes(needle);
};
export function browseItems(items,ctx,{kind=null,foodType='all'}={}){
 const route=new Set(ctx.trip?.route??[]);
 return (items??[]).filter(item=>
  route.has(item.city)&&!item.duplicateOf&&!item.removed
  &&(ctx.browseScope==='trip'||item.city===ctx.city)
  &&browseMatch(item,ctx.browseSearch,ctx.cities)
  &&(kind===null||item.kind===kind)
  &&(foodType==='all'||foodType==='restaurants'&&explorerCategory(item)==='food'
    ||foodType==='markets'&&explorerCategory(item)==='shop'
    ||foodType==='cook'&&Boolean(item.requiresKitchen))
 );
}
const cityLabel=ctx=>ctx.cities?.[ctx.city]?.name??ctx.city;
export function browseHero(ctx,kind,count){
 const title=kindTitle[kind]??'Reise entdecken';
 const city=cityLabel(ctx);
 const candidate=(ctx.all??[]).find(item=>item.city===ctx.city&&curatedPlacePhoto(item));
 const photo=candidate?curatedPlacePhoto(candidate):null;
 const img=photo
  ?'<img src="'+esc(photo.url)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
  :destinationIllustration(ctx.city);
 const source=photo?'<a class="hub-hero-photo-credit" href="'+esc(photo.sourceUrl)
   +'" target="_blank" rel="noopener noreferrer">Ortsbild / Quelle</a>':'';
 return '<header class="hub-hero" data-kind="'+esc(kind)+'">'
   +'<div class="hub-hero-art" aria-hidden="true">'+img+'</div>'
   +'<div class="hub-hero-main"><small class="hub-kicker">'
   +icon(kind==='lodging'?'bed':kind==='food'?'food':'compass')+' '
   +esc(ctx.browseScope==='trip'?'DEINE GESAMTE REISE':city.toUpperCase())+'</small>'
   +'<h1>'+esc(title)+'</h1><p>'+esc(kindSub[kind])+'</p>'
   +'<div class="hub-hero-stats">'
   +'<span>'+icon('pin')+' '+count+' passende Einträge</span>'
   +'<span>'+icon('people')+' '+(ctx.people?.length??0)+' Reisende</span>'
   +'<span>'+icon('calendar')+' '+esc(ctx.trip?.from?.slice(0,7)??'2027')+'</span>'
   +'</div></div>'
   +'<div class="hub-hero-actions">'+btn('browse-map',kind==='lodging'?'Unterkünfte auf Karte':
     kind==='food'?'Essen auf Karte':'Karte öffnen','map',kind,'primary')
   +btn('page','Tagesplan','calendar','plan')+'</div>'+source+'</header>';
}
export function browseToolbar(ctx,{kind='discover',total=0,filtered=0}={}){
 const current=ctx.browseScope==='trip'?'trip':'city';
 const cities=[...new Set(ctx.trip?.route??[])];
 return '<section class="hub-toolbar" aria-label="Reiseort und Suchfilter">'
   +'<div class="hub-toolbar-top"><div class="hub-scope" role="group" aria-label="Ortsumfang">'
   +'<button type="button" data-action="browse-scope" data-value="city" aria-pressed="'
   +(current==='city')+'">'+icon('pin')+' '+esc(cityLabel(ctx))+'</button>'
   +'<button type="button" data-action="browse-scope" data-value="trip" aria-pressed="'
   +(current==='trip')+'">'+icon('map')+' Alle Reiseorte</button></div>'
   +'<label class="hub-city-selector">Ort wechseln <select id="browse-city" aria-label="Stadt auswählen">'
   +cities.map(id=>'<option value="'+esc(id)+'"'+(ctx.city===id?' selected':'')+'>'
    +esc(ctx.cities?.[id]?.name??id)+'</option>').join('')+'</select></label></div>'
   +'<form id="browse-search-form" class="hub-search-form" role="search">'
   +'<label for="browse-search">'+icon('search')+'<span class="sr-only">Angebote durchsuchen</span></label>'
   +'<input id="browse-search" type="search" maxlength="100" value="'+esc(ctx.browseSearch??'')
   +'" placeholder="'+esc(kind==='lodging'?'Hotel, Hostel, Küche, Lage …':kind==='food'
      ?'Restaurant, Café, Supermarkt, Gericht …':'Name, Ort, Aktivität …')+'">'
   +btn('browse-search-apply','Suchen','search')
   +(ctx.browseSearch?btn('browse-search-reset','Zurücksetzen','close'):'')
   +'</form>'
   +'<p class="hub-filter-count" aria-live="polite">'
   +'<strong>'+filtered+' angezeigt</strong> · '+total+' Einträge vor Suche'
   +' · Nicht alle Preise und Öffnungszeiten für 2027 bestätigt</p></section>';
}
export function mapBrowseModes(ctx){
 const current=ctx.explorer?.scope??ctx.mapScope??'city';
 const id=ctx.city,city=cityLabel(ctx);
 return '<nav class="map-scope-modes" aria-label="Kartenumfang auswählen">'
   +[['day','Mein Tag','calendar'],['city',city+' entdecken','pin'],
      ['trip','Alle Reiseorte','map']]
      .map(([value,label,glyph])=>'<button type="button" data-action="explorer-scope"'
        +' data-value="'+value+'" aria-pressed="'+(current===value)+'">'
        +icon(glyph)+'<span>'+esc(label)+'</span></button>').join('')
   +'</nav>';
}
export function mapBrowsePanel(ctx){
 const ex=ctx.explorer;if(!ex)return '';
 const unfiltered=explorerData(ctx.all??[],ctx.trip,{
   city:ex.scope==='trip'?null:ctx.city,group:'all',search:''
 });
 const rows=[...unfiltered.placed,...unfiltered.unlocated];
 const groups=Object.entries(EXPLORER_GROUPS);
 const counts=Object.fromEntries(groups.map(([id])=>[id,rows.filter(item=>
  (item.explorerCategory??explorerCategory(item))===id).length
  +(id==='shop'&&ex.marketsShown?ex.marketCount??0:0)]));
 const actions=groups.map(([id,g])=>
  '<button type="button" data-action="explorer-group" data-value="'+id+'"'
  +' aria-pressed="'+(ex.group===id)+'" class="map-browse-category">'
  +'<span class="map-browse-glyph category-'+id+'">'+icon(id==='lodging'?'bed':
     id==='food'?'food':id==='shop'?'wallet':id==='activity'?'compass':'train')+'</span>'
  +'<span><strong>'+esc(id==='food'?'Essen & Cafés':id==='shop'?'Supermärkte':g.label)
  +'</strong><small>'+counts[id]+' recherchierte Orte</small></span>'+icon('chevron')
  +'</button>').join('');
 return '<section class="map-browse-panel" aria-label="Orte unabhängig vom Reisetag entdecken">'
  +'<header><small>ORTE & IDEEN</small><h2>'
  +esc(ex.scope==='trip'?'Deine gesamte Reise':cityLabel(ctx)+' entdecken')
  +'</h2><p>Unabhängig vom Tagesplan – nach Kategorie suchen, auf Karte ansehen oder merken.</p></header>'
  +'<div class="map-browse-category-list">'+actions+'</div>'
  +'<div class="map-browse-cta">'
  +btn('page','Alle Unterkünfte','bed','lodging')
  +btn('page','Essen & Einkaufen','food','food')
  +btn('page','Alle Aktivitäten','compass','discover')+'</div></section>';
}
export const foodTypes=Object.freeze([
 ['all','Alle Orte','compass'],['restaurants','Restaurants & Cafés','food'],
 ['markets','Supermärkte','wallet'],['cook','Selbst kochen','food']
]);
export function foodTypeTabs(ctx,counts={}){
 return '<nav class="hub-food-tabs" aria-label="Verpflegung auswählen">'
 +foodTypes.map(([id,label,ico])=>'<button type="button" data-action="browse-food-type"'
   +' data-value="'+id+'" aria-pressed="'+((ctx.browseFoodType??'all')===id)+'">'
   +icon(ico)+'<span>'+esc(label)+'</span><small>'+(counts[id]??0)+'</small></button>').join('')
 +'</nav>';
}
export function foodBrowseCards(ctx,items){
 const cards=items.map(item=>{
  const group=explorerCategory(item);
  const signal=planCostSignal(item,ctx.people?.length??3);
  const hasMap=Array.isArray(item.point)&&item.point.length===2
      &&item.point.every(Number.isFinite);
  const tags=(item.tags??[]).slice(0,2);
  const options=item.readOnlyExternal?null:item.kind==='activity';
  return '<article class="hub-food-card" data-kind="'+esc(group)+'">'
    +placeImageHtml(item,ctx,{small:true})
    +'<div class="hub-food-card-body">'
    +'<small class="hub-food-card-type">'+icon(group==='food'?'food':'wallet')+' '
    +esc(group==='food'?'Restaurant / Café':group==='shop'?'Lebensmittel & Einkauf':'Selbstversorgung')+'</small>'
    +'<h3>'+esc(item.name)+'</h3><p>'+esc(ctx.cities[item.city]?.name??item.city)
      +(item.address?' · '+esc(item.address):' · Adresse nicht geprüft')+'</p>'
    +'<div class="hub-food-card-tags">'
    +'<span title="'+esc(signal.note)+'">'+esc(signal.tier)+' · '+esc(signal.amount)+'</span>'
    +tags.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'
    +'<div class="hub-food-card-actions">'
    +btn('details','Details & Quellen','folder',item.id)
    +(hasMap?btn('browse-map-item','Auf Karte','pin',item.id):'')
    +(options?btn('choose','Einplanen','plus',item.id,'primary'):'')
    +'</div></div></article>';
 }).join('');
 return cards?'<div class="hub-food-grid">'+cards+'</div>':
  '<p class="hub-empty">Keine passenden Verpflegungsorte. Prüfe andere Kategorien, die Suche oder die übrigen Reiseorte.</p>';
}

/** Progressive disclosure: visible option essentials, verifiable details below.
 * No unlicensed hotel photos and no invented live 2027 checkout prices.
 */
export function browseOptionCard(item,ctx,{lodging=false,active=false,highlighted=false,
  verification=null,stayStats=null,meal=null}={}){
 const profile=placeProfileModel(item,ctx);
 if(!profile)return '';
 const people=ctx.people?.length??1;
 const signal=planCostSignal(item,people);
 const city=ctx.cities?.[item.city]?.name??item.city;
 const point=Array.isArray(item.point)&&item.point.length===2
   &&item.point.every(Number.isFinite);
 const favorite=ctx.state?.favorites?.includes(item.id)??false;
 const status=active?'Im Reiseplan':item.booked?'Bereits gebucht':'Unverbindliche Option';
 const amenity=lodging
  ?[item.room||null,item.kitchen||'Küche nicht geprüft',
     item.bedsDisplayed!=null?String(item.bedsDisplayed)+' Betten angezeigt':null]
  :[item.duration?item.duration+' Min. geplant':null,
     ...(item.tags??[]).slice(0,2)];
 const rating=(Number.isFinite(item.ratingDisplayed)&&item.ratingDisplayed>0
  &&item.ratingDisplayed<=5)
    ?'<span class="hub-real-rating" title="Historische Angabe, nicht live">★ '
       +esc(Number(item.ratingDisplayed).toFixed(1).replace('.',','))+'</span>':'';
 const provenance=lodging?(item.quote?'Früherer Suchpreis · Checkout 2027 offen'
   :'Preis, Verfügbarkeit und Zimmer prüfen')
   :'Preis- und Öffnungsreferenzen, kein aktuelles Angebot';
 return '<article class="hub-option-card" data-kind="'+(lodging?'lodging':'activity')
   +'" data-city="'+esc(item.city)+'">'
   +'<div class="hub-option-media">'+placeImageHtml(item,ctx,{small:true})
   +'<span class="hub-option-status">'+icon(active?'check':lodging?'bed':'compass')
   +' '+esc(status)+'</span></div>'
   +'<div class="hub-option-content">'
   +'<div class="hub-option-eyebrow"><span>'+icon(lodging?'bed':'compass')+' '
   +esc(lodging?'Unterkunft':'Aktivität')+'</span><span>'+esc(city)+'</span></div>'
   +'<h3>'+esc(item.name)+'</h3>'
   +'<p class="hub-option-summary">'+esc(item.detail||item.note||
       (lodging?'Unterkunft mit noch offenen Angaben':'Reiseidee aus der Recherche'))+'</p>'
   +'<div class="hub-option-amenities">'
   +amenity.filter(Boolean).slice(0,3).map(a=>'<span>'+esc(a)+'</span>').join('')
   +'</div>'
   +'<div class="hub-option-pricing"><div><small>Preisorientierung</small>'
   +'<strong>'+esc(signal.tier)+' · '+esc(signal.amount)+'</strong>'
   +'<span>'+esc(provenance)+'</span></div>'+rating+'</div>'
   +'<div class="hub-option-primary-actions">'
   +btn(active?'edit':meal?'meal-choose':'choose',
     active?'Im Plan bearbeiten':lodging?'Unterkunft prüfen':'Zum Tag hinzufügen',
     active?'edit':'plus',!active&&meal?meal.id:item.id,'primary')
   +(point?btn('browse-map-item','Karte','pin',item.id):'')
   +btn('details','Details','folder',item.id)
   +'</div>'
   +'<div class="hub-option-secondary-actions">'
   +btn('favorite',favorite?'Gemerkt':'Merken',favorite?'check':'bookmark',item.id)
   +btn('compare',highlighted?'Vergleich aktiv':'Vergleichen','compare',item.id)
   +'</div>'
   +'<details class="hub-option-evidence"><summary>'
   +icon('chevron')+' Alle Angaben, Prüfpunkte & Quellen anzeigen</summary>'
   +'<div class="hub-option-evidence-body">'
   +'<p>'+esc(profile.description)+'</p>'
   +'<div class="hub-fact-grid">'
   +profile.facts.map(([key,value])=>
    '<span><small>'+esc(key)+'</small><strong>'+esc(value)+'</strong></span>').join('')
   +'</div>'
   +(verification?'<p>Eigene Unterkunftsprüfung: '
      +verification.count+'/'+verification.total+' · '
      +(verification.complete?'dokumentiert':'noch unvollständig')+'</p>':'')
   +(stayStats?'<p>Bahnhof-Fußweg: '
      +(stayStats.stationWalkMinutes==null?'nicht belegt':
        stayStats.stationWalkMinutes+' Min. berechnet')
      +' · Offene Prüfungen: '+stayStats.risk.length+'</p>':'')
   +(item.quote?.observedOn?'<p>Suchstand: '+esc(item.quote.observedOn)
      +' · keine bestätigte Buchung.</p>':'')
   +(lodging?lodgingPriceMeter(item,people,ctx.nightlyTargetEuro):'')
   +voteSnippet(item,ctx)
   +'<div class="hub-option-external">'
   +(urlLink(googleMapsSearchUrl(item,ctx.cities),googleMapsSearchLabel(item))||'')
   +(profile.providerUrl?urlLink(profile.providerUrl,'Anbieter ansehen'):'')
   +(lodging?btn('verify-item','Eigenprüfung','check',item.id):'')
   +'</div></div></details>'
   +'</div></article>';
}
