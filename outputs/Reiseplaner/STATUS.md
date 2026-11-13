# Projektstand · 13.11.2026

## Nachtrag 13.11.2026 – v1.3 Anbieter-Recherche

60 neue datierte Booking.com-Suchwerte für sechs echte September-2027-Aufenthaltsfenster und drei Erwachsene/ein Zimmer: sichtbar im separaten Hotel-Vergleich, **nicht** als finale Checkouts oder Reisekosten. Filter/Sortierung greifen nur bei identischen Reisedaten und Gruppengröße. 17 öffentliche Adressfälle: 13 Anbieter-Geohinweise, 4 ohne Treffer, **0 neu unabhängig bestätigte Punkte**. Ein Konflikt bei `research:bcom_12257788` in Genua bleibt unaufgelöst und ist im UI dokumentiert. JSON-/CSV-Archive in `data/research-v13/`; Tests und Methodik in `PHASE_13_PROVIDER_RESEARCH.md`.



## Nachtrag 13.11.2026 – v1.2 Benutzerführung und datenbewusste Qualitätsverbesserung

**Entwicklung im Branch `feature/v7-data-day-accommodation-rail`, PR #5; kein Merge oder Deployment.** Die ursprüngliche Übersicht vom 12.11.2026 bleibt im Folgenden als Baseline erhalten.

**Neu implementiert:** siebenteiliges zugängliches In-App-Tutorial mit Modulnavigation und mobiler Ansicht; Tagesbudget-Szenariosimulator ohne Auswirkung auf Zahlungen oder Buchungen; präzisierter Küchen- und Preisfilter; vierteiliger Unterkunftsvergleich mit Zurücksetzen; Gruppenabstimmung ohne 15er-Deckel; Fotos mit Einzel-Lizenzangaben in kompatiblen Mehrbildgalerien (maximal fünf eigene pro Ort); zwei zusätzliche lizenzierte Commons-Sehenswürdigkeiten; transparente Smart Filter für nachgewiesene Bahnhof-Fußwege, gruppengrößenabhängige Bettenprüfung, 0-€-Referenz, Wasser/Schwimmen und Mehrheitsinteresse; fünf datenbasierte Fortschrittsindikatoren im Bereich Daten & Fristen.

