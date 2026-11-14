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
  const cityOptions='<option value="all">Alle Städte</option>'
    +[...new Set(entries.filter(e=>!e.complete).map(e=>e.city))]
    .sort((a,b)=>(ctx.cities[a]?.name??a).localeCompare(ctx.cities[b]?.name??b,'de'))
    .map(id=>'<option value="'+esc(id)+'">'+esc(ctx.cities[id]?.name??id)+'</option>').join('');
  const typeOptions='<option value="all">Alle Arten</option>'
    +[['activity','Aktivitäten'],['lodging','Unterkünfte'],['transport','Transport'],
      ['food','Essen'],['shop','Einkaufen']]
      .map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('');
  const gapOptions='<option value="all">Alle offenen Angaben</option>'
    +Object.entries(labels).map(([id,label])=>'<option value="'+esc(id)+'">Fehlt: '
      +esc(label)+'</option>').join('')
    +'<option value="no-guide">Ohne zusätzlichen Ortsguide</option>';
  const controls='<div class="coverage-filter-controls" role="search" aria-label="Datenlücken durchsuchen">'
    +'<label class="coverage-filter-text"><span>Ort suchen</span>'
    +'<input id="coverage-filter-query" type="search" maxlength="110" autocomplete="off"'
    +' placeholder="z. B. Sète, Hotel, Strand"></label>'
    +'<label><span>Stadt</span><select id="coverage-filter-city">'+cityOptions+'</select></label>'
    +'<label><span>Kategorie</span><select id="coverage-filter-kind">'+typeOptions+'</select></label>'
    +'<label><span>Fehlender Nachweis</span><select id="coverage-filter-gap">'
    +gapOptions+'</select></label>'
    +'<div class="coverage-filter-actions"><span id="coverage-filter-result" role="status"'
    +' aria-live="polite">'+data.incomplete.length+' von '+data.incomplete.length
    +' offenen Einträgen passend</span>'
    +btn('coverage-filter-clear','Filter zurücksetzen','x')+'</div></div>';
  const groups=[...cities.entries()].sort(([a],[b])=>
    (ctx.cities[a]?.name??a).localeCompare(ctx.cities[b]?.name??b,'de')).map(([city,rows])=>{
    const place=ctx.cities[city]?.name??city;
    return '<details class="coverage-city" data-coverage-group="'+esc(city)
      +'"><summary>'+esc(place)+' · <span class="coverage-visible-count">'+rows.length
      +'</span> offene Einträge</summary><div class="coverage-rows">'
      +rows.map(e=>'<div class="coverage-row" data-coverage-name="'+esc(e.name)
        +'" data-coverage-city="'+esc(e.city)+'" data-coverage-kind="'+esc(e.kind)
        +'" data-coverage-guide="'+String(e.hasGuide)
        +'" data-coverage-gaps="'+esc(e.gaps.map(g=>g.key).join(' '))
        +'"><div><strong>'+esc(e.name)
        +'</strong><small>'+esc(e.kind==='lodging'?'Unterkunft':e.kind==='transport'?'Verkehr':'Ort / Aktivität')
        +(e.hasGuide?' · Einzelguide':'')
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
    +controls
    +'<div class="coverage-cities">'+groups+'</div>'
    +'<p class="muted">Bilder hinzufügen: „Bild suchen“ nutzt Wikimedia Commons mit Autor und Lizenz. '
    +'Das Motiv muss anschließend durch dich dem konkreten Ort zugeordnet werden. '
    +'Für Hotelzimmer sind Anbieter- oder eigene Fotos nur mit passenden Rechten zu übernehmen.</p>'
    +'</section>';
}
