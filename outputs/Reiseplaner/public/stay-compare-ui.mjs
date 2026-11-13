import { assessStay } from './stay-analysis.mjs';
import { lodgingPriceInsight } from './price-insights.mjs';
import { placeProfileModel, placeImageHtml } from './place-profile.mjs';
import { money } from './model.mjs';
import { esc, urlLink, btn } from './ui.mjs';

export function stayComparisonRows(items,ctx={}) {
  return items.slice(0,4).filter(x=>x?.kind==='lodging').map(item=>{
    const people=ctx.people??[{id:'p1'},{id:'p2'},{id:'p3'}];
    const evaluation=assessStay(item,people,ctx.hotelWalks?.[item.id],
      ctx.state?.verifications?.[item.id]??null);
    const price=lodgingPriceInsight(item,people.length,ctx.nightlyTargetEuro??35);
    const profile=placeProfileModel(item,ctx);
    return {
      id:item.id,name:item.name,item,
      rating:profile.rating,price,evaluation,
      beds:item.bedsDisplayed != null ? String(item.bedsDisplayed)+' angezeigt, Gruppe ungeprüft'
        :evaluation.bedsVerified?'Belegung eigenständig geprüft':'Belegung nicht bestätigt',
      kitchen:typeof item.kitchen==='string'?item.kitchen:'Küche nicht belegt',
      bath:item.bathroom===true?'Privat laut Quelle':item.bathroom===false?'Nicht privat laut Quelle':'Offen',
      cancellation:item.cancellation===true?'Laut Quelle möglich, Tarif prüfen':'Offen',
      fees:item.fees===true?'Laut Quelle eingeschlossen':'Nicht vollständig geprüft',
      walking: evaluation.stationWalkMinutes!=null
        ?evaluation.stationWalkMinutes+' Min. belegter Fußweg':'Bahnhof-Fußweg offen',
      source:item.website??null,
    };
  });
}

export function stayComparisonBoard(items,ctx={}) {
  const rows=stayComparisonRows(items,ctx);
  if(!rows.length)return '';
  const allSameDates=rows.every(r=>r.item.stayFrom&&r.item.stayTo
    &&r.item.stayFrom===rows[0].item.stayFrom&&r.item.stayTo===rows[0].item.stayTo);
  const comparable=rows.filter(r=>r.price?.personNightCents!=null
    &&r.price?.isSample===false&&allSameDates);
  const baseline=comparable.length>=2
    ? Math.min(...comparable.map(r=>r.price.personNightCents)):null;
  return '<section class="stay-compare-board section" aria-label="Visueller Unterkunftsvergleich">'
    +'<div class="stay-compare-heading"><div><h2>Unterkünfte im Direktvergleich</h2>'
    +'<p>Bis zu vier Optionen · Ungeprüfte Suchpreise, Buchbarkeit und Ausstattung bleiben getrennt erkennbar.</p></div>'
    +'<div class="stay-compare-tools"><strong>'+rows.length+'/4 gewählt</strong>'
    +btn('compare-clear','Alle entfernen','x')+'</div></div>'
    +(baseline==null?'<p class="muted">Keine belastbare Preis-Rangfolge: Daten, Übernachtungen oder Referenzstatus sind nicht vollständig vergleichbar.</p>'
      :'<p class="muted">Preisunterschiede nur zwischen gleich datierten Referenzwerten, nicht als garantiertes Sparpotenzial verstehen.</p>')
    +'<div class="stay-compare-grid">'+rows.map(r=>{
      const e=r.evaluation,p=r.price;
      const priceText=p?.personNightCents!=null?money(p.personNightCents)
        +' p. P./Nacht'+(p.isSample?' · Airbnb-Suchwert':' · Referenzwert'):'Preis pro Person/Nacht offen';
      const diff=baseline!=null&&p?.personNightCents!=null&&!p.isSample
        ?p.personNightCents-baseline:null;
      const facts=[
        ['Bewertung',r.rating],
        ['Betten',r.beds],
        ['Küche',r.kitchen],
        ['Badezimmer',r.bath],
        ['Storno',r.cancellation],
        ['Gebühren',r.fees],
        ['Fußweg',r.walking],
        ['Datenstand',e.review.complete?'Eigene Prüfung vollständig dokumentiert'
          :e.risk.length+' offene Prüfpunkte'],
      ];
      return '<article class="stay-compare-card">'
        +placeImageHtml(r.item,ctx,{small:true})
        +'<div class="stay-compare-content"><div class="stay-compare-card-top"><h3>'
        +esc(r.name)+'</h3>'+btn('compare','Entfernen','x',r.id)+'</div>'
        +'<div class="stay-compare-price"><strong>'+esc(priceText)+'</strong>'
        +(diff!=null&&diff>0?'<small>'+esc(money(diff))+' mehr als niedrigster vergleichbarer Referenzwert</small>':'')
        +'</div><dl>'+facts.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'
        +'<div class="row-actions">'+btn('details','Details & Quellen','folder',r.id)
        +urlLink(r.source,'Originalangebot')+'</div></div></article>';
    }).join('')+'</div></section>';
}
