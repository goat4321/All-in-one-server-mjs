# Karten-Explorer: gemeinsame Karte und Tagesplanung

**Projektstand 12.11.2026 · Branch `feature/v7-unified-map-and-day-builder`.** Umsetzung baut auf der bestehenden Leaflet-Karte, dem Tripsy-/Research-Katalog, den vier getrennten Reisevarianten und ihrer jeweiligen SQLite-Planung auf. Die Karte zeigt Quellen und Planannahmen, führt aber keine Buchungen oder Original-Updates aus.

## Was in der Website neu ist

- **Karte → Karten-Explorer**: Alle tatsächlich katalogisierten Orte einer gewählten Reisevariante durchsuchen. Standardmäßig **Gesamte Reise**, alternativ nur die aktuell gewählte Stadt. Nicht ausgewählte Alternativen können hier als unverbindliche Recherchepunkte sichtbar sein, ohne ihre Auswahl, das Gruppenbudget oder die originale Route zu verändern.
- **Farbkategorien:** Blau = Hotels/Hostels/Unterkünfte, Orange = Restaurants/Cafés, Gelb = Supermärkte/Einkauf, Grün = Aktivitäten/Sehenswürdigkeiten/Natur, Lila = Bahnhöfe/Verkehr. Filter und Suchfeld finden Namen, Tags und bestehende Beschreibungen. Wenn mehrere Optionen exakt dieselbe Koordinate besitzen, stehen ihre Pins leicht versetzt nebeneinander.
- **Datumsnavigation** für alle vier Reisen. Für die klassische Septemberreise stehen **14 optionale, zuvor recherchierte Tagesideen** (01.–14.09.2027) inklusive Aktivitätsanker, optionaler Alternativen und Risikohinweisen bereit. **Keine** dieser Ideen wird ohne aktiven Nutzerklick übernommen.
- **21 ursprüngliche Ortspakete**: Die ergänzenden Abdeckungszahlen aus dem älteren vollständigen ZIP (`city_packages/*.json`) sind getrennt als `data/research-v02/city-coverage-v02.json` hinterlegt. Ihre 115 Aktivitäten und 92 Hotelsuchpreisversionen sind schon im aktuell katalogisierten v0.2-Datensatz vorhanden und werden nicht dupliziert. Die 14 Tagesideen liegen unter `data/research-v02/day-suggestions-v02.json`; beide Dateien sind **kompakte, aus dem älteren ZIP abgeleitete Metadaten**, kein neuer bestätigter 2027-Fahrplan.
- **Ortsdetails direkt neben Karte und in der Liste:** Name, Beschreibung/Tätigkeit, vorhandene Gerichte/Speisekarte, belegte Öffnungs-/Check-in-Zeiten, Besucher-/Gruppenpreis und Preisgültigkeit, Hotelzimmer/Küche/Bad/Gebühren/Storno sofern bekannt, Adresse, Quellstatus und anklickbare Quelle. **Fehlende** Angaben werden als **offen** markiert. Die volle Herkunft inklusive verlinkter Einzelnachweise ist unter **„Quellen, Abrufdaten und Datenqualität anzeigen“** erreichbar.
- **Orte ohne belastbare Koordinate** bleiben in der scrollbaren Ergebnisliste, werden aber **nicht willkürlich auf das Stadtzentrum gepinnt**. Verkehrshaltestellen sind nur dann auf der Karte sichtbar, wenn wirkliche Stationskoordinaten im Bestand vorliegen. Zielbahnhöfe werden aus ihren ursprünglichen Tripsy-Koordinaten abgeleitet, nicht als zweite Zugfahrt behandelt.
- **Weg von A nach B:** Bei zwei Punkten „Als Start“/„Als Ziel“ wählen. Im Modus **Zu Fuß** wird der vorhandene lokale Fußwegcache bzw. der vorhandene OpenStreetMap/OSRM-Backendrouter mit tatsächlicher Weggeometrie benutzt. Bei Erfolg erscheint die Straßenlinie mit Minuten, Distanz und 0 € für den Fußweg. Bei fehlender Strecke wird **kein** gerader Luftlinienweg als reale Gehroute angezeigt. Externer OpenStreetMap-Fußweg-Link steht bereit.
- **ÖPNV-Routing:** Für das gewählte Datum, die vorhandene Stadt und nur innerhalb der **tatsächlichen GTFS-Gültigkeitszeit** darf der bestehende Fahrplanrouter konkrete Referenzverbindungen liefern. Für September 2027 sind die vorhandenen 2026/Frühjahr-2027-Feeds vielerorts **nicht gültig**. Dann steht ausdrücklich „kein gültiges Fahrplanpaket“ und ein externer Routenplaner/Betreiberlink. Zeit, Tarif und Umstieg werden **nicht erfunden**.
- **Tag zusammenstellen:** „Zum Tagesplan hinzufügen“ verwendet den vorhandenen geprüften Auswahl-/Zeitdialog. Erst danach wirken Aktivität, Preisreferenz und Planung auf Timeline, Tageskarte und Budget. Hoteloptionen bleiben reine Auswahlplanungen, keine echten Buchungen.

