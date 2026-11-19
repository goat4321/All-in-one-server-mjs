import {mealPlans as legacyPlans,mealSources as legacySources} from './barcelona-meals.mjs';
const checkedOn='2026-11-19';
const observed=(id,name,pack,unit,cents,currency,url,note='')=>({id,name,pack,unit,cents,currency,url,checkedOn,
 status:'online_reference_not_city_quote',note,available2027:false});
export const stapleReferences=[
 observed('meal-fr-oats','Haferflocken',500,'g',79,'EUR','https://www.carrefour.fr/p/flocons-d-avoine-carrefour-original-3560070614202'),
 observed('meal-fr-milk','Milch, UHT teilentrahmt',1000,'ml',105,'EUR','https://www.carrefour.fr/p/lait-demi-ecreme-carrefour-classic-3276554163158'),
 observed('meal-fr-rice','Langkornreis, 10 Min.',1000,'g',175,'EUR','https://www.carrefour.fr/p/riz-long-incollable-10-min-carrefour-classic-3560070822294'),
 observed('meal-es-oats','Haferflocken',500,'g',84,'EUR','https://www.carrefour.es/supermercado/copos-de-avena-integral-original-carrefour-500-g/R-641402048/p'),
 observed('meal-es-milk','Milch, UHT teilentrahmt',1000,'ml',83,'EUR','https://www.carrefour.es/supermercado/leche-semidesnatada-carrefour-brik-1-l/R-521007071/p'),
 observed('meal-es-rice','Langkornreis',1000,'g',120,'EUR','https://www.carrefour.es/supermercado/arroz-largo-categoria-1-carrefour-classic-1-kg/R-538408171/p'),
 observed('meal-ch-oats','Haferflocken',500,'g',70,'CHF','https://www.coop.ch/de/lebensmittel/vorraete/mueesli-cerealien/mueesli/getreideflocken/prix-garantie-vollkorn-haferfloeckli-fein/p/6524490'),
 observed('meal-ch-milk','Milchdrink, 2,5 % gekühlt',1000,'ml',140,'CHF','https://www.coop.ch/de/lebensmittel/milchprodukte-eier/milch/frische-milch/prix-garantie-milchdrink-25-hochpasteurisiert/p/6762623','Kühlpflichtige Milch, keine UHT-Milch; nicht identisch mit den französischen/spanischen Varianten.'),
 observed('meal-ch-rice','Langkornreis, Parboiled',1000,'g',135,'CHF','https://www.coop.ch/de/lebensmittel/vorraete/grundnahrungsmittel/reis/langkorn-vitamin-camolino/prix-garantie-langkornreis-parboiled/p/6554390'),
];
const regions={paris:'fr',barcelona:'es',sete:'fr',nice:'fr',kandersteg:'ch',appenzell:'ch'};
const searches={fr:'https://www.carrefour.fr/s?q=',es:'https://www.carrefour.es/supermercado/buscar?query=',ch:'https://www.coop.ch/de/search/?text='};
const missingProducts={pasta:['Pasta',500,'pates','pasta','Teigwaren'],tomato:['Tomatensoße',400,'sauce tomate','tomate frito','Tomatensauce'],
 chickpeas:['Kichererbsen, abgetropft',400,'pois chiches','garbanzos','Kichererbsen'],corn:['Mais, abgetropft',285,'mais','maiz','Mais']};
