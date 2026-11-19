# Phase 39 – Sichtbare Belege statt Fragezeichen (15.11.2026)

## Umgesetzt auf feature/v7-data-day-accommodation-rail
- **5 weitere zugeordnete Wikimedia-Commons-Fotos**: Quartier Latin (Paris), Rambla del Poblenou (Barcelona), Port Lympia (Nizza), Murano (Venedig), Grindelwald Dorf. Alle Commons-Fotoseiten, Autoren und Lizenzen wurden einzeln überprüft. Ein Murano-Foto wird nicht als Burano-Ansicht ausgegeben, ein Stadtfoto nicht als Hotelzimmer.
- Die vorherige Sammlung von 44 wächst auf **49** manuell hinterlegte, lizenzierte Bildobjekte. Manche werden in mehreren Reisevarianten wiederverwendet; die Anzahl ist keine Zahl unterschiedlicher Ortskarten.
- **Keine standardmäßigen Fragezeichen im Kartenbild:** Ungenaue Stadt-Sammelmarker sind nur noch optional. Daten fehlen weiterhin unverändert in der Datenbank, werden aber ehrlich im aufklappbaren **„Orte ohne genaue Position“** nach Art des Nachweisproblems angezeigt.
- Fehlende Punkte werden nach Datenschutz (private Airbnb-Adresse), Fläche/Idee ohne festgelegten Treffpunkt, vorhandener aber nicht koordinatenbestätigter öffentlicher Adresse oder fehlendem Standortbeleg differenziert. **Keine Schätzkoordinaten**. Link zur vollständigen Varianten-Datenprüfung und bei öffentlich gespeicherter Adresse manueller Nominatim-Review auf Klick.
- Aktivitäten-Reiter: **Quellenbild**, **fehlendes Objektbild**, **belegte Koordinate**, **fehlender Pin**, **Preisreferenz vorhanden**, **Preis offen** und **alle Nachweise** als kombinierbare Filter. Bestehende Filter auf Stadt, Kategorie und Favoriten bleiben.
- Daten-Audit: bestehender **JSON-Export** plus **deutschsprachiger CSV/Excel-Export** mit **einer Zeile pro fehlendem Nachweis**, Erläuterung, Prüfauftrag und möglichem Nutzerbeitrag. CSV escaped Semikolons, Unicode, Anführungszeichen und Spreadsheet-Formel-Präfixe.
- Bestehendes responsives Styling und zurückhaltende Übergänge wiederverwendet; zusätzlich gezielte Klassen für neue Aufklapp- und Filterbereiche.

## Grenzen und offene Aufgaben
- Der gesamte Bericht ist eine Vollständigkeitsanalyse vorhandener Daten, **keine behauptete öffentliche Einzelrecherche aller fehlenden Anbieterfelder**. 2027-Endpreise, zeitgebundene Fahrpläne und tatsächliche Verfügbarkeiten sind dadurch nicht bestätigt.
- Karten-Zusammenfassungen einzelner Städte sind optional und **kein genauer Einzelpunkt**. Die native Kartenansicht und Routenberechnung verwenden keine geschätzten Pins.
- Herkunft und Lizenz der fünf Motive sind auf den jeweiligen öffentlichen Commons-Dateiseiten nachprüfbar, aber externe Bild-URLs können auch künftig im Browser fehlschlagen. Der bereits bestehende Bild-Fallback übernimmt dann.
- Für alle privaten Immobilien fehlen weiter öffentlich verwendbare und zurechenbare Bildrechte bzw. der genaue Standort – nicht automatisch mit anderen Anbieterbildern auffüllen.
- Später zu prüfen: mobile Referenzbild-Abnahme des neuen Prüfkastens, weitere exakte öffentliche POIs statt allgemeiner Stadtpunkte, vollständige Tests mit lokalen privaten Tripsy-Snapshots.

## Testbefehle
Im Unterordner outputs/Reiseplaner mit Node >=24:
- npm run test:portable
- npm run test:smoke
- npm run report:map
- node test/portable-browser.mjs
- npm test (benötigt vier lokale private Tripsy-Rohdateien, die absichtlich nicht in GitHub liegen)

Die automatisierten GitHub-Actions-Läufe prüfen portable Modelle und den Headless-Browser. Nur grüne Ergebnisse gelten als abgeschlossen; main bleibt unangetastet.