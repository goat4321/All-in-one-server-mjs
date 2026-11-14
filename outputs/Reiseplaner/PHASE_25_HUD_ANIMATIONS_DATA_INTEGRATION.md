# Phase 25 – HUD, Animationen und Quellen-/Kartendatenintegration

**Stand:** 14.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · **Draft-PR #5** · Nicht gemergt oder deployed. Originale Reisevarianten, Buchungszustände, Gruppendaten, Budgetwerte und Referenzarchive wurden nicht geändert.

## Was jetzt implementiert ist

### 1. Kompakter Reise- und Kalender-HUD

Die neue Datei `public/travel-hud.mjs` verwendet direkt das bestehende `ctx`-Modell aus `public/app.mjs`. In der Desktop-Kopfzeile wird die **Position des ausgewählten Plankalendertags** als `PLAN-TAG x/y` mit subtiler Fortschrittsleiste angezeigt. Der Button führt zum Tagesplan.

Wichtig: Das ist die **Position im zukünftigen Reiseplan**, weder ein Echtzeitstatus noch ein bereits verstrichener Reisetag. Auf schmalen Displays wird die Kopfzeilen-Ergänzung bewusst ausgeblendet, damit Menü, Titel und Bedienelemente nicht überlaufen.

Der bisherige `atlas-day-glance`-Abschnitt wurde zu einem `travel-day-hud` ausgebaut. Er enthält ohne erfundene Werte:
- Stadt, ausgewählten Kalendertag und Anzahl Tage der aktuell geöffneten Reisevariante;
- Tagesstopps, echte Uhrzeitfelder im Format HH:MM sowie die übrigen flexiblen Stopps;
- ausschließlich bereits **im lokalen Plan erfasste** Eurobeträge; bei fehlendem Betrag ausdrücklich `Kosten offen bzw. kostenlos`, **keine** falsche finale Budgetgarantie;
- Anzahl der Einträge dieser Stadt mit einem verknüpften HTTPS-Webbeleg (getrennt von dessen tatsächlicher Aktualität);
- den direkten Button **„Fotos prüfen“** zur dynamischen Datenlückenliste.

### 2. Interaktiver Karten-HUD

Das bisherige statische Feld `map-atlas-hud` verwendet nun `renderMapHud(ctx)` und ergänzt:
- Zahl der **sichtbaren** Einträge mit einem Kartenpunkt und ohne individuellen Pin nach aktuellem Kartenscope/Filter;
- schmalen Verhältnis-Balken mit `role=meter`, `aria-valuenow` und tatsächlichem Nenner;
- ausklappbaren Bereich **„Quellen & Bilder“** mit zugeordneten Quellenfotos, HTTPS-Webbelegen und individuellen V22-Ortsguides;
- direkt anklickbare Aktionen **„Fotos prüfen“** und **„Punkte prüfen“**.

Die Buttons wechseln in **Daten & Fristen**, wählen `Fehlt: Foto` bzw. `Fehlt: Kartenort`, setzen – soweit verfügbar – die aktuelle Stadt oder bei Gesamtroute die Gesamtansicht und aktualisieren die Zahl der sichtbaren Treffer. Sie verändern keine Datenbank- oder Budgetwerte.

Die kleine `map-selected-place`-Ortsvorschau zeigt zusätzlich quellenbezogene Kennzeichen wie `Eigener Ortsguide`, `Webquelle hinterlegt`, `Foto mit Herkunft` oder `Kein individueller Pin`. Bei noch nicht belegten Quellen wird ausdrücklich `Quellenprüfung offen` angezeigt.

**Methodische Einschränkung:** Ein vorhandener Pin ist nicht zwingend der Eingang; ein HTTPS-Link beweist nicht, dass eine Quelle die Öffnungszeiten bzw. 2027-Tarife bestätigt; eine Bildreferenz garantiert weder heutigen Host-Abruf noch das gewählte Zimmer. Entsprechend steht die Warnung direkt im HUD.

### 3. Reduzierte Mikroanimationen und echte Bewegungssteuerung

- Karten-HUD: kurzes Einblenden, nicht unendlich blinkend.
- Ausgewählte Karten-/Ortsvorschau: leichte `translateY`-Rückmeldung und Einblendung beim Wechsel.
- Fokussierter Kartenmarker: einmaliger sanfter Glanz statt dauerhaftem Pulsieren.
- Tagesleisten, Kartenstände und aktive Stopps: moderate CSS-Übergänge.
- Nur vom Benutzer gewählte Map-Pins dürfen eine kurze, ca. **240 ms** lange Leaflet-Kamerafahrt auslösen. Automatisches Fit, Routenwechsel und Initialisierung bleiben **ohne** Kameraanimation.
- **„Darstellung & Kartengröße“ → „Sanfte Animationen“ / „Animationen aus“** ist per Maus/Tastatur umschaltbar und speichert `reiseplan-map-motion` lokal. `document.documentElement.dataset.motion` steuert die CSS-Unterdrückung.
- Bei Betriebssystem-Einstellung `prefers-reduced-motion: reduce` werden die neuen Animationen ebenso deaktiviert – unabhängig vom manuellen Schalter.
- Vorhandene nur bei **wirklich berechneten** Routen zugelassene `route-studio-map-flow`-Animation respektiert nun auch `mapMotion=off`. Schematische Routen bleiben grafisch als solche gekennzeichnet.

