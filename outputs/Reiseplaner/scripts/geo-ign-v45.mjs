// Phase 45: bounded public French address *candidate* research via official
// IGN GeoPlateforme / BAN. No auto-import, no private Airbnb addresses.
import {readFile,writeFile,mkdir} from 'node:fs/promises';

const input=new URL('../data/research-v09/verified-public-addresses.json',import.meta.url);
const output=new URL('../data/research-v45/ign-address-candidates.json',import.meta.url);
const data=JSON.parse(await readFile(input,'utf8'));
if(data.schema!=='verified_public_addresses_v09')throw Error('Unexpected source schema');
const french=data.entries.filter(x=>x.point===null&&x.city==='sete'&&x.airbnb===false
  &&typeof x.address==='string'&&x.address.includes('34200')
  &&/^https:\/\//.test(x.sourceUrl??''));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const words=s=>norm(s).split(/\s+/).filter(w=>w.length>=3
  &&!['rue','grand','grande','place','allee','impasse','promenade','de','des','du','la','le','les','bis'].includes(w));
const dist=(p,q)=>{const rad=Math.PI/180;
 const h=Math.sin((p[0]-q[0])*rad/2)**2+
 Math.cos(p[0]*rad)*Math.cos(q[0]*rad)*Math.sin((p[1]-q[1])*rad/2)**2;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));};
const ref=[43.4073,3.6990];
const queryRows=[];
for(const item of french){
 const first=item.address.split(',')[0].trim();
 const house=(first.match(/\b(\d{1,4})(\s*bis)?\b/i)??[])[1]??null;
 if(!house)throw Error('No public street number: '+item.id);
 const streetTokens=words(first.replace(/\b\d{1,4}(?:\s*bis)?\b/gi,''));
 const url=new URL('https://data.geopf.fr/geocodage/search');
 url.searchParams.set('q',item.address);
 url.searchParams.set('index','address');
 url.searchParams.set('limit','6');
 const record={id:item.id,name:item.name,address:item.address,
   publisherUrl:item.sourceUrl,officialApiUrl:url.toString(),
   requestedNumber:house,streetTokens,candidates:[],reviewStatus:'not_queried'};
 try{
   const response=await fetch(url,{signal:AbortSignal.timeout(11000),headers:{
    accept:'application/json',
    'user-agent':'Reiseplaner-Public-Address-Review/1.0 (individual audit, no bulk scraping)'
   }});
   record.httpStatus=response.status;
   if(!response.ok){record.reviewStatus='provider_http_'+response.status;}
   else{
    const json=await response.json();
    for(const feature of (json.features??[]).slice(0,6)){
      const p=feature.properties??{};
      const lonlat=feature.geometry?.coordinates;
      const pt=Array.isArray(lonlat)&&lonlat.length===2?[lonlat[1],lonlat[0]]:null;
      if(!pt||!pt.every(Number.isFinite))continue;
      const candidateNumber=(String(p.housenumber??p.number??p.name??p.label??'')
        .match(/\b\d{1,4}\b/)??[])[0]??null;
      const label=String(p.label??p.name??'');
      const street=String(p.street??p.name??p.label??'');
      const streetW=words(street),common=streetTokens.filter(x=>streetW.includes(x));
      const postal=String(p.postcode??p.postalcode??'');
      const geographicKm=dist(pt,ref);
      const exactNumber=candidateNumber===house;
      const exactStreet=streetTokens.length>0&&common.length/Math.max(1,streetTokens.length)>=.75;
      const localArea=geographicKm<8&&
       (postal==='34200'||norm(p.city??label).includes('sete'));
      const suffixWanted=/\b42\s*bis\b/i.test(first);
      const suffixConfirmed=!suffixWanted||/\b42\s*bis\b/i.test([p.housenumber,p.label].join(' '));
      const acceptable=exactNumber&&exactStreet&&localArea&&suffixConfirmed;
      record.candidates.push({point:pt,label,houseNumber:String(p.housenumber??''),
        street,postcode:postal,type:String(p.type??''),sourceId:p.id??null,
        score:p.score??null,distanceKm:Number(geographicKm.toFixed(2)),
        exactNumber,exactStreet,localArea,suffixConfirmed,acceptable});
    }
    const accepted=record.candidates.filter(x=>x.acceptable);
    record.reviewStatus=accepted.length===1?'single_strict_public_address_candidate'
      :accepted.length>1?'ambiguous_public_address_matches'
      :'no_strict_public_address_match';
    record.acceptedCount=accepted.length;
   }
 }catch(error){record.reviewStatus='provider_error';record.error=String(error);}
 queryRows.push(record);
 // Bounded one-time run. No automatic retries / fallback to approximate GPS.
 await new Promise(resolve=>setTimeout(resolve,400));
}
const result={schema:'ign_public_address_candidate_review_v45',
 observedOn:new Date().toISOString().slice(0,10),
 source:'https://data.geopf.fr/geocodage/search',
 officialDocumentation:'https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/',
 addressSource:'data/research-v09/verified-public-addresses.json',
 privacy:'Only seven published public addresses in Sète; no private Airbnb and no automatic coordinate updates',
 note:'A BAN house-number candidate is an address reference, not a verified holiday apartment entry, walking-route endpoint, or 2027 booking.',
 queryCount:queryRows.length,
 singleCandidates:queryRows.filter(x=>x.reviewStatus==='single_strict_public_address_candidate').length,
 items:queryRows};
await mkdir(new URL('../data/research-v45/',import.meta.url),{recursive:true});
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('IGN_PUBLIC_GEO_V45_DONE',JSON.stringify({queried:result.queryCount,
 single:result.singleCandidates,statuses:queryRows.map(x=>[x.id,x.reviewStatus])}));
