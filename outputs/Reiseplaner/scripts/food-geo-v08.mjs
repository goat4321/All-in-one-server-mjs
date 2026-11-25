// One-time, small source-address check for food venues that remain unlocated.
// © OpenStreetMap contributors (ODbL). Photon public API; sequential, <= 1 request / 2.2 sec.
// Address-level geometry is explicitly not verified as an individual storefront entrance.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {loadCatalog,distanceKm} from '../lib/catalog.mjs';
const catalog=await loadCatalog();
const food=JSON.parse(await readFile(new URL('../data/research-v03/food-venues.json',import.meta.url),'utf8'));
const pending=food.items.filter(row=>!catalog.trips.some(trip=>trip.items.some(item=>
  item.id==='local:'+row.id && Array.isArray(item.point) && item.point.length===2)));
const normalized=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
function desiredAddress(raw){
 const addr=String(raw??'').split(',').map(s=>s.trim());
 if(addr.length<2)return null;
 const pattern=/\b(\d+[a-z]?)\b/i;
 const street=addr.find(s=>pattern.test(s));
 if(!street)return null;
 const num=street.match(pattern)[1].toLowerCase();
 const streetNorm=normalized(street.replace(pattern,''));
 return {raw:street,streetNorm,num};
}
const normalizeStreet=s=>normalized(s).replace(/\b(rue|quai|place|piazza|avenue|avenida|via|carrer|vico|salizada|strasse|straße|bd|boulevard|de|da|di|del|delle|des|der|le|la|lo|il|the|general|général)\b/g,' ').replace(/\s+/g,' ').trim();
const results=[];
for(const row of pending){
 const city=catalog.cities[row.city],want=desiredAddress(row.address);
 const result={id:row.id,city:row.city,name:row.name,address:row.address,
  observedOn:'2026-11-13',status:'review',reason:null,candidates:[],source:'OpenStreetMap Photon'};
 if(!city?.point||!want){result.reason='no_suitable_street_number';results.push(result);continue;}
 const q=[want.raw,city.name].join(', ');
 const uri=new URL('https://photon.komoot.io/api/');
 uri.searchParams.set('q',q);
 uri.searchParams.set('lat',String(city.point[0]));uri.searchParams.set('lon',String(city.point[1]));
 uri.searchParams.set('limit','8');uri.searchParams.set('lang','en');
 try{
  const response=await fetch(uri,{signal:AbortSignal.timeout(11000),
   headers:{'accept':'application/json','user-agent':'PrivateReiseplaner-Geodata-Oneoff/0.8 (https://github.com/goat4321/All-in-one-server-mjs)'}});
  if(!response.ok){result.reason='http_'+response.status;results.push(result);if([429,403].includes(response.status))break;continue;}
  const json=await response.json();
  for(const feature of json.features??[]){
   const p=feature.properties??{},coords=feature.geometry?.coordinates;
   if(!Array.isArray(coords)||coords.length!==2||!coords.every(Number.isFinite))continue;
   const point=[coords[1],coords[0]];
   if(distanceKm(point,city.point)>40)continue;
   const realNum=String(p.housenumber??'').toLowerCase().trim();
   const reqStreet=normalizeStreet(want.streetNorm),candStreet=normalizeStreet(p.street);
   if(!realNum||realNum!==want.num||!reqStreet||!candStreet)continue;
   const matches=reqStreet.includes(candStreet)||candStreet.includes(reqStreet);
   if(!matches)continue;
   const osmType={N:'node',W:'way',R:'relation'}[p.osm_type],osmId=p.osm_id;
   if(!osmType||!osmId)continue;
   result.candidates.push({point,osmRef:'https://www.openstreetmap.org/'+osmType+'/'+osmId,
    mappedName:p.name??null,street:p.street,houseNumber:p.housenumber,osmType,
    precisionNote:'Matched exact street name and number in OSM; building/entrance may differ from venue',
    nameMatch:normalized(p.name)===normalized(row.name)});
  }
  if(result.candidates.length===1){
    result.status=result.candidates[0].nameMatch?'named_poi_and_address':'street_address_geometry';
    result.reason='unique_number_and_street_match';
  }else result.reason=result.candidates.length>1?'multiple_same_number_osm_features':'no_exact_street_number_match';
 }catch(error){result.reason=String(error);}
 results.push(result);
 console.log('FOOD_ADDRESS_PROGRESS',JSON.stringify({done:results.length,total:pending.length,
  id:row.id,status:result.status,candidates:result.candidates.length,reason:result.reason}));
 await new Promise(resolve=>setTimeout(resolve,2200));
}
const report={schema:'food_address_lookup_v08',observedOn:'2026-11-13',
source:'OSM Photon, sourced menu record street and house number independently provided by map/business listings',
attribution:'© OpenStreetMap contributors (ODbL)',
warnings:['This is a geocoded street address, not independently proven restaurant frontage or entrance.',
 'Do not pin without checking venue identity and provider address. Do not geocode private Airbnb properties.',
 'A missing matching OSM building is not evidence that the venue has closed.'],
pending:pending.length,queried:results.length,
acceptedAutoCandidates:results.filter(x=>x.status==='named_poi_and_address').length,
addressGeometryCandidates:results.filter(x=>x.status==='street_address_geometry').length,
unresolved:results.filter(x=>x.status==='review').length,
items:results
};
await mkdir(new URL('../data/research-v08/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/research-v08/food-address-candidates.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('FOOD_ADDRESS_REPORT',JSON.stringify({pending:report.pending,queried:report.queried,
accepted:report.acceptedAutoCandidates,address:report.addressGeometryCandidates,unresolved:report.unresolved}));
