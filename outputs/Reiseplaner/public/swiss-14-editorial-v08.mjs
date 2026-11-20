import {esc,btn,icon,urlLink} from './ui.mjs';
import {placeThumbnailHtml} from './place-profile.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';

/**
 * Editorial notes ONLY for the 14-day interrail_swiss trip (3 people).
 * Never replace the imported survey-v19 activity IDs, confirmed itinerary,
 * timetable, hotel, GPS or spending data.
 * A three-part narrative is NOT a timed three-stop booking.
 */
export const SWISS_EDITORIAL_14=Object.freeze([
 {date:'2027-09-01',city:'paris',
  morning:'München: Bahnsteig und Reservierungsstatus prüfen, frühstücken, Trinkwasser und Snacks für drei einpacken. Keine Besichtigung vor der Fernfahrt.',
  noon:'Nach der tatsächlichen Ankunft zuerst Gepäck und Unterkunftszugang klären. Seineufer als lockere vorhandene Tagesidee, nur wenn noch Tageslicht und Energie bleiben.',
  evening:'Quartier Latin oder bereits vorgesehener Spaziergang; unkompliziertes Abendessen oder Lebensmittel für das erste Frühstück suchen.',
  food:'Anreisetag: kleine mobile Vorräte mitnehmen. Küche nur einplanen, wenn die konkrete Unterkunft sie bestätigt.',
  buffer:'Mindestens einen freien Ankunftsblock für Verspätung, lokalen Weg und Check-in lassen.',
  alternative:'Bei später Ankunft beide Ortsideen verkürzen oder auslassen; kein Restaurant oder Ticket voraussetzen.',
  checks:['Fernzug nach Paris und Sitzreservierung für drei','Ankunft, Unterkunfts-Check-in, letzter ÖPNV'],
  sourceIds:[]},
 {date:'2027-09-02',city:'paris',
  morning:'Montmartre aus dem vorhandenen Entwurf; Aussicht und Wege am Hügel ohne verbindliche Einlasszeit.',
  noon:'Die bestehenden Quartier-/Kanal-Ideen nach Lage und verbleibender Zeit kombinieren. Bei größerer Distanz nur einen Schwerpunkt wählen.',
  evening:'Canal Saint-Martin oder entspanntes Picknick am Wasser; Rückfahrt und Einkauf für den nächsten langen Zugtag berücksichtigen.',
  food:'Preiswertes Mittagessen oder Bäckerei; Supermarkt-Vorrat für Paris–Barcelona bereits am Vorabend besorgen.',
  buffer:'Zusätzliche Stadtquerungen und etwaigen Andrang nicht als kostenlose Minuten behandeln.',
  alternative:'Bei Regen eher eine vorhandene Indoor-Alternative prüfen; Louvre ist nicht gebucht.',
  checks:['Öffnungszeiten/Eintritt der gewählten Sehenswürdigkeit','Reservierungen für Paris–Barcelona am Folgetag'],
  sourceIds:[]},
 {date:'2027-09-03',city:'barcelona',
  morning:'Abfahrt aus Paris: Gepäck, Bahnreservierung, Essen und Umstiege zuerst. Kein vorgebuchtes Vormittagsprogramm.',
  noon:'Nach Ankunft in Barcelona Gepäck/Unterkunft klären; Barceloneta nur als flexible, bereits vorhandene Tagesidee.',
  evening:'El Born und leichte Abendrunde, wenn Zugankunft und Energie es zulassen.',
  food:'Essen für die Zugfahrt bereits in Paris einkaufen; Abendessen oder Selbstversorgung je nach nachgewiesener Küche.',
  buffer:'Fernzugwechsel, innerstädtischen Transfer und Check-in vor Strandzeit einplanen.',
  alternative:'Bei langer Verspätung Strand auslassen und nur nahe der Unterkunft essen.',
  checks:['Paris–Barcelona: 2027-Zug, mögliche Reservierung und Ankunft','Gepäcklagerung/Check-in für drei'],
  sourceIds:[]},
 {date:'2027-09-04',city:'barcelona',
  morning:'Bogatell/Poblenou: bestehende Küsten-/Stadtidee ohne feste Startzeit; Schatten und Wasser mitnehmen.',
  noon:'Ciutadella oder vorhandene Park-/Strandidee mit längerer Pause. Ein weiteres Ziel nur bei realistischem Ortswechsel.',
  evening:'Club nur als ausdrückliche Option: Veranstaltung, Einlassalter, Rückweg, Tickets und Kosten noch prüfen; sonst ruhiger Abend.',
  food:'Supermarkt und gemeinsames Kochen prüfen, aber nur bei tatsächlich belegter Küchen- und Vorratslage.',
  buffer:'Bei Sommerhitze Strand- und Mittagspause verlängern. Club nicht zusätzlich als Pflichtprogramm übernehmen.',
  alternative:'Ohne Clubticket lieber Stadtspaziergang und frühe Erholung.',
  checks:['Badewetter und Sicherheit am Strand','Club: konkretes Programm, Rückverkehr und tatsächlicher Eintritt'],
  sourceIds:[]},
 {date:'2027-09-05',city:'barcelona',
  morning:'Gràcia / vorhandene Aussichtsidee; weite Wege und Treppen mitplanen.',
  noon:'Bunkers/Montjuïc nach tatsächlicher Lage, Zugangsregeln und Hitze wählen; nicht beide Aussichtspunkte unter Zeitdruck erzwingen.',
  evening:'Offener Ausklang nahe Unterkunft, Abendessen, Einkauf und Vorbereiten der Zugreise nach Sète.',
  food:'Eigenes Abendessen möglich, falls Küche bestätigt; Zugverpflegung für 06.09. vorbereiten.',
  buffer:'Für Aussichtspunkte zusätzliche Hin-/Rückfahrt und einen Wetterpuffer offenlassen.',
  alternative:'Sagrada Família ist nur eine separate, ungebuchte Alternative. Zugang und Termine vor Auswahl prüfen.',
  checks:['Zugangsregeln der konkreten Aussichtspunkte','Barcelona–Sète: Tickets, Reservierungen und Anschlüsse'],
  sourceIds:[]},
 {date:'2027-09-06',city:'sete',
  morning:'Barcelona verlassen, Zug und Anschlüsse prüfen, Frühstück sowie Wasser für die Fahrt besorgen.',
  noon:'Sète: Ankunft, Gepäck und Unterkunft priorisieren; Kanäle/Hafen aus dem existierenden Entwurf nur bei ausreichender Zeit.',
  evening:'Pointe Courte oder Hafenrunde; vor Ort entscheiden, ob noch ein Spaziergang sinnvoll ist.',
  food:'Einfaches Abendessen oder Einkaufen für den Folgetag. Restaurants nicht ohne konkrete Öffnungsquelle voraussetzen.',
  buffer:'Grenzverkehr, Umstiege, Unterkunftsweg und Ruhe nach der Fahrt abdecken.',
  alternative:'Späte Ankunft: nur ein kurzer Hafenblick, kein zusätzlicher Ausflug.',
  checks:['Barcelona–Sète: tatsächliche Verbindung für 2027','Check-in und Schließzeiten Unterkunft'],
  sourceIds:[]},
 {date:'2027-09-07',city:'sete',
  morning:'Vorhandene Strand-/Corniche-Idee, aber Sonne, Wind und Badebedingungen beachten.',
  noon:'Mont Saint-Clair als bestehender Aussichtsschwerpunkt; reale Fußwege, Steigung und Rückweg einplanen.',
  evening:'Lockerer Küsten-/Hafenabend statt zusätzlichem straffen Programm.',
  food:'Picknick ist eine Idee, kein bestätigtes Geschäft. Wasser und Lebensmittel vor Ort nach Öffnungszeiten kaufen.',
  buffer:'Hitze, Weganstieg und Strandpause dürfen die geplante Dauer verlängern.',
  alternative:'Bei starkem Wind oder schlechter Sicht Stadtrunde an Kanälen statt Aussicht/Strand.',
  checks:['Wetter, Strömung und Baderegeln','Transport und Proviant für Sète–Nizza'],
  sourceIds:[]},
 {date:'2027-09-08',city:'nice',
  morning:'Zugfahrt Sète–Nizza vorbereiten und Reservierungsstatus prüfen; kein fester Stadtstopp während der Anreise.',
  noon:'Nach der Ankunft zuerst Unterkunft und Gepäck, dann Promenade des Anglais als flexible bestehende Idee.',
  evening:'Vieux-Nice/Cours Saleya für einen ruhigen Altstadtabend; tatsächliche Öffnung der Lokale prüfen.',
  food:'Kleine Reisemahlzeit und später leichte Selbstversorgung oder belegtes Restaurant.',
  buffer:'Weg vom Bahnhof, Check-in und ausreichend Schlaf vor dem folgenden Küstentag.',
  alternative:'Bei Verspätung nur eine kurze Runde nahe der Unterkunft.',
  checks:['Sète–Nizza 2027: echte Ankunft und Umstiege','Unterkunft und späte Schlüsselübergabe'],
  sourceIds:[]},
 {date:'2027-09-09',city:'nice',
  morning:'Vorhandene Küstenidee bei Villefranche/Plage des Marinières: Nahverkehr und Meerbedingungen prüfen.',
  noon:'Colline du Château beziehungsweise vorhandener Aussichtspunkt mit Wasserpause; Nahverkehrsweg nicht unterschätzen.',
  evening:'Altstadt/Hafen als kurzer Ausklang, früh zurück wegen der langen Schweiz-Fahrt am 10.09.',
  food:'Lebensmittel, Frühstück und Zugproviant für drei Personen vor dem nächsten Reisetag kaufen.',
  buffer:'Strandaufenthalt und Küstenverkehr nicht zu eng takten; Abreisevorbereitung hat Priorität.',
  alternative:'Schlechtes Meerwetter: bestehende Altstadt-/Aussichtsoption wählen, ohne zusätzliche Buchung.',
  checks:['Nahverkehr zur konkreten Küstenidee','Nizza–Kandersteg: vollständige Zugkette, Reservierungen und spätes Einchecken'],
  sourceIds:[]},
 {date:'2027-09-10',city:'kandersteg',
  morning:'Früher Start in Nizza nach erst noch zu bestätigender Bahnverbindung; für drei Reisende Verpflegung und Reservierungsunterlagen mitnehmen.',
  noon:'Ganzer Transfertag nach Kandersteg. Über Italien/Mailand–Brig oder via Lyon–Genf nur vollständige, tatsächlich passende Anschlussketten vergleichen.',
  evening:'Kandersteg: nach realer Ankunft ausschließlich Unterkunft, Essen, Ruhe und Vorbereitung für Oeschinensee.',
  food:'Snacks, Wasser und eine vollständige Ersatzmahlzeit vor Zugbeginn einpacken; bei später Ankunft nicht auf geöffnete Geschäfte setzen.',
  buffer:'Besonders großer Umstiegs- und Anschluss-Puffer; importierte 07:20–19:30 sind KEIN bestätigter Fahrplan.',
  alternative:'Wenn die vollständige Tagesankunft nicht realistisch ist, Reiseroute bewusst neu entscheiden. Keine unbelegte Zwischenübernachtung erfinden.',
  checks:['BLS RE1 via Goppenstein bzw. Alternativkorridor vollständig prüfen','EC-Reservierung Italien–Schweiz, Interrail und 2027-Fahrtage','Später Unterkunfts-Check-in für drei Personen'],
  sourceIds:['https://www.sbb.ch/de','https://www.bls.ch/de/fahren/fahrplan/bls-linien','https://www.interrail.com/en-int/plan-your-trip/tips-and-tricks/trains-europe/trains-country/trains-italy']},
 {date:'2027-09-11',city:'kandersteg',
  morning:'Kandersteg → Oeschinen-Gondel: Sommerbetrieb 2027 veröffentlicht, Tagesbetrieb und Tickets/Zeitslot für drei zusätzlich prüfen.',
  noon:'Eine Route wählen: direkte Bergstation–Seeufer-Option oder getrennte anspruchsvollere Heuberg-Runde mit eigenem offiziellen GPX. Nicht zusammen als sicheren Spaziergang behandeln.',
  evening:'Talfahrt vor Betriebsschluss, Abendessen und Erholung. Keine zusätzliche Bergtour erzwingen.',
  food:'Wasser und Picknick mitnehmen; Einkauf bereits am Vorabend sichern, wenn Ankunft am 10.09. spät ist.',
  buffer:'Wanderzeit, Trittsicherheit, Wetterwechsel, Zustieg und letzte Gondel sind zusätzliche Zeitblöcke.',
  alternative:'Bei Regen/Sturm oder geschlossenen Wegen: nur Kandersteg-Dorf und sichere Taloptionen, keine Heuberg-/Äscher-Tour.',
  checks:['Oeschinensee-Gondel: 24.04.–19.09.2027, derzeit veröffentlicht 08:30–18:00','2027er Slotpflicht und Gondeltickets für drei prüfen','Live-Wegstatus und passende GPX-Variante kontrollieren'],
  sourceIds:['https://www.oeschinensee.ch/tarife-fahrplan/','https://www.oeschinensee.ch/wandern/','https://www.oeschinensee.ch/live/']},
 {date:'2027-09-12',city:'appenzell',
  morning:'Kandersteg: Frühstück, Gepäck, Check-out und rechtzeitiger Zug zur bestehenden Anschlusskette nach Appenzell.',
  noon:'Transfer über SBB/BLS/regionale Anschlüsse. Die importierte Zeit 09:30–15:30 ist eine unverbindliche Referenz.',
  evening:'Appenzeller Hauptgasse/Ortsrunde nur nach wirklicher Ankunft und Check-in; ausruhen.',
  food:'Sonntag: Nicht mit regulär geöffnetem Supermarkt rechnen. Vorräte Samstag sichern; warme Mahlzeit nur nach Öffnungsprüfung.',
  buffer:'Bahnhofswechsel, längere Anschlüsse, Schlüsselübergabe und Wetterruhe vor dem Wandertag.',
  alternative:'Bei Verspätung Dorfspaziergang weglassen, nur Unterkunft und Essen.',
  checks:['Kandersteg–Appenzell für Sonntag 12.09.2027 nachprüfen','Sonntags-Check-in und Bahnhof–Unterkunft-Weg','Vorräte für den Seealpsee-Wandertag'],
  sourceIds:['https://www.sbb.ch/de','https://appenzellerbahnen.ch/de/reiseinformationen/fahrplan.html']},
 {date:'2027-09-13',city:'appenzell',
  morning:'Appenzell → Wasserauen mit separatem Regionalticket für drei Personen, danach auf der offiziell gewählten Seealpsee-Route wandern.',
  noon:'Seealpsee am Ufer mit ausgedehnter Rast und Picknick; Rückweg mit ausgeschilderter Route und Tageslichtreserve.',
  evening:'Rückfahrt Wasserauen → Appenzell, Abendessen, trockene Kleidung und Heimreisevorbereitung.',
  food:'Proviant, Trinkwasser und bei Bedarf gekochte Mahlzeit aus bestätigter Küche; kein zwingender Hütten-/Restaurantkauf.',
  buffer:'Wegzustand, Bergwegniveau T2 bei Hüttentobel, Rückweg sowie Zugabfahrten separat berücksichtigen.',
  alternative:'Ebenalp/Wildkirchli/Äscher ist eine separate, nicht automatisch übernommene Tour. Der steile Äscher–Seealpsee-Abstieg ist keine leichte Variante.',
  checks:['Appenzell–Wasserauen nicht als achten Interrail-Passtag voraussetzen','Bergweg/SAC-T2, Wetter und Zustand vor Start','Gondel Ebenalp nur als getrenntes Programm mit eigener Prüfung'],
  sourceIds:['https://appenzellerbahnen.ch/de/reiseinformationen/fahrplan.html','https://www.appenzell.ch/de/service/touren.html?tx_wstourismus_tourismus%5Btour%5D=39','https://www.ebenalp.ch/sommer/wanderkarte/ebenalp-wildkirchli-aescher-ebenalp']},
 {date:'2027-09-14',city:'appenzell',
  morning:'Appenzell: Check-out, Gepäck, Frühstück und rechtzeitig zum Bahnhof.',
  noon:'Rückreise Richtung München mit dem siebten als Entwurf vorgesehenen Pass-Reisetag. Anschlussreserve und Inbound-Regel klären.',
  evening:'Ankunft München ohne zusätzliches Programm; je nach wirklicher Zugankunft Puffer für Heimweg lassen.',
  food:'Proviant vor Abfahrt besorgen, besonders bei längerer Anschlusskette; keine fiktiven Bahnhofspreise.',
  buffer:'Rückfahrt, Verspätungen und Heimweg haben Vorrang vor Sehenswürdigkeiten.',
  alternative:'Bei Störung offizielle SBB-/ÖBB-/DB-Alternativen nachschlagen; nicht ohne Ticketprüfung spontan umplanen.',
  checks:['Appenzell–München am 14.09.2027 und Umsteigeverbindungen prüfen','Interrail-Inbound-/Reservierungsregeln kontrollieren'],
  sourceIds:['https://www.sbb.ch/de','https://www.oebb.at/','https://int.bahn.de/de']}
]);

