import { categories, groupPrice, localParts, mealDate, mealEstimate, minor, money, utcFromLocal } from './model.mjs';
import { alert, btn, esc, iconBtn, dateLabel, dateText, sourceList, urlLink, cost, unit, timeText, transitPlanners } from './ui.mjs';
import { transitNetworks } from './transit.mjs';
import { placeProfileHtml } from './place-profile.mjs';
import { VERIFICATION_FIELDS, reviewProgress } from './verification.mjs';

const dialog = document.querySelector('#dialog');
const field = (label, control, wide = false) => '<label class="field' + (wide ? ' wide' : '') + '"><span>' + esc(label) + '</span>' + control + '</label>';
const input = (name, value, type = 'text', attr = '') => '<input name="' + name + '" type="' + type + '" value="' + esc(value ?? '') + '" ' + attr + '>';
const select = (name, options, selected) => '<select name="' + name + '">' + options.map(([id, name]) => '<option value="' + esc(id)
  + '"' + (String(selected) === String(id) ? ' selected' : '') + '>' + esc(name) + '</option>').join('') + '</select>';
const check = (name, label, value) => '<label class="field wide"><span><input type="checkbox" name="' + name + '"' + (value ? ' checked' : '') + '> ' + esc(label) + '</span></label>';
const controls = (fields, submit = 'Speichern', more = '') => '<form id="modal-form"><div class="form-grid">' + fields.join('')
  + '</div><div class="form-error" aria-live="polite"></div><div class="dialog-foot">' + more + btn('close', 'Abbrechen') + '<button class="button primary" type="submit">' + esc(submit) + '</button></div></form>';

export function openDialog(title, body, submit) {
  if (dialog.open) dialog.close();
  dialog.innerHTML = '<div class="dialog-head"><h2 id="dialog-title">' + esc(title) + '</h2>' + iconBtn('close', 'Dialog schließen', 'close')
    + '</div><div class="dialog-body">' + body + '</div>';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.showModal();
  const form = dialog.querySelector('#modal-form');
  if (form && submit) form.addEventListener('submit', async event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    const button = form.querySelector('button[type=submit]');
    error.textContent = '';
    button.disabled = true;
    try { await submit(new FormData(form)); if (dialog.querySelector('#modal-form') === form) dialog.close(); }
    catch (e) { error.textContent = e.message; button.disabled = false; }
  });
}
export const closeDialog = () => dialog.close();
const text = (data, key) => String(data.get(key) ?? '').trim();
const n = (data, key) => text(data, key) === '' ? null : Number(data.get(key));
const uid = type => type + ':' + crypto.randomUUID();

function priceFields(item, label) {
  return [field(label, input('price', item?.price?.cents != null ? (item.price.cents / 100).toFixed(2) : '', 'text', 'inputmode="decimal"')),
    field('Währung', select('currency', ['EUR', 'CHF', 'GBP', 'USD', 'DKK', 'SEK', 'NOK', 'PLN', 'CZK'].map(c => [c, c]), item?.price?.currency ?? 'EUR')),
    field('Preis gilt', select('scope', [['group', 'Für die ganze Gruppe'], ['person', 'Pro Person']], item?.price?.scope ?? 'group'))];
}

function getPrice(data, item) {
  const cents = minor(text(data, 'price'));
  if (cents == null) return null;
  const currency = text(data, 'currency');
  const scope = text(data, 'scope');
  const current = item?.price;
  if (current && current.cents === cents && current.currency === currency && current.scope === scope) return current;
  return { cents, currency, scope, party: null, label: 'Manueller Preis · Status prüfen' };
}

function mapPoint(data, lat, lon) {
  const point = [n(data, lat), n(data, lon)];
  if (point.every(v => v === null)) return null;
  if (point.some(v => v === null)) throw new Error('Bitte beide Koordinaten angeben.');
  return point;
}

const routeCities = ctx => [...new Set(ctx.trip.route)].map(id => [id, ctx.cities[id].name]);
const inputDate = (name, val, ctx, required = true) => input(name, val, 'date', 'min="' + ctx.trip.from + '" max="' + ctx.trip.to + '"' + (required ? ' required' : ''));
const duration = item => item?.duration ?? '';

