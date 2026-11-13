import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { explorerData, externalTransitUrl } from '../public/map-explorer.mjs';
import { googleMapsSearchUrl, googleMapsDirectionsUrl, googleMapsSearchLabel, googleMapsLocationStatus } from '../public/google-maps.mjs';

const catalog = await loadCatalog();

test('All catalog items (including every formerly unlocated option) have a Google Maps lookup URL', () => {
  const totals = {all:0,missing:0};
  for (const trip of catalog.trips) {
    const items=explorerData(trip.items,trip);
    const applicable=[...items.placed,...items.unlocated];
    for (const item of applicable) {
      const url=googleMapsSearchUrl(item,catalog.cities);
      assert.ok(url?.startsWith('https://www.google.com/maps/search/?api=1&query='), item.id);
      assert.ok(url.length < 2048,item.id);
      assert.ok(googleMapsSearchLabel(item).length > 0);
      assert.ok(googleMapsLocationStatus(item).length > 0);
    }
    totals.all+=applicable.length;
    totals.missing+=items.unlocated.length;
  }
  assert.ok(totals.all >= 534, 'Prüft sämtliche Reisevarianten einschließlich aller vorherigen Lückeneinträge');
  assert.equal(totals.all - totals.missing > 0, true, 'Bestehende und später belegte Punkte bleiben erhalten');
});

test('External Google Maps routes work with only a name and/or postal address, not just exact pins', () => {
  const from={id:'a',kind:'activity',name:'Café B',city:'paris',address:'13 Rue de Paradis, Paris',point:null};
  const to={id:'b',kind:'activity',name:'Musée d’Orsay',city:'paris',point:null};
  const url=googleMapsDirectionsUrl(from,to,catalog.cities,'transit');
  assert.ok(url.includes('travelmode=transit'));
  assert.ok(url.includes('Rue%20de%20Paradis'));
  assert.ok(url.includes('Mus%C3%A9e%20d%E2%80%99Orsay'));
  assert.equal(externalTransitUrl(from,to,catalog.cities),url);
  assert.match(googleMapsDirectionsUrl(null,to,catalog.cities,'transit'), /destination=.*&travelmode=transit/);
  assert.ok(googleMapsDirectionsUrl(from,to,catalog.cities,'walking').endsWith('travelmode=walking'));
  assert.equal(googleMapsDirectionsUrl(from,null,catalog.cities),null);
});

test('Airbnb never receives a fake exact property pin in Google Maps', () => {
  const property=catalog.trips.find(x=>x.id==='interrail_classic').items
    .find(x=>x.id==='wishlist:airbnb:1756625931068998576');
  assert.ok(property);
  assert.equal(property.point,null);
  assert.match(googleMapsSearchLabel(property),/Umgebung/);
  assert.match(googleMapsLocationStatus(property),/kein exakter/);
  const url=decodeURIComponent(googleMapsSearchUrl(property,catalog.cities));
  assert.ok(/Paris/.test(url));
  assert.ok(!url.includes(property.name),'Must not imply exact property location');
});
