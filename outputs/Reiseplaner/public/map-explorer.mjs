import { googleMapsDirectionsUrl } from './google-maps.mjs';
// Shared explorer selectors for every variant and city. Only place-level
// coordinates provided by source records are plotted: no city-centre guesses.
export const EXPLORER_GROUPS = Object.freeze({
  lodging: { label: 'Unterkünfte', color: '#2563eb', symbol: 'H' },
  food: { label: 'Restaurants & Cafés', color: '#e97317', symbol: 'R' },
  shop: { label: 'Supermärkte & Einkauf', color: '#d0a10b', symbol: 'S' },
  activity: { label: 'Aktivitäten & Sehenswürdigkeiten', color: '#168458', symbol: 'A' },
  transport: { label: 'Bahnhöfe & Verkehr', color: '#7c4cc6', symbol: 'B' },
});

export function explorerCategory(item) {
  if (item.kind === 'lodging') return 'lodging';
  if (item.kind === 'transport') return 'transport';
  const words = [item.name, item.category, ...(item.tags ?? [])].join(' ').toLocaleLowerCase('de');
  if (/supermarkt|supermerc|carrefour|market|lebensmittel|einkauf|grocery|laden/.test(words)) return 'shop';
  if (item.category === 'food' || /restaurant|tapas|café|cafe|bistro|trattoria|osteria|pizzeria|imbiss|bäckerei|bakery|bar\b|essen|food/.test(words)) return 'food';
  return 'activity';
}

export function validPoint(point) {
  return Array.isArray(point) && point.length === 2
    && Number.isFinite(point[0]) && Number.isFinite(point[1])
    && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180
    && !(point[0] === 0 && point[1] === 0);
}

export function explorerData(items, trip, { city = null, group = 'all', search = '' } = {}) {
  const validCities = new Set(trip.route);
  const norm = text => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('de');
  const needle = norm(search).trim().slice(0, 100);
  const dedup = new Map();
  const entries = items.flatMap(item => {
    const arrivals = item.kind === 'transport' && validCities.has(item.toCity) && validPoint(item.toPoint)
      ? [{ ...item, id: 'arrival:' + item.id, explorerParent: item.id,
        name: 'Ankunft · ' + (item.arrival ?? item.toCity),
        city: item.toCity, point: item.toPoint, address: item.arrivalAddress,
        detail: 'Zielbahnhof / Ankunftspunkt der bestehenden Verbindung ' + item.name
          + '. Fahrplan, Umstiege und Tarif für 2027 gesondert prüfen.',
        price: null, effectivePrice: null, role: 'Ankunft', duplicateOf: null }]
      : [];
    return [item, ...arrivals];
  });
  for (const item of entries) {
    if (!validCities.has(item.city) || item.duplicateOf || item.removed) continue;
    if (!['activity', 'transport', 'lodging'].includes(item.kind)) continue;
    if (city && item.city !== city) continue;
    const category = explorerCategory(item);
    if (group !== 'all' && category !== group) continue;
    const label = [item.name, item.city, item.address, item.detail, ...(item.tags ?? [])].join(' ');
    if (needle && !norm(label).includes(needle)) continue;
    const id = item.entryKey ?? item.id;
    if (!dedup.has(id)) dedup.set(id, { ...item, explorerCategory: category, explorerId: id });
  }
  const sorted = [...dedup.values()].sort((a,b) =>
    Number(Boolean(b.selected)) - Number(Boolean(a.selected))
    || a.city.localeCompare(b.city) || a.name.localeCompare(b.name, 'de'));
  return { placed: sorted.filter(item => validPoint(item.point)),
    unlocated: sorted.filter(item => !validPoint(item.point)), total: sorted.length };
}