## Vollständigkeit / automatisierter Audit

Mit `npm run report:map` erhältst du für **jede Variante und jeden ihrer Orte** eine aktuelle tabellarische Übersicht der katalogisierten Kandidaten, geografisch präzise zuordenbarer Pins, Einträge ohne Koordinaten, vorhandener Preis- und Öffnungsreferenzen sowie Kategorieanzahlen. Optional kann `node test/map-coverage.mjs --json` ein maschinenlesbares Prüfprotokoll erzeugen.

Der Audit zählt **keine hypothetischen Gebäude** als bestätigte Kartenpunkte und zeigt offen, in welchen Orten die alte Recherche nur grobe Anker oder wenige Vorschläge enthält. Die Gesamtzahlen sind **variantenbezogen** und können denselben echten Ort in mehreren, getrennten Varianten berücksichtigen; sie sind **keine** Anzahl weltweit eindeutiger Unternehmen.

## Nicht umgesetzt oder nicht belegbar

1. Nicht für jeden Kandidaten existieren konkrete Eingangspunkte, Speisekarten, aktuelle Öffnungszeiten, 2027-Tarife, garantierte Dreierzimmer oder belastbare Quellen. Solche Daten sind **offen**, nicht „kostenlos“, „immer geöffnet“ oder automatisch passend.
2. Die Stadtlinien/GTFS-Referenzebenen aus 2026 und Frühjahr 2027 ersetzen keine künftigen aktuellen ÖPNV-Fahrpläne. Es werden keine 2027-ÖPNV-Zeiten oder Preise ohne belastbare Daten generiert. Große Zugstrecken werden weiter unter **Bahn & Interrail** behandelt.
3. Der neue A→B-Rechner optimiert noch keine beliebig lange Mehrstopp-Rundreise mit ÖPNV und Offline-Navigation. Für die einzelnen ausgewählten Ziele und vorhandenen Tagesketten kann der vorhandene Wegerechner verwendet werden.
4. Keine Karte importiert/geokodiert automatisch sämtliche Restaurants einer Stadt aus externer Bulk-API. Alle verfügbaren eigenen Quellen werden berücksichtigt; zusätzliche Adress-/POI-Recherche erfordert belegte, lizenzkonforme Daten und API-/Partnerzugang.
5. Historische vollständige Tests mit den vier ursprünglichen, lokal gespeicherten und absichtlich git-ignorierten Tripsy-Rohkopien bleiben ein **separater lokaler Abnahmeschritt** (`Pruefen.cmd`). Neu durch GitHub Actions ausgeführte Node-/Browser-/HTTP-Tests ersetzen diese nicht.

## Benutzung

1. Reisevariante oben links auswählen, Menü **Karte** öffnen.
2. **Gesamte Reise** oder **Nur [Stadt]** wählen; Datum über die Tagesleiste auswählen.
3. Farbe/Kategorie auswählen oder nach Ort/Gericht/Aktivität suchen.
4. Pin oder Listenkarte wählen: Beschreibung, Preis- und Öffnungsstand sowie Quellen ansehen.
5. Bei zwei verorteten Optionen **Als Start** und **Als Ziel** anklicken; Fußweg oder ÖPNV prüfen.
6. Mit **Zum Tagesplan hinzufügen** eine Aktivität ausdrücklich für den gewählten Tag mit Start und Dauer übernehmen; neue Änderungen bleiben lokal und variantenbezogen.
7. Unter `Daten & Fristen` die offenen Datenqualitätsbefunde, unter `Unterkünfte` die Zimmerbelegungs-/Endpreisprüfung kontrollieren.
