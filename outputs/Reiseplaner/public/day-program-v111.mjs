import {renderPhotoLibraryV114} from './photo-library-v114.mjs';
import {esc,icon,btn,urlLink} from './ui.mjs';
import {localParts,groupPrice,priceForParty,money} from './model.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';
import {itineraryPhotoHtmlV112,editorialDayRailV119} from './place-profile.mjs';
import {SWISS_DAY_EDITORIAL_V85} from './swiss-day-editorial-v85.mjs';

// Clock windows are OUR planning proposals, not venue hours or train times.
// On transfer days use relative phases; never assume a 2027 arrival time.
// Activity durations and identities resolve against the existing V32 archive.
const a=(time,id,detail)=>({time,type:'activity',id:'survey-v19:'+id,detail});
const p=(time,type,title,detail,minutes=null)=>({time,type,title,detail,minutes});
export const SWISS_PROGRAM_V111={
 '2027-09-01':[
  p('Vor Abfahrt','meal','Frühstück & Reiseproviant','Zu Hause frühstücken, Wasser und Sandwiches einpacken.'),
  p('Vorläufige Zugfahrt','transfer','München → Paris','Reservierung und Abfahrt am tatsächlichen Reisetag prüfen.'),
  p('Nach Ankunft','lodging','Gepäck abgeben / Check-in','Vom tatsächlichen Ankunftsbahnhof zur gewählten Unterkunft; Schlüsselübergabe zuerst.'),
  a('Danach, wenn Zeit bleibt','act-002','Île de la Cité bis Louvre am Seineufer; nur Außenrunde, bei Verspätung kürzen.'),
  p('Anschließend','pause','Pause & Ortswechsel','Wasser auffüllen; Metro oder Fußweg abhängig von Unterkunft und Energie.'),
  a('Abends','act-007','Quartier Latin erkunden und eine günstige warme Mahlzeit wählen.'),
  p('Zum Tagesende','lodging','Zur Unterkunft','Rückweg prüfen, ausruhen und Frühstück vorbereiten.')],
 '2027-09-02':[
  p('08:00–09:00','meal','Frühstück & Aufbruch','Bäckerei oder Unterkunftsküche; Wasser und Proviant mitnehmen.',60),
  p('09:00–09:45','connection','Zum Trocadéro','45 Min. Planreserve für Metro/Fußweg, keine berechnete Gehzeit.',45),
  a('09:45–10:35','act-001','Panorama, Fotos und Außenansicht; kein Aufzugticket vorausgesetzt.'),
  p('10:35–11:30','connection','Weiter nach Montmartre','ÖPNV bevorzugen; Umstieg und Aufstieg einrechnen.',55),
  p('11:30–12:30','meal','Mittagspause','Sandwiches oder günstige Bäckerei, Sitzpause.',60),
  a('12:30–14:20','act-003','Gassen, Sacré-Cœur-Vorplatz und Aussicht; Innenbesuch nicht vorausgesetzt.'),
  p('14:20–16:30','pause','Freizeit & Fahrt zum Kanal','Zeit für Café, Rückweg zum ÖPNV und unerwartete Wartezeiten.',130),
  a('16:30–18:00','act-004','Canal Saint-Martin entlanglaufen; Bäckerei-Picknick als frühes Abendessen.'),
  p('Ab 18:00','lodging','Freier Abend / Rückfahrt','Optional länger am Kanal bleiben oder kochen; Heimweg separat prüfen.')],
 '2027-09-03':[
  p('Vor Abfahrt','meal','Frühstück & Check-out','Proviant für die Fernzugfahrt, Gepäck und Zimmer kontrollieren.'),
  p('Vorläufige Zugfahrt','transfer','Paris → Barcelona','Gare de Lyon / Sants und die tatsächliche Verbindung prüfen.'),
  p('Nach Ankunft','lodging','Gepäck & Unterkunft','Check-in, Wasser und Snack; Strand erst danach.'),
  a('Später Nachmittag, falls möglich','act-009','Barceloneta: Spaziergang, Baden nur bei sicheren Bedingungen.'),
  p('Danach','connection','Weiter nach Poblenou','Weg nach aktuellem Standort und Öffnung planen.'),
  a('Abends, optional kürzen','act-015','Straßen und Cafés, günstiges Abendessen; bei Verspätung nur Unterkunftsnähe.'),
  p('Zum Tagesende','lodging','Rückweg & Erholung','Sichere Rückfahrt und Einkauf für morgen klären.')],
 '2027-09-04':[
  p('08:30–09:30','meal','Frühstück & Einkauf','Picknick, Wasser und Sonnenschutz besorgen.',60),
  a('10:00–11:15','act-010','Parc de la Ciutadella: Grünanlagen, Picknick und kurze Pause.'),
  p('11:15–12:30','connection','Zum Strand Bogatell','Fußweg oder ÖPNV je nach Route; Mittagssnack unterwegs.',75),
  a('12:30–15:00','act-008','Strand, lockerer Sport, Baden nur bei geeigneten Bedingungen.'),
  p('15:00–17:30','pause','Erholung & Duschen','Rückfahrt zur Unterkunft, Schatten und freie Zeit.',150),
  p('18:00–19:30','meal','Gemeinsam essen','Einfache Küche, sofern vorhanden, sonst preiswerte Mahlzeit.',90),
  a('Abends · nur bei passendem Event','act-016','Club nur nach Prüfung von Eintritt, Alter, Event und sicherer Heimfahrt. Keine Pflicht.')],
 '2027-09-05':[
  p('08:00–09:00','meal','Frühstück','Proviant und Wasser für die Aussichtspunkte.',60),
  p('09:00–10:00','connection','Zum Turó de la Rovira','ÖPNV und Aufstieg berücksichtigen; Zugang prüfen.',60),
  a('10:00–11:40','act-011','Aussicht genießen und Fotos machen; veröffentlichte Zugangszeiten erneut prüfen.'),
  p('11:40–13:30','meal','Mittagspause & Ortswechsel','Essen und längeren Transfer in das Montjuïc-Gebiet einkalkulieren.',110),
  a('13:30–15:40','act-014','Grünanlagen und Aussicht; kostenpflichtige Gondel nicht eingerechnet.'),
  a('Alternative zum Montjuïc-Block','act-012','Innenbesuch nur nach bestätigtem Ticket/Zeitfenster; nicht zusätzlich erzwingen.'),
  p('15:40–18:00','pause','Freizeit & Rückfahrt','Reserve für längere Wege oder Erholung.',140),
  p('Abends','meal','Abendessen & Packen','Proviant und Unterlagen für den Zug nach Sète vorbereiten.')],
 '2027-09-06':[
  p('Vor Abfahrt','meal','Frühstück / Check-out','Zimmer prüfen, Gepäck und Reiseproviant mitnehmen.'),
  p('Vorläufige Zugfahrt','transfer','Barcelona → Sète','Anschluss, Reservierung und Bahnhof erst mit tatsächlicher Verbindung bestätigen.'),
  p('Nach Ankunft','lodging','Unterkunft erreichen','Gepäck abgeben, Snack und kurze Pause.'),
  a('Danach','act-019','Canal Royal, Hafen und Kanäle; lockere Außenrunde.'),
  p('Zwischen den Stopps','connection','Zur Pointe Courte','Weg nach Tageslicht, Energie und Standort wählen.'),
  a('Abends, falls genug Zeit','act-020','Fischerviertel ruhig erkunden; bei später Ankunft auslassen.'),
  p('Danach','meal','Abendessen & Rückweg','Einkauf oder einfache Mahlzeit, anschließend Erholung.')],
 '2027-09-07':[
  p('08:30–09:30','meal','Frühstück & Strandtasche','Wasser, Sonnenschutz, Snacks und Handtuch einpacken.',60),
  p('09:30–10:00','connection','Zum Strand','Nur Planreserve; Bus/Fußweg vom tatsächlichen Ausgangspunkt prüfen.',30),
  a('10:00–13:00','act-017','Plage de la Corniche: Baden, Strandspiele und Schattenpausen.'),
  p('13:00–14:30','meal','Mittag & Fahrt zum Aussichtspunkt','Picknick, Wasser auffüllen; Steigung und Hitze einplanen.',90),
  a('14:30–16:40','act-018','Mont Saint-Clair: Aussicht und ruhige Runde; bei Hitze Anstieg reduzieren.'),
  p('16:40–18:00','connection','Abstieg & zum Picknick','Puffer für Rückweg und Einkauf.',80),
  a('18:00–19:30','act-022','Flexibler Strandabschnitt für regionales Picknick; bei Wind geschützten Ort suchen.'),
  p('Abends','lodging','Zur Unterkunft','Packen für die Weiterfahrt nach Nizza.')],
 '2027-09-08':[
  p('Vor Abfahrt','meal','Frühstück & Check-out','Wasser und günstigen Zugproviant besorgen.'),
  p('Vorläufige Zugfahrt','transfer','Sète → Nizza','Umstiege und Reisezeit für 2027 offen.'),
  p('Nach Ankunft','lodging','Gepäck & Check-in','Keine zusätzliche Besichtigung vor sicherer Gepäckabgabe.'),
  a('Später Nachmittag, wenn möglich','act-023','Promenade des Anglais, Kiesstrand und kurze Pause; Baden wetterabhängig.'),
  p('Danach','connection','Richtung Altstadt','Fußweg/ÖPNV nach Ankunft und Tageslicht wählen.'),
  a('Abends, flexibel','act-025','Vieux-Nice: Gassen und Essen; kein Abendmarkt garantiert.'),
  p('Zum Tagesende','lodging','Rückweg & Schlaf','Bei Verspätung nur Essen und Unterkunft.')],
 '2027-09-09':[
  p('08:00–09:00','meal','Frühstück & Proviant','Strandtasche, Wasser und Snacks vorbereiten.',60),
  p('09:00–10:00','connection','Nach Villefranche-sur-Mer','Regionalzug/Bus prüfen, Reserve für Bahnhof und Weg.',60),
  a('10:00–12:40','act-026','Plage des Marinières: baden und entspannen, falls sicher.'),
  p('12:40–14:30','meal','Mittag & Rückfahrt nach Nizza','Picknick oder Snack, Rückfahrt und Aufstiegspuffer.',110),
  a('14:30–16:00','act-024','Colline du Château: Aussicht; Zugang und Betriebszeiten prüfen.'),
  p('16:00–17:30','pause','Abstieg, Pause & Hafenweg','Zeit für Wasser, Einkauf und unvorhergesehene Wege.',90),
  a('17:30–18:45','act-028','Port Lympia: ruhige Hafenrunde.'),
  p('Abends','meal','Früh essen & packen','Proviant, Ladekabel und Zugunterlagen für den langen Transfer.')],
 '2027-09-10':[
  p('Vor Abfahrt','meal','Frühstück & Check-out','Haltbares Essen und Wasser für den langen Bahntag einpacken.'),
  p('Vorläufige Zugfahrt','transfer','Nizza → Kandersteg','Vollständige Anschlusskette erst mit 2027er Fahrplan prüfen; keine erfundenen Zwischenstopps.'),
  p('Unterwegs','meal','Essen im Zug / Umstieg','Flexible Pausen an sicheren Anschlüssen; nicht auf kurze Umstiege angewiesen sein.'),
  p('Nach Ankunft','connection','Zur Unterkunft','Letzten Anschluss und späte Schlüsselübergabe vor Abfahrt klären.'),
  p('Danach','lodging','Check-in & Erholung','Zimmer beziehen, duschen, keine zusätzliche Attraktion.'),
  p('Abends','meal','Abendessen & Wandercheck','Wetter, Gondel, Wege, Trinkwasser und Kleidung für morgen prüfen.')],
 '2027-09-11':[
  p('07:30–08:30','meal','Frühstück & Ausrüstung','Wetter, Wegfreigabe, Gondelbetrieb, Wasser und feste Schuhe prüfen.',60),
  p('08:30–09:30','connection','Zur Talstation','Gehweg/Bus von der Unterkunft und Wartezeit einplanen; Ticket separat.',60),
  a('09:30–13:00','act-053','Gondel und leichte Seeuferroute; Heuberg nur als alternative anspruchsvollere Tour, nicht zusätzlich.'),
  a('13:00–14:35','act-054','Seeuferpause und Picknick; abgesperrte Bereiche meiden.'),
  p('14:35–17:00','connection','Zurück zur Gondel / ins Tal','Großer Sicherheitspuffer vor veröffentlichter Betriebsschließung; bei Störungen früher umkehren.',145),
  a('Abends · nur bei Energie','act-055','Optionaler Dorfspaziergang, ansonsten ausruhen.'),
  p('Abends','meal','Kochen & Erholung','Füße schonen, Essen und Proviant für Sonntag vorbereiten.')],
 '2027-09-12':[
  p('Vor Abfahrt','meal','Frühstück & Check-out','Sonntagsöffnungen nicht voraussetzen; Vorräte mitnehmen.'),
  p('Vorläufige Zugfahrt','transfer','Kandersteg → Appenzell','SBB-Anschlüsse und Ankunft neu prüfen.'),
  p('Nach Ankunft','lodging','Gepäck & Unterkunft','Einchecken, Essen, Pause; kein zusätzlicher Bergbahnausflug.'),
  a('Abends, wenn Zeit bleibt','act-044','Altstadt und Hauptgasse; Läden am Sonntag nicht als geöffnet annehmen.'),
  p('Danach','meal','Abendessen & Wanderplanung','Regionalfahrt nach Wasserauen und Wetter für morgen prüfen.'),
  p('Zum Tagesende','lodging','Erholung','Kleidung und Proviant vorbereiten.')],
 '2027-09-13':[
  p('07:30–08:30','meal','Frühstück & Ausrüstung','Wetter, Wegstatus, Schuhe, Wasser und Proviant prüfen.',60),
  p('08:30–09:30','connection','Appenzell → Wasserauen','Regionalticket und Rückfahrt separat prüfen; keine 2027-Fahrzeit behaupten.',60),
  a('09:30–12:35','act-045','Leichte Fahrstraßenwanderung; Dauer ist Archiv-Planwert für den Wanderblock, keine geprüfte Hin-/Rückwegmessung.'),
  a('12:35–14:05','act-046','Seealpsee: Picknick und Pause am Wasser; nicht ohne sichere Bedingungen baden.'),
  p('14:05–17:30','connection','Rückweg nach Wasserauen / Appenzell','Großzügige Reserve für Abstieg, Wartezeit und Regionalfahrt; bei Wetterwechsel früher umkehren.',205),
  p('Abends','meal','Abendessen & Packen','Küche oder einfache Mahlzeit; Schuhe trocknen, Heimreise vorbereiten.')],
 '2027-09-14':[
  p('Vor Abfahrt','meal','Frühstück & Check-out','Zimmerkontrolle, Schlüssel und Reiseproviant.'),
  p('Vor Abfahrt','connection','Zum Bahnhof','Tatsächlichen Abfahrtsbahnhof und Anschluss prüfen.'),
  p('Vorläufige Zugfahrt','transfer','Appenzell → München','Siebter geplanter Fernreisetag; Inbound-Regel und Umsteigekette prüfen.'),
  p('Unterwegs','meal','Mittag / Abendessen nach Fahrplan','Proviant nutzen, Umstiegsreserve nicht für Besichtigungen aufbrauchen.'),
  p('Nach Ankunft','connection','Heimweg in München','Nahverkehr nach tatsächlicher Ankunft; Verspätungsreserve.'),
  p('Danach','pause','Reise beendet','Gepäck und gemeinsame Ausgaben in Ruhe abgleichen.')]
};
const labels={activity:'Aktivität',meal:'Verpflegung',connection:'Weg / Puffer',transfer:'Ferntransfer',lodging:'Unterkunft',pause:'Pause / Freizeit'};
const icons={activity:'pin',meal:'food',connection:'walk',transfer:'train',lodging:'bed',pause:'clock'};
export function detailedDayModelV111(ctx){
 if(ctx?.trip?.id!=='interrail_swiss'||ctx.dayPlan?.tripId!==ctx.trip.id||ctx.dayPlan.date!==ctx.date)return null;
 const program=SWISS_PROGRAM_V111[ctx.date];if(!program)return null;
 const slots=new Map(ctx.dayPlan.slots.map(x=>[x.id,x]));
 const items=new Map((ctx.all??[]).map(x=>[x.id,x]));
 const pending=new Set(dayPlanCandidates(ctx,{includeOptional:true}).map(s=>s.id));
 const selected=new Set((ctx.active??[]).filter(x=>x.kind==='activity'&&!x.removed&&(localParts(x.start,x.zone).date??x.date)===ctx.date).map(x=>x.id));
 const existing=new Set(program.map(r=>r.id).filter(Boolean));
 const extra=ctx.dayPlan.slots.filter(s=>!existing.has(s.id)).map(s=>({
  id:s.id,type:'activity',time:'Alternative · separat wählen',detail:'Vorhandene zusätzliche Routenoption. Nicht mit der Hauptwanderung kombinieren; Dauer, Schwierigkeit, Wetter und Wegfreigabe prüfen.'
 }));
 const rows=[...program,...extra].map((row,index)=>{
  const slot=slots.get(row.id),item=items.get(row.id);
  if(row.id&&!slot)throw Error('V111 fehlende V32-Aktivität: '+ctx.date+' '+row.id);
  return {...row,index:index+1,slot,item,title:slot?.name??row.title,minutes:slot?.minutes??row.minutes,
   optional:slot?.optional===true,selected:selected.has(row.id),canAdd:pending.has(row.id),
   elsewhere:Boolean(row.id&&!selected.has(row.id)&&ctx.activeSet?.has(row.id))};
 });
 const required=rows.filter(r=>r.slot&&!r.optional);
 return {rows,required:required.length,adopted:required.filter(r=>r.selected).length,
  pending:required.filter(r=>r.canAdd).length,activityMinutes:required.reduce((s,r)=>s+r.minutes,0),
  transfers:ctx.dayPlan.rides??[],overnight:ctx.dayPlan.overnightArrivals??[],
  editorial:SWISS_DAY_EDITORIAL_V85.find(d=>d.date===ctx.date)};
}
export function renderDetailedDayV111(ctx){
 const m=detailedDayModelV111(ctx);if(!m)return '';
 const rows=m.rows.map(r=>{
  const price=r.item?priceForParty(r.item,ctx.people??[]):null;
  const cents=groupPrice(price,ctx.people?.length??0);
  const cost=r.slot?(cents==null?'Kosten offen':money(cents,price.currency)+' · Gruppenreferenz'):'';
  const photo=r.item?itineraryPhotoHtmlV112(r.item,ctx):
   ['transfer','lodging'].includes(r.type)?itineraryPhotoHtmlV112({id:ctx.date+':'+r.index,city:ctx.dayPlan.city,name:r.title,kind:'context'},ctx):'';
  const transfer=r.type==='transfer'?'<div class="day111-transfer-evidence">'
   +[...m.overnight,...m.transfers].map(t=>'<p>'+esc(t.from??'Ankunft')+' → '+esc(t.to)+' · Archiv '+esc(t.departure??'offen')+' – '+esc(t.arrival??'offen')+' · 2027 ungeprüft</p>').join('')+'</div>':'';
  const actions=r.slot?'<div class="day111-actions">'
   +(r.canAdd?btn('day-plan-add',r.optional?'Option übernehmen':'Zum Tag hinzufügen','plus',r.id,'subtle'):r.selected?'<span>Im gespeicherten Tag</span>':r.elsewhere?'<span>An anderem Tag eingeplant</span>':'')
   +btn('details','Details','folder',r.id,'subtle')
   +(!r.optional||r.selected?btn('day111-map-stop','Auf Karte','map',r.id,'subtle'):'')+'</div>':'';
  return '<li class="day111-row" data-kind="'+r.type+'"'+(r.optional?' data-optional="true"':'')+'>'
   +'<div class="day111-time"><strong>'+esc(r.time)+'</strong><small>'+esc(r.minutes!=null?r.minutes+' Min. Planwert':'Flexibel')+'</small></div>'
   +'<span class="day111-node" aria-hidden="true">'+icon(icons[r.type])+'</span>'
   +'<article class="day111-card"><div class="day111-card-main"><div class="day111-copy"><small>'+esc(labels[r.type])+(r.optional?' · OPTION':'')+'</small><h3>'+esc(r.title)+'</h3><p>'+esc(r.detail)+'</p>'
   +(cost?'<span class="day111-cost">'+esc(cost)+'</span>':'')+'</div>'+(photo?'<div class="day111-photo day112-large">'+photo+'</div>':'')+'</div>'+transfer+actions+'</article></li>';
 }).join('');
 return '<section class="day111-program" id="day111-program" tabindex="-1" aria-label="Detaillierter Tagesplan">'
  +'<header class="day111-header"><small>TAG '+(ctx.trip.dayPlansV32.findIndex(d=>d.date===ctx.date)+1)+' · DETAILPROGRAMM</small><h2>'+esc(ctx.dayPlan.title)+'</h2><p>Konkrete Reihenfolge von Frühstück bis Rückkehr. Uhrzeitfenster sind unsere unverbindlichen Vorschläge; Fahrtzeiten und Öffnung werden dadurch nicht bestätigt.</p></header>'
  +'<div class="day111-summary"><span><strong>'+m.rows.length+'</strong> Ablaufpunkte</span><span><strong>'+m.required+'</strong> Hauptaktivitäten</span><span><strong>'+m.activityMinutes+'</strong> Min. Hauptideen</span><span><strong>'+m.adopted+'/'+m.required+'</strong> übernommen</span></div>'
  +'<div class="day111-top-actions">'+btn('day110-open','Tagesroute abspielen','map','draft','primary')+(m.pending?btn('day-plan-adopt',m.pending+' Hauptaktivitäten übernehmen','plus','','subtle'):'')+'</div>'
  +editorialDayRailV119(ctx,m.rows)
  +'<ol class="day111-timeline">'+rows+'</ol>'+renderPhotoLibraryV114(ctx,{day:true})
  +'<details class="day111-notes"><summary>Alternative, Zeitpuffer &amp; Quellen</summary><p>'+esc(m.editorial?.alternative??'')+'</p><p>'+esc(m.editorial?.buffer??'')+'</p><div>'+((m.editorial?.sources??[]).map(([label,url])=>urlLink(url,label)).join(''))+'</div></details></section>';
}
