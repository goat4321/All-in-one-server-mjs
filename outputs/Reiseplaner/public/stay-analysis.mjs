import { groupPrice } from './model.mjs';
import { reviewProgress } from './verification.mjs';

// A claimed kitchen is not automatically a usable kitchen. Unknown, negated
// and unverified text must not pass a "with kitchen" filter.
export function kitchenAccess(item) {
  if (['shared','private'].includes(item?.kitchenMode)) return 'usable';
  if (item?.kitchenMode === 'limited') return 'limited';
  const text=String(item?.kitchen??'').toLowerCase();
  if (!text || /offen|unbekannt|ungeklärt|nicht bestätigt|keine küche|no kitchen|without kitchen/.test(text))
    return 'unknown';
  return /gemeinschaftsküche|küchenzeile|küche zur nutzung|kitchenette|shared kitchen|self.cater/.test(text)
    ? 'usable':'unknown';
}

// No non-EUR amount is silently converted. Walking time is shown separately;
// it is never invented as a euro cost.
export function assessStay(item, people, stationWalk, selfReview = null) {
  if (item?.kind !== 'lodging' || !Array.isArray(people) || !people.length)
    throw new Error('Ungültiger Unterkunftsvergleich.');
  const price = item.effectivePrice ?? item.price;
  const total = price?.currency === 'EUR' && (price.party==null||price.party===people.length)
    ? groupPrice(price, people.length) : null;
  const from = item.stayFrom, to = item.stayTo;
  const days = from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)
    ? Math.round((Date.parse(to+'T12:00:00Z') - Date.parse(from+'T12:00:00Z'))/86400000):null;
  const nights = days && days > 0 ? days : null;
  const perPersonNight = total != null && nights ? Math.round(total/(nights*people.length)) : null;
  const check = reviewProgress('lodging', selfReview, people.length);
  const hasBeds = Boolean(selfReview?.checks?.beds && selfReview?.groupSize===people.length);
  const risk = [];
  if (!nights) risk.push('Aufenthaltsdauer ungeklärt');
  if (total == null) risk.push('Gesamtpreis oder EUR-Umrechnung fehlt');
  if (!hasBeds) risk.push('Betten für aktuelle Gruppengröße nicht bestätigt');
  if (!selfReview?.checks?.taxes) risk.push('Steuern/Pflichtgebühren nicht vollständig geprüft');
  if (!selfReview?.checks?.cancellation) risk.push('Stornobedingungen fehlen');
  if (!selfReview?.checks?.checkout) risk.push('Finaler Zimmer-Checkout fehlt');
  const walk = Number.isFinite(stationWalk?.minutes) ? Math.ceil(stationWalk.minutes) : null;
  if (walk == null) risk.push('Bahnhof-Fußweg nicht berechnet');
  if (kitchenAccess(item) === 'unknown') risk.push('Küche nicht geklärt');
  const completeness = 100 - Math.round(risk.length/8 * 100);
  return { id:item.id, name:item.name, nights, people:people.length, totalEuroCents:total,
    personNightEuroCents:perPersonNight, stationWalkMinutes:walk,
    estimatedReturnWalkPerDay:walk==null?null:walk*2,
    bedsVerified:hasBeds, review:check, risk, completeness,
    checkoutVerifiedByProvider:false,
    quoteObservedOn:item.quote?.observedOn ?? null, booked: Boolean(item.booked),
    priceOrigin:item.price?.label ?? 'Preisursprung offen',
  };
}

export function sortStayOptions(items, people, walks, reviews, mode = 'source') {
  const copy=[...items];
  if(['total','price'].includes(mode)) copy.sort((a,b)=>
    (assessStay(a,people,walks[a.id],reviews[a.id]).totalEuroCents??Infinity)
    - (assessStay(b,people,walks[b.id],reviews[b.id]).totalEuroCents??Infinity)
    || a.name.localeCompare(b.name,'de'));
  if(mode==='station') copy.sort((a,b)=>
    (assessStay(a,people,walks[a.id],reviews[a.id]).stationWalkMinutes??Infinity)
    - (assessStay(b,people,walks[b.id],reviews[b.id]).stationWalkMinutes??Infinity)
    || a.name.localeCompare(b.name,'de'));
  if(mode==='documentation') copy.sort((a,b)=>
    assessStay(b,people,walks[b.id],reviews[b.id]).completeness
    - assessStay(a,people,walks[a.id],reviews[a.id]).completeness
    || a.name.localeCompare(b.name,'de'));
  return copy;
}
