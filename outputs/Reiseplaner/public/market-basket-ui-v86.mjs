import {marketProducts,cityChains,chains,marketCurrency,marketChainBasket} from './market-basket-v86.mjs';
import {money} from './model.mjs';
import {esc,btn,urlLink} from './ui.mjs';
const unitLabel={g:'g',ml:'ml',pcs:'Stück'};
export function marketBasketPanel(ctx){
 const city=ctx.city,ids=cityChains[city];if(!ids?.length)return '';
 const overrides=ctx.state?.marketQuotes??{};
 const baskets=ids.map(id=>marketChainBasket(city,id,overrides));
 const summary=baskets.map(row=>chains[row.chain].name+' '+row.known+'/10').join(' · ');
 const tableRows=row=>row.rows.map(item=>{
  const q=item.quote,base=item.unitPrice;
  const origin=q?.origin==='manual_unverified'?'Eigene Angabe · nicht verifiziert'
   :q?'Nationale Online-Referenz, keine Stadtfiliale':'Keine belegbare Produktpreisreferenz';
  return '<tr><th scope="row"><strong>'+esc(item.name)+'</strong>'
    +'<small>Vergleichsmenge '+item.amount+' '+unitLabel[item.unit]
    +' · '+esc(item.grade)+'</small></th>'
    +'<td>'+(q?'<strong>'+esc(q.name??'Eigene Produktangabe')+'</strong>'
      +'<small>'+q.packAmount+' '+unitLabel[q.packUnit]+' · '
      +esc(q.grade??'Qualität ungeprüft')+'</small>':'<span>Produkt/Preis offen</span>')+'</td>'
    +'<td>'+(q?.priceCents!=null?money(q.priceCents,row.currency)
       +' <small>pro Packung</small>':'Preis offen')+'</td>'
    +'<td>'+(base?money(base.cents,row.currency)+' / '+base.per:'nicht vergleichbar')+'</td>'
    +'<td>'+(item.costCents!==null?money(item.costCents,row.currency)+'<small>für '
      +item.packs+' ganze Packung(en)</small>':'offen')+'</td>'
    +'<td><small>'+esc(origin)+'</small>'
      +(q?'<small>Stand '+esc(q.checkedOn)+'</small>':'')
      +(q?.note?'<small>'+esc(q.note)+'</small>':'')
      +(q?.sourceUrl?urlLink(q.sourceUrl,'Produktbeleg'):'')
      +'<div>'+btn('market-quote','Preis eingeben / prüfen','edit',item.key,'subtle')
      +(ctx.state?.marketQuotes?.[item.key]?btn('market-quote-reset','Eigene Angabe zurücksetzen','reset',item.key,'subtle'):'')
      +'</div></td></tr>';
 }).join('');
 return '<section class="section market-baskets-v86" aria-label="Supermarktketten mit Produktpreisen">'
   +'<header><small>DATIERTER PREISVERGLEICH · KEIN ANGEBOT FÜR 2027</small>'
   +'<h2>Supermarktketten & Basiskörbe in '+esc(ctx.cities[city]?.name??city)+'</h2>'
   +'<p>Zehn einheitliche Produktgruppen, ganze Packungen und €/kg bzw. CHF/kg bei Gewichtsware. '
   +'Preise sind nur zulässig, wenn Produkt und Menge belegt sind. Unbekannte Preise bleiben offen. '
   +'Andere Qualitäten wie Bio/Standard/Eigenmarke dürfen nicht still als identisch gelten.</p>'
   +'<p class="muted">Die Kettenzuordnung ist eine Rechercheauswahl, keine bestätigte Filiale. '
   +'Alle gefundenen Produktpreise sind überregionale Online-Referenzen oder selbst eingegebene Werte. '
   +'Filialpreise, Lagerbestand und Öffnung für September 2027 sind nicht bestätigt.</p></header>'
   +'<p class="market-basket-coverage"><strong>Belegte Preispositionen:</strong> '+esc(summary)
   +' · Währung '+marketCurrency(city)+' · kein vollständiger Preisvergleich und kein Sieger.</p>'
   +'<div class="market-chain-list">'+baskets.map((basket,i)=>{
    const shop=chains[basket.chain];
    return '<details class="market-chain-card"'+(i===0?' open':'')+'>'
     +'<summary><strong>'+esc(shop.name)+'</strong><span>'+basket.known
     +' von '+marketProducts.length+' Produkten mit Preis · '
     +basket.missing.length+' offen</span></summary>'
     +'<div class="market-chain-detail"><p>'+esc(basket.reason)+'</p>'
     +'<p><strong>Vollständiger Standardwarenkorb:</strong> '
     +(basket.totalCents===null?'nicht berechenbar':money(basket.totalCents,basket.currency))
     +' · Bekannte Einzelwerte werden ausdrücklich NICHT als Gesamtpreis ausgewiesen.</p>'
     +'<div class="market-basket-scroll"><table><thead><tr><th>Produktgruppe</th><th>Konkretes Produkt</th>'
     +'<th>Packung</th><th>Einheitspreis</th><th>Vergleichsmenge</th><th>Quelle und Bearbeiten</th></tr></thead><tbody>'
     +tableRows(basket)+'</tbody></table></div>'
     +'<p>'+urlLink(shop.url,'Offizielle '+esc(shop.name)+'-Website')
     +' · Filiale und Navigation erst nach tatsächlicher Standortprüfung; keine Filialanzahl behauptet.</p>'
     +'</div></details>';
   }).join('')+'</div>'
   +'<p class="muted">Manuelle Preisbelege werden nur für diese Reisevariante und Stadt gespeichert. '
   +'Sie ändern weder Rezepte noch den Einkaufswarenkorb oder das Budget, solange du sie dort nicht bestätigst.</p>'
   +'</section>';
}
