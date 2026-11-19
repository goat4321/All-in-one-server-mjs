import { reviewProgress } from './verification.mjs';
import { esc, btn } from './ui.mjs';

// UI checklist only. A recorded user review is not evidence that an operator
// confirmed a booking, availability or a September 2027 timetable.
export function readinessOverview(ctx) {
  const active=ctx.active??[];
  const people=ctx.people?.length??0;
  const reviews=ctx.state?.verifications??{};
  const hotels=active.filter(i=>i.kind==='lodging');
  const trains=active.filter(i=>i.kind==='transport'&&i.mode==='train');
  const checkedHotels=hotels.filter(i=>reviewProgress('lodging',reviews[i.id],people).complete).length;
  const checkedTrains=trains.filter(i=>reviewProgress('transport',reviews[i.id],people).complete).length;
  const known=ctx.budget?.rows?.filter(r=>Number.isSafeInteger(r.euros)).length??0;
  const total=ctx.budget?.rows?.length??0;
  const deadlines=ctx.state?.deadlines??[];
  const done=deadlines.filter(d=>d.done).length;
  const overnight=Object.keys(ctx.trip?.stayByCity??{}).length;
  const covered=Object.entries(ctx.trip?.stayByCity??{}).filter(([city,required])=>
    hotels.some(h=>h.city===city&&h.stayFrom<=required.from&&h.stayTo>=required.to)).length;
  return [
    {key:'stays',title:'Übernachtungen geplant',done:covered,total:overnight,
      message:'Abgedeckte Aufenthaltszeiträume, nicht bestätigte Reservierungen'},
    {key:'hotel-review',title:'Unterkünfte selbst geprüft',done:checkedHotels,total:hotels.length,
      message:'Zimmer, Betten, Gebühren, Storno und Checkout selbst dokumentiert'},
    {key:'rail-review',title:'Züge selbst geprüft',done:checkedTrains,total:trains.length,
      message:'Fahrplan, Betreiber, Pass, Sitzplätze und Reservierungskosten'},
    {key:'cost',title:'Planpreise bekannt',done:known,total,
      message:'Beträge im lokalen Plan; nicht automatisch finale Buchungspreise'},
    {key:'deadlines',title:'Eigene Fristen erledigt',done,total:deadlines.length,
      message:'Nur selbst angelegte Wiedervorlagen'},
  ];
}
export function readinessPanel(ctx) {
  const sections=readinessOverview(ctx);
  return '<section class="section panel panel-pad readiness-panel" aria-label="Fortschritt der Reisevorbereitung">'
    +'<div class="readiness-heading"><div><h2>Fortschritt der Reisevorbereitung</h2>'
    +'<p>Was ist bereits selbst dokumentiert und wo fehlen noch Angaben? Kein Nachweis externer Buchungen.</p></div>'
    +btn('page','Zum Tagesplan','calendar','plan')+'</div>'
    +'<div class="readiness-grid">'+sections.map(row=>{
      const ratio=row.total?Math.round(row.done/row.total*100):0;
      return '<div class="readiness-card" data-readiness="'+esc(row.key)+'">'
        +'<div class="readiness-top"><strong>'+esc(row.title)+'</strong><span>'
        +row.done+' / '+row.total+'</span></div>'
        +'<div class="readiness-track" role="progressbar" aria-label="'+esc(row.title)
        +'" aria-valuemin="0" aria-valuemax="'+row.total+'" aria-valuenow="'+row.done+'">'
        +'<span style="width:'+ratio+'%"></span></div>'
        +'<p>'+esc(row.total===0?'Noch keine entsprechenden Einträge. ':row.done===row.total
          ?'Für alle vorhandenen Einträge dokumentiert. ':'Weitere Prüfungen offen. ')+esc(row.message)+'</p></div>';
    }).join('')+'</div>'
    +'<p class="readiness-warning">Selbst erfasste Prüfvermerke sind keine verbindlichen Buchungs-, Tarif- oder Fahrplanbestätigungen. Fehlende Angaben werden nicht als erledigt bewertet.</p>'
    +'</section>';
}