const ordered=['morning','noon','evening'];
const phases={morning:'Morgen',noon:'Mittag / Nachmittag',evening:'Abend'};
const categoryGlyph={morning:'sun',noon:'clock',evening:'moon'};
const noteUrl=(item)=>{
 const candidates=[item?.officialVenueV77?.sourceUrl,item?.officialAccessV57?.sourceUrl,
  item?.swissGuideV75?.sourceUrl,item?.cityGuideV76?.sourceUrl,
  item?.publicPlaceGuideV68?.sourceUrl,item?.sourceUrl,item?.website];
 return candidates.find(x=>typeof x==='string'&&x.startsWith('https://'))??null;
};
const periodMatches=(slot,key)=>key==='noon'
 ?slot.period==='noon'||slot.period==='afternoon':slot.period===key;
export function swissEditorialFor(ctx){
 if(ctx?.trip?.id!=='interrail_swiss'||ctx.people?.length!==3)return null;
 const row=SWISS_EDITORIAL_14.find(x=>x.date===ctx.date);
 if(!row||ctx.dayPlan?.city!==row.city||ctx.dayPlan?.date!==row.date)return null;
 return row;
}
export function swissEditorialPanel(ctx){
 const row=swissEditorialFor(ctx);
 if(!row)return '';
 const day=ctx.dayPlan;
 const active=new Set((ctx.active??[]).filter(x=>x.kind==='activity'
  &&!x.removed&&((x.date??'')===ctx.date||(x.start??'').startsWith(ctx.date)))
  .map(x=>x.id));
 const slots=key=>day.slots.filter(slot=>periodMatches(slot,key));
 const cards=ordered.map(key=>{
  const ideas=slots(key).map(slot=>{
   const item=ctx.all?.find(x=>x.id===slot.id);
   if(!item)return '';
   const chosen=active.has(slot.id),somewhere=ctx.activeSet?.has(slot.id)&&!chosen;
   const photo=placeThumbnailHtml(item,ctx);
   const location=item.kind==='activity'&&item.pointPrecision!=='unverified_or_not_single_location'
     &&item.name?urlLink(googleMapsSearchUrl(item,ctx.cities),'Google Maps'):'';
   const source=noteUrl(item);
   return '<article class="swiss-editorial-idea" data-idea-id="'+esc(slot.id)+'">'
    +(photo?'<span class="swiss-editorial-image">'+photo+'</span>':'')
    +'<div class="swiss-editorial-idea-copy"><strong>'+esc(slot.name)+'</strong>'
    +'<small>'+esc(slot.minutes)+' Min. aus dem vorhandenen Entwurf'
      +(slot.optional?' · optionale Alternative':' · nicht automatisch übernommen')+'</small>'
    +'<div class="swiss-editorial-idea-actions">'
    +(chosen?'<span class="swiss-editorial-chosen">'+icon('check')+' Bereits eingeplant</span>'
      :somewhere?'<span>In einem anderen Tag eingeplant</span>'
      :btn('day-plan-add','Zum Tag','plus',slot.id,'subtle'))
    +btn('details','Details','folder',slot.id)
    +location
    +(source?urlLink(source,'Quellseite'):'')
    +'</div></div></article>';
  }).join('');
  return '<section class="swiss-editorial-block" data-period="'+key+'">'
   +'<header><span>'+icon(categoryGlyph[key])+'</span><strong>'+phases[key]+'</strong>'
   +'<small>Reihenfolge flexibel · keine feste Uhrzeit</small></header>'
   +'<p>'+esc(row[key])+'</p>'
   +(ideas?'<div class="swiss-editorial-ideas">'+ideas+'</div>':'')
   +'</section>';
 }).join('');
 const urls=row.sourceIds.map((u,i)=>urlLink(u,'Offizielle Prüfquelle '+(i+1))).join('');
 const dateIndex=SWISS_EDITORIAL_14.findIndex(x=>x.date===row.date);
 const navigation='<div class="swiss-editorial-nav">'
  +(dateIndex>0?btn('day-plan-go','Vorheriger Tag','arrow-left',SWISS_EDITORIAL_14[dateIndex-1].date):'')
  +'<strong>Tag '+(dateIndex+1)+' / 14 · '+esc(ctx.date)+'</strong>'
  +(dateIndex<13?btn('day-plan-go','Nächster Tag','arrow-right',SWISS_EDITORIAL_14[dateIndex+1].date):'')
  +'</div>';
 return '<section class="swiss-editorial-plan" aria-label="Interrail mit Schweiz · Tagesablauf für drei Personen">'
  +navigation
  +'<header class="swiss-editorial-heading"><p>3 Reisende · unverbindlicher Tagesentwurf</p>'
  +'<h3>Morgen, Mittag & Abend</h3>'
  +'<span>Nur belegte vorhandene Aktivitäten · keine Tickets oder Preise erfunden</span></header>'
  +'<div class="swiss-editorial-timeline">'+cards+'</div>'
  +'<div class="swiss-editorial-logistics">'
  +'<section><h4>'+icon('food')+' Küche & Lebensmittel</h4><p>'+esc(row.food)+'</p></section>'
  +'<section><h4>'+icon('clock')+' Puffer</h4><p>'+esc(row.buffer)+'</p></section>'
  +'<section><h4>'+icon('cloud')+' Alternative</h4><p>'+esc(row.alternative)+'</p></section>'
  +'</div>'
  +'<details class="swiss-editorial-evidence"><summary>'
   +icon('info')+' Konkrete Prüfungen & offizielle Links ('+row.checks.length+')'
   +'</summary><ul>'+row.checks.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'
   +(urls?'<div class="swiss-editorial-links">'+urls+'</div>':'')
   +'<p>Offizielle Referenzseiten prüfen: 2027-Tarife, Öffnung und Züge bleiben '
   +'bis zur jeweiligen verbindlichen Buchungs-/Betreiberbestätigung offen.</p></details>'
  +'<p class="swiss-editorial-footnote">Redaktionelle Ideen ändern weder den gespeicherten Tagesplan '
  +'noch Budget, Passreisetage oder Buchungsstatus. Erst „Zum Tag“ legt eine vorhandene '
  +'Aktivität an; die bestehende Rückgängig-Funktion bleibt verfügbar.</p>'
  +'</section>';
}
