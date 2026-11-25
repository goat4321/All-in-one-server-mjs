# Reiseplaner — größere Entwicklungsphasen V126–V150

Arbeitsumfang pro Phase: zusammenhängende Analyse, Implementierung, Tests und Korrekturen; keine feste Laufzeit. Versionsbereiche sind Meilensteine, keine Garantie auf Abnahme.

| Phase | Schwerpunkt | Abnahmekriterien |
|---|---|---|
| V126–128 | Tagesreisen | Ein gemeinsamer Zeitregler; belegte Geometrie; keine erfundenen Wege; GPX-Profile mit Quellenstatus; Desktop/Mobiltests. |
| V129–131 | Apple-inspiriertes Design | Bestehende HIG-Referenzen prüfen; klare Hierarchie; gemeinsame Komponenten; Light/Dark; reduzierte Bewegung; Browserabnahme. |
| V132–134 | Karten | Markerbudget; Filter; synchronisierte Auswahl; keine erfundenen Koordinaten; Karten-Lebenszyklus. |
| V135–137 | Planung | Konflikte; alternative Aktivitäten; Kosten und Zeiten; keine stillen Datenänderungen. |
| V138–140 | Fotos | Motivbezug, Urheberangaben, begrenztes Laden, Fehlerzustände, Bildnavigation. |
| V141–143 | Mobile | 390px, Tablet, Querformat, Tastatur, Touch, Safe Areas; keine Überläufe. |
| V144–146 | Performance | DOM, Rendering, Netzwerk, Speicher, Regressionen; Messungen statt geschätzter Verbesserungen. |
| V147–150 | Release | CI grün, visuelle Abnahme, Datenvalidierung, dokumentierte Grenzen, kein Deployment ohne expliziten Auftrag. |

## Vorgehen
1. Aktuellen Branch und CI lesen; parallele Änderungen nicht überschreiben.
2. Kleine zusammengehörige Änderungen mit bestehender Architektur implementieren.
3. Tests ergänzen; Fehler beheben; tatsächliche Ausführung separat ausweisen.
4. Änderungen mit atomarem Commit und geprüftem Branch-Head speichern.
5. Phase erst nach bestätigter Abnahme als abgeschlossen bezeichnen.

Designreferenzen: goat4321/apple-design-skill, insbesondere accessibility.md, layout.md, typography.md, color.md, motion.md, dark-mode.md, buttons.md und materials.md. Web-Anpassung, keine Behauptung nativer Apple-HIG-Konformität.

## Umsetzungsstand
- V126–128: Implementierung mit seekbarer Tagesroute, berechneten Fußwegen und GPX-Profilen; CI auf Basis a588637 bestätigt.
- V129–131: gemeinsame Reiseoberflächen, getrennte Planungs-/Erlebnisaktionen, robuste Kapitelnavigation, größere Tageskarten und reduzierte Bewegung. Neue Abnahme ausstehend.
