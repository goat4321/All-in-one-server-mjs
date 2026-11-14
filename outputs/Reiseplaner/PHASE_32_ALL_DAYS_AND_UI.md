# Phase 32 – Tagespläne für alle 46 Kalendertage

**Implementierungsstand 14.11.2026 – Draft-PR #5, kein Merge und kein Deployment.**

## Daten und Deckung

| Quelle | Integration | Ergebnis |
| --- | --- | --- |
| Vier vorhandene Reisevarianten aus data/trips.json | Jeder Tag des jeweiligen Start-/Enddatums wird zwingend abgedeckt | 14 + 14 + 11 + 7 = **46 Tage** |
| data/transport.json | Reiseetappen bleiben unverbindliche Planwerte, inkl. Nachtzug-Folgetag | **35** Transferabschnitte |
| V19 Umfragepaket / data/research-v19-survey-first/activities.json | Nur tatsächlich für die Reise freigegebene Kandidaten, mit originaler Dauer und unveränderter ID | **97** Aktivitätszuordnungen |
| V02 14 Tagesideen / Umfragepräferenzen | Historischer Ideenkontext für Classic; keine automatische Aktivierung | Ergänzende Vorschlagsstruktur |
| Offizielle Oeschinensee-Betriebszeiten | Nur veröffentlichter Saisonzeitraum, keine gebuchte Einzelfahrt | 2027-Sommerbetrieb 24.04.–19.09., 08:30–18:00, https://www.oeschinensee.ch/tarife-fahrplan/ |

Die vollständigen Listen mit jedem Datum und jedem Ort befinden sich in [DAY_PLANS_2027_FULL_LIST.md](DAY_PLANS_2027_FULL_LIST.md). Die strukturierten Daten stehen in `data/day-plans-v32.json`.

## Ablauf und Interaktion

- Der Einstieg **Alle Tagespläne ansehen** auf der Startseite enthält die komplette Tagesliste der ausgewählten Reise. Jeder Eintrag führt direkt zu seinem Datum.
- **Tagesplan**: Eine verständliche Tageskarte zeigt grobe Zeitabschnitte (Vormittag/Nachmittag/Abend), echte Referenz-Fahrten inklusive als *unbestätigt* markierter Planzeiten, Ortsnamen und aus V19 übernommene geschätzte Aktivitätsdauer.
- **Karte**: Der Kurzüberblick ist standardmäßig eingeklappt, damit das vereinfachte Kartenlayout nicht überladen wird. Nutzer können ihn aufklappen; sein Zustand bleibt über Kartenrender hinweg erhalten.
- **Bilder**: Soweit dem Aktivitätsdatensatz bereits eindeutig zugeordnete Commons-/eigene Bilder mit Quellenangabe vorliegen, werden diese als Miniatur angezeigt. Andernfalls gibt es neutrale Icons. Keine generierten Hotel-/Ortsfotos als vermeintliche Originalaufnahme.
- **Übernahme**: **Zum Tag** übernimmt genau eine Aktivitätsidee. **Ideen zum Tag hinzufügen** übernimmt alle noch freien, nicht als Alternative markierten Tagesideen. Es wird nur ein datierter, **nicht getimter** Vorschlag mit `selected:true` gespeichert. Bestehende Buchungs- und Reisedaten bleiben unverändert. Bereits ausgewählte Aktivitäten werden nicht verschoben oder doppelt übernommen.
- **Fortschrittsanzeige**: Der tatsächlich gespeicherte Anteil der Tagesideen wird angezeigt (z. B. 1 von 3). Eine dezente Animation und Hover-Effekte gelten nur für die Darstellung und werden mit `prefers-reduced-motion` oder der Motion-Einstellung abgeschaltet.
- **Nachtzug-Folgetag**: Die bestehende Teststrecke Paris–Toulouse 17./18.08. wird am 18.08. zusätzlich als unbestätigte Nachtzug-Ankunft angezeigt, ohne eine zweite Fahrt zu erfinden.
- **Dauer**: Aktivitätsminuten werden aus dem V19-Umfragepaket addiert; Fahrtstunden werden ausschließlich aus den als provisorisch markierten Quellzeitfenstern ermittelt. Transferzeiten für Fußwege, Check-in und die 2027-Verbindungsbestätigung sind ausdrücklich nicht enthalten.

## Schutz vor falschen Annahmen

Es gibt **keine automatischen Hotel-, Zug-, Club- oder Gondelbuchungen**. Lange Transfertage haben absichtlich keine zusätzlichen Pflicht-Aktivitäten. Die Clubnacht ist ebenso wie manche kostenpflichtigen oder wetterabhängigen Angebote als manuelle Option gekennzeichnet. Swiss-lakes-Tage werden mit ihrer Mehr-Städte-Ansicht geöffnet, damit Wasserauen/Seealpsee und Kandersteg/Oeschinensee zusammen angezeigt werden.

## Dateien

Neu: `data/day-plans-v32.json`, `lib/day-plans-v32.mjs`, `public/day-plans-logic.mjs`, `public/day-plans-ui.mjs`, `public/day-plans-v32.css`, `test/day-plans-v32.test.mjs` und die vollständige Tagesliste.

Geändert: `lib/catalog.mjs`, `public/app.mjs`, `public/views.mjs`, `public/index.html`, `package.json`, `test/portable-browser.mjs`, `README.md`.

## Nachweise und offene Tests

- Die 46 Datenpläne wurden gegen alle 4 Original-Datumsbereiche und die 57 V19-Aktivitätsreferenzen abgeglichen. Ergebnis: **46 von 46 Tagen, 97 von 97 Zuordnungen, 35 Quellfahrten**.
- Die 8 neuen Tagesplan-Unit-Tests wurden separat in einer V8-Ausführung mit synthetisch rekonstruierten Katalogobjekten aus den vorhandenen Trips-/V19-/Transfer-Quelldaten ausgeführt: **8/8 bestanden**. Dies ist kein vollständig ausgeführter Node-/Chrome-End-to-End-Test.
- Die vollständige GitHub-Action für den Entwicklungsbranch scheiterte zuletzt erneut beim Runner-Start mit **0 ausgeführten Testschritten**. Ein neuer visueller Screenshotvergleich und ein kompletter Node-Regressionstest sind daher **noch nicht bestanden bzw. nicht bestätigt**.
