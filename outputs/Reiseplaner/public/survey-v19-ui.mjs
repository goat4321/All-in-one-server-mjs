import { btn, esc, icon, status, dateText } from './ui.mjs';
import { money } from './model.mjs';
import { planCostSignal } from './visual-experience.mjs';

const snapshot = ctx => ctx.catalog.research?.surveyFirstV19;
const current = ctx => snapshot(ctx)?.variants?.[ctx.trip.id];
const place = (ctx,id) => ctx.cities[id]?.name ?? id;
const noGuarantee = 'Quelle: ergänzende Recherche vom 13.11.2026 · keine Buchung, keine garantierten Preise oder Fahrpläne für 2027.';
const safeDate = d => d ? dateText(d) : 'Datum offen';
const label = (id) => ({
  'supermarket_cook':'Selbstversorgung',
  'regional_takeaway':'Essen unterwegs',
  'evening_group':'Abendgestaltung',
  'rainy_active':'Aktiv bei Regen',
  'after_arrival':'Nach der Ankunft',
  'active':'Aktiv',
  'beach_day_with_optional_evening':'Strand & Abend',
  'flexible':'Flexibel',
  'morning':'Vormittag',
  'afternoon':'Nachmittag',
  'evening':'Abend',
  'night':'Nacht',
})[id] ?? String(id??'Idee').replaceAll('_',' ');
const link = (href,title) => typeof href==='string' && /^https:\/\//.test(href)
  ? '<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(title)+'</a>' : '';
const panel=(title,info,body)=>'<section class="section panel panel-pad survey-v19"><header class="survey-v19-head">'
  +'<div><span class="survey-v19-kicker">NEU · UMFRAGEPAKET V19</span><h2>'+esc(title)
  +'</h2><p class="muted">'+esc(info)+'</p></div></header>'+body+'</section>';

export function surveyV19DayPanel(ctx) {
  const data=current(ctx);
  const plans=data?.dayPlans.filter(x=>x.date===ctx.date)??[];
  if(!plans.length)return '';
  const items=new Map(ctx.all.map(x=>[x.id,x]));
  const content=plans.map(plan=> {
    const activities=plan.activity_option_ids_ordered.map(id=>items.get('survey-v19:'+id));
    return '<article class="survey-v19-day"><div class="survey-v19-row">'
      +'<strong>'+esc(place(ctx,plan.city_id))+' · '+esc(label(plan.style))+'</strong>'
      +status('Tagesvorschlag · nicht aktiv')+'</div>'
      +'<div class="survey-v19-suggestions">'+plan.activity_option_ids_ordered.map((id,i)=>{
        const item=activities[i];
        const timing=label(plan.time_windows[i] ?? 'flexible');
        if(!item)return '<span class="survey-v19-missing">'+esc(id)+' · nicht eindeutig importiert</span>';
        const signal=planCostSignal(item,ctx.people.length);
        return '<div class="survey-v19-option"><span class="survey-v19-index">'+(i+1)+'</span>'
          +'<div><strong>'+esc(item.name)+'</strong><small>'+esc(timing)
          +' · <span class="universal-euro-tier" title="'+esc(signal.note)+'">'+esc(signal.tier)+'</span>'
          +' · '+esc(signal.amount)+'</small></div>'
          + (ctx.activeSet.has(item.id) ? status('Im Plan','green') : btn('choose','Einplanen','plus',item.id,'subtle'))
          +'</div>';
      }).join('')+'</div><p class="muted">Zeiten, Öffnung und Wege sind vor der Übernahme zu prüfen. Keine Änderung am Tripsy-Original.</p></article>';
  }).join('');
  return panel('Tagesvorschläge aus eurer Umfrage','Nur Optionen für den gewählten Tag. Bestehende Termine bleiben unangetastet.',content);
}

