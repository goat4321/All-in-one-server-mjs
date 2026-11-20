import {esc,urlLink} from './ui.mjs';
import {placeThumbnailHtml} from './place-profile.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';

/**
 * Editorial overlay for ONE existing itinerary. These blocks are not
 * activities, booking records, transfers or budget transactions.
 * All 2027 timetables and unquoted prices remain unconfirmed.
 */
export const SWISS_DAY_EDITORIAL_V85=[
 {date:'2027-09-01',city:'paris',blocks:[
  {period:'morning',title:'München: Abfahrt vorbereiten',detail:'Früh am Bahnhof sein, Reservierung und Zugverbindung separat prüfen. Wasser, haltbares Frühstück und Ladegeräte bereits vor Abfahrt einpacken.'},
  {period:'noon',title:'Ankunft, Gepäck und Seine',detail:'Nach dem nur vorläufig geplanten Ankunftsfenster zuerst Unterkunftsweg und Gepäck klären. Danach ein lockerer Spaziergang an der Seine statt eines festen Museums-Slots.',activity:'act-002'},
  {period:'evening',title:'Quartier Latin und günstiges Essen',detail:'Abendrunde ohne verpflichtenden Eintritt. Bäckerei oder einfache warme Mahlzeit als Gruppenoption; Preis und tatsächliche Öffnung vor Ort prüfen.',activity:'act-007'}],
  food:'Proviant am Reisetag mitnehmen; Küche erst nach bestätigtem Check-in einplanen. Falls die Unterkunft keine Küche hat: Picknick bzw. preisgünstige Einzelmahlzeit.',
  cost:'Stadtrunde im öffentlichen Raum ohne Eintritt. ÖPNV, Gepäckaufbewahrung und Essen sind zusätzlich; keine 2027er Fixpreise.',
  access:'München–Paris ist ein vorläufiger Fernzugtransfer; Einfahrtbahnhof, Check-in und Reservierung nicht aus den alten Uhrzeiten ableiten.',
  buffer:'Mindestens 90 Min. flexibel für Ankunft, Gepäck und Unterkunft, danach eine freie Stunde als Verspätungsreserve.',
  alternative:'Bei später Ankunft nur Unterkunft und Quartier Latin; Seineufer auf den Folgetag verlegen.',
  sources:[['Paris Tourismus','https://parisjetaime.com/'],['DB Reiseauskunft','https://int.bahn.de/de']]},
 {date:'2027-09-02',city:'paris',blocks:[
  {period:'morning',title:'Trocadéro: Eiffelturm-Panorama',detail:'Außenansicht und kurze Fotopause ohne Eiffelturm-Ticket. Früh starten, wenn ihr Menschenmengen vermeiden möchtet.',activity:'act-001'},
  {period:'noon',title:'Montmartre und Sacré-Cœur',detail:'Durch die Gassen, auf den Vorplatz und zu den Aussichtspunkten. Die Fahrt vom Trocadéro ist ein eigener Stadttransfer, keine kurze Fußstrecke.',activity:'act-003'},
  {period:'evening',title:'Canal Saint-Martin',detail:'Entspanntes Kanal-Picknick statt zusätzlichem kostenpflichtigen Programm; Rückfahrt zur Unterkunft einplanen.',activity:'act-004'}],
  food:'Frühstück mit Supermarkt-/Bäckereiware, mittags Sandwiches, abends einfache Küche nur bei tatsächlich verfügbarer Ausstattung.',
  cost:'Außenspaziergänge ohne Eintritt; Eiffelturm-Aufzug, Museen, Metro und Essen nicht als gratis annehmen.',
  access:'Drei räumlich getrennte Viertel; Metro-/RER-Verbindungen und die Aufenthaltswege getrennt kalkulieren.',
  buffer:'Zwischen den Vierteln jeweils mindestens 30–45 Min. Transferreserve, dazu eine freie Stunde am Nachmittag.',
  alternative:'Bei Regen eine bereits vorhandene Museumsoption statt eines Außenspaziergangs wählen; Öffnung und Kosten separat prüfen.',
  sources:[['Montmartre-Tourismus','https://parisjetaime.com/eng/article/village-paris-a922'],['Canal Saint-Martin','https://parisjetaime.com/eng/transport/canal-saint-martin-p1960']]},
 {date:'2027-09-03',city:'barcelona',blocks:[
  {period:'morning',title:'Paris → Barcelona: Bahntag',detail:'Abfahrtsbahnhof Gare de Lyon, Reservierungsbedingungen und tatsächliche Fahrzeit vor dem Reisetag beim Betreiber abgleichen.'},
  {period:'noon',title:'Barcelona Sants, Gepäck und Snack',detail:'Die Uhrzeiten aus dem alten Entwurf sind keine 2027-Verbindung. Nach Ankunft Fahrt zur Unterkunft und Check-in vor dem Strand priorisieren.'},
  {period:'evening',title:'Barceloneta und Poblenou',detail:'Nur wenn Ankunft und Wetter passen: am Meer spazieren oder baden; anschließend lockerer Abend in Poblenou statt weiterer Attraktionen.',activity:'act-009'}],
  food:'Snacks für den Langstreckenzug; nach Ankunft kleine Einkaufsliste für drei Personen und Kühlschrank-/Küchenzugang prüfen.',
  cost:'Strand frei zugänglich, sonst Nahverkehr, Essen und eventuelle Zugreservierung extra. Keine zugesagte 2027-Fahrt.',
  access:'Fernzug Barcelona Sants ≠ Strand. Gepäckweg und Nahverkehr einplanen; offizielle Badehinweise beachten.',
  buffer:'90–120 Min. für Ankunft und Unterkunft plus mindestens eine freie Stunde für Verspätungen.',
  alternative:'Bei verspätetem Zug Strand streichen und nur in Unterkunftsnähe essen.',
  sources:[['SNCF Verkaufsfenster','https://www.sncf-connect.com/en-en/help/ticket-sales-opening'],['Barcelona Stadtportal','https://guia.barcelona.cat/en/']]},
 {date:'2027-09-04',city:'barcelona',blocks:[
  {period:'morning',title:'Parc de la Ciutadella',detail:'Grünanlage und ruhiger Auftakt mit genügend Zeit für einen Einkauf oder ein einfaches Frühstück.',activity:'act-010'},
  {period:'noon',title:'Bogatell: Baden und Sport',detail:'Ein ausgedehnter Strandblock mit Wasser und Schatten. Sport, Schwimmen und Wetter nur nach tagesaktueller Lage.',activity:'act-008'},
  {period:'evening',title:'Freier Abend – Club nur optional',detail:'Entweder gemeinsam kochen und ausruhen oder einen Club erst nach Prüfung von Termin, Mindestalter, Eintritt und sicherer Rückfahrt als separate Option wählen.',activity:'act-016'}],
  food:'Picknick-Zutaten und Wasser rechtzeitig besorgen; abends Pasta oder Reis für drei, sofern die Unterkunft eine nutzbare Küche hat.',
  cost:'Park und öffentlicher Strand ohne Eintritt; Club, Getränke, spätes Taxi und Nahverkehr separat und unbestätigt.',
  access:'Ciutadella–Bogatell verbindet ihr sinnvoll per ÖPNV/Fußweg; Club-Event und Nachtverkehr erst 2027 bestätigen.',
  buffer:'30–45 Min. Wechsel zwischen Park und Strand; freien Abend nicht durch zusätzliche Sehenswürdigkeiten verplanen.',
  alternative:'Bei schlechtem Badewetter Altstadt-/Indoor-Option aus vorhandenen Einträgen statt Strand; kein erfundener Clubtermin.',
  sources:[['Barcelona Stadtführer','https://guia.barcelona.cat/en/'],['TMB Verbindungen','https://www.tmb.cat/en/home']]},
 {date:'2027-09-05',city:'barcelona',blocks:[
  {period:'morning',title:'Turó de la Rovira: Stadtpanorama',detail:'Historischer Aussichtspunkt mit veröffentlichten Sommer-Zugangszeiten 09:00–19:30 (Stand 2026); September 2027 und Zugang vor Ort erneut prüfen.',activity:'act-011'},
  {period:'noon',title:'Montjuïc und Grünanlagen',detail:'Das zweite Hügelgebiet liegt weit entfernt: Transportzeit und Pause berücksichtigen. Sagrada Família wäre eine eigene Ticket-Alternative, kein Pflichtdrittstopp.',activity:'act-014'},
  {period:'evening',title:'Einfaches Abendessen und Packen',detail:'Reisedokumente, Unterkunfts-Check-out und Snacks für die Weiterfahrt nach Sète vorbereiten.'}],
  food:'Morgens günstiges Frühstück, mittags Proviant; Abendessen mit Küche oder günstiger Alternative, keine Restaurantpreise erfunden.',
  cost:'Aussicht und Grünflächen meist ohne gesonderten Eintritt; Sagrada-Ticket und Stadtverkehr gesondert.',
  access:'Turó de la Rovira hat konkrete Zugangssperren außerhalb der Betreiberzeiten; Öffnung und Fußweg nicht mit einer freien Aussichtsfläche gleichsetzen.',
  buffer:'Mindestens 45–60 Min. für den Ortswechsel und 60 Min. freie Zeit für Packen/Erholung.',
  alternative:'Sagrada Família nur als bewusster Ersatz für Montjuïc bei bestätigtem Ticket; nicht beides automatisch verdichten.',
  sources:[['MUHBA Turó de la Rovira','https://guia.barcelona.cat/en/detall/museu-d-historia-de-barcelona-turo-de-la-rovira_99400267435.html'],['TMB','https://www.tmb.cat/en/home']]},
 {date:'2027-09-06',city:'sete',blocks:[
  {period:'morning',title:'Barcelona → Sète',detail:'Check-out, Zugfahrt und mögliche Reservierung. Ursprüngliche Ankunftszeit nur Planannahme; Essen und Wasser vor Abfahrt einpacken.'},
  {period:'noon',title:'Canal Royal nach Gepäckabgabe',detail:'Nach der Ankunft zuerst Bahnhof–Unterkunft, dann ein kurzer Rundgang am Hafen und entlang der Kanäle.',activity:'act-019'},
  {period:'evening',title:'Pointe Courte',detail:'Fischerviertel als ruhiger Abendspaziergang; bei spätem Check-in lieber auf den nächsten Tag verschieben.',activity:'act-020'}],
  food:'Vorrat für zwei Nächte früh organisieren; Kühlschrank- und Herdverfügbarkeit der tatsächlichen Unterkunft entscheiden.',
  cost:'Öffentliche Hafen-/Viertelrunde grundsätzlich ohne Eintritt; Unterkunftswege, Nahverkehr, Essen zusätzlich.',
  access:'Am Anreisetag nicht ohne bestätigten Anschluss eine zweite lange Aktivität fest einplanen.',
  buffer:'Mindestens 60–90 Min. für verspätete Bahnfahrt und Check-in.',
  alternative:'Nur eine kurze Kanalrunde nahe der Unterkunft statt beider Spaziergänge.',
  sources:[['Sète Tourismus','https://en.tourisme-sete.com/'],['Occitanie Sète','https://www.tourisme-occitanie.com/destinations/incontournables/sete/']]},
 {date:'2027-09-07',city:'sete',blocks:[
  {period:'morning',title:'Plage de la Corniche',detail:'Längerer Strandblock mit Sonnenschutz und ausreichend Wasser; Wetter, Wind und Badesicherheit prüfen.',activity:'act-017'},
  {period:'noon',title:'Mont Saint-Clair',detail:'Aussicht oberhalb der Stadt nach einer Pause; Hangwege können steil sein, daher Anreise und Rückweg realistisch planen.',activity:'act-018'},
  {period:'evening',title:'Picknick am Meer',detail:'Einfaches Abendessen aus zuvor besorgten Zutaten. Nach Wind/Wetter den Ort flexibel wählen, keinen bestimmten Strandabschnitt garantieren.',activity:'act-022'}],
  food:'Frühstück und Einkauf mit Gruppenwarenkorb planen; Picknick ohne Kühlschrank mit haltbaren Zutaten.',
  cost:'Strand und Aussicht ohne planbaren Eintritt; Bus, Einkäufe und eventuelle Gastronomie nicht im Nullpreis enthalten.',
  access:'Corniche und Hügel sind keine durchgehende kurze Flachstrecke. Anfahrt und Steigung separat prüfen.',
  buffer:'Zwischen Strand und Aufstieg mindestens 45 Min. Übergang plus Wetterreserve.',
  alternative:'Bei starkem Wind oder Hitze kürzerer Kanaluferweg statt höherem Mont Saint-Clair.',
  sources:[['Sète Wanderrouten','https://en.tourisme-sete.com/itineraries.html'],['Hérault Corniche','https://www.herault-tourisme.com/fr/fiche/patrimoine-naturel/la-corniche-sete_TFOPNALAR034V511VL9/']]},
 {date:'2027-09-08',city:'nice',blocks:[
  {period:'morning',title:'Sète → Nizza',detail:'Frühstück und Check-out vor der Bahn. Umstiege und reale Verbindung erst für September 2027 bestätigen.'},
  {period:'noon',title:'Unterwegs: günstiger Reiseproviant',detail:'Keine zusätzliche feste Besichtigung auf dem Transfer. Für den Nachmittags-/Abendanschluss ausreichend Zeit lassen.'},
  {period:'evening',title:'Promenade und Vieux-Nice',detail:'Nach Gepäckabgabe kleine Runde an der Promenade des Anglais; Altstadt bei Energie und passender Öffnung ergänzen, ohne Abendmarkt zu versprechen.',activity:'act-023'}],
  food:'Frühstück vor Abreise, haltbares Mittagessen im Zug, abends Küche oder günstige Mahlzeit; späte Ladenöffnungen nicht annehmen.',
  cost:'Promenade kostenlos; Nahverkehr und Verpflegung gesondert. Marktbesuch nicht mit fixem Abendstand rechnen.',
  access:'Nice-Ville–Unterkunft–Ufer erfordert zusätzlichen Ortsweg.',
  buffer:'Mindestens 90 Min. zwischen Ankunft und Freizeit plus freie Verspätungsreserve.',
  alternative:'Bei später Ankunft nur Essen und Unterkunft.',
  sources:[['Nice Tourismus','https://www.explorenicecotedazur.com/en/'],['Cours Saleya','https://www.explorenicecotedazur.com/culture/cours-saleya/']]},
 {date:'2027-09-09',city:'nice',blocks:[
  {period:'morning',title:'Villefranche: Plage des Marinières',detail:'Regionalzug/Bus nach Villefranche-sur-Mer prüfen. Baden nur bei passenden Meer- und Wetterbedingungen.',activity:'act-026'},
  {period:'noon',title:'Colline du Château',detail:'Zurück nach Nizza, Aufstieg oder Zugang zum Aussichtspunkt, dann genug Zeit für die Aussicht.',activity:'act-024'},
  {period:'evening',title:'Port Lympia und Reisevorbereitung',detail:'Kurze Hafenrunde, früh essen und den langen nächsten Bahntag vorbereiten.',activity:'act-028'}],
  food:'Für den 10.09. haltbare Frühstücks-/Zugsnacks und Trinkwasser besorgen; unsicheren Späteinkauf in Kandersteg vermeiden.',
  cost:'Strand/Hafen/Aussichtspark als Außenorte ohne gesetzten Eintritt; TER/Bus, Essen und Reservierungen zusätzlich.',
  access:'Villefranche ist ein eigener Nahverkehrsausflug; Strand und Colline nicht als Fußroute desselben Stadtteils planen.',
  buffer:'45–60 Min. Zug-/Bus- und Umsteigepuffer, abends zusätzlich 60 Min. für Packen.',
  alternative:'Bei Regen oder hohen Wellen nur Nizza-Altstadt und ein bereits vorhandenes Innenangebot.',
  sources:[['Plage des Marinières','https://www.explorenicecotedazur.com/structure/plage-des-marinieres/'],['Nice Tourismus','https://www.explorenicecotedazur.com/en/']]},
 {date:'2027-09-10',city:'kandersteg',contextPhoto:'act-055',blocks:[
  {period:'morning',title:'Nizza verlassen – Anschlusskette prüfen',detail:'Vorläufige Nizza–Kandersteg-Fahrt ist kein gültiger September-2027-Fahrplan. Eine vollständige Kette über Brig/RE1 oder Lyon–Genf muss mit realen Anschlüssen geprüft werden.'},
  {period:'noon',title:'Transit, Umstiege und Verpflegung',detail:'Ausreichend Proviant mitnehmen; Zugreservierungen, Grenz-/Betreiberwechsel und Weg von Brig via Goppenstein separat verifizieren.'},
  {period:'evening',title:'Kandersteg: Ankommen und schlafen',detail:'Nur Check-in, Essen und Erholung vor Oeschinensee. Späte Schlüsselübergabe schriftlich mit Unterkunft klären; kein weiterer Ausflug.'}],
  food:'Frühstück und langlebige Lebensmittel in Nizza kaufen; keine bestätigte Spätöffnung in Kandersteg und keine Küche vor Check-in voraussetzen.',
  cost:'Reservierung für internationale Züge, möglicher Schweizer Nahverkehr und Verpflegung offen; keine fiktiven CHF-/EUR-Summen.',
  access:'BLS RE1 Brig–Kandersteg über die Bergstrecke ist eine mögliche, aber am 10.09.2027 nicht bestätigte Anschlussfolge.',
  buffer:'Langer ganzer Reisetag: nach Möglichkeit 45–60 Min. Reserve bei kritischen Umstiegen und keine weitere Abendaktivität.',
  alternative:'Wenn keine belastbare Tagesverbindung existiert, Reisetag/Unterkunft vor Buchung neu beurteilen, nicht heimlich ein Hotel dazwischen eintragen.',
  sources:[['SBB Reiseauskunft','https://www.sbb.ch/de'],['BLS Linien','https://www.bls.ch/de/fahren/fahrplan/bls-linien'],['SNCF Verkaufsbeginn','https://www.sncf-connect.com/en-en/help/ticket-sales-opening']]},
 {date:'2027-09-11',city:'kandersteg',blocks:[
  {period:'morning',title:'Oeschinensee: Gondel und Wanderstart',detail:'Veröffentlichter Sommerzeitraum 24.04.–19.09.2027, 08:30–18:00 Uhr. Bergfahrt-Zeitfenster/Reservierung, Wetter und aktuelle Wegfreigaben prüfen.',activity:'act-053'},
  {period:'noon',title:'Seeufer, Pause und eine Route wählen',detail:'Leichter Seeweg mit ausgedehntem Picknick ODER Heuberg-Panoramarunde als anspruchsvollere separate Wahl; die Wege nicht zu einer Pflichtkombination machen.',activity:'act-054'},
  {period:'evening',title:'Kandersteg: Erholung und Kochen',detail:'Mit genügend Reserve zur Gondel zurück; nach Abstieg duschen, essen, Füße schonen. Der Dorfspaziergang bleibt optional.',activity:'act-055'}],
  food:'Frühstück in Unterkunft nur bei nachgewiesener Küche; ausreichend Wasser und haltbares Picknick für drei einpacken.',
  cost:'Gondelpreis und Zeitfenster nicht als 2027er Endpreis bekannt; Seeaufenthalt selbst ohne Eintritt, Gastro/Gondel extra.',
  access:'Heuberg besitzt anspruchsvollere Bergwege. Kein Abzweig bei schlechter Sicht, Gewitter, Wegsperrung oder unzureichender Trittsicherheit.',
  buffer:'60–90 Min. zusätzliche Geh-/Gondelreserve und deutlicher Abstand zur letzten Talfahrt; keine exakte letzte Fahrt zugesagt.',
  alternative:'Bei schlechtem Wetter Dorf Kandersteg und leichte Talrunde statt Hochroute; bei geschlossener Gondel gesamten Tag umplanen.',
  sources:[['Gondel Fahrplan 2027','https://www.oeschinensee.ch/tarife-fahrplan/'],['Wege/Livezustand','https://www.oeschinensee.ch/live/'],['Wanderregeln','https://www.oeschinensee.ch/wandern/']]},
 {date:'2027-09-12',city:'appenzell',blocks:[
  {period:'morning',title:'Kandersteg → Appenzell',detail:'Sonntag als Bahntag behandeln. Vorläufige Verbindung und Umstiege bei SBB neu prüfen; Proviant vor Abfahrt einkaufen.'},
  {period:'noon',title:'Unterkunft und Ruhetag',detail:'Nach Ankunft Zimmer-/Schlüsselübergabe, Essen und Pause. Einkauf nur nach bestätigter Sonntagsöffnung.',},
  {period:'evening',title:'Altstadt Appenzell – ganz entspannt',detail:'Kurze Hauptgassenrunde nach Lust und Ankunftszeit. Kein zusätzlicher Bergbahnausflug.',activity:'act-044'}],
  food:'Für Sonntag notfalls alle drei Mahlzeiten aus zuvor gekauften Vorräten decken; Küchenbenutzung der konkret ausgewählten Unterkunft prüfen.',
  cost:'SBB-Fahrt als Pass-Reisetag Nr. 6 vorgesehen, aber Fahrplan nicht bestätigt; lokale Speisen und Einkauf zusätzlich.',
  access:'Keine Sonntagssupermarktöffnung oder garantierte Ankunft aus dem bisherigen Tripsy-Fenster ableiten.',
  buffer:'60–90 Min. für Check-in und Ruhe, Rest des Tages bewusst frei halten.',
  alternative:'Bei Verspätung Dorfspaziergang weglassen und nur essen/schlafen.',
  sources:[['SBB Reiseauskunft','https://www.sbb.ch/de'],['Appenzell Tourismus','https://www.appenzell.ch/']]},
 {date:'2027-09-13',city:'appenzell',blocks:[
  {period:'morning',title:'Appenzell → Wasserauen und Seealpsee',detail:'Für Hin- und Rückfahrt separates Regionalticket für drei kalkulieren, denn sieben Interrail-Fernreisetage sind bereits belegt. Auf offiziell markierter Tour starten.',activity:'act-045'},
  {period:'noon',title:'Seealpsee und Picknick',detail:'Seeuferpause und Rückweg mit Wetterreserve. Fahrstraße und Hüttentobel-T2-Rundweg sind unterschiedliche Optionen; kein steiler Äscher-Abstieg als leichter Standard.',activity:'act-046'},
  {period:'evening',title:'Appenzell: Abendessen und Packen',detail:'Nach der Wanderung wieder nach Appenzell fahren, Schuhe trocknen, Proviant für die Heimreise besorgen.'}],
  food:'Morgens einkaufen, bevor ihr nach Wasserauen fahrt; Picknick und Wasser für drei. Restaurant nur als kostenpflichtige Alternative.',
  cost:'Seealpsee ohne separaten Eintritt; Regionalzug und optional Ebenalp-Seilbahn/Gastro gesondert und ohne 2027-Fixpreis.',
  access:'Gelbe/weiß-rot-weiße Wegmarkierungen und SAC-Kategorie konkret prüfen; Wetter kann die Route auch im September ausschließen.',
  buffer:'Mindestens 60–90 Min. vor der Rückfahrtreserve, Wanderung nicht ohne Abstiegspuffer bis an den Abend ziehen.',
  alternative:'Bei Regen/Gewitter ein ruhiger Dorf- oder Indoor-Tag. Ebenalp/Äscher nur als eigenständige Wahl bei passender Witterung und Öffnung.',
  sources:[['Appenzeller Wanderroute','https://www.appenzell.ch/de/alpstein/wandern/wandervorschlaege.html?cHash=5e7c40dacf6e64b298ddd8c9a1a50488&tx_wstourismus_tourismus%5Baction%5D=show&tx_wstourismus_tourismus%5Bcontroller%5D=Tour&tx_wstourismus_tourismus%5Btour%5D=39'],['Appenzeller Bahnen','https://appenzellerbahnen.ch/de/reiseinformationen/fahrplan.html'],['Ebenalp','https://ebenalp.ch/de/sommer-info']]},
 {date:'2027-09-14',city:'appenzell',contextPhoto:'act-044',blocks:[
  {period:'morning',title:'Appenzell: Frühstück und Check-out',detail:'Schlüssel, Gepäck, Zimmerkontrolle. Keine zusätzlichen Berg- oder Stadtaktivitäten vor der Rückreise verbindlich einplanen.'},
  {period:'noon',title:'Appenzell → München: Reisetag',detail:'SBB/DB/ÖBB-Verbindung mit realer Umsteigekette prüfen. Siebter und letzter geplanter Interrail-Fernreisetag; Inbound-Regel beachten.'},
  {period:'evening',title:'Ankunft in München',detail:'Ankunftszeit nicht als 2027 bestätigt darstellen; flexible Reserve für verspätete Züge und Heimweg lassen.'}],
  food:'Frühstück nur bei verfügbarem Check-out-Küchenfenster. Zugproviant vorab besorgen; unterwegs keine fixe Gastronomie einplanen.',
  cost:'Mögliche Reservierungen/Zuschläge für die Rückfahrt sind offen. Kein zusätzlicher Besuch und keine neue Budgetbuchung.',
  access:'Durchgehende reale Verbindung und Anschlussreserve erst mit dem 2027er Fahrplan festlegen.',
  buffer:'Vor Bahnhofsfahrt Check-out-Reserve und auf der Gesamtstrecke großzügige Umsteigepuffer.',
  alternative:'Bei Störungen offizielle SBB/DB/ÖBB-Alternative prüfen, keine fiktive frühere Zugankunft übernehmen.',
  sources:[['SBB','https://www.sbb.ch/de'],['DB','https://int.bahn.de/de'],['Interrail Reisetage','https://www.interrail.com/en/support/interested-in-interrailing/what-is-a-travel-day']]}
];
const byDate=new Map(SWISS_DAY_EDITORIAL_V85.map(x=>[x.date,x]));
const titles={morning:'Morgen',noon:'Mittag',evening:'Abend'};
/** Read-only advisory UI. Date and variant are checked before rendering.
 * Existing actions for deliberate adoption and undo remain in dayPlanPanel.
 */
