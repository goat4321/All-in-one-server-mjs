import { esc, urlLink, chip } from './ui.mjs';
import { money } from './model.mjs';

function nightsBetween(from,to) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from??'')||!/^\d{4}-\d{2}-\d{2}$/.test(to??''))return null;
  const a=Date.parse(from+'T12:00:00Z'),b=Date.parse(to+'T12:00:00Z');
  const n=Math.round((b-a)/86400000);
  return Number.isInteger(n)&&n>=1&&n<=30?n:null;
}

// Dates and party size are hard matches. Research searches do not become
// selected accommodation, planned expenses, bookings or precise map pins.
export function providerQuoteModel(ctx) {
  const stay=ctx.trip?.stayByCity?.[ctx.city];
  const people=ctx.people?.length??0;
  const source=ctx.catalog?.research?.providerSearchV13;
  const row=source?.searches?.find(g=>g.city===ctx.city&&g.from===stay?.from
    &&g.to===stay?.to&&g.adults===people&&g.rooms===1);
  if(!row || !Number.isInteger(people) || people!==3)return null;
  const nights=nightsBetween(row.from,row.to);
  if(!nights)return null;
  const target=Math.round((ctx.nightlyTargetEuro??35)*100);
  const all=row.results.filter(r=>r.city===ctx.city&&r.from===row.from&&r.to===row.to
    &&r.adults===people&&r.rooms===1&&r.currency==='EUR'
    &&Number.isSafeInteger(r.searchTotalCents)&&r.searchTotalCents>=0
    &&r.bookingConfirmed===false&&r.roomBedsConfirmed===false
    &&r.mandatoryFeesConfirmed===false&&r.cancellationConfirmed===false
    &&r.pointStatus==='provider_reported_unverified'
    &&/^https:\/\/www\.booking\.com\/hotel\//.test(r.url??''))
    .map(r=>({...r,perPersonNightCents:Math.round(r.searchTotalCents/(people*nights))}));
  const within=all.filter(r=>r.perPersonNightCents<=target);
  let visible=ctx.providerOnlyBudget?within:all;
  const sort=['price','rating','name'].includes(ctx.providerSort)?ctx.providerSort:'price';
  visible=[...visible].sort((a,b)=>
    sort==='rating'?((b.ratingOnTen??-1)-(a.ratingOnTen??-1)
      ||a.searchTotalCents-b.searchTotalCents)
    :sort==='name'?a.name.localeCompare(b.name,'de')
    :a.searchTotalCents-b.searchTotalCents||a.name.localeCompare(b.name,'de'));
  return {city:row.city,from:row.from,to:row.to,people,nights,
    observedOn:source.observedOn,all,within,visible,sort,
    targetCents:target,lowest:all.length?Math.min(...all.map(x=>x.searchTotalCents)):null};
}

export function providerQuotePanel(ctx) {
  const m=providerQuoteModel(ctx);
  if(!m)return '';
  const renderCard=r=>'<article class="provider-quote-card">'
    +'<div class="provider-quote-head"><strong>'+esc(r.name)+'</strong>'
    +(r.ratingOnTen==null?'<small>Bewertung offen</small>'
      :'<small>Booking.com '+esc(String(r.ratingOnTen).replace('.',','))+'/10</small>')+'</div>'
    +'<div class="provider-quote-price"><strong>'+money(r.searchTotalCents)+'</strong>'
    +'<span>'+money(r.perPersonNightCents)+' p. P./Nacht · Suchwert</span></div>'
    +'<p>'+esc(r.address??'Anbieteranschrift offen')
    +' · Standort nur vom Anbieter gemeldet, nicht unabhängig geprüft</p>'
    +'<div class="provider-quote-foot"><small>Zimmer/Betten, Pflichtgebühren, Storno und 2027-Checkout nicht bestätigt</small>'
    +urlLink(r.url,'Angebot öffnen')+'</div></article>';
  const first=m.visible.slice(0,4),rest=m.visible.slice(4);
  return '<section class="section panel panel-pad provider-quote-panel" aria-label="Aktuelle Anbieter-Suchwerte für eure Reisedaten">'
    +'<header class="provider-quote-heading"><div><h2>Neue Unterkunfts-Suchwerte · September 2027</h2>'
    +'<p>Recherche vom '+esc(m.observedOn)+' · '+esc(m.from)+' bis '+esc(m.to)
    +' · '+m.nights+' Nächte · '+m.people+' Erwachsene · ein Zimmer als Suchkonfiguration</p></div>'
    +'<span class="provider-quote-tag">Keine Buchung</span></header>'
    +'<div class="provider-quote-metrics"><div><strong>'+m.all.length+'</strong><small>Anbieter-Suchergebnisse</small></div>'
    +'<div><strong>'+(m.lowest==null?'–':money(m.lowest))+'</strong><small>Niedrigster Gruppensuchwert</small></div>'
    +'<div><strong>'+m.within.length+'</strong><small>Im selbst gesetzten Nachtbudget, rein rechnerisch</small></div></div>'
    +'<div class="provider-quote-controls">'
    +chip('provider-budget','Nur rechnerisch im Nachtbudget',!!ctx.providerOnlyBudget,'toggle')
    +'<label>Sortieren <select id="provider-quote-sort" aria-label="Anbieter-Suchergebnisse sortieren">'
    +[['price','Niedrigster Suchwert'],['rating','Booking.com-Bewertung'],['name','Name']]
      .map(([value,label])=>'<option value="'+value+'"'+(value===m.sort?' selected':'')+'>'+label+'</option>').join('')
    +'</select></label></div>'
    +'<p class="provider-quote-notice">Diese Preise stammen aus einer datierten Anbieter-Suche, nicht aus einem abgeschlossenen Checkout. Es fehlen Nachweise für ein geeignetes Zimmer und drei Betten, die endgültigen Gebühren, Steuern und Stornobedingungen. Die Angebote wurden weder ausgewählt noch zu deinen Reisekosten addiert.</p>'
    +'<div class="provider-quote-grid">'+first.map(renderCard).join('')+'</div>'
    +(rest.length?'<details class="provider-quote-more"><summary>'+rest.length
      +' weitere Anbieter-Suchergebnisse vergleichen</summary><div class="provider-quote-grid">'
      +rest.map(renderCard).join('')+'</div></details>':'')
    +(m.visible.length===0?'<p>Keine Suchergebnisse innerhalb des gewählten Nachtbudgets. Filter zurücksetzen.</p>':'')
    +'</section>';
}
