import {mapPointInBounds} from './map-explorer.mjs';
// Presentation-only counters and context for the interactive map.
// Always describe what the map actually draws: trip scope plots route cities,
// whereas city/day scopes display source-backed individual POI markers.
const safeCount=n=>Number.isInteger(n)&&n>=0?n:0;
export function mapViewSummary(ctx={}){
 const explorer=ctx.explorer??{};
 const scope=explorer.scope??ctx.mapScope??'city';
 const allCities=[...new Set((ctx.trip?.route??[]).filter(id=>
  Array.isArray(ctx.cities?.[id]?.point)&&ctx.cities[id].point.length===2
   &&ctx.cities[id].point.every(Number.isFinite)))];
 const city=ctx.cities?.[ctx.city]?.name??ctx.city??'Reiseort';
 const placed=safeCount(explorer.placed?.length??0);
 const unlocated=safeCount(explorer.unlocated?.length??0);
 const saved=safeCount(explorer.saved?.size??0);
 const filters=[];
 if(explorer.group&&explorer.group!=='all'){
  const names={activity:'Aktivitäten',food:'Essen & Cafés',shop:'Einkaufen',
   lodging:'Unterkünfte',transport:'Verkehr'};
  filters.push({key:'group',label:names[explorer.group]??'Kategorie'});
 }
 if((explorer.search??'').trim())
  filters.push({key:'search',label:'Suche: '+String(explorer.search).trim().slice(0,60)});
 if(explorer.savedOnly)filters.push({key:'saved',label:'Nur Merkliste'});
 if(explorer.viewportOnly)filters.push({key:'viewport',label:'Nur sichtbarer Ausschnitt'});
 if(explorer.nearby?.point)filters.push({key:'nearby',label:'Umkreisfilter'});
 if(scope==='trip')return {
  scope,city,title:'Deine Gesamtroute',description:'Schematische Städtefolge · keine tatsächlichen Bahntrassen',
  displayCount:allCities.length,displayLabel:allCities.length===1?'Stadt':'Städte',
  placed,unlocated,saved,filters,canClear:filters.length>0,
  hint:'Für einzelne Aktivitäten und Restaurants bitte „Stadt“ auswählen.',
  empty:allCities.length===0,cityCount:allCities.length,
 };
 const isDay=scope==='day';
 const viewportLimited=Boolean(explorer.viewportOnly&&Array.isArray(explorer.viewportBounds)
  &&explorer.viewportBounds.length===4&&explorer.viewportBounds.every(Number.isFinite));
 // Viewport-only filters the list, not the underlying geographic inventory.
 const displayCount=viewportLimited?(explorer.placed??[]).filter(item=>
  mapPointInBounds(item.point,explorer.viewportBounds)).length:placed;
 const empty=displayCount===0;
 return {scope,city,
  title:isDay?'Dein Reisetag':city+' entdecken',
  description:viewportLimited?'Listenorte im sichtbaren Ausschnitt'
    :isDay?'Nur aktuell eingeplante Stopps':'Aktivitäten und Orte aus deiner Recherche',
  displayCount,displayLabel:viewportLimited
    ?displayCount===1?'Ort in der Liste':'Orte in der Liste'
    :placed===1?'Ort mit Pin':'Orte mit Pin',
  placed,unlocated,saved,filters,canClear:filters.length>0,empty,viewportLimited,
  hint:viewportLimited
    ?empty?'Im Ausschnitt keine Treffer. Karte verschieben oder Ausschnittfilter entfernen.'
      :'Nur die Liste ist auf den Kartenausschnitt begrenzt; ohne Pin erfasste Orte sind ausgeblendet.'
    :empty?isDay
   ?'Für diesen Tag sind keine individuellen Kartenpunkte vorhanden. Unter „Stadt“ findest du weitere Ideen.'
   :'Keine Orte mit Kartenpunkt passen zu dieser Auswahl. Filter zurücksetzen oder Ort wechseln.'
   :unlocated>0
     ?unlocated+' weitere '+(unlocated===1?'Eintrag hat':'Einträge haben')+' keinen individuell belegten Kartenpunkt.'
     :'Positionen sind Quellenangaben; Eingänge und Öffnungszeiten gesondert prüfen.',
  cityCount:allCities.length,
 };
}
