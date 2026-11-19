import { utcFromLocal } from '../public/model.mjs';

// Only used when the intentionally git-ignored raw Tripsy snapshots are absent.
// This adapter never claims to reconstruct bookings, precise GPS coordinates, or
// source-specific activity IDs that are not present in the research archive.
const aliases = {
  munich: /munchen|munich/, paris: /paris/, barcelona: /barcelona/,
  sete: /\bsete\b/, nice: /\bnice\b|nizza/, genoa: /genova|genua/,
  venice: /venezia|venedig|mestre/, toulouse: /toulouse/,
  narbonne: /narbonne/, marseille: /marseille/, ventimiglia: /ventimiglia/,
  milan: /milano|mailand/, kandersteg: /kandersteg/,
  appenzell: /appenzell/, wasserauen: /wasserauen/, seealpsee: /seealpsee/,
  kloental: /klontal|kloental/, glarus: /glarus/, grindelwald: /grindelwald/,
  bachalpsee: /bachalpsee/, oeschinensee: /oeschinensee/,
};
const normalized = value => String(value ?? '').normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').toLowerCase();

export function seedCity(value, allowed) {
  const name = normalized(value);
  return allowed.find(id => aliases[id]?.test(name)) ?? null;
}

function plusDay(date) {
  const day = new Date(date + 'T12:00:00Z');
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export function seedSnapshot(trip, { transport, activities, accommodations, cities }) {
  const allowed = [...new Set(trip.ordered_destination_ids)];
  const transports = transport.filter(row => row.trip_id === trip.id).map(row => {
    const departureCity = seedCity(row.from, allowed);
    const arrivalCity = seedCity(row.to, allowed);
    const departureZone = cities[departureCity]?.timezone ?? 'Europe/Berlin';
    const arrivalZone = cities[arrivalCity]?.timezone ?? departureZone;
    const departureTime = row.departure_local?.match(/^([01]\d|2[0-3]):[0-5]\d/)?.[0];
    const arrivalTime = row.arrival_local?.match(/^([01]\d|2[0-3]):[0-5]\d/)?.[0];
    const start = departureTime ? utcFromLocal(row.date_local, departureTime, departureZone) : null;
    const arrivesNextDay = /\(\+1\)/.test(row.arrival_local ?? '');
    let arrivalDate = arrivesNextDay ? plusDay(row.date_local) : row.date_local;
    let end = arrivalTime ? utcFromLocal(arrivalDate, arrivalTime, arrivalZone) : null;
    // A marked overnight trip or an earlier clock on the same itinerary day.
    if (!arrivesNextDay && start && end && Date.parse(end) <= Date.parse(start)) {
      arrivalDate = plusDay(row.date_local);
      end = utcFromLocal(arrivalDate, arrivalTime, arrivalZone);
    }
    return {
      id: row.external_id ?? row.id, departure_description: row.from,
      arrival_description: row.to, transportation_type: row.mode,
      departure_at: start, arrival_at: end, departure_timezone: departureZone,
      arrival_timezone: arrivalZone, company: row.operator, notes: row.notes,
      seedDepartureCity: departureCity, seedArrivalCity: arrivalCity,
      fromSeed: true,
    };
  });
  const plans = activities.filter(row => row.trip_id === trip.id && row.original_itinerary_item)
    .map(row => ({
      id: 'seed:' + row.id, name: row.name,
      seedDestinationId: row.destination_id,
      timezone: cities[row.destination_id]?.timezone ?? 'Europe/Berlin',
      starts_at: row.planned_date ? utcFromLocal(row.planned_date, '12:00', cities[row.destination_id]?.timezone ?? 'Europe/Berlin') : null,
      // A date-only value must not appear as a confirmed 12:00 appointment.
      all_day: true, activity_type: row.tags.includes('food') ? 'restaurant' : 'general',
      fromSeed: true, seedSelected: row.is_selected === true,
      description: row.note,
    }));
  const stays = accommodations.filter(row => row.trip_id === trip.id && row.origin === 'imported')
    .map(row => ({
      id: 'seed:' + row.id, name: row.name,
      seedDestinationId: row.destination_id,
      seedFrom: row.check_in_date, seedTo: row.check_out_date,
      starts_at: null, ends_at: null,
      timezone: cities[row.destination_id]?.timezone ?? 'Europe/Berlin',
      price: row.historic_or_plan_total, currency: row.historic_or_plan_currency,
      fromSeed: true, description: row.note,
    }));
  const group = items => ({ count: items.length, items });
  return {
    timezone: 'Europe/Berlin', imported_on: '2026-11-09',
    description: 'Reduzierter Forschungsdaten-Fallback. Die privaten Tripsy-Rohkopien fehlen; Quellen-IDs, detaillierte Termine und bestätigte Buchungen können abweichen.',
    seedFallback: true,
    resources: { transportations: group(transports), activities: group(plans),
      hostings: group(stays), expenses: group([]) },
  };
}
