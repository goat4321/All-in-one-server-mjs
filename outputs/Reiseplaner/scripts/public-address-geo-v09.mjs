// Source-backed address geocoding for the remaining named public hotel/business addresses.
// One-off, serial Photon lookup, 1 request/2.0s; public OSM terms and throttling respected.
// Never geocode Airbnb wishlists; never take a city-centre result as a building.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { loadCatalog, distanceKm } from '../lib/catalog.mjs';

const catalog=await loadCatalog();
const source=JSON.parse(await readFile(new URL('../data/research-v09/verified-public-addresses.json',import.meta.url),'utf8'));
if(source.schema!=='verified_public_addresses_v09')throw Error('Invalid address source');
const pending=source.entries.filter(x=>!x.point);
const results=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const strip=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/straße/g,'strasse').replace(/[^a-z0-9]+/g,' ').trim();
const ignored=new Set(['rue','via','vico','viale','calle','place','piazza','quai','strasse','straße','street',
 'innere','aussere','äussere','avenue','bd','boulevard','gasse','de','des','du','di','delle','la','le',
 'della','del','der','die','of','the','all','san','saint','santa','s','an','au','et','e','francois',
 'françois','st','promenade','chemin','quartiere','str']);
function streetParts(address){
 const street=String(address).split(',')[0];
 const token=strip(street).match(/\b\d+[a-z]?(?:\s+\d+[a-z]?)?\b/);
 const n=street.match(/(?:^|[^\d])(\d{1,5}[a-z]?)(?:\s*\/\s*(\d+[a-z]?))?/i);
 if(!n)return null;
 const house=n[1].toLowerCase();
 const words=strip(street.replace(/\d+[a-z]?(?:\s*\/\s*\d+[a-z]?)?/gi,'')).split(' ')
  .filter(s=>s.length>=3&&!ignored.has(s));
 return {house,house2:n[2]?.toLowerCase()??null,words,raw:street};
}
const numeric=s=>String(s??'').match(/\d+/)?.[0]??null;
function strictMatch(row,props,coords){
 if(!Array.isArray(coords)||coords.length!==2||!coords.every(Number.isFinite))return null;
 const point=[coords[1],coords[0]];
 const home=catalog.cities[row.city];
 if(!home?.point||distanceKm(point,home.point)>40)return null;
 const want=streetParts(row.address);
 if(!want)return null;
 const actualNumber=strip(props.housenumber??'').replace(/\s+/g,'');
 // At minimum a *complete* building number, not merely a street/polygon match.
 if(!actualNumber||numeric(actualNumber)!==numeric(want.house))return null;
 const realStreet=strip(props.street??'').split(' ').filter(w=>w.length>=3&&!ignored.has(w));
 if(!realStreet.length||!want.words.length)return null;
 const shared=want.words.filter(w=>realStreet.includes(w));
 const overlap=shared.length/Math.min(want.words.length,realStreet.length);
 if(overlap<0.6)return null;
 const country=String(props.countrycode??'').toUpperCase();
 const expected=home.country;
 if(country&&expected&&country!==expected)return null;
 const osmType={N:'node',W:'way',R:'relation'}[props.osm_type];
 if(!osmType||!props.osm_id)return null;
 return {point,street:props.street,houseNumber:props.housenumber,
  name:props.name??null,overlap:Number(overlap.toFixed(2)),
  osmRef:'https://www.openstreetmap.org/'+osmType+'/'+props.osm_id,
  precision:osmType==='node'?'osm_address_node':'osm_building_or_area_centroid'};
}
const now='2026-11-13';
for(const row of pending){
 if(row.id.startsWith('wishlist:airbnb:')||row.airbnb)throw Error('Airbnb privacy breach');
 const city=catalog.cities[row.city];
 const record={id:row.id,city:row.city,name:row.name,address:row.address,
  originalSourceUrl:row.sourceUrl,observedOn:now,status:'review',
  candidates:[],reason:null};
 if(!city?.point||!streetParts(row.address)){record.reason='invalid_input_address';results.push(record);continue;}
 const u=new URL('https://photon.komoot.io/api/');
 u.searchParams.set('q',[streetParts(row.address).raw,city.name].join(', '));
 u.searchParams.set('limit','10');u.searchParams.set('lat',String(city.point[0]));
 u.searchParams.set('lon',String(city.point[1]));u.searchParams.set('lang','en');
 try{
  const response=await fetch(u,{signal:AbortSignal.timeout(12500),
   headers:{accept:'application/json',
    'user-agent':'PrivateReiseplaner-Address-Audit/0.9 (https://github.com/goat4321/All-in-one-server-mjs)'}});
  if([403,429].includes(response.status)){record.reason='service_rate_limited_'+response.status;results.push(record);break;}
  if(!response.ok){record.reason='http_'+response.status;results.push(record);continue;}
  const data=await response.json();
  const found=new Map();
  for(const feature of data.features??[]){
    const matched=strictMatch(row,feature.properties??{},feature.geometry?.coordinates);
    if(matched)found.set(matched.osmRef,matched);
  }
  record.candidates=[...found.values()];
  record.status=record.candidates.length===1?'unique_exact_street_number_match':
    record.candidates.length>1?'multiple_exact_address_matches':'no_exact_address_match';
  record.reason=record.status==='unique_exact_street_number_match'
    ?'Matching street and house number on OSM; frontage/room not independently verified.'
    :record.status==='multiple_exact_address_matches'
    ?'More than one OSM object shares the same house number; manual inspection needed.'
    :'No exact street and building number match; never substitute city centre.';
 }catch(error){record.reason=String(error);record.status='provider_failed';}
 results.push(record);
 if(results.length%10===0)console.log('ADDRESS_V09_PROGRESS',JSON.stringify({done:results.length,
  total:pending.length,matched:results.filter(r=>r.status==='unique_exact_street_number_match').length,
  failed:results.filter(r=>r.status==='provider_failed').length}));
 await sleep(2050);
}
const out={schema:'verified_address_geocoding_candidates_v09',observedOn:now,
 attribution:'© OpenStreetMap contributors / Photon (ODbL)',
 method:'One-off sequential 1-request-per-2.05 sec geocode of public operator/booking postal addresses. Strict house number, street tokens, country and 40km near intended city.',
 totalAddresses:source.entries.length,alreadySourcedCoordinates:source.entries.filter(r=>r.point).length,
 queried:results.length,eligible:pending.length,
 singleAddressCandidates:results.filter(r=>r.status==='unique_exact_street_number_match').length,
 multipleCandidates:results.filter(r=>r.status==='multiple_exact_address_matches').length,
 unmatched:results.filter(r=>r.status==='no_exact_address_match').length,
 failed:results.filter(r=>r.status==='provider_failed').length,
 warnings:['A building-centre is not an entrance, room or reservation. Verify address association before import.',
 'No Airbnb wishes geocoded. No guessed city-centre coordinates.',
 'Do not automatically import ambiguous address matches.'],
 items:results};
await mkdir(new URL('../data/research-v09/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/research-v09/address-candidates.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log('ADDRESS_V09_DONE',JSON.stringify({eligible:out.eligible,queried:out.queried,
 single:out.singleAddressCandidates,multiple:out.multipleCandidates,
 unmatched:out.unmatched,failed:out.failed}));
