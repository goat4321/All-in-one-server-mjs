import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validateState,openStore} from '../lib/store.mjs';
import {loadCatalog} from '../lib/catalog.mjs';
import {
 marketProducts,cityChains,marketChainBasket,marketQuote,marketKey,marketUnitPrice,
 marketPriceOverrideValid,marketCurrency,marketObservations
} from '../public/market-basket-v86.mjs';
import {marketBasketPanel} from '../public/market-basket-ui-v86.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_swiss');
test('each of six Swiss-route cities has requested real chain labels and ten explicit product groups',()=>{
 assert.deepEqual(cityChains,{
  paris:['carrefour','monoprix','franprix'],
  barcelona:['mercadona','lidl-es','aldi-es'],
  sete:['carrefour','lidl-fr'],nice:['carrefour','lidl-fr'],
  kandersteg:['coop'],appenzell:['coop','migros']
 });
 assert.equal(marketProducts.length,10);
 for(const [city,stores] of Object.entries(cityChains)){
  for(const chain of stores){
   const basket=marketChainBasket(city,chain);
   assert.equal(basket.rows.length,10);
   assert.equal(basket.missing.length+basket.known,10);
   assert.equal(basket.complete,false,'A partial basket must never be advertised as cheapest');
   assert.equal(basket.totalCents,null);
   assert.equal(basket.currency,city==='appenzell'||city==='kandersteg'?'CHF':'EUR');
   assert.ok(basket.rows.every(row=>row.key.startsWith(city+':'+chain+':')));
  }
 }
});
test('pack price normalization, whole packs, currencies and source dates are consistent',()=>{
 const m=marketChainBasket('paris','monoprix');
 const s=m.rows.find(x=>x.id==='spaghetti');
 assert.equal(s.costCents,79);
 assert.deepEqual(s.unitPrice,{cents:158,per:'kg'});
 assert.equal(m.rows.find(x=>x.id==='rice').costCents,239);
 assert.equal(m.known,2);
 const a=marketChainBasket('barcelona','aldi-es');
 assert.equal(a.rows.find(x=>x.id==='spaghetti').costCents,75);
 assert.equal(a.rows.find(x=>x.id==='spaghetti').unitPrice.cents,150);
 const coop=marketChainBasket('kandersteg','coop');
 assert.equal(coop.rows.find(x=>x.id==='spaghetti').unitPrice.cents,120);
 assert.equal(coop.currency,'CHF');
 assert.deepEqual(marketUnitPrice(120,6,'pcs'),{cents:20,per:'Stück'});
 assert.throws(()=>marketUnitPrice(500,-1,'g'),/Ungültige/);
 for(const q of marketObservations){
  assert.match(q.sourceUrl,/^https:\/\//);
  assert.match(q.checkedOn,/^2026-11-/);
  assert.equal(q.cityVerified,false);
  assert.equal(q.available2027,false);
 }
});
test('editable quotes persist only for the chosen trip; invalid dates and currencies are rejected',()=>{
 const key=marketKey('barcelona','aldi-es','spaghetti');
 const item={name:'Eigene Preisprüfung',priceCents:70,packAmount:500,packUnit:'g',currency:'EUR',
  grade:'standard',checkedOn:'2026-11-20',sourceUrl:'https://www.aldi.es/producto/spaghetti-de-coccion-rapida-601669800.html',
  status:'manual_unverified'};
 assert.ok(marketPriceOverrideValid(item,'barcelona','aldi-es','spaghetti'));
 assert.equal(marketPriceOverrideValid({...item,currency:'CHF'},'barcelona','aldi-es','spaghetti'),false);
 assert.equal(marketPriceOverrideValid({...item,checkedOn:'nichts'},'barcelona','aldi-es','spaghetti'),false);
 assert.equal(marketPriceOverrideValid({...item,checkedOn:'2026-02-30'},'barcelona','aldi-es','spaghetti'),false);
 assert.equal(marketPriceOverrideValid({...item,checkedOn:'2027-01-01'},'barcelona','aldi-es','spaghetti'),false);
 assert.equal(marketPriceOverrideValid({...item,sourceUrl:'http://example.com'},'barcelona','aldi-es','spaghetti'),false);
 const state={...initialState(trip),marketQuotes:{[key]:item}};
 assert.doesNotThrow(()=>validateState(state,trip,[]));
 assert.equal(marketQuote('barcelona','aldi-es','spaghetti',state.marketQuotes).priceCents,70);
 const store=openStore(':memory:',{trips:[trip,...catalog.trips.filter(t=>t.id!==trip.id)]});
 try{
  store.save(trip.id,0,state);
  assert.equal(store.current(trip.id).state.marketQuotes[key].priceCents,70);
  assert.deepEqual(store.current('interrail_classic').state.marketQuotes,{});
  assert.throws(()=>store.save(trip.id,0,state),/anderen Fenster/);
 }finally{store.close();}
 assert.throws(()=>validateState({...state,marketQuotes:{[key]:{...item,currency:'CHF'}}},trip,[]),/Supermarkt/);
 assert.throws(()=>validateState({...state,marketQuotes:{'appenzell:coop:spaghetti':item}},trip,[]),/Supermarkt/);
});
test('market comparison HTML shows actual source status and does not mutate budget',()=>{
 const state=initialState(trip),before=structuredClone(state);
 const html=marketBasketPanel({city:'paris',trip,state,cities:catalog.cities});
 assert.match(html,/Monoprix/);
 assert.match(html,/Franprix/);
 assert.match(html,/10/);
 assert.match(html,/kein vollständiger Preisvergleich/i);
 assert.match(html,/Währung EUR/);
 assert.match(html,/Nationale Online-Referenz/);
 assert.match(html,/market-quote/);
 assert.match(html,/Produktbeleg/);
 assert.deepEqual(state,before);
});
