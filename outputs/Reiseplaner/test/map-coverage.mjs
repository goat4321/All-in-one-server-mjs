import { loadCatalog } from '../lib/catalog.mjs';
import { explorerData, explorerCategory } from '../public/map-explorer.mjs';

const catalog = await loadCatalog();
const fields = ['activity', 'food', 'shop', 'lodging', 'transport'];
const report = [];
for (const trip of catalog.trips) {
  for (const city of new Set(trip.route)) {
    const data = explorerData(trip.items, trip, {city});
    const placed = data.placed;
    const all = [...data.placed, ...data.unlocated];
    const counts = Object.fromEntries(fields.map(group=>[group, all.filter(i=>explorerCategory(i)===group).length]));
    const pricesKnown = all.filter(i=>Number.isSafeInteger((i.effectivePrice??i.price)?.cents)).length;
    const hoursKnown = all.filter(i=>Array.isArray(i.hours) || Boolean(i.weekly?.hours) || Boolean(i.openingHoursNote)).length;
    const missingGeography = all.filter(i=>!placed.some(x=>x.id===i.id)).map(i=>i.name).slice(0,7);
    report.push({
      variant: trip.id, city, total: all.length, pins: placed.length, withoutExactPoint: data.unlocated.length,
      priceReferences: pricesKnown, hoursReferences: hoursKnown,
      ...counts, examplesMissingGeography: missingGeography,
      stale2027Departures: true,
    });
  }
}
const payload={generatedAt:new Date().toISOString().slice(0,10),
  rule:'Only catalogued candidates, placed pins require actual POI/station coordinates. Missing costs/hours are unknown, not free or 24h. Transit GTFS validity assessed separately.',
  travelVariants:catalog.trips.length, cityRows:report.length,
  totals:{items:report.reduce((a,b)=>a+b.total,0),pins:report.reduce((a,b)=>a+b.pins,0),
    withoutExactPoint:report.reduce((a,b)=>a+b.withoutExactPoint,0)},
  coverage:report};
if(process.argv.includes('--json'))console.log(JSON.stringify(payload,null,2));
else {
  console.log('Variant | Ort | Alle | Punkte | ohne genauen Punkt | Preis-Referenz | Öffnungs-Referenz | Hotel | Essen | Einkauf | Aktivität | Bahn');
  for(const x of report)console.log([x.variant,x.city,x.total,x.pins,x.withoutExactPoint,
    x.priceReferences,x.hoursReferences,x.lodging,x.food,x.shop,x.activity,x.transport].join(' | '));
  console.log('Summe für 4 getrennte Katalogvarianten:',JSON.stringify(payload.totals));
}
