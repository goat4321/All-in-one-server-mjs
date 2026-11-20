import {explorerData,explorerCategory,validPoint} from './map-explorer.mjs';
import {placeImageHtml,placeProfileModel} from './place-profile.mjs';
import {groupPrice,money} from './model.mjs';
import {esc,icon,btn,urlLink} from './ui.mjs';
import {quickDayTargetDates} from './day-quick-edits-v50.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';

const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de');
const label=(item,ctx)=>ctx.cities?.[item.city]?.name??item.city;
export const DISCOVERY_CATEGORIES=Object.freeze([
 ['all','Alle Orte','compass'],['activity','Aktivitäten','compass'],
 ['food','Restaurants & Cafés','food'],['shop','Supermärkte','wallet']
]);
export const DISCOVERY_QUALITY=Object.freeze([
 ['all','Alle Nachweise'],['photo','Mit Objektfoto'],['point','Mit Kartenpunkt'],
 ['missingPoint','Ohne präzisen Pin'],['price','Mit Preisreferenz'],
 ['missingPrice','Preis offen'],['source','Mit Quellenlink']
]);
export const DISCOVERY_ORDER=Object.freeze([
 ['source','Recherchefolge'],['name','Name A–Z'],['price','Belegte Preisreferenz'],
 ['duration','Dauer (nur belegte)'],['city','Ort A–Z']
]);

