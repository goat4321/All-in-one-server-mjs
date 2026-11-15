import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../lib/catalog.mjs';
import {isSourcedPublicAddress,unlocatedOverview,mapUnlocatedReview}
 from '../public/map-unlocated-v39.mjs';

const addr=JSON.parse(await readFile(new URL('../data/research-v09/verified-public-addresses.json',
 import.meta.url),'utf8'));
const catalog=await loadCatalog();
const sources=addr.entries.filter(x=>!x.point);

test('16 public source addresses are distinct from exact building GPS and private properties',()=>{
 assert.equal(sources.length,16);
 assert.equal(sources.filter(x=>x.city==='sete').length,6);
 assert.equal(sources.filter(x=>x.city==='genoa').length,4);
 assert.equal(sources.filter(x=>x.city==='venice').length,6);
 assert.ok(sources.every(x=>x.airbnb===false&&x.sourceUrl.startsWith('https://')));
 assert.ok(sources.every(x=>catalog.trips.some(t=>t.items.some(i=>
   i.id===x.id&&!i.point&&isSourcedPublicAddress(i)))));
 assert.equal(isSourcedPublicAddress({id:'wishlist:airbnb:1',provider:'Airbnb',
   addressEvidenceV09:{publishedAddress:'secret',sourceUrl:'https://a.org'}}),false);
});
test('A source-backed address-only filter works independently of the existing broad address filter',()=>{
 const item={id:'hotel',city:'venice',name:'Published apartment',kind:'lodging',
  point:null,address:'Published Street 15',
  addressEvidenceV09:{publishedAddress:'Published Street 15, Venezia, Italy',
   sourceUrl:'https://example.org/property',
   remark:'Postal code conflict requires checking; entrance is not verified.'}};
 const privateStay={id:'wishlist:airbnb:1',city:'venice',name:'Private stay',provider:'Airbnb',
  kind:'lodging',point:null,address:null};
 const generic={id:'restaurant',city:'venice',name:'Generic site',point:null,
  address:'Some address 3'};
 const ctx={cities:{venice:{name:'Venedig'}},
  explorer:{placed:[],unlocated:[item,privateStay,generic],showCityReferences:false},
  mapUnlocatedOpen:true,mapUnlocatedFilter:'sourced-address',mapUnlocatedLimit:12};
 const result=unlocatedOverview(ctx);
 assert.equal(result.total,3);
 assert.equal(result.kinds.get('sourced-address'),1);
 assert.equal(result.filteredTotal,1);
 assert.deepEqual(result.preview.map(x=>x.item.id),['hotel']);
 const markup=mapUnlocatedReview(ctx);
 assert.match(markup,/Adresse in Google Maps suchen/);
 assert.match(markup,/Published Street 15, Venezia, Italy/);
 assert.match(markup,/Genauigkeit und Prüfstand/);
 assert.match(markup,/example.org\/property/);
 assert.doesNotMatch(markup,/Private stay|Generic site/);
 const broad=unlocatedOverview({...ctx,mapUnlocatedFilter:'address'});
 assert.equal(broad.filteredTotal,2);
 const all=unlocatedOverview({...ctx,mapUnlocatedFilter:'all'});
 assert.equal(all.filteredTotal,3);
});
test('Six Sète queries stay unresolved while Italian business address discrepancies remain explicit',()=>{
 const byId=new Map(addr.entries.map(x=>[x.id,x]));
 const restaurant=byId.get('local:food-v03-015');
 assert.equal(restaurant.point,null);
 assert.match(restaurant.secondaryAddressSourceUrl,/italia\.it/);
 assert.match(restaurant.remark,/21r/);
 const hotel=byId.get('research:bcom_17205591');
 assert.equal(hotel.point,null);
 assert.match(hotel.remark,/30173/);
 assert.match(hotel.remark,/30174/);
 const apartment=byId.get('research:bcom_13963152');
 assert.equal(apartment.point,null);
 assert.match(apartment.remark,/2 piano/);
 assert.equal(apartment.address,'Scalinata della Cittadella, 16126 Genova, Italy');
 const matches=catalog.trips.flatMap(t=>t.items.filter(i=>i.id==='research:bcom_13963152'));
 assert.ok(matches.length>0);
 assert.ok(matches.every(i=>i.address==='Scalinata della Cittadella, 16126 Genova, Italy'));
 assert.ok(matches.every(i=>!i.point));
 const selected={explorer:{placed:[],unlocated:[matches[0]],showCityReferences:false},
  cities:{genoa:{name:'Genua'}},mapUnlocatedFilter:'sourced-address',mapUnlocatedOpen:true};
 const html=mapUnlocatedReview(selected);
 assert.match(html,/Hausnummer unklar/);
 assert.doesNotMatch(html,/data-action="geocode-lookup"/);
 assert.match(html,/Unabhängige Adressquelle/);
 const bacarino=byId.get('local:food-v03-019');
 assert.equal(bacarino.point,null);
 assert.match(bacarino.remark,/Bacarandino/);
});
test('Direction cues are tied to verified footpaths, not false public transit geometries',async()=>{
 const map=await readFile(new URL('../public/map.mjs',import.meta.url),'utf8');
 assert.match(map,/routeDirectionAt\(leg\.points,\.73\)/);
 assert.match(map,/routeDirectionAt\(points,\.73\)/);
 assert.match(map,/className:'route-studio-hit-target'/);
 assert.match(map,/routeHit\.on\('click'/);
 assert.match(map,/route\?\.walkOnly===true/);
 assert.match(map,/route-studio-direction-arrow/);
});
