import { groupPrice, money } from './model.mjs';
import { explorerCategory, explorerDetail } from './map-explorer.mjs';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel, googleMapsLocationStatus } from './google-maps.mjs';
import { esc, sourceList, urlLink } from './ui.mjs';

// Consistent, source-aware place facts. Missing information stays explicitly
// unknown; wishlist screenshots must never be promoted to bookable prices.
const labelByCategory = {
  lodging:'Unterkunft', food:'Restaurant / Café', shop:'Einkaufen',
  activity:'Sehenswürdigkeit / Aktivität',transport:'Verkehr',
};

export function placeProfileModel(item, ctx = {}) {
  if (!item || !item.id) return null;
  const people = Math.max(1, Number.isInteger(ctx.people?.length) ? ctx.people.length : 3);
  const detail = explorerDetail(item,people);
  const category = explorerCategory(item);
  const photo = ctx.state?.placePhotos?.[item.id] ?? null;
  const isAirbnb = item.provider === 'Airbnb' || String(item.id).startsWith('wishlist:airbnb:');
  const observed = item.quote?.observedOn ?? item.sampleQuote?.observedOn ?? null;
  const price = item.effectivePrice ?? item.price;
  const total = price && Number.isSafeInteger(price.cents) ? groupPrice(price, people) : null;
  const sample = item.quote?.sampleTotalCents ?? item.sampleQuote?.totalCents;
  const sampleValid = Number.isSafeInteger(sample) && sample >= 0;
  const sampleLabel = sampleValid ? money(sample, item.quote?.sampleCurrency ?? item.sampleQuote?.currency ?? 'EUR')
    + ' · früherer Suchwert, kein bestätigter Checkout' : null;
  const priceLabel = total == null ? sampleLabel ?? 'Preis offen'
    : money(total,price.currency)+' für '+people+' Personen · '+(price.label??'Plan-/Suchpreis');
  const rating = Number.isFinite(item.ratingDisplayed) && item.ratingDisplayed>=0 && item.ratingDisplayed<=5
    ? Number(item.ratingDisplayed).toFixed(2).replace('.',',')+' / 5 · ältere Airbnb-Anzeige, nicht live'
    : 'Keine belegte Bewertung';
  const facts = [
    ['Kategorie',labelByCategory[category]??'Ort'],
    ['Preis für die Gruppe',priceLabel],
    ['Bewertung',rating],
    ['Standort',googleMapsLocationStatus(item)],
    ['Öffnung / Ankunft',detail.hours],
  ];
  if(item.address) facts.push(['Öffentliche Adresse',item.address]);
  if(item.kind==='lodging') facts.push(
    ['Zimmer / Belegung',item.room || 'Zimmerart nicht bestätigt'],
    ['Betten',item.bedsDisplayed != null ? item.bedsDisplayed+' angezeigt · Belegung für Gruppe nicht bestätigt' : 'Nicht bestätigt'],
    ['Küche',typeof item.kitchen==='string'?item.kitchen:'Nicht bestätigt'],
    ['Privates Bad',item.bathroom === true?'Laut Quelle vorhanden':item.bathroom===false?'Laut Quelle nicht vorhanden':'Nicht bestätigt'],
    ['Storno',item.cancellation===true?'Laut Quelle möglich · Tarif prüfen':'Nicht bestätigt'],
    ['Pflichtgebühren',item.fees===true?'Laut Quelle eingeschlossen':'Nicht vollständig geprüft'],
    ['Check-in / Check-out',[item.checkInTime,item.checkOutTime].filter(Boolean).join(' / ')||'Nicht bestätigt'],
  );
  else if(item.kind==='activity')facts.push(
    ['Besuchsdauer',item.duration != null ? item.duration+' Min. · geplante Dauer':'Offen'],
    ['Beschreibung',item.detail||item.note||'Beschreibung noch offen'],
  );
  else if(item.kind==='transport')facts.push(
    ['Betreiber',item.operator||'Nicht bestätigt'],['Fahrplan 2027',item.verification||'Nicht bestätigt']);
  if(isAirbnb)facts.push(['Airbnb-Hausadresse','Privat – exakter Standort nicht veröffentlicht']);
  if(observed)facts.push(['Preis- / Quellenstand',observed+' · Änderungen bis 2027 möglich']);
  return {
    id:item.id,name:item.name,category,isAirbnb,description:detail.description,
    priceLabel,priceKnown:total!=null,sampleLabel,rating,observed,
    facts,details:detail.extra,sourceStatus:detail.sourceStatus,
    maps:googleMapsSearchUrl(item,ctx.cities),route:googleMapsDirectionsUrl(null,item,ctx.cities,'transit'),
    providerUrl:item.website??null,photo:photo && /^https:\/\//.test(photo.url??'') ? photo:null,
  };
}