export function renderSwissDayEditorialV85(ctx){
 if(ctx?.trip?.id!=='interrail_swiss'||ctx?.trip?.travellers!==3)return '';
 const day=byDate.get(ctx.date);
 if(!day||ctx.dayPlan?.date!==day.date||ctx.dayPlan?.city!==day.city)return '';
 const imageItem=activity=>(ctx.all??[]).find(x=>x.id==='survey-v19:'+activity&&x.kind==='activity');
 const blocks=day.blocks.map((block,i)=>{
  const item=imageItem(block.activity??(day.contextPhoto&&i===2?day.contextPhoto:null));
  const photo=item?placeThumbnailHtml(item,ctx):'';
  const maps=block.activity&&item&&item.pointPrecision!=='unverified_or_not_single_location'
    ?urlLink(googleMapsSearchUrl(item,ctx.cities),'Karte'):'';
  return '<article class="swiss-editorial-block"><div class="swiss-editorial-period">'
   +'<span class="swiss-editorial-step">'+(i+1)+'</span><span>'+titles[block.period]+'</span></div>'
   +(photo?'<div class="swiss-editorial-photo">'+photo+'</div>':'')
   +'<div class="swiss-editorial-text"><h4>'+esc(block.title)+'</h4><p>'+esc(block.detail)+'</p>'
   +(maps?'<div class="swiss-editorial-maps">'+maps+'</div>':'')
   +(day.contextPhoto&&i===2?'<small>Ortsmotiv, keine Aufnahme dieser Zugfahrt</small>':'')
   +'</div></article>';
 }).join('');
 const facts=[['Essen & Küche',day.food],['Budget',day.cost],['Öffnung / Transfers',day.access],
  ['Zeitreserve',day.buffer],['Alternative',day.alternative]];
 return '<section class="swiss-day-editorial" aria-label="Morgen Mittag Abend: unverbindlicher Tagesablauf">'
  +'<header class="swiss-editorial-head"><span>REDAKTIONELLER TAGESABLAUF · 3 REISENDE</span>'
  +'<h3>Morgen, Mittag &amp; Abend</h3>'
  +'<p>Bestehenden Plan ergänzt, nichts automatisch übernommen. Die Vorschläge und Bilder ersetzen keine bestätigten Zugzeiten, Preise oder Buchungen.</p></header>'
  +'<div class="swiss-editorial-grid">'+blocks+'</div>'
  +'<div class="swiss-editorial-facts">'+facts.map(([title,body])=>
    '<div><strong>'+esc(title)+'</strong><p>'+esc(body)+'</p></div>').join('')+'</div>'
  +'<div class="swiss-editorial-sources"><strong>Quellen und Nachprüfung</strong>'
  +'<div>'+day.sources.map(([label,url])=>urlLink(url,label)).join('')+'</div></div>'
  +'<small class="swiss-editorial-caveat">Keine Buchung und keine Änderung am Gruppenbudget. Aktivitäten nur über die vorhandenen „Zum Tag“-Bedienelemente bewusst hinzufügen und bei Bedarf mit Undo zurücknehmen.</small>'
  +'</section>';
}
