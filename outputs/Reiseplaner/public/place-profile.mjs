import { groupPrice, money } from './model.mjs';
import { explorerCategory, explorerDetail } from './map-explorer.mjs';
import {markerProvenance,hasIndependentPointEvidence} from './poi-location-provenance.mjs';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel, googleMapsLocationStatus } from './google-maps.mjs';
import { esc, sourceList, urlLink } from './ui.mjs';
import { curatedPlacePhoto,curatedCityBackdrop } from './curated-place-photos.mjs';
import { planCostSignal } from './visual-experience.mjs';
import { entryCompleteness } from './entry-completeness.mjs';
import { icon } from './ui.mjs';

// Consistent, source-aware place facts. Missing information stays explicitly
// unknown; wishlist screenshots must never be promoted to bookable prices.
const labelByCategory = {
  lodging:'Unterkunft', food:'Restaurant / Café', shop:'Einkaufen',
  activity:'Sehenswürdigkeit / Aktivität',transport:'Verkehr',
};
const ccLicenseUrl=photo=>{
  if(/^https:\/\/[^\s]+$/.test(photo?.licenseUrl??''))return photo.licenseUrl;
  const label=String(photo?.credit??'');
  const match=label.match(/\bCC (BY-SA|BY) (2\.5|[234]\.0)\b/i);
  if(match)return 'https://creativecommons.org/licenses/'+match[1].toLowerCase()+'/'+match[2]+'/';
  return /\bCC0 1\.0\b/i.test(label)?'https://creativecommons.org/publicdomain/zero/1.0/':null;
};


