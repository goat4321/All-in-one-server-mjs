// One-time OSM Photon geocoding of user-supplied, public travel points.
// Public API fair-use: one process, one worker, >=1.4 seconds between requests,
// stop on 429/403, never replay whole batches automatically, save results locally.
// Private Airbnb listings have no exact publicly known address and are excluded.
import { mkdir, writeFile } from 'node:fs/promises';
import { loadCatalog, distanceKm } from '../lib/catalog.mjs';
import { explorerData } from '../public/map-explorer.mjs';

const catalog=await loadCatalog(), observedOn=new Date().toISOString().slice(0,10);
const missing=new Map(), variantBefore=[];
for(const trip of catalog.trips) {
  const data=explorerData(trip.items,trip);
  variantBefore.push({id:trip.id,total:data.total,placed:data.placed.length,unlocated:data.unlocated.length});
  for(const item of data.unlocated) {
    const key=[item.id,item.city,item.name,item.address??''].join('|');
    if(!missing.has(key)) missing.set(key,{item,variants:[]});
    missing.get(key).variants.push(trip.id);
  }
}
const missingEntries=[...missing.values()];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const words=s=>norm(s).split(' ').filter(w=>w.length>=3 && !['the','der','die','das','und','with','chez','des','les','del','de','du','di','delle','della','alla','all','via','rue','street','carrer','place','platz','italy','france','paris','nice','venice','barcelona','switzerland'].includes(w));
const nameMatch=(a,b)=>{
  const left=norm(a),right=norm(b);
  if(!left||!right)return 0;
  if(left===right)return 1;
  // A named landmark can have a longer official name, but an arbitrary
  // subset such as "Hotel" or "Café" does not determine a unique POI.
  const wa=words(a),wb=words(b);
  if(!wa.length||!wb.length)return 0;
  const share=wa.filter(x=>wb.includes(x)).length;
  return Math.min(share/wa.length,share/wb.length)*0.94;
};
const canonicalName=item=>String(item.name??'').replace(/^Airbnb\s*·\s*/,'').trim();
const country={FR:'FR',ES:'ES',IT:'IT',CH:'CH',DE:'DE'};
const countryCity=city=>({
  paris:'Paris',barcelona:'Barcelona',sete:'Sète',nice:'Nice',genoa:'Genova',
  venice:'Venezia',toulouse:'Toulouse',narbonne:'Narbonne',marseille:'Marseille',
  montpellier:'Montpellier',ventimiglia:'Ventimiglia',milan:'Milano',
  kandersteg:'Kandersteg',appenzell:'Appenzell',wasserauen:'Wasserauen',
  seealpsee:'Seealpsee',kloental:'Klöntal',glarus:'Glarus',
  grindelwald:'Grindelwald',bachalpsee:'Bachalpsee',oeschinensee:'Oeschinensee',
  munich:'München',
})[city]??city;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
  &&Math.abs(p[0])<=90&&Math.abs(p[1])<=180&&!(p[0]===0&&p[1]===0);
const numberedAddress=s=>/\b\d+[a-z]?(?:\s*[-/]\s*\d+[a-z]?)?\b/i.test(s??'');
const forbidden=item=>item.provider==='Airbnb' || String(item.id).startsWith('wishlist:airbnb:')
 || /(?:kochen|einkaufen|freier tag|flexibler tag|optional.*abend|zugfahrt|anreise|check-in|check-out|transfer|spaziergang|eigentag|hotelvergleich|wasser\s+trinken|ruhepause|frei.*programm)/i.test(canonicalName(item))
 || (/^(?:restaurant|café|cafe|bar|bistro|supermarkt|markthalle|strand|beach|markt|abendessen|mittagessen|frühstück|altstadt|stadtbummel|club|park|picknick|badetag|wanderung|shopping|chillen|reise|bahnhof|badepause)$/i.test(norm(canonicalName(item))) && !numberedAddress(item.address));
