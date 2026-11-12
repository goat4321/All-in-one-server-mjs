// Officially published operator rules observed 2026-11-12. These are facts
// about the published rule window, NOT confirmed 2027 prices/bookings.
const veniceChargeDates = {
  '03': [26, 27, 28, 29],
  '04': [2, 3, 4, 9, 10, 11, 16, 17, 18, 23, 24, 25, 26, 27, 28, 29, 30],
  '05': [1, 2, 7, 8, 9, 14, 15, 16, 21, 22, 23, 28, 29, 30, 31],
  '06': [1, 2, 3, 4, 5, 6, 11, 12, 13, 18, 19, 20, 25, 26, 27],
  '07': [2, 3, 4, 9, 10, 11, 16, 17, 18, 23, 24, 25, 30, 31],
  '08': [1, 6, 7, 8, 13, 14, 15],
};
const publishedVeniceDays = new Set(Object.entries(veniceChargeDates)
  .flatMap(([month, days]) => days.map(day =>
    '2027-' + month + '-' + String(day).padStart(2, '0'))));

export const OFFICIAL_RULE_URLS = Object.freeze({
  venice: 'https://cda.ve.it/de',
  oeschinensee: 'https://www.oeschinensee.ch/tarife-fahrplan/',
  sixt: 'https://www.sixt.ch/help-center/articles/welchen-fuehrerschein-brauche-ich-fuer-eine-anmietung-bei-sixt-in-der-schweiz/',
  eiffel: 'https://www.toureiffel.paris/en/rates-opening-times',
});

export function veniceAccessStatus(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || date.slice(0, 4) !== '2027') return 'unknown';
  // Official city published dates for fee collection through Aug 15, 2027.
  return publishedVeniceDays.has(date) ? 'published_charge_day' : 'not_in_published_calendar';
}

export function official2027Notices(trip) {
  const cities = new Set(trip.route ?? []);
  const notes = [];
  if (cities.has('venice')) {
    const chargeAppliesOnAnyDay = [...publishedVeniceDays].some(date => date >= trip.from && date <= trip.to);
    notes.push({
      id: 'venice-2027', category: 'access', city: 'venice', source: OFFICIAL_RULE_URLS.venice,
      title: 'Venedig · Zugangsentgelt 2027',
      message: chargeAppliesOnAnyDay
        ? 'Im Reisezeitraum liegen offizielle Gebührentage. Uhrzeiten 08:30–16:30; Höhe, Ausnahmen und konkreten Besuchstag prüfen.'
        : 'Im veröffentlichten Gebührenkalender 2027 liegen bisher keine Zahlungstage nach dem 15. August. Die finalen Regeln sind noch nicht veröffentlicht; keine automatische Gebühr und keine Gratiszusage.',
      verification: 'Offizieller Kalender · Stand 12.11.2026; Details vor Reise erneut prüfen',
    });
  }
  if (cities.has('oeschinensee') || cities.has('kandersteg')) {
    const summer = trip.to >= '2027-04-24' && trip.from <= '2027-09-19';
    notes.push({
      id: 'oeschi-2027', category: 'mountain', city: 'kandersteg', source: OFFICIAL_RULE_URLS.oeschinensee,
      title: 'Oeschinensee · Gondelbahn',
      message: summer
        ? 'Offiziell veröffentlichter Sommerfahrplan: 24.04.–19.09.2027 täglich 08:30–18:00 Uhr. Betriebsunterbrechungen, Bergwege, Wetter und konkrete Ticketpreise 2027 gesondert prüfen.'
        : 'Reise außerhalb des veröffentlichten Sommerfahrplans; Betrieb, Wegzugang und Tarif separat prüfen.',
      verification: 'Veröffentlichter Saisonfahrplan 2027 · keine Ticket-/Wettergarantie',
    });
  }
  if (trip.id === 'swiss_lakes') {
    notes.push({
      id: 'swiss-car-2027', category: 'car', city: 'kandersteg', source: OFFICIAL_RULE_URLS.sixt,
      title: 'Schweizer Mietwagen · Mindestalter',
      message: 'SIXT Schweiz: Standard-Fahrzeugklassen ab 19 Jahren und mit mindestens einem Jahr Führerscheinbesitz. Unter 25 Jahren fällt eine Jungfahrergebühr an. 18-Jährige sind bei SIXT Schweiz derzeit nicht mietberechtigt; andere Vermieter separat prüfen.',
      verification: 'Offizielle SIXT-Schweiz-Bedingungen · Stand 12.11.2026',
    });
  }
  if (cities.has('paris')) {
    notes.push({
      id: 'eiffel-2027', category: 'ticket', city: 'paris', source: OFFICIAL_RULE_URLS.eiffel,
      title: 'Eiffelturm · Eintritt 2027',
      message: 'Die offizielle Website verweist auf neue Tarife ab 11.01.2027. Bisher gespeicherte 2026-Referenzpreise nicht als zugesicherte September-2027-Ticketpreise behandeln. Öffnungs-/Buchungsfenster und Jugendtarif beim Kauf prüfen.',
      verification: 'Hinweis der offiziellen Tarifseite; Preis 2027 nicht abschließend übernommen',
    });
  }
  return notes;
}
