// Fully transparent multi-stop planning: geometries and walk times must come from
// successful route calls. Straight-line distances ONLY suggest an ordering,
// never a travel-time estimate or a fabricated street route.
import { explorerRouteInput, validPoint } from './map-explorer.mjs';
import {footpathMatchesStops} from './route-studio.mjs';

const toMinutes = time => {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time ?? '')) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const display = n => String(Math.floor(n / 60)).padStart(2,'0') + ':' + String(n % 60).padStart(2,'0');

export function arrangeDayStops(items) {
  if (!Array.isArray(items) || !items.length) return [];
  if (items.some(item => !validPoint(item.point))) throw new Error('Alle Stopps brauchen belegte Koordinaten.');
  if (items.some(item => item.city !== items[0].city)) throw new Error('Nur Stopps derselben Stadt optimieren.');
  const result = [items[0]];
  const remaining = items.slice(1);
  while (remaining.length) {
    const current = result.at(-1);
    remaining.sort((a,b) => explorerRouteInput(current,a).km - explorerRouteInput(current,b).km);
    result.push(remaining.shift());
  }
  return result;
}

export function buildMultiStopDay(items, routes, startTime = '09:00', defaultDuration = 60) {
  if (!Array.isArray(items) || items.length < 2 || items.length > 8
    || !Number.isInteger(defaultDuration) || defaultDuration < 15 || defaultDuration > 300)
    throw new Error('Plane 2–8 Stopps mit plausibler Besuchsdauer.');
  const start = toMinutes(startTime);
  if (start == null) throw new Error('Ungültige Startzeit.');
  if (items.some(i => i.kind !== 'activity' || !validPoint(i.point) || i.city !== items[0].city))
    throw new Error('Für den Tagesplan sind 2–8 Aktivitäten in einer Stadt mit genauen Punkten nötig.');
  let elapsed = start, estimated = false;
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const duration = item.duration ?? defaultDuration;
    if (!Number.isInteger(duration) || duration < 1 || duration > 2880)
      throw new Error('Besuchsdauer der Aktivität ist ungültig.');
    const incoming = i === 0 ? null : routes?.[i - 1];
    if(i>0&&incoming?.walkOnly&&!footpathMatchesStops(items[i-1],item,incoming)){
      return {complete:false,rows,unknownConnection:[items[i-1].id,item.id],
        staleRoute:true,status:'Eine gespeicherte Fußroute passt nicht mehr zu den gewählten Stopps. '
          +'Berechne die aktuelle Route erneut, bevor du Zeiten in den Tagesplan übernimmst.'};
    }
    if (i > 0 && (!incoming?.walkOnly || !Number.isFinite(incoming.minutes)
      || incoming.minutes < 1 || !Number.isFinite(incoming.metres)||incoming.metres<0
      || !Array.isArray(incoming.points) || incoming.points.length < 2)) {
      return { complete: false, rows, unknownConnection: [items[i-1].id, item.id],
        status: 'Mindestens ein Fußweg ist nicht vollständig berechnet. Keine automatische Zeitübernahme.' };
    }
    if (incoming) elapsed += Math.ceil(incoming.minutes);
    if (elapsed + duration > 24*60) return { complete:false,rows, status:'Der Tagesplan überschreitet Mitternacht.' };
    const at = display(elapsed), until = display(elapsed + duration);
    rows.push({ id: item.id, name: item.name, at, until, duration,
      walkMinutes: incoming?.minutes ?? null,
      walkMetres: incoming?.metres ?? null,
      durationAssumed: item.duration == null });
    if (item.duration == null) estimated = true;
    elapsed += duration;
  }
  return { complete:true, rows, start:startTime, end:display(elapsed),
    knownWalkMinutes: routes.reduce((sum,r)=>sum+Math.ceil(r.minutes),0),
    estimatedDuration:estimated,
    status:estimated?'Alle Wege berechnet; fehlende Besuchsdauern als editierbare Planannahme markiert.'
      :'Alle Fußwege tatsächlich berechnet. Öffnungszeiten und Tickets bleiben separat zu prüfen.' };
}
