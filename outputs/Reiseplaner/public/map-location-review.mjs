// Phase 47: source-aware, keyless cross-checking for EXISTING map pins.
// Opening two map views is a research action, not verification or geocoding.
// Public-POI-only: never reveal or guess private Airbnb address/coordinates.
import {validPoint} from './map-explorer.mjs';

const isPrivate=item=>item?.provider==='Airbnb'
  ||String(item?.id??'').startsWith('wishlist:airbnb:');
const safeText=value=>String(value??'').trim().replace(/\s+/g,' ').slice(0,220);
const https=url=>typeof url==='string'&&/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(url)
  ?url:null;
export function existingPinReviewUrl(item,zoom=17){
 if(isPrivate(item)||!validPoint(item?.point))return null;
 const [lat,lon]=item.point;
 const level=Number.isInteger(zoom)?Math.max(10,Math.min(19,zoom)):17;
 const a=lat.toFixed(6),b=lon.toFixed(6);
 return 'https://www.openstreetmap.org/?mlat='+a+'&mlon='+b+
   '#map='+level+'/'+a+'/'+b;
}
export function publicPlaceReviewSearchUrl(item,cityName=''){
 if(isPrivate(item)||!item?.name)return null;
 const q=[safeText(item.name),safeText(item.address),safeText(cityName??item.city)]
   .filter(Boolean).join(', ');
 return q?'https://www.openstreetmap.org/search?query='+encodeURIComponent(q):null;
}
export function publicPinReviewLinks(item,cityName=''){
 if(isPrivate(item)||!validPoint(item?.point))return [];
 const links=[];
 const saved=existingPinReviewUrl(item);
 if(saved)links.push({type:'saved',label:'Gespeicherten Punkt prüfen',url:saved});
 const query=publicPlaceReviewSearchUrl(item,cityName);
 if(query)links.push({type:'search',label:'Objekt unabhängig suchen',url:query});
 // An address publication confirms a named address, not that its provider GPS
 // pin identifies the entrance. Keep the distinction visible.
 const addr=https(item?.addressEvidenceV09?.sourceUrl);
 if(addr)links.push({type:'address',label:'Veröffentlichte Adresse prüfen',url:addr});
 const geo=https(item?.geoEvidence?.url);
 if(geo)links.push({type:'geometry',label:'Kartenpunkt-Quelllink',url:geo});
 return links;
}
export function publicPinReviewSummary(item){
 if(isPrivate(item)||!validPoint(item?.point))return null;
 const [lat,lon]=item.point;
 const provider=Boolean(item?.locationReferenceV07?.precision==='provider_reported_unverified'
   ||item?.surveyV19?.locationPrecision==='booking_provider_property_coordinate');
 return {
   pointLabel:lat.toFixed(5)+', '+lon.toFixed(5),
   provenance:provider?'Anbieter-GPS – kein unabhängiger Nachweis'
     :'Gespeicherter GPS-Punkt – unabhängig gegenprüfen',
   caveat:'Ein sichtbarer Pin beweist weder Hausnummer noch Fußweg-Eingang.',
 };
}
