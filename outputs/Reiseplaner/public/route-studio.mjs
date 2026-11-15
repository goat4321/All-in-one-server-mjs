// Route Studio is presentation-only: map lines may show confirmed footpaths
// or clearly labelled schematic orientation, never fabricated travel times.
import { validPoint } from './map-explorer.mjs';
import {routePositionQuality} from './route-position-quality.mjs';

export const MAP_TONES = Object.freeze(['standard', 'midnight', 'sand']);

export function routeStudioModel(items = [], routes = [], current = 0) {
  const stops = Array.isArray(items) ? items : [];
  const checkedRoutes = Array.isArray(routes) ? routes : [];
  const legs = stops.slice(1).map((to, index) => {
    const from = stops[index];
    const walk = checkedRoutes[index];
    const sameCity = Boolean(from?.city && from.city === to?.city);
    const real = sameCity && walk?.walkOnly === true
      && Array.isArray(walk.points) && walk.points.length >= 2
      && walk.points.every(validPoint)
      && Number.isFinite(walk.minutes) && walk.minutes >= 0
      && Number.isFinite(walk.metres) && walk.metres >= 0;
    const canDraw = sameCity && validPoint(from.point) && validPoint(to.point);
    return {
      index, from, to,
      verified: Boolean(real),
      pointType: real ? 'calculated_footpath' : canDraw ? 'schematic_straight_line' : 'no_coordinates',
      points: real ? walk.points : canDraw ? [from.point, to.point] : [],
      minutes: real ? walk.minutes : null,
      metres: real ? walk.metres : null,
    };
  });
  const index = stops.length ? Math.max(0, Math.min(stops.length - 1, Number.isInteger(current) ? current : 0)) : 0;
  const verified = legs.filter(leg => leg.verified);
  const positionQuality=routePositionQuality(stops);
  return {
    stops, legs, selectedIndex: index,positionQuality,
    activeLeg: legs.length ? Math.min(Math.max(0, index - 1), legs.length - 1) : -1,
    verifiedCount: verified.length,
    unknownCount: legs.length - verified.length,
    knownMinutes: verified.reduce((sum, leg) => sum + leg.minutes, 0),
    knownMetres: verified.reduce((sum, leg) => sum + leg.metres, 0),
    complete: legs.length > 0 && verified.length === legs.length,
  };
}

export function routeStudioSummary(model) {
  if (!model?.stops?.length) return 'Füge Reiseorte zur Tagesroute hinzu.';
  if (model.stops.length === 1) return 'Ein Stopp gewählt. Mindestens zwei Stopps für eine Route auswählen.';
  const count = model.legs.length;
  const geometry=model.complete
    ? 'Alle ' + count + ' Fußetappen anhand echter Weggeometrie berechnet.'
    : model.verifiedCount + ' von ' + count + ' Fußetappen berechnet. '
      + model.unknownCount + ' Verbindungen zeigen höchstens eine gestrichelte Luftlinie ohne Gehzeit.';
  return geometry+(model.positionQuality?.reviewCount
    ? ' Achtung: '+model.positionQuality.reviewCount+' von '+model.stops.length
      +' Stopp-Koordinaten bedürfen einer Prüfung; berechneter Weg bedeutet keinen bestätigten Eingang.'
    : ' Quellenbelegte Kartenpunkte vorhanden; Eingänge separat prüfen.');
}
