export const categories = {
  lodging: 'Unterkunft', train: 'Bahn & Transfers', reservation: 'Reservierungen',
  pass: 'Interrail-Pässe', transit: 'Nahverkehr', food: 'Verpflegung',
  activity: 'Aktivitäten', reserve: 'Reserve', other: 'Sonstiges',
};

export const money = (cents, currency = 'EUR') => cents == null ? 'Offen'
  : new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100);

export function minor(value) {
  if (value === '' || value == null) return null;
  const match = String(value).trim().replace(',', '.').match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error('Betrag mit höchstens zwei Nachkommastellen eingeben.');
  const result = Number(match[2]) * 100 + Number((match[3] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result > 100_000_000) throw new Error('Betrag liegt außerhalb des unterstützten Bereichs.');
  return match[1] === '-' ? -result : result;
}

export function allocate(total, weights) {
  if (!Number.isSafeInteger(total) || !weights.length || weights.some(w => !Number.isSafeInteger(w) || w < 0)) {
    throw new Error('Ungültige Kostenaufteilung.');
  }
  const sum = weights.reduce((a, b) => a + BigInt(b), 0n);
  if (!sum) throw new Error('Mindestens ein Anteil muss größer als null sein.');
  const amount = BigInt(Math.abs(total));
  const shares = weights.map((w, index) => {
    const product = amount * BigInt(w);
    return { index, cents: Number(product / sum), rest: product % sum };
  });
  let left = Math.abs(total) - shares.reduce((a, b) => a + b.cents, 0);
  for (const share of shares.toSorted((a, b) => a.rest === b.rest ? a.index - b.index : a.rest > b.rest ? -1 : 1)) {
    if (left-- <= 0) break;
    share.cents++;
  }
  return shares.map(s => s.cents * Math.sign(total));
}

export function fxAmount(cents, quote) {
  if (!quote || !/^\d+(\.\d{1,8})?$/.test(String(quote.rate)) || !/^\d{4}-\d{2}-\d{2}$/.test(quote.date ?? '')) return null;
  const [whole, fraction = ''] = String(quote.rate).split('.');
  const den = 10n ** BigInt(fraction.length);
  const num = BigInt(whole + fraction);
  if (!num || num > 1000n * den) return null;
  return Math.sign(cents) * Number((BigInt(Math.abs(cents)) * num * 2n + den) / (2n * den));
}

export function groupPrice(price, count) {
  if (!price || !Number.isSafeInteger(price.cents)) return null;
  if (price.scope === 'group' && price.party && price.party !== count) return null;
  return price.cents * (price.scope === 'person' ? count : 1);
}

export function priceForParty(item, people) {
  const tariff = item.price?.ageTariff;
  if (!tariff) return item.price;
  const individual = people.map(person => person.age == null ? item.price.cents
    : person.age < tariff.freeUnder ? 0 : person.age < (tariff.childUnder ?? tariff.freeUnder) ? tariff.childCents
      : person.age < tariff.reducedUnder ? tariff.reducedCents : item.price.cents);
  return { ...item.price, cents: individual.reduce((a, b) => a + b, 0), scope: 'group', party: people.length, individual };
}

export function mealEstimate(option, count) {
  const products = option.products.map(product => {
    const quantity = product.pack ? Math.ceil(product.need * count / product.pack) : Math.ceil(product.forThree * count / 3);
    return { ...product, quantity, total: product.cents * quantity };
  });
  const base = products.reduce((sum, product) => sum + product.total, 0);
  const terrace = option.terracePercent == null ? null : Math.round(base * (100 + option.terracePercent) / 100);
  return { products, base, terrace };
}


// Informational only: a missing check never implies a real booking or fare was confirmed.
export function planReadiness(trip, selectedItems, budget) {
  const overnightStays = Object.entries(trip.stayByCity ?? {});
  const missingStays = overnightStays.filter(([city, required]) =>
    !selectedItems.some(item => item.kind === 'lodging' && item.city === city
      && item.stayFrom <= required.from && item.stayTo >= required.to)
  ).map(([city]) => city);
  const trainLegs = selectedItems.filter(item => item.kind === 'transport' && item.mode === 'train');
  const uncheckedTrains = trainLegs.filter(item =>
    !['Fahrplan bestätigt', 'Fahrplan geprüft'].includes(item.verification)
  ).length;
  return {
    missingStays,
    uncheckedTrains,
    unknownPrices: budget.unknown,
    missingOriginalSources: trip.dataMode === 'research_seed_fallback',
  };
}

export function groceryBasket(meals, peopleCount, overrides = {}) {
  if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 20) throw new Error('Ungültige Gruppengröße für den Warenkorb.');
  const rows = new Map();
  for (const meal of meals) {
    if (!meal.requiresKitchen || !Array.isArray(meal.basketProducts)) continue;
    for (const product of meal.basketProducts) {
      if (!Number.isSafeInteger(product.pack) || product.pack < 1
        || !Number.isSafeInteger(product.need) || product.need < 1
        || !Number.isSafeInteger(product.cents) || product.cents < 0
        || !/^[a-z0-9_-]{1,120}$/i.test(product.source ?? '')) {
        throw new Error('Ungültige Zutatenreferenz im geplanten Warenkorb.');
      }
      const key = [meal.city, product.source, product.pack, product.cents].join(':');
      if (!rows.has(key)) rows.set(key, {
        key, city: meal.city, source: product.source, name: product.name,
        pack: product.pack, referenceCents: product.cents, required: 0,
      });
      rows.get(key).required += product.need * peopleCount;
    }
  }
  return [...rows.values()].map(row => {
    const minPacks = Math.ceil(row.required / row.pack);
    const override = overrides?.[row.key];
    // A group-size increase can require more packs than an earlier manual override.
    // Preserve the user's price but never budget insufficient package quantities.
    const packs = override?.packs == null ? minPacks : Math.max(minPacks, override.packs);
    const unitCents = override?.unitCents ?? row.referenceCents;
    if (!Number.isSafeInteger(packs) || packs < minPacks || packs > 100
      || !Number.isSafeInteger(unitCents) || unitCents < 0 || unitCents > 100000) {
      throw new Error('Ungültige Mengen- oder Preisänderung im Warenkorb.');
    }
    return { ...row, minPacks, packs, unitCents, total: packs * unitCents,
      modified: Boolean(override), adjustedForGroup: Boolean(override && packs > override.packs) };
  });
}

