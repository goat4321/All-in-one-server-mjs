import { railSalesStatus } from './verification.mjs';
import { esc, btn, urlLink, dateText } from './ui.mjs';

export function railReviewModel(ctx,asOf=new Date().toISOString().slice(0,10)){
  const queue=(ctx.catalog?.research?.transportQueue??[])
    .filter(row=>row.trip_id===ctx.trip?.id && row.is_selected_from_original_plan
      && row.mode==='train'&&/^\d{4}-\d{2}-\d{2}$/.test(row.date_local??''))
    .sort((a,b)=>a.date_local.localeCompare(b.date_local));
  return queue.map(row=>{
    const sale=railSalesStatus(row,asOf);
    const open=Boolean(sale.earliestReview&&asOf>=sale.earliestReview);
    return {id:row.id,route:row.route,date:row.date_local,window:sale.earliestReview,
      operatorUrl:sale.url,operatingRule:sale.text,approximate:true,
      status:row.timetable_2027_confirmed===true&&row.quote_cents!=null
        ?'manually_verified_reference':open?'check_operator_now':'not_in_typical_window',
      confirmedTimetable:row.timetable_2027_confirmed===true,
      confirmedFare:row.quote_cents!=null,
      publishedThrough:sale.publishedThrough??null};
  });
}

export function railReviewTimeline(ctx,asOf=new Date().toISOString().slice(0,10)){
  const entries=railReviewModel(ctx,asOf);
  if(!entries.length)return '';
  const pending=entries.filter(x=>!x.confirmedTimetable||!x.confirmedFare).length;
  return '<section class="section panel panel-pad rail-review-panel" aria-label="Bahn-Buchungsfenster und Prüfzeitleiste">'
    +'<header class="rail-review-heading"><div><h2>Bahn-Prüfzeitleiste 2027</h2>'
    +'<p>Reihenfolge eurer Originalverbindungen · Orientierung für die nächste Kontrolle, kein verbindlicher Verkaufsbeginn.</p></div>'
    +'<strong>'+pending+' / '+entries.length+' Abschnitte offen</strong></header>'
    +'<div class="rail-review-list">'+entries.map((row,i)=>
      '<article class="rail-review-step"><div class="rail-review-index">'+(i+1)+'</div>'
      +'<div class="rail-review-body"><div class="rail-review-route"><strong>'+esc(row.route)+'</strong>'
      +'<time datetime="'+esc(row.date)+'">'+esc(dateText(row.date))+'</time></div>'
      +'<div class="rail-review-state">'
      +(row.status==='manually_verified_reference'?'Eigenprüfung vermerkt – Verfügbarkeit erneut prüfen'
        :row.status==='check_operator_now'?'Orientierungsfenster erreicht – direkt beim Betreiber kontrollieren'
          :'Noch vor dem typischen Prüfzeitpunkt')+'</div>'
      +'<p>Voraussichtlich ab '+esc(row.window?dateText(row.window):'unbekannt')
      +' nach Tickets und Interrail-Reservierungsplätzen suchen. '
      +'Genaues Verkaufsdatum, Abfahrtszeiten, Kontingent und Preis für September 2027 nicht bestätigt.</p>'
      +'<div class="row-actions">'+btn('rail-reminder','Prüfung vormerken','calendar',row.id)
      +urlLink(row.operatorUrl,'Betreiberregel')+'</div></div></article>').join('')+'</div>'
    +'<p class="rail-review-note">Offizielle SNCF-Mitteilung vom 12.11.2026: viele TGV-Tickets sind zunächst nur bis 02.07.2027 freigegeben. Die Septemberfahrten sind daher noch nicht durch diesen Verkaufsstart bestätigt. Andere Betreiber können abweichende Zeitfenster haben.</p>'
    +urlLink('https://www.sncf-connect.com/en-en/help/ticket-sales-opening','SNCF · aktueller Buchungskalender')
    +'</section>';
}