export function editItem(ctx, item, kind, save) {
  if (item?.booked) { itemDetails(ctx, item); return; }
  const variant = ctx.state;
  const city = item?.city ?? ctx.city;
  const zone = item?.zone ?? ctx.cities[city].timezone;
  const local = localParts(item?.start, zone);
  const end = localParts(item?.end, item?.endZone ?? zone);
  const isRail = kind === 'transport';
  const isLodging = kind === 'lodging';
  const originalRail = isRail && item?.externalId;
  const hidden = name => '<input type="hidden" name="' + name + '" value="' + esc(item?.[name] ?? city) + '">';
  const baseFields = [
    field('Titel', input('name', item?.name, 'text', 'maxlength="240" required'), true),
    originalRail ? '<div class="wide"><small>Originalstrecke: ' + esc(item.name) + '</small>' + hidden('city') + hidden('toCity') + '</div>'
      : field(isRail ? 'Startstadt' : 'Stadt', select('city', routeCities(ctx), city)),
    ...(isRail ? [
      ...(!originalRail ? [field('Zielstadt', select('toCity', routeCities(ctx), item?.toCity ?? city))] : []),
      field('Abfahrtsbahnhof', input('departure', item?.departure)),
      field('Ankunftsbahnhof', input('arrival', item?.arrival)),
      field('Betreiber', input('operator', item?.operator)),
      field('Zugnummer', input('number', item?.number)),
    ] : []),
    field(isRail ? 'Abfahrtstag' : isLodging ? 'Check-in-Tag' : 'Datum', inputDate('date', local.date ?? item?.date ?? item?.stayFrom ?? ctx.date, ctx)),
    field(isRail ? 'Abfahrt · Ortszeit' : isLodging ? 'Check-in · Ortszeit' : 'Beginn · Ortszeit', input('start', local.time, 'time')),
    field(isRail ? 'Ankunftstag' : isLodging ? 'Check-out-Tag' : 'Enddatum', inputDate('endDate', end.date ?? item?.stayTo ?? '', ctx, false)),
    field(isRail ? 'Ankunft · Ortszeit' : isLodging ? 'Check-out · Ortszeit' : 'Ende · Ortszeit', input('end', end.time, 'time')),
    ...(!isRail && !isLodging ? [field('Dauer in Minuten', input('duration', duration(item), 'number', 'min="1" max="2880"'))] : []),
    field('Zeitpuffer davor · Min.', input('buffer', item?.buffer, 'number', 'min="0" max="1440"')),
    ...(!isRail && !isLodging ? [
      field('Öffnet um (optional)', input('opens', item?.hours?.[0], 'time')),
      field('Schließt um (optional)', input('closes', item?.hours?.[1], 'time')),
    ] : []),
    field('Adresse', input('address', item?.address, 'text', 'maxlength="400"'), true),
    field('Breitengrad', input('lat', item?.point?.[0], 'number', 'min="-90" max="90" step="any"')),
    field('Längengrad', input('lon', item?.point?.[1], 'number', 'min="-180" max="180" step="any"')),
    ...(isRail ? [field('Ziel-Breitengrad', input('toLat', item?.toPoint?.[0], 'number', 'min="-90" max="90" step="any"')),
      field('Ziel-Längengrad', input('toLon', item?.toPoint?.[1], 'number', 'min="-180" max="180" step="any"')),
      check('passUse', 'Für Interrail-Reisetage zählen', item?.passUse !== false)] : []),
    ...priceFields(item, isRail ? 'Einzelticketpreis' : 'Betrag'),
    ...(!isRail && !isLodging ? [field('Kategorie', select('category', [['activity', 'Aktivität'], ['food', 'Verpflegung'], ['other', 'Freizeit / Puffer']], item?.category ?? 'activity'))] : []),
    field('Notiz', '<textarea name="detail" maxlength="4000">' + esc(item?.detail) + '</textarea>', true),
    check('locked', 'Termin gegen Verschieben und Löschen sperren', item?.locked),
  ];
  const extra = item ? btn('clone-item', 'Duplizieren', 'plus', item.id)
    + (!item.locked && !originalRail ? btn('remove', 'Aus Plan entfernen', 'close', item.id, 'danger') : '') : '';
  openDialog(item ? 'Planeintrag bearbeiten' : isRail ? 'Zugverbindung ergänzen' : 'Planeintrag hinzufügen',
    (item?.locked ? alert('Der Termin ist gesperrt. Du kannst die Sperre separat aufheben.') : '')
    + controls(baseFields, 'Speichern', extra), async data => {
      const nextCity = text(data, 'city');
      const nextZone = item?.city === nextCity ? zone : ctx.cities[nextCity].timezone;
      const toCity = isRail ? text(data, 'toCity') : undefined;
      const endZone = isRail ? (item?.toCity === toCity ? item.endZone : ctx.cities[toCity].timezone) : nextZone;
      const date = text(data, 'date');
      const endDate = text(data, 'endDate') || date;
      if (item?.locked && data.has('locked')) throw new Error('Sperre zuerst aufheben.');
      if (item?.locked) {
        await save({ ...variant, edits: { ...variant.edits, [item.id]: { ...variant.edits[item.id], locked: false } } }, 'Sperre aufgehoben');
        return;
      }
      const starts = utcFromLocal(date, text(data, 'start'), nextZone, item?.start);
      const ends = utcFromLocal(endDate, text(data, 'end'), endZone, item?.end);
      const values = {
        name: text(data, 'name'), city: nextCity, zone: nextZone, endZone, date,
        start: starts, end: ends, duration: n(data, 'duration'), buffer: n(data, 'buffer'),
        category: isRail ? item?.category ?? 'train' : isLodging ? 'lodging' : text(data, 'category'),
        price: getPrice(data, item), detail: text(data, 'detail'), point: mapPoint(data, 'lat', 'lon'), address: text(data, 'address'),
        locked: data.has('locked'), selected: true,
      };
      if (text(data, 'opens') || text(data, 'closes')) {
        if (!text(data, 'opens') || !text(data, 'closes')) throw new Error('Für Öffnungszeiten beide Uhrzeiten eintragen.');
        values.hours = [text(data, 'opens'), text(data, 'closes')];
      } else values.hours = null;
      if (isRail) Object.assign(values, { toCity, departure: text(data, 'departure'), arrival: text(data, 'arrival'),
        operator: text(data, 'operator'), number: text(data, 'number'), passUse: data.has('passUse'), toPoint: mapPoint(data, 'toLat', 'toLon') });
      if (isLodging) Object.assign(values, { stayFrom: date, stayTo: endDate });
      if (item) await save({ ...variant, edits: { ...variant.edits, [item.id]: { ...variant.edits[item.id], ...values, removed: false } } }, 'Planeintrag gespeichert');
      else await save({ ...variant, manual: [...variant.manual, { ...values, id: uid('manual'), kind,
        mode: isRail ? 'train' : undefined, origin: 'manuell', verification: 'Annahme', booking: 'ungebucht' }] }, 'Planeintrag hinzugefügt');
    });
}

