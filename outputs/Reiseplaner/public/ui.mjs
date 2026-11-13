import { allocate, groupPrice, localParts, money } from './model.mjs';

const paths = {
  train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14m-11 7-3 4m11-4 3 4M9 14h.01M15 14h.01"/>',
  car:'<path d="m5 10 2-5h10l2 5m-15 7v2m16-2v2M7 14h.01M17 14h.01"/><rect x="3" y="10" width="18" height="7" rx="2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6zm6-3v15m6-12v15"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  bed:'<path d="M3 18v-7m18 7v-5a2 2 0 0 0-2-2h-8v5m-8 0h18M7 11V8h4v3M3 12h8"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z"/>',
  wallet:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M21 10h-6a2 2 0 0 0 0 4h6m-6-2h.01"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m1-15a3 3 0 0 1 0 6m5 9v-2a4 4 0 0 0-3-4"/>',
  folder:'<path d="M3 17V6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  close:'<path d="m6 6 12 12m0-12L6 18"/>',
  edit:'<path d="m13 6 5 5M5 19l4-.7L20 7l-4-4L5 14l0 5z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  walk:'<circle cx="13" cy="4" r="2"/><path d="m7 21 4-8 2-4m-7 4 3-4 4 0 3 4h3m-9 3 5 1 2 4"/>',
  spark:'<path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2zm6 13 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>',
  tree:'<path d="m12 3 6 7h-3l5 6H4l5-6H6l6-7zm0 13v5"/>',
  food:'<path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18m10 0V3l-3 5v4h3"/>',
  moon:'<path d="M20 15A8 8 0 0 1 9 4a8.5 8.5 0 1 0 11 11z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>',
  compare:'<path d="M4 20h16M7 17V8m5 9V3m5 14v-6"/>',
  bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  alert:'<path d="m12 3 10 18H2L12 3zm0 6v5m0 3h.01"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  upload:'<path d="M12 15V3M7 8l5-5 5 5M4 17v4h16v-4"/>',
  external:'<path d="M13 4h7v7m0-7-9 9m7-1v7H5V6h7"/>',
  reset:'<path d="M5 10a8 8 0 1 1 2 8M5 4v6h6"/>',
  'arrow-up':'<path d="M12 20V4m-6 6 6-6 6 6"/>',
  'arrow-down':'<path d="M12 4v16m-6-6 6 6 6-6"/>',
  shuffle:'<path d="m4 4 3 0 11 16m-4-4 4 4 4-4M4 20h3l4-6m3-4 4-6 4 4m0-4v6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  beach:'<path d="M3 11a9 9 0 0 1 18 0H3zm9 0v8m-8 2h16M12 3v2"/>',
};
export const icon = key => '<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24">' + (paths[key] ?? paths.pin) + '</svg>';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
export const shortDay = date => new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
export const longDay = date => new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
export const dateText = date => date ? date.split('-').reverse().join('.') : 'Offen';
export const dateLabel = (a, b) => a && b ? dateText(a).slice(0, 6) + '–' + dateText(b) : 'Datum offen';
export const transitPlanners = {
  barcelona: 'https://www.tmb.cat/en/barcelona/journey-planner',
  paris: 'https://www.iledefrance-mobilites.fr/itineraire',
  sete: 'https://www.mobilite.agglopole.fr/itineraire',
  nice: 'https://www.lignesdazur.com/',
  genoa: 'https://www.amt.genova.it/amt/trasporto-multimodale/pianifica-il-viaggio/',
  venice: 'https://muoversi.venezia.it/it/content/vaporetto',
  appenzell: 'https://appenzellerbahnen.ch/de/reiseinformationen/betriebslage.html',
  wasserauen: 'https://www.sbb.ch/de',
  kandersteg: 'https://www.sbb.ch/de',
  grindelwald: 'https://www.sbb.ch/de',
  glarus: 'https://www.sbb.ch/de',
};
export const status = (text, type = '') => '<span class="status ' + type + '">' + esc(text) + '</span>';
export const btn = (action, label, symbol = '', value = '', style = '') =>
  '<button type="button" class="button ' + style + '" data-action="' + action + '" data-value="' + esc(value) + '">' + (symbol ? icon(symbol) : '') + esc(label) + '</button>';
export const iconBtn = (action, label, symbol, value = '') =>
  '<button type="button" class="icon-btn" data-action="' + action + '" data-value="' + esc(value) + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + icon(symbol) + '</button>';
export const chip = (action, text, pressed, value = '', symbol = '') =>
  '<button type="button" class="chip-button" aria-pressed="' + Boolean(pressed) + '" data-action="' + action + '" data-value="' + esc(value) + '">' + (symbol ? icon(symbol) : '') + esc(text) + '</button>';
export const empty = (title, note) => '<div class="empty"><h3>' + esc(title) + '</h3><p>' + esc(note) + '</p></div>';
export const alert = message => '<div class="alert">' + icon('alert') + '<span>' + esc(message) + '</span></div>';
export const categoryIcon = item => item.mode === 'roadtrip' ? 'car' : item.kind === 'transport' ? 'train' : item.kind === 'lodging' ? 'bed'
  : item.minAge ? 'moon' : item.category === 'food' ? 'food' : item.tags?.some(t => /strand|beach/i.test(t)) ? 'beach'
  : item.tags?.some(t => /park|draußen/i.test(t)) ? 'tree' : 'pin';
export const cost = (item, count) => {
  const price = item.effectivePrice ?? item.price;
  return money(groupPrice(price, count), price?.currency);
};
export const unit = (item, count) => {
  const price = item.effectivePrice ?? item.price;
  const value = groupPrice(price, count);
  if (value == null) return 'Preis offen';
  if (price.scope === 'person') return money(price.cents, price.currency) + ' p. P.';
  const parts = price.individual ?? allocate(value, Array(count).fill(1));
  return [...new Set(parts)].map(n => money(n, price.currency)).join(' / ') + ' p. P.';
};
export function urlLink(url, label, style = '') {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return '';
  return '<a class="' + style + '" target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">' + esc(label) + ' ' + icon('external') + '</a>';
}

export function sourceList(item, sources) {
  const rows = (item.source ?? []).flatMap(id => sources[id] ? [sources[id]] : []);
  const links = rows.map(s => '<li>' + (urlLink(s.url, s.publisher) || esc(s.publisher)) + (s.accessed_on ? ' · ' + esc(dateText(s.accessed_on)) : '') + '</li>');
  if (item.website && !rows.some(s => s.url === item.website)) links.push('<li>' + urlLink(item.website, 'Ort / Quelle öffnen') + '</li>');
  if (item.importSource) links.push('<li>' + esc(item.importSource.file + ' · ' + item.importSource.provider + ' · ' + dateText(item.importSource.date.slice(0, 10))) + '</li>');
  return '<div class="chips">' + status(item.origin ?? 'manuell') + status(item.verification ?? 'ungeprüft', 'warn') + '</div>'
    + (links.length ? '<ul class="sources-list">' + links.join('') + '</ul>' : '<small>Quellenlink offen.</small>');
}

export function timeText(item) {
  const start = localParts(item.start, item.zone);
  const end = localParts(item.end, item.endZone ?? item.zone);
  return (start.time ?? 'offen') + ' → ' + (end.time ?? 'offen') + (end.date && end.date !== start.date ? ' · ' + dateText(end.date) : '');
}
