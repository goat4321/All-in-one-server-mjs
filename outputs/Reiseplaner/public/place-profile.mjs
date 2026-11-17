import { groupPrice, money } from './model.mjs';
import { explorerCategory, explorerDetail } from './map-explorer.mjs';
import {markerProvenance,hasIndependentPointEvidence} from './poi-location-provenance.mjs';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel, googleMapsLocationStatus } from './google-maps.mjs';
import { esc, sourceList, urlLink } from './ui.mjs';
import { curatedPlacePhoto,curatedCityBackdrop } from './curated-place-photos.mjs';
import {commonsDefaultQuery,commonsWebSearchUrl} from './commons-photo-search.mjs';
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
  if(item.discoveryV54||item.discoveryV55||item.discoveryV60||item.discoveryV61||item.discoveryV62){
    const o=item.discoveryV62??item.discoveryV61??item.discoveryV60??item.discoveryV54??item.discoveryV55;
    facts.push(['Geprüfte Betreiberquelle',o.checkedOn+' · Originalangaben, keine Reservierung']);
    facts.push(['Preisreferenz',o.priceReference
      +(o.priceYear==='published_2027_reference'
        ?' · veröffentlichter Tarif ab 2027, konkreten Reisetag prüfen'
        :' · historischer Quellenstand, September 2027 offen')]);
    facts.push(['Veröffentlichte Öffnungszeiten',o.openingReference+' · Reisetag 2027 erneut prüfen']);
    if(o.publishedSeason2027)facts.push(['Betreiber-Saison 2027 veröffentlicht','Allgemeine Saisonzeiten publiziert; Wetter, Tagesöffnung und Ticket noch nicht garantiert']);
    if(o.accessCaution)facts.push(['Anreise / Lage',o.accessCaution]);
    if(o.visitorGuide){
      facts.push(['Sehenswert',o.visitorGuide.highlights.join(' · ')]);
      facts.push(['Praktische Besuchsplanung',o.visitorGuide.visitTip]);
      facts.push(['Kombinierbar mit',o.visitorGuide.combineWith]);
      facts.push(['Anreise und Eingang',o.visitorGuide.arrivalTip]);
      facts.push(['Vor Reisebeginn 2027 prüfen',o.visitorGuide.check2027]);
    }
    if(o.published2027Period)facts.push(['Veröffentlichtes allgemeines Saisonfenster 2027',
      o.published2027Period+' · Wetter/Sonderregelungen und tatsächlichen Reisetag prüfen']);
    facts.push(['Karten- und Quellenstatus',o.locationPrecision==='independent_public_poi_area_only'
      ?'Unabhängiger POI-Gebietspunkt, kein gesicherter Eingang'
      :'Offizielle Postadresse vorhanden; individuelle GPS-Koordinate nicht bestätigt']);
  }
  if(item.lastCityGuideV79){
    const g=item.lastCityGuideV79;
    facts.push(['Neu: konkret recherchierter Ort',g.summary]);
    facts.push(['Anreise / Betreiberadresse',g.address]);
    facts.push(['Öffnung / Ankunft · Quellenstand',g.opening]);
    facts.push(['Preisreferenz · kein 2027-Checkout',g.price]);
    facts.push(['Besuchs- und Übernachtungsbedingungen',g.requirements]);
    facts.push(['September 2027 überprüfen',g.check2027]);
    facts.push(['Belegtyp',g.sourceType==='municipality'?'Stadtverwaltung'
      :g.sourceType==='park'?'Offizielle Parkverwaltung'
        :g.sourceType==='operator'?'Originalanbieter':'Tourismusamt']);
  }
  if(item.sourceConflictV79){
    const c=item.sourceConflictV79;
    facts.push(['Quellenwiderspruch',c.issue]);
    facts.push(['Nächster Prüfschritt',c.action]);
  }
  if(item.venueSourceV78){
    const g=item.venueSourceV78;
    facts.push(['Neue Orts-/Unterkunftsrecherche',g.title]);
    facts.push(['Anfahrt / veröffentlichte Adresse',g.arrival]);
    facts.push(['Öffnung / Check-in · Quellenstand',g.hours]);
    facts.push(['Preisstand / Tarifgültigkeit',g.price+' · keine bestätigte Einzelbuchung September 2027']);
    facts.push(['Bedingungen / mögliche Zusatzkosten',g.caution]);
    facts.push(['Weiter zu prüfen',g.notes]);
    facts.push(['Quelle und Verifizierung',g.checkedOn+' · '+(g.sourceType==='operator'
      ?'Originalanbieter':g.sourceType==='tourism'?'Tourismusbüro':'Redaktionelle Drittquelle')
      +' · kein aktueller Checkout']);
  }
  if(item.venueIdentityReviewV78){
    const c=item.venueIdentityReviewV78;
    facts.push(['Achtung: Eintrag und Anbieter nicht sicher identisch',c.issue]);
    facts.push(['Identität vor der Buchung / Anreise klären',c.nextAction]);
  }
  if(item.officialVenueV77){
    const g=item.officialVenueV77;
    if(g.status==='closed_reopening_unknown')
      facts.push(['Wichtiger Zugangsstatus','Derzeit laut Quelle geschlossen – Wiedereröffnung bis September 2027 NICHT bestätigt']);
    if(g.status==='event_date_unconfirmed')
      facts.push(['Veranstaltungsstatus','Keine bestätigte Veranstaltung an eurem konkreten Reisetag']);
    facts.push(['Betreiber-/Tourismusangabe · Ort',g.summary]);
    facts.push(['Veröffentlichte Besucheradresse (kein GPS-Beleg)',g.address]);
    facts.push(['Betreiberzeiten / Veranstaltungszeiten',g.opening]);
    facts.push(['Eintritt / historische Preise',g.price+' · kein bestätigter Gruppenpreis September 2027']);
    facts.push(['Hinweise und offene Fragen',g.conditions]);
    facts.push(['Geprüfter Quellenstand',g.checkedOn+' · kein Live-Checkout']);
  }
  if(item.mapsSearchV77?.hint){
    facts.push(['Google Maps · Suchziel',item.mapsSearchV77.hint
      +' · Ortskarte in Google öffnen, kein verifizierter Google Place ID']);
  }
  if(item.cityGuideV76){
    const g=item.cityGuideV76;
    if(g.scope==='object'){
      facts.push(['Ortsrecherche · Sehenswert',g.focus]);
      facts.push(['Ortsrecherche · Anreise',g.access]);
      facts.push(['Veröffentlichte Öffnung / Saison',g.opening+' · 2027 erneut prüfen']);
      facts.push(['Veröffentlichte Kostenreferenz',g.cost+' · nicht automatisch im Budget']);
      facts.push(['Hinweise / Sicherheit',g.caution]);
      facts.push(['Vor dem Besuch 2027',g.check2027]);
      facts.push(['Quellenbeleg','Objektbezogene Betreiber-/Tourismusquelle vom '+g.checkedOn]);
    }else{
      facts.push(['Städtische Reiseorientierung',g.focus]);
      facts.push(['Allgemeine Anreisehinweise',g.access]);
      facts.push(['Quellenumfang','Nur Stadtinformation, kein konkreter Nachweis für diesen Anbieter oder Ort']);
    }
  }
  if(item.swissGuideV75){
    const g=item.swissGuideV75;
    facts.push(['Schweiz · Einordnung',g.summary]);
    facts.push(['Schweiz · Anreise / Einstieg',g.access]);
    if(g.duration)facts.push(['Schweiz · Besuchszeit / Weg',g.duration]);
    facts.push(['Schweiz · Kosten',g.cost]);
    facts.push(['Schweiz · Wetter / Sicherheit',g.caution]);
    facts.push(['Schweiz · Vorbereitung für 2027',g.check2027]);
    facts.push(['Quellenumfang Schweiz',g.sourceScope==='object'
      ?'Konkrete Betreiber-/Ortsreferenz vom '+g.checkedOn+'; für 2027 erneut prüfen'
      :'Nur regionale Orientierung vom '+g.checkedOn+'; KEIN Nachweis für dieses Hotel, Restaurant oder Angebot']);
  }
  if(item.publicPlaceGuideV68){
    const g=item.publicPlaceGuideV68.visitorGuide;
    if(![item.discoveryV54,item.discoveryV55,item.discoveryV60,
      item.discoveryV61,item.discoveryV62].some(x=>x?.visitorGuide)){
      facts.push(['Sehenswert',g.highlights.join(' · ')]);
      facts.push(['Praktische Besuchsplanung',g.visitTip]);
      facts.push(['Kombinierbar mit',g.combineWith]);
      facts.push(['Anreise und Eingang',g.arrivalTip]);
      facts.push(['Vor Reisebeginn 2027 prüfen',g.check2027]);
    }
    facts.push(['Zusätzliche Ortsrecherche',
      'Quellenstand '+item.publicPlaceGuideV68.checkedOn+
      ' · September 2027 nicht als geöffnet oder gebucht bestätigt']);
  }
  for(const access of [item.officialAccessV53,item.officialAccessV56,item.officialAccessV57,item.officialAccessV58].filter(Boolean)){
    facts.push(['Betreiber-/Quellenprüfung '+access.checkedOn,access.summary]);
    facts.push(['Zugang September 2027','Noch nicht unabhängig bestätigt']);
    if(access.september2027EventConfirmed===false)
      facts.push(['Konkrete Veranstaltung September 2027','Nicht bestätigt · vor Einplanung Betreiberprogramm prüfen']);
    if(access.publishedSeason2027)facts.push(['Saisoninformation für 2027 veröffentlicht',
      access.hoursReference+' · keine garantierte Tagesverfügbarkeit/Buchung']);
    if(access.priceReference)facts.push(['Historischer Betreiberpreis · nicht im Budget',access.priceReference]);
    if(access.hoursReference)facts.push(['Betreiber-Öffnung · 2027 prüfen',access.hoursReference]);
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
    providerUrl:item.website??null,
    secondaryProviderUrl:item.discoveryV62?.secondarySourceUrl
      ??item.discoveryV60?.secondarySourceUrl??null,
    guideSourceUrl:item.publicPlaceGuideV68?.sourceUrl??null,
    venueSourceUrl:item.officialVenueV77?.sourceUrl??null,
    v79SourceUrl:item.lastCityGuideV79?.sourceUrl??null,
    v79OtherSourceUrl:item.sourceConflictV79?.otherSourceUrl??null,
    v79Warning:item.sourceConflictV79?.issue??null,
    v78SourceUrl:item.venueSourceV78?.sourceUrl??null,
    v78SourceLabel:item.venueSourceV78?.sourceType==='operator'
      ?'Original-Betreiberinformation':item.venueSourceV78?.sourceType==='tourism'
        ?'Tourismusamt · Ortsinformation':'Redaktionelle Referenz · Zeiten prüfen',
    conflictReviewSourceUrl:item.venueIdentityReviewV78?.evidenceUrl??null,
    identityWarning:item.venueIdentityReviewV78?.issue??null,
    photoSearchUrl:!photos.length&&!isAirbnb&&item.kind==='activity'
      ?commonsWebSearchUrl(commonsDefaultQuery(item,ctx.cities)):null,
    operationalNotice:item.officialVenueV77?.status==='closed_reopening_unknown'
      ?'Derzeit geschlossen · Wiedereröffnung für September 2027 nicht bestätigt.'
      :item.officialVenueV77?.status==='event_date_unconfirmed'
        ?'Veranstaltung für den konkreten Reisetag 2027 noch nicht bestätigt.':null,
    cityDetailsUrl:item.cityGuideV76?.sourceUrl??null,
    cityDetailsLabel:item.cityGuideV76?.scope==='object'
      ?'Offizielle Orts-/Betreiberinformation':'Stadtportal (nur allgemeine Orientierung)',
    googleDetailsLinked:Boolean(item.cityGuideV76&&!isAirbnb),
    swissSourceUrl:item.swissGuideV75?.sourceUrl??null,
    swissSourceLabel:item.swissGuideV75?.sourceScope==='object'
      ?'Schweiz · Betreiber-/Ortsinformation':'Schweiz · regionale Besucherinformation (kein Angebotsnachweis)',
    photo:photos[0]??null,photos,ownPhotoCount:ownPhotos.length,
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
    + (p.operationalNotice?'<p class="place-profile-access-warning"><strong>Planungshinweis:</strong> '
      +esc(p.operationalNotice)+'</p>':'')
    + (p.identityWarning?'<p class="place-profile-access-warning"><strong>Identitätskonflikt:</strong> '
      +esc(p.identityWarning)+'</p>':'')
    + (p.v79Warning?'<p class="place-profile-access-warning"><strong>Quellenabgleich erforderlich:</strong> '
      +esc(p.v79Warning)+'</p>':'')
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
      +urlLink(p.maps,p.googleDetailsLinked
        ?'Google Maps · aktuelle Zeiten, Fotos und Bewertungen':googleMapsSearchLabel(item))
      +urlLink(p.route,'ÖPNV-Anreise in Google Maps')
      +urlLink(p.providerUrl,'Originalangebot / Anbieter')
      +(p.venueSourceUrl&&p.venueSourceUrl!==p.providerUrl
        ?urlLink(p.venueSourceUrl,'Veröffentlichte Betreiber-/Tourismusangaben'):'')
      +(p.v78SourceUrl&&p.v78SourceUrl!==p.providerUrl
        &&p.v78SourceUrl!==p.venueSourceUrl
        ?urlLink(p.v78SourceUrl,p.v78SourceLabel):'')
      +(p.v79SourceUrl&&p.v79SourceUrl!==p.providerUrl
        &&p.v79SourceUrl!==p.venueSourceUrl
        ?urlLink(p.v79SourceUrl,'Neue Orts-/Besucherquelle (Stand 2026)'):'')
      +(p.v79OtherSourceUrl&&p.v79OtherSourceUrl!==p.v79SourceUrl
        ?urlLink(p.v79OtherSourceUrl,'Abweichende Quelle · nicht ungeprüft übernehmen'):'')
      +(p.conflictReviewSourceUrl
        ?urlLink(p.conflictReviewSourceUrl,'Nur Gegenquelle prüfen · möglicherweise anderes Geschäft'):'')
      +(p.photoSearchUrl
        ?urlLink(p.photoSearchUrl,'Lizenzierte Fotos bei Wikimedia Commons suchen'):'')
      +urlLink(p.secondaryProviderUrl,'Weitere offizielle Besucherinformationen')
      +(p.guideSourceUrl&&p.guideSourceUrl!==p.providerUrl
        ?urlLink(p.guideSourceUrl,'Zusätzliche offizielle Ortsquelle'):'')
      +(p.cityDetailsUrl&&p.cityDetailsUrl!==p.guideSourceUrl
        &&p.cityDetailsUrl!==p.providerUrl
        ?urlLink(p.cityDetailsUrl,p.cityDetailsLabel):'')
      +(p.swissSourceUrl&&p.swissSourceUrl!==p.guideSourceUrl
        &&p.swissSourceUrl!==p.providerUrl
        ?urlLink(p.swissSourceUrl,p.swissSourceLabel):'')
      +'</div>'
    + (p.googleDetailsLinked&&!compact
      ?'<p class="muted place-profile-external-note">Google-Bewertungen, Fotos und Öffnungszeiten werden extern in Google Maps geöffnet. Kein Live-Abruf oder Speichern dieser Daten in der Website.</p>':'')
    + (compact?'':'<details class="place-profile-sources"><summary>Quellen und Aktualität</summary>'
      +'<p>'+esc(p.sourceStatus)+'</p>'
      +(p.geoSourceUrl?'<p><b>Geografische Referenz:</b> '
        +urlLink(p.geoSourceUrl,'Quelle zur Koordinate prüfen')+'</p>':'')
      +(p.geoSourceNote?'<p><b>Genauigkeit und Grenzen:</b> '+esc(p.geoSourceNote)+'</p>':'')
      +sourceList(item,ctx.catalog?.sources??{})+'</details>')
    + '</section>';
}
