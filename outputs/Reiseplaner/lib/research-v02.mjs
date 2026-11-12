import { readFile } from 'node:fs/promises';

const dir = new URL('../data/research-v02/', import.meta.url);
const files = [
  'trips', 'destinations', 'group_preferences',
  'activities_comparison_catalog', 'group_activity_ranking',
  'accommodation_comparison_catalog', 'accommodation_market_quotes',
  'transport', 'transport_research_queue', 'transport_comparison_candidates',
  'fares', 'budgets', 'budget_scenarios', 'sources', 'data_quality', 'import_rules',
];

const read = async name => JSON.parse((await readFile(new URL(name + '.json', dir), 'utf8')).replace(/^\uFEFF/, ''));

function ensure(condition, reason) {
  if (!condition) throw new Error('Research v0.2: ' + reason);
}
function unique(rows, name, field = 'id') {
  const ids = rows.map(row => row[field]);
  ensure(ids.every(Boolean) && new Set(ids).size === rows.length, name + ': IDs fehlen oder doppelt.');
}
export function validateResearchV02(data, originals) {
  const triples = data.trips.filter(row => row.travellers === 3);
  ensure(originals.length === 4 && data.trips.length === 4 && triples.length === 3, 'Vier Originalreisen mit 3/3/3/4 Personen erforderlich.');
  for (const base of originals) {
    const incoming = data.trips.find(t => t.id === base.id);
    ensure(incoming && incoming.external_trip_id === base.external_trip_id &&
      incoming.travellers === base.travellers &&
      incoming.start_date === base.start_date && incoming.end_date === base.end_date &&
      JSON.stringify(incoming.ordered_destination_ids) === JSON.stringify(base.ordered_destination_ids),
      'Originalroute oder Reisedaten weichen ab: ' + base.id);
  }
  for (const key of ['destinations', 'activities_comparison_catalog', 'accommodation_comparison_catalog',
    'accommodation_market_quotes', 'transport', 'transport_research_queue',
    'transport_comparison_candidates', 'fares', 'sources', 'data_quality', 'budget_scenarios']) unique(data[key], key);
  unique(data.group_activity_ranking, 'group_activity_ranking', 'activity_id');
  const places = new Set(data.destinations.map(row => row.id));
  const trips = new Set(data.trips.map(row => row.id));
  const sources = new Set(data.sources.map(row => row.id));
  const activityIds = new Set(data.activities_comparison_catalog.map(row => row.id));
  const quotes = new Set(data.accommodation_market_quotes.map(row => row.id));
  const legs = new Set(data.transport.map(row => row.id));
  for (const row of data.activities_comparison_catalog) {
    ensure(places.has(row.destination_id) && (!row.trip_id || trips.has(row.trip_id)), 'Ungültige Aktivitätszuordnung ' + row.id);
    ensure((row.source_ids ?? []).every(id => sources.has(id)), 'Aktivitätsquelle fehlt ' + row.id);
  }
  for (const row of data.group_activity_ranking) {
    ensure(activityIds.has(row.activity_id) && row.group_score_0_100 >= 0
      && row.group_score_0_100 <= 100, 'Ungültiges Interessenranking ' + row.activity_id);
  }
  for (const row of data.accommodation_market_quotes) {
    ensure(quotes.has(row.id) && places.has(row.destination_id)
      && Array.isArray(row.trip_ids_applicable) && row.trip_ids_applicable.every(id => trips.has(id)),
      'Unbekannter Unterkunftsbezug ' + row.id);
    ensure(row.is_selected === false && row.booking_status === 'unbooked' && row.live_checkout_confirmed === false,
      'Suchpreis darf nicht als ausgewählt/gebucht gelten: ' + row.id);
    ensure(Number.isSafeInteger(row.group_stay_total_cents) && row.group_stay_total_cents >= 0
      && row.currency === 'EUR' && Number.isSafeInteger(row.guests_adults) && row.guests_adults > 0
      && row.check_in_date < row.check_out_date, 'Ungültige Preis-/Datumsfelder ' + row.id);
  }
  for (const row of data.accommodation_comparison_catalog) {
    ensure(places.has(row.destination_id) && (row.trip_id == null || trips.has(row.trip_id)),
      'Ungültige Unterkunft ' + row.id);
    if (row.id.startsWith('bcom_')) ensure(quotes.has(row.id) && !row.is_selected, 'Orphan/selektierte Such-Unterkunft ' + row.id);
  }
  for (const row of data.transport_research_queue) ensure(legs.has(row.original_segment_id)
    && row.timetable_2027_confirmed === false, 'Nicht geprüfter Bahnabschnitt ' + row.id);
  for (const row of data.transport_comparison_candidates) ensure(!row.is_selected
    && row.timetable_verified_for_2027 === false && row.is_bookable_now === false,
    'Bahn-Hypothese ist fälschlich bestätigt: ' + row.id);
  for (const row of data.budget_scenarios) {
    ensure(!row.is_booked && !row.is_approved && !row.active_plan_mutated
      && row.lodging_ids.every(id => quotes.has(id)), 'Szenario darf keine Buchung aktivieren: ' + row.id);
    // Swiss lakes deliberately ships only a lodging subtotal; other category
    // costs and an overall trip total are unknown, not zero.
    if (row.other_costs_group_cents && row.grand_total_group_cents_without_pass != null) {
      const total = row.lodging_group_cents + Object.values(row.other_costs_group_cents).reduce((a, b) => a + b, 0);
      ensure(total === row.grand_total_group_cents_without_pass, 'Budget-Cent-Summe stimmt nicht: ' + row.id);
    } else {
      ensure(row.other_costs_group_cents == null && row.grand_total_group_cents_without_pass == null,
        'Unvollständiges Szenario muss als offener Gesamtpreis markiert sein: ' + row.id);
    }
  }
  ensure(data.group_preferences.travellers.length === 3, 'Umfragegruppe darf nicht auf Schweizer Viererreise angewendet werden.');
  return true;
}