export const mealDate = item => localParts(item.start, item.zone).date ?? item.date;

export function activeItems(trip, state, imported = []) {
  const sources = [...trip.items, ...imported.filter(item => item.trip === trip.id), ...state.manual];
  return sources.flatMap(source => {
    if (source.duplicateOf) return [];
    const edit = state.edits[source.id] ?? {};
    if (edit.removed || !(edit.selected ?? source.selected)) return [];
    return [{ ...source, ...edit, id: source.id }];
  });
}

export function calculateBudget(items, state) {
  const count = state.people.length;
  const balances = Array.from({ length: count }, () => ({ share: 0, paidShare: 0, paid: 0 }));
  const passMode = state.pass?.budgetMode === 'interrail';
  const replacedMealCosts = new Set(state.expenses.map(expense => expense.forItem).filter(Boolean));
  const plannedCooking = items.filter(i => i.requiresKitchen && i.mealSlot && Array.isArray(i.basketProducts)
    && !replacedMealCosts.has(i.id));
  const pooledIds = new Set(plannedCooking.map(i => i.id));
  const baskets = groceryBasket(plannedCooking, count, state.groceryOverrides ?? {});
  const railCosts = items.flatMap(i => {
    if (i.kind === 'note' || replacedMealCosts.has(i.id) || pooledIds.has(i.id)) return [];
    if (!passMode || i.kind !== 'transport' || i.mode !== 'train' || i.passUse === false) return [i];
    return [{ ...i, id: 'reservation:' + i.id, name: 'Reservierung · ' + i.name, category: 'reservation',
      price: state.pass.includeReferences ? i.reservation : null, payment: 'open' }];
  });
  for (const city of new Set(baskets.map(row => row.city))) {
    const basketTotal = baskets.filter(row => row.city === city).reduce((sum, row) => sum + row.total, 0);
    const firstMeal = plannedCooking.filter(item => item.city === city)
      .toSorted((a, b) => (mealDate(a) ?? '').localeCompare(mealDate(b) ?? ''))[0];
    railCosts.push({
      id: 'grocery-budget:' + city, name: 'Gruppeneinkauf · ' + city, city,
      date: firstMeal ? mealDate(firstMeal) : null, category: 'food',
      price: { cents: basketTotal, currency: 'EUR', scope: 'group',
        label: 'Gemeinsame Packungen aus mehreren Koch-Mahlzeiten · Referenz- oder manuell angepasste Preise' },
      payment: 'open', source: baskets.filter(row => row.city === city).map(row => row.source),
    });
  }
  if (passMode) {
    const cents = state.pass.purchased ? 0 : state.pass.cost;
    railCosts.push({ id: 'pass:interrail', name: 'Interrail-Pass · zusätzlicher Kaufpreis', category: 'pass',
      price: cents == null ? null : { cents, currency: 'EUR', scope: 'person' } });
  }
  const rows = [...railCosts, ...state.expenses].map(item => {
    const price = priceForParty(item, state.people);
    const original = groupPrice(price, count);
    const currency = price?.currency ?? 'EUR';
    const euros = original == null ? null : currency === 'EUR' ? original : fxAmount(original, item.fx);
    let split = null;
    if (euros != null) {
      const sameSize = item.split?.values?.length === count;
      const fixed = sameSize && item.split.mode === 'fixed' && item.split.values.reduce((a, b) => a + b, 0) === Math.abs(euros);
      split = price.individual && currency === 'EUR' ? price.individual
        : fixed ? item.split.values.map(v => v * Math.sign(euros))
        : allocate(euros, sameSize && item.split.mode === 'weights' ? item.split.values : Array(count).fill(1));
      const settled = ['paid', 'refund'].includes(item.payment) && balances[item.payer];
      split.forEach((share, i) => {
        balances[i].share += share;
        if (settled) balances[i].paidShare += share;
      });
      if (settled) balances[item.payer].paid += euros;
    }
    return { ...item, original, euros, currency, split };
  });
  const byCategory = {};
  for (const row of rows) {
    if (row.euros != null) byCategory[row.category ?? 'other'] = (byCategory[row.category ?? 'other'] ?? 0) + row.euros;
  }
  const nets = balances.map(row => row.paid - row.paidShare);
  return {
    rows, byCategory, balances, nets, transfers: settle(nets),
    total: rows.reduce((sum, row) => sum + (row.euros ?? 0), 0),
    paid: balances.reduce((sum, row) => sum + row.paid, 0),
    unknown: rows.filter(row => row.euros == null).length,
  };
}

