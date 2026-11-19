import {kitchenAccess} from './stay-analysis.mjs';
import {lodgingPriceInsight} from './price-insights.mjs';
import {esc,btn} from './ui.mjs';

const httpUrl=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u:null;}catch{return null;}};
export function staySourceLinks(item){
 const offer=httpUrl(item?.website);
 const operator=item?.venueSourceV78?.sourceType==='operator'?httpUrl(item.venueSourceV78.sourceUrl):null;
 const host=offer?.hostname.toLowerCase()??'';
 const booking=host==='booking.com'||host.endsWith('.booking.com');
 const airbnb=/^(?:www\.)?airbnb\.(?:com|de|fr|es|ch|co\.uk)$/.test(host);
 return {offer:offer?.href??null,operator:operator?.href??null,booking,airbnb,
  user:Boolean(item?.researchV50)||/Nutzer|manuell/i.test(item?.origin??'')};
}
export function stayCancellationState(item){
 const value=item?.cancellation;
 if(value===true)return 'possible';
 if(value===false)return 'excluded';
 if(typeof value==='string'&&value.trim()&&!/offen|ungeklärt|unbekannt|nicht (?:bestätigt|geprüft)|unknown/i.test(value))return 'described';
 return 'unknown';
}
export function stayCancellationLabel(item){
 const state=stayCancellationState(item);
 return state==='possible'?'Kostenloses Storno laut Quelle, Tarif und Frist prüfen':state==='excluded'
  ?'Keine kostenlose Stornierung laut Quelle, Tarif prüfen':state==='described'?item.cancellation.trim():'Offen · Tarifbedingungen prüfen';
}
export function stayMatchesFacets(item,facets={},ctx={}){
 if(item?.kind!=='lodging'||item.removed)return false;
 const {kitchen='all',beds='all',cancellation='all',source='all',walk='all',maxNight=''}=facets;
 const access=kitchenAccess(item);
 if(kitchen==='usable'&&access!=='usable')return false;
 if(['private','shared'].includes(kitchen)&&item.kitchenMode!==kitchen)return false;
 if(kitchen==='unknown'&&access!=='unknown')return false;
 const review=ctx.state?.verifications?.[item.id];
 const bedsReviewed=review?.groupSize===ctx.people?.length&&review?.checks?.beds===true;
 if(beds==='reviewed'&&!bedsReviewed||beds==='unknown'&&bedsReviewed)return false;
 const state=stayCancellationState(item);
 if(cancellation!=='all'&&(cancellation==='described'?state==='unknown':state!==cancellation))return false;
 const links=staySourceLinks(item);
 if(source!=='all'&&(source==='missing'?Boolean(links.offer):!links[source]))return false;
 const minutes=ctx.hotelWalks?.[item.id]?.minutes;
 const known=Number.isFinite(minutes)&&minutes>=0;
 if(walk==='unknown'&&known||['15','30'].includes(walk)&&(!known||minutes>Number(walk)))return false;
 if(String(maxNight).trim()!==''){
  const cap=Number(maxNight);
  const p=lodgingPriceInsight(item,ctx.people?.length??3);
  if(!Number.isFinite(cap)||cap<0||p?.personNightCents==null||p.personNightCents>Math.round(cap*100))return false;
 }
 return true;
}

export function stayFacetControls(ctx){
 const f=ctx.stayFacets??{};
 const select=(key,label,values)=>'<label>'+label+'<select data-stay-facet="'+key+'" id="stay-'+key+'">'
  +values.map(([id,text])=>'<option value="'+id+'"'+((f[key]??'all')===id?' selected':'')+'>'+text+'</option>').join('')+'</select></label>';
 const active=Object.entries(f).some(([key,value])=>key==='maxNight'?value!=='':value!=='all');
 return '<details class="stay-facets"'+(ctx.stayFacetsOpen?' open':'')+'><summary>Unterkunftsfilter kombinieren'
  +(active?' · aktiv':'')+'</summary><div class="stay-facet-fields">'
  +select('kitchen','Küche',[['all','Alle Angaben'],['usable','Kochmöglichkeit beschrieben'],['private','Private Küche beschrieben'],['shared','Gemeinschaftsküche beschrieben'],['unknown','Küche ungeklärt']])
  +select('beds','Betten',[['all','Alle Angaben'],['reviewed','Für aktuelle Gruppe selbst geprüft'],['unknown','Belegung ungeklärt']])
  +select('cancellation','Storno',[['all','Alle Bedingungen'],['possible','Kostenlos laut Quelle · Tarif prüfen'],['excluded','Kein kostenloses Storno laut Quelle'],['described','Bedingungen beschrieben'],['unknown','Bedingungen offen']])
  +select('source','Quelle',[['all','Alle Quellen'],['booking','Booking.com-Angebotslink'],['airbnb','Airbnb-Angebotslink'],['operator','Separate Betreiberquelle'],['user','Nutzerrecherche / manuell'],['missing','Kein Angebotslink']])
  +select('walk','Bahnhof-Fußweg',[['all','Alle Lagen'],['15','Berechnet ≤15 Minuten'],['30','Berechnet ≤30 Minuten'],['unknown','Weg noch offen']])
  +'<label>Max. € pro Person/Nacht<input data-stay-facet="maxNight" id="stay-maxNight" type="number" min="0" max="10000" step="0.01" placeholder="Ohne Grenze" value="'+esc(f.maxNight??'')+'"></label></div>'
  +'<p>Alle Kriterien gelten zusammen. Preisgrenze nur mit passender EUR-Referenz, Belegung und Nächten; Suchwerte bleiben vorläufig. Stornoangaben sind keine kostenlose Stornogarantie.</p>'
  +btn('stay-facets-reset','Unterkunftsfilter zurücksetzen','reset')+'</details>';
}
