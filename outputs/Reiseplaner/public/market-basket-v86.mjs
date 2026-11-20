/** V86 - source-preserving supermarket comparison. All prices are documentary
 * national online observations, NOT verified city branches or September 2027.
 * No inferred missing quotes, implicit FX, or best-chain ranking on incomplete sets.
 */
export const marketProducts=[
 {id:'spaghetti',name:'Spaghetti',unit:'g',amount:500,grade:'Hartweizen, Standard'},
 {id:'rice',name:'Reis',unit:'g',amount:1000,grade:'Langkorn, ungekocht'},
 {id:'tomato',name:'Tomatensauce',unit:'ml',amount:500,grade:'Fertig-/Basissoße; Rezept vergleichen'},
 {id:'eggs',name:'Eier',unit:'pcs',amount:6,grade:'Haltungsform prüfen'},
 {id:'vegetables',name:'Gemüse frisch',unit:'g',amount:1000,grade:'Sorte/Herkunft festlegen'},
 {id:'meat',name:'Fleisch',unit:'g',amount:500,grade:'Tierart/Stück/Kühlung festlegen'},
 {id:'frozen',name:'TK-Gemüse',unit:'g',amount:1000,grade:'Sortenmix und Kühlkette'},
 {id:'bread',name:'Brot',unit:'g',amount:500,grade:'Sorte und Frische'},
 {id:'cheese',name:'Käse',unit:'g',amount:200,grade:'Art/Fettgehalt'},
 {id:'fruit',name:'Obst',unit:'g',amount:1000,grade:'Sorte und Saison'}
];
export const cityChains={
 paris:['carrefour','monoprix','franprix'],
 barcelona:['mercadona','lidl-es','aldi-es'],
 sete:['carrefour','lidl-fr'],
 nice:['carrefour','lidl-fr'],
 kandersteg:['coop'],
 appenzell:['coop','migros']
};
export const chains={
 carrefour:{name:'Carrefour',region:'FR',url:'https://www.carrefour.fr/'},
 monoprix:{name:'Monoprix',region:'FR',url:'https://courses.monoprix.fr/'},
 franprix:{name:'Franprix',region:'FR',url:'https://www.franprix.fr/'},
 mercadona:{name:'Mercadona',region:'ES',url:'https://www.mercadona.es/'},
 'lidl-es':{name:'Lidl',region:'ES',url:'https://www.lidl.es/'},
 'aldi-es':{name:'Aldi',region:'ES',url:'https://www.aldi.es/'},
 'lidl-fr':{name:'Lidl',region:'FR',url:'https://www.lidl.fr/'},
 coop:{name:'Coop',region:'CH',url:'https://www.coop.ch/'},
 migros:{name:'Migros',region:'CH',url:'https://www.migros.ch/'}
};
const frRice='https://www.carrefour.fr/p/riz-long-incollable-10-min-carrefour-classic-3560070822294';
const mono='https://courses.monoprix.fr/categories/mes-marques-monoprix/monoprix/epicerie-sal%C3%A9e/p%C3%A2te-riz-et-pur%C3%A9e/12634544-3500-43f7-b09a-97388586aa6b';
const coopPasta='https://www.coop.ch/de/lebensmittel/vorraete/grundnahrungsmittel/teigwaren/spaghetti/prix-garantie-spaghetti/p/7362486';
const coopRice='https://www.coop.ch/de/lebensmittel/vorraete/grundnahrungsmittel/reis/langkorn-vitamin-camolino/prix-garantie-langkornreis-parboiled/p/6554390';
const migrosSpaghetti='https://migipedia.migros.ch/de/migros-spaghetti';
const migrosTomato='https://migipedia.migros.ch/en/m-budget-tomato-sauce';
const aldi='https://www.aldi.es/producto/spaghetti-de-coccion-rapida-601669800.html';
const observation=(chain,product,priceCents,packAmount,packUnit,name,sourceUrl,checkedOn,grade,note='')=>({
 chain,product,priceCents,packAmount,packUnit,name,sourceUrl,checkedOn,grade,
 quoteType:'national_online_reference',cityVerified:false,available2027:false,note
});
export const marketObservations=[
 observation('carrefour','rice',175,1000,'g','Carrefour Classic Langkornreis 10 Min.',frRice,'2026-11-19','standard',
 'Preis aus vorhandenem Recherchearchiv vom 19.11.2026; regionale Drive-/Filialabweichungen möglich.'),
 observation('monoprix','spaghetti',79,500,'g','Monoprix Spaghetti Qualité Supérieure 500 g',mono,'2026-11-20','standard'),
 observation('monoprix','rice',239,1000,'g','Monoprix Riz Long Grain Incollable 1 kg',mono,'2026-11-20','standard',
 'Nicht dieselbe Kochzeit/Reissorte wie jede andere Kette.'),
 observation('aldi-es','spaghetti',75,500,'g','ALDI Cucina Spaghetti de cocción rápida 500 g',aldi,'2026-11-20','standard',
 '0,75 € aus veröffentlichten 1,50 €/kg × 0,5 kg; ALDI weist regional mögliche Abweichungen aus.'),
 observation('coop','spaghetti',120,1000,'g','Coop Prix Garantie Spaghetti 1 kg',coopPasta,'2026-11-20','economy',
 'Onlineprodukt, Verfügbarkeit und Filialpreis Kandersteg/Appenzell offen.'),
 observation('coop','rice',135,1000,'g','Coop Prix Garantie Langkornreis Parboiled 1 kg',coopRice,'2026-11-19','economy',
 'Ältere im Reiseplaner archivierte nationale Online-Preisreferenz.'),
 observation('migros','spaghetti',120,1000,'g','Migros Spaghetti 1 kg',migrosSpaghetti,'2026-11-20','standard',
 'Migipedia-Preis, keine lokale Preis-/Bestandsprüfung.'),
 observation('migros','tomato',125,500,'ml','Migros M-Budget Tomato Sauce 500 ml',migrosTomato,'2026-11-20','economy',
 'In ml ausgewiesen; nicht ohne Dichteangabe mit 500 g Tomatenprodukten vergleichen.')
];
export const marketCurrency=city=>['kandersteg','appenzell'].includes(city)?'CHF':'EUR';
export function marketKey(city,chain,product){
 if(!cityChains[city]?.includes(chain)||!marketProducts.some(x=>x.id===product))throw Error('Stadt, Kette oder Produkt unbekannt.');
 return [city,chain,product].join(':');
}
export function marketUnitPrice(priceCents,amount,unit){
 if(priceCents==null)return null;
 if(!Number.isSafeInteger(priceCents)||priceCents<0||!Number.isSafeInteger(amount)||amount<1||!['g','ml','pcs'].includes(unit))throw Error('Ungültige Preis-/Packungseinheit.');
 const factor=unit==='pcs'?1:1000;
 return {cents:Math.round(priceCents*factor/amount),per:unit==='g'?'kg':unit==='ml'?'l':'Stück'};
}
export function marketPriceOverrideValid(entry,city,chain,product){
 const currency=marketCurrency(city),row=marketProducts.find(p=>p.id===product);
 return row&&cityChains[city]?.includes(chain)&&entry&&typeof entry==='object'&&!Array.isArray(entry)
  &&(entry.priceCents===null||(Number.isSafeInteger(entry.priceCents)&&entry.priceCents>=0&&entry.priceCents<=100000))
  &&Number.isSafeInteger(entry.packAmount)&&entry.packAmount>0&&entry.packAmount<=100000
  &&entry.packUnit===row.unit&&entry.currency===currency&&entry.status==='manual_unverified'
  &&/^20\d\d-\d\d-\d\d$/.test(entry.checkedOn)&&!Number.isNaN(Date.parse(entry.checkedOn+'T00:00:00Z'))
  &&entry.checkedOn<='2027-09-30'
  &&(entry.sourceUrl===null||typeof entry.sourceUrl==='string'&&entry.sourceUrl.length<=500&&/^https:\/\/[^\s]+$/.test(entry.sourceUrl));
}
export function marketQuote(city,chain,product,overrides={}){
 const k=marketKey(city,chain,product),local=overrides[k],national=marketObservations.find(x=>x.chain===chain&&x.product===product);
 if(local){if(!marketPriceOverrideValid(local,city,chain,product))throw Error('Ungültige manuelle Preisreferenz.');
  return {...local,chain,product,key:k,origin:'manual_unverified',cityVerified:false,available2027:false};}
 return national?{...national,key:k,currency:marketCurrency(city),origin:'national_online_reference'}:null;
}
export function marketChainBasket(city,chain,overrides={}){
 const currency=marketCurrency(city);
 const rows=marketProducts.map(product=>{
  const quote=marketQuote(city,chain,product.id,overrides);
  const comparable=quote!=null&&quote.priceCents!==null&&quote.packUnit===product.unit
   &&quote.priceCents>=0;
  const unitPrice=comparable?marketUnitPrice(quote.priceCents,quote.packAmount,quote.packUnit):null;
  const packs=comparable?Math.ceil(product.amount/quote.packAmount):null;
  return {...product,key:marketKey(city,chain,product.id),quote,currency,unitPrice,packs,
   costCents:comparable?packs*quote.priceCents:null,comparable};
 });
 const known=rows.filter(r=>r.comparable);
 const complete=known.length===marketProducts.length&&rows.every(r=>r.quote.grade==='standard');
 return {city,chain,currency,rows,known:known.length,missing:rows.filter(r=>!r.comparable).map(r=>r.id),
  knownCents:known.reduce((n,r)=>n+r.costCents,0),complete,
  totalCents:complete?known.reduce((n,r)=>n+r.costCents,0):null,
  reason:complete?'Alle zehn Standard-Produktgruppen mit vergleichbaren Packungen belegt':
   'Unvollständig oder unterschiedliche Qualitätsklassen: keine Gesamtsumme und keine günstigste Kette.'};
}
