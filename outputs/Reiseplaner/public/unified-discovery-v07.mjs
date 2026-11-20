import {explorerData,explorerCategory,validPoint} from './map-explorer.mjs';
import {placeProfileModel,placeImageHtml} from './place-profile.mjs';
import {planCostSignal} from './visual-experience.mjs';
import {groupPrice} from './model.mjs';
import {quickDayTargetDates} from './day-quick-edits-v50.mjs';
import {hasIndependentPointEvidence} from './poi-location-provenance.mjs';
import {esc,icon,btn,urlLink} from './ui.mjs';

export const DISCOVERY_GROUPS=Object.freeze([
 ['all','Alle Orte','compass'],['activity','Sehenswürdigkeiten & Aktivitäten','compass'],
 ['food','Restaurants & Cafés','food'],['shop','Supermärkte & Einkauf','wallet']
]);
export const DISCOVERY_EVIDENCE=Object.freeze([
 ['all','Alle Nachweise'],['photo','Belegtes Einzelbild'],['point','Mit Kartenpunkt'],
 ['sourcedPoint','Koordinatenbeleg'],['missingPoint','Ort noch ungenau'],
 ['price','Preisreferenz'],['unknownPrice','Preis offen']
]);
export const DISCOVERY_DURATION=Object.freeze([
 ['all','Alle Dauern'],['short','Bis 60 Minuten'],['medium','61–180 Minuten'],
 ['long','Über 180 Minuten'],['unknown','Dauer offen']
]);
export const DISCOVERY_SORT=Object.freeze([
 ['source','Recherchefolge'],['name','Name A–Z'],['price','Vergleichbarer Gruppenpreis'],
 ['duration','Kürzeste Planungsdauer'],['sourceQuality','Zuerst belegte Quelle']
]);
const normalized=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de');
const sourceUrl=item=>[
 item.officialVenueV77?.sourceUrl,item.menuPriceResearchV08?.sourceUrl,
 item.officialAccessV58?.sourceUrl,item.officialAccessV57?.sourceUrl,
 item.officialAccessV56?.sourceUrl,item.venueSourceV78?.sourceUrl,
 item.swissGuideV75?.sourceUrl,item.cityGuideV76?.sourceUrl,
 item.publicPlaceGuideV68?.sourceUrl,item.sourceUrl,item.website,
 item.geoEvidence?.url
].find(url=>typeof url==='string'&&/^https:\/\//.test(url))??null;
export function discoverySourceLabel(item){
 if(item.readOnlyExternal)return item.sourceUrl?'OSM-Geodaten · Öffnung ungeprüft':'Kartendaten · Betreiber offen';
 if(sourceUrl(item))return 'Quellenlink vorhanden · Stand/Öffnung prüfen';
 return 'Objektquelle noch offen';
}
const priceCents=(item,people)=> {
 const cost=item?.effectivePrice??item?.price;
 return cost?.currency==='EUR'?groupPrice(cost,people):null;
};
export function discoveryFactRows(item,ctx){
 const kind=explorerCategory(item);
 const signal=planCostSignal(item,ctx.people?.length??3);
 const location=validPoint(item.point)
   ?item.geoEvidence?.isCentroid?'Nur Gebietsreferenz, kein Eingang':
     hasIndependentPointEvidence(item)?'Koordinatenbeleg vorhanden · Eingang prüfen':
     'Kartenpunkt vorhanden · Quelle/Genauigkeit prüfen'
   :'Kein verifizierter Einzelpunkt';
 const duration=Number.isFinite(item.duration)&&item.duration>0
   ?item.duration+' Min. geplant':'Dauer offen';
 const menu=item.menuPriceResearchV08?.menuReference;
 const dish=menu?.sample?.[0]?.name??null;
 const season=item.officialAccessV57?.publishedSeason2027
   ?'Veröffentlichte Saisoninfo · Tagesöffnung prüfen'
   :item.officialVenueV77?.status==='closed_reopening_unknown'
     ?'Geschlossen / Wiedereröffnung ungeklärt'
     :item.officialAccessV57?.schedulingAssurance
       ?'Betreiberhinweis · Termine prüfen'
       :'Saison / Öffnung 2027 offen';
 const label=kind==='food'?'Restaurant / Café':kind==='shop'?'Supermarkt / Einkauf':'Aktivität';
 const common=[['Kategorie',label],['Preisreferenz',signal.amount],
   ['Stadt',ctx.cities?.[item.city]?.name??item.city],['Standort',location],
   ['Quelle',discoverySourceLabel(item)]];
 if(kind==='activity')return [
   ['Dauer',duration],['Saison / Öffnung',season],
   ['Schwerpunkt',item.tags?.slice(0,2).join(' · ')||'Noch offen'),...common
 ];
 if(kind==='food')return [
   ['Küche / Ausrichtung',item.tags?.slice(0,2).join(' · ')||'Nicht belegt'],
   ['Gericht / Karte',dish?'Menübeispiel: '+dish:'Einzelgericht nicht belegt'],
   ['Preisbeleg',menu?.dateLabel??(signal.known?'Historischer Plan-/Quellenwert':'Offen')],...common
 ];
 return [
   ['Kette / Betreiber',item.brand??item.operator??'Nicht belegt'],
   ['Preissicherheit',item.readOnlyExternal?'Keine aktuellen Filialpreise belegt'
      :signal.known?'Historischer Plan-/Quellenwert':'Offen'],
   ['Betrieb',item.readOnlyExternal?'Aus Kartendaten · Öffnung ungeprüft'
      :'Öffnung / Bestand prüfen'],...common
 ];
}
export function discoveryBase(ctx,{search='',scope=ctx.browseScope??'city'}={}){
 const all=[...(ctx.all??[]),...(ctx.marketItems??[])];
 const source=explorerData(all,ctx.trip,{
  city:scope==='trip'?null:ctx.city,group:'all',search
 });
 // Keep exactly the map's deduplication, route scoping, and query semantics.
 // This catalogue deliberately excludes lodgings and synthetic transport nodes.
 return [...source.placed,...source.unlocated].filter(item=>
   item.kind==='activity'&&['activity','food','shop'].includes(explorerCategory(item)));
}
export function discoveryMatches(item,ctx,filters={}){
 const group=explorerCategory(item);
 if(filters.group&&filters.group!=='all'&&group!==filters.group)return false;
 if(filters.savedOnly&&!ctx.browseSavedIds?.has(item.id))return false;
 const evidence=filters.evidence??'all';
 const photo=Boolean(placeProfileModel(item,ctx)?.photo);
 const point=validPoint(item.point);
 const sourcePoint=hasIndependentPointEvidence(item);
 const price=planCostSignal(item,ctx.people?.length??3).known;
 if(evidence==='photo'&&!photo||evidence==='point'&&!point
   ||evidence==='sourcedPoint'&&!sourcePoint
   ||evidence==='missingPoint'&&point||evidence==='price'&&!price
   ||evidence==='unknownPrice'&&price)return false;
 const dur=filters.duration??'all',minutes=item.duration;
 const known=Number.isFinite(minutes)&&minutes>0;
 if(dur==='unknown'&&known)return false;
 if(dur==='short'&&(!known||minutes>60))return false;
 if(dur==='medium'&&(!known||minutes<=60||minutes>180))return false;
 if(dur==='long'&&(!known||minutes<=180))return false;
 return true;
}
export function discoveryRows(ctx,filters={}){
 const base=discoveryBase(ctx,{search:'',scope:ctx.browseScope});
 const searched=discoveryBase(ctx,{search:ctx.browseSearch,scope:ctx.browseScope});
 const result=searched.filter(item=>discoveryMatches(item,ctx,filters));
 const order=filters.sort??'source',people=ctx.people?.length??3;
 if(order==='name')result.sort((a,b)=>a.name.localeCompare(b.name,'de'));
 if(order==='price')result.sort((a,b)=>(priceCents(a,people)??Infinity)
   -(priceCents(b,people)??Infinity)||a.name.localeCompare(b.name,'de'));
 if(order==='duration')result.sort((a,b)=>
   ((Number.isFinite(a.duration)&&a.duration>0?a.duration:Infinity)
    -(Number.isFinite(b.duration)&&b.duration>0?b.duration:Infinity))
   ||a.name.localeCompare(b.name,'de'));
 if(order==='sourceQuality')result.sort((a,b)=>
   Number(!sourceUrl(a))-Number(!sourceUrl(b))
   ||a.name.localeCompare(b.name,'de'));
 const counts=Object.fromEntries(DISCOVERY_GROUPS.map(([id])=>
   [id,searched.filter(item=>id==='all'||explorerCategory(item)===id).length]));
 return {base,searched,result,counts};
}
export function discoveryFilterPanel(ctx,info,{food=false}={}){
 const group=food?ctx.browseFoodType==='restaurants'?'food':ctx.browseFoodType==='markets'?'shop'
   :'all':ctx.discoverGroup??'all';
 const evidence=ctx.discoverEvidence??'all',duration=ctx.discoverDuration??'all';
 const sort=ctx.discoverOrder??'source';
 const chips=DISCOVERY_GROUPS.map(([key,label,glyph])=>
  '<button type="button" class="discovery-category-chip" data-action="discover-group" data-value="'
  +key+'" aria-pressed="'+(group===key)+'">'+icon(glyph)
  +'<span>'+esc(label)+'</span><small>'+info.counts[key]+'</small></button>').join('');
 const select=(id,label,options,current)=>'<label class="discovery-facet"><span>'+esc(label)
  +'</span><select id="'+id+'">'+options.map(([key,name])=>
  '<option value="'+key+'"'+(key===current?' selected':'')+'>'+esc(name)+'</option>'
  ).join('')+'</select></label>';
 return '<section class="discovery-filters" aria-label="Entdecken: Filter und Sortierung">'
  +(food?'':'<nav class="discovery-categories" aria-label="Alle Ortskategorien">'+chips+'</nav>')
  +'<div class="discovery-facet-row">'
  +select('discover-evidence','Nachweis',DISCOVERY_EVIDENCE,evidence)
  +select('discover-duration','Dauer',DISCOVERY_DURATION,duration)
  +select('discover-sort','Sortieren',DISCOVERY_SORT,sort)
  +'<button type="button" class="discovery-saved" data-action="discover-saved"'
  +' aria-pressed="'+Boolean(ctx.discoverSavedOnly)+'">'+icon('bookmark')
  +(ctx.discoverSavedOnly?' Nur Gemerkte':' Merkliste')+'</button>'
  +'<button type="button" class="discovery-reset" data-action="discover-reset">'+icon('reset')
  +' Filter zurücksetzen</button></div>'
  +'<p class="discovery-count" role="status" aria-live="polite"><strong>'
  +info.result.length+' Ergebnisse</strong> · '+info.searched.length
  +' nach Suche · '+info.base.length+' verfügbare Einträge'
  +'<span> Nur vorhandene Daten; Preise, Saison und Öffnung für 2027 prüfen</span></p>'
  +'</section>';
}
export function discoveryCard(item,ctx,{food=false}={}){
 const group=explorerCategory(item),p=placeProfileModel(item,ctx);
 if(!p)return '';
 const catering=Boolean(item.requiresKitchen)||Array.isArray(item.basketProducts);
 const label=catering?'Selbstversorgung':group==='shop'?'Supermarkt & Einkauf'
  :group==='food'?'Restaurant & Café':'Aktivität & Sehenswürdigkeit';
 const active=ctx.activeSet?.has(item.id);
 const saved=ctx.browseSavedIds?.has(item.id);
 const compared=ctx.compareIds?.has(item.id);
 const signal=planCostSignal(item,ctx.people?.length??3);
 const point=validPoint(item.point);
 const exactPhoto=Boolean(p.photo);
 const picture=exactPhoto?placeImageHtml(item,ctx,{small:true}):
  '<div class="discovery-photo-missing" role="img" aria-label="Kein belegtes Objektfoto">'
  +icon(group==='shop'?'wallet':group==='food'?'food':'compass')
  +'<span>Einzelbild fehlt</span><small>Kein fremdes Ortsfoto als Ersatz</small></div>';
 const days=!item.readOnlyExternal&&!item.locked&&!item.booked&&item.kind==='activity'
   ?quickDayTargetDates(ctx,item):[];
 const meal=ctx.catalog?.mealPlans?.[item.city]?.find(row=>row.venue===item.id);
 const source=sourceUrl(item);
 const summary=[item.address, ...(item.tags??[]).slice(0,2)]
   .filter(Boolean).join(' · ');
 const compact=discoveryFactRows(item,ctx).slice(0,3);
 const canPlan=!item.readOnlyExternal&&item.kind==='activity'&&!item.booked&&!item.locked
   &&!active;
 const choose=canPlan?(meal?btn('meal-choose','Zum Tag','plus',meal.id,'primary'):
   days.length?'<div class="hub-quick-day" data-quick-day-id="'+esc(item.id)+'">'
     +'<label class="discovery-day-label">Reisetag <select class="hub-quick-day-select"'
     +' aria-label="Reisetag für '+esc(item.name)+' wählen">'
     +days.map(date=>'<option value="'+esc(date)+'"'+(date===ctx.date?' selected':'')
       +'>'+esc(date)+'</option>').join('')+'</select></label>'
     +btn('day-quick-add','Zum Tag','plus',item.id,'primary')+'</div>'
   :''):'';
 return '<article class="'+(food?'hub-food-card ':'hub-option-card ')
  +'discovery-card" data-kind="'+esc(group)+'" data-city="'+esc(item.city)
  +'" data-discover-id="'+esc(item.id)+'">'
  +'<div class="discovery-media">'+picture+'<span class="discovery-photo-label">'
  +esc(exactPhoto?'Lizenzbild · Quelle im Detail':'Kein Objektfoto')+'</span></div>'
  +'<div class="discovery-body"><p class="discovery-kicker'+(food?' hub-food-card-type':'')
  +'">'+esc(label)+' · '
  +esc(ctx.cities?.[item.city]?.name??item.city)+'</p>'
  +'<h3>'+esc(item.name)+'</h3>'
  +'<p class="discovery-card-summary">'+esc(summary||'Adresse / Schwerpunkt offen')+'</p>'
  +'<div class="discovery-essentials">'
  +'<span>'+icon('wallet')+esc(signal.amount)+'</span>'
  +'<span>'+icon(point?'pin':'alert')+esc(point
    ?item.geoEvidence?.isCentroid?'Gebietsreferenz, kein Eingang'
      :'Kartenpunkt · Eingang prüfen':'Standort offen')+'</span>'
  +(group==='activity'&&Number.isFinite(item.duration)?'<span>'+icon('clock')
    +esc(item.duration)+' Min. geplant</span>':'')
  +'</div>'
  +'<p class="discovery-source">'+esc(discoverySourceLabel(item))+'</p>'
  +'<div class="discovery-actions">'
  +btn('details','Details','folder',item.id)
  +(point?btn('browse-map-item','Auf Karte','pin',item.id):'')
  +btn('browse-save',saved?'Gemerkt':'Merken',saved?'check':'bookmark',item.id)
  +btn('compare',compared?'Im Vergleich':'Vergleichen','compare',item.id)
  +'</div>'
  +choose
  +'<details class="discovery-preview"><summary>Kurzvorschau · '+esc(label)
    +'</summary><div class="discovery-preview-body">'
  +'<p>'+esc(item.detail||item.note||'Keine weitergehende Einzelbeschreibung belegt.')+'</p>'
  +'<dl>'+compact.map(([key,value])=>'<div><dt>'+esc(key)
    +'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'
  +(source?urlLink(source,'Gespeicherte Objekt-/Quellenreferenz'):'')
  +btn('details','Alle Daten & Quellen','folder',item.id)
  +'</div></details></div></article>';
}
export function discoveryCards(items,ctx,{food=false}={}){
 if(!items.length)return '<div class="hub-empty discovery-empty" role="status">'
  +'<strong>Keine passenden Orte</strong><p>Suche, Kategorie oder Nachweisfilter ändern. '
  +'Noch nicht geladene Supermärkte fehlen in dieser Auswahl.</p>'
  +btn('discover-reset','Entdecken-Filter zurücksetzen','reset','','primary')
  +'</div>';
 return '<div class="'+(food?'hub-food-grid ':'hub-option-grid ')
  +'discovery-grid">'+items.map(item=>discoveryCard(item,ctx,{food})).join('')+'</div>';
}
export function discoveryCompare(ctx){
 const items=[...(ctx.all??[]),...(ctx.marketItems??[])];
 const selected=[...ctx.compareIds??[]].slice(0,4);
 const rows=selected.map(id=>items.find(item=>item.id===id)).filter(Boolean)
  .filter(item=>item.kind==='activity');
 if(!rows.length)return '';
 const all=rows.map(item=>({item,facts:discoveryFactRows(item,ctx)}));
 const keys=[...new Set(all.flatMap(row=>row.facts.map(pair=>pair[0])))];
 const values=Object.fromEntries(keys.map(key=>[key,
   new Set(all.map(row=>row.facts.find(pair=>pair[0]===key)?.[1]
     ??'Für diese Kategorie nicht anwendbar')).size>1]));
 return '<section class="discovery-comparison" id="entdecken-vergleich" aria-label="Orte direkt vergleichen">'
  +'<div class="discovery-comparison-heading"><div><h2>'+rows.length
  +' Orte im Vergleich</h2><p>Quellen- und Planungsreferenzen, keine Buchung oder zusätzliche Plankosten.</p></div>'
  +btn('compare-clear','Vergleich leeren','close')+'</div>'
  +'<div class="discovery-compare-grid">'
  +all.map(({item,facts})=>'<article class="discovery-compare-card" data-compare-id="'
    +esc(item.id)+'"><header><small>'+esc(ctx.cities?.[item.city]?.name??item.city)
    +' · '+esc(explorerCategory(item))+'</small><h3>'+esc(item.name)+'</h3>'
    +'<p>'+esc(ctx.activeSet?.has(item.id)?'Bereits im Plan':'Nicht eingeplant')
    +'</p></header>'
    +'<dl>'+facts.map(([key,value])=>'<div data-different="'+Boolean(values[key])
      +'"><dt>'+esc(key)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'
    +'<div class="discovery-compare-actions">'+btn('details','Details','folder',item.id)
    +btn('compare','Entfernen','close',item.id)+'</div></article>').join('')
  +'</div></section>';
}
