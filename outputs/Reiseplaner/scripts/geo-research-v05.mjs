// One-time, bounded public OSM POI research. Not a runtime geocoding service.
// Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
// NOT Nominatim. 1 sequential worker, capped batches, no citywide POI scrape.
// Review is mandatory before adding coordinates to live catalog.
import { writeFile, mkdir } from 'node:fs/promises';
import { loadCatalog, distanceKm } from '../lib/catalog.mjs';
import { explorerData } from '../public/map-explorer.mjs';
import { googleMapsSearchUrl } from '../public/google-maps.mjs';

const catalog = await loadCatalog();
const unique = new Map(), variants=[];
for(const trip of catalog.trips) {
  const {unlocated,placed,total}=explorerData(trip.items,trip);
  variants.push({id:trip.id,total,missing:unlocated.length,placed:placed.length});
  for(const item of unlocated){
    if(!unique.has(item.id)) unique.set(item.id,{...item,variants:[]});
    unique.get(item.id).variants.push(trip.id);
  }
}
const items=[...unique.values()];
const eligible=items.filter(item=>item.name && item.city && item.kind !== 'transport'
  && item.provider !== 'Airbnb' && !String(item.id).startsWith('wishlist:')
  && !/^(?:gemeinsam kochen|selbst kochen|freier tag|optionale|einkaufen|abendspaziergang)$/i.test(item.name)
  && catalog.cities[item.city]?.point);
const byCity = new Map();
for(const item of eligible){
  if(!byCity.has(item.city)) byCity.set(item.city,[]);
  byCity.get(item.city).push(item);
}
const normal = s => String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const regexEscape=s=>String(s).replace(/[\\.^$|?*+()[\]{}]/g,'\\$&');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const verified=[],review=[],unmatched=[],failed=[];
const observedAt=new Date().toISOString().slice(0,10);
function candidatesFor(batch, elements, cityPoint){
  for(const item of batch) {
    const possible=elements.filter(el=>{
      const ll=el.lat!=null?[el.lat,el.lon]:el.center?[el.center.lat,el.center.lon]:null;
      if(!ll||!Number.isFinite(ll[0])||!Number.isFinite(ll[1])||distanceKm(ll,cityPoint)>38)return false;
      return [el.tags?.name,el.tags?.['name:de'],el.tags?.['name:en'],el.tags?.['name:local']]
        .some(n=>normal(n)===normal(item.name));
    });
    const nearby=[];
    for(const el of possible) {
      const p=el.lat!=null?[el.lat,el.lon]:[el.center.lat,el.center.lon];
      if(!nearby.some(x=>distanceKm(x.point,p)<0.08))
        nearby.push({point:p,osmRef:el.type+'/'+el.id,name:el.tags?.name,
          street:el.tags?.['addr:street']||null,houseNumber:el.tags?.['addr:housenumber']||null,
          openingHours:el.tags?.opening_hours||null,website:el.tags?.website||el.tags?.['contact:website']||null,
          category:el.tags?.amenity||el.tags?.tourism||el.tags?.shop||el.tags?.natural||null});
    }
    if(!nearby.length) {unmatched.push({id:item.id,city:item.city,name:item.name,address:item.address||null});continue;}
    const sameAddress=record=>Boolean(item.address && record.street
      && normal(item.address).includes(normal(record.street))
      && (!record.houseNumber || normal(item.address).includes(normal(record.houseNumber))));
    const withAddress=nearby.filter(sameAddress);
    const chosen=withAddress.length===1?withAddress[0]:nearby.length===1?nearby[0]:null;
    const identity = {id:item.id,city:item.city,name:item.name,address:item.address||null,
      variants:item.variants,googleMaps:googleMapsSearchUrl(item,catalog.cities)};
    const payload={...identity,osmCandidate:chosen||null,otherCandidates:chosen?[]:nearby.slice(0,5),
      observedOn:observedAt,source:'OpenStreetMap via bounded Overpass name lookup',
      exactDoorVerified:false};
    if(chosen && withAddress.length===1) verified.push({...payload,confidence:'OSM_Name_and_Street',
      point:chosen.point,geometryType:chosen.osmRef.split('/')[0]==='node'?'POI':'object_center'});
    else review.push({...payload,confidence:chosen?'Name_only_no_address_confirmation':'ambiguous'});
  }
}
const calls=[];
for(const [city,list] of byCity) {
  const byName=new Map();
  for(const item of list){
    const key=normal(item.name);
    if(!byName.has(key))byName.set(key,[]);
    byName.get(key).push(item);
  }
  const groups=[...byName.values()];
  for(let i=0;i<groups.length;i+=9) calls.push({city,groups:groups.slice(i,i+9)});
}
let done=0;
for(const call of calls) {
  const batch=call.groups.flat();
  const cityPoint=catalog.cities[call.city].point;
  const names=call.groups.map(xs=>xs[0].name).filter(Boolean);
  const pattern='^('+names.map(regexEscape).join('|')+')$';
  const query='[out:json][timeout:35];nwr["name"~"'+pattern.replace(/"/g,'\\\"')+'",i](around:35000,'+cityPoint.join(',')+');out center tags;';
  try {
    const response=await fetch('https://overpass-api.de/api/interpreter',{
      method:'POST',headers:{'content-type':'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent':'Reiseplaner-2027-one-off-research (https://github.com/goat4321/All-in-one-server-mjs)'},
      body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(45000),
    });
    if(!response.ok)throw Error('Overpass HTTP '+response.status);
    const obj=await response.json();
    candidatesFor(batch,obj.elements||[],cityPoint);
    console.log('GEO_PROGRESS',JSON.stringify({city:call.city,requests:++done,total:calls.length,
      n:batch.length,returned:(obj.elements||[]).length,verified:verified.length,review:review.length}));
  }catch(error) {
    done++;failed.push({city:call.city,items:batch.map(x=>x.id),error:String(error)});
    console.log('GEO_ERROR',JSON.stringify({city:call.city,n:batch.length,error:String(error).slice(0,200)}));
  }
  await sleep(1700);
}
const report={
 schema:'osm_place_candidates_v05',observedOn:observedAt,method:'One-time Overpass name lookup; strict local name and city proximity, one machine, sequential batches, 1.7s pauses.',
 attribution:'© OpenStreetMap contributors (ODbL)',
 warnings:['Not Google Maps geocoding; Google Maps search links are separate.',
   'OSM POI center is not necessarily a door entrance. Candidate coordinates are not automatically written into the live catalog.',
   'Results are incomplete: not all places have OSM name tags. Missing names do not imply nonexistent businesses.',
   'No exact coordinates are inferred for private Airbnb listings.'],
 variants,unlocatedUnique:items.length,eligibleUnique:eligible.length,batchCount:calls.length,
 counts:{verified:verified.length,review:review.length,unmatched:unmatched.length,failedRequests:failed.length},
 verified,review,unmatched,failed
};
await mkdir(new URL('../data/research-v05/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/research-v05/osm-candidates.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('GEO_REPORT',JSON.stringify({variants,unlocatedUnique:report.unlocatedUnique,
 eligibleUnique:report.eligibleUnique,batches:calls.length,...report.counts}));
for(const match of verified)console.log('GEO_MATCH',JSON.stringify(match));
for(const match of review)console.log('GEO_REVIEW',JSON.stringify(match));
