import {explorerCategory} from './map-explorer.mjs';
import {isSelfCatering} from './browse-hub-v35.mjs';
import {discoverySource,discoverySearch,discoverySelect} from './discovery-catalog.mjs';

/** The catalog and the Leaflet map both start with explorerData. Loaded OSM
 * shops are read-only and retain their source data; nothing is imported into
 * the saved trip or its budget. */
export function foodDirectory(ctx,loadedMarkets=[]){
 const marketItems=[...new Map([...(ctx.marketItems??[]),...loadedMarkets]
   .map(item=>[item.id,item])).values()];
 const common={...ctx,marketItems};
 const original=discoverySource({...common,browseSearch:''})
   .filter(item=>['food','shop'].includes(explorerCategory(item))||isSelfCatering(item));
 const candidates=original.filter(item=>discoverySearch(item,ctx.browseSearch));
 const result=discoverySelect(common,{surface:'food'});
 const shown=result.filtered;
 if(ctx.browseFoodType==='markets'&&marketItems.length&&(ctx.discoveryOrder??'source')==='source'){
   shown.sort((a,b)=>Number(Boolean(b.readOnlyExternal))-Number(Boolean(a.readOnlyExternal))
     ||a.name.localeCompare(b.name,'de'));
 }
 const favorites=ctx.browseSavedIds??new Set(ctx.state?.favorites??[]);
 const available={
  all:candidates.length,
  restaurants:candidates.filter(item=>explorerCategory(item)==='food'&&!isSelfCatering(item)).length,
  markets:candidates.filter(item=>explorerCategory(item)==='shop').length,
  cook:candidates.filter(isSelfCatering).length,
  saved:candidates.filter(item=>favorites.has(item.id)).length,
 };
 return {candidates,shown,available,total:original.length,
   source:result.source,counts:result.counts};
}
export function marketCoverage({cityName='Stadt',cityLoaded=false,loadedCities=0,
 totalCities=1,scope='city',count=0,checkedOn=null}={}){
  const detail=scope==='trip'?loadedCities+' von '+totalCities+
    ' Reiseorten mit geladenen Ladenpunkten'
    :cityName+': '+(cityLoaded?count+' kartierte Geschäfte':'noch nicht abgefragt');
  const dated=checkedOn?' · Daten abgerufen am '+checkedOn:'';
  return detail+dated+' · begrenzte offene Geodaten, keine Öffnungsprüfung';
}