export function settle(nets) {
  if (nets.reduce((sum, amount) => sum + amount, 0) !== 0) throw new Error('Salden ergeben keine Nullsumme.');
  const remaining = nets.slice();
  const result = [];
  for (let from = 0; from < remaining.length; from++) {
    if (remaining[from] >= 0) continue;
    for (let to = 0; to < remaining.length && remaining[from] < 0; to++) {
      if (remaining[to] <= 0) continue;
      const cents = Math.min(-remaining[from], remaining[to]);
      remaining[from] += cents;
      remaining[to] -= cents;
      result.push({ from, to, cents });
    }
  }
  return result;
}

const dateFormats = new Map();
export function localParts(instant, zone) {
  if (!instant) return { date: null, time: null };
  const date = new Date(instant);
  if (!Number.isFinite(date.valueOf())) return { date: null, time: null };
  if (!dateFormats.has(zone)) {
    dateFormats.set(zone, new Intl.DateTimeFormat('sv-SE', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }));
  }
  const [day, time] = dateFormats.get(zone).format(date).replace(',', '').split(' ');
  return { date: day, time };
}

export function utcFromLocal(date, time, zone, preferred) {
  if (!date || !time) return null;
  const wanted = Date.parse(date + 'T' + time + ':00Z');
  if (!Number.isFinite(wanted)) throw new Error('Datum oder Uhrzeit ist ungültig.');
  const options = new Set();
  for (const shift of [-36, 0, 36]) {
    const sample = wanted + shift * 3_600_000;
    const local = localParts(sample, zone);
    const offset = Date.parse(local.date + 'T' + local.time + ':00Z') - sample;
    const candidate = wanted - offset;
    const check = localParts(candidate, zone);
    if (check.date === date && check.time === time) options.add(new Date(candidate).toISOString());
  }
  if (!options.size) throw new Error('Diese Ortszeit existiert wegen der Zeitumstellung nicht.');
  if (options.size > 1) {
    const match = [...options].find(value => Date.parse(value) === Date.parse(preferred));
    if (!match) throw new Error('Diese Ortszeit ist mehrdeutig. Bitte wähle eine eindeutige Uhrzeit.');
    return match;
  }
  return [...options][0];
}

export function dateRange(from, to) {
  if (!from || !to) return [];
  const first = Date.parse(from + 'T12:00:00Z');
  const last = Date.parse(to + 'T12:00:00Z');
  const days = [];
  for (let d = first; d <= last && days.length < 366; d += 86_400_000) days.push(new Date(d).toISOString().slice(0, 10));
  return days;
}

