import {markerProvenance,hasIndependentPointEvidence} from './poi-location-provenance.mjs';
// Routing geometry is real when returned by a routing engine; its start/end
// points still require independent place evidence.
export function stopPositionQuality(item){
 const p=markerProvenance(item),independent=hasIndependentPointEvidence(item);
 return {kind:p.kind,independent,
  needsReview:p.kind!=='sourced'||!independent,
  label:p.kind==='none'?'Kein Kartenpunkt'
   :p.kind==='provider'?'Anbieterposition · nicht unabhängig bestätigt'
   :p.kind==='area'?'Gebietsreferenz · Eingang unbekannt'
   :independent?'Öffentlicher Quellenpunkt · Eingang gesondert prüfen'
   :'Gespeicherter Punkt · genauer Quellennachweis fehlt'};
}
export function routePositionQuality(stops=[]){
 const entries=stops.map(x=>({id:x.id,...stopPositionQuality(x)}));
 const count=kind=>entries.filter(x=>x.kind===kind).length;
 return {stops:entries,reviewCount:entries.filter(x=>x.needsReview).length,
  independentCount:entries.filter(x=>x.independent).length,
  providerCount:count('provider'),areaCount:count('area'),missingCount:count('none')};
}