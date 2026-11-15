import {explainMissingField} from './entry-gap-reasons.mjs';
import {curatedPlacePhoto} from './curated-place-photos.mjs';
import {planCostSignal} from './visual-experience.mjs';

const safeLen=v=>String(v??'').trim().length;
const usablePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
  &&p[0]>=-90&&p[0]<=90&&p[1]>=-180&&p[1]<=180;
const imageStored=x=>Boolean(x&&/^https:\/\/\S+/.test(x.url??'')
  &&/^https:\/\/\S+/.test(x.sourceUrl??'')&&safeLen(x.credit)>2);
const ownPhotos=(item,state)=>{
  const saved=state?.placePhotos?.[item.id];
  return (Array.isArray(saved)?saved:saved?[saved]:[]).filter(imageStored);
};
export function entryCompleteness(item,ctx={}){
  const kind=item.kind??'unknown';
  const photos=ownPhotos(item,ctx.state);
  const curated=curatedPlacePhoto(item);
  const hasPhoto=Boolean(photos.length||curated);
  const hasStory=Math.max(safeLen(item.detail),safeLen(item.note),safeLen(item.guideV22?.summary))>=50
    ||safeLen(item.researchV20?.condition)>=50;
  const references=Array.isArray(item.source)?item.source:[];
  const urls=references.flatMap(ref=>{
    const x=ctx.catalog?.sources?.[ref];
    const url=typeof x==='string'?x:x?.url;
    return url&&/^https:\/\//.test(url)?[url]:[];
  });
  if(/^https:\/\//.test(item.website??''))urls.push(item.website);
  if(/^https:\/\//.test(item.researchV20?.sourceUrl??''))urls.push(item.researchV20.sourceUrl);
  const hasSource=urls.length>0;
  const hasPoint=usablePoint(item.point);
  const sourcePoint=hasPoint&&Boolean(item.geoEvidence?.url||item.addressEvidenceV09?.sourceUrl
    ||item.locationReferenceV07?.exactKnown||item.coordinatePrecision==='verified_exact');
  const publishedHours=Boolean((Array.isArray(item.hours)&&item.hours.length>0)
    ||item.weekly?.hours||item.openingHoursNote||item.checkInTime);
  const price=planCostSignal(item,ctx.people?.length??ctx.trip?.travellers??3);
  const hasPrice=price.known;
  const hotelDetails=kind!=='lodging'?true:Boolean(item.room&&item.fees===true
    &&item.cancellation===true&&item.quote?.roomConfirmed===true
    &&item.quote?.checkoutConfirmed===true);
  const railTimetable=kind!=='transport'||Boolean(item.trainNumber&&item.operator
    &&item.start&&item.end&&!/hypothese|plan|unbestätigt/i.test(item.verification??''));
  const isConcept=Boolean(item.researchV20?.reviewStatus?.includes('concept')
    ||item.pointPrecision==='unverified_or_not_single_location'
    ||/unbestimmt|konzept|idee/i.test(item.verification??''));
  const gaps=[];
  if(!hasPhoto)gaps.push({key:'photo',label:'Individuelles Foto fehlt',
    next:'Lizenzierte Commons-Fotos für den genauen Ort suchen, Motiv prüfen und mit Urheber/Lizenz übernehmen; Anbieterzimmer nur mit ausdrücklicher Bildfreigabe.'});
  if(!hasStory)gaps.push({key:'description',label:'Ausführliche Beschreibung fehlt',
    next:'Einen objektbezogenen Beschreibungstext aus einer offiziellen/touristischen Quelle ergänzen.'});
  if(!hasPrice)gaps.push({key:'price',label:price.currency==='CHF'?'EUR-Vergleich offen':'Vergleichbarer Preis offen',
    next:'Betreiberpreis, Umfang, Währung, Alters-/Gruppenrabatt und Preisstand prüfen; keine Schätzung als bestätigten Wert übernehmen.'});
  if(kind==='activity'&&!publishedHours)gaps.push({key:'hours',label:'Besuchs-/Öffnungszeit nicht bestätigt',
    next:'Offizielle Saison-/Wochentagszeiten und Ausnahmen prüfen. Öffentlicher Außenraum ist kein nachgewiesener 24h-Betrieb.'});
  if(!hasPoint&&kind!=='transport')gaps.push({key:'location',label:isConcept?'Kein einzelner Kartenpunkt vorgesehen':'Einzeln belegte Position fehlt',
    next:isConcept?'Konzept nur bei Auswahl eines realen Treffs/Anbieters geokodieren.':'Orts-/Gebäude-/Eingangskoordinaten mit öffentlicher Quelle abgleichen.'});
  else if(hasPoint&&!sourcePoint)gaps.push({key:'geo_evidence',label:'Quellengenauigkeit des Kartenpunkts ungeklärt',
    next:'Mit öffentlich dokumentiertem POI/OSM-Objekt abgleichen, nicht Anbieter- oder Stadtmittelpunkt als exakten Eingang behaupten.'});
  if(!hasSource)gaps.push({key:'source',label:'Konkreter Webbeleg fehlt',
    next:'Hersteller-, Stadt-, Museums- oder Betreiberseite für den genauen Eintrag ergänzen.'});
  if(!hotelDetails)gaps.push({key:'booking',label:'Betten/Steuern/Zimmer/Checkout offen',
    next:'Exakte Gruppe, Bettenaufteilung, inklusive Gebühren, Storno und Endpreis des konkreten Zimmers beim Anbieter prüfen.'});
  if(!railTimetable)gaps.push({key:'timetable',label:'Reale datierte Zugverbindung nicht belegt',
    next:'Nach Verkaufsstart Zugnummer, Lokalzeiten, reservierbare Plätze und Passinhabertarif beim Betreiber prüfen.'});
  return {id:item.id,name:item.name,city:item.city,kind,hasPhoto,photoCount:photos.length+Number(Boolean(curated)),
    hasSource,hasStory,hasPrice,hasPoint,sourcePoint,publishedHours,hasGuide:!!item.guideV22,
    hotelDetails,railTimetable,gaps:gaps.map(g=>explainMissingField(item,g)),complete:gaps.length===0,priceMarker:price.tier};
}
export function entryCompletenessReport(items,ctx={}){
 const unique=new Map(items.map(x=>[x.id,x]));
 const entries=[...unique.values()].map(x=>entryCompleteness(x,ctx));
 const counters={total:entries.length,withPhoto:0,withStory:0,withPrice:0,
    withSource:0,withPoint:0,independentGeo:0,complete:0};
 const missingByType={};
 for(const e of entries){
   if(e.hasPhoto)counters.withPhoto++;
   if(e.hasStory)counters.withStory++;
   if(e.hasPrice)counters.withPrice++;
   if(e.hasSource)counters.withSource++;
   if(e.hasPoint)counters.withPoint++;
   if(e.sourcePoint)counters.independentGeo++;
   if(e.complete)counters.complete++;
   for(const gap of e.gaps)missingByType[gap.key]=(missingByType[gap.key]??0)+1;
 }
 return {entries,counters,missingByType,incomplete:entries.filter(x=>!x.complete)};
}
