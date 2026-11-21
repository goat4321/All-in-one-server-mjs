# Eigene Pins und Mehrstopprouten · lokale Abnahme vom 19.11.2026

Umfang: CHECKLIST_V2 P2.2/P2.6–P2.9/P2.11 und Variantenabgrenzung P3.6. Ausgangscommit ist `ab26f9b`, lokaler Branch `codex/checklist-v2-audit`. Der vollständige Master-/61-Punkte-Umfang bleibt aktiv und ist mit diesem Paket nicht vollständig abgenommen.

## Nutzbare Bedienung

Im Kartenkopf sind „Eigener Pin“ und „Vollbild“ direkt erreichbar. Eigene Punkte lassen sich per Koordinaten oder echtem Leaflet-Kartenklick anlegen. Name und Notiz bleiben beim Wechsel in den Klickmodus und beim Zurückkehren mit Escape erhalten. Die neuen Punkte beginnen als ungeplante, manuelle, ungeprüfte Alternativen ohne angenommene Gebühren. Erst die spätere bewusste Auswahl plant sie ein.

Die Pinverwaltung befindet sich im Ortsbereich der Karte. Umbenennen, Verschieben, Entfernen und Undo sind geprüft. Entfernen ist eine lokale Ausblendung mit erhaltener Historie; es verändert keine externen Daten. Bearbeiten eines bereits gewählten Pins erhält dessen Startzeit. Manuelles Verschieben löscht alte Koordinatenbelege, damit ein neuer Punkt nicht die Verifizierung der alten Position erbt. Ein bewusst angezeigter Pin setzt entgegenstehende Kategorie-/Such-/Merklisten-/Umkreisfilter zurück.

Der Mehrstopp-Editor erscheint für gewählte Stopps auch im einfachen Kartenmodus. Die alte CSS-Regel hatte ihn dort vollständig ausgeblendet. „Route (n/8)“ führt direkt zum Editor. Zwei bis acht eindeutige Aktivitäten lassen sich sammeln, umordnen, entfernen und fokussieren; ein neunter Stopp wird abgewiesen. Der Fokus folgt dem Ort beim Umordnen oder Entfernen vorheriger Einträge. Die horizontale Darstellung richtet den ausgewählten Stopp auch beim Wechsel von 820 auf 390 Pixel neu aus.

Eine Änderung nur der Startuhrzeit erhält berechnete Fußgeometrie und berechnet die Besuchszeiten neu. Der Planner übernimmt vollständige geprüfte Fußwegantworten, erhält vorhandene Tagespunkte und blockiert entfernte, aktive, gebuchte oder gesperrte Zielpunkte. Bekannte Zeitintervalle von Aktivitäten und Bahnfahrten werden absolut verglichen, einschließlich über Mitternacht laufender Termine und der Gehintervalle zwischen Besuchen. Ein längerer Fußweg ist keine freie Lücke für einen Zugtermin.

## Tatsächliche Wegquelle und klare Grenzen

Ein einziger öffentlicher FOSSGIS-Aufruf am **19.11.2026** lieferte die Referenz für acht vorhandene Barcelona-Katalogpunkte: sieben Fußetappen, 754 Punkte der Gesamtübersicht, 10.155,5 Meter und 8.129,3 Sekunden. Alle ausgegebenen Schritte haben Modus `walking`. Die sieben aus den Originalschritten gewonnenen Weggeometrien passen jeweils mit maximal 75 Metern erlaubtem Router-Snapping zu den übergebenen Endpunkten. Ein berechneter Weg belegt keinen tatsächlichen Hauseingang und keine Öffnung im September 2027.

Der vollständige öffentliche Antwortdatensatz steht in `test/fixtures/barcelona-foot-route.json`, mit ursprünglicher Abfrage-URL, Datum, Zweck, Lizenzhinweis und semantischem SHA-256 der Antwort:

`eb2becaa55382fb40d414e0fcce17e65cf202915ac51fc111cc243e050cd3ddd`