export function surveyV19RailPanel(ctx) {
  const data=current(ctx);
  if(!data)return '';
  const rows=data.transport.map(leg=>{
    const reservation=leg.reservation_price_minor==null?'€? · Reservierung offen':
      money(leg.reservation_price_minor,leg.reservation_currency??'EUR')+' p. P. · Tarifreferenz';
    return '<tr><td>'+esc(safeDate(leg.planned_departure_date_local))+'</td>'
      +'<td><strong>'+esc(place(ctx,leg.from_destination_id))+' → '+esc(place(ctx,leg.to_destination_id))
      +'</strong><small>'+esc(leg.route_via_notes??'')+'</small></td>'
      +'<td>'+esc(leg.mode==='rail'?'Bahn':'Transfer')+'</td>'
      +'<td><strong>€? · Fahrtpreis offen</strong><small>'+esc(reservation)+'</small></td>'
      +'<td>'+status('Nicht buchbare Planung','warn')+'</td></tr>';
  }).join('');
  const fares=snapshot(ctx).fares.filter(row=>['pass','reservation'].includes(row.category));
  return panel('Ergänzte Bahnabschnitte & Interrail-Tarife',
    data.transport.length+' weitere Prüfabschnitte · Start- und Ankunftszeiten ausnahmslos offen',
    '<div class="table-wrap"><table><thead><tr><th>Reisetag</th><th>Von → Nach</th><th>Typ</th><th>Reservierung</th><th>Status</th></tr></thead><tbody>'
    +rows+'</tbody></table></div>'
    +'<details><summary>'+fares.length+' zusätzliche Pass- und Reservierungsreferenzen ansehen</summary>'
    +'<div class="survey-v19-note-list">'+fares.map(f=>'<div><strong>'+esc(f.title)+'</strong> · '
      +(f.amount_minor==null?'Preis offen':money(f.amount_minor,f.currency))+' · '+esc(f.per)
      +'<small>'+esc(f.note??'')+' · Stand '+esc(f.as_of)+'</small></div>').join('')+'</div></details>'
    +'<p class="muted">'+esc(noGuarantee)+' Die alten Tripsy-Transportabschnitte bleiben separat.</p>');
}

export function surveyV19FoodPanel(ctx) {
  const data=current(ctx);
  if(!data)return '';
  const ideas=data.foodIdeas.filter(x=>x.destination_id===ctx.city);
  if(!ideas.length)return '';
  return panel('Essen, Abend & Regentag · neue Ideen',
    place(ctx,ctx.city)+' · '+ideas.length+' Vorschläge ohne fingierte Restaurants oder Kosten',
    '<div class="survey-v19-grid">'+ideas.map(x=>'<article><span class="survey-v19-kicker">'
      +esc(label(x.kind))+'</span><p>'+esc(x.idea)+'</p>'
      +'<small><span class="universal-euro-tier">'+(x.price_minor===0?'0 €':'€?')+'</span> · '+ (x.price_minor===null?'Preis ungeklärt':
      money(x.price_minor,x.currency??'EUR')+' nur für öffentliche Grundnutzung')
      +(x.requires_specific_business_research?' · konkreten Anbieter recherchieren':'')
      +'</small></article>').join('')+'</div><p class="muted">Die Vorschläge sind nicht automatisch Teil des Tagesplans.</p>');
}

export function surveyV19BudgetPanel(ctx) {
  const scenarios=current(ctx)?.scenarios??[];
  if(!scenarios.length)return '';
  return panel('Ergänzende Budgetvarianten vom 13.11.2026',
    'Unverbindliche Rechenbeispiele · nicht mit den aktiven Planbeträgen addieren',
    '<div class="survey-v19-scenario-grid">'+scenarios.map(s=>{
      const total=s.total_group_minor;
      const parts=s.group_cost_minor;
      return '<article><h3>'+esc(s.id.replace(/^budget-/,'').replaceAll('-',' '))+'</h3>'
        +'<strong class="survey-v19-money">'+(total==null?'Gesamtkosten offen':money(total))+'</strong>'
        +'<small>Gruppe: '+s.group_size+' Personen, '+s.stay_nights+' Nächte'
        +' · Unterkunft '+(parts.accommodation==null?'offen':money(parts.accommodation))+'</small>'
        +'<small>'+ (total!=null?'Ohne Interrail-Pass · '+(s.interrail_pass_group_optional_minor==null?'Passpreis offen':'optionaler Pass '+money(s.interrail_pass_group_optional_minor)):
        'Unvollständige Kostengrundlage')+'</small>'
        +'<p>'+esc(s.notes??'')+'</p>'+status('Nur Vergleich · nicht gebucht')+'</article>';
    }).join('')+'</div>');
}

