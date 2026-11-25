# V141–V150: erste Stabilisierung und Prüfgrundlage

Ausgang: 1436cae877a44196ab9d83ff4d2afad0354e81c3. Bestehender Entwicklungsbranch, kein Merge/Deployment.
Die vollständige Release-Abnahme ist ausdrücklich offen. Diese Änderung ist keine Bestätigung von V150.

| Version | Änderung / Status |
| --- | --- |
| V141 | Kleine Dialoge und lange Inhalte: CSS-Grenzen, Umbruch, Scrollbereiche. Visuelle Abnahme offen. |
| V142 | 16px Formularschrift auf Smartphones und 44px Dialogaktionen für grobe Zeiger. Geräteabnahme offen. |
| V143 | Dynamische Viewporthöhe mit Fallback, Querformat-Dialoge. Tastatur auf realen Geräten offen. |
| V144 | Gzip für textbasierte statische Ressourcen; HTTP-Test für Bytevergleich und unveränderten Inhalt. |
| V145 | Schwache ETags und 304 für unveränderte statische Ressourcen, HEAD-Test. Kein API-Cache. |
| V146 | Parallele Geocoding-Abfragen prüfen den Cache erneut; Metadaten gehören zur aktuellen Anfrage. Regressionstest. |
| V147 | Erweiterte Browser-Messmatrix für 10 Breiten × 7 bisherige Audit-Seiten; Findings werden protokolliert, noch kein neuer Release-Gate. |
| V148 | Nicht-Objekt-JSON wird als 400 behandelt, ungültige Geokoordinaten werden verworfen. |
| V149 | Neuere gezielte Modelltests in portable Suite aufgenommen: test/day-inspector-v135.test.mjs, test/day-route-player-v126.test.mjs, test/journey-design-v129.test.mjs, test/journey-design-v130.test.mjs, test/map-density-v132.test.mjs, test/photo-integration-v140.test.mjs, test/route-explorer-v125.test.mjs. |
| V150 | Offen: vollständige Funktionsabnahme, Performancevergleich, Fehlerkorrektur sämtlicher Matrixbefunde, Geräte-/Browserprüfung. |

Keine lokal ausgeführten Tests: Git-Klon in der Chat-Umgebung scheiterte an DNS, Node 22 statt 24. CI-Ausführung separat anhand des neuen Commits prüfen. Der Ausgangs-CI-Lauf 45595344446 war erfolgreich. Quellgrößen (keine Netzwerk- oder Bundle-Messung): öffentliche CSS-Dateien 743157 Bytes, öffentliche MJS-Dateien 1195495 Bytes, Transitdateien 22164124 Bytes. Keine erfundenen Performancewerte. Die Matrix misst Headless-Chrome mit Seed-Daten und offlineMap, keine Realgeräte. Die zusätzlichen Tests sind vor CI nicht als bestanden zu werten.
