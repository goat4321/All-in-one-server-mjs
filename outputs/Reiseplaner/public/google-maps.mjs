// Google Maps universal URLs (no Maps Platform API key, no automatic geocoding).
// A Google search URL is NOT evidence of an exact pin or verified property location.
const cityFallback = {
  munich:'München, Deutschland', paris:'Paris, Frankreich', barcelona:'Barcelona, Spanien',
  sete:'Sète, Frankreich', nice:'Nizza, Frankreich', genoa:'Genua, Italien',
  venice:'Venedig, Italien', toulouse:'Toulouse, Frankreich', narbonne:'Narbonne, Frankreich',
  marseille:'Marseille, Frankreich', montpellier:'Montpellier, Frankreich',
  ventimiglia:'Ventimiglia, Italien', milan:'Mailand, Italien',
  kandersteg:'Kandersteg, Schweiz', appenzell:'Appenzell, Schweiz',
  wasserauen:'Wasserauen, Schweiz', seealpsee:'Seealpsee, Schweiz',
  kloental:'Klöntalersee, Schweiz', glarus:'Glarus, Schweiz',
  grindelwald:'Grindelwald, Schweiz', bachalpsee:'Bachalpsee, Schweiz',
  oeschinensee:'Oeschinensee, Schweiz',
};
const pointOk = value => Array.isArray(value) && value.length === 2
  && Number.isFinite(value[0]) && Number.isFinite(value[1])
  && Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180
  && !(value[0] === 0 && value[1] === 0);
const text = value => String(value ?? '').trim().replace(/\s+/g,' ').slice(0,300);
function placeContext(item,cities={}) {
  const city = cities[item?.city]?.name || cityFallback[item?.city] || item?.city || '';
  const country = cities[item?.city]?.country;
  const countryLabel = {FR:'Frankreich',DE:'Deutschland',ES:'Spanien',IT:'Italien',CH:'Schweiz'}[country];
  return text(countryLabel ? city + ', ' + countryLabel : city);
}
const areaOnly = item => item?.provider === 'Airbnb' || String(item?.id ?? '').startsWith('wishlist:airbnb:');

export function googleMapsLocationStatus(item) {
  if (areaOnly(item)) return 'Nur Umgebung bekannt (kein exakter Unterkunfts-Pin)';
  if (pointOk(item?.point) && item?.geoEvidence?.isCentroid)
    return 'Geprüfter Gebiets- oder Objektmittelpunkt · Zugang / Eingang separat prüfen';
  if (pointOk(item?.point) && item?.geoEvidence)
    return 'Nachrecherchierter Kartenpunkt mit verlinkter Koordinatenquelle';
  if (pointOk(item?.point)) return 'Kartenkoordinate in Quelldaten vorhanden';
  if (text(item?.address)) return 'Adresse angegeben, Position noch nicht geokodiert';
  return 'Namenssuche, genaue Position ungeprüft';
}

// Never show an Airbnb wishlist map pin: wishlists reveal only general locality.
export function googleMapsPlaceQuery(item,cities={}) {
  if (!item) return null;
  const city = placeContext(item,cities);
  if (areaOnly(item)) return text([item.locality, city].filter(Boolean).join(', ')) || null;
  const address = text(item.address);
  if (address) return text([item.name,address,city].filter(Boolean).join(', '));
  if (pointOk(item.point)) return item.point.join(',');
  return text([item.name,city].filter(Boolean).join(', ')) || null;
}

export function googleMapsSearchUrl(item,cities={}) {
  const query=googleMapsPlaceQuery(item,cities);
  return query ? 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query) : null;
}

export function googleMapsDirectionsUrl(from,to,cities={},travelmode='transit') {
  const mode = ['transit','walking','driving','bicycling'].includes(travelmode)?travelmode:'transit';
  const destination = googleMapsPlaceQuery(to,cities);
  if (!destination) return null;
  const origin = googleMapsPlaceQuery(from,cities);
  if (from && !origin) return null;
  return 'https://www.google.com/maps/dir/?api=1'
    + (origin ? '&origin='+encodeURIComponent(origin) : '')
    + '&destination='+encodeURIComponent(destination)
    + '&travelmode='+mode;
}

export function googleMapsSearchLabel(item) {
  return areaOnly(item) ? 'Umgebung in Google Maps' :
    pointOk(item?.point) ? 'Google Maps · Position' :
    text(item?.address) ? 'Adresse in Google Maps suchen' :
    'Ort in Google Maps suchen';
}