export function interrail(legs, pass) {
  const days = new Set();
  const issues = [];
  for (const leg of legs.filter(l => l.kind === 'transport' && l.mode === 'train' && l.passUse !== false)) {
    const dep = localParts(leg.start, leg.zone).date;
    const arr = localParts(leg.end, leg.endZone ?? leg.zone).date;
    if (!dep || !arr) { issues.push({ id: leg.id, text: 'Reisetag offen: Abfahrt oder Ankunft fehlt.' }); continue; }
    if (dep < pass.from || arr > pass.to) { issues.push({ id: leg.id, text: 'Fahrt liegt außerhalb der Passgültigkeit.' }); continue; }
    days.add(dep);
  }
  return { days: [...days].sort(), remaining: pass.days - days.size, issues };
}

export function dayEntries(items, date, city) {
  const entries = items.flatMap(item => {
    const start = localParts(item.start, item.zone);
    const end = localParts(item.end, item.endZone ?? item.zone);
    if (item.kind === 'transport') {
      return [
        ...((city == null || item.city === city) && start.date === date ? [{ ...item, placeCity: item.city, time: start.time, point: item.point, role: 'Abfahrt', instant: item.start }] : []),
        ...((city == null || item.toCity === city) && end.date === date ? [{ ...item, placeCity: item.toCity, time: end.time, point: item.toPoint, address: item.arrivalAddress,
          role: 'Ankunft', instant: item.end }] : []),
      ];
    }
    if (city != null && item.city !== city) return [];
    if (item.kind === 'lodging') {
      if (date === (start.date ?? item.stayFrom)) return [{ ...item, time: start.time, role: 'Check-in', instant: item.start }];
      if (date === (end.date ?? item.stayTo)) return [{ ...item, time: end.time, role: 'Check-out', instant: item.end }];
      return [];
    }
    return start.date === date || (!start.date && item.date === date)
      ? [{ ...item, time: start.time, instant: item.start }] : [];
  }).sort((a, b) => (a.instant && b.instant ? Date.parse(a.instant) - Date.parse(b.instant)
    : Number(Boolean(b.instant)) - Number(Boolean(a.instant))) || (a.order ?? 0) - (b.order ?? 0));
  const counts = new Map();
  for (const entry of entries) counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
  return entries.map(entry => ({ ...entry, placeCity: entry.kind === 'transport' ? entry.placeCity : entry.city,
    entryKey: counts.get(entry.id) > 1 ? entry.id + ':' + entry.role : entry.id }));
}

export function alpineAccess(from, to) {
  const pair = new Set([from.placeRole, to.placeRole]);
  if (pair.has('oeschi-valley') && pair.has('oeschi-lake')) {
    return { label: from.placeRole === 'oeschi-valley' ? 'Gondel + ca. 30 Min. zu Fuß ab Bergstation'
      : 'Ca. 30 Min. zu Fuß zur Bergstation + Gondel', mode: 'Gondel & Fußweg', source: 'ch-oeschi-walk' };
  }
  if (pair.has('seealp-start') && pair.has('seealp-lake')) {
    return { label: 'Bergweg · Rundtour T2, ca. 2 Std. 30 Min.', mode: 'Bergweg', source: 'ch-seealp-loop' };
  }
  const remote = [from, to].find(i => i.placeRole === 'oeschi-lake' || i.placeRole === 'seealp-lake' || i.needsAccess);
  if (remote) return { label: 'Bergzugang und Wegzeit prüfen' };
  return null;
}

