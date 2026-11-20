import { assessStay } from './stay-analysis.mjs';
import { lodgingPriceInsight } from './price-insights.mjs';
import { placeProfileModel, placeImageHtml } from './place-profile.mjs';
import { money,groupPrice } from './model.mjs';
import { esc, urlLink, btn } from './ui.mjs';
import {stayCancellationLabel,staySourceLinks} from './stay-facets.mjs';
import {stayLaundryState,stayLocationState,stayExactListingUrl} from './stay-evidence.mjs';

export function stayComparisonRows(items,ctx={}) {
  const seen=new Set();
  return items.filter(x=>x?.kind==='lodging'&&!x.removed&&!seen.has(x.id)&&seen.add(x.id)).slice(0,4).map(item=>{
    const people=ctx.people??[{id:'p1'},{id:'p2'},{id:'p3'}];
    const evaluation=assessStay(item,people,ctx.hotelWalks?.[item.id],
      ctx.state?.verifications?.[item.id]??null);
    const price=lodgingPriceInsight(item,people.length,ctx.nightlyTargetEuro??35);
    const profile=placeProfileModel(item,ctx);
    const originalPrice=item.effectivePrice??item.price;
    const nativeTotal=originalPrice?.currency&&(originalPrice.party==null||originalPrice.party===people.length)
      ?groupPrice(originalPrice,people.length):null;
    const total=price?.groupTotalCents??(Number.isSafeInteger(nativeTotal)?nativeTotal:null);
    const currency=price?.groupTotalCents!=null?'EUR':originalPrice?.currency??'EUR';
    const links=staySourceLinks(item);
    return {
      id:item.id,name:item.name,item,
      groupTotalCents:total,groupCurrency:currency,
      personTotalCents:total==null?null:Math.round(total/people.length),
      from:price?.isSample?item.quote?.sampleFrom??null:item.stayFrom??null,
      to:price?.isSample?item.quote?.sampleTo??null:item.stayTo??null,
      observedOn:item.quote?.observedOn??null,
      room:item.room||'Zimmeraufteilung offen',booked:item.booked===true,
      planned:ctx.activeSet?.has(item.id)??item.selected===true,
      rating:profile.rating,price,evaluation,hasObjectPhoto:Boolean(profile.photo),
      beds:item.bedsDisplayed != null ? String(item.bedsDisplayed)+' angezeigt, Gruppe ungeprüft'
        :evaluation.bedsVerified?'Belegung eigenständig geprüft':'Belegung nicht bestätigt',
      kitchen:typeof item.kitchen==='string'?item.kitchen:'Küche nicht belegt',
      bath:item.bathroom===true?'Privat laut Quelle':item.bathroom===false?'Nicht privat laut Quelle':'Offen',
      cancellation:stayCancellationLabel(item),
      fees:typeof item.fees==='string'?item.fees:item.fees===true?'Laut Quelle eingeschlossen, Tarif prüfen':item.fees===false?'Weitere Gebühren laut Quelle möglich':'Nicht vollständig geprüft',
      walking: evaluation.stationWalkMinutes!=null
        ?evaluation.stationWalkMinutes+' Min. belegter Fußweg':'Bahnhof-Fußweg offen',
      source:stayExactListingUrl(item),operatorSource:links.operator,
      location:stayLocationState(item),
      washer:stayLaundryState(item)==='yes'?'Waschmaschine angegeben · prüfen'
        :stayLaundryState(item)==='no'?'Keine Waschmaschine laut Quelle':'Waschmaschine offen',
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
  return '<section id="unterkunftvergleich" class="stay-compare-board section" aria-label="Visueller Unterkunftsvergleich">'
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
        ['Betten',r.beds],
        ['Küche',r.kitchen],
        ['Waschmaschine',r.washer],
        ['Storno',r.cancellation],
        ['Bahnhof',r.walking],
        ['Datenstand',e.review.complete?'Eigenprüfung dokumentiert'
          :e.risk.length+' offene Prüfpunkte'],
      ];
      const extraFacts=[
        ['Zeitraum',r.from&&r.to?r.from+' → '+r.to:'Aufenthaltsdaten offen'],
        ['Buchung',r.booked?'Als gebucht gespeichert':'Nicht bestätigt gebucht'],
        ['Tagesplan',r.planned?'Im aktiven Plan':'Alternative · ohne zusätzliche Plankosten'],
        ['Zimmer',r.room],['Bewertung',r.rating],
        ['Standort',r.location],['Badezimmer',r.bath],
        ['Gebühren',r.fees],
      ];
      const differs=new Set(facts.filter(([key])=>
        new Set(rows.map(row=>key==='Betten'?row.beds:key==='Küche'?row.kitchen:
          key==='Waschmaschine'?row.washer:key==='Storno'?row.cancellation:
          key==='Bahnhof'?row.walking:
          row.evaluation.review.complete?'Eigenprüfung dokumentiert':
            row.evaluation.risk.length+' offene Prüfpunkte')).size>1)
        .map(([key])=>key));
      return '<article class="stay-compare-card" data-stay-compare-id="'+esc(r.id)+'">'
        +(r.hasObjectPhoto?placeImageHtml(r.item,ctx,{small:true})
          :'<div class="stay-compare-photo-missing">Objektfoto nicht belegt</div>')
        +'<div class="stay-compare-content"><p class="stay-compare-verification">'+esc(
          r.booked?'Im Plan als gebucht gespeichert':r.planned?'Im Reiseplan · Buchung offen':'Vergleichsoption · Buchung offen'
          )+'</p><div class="stay-compare-card-top"><h3>'
        +esc(r.name)+'</h3>'+btn('compare','Entfernen','x',r.id)+'</div>'
        +'<div class="stay-compare-price"><strong>'
        +esc(r.groupTotalCents==null?'Gruppengesamtpreis offen':money(r.groupTotalCents,r.groupCurrency)+' für '+e.people+' Personen / Aufenthalt')+'</strong>'
        +'<span>'+esc(r.personTotalCents==null?'Anteil pro Person offen':'≈ '+money(r.personTotalCents,r.groupCurrency)+' pro Person / Aufenthalt')+'</span>'
        +'<span>'+esc(priceText)+'</span><small>'+esc(p.source)
        +(r.observedOn?' · Stand '+esc(r.observedOn):' · Prüfdatum offen')+'</small>'
        +(diff!=null&&diff>0?'<small>'+esc(money(diff))+' mehr als niedrigster vergleichbarer Referenzwert</small>':'')
        +'</div><dl class="stay-compare-keyfacts">'+facts.map(([k,v])=>
          '<div'+(differs.has(k)?' data-different="true"':'')+'><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'
        +'<details class="stay-compare-more"><summary>Weitere Nachweise, Daten und Zimmerdetails</summary>'
        +'<dl>'+extraFacts.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl></details>'
        +'<div class="row-actions">'+btn('details','Details & Quellen','folder',r.id)
        +urlLink(r.source,'Originalangebot')
        +(r.operatorSource&&r.operatorSource!==r.source?urlLink(r.operatorSource,'Betreiberquelle'):'')+'</div></div></article>';
    }).join('')+'</div></section>';
}