export function chooseItem(ctx, item, save, after) {
  const isLodging = item.kind === 'lodging';
  const current = isLodging ? ctx.active.find(i => i.city === item.city && i.kind === 'lodging' && i.id !== item.id) : null;
  const oldPrice = current?.price?.currency === 'EUR' ? groupPrice(current.price, ctx.people.length) : null;
  const newPrice = item.price?.currency === 'EUR' ? groupPrice(item.price, ctx.people.length) : null;
  const oldWalk = current && ctx.hotelWalks[current.id]?.minutes;
  const newWalk = ctx.hotelWalks[item.id]?.minutes;
  const local = localParts(item.start, item.zone);
  const knownMinors = ctx.people.filter(p => p.age != null && item.minAge && p.age < item.minAge);
  const unknownAge = item.minAge && ctx.people.some(p => p.age == null);
  const warning = knownMinors.length ? alert('Für ' + knownMinors.map(p => p.name).join(', ') + ' unterschreitet das hinterlegte Alter die Einlassgrenze.')
    : unknownAge ? alert('Einlass ' + item.minAge + '+. Alter und Veranstaltung sind für die Gruppe zu prüfen.') : '';
  const quoteWarning = item.quote ? alert('Dieser Gesamtpreis wurde nur am ' + item.quote.observedOn
    + ' als Suchergebnis für die angezeigten Daten und Gruppengröße beobachtet. Zimmeraufteilung, komplette Steuern, Endpreis und Verfügbarkeit sind nicht bestätigt. Die Übernahme ist nur eine Planentscheidung, keine Reservierung oder Zahlung.') : '';
  const preview = isLodging
    ? 'Aufenthalt ' + dateLabel(item.stayFrom, item.stayTo) + '. ' + (current ? 'Ersetzt ' + current.name + '. ' : '')
      + (oldPrice != null && newPrice != null ? 'Budgetänderung ' + money(newPrice - oldPrice) + '.' : 'Offene oder historische Preise werden im Budget ausgewiesen.')
      + (newWalk != null ? ' Ab ' + (item.localStation?.name ?? 'dem Ankunftsbahnhof') + ' ' + newWalk + ' Min. zu Fuß'
        + (oldWalk != null && item.localStation?.name === current?.localStation?.name ? ' statt ' + oldWalk + ' Min.' : '.') : '')
      + (item.access ? ' ' + item.access : '')
    : 'Der Termin und seine bekannte Preisreferenz fließen in Tagesplan, Karte und Budget ein.';
  const fields = isLodging ? [] : [
    field('Tag', inputDate('date', item.date ?? ctx.date, ctx)),
    field('Startzeit · Ortszeit', input('start', local.time, 'time')),
    field('Dauer · Min.', input('duration', item.duration, 'number', 'min="1" max="2880"')),
  ];
  openDialog(isLodging ? 'Unterkunft übernehmen' : 'Aktivität einplanen',
    '<h3>' + esc(item.name) + '</h3><p class="muted">' + esc(preview) + '</p><p><strong>' + esc(cost(item, ctx.people.length)) + '</strong> gesamt · '
    + esc(unit(item, ctx.people.length)) + '</p>' + (item.price?.label ? '<p class="muted">' + esc(item.price.label) + '</p>' : '')
    + warning + quoteWarning + (item.requiresKitchen && !ctx.active.some(i => i.city === item.city && i.kitchen) ? alert('Für diesen Planpunkt ist eine Küche erforderlich. Küchenzugang ist offen.') : '')
    + controls(fields, 'In Plan übernehmen'), async data => {
      if (current?.booked) throw new Error('Eine gebuchte Unterkunft ist als Fixpunkt gesperrt.');
      if (knownMinors.length) throw new Error('Diese Option passt nicht zur hinterlegten Altersgrenze der Gruppe.');
      const edits = { ...ctx.state.edits };
      if (current) edits[current.id] = { ...edits[current.id], selected: false };
      const patch = { selected: true, removed: false };
      if (!isLodging) Object.assign(patch, { date: text(data, 'date'),
        start: utcFromLocal(text(data, 'date'), text(data, 'start'), item.zone, item.start), end: null, duration: n(data, 'duration') });
      edits[item.id] = { ...edits[item.id], ...patch };
      await save({ ...ctx.state, edits }, isLodging ? 'Unterkunft übernommen' : 'Aktivität eingeplant');
      after(item.city, patch.date);
    });
}

export function itemDetails(ctx, item) {
  openDialog(item.name, placeProfileHtml(item,ctx)
    + (item.positionIssue ? alert(item.positionIssue) : '')
    + (item.importConflict ? alert(item.importConflict) : '')
    + '<div class="dialog-foot">'
    + (item.mealSlot && ctx.activeSet.has(item.id) ? btn('meal-cost', 'Ausgabe zur Mahlzeit', 'wallet', item.id) : '')
    + btn('photo-edit', 'Foto zur Galerie hinzufügen', 'pin', item.id)
    + (ctx.state.placePhotos?.[item.id] ? btn('photo-remove','Alle eigenen Fotos entfernen','x',item.id) : '')
    + btn('close', 'Schließen') + '</div>');
}

const checklistLabels = {
  room: 'Die konkrete Zimmerkategorie passt für die Reisegruppe',
  beds: 'Alle benötigten Betten und Personen sind enthalten',
  taxes: 'Gesamtpreis einschließlich Steuern und Pflichtgebühren abgeglichen',
  cancellation: 'Storno- und Zahlungsbedingungen des gewählten Tarifs geprüft',
  checkout: 'Endpreis im Checkout für exakte Reisedaten und Belegung gesehen',
  timetable: 'Abfahrt, Ankunft und Datum beim Betreiber abgeglichen',
  operator: 'Zugnummer/Betreiber und Umsteigepunkte geprüft',
  passCoverage: 'Interrail-Passgültigkeit und Wohnsitzland-Regeln geprüft',
  seatAvailability: 'Passinhaber-Reservierungsplätze für die Gruppe geprüft',
  reservationCost: 'Reservierungsentgelt und ggf. separater Ticketpreis geprüft',
};

