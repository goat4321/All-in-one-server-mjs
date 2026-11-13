import { readFile } from 'node:fs/promises';
import { localParts, minor, utcFromLocal } from '../public/model.mjs';
import { italyLodgings, italyPlaces, italySources, italyStations } from './italy.mjs';
import { rivieraAlpsLodgings, rivieraAlpsPlaces, rivieraAlpsSources, rivieraAlpsStations } from './riviera-alps.mjs';
import { barcelonaFoodPlaces, mealPlans, mealSources } from './barcelona-meals.mjs';
import { seedSnapshot } from './seed-fallback.mjs';
import { loadResearchV02, scopedQuote, quoteCandidate } from './research-v02.mjs';

const file = name => readFile(new URL('../data/' + name + '.json', import.meta.url), 'utf8')
  .then(content => JSON.parse(content.replace(/^\uFEFF/, '')));
const clean = name => String(name ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const aliases = {
  munich: /munchen|munich/, paris: /paris/, barcelona: /barcelona/, sete: /\bsete\b/,
  nice: /\bnice\b|nizza/, genoa: /genova|genua|boccadasse/, venice: /venezia|venedig|mestre|markusplatz/,
  toulouse: /toulouse/, narbonne: /narbonne/, marseille: /marseille/,
  ventimiglia: /ventimiglia/, milan: /milano|mailand/, kandersteg: /kandersteg/,
  appenzell: /appenzell/, wasserauen: /wasserauen/, seealpsee: /seealpsee/,
  kloental: /klontal|rhodann/, glarus: /glarus/, grindelwald: /grindelwald/,
  bachalpsee: /bachalpsee/, oeschinensee: /oeschinensee/, montpellier: /montpellier/,
};
const optional = /\b(?:optional|option|alternative)\b|statt zweiter clubnacht/i;
const barcelonaFacts = [
  [/poblenou.*bogatell|bogatell.*volley/, {
    name: 'Poblenou & Bogatell Beach', tags: ['Strand', 'Sport', 'Draußen'],
    detail: 'Strandzeit an der Promenade von Poblenou. Wenn ein Feld frei ist, könnt ihr Beachvolleyball spielen. Ball und Feldbelegung vor Ort klären.',
    addedSources: ['pilot-bogatell'],
  }],
  [/ciutadella/, {
    name: 'Parc de la Ciutadella', tags: ['Park', 'Draußen'],
    detail: 'Eine Runde durch den Stadtpark mit dem monumentalen Wasserfall als Orientierungspunkt. Der Besuch lässt sich mit einem Spaziergang durch El Born verbinden.',
  }],
  [/selbst kochen|gemeinsam kochen/, {
    name: 'Gemeinsam kochen', tags: ['Verpflegung', 'Küche erforderlich'],
    detail: 'Gemeinsames Abendessen als Planoption. Eine geeignete Kochmöglichkeit und Einkaufspreise müssen feststehen, bevor ein Vergleich mit Restaurantkosten sinnvoll ist.',
    requiresKitchen: true, mealSlot: 'dinner', category: 'food',
  }],
  [/el born.*gunstige tapas/, { mealSlot: 'dinner', category: 'food' }],
  [/razzmatazz/, {
    name: 'Razzmatazz', tags: ['Abend', 'Club', '18+'], minAge: 18,
    address: 'Carrer dels Almogàvers 122, Barcelona',
    detail: 'Club in Poblenou mit wechselnden Sessions und mehreren Floors. Für Clubnächte gilt 18+ mit gültigem Ausweis. Veranstaltung, Beginn und Preis für den Reiseabend sind offen.',
    access: 'Marina (L1), Bogatell (L4), T4 Marina oder Nachtbus N11/N0 laut Veranstalter. Konkrete Rückfahrt und Tarif für 2027 prüfen.',
    addedSources: ['pilot-razz', 'pilot-tmb-hours'],
  }],
  [/sagrada/, {
    name: 'Sagrada Família', point: [41.40363, 2.17436], address: 'Carrer de Mallorca 401, Barcelona',
    tags: ['Architektur', 'Innen', 'Zeitfenster'], duration: 90,
    detail: 'Besichtigt Gaudís Basilika von innen, mit farbigen Glasfenstern und verzweigten Säulen. Der Basiseintritt kostet laut Referenz 26 €, ermäßigt 24 € unter 30 mit Nachweis. Besuchsdauer ist eine Planannahme.',
    addedSources: ['pilot-sagrada'],
  }],
  [/park guell/, {
    name: 'Park Güell · Monumentalzone', point: [41.41450, 2.15269], address: 'Carrer d’Olot, Barcelona',
    tags: ['Architektur', 'Aussicht', 'Draußen'], duration: 90,
    detail: 'Geht durch die Monumentalzone mit Gaudís Mosaiken und der Terrasse über der Stadt. Für den Besuch ist ein datiertes Zeitfenster zu prüfen. Besuchsdauer ist eine Planannahme.',
  }],
  [/mercat de sant antoni/, {
    point: [41.37817, 2.16350], address: 'Carrer del Comte d’Urgell 1, Barcelona',
    detail: 'Markt für frische Lebensmittel mit einem Lidl im selben Gebäudekomplex. Die veröffentlichte Marktzeit gilt getrennt von Ladenzeiten und Feiertagen.',
    tags: ['Einkauf', 'Markt', 'Verpflegung'], addedSources: ['pilot-market'],
    weekly: { days: [1, 2, 3, 4, 5, 6], hours: ['08:00', '20:30'] },
  }],
  [/parc del forum/, {
    point: [41.41091, 2.22618], tags: ['Abend', 'Ufer', 'Draußen'],
    detail: 'Offener Spaziergang am Ufer am Parc del Fòrum. Veranstaltungstage und Zugang einzelner Bereiche separat prüfen.',
  }],
  [/montjuic/, {
    point: [41.36879, 2.16313], tags: ['Aussicht', 'Draußen'],
    detail: 'Spaziergang auf dem Montjuïc mit Aussicht und Steigungen. Der Pin dient als Orientierung für den Hügel. Eintritt zu Einrichtungen ist separat zu prüfen.',
  }],
];
const parisFacts = [
  [/louvre/, {
    name: 'Louvre', point: [48.86061, 2.33764], address: 'Pyramide du Louvre, Paris',
    tags: ['Museum', 'Innen', 'Zeitfenster'], addedSources: ['pack-louvre'],
    detail: 'Besuch der Sammlungen oder einer Sonderausstellung. Laut Museum gelten 22 € für EWR-Berechtigte, sonst 32 €. Gratis unter 18 bzw. unter 26 bei EWR-Wohnsitz mit Nachweis. Zeitfenster empfohlen, dienstags geschlossen. Reisedatum prüfen.',
    weekly: { days: [0, 1, 3, 4, 5, 6], hours: ['09:00', '17:00'],
      byDay: { 3: ['09:00', '20:00'], 5: ['09:00', '20:00'] } },
  }],
  [/eiffelturm/, {
    point: [48.85826, 2.29450], address: 'Champ de Mars, 5 avenue Anatole France, Paris',
    tags: ['Aussicht', 'Zeitfenster'], addedSources: ['pack-eiffel'],
    detail: 'Aussichtsplattform auf der zweiten Etage. Treppen erfordern mehr Bewegung. Der Aufzug ist eine eigene Ticketoption. Der Betreiber verlangt laut aktuellem Hinweis eine Reservierung für den Treppenzugang. Zeitfenster 2027 offen.',
  }],
  [/champ de mars/, { point: [48.85558, 2.29865], tags: ['Park', 'Draußen', 'Picknick'] }],
  [/jardin du luxembourg/, { point: [48.84695, 2.33716], tags: ['Park', 'Draußen'] }],
];
const seteFacts = [
  [/pointe courte/, { tags: ['Abend', 'Hafen', 'Draußen'],
    detail: 'Abendrunde im Fischerviertel an der Lagune. Rückweg und Betriebszeit beim örtlichen Verkehrsverbund prüfen.' }],
  [/mont saint-clair/, { tags: ['Abend', 'Aussicht', 'Steigung'],
    detail: 'Aussicht auf Stadt und Lagune. Für den Rückweg Steigung, Dunkelheit und Busfahrplan berücksichtigen.', addedSources: ['pack-sete-transit'] }],
];
const factsFor = (city, name) => ({ barcelona: barcelonaFacts, paris: parisFacts, sete: seteFacts, ...italyPlaces, ...rivieraAlpsPlaces }[city] ?? [])
  .find(([pattern]) => pattern.test(clean(name)))?.[1];

const extraSources = [
  { id: 'pilot-razz', publisher: 'Sala Razzmatazz · Hausregeln und Anreise', url: 'https://www.salarazzmatazz.com/en/info/', accessed_on: '2026-11-12' },
  { id: 'pilot-tmb-hours', publisher: 'TMB · allgemeine Metro-Betriebszeiten', url: 'https://www.tmb.cat/en/barcelona-transport/operating-hours-metro-bus', accessed_on: '2026-11-12' },
  { id: 'pilot-market', publisher: 'Ajuntament de Barcelona · Mercat Sant Antoni', url: 'https://guia.barcelona.cat/es/detall/mercat-de-sant-antoni_92086009452.html/1000', accessed_on: '2026-11-12' },
  { id: 'pilot-bird', publisher: 'Bird House · Zimmer und Ausstattung', url: 'https://www.birdhouse.es/barcelona/rooms/', accessed_on: '2026-11-12' },
  { id: 'pilot-stc', publisher: 'St Christopher’s · Unterkunft und Gästeküche', url: 'https://www.st-christophers.co.uk/barcelona-las-ramblas-hostel/', accessed_on: '2026-11-12' },
  { id: 'pilot-sagrada', publisher: 'Sagrada Família · Einzeltarife', url: 'https://sagradafamilia.org/en/sagrada-familia-ticket', accessed_on: '2026-11-12' },
  { id: 'pilot-bogatell', publisher: 'Ajuntament de Barcelona · Platja del Bogatell', url: 'https://guia.barcelona.cat/ca/detall/bogatell-beach_92168143754.html', accessed_on: '2026-11-12' },
  { id: 'pilot-bormuth', publisher: 'Bormuth · Tapas in El Born', url: 'https://www.bormuthbarcelona.com/about', accessed_on: '2026-11-12' },
  { id: 'pilot-nardi', publisher: 'Taberna Nardi · Karte und Öffnungszeiten', url: 'https://tabernanardi.com/en/', accessed_on: '2026-11-12' },
  { id: 'pack-louvre', publisher: 'Musée du Louvre · Öffnungszeiten und Tarife', url: 'https://www.louvre.fr/en/visit/tickets-and-prices', accessed_on: '2026-11-12' },
  { id: 'pack-eiffel', publisher: 'Tour Eiffel · Zugang und Tarifübersicht', url: 'https://www.toureiffel.paris/en/rates-opening-times', accessed_on: '2026-11-12' },
  { id: 'pack-georges', publisher: 'Georges Hostel · Zimmer und Küche', url: 'https://georgeshostel.com/', accessed_on: '2026-11-12' },
  { id: 'pack-georges-address', publisher: 'Acceslibre · Anschrift', url: 'https://acceslibre.beta.gouv.fr/app/34-sete/a/auberge-de-jeunesse/erp/georges-hostel/', accessed_on: '2026-11-12' },
  { id: 'pack-sete-transit', publisher: 'Sète Agglopôle Mobilité · Routenplaner', url: 'https://www.mobilite.agglopole.fr/itineraire', accessed_on: '2026-11-12' },
  { id: 'tripsy-refresh', publisher: 'Tripsy · privater, lesender Abgleich', accessed_on: '2026-11-12' },
  { id: 'research-seed-fallback', publisher: 'Nutzer-Recherchearchiv · reduzierter lokaler Fallback, kein neuer Tripsy-Import', accessed_on: '2026-11-09' },
];

function cityName(text, allowed) {
  return allowed.find(id => aliases[id]?.test(clean(text))) ?? null;
}

function point(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 && (latitude !== 0 || longitude !== 0) ? [latitude, longitude] : null;
}

function citiesWithoutAssumptions(item, destinations) {
  return destinations.some(city => city.id === item.city)
    && typeof item.name === 'string' && item.name.length > 0
    && item.locationWarning == null !== (item.locality == null);
}

export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const h = Math.sin((a[0] - b[0]) * rad / 2) ** 2
    + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin((a[1] - b[1]) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function checkedPoint(raw, city, cities) {
  const center = cities[city]?.point;
  if (raw && center && distanceKm(raw, center) > 45) return { point: null, positionIssue: 'Originalkoordinaten passen nicht zur zugeordneten Stadt.' };
  return { point: raw, positionIssue: null };
}

function stationPoint(raw, name, address, city, cities, mode) {
  const original = checkedPoint(raw, city, cities);
  const station = mode === 'train' ? italyStations[city] ?? rivieraAlpsStations[city] : null;
  if (!station?.match.test(clean(name))) return { ...original, address, sources: [] };
  if (rivieraAlpsStations[city] && original.point) return { ...original, address: address ?? station.address, sources: station.sources };
  return {
    ...original, point: station.point, address: station.address, sources: station.sources,
    positionIssue: original.positionIssue && 'Abweichender Tripsy-Bahnhofspunkt. Die Karte verwendet den geprüften Zugang.',
  };
}

function price(amount, currency, scope, label, party) {
  if (amount == null) return null;
  return { cents: minor(amount), currency: currency ?? 'EUR', scope, label, party: party ?? null };
}

function pickedFields(record) {
  return { start: record.starts_at ?? null, end: record.ends_at ?? null, address: record.address,
    detail: record.description ?? record.notes, source: [record.fromSeed ? 'research-seed-fallback' : 'tripsy-refresh'], origin: record.fromSeed ? 'Forschungs-Seed' : 'übernommen', verification: 'ungeprüft',
    externalId: String(record.id), booking: 'offen', payment: 'open', selected: false };
}

function catalogActivity(entry, fareMap, cities, trip) {
  const fare = fareMap[entry.price_fare_id];
  const enrichment = factsFor(entry.destination_id, entry.name);
  let cost = fare && !fare.eligibility && fare.price_type !== 'source_minimum'
    ? price(fare.amount, fare.currency, 'person', 'Tarifreferenz ' + fare.tariff_year) : null;
  if (fare?.id === 'sagrada_under30') cost = { ...price(26, 'EUR', 'person', 'Tarifreferenz 2026 · nach Altersprofil'),
    ageTariff: { freeUnder: 11, reducedUnder: 30, reducedCents: minor(fare.amount) } };
  if (entry.destination_id === 'paris' && /eiffelturm/.test(clean(entry.name))) {
    const stairs = /treppen/.test(clean(entry.name));
    cost = { ...price(stairs ? 14.80 : 23.50, 'EUR', 'person', 'Tarifreferenz 2026 · nach Altersprofil'),
      ageTariff: { freeUnder: 4, childUnder: 12, childCents: stairs ? 380 : 600, reducedUnder: 25, reducedCents: stairs ? 740 : 1180 } };
  }
  return {
    id: 'research:' + entry.id, trip: trip.id, city: entry.destination_id, kind: 'activity',
    name: entry.name, category: entry.tags.includes('food') ? 'food' : 'activity', tags: entry.tags,
    start: null, end: null, zone: cities[entry.destination_id].timezone, point: null, selected: false,
    price: cost, eligibility: fare?.id === 'sagrada_under30' ? 'Ermäßigung nur mit Nachweis. Bei unbekanntem Alter wird der Standardpreis gerechnet.' : fare?.eligibility,
    origin: 'übernommen', verification: fare?.price_type === 'source_minimum' ? 'Mindestpreis · Gesamtpreis offen' : fare ? 'Tarifreferenz' : 'ungeprüft',
    source: entry.source_ids, detail: entry.note, duration: entry.estimated_duration_min,
    openingHoursNote: typeof entry.opening_hours_on_trip_date === 'string' ? entry.opening_hours_on_trip_date : null,
    estimatedCostNote: entry.cost_estimate == null ? null : String(entry.cost_estimate),
    eligibilityOrRisk: entry.eligibility_or_risk ?? null,
    priorityFit: entry.priority_fit ?? null,
    ...enrichment, source: [...new Set([...entry.source_ids, ...(enrichment?.addedSources ?? [])])],
  };
}

function lodgingFacts(name) {
  if (/bird house/i.test(name)) return {
    name: 'Bird House', kitchen: 'Gemeinschaftsküche', kitchenMode: 'shared', addedSources: ['pilot-bird', 'bcn-food-geo'],
    address: 'Carrer del Comte d’Urgell 51 Bis, Barcelona', point: [41.381515, 2.159126],
    room: 'Familienzimmer bis sechs und Vierbettzimmer mit Gemeinschaftsküche. Belegung für drei am Reisedatum offen.',
    detail: 'Unterkunft im Eixample nahe Urgell. Gemeinschaftsküche laut Zimmerseite. Herd und Ausstattung für Selbstversorgung prüfen. Der Gruppenbetrag stammt aus der bisherigen Planung.',
  };
  if (/st christopher/i.test(name)) return {
    name: 'St Christopher’s Barcelona', kitchen: 'Gästeküche mit Küchenzeile und Mikrowelle', kitchenMode: 'limited',
    address: 'Carrer de Bergara 3, Barcelona', point: [41.386101, 2.167697], addedSources: ['pilot-stc', 'bcn-food-geo'],
    room: 'Privatzimmer und Schlafsäle laut Anbieter. Zusammenhängende drei Plätze offen.',
    detail: 'Hostel nahe Plaça de Catalunya. Die aktuelle Anbieterbeschreibung nennt Kühlschrank, Mikrowelle und Küchenzeile. Das präzisiert die ältere Seed-Notiz zur Ausstattung. Vollständige Kochmöglichkeiten prüfen.',
  };
  if (/georges hostel/i.test(name)) return {
    kitchen: 'Gemeinschaftsküche', kitchenMode: 'shared', addedSources: ['pack-georges', 'pack-georges-address'],
    address: '8 Rue Gabriel Péri, Sète', point: [43.405403, 3.695706],
    room: 'Familienzimmer für drei bis sieben Personen und geteilte Zimmer laut Anbieter. Preis und Zuteilung für den Aufenthalt offen.',
    detail: 'Hostel und Café im Stadtzentrum mit Gemeinschaftsküche. Eine passende Zimmerkategorie ist beschrieben. Verfügbarkeit, Gesamtpreis und Storno für die gewählten Daten separat prüfen.',
  };
  return rivieraAlpsLodgings.find(([pattern]) => pattern.test(name))?.[1] ?? {};
}

function housingFromSeed(entry, trip, cities, stay) {
  const matches = entry.trip_id === trip.id;
  const city = entry.destination_id;
  const facts = lodgingFacts(entry.name);
  const zone = cities[city].timezone;
  const from = matches ? entry.check_in_date : stay?.from;
  const to = matches ? entry.check_out_date : stay?.to;
  const amount = matches ? entry.live_quote_total ?? entry.historic_or_plan_total : null;
  return {
    id: 'research:' + entry.id, trip: trip.id, city, kind: 'lodging', category: 'lodging', zone,
    name: entry.name, selected: entry.booking_status === 'booked', booked: entry.booking_status === 'booked',
    start: utcFromLocal(from, entry.check_in_time, zone), end: utcFromLocal(to, entry.check_out_time, zone),
    stayFrom: from, stayTo: to, point: null, origin: 'übernommen', verification: 'ungeprüft',
    price: price(amount, entry.live_quote_currency ?? entry.historic_or_plan_currency, 'group',
      entry.live_quote_total != null ? 'Importierter Angebotspreis' : 'Historischer Planwert', entry.travellers),
    kitchen: entry.kitchen, room: entry.room_beds_verified_for_party, bathroom: entry.private_bathroom,
    checkInTime: entry.check_in_time, checkOutTime: entry.check_out_time,
    priceValidity: entry.price_validity, fees: entry.fees_included,
    cancellation: entry.free_cancellation, detail: entry.note, website: entry.url,
    ...facts, source: [...new Set([...entry.source_ids, ...(facts.addedSources ?? [])])],
  };
}

function flagDuplicates(items, identity) {
  const seen = new Map();
  for (const item of items) {
    const key = identity(item);
    if (!key) continue;
    if (seen.has(key)) {
      item.duplicateOf = seen.get(key);
      item.selected = false;
    } else seen.set(key, item.id);
  }
}

export async function loadCatalog() {
  const [trips, destinations, activities, accommodations, transport, fares, budgets, sources, quality] =
    await Promise.all(['trips', 'destinations', 'activities', 'accommodations', 'transport', 'fares', 'budgets', 'sources', 'data_quality'].map(file));
  const research = await loadResearchV02(trips);
  const [newFoodResearch, officialActivityEvidence] = await Promise.all([
    readFile(new URL('../data/research-v03/food-venues.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../data/research-v03/official-activity-evidence.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  const airbnbResearch = JSON.parse(await readFile(
    new URL('../data/research-v04/airbnb-wishlists.json', import.meta.url), 'utf8'));
  if (airbnbResearch.schema !== 'wishlist_reference_v04'
    || !Array.isArray(airbnbResearch.items) || airbnbResearch.items.length !== 42
    || new Set(airbnbResearch.items.map(item => item.id)).size !== airbnbResearch.items.length
    || airbnbResearch.items.some(item =>
      !citiesWithoutAssumptions(item, destinations)
      || item.point !== null || item.address !== null || item.selected !== false || item.booked !== false
      || !/^https:\/\/www\.airbnb\.de\/rooms\/\d+$/.test(item.website)
      || item.sampleQuote?.adults !== 3
      || (item.sampleQuote?.totalCents !== null &&
        (!Number.isSafeInteger(item.sampleQuote?.totalCents) || item.sampleQuote.totalCents < 0))))
    throw new Error('Airbnb-Wunschlistendaten sind unvollständig oder unplausibel.');
  const railReferenceV04 = JSON.parse(await readFile(
    new URL('../data/research-v04/rail-reference.json', import.meta.url), 'utf8'));
  if (railReferenceV04.schema !== 'rail_reference_v04'
    || railReferenceV04.corridors.length !== 12 || railReferenceV04.rules.length !== 3
    || railReferenceV04.corridors.some(x =>
      !destinations.some(city => city.id === x.from)
      || !destinations.some(city => city.id === x.to)
      || x.timetable2027Verified !== false || x.exactFareCents !== null
      || x.departureLocal !== null || x.arrivalLocal !== null))
    throw new Error('Bahn-Referenz enthält unbestätigte oder widersprüchliche Live-Daten.');
  const uniqueFoodIds = new Set(newFoodResearch.items.map(p => p.id));
  if (uniqueFoodIds.size !== newFoodResearch.items.length
    || newFoodResearch.items.some(p => !destinations.some(city => city.id === p.city)
      || p.point != null || p.price != null || !p.address || !p.menuNote || !p.observedOn)
    || officialActivityEvidence.entries.some(p => !/^https:\/\//.test(p.url) || !p.city || !p.match))
    throw new Error('Ungültiges Recherche-v0.3-Datenpaket.');
  const officialMatch = item => item.category === 'food' || item.category === 'shop' ? null
    : officialActivityEvidence.entries.find(record =>
      record.city === item.city && new RegExp(record.match, 'i').test(item.name));
  const addOfficial = item => {
    const info = officialMatch(item);
    return !info ? item : { ...item, officialEvidence: info,
      openingHoursNote: info.hours, duration: item.duration ?? info.durationMinutes,
      source: [...new Set([...(item.source ?? []), 'official-v03:' + info.id])] };
  };
  const [coverageArchive, daysArchive] = await Promise.all([
    readFile(new URL('../data/research-v02/city-coverage-v02.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../data/research-v02/day-suggestions-v02.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  if (coverageArchive.rows.length !== 21 || daysArchive.rows.length !== 14 ||
    daysArchive.is_active_itinerary !== false ||
    daysArchive.rows.some(row => row[0] < '2027-09-01' || row[0] > '2027-09-14'
      || !research.destinations.some(city => city.id === row[1])
      || [...row[3], ...row[4]].some(id => !research.activities_comparison_catalog.some(activity => activity.id === id)))) {
    throw new Error('Die älteren Stadt- und Tagespakete widersprechen den aktuellen Reisequellen.');
  }
  const providerSearch = JSON.parse(await readFile(
    new URL('../data/provider-checks/booking-barcelona-20261112.json', import.meta.url), 'utf8'));
  if (providerSearch.search_scope.adults !== 3
    || providerSearch.items.some(offer =>
      !Number.isSafeInteger(offer.total_eur_cents) || offer.total_eur_cents < 0
      || offer.checkout_confirmed !== false || offer.selected !== false
      || !/^https:\/\/www\.booking\.com\//.test(offer.url))) {
    throw new Error('Anbieter-Suchreferenzen ohne bestätigten Checkout müssen unverändert bleiben.');
  }
  const cities = Object.fromEntries(destinations.map(city => [city.id, { ...city, point: point(city.latitude_approx, city.longitude_approx) }]));
  const researchActivityMap = new Map(research.activities_comparison_catalog.map(item => [item.id, item]));
  const groupRank = new Map(research.group_activity_ranking.map(row => [row.activity_id, row]));
  const researchTransport = new Map(research.transport_research_queue.map(row => [row.original_segment_id, row]));
  const snapshots = await Promise.all(trips.map(async trip => {
    try { return await file('tripsy-' + trip.external_trip_id); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return seedSnapshot(trip, { transport, activities, accommodations, cities });
    }
  }));
  const fareMap = Object.fromEntries(research.fares.map(fare => [fare.id, fare]));
  const output = trips.map((trip, index) => {
    const snapshot = snapshots[index];
    const allowed = [...new Set(trip.ordered_destination_ids)];
    const zone = snapshot.timezone;
    const stayByCity = {};
    for (const h of accommodations.filter(h => h.trip_id === trip.id && h.origin === 'imported')) {
      stayByCity[h.destination_id] = { from: h.check_in_date, to: h.check_out_date };
    }
    const cityOnDate = date => Object.keys(stayByCity).find(id => date >= stayByCity[id].from && date <= stayByCity[id].to);
    const locate = (item, date) => cityName(item.name, allowed) ?? cityName(item.address, allowed)
      ?? cityOnDate(date) ?? allowed[0];
    const legs = snapshot.resources.transportations.items.map(raw => {
      const seed = transport.find(t => String(t.external_id) === String(raw.id) && t.trip_id === trip.id);
      const city = raw.seedDepartureCity ?? cityName(raw.departure_description, allowed);
      const toCity = raw.seedArrivalCity ?? cityName(raw.arrival_description, allowed);
      const mode = raw.transportation_type;
      const departure = raw.departure_description || seed?.from || 'Abfahrt offen';
      const arrival = raw.arrival_description || seed?.to || 'Ankunft offen';
      const dep = stationPoint(point(raw.departure_latitude, raw.departure_longitude), departure, raw.departure_address, city, cities, mode);
      const arr = stationPoint(point(raw.arrival_latitude, raw.arrival_longitude), arrival, raw.arrival_address, toCity, cities, mode);
      const tariff = fareMap[seed?.reservation_tariff_id];
      const rawDetail = raw.description ?? raw.notes ?? seed?.notes;
      const wrongRouteNote = trip.id === 'interrail_classic' && [3842729, 3842730, 3842731].includes(Number(raw.id))
        && /Kandersteg|Lötschberg|Appenzell/i.test(rawDetail ?? '');
      return {
        ...pickedFields(raw), id: 'tripsy:transport:' + raw.id, trip: trip.id, kind: 'transport', mode, city, toCity,
        category: mode === 'train' ? 'train' : 'transit', name: departure + ' → ' + arrival, departure, arrival,
        zone: raw.departure_timezone ?? cities[city]?.timezone ?? zone,
        endZone: raw.arrival_timezone ?? cities[toCity]?.timezone ?? zone,
        start: raw.departure_at, end: raw.arrival_at, selected: true, point: dep.point, toPoint: arr.point,
        positionIssue: dep.positionIssue ?? arr.positionIssue, address: dep.address, arrivalAddress: arr.address,
        operator: raw.company ?? seed?.operator, number: raw.transport_number, website: raw.website ?? raw.provider_url,
        via: seed?.via, passUse: seed?.interrail_travel_day_plan ?? mode === 'train', price: null,
        reservation: tariff ? price(tariff.amount, tariff.currency, 'person', 'Tarifreferenz ' + tariff.tariff_year) : null,
        source: [raw.fromSeed ? 'research-seed-fallback' : 'tripsy-refresh', ...dep.sources, ...arr.sources, ...(tariff?.source_ids ?? [])],
        detail: wrongRouteNote ? 'Umstiege und Zugwahl für 2027 sind offen. Der importierte Zusatztext beschreibt eine andere Route.' : rawDetail,
        importConflict: wrongRouteNote ? 'Der Tripsy-Zusatztext nennt Schweizer Zwischenziele. Er bleibt in der unveränderten Quellkopie erhalten.' : null,
        researchTask: seed ? researchTransport.get(seed.id) ?? null : null,
        verification: raw.fromSeed ? 'Historischer Planwert · 2027 nicht bestätigt' : 'Fahrplanentwurf',
      };
    });
    flagDuplicates(legs, item => item.start && item.end ? [item.departure, item.arrival, item.start, item.end, item.mode].join('|') : null);
    const planned = snapshot.resources.activities.items.map(raw => {
      const localZone = raw.timezone ?? zone;
      const date = localParts(raw.starts_at, localZone).date;
      const city = raw.seedDestinationId ?? locate(raw, date);
      const facts = factsFor(city, raw.name);
      const isOptional = optional.test(raw.name ?? '');
      const coords = checkedPoint(point(raw.latitude, raw.longitude), city, cities);
      const displayFacts = italyPlaces[city] && coords.point && facts?.point
        ? { tags: facts.tags, addedSources: facts.addedSources }
        : facts;
      const positionIssue = coords.positionIssue && displayFacts?.point
        ? 'Abweichende Tripsy-Adresse oder Koordinate. Die Karte verwendet einen geprüften Orientierungspunkt.'
        : coords.positionIssue;
      return {
        ...pickedFields(raw), id: 'tripsy:activity:' + raw.id, trip: trip.id, city, kind: 'activity',
        zone: localZone, category: /restaurant|foodMarket|cafe/.test(raw.activity_type) ? 'food' : 'activity',
        name: String(raw.name ?? 'Aktivität').replace(/^[^·]+ · /, ''), tags: [raw.activity_type],
        date, start: raw.all_day ? null : raw.starts_at, originalStart: raw.starts_at,
        selected: raw.fromSeed ? raw.seedSelected && !facts?.requiresKitchen : !isOptional && !facts?.requiresKitchen, originalName: raw.name,
        ...coords, website: raw.website, ...displayFacts, positionIssue,
        address: displayFacts?.address ?? (coords.positionIssue ? null : raw.address),
        price: null, source: [raw.fromSeed ? 'research-seed-fallback' : 'tripsy-refresh', ...(displayFacts?.addedSources ?? [])],
      };
    });
    flagDuplicates(planned, item => item.originalStart ? [item.originalName, item.originalStart, item.point].join('|') : null);
    const hotels = snapshot.resources.hostings.items.map(raw => {
      const localZone = raw.timezone ?? zone;
      const from = raw.seedFrom ?? localParts(raw.starts_at, localZone).date;
      const to = raw.seedTo ?? localParts(raw.ends_at, localZone).date;
      const city = raw.seedDestinationId ?? locate(raw, from);
      const seed = accommodations.find(h => h.trip_id === trip.id && h.destination_id === city && h.origin === 'imported');
      const facts = lodgingFacts(raw.name);
      if (!stayByCity[city]) stayByCity[city] = { from, to };
      return {
        ...pickedFields(raw), id: 'tripsy:lodging:' + raw.id, trip: trip.id, city, kind: 'lodging', category: 'lodging',
        zone: localZone, name: seed?.name ?? raw.name, originalName: raw.name, stayFrom: from, stayTo: to,
        ...checkedPoint(point(raw.latitude, raw.longitude), city, cities),
        room: raw.room_type, website: raw.website ?? seed?.url,
        price: price(seed?.historic_or_plan_total ?? raw.price, seed?.historic_or_plan_currency ?? raw.currency,
          'group', 'Historischer Planwert · Gebühren offen', trip.travellers),
        booking: 'ungebucht', ...facts, source: [...new Set([raw.fromSeed ? 'research-seed-fallback' : 'tripsy-refresh', ...(seed?.source_ids ?? []), ...(facts.addedSources ?? [])])],
      };
    });
    const options = activities.filter(a => !a.original_itinerary_item && allowed.includes(a.destination_id) && (!a.trip_id || a.trip_id === trip.id))
      .filter(a => !a.tags.includes('transport')).map(a => catalogActivity(a, fareMap, cities, trip));
    // The new comparison catalogue includes all 73 legacy research entries. Enrich
    // those by stable ID instead of importing them a second time.
    const existingActivityIds = new Set(options.map(item => item.id));
    for (const entry of research.activities_comparison_catalog.filter(item =>
      !item.original_itinerary_item && allowed.includes(item.destination_id)
      && (!item.trip_id || item.trip_id === trip.id))) {
      const id = 'research:' + entry.id;
      if (existingActivityIds.has(id)) continue;
      const candidate = catalogActivity(entry, fareMap, cities, trip);
      candidate.selected = false;
      candidate.origin = 'Recherche v0.2 · Alternative';
      candidate.verification = entry.verification_status ?? 'ungeprüft';
      candidate.priorityFit = entry.priority_fit;
      options.push(addOfficial(candidate));
      existingActivityIds.add(id);
    }
    if (trip.variant_group === 'interrail_2027' && trip.travellers === 3) {
      for (const item of options) {
        const key = item.id.startsWith('research:') ? item.id.slice('research:'.length) : null;
        const ranking = groupRank.get(key);
        const record = researchActivityMap.get(key);
        if (!ranking) continue;
        item.preference = {
          score: ranking.group_score_0_100,
          individual: ranking.individual_scores_0_5,
          topics: ranking.matched_topics,
          confidence: ranking.interest_match_confidence,
          disagreement: ranking.group_low_interest_disagreement,
        };
        item.priorityFit = record?.priority_fit ?? item.priorityFit;
        item.source = [...new Set([...(item.source ?? []), ...(record?.source_ids ?? [])])];
      }
    }
    const researchedHotels = accommodations.filter(h => h.origin === 'researched' && allowed.includes(h.destination_id))
      .map(h => housingFromSeed(h, trip, cities, stayByCity[h.destination_id]));
    // Every price snapshot belongs to a particular party size, travel window and
    // route variant. An August or four-person trip must never inherit a September
    // quote for three persons.
    for (const quote of research.accommodation_market_quotes) {
      if (!allowed.includes(quote.destination_id) || !scopedQuote(quote, trip, stayByCity[quote.destination_id])) continue;
      researchedHotels.push(quoteCandidate(quote, trip, cities[quote.destination_id], research.accommodation_comparison_catalog));
    }
    const barcelonaStay = stayByCity.barcelona;
    if (allowed.includes('barcelona') && trip.travellers === providerSearch.search_scope.adults
      && barcelonaStay?.from === providerSearch.search_scope.from
      && barcelonaStay?.to === providerSearch.search_scope.to) {
      for (const offer of providerSearch.items) {
        researchedHotels.push({
          id: 'provider:booking:' + offer.id + ':20261112',
          trip: trip.id, city: 'barcelona', kind: 'lodging', category: 'lodging',
          name: offer.name, zone: 'Europe/Madrid', selected: false, booked: false,
          booking: 'ungebucht', payment: 'open',
          stayFrom: barcelonaStay.from, stayTo: barcelonaStay.to, start: null, end: null,
          point: offer.coordinates_provider, address: null,
          positionIssue: 'Standort aus der Anbieter-Suche; Hotel-Eingang und Fußweg nicht unabhängig geprüft.',
          price: { cents: offer.total_eur_cents, currency: 'EUR', scope: 'group',
            party: trip.travellers, label: 'Booking-Suchergebnis vom ' + providerSearch.observed_on
              + ' · keine Zimmer-/Steuer-/Checkoutgarantie' },
          detail: offer.general_room_information + ' Anzeige für drei Erwachsene/ein Zimmer. Zimmeroption und Angebotspreis sind noch nicht als zusammengehöriges Checkoutangebot bestätigt.',
          room: null, kitchen: null, fees: null, cancellation: null, website: offer.url,
          verification: 'Anbietersuche · 2027 · Checkout ungeprüft', origin: 'Booking.com · ergänzende Suchbeobachtung',
          source: ['booking-barcelona-20261112'], quote: {
            id: 'provider-refreshed:' + offer.id,
            observedOn: providerSearch.observed_on, nights: 3,
            checkoutConfirmed: false, roomConfirmed: false, taxesConfirmed: false,
            beds: null, location: offer.district,
            sourceId: 'booking-barcelona-20261112', originalPriceCents: offer.total_eur_cents,
          },
        });
      }
    }
    for (const option of italyLodgings.filter(h => allowed.includes(h.city))) {
      const stay = stayByCity[option.city];
      researchedHotels.push({
        ...option, id: 'research:' + option.id, trip: trip.id, kind: 'lodging', category: 'lodging',
        zone: cities[option.city].timezone, stayFrom: stay?.from, stayTo: stay?.to,
        start: null, end: null, selected: false, price: null, origin: 'neu recherchiert', verification: 'Anbieterbeschreibung',
      });
    }
    // Private wishlist snapshots are independent comparison candidates, never bookings.
    // Their observed search price is NOT assigned to item.price: the itinerary stay dates
    // and even the party size can differ from the Airbnb search.
    for (const ref of airbnbResearch.items.filter(ref => allowed.includes(ref.city))) {
      const observed = ref.sampleQuote;
      const sample = observed.totalCents == null ? 'kein Beispielpreis sichtbar'
        : (observed.totalCents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
          + ' Gesamtbetrag für ' + observed.adults + ' Gäste';
      const period = observed.from && observed.to
        ? ' · Suchzeitraum ' + observed.from + ' bis ' + observed.to
        : ' · Suchzeitraum nicht verlässlich aus der Liste ausgelesen';
      const location = ref.locality ?? 'genauer Wohnort ungeprüft';
      researchedHotels.push({
        id: 'wishlist:' + ref.id, trip: trip.id, city: ref.city,
        kind: 'lodging', category: 'lodging', zone: cities[ref.city].timezone,
        name: 'Airbnb · ' + ref.name, selected: false, booked: false,
        booking: 'ungebucht', payment: 'open', origin: 'Airbnb-Wunschliste (privat)',
        stayFrom: stayByCity[ref.city]?.from ?? null,
        stayTo: stayByCity[ref.city]?.to ?? null,
        start: null, end: null, point: null, address: null,
        positionIssue: 'Nur Ort/Umgebung bekannt; kein geprüfter Unterkunfts-Pin.',
        price: null,
        room: ref.bedsDisplayed == null ? 'Bettaufteilung offen'
          : ref.bedsDisplayed + ' Betten in Wunschlistenkarte angezeigt; Belegung nicht bestätigt',
        kitchen: null, fees: null, cancellation: null, website: ref.website,
        detail: location + ' · Airbnb-Referenz ' + sample + period
          + '. Preis gilt nicht automatisch für die Reisedaten; Gebühren, Mindestaufenthalt, Stornierung, Betten und Küche prüfen.'
          + (ref.locationWarning ? ' ' + ref.locationWarning : '')
          + (observed.available ? '' : ' Für den gewählten Suchzeitraum kein Angebotspreis verfügbar.'),
        verification: 'Wunschlistenauszug 13.11.2026 · NICHT gebucht · Endpreis offen',
        source: ['wishlist-v04:' + ref.providerId],
        quote: { observedOn: observed.observedOn, location: location,
          sampleTotalCents: observed.totalCents, sampleAdults: observed.adults,
          sampleFrom: observed.from, sampleTo: observed.to,
          sampleAvailability: observed.available,
          checkoutConfirmed: false, roomConfirmed: false, taxesConfirmed: false },
      });
    }
    for (const place of newFoodResearch.items.filter(place => allowed.includes(place.city))) {
      const nameKey = clean(place.name);
      if (options.some(existing => existing.city === place.city && clean(existing.name) === nameKey)) continue;
      options.push({
        id: 'local:' + place.id, trip: trip.id, city: place.city,
        kind: 'activity', category: place.category, zone: cities[place.city]?.timezone ?? zone,
        name: place.name, tags: place.tags, detail: place.detail, menuNote: place.menuNote,
        address: place.address, point: null, selected: false, start: null, end: null,
        openingHoursNote: place.openingHoursNote, estimatedCostNote: place.priceReferenceNote,
        source: [place.sourceId], website: place.website, price: null,
        origin: 'Öffentliche Gewerbe-/Kartensuche vom 13.11.2026',
        verification: place.verification, sourceDate: place.observedOn,
      });
    }
    // Additional official-museum alternative has no original Tripsy counterpart.
    if (allowed.includes('paris') && !options.some(item => /orsay/i.test(item.name))) {
      options.push(addOfficial({
        id: 'official:orsay', trip: trip.id, city: 'paris', kind: 'activity',
        category: 'activity', name: 'Musée d’Orsay', tags: ['Museum','Kunst','Innen'],
        zone: cities.paris.timezone, point: null, start: null, selected: false,
        price: null, source: ['official-v03:orsay'],
        detail: 'Impressionistische Kunst im ehemaligen Bahnhof am Seineufer.',
        verification: 'Offizielle Tarif-/Öffnungsregeln; Eintritt für EWR unter 26 nach Berechtigung',
      }));
    }
    for (const item of [...options, ...planned]) {
      const info = officialMatch(item);
      if (!info) continue;
      Object.assign(item, addOfficial(item));
    }
    if (allowed.includes('barcelona')) {
      for (const place of barcelonaFoodPlaces) options.push({
        ...place, id: 'local:' + place.id, trip: trip.id, city: 'barcelona', kind: 'activity', category: 'food',
        zone: 'Europe/Madrid', start: null, end: null, selected: false,
        origin: 'neu recherchiert', verification: 'Anbieterbeschreibung',
      });
    }
    // Dates from the original are used only to establish a default city. All coexisting cities remain selectable.
    const arrivalByDay = {};
    for (const leg of legs.filter(l => l.toCity && !l.duplicateOf).sort((a, b) => String(a.end).localeCompare(String(b.end)))) {
      const date = localParts(leg.end, leg.endZone).date;
      if (date) arrivalByDay[date] = leg.toCity;
    }
    return {
      id: trip.id, title: trip.title, from: trip.start_date, to: trip.end_date, travellers: trip.travellers, zone,
      route: trip.ordered_destination_ids, externalId: trip.external_trip_id, group: trip.variant_group,
      description: snapshot.description, remarks: trip.remarks, importedOn: snapshot.imported_on,
      dataMode: snapshot.seedFallback ? 'research_seed_fallback' : 'tripsy_snapshot',
      importCounts: Object.fromEntries(Object.entries(snapshot.resources).map(([k, v]) => [k, v.count])),
      referenceExpenses: snapshot.resources.expenses.items,
      budgetReference: budgets.find(b => b.trip_id === trip.id),
      items: [...legs, ...planned, ...hotels, ...options, ...researchedHotels], stayByCity, arrivalByDay,
      notes: research.data_quality.filter(q => q.trip_id === 'all' || q.trip_id === trip.id),
    };
  });
  return { trips: output, cities, fares: fareMap, mealPlans,
    research: {
      version: research.import_rules.version,
      observedOn: '2026-11-12',
      groupPreferences: research.group_preferences,
      cityCoverage: Object.fromEntries(coverageArchive.rows.map(([id, activityCount, lodgingCount, quoteCount, newActivities]) =>
        [id, { activityCount, lodgingCount, quoteCount, newActivities,
          verified2027Timetable: false, confirmedHotelCheckout: false, verifiedTransitItineraries: false }])),
      daySuggestions: daysArchive.rows.map(([date, city, theme, anchors, alternatives, note]) => ({
        id: 'day:' + date, date, city, theme, note,
        anchors: anchors.map(id => ({id, name: researchActivityMap.get(id)?.name ?? id,
          candidateId: researchActivityMap.get(id)?.original_itinerary_item ? null : 'research:' + id})),
        alternatives: alternatives.map(id => ({id, name: researchActivityMap.get(id)?.name ?? id,
          candidateId: researchActivityMap.get(id)?.original_itinerary_item ? null : 'research:' + id})),
        isActive: false,
      })),
      transportQueue: research.transport_research_queue,
      transportCandidates: research.transport_comparison_candidates,
      budgetScenarios: research.budget_scenarios,
      quality: research.data_quality,
      railReferenceV04,
      airbnbWishlistResearchV04: airbnbResearch.items,
      foodVenueResearchV03: newFoodResearch.items,
      activityEvidenceV03: officialActivityEvidence.entries,
      counts: {
        railReferenceCorridorsV04: railReferenceV04.corridors.length,
        airbnbWishlistAddsV04: airbnbResearch.items.length,
        foodVenueAddsV03: newFoodResearch.items.length,
        officialActivityRefsV03: officialActivityEvidence.entries.length,
        activityCandidates: research.activities_comparison_catalog.length,
        addedActivities: research.activities_comparison_catalog.filter(a => !activities.some(old => old.id === a.id)).length,
        lodgingCandidates: research.accommodation_comparison_catalog.length,
        accommodationSearchQuotes: research.accommodation_market_quotes.length,
        newBarcelonaObservations: providerSearch.items.length,
        transportLegs: research.transport.length,
        fares: research.fares.length,
        sources: research.sources.length,
        issues: research.data_quality.length,
      },
    },
    sources: Object.fromEntries([...sources, ...research.sources,
      ...railReferenceV04.rules.map(rule => ({
        id: 'rail-rule-v04:' + rule.id, publisher: 'Interrail · offizielle Regeln',
        url: rule.url, accessed_on: railReferenceV04.observed_on, validity: rule.validity,
      })),
      ...airbnbResearch.items.map(ref => ({
        id: 'wishlist-v04:' + ref.providerId,
        publisher: 'Airbnb-Wunschliste · ' + ref.name,
        url: ref.website, accessed_on: airbnbResearch.observed_on,
        validity: 'historic_wishlist_display_price_not_booked_or_checkout_verified',
      })),
      ...newFoodResearch.items.map(place => ({
        id: place.sourceId,
        publisher: 'Lokale Kartensuche vom 13.11.2026 · ' + place.name,
        url: place.website,
        accessed_on: place.observedOn,
        validity: 'business_listing_snapshot_address_and_hours_not_confirmed_for_2027',
      })),
      ...officialActivityEvidence.entries.map(info => ({
        id: 'official-v03:' + info.id, publisher: 'Offizieller Betreiber · ' + info.title,
        url: info.url, accessed_on: officialActivityEvidence.observed_on,
        validity: info.pricePeriod,
      })), {
      id: 'booking-barcelona-20261112', publisher: 'Booking.com · Suchergebnis vom 12.11.2026',
      url: 'https://www.booking.com/city/es/barcelona.html',
      accessed_on: providerSearch.observed_on, validity: 'booking_search_observation',
      is_live_availability: false, independent_price_quote_for_2027: false,
    }, ...extraSources, ...italySources, ...rivieraAlpsSources, ...mealSources].map(s => [s.id, s])) };
}
