import {explorerCategory} from './map-explorer.mjs';
import {browseItems,isSelfCatering} from './browse-hub-v35.mjs';

/** Single directory for researched food places plus explicitly loaded OSM shops.
 * Keep open-geodata results separate from editable itinerary/budget entries.
 * Never turn a map centroid into a verified store entrance or invent ratings.
 */
export function foodDirectory(ctx,loadedMarkets=[]){
  const entries=browseItems([...(ctx.all??[]),...loadedMarkets],ctx,{kind:'activity'});
  const dedup=new Map();
  for(const item of entries){
    const kind=explorerCategory(item);
    if(kind==='food'||kind==='shop'||isSelfCatering(item)){
      if(!dedup.has(item.id))dedup.set(item.id,item);
    }
  }
  const candidates=[...dedup.values()];
  const key=ctx.browseFoodType??'all';
  const favorites=ctx.browseSavedIds??new Set(ctx.state?.favorites??[]);
  const categoryMatches=item=>key==='all'
    ||key==='restaurants'&&explorerCategory(item)==='food'&&!isSelfCatering(item)
    ||key==='markets'&&explorerCategory(item)==='shop'
    ||key==='cook'&&isSelfCatering(item);
  const shown=candidates.filter(item=>categoryMatches(item)
    &&(!ctx.browseFoodSavedOnly||favorites.has(item.id)));
  // Clicking "Supermärkte laden" should expose the newly fetched places
  // immediately, not bury them beyond the first 24 existing research cards.
  if(key==='markets'&&loadedMarkets.length){
    shown.sort((a,b)=>Number(Boolean(b.readOnlyExternal))
      -Number(Boolean(a.readOnlyExternal))||a.name.localeCompare(b.name,'de'));
  }
  const available={
    all:candidates.length,
    restaurants:candidates.filter(item=>explorerCategory(item)==='food'&&!isSelfCatering(item)).length,
    markets:candidates.filter(item=>explorerCategory(item)==='shop').length,
    cook:candidates.filter(isSelfCatering).length,
    saved:candidates.filter(item=>favorites.has(item.id)).length,
  };
  // All before search: source coverage, not the count of visible cards.
  const original=browseItems([...(ctx.all??[]),...loadedMarkets],
    {...ctx,browseSearch:''},{kind:'activity'}).filter(item=>{
      const group=explorerCategory(item);
      return group==='food'||group==='shop'||isSelfCatering(item);
    });
  return {candidates,shown,available,total:new Set(original.map(i=>i.id)).size};
}
export function marketCoverage({cityName='Stadt',cityLoaded=false,loadedCities=0,
 totalCities=1,scope='city',count=0,checkedOn=null}={}){
  const detail=scope==='trip'?loadedCities+' von '+totalCities+
    ' Reiseorten mit geladenen Ladenpunkten'
    :cityName+': '+(cityLoaded?count+' kartierte Geschäfte':'noch nicht abgefragt');
  const dated=checkedOn?' · Daten abgerufen am '+checkedOn:'';
  return detail+dated+' · begrenzte offene Geodaten, keine Öffnungsprüfung';
}
