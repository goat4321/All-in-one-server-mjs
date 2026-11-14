import {groupPrice,money} from './model.mjs';
import {lodgingPriceInsight} from './price-insights.mjs';

// A flexible/missing time remains unknown; no invented itinerary time.
export function dayPeriod(time) {
  const match=/^([01]\\d|2[0-3]):[0-5]\\d$/.exec(String(time??''));
  if(!match)return null;
  const hour=Number(match[1]);
  if(hour<5)return {key:'night',title:'Nacht',icon:'moon'};
  if(hour<11)return {key:'morning',title:'Morgen',icon:'sun'};
  if(hour<14)return {key:'lunch',title:'Mittag',icon:'food'};
  if(hour<18)return {key:'afternoon',title:'Nachmittag',icon:'compass'};
  return {key:'evening',title:'Abend',icon:'moon'};
}

// The only meaning of a currency symbol is a relative tier inferred from a
// sourced, comparable amount. It is NOT a market rating or 2027 final quote.
const tierFor=(value,thresholds) => !Number.isFinite(value)||value<0?'€?'
  :value===0?'0 €':value<thresholds[0]?'€':value<thresholds[1]?'€€':'€€€';
const unknown=(amount='Preis offen',note='Kein vergleichbarer EUR-Preis vorhanden')=>({
  tier:'€?',amount,known:false,note,basis:'unknown',currency:null,
});

function lodgingSignal(item,people){
  const ref=lodgingPriceInsight(item,people);
  const newer=item.researchV20?.lastSearch;
  const useNewer=Boolean(newer&&newer.currency==='EUR'
    &&newer.guests===people && Number.isSafeInteger(newer.totalCents)
    &&newer.totalCents>=0 && ref?.nights>0);
  const total=useNewer?newer.totalCents:ref?.groupTotalCents;
  const currency=item.price?.currency??item.quote?.sampleCurrency??null;
  if(total==null || !ref?.nights){
    return unknown(currency && currency!=='EUR'?'Preis in '+currency+' · EUR-Vergleich offen':'Preis pro Nacht offen',
      'Unterkunft: Gruppensumme, Belegung, Nächte oder vergleichbare Währung fehlen. Keine erfundene Stufe.');
  }
  const perNight=total/(people*ref.nights*100);
  const source=useNewer?'Booking-Anbietersuche '+newer.observedOn+' (nicht finaler Checkout)'
    :ref.isSample?'Früherer Wunschlistenpreis · Suchdaten können abweichen'
    :'Historischer Hotel-/Plan- oder Suchpreis; nicht finaler Checkout';
  const amount=money(total,'EUR')+' Gruppe · '+money(Math.round(total/(people*ref.nights)),'EUR')+' p. P./Nacht';
  // Wishlist samples can refer to different dates or party constraints.
  if(ref.isSample){
    return {tier:'€?',amount,known:false,note:source+'; nicht als Preisstufe für diesen Aufenthalt vergleichbar',
      basis:'historical_sample',currency:'EUR'};
  }
  const tier=tierFor(perNight,[30,60]);
  return {tier,amount,known:true,basis:'person_night',currency:'EUR',
    note:source+' · € unter 30 €, €€ 30–unter 60 €, €€€ ab 60 € je Person/Nacht. '
      +perNight.toLocaleString('de-DE',{maximumFractionDigits:2})
      +' € je Person/Nacht; weder Marktpreiswertung noch bestätigte Buchung.'};
}

function menuReferenceSignal(item){
  const ref=item.menuPriceResearchV08?.menuReference;
  if(!ref?.sample?.length)return null;
  // One drink, single snack, retailed item or one entree never equals a
  // complete restaurant meal. Only explicit menu packages earn a € tier.
  const full=ref.sample.filter(x=>['fixed_menu','delivery_complete_menu','group_menu_per_person'].includes(x.kind)
    &&Number.isSafeInteger(x.amountCents)&&x.amountCents>=0);
  const any=ref.sample.filter(x=>Number.isSafeInteger(x.amountCents)&&x.amountCents>=0);
  if(!any.length)return null;
  const cheapest=any.reduce((a,b)=>a.amountCents<=b.amountCents?a:b);
  if(!full.length)return unknown('ab '+money(cheapest.amountCents)+' pro Artikel',
    'Belegter Einzelartikel ('+cheapest.name+'), aber kein vollständiger Mahlzeiten-Endpreis. '
    +'Quelle '+ref.dateLabel+' · Gebühren/Getränke/2027 offen.');
  const sample=full.reduce((a,b)=>a.amountCents<=b.amountCents?a:b);
  const each=sample.amountCents/100;
  return {tier:tierFor(each,[15,35]),
    amount:'Menübeispiel '+money(sample.amountCents)+' p. P.',
    known:true,basis:'published_menu_example',currency:'EUR',
    note:'Veröffentlichtes Menüpaar/Komplettangebot: '+sample.name+' · '+ref.dateLabel
      +' · kein garantierter Restaurant-Endpreis; Getränke/Service/2027 prüfen.'};
}

// Unified price display for both legacy and survey-first items.
// Tiers: food <15/<35 EUR per person; activity <10/<40 EUR per person;
// transport <20/<70 EUR per person; lodging <30/<60 EUR per person/night.
// CHF references are shown as CHF without a fabricated EUR conversion.
export function planCostSignal(item,count) {
  const people=Number.isInteger(count)&&count>0?count:1;
  if(item?.kind==='lodging')return lodgingSignal(item,people);
  const price=item?.effectivePrice??item?.price;
  const total=price?.currency==='EUR'?groupPrice(price,people):null;
  if(Number.isSafeInteger(total) && total>=0){
    const each=total/people/100;
    const thresholds=item.category==='food'?[15,35]
      :item.kind==='transport'?[20,70]:[10,40];
    const tier=tierFor(each,thresholds);
    const fact=item.researchV20;
    const validFrom=fact?.priceKind==='published_2027'
      ?'Offiziell publizierter 2027-Tarif, Berechtigung/Zeitslot prüfen'
      :fact?.priceKind==='current_tariff_not_2027_guaranteed'
        ?'2026er veröffentlichter Tarif, 2027 erneut prüfen'
        :price.label??'Historischer Plan-/Suchwert, nicht bestätigt';
    return {tier,amount:money(total,'EUR')+' Gruppe',known:true,
      basis:'group_reference',currency:'EUR',
      note:validFrom+' · '+each.toLocaleString('de-DE',{maximumFractionDigits:2})
      +' € je Person, relative Stufe; keine bestätigte Zahlung.'};
  }
  const ref=item?.researchV20?.priceReference;
  if(ref?.amountCents!=null&&ref.currency==='CHF'){
    return unknown('ab '+money(ref.amountCents,'CHF')+' Referenz',
      'Schweizer Tarif/ab-Preis; Ticketumfang und 2027er Endbetrag offen. '
      +'Keine CHF-zu-EUR-Umrechnung, daher €?.');
  }
  if(price?.cents!=null && price.currency!=='EUR'){
    const currency=price.currency??'fremder Währung';
    return unknown(money(price.cents,currency)+' Referenz',
      'Nicht in EUR umrechenbar ohne datierten Wechselkurs und gültigen Preisumfang.');
  }
  if(item?.researchV20?.priceKind==='conditional')
    return unknown('Bedingt kostenlos',
      'Freier Eintritt nur mit entsprechendem Alters-/EWR-Nachweis; kein pauschaler 0-€-Preis.');
  const menu=menuReferenceSignal(item);
  return menu??unknown();
}
