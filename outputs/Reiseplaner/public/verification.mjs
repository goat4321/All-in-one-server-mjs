// Operator rules are reference windows, never actual seats, timetables or guarantees.
// Checked against official operator help on 2026-11-12.
export const WINDOW_SOURCES = Object.freeze({
  sncf: 'https://www.sncf-connect.com/en-en/help/ticket-sales-opening',
  db: 'https://www.bahn.de/faq/sitzplatzreservierung-vorverkauf',
  interrail: 'https://www.interrail.com/en-int/support/reservations/when-should-i-start-making-reservations',
});

export function calendarMonthsBefore(date, count) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(count) || count < 1 || count > 12)
    throw new Error('Ungültiges Datum oder Monatsschema.');
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.toISOString().slice(0, 10) !== date) throw new Error('Ungültiger Kalendertag.');
  const first = new Date(Date.UTC(year, month - 1 - count, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return first.getUTCFullYear() + '-' + String(first.getUTCMonth() + 1).padStart(2, '0') + '-' + String(Math.min(day, last)).padStart(2, '0');
}

export function railSalesStatus(task, asOf = '2026-11-12') {
  const route = task?.route ?? ((task?.from ?? '') + ' → ' + (task?.to ?? ''));
  const date = task?.date_local;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return {
    status: 'unknown', text: 'Reisedatum offen; kein Verkaufsfenster ableitbar.', earliestReview: null,
    url: WINDOW_SOURCES.interrail,
  };
  const international = /München|Munich|Deutschland|Germany/i.test(route)
    && /Paris|Frankreich|France|Italien|Italy|Milano|Mailand|Venezia|Venedig|Schweiz|Switzerland|Zürich/i.test(route);
  const france = /Paris|Toulouse|Narbonne|Sète|Montpellier|Marseille|Nice|Nizza|Lyon|Bordeaux|Perpignan|Strasbourg|Frankreich|France/i.test(route);
  if (international) {
    const review = calendarMonthsBefore(date, 6);
    return {
      status: asOf < review ? 'before_typical_window' : 'operator_check_required',
      text: 'Internationale DB-/Kooperationsreservierungen meist bis zu 6 Monate voraus. Keine konkrete Fahrt bestätigt.',
      earliestReview: review, approximate: true, url: WINDOW_SOURCES.db,
    };
  }
  if (france) {
    const review = calendarMonthsBefore(date, 4);
    const publishedThrough = '2027-07-02';
    return {
      status: date > publishedThrough && asOf <= '2026-11-12' ? 'not_in_published_window' : 'operator_check_required',
      text: date > publishedThrough
        ? 'Reise liegt nach dem am 12.11.2026 veröffentlichten SNCF-Verkaufszeitraum (bis 02.07.2027).'
        : 'Verkaufsfenster ist zug-/operatorabhängig. Konkrete Verbindung und Passplätze prüfen.',
      earliestReview: review, approximate: true, publishedThrough, url: WINDOW_SOURCES.sncf,
    };
  }
  const review = calendarMonthsBefore(date, 3);
  return {
    status: 'operator_check_required',
    text: 'Keine verbindliche Verkaufszusage. Bei vielen reservierungspflichtigen Interrail-Zügen ca. 3 Monate Vorlauf.',
    earliestReview: review, approximate: true, url: WINDOW_SOURCES.interrail,
  };
}

export const VERIFICATION_FIELDS = Object.freeze({
  lodging: ['room', 'beds', 'taxes', 'cancellation', 'checkout'],
  transport: ['timetable', 'operator', 'passCoverage', 'seatAvailability', 'reservationCost'],
});

export function reviewProgress(kind, review) {
  const fields = VERIFICATION_FIELDS[kind] ?? [];
  const count = fields.filter(field => review?.checks?.[field] === true).length;
  const complete = count === fields.length && fields.length > 0
    && typeof review?.evidenceUrl === 'string' && /^https?:\/\//i.test(review.evidenceUrl)
    && typeof review?.checkedAt === 'string' && review.checkedAt.length === 10;
  return { count, total: fields.length, complete,
    description: complete ? 'Selbst dokumentiert · kein Buchungsnachweis'
      : count ? 'Teilweise selbst geprüft · nicht bestätigt' : 'Noch nicht geprüft' };
}