export function verificationForm(ctx, item, save) {
  const current = ctx.state.verifications?.[item.id] ?? null;
  const progress = reviewProgress(item.kind, current, ctx.people.length);
  const fields = VERIFICATION_FIELDS[item.kind];
  if (!fields) throw new Error('Für diesen Eintrag ist keine Anbieterprüfung vorgesehen.');
  const checked = fields.map(key => check('check_' + key, checklistLabels[key], current?.checks?.[key]));
  const reference = item.website || (item.kind === 'transport' ? 'https://www.interrail.com/en/book-reservations' : null);
  openDialog('Anbieterprüfung · ' + item.name,
    '<p class="muted">Diese Angaben dokumentierst du selbst auf diesem Gerät. Sie belegen keine erfolgte Buchung. '
    + 'Die Website kann allein durch das Ankreuzen keine Zimmer, Sitzplätze oder Preise unabhängig bestätigen.</p>'
    + (reference ? '<p>' + urlLink(reference, 'Anbieter-/Buchungsseite öffnen') + '</p>' : '')
    + '<p class="muted">Prüfschritte: ' + progress.count + '/' + progress.total
    + ' · ' + esc(progress.description) + '</p>'
    + controls([
      field('Prüfdatum', input('checkedAt', current?.checkedAt ?? new Date().toISOString().slice(0,10),
        'date', 'required'), true),
      field('Beleglink zum konkreten Angebot', input('evidenceUrl', current?.evidenceUrl ?? '',
        'url', 'placeholder="https://..." maxlength="1200"'), true),
      ...checked,
      field(item.kind === 'lodging' ? 'Gesamtpreis für alle Personen · EUR (optional)' :
        'Beobachteter Preis · EUR (optional, nicht automatisch gebucht)',
        input('quotedTotal', current?.quotedCents == null ? '' : (current.quotedCents / 100).toFixed(2),
          'text', 'inputmode="decimal"'), true),
      field('Notizen zum Nachweis (keine Reservierungscodes)', '<textarea name="note" rows="3" maxlength="600">'
        + esc(current?.note ?? '') + '</textarea>', true),
      ...(item.kind === 'lodging' && ctx.activeSet.has(item.id) ? [
        check('applyPrice', 'Den selbst geprüften Gesamtpreis ausdrücklich als Planpreis ins Budget übernehmen '
          + '(keine Zahlung, keine Buchung)', false),
      ] : []),
    ], 'Prüfung lokal speichern'), async data => {
      const checkedAt = text(data, 'checkedAt');
      const evidenceUrl = text(data, 'evidenceUrl');
      const quote = minor(text(data, 'quotedTotal'));
      if (Number.isNaN(Date.parse(checkedAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)
        || (evidenceUrl && (!/^https?:\/\/[^\s]+$/i.test(evidenceUrl) || evidenceUrl.length > 1200))
        || quote != null && (quote < 0 || quote > 100_000_000)) {
        throw new Error('Gültiges Prüfdatum, http(s)-Beleg und nichtnegativen Gesamtpreis eingeben.');
      }
      const checks = Object.fromEntries(fields.map(key => [key, data.has('check_' + key)]));
      const result = {
        kind: item.kind, checkedAt, evidenceUrl: evidenceUrl || null,
        checks, quotedCents: quote, groupSize: ctx.people.length,
        note: text(data, 'note'),
      };
      const completed = reviewProgress(item.kind, result).complete;
      const edits = { ...ctx.state.edits };
      if (data.has('applyPrice')) {
        if (item.kind !== 'lodging' || !ctx.activeSet.has(item.id)
          || !completed || quote == null) {
          throw new Error('Für die Preisübernahme müssen exakter Endpreis, alle Prüfungen und ein Beleglink vorliegen.');
        }
        edits[item.id] = { ...edits[item.id],
          price: { cents: quote, currency: 'EUR', scope: 'group', party: ctx.people.length,
            label: 'Manuell dokumentierter Angebotspreis vom ' + checkedAt + ' · nicht gebucht/bezahlt' },
        };
      }
      await save({ ...ctx.state, edits, verifications: {
        ...ctx.state.verifications, [item.id]: result,
      } }, data.has('applyPrice') ? 'Eigene Prüfung und Planpreis gespeichert' : 'Eigene Anbieterprüfung gespeichert');
    });
}

export function expenseForm(ctx, item, save, meal = null) {
  const linked = Boolean(item?.forItem || meal);
  const priceSeed = item ?? (meal?.price ? { price: { ...meal.price, party: null } } : null);
  const fields = [
    field('Ausgabe', input('name', item?.name ?? meal?.name, 'text', 'required maxlength="240"'), true),
    ...(linked ? [] : [field('Kategorie', select('category', Object.entries(categories), item?.category ?? 'other'))]),
    field('Datum', inputDate('date', item?.date ?? (meal ? mealDate(meal) : ctx.date), ctx, false)),
    ...priceFields(priceSeed, linked ? 'Tatsächlicher Betrag' : 'Betrag · Erstattungen mit Minuszeichen'),
    field('Zahlungsstatus', select('payment', [['open', 'Geplant / offen'], ['paid', 'Bezahlt'], ...(!linked ? [['refund', 'Erstattet']] : [])],
      item?.payment ?? (meal ? 'paid' : 'open'))),
    field('Bezahlt / erstattet an', select('payer', ctx.people.map((p, i) => [i, p.name]), item?.payer ?? 0)),
    field('Kurs · 1 Fremdwährung = EUR', input('fx', item?.fx?.rate, 'text', 'inputmode="decimal"')),
    field('Kursstichtag', input('fxdate', item?.fx?.date, 'date')),
    field('Aufteilung', select('split', [['equal', 'Gleichmäßig'], ['weights', 'Individuelle Gewichte / Prozent'], ['fixed', 'Feste EUR-Beträge']], item?.split?.mode ?? 'equal')),
    field('Anteile in Gruppenreihenfolge · mit / trennen', input('values', item?.split?.values?.map(v => item.split.mode === 'fixed' ? (v / 100).toFixed(2) : v).join('/') ?? '', 'text', 'placeholder="z. B. 50/25/25"'), true),
  ];
  openDialog(item ? 'Ausgabe bearbeiten' : 'Ausgabe ergänzen',
    (linked ? '<p>Dieser Betrag ersetzt den Planwert der verknüpften Mahlzeit im Budget.</p>' : '')
    + controls(fields, 'Speichern', item ? btn('expense-remove', 'Löschen', 'close', item.id, 'danger') : ''), async data => {
    const price = getPrice(data, priceSeed);
    if (!price) throw new Error('Bitte einen Betrag eingeben.');
    const fx = text(data, 'fx') ? { rate: text(data, 'fx').replace(',', '.'), date: text(data, 'fxdate') } : null;
    if (price.currency !== 'EUR' && !fx && text(data, 'payment') !== 'open') throw new Error('Für bezahlte Fremdwährungsbeträge sind Kurs und Stichtag nötig.');
    const mode = text(data, 'split');
    const values = mode === 'equal' ? null : text(data, 'values').split('/').map(v => mode === 'fixed' ? minor(v) : Number(v));
    if (values && values.length !== ctx.people.length) throw new Error('Bitte genau einen Anteil pro Person eintragen.');
    const next = { id: item?.id ?? uid('expense'), name: text(data, 'name'), kind: 'expense',
      price, fx, split: values ? { mode, values } : null, date: text(data, 'date') || null,
      category: linked ? 'food' : text(data, 'category'), payer: n(data, 'payer'), payment: text(data, 'payment'),
      ...(linked ? { forItem: item?.forItem ?? meal.id } : {}) };
    await save({ ...ctx.state, expenses: item ? ctx.state.expenses.map(i => i.id === item.id ? next : i) : [...ctx.state.expenses, next] }, 'Ausgabe gespeichert');
  });
}

export function mealForm(ctx, option, save, after) {
  const { date, people, city } = ctx;
  const zone = ctx.cities[city].timezone;
  const estimate = mealEstimate(option, people.length);
  const current = ctx.active.filter(item => item.mealSlot === option.slot && mealDate(item) === date);
  const existing = current.find(item => item.mealPlanId === option.id);
  const destination = ctx.all.find(item => item.id === option.venue);
  const localTime = localParts((existing ?? current[0])?.start, zone).time ?? '19:00';
  const comparison = 'Gruppe ' + money(estimate.base) + (estimate.terrace != null ? ' innen · Terrasse ' + money(estimate.terrace) : '');
  const warn = option.type === 'cook' && !['shared', 'private'].includes(ctx.mealHotel?.kitchenMode)
    ? alert('Für die Zubereitung sind Herd, Topf und Küchenzugang einzuplanen.') : '';
  openDialog('Abendessen einplanen', '<h3>' + esc(option.name) + '</h3><p>' + esc(dateText(date) + ' · ' + comparison) + '</p>'
    + '<p class="muted">' + esc(option.priceNote) + '</p>'
    + (current.length ? '<p>Ersetzt im Tagesplan ' + esc(current.map(i => i.name).join(', ')) + '.</p>' : '') + warn
    + controls([
      field('Startzeit · Ortszeit', input('start', localTime, 'time', 'required')),
      field('Dauer · Min.', input('duration', existing?.duration ?? option.prep, 'number', 'min="1" max="360" required')),
      ...(estimate.terrace == null ? [] : [field('Sitzplatz', select('seating', [['inside', 'Innen'], ['terrace', 'Terrasse']], existing?.seating ?? 'inside'))]),
    ], 'In Plan übernehmen'), async data => {
    if (current.some(i => i.locked || i.booked)) throw new Error('Eine Mahlzeit im Plan ist gesperrt.');
    if (current.some(i => ctx.state.expenses.some(expense => expense.forItem === i.id))) {
      throw new Error('Für diese Mahlzeit ist schon eine Ausgabe erfasst. Passe den Betrag im Budget an.');
    }
    const seating = text(data, 'seating');
    const cents = seating === 'terrace' && estimate.terrace != null ? estimate.terrace : estimate.base;
    const requiresKitchen = option.type === 'cook';
    const item = { id: uid('manual'), trip: ctx.trip.id, city, kind: 'activity', category: 'food', selected: true,
      name: option.name + (seating === 'terrace' ? ' · Terrasse' : ''), zone, date, mealSlot: option.slot,
      mealPlanId: option.id, seating, start: utcFromLocal(date, text(data, 'start'), zone, existing?.start),
      duration: n(data, 'duration'), point: destination?.point ?? null, address: destination?.address,
      requiresKitchen, ...(requiresKitchen ? { basketProducts: option.products.map(product => ({
        name: product.name, pack: product.pack, need: product.need, cents: product.cents, source: product.source,
      })) } : {}),
      tags: ['Abendessen', requiresKitchen ? 'Selbst kochen' : 'Restaurant'],
      price: { cents, currency: 'EUR', scope: 'group', party: people.length, label: option.priceNote },
      source: option.source, detail: option.note, origin: 'manuell', verification: 'Preisreferenz' };
    const edits = { ...ctx.state.edits };
    for (const previous of current) edits[previous.id] = { ...edits[previous.id], selected: false };
    await save({ ...ctx.state, edits, manual: [...ctx.state.manual, item] }, 'Abendessen eingeplant');
    after(item.id);
  });
}

export function groceryEditForm(ctx, row, save) {
  openDialog('Gruppenwarenkorb bearbeiten', '<h3>' + esc(row.name) + '</h3>'
    + '<p class="muted">Für alle geplanten Koch-Mahlzeiten in ' + esc(ctx.cities[row.city]?.name ?? row.city)
    + ': ' + row.required + ' g benötigt · mindestens ' + row.minPacks + ' Packung(en) à ' + row.pack + ' g.</p>'
    + '<p class="muted">Der eingetragene Packungspreis ist eine Planannahme, kein bestätigter Regalpreis. '
    + 'Für bereits bezahlte Einkäufe muss ein separater Beleg als Ausgabe erfasst werden.</p>'
    + controls([
      field('Packungen', input('packs', row.packs, 'number', 'min="' + row.minPacks + '" max="100" step="1" required'), true),
      field('Preis je Packung · EUR', input('unitPrice', (row.unitCents / 100).toFixed(2), 'text',
        'inputmode="decimal" required'), true),
    ], 'Warenkorb aktualisieren'), async data => {
      const packs = n(data, 'packs');
      const unitCents = minor(text(data, 'unitPrice'));
      if (!Number.isSafeInteger(packs) || packs < row.minPacks || packs > 100
        || unitCents == null || unitCents < 0 || unitCents > 100000) {
        throw new Error('Mindestens die erforderliche Anzahl Packungen und einen gültigen Preis eingeben.');
      }
      await save({ ...ctx.state, groceryOverrides: {
        ...ctx.state.groceryOverrides, [row.key]: { packs, unitCents },
      } }, 'Gemeinsamen Einkauf aktualisiert');
    });
}

export function editPeople(ctx, save) {
  const fields = [
    field('Anzahl Reisende', input('count', ctx.people.length, 'number', 'min="1" max="12" required'), true),
    ...ctx.people.flatMap((p, i) => [field('Name ' + (i + 1), input('name' + i, p.name, 'text', 'maxlength="60" required')),
      field('Alter zum Reisebeginn', input('age' + i, p.age, 'number', 'min="0" max="125"'))]),
  ];
  openDialog('Reisegruppe bearbeiten', '<p class="muted">Neue Personen erhalten zunächst einen Platzhalternamen. Anteile und Beträge für andere Gruppengrößen werden neu geprüft.</p>'
    + controls(fields), async data => {
      const count = n(data, 'count');
      if (ctx.state.expenses.some(i => i.payer >= count || (i.split && i.split.values.length !== count))) throw new Error('Passe zunächst die betroffenen Zahler und individuellen Aufteilungen im Budget an.');
      const people = Array.from({ length: count }, (_, i) => ({
        id: 'p' + (i + 1), name: text(data, 'name' + i) || 'Person ' + (i + 1), age: n(data, 'age' + i),
      }));
      await save({ ...ctx.state, people }, 'Reisegruppe gespeichert');
    });
}

export function editPass(ctx, save) {
  const pass = ctx.state.pass;
  openDialog('Interrail Flexi-Pass', controls([
    field('Gültig ab', input('from', pass.from, 'date', 'required')),
    field('Gültig bis', input('to', pass.to, 'date', 'required')),
    field('Reisetage', input('days', pass.days, 'number', 'min="1" max="99" required')),
    field('Passpreis pro Person · EUR', input('cost', pass.cost == null ? '' : (pass.cost / 100).toFixed(2))),
    field('Bahnkosten im Gruppenbudget', select('budgetMode', [['tickets', 'Einzeltickets'], ['interrail', 'Interrail mit Reservierungen']], pass.budgetMode ?? 'tickets'), true),
    check('purchased', 'Pass bereits vorhanden · kein zusätzlicher Kaufpreis im Vergleich', pass.purchased),
    check('includeReferences', 'Bei Interrail bekannte Reservierungstarife als Schätzung verwenden', pass.includeReferences),
  ]), async data => {
    await save({ ...ctx.state, pass: { ...pass, from: text(data, 'from'), to: text(data, 'to'), days: n(data, 'days'),
      cost: minor(text(data, 'cost')), purchased: data.has('purchased'), budgetMode: text(data, 'budgetMode'),
      includeReferences: data.has('includeReferences') } }, 'Pass-Einstellungen gespeichert');
  });
}

export function deadlineForm(ctx, item, save) {
  const local = localParts(item?.when, item?.zone ?? ctx.trip.zone);
  openDialog('Buchungsfrist oder Wiedervorlage', controls([
    field('Titel', input('title', item?.title, 'text', 'maxlength="240" required'), true),
    field('Datum (leer = unbekannt)', input('date', local.date, 'date')),
    field('Uhrzeit', input('time', local.time, 'time')),
    field('Zeitzone', input('zone', item?.zone ?? ctx.cities[ctx.city].timezone, 'text', 'required')),
    check('done', 'Erledigt', item?.done),
  ], 'Speichern', item ? btn('deadline-remove', 'Löschen', 'close', item.id, 'danger') : ''), async data => {
    const zone = text(data, 'zone');
    const date = text(data, 'date');
    const time = text(data, 'time');
    if (Boolean(date) !== Boolean(time)) throw new Error('Für eine konkrete Frist bitte Datum und Uhrzeit eingeben.');
    const next = { id: item?.id ?? uid('deadline'), title: text(data, 'title'), zone, when: utcFromLocal(date, time, zone, item?.when), done: data.has('done') };
    const deadlines = item ? ctx.state.deadlines.map(d => d.id === item.id ? next : d) : [...ctx.state.deadlines, next];
    await save({ ...ctx.state, deadlines }, 'Frist gespeichert');
  });
}

export function simpleField(title, label, value, submit, type = 'text', attr = 'required') {
  openDialog(title, controls([field(label, input('value', value, type, attr), true)]), data => submit(text(data, 'value')));
}

export function layerForm(ctx, onToggle) {
  const list = [['activities', 'Aktivitäten'], ['hotels', 'Unterkünfte'], ['stations', 'Bahnhöfe'], ['walk', 'Fußwege'], ['options', 'Alternativen']];
  const network = transitNetworks[ctx.city];
  const transit = Object.entries(network?.groups ?? {});
  openDialog('Kartenebenen', '<div class="stack">' + list.map(([id, label]) => btn('filter', (ctx.filters[id] ? '✓ ' : '') + label, '', id)).join('')
    + (network ? '<h3>Statisches Netz</h3>' + (network.dateLabel ? '<p>' + esc(network.dateLabel) + ' · Fahrten am Reisetag beim Betreiber prüfen.</p>' : '')
      + transit.map(([id, group]) => btn('transit', (ctx.filters.transit[id] ? '✓ ' : '') + group.title, 'train', id)).join('')
      : '<p>Für diesen Ort liegt kein lokales Liniennetz vor.</p>') + '</div><div class="dialog-foot">' + btn('close', 'Schließen') + '</div>');
}

export function routeForm(ctx, index, calculate, save, state = '') {
  const segment = ctx.segments[index];
  if (!segment) return;
  const route = ctx.routes[index];
  const routeLabel = segment.from.name + ' → ' + segment.to.name;
  const fare = route?.fare;
  const fareText = fare ? money(fare.cents, fare.currency) + (fare.scope === 'person' ? ' pro Person · '
    + money(groupPrice(fare, ctx.people.length), fare.currency) + ' für die Gruppe' : ' für die Gruppe')
    : route?.price === 0 ? 'kostenlos' : 'Preis offen';
  const summary = route ? '<p><strong>' + esc(route.mode) + (route.line ? ' · ' + esc(route.line) : '') + ' · ' + route.minutes + ' Min.</strong>'
    + (route.metres != null ? ' · ' + (route.metres / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' km' : '')
    + ' · ' + esc(fareText) + '</p><p class="muted">' + (urlLink(route.source, 'Quelle öffnen') || esc(route.source))
    + (route.date || route.checked ? ' · ' + esc(dateText(route.date ?? route.checked)) : '') + '</p>'
    : '<p class="muted">' + esc(segment.access?.label ?? 'Noch kein berechneter Weg für dieses Paar.') + '</p>';
  const guide = ctx.catalog.sources[segment.access?.source]?.url;
  const options = guide ? urlLink(guide, 'Offizielle Wegbeschreibung', 'button')
    : urlLink(transitPlanners[segment.from.placeCity ?? ctx.city], 'ÖPNV-Verbindung prüfen', 'button');
  const walking = !segment.access && segment.from.point && segment.to.point
    ? btn('calculate', state === 'loading' ? 'Berechnet …' : 'Fußweg berechnen', 'walk', index)
      + urlLink('https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=' + encodeURIComponent(segment.from.point.join(',') + ';' + segment.to.point.join(',')), 'Fußweg extern', 'button')
    : '';
  const schedule = !segment.access && segment.from.point && segment.to.point
    && ctx.catalog.transitSchedules?.[segment.from.placeCity ?? ctx.city];
  const scheduleOutdated = schedule && (ctx.date < schedule.from || ctx.date > schedule.to);
  openDialog('Wegdetails', '<h3>' + esc(routeLabel) + '</h3>' + summary + (state && state !== 'loading' ? alert(state) : '')
    + '<div class="row-actions">' + walking + (schedule ? btn('scheduled-route', scheduleOutdated ? 'Nur historischen Referenzfahrplan prüfen' : 'Fahrplan durchsuchen', 'train', index) : '') + options
    + '</div><div class="section"><h3>Geprüften Weg manuell hinterlegen</h3>'
    + '<p>Der Weg gilt für diesen Tag. Den Preis kannst du bei Bedarf als Ausgabe im Budget erfassen.</p></div>'
    + controls([
      field('Verkehrsmittel', select('mode', ['ÖPNV', 'Fußweg', 'Bergweg', 'Gondel & Fußweg'].map(mode => [mode, mode]), route?.mode ?? segment.access?.mode ?? 'ÖPNV')),
      field('Minuten', input('minutes', route?.minutes, 'number', 'min="1" max="1440" required')),
      field('Linie oder Verbindung', input('line', route?.line, 'text', 'maxlength="100"')),
      field('Quelle oder Fahrplanbezug', input('source', route?.source ?? guide, 'text', 'maxlength="500" required'), true),
      ...priceFields({ price: fare }, 'Fahrpreis'),
    ]), async data => {
      const { localRoutes } = ctx.state;
      const fare = getPrice(data, { price: route?.fare });
      if (fare?.cents < 0) throw new Error('Der Fahrpreis muss mindestens 0 betragen.');
      const next = { mode: text(data, 'mode'), minutes: n(data, 'minutes'), line: text(data, 'line') || null,
        date: ctx.date, source: text(data, 'source'), fare };
      await save({ ...ctx.state, localRoutes: { ...localRoutes, [segment.datedKey]: next } }, 'Weg gespeichert');
    });
}

function referenceDay(meta, date) {
  const today = new Date().toISOString().slice(0, 10);
  const available = today < meta.from ? meta.from : today > meta.to ? meta.to : today;
  const sameWeekday = new Date(date + 'T12:00:00Z').getUTCDay();
  const epoch = Date.parse(available + 'T12:00:00Z');
  return [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6].map(shift =>
    new Date(epoch + shift * 86_400_000).toISOString().slice(0, 10)).find(candidate =>
    candidate >= meta.from && candidate <= meta.to && new Date(candidate + 'T12:00:00Z').getUTCDay() === sameWeekday) ?? available;
}

function transitFareNote(city, route, count, fares) {
  if (city === 'barcelona') {
    const airport = route.legs.some(leg => /aeroport t[12]/i.test(leg.from.name + ' ' + leg.to.name));
    if (airport) return 'Am Flughafen gilt ein eigener Metro-Tarif. Preis beim Betreiber prüfen.';
    const unit = Math.round(fares.barcelona_single.amount * 100);
    if (route.legs.length === 1) return 'TMB-Einzelticket 2026 · ' + money(unit) + ' p. P. · ' + money(unit * count) + ' für die Gruppe.';
    return 'Tarif 2026 · T-casual 1 Zone ab ' + money(Math.round(fares.barcelona_tcasual.amount * 100))
      + ' p. P. für zehn Fahrten. Umstiegsregeln und Zonen prüfen.';
  }
  return 'Tarif und Gültigkeit zum Reisetag beim Betreiber prüfen.';
}

export function timetableForm(ctx, search, submit) {
  const { index, city, date, time, excluded, result } = search;
  const segment = ctx.segments[index];
  const meta = ctx.catalog.transitSchedules[city];
  const outside = ctx.date < meta.from || ctx.date > meta.to;
  const reference = referenceDay(meta, ctx.date);
  const format = instant => {
    const local = localParts(instant, meta.zone);
    return local.time + (local.date !== date ? ' · ' + dateText(local.date) : '');
  };
  const cards = result?.routes.map((route, i) => {
    const rows = route.legs.map(leg => '<li><strong>' + esc(leg.mode + ' ' + leg.name) + '</strong>'
      + (leg.direction ? ' · Richtung ' + esc(leg.direction) : '') + '<br>' + esc(format(leg.departure) + ' ' + leg.from.name)
      + ' → ' + esc(format(leg.arrival) + ' ' + leg.to.name) + '</li>').join('');
    return '<article class="panel panel-pad timetable-result"><h3>' + esc(route.line) + ' · ' + route.minutes + ' Min.</h3>'
      + '<p class="muted">Geschätzter Fußzugang ' + Math.ceil(route.access.seconds / 60) + ' Min. · '
      + 'Fußweg zum Ziel ' + Math.ceil(route.egress.seconds / 60) + ' Min.</p>'
      + '<ol>' + rows + '</ol><p>' + esc(transitFareNote(city, route, ctx.people.length, ctx.catalog.fares)) + '</p>'
      + '<div class="row-actions">' + btn('transit-preview', 'Auf Karte', 'map', i)
      + (date === ctx.date ? btn('transit-adopt', 'Als Tagesweg übernehmen', 'check', i, 'primary') : '') + '</div></article>';
  }).join('') ?? '';
  const coverage = meta.provider + ' · Fahrplan ' + dateText(meta.from) + '–' + dateText(meta.to);
  const note = outside ? alert('Für euren Reisetag ' + dateText(ctx.date) + ' liegt in diesem Paket noch kein Fahrplan vor.') : '';
  const outcome = result?.status === 'outside' ? alert('Das gewählte Datum liegt außerhalb des veröffentlichten Fahrplanpakets.')
    : result?.status === 'none' ? alert('Im Suchfenster von drei Stunden wurde keine passende Verbindung gefunden.') : '';
  const dated = result?.status === 'scheduled'
    ? '<h3>' + esc((date === ctx.date ? 'Fahrplan am Reisetag' : 'Fahrplanreferenz') + ' · ' + dateText(date)) + '</h3>' : '';
  const origin = segment.from.name + ' → ' + segment.to.name;
  openDialog('ÖPNV-Fahrplan', '<p>' + esc(origin) + '</p><p class="muted">' + esc(coverage) + '</p>' + note
    + controls([
      field('Fahrplandatum', input('serviceDate', date, 'date', 'required')),
      field('Frühester Start · Ortszeit', input('time', time, 'time', 'required')),
      field('Linie auslassen · Plan B', input('excluded', excluded.join(', '), 'text', 'maxlength="160" placeholder="z. B. L5"'), true),
    ], 'Verbindungen suchen', outside && date !== reference ? btn('transit-reference', 'Referenz ' + dateText(reference), 'calendar', reference) : ''), submit);
  const resultBox = document.createElement('section');
  resultBox.className = 'section stack';
  resultBox.innerHTML = outcome + dated + cards + '<div class="row-actions">'
    + urlLink(meta.source, 'Fahrplanquelle') + urlLink(transitPlanners[city], 'Betreiberplaner')
    + (city === 'barcelona' ? urlLink('https://www.tmb.cat/es/tarifas-metro-bus-barcelona/precios-titulos-transporte', 'Tarife und Zonen')
      + urlLink('https://www.tmb.cat/en/barcelona/metro/-/lineametro', 'Metro-Netzstatus') : '')
    + '</div>';
  dialog.querySelector('.dialog-body').append(resultBox);
}