export function placeProfileModel(item, ctx = {}) {
  if (!item || !item.id) return null;
  const people = Math.max(1, Number.isInteger(ctx.people?.length) ? ctx.people.length : 3);
  const detail = explorerDetail(item,people);
  const priceTier=planCostSignal(item,people);
  const category = explorerCategory(item);
  const saved=ctx.state?.placePhotos?.[item.id] ?? null;
  const ownPhotos=(Array.isArray(saved)?saved:saved?[saved]:[]).filter(p=>
    p && /^https:\/\//.test(p.url??'') && /^https:\/\//.test(p.sourceUrl??'')
    && typeof p.credit==='string' && p.credit.trim()).slice(0,5);
  const curated=curatedPlacePhoto(item);
  const photos=[...ownPhotos,...(curated?[curated]:[])];
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
    ['Preisstufe · relative Orientierung',priceTier.tier+' · '+priceTier.amount],
    ['Preis für die Gruppe',priceLabel],
    ['Bewertung',rating],
    ['Standort',googleMapsLocationStatus(item)],
    ['Koordinatenqualität',markerProvenance(item).label
      +(item.point&&!hasIndependentPointEvidence(item)?' · unabhängige Prüfung offen':'')],
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
  // User-uploaded 2026 research is preserved as a reference, not a bill.
  if(item.researchV50){
    const r=item.researchV50;
    facts.push(['Preis aus beigefügter Recherche',
      String(r.referencePrice??'Offen')+' '+String(r.currency??'')+
      ' · Nutzerangabe, nicht als 2027-Tarif geprüft']);
    facts.push(['Datenstand der Nutzerrecherche',
      String(r.checkDate??'Unbekannt')+' · Eigenangabe "'+
      String(r.claimedVerification??'ohne Status')+
      '", keine unabhängige Prüfung']);
  }
  const club=item.nightlifeOfficialV51;
  if(club){
    facts.push(['Betreiberregeln recherchiert',
      '15.11.2026 · keine bestätigte Veranstaltung für September 2027']);
    facts.push(['Einlassalter laut Betreiber',
      club.publishedEntranceAge===null?club.ageScope:
      'Ab '+club.publishedEntranceAge+' Jahren · '+club.ageScope]);
    if(club.publishedIdRequired)facts.push(['Ausweis',club.publishedIdRequired]);
    if(club.publishedDressCode)facts.push(['Kleidung / Einlassregeln',club.publishedDressCode]);
    if(club.admissionReference)facts.push(['Eintritt / Tickets',club.admissionReference]);
    if(club.programmeReference)facts.push(['Abendprogramm',club.programmeReference]);
    if(club.addressCaution)facts.push(['Adresskonflikt beim Anbieter',club.addressCaution]);
    if(club.publishedAddress)facts.push(['Veröffentlichte Betreiberadresse',
      club.publishedAddress+' · Eingang/Koordinate separat prüfen']);
  }
  if(item.discoveryV54){
    const o=item.discoveryV54;
    facts.push(['Geprüfte Betreiberquelle',o.checkedOn+' · Originalangaben, keine Reservierung']);
    facts.push(['Preisreferenz',o.priceReference
      +(o.priceYear==='published_2027_reference'
        ?' · veröffentlichter Tarif ab 2027, konkreten Reisetag prüfen'
        :' · historischer Quellenstand, September 2027 offen')]);
    facts.push(['Veröffentlichte Öffnungszeiten',o.openingReference+' · Reisetag 2027 erneut prüfen']);
    facts.push(['Karten- und Quellenstatus','Offizielle Postadresse vorhanden; individuelle GPS-Koordinate nicht bestätigt']);
  }
  if(item.officialAccessV53){
    const access=item.officialAccessV53;
    facts.push(['Betreiber-/Quellenprüfung '+access.checkedOn,access.summary]);
    facts.push(['Zugang September 2027','Noch nicht unabhängig bestätigt']);
    if(access.visitorAddress)facts.push(['Vom Betreiber genannte Besucheradresse',access.visitorAddress]);
  }
  if(item.researchV20?.type==='activity'){
    const review=item.researchV20;
    facts.push(['Aktualisierte Quellenprüfung',review.reviewedOn
      +' · '+review.reviewStatus.replaceAll('_',' ')]);
    if(review.condition)facts.push(['Zugang / Bedingungen',review.condition]);
    if(review.geoNote)facts.push(['Standortreferenz',review.geoNote]);
    if(review.priceReference?.amountCents!=null)
      facts.push(['Externer Tarif (nicht automatisch im Budget)',
        money(review.priceReference.amountCents,review.priceReference.currency)
        +' · '+review.priceReference.kind.replaceAll('_',' ')]);
    if(item.routeResearchV20)facts.push(['Veröffentlichter Wanderweg',
      item.routeResearchV20.distanceKm+' km · '+item.routeResearchV20.ascentM
      +' Höhenmeter · '+item.routeResearchV20.durationMinutes+' Min. · '
      +item.routeResearchV20.difficulty]);
  }
  if(item.researchV20?.type==='lodging'){
    const review=item.researchV20,latest=review.lastSearch;
    facts.push(['Erneute Unterkunftsprüfung',review.reviewedOn
      +' · '+review.reviewStatus.replaceAll('_',' ')]);
    if(latest)facts.push(['Neue Booking-Suchanzeige',
      money(latest.totalCents,latest.currency)+' für '+latest.guests
      +' Personen · '+latest.observedOn+' · keine Checkoutbestätigung']);
    if(latest && item.price?.cents!=null && latest.totalCents!==item.price.cents)
      facts.push(['Vorherige Suchanzeige',money(item.price.cents,item.price.currency)+' · historisch']);
    if(review.rateConflictNotice)facts.push(['Preisabweichung / anderes Zimmer möglich',review.rateConflictNotice]);
    if(review.pointConflict)facts.push(['Standortkonflikt',
      review.pointConflict.distanceMetres+' m zwischen zwei Quellen · vor Routenberechnung prüfen']);
    facts.push(['Noch zu verifizieren',review.pending.join('; ')]);
  }
  if(isAirbnb)facts.push(['Airbnb-Hausadresse','Privat – exakter Standort nicht veröffentlicht']);
  if(observed)facts.push(['Preis- / Quellenstand',observed+' · Änderungen bis 2027 möglich']);
  return {
    id:item.id,name:item.name,category,isAirbnb,description:detail.description,
    priceLabel,priceTier,priceKnown:total!=null,sampleLabel,rating,observed,
    facts,details:detail.extra,sourceStatus:detail.sourceStatus,
    geoSourceUrl:typeof item.geoEvidence?.url==='string'&&/^https:\/\//.test(item.geoEvidence.url)
      ?item.geoEvidence.url:null,
    geoSourceNote:item.geoEvidence?.note??null,
    maps:googleMapsSearchUrl(item,ctx.cities),route:googleMapsDirectionsUrl(null,item,ctx.cities,'transit'),
    providerUrl:item.website??null,photo:photos[0]??null,photos,ownPhotoCount:ownPhotos.length,
  };
}

