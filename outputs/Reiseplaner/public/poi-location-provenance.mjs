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