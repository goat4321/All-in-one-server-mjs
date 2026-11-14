import {esc,btn} from './ui.mjs';
import {entryCompletenessReport} from './entry-completeness.mjs';

const labels={photo:'Foto',description:'Beschreibung',price:'Preis',
  hours:'Öffnung',location:'Kartenort',geo_evidence:'Koordinatenquelle',
  source:'Quelle',booking:'Betten/Checkout',timetable:'Fahrplan'};

export function entryCoveragePanel(ctx){
  const data=entryCompletenessReport(ctx.all,ctx);
  const {counters,entries,missingByType}=data;
  const cities=new Map();
  for(const row of entries){
    if(row.complete)continue;
    const arr=cities.get(row.city)??[];
    arr.push(row);
    cities.set(row.city,arr);
  }
  const headline=[
    ['Einträge',counters.total],['Mit Quellenfoto',counters.withPhoto],
    ['Mit Beschreibung',counters.withStory],['Mit EUR-Vergleichspreis',counters.withPrice],
    ['Mit Webbeleg',counters.withSource],['Mit Kartenpunkt',counters.withPoint],
    ['Ohne offene Prüffelder',counters.complete],
  ];
  const countersHtml=headline.map(([name,n])=>
    '<span><strong>'+n+'</strong> '+esc(name)+'</span>').join('');
  const gapSummary=Object.entries(missingByType).sort((a,b)=>b[1]-a[1])
    .map(([name,n])=>'<span>'+esc(labels[name]??name)+': <strong>'+n+'</strong></span>').join('');
  const groups=[...cities.entries()].sort(([a],[b])=>
    (ctx.cities[a]?.name??a).localeCompare(ctx.cities[b]?.name??b,'de')).map(([city,rows])=>{
    const place=ctx.cities[city]?.name??city;
    return '<details class="coverage-city"><summary>'+esc(place)+' · '+rows.length
      +' Einträge mit offenen Angaben</summary><div class="coverage-rows">'
      +rows.map(e=>'<div class="coverage-row"><div><strong>'+esc(e.name)
        +'</strong><small>'+esc(e.kind==='lodging'?'Unterkunft':e.kind==='transport'?'Verkehr':'Ort / Aktivität')
        +' · '+esc(e.gaps.map(g=>labels[g.key]??g.key).join(' · '))+'</small></div>'
        +'<div class="row-actions">'+btn('details','Details & offene Quellen','folder',e.id,'subtle')
        +(e.hasPhoto?'':btn('commons-photo-search','Bild suchen','compass',e.id,'subtle'))
        +'</div></div>').join('')+'</div></details>';
  }).join('');
  return '<section class="section panel panel-pad entry-coverage">'
    +'<header><span class="survey-v19-kicker">TRANSPARENTE DATENABDECKUNG</span>'
    +'<h2>Welche Einträge haben noch fehlende Angaben oder Bilder?</h2>'
    +'<p class="muted">Echte Bestandsaufnahme dieser Reisevariante, keine erfundenen Vollständigkeitswerte. '
    +'Ein vorhandener Weblink belegt nicht automatisch Zimmer, Tarif oder Öffnungszeiten. '
    +'Auch ein hinterlegtes Foto kann offline sein oder erneut zu prüfen sein.</p></header>'
    +'<div class="coverage-counts">'+countersHtml+'</div>'
    +'<div class="coverage-gap-summary">'+gapSummary+'</div>'
    +'<p class="muted">Alle '+counters.total+' unterschiedlichen Einträge dieser Variante wurden einzeln ausgewertet. '
    +data.incomplete.length+' benötigen mindestens eine Ergänzung. '
    +'Die ungeklärten Felder stehen in den jeweiligen Details zusammen mit den nächsten Prüfschritten. '
    +'Der Reiseplan, Preise und Buchungsstatus bleiben davon unberührt.</p>'
    +'<div class="coverage-cities">'+groups+'</div>'
    +'<p class="muted">Bilder hinzufügen: „Bild suchen“ nutzt Wikimedia Commons mit Autor und Lizenz. '
    +'Das Motiv muss anschließend durch dich dem konkreten Ort zugeordnet werden. '
    +'Für Hotelzimmer sind Anbieter- oder eigene Fotos nur mit passenden Rechten zu übernehmen.</p>'
    +'</section>';
}
