import {readFile} from 'node:fs/promises';
import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus} from '../public/google-maps.mjs';

const dir=new URL('../data/research-v20/',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,dir),'utf8'));
const fail=msg=>{throw new Error('Research V20: '+msg)};
const unique=(rows,count,name)=>{
 if(!Array.isArray(rows)||rows.length!==count||new Set(rows.map(x=>x.id)).size!==count)fail('invalid '+name);
};
const https=url=>typeof url==='string'&&/^https:\/\//.test(url);
const isPoint=p=>Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Number.isFinite(p[1])
  &&p[0]>=-90&&p[0]<=90&&p[1]>=-180&&p[1]<=180;
const distanceKm=(p,q)=>{const r=Math.PI/180,a=(p[0]-q[0])*r,b=(p[1]-q[1])*r;
 return 6371*2*Math.asin(Math.sqrt(Math.sin(a/2)**2
   +Math.cos(p[0]*r)*Math.cos(q[0]*r)*Math.sin(b/2)**2));};
export async function loadResearchV20(baseItems,cities){
 const [activities,lodging]=await Promise.all([
   read('activity-audit-20261114.json'),read('lodging-audit-20261114.json'),
 ]);
 if(activities.schema!=='individual_activity_recheck_v20'
   ||lodging.schema!=='lodging_reference_recheck_v20')fail('schemas missing');
 unique(activities.items,57,'activities');
 unique(lodging.items,35,'lodging');
 const originals=new Map(baseItems.map(x=>[x.id,x]));
 for(const row of activities.items){
   const source=originals.get(row.id);
   if(!source||source.destination_id!==row.city||source.name!==row.name)fail('activity identity '+row.id);
   if(row.point!==null && (!isPoint(row.point)||!https(row.geoSourceUrl)
     ||!cities[row.city]?.point||distanceKm(row.point,cities[row.city].point)>50))fail('untrusted location '+row.id);
   if(row.priceOverride){
     const p=row.priceOverride;
     if(!['conditional','published_2027','current_tariff_not_2027_guaranteed'].includes(p.kind)
       ||!https(p.sourceUrl)||p.currency!=='EUR'
       ||(p.amountCents!==null&&(!Number.isSafeInteger(p.amountCents)||p.amountCents<0)))fail('price evidence '+row.id);
   }
   if(row.priceReference&&!https(row.priceReference.sourceUrl))fail('price reference '+row.id);
 }
 const hotels=new Map(lodging.items.map(x=>[x.id,x]));
 const knownHotelIds=new Set(['lod-001','lod-002','lod-017','lod-019','lod-020','lod-030','lod-031','lod-032']);
 if(lodging.items.filter(x=>x.newSearch).length!==knownHotelIds.size
   ||lodging.items.some(x=>Boolean(x.newSearch)!==knownHotelIds.has(x.id)))fail('hotel live snapshot scope');
 for(const a of lodging.items){
   if(a.newSearch){
     if(!Number.isSafeInteger(a.newSearch.totalCents)||!https(a.newSearch.url)
       ||a.newSearch.checkoutConfirmed||a.newSearch.bookingConfirmed
       ||a.newSearch.fullMandatoryFeesVerified||a.newSearch.roomConfigurationVerified)fail('live price scope '+a.id);
   }
   if(a.independentMapEvidence){
     const p=a.independentMapEvidence;
     if(!isPoint(p.point)||!https(p.sourceUrl)
       ||!cities[a.city]?.point||distanceKm(p.point,cities[a.city].point)>50
       ||p.distanceProviderVsSourceMetres>250)fail('hotel point '+a.id);
   }
 }
 return {activities,lodging,byActivity:new Map(activities.items.map(x=>[x.id,x])),byLodging:hotels};
}
export function applyResearchV20(trips,cities,archive){
 const sources=[
   ...archive.activities.items.map(x=>({id:'survey-v20:'+x.id,
     publisher:'Öffentliche Quellenprüfung · '+x.name,
     url:x.sourceUrl??null,accessed_on:archive.activities.observedOn,
     validity:x.researchStatus+' · 2027-Aufenthalts-/Buchungsstand nur soweit ausdrücklich bestätigt'})),
   ...archive.lodging.items.map(x=>({id:'survey-v20:'+x.id,
     publisher:'Unterkunfts-/Standortprüfung · '+x.name,
     url:x.newSearch?.url??x.providerUrl,accessed_on:archive.lodging.observedOn,
     validity:x.recheckStatus+' · Checkout, Einzelbetten und Steuern nicht bestätigt'})),
 ];
 let activityPlaces=0,hotelsIndependent=0,activityUpdated=0;
 for(const trip of trips){
   trip.items=trip.items.map(item=>{
     if(!item.id.startsWith('survey-v19:'))return item;
     const id=item.id.slice('survey-v19:'.length);
     const fact=item.kind==='lodging'?archive.byLodging.get(id):archive.byActivity.get(id);
     if(!fact)return item;
     const isHotel=item.kind==='lodging';
     const sourceKey='survey-v20:'+id;
     const knownPoint=isHotel?fact.independentMapEvidence:fact.point!==null?fact:null;
     const point=knownPoint?(isHotel?knownPoint.point:fact.point):item.point;
     const geoEvidence=knownPoint?{
       source:isHotel?'Unabhängige frühere öffentliche OSM-Ortsrecherche':'Öffentliche OSM-/Tourismusreferenz',
       url:isHotel?knownPoint.sourceUrl:fact.geoSourceUrl,
       isCentroid:isHotel?knownPoint.isCentroid:fact.isCentroid,
       confidence:isHotel?knownPoint.confidence:fact.pointPrecision,
       observedOn:fact.reviewedOn,
       note:isHotel?'Verifiziertes benanntes OSM-Objekt, Anbieterposition weicht '
         +knownPoint.distanceProviderVsSourceMetres+' m ab; Eingang bleibt unbestätigt.'
         :fact.geoNote,
     }:item.geoEvidence;
     const priceUpdate=!isHotel?fact.priceOverride:null;
     const price=priceUpdate?.kind==='conditional'?null:
       priceUpdate?.amountCents!=null?{
         cents:priceUpdate.amountCents,currency:priceUpdate.currency,
         scope:'person',label:priceUpdate.kind==='published_2027'
           ?'Offiziell publizierter Tarif für 2027 · '+(priceUpdate.ageMin!=null?
             'Jugend '+priceUpdate.ageMin+'–'+priceUpdate.ageMax+' Jahre':'')
           :'Veröffentlichter Tarif vom 14.11.2026 · 2027 nicht zugesichert',
       }:item.price;
     const locationIssue=knownPoint
       ?geoEvidence.isCentroid?'Quellenbasierter Gebäude-/Gebietsreferenzpunkt; Einlass, Treffpunkt und Fußweg nicht zwingend exakt.'
        :isHotel?'Quellenpunkt öffentlich geprüft; spezifischer Hoteleingang nicht bestätigt.'
        :'Quellenbasierter POI, Eingänge und Aufenthaltswege gesondert prüfen.'
       :isHotel&&fact.geographyConflict
         ?'Anbieterposition weicht von OSM-Recherche um '+fact.geographyConflict.distanceMetres
           +' m ab; kein ungeprüfter Ersatz.'
         :item.positionIssue;
     const extra={...item,point,geoEvidence,positionIssue:locationIssue,
       ...(priceUpdate?{price,verification:priceUpdate.kind==='published_2027'
         ?'Offiziell für 2027 veröffentlichte Preis-/Öffnungsreferenz'
         :priceUpdate.kind==='conditional'?'Bedingter Eintritt, Berechtigung vor Ort nachweisen'
         :'Offizieller Tarif 2026, 2027 erneut prüfen'}:{}),
       ...(!isHotel&&fact.publishedHours2027?{openingHoursNote:fact.publishedHours2027}:{}),
       ...(!isHotel&&fact.routeReference?{routeResearchV20:fact.routeReference}:{}),
       researchV20:isHotel?{
         type:'lodging',geographyStatus:fact.geographyStatus,
         independentPoint:fact.independentMapEvidence??null,pointConflict:fact.geographyConflict??null,
         lastSearch:fact.newSearch??null,reviewStatus:fact.recheckStatus,
         pending:fact.remaining,reviewedOn:fact.reviewedOn,
       }:{
         type:'activity',reviewStatus:fact.researchStatus,geoNote:fact.geoNote,
         condition:fact.condition??null,priceKind:fact.priceOverride?.kind??null,
         priceReference:fact.priceReference??null,sourceUrl:fact.sourceUrl,
         publishedHours2027:fact.publishedHours2027??null,reviewedOn:fact.reviewedOn,
       },
       source:[...new Set([...(item.source??[]),sourceKey])],
     };
     if(isHotel){
       if(fact.independentMapEvidence)hotelsIndependent++;
       if(fact.newSearch){
         extra.quote={...item.quote,newSearchObservedOn:fact.newSearch.observedOn,
           newSearchTotalCents:fact.newSearch.totalCents,newSearchUrl:fact.newSearch.url,
           latestBookingSearchConfirmed:false,updatedRoomConfirmed:false};
       }
       if(fact.newSearch?.address){
         extra.address=extra.address??fact.newSearch.address;
         extra.addressEvidenceV20={providerReported:true,
           url:fact.newSearch.url,verifiedIndependently:false};
       }
     }else{
       if(fact.point)activityPlaces++;
       if(fact.priceOverride)activityUpdated++;
     }
     return {...extra,
       googleMapsUrl:googleMapsSearchUrl(extra,cities),
       googleTransitUrl:googleMapsDirectionsUrl(null,extra,cities,'transit'),
       mapLocationQuality:googleMapsLocationStatus(extra),
     };
   });
 }
 return {version:'2026-11-14',activities:archive.activities.items,lodging:archive.lodging.items,
   stats:{reviewedActivities:archive.activities.items.length,
     activitySourcePoints:archive.activities.withSourcedPoint,
     variantActivityPointAssignments:activityPlaces,
     reviewedLodgings:archive.lodging.items.length,
     updatedLodgingSearches:archive.lodging.updatedSearchOffers,
     independentLodgingPoints:archive.lodging.independentPointMatches,
     variantIndependentLodgingPoints:hotelsIndependent,
     providerPositionConflicts:archive.lodging.providerLocationConflicts,
     activityPriceUpdates:activityUpdated},
   sources};
}
