// Presentation-only confidence labels. A valid coordinate alone never means a
// visitor entrance or private property address has been verified.
export function markerProvenance(item){
 const p=item?.point;
 if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))
   return {kind:'none',label:'Kein einzelner Kartenpunkt belegt'};
 if(item?.locationReferenceV07?.precision==='provider_reported_unverified'
   ||item?.surveyV19?.locationPrecision==='booking_provider_property_coordinate')
   return {kind:'provider',label:'Anbieterposition · unabhängig noch nicht bestätigt'};
 if(item?.geoEvidence?.isCentroid===true
   ||item?.locationReferenceV07?.precision==='sourced_area_center')
   return {kind:'area',label:'Quellenbelegter Flächenpunkt · kein genauer Eingang'};
 if(/^https:\/\//.test(item?.geoEvidence?.url??''))
   return {kind:'sourced',label:'Benannter öffentlicher Quellenpunkt · Zugang separat prüfen'};
 return {kind:'unverified',label:'Punkt vorhanden · genaue Quellenherkunft noch prüfen'};
}

/** Counts a location as independently sourced only if its precise POI,
 * not just its street address or provider-supplied approximation, has evidence.
 * An old locationReferenceV07.exactKnown boolean never proves provenance.
 */
export function hasIndependentPointEvidence(item){
 const p=item?.point;
 if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)
  ||Math.abs(p[0])>90||Math.abs(p[1])>180||(p[0]===0&&p[1]===0))return false;
 if(markerProvenance(item).kind==='provider')return false;
 return /^https:\/\/\S+/.test(item?.geoEvidence?.url??'')
   ||item?.coordinatePrecision==='verified_exact';
}