export function conflicts(entries, routes, fullDay = entries) {
  const warnings = [];
  const transportAt = (place, role) => entries.find(i => i.kind === 'transport' && i.role === role && i.instant
    && (i.placeCity ?? i.city) === place);
  const valley = fullDay.find(i => i.placeRole === 'oeschi-valley' && i.instant);
  const firstLift = fullDay.find(i => i.placeRole === 'first-lift' && i.instant);
  let latestEnd = -Infinity;
  let latestName;
  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    if (current.requiresKitchen && !current.kitchenReady) warnings.push({ id: current.id, text: 'Für ' + current.name + ' ist der Küchenzugang offen.' });
    if (!current.instant) continue;
    const instant = Date.parse(current.instant);
    const place = current.placeCity ?? current.city;
    const arrival = current.role === 'Check-in' && transportAt(place, 'Ankunft');
    const departure = current.role === 'Check-out' && transportAt(place, 'Abfahrt');
    if (current.kind === 'lodging' && current.role === 'Check-in' && arrival && instant < Date.parse(arrival.instant)) {
      warnings.push({ id: current.id, text: 'Check-in liegt vor der geplanten Ankunft. Gepäck und Check-in-Zeit prüfen.' });
    }
    if (current.kind === 'lodging' && current.role === 'Check-out' && departure && instant > Date.parse(departure.instant)) {
      warnings.push({ id: current.id, text: 'Geplanter Check-out liegt nach der Abfahrt. Frühere Abreise aus der Unterkunft prüfen.' });
    }
    if (instant < latestEnd) warnings.push({ id: current.id, text: 'Termin überschneidet sich mit ' + latestName + '.' });
    if (current.hours && current.time) {
      const [open, close] = current.hours;
      const fits = open <= close ? current.time >= open && current.time < close : current.time >= open || current.time < close;
      if (!fits) warnings.push({ id: current.id, text: 'Beginn außerhalb des hinterlegten Öffnungsfensters.' });
    }
    if (current.weekly && current.instant) {
      const date = localParts(current.instant, current.zone).date;
      const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
      const [open, close] = current.weekly.byDay?.[weekday] ?? current.weekly.hours;
      if (!current.weekly.days.includes(weekday) || current.time < open || current.time >= close) {
        warnings.push({ id: current.id, text: 'Beginn außerhalb der veröffentlichten Regelöffnungszeiten. Reisedatum prüfen.' });
      }
    }
    const day = localParts(current.instant, current.zone).date;
    const window = current.serviceWindow;
    if (window && day >= window.from && day <= window.to && (current.time < window.open || current.time >= window.close)) {
      warnings.push({ id: current.id, text: 'Gondelbetrieb am Reisetag ' + window.open + '–' + window.close + ' Uhr. Geplanten Zustieg prüfen.' });
    }
    if (current.placeRole === 'oeschi-lake' && valley) {
      const opening = valley.serviceWindow;
      const opensAt = opening && day >= opening.from && day <= opening.to
        ? Date.parse(utcFromLocal(day, opening.open, valley.zone)) : -Infinity;
      const transfer = (instant - Math.max(Date.parse(valley.end ?? valley.instant), opensAt)) / 60_000;
      if (transfer <= 30) warnings.push({ id: current.id, text: 'Zu wenig Zeit zur Oeschinensee-Ankunft. Ab Bergstation dauert allein der Fußweg rund 30 Min. Zustieg, Gondelfahrt und Wartezeit kommen hinzu.' });
    }
    if (current.needsAccess && (!firstLift || Date.parse(firstLift.end ?? firstLift.instant) > instant)) {
      warnings.push({ id: current.id, text: current.needsAccess });
    }
    const pointEvent = ['transport', 'lodging'].includes(current.kind);
    const end = pointEvent ? instant : current.end ? Date.parse(current.end)
      : current.duration ? instant + current.duration * 60_000 : null;
    if (end == null) continue;
    if (!pointEvent && end > latestEnd) { latestEnd = end; latestName = current.name; }
    const next = entries[i + 1];
    if (!next?.instant) continue;
    const gap = (Date.parse(next.instant) - end) / 60_000;
    const route = routes[i];
    if (route?.legs?.length) {
      const reachesBoarding = end + route.access.seconds * 1000 <= Date.parse(route.legs[0].departure);
      const arrivesInTime = Date.parse(route.end) + (next.buffer ?? 0) * 60_000 <= Date.parse(next.instant);
      if (!reachesBoarding || !arrivesInTime) warnings.push({ id: next.id, text: 'Die gewählte ÖPNV-Fahrt passt zeitlich nicht zwischen die Termine.' });
    } else if (gap >= 0 && route?.minutes != null && gap < route.minutes + (next.buffer ?? 0)) {
      warnings.push({ id: next.id, text: 'Zeitfenster zu kurz für Weg und Puffer (' + gap + ' Min. verfügbar).' });
    }
  }
  return warnings;
}

export function ticketBreakEven({ single, pass, included, rides, travellers }) {
  if (![single, pass, rides, travellers].every(Number.isSafeInteger) || single <= 0 || pass < 0 || rides < 0 || travellers < 1
    || (included != null && (!Number.isSafeInteger(included) || included <= 0))) return null;
  const comparison = pass + (included == null ? 0 : Math.max(0, rides - included) * single);
  return { singles: single * rides * travellers, comparison: comparison * travellers,
    savings: (single * rides - comparison) * travellers,
    firstSaving: included == null || pass < single * included ? Math.floor(pass / single) + 1 : null };
}