**Verifiziert:** Actions-Qualitätslauf [#43474139218](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43474139218) mit Syntax, Datensatzvalidierung, Node-Regressionschecks, Kartenabdeckung, Headless Chrome und Server-Smoke vollständig erfolgreich. Detailliertes Protokoll in [PHASE_12_GUIDE_VISUAL_QUALITY.md](PHASE_12_GUIDE_VISUAL_QUALITY.md).

**Weiterhin offen:** Vollständige Bildrechte/Quellen für alle Hunderte Datensätze; 229 variantenspezifisch ungenaue Kartenpunkte; ungeprüfte Zimmer-/Betten-/Gebührendetails und Stornierung für konkrete drei oder vier Reisende; Oktober/November-2026-Suchpreise statt bestätigter 2027er Checkoutpreise; verbindliche Züge, Gastrotarife und Öffnungszeiten für die tatsächlichen Reisetage. Der Fortschrittsindikator misst belegte Plan-/Eigeneinträge, **nicht** Buchungsbereitschaft oder objektive Reisefertigstellung. Die früheren fehlgeschlagenen optionalen Forschungs-Workflows werden nicht als Qualitätsnachweis ausgegeben, siehe separate CI-Berichte.



Die private Webanwendung startet mit `Start.cmd` oder `node server.mjs`. Die lokale Vorschau auf Port 4173 antwortete mit HTTP 200 und vier Varianten. Das vollständige Projekt liegt im Ordner dieser Datei. Der V7-Gesamtumfang bleibt in Arbeit.

## Eingangsdaten

| Tripsy-Reise | Zeitraum | Personen | Aktivitäten | Transport | Unterkünfte | Budgetzeilen |
|---|---|---:|---:|---:|---:|---:|
| Interrail Test 2 | 01.–14.09.2027 | 3 | 31 | 7 | 6 | 5 |
| Interrail Test 2 – Schweiz Variante | 01.–14.09.2027 | 3 | 34 | 8 | 6 | 6 |
| TEST – Interrail ab München: Paris · Barcelona · Sète · Nizza · Genua · Venedig | 17.–27.08.2027 | 3 | 26 | 13 | 5 | 6 |
| Test Schweiz | 05.–11.09.2027 | 4 | 12 | 8 | 4 | 12 |

Die Tabelle zählt vom Connector gelieferte Quellzeilen. Ein identischer Zug und vier identische Aktivitätskopien in der September-Schweiz-Variante sind im Quellbestand erhalten und für die aktive Planung ausgeblendet. In Genua und Venedig haben identifizierbare Stopps korrigierte Kartenpunkte mit Quellen. Uneindeutige Stopps wie „Letzter Abend am Kanal“ bleiben ohne Pin. Der Dokumentendpunkt lieferte keinen zugänglichen Bestand. Verbindliche Buchungen und personenbezogene Umfrageprofile lagen für die Pilotabnahme nicht vor.

Das nachgereichte Verzeichnis und das zuerst gefundene ZIP enthalten dieselben 22 Dateien. Die Recherche liefert 21 Orte, 73 Aktivitätszeilen, 26 Unterkunftszeilen und 28 Tarifreferenzen. Die App verbindet diese Quellen mit dem lesenden Tripsy-Abgleich und trennt Referenzbudgets von aktiven Plankosten.

## Barcelona-Pilot

Barcelona liegt in drei Interrail-Varianten, bietet einen echten Unterkunftsvergleich und verbindet Aktivitäten, einen bedingten Clubabend sowie Bahnan- und -abreise. Der August-Nachtzug wird zusätzlich als separater Testfall geprüft. Desktop kombiniert Tagesliste und Karte. Mobil wechselt man zwischen beiden Ansichten. Die UX-Referenzen stehen in DECISIONS.md. Die genannten persönlichen Mockups waren im verfügbaren Material nicht zuzuordnen.

**Skalierung: nur teilweise skalierbar, Blocker dokumentiert.** Die zentralen Datenintegritäts- und Browserabläufe sind bestanden. Das gemeinsame Datenmodell, die Budgetlogik, Karteninteraktionen und Quellenansichten wurden direkt auf Paris und Sète angewendet. Datierte ÖPNV-Fahrten, 2027-Angebote und vertragliche Bedingungen sind lokal weiterhin lückenhaft.

### Soll-Ist-Abgleich

| V7-Punkt | Ergebnis | Nachweis und Rest |
|---|---|---|
| 0 Pilot und Selbstkorrektur | bestanden | Kernabläufe automatisiert und im Browser geprüft. Drei Mängel korrigiert und erneut getestet. |
| 1–2 Reisen, Varianten, Wiederholungsimport | bestanden | Vier Tripsy-Reisen. Stabile IDs, unveränderte Routen. CSV zweimal im Browser, abweichender Folgeimport und unabhängige Kopie im Test. |
| 3, 22 Herkunft und Prüfstand | bestanden | Quellenverweise, Importdatum und getrennte Herkunft/Prüfstatus im Detail. Konflikthinweise erhalten. |
| 4 CRUD und Wiederladen | teilweise | Aktivitäten angelegt, gewählt, gelöscht und nach Reload geprüft. Zugformular vorhanden. Vollständiger Browser-CRUD für Zug, DnD und Sperre steht aus. Importierte Fernstreckenfixierung bewusst beibehalten. |
| 5, 23 Karte ↔ Timeline | bestanden | Marker → Termin und Termin → Marker, sichtbare Weglinie, Gesamtroute und Stadtwechsel geprüft. |
| 6 Straßen und Mobilität | teilweise | Straßenkacheln im separaten Chrome-Lauf vollständig geladen. Barcelona mit statischen AMB-Netzen, Metro im Browser geprüft. Bus-Haltestellengeometrien fehlen. Kein automatischer Fahrplanrouter. Fußwege und manueller ÖPNV-Eintrag mit Quelle nutzbar. |
| 7, 12, 19 Auswahl und Geld | bestanden | Unterkunftswechsel und Undo aktualisieren Tagesanker und Betrag. Aktivität erhöht das Budget, ohne die Unterkunft abzuwählen. Offene Alternativen bleiben außen vor. Eurocent, CHF-Umrechnung, Vorauszahlung, Erstattung und Nullsaldo getestet. |
| 8 Bahnkostenvergleich | bestanden | Konfiguration für Pass und Einzeltickets, Reservierungsreferenzen optional, fehlende Preise sichtbar. Rechenfall mit zusätzlichem Einzelticket bestanden. |
| 9, 18 Zeit und Nachtzug | bestanden | Direkter Nachtzug, weiterer Zug nach Mitternacht, Gültigkeitsgrenze, Umstellung und Ortszeiten getestet. |
| 10 Unterkunftsvergleich | teilweise | Bird House und St Christopher’s vergleichbar mit Ausstattung, historischem Gruppenpreis und berechneten Bahnhofswegen. Verfügbarkeit, genaue Belegung, Gebühren und Storno für 2027 offen. |
| 11 Abend und Rückweg | teilweise | Razzmatazz mit belegter Einlassregel, erreichbaren Linien und gespeicherten Fuß-Rückwegen zu beiden Häusern. Konkretes Event, Tarif und ÖPNV-Fahrt am Reisedatum offen. |
| 13 Desktop/Mobil | bestanden | Chrome Desktop und 390 × 844, Kartenumschalter, Navigation und reduzierte Bewegung. Keine umfassende Screenreader-Abnahme. |
| 14 Privatheit | bestanden | Bindung an Loopback, Origin-/Host-Prüfung, SQLite und nicht öffentlich servierte Quellkopien. Kein öffentliches Deployment. |
| 15 Fristen | teilweise | Manuelle Frist mit IANA-Zeitzone, Sortierung, Status und Kalenderexport. Konkrete bestätigte Stornofrist war als Abnahmefall nicht testbar. |
| 16 Verpflegung | teilweise | Mercat Sant Antoni, Lidl-Hinweis und zwei Anbieteroptionen für El Born. Gruppen-Warenkorb und belegter Selbstversorgungsvergleich offen. |
| 17 Mobilitätspässe | teilweise | Centgenauer T-casual-Vergleich für manuell erfasste gültige Fahrten inklusive Zusatzfahrten getestet. Automatische Zuordnung von Fahrten oder Attraktionen zu Pässen offen. |
| 20 Störungen und Plan B | offen | Offizielle Fahrplanlinks vorhanden. Aktive Störungsabfrage und belastbare Alternativverbindungen fehlen. |
| 21 Länder- und Reiseinfos | offen | Keine verifizierten persönlichen Voraussetzungen vorhanden. Das Modul ist noch nicht umgesetzt. |
| 24 Datenimport | bestanden | Originalrecherche integriert. Browser-CSV und JSON-/CSV-Optionsschnittstelle mit Quellen, Konfliktzählung und Variantenbindung. Kein automatischer Dokument- oder Google-Forms-Import. |
| 25 Fortsetzung | bestanden | STATUS.md, DECISIONS.md und REQUIREMENTS_CHANGELOG.md liegen im Projektroot. |

Korrekturen aus der Abnahme: gleichzeitig startende Kartenabrufe teilen dieselbe ausstehende Abfrage, damit Hotelwechsel ihre Wegzeiten sofort zeigen. Aktivitäts- und Unterkunftsauswahl sind logisch getrennt, damit aktive Übernachtungen bei einer neuen Aktivität erhalten bleiben. Die CSS-Größenregeln gelten nur für Bedien-Icons, damit Leaflet-Vektoren in voller Größe sichtbar bleiben.

## Städtepaket 1 · Paris und Sète

- Paris hat sichtbare Museum- und Turmstandorte, offizielle Alters- und Standardtarife für den Eiffelturm, eine Quellenprüfung für die bedingten Louvre-Preise, Betreiberlink und vier gespeicherte Wege.
- Sète hat zwei Unterkunftsoptionen im September, Georges Hostel mit Anbieterbeleg zur Gemeinschaftsküche und möglicher Dreierbelegung, einen örtlichen Betreiberplaner und acht gespeicherte Wege. August- und Septemberdaten sind getrennt.
- Die 31 Barcelona-Wege und 12 neuen Wege ergeben zusammen 43 von FOSSGIS berechnete Routen. Die Geometrie und Schätzdauer sind gespeichert. Einzelne weitere Paare bleiben offen, bis der Router sie berechnet.
- Die weitere Abnahme für Nizza und die Schweizer Orte ist im dritten Paket dokumentiert.

## Städtepaket 2 · Genua und Venedig

- Genova Piazza Principe und Venezia Santa Lucia haben geprüfte Bahnhofspunkte. Bei drei September-Fahrten sind fremde Schweizer Umsteigehinweise als Importkonflikt markiert. Tripsy-ID, Start, Ziel, Zeit und Variantenreihenfolge sind erhalten. Der Markusplatz-Eintrag im August wird Venedig zugeordnet. Die Korrekturen liegen in `lib/catalog.mjs` und `lib/italy.mjs`.
- Genua hat acht Metrostationen, 2.685 Bushaltestellen und die Stationen der Stand- und Zahnradbahn sowie der Bahn Genova–Casella aus dem AMT-Feed. Die Metrotrasse stammt getrennt aus der OpenStreetMap-Relation 2177189. Für die Buslinien lagen Haltestellen und Linienzuordnungen vor. Liniengeometrien fehlen im verwendeten AMT-Feed.
- Venedig hat 180 Vaporetto-Linienverläufe und 139 Anleger aus dem ACTV-Feed. Die Netzebenen sind auf November 2026 datiert. Fahrten, Preise und Anschlüsse für die Reisetermine 2027 sind noch offen.
- Drei ungebuchte Unterkunftsoptionen ergänzen die vorhandenen Vorschläge. Ostello Bello / Hotel Britannia hat einen berechneten Fußweg ab Piazza Principe. Die Karte trennt bei a&o den neunminütigen Fußweg ab **Venezia Mestre** vom Inseltransfer. Generator Giudecca zeigt den Wasserbus als zusätzlichen Transfer. Gruppentarife, belegte Zimmer und Stornofristen für beide Reisevarianten bleiben offen.
- 16 berechnete Fußwege ergänzen den Cache, insgesamt 59. Beispiele: 12 Minuten von Piazza Principe zum Porto Antico, 21 Minuten von Santa Lucia zur Rialtobrücke. Neue Fußrouten werden anhand der OSRM-Wegschritte auf reine Fußwege geprüft. Routen mit Fähren werden zur Betreiberprüfung verwiesen, damit sie nicht als kostenlose Fußwege erscheinen.
- Im Budget gibt es je Variante einen AMT- bzw. ACTV-Vergleich. Die Eingabe zählt benötigte Einzeltickets im Gültigkeitsfenster des Vergleichspasses. Szenarien verändern das aktive Budget nicht. Jugendangebote und tatsächliche Fahrten je Reisetag sind noch nicht automatisch zugeordnet.

[AMT-Fahrplandaten](https://www.dati.gov.it/node/view-dataset/dataset?id=9529fa6c-3534-431f-9cb0-41749286f2ee) · [Metrotrasse in OpenStreetMap](https://www.openstreetmap.org/relation/2177189) · [ACTV-Fahrplandaten](https://www.dati.venezia.it/?q=node%2F261) · [Vaporetto-Tarife](https://muoversi.venezia.it/it/content/vaporetto)

## Städtepaket 3 · Nizza und die Schweizer Orte

- Nizza hat 24 Tram- und 350 Busverläufe mit 94 Tram- und 2.735 Bushaltepunkten. Der Feed von Lignes d’Azur gilt laut eigener Metadatei vom 12.11. bis 22.12.2026. Karte und Legende zeigen den Datenstand. Fahrten am konkreten Reisetag 2027 bleiben offen.
- Antares und Appartement Vieux-Nice lassen sich ab Nice-Ville vergleichen. Der historische Gruppenwert von 269,50 € bleibt erhalten. Antares liegt laut berechnetem Fußweg in der September-Klassikvariante vier Minuten vom Bahnhof entfernt. Das Dreibettzimmer ist beim Anbieter belegt. Datierter Preis und Verfügbarkeit bleiben offen. Die August- und Septemberaufenthalte haben eigene Daten.
- Im Nahverkehrsvergleich kosten fünf Solo-Ticketfenster je Person in der Dreiergruppe 25,50 €. Der 24-Stunden-Pass für drei kostet in derselben Tarifreferenz 21,00 €. Die Ersparnis beträgt 4,50 €. Der Vergleich bleibt eine Szenariorechnung. Ein manuell erfasster Weg kann pro Reisetag Linie, Dauer, Preis, Preisbezug und Quelle anzeigen. Ein Ausgabenposten wird im Budget separat erfasst.
- Der Tagesplan bietet bei mehreren Orten **Ganzer Tag** und Ortsfilter. Bahnabfahrt und Bahnankunft verweisen auf eigene Marker. Für beide Endpunkte einer Tagesfahrt zeigt die Karte eine gekennzeichnete schematische Verbindung. Beim Schweizer Seen-Roadtrip bleiben Autofahrten und vier Reisende erhalten. Boccadasse ist in der August-Variante Genua zugeordnet.
- Für Appenzell sind die Anbieteroptionen Alte Metzg und Blattenheimat 6OG3 mit amtlichen Adresspunkten, Bahnhofswegen und gruppenbezogenen Angaben vergleichbar. Die historische Tripsy-Option „Blattenheimat6“ ist unabhängig von der amtlich lokalisierten Ferienwohnung 6OG3 sichtbar. Für Kandersteg und Appenzell wurden fehlende Zugpunkte ergänzt.
- In Kandersteg erscheinen Betriebszeit und Zugang zum Oeschinensee. Am 11.09.2027 bleiben zwischen den importierten Terminen 30 Minuten. Schon der Weg ab Bergstation dauert rund 30 Minuten. Im Seen-Roadtrip steht die Talstation am 10.09. vor der veröffentlichten Betriebszeit im Plan. Die ursprünglichen Termine bleiben sichtbar. Wasserauen, Seealpsee, Bachalpsee und Klöntalersee haben Quellenangaben zu Wanderzeit und Zugang. In Schweizer Karten lässt sich das amtliche Wanderwegenetz einblenden. Begehbarkeit, Reservation und Preise sind am Reisetag separat zu prüfen.
- 22 weitere FOSSGIS-Fußwege wurden Schritt für Schritt auf Fußverkehr geprüft und gespeichert. Der Cache enthält insgesamt 81 Wege. Die Bergzugänge aus den Betreiberangaben werden mit Quelle und Dauerhinweis angezeigt. Für diese Übergänge lässt sich ein eigener geprüfter Weg hinterlegen.

[Lignes d’Azur GTFS](https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur?locale=fr) · [Solo-Tarif](https://www.lignesdazur.com/titres-et-tarifs/quel-titre-pour-mon-deplacement/titres-au-voyage/) · [24-Stunden-Pass](https://www.lignesdazur.com/fr/tickets-la-journee) · [Oeschinensee 2027](https://www.oeschinensee.ch/tarife-fahrplan/) · [Wanderwegenetz swisstopo](https://api3.geo.admin.ch/rest/services/api/MapServer/ch.swisstopo.swisstlm3d-wanderwege/legend)

## Ausgeführte Regression

- `node --test --test-isolation=none test/core.test.mjs` · 19 bestanden. Der Lauf umfasst Datums- und Variantentrennung, Tarifrechnungen, getrennte Zugendpunkte, die unveränderte Auto-Verkehrsart und die Schweizer Zugangs- und Zeitwarnungen.
- `node test/browser.mjs` · neun bestandene Chrome-Prüfabschnitte mit isolierter Testdatenbank und eigenem Profil. Neu geprüft wurden Nizzas Tram- und Busnetz, die Unterkunfts- und Tarifvergleiche, der datierte manuelle Wegpreis sowie Ganzer Tag, Ortsfilter und Gondelwarnungen in der Schweiz.
- `REISEPLAN_CHECK_TILES=1` · sichtbare Straßenkacheln in Barcelona, Genua, Venedig und Nizza geladen. Amtliche Wanderwegkacheln für Appenzell–Wasserauen–Seealpsee wurden zusätzlich im Browser geladen.

## Nächster Einstieg

Datumsgebundene ÖPNV-Integration im Barcelona-Pilot vertiefen, Verpflegung mit Gruppen-Warenkorb und Anbieterpreisen ergänzen und offene Bedienfälle aus der Abnahmetabelle prüfen. Für die Bahnstrecken fehlen noch bestätigte Abfahrten, Reservierungspreise und genaue Trassen der gewählten Verbindungen. Neue Fahrpläne und Unterkunftsangebote erst ab belegbarer Veröffentlichung übernehmen.

## Fortsetzung im normalen Chat · 12.11.2026 · Branch `feature/v7-resilient-seed-fallback`

**Status: Teiländerung implementiert, vollständige V7-Abnahme weiterhin offen.** Der GitHub-Upload enthält die fachliche App, nicht aber die absichtlich aus Git ausgeschlossenen privaten Tripsy-Rohkopien (`data/tripsy-*.json`). Vor dieser Änderung scheiterte `loadCatalog()` bei einer Neuinstallation ohne jene Dateien. Das neue Modul `lib/seed-fallback.mjs` erzeugt nur in genau diesem Fall einen deutlich gekennzeichneten, reduzierten Quellenstand aus `trips.json`, `transport.json`, `activities.json` und `accommodations.json`. Existierende lokale Tripsy-Rohdateien werden unverändert weiterhin bevorzugt. Die Originaldaten bleiben unverändert; die vier Varianten und ihre Gruppengrößen (3/3/3/4) werden nicht zusammengeführt.

**Abnahme / tatsächliche Ausführung:** `python validate.py` mit den beigefügten Forschungs-JSON-Dateien bestanden: eindeutige IDs, Fremdschlüssel, Budgetkonsistenz, 4 Reisen, 7 bereinigte Zugsegmente der Schweizer Interrail-Variante. `node --test test/seed-fallback.test.mjs` mit denselben Daten in einem isolierten lokalen Testordner bestanden: 4/4 Seed-Tests (Varianten und Seed-Zählung, Nachtzug `(+1)`, Herkunfts-/Verifikationsschutz, Ortsabgleich). Zusätzlich 1/1 Dashboard-Readiness-Test bestanden; zusammen 5/5 isolierte Tests. Die Parser-Tests liefen unter Node 22 mit einem lokal isolierten `utcFromLocal`-Äquivalent. **Nicht ausgeführt:** vollständiger Originaltestlauf (`npm test`), Browserprüfungen und Serverstart dieses GitHub-Branches auf einem vollständigen Checkout mit Node 24. Deren Erfolg wird nicht behauptet.

**Restgrenzen des Fallbacks:** Nur 31 tagesunspezifische Aktivitätszeilen der September-Klassik und 12 der Schweizer Seenreise lassen sich aus dem Forschungspaket wiederherstellen. Für die September-Schweiz- und August-Variante fehlen die privaten Tripsy-Aktivitätsdetails vollständig. 2027er Fahrplanverfügbarkeit, Sitzplätze, Hotelangebote und Echtzeit-ÖPNV werden nicht aus dem Seed abgeleitet. Die App zeigt deshalb im Fallback einen sichtbaren Herkunftshinweis; für vollständige Reiseinhalte müssen die originalen lokalen `data/tripsy-<ID>.json`-Dateien im Projekt verbleiben.

**Zusätzliche nutzbare Funktion:** Die Reiseübersicht enthält jetzt einen aus den aktuell gewählten Einträgen berechneten **Planungs-Check** mit vier direkt verlinkten Feldern: nicht vollständig gewählte Unterkunftsaufenthalte, ungeprüfte Zugfahrpläne, aktive Posten ohne umrechenbaren Preis und fehlende Originalquellen. Diese Werte aktualisieren sich nach dem Speichern über den bestehenden Renderpfad. Die Integration wurde statisch geprüft und die reine Berechnung separat getestet; ein echter End-to-End-Browserlauf steht aus.

**Nächste Qualitätsstufe:** Den Branch auf dem ursprünglichen Rechner mit Node 24 starten, die Bibliothek mit und ohne private Quellkopien abgleichen, `npm test` sowie `npm run test:browser` ausführen. Erst dann als vollständig integriert betrachten. Die ursprünglichen 19 Core- und neun Browserprüfungen in diesem Dokument stammen vom vorherigen Codex-Lauf; sie wurden hier nicht wiederholt.

**UX-Referenzsichtung:** Offizielle Wanderlog-Produkt-/Hilfeseiten und Tripsy-Versionshinweise erneut geprüft. Sinnvoll bleiben Split-Ansicht, tageweise Navigation, Karte/Timeline-Synchronisation, mobile Ansichtsumschaltung sowie prüfbare Wege vor Speicherung. Die aktuelle Erweiterung verändert keine der bestehenden Layoutprinzipien. Tripsy-Verbindung am 12.11.2026 lesend geprüft; vier Reisen sind weiterhin sichtbar, aber keine privaten Rohkopien ins Repository geladen.

## Fortsetzung · Gruppen-Warenkorb und echte CI-Abnahme · 12.11.2026

**Neu programmiert:** In Barcelonas Verpflegungsmodul werden ausgewählte Koch-Mahlzeiten einer Variante und Stadt in einen gemeinsamen **Gruppen-Warenkorb** überführt. Zutaten werden anhand benötigter Gramm pro Person und ganzer Packungen aggregiert. Beim gleichen Produkt werden Packungen über mehrere Mahlzeiten **nur einmal** im aktiven Gruppenbudget gezählt. Die zuletzt angezeigten Produktpreise sind weiterhin Referenzdaten aus den vorhandenen Quellen, keine aktuellen Regalpreise. Jeder Produkteintrag erlaubt Änderungen an Packungszahl und Preis; ein Zurücksetzen stellt die Referenzannahme wieder her. Änderungen werden in der variantenbezogenen SQLite-Datei gespeichert. Bei höherem Gesamtbedarf steigt eine zu niedrig gespeicherte Packungszahl automatisch auf das erforderliche Minimum.

**Kostenregel:** Geplante Koch-Mahlzeiten mit `basketProducts` ersetzen ihre getrennten Warenkorb-Planwerte durch genau **einen geplanten Gruppenposten je Stadt**. Der Gruppenposten wird auf den ersten geplanten Kochtag gelegt; der übrige Tagesplan zählt ihn nicht erneut. Eine ausdrücklich erfasste, mit einer Mahlzeit verknüpfte Zahlung ersetzt deren Planwert und nimmt diese Mahlzeit aus der aggregierten Einkaufsplanung. Ein echter Einkaufsbeleg muss manuell erfasst werden; die App behauptet nie, ein Referenzpreis sei schon bezahlt. Originale Tripsy-Planpunkte ohne passende Zutatenliste bleiben unverändert und werden nicht ungefragt umklassifiziert. Beim Hinzufügen/Entfernen weiterer Koch-Mahlzeiten werden Packungen und Gruppenkosten neu berechnet. Einkäufe aus verschiedenen Städten oder Reisevarianten werden nicht vermischt.

**Nachweise:** GitHub Actions läuft mit Node 24 und prüft alle `.mjs`-Dateien syntaktisch, die portablen Tests und den echten Serverstart aus dem privaten Repository ohne Tripsy-Rohkopien. Der neue echte Chrome-Test prüft die Auswahl eines Abendessens, das Editieren des Gruppen-Warenkorbs, Datenbankpersistenz nach Neuladen, Budgetaktualisierung, ein zweites Abendessen an einem anderen Datum sowie den mobilen Kartenwechsel. Die elf modellbezogenen Tests wurden in GitHub Actions bestanden; der reale Chrome-Ablauf wurde ebenfalls erfolgreich durchlaufen. Frühere fehlschlagende CI-Läufe wurden auf den verfrühten `cities`-Zugriff, eine Testannahme beim automatischen Packungs-Upgrade und doppeltes Schließen der Testdatenbank zurückgeführt und korrigiert. **Die großen Original-Browser-/Core-Suiten mit den lokalen privaten Tripsy-Snapshots wurden dadurch nicht ersetzt und sind weiterhin offen.**

**Noch nicht umgesetzt:** Datumsgenaue aktuelle 2027er ÖPNV- und Bahnfahrpläne, mehrstädtische Speisepläne mit jeweils verifizierten Einkaufspreisen, tatsächliche Einkäufe über Kassenzettel, komplexe Resteverteilung zwischen verschiedenen Städten, vollständige Barrierefreiheit, ein öffentliches Deployment. Buchungen und Originaldaten wurden nicht verändert.

## Zusätzlicher Vergleich und Budgettransparenz · 12.11.2026

In **Gruppenbudget** sind nun zwei direkt berechnete Tabellen nach Reiseziel und Buchungs-/Aufenthaltsdatum verfügbar. Sie zählen nur bekannte Eurobeträge, erfassen fehlende Preise als eigene Anzahl und weisen nicht automatisch Übernachtungskosten anteilig einzelnen Nächten zu. Der gemeinsame Lebensmitteleinkauf erscheint genau einmal am ersten geplanten Kochtag. **Reiseübersicht → Varianten im Vergleich** enthält zusätzlich die exakten individuellen Anteilsspannen aus der Gruppenrechnung, die Zahl unbezifferter Positionen und geplante Flexi-Pass-Reisetage. Diese Werte sind Planszenarien und wegen 2027er Datenlücken keine belastbare Aussage darüber, welche Route am billigsten ist.

Die portable Testreihe umfasst aktuell **12 Modultests**; eine neue Budget-Gruppierungsprüfung kontrolliert Cent-Summen, Tageszuordnung und offene Preise. Zusätzlich prüft der echte Chrome-Flow die Vergleichsansicht, den mehrtägigen Warenkorb und die Mobilkarte. GitHub Actions ist die maßgebliche neue Node-24-Prüfquelle. Die große Originalsuite mit privaten Rohdaten bleibt weiterhin separat zu prüfen.

## Kuratiertes Research-v0.2-Paket (20 Dateien) · 12.11.2026

**Datenstand im Branch `feature/v7-curated-research-v02`:** Alle 20 neuen Quellen-Dateien wurden unter `data/research-v02/` archiviert; `INTEGRATION_AUDIT.md` dokumentiert für jede Datei Inhalt, Zuordnung und offene Nachprüfung. Der beigefügte `validate_subset.py` prüft alle 16 JSON-Quellen erfolgreich (4 Reisen, 115 Aktivitäten, 92 Unterkunftssuchpreise, 35 Transportsegmente). Bisherige Basisdaten sind nicht überschrieben.

**Neu in die App integriert:** `lib/research-v02.mjs` validiert stabile Originalidentitäten, Geografie, ID-Beziehungen, Gruppengrößen, Unterkunftszitate und Beträge. Zu 73 bereits enthaltenen Forschungsaktivitäten werden **42 neue Optionen** anhand stabiler IDs ergänzt statt doppelt importiert. Gruppen-Scores (115 Datensätze) sind als heuristische Interessenwerte in **Entdecken** und **Reisegruppe** sichtbar. Bei drei Interrail-Personen gelten flexible Unterkunftszielwerte 60/50/30 €; für die vierköpfige Schweizer Seenreise gibt es kein automatisch übertragenes Umfrageprofil.

**Unterkünfte:** 92 datierte Booking-Suchpreis-Snapshots sind rein optionale, als ungebucht gekennzeichnete Vergleichskandidaten. Verknüpfung ausschließlich bei passendem Reise-ID, identischen Auf-/Abreisedaten und richtiger Personenanzahl: Klassik 60, September-Schweiz 40, August 0, Seenreise 32. Suchpreis vom 12.11.2026 ist kein bestätigter Checkout-/Steuer-/Bettenpreis. Ein gewähltes Angebot ist lediglich **lokal im Plan ausgewählt**, nicht extern reserviert oder bezahlt. Die Budget-Tageszuordnung verwendet bei offenen Check-in-Uhrzeiten das dokumentierte Aufenthaltsbeginn-Datum.

**Bahn & Tarife:** 35 Recherchetickets und 13 unbestätigte Routinghypothesen im Bahnmodul; ursprüngliche Abschnitte, Route und Reisestatus unberührt. 35 Tarif-/Eintrittsreferenzen aus dem neuesten Paket verwendet; nicht als verfügbare September-/August-2027-Tickets ausgegeben.

**Budget, Quellen, Qualität:** 3 Was-wäre-wenn-Szenarien im Budget gesondert vom aktiven Zustand. Die vierköpfige Schweizrechnung umfasst nur Unterkünfte, kein berechnetes Reise-Gesamtbudget. 65 Quellen sind mit vorhandenen Web- und Anbieterquellen verbunden; 32 Datenqualitäts-Tickets nach Reise und Priorität im Quellenbereich sichtbar. Sämtliche Werte sind in EUR-Cent; `null` bleibt unbekannt.

**Tatsächlich ausgeführte GitHub-Prüfungen:** Python-Validator erfolgreich; **18/18** Node-24-Fokustests; echter Headless-Chrome-Browserflow für die neuen Ansichten, gezielten Hotel-Snapshot-Auswahl, Persistenz, Geld-/Variantentrennung und Mobile, sowie HTTP-Serverstart ohne private Originaldateien erfolgreich. Die Tests der vier Originalreisen **mit vollständigen lokalen privaten Tripsy-Rohdateien** und die umfassende vorherige Browser-Suite sind weiterhin offen. Keine externen Reisen, Buchungen oder Käufe wurden verändert.

**Offene nächste Schritte:** Nachprüfung der 2027er Fahrpläne und Buchungsfenster, vollständiger Zimmerbelegungen und Endpreise, Restkosten der Schweizer See-Reise, echte Punktkoordinaten/ÖPNV-Teilstrecken für neue Aktivitäten sowie E2E-Regressionslauf auf dem ursprünglichen Windows-Rechner mit privaten Tripsy-Quellkopien.

## Weiterentwicklung · Echtes Anbieter-Prüfarchiv und 2027-Buchungsfenster · 12.11.2026

**Implementiert:** Offizielle Verkaufsfenster aus SNCF, DB und Interrail werden für die 35 ursprünglichen Bahn-Prüfabschnitte als **Orientierungsdaten** angezeigt. SNCF-Verkauf vom 12.11.2026 deckt aktuell TGV bis 02.07.2027 ab, nicht unsere Interrail-Reisen im August/September 2027. DB-internationale Reservierungen sind gewöhnlich bis zu 6 Monate voraus verfügbar; keine exakte Zug- oder Sitzplatzzusage. Ein `Prüfung vormerken`-Button schreibt nur nach ausdrücklichem Klick eine idempotente **lokale** Wiedervorlage.

**Anbieterprüfung:** Für jeden ausgewählten oder alternativen Unterkunftseintrag und jede aktive Zugfahrt ist eine Variante-spezifische Prüfmaske eingebaut: Prüftag, Anbieterbeleg, fünf konkrete Prüffelder, eigene Notiz und beobachteter Preis. Prüfschritte sind **Benutzerangaben**, keine unabhängige Buchungsbestätigung. Ein selbst dokumentierter vollständiger Unterkunfts-Checkout darf nur bei expliziter Bestätigung als neuer **Planpreis** eingetragen werden, ohne Originalpreis, Buchungsstatus oder Providerdaten zu verändern. Ältere Prüfungen bleiben bei Gruppengrößenwechsel erhalten, gelten aber für die neue Gruppe als veraltet. Übergreifender Planungs-Check zeigt die noch fehlenden Eigenprüfungen für Bahn, Betten/Checkout und lokale GTFS-Gültigkeit.

**Neue datierte Angebotsversionen:** Drei zusätzlich beobachtete Barcelona-Suchpreise für 03.–06.09.2027 und drei Erwachsene (Hostal Portugal 474,30 €, Roma Reial 519,30 €, Hostal Fina 534,30 €) unter `data/provider-checks/booking-barcelona-20261112.json`. Alle Preise sind *Suchanzeigen*, Zimmerkonfiguration und Endcheckout nicht bestätigt; jeweils erst nach bewusster Auswahl im lokalen Plan sichtbar. Die ursprünglichen 92 Such-Snapshots bleiben unverändert.

**Mobilität:** Lokaler Barcelona-Fahrplan vom 22.10.2026–18.06.2027, also **nicht** gültig für September 2027; deshalb deutliche Warnung in der Karte und historisches Routing korrekt gekennzeichnet. Statische Linien können weiterhin als Orientierung angezeigt werden. Kein ÖPNV-Livepreis oder minutengenauer 2027-Fahrplan erfunden.

**Live-Quellenprüfung:** Tripsy lesend abgeglichen: 4 Reisen, 103 Aktivitäten, 21 Unterkünfte, 36 Transporte, 29 Expense-Referenzen; 35/35 bereinigte Zugquell-IDs vorhanden, plus bereits bekannte Schweizer Dublette 3890058. Keine privaten Rohkopien ins GitHub-Repo übertragen. Siehe `data/provider-checks/LIVE_TRIPSY_AUDIT_20261112.md` und `NEXT_CHECKS_2027.md`.

**CI:** Automatisierte Node-24-Unit-/Python- und Headless-Chrome-Prüfungen auf dem neuen Branch; der Browserfall umfasst lokale Checklisten, 2027-Preisübernahme in die Planung, Quellenstatus, Wiedervorlage, Varianten-Isolation und Mobilansicht. Full-End-to-End-Abnahme mit vollständigen lokalen privaten Tripsy-Dateien, tatsächlich verfügbare Zugtickets und Final-Checkout aller Hotelkandidaten bleiben offen. Keine Buchungen, externen Transfers oder öffentlichen Deployments.

## Weitere nachgewiesene 2027-Regeln · 12.11.2026

In `public/official-rules-2027.mjs` sind vier aus aktuellen **offiziellen** Anbieterwebseiten abgeleitete Hinweise, klar von Buchungs-/Preisverfügbarkeit getrennt: Venedig-Zugangsentgelt (veröffentlichte 2027-Tage bis einschließlich 15.08., keine Septembertage in der bisher veröffentlichten Liste; Verordnung/Modalitäten noch offen), Oeschinensee-Gondelbahn (Sommerbetrieb 24.04.–19.09.2027 täglich 08:30–18:00 Uhr, tatsächlicher Betrieb wetterabhängig), SIXT-Schweiz-Mietwagen (ab 19 Jahren und einem Jahr Führerschein; 18-Jährige dort nicht mietberechtigt) sowie Eiffelturm (offizielle Tarifseite verweist auf Änderungen ab 11.01.2027, bestehende 2026-Preisreferenzen nicht als 2027-Checkoutpreis ausgeben).

Diese Hinweise werden auf der **Reiseübersicht** der jeweils passenden Variante angezeigt und enthalten direkte Anbieterlinks. Sie werden weder als automatisch ausgewählte Aktivität noch als 0-Euro-Budgetposten gespeichert. Je zwei neue Tests für amtlichen Venedig-Kalender und Schweizer Bedingungen sowie Browserchecks für die drei- und vierköpfigen Varianten hinzugefügt. Es bleibt eine Quellen-/Regelprüfung, kein Nachweis von tatsächlicher Reservierbarkeit.

**Lokale Gesamtabnahme vorbereitet:** `Pruefen.cmd` führt auf Windows mit Node.js 24 zuerst die portablen Tests aus, prüft dann die 4 privaten `data/tripsy-*.json`-Dateien und startet nur bei Vorhandensein `npm test` sowie `npm run test:browser`. `TEST_LOCAL.md` beschreibt den Ablauf. Der vollständige Originaltest auf dem Nutzerrechner wurde hier **nicht ausgeführt** und bleibt bis zum späteren lokalen Test offen.

## Erweiterung · Karten-Explorer für jede Reisevariante · 12.11.2026

**Umgesetzt auf `feature/v7-unified-map-and-day-builder`:** Die vorhandene Leaflet-Karte und der bestehende Tagesplan werden statt einer Zweit-App weiterverwendet. **Karte → Karten-Explorer** zeigt die vorhandenen Hotels, Restaurants, Einkaufsorte, Aktivitäten und Bahnhofs-/Verkehrspunkte farbig (Blau/Orange/Gelb/Grün/Lila), mit Suchfeld, Kategorie-/Stadt-/Gesamtreisefiltern, Details, belegten Preis- und Öffnungsreferenzen, Quellenlisten und fehlenden Angaben. Einträge ohne belegte exakte Koordinaten werden **nicht auf Stadtzentren erfunden**, sondern in der Liste mit offenem Positionsstatus geführt. Koinzidente Pins sind für Auswahl leicht versetzt.

**A→B:** Zwei vorhandene Kartenpunkte können als Start und Ziel markiert werden. Der existierende lokale OSRM-/OSM-Fußrouter liefert nur bei erfolgreichem Datenbezug eine echte Weggeometrie mit Dauer/Distanz. ÖPNV-Vorschläge werden ausschließlich für Daten innerhalb der Gültigkeit eines tatsächlich geladenen GTFS-Pakets berechnet. Für September 2027 stehen die vorhandenen alten GTFS-Pakete in vielen Städten nicht zur Verfügung; stattdessen ein sichtbarer Hinweis und externe Planerlinks. Kein frei erfundener Straßen-, Fuß-, Bus- oder Zugweg. Ausgewählte Aktivitäten lassen sich mit Datum, Zeit und Dauer über den bisherigen `chooseItem`-Dialog im originalen Tagesplan hinterlegen; weder Budget noch Reisevariante ändern sich ohne bewusste Auswahl.

**Wiedergewonnene frühere Quellen:** Das vollständige frühere `reiseplaner_codex_seed_v0_2_2026-11-12.zip` enthielt `city_packages/*.json` (21 Stadt-/Streckenanker) und `daily_group_plan_suggestions.json` (14 nur optionale Tagesideen für die klassische September-Reise), die nicht im späteren 20-Dateien-Teilpaket enthalten waren. Aus ihnen wurden `data/research-v02/city-coverage-v02.json` und `day-suggestions-v02.json` als kompakte, nicht aktivierende Metadaten ergänzt. Die Bestandsaktivitäten/-Hotels wurden **nicht erneut importiert**. Vorschläge sind über den Karten-Tagesstreifen sichtbar, ohne die Tripsy-Originalplanung zu überschreiben.

**Abdeckung / ehrliche Lücken:** `npm run report:map` erstellt jederzeit den tatsächlichen Varianten-/Stadt-Audit. Bei der Prüfung des Branchs am 12.11.2026 gab es **36 Variants-Stadt-Kombinationen, 453 katalogisierte Varianten-Einträge, davon 143 mit echten Koordinaten und 310 ohne Punktposition**. Die 453 sind keine weltweit eindeutigen Angebote, da dieselben Orte in mehreren Reisevarianten vorkommen. Nur wenige Einträge enthalten verfügbare Stunden-/Menürecherchen; 2027er Endpreise und verifizierte Betten fehlen oft. `MAP_DATA_COVERAGE.md` enthält den Einzelvergleich; die UI kennzeichnet Unbekanntes und wertet es nicht als kostenlos.

**Prüfstand:** Neue `test/map-explorer.test.mjs` für Kategorien, vier Reisen, Orts-/Detailfilter, Geolokalisierung, Weg-Risiken und importierte Stadt-/Tagespakete. Chrome-E2E testet farbige Pins, Suchfeld, A→B und Auswahl einer Restaurant-Alternative im lokalen Tagesplan sowie die übrigen alten Module. Github Actions Node 24 + Python + Chrome + Server; historische vollständige Regression mit git-ignorierten vier privaten Tripsy-Rohdaten auf dem Windows-Rechner bleibt offen. Das neue GitHub-Prüfprotokoll und `MAP_EXPLORER.md` sind maßgeblich.

## 13.11.2026 – Datenabdeckung, echte Tagesrouten, Hotel- und Bahnprüfung

Die vier Prioritäten sind auf dem Branch `feature/v7-data-day-accommodation-rail` **funktional erweitert**, ohne die bisherigen Tripsy-Originalreisen oder `main` zu verändern. 39 neue Café-/Restaurant-/Einkaufsrecherchen in 12 Orten und sechs mit Betreiberquellen dokumentierte Sehenswürdigkeitsfamilien werden als ungebuchte, teilweise unbepreiste Optionen eingebunden. Die 39 Einträge sind **nicht automatisch auf die Karte gepinnt**: neue `Kartenstandort prüfen`-Funktion erlaubt nur explizites Nutzer-Geocoding mit OpenStreetMap Nominatim und Bestätigung der Adresse; kein Massenabruf.

`day-route.mjs` / `day-route-ui.mjs` und `app.mjs` ermöglichen jetzt bis zu 8 Stopps mit Startzeit, Reihenfolge, geprüftem Fußweg und bewusster Übernahme des vollständigen Tages. Unbestätigte Besuchsdauern sind Planannahmen, fehlende Geometrien werden nicht als Straßen ausgegeben. `stay-analysis.mjs` liefert EUR-Gruppenpreis pro Nacht/Person, Bahnhofsfußweg und Datenrisiken, ohne einen Zimmer-Checkout vorzutäuschen. `rail-analysis.mjs` zeigt Pass-Reisetage, Nachtzugprüfung, Umsteigeknappheit und fehlende 2027-Angebote an.

Die letzte grüne CI vor den abschließenden Geocoder-Tests (Actions 43375367543) hat 41/41 Node-Prüfungen sowie Chrome und HTTP bestanden; die finalen Änderungen benötigen den jüngsten Testlauf. `PHASE_1_TO_4.md` ist der detaillierte Audit. 2027-Preise, Buchbarkeit, Zimmerbelegung sowie die vollständige Windows-Regression mit privaten Tripsy-Snapshots bleiben weiterhin offen.