const missing=[];
function ingredient(region,key,need){
 const found=stapleReferences.find(r=>r.id==='meal-'+region+'-'+key);
 if(found)return {name:found.name,source:found.id,pack:found.pack,unit:found.unit,cents:found.cents,currency:found.currency,checkedOn:found.checkedOn,need};
 if(region==='es'&&key!=='corn'){
  const product=legacyPlans.barcelona[0].products.find(p=>p.source.endsWith(key==='tomato'?'tomato':key));
  if(product)return {...product,need,unit:'g',currency:'EUR',checkedOn:'2026-11-12'};
 }
 const [name,pack,fr,es,ch]=missingProducts[key];
 const source='meal-'+region+'-'+key;
 if(!missing.some(r=>r.id===source))missing.push({id:source,name,pack,unit:'g',cents:null,currency:region==='ch'?'CHF':'EUR',
  url:searches[region]+encodeURIComponent({fr,es,ch}[region]),status:'product_and_price_unverified',checkedOn,
  reason:'Konkretes Produkt, Abtropfgewicht, Packung und lokaler Preis fehlen.',
  nextAction:'Passendes Produkt im offiziellen Katalog oder in der Filiale auswählen; Packung und Preis manuell prüfen.'});
 return {name,pack,need,source,cents:null,currency:region==='ch'?'CHF':'EUR',unit:'g',checkedOn:null,packAssumption:true};
}
function recipes(city,region){
 const make=(id,name,slots,prep,stove,keys,steps,note)=>({id:city+'-'+id,name,type:'cook',slot:slots[0],slots,prep,shopMinutes:15,
  requiresKitchen:stove,requiresColdStorage:id==='oats',currency:region==='ch'?'CHF':'EUR',
  equipment:stove?'Herd, Topf, Kochgeschirr':'Schüssel, Besteck und ggf. Dosenöffner; kein Herd',
  products:keys.map(([key,need])=>ingredient(region,key,need)),steps,
  note:note+' Mengen gelten pro Person und werden mit der tatsächlichen Gruppe multipliziert. Mengen und Zubereitungsdauer sind Planannahmen. Optionale Gewürze und Trinkwasser sind nicht eingepreist.',
  priceNote:'Ganze Packungen aus datierten Online-Referenzen; offene Produkte bleiben unbepreist. Kein zugesagter Filial- oder 2027-Preis.',
  source:keys.map(([key,need])=>ingredient(region,key,need).source),
 });
 const result=[
  make('oats','Haferflocken mit Milch',['breakfast'],10,false,[['oats',60],['milk',200]],
   ['Haferflocken abmessen und auf Schüsseln verteilen.','Milch zugeben und quellen lassen. Angebrochene Milch nach Packungsangabe kühlen.'],
   'Für drei: 180 g Haferflocken und 600 ml Milch. In der Schweiz ist die erfasste Milch bereits ungeöffnet kühlpflichtig.'),
  make('salad','Kichererbsen-Mais-Salat',['lunch'],15,false,[['chickpeas',160],['corn',100]],
   ['Gekochte Kichererbsen und Mais abtropfen lassen.','Mengen auf drei Portionen verteilen und nach eigenen Vorräten würzen.'],
   'Für drei: 480 g abgetropfte Kichererbsen und 300 g abgetropfter Mais. Packungsgewichte unbestätigter Produkte sind ausdrücklich Planannahmen.'),
  make('rice','Reis mit Tomate und Kichererbsen',['lunch','dinner'],30,true,[['rice',90],['tomato',120],['chickpeas',120]],
   ['Reis nach Packungsangabe kochen.','Tomatensoße und abgetropfte Kichererbsen erwärmen.','Zusammen servieren und Kochgeschirr reinigen.'],
   'Für drei: 270 g trockener Reis, 360 g Soße und 360 g abgetropfte Kichererbsen.'),
 ];
 if(city==='barcelona')result.unshift({...legacyPlans.barcelona[0],slots:['lunch','dinner'],requiresKitchen:true,currency:'EUR',equipment:'Herd, Topf, Kochgeschirr',
  steps:['Pasta nach Packungsangabe kochen.','Soße und abgetropfte Kichererbsen erwärmen und mit der Pasta servieren.'],
  products:legacyPlans.barcelona[0].products.map(p=>({...p,unit:'g',currency:'EUR',checkedOn:'2026-11-12'}))},legacyPlans.barcelona[1]);
 else result.push(make('pasta','Pasta mit Tomate und Kichererbsen',['lunch','dinner'],35,true,[['pasta',100],['tomato',120],['chickpeas',120]],
  ['Pasta nach Packungsangabe kochen.','Tomatensoße und gekochte Kichererbsen erwärmen und zusammen servieren.'],
  'Für drei: 300 g trockene Pasta, 360 g Soße und 360 g abgetropfte Kichererbsen.'));
 return result;
}
export const mealPlans=Object.fromEntries(Object.entries(regions).map(([city,region])=>[city,recipes(city,region)]));
export const mealSources=[...legacySources,...stapleReferences,...missing].map(r=>r.publisher?r:{id:r.id,publisher:r.cents===null?'Produktsuche · '+r.name:'Online-Produktreferenz · '+r.name,
 url:r.url,accessed_on:r.checkedOn,validity:r.status==='product_and_price_unverified'?'Produktsuche, Packung und Preis offen':'Preisbeobachtung 19.11.2026; Region/Filiale und September 2027 ungeprüft'});
export const mealResearch={checkedOn,regions,stapleReferences,missingProducts:missing,
 status:'national_online_references_not_verified_local_baskets',
 note:'Ein Vergleichskorb umfasst je 500 g Haferflocken, 1 l Milch und 1 kg Reis. Milchfett, Kühlung und Reissorte weichen ab. EUR und CHF bleiben getrennt. Keine Aussage über die günstigste Stadtkette.'};