const queue=missingEntries.filter(({item})=>!forbidden(item)&&catalog.cities[item.city]?.point);
const keep=[],review=[],unmatched=[],skipped=[],failures=[];
const client='Reiseplaner-2027-manual-geodata-audit/0.6 (contact: https://github.com/goat4321/All-in-one-server-mjs)';
async function queryPhoton(item) {
  const city=catalog.cities[item.city],base=city.point;
  const q=[canonicalName(item),item.address??'',countryCity(item.city)].filter(Boolean).join(', ');
  const u=new URL('https://photon.komoot.io/api/');
  u.searchParams.set('q',q.slice(0,250));
  u.searchParams.set('lat',String(base[0]));
  u.searchParams.set('lon',String(base[1]));
  u.searchParams.set('limit','7');
  u.searchParams.set('lang','en');
  const resp=await fetch(u,{headers:{'user-agent':client,'accept':'application/json'},
    signal:AbortSignal.timeout(11000)});
  if(resp.status===429||resp.status===403)throw Object.assign(new Error('API throttled '+resp.status),{fatal:true});
  if(!resp.ok)throw new Error('HTTP '+resp.status);
  const data=await resp.json();
  return {q,features:data.features??[]};
}
function classify(item,query,features) {
  const c=catalog.cities[item.city],cc=country[c.country]??c.country;
  const address=norm(item.address);
  const candidates=[];
  for(const feature of features){
    const prop=feature?.properties??{};
    const lon=feature?.geometry?.coordinates?.[0],lat=feature?.geometry?.coordinates?.[1];
    const point=[lat,lon];
    if(!valid(point)||distanceKm(point,c.point)>45)continue;
    if(prop.countrycode&&cc&&prop.countrycode.toUpperCase()!==cc)continue;
    if(!prop.osm_id||!['N','W','R'].includes(prop.osm_type))continue;
    const osmType={N:'node',W:'way',R:'relation'}[prop.osm_type];
    const osmUrl='https://www.openstreetmap.org/'+osmType+'/'+prop.osm_id;
    const nm=nameMatch(canonicalName(item),prop.name);
    const featStreet=norm([prop.street,prop.housenumber].filter(Boolean).join(' '));
    const addressKnown=Boolean(address);
    const number=prop.housenumber&&norm(item.address).includes(norm(prop.housenumber));
    const tokenMatch=prop.street&&words(prop.street).some(w=>words(item.address).includes(w));
    const addressMatch=Boolean(addressKnown&&tokenMatch&&(number||!numberedAddress(item.address)));
    const isBuilding=prop.osm_key==='building'||prop.osm_key==='place';
    const ambiguousType=prop.osm_key==='place'&&['city','town','village','suburb','neighbourhood'].includes(prop.osm_value);
    const score=nm*10+(addressMatch?8:0)+(isBuilding?-0.25:0)+(ambiguousType?-10:0);
    candidates.push({point,osmUrl,osmType,osmKey:prop.osm_key,osmValue:prop.osm_value,
      name:prop.name??null,street:prop.street??null,houseNumber:prop.housenumber??null,
      postcode:prop.postcode??null,city:prop.city??null,openingHours:null,
      nameScore:Number(nm.toFixed(3)),addressMatch,ambiguousType,score,
      isCentroid:osmType!=='node'});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const best=candidates[0],other=candidates[1];
  let confidence=null;
  if(best&&!best.ambiguousType&&best.addressMatch
    && (best.nameScore>=0.52 || (numberedAddress(item.address) && best.houseNumber))
    && (!other||!other.addressMatch||other.nameScore<best.nameScore-0.12))
    confidence='street_address_match';
  else if(best&&!best.ambiguousType&&best.nameScore>=0.925
    && (!other||other.nameScore<0.8||distanceKm(other.point,best.point)<0.08)
    && !/^(?:airbnb|bedroom|room|hotel|restaurant|bar|cafe|café|station|park)$/i.test(norm(best.name)))
    confidence='unique_osm_named_poi';
  return {candidates,best,confidence};
}
let calls=0,stopped=false,lastCall=0;
for(const {item,variants} of missingEntries) if(!queue.some(x=>x.item===item))
  skipped.push({id:item.id,city:item.city,name:item.name,reason:item.provider==='Airbnb'?'private_airbnb_location_unpublished':'generic_or_not_a_geocodable_place'});
for(const {item,variants} of queue) {
  const wait=Math.max(0,1500-(Date.now()-lastCall));
  if(wait)await sleep(wait);
  lastCall=Date.now();calls++;
  try{
    const {q,features}=await queryPhoton(item);
    const {candidates,best,confidence}=classify(item,q,features);
    const basic={id:item.id,city:item.city,name:item.name,address:item.address??null,
      variants,query:q,observedOn,provider:'OSM / Photon (© OpenStreetMap contributors, ODbL)'};
    if(confidence){
      keep.push({...basic,point:best.point,osmRef:best.osmUrl,osmName:best.name,
        confidence,isCentroid:best.isCentroid,addressMatch:best.addressMatch,
        locationDescription:best.isCentroid?'OSM-Objektzentrum, nicht zwingend Eingang':'OSM-POI'});
    }else if(candidates.length){
      review.push({...basic,reason:'Mehrdeutiger Ort oder keine genaue Namens-/Adressübereinstimmung',
        candidates:candidates.slice(0,4).map(x=>({point:x.point,osmRef:x.osmUrl,
          osmName:x.name,street:x.street,houseNumber:x.houseNumber,
          nameScore:x.nameScore,addressMatch:x.addressMatch}))});
    }else unmatched.push({...basic,reason:'Keine eindeutig örtlich passende OSM-Geometrie gefunden'});
    if(calls%15===0)console.log('GEO_PROGRESS',JSON.stringify({calls,total:queue.length,
      accepted:keep.length,review:review.length,unmatched:unmatched.length,errors:failures.length}));
  }catch(error){
    failures.push({id:item.id,city:item.city,error:String(error)});
    if(error.fatal){stopped=true;console.log('GEO_THROTTLED',String(error));break;}
  }
}
const report={schema:'osm_photon_geocoded_v06',observedOn,attribution:'© OpenStreetMap contributors (ODbL)',
  method:'One-off private travel dataset research using public Photon, 1 sequential request per 1.5 seconds, no Airbnb private property geocoding.',
  status:stopped?'throttled_partial':'completed_with_possible_unmatched',
  legend:{street_address_match:'Street/number aligned with named entity',
    unique_osm_named_poi:'One uniquely named OSM object near source city; may be polygon centre'},
  accuracy:'OSM map coordinates are source identifiers or polygon centroids; not surveyed entrances; no 2027 routing claims.',
  variantBefore,uniqueMissing:missingEntries.length,eligible:queue.length,queried:calls,
  totals:{accepted:keep.length,review:review.length,unmatched:unmatched.length,
    skipped:skipped.length,requestFailures:failures.length},
  points:keep,review,unmatched,skipped,failures};
const dest=new URL('../data/research-v06/geocoded-points.json',import.meta.url);
await mkdir(new URL('../data/research-v06/',import.meta.url),{recursive:true});
await writeFile(dest,JSON.stringify(report,null,2)+'\n');
console.log('GEO_RESULT',JSON.stringify({status:report.status,variants:variantBefore,
  missingUnique:missingEntries.length,eligible:queue.length,queried:calls,...report.totals}));
if(!keep.length)console.log('GEO_WARNING No matched POI accepted; preserve original map data.');