export async function loadResearchV02(baseTrips) {
  const values = await Promise.all(files.map(read));
  const data = Object.fromEntries(files.map((name, index) => [name, values[index]]));
  validateResearchV02(data, baseTrips);
  return data;
}

export function scopedQuote(quote, trip, stay) {
  return Boolean(quote.trip_ids_applicable.includes(trip.id) &&
    quote.guests_adults === trip.travellers &&
    quote.check_in_date === stay?.from && quote.check_out_date === stay?.to);
}

export function quoteCandidate(quote, trip, city, researchSources) {
  const catalogued = researchSources.find(x => x.id === quote.id);
  const zone = city.timezone;
  return {
    id: 'research:' + quote.id,
    trip: trip.id, city: quote.destination_id, kind: 'lodging', category: 'lodging',
    zone, name: quote.name, selected: false, booked: false, booking: 'ungebucht',
    start: null, end: null, stayFrom: quote.check_in_date, stayTo: quote.check_out_date,
    price: { cents: quote.group_stay_total_cents, currency: 'EUR', scope: 'group',
      party: quote.guests_adults, label: 'Booking-Suchpreis vom ' + quote.observed_on +
        ' · Zimmer, Steuern und Checkout nicht bestätigt' },
    verification: 'Suchpreis · nicht checkoutbestätigt',
    origin: 'Recherche-Snapshot', source: [quote.source_id],
    detail: (catalogued?.note ?? '') + ' Drei/vier passende Betten, Endpreis einschließlich Steuern, Storno und Belegung sind noch nicht geprüft.',
    website: quote.booking_url, address: null, point: null,
    room: null, kitchen: null, fees: null, cancellation: null,
    quote: {
      id: quote.id, observedOn: quote.observed_on, nights: quote.nights,
      roomConfirmed: quote.room_layout_confirmed, taxesConfirmed: quote.full_local_taxes_confirmed,
      checkoutConfirmed: quote.live_checkout_confirmed, beds: quote.bed_configuration,
      location: quote.district_as_returned, availability: quote.availability_for_date,
      sourceId: quote.source_id,
    },
  };
}