// The SAME explorerData + explorerCategory as the map. Synthetic arrival pins
// and non-POIs remain excluded from the browsing catalog (without deleting them
// from the map). No coordinates are generated or rounded into existence.
export function discoverySource(ctx){
 const items=[...(ctx.all??[]),...(ctx.marketItems??[])];
 const rows=explorerData(items,ctx.trip,{
   city:ctx.browseScope==='trip'?null:ctx.city,group:'all',search:''
 });
 return [...rows.placed,...rows.unlocated]
   .filter(item=>!item.explorerParent&&item.kind==='activity'
     &&['activity','food','shop'].includes(explorerCategory(item)));
}
export function discoverySearch(item,query){
 const needle=normalize(query).trim().slice(0,100);
 return !needle||normalize([item.name,item.city,item.address,item.detail,item.note,
   ...(item.tags??[])].join(' ')).includes(needle);
}
export function discoveryPrice(item,people=3){
 const price=item.effectivePrice??item.price;
 if(!price||typeof price.currency!=='string'||!/^[A-Z]{3}$/.test(price.currency))
   return null;
 const cents=groupPrice(price,people);
 return Number.isSafeInteger(cents)&&cents>=0
   ?{cents,currency:price.currency,text:money(cents,price.currency)}:null;
}
export function discoverySourceUrl(item){
 const urls=[item.officialVenueV77?.sourceUrl,item.officialAccessV58?.sourceUrl,
   item.officialAccessV57?.sourceUrl,item.officialAccessV56?.sourceUrl,
   item.menuPriceResearchV08?.sourceUrl,item.swissGuideV75?.sourceUrl,
   item.venueSourceV78?.sourceUrl,item.sourceUrl,item.website];
 for(const url of urls)try{
   const parsed=new URL(url);
   if(parsed.protocol==='https:'&&parsed.hostname&&!parsed.username&&!parsed.password)
     return parsed.href;
 }catch{}
 return null;
}
export function discoveryCategory(item){
 const group=explorerCategory(item);
 return group==='food'?'Restaurant / Café':
   group==='shop'?'Supermarkt / Einkauf':'Aktivität / Sehenswürdigkeit';
}
export function discoveryFacts(item,ctx){
 const group=explorerCategory(item);
 const price=discoveryPrice(item,ctx.people?.length??3);
 const point=validPoint(item.point);
 const menu=item.menuPriceResearchV08?.menuReference;
 const sample=Array.isArray(menu?.sample)?menu.sample.find(x=>typeof x.name==='string'&&x.name):null;
 const category=item.researchV50?.category??item.category??item.tags?.[0]??null;
 const note=item.detail??item.note??null;
 const station=point?item.geoEvidence?.isCentroid===true
   ?'Gebietsposition · kein bestätigter Eingang':'Kartenpunkt · Eingang prüfen'
   :'Keine belegten Koordinaten';
 const fixed=price?.text??'Preis offen';
 const basic={category:discoveryCategory(item),city:label(item,ctx),
   duration:Number.isFinite(item.duration)&&item.duration>0?item.duration+' Min. (Plan)':'Dauer offen',
   price:fixed,position:station,source:discoverySourceUrl(item)?'Quellenlink vorhanden':'Quellenlink offen'};
 if(group==='shop')return {...basic,features:[
   ['Kette / Geschäft',item.chain??item.brand??item.name],
   ['Preissicherheit',price?'Preisreferenz · kein Filialpreis 2027':'Filialpreise nicht belegt'],
   ['Standort',station],['Adresse',item.address??'Offen']
 ]};
 if(group==='food')return {...basic,features:[
   ['Küche / Ausrichtung',category??'Küche nicht angegeben'],
   ['Gericht / Menü',sample?.name??item.menuNote??'Kein belegtes konkretes Gericht'],
   ['Preis',sample&&Number.isSafeInteger(sample.amountCents)&&menu?.currency
     ?money(sample.amountCents,menu.currency)+' · historisches Beispiel':fixed],
   ['Ort / Adresse',item.address??station]
 ]};
 return {...basic,features:[
   ['Dauer',basic.duration],['Preis',fixed],
   ['Saison / Einlass',item.officialAccessV57?.schedulingAssurance==='published_2027_timetable_weather_dependent'
     ?'Saisonreferenz 2027 veröffentlicht · Wetter prüfen'
     :item.officialVenueV77?.status==='closed_reopening_unknown'
       ?'Schließung / Wiederöffnung offen':'Saison / Zugang 2027 prüfen'],
   ['Standort',station]
 ]};
}
export function discoveryQualityMatch(item,ctx,quality='all'){
 if(quality==='all')return true;
 const point=validPoint(item.point);
 if(quality==='point')return point;
 if(quality==='missingPoint')return !point;
 if(quality==='photo')return Boolean(placeProfileModel(item,ctx)?.photo);
 const price=discoveryPrice(item,ctx.people?.length??3);
 if(quality==='price')return Boolean(price);
 if(quality==='missingPrice')return !price;
 if(quality==='source')return Boolean(discoverySourceUrl(item));
 return false;
}
export function discoverySelect(ctx,{surface='discover'}={}){
 const source=discoverySource(ctx);
 const base=surface==='food'?source.filter(i=>['food','shop'].includes(explorerCategory(i))
   ||i.requiresKitchen):surface==='activities'
   ?source.filter(i=>explorerCategory(i)==='activity'):source;
 const searched=base.filter(i=>discoverySearch(i,ctx.browseSearch));
 const category=surface==='food'?ctx.browseFoodType==='markets'?'shop'
   :ctx.browseFoodType==='restaurants'?'food':'all'
   :surface==='activities'?'activity':ctx.discoveryCategory??'all';
 const saved=ctx.browseSavedIds??new Set(ctx.state?.favorites??[]);
 const filtered=searched.filter(i=>
   (surface==='food'&&ctx.browseFoodType==='cook'?(Boolean(i.requiresKitchen)||Array.isArray(i.basketProducts))
      :category==='all'||explorerCategory(i)===category
         &&!(surface==='food'&&category==='food'&&(Boolean(i.requiresKitchen)||Array.isArray(i.basketProducts))))
   &&(!(ctx.discoverySavedOnly||surface==='food'&&ctx.browseFoodSavedOnly)||saved.has(i.id))
   &&discoveryQualityMatch(i,ctx,ctx.discoveryQuality??'all'));
 const order=ctx.discoveryOrder??'source';
 if(order==='name'||order==='city')filtered.sort((a,b)=>
   order==='city'?label(a,ctx).localeCompare(label(b,ctx),'de')
     ||a.name.localeCompare(b.name,'de'):a.name.localeCompare(b.name,'de'));
 if(order==='price')filtered.sort((a,b)=>{
   const p=discoveryPrice(a,ctx.people?.length??3),q=discoveryPrice(b,ctx.people?.length??3);
   // Never compare different currencies as if they were interchangeable.
   if(!p&&!q)return a.name.localeCompare(b.name,'de');
   if(!p)return 1;if(!q)return -1;
   if(p.currency!==q.currency)return p.currency.localeCompare(q.currency);
   return p.cents-q.cents||a.name.localeCompare(b.name,'de');
 });
 if(order==='duration')filtered.sort((a,b)=>
   (Number.isFinite(a.duration)&&a.duration>0?a.duration:Infinity)
   -(Number.isFinite(b.duration)&&b.duration>0?b.duration:Infinity)
   ||a.name.localeCompare(b.name,'de'));
 const counts=Object.fromEntries(DISCOVERY_CATEGORIES.map(([key])=>[key,
   key==='all'?searched.length:searched.filter(i=>explorerCategory(i)===key).length]));
 return {source:base,searched,filtered,counts,savedCount:searched.filter(i=>saved.has(i.id)).length};
}
export function discoveryFilterBar(ctx,data,{surface='discover'}={}){
 const tabs=surface==='food'
   ?[['all','Alle Essen & Läden'],['restaurants','Restaurants & Cafés'],
     ['markets','Supermärkte'],['cook','Selbst kochen']]
   :DISCOVERY_CATEGORIES.map(([k,label])=>[k,label]);
 const current=surface==='food'?ctx.browseFoodType??'all':ctx.discoveryCategory??'all';
 const act=surface==='food'?'browse-food-type':'discovery-category';
 return '<section class="discovery-filter-panel" aria-label="Entdecken: Kategorien und Nachweise">'
   +'<div class="discovery-category-tabs" role="group" aria-label="Kategorien">'
   +tabs.map(([key,label])=>'<button type="button" data-action="'+act+'" data-value="'
      +esc(key)+'" aria-pressed="'+(current===key)+'">'+esc(label)
      +'<small>'+((surface==='food'&&key==='restaurants')?data.counts.food??0:
         surface==='food'&&key==='markets'?data.counts.shop??0:
         surface==='food'&&key==='cook'?data.source.filter(i=>Boolean(i.requiresKitchen)||Array.isArray(i.basketProducts)).length:
         data.counts[key]??0)
      +'</small></button>').join('')
   +'</div><div class="discovery-filter-tools">'
   +'<label>Nachweis <select id="discovery-quality">'
   +DISCOVERY_QUALITY.map(([key,label])=>'<option value="'+key+'"'
     +((ctx.discoveryQuality??'all')===key?' selected':'')+'>'+esc(label)+'</option>').join('')
   +'</select></label><label>Sortieren <select id="discovery-order">'
   +DISCOVERY_ORDER.map(([key,label])=>'<option value="'+key+'"'
     +((ctx.discoveryOrder??'source')===key?' selected':'')+'>'+esc(label)+'</option>').join('')
   +'</select></label><button type="button" data-action="discovery-saved" aria-pressed="'
      +Boolean(ctx.discoverySavedOnly)+'">'+icon('bookmark')+' Gemerkte</button>'
   +'</div><p role="status" class="discovery-results-status"><strong>'+data.filtered.length
   +' Ergebnisse</strong> · '+data.source.length+' vorhandene Datensätze'
   +' · Karte und Katalog verwenden dieselben vorhandenen Ortseinträge.</p></section>';
}
export function discoveryCard(item,ctx,{surface='discover'}={}){
 const facts=discoveryFacts(item,ctx),point=validPoint(item.point);
 const saved=ctx.browseSavedIds?.has(item.id)??false;
 const compare=ctx.discoveryCompareIds?.has(item.id)??false;
 const active=ctx.activeSet?.has(item.id)??false;
 const source=discoverySourceUrl(item);
 const isExternal=Boolean(item.readOnlyExternal);
 const allowPlan=!isExternal&&!item.locked&&!item.booked&&item.kind==='activity';
 const meal=ctx.catalog?.mealPlans?.[item.city]?.find(p=>p.venue===item.id);
 // Preserve the established compatible-day selection, Undo and move/delete
 // workflows. These are explicitly labeled "Zum Tag", never triggered by
 // merely opening the preview, comparing or bookmarking a source item.
 const quickDays=allowPlan&&surface!=='food'?quickDayTargetDates(ctx,item):[];
 const suggestedDay=active&&quickDays.includes(item.date)?item.date:
   quickDays.includes(ctx.date)?ctx.date:quickDays[0];
 const prefix=surface==='food'?'hub-food-card ':'hub-option-card ';
 return '<article class="'+prefix+'discovery-result" data-discovery-id="'+esc(item.id)
   +'" data-place-id="'+esc(item.id)+'" data-kind="'+esc(explorerCategory(item))
   +'" data-city="'+esc(item.city)+'">'
   +'<div class="discovery-result-photo">'+placeImageHtml(item,ctx,{small:true})+'</div>'
   +'<div class="discovery-result-info"><p class="discovery-result-eyebrow hub-food-card-type">'
     +esc((Boolean(item.requiresKitchen)||Array.isArray(item.basketProducts))?'Selbstversorgung':facts.category)+' · '+esc(facts.city)+'</p><h3>'+esc(item.name)+'</h3>'
   +(isExternal?'<small class="discovery-readonly">OSM-Geodaten · Betrieb ungeprüft · '+esc(facts.position)+'</small>':'')
   +'<div class="discovery-quickfacts"><span>'+icon('pin')+esc(facts.position)+'</span>'
   +'<span>'+icon('clock')+esc(facts.duration)+'</span>'
   +'<span>'+icon('wallet')+esc(facts.price)+'</span></div>'
   +(item.officialVenueV77?.status==='closed_reopening_unknown'
     ?'<p class="discovery-warning">Derzeit geschlossen · Wiedereröffnung unbestätigt</p>':'')
   +'<details class="discovery-preview"><summary>Kurzvorschau und Quellen</summary>'
   +'<p>'+esc(item.detail??item.note??'Weitere geprüfte Angaben sind nicht vorhanden.')+'</p>'
   +'<dl>'+facts.features.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'
   +'<div>'+btn('details','Vollständige Details','folder',item.id)
   +(source?urlLink(source,isExternal?'Kartendatenquelle':'Originalquelle'):'')
   +(validPoint(item.point)?urlLink(googleMapsSearchUrl(item,ctx.cities),'Google Maps · Suche, kein Eingangsbeleg'):'')
   +'</div></details>'
   +'</div><div class="discovery-result-actions">'
   +(active?'<small>Im Plan</small>':'<small>Unverbindliche Option</small>')
   +(quickDays.length
     ?'<div class="hub-quick-day discovery-quick-day" data-quick-day-id="'+esc(item.id)+'">'
       +'<label>Reisetag <select class="hub-quick-day-select" aria-label="Reisetag für '+esc(item.name)+' auswählen">'
       +quickDays.map(date=>'<option value="'+esc(date)+'"'+(date===suggestedDay?' selected':'')+'>'
         +esc(date)+' · '+esc(ctx.cities?.[ctx.cityForDay(date)]?.name??ctx.cityForDay(date))
         +'</option>').join('')+'</select></label>'
       +(active?'<div class="hub-quick-day-actions">'
         +btn('day-quick-move','Tag ändern','calendar',item.id,'subtle')
         +btn('day-quick-remove','Vom Tag entfernen','close',item.id,'subtle')+'</div>'
         :btn('day-quick-add','Zum Tag','plus',item.id,'primary'))+'</div>'
     :allowPlan?btn(active?'edit':meal?'meal-choose':'choose',
       active?'Im Plan bearbeiten':'Zum Tag',active?'edit':'plus',
       meal&&!active?meal.id:item.id,'primary'):'')
   +btn('browse-save',saved?'Gemerkt':'Merken',saved?'check':'bookmark',item.id)
   +btn('discovery-compare',compare?'Im Vergleich':'Vergleichen','compare',item.id)
   +(point?btn('browse-map-item','Auf Karte','pin',item.id):'')
   +btn('details','Details','folder',item.id)
   +'</div></article>';
}
export function discoveryCompareBoard(items,ctx){
 if(items.length<2)return '';
 const rows=items.slice(0,4);
 const per=rows.map(item=>({item,kind:explorerCategory(item),
   facts:discoveryFacts(item,ctx)}));
 const labels=[...new Set(per.flatMap(x=>x.facts.features.map(([k])=>k)))];
 const values=label=>per.map(x=>x.facts.features.find(([k])=>k===label)?.[1]??'Nicht zutreffend');
 return '<section class="discovery-compare-board" id="entdecken-vergleich" aria-label="Direktvergleich">'
   +'<div class="discovery-compare-heading"><div><h2>'+rows.length+' Orte im Vergleich</h2>'
   +'<p>Nur vorhandene Angaben. Andere Kategorien haben unterschiedliche Vergleichskriterien.</p></div>'
   +btn('discovery-compare-clear','Vergleich leeren','close')+'</div>'
   +'<div class="discovery-compare-scroll"><table><thead><tr><th scope="col">Kriterium</th>'
   +per.map(x=>'<th scope="col">'+esc(x.item.name)+'<small>'+esc(x.facts.category)+'</small></th>').join('')
   +'</tr></thead><tbody>'
   +[['Kategorie',...per.map(x=>x.facts.category)],
      ['Ort',...per.map(x=>x.facts.city)],
      ['Preisreferenz',...per.map(x=>x.facts.price)],
      ...labels.map(key=>[key,...values(key)])]
     .map(values=>'<tr'+(new Set(values.slice(1)).size>1?' data-different="true"':'')+'>'
       +'<th scope="row">'+esc(values[0])+'</th>'
       +values.slice(1).map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')
   +'</tbody></table></div></section>';
}
