/** Shared accommodation evidence rules. Unknown is never false or zero.
 * No city photo/location may be presented as a verified hotel object. */
/** Only a property-specific listing URL may be called an offer link.
 * A provider homepage, category search, generic city result, or referral
 * search is not proof of a particular accommodation or room. */
export function stayExactListingUrl(item){
 const offer=item?.website;
 if(!offer)return null;
 try{
   const u=new URL(offer),host=u.hostname.toLowerCase().replace(/^www\./,'');
   const path=decodeURIComponent(u.pathname).toLowerCase();
   if(host==='booking.com'&&/^\/hotel\/[a-z]{2}\/[^/]+(?:\.html)?\/?$/.test(path))
     return u.href;
   if(/^airbnb\.(com|de|fr|es|ch|co\.uk)$/.test(host)
      &&/^\/rooms\/\d+(?:\/|$)/.test(path))return u.href;
 }catch{}
 return null;
}
export function stayLaundryState(item){
 const explicit=item?.washingMachine??item?.washer;
 if(explicit===true)return 'yes';
 if(explicit===false)return 'no';
 const detail=[item?.laundry,item?.washingMachine,item?.washer,
   ...(Array.isArray(item?.amenities)?item.amenities:[])].filter(x=>typeof x==='string').join(' ').toLowerCase();
 if(/(?:keine|ohne|no)\s+(?:waschmaschine|washing machine|washer)/.test(detail))return 'no';
 if(/(?:waschmaschine|washing machine|washer)/.test(detail))return 'yes';
 return 'unknown';
}
export function stayLocationState(item){
 if(!Array.isArray(item?.point)||item.point.length!==2
   ||!item.point.every(Number.isFinite))return 'Kein belegter Kartenpunkt';
 if(item?.geoEvidence?.isCentroid===true)return 'Gebietspunkt · kein Hauseingang';
 if(item?.geoEvidence?.precision==='area')return 'Gebietsposition · ungeprüft';
 return 'Kartenpunkt vorhanden · Eingang prüfen';
}