export function explorerDetail(item, people = 3) {
  if (!item) return null;
  const group = EXPLORER_GROUPS[explorerCategory(item)];
  const price = item.effectivePrice ?? item.price;
  const money = cents => new Intl.NumberFormat('de-DE', { style: 'currency', currency: price?.currency ?? 'EUR' }).format(cents / 100);
  const amount = price?.cents;
  const priceText = !Number.isSafeInteger(amount) ? 'Preis offen' : price.scope === 'person'
    ? money(amount) + ' je Person · ' + money(amount * people) + ' für ' + people
    : price.scope === 'group' ? money(amount) + ' für die Gruppe' : money(amount) + ' · Bezugsgröße prüfen';
  const hours = item.kind === 'lodging' && (item.checkInTime || item.checkOutTime)
    ? 'Check-in ' + (item.checkInTime ?? 'offen') + ' · Check-out ' + (item.checkOutTime ?? 'offen') + ' · beim Anbieter prüfen'
    : Array.isArray(item.hours) && item.hours.length === 2
    ? item.hours.join('–') + ' Uhr · am Reisetag prüfen'
    : item.weekly?.days?.length && item.weekly?.hours
      ? 'Wochentage ' + item.weekly.days.join(', ') + ': ' + item.weekly.hours.join('–') + ' Uhr · Ausnahmen prüfen'
      : item.openingHoursNote ?? 'Öffnungszeiten am Reisetag nicht bestätigt';
  const extra = [];
  if (item.kind === 'lodging') {
    extra.push('Zimmer: ' + (item.room || 'Belegung / Zimmerart nicht nachgewiesen'));
    extra.push('Küche: ' + (typeof item.kitchen === 'string' ? item.kitchen : 'Ausstattung nicht bestätigt'));
    extra.push('Gebühren: ' + (item.fees === true ? 'laut Quelle eingeschlossen' : 'nicht vollständig bestätigt'));
    extra.push('Stornierung: ' + (item.cancellation === true ? 'laut Quelle möglich, Tarif prüfen' : 'Tarif und Frist offen'));
    extra.push('Frühstück und sonstige Leistungen: nur bei ausdrücklich belegter Quelle enthalten, sonst offen');

    if (item.stayFrom && item.stayTo) extra.push('Aufenthalt: ' + item.stayFrom + ' bis ' + item.stayTo);
    if (item.bathroom != null) extra.push('Privates Bad: ' + (item.bathroom ? 'laut Quelle ja' : 'laut Quelle nein'));
    if (item.quote?.nights && Number.isSafeInteger(amount) && item.price?.scope === 'group')
      extra.push('Rechnerisch pro Person/Nacht: ' + money(Math.round(amount/(people * item.quote.nights)))
        + ' · unverbindlicher Such- oder Planwert');
    if (item.priceValidity) extra.push('Preisgültigkeit: ' + ({
      historical_plan_not_live: 'alter Planwert, kein verifiziertes Angebot 2027',
      date_specific_search_display_only: 'unbestätigter Suchpreis für das gewählte Datum',
      indicative_2026: 'Referenzwert 2026', property_exists_price_unknown: 'Objekt bekannt, Preis offen',
    }[item.priceValidity] ?? item.priceValidity));
  } else if (item.kind === 'activity') {
    if (item.duration) extra.push('Geplante Dauer: ' + item.duration + ' Min.');
    if (item.tags?.length) extra.push('Art: ' + item.tags.join(', '));
    if (item.mealSlot) extra.push('Mahlzeit: ' + item.mealSlot);
    if (item.menuNote) extra.push('Speisen / Speisekarte: ' + item.menuNote);
    if (explorerCategory(item) === 'food' && !item.menuNote)
      extra.push('Speisekarte, Einzelpreise und konkrete Gerichtsauswahl: noch nicht vollständig geprüft');
    if (item.estimatedCostNote != null && amount == null)
      extra.push('Unbestätigte Kostenreferenz: ' + item.estimatedCostNote);
    if (item.eligibilityOrRisk) extra.push('Zu prüfen: ' + item.eligibilityOrRisk);
    if (item.operatorReferenceV07) {
      const info=item.operatorReferenceV07;
      extra.push('Offizieller Quellenabgleich: ' + info.title);
      extra.push('Öffnungs-/Saisonreferenz: ' + info.openingReference);
      extra.push('ÖPNV-Anfahrt: ' + info.localTransitTip);
      extra.push('Preisreferenz: ' + info.priceReference);
      extra.push('Gültigkeit: ' + (info.confirmedSep2027Hours
        ? 'veröffentlichte saisonale Betriebszeit für 2027; wetter- oder betriebsbedingte Änderungen möglich'
        : 'Tarif-/Öffnungsreferenz 2026, September 2027 nicht bestätigt'));
    }
    if (item.officialEvidence) {
      const info=item.officialEvidence;
      extra.push('Betreiberinformation: '+info.description);
      if (info.generalPriceCents != null) extra.push('Offizieller normaler Tarifstand: '+(info.generalPriceCents/100).toFixed(2).replace('.',',')+' EUR pro Person; 2027er Verfügbarkeit separat prüfen');
      if (info.under30Cents != null) extra.push('Ermäßigung unter 30: '+(info.under30Cents/100).toFixed(2).replace('.',',')+' EUR nach Berechtigungsnachweis');
      for (const variant of info.fareVariants??[]) extra.push('Tarifvariante: '+variant.label+' '+(variant.cents/100).toFixed(2).replace('.',',')+' EUR');
      extra.push('Tarifstand: '+info.pricePeriod);
    }
    if (item.minAge) extra.push('Einlass: ab ' + item.minAge + ' Jahren · konkreten Termin prüfen');
  } else {
    extra.push('Betreiber: ' + (item.operator || 'noch nicht bestätigt'));
    extra.push('Fahrplan 2027: ' + (item.verification || 'nicht bestätigt'));
  }
  if (item.locationReferenceV07?.precision === 'city_only_not_a_pin')
    extra.push('Standortstatus: nur die Stadt als theoretische Orientierung bekannt; kein echter POI-Kartenpunkt.');
  else if (item.locationReferenceV07?.precision === 'sourced_area_center')
    extra.push('Standortstatus: Quelle belegt einen Gebiets-/Objektmittelpunkt; nicht zwingend Eingang oder Treffpunkt.');
  return {
    group, priceText, hours, extra, description: item.detail || item.note || 'Ausführliche Tätigkeits- bzw. Angebotsbeschreibung in den vorhandenen Daten nicht belegt.',
    sourceStatus: item.verification || 'Quelle und Aktualität offen',
  };
}

// Exposes only a real foot-route; missing/unsupported routing is not silently
// converted into a straight-line walk, a bus estimate or a zero-euro journey.
export function explorerRouteInput(from, to) {
  if (!from || !to || from.id === to.id || !validPoint(from.point) || !validPoint(to.point))
    return null;
  const earth = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(to.point[0] - from.point[0]);
  const dLon = rad(to.point[1] - from.point[1]);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(from.point[0])) * Math.cos(rad(to.point[0])) * Math.sin(dLon/2)**2;
  const km = earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return { points: [from.point, to.point], km, canWalk: km <= 25, sameCity: from.city === to.city };
}

export function externalTransitUrl(from, to, cities={}) {
  return googleMapsDirectionsUrl(from, to, cities, 'transit');
}

export function externalFootUrl(from, to) {
  if (!validPoint(from?.point) || !validPoint(to?.point)) return null;
  return 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route='
    + encodeURIComponent(from.point.join(',') + ';' + to.point.join(','));
}
