# Audit aller bisherigen Reise-Kartenpunkte (12.11.2026)

**Quelle:** Automatisch mit `npm run report:map` aus dem privaten GitHub-Stand und dem konsolidierten Research-v0.2-Katalog ermittelt. Gelesener CI-Lauf: [GitHub Actions](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43318827909), Schritt „Karten-Datenabdeckung für alle Reisen und Städte“ (dieser Lauf ist insgesamt wegen eines später behobenen Browserfehlers fehlgeschlagen; **die vorher ausgeführte Kartenstatistik selbst war erfolgreich**). Nach Quelländerungen den Bericht erneut generieren und nicht allein diese Momentaufnahme verwenden.

**Katalog-Abdeckung über vier unabhängige Reisevarianten:** **453** variantenspezifische Einträge, davon **143 mit Koordinaten** und **310 ohne zuverlässigen Kartenpunkt**. Dies sind *variantenübergreifend mehrfach gezählte Optionen* – keine 453 unterschiedlichen Orte. Die gesamte Oberfläche enthält weitere belegte Netzdaten aus GTFS/OSM, die hier nicht als eigene Restaurants/Hotelangebote gezählt werden. Vorhandene Quellkoordinaten sind nicht bei jedem Hotel der unabhängig geprüfte Eingang.

**Wichtige Warnung:** `Preisref.` umfasst alte, nicht unbedingt buchbare Preise (auch 2026). `Öffnungsref.` sind bisher im Code modellierte Uhrzeitangaben, **keine bestätigten Öffnungszeiten für September 2027**. Ein fehlender Wert bedeutet *unbekannt*, niemals 0 €, kostenlos, geschlossen oder 24/7. Ursprüngliche Routen und Ausgangsvarianten bleiben getrennt. Die offiziellen 2027er ÖPNV-Feeder sind teilweise noch nicht veröffentlicht.

| Variante | Ort | Optionen | Pins | Kein genauer Pin | Preisref. | Öffnungsref. | Hotels | Restaurants | Einkauf | Aktivitäten | Verkehr |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| interrail_classic | munich | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_classic | paris | 29 | 6 | 23 | 15 | 1 | 11 | 1 | 0 | 16 | 1 |
| interrail_classic | barcelona | 41 | 14 | 27 | 17 | 3 | 15 | 4 | 2 | 19 | 1 |
| interrail_classic | sete | 24 | 1 | 23 | 11 | 0 | 12 | 0 | 0 | 11 | 1 |
| interrail_classic | nice | 28 | 9 | 19 | 12 | 0 | 12 | 0 | 0 | 14 | 2 |
| interrail_classic | genoa | 26 | 10 | 16 | 11 | 0 | 12 | 1 | 0 | 11 | 2 |
| interrail_classic | venice | 28 | 14 | 14 | 11 | 0 | 13 | 0 | 0 | 13 | 2 |
| interrail_swiss | munich | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_swiss | paris | 24 | 6 | 18 | 15 | 1 | 11 | 1 | 0 | 11 | 1 |
| interrail_swiss | barcelona | 33 | 14 | 19 | 17 | 3 | 15 | 2 | 2 | 13 | 1 |
| interrail_swiss | sete | 20 | 1 | 19 | 11 | 0 | 12 | 0 | 0 | 7 | 1 |
| interrail_swiss | nice | 23 | 7 | 16 | 12 | 0 | 12 | 0 | 0 | 9 | 2 |
| interrail_swiss | kandersteg | 7 | 5 | 2 | 2 | 0 | 1 | 0 | 0 | 4 | 2 |
| interrail_swiss | appenzell | 8 | 6 | 2 | 1 | 0 | 3 | 1 | 0 | 2 | 2 |
| interrail_august | munich | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_august | paris | 13 | 6 | 7 | 4 | 1 | 0 | 1 | 0 | 11 | 1 |
| interrail_august | toulouse | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_august | narbonne | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| interrail_august | barcelona | 20 | 10 | 10 | 4 | 3 | 2 | 2 | 2 | 13 | 1 |
| interrail_august | sete | 10 | 1 | 9 | 1 | 0 | 2 | 0 | 0 | 7 | 1 |
| interrail_august | marseille | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_august | nice | 13 | 7 | 6 | 2 | 0 | 2 | 0 | 0 | 9 | 2 |
| interrail_august | ventimiglia | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_august | genoa | 12 | 6 | 6 | 1 | 0 | 2 | 1 | 0 | 7 | 2 |
| interrail_august | milan | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| interrail_august | venice | 13 | 10 | 3 | 1 | 0 | 3 | 0 | 0 | 8 | 2 |
| swiss_lakes | munich | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| swiss_lakes | appenzell | 19 | 3 | 16 | 11 | 0 | 13 | 1 | 0 | 3 | 2 |
| swiss_lakes | wasserauen | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| swiss_lakes | seealpsee | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| swiss_lakes | kloental | 5 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 4 | 1 |
| swiss_lakes | glarus | 4 | 0 | 4 | 3 | 0 | 3 | 0 | 0 | 0 | 1 |
| swiss_lakes | grindelwald | 19 | 2 | 17 | 11 | 0 | 11 | 0 | 0 | 7 | 1 |
| swiss_lakes | bachalpsee | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| swiss_lakes | kandersteg | 19 | 4 | 15 | 12 | 0 | 11 | 0 | 0 | 6 | 2 |
| swiss_lakes | oeschinensee | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |

## Priorisierte offene Datenlücken
- **Große Lücken bei geocodierten Unterkunftskandidaten.** Viele der 92 Suchpreis-Snapshots enthalten einen Standortnamen/Stadtteil, aber keinen geprüften Gebäudezugang. Diese bleiben in der Trefferliste und werden nicht aus Stadtmitteln geschätzt.
- **Französische/Schweizer Zwischenstationen und Seenorte** haben wenige überprüfte genaue Kartenpositionen; offizielle Wanderwege und Zugänge sind keine beliebigen linearen Fußwege. Hier müssen konkrete Einstiegspunkte und echte Betreiber-/Wegquellen ergänzt werden.
- **Restaurants und Speisekarten außerhalb Barcelonas:** Das ältere Paket bietet nur einzelne belegte Restaurants. Vollständige Speisekarten, Preiskategorien und Öffnungszeiten für alle Städte sind nicht nachgewiesen. Die UI zeigt fehlende Angaben ausdrücklich an.
- **ÖPNV am 2027-Reisetag:** Vorhandene 2026-GTFS-Daten, schematische Kartenlinien und externe Anbieterlinks sind nicht mit minutengenauem, gültigem 2027-Service gleichzusetzen.
- **Wegoptimierung:** Einzelne A→B-Fußwege werden über den vorhandenen OSRM-Router mit realer Liniengeometrie ermittelt; mehrstädtische bzw. nicht verfügbare ÖPNV-Routen brauchen einen externen Betreiberplaner. Kein Ersatz durch Luftlinie.

## Neuer systematischer Recheck
`npm run report:map` erzeugt für alle vier Reisen erneut eine tabellarische Abdeckung. `node test/map-coverage.mjs --json` erzeugt ein maschinenlesbares JSON für spätere Automatisierung. `npm run test:portable` prüft Variantenisolation, Quellen- und Ortsfilter. `node test/portable-browser.mjs` prüft Suche, Kategorie-Pins, A→B und Einfügen in den Tagesplan. Der vollständige historische Windows-Test mit vier privaten Tripsy-Rohdateien bleibt über `Pruefen.cmd` separat erforderlich.