Quelle und Nutzungsrahmen: [FOSSGIS-Routingdienst](https://routing.openstreetmap.de/about.html), [OpenStreetMap und Mitwirkende](https://www.openstreetmap.org/copyright), [ODbL](https://opendatacommons.org/licenses/odbl/1-0/). Die Wiederholungstests spielen diese datierte Antwort lokal ein und stellen keine weiteren öffentlichen Routinganfragen. Das Backend prüft weiter den Fußmodus. Die Abfrage verwendet den separaten `routed-foot`-Dienst; der interne API-Pfadname `driving` ist keine Bestätigung einer Autofahrt.

Die acht kurzen Besuchsdauern im Browserfall sind **15-minütige Testannahmen**. Die Testtour ist keine Empfehlung, sämtliche genannten Attraktionen nachts zu besuchen. Für den Fall „19:00 Start“ ergibt die Rechenprüfung 23:20 Ende; Tickets, Zugänge, Wetter und Öffnungen bleiben getrennt offen. Diese Testpins werden ausschließlich in einer isolierten Testdatenbank erzeugt und erscheinen nicht in der Nutzervorschau.

## Reproduzierbare Prüfungen

Abschließender Originaldatenlauf: **515/515 vollständige Node-Tests**, **494/494 portable Node-Tests**, Kartenbericht für vier getrennte Varianten und HTTP-Smoke-Test bestanden. Keine übersprungenen Fälle. Die portable Reihe ist eine Teilmenge und wird nicht hinzuaddiert. Die neuen Fälle sind Bestandteil der portablen Reihe. Der bestehende vollständige Chrome-Flow, Daten-/Download-/Import-Flow und Mahlzeiten-PUT-Rennfall bestehen nach der Integration ebenfalls.

- `npm run test:map-browser`: tatsächlicher Mausklick auf die Karte, Koordinatenformular, Escape mit erhaltenem Entwurf, Umbenennen/Verschieben/Entfernen/Undo, Kategorie-Reset, zwei und acht Stopps, Grenze/Dubletten, Umordnen und native Enter-Fokusbedienung. Eine kollidierende Tagesübernahme bleibt ohne Änderung; spätere Uhrzeit wird übernommen, per Undo zurückgenommen, erneut gespeichert und im tatsächlichen Tagesplan nach Neuladen geprüft. Die drei anderen Varianten bleiben bytegleich im gespeicherten Zustand.
- `npm run test:map-race`: echte Chrome-Anfragen werden kontrolliert angehalten. Antworten nach Leeren, Umordnen, einer neueren Berechnung, Varianten- und Datumswechsel verändern den neuen Entwurf nicht. Das ursprüngliche Fehlverhalten „geleerte Route später wieder als berechnet“ wurde zuerst reproduziert.
- Elf gezielte Modellfälle prüfen Pinstatus, ausgewählte Startzeit, Evidence-Reset, ungültige Eingaben, Anfragegenerationen, entfernte/doppelte Stopps, Extraantworten, Fokus und den Original-Routinghash. Die Übernahmetests enthalten Zugankunft, Übernacht-Aktivität und einen Zug vollständig innerhalb eines vierminütigen Gehwegs.
- Zwei zusätzliche reale HTTP-Fälle prüfen: fehlender gespeicherter Fußweg ohne erfundene Dauer; nicht zu Fuß verlaufende Providerantwort mit Ablehnung und ohne Wiederverwendung als Fußweg; September 2027 außerhalb des tatsächlichen ÖPNV-Pakets mit `status=outside` und leerer Verbindungsliste.
- Der bestehende vollständige Chrome-Ablauf, Datenbereich mit echten Downloads/Import und Mahlzeiten-PUT-Rennfall wurden erneut ausgeführt. Ihre Ergebnisse werden zusammen mit den finalen Gesamtlogs geführt.

Vollbild und Pinformular wurden bei 1440, 820 und 390 Pixeln geöffnet. Primäre Vollbildaktionen müssen innerhalb des sichtbaren Fensters liegen; Kategorien dürfen die umgebrochene Werkzeugleiste nicht überlagern. Die mobile Schließen-Schaltfläche steht in der ersten Zeile. Das ist keine vollständige Abnahme aller offenen Drawer-/Animationszustände oder sämtlicher dunkler Kontraste.

## Datenbezug und verbleibende Arbeit

Die Originaldatenabnahme nutzt dieselben vier privaten Tripsy-Rohkopien. Der Bild-Vorherstand wurde unabhängig aus dem unveränderten Commit exportiert und mit per SHA-256 identischen Rohkopien versehen. Keine Quelle wurde verschoben oder verändert. Eigene Pins, Fristen, Gruppenbudget und Routenvarianten bleiben getrennt.

Der separat aus dem vorbereiteten Git-Index exportierte Checkout ohne private Tripsy-Dateien besteht ebenfalls mit **494/494 portablen Tests**, Kartenbericht, HTTP-Smoke-Test, demselben Chrome-Pin-/Mehrstoppablauf und allen fünf Fällen verzögerter Routingantworten. Wo keine zeitlich importierte Originalaktivität existiert, erzeugt ausschließlich die isolierte Testdatenbank einen ausdrücklich benannten Testtermin für die Konfliktprüfung. Der Bericht kennzeichnet diesen Fall über `needsBusyFixture`; damit wird kein importierter oder gebuchter Nutzertermin behauptet.

Der unabhängige lesende Review und die Nachprüfung melden nach den Korrekturen keine verbleibenden konkreten Befunde in diesem Paket. Je 33 Vorher- und Nachheransichten umfassen elf Seiten bei drei Breiten; beide automatisierten Berichte enthalten keine JavaScript-Ausnahme und keinen positiven horizontalen Seitenüberlauf. Das ist keine vollständige visuelle Abnahme aller Seitenzustände und kein allgemeiner Geschwindigkeitsnachweis. Die bestehende Nutzervorschau liefert die neuen Module aus; ihre Bootstrap-API enthält weiterhin alle vier Varianten.

Ein Rad-Routingmodul ist weiterhin nicht integriert. Fehlende 2027-ÖPNV-Daten bleiben offen; vorhandene Linien und externe Planerlinks ersetzen keinen gültigen Fahrplan. Bei Bahnfahrten ohne bekanntes Ende oder bekannte Dauer ist keine vollständige Konfliktfreiheit belegbar. Für vorhandene Aktivitäten ohne Ende/Dauer bleibt die bisherige lokale Annahme von 60 Minuten bestehen. Wegzustand, Eintritt und Zugang werden durch die Routingantwort nicht verifiziert. Die übrigen Tages-, Design-, Referenzbild-, Bildlizenz- und Kontrastanforderungen stehen weiter in CHECKLIST_V2.md.

## Artefakte

Im ursprünglichen Aufgabenordner unter `outputs/Abnahme-V2/karte`: unveränderter Vorherstand, aktueller Nachherstand, die tatsächlichen achtstoppigen Desktop-/Tablet-/Smartphoneansichten, Vollbildansichten und `map-flows.json`. Alle reproduzierbaren Bilder blockieren externe Medien/Kartenkacheln; sie belegen UI, lokale Daten und gespeicherte Weggeometrie. Die Live-Antwortbeobachtung ist davon getrennt dokumentiert. Grüne lokale Prüfungen sind keine Behauptung eines neuen Remote-CI-Erfolgs. Kein Merge oder Deployment.