/** Source-safe short image used by lightweight list and itinerary rows.
 * Full photo credit and direct source remain in the detailed place profile. */
export function placeThumbnailHtml(item,ctx={}) {
  const model=placeProfileModel(item,ctx);
  if(!model)return '';
  const symbol={lodging:'bed',food:'food',shop:'wallet',activity:'compass',transport:'train'}[model.category]??'pin';
  const background=model.photo?null:curatedCityBackdrop(item);
  const shown=model.photo??background;
  return '<span class="place-thumbnail" data-licensed="'+Boolean(model.photo)+'">'
    +'<span class="place-thumbnail-fallback" aria-hidden="true">'+icon(symbol)+'</span>'
    +(shown?'<img src="'+esc(shown.url)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt=""'
      +' title="'+esc(background?'Stadtmotiv (kein Objektfoto) · '+shown.credit:shown.credit)+'">':'')
    +'</span>';
}

// Only photos explicitly entered with source and credit are displayed.
// In particular no arbitrary provider listing is assumed to offer image reuse rights.
export function placeImageHtml(item,ctx={}, {small=false}={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  const type=p.facts[0][1];
  const label=esc(p.name);
  const background=curatedCityBackdrop(item);
  const symbol=({lodging:'⌂',food:'✦',shop:'◇',activity:'⌖',transport:'⇄'}[p.category]??'⌖');
  // The labeled backdrop is always behind the specific image and becomes
  // visible only when the main Wikimedia/provider image fails to load.
  const fallback='<div class="place-photo-placeholder'+(background?' photo-context':'')+'"'
    +' aria-label="'+(background?'Stadtmotiv, kein Foto dieses Eintrags':'Kein quellenbelegtes Foto')+'">'
    +(background?'<img class="place-context-image" src="'+esc(background.url)+'"'
      +' loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="">':'')
    +'<span aria-hidden="true">'+symbol+'</span>'
    +'<strong>'+label+'</strong><small>'+esc(background
      ?'Stadtmotiv · kein Foto dieses Eintrags':type+' · Bildquelle offen')+'</small></div>';
  const contextCredit=background?'<small class="place-photo-credit'
    +(p.photo?' context-backup-credit':'')+'">Stadtmotiv · '
    +'<a href="'+esc(background.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a> · '
    +esc(background.credit)+'</small>':'';
  return '<div class="place-photo'+(small?' small':'')+'" data-photo-category="'+esc(p.category)+'">'
    +fallback
    +(p.photo
      ?'<img loading="lazy" class="place-specific-photo" decoding="async"'
        +' referrerpolicy="no-referrer" src="'+esc(p.photo.url)
        +'" alt="Hinterlegtes Bild: '+label+'">'
        +'<small class="place-photo-credit place-specific-credit">Bild: '
        +esc(p.photo.credit)+' · <a href="'+esc(p.photo.sourceUrl)
        +'" target="_blank" rel="noopener noreferrer">Bildquelle</a>'
        +(ccLicenseUrl(p.photo)?' · <a href="'+esc(ccLicenseUrl(p.photo))
        +'" target="_blank" rel="noopener noreferrer">Lizenz</a>':'')+'</small>'
      :'')
    +contextCredit+'</div>';
}

export function placePopupHtml(item,ctx={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  return '<div class="place-map-popup">'
    +placeImageHtml(item,ctx,{small:true})
    +'<div class="place-map-popup-body"><span class="place-profile-eyebrow">'+esc(p.facts[0][1])+'</span>'
    +'<strong>'+esc(p.name)+'</strong>'
    +'<p><b>Preisstufe:</b> '+esc(p.priceTier.tier)+' · '+esc(p.priceTier.amount)+'</p>'
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
    + '<span><strong>Preisstufe</strong><span class="universal-euro-tier" title="'+esc(p.priceTier.note)+'">'+esc(p.priceTier.tier)+'</span> · '+esc(p.priceTier.amount)+'</span>'
    + '<span><strong>Preis</strong>'+esc(p.priceLabel)+'</span>'
    + '<span><strong>Bewertung</strong>'+esc(p.rating)+'</span>'
    + '<span><strong>Position</strong>'+esc(p.isAirbnb?'Nur ungefähr bekannt':p.facts.find(x=>x[0]==='Standort')?.[1]??'Offen')+'</span>'
    + '</div>';
}

export function placeGalleryHtml(item,ctx={}) {
  const profile=placeProfileModel(item,ctx);
  if(!profile||profile.photos.length<2)return '';
  return '<section class="place-gallery" aria-label="Bildergalerie: '+esc(profile.name)+'">'
    +'<div class="place-gallery-heading"><h4>Fotogalerie</h4><small>'
    +profile.photos.length+' Fotos mit einzelnen Quellenangaben</small></div>'
    +'<div class="place-gallery-grid">'+profile.photos.map((photo,index)=>
      '<figure class="place-gallery-item"><a href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer"'
      +' aria-label="Foto '+(index+1)+' von '+esc(profile.name)+' in groß öffnen">'
      +'<img src="'+esc(photo.url)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"'
      +' alt="Foto '+(index+1)+': '+esc(profile.name)+'"></a>'
      +'<figcaption>'+esc(photo.credit)+' · '
      +'<a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Bildquelle</a>'
      +(ccLicenseUrl(photo)?' · <a href="'+esc(ccLicenseUrl(photo))
        +'" target="_blank" rel="noopener noreferrer">Lizenztext</a>':'')
      +(index<profile.ownPhotoCount
        ?'<button type="button" class="place-gallery-remove" data-action="photo-remove-one" data-value="'
          +esc(JSON.stringify([profile.id,index]))+'">Eigenes Foto entfernen</button>'
        :'')+'</figcaption></figure>').join('')+'</div></section>';
}

export function placeProfileHtml(item,ctx={}, {compact=false}={}) {
  const p=placeProfileModel(item,ctx);
  if(!p)return '';
  const visible=compact?p.facts.slice(0,5):p.facts;
  const coverage=compact?null:entryCompleteness(item,ctx);
  return '<section class="place-profile'+(compact?' compact':'')+'" aria-label="Objektdetails: '+esc(p.name)+'">'
    + placeImageHtml(item,ctx,{small:compact})
    + (compact?'':placeGalleryHtml(item,ctx))
    + '<div class="place-profile-top"><div><span class="place-profile-eyebrow">'+esc(p.facts[0][1])
    + '</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.description)+'</p></div></div>'
    + '<dl class="place-profile-facts">'+visible.map(([label,value])=>'<div><dt>'
      +esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'
    + (compact?'':'<details class="place-profile-coverage"><summary>Was fehlt noch? · '
      +(coverage.gaps.length?coverage.gaps.length+' offene Prüfpunkte':'Keine weiteren Lücken nach Datenprüfung')
      +'</summary><div class="place-profile-gaplist">'
      +(coverage.gaps.length?coverage.gaps.map(g=>'<div><strong>'+esc(g.label)
        +'</strong><small>'+esc(g.next)+'</small></div>').join('')
        :'<p class="muted">Die hinterlegten Felder haben formale Angaben; '
        +'Tagesaktualität, Bildrechte und Buchungsbestätigung sind dadurch nicht automatisch bewiesen.</p>')
      +'</div></details>')
    + (compact?'':'<details class="place-profile-more" open><summary>Zusätzliche Rechercheangaben ('+p.details.length+')</summary>'
      + (p.details.length?'<ul>'+p.details.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'
        :'<p>Weitere Angaben nicht belegt.</p>')+'</details>')
    + '<div class="place-profile-links">'
      +urlLink(p.maps,googleMapsSearchLabel(item))
      +urlLink(p.route,'ÖPNV-Anreise in Google Maps')
      +urlLink(p.providerUrl,'Originalangebot / Anbieter')
      +'</div>'
    + (compact?'':'<details class="place-profile-sources"><summary>Quellen und Aktualität</summary>'
      +'<p>'+esc(p.sourceStatus)+'</p>'
      +(p.geoSourceUrl?'<p><b>Geografische Referenz:</b> '
        +urlLink(p.geoSourceUrl,'Quelle zur Koordinate prüfen')+'</p>':'')
      +(p.geoSourceNote?'<p><b>Genauigkeit und Grenzen:</b> '+esc(p.geoSourceNote)+'</p>':'')
      +sourceList(item,ctx.catalog?.sources??{})+'</details>')
    + '</section>';
}