// Only photos explicitly entered with source and credit are displayed.
// In particular no arbitrary provider listing is assumed to offer image reuse rights.
export function placeImageHtml(item,ctx={}, {small=false}={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  const type=p.facts[0][1];
  const label=esc(p.name);
  return '<div class="place-photo'+(small?' small':'')+'" data-photo-category="'+esc(p.category)+'">'
    + (p.photo
      ? '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(p.photo.url)
        +'" alt="Hinterlegtes Bild: '+label+'">'
        +'<small class="place-photo-credit">Bild: '+esc(p.photo.credit)+' · '
        +'<a href="'+esc(p.photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a></small>'
      : '<div class="place-photo-placeholder" aria-label="Noch kein quellenbelegtes Foto hinterlegt">'
        + '<span aria-hidden="true">'+({lodging:'⌂',food:'✦',shop:'◇',activity:'⌖',transport:'⇄'}[p.category]??'⌖')+'</span>'
        +'<strong>'+label+'</strong><small>'+esc(type)+' · Bildquelle offen</small></div>')
    +'</div>';
}

export function placePopupHtml(item,ctx={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  return '<div class="place-map-popup">'
    +placeImageHtml(item,ctx,{small:true})
    +'<div class="place-map-popup-body"><span class="place-profile-eyebrow">'+esc(p.facts[0][1])+'</span>'
    +'<strong>'+esc(p.name)+'</strong>'
    +'<p><b>Preis:</b> '+esc(p.priceLabel)+'</p>'
    +'<p><b>Bewertung:</b> '+esc(p.rating)+'</p>'
    +'<p class="muted">'+esc(p.isAirbnb?'Nur Umgebung bekannt':p.facts.find(x=>x[0]==='Standort')?.[1]??'')+'</p>'
    +'<div class="place-popup-actions"><button type="button" data-action="details" data-value="'+esc(p.id)+'">Details & Quellen</button>'
    +(['activity','lodging'].includes(item.kind)
      ?'<button type="button" data-action="vote-open" data-value="'+esc(p.id)+'">Gruppe bewerten</button>':'')
    +urlLink(p.maps,'Google Maps')+'</div></div></div>';
}

export function placeQuickFacts(item,ctx={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  return '<div class="place-quick-facts" aria-label="Wichtige Ortsdaten">'
    + '<span><strong>Preis</strong>'+esc(p.priceLabel)+'</span>'
    + '<span><strong>Bewertung</strong>'+esc(p.rating)+'</span>'
    + '<span><strong>Position</strong>'+esc(p.isAirbnb?'Nur ungefähr bekannt':p.facts.find(x=>x[0]==='Standort')?.[1]??'Offen')+'</span>'
    + '</div>';
}

export function placeProfileHtml(item,ctx={}, {compact=false}={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  const visible=compact?p.facts.slice(0,5):p.facts;
  return '<section class="place-profile'+(compact?' compact':'')+'" aria-label="Objektdetails: '+esc(p.name)+'">'
    + placeImageHtml(item,ctx,{small:compact})
    + '<div class="place-profile-top"><div><span class="place-profile-eyebrow">'+esc(p.facts[0][1])
    + '</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.description)+'</p></div></div>'
    + '<dl class="place-profile-facts">'+visible.map(([label,value])=>'<div><dt>'
      +esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'
    + (compact?'':'<details class="place-profile-more" open><summary>Zusätzliche Rechercheangaben ('+p.details.length+')</summary>'
      + (p.details.length?'<ul>'+p.details.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'
        :'<p>Weitere Angaben nicht belegt.</p>')+'</details>')
    + '<div class="place-profile-links">'
      +urlLink(p.maps,googleMapsSearchLabel(item))
      +urlLink(p.route,'ÖPNV-Anreise in Google Maps')
      +urlLink(p.providerUrl,'Originalangebot / Anbieter')
      +'</div>'
    + (compact?'':'<details class="place-profile-sources"><summary>Quellen und Aktualität</summary>'
      +'<p>'+esc(p.sourceStatus)+'</p>'+sourceList(item,ctx.catalog?.sources??{})+'</details>')
    + '</section>';
}
