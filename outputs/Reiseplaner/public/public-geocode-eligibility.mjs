// Shared by map, place cards, click handler and server. A public address is
// NOT permission to resolve a disputed private rental or a different POI.
// Searching Nominatim is manual research only; returning a hit never certifies
// a house number, booking, access or customer entrance.
const blockedQualifications=new Set([
 'listing_floor_or_number_ambiguity',
 'published_number_conflicting_postcode',
 'published_restaurant_address_distinct_from_similar_named_poi'
]);
const isPrivate=item=>String(item?.provider??'').trim().toLowerCase()==='airbnb'
  ||String(item?.id??'').startsWith('wishlist:airbnb:');

export function publicGeocodeLookupBlockedReason(item){
 if(!item||isPrivate(item))return 'Private Unterkunftsadressen werden nicht automatisch geokodiert.';
 if(item.booked)return 'Gebuchte Orte werden nicht automatisch neu positioniert.';
 if(item.point)return 'Dieser Eintrag hat bereits einen Kartenpunkt; dessen Herkunft separat prüfen.';
 if(typeof item.address!=='string'||!item.address.trim())
   return 'Für diesen Eintrag fehlt eine konkret veröffentlichte Adresse.';
 const q=item.addressEvidenceV09?.addressQualification;
 if(q==='listing_floor_or_number_ambiguity')
   return 'Die Hausnummer könnte das Stockwerk meinen. Zuerst Nummer und Etage bestätigen.';
 if(q==='published_number_conflicting_postcode')
   return 'Die Postleitzahl widerspricht einer zweiten öffentlichen Quelle. Zuerst abgleichen.';
 if(q==='published_restaurant_address_distinct_from_similar_named_poi')
   return 'Ein ähnlich benannter POI gehört zu einem anderen Lokal. Erst die Objektidentität prüfen.';
 if(item.addressCheckV49?.identityConflict||['critical','high'].includes(item.addressCheckV49?.priority))
   return 'Es gibt einen offenen Identitäts- oder Adresskonflikt. Zuerst die Quellen manuell klären.';
 return null;
}

export function publicGeocodeLookupAllowed(item){
 return publicGeocodeLookupBlockedReason(item)===null;
}
