# Projektstand · 12.11.2026

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
