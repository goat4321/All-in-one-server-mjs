# Phase 30 – einfacher Reiseplaner & Routenanimation

Stand: 14.11.2026. Fortsetzung auf `feature/v7-data-day-accommodation-rail`, PR #5 (Draft). Noch nicht in main, kein Deployment.

## Benutzerproblem
Die Karte hatte eine doppelte Auswahl für Tag/Stadt/Reise, zwei Ebenen Routenfilter, umfangreiche Quellen- und Standortblöcke, viele kleine Ortsaktionen, und ein zusätzliches Route Studio unterhalb der Galerie. Für einfache Aufgaben (finden/merken/in Tagesplan) war der Hauptweg versteckt.

## Umsetzung
- **Standardmäßig Einfach-Modus** nur für die Karte. Gespeichert pro Browser in `reiseplan-map-simple`. Kein Datenverlust beim Wechsel. Funktion **Alle Funktionen** schaltet die vollständigen Explorer-Filter, operator notes, Routentools, technisches HUD und Route Studio wieder frei.
- **Drei große Aktionen** im Reise-Header: Orte finden (setzt auf Stadtmodus und fokussiert die tatsächliche Suche), Mein Tag (zeigt genau eingeplante Stopps), Route zeigen (schaltet auf die gesamte tatsächliche Städte-Reihenfolge, schematischer Verlauf).
- **Klarere Ortskarten:** `Zum Tag hinzufügen` und `Merken` stehen primär und groß; `Karte` bzw. `Details` bleiben vorhanden. Quellen und weitere Aktionen sind weiterhin in den Details bzw. den aufklappbaren Aktionen statt dauerhaft in jeder Karte.
- In einfach werden redundante Modusfilter, technische Nachweise und erweiterte Settings ausgeblendet. Die Kategorien bleiben als horizontale Chip-Reihe, die Tagesliste samt Warnungen bleibt verfügbar; die Suche ist erreichbar.
- **Visuell nachvollziehbare Routen**: Goldene, langsam entlang der violetten gestrichelten Städtereihenfolge wandernde Lichtsegmente nur bei Gesamtroute. Echte berechnete Fußwege verwenden weiterhin ihre eigene grüne, fließende Darstellung. Keine erfundene Schienenführung, Fahrtzeit oder Angebotsbestätigung.
- Native Bewegungsreduktion über `prefers-reduced-motion` und vorhandenen `map-motion=off`-Schalter. Subtiles einmaliges Einblenden der ersten Ortskarten.

## Technische Änderungen
`public/views.mjs`, `public/reference-map-scene.mjs`, `public/explorer-ui.mjs`, `public/map.mjs`, `public/app.mjs`, `public/index.html`, neu `public/simple-journey.css`. Regressionen `test/reference-map-scene.test.mjs` und `test/portable-browser.mjs`.

## Prüfstatus
Die GitHub-Actions-Läufe nach Phase 29 wurden bereits vor dem ersten Testschritt mit Runner-Startfehlern beendet. Dies gilt nach dem ersten Phase-30-Commit ebenfalls für Workflow #43619337042, Versuch 1–2. Die Browser-Screenshotaufnahme für diese Revision ist deshalb **nicht bestätigt**. Vorheriger erfolgreicher Baseline-Browserlauf: #43616200064 (141/141 Tests, vor Phase 30). Behauptet wird nur die tatsächlich in GitHub geschriebene Implementierung, keine pixelgenaue Abnahme.

## Verbleibende Punkte
Die Hauptkarte ist im Einfach-Modus weiterhin von den konkreten Plan- und Bilddaten abhängig. Bei einem noch leeren Tag fehlen echte Stopps, die nicht erfunden werden. Die vorgegebenen Bilder können in CI teilweise nicht geladen werden, daher bleiben Ortskarten teilweise ohne Fotos. Der nächste vollständige CI-Lauf muss Layout/Touch-Ziele/Suche und Routenanimation an Desktop 1440×900 sowie Mobil 390×844 prüfen, bevor eine visuelle Annäherung behauptet wird.

## Iteration 3 – echte Redundanz entfernt
Nach dem ersten Umbau waren oben drei Schaltflächen und **darunter immer noch vier Floating-Modi** sowie eine zweite globale Suche sichtbar. Das widerspricht der simplen Bedienung. Darum sind in der einfachen Ansicht die duplizierten Floating-Modi, die globale Suche und unwichtige Karten-/Topbar-Icons jetzt vollständig ausgeblendet. Die weiterhin sichtbare Ortssuche im linken Bereich bekommt einen 46px-Eingabebereich und die drei Hauptaktionen jeweils mindestens 44px. Die mobile Navigation zeigt explizite Textlabels statt nur drei ungeklärte Icons. Beim Umschalten auf „Alle Funktionen“ erscheinen die vollständigen Kontrollen wieder.

## Iteration 4 – Startseite vereinfacht
Die vier bereits vorhandenen großen Schnellzugriffe waren **unter** dem Reise-Cockpit, den Route-Karten und der Fortschrittsübersicht versteckt. Der HTML-Baustein `overview-start` ist nun **vor** `cockpit-layout` gerückt: Tagesplan, Karte, Unterkünfte und Bahn direkt im ersten Sichtbereich. Vier gut beschriftete Karten (min. 76px Höhe; mobil 2×2, min. 84px) ersetzen kein bestehendes Dashboard und brechen keine Datenfunktionen. Die Reisefakten, die schematische Route und alle Prüfdetails bleiben darunter.