export function surveyV19DataPanel(ctx) {
  const data=snapshot(ctx);
  if(!data)return '';
  const count=data.counts;
  const imported=data.variants[ctx.trip.id];
  const problems=data.qualityIssues;
  const nameOf=x=> x.id+' · '+x.issue;
  const sourceLabels=data.sources.map(x=>{
    const title=x.publisher??x.id;
    return '<li>'+ (link(x.url,title)||esc(title)) +' · '+esc(x.accessed_on??'Prüfdatum offen')+'</li>';
  }).join('');
  const rejections=data.rejected.filter(x=>x.trip===ctx.trip.id);
  const missingPrice=imported.transport.filter(t=>t.ticket_price_minor===null).length;
  return panel('Importprotokoll · Zusatzpaket 13.11.2026',
    'Separater Snapshot. Jede Aktivität und jedes Unterkunftsangebot bleibt anfangs ungewählt.',
    '<div class="survey-v19-stats">'
      +[['Aktivitäten',''+imported.activities],['Unterkünfte',''+imported.accommodations],
        ['Bahnabschnitte',''+imported.transport.length],['Tagesideen',''+imported.dayPlans.length],
        ['Essensideen',''+imported.foodIdeas.length],['Offene Ticketpreise',''+missingPrice]]
        .map(([title,value])=>'<div><strong>'+esc(value)+'</strong><span>'+esc(title)+'</span></div>').join('')
    +'</div><p class="muted">Gesamtarchiv: '+count.uniqueActivities+' Aktivitäten, '+count.uniqueAccommodations
    +' Hoteloptionen, '+count.transportPlans+' date-only-Transportabschnitte, '+count.fareReferences
    +' Tarife, '+count.dayPlans+' Tagespläne, '+count.foodIdeas+' Essen/Abendideen und '
    +count.qualityIssues+' dokumentierte offene Qualitätsfälle. Werte zählen im gesamten Archiv anders als die variantenspezifischen Vorschläge.</p>'
    +'<details><summary>Importierte Einträge, die nicht übernommen werden konnten ('+rejections.length+')</summary>'
    +(rejections.length?'<ul>'+rejections.map(x=>'<li><strong>'+esc(x.id)+'</strong>: '+esc(x.reason)+'</li>').join('')+'</ul>'
      :'<p>Keine zusätzlichen Einträge für diese Variante abgewiesen. Ausnahmen: Reise-/Preiszuordnungen für andere Varianten wurden absichtlich nicht übertragen.</p>')
    +'</details><details><summary>Alle '+problems.length+' Datenqualitäts-Hinweise anzeigen</summary><ol>'
    +problems.map(x=>'<li><strong>'+esc(x.severity)+' · '+esc(x.id)+'</strong> '
      +esc(x.issue)+'<small>'+esc(x.action)+'</small></li>').join('')+'</ol></details>'
    +'<details><summary>'+data.sources.length+' Quellen und deren Prüfstand anzeigen</summary><ul>'+sourceLabels+'</ul></details>'
    +'<p class="muted">Keine Aktivauswahl, Reservierung, Bezahlung, bestätigte Koordinate oder 2027-Verbindung aus dem Zusatzpaket abgeleitet. Eine fehlende genaue Position wird als offen angezeigt.</p>');
}