Die Interaktionen sind überwiegend CSS-basiert. Es gibt keine dauerhaft laufenden JavaScript-Animationstimer, keine fiktiven Bewegungsdaten, keine neue Tracking-Bibliothek und keine Notwendigkeit für eine externe Fontdatei.

### 4. Eine Datenquelle statt erfundener KPI-Karten

`hudEvidence(rows,state,sources)` zählt nachvollziehbar aus den aktuellen Katalog-/Reisevariante-Daten:
- eindeutige aktive IDs (entfernte und als `duplicateOf` markierte Einträge ausgenommen);
- ausgewählte Bilder nur mit HTTPS-URL, Bildquellenlink und Urhebertext bzw. explizit lizenzierter kuratierter Commons-Bildregel;
- echte verknüpfte Quellenbelege oder bestehende V22-Einzelguides;
- vorhandene numerisch plausible Koordinaten, ohne diese automatisch zu „präzisen Eingängen“ zu befördern.

Das HUD liest die Daten der bestehenden 57 V19-Forschungsprofile, des V20-Quellen-/Preisarchivs, der kuratierten Galerie und des aktuellen lokalen Bearbeitungszustands indirekt über den bereits integrierten Katalog. Es lädt keine zusätzlichen 2027-Tarife, bucht nichts, rechnet keine hypothetischen CHF-Kurse um und manipuliert keine historischen Budgetannahmen.

### 5. Bedienung und Responsive-Qualität

Die Map-Badges sind auf Desktop max. 320 px breit und auf schmalen Displays auf rund 208 px begrenzt, damit sie die Karte und die Zoomsteuerung nicht blockieren. Die Buttons sind echte `button`-Elemente mit beschreibenden Beschriftungen; das Quellenfach verwendet ein natives `details/summary`, der Anteil mit Kartenpunkt ein ARIA-Meter.

Der Tages-HUD ersetzt die bisher redundante Statistikzeile, statt eine weitere Reihe bunter KPI-Kacheln zu erzeugen. Er passt sich bei 950 px und 650 px über wenige Layoutänderungen an. Die Kopfzeile bleibt auf kleinen Endgeräten unverstellt.

`resetCoverageFilters` klappt nach Rücksetzen automatisch zuvor über Filter geöffnete Städte-Abschnitte zu. So verhalten sich die aufklappbaren Qualitätslisten nach HUD-Navigation wieder wie im ursprünglichen Zustand.

## Technische Änderungen

| Datei | Umsetzung |
| --- | --- |
| `public/travel-hud.mjs` | `hudEvidence`, `hudSnapshot`, `renderHeaderHud`, `renderDayHud`, `renderMapHud`, `mapSelectionEvidence` |
| `public/views.mjs` | Alle HUD-Komponenten in reale Kopfzeile, Tagesplan, Karte und Karten-Selektion integriert |
| `public/app.mjs` | `hud-audit`-Navigation mit echtem Datenfilter; `map-motion`-Schalter samt LocalStorage und Motion-Dataset |
| `public/map.mjs` | User-Fokus per 240-ms-Pan, reduzierte Bewegung und Systempräferenz |
| `public/design-round2.css` | Hochwertige ruhige HUD-Typografie, adaptive Karten-Overlaygestaltung, leichte 1×-Animationen und Accessibility-Regeln |
| `public/coverage-filter.mjs` | Rücksetzen klappt durch Filter geöffnete Städtegruppen wieder zu |
| `test/travel-hud.test.mjs` | Quellenehrlichkeit, vier getrennte Reisevarianten, Datums-/Zeitinterpretation, ID- und HTML-Validierung |
| `test/portable-browser.mjs` | Echte Tages-/Karten-HUDs, Motion-Schalter, Quellenfach und die Karte→fehlende-Fotos-Filteraktion |

## Qualitätssicherung

Die **vollständigen 128 Node-/Regressionstests** haben bestanden. Der anschließende echte Chrome-Browsertest auf GitHub Actions **43594606947** ist ebenfalls mit `success` abgeschlossen.

Die neuen Bilder liegen im Screenshot-Artefakt `reiseplaner-ui-review`:
- `16-hud-motion-controls-desktop.png`
- `17-map-hud-to-evidence-workqueue.png`

Weiterhin inklusive Desktop-Karte, Tagesplan, Ortsinspektor, Vergleichsansicht, gefilterten Datenfeldern und Smartphone-Ansicht.

## Noch bewusst nicht behauptete Vollständigkeit

Die vorhandenen 828 variantenspezifischen echten Katalogeinträge sind weiterhin nicht vollständig mit individuellen Fotos, validierten Karten-Eingängen, vertraglich gültigen Unterkunftszimmern oder buchbaren September-2027-Zugverbindungen belegt. Die HUD-Erweiterung macht diese vorhandenen Lücken schneller auffindbar, schließt sie aber nicht durch falsche Daten.

**Start lokal:** Im aktuellen Entwicklungsbranch `outputs/Reiseplaner/Start.cmd` mit Node.js 24 öffnen, dann `http://127.0.0.1:4173` aufrufen. Karten- und Tagesansicht öffnen; im Karten-HUD „Quellen & Bilder“, „Fotos prüfen“ und „Punkte prüfen“ verwenden; Animationen unter „Darstellung & Kartengröße“ anpassen. Änderungen bleiben im PR #5 und wurden nicht deployed.
